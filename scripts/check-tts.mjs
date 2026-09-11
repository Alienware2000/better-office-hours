import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const config = { ELEVENLABS_TTS_MODEL: 'eleven_v3_conversational', ELEVENLABS_VOICE_ID: 'test-voice', elevenLabsKey: () => 'test-key' };
const module = { exports: {} };
const js = ts.transpileModule(fs.readFileSync('app/api/agent/tts/route.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInThisContext(`(function(require,module,exports){${js}\n})`)(name => name.endsWith('/elevenlabs') ? config : {normalizeSpokenText: text => text}, module, module.exports);
const originalFetch = globalThis.fetch;
let payload;
globalThis.fetch = async (_url, options) => {payload=JSON.parse(options.body);return new Response(new Blob(['audio']),{headers:{'Content-Type':'audio/mpeg'}})};
try {
  const request = () => new Request('http://localhost/api/agent/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Which quantity changes?',previousText:'Let us look together.'})});
  let response = await module.exports.POST(request());
  assert.equal(response.status,200);
  assert.equal('previous_text' in payload,false,'v3 rejects previous_text; omit it even on later sentences');
  assert.equal(payload.model_id,'eleven_v3_conversational');
  assert.equal(payload.voice_settings.stability,1,'Use robust delivery for a steadier tutor voice');
  config.ELEVENLABS_TTS_MODEL='eleven_flash_v2_5';
  response=await module.exports.POST(request());
  assert.equal(response.status,200);
  assert.equal(payload.previous_text,'Let us look together.','Flash still accepts continuity context');
  console.log('PASS: actual TTS route omits unsupported v3 continuity parameter and preserves it for Flash.');
} finally {globalThis.fetch=originalFetch;}
