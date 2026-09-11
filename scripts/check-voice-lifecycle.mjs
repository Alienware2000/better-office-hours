// Exercise the real voice hook with deferred STT and a simulated microphone.
// No credentials, audio hardware, or model calls are used.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const settle = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };

async function mount() {
  const effects = [], states = [], requests = [], recordings = [];
  const stt = deferred();
  let now = 1000, loud = false, frame, stateIndex = 0;
  const listeners = new Map();
  const track = { enabled: true, stop() {} };
  const react = {
    useRef: value => ({ current: value }),
    useCallback: callback => callback,
    useState(value) {
      const i = stateIndex++;
      states[i] = value;
      return [value, next => { states[i] = typeof next === 'function' ? next(states[i]) : next; }];
    },
    useEffect: effect => effects.push(effect),
  };
  class Recorder {
    static isTypeSupported() { return true; }
    state = 'inactive';
    mimeType = 'audio/webm';
    constructor() { recordings.push(this); }
    start() { this.state = 'recording'; }
    stop() {
      this.state = 'inactive';
      queueMicrotask(() => {
        this.ondataavailable?.({ data: new Blob(['a'.repeat(1500)]) });
        this.onstop?.();
      });
    }
  }
  const noOp = () => {};
  const board = new Proxy({}, { get: (_, key) => key === 'getBoardState' ? () => ({ playing: false }) : noOp });
  const imports = {
    react,
    '@/lib/agent/intent': { detectMode: () => null },
    '@/lib/agent/tags': { parseAgentTurn: () => ({ speech: '' }), takeSpeechChunks: () => ({}) },
    '@/lib/pdf/live-page': { getLivePage: () => null, setLivePage: noOp },
    '@/lib/whiteboard/live-board': { getLiveBoard: () => null },
    '@/lib/whiteboard/geometry': { isDrawCommand: () => true },
    '@/lib/whiteboard/store': board,
    './constants': { pickGreeting: () => 'What are we working on?', CHIPS: [] },
  };
  const globals = {
    Blob, FormData, AbortController, Response, TextDecoder, URL, DOMException,
    structuredClone, queueMicrotask, setTimeout, clearTimeout,
    crypto: { randomUUID: () => 'test-tab' },
    performance: { now: () => now },
    MediaRecorder: Recorder,
    navigator: { mediaDevices: { getUserMedia: async () => ({ getAudioTracks: () => [track], getTracks: () => [track] }) } },
    AudioContext: class {
      state = 'running';
      createMediaStreamSource() { return { connect: noOp }; }
      createAnalyser() { return { fftSize: 2048, getFloatTimeDomainData: data => data.fill(loud && track.enabled ? 0.1 : 0) }; }
      resume() { return Promise.resolve(); }
      close() { return Promise.resolve(); }
    },
    requestAnimationFrame: callback => { frame = callback; return 1; },
    cancelAnimationFrame: noOp,
    document: { hidden: false, addEventListener: (name, cb) => listeners.set(name, cb), removeEventListener: noOp },
    window: { addEventListener: (name, cb) => listeners.set(name, cb), removeEventListener: noOp, setTimeout },
    fetch: async (url, options) => {
      requests.push({ url, ...options });
      if (url.endsWith('/health')) return Response.json({ grok: true, elevenlabs: true });
      if (url.endsWith('/stt')) return stt.promise; // Deliberately ignores abort.
      if (url.endsWith('/llm')) return new Response('data: [DONE]\n\n');
      throw new Error(`Unexpected request: ${url}`);
    },
  };
  const context = vm.createContext(globals);
  function load(file) {
    const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const loaded = { exports: {} };
    vm.runInContext(`(function(require,module,exports){${js}\n})`, context)(name => {
      assert.ok(name in imports, name);
      return imports[name];
    }, loaded, loaded.exports);
    return loaded.exports;
  }
  imports['./speech'] = load('app/(session)/voice/speech.ts');
  const hook = load('app/(session)/voice/useVoiceLoop.ts').useVoiceLoop();
  const cleanups = effects.map(effect => effect());
  await settle();
  hook.interrupt(); // Activate voice without relying on a rendered health update.
  const tick = (volume, elapsed) => { loud = volume; now += elapsed; frame(); };
  async function record() {
    tick(true, 1000);
    tick(false, 900);
    await settle();
    assert.equal(states[0], 'thinking', 'Show processing while STT is pending');
    tick(true, 1000);
    assert.equal(recordings.length, 1, 'Do not record a competing turn during STT');
  }
  return { hook, states, stt, requests, record, listeners,
    cleanup: () => cleanups.forEach(cleanup => cleanup?.()) };
}

for (const action of ['pause', 'resume', 'leave', 'enter', 'remove', 'hide', 'unmount']) {
  const test = await mount();
  await test.record();
  const request = test.requests.find(r => r.url.endsWith('/stt'));
  if (action === 'pause' || action === 'resume') test.hook.interrupt();
  if (action === 'resume') test.hook.interrupt();
  if (action === 'enter') test.hook.enterWorkspace();
  if (action === 'remove') test.hook.putAwayPset();
  if (action === 'leave') test.hook.exitWorkspace();
  if (action === 'hide') test.listeners.get('pagehide')();
  if (action === 'unmount') test.cleanup();
  assert.equal(request.signal.aborted, true, `${action} aborts STT`);
  test.stt.resolve(Response.json({ text: 'Help me with my homework' }));
  await settle();
  assert.equal(test.requests.some(r => r.url.endsWith('/llm')), false, `${action} drops late STT`);
  if (action === 'pause' || action === 'hide') assert.equal(test.states[4], true, 'Stay paused');
  if (action !== 'unmount') test.cleanup();
}
for (const result of ['valid', 'noise', 'failure']) {
  const test = await mount();
  await test.record();
  if (result === 'failure') test.stt.reject(new Error('Network unavailable'));
  else test.stt.resolve(Response.json({ text: result === 'valid' ? 'Help me understand recursion' : '[background noise]' }));
  await settle();
  assert.equal(test.requests.filter(r => r.url.endsWith('/llm')).length, result === 'valid' ? 1 : 0);
  assert.equal(test.states[0], 'listening', `${result} settles back to listening`);
  test.cleanup();
}
console.log('PASS: pending STT state, single recording, late-response isolation on pause/resume/desk changes/hide/unmount, valid speech, noise, and failure recovery.');
