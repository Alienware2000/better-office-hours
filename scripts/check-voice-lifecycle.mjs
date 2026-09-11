// Exercise the real voice hook with deferred STT and a simulated microphone.
// No credentials, audio hardware, or model calls are used.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import ts from 'typescript';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const settle = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); await new Promise(resolve => setImmediate(resolve)); };

async function mount({ llmText = '', manualAudio = false, failTts = false } = {}) {
  const effects = [], states = [], requests = [], recordings = [];
  const stt = deferred();
  const audio = [];
  const marks = [];
  let now = 1000, loud = false, frame, stateIndex = 0;
  const listeners = new Map();
  const track = { enabled: true, stop() {} };
  const react = {
    useRef: value => ({ current: value }),
    useCallback: callback => callback,
    useState(value) {
      const i = stateIndex++;
      states[i] = typeof value === 'function' ? value() : value;
      return [states[i], next => { states[i] = typeof next === 'function' ? next(states[i]) : next; }];
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
  const board = new Proxy({}, { get: (_, key) => key === 'getBoardState' ? () => ({ playing: false }) : key === 'applyDrawCommands' ? commands => marks.push(...commands) : noOp });
  const imports = {
    react,
    '@/lib/agent/intent': { detectMode: () => null },

    '@/lib/pdf/live-page': { getLivePage: () => null, setLivePage: noOp },
    '@/lib/whiteboard/live-board': { getLiveBoard: () => null },
    '@/lib/whiteboard/geometry': { isDrawCommand: () => true },
    '@/lib/whiteboard/store': board,
    './constants': { pickGreeting: () => 'What are we working on?', CHIPS: [] },
  };
  const globals = {
    Blob, FormData, AbortController, Response, TextDecoder, URL, DOMException,
    Audio: class {
      paused = false;
      constructor() { audio.push(this); }
      play() { this.onplaying?.(); if (!manualAudio) queueMicrotask(() => this.onended?.()); return Promise.resolve(); }
      pause() { this.paused = true; }
    },
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
    window: { matchMedia: () => ({ matches: false }), addEventListener: (name, cb) => listeners.set(name, cb), removeEventListener: noOp, setTimeout },
    fetch: async (url, options) => {
      requests.push({ url, ...options });
      if (url.endsWith('/health')) return Response.json({ grok: true, elevenlabs: true });
      if (url.endsWith('/stt')) return stt.promise; // Deliberately ignores abort.
      if (url.endsWith('/llm')) return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: llmText } }] })}\n\ndata: [DONE]\n\n`);
      if (url.endsWith('/tts')) return failTts ? new Response('', { status: 502 }) : new Response(new Blob(['audio']));
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
      if (name in imports) return imports[name];
      return load((name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(path.dirname(file), name)) + '.ts');
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
    for (let i = 0; i < 20; i++) tick(true, 20);
    tick(false, 900);
    assert.equal(states[0], 'listening', 'A short thinking pause does not end the student turn');
    tick(false, 1000);
    await settle();
    assert.equal(states[0], 'thinking', 'Show processing while STT is pending');
    tick(true, 1000);
    assert.equal(recordings.length, 1, 'Do not record a competing turn during STT');
  }
  return { hook, states, stt, requests, record, listeners, tick, audio, marks,
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

// Finish-speaking taps submit useful input; idle taps simply pause.
{
  const test = await mount();
  test.tick(true, 1000);
  for (let i = 0; i < 20; i++) test.tick(true, 20);
  test.hook.interrupt();
  await settle();
  assert.equal(test.states[4], false, 'Submitting speech keeps the conversation active');
  assert.equal(test.requests.filter(r => r.url.endsWith('/stt')).length, 1);
  test.stt.resolve(Response.json({ text: 'Help me understand units' }));
  await settle();
  assert.equal(test.requests.filter(r => r.url.endsWith('/llm')).length, 1);
  test.hook.interrupt();
  assert.equal(test.states[4], true, 'Idle tap pauses without creating a turn');
  test.cleanup();
}
const explanation = 'First, watch the arrow. Its value is 9.8 m/s². Notice the direction. What do you predict?';
{
  const test = await mount({ llmText: explanation });
  await test.hook.sendUtterance('Explain this idea');
  await settle();
  const sent = test.requests.filter(r => r.url.endsWith('/tts')).map(r => JSON.parse(r.body).text).join(' ');
  assert.equal(sent, explanation, 'Every caption sentence, including the fourth question, is spoken');
  await test.hook.sendEvent({ kind: 'pset_ready' });
  assert.equal(test.requests.filter(r => r.url.endsWith('/llm')).length, 1, 'Uploading after a question does not steal the floor');
  await test.hook.sendEvent({ kind: 'student_mark' });
  assert.equal(test.requests.filter(r => r.url.endsWith('/llm')).length, 1, 'Ink is context, not an unsolicited teaching turn');
  test.cleanup();
}
{
  const test = await mount({ llmText: explanation, manualAudio: true });
  const speaking = test.hook.sendUtterance('Explain this idea');
  await settle();
  assert.ok(test.audio.length, 'Audio started');
  test.tick(true, 1000);
  for (let i = 0; i < 12; i++) test.tick(true, 20);
  await settle();
  assert.equal(test.audio[0].paused, true, 'Sustained student speech stops audio');
  assert.equal(test.audio.length, 1, 'Cancelled queued sentences never play');
  assert.equal(test.states[0], 'listening', 'The student now has the floor');
  await speaking;
  test.cleanup();
}
console.log('PASS: patient silence, tap-to-submit, full spoken captions, quiet uploads/ink, and sustained-speech barge-in.');

{
  const test = await mount({ llmText: explanation, manualAudio: true });
  const speaking = test.hook.sendUtterance('Explain this idea');
  await settle();
  test.tick(true, 1000);
  test.tick(false, 160);
  assert.equal(test.audio[0].paused, false, 'A brief noise burst does not interrupt');
  test.listeners.get('boh:student-writing')();
  await settle();
  assert.equal(test.audio[0].paused, true, 'Taking the board to write gives the student the floor');
  await speaking;
  const nextTurn = test.hook.sendUtterance('Actually change the topic');
  await settle();
  const history = JSON.parse(test.requests.filter(r => r.url.endsWith('/llm')).at(-1).body).messages;
  assert.ok(!history.some(m => m.role === 'assistant' && m.content.includes('What do you predict?')), 'Unplayed sentences do not become conversation history');
  test.cleanup();
  await nextTurn;
}
{
  const test = await mount({ llmText: 'Here is the relation. [DRAW {"op":"text","id":"equation","at":{"x":0.5,"y":0.4},"text":"F = ma"}] What changes?', manualAudio: true });
  const speaking = test.hook.sendUtterance('Show me a general equation');
  await settle();
  assert.equal(test.marks.length, 0, 'The diagram does not get ahead of its introduction');
  test.audio[0].onended();
  await settle();
  assert.equal(test.marks[0].text, 'F = ma');
  assert.equal(test.audio.length, 2, 'The question follows the visual');
  test.audio[1].onended();
  await speaking;
  test.cleanup();
}
{
  const test = await mount({ llmText: explanation, failTts: true });
  await test.hook.sendUtterance('Explain this idea');
  assert.equal(test.states[0], 'listening', 'Audio failure does not strand the microphone');
  assert.ok(test.states[3], 'Audio failure is visible');
  assert.equal(test.audio.length, 0);
  test.cleanup();
}
console.log('PASS: brief-noise rejection, writing interruption, spoken-history integrity, visual/audio ordering, and TTS failure recovery.');
