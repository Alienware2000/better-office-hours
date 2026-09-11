import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const config = { ELEVENLABS_TTS_MODEL: 'eleven_v3_conversational', ELEVENLABS_VOICE_ID: 'test-voice', elevenLabsKey: () => 'test-private-key' };
function load(file) {
  const loaded = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`)(name => {
    if (name.endsWith('/elevenlabs')) return config;
    if (name.startsWith('@/lib/agent/')) return load(name.replace('@/', '') + '.ts');
    throw new Error(`Unexpected import ${name}`);
  }, loaded, loaded.exports);
  return loaded.exports;
}
const { POST } = load('app/api/agent/tts/route.ts');
const originalFetch = globalThis.fetch;
const originalError = console.error;
const logs = [];
const calls = [];
let upstream = () => new Response('audio', { headers: { 'Content-Type': 'audio/mpeg' } });
globalThis.fetch = async (url, options) => {
  calls.push({ url, ...options, payload: JSON.parse(options.body) });
  return upstream();
};
console.error = (...args) => logs.push(args.join(' '));
const input = { text: 'Which quantity changes?', previousText: 'Let us look together.' };
const request = (body = input, signal) => new Request('http://localhost/api/agent/tts', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal,
});

try {
  let response = await POST(request());
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'audio');
  assert.equal(response.headers.get('content-type'), 'audio/mpeg');
  assert.equal(response.headers.get('x-voice-model'), 'eleven_v3_conversational');
  assert.equal('previous_text' in calls.at(-1).payload, false, 'v3 rejects continuity context');
  assert.equal(calls.at(-1).payload.voice_settings.stability, 1);
  assert.equal(calls.at(-1).headers['xi-api-key'], config.elevenLabsKey());

  config.ELEVENLABS_TTS_MODEL = 'eleven_flash_v2_5';
  response = await POST(request());
  assert.equal(response.status, 200);
  assert.equal(calls.at(-1).payload.previous_text, input.previousText, 'Flash preserves continuity context');
  config.ELEVENLABS_TTS_MODEL = 'eleven_v3_conversational';

  // Reproduce the actual provider shape plus legacy status-only failures.
  const privateDetail = 'provider-private-detail';
  const cases = [
    [401, { type: 'authentication_error', code: 'unauthorized', status: 'invalid_api_key', message: privateDetail }, 503, 'invalid_api_key', false, /rejected the API key/],
    [401, { status: 'invalid_api_key' }, 503, 'invalid_api_key', false],
    [401, { status: 'quota_exceeded', code: 'unauthorized' }, 429, 'quota_exceeded', false],
    [401, { status: 'missing_permissions', code: 'unauthorized' }, 503, 'voice_access_denied', false],
    [403, {}, 503, 'voice_access_denied', false],
    [404, { status: 'voice_not_found' }, 503, 'voice_configuration_error', false],
    [429, { status: 'too_many_concurrent_requests' }, 503, 'voice_busy', true],
    [400, { code: 'unknown', message: privateDetail }, 502, 'voice_provider_error', false],
    [500, null, 502, 'voice_provider_error', true],
  ];
  for (const [status, detail, expectedStatus, code, retryable, message] of cases) {
    upstream = () => detail === null ? new Response('not JSON', { status }) : Response.json({ detail }, { status });
    const before = calls.length;
    response = await POST(request());
    const error = await response.json();
    assert.equal(response.status, expectedStatus);
    assert.equal(error.code, code);
    assert.equal(error.retryable, retryable);
    assert.ok(!JSON.stringify(error).includes(privateDetail), 'Never reflect arbitrary provider messages');
    if (message) assert.match(error.error, message);
    assert.equal(calls.length, before + 1, 'Failure must not retry synthesis or change models');
    assert.equal(calls.at(-1).payload.model_id, 'eleven_v3_conversational');
  }

  const before = calls.length;
  for (const body of [null, {}, { text: 123 }, { text: ' ' }]) {
    assert.equal((await POST(request(body))).status, 400);
  }
  assert.equal((await POST(new Request('http://localhost/api/agent/tts', { method: 'POST', body: '{' }))).status, 400);
  assert.equal(calls.length, before, 'Invalid input never reaches the provider');
  const keyGetter = config.elevenLabsKey;
  config.elevenLabsKey = () => { throw new Error('missing key'); };
  response = await POST(request());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'voice_not_configured');
  assert.equal(calls.length, before);
  config.elevenLabsKey = keyGetter;

  upstream = () => { throw new TypeError('network-private-detail'); };
  response = await POST(request());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'voice_connection_failed');
  const controller = new AbortController();
  controller.abort();
  response = await POST(request(input, controller.signal));
  assert.equal(response.status, 499, 'Cancellation stays separate from provider failure');

  const diagnostics = logs.join('\n');
  assert.match(diagnostics, /"status":401,"code":"invalid_api_key"/);
  for (const value of [keyGetter(), privateDetail, input.text, 'network-private-detail']) {
    assert.ok(!diagnostics.includes(value), 'Logs contain categories only');
  }
  console.log('PASS: TTS audio forwarding and model settings; precise, private auth/quota/permission/busy/network errors; invalid input and cancellation.');
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalError;
}
