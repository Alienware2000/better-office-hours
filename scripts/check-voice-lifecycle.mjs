import { createRequire } from 'node:module';
const external = createRequire(import.meta.url);
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

async function mount({ llmText = '', llmResponse = null, manualAudio = false, failTts = false, livePage = null, repairResponse = null, deferredTts = null, deferPlaying = false, autoStart = true, realIntent = false, startup = {} } = {}) {
  const effects = [], states = [], requests = [], recordings = [];
  const inputAudioState = { value: 'running' };
  const stt = deferred();
  const sttNext = deferred();
  let sttCount = 0;
  const audio = [];
  const marks = [];
  const timers = new Map();
  let now = 1000, loud = false, frame, stateIndex = 0;
  const listeners = new Map();
  let probabilityCallback = () => {};
  let mediaRequests = 0;
  let initializing = true;
  let closedContexts = 0, destroyedDetectors = 0;
  const track = { enabled: true, muted: false, readyState: 'live', stop() { this.readyState = 'ended'; } };
  const inputStream = { getAudioTracks: () => [track], getTracks: () => [track] };
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
  const noOp = () => {};
  const board = new Proxy({}, { get: (_, key) => key === 'getBoardState' ? () => ({ playing: false, groups: [] }) : key === 'applyDrawCommands' ? commands => marks.push(...commands) : noOp });
  const imports = {
    react,
    './speech-detector': {
      createSpeechDetector: async (_stream, _context, callback) => {
        probabilityCallback = callback;
        if (startup.detector) await startup.detector;
        if (startup.ended === 'detector') track.stop();
        return { destroy: async () => { destroyedDetectors++; } };
      },
      isSpeechFrame: (probability, recording, playback) => probability >= (playback ? .85 : recording ? .35 : .65),
    },
    '@/lib/agent/intent': { detectMode: () => null },

    '@/lib/pdf/live-page': { getLivePage: () => livePage, setLivePage: noOp },
    '@/lib/whiteboard/live-board': { getLiveBoard: () => null, boardContextForTurn: () => null },
    '@/lib/whiteboard/geometry': { isDrawCommand: () => true },
    '@/lib/whiteboard/store': board,
    './constants': { pickGreeting: () => 'What are we working on?', CHIPS: [] },
  };
  const globals = {
    process: { env: { NODE_ENV: 'test' } },
    Blob, FormData, AbortController, Response, TextDecoder, URL, DOMException,
    Audio: class {
      paused = false;
      constructor() { audio.push(this); }
      play() { if (initializing || !deferPlaying) this.onplaying?.(); if (initializing || !manualAudio) queueMicrotask(() => this.onended?.()); return Promise.resolve(); }
      pause() { this.paused = true; }
    },
    structuredClone, queueMicrotask,
    setTimeout: (callback, milliseconds) => {
      const timer = setTimeout(() => { timers.delete(timer); callback(); }, milliseconds);
      timers.set(timer, { callback, milliseconds });
      return timer;
    },
    clearTimeout: timer => { timers.delete(timer); clearTimeout(timer); },
    crypto: { randomUUID: () => 'test-tab' },
    performance: { now: () => now },
    navigator: { mediaDevices: { getUserMedia: async () => {
      mediaRequests++;
      track.readyState = 'live';
      if (startup.media) await startup.media;
      if (startup.ended === 'permission') track.stop();
      return inputStream;
    } } },
    AudioContext: class {
      get state() { return inputAudioState.value; }
      createMediaStreamSource() { return { connect: noOp }; }
      createAnalyser() { return { fftSize: 2048, getFloatTimeDomainData: data => data.fill(loud && track.enabled ? 0.1 : 0) }; }
      resume() { return startup.resume ?? Promise.resolve(); }
      close() { closedContexts++; return Promise.resolve(); }
    },
    requestAnimationFrame: callback => { frame = callback; return 1; },
    cancelAnimationFrame: noOp,
    document: { hidden: false, addEventListener: (name, cb) => listeners.set(name, cb), removeEventListener: noOp },
    window: { matchMedia: () => ({ matches: false }), addEventListener: (name, cb) => listeners.set(name, cb), removeEventListener: noOp, setTimeout },
    fetch: async (url, options) => {
      requests.push({ url, ...options });
      if (url.endsWith('/health')) return startup.health ?? Response.json({ grok: true, elevenlabs: true });
      if (url.endsWith('/stt')) return (sttCount++ ? sttNext : stt).promise; // Deliberately ignores abort.
      if (url.endsWith('/llm') && JSON.parse(options.body).visualRepair && repairResponse) return repairResponse;
      if (url.endsWith('/llm') && llmResponse) return typeof llmResponse === 'function' ? llmResponse(JSON.parse(options.body)) : llmResponse;
      if (url.endsWith('/llm')) return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: typeof llmText === 'function' ? llmText(JSON.parse(options.body)) : llmText } }] })}\n\ndata: [DONE]\n\n`);
      if (url.endsWith('/tts') && !initializing && deferredTts) return deferredTts;
      if (url.endsWith('/tts')) return !initializing && failTts ? new Response('', { status: 502 }) : new Response(new Blob(['audio']));
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
      if (name.startsWith('@mathjax/')) return external(name);
      return load((name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(path.dirname(file), name)) + '.ts');
    }, loaded, loaded.exports);
    return loaded.exports;
  }
  if (realIntent) imports['@/lib/agent/intent'] = load('lib/agent/intent.ts');
  imports['./speech'] = load('app/(session)/voice/speech.ts');
  const { SpeechAudioCapture } = load('app/(session)/voice/audio-capture.ts');
  imports['./audio-capture'] = { SpeechAudioCapture: class extends SpeechAudioCapture {
    start() { this.current = {state:'recording'}; recordings.push(this.current); super.start(); }
    discard() { if(this.current) this.current.state='inactive'; super.discard(); }
  } };
  imports['@/lib/whiteboard/geometry'] = load('lib/whiteboard/geometry.ts');
  const hook = load('app/(session)/voice/useVoiceLoop.ts').useVoiceLoop();
  const cleanups = effects.map(effect => effect());
  await settle();
  assert.equal(mediaRequests, 0, "Mounting never opens the microphone");
  if (autoStart) {
    hook.interrupt(); // Explicit user activation begins acquisition.
    await settle();
    assert.equal(states[9], true, 'Explicit activation makes the input ready');
    assert.equal(states[10], false, 'Startup settles before conversation');
    assert.equal(requests.filter(r => r.url.endsWith('/tts')).length, 1, 'Start speaks the initial greeting once');
    requests.length = 0;
    audio.length = 0;
    initializing = false;
  }
  const tick = (volume, elapsed, detectorFrame = true) => { loud = volume; now += elapsed; if (detectorFrame) probabilityCallback(typeof volume === 'number' ? volume : volume ? .98 : .01, new Float32Array(Math.max(1,Math.round(elapsed*16))).fill(volume ? .25 : 0)); frame(); };
  async function record() {
    tick(true, 1000);
    for (let i = 0; i < 20; i++) tick(true, 20);
    tick(false, 900);
    assert.equal(states[0], 'listening', 'A short thinking pause does not end the student turn');
    tick(false, 1000);
    await settle();
    assert.equal(states[0], 'thinking', 'Show processing while STT is pending');
    assert.equal(states[13], 'transcribing', 'Pending STT identifies the actual stage');
    assert.equal(recordings.length, 1, 'One recording before the first transcription');
  }
  return { hook, states, stt, sttNext, recordings, requests, record, listeners, tick, audio, marks,
    track,
    resourceCounts: () => ({ mediaRequests, closedContexts, destroyedDetectors }),
    expireStartup: milliseconds => {
      const pending = [...timers].find(([, entry]) => entry.milliseconds === milliseconds);
      assert.ok(pending, `A ${milliseconds}ms startup deadline is pending`);
      const [timer, entry] = pending;
      clearTimeout(timer); timers.delete(timer); entry.callback();
    },
    expireTranscription: () => {
      const pending = [...timers].find(([, entry]) => entry.milliseconds === 12000);
      assert.ok(pending, 'An STT deadline is pending');
      const [timer, entry] = pending;
      clearTimeout(timer); timers.delete(timer); entry.callback();
    },
    setAudioState: value => { inputAudioState.value = value; },
    suspendAudio: () => { inputAudioState.value = 'suspended'; },
    restartEffects: () => { cleanups.forEach(cleanup => cleanup?.()); cleanups.splice(0, cleanups.length, ...effects.map(effect => effect())); },
    cleanup: () => cleanups.forEach(cleanup => cleanup?.()) };
}

{
  const test = await mount({ llmText: request => request.deep ? '[TEACH move=consolidate visual=none] Zero, from rest. Go ahead with your substitution.' : '[THINK]' });
  await test.hook.sendUtterance('Zero');
  const calls = test.requests.filter(request => request.url.endsWith('/llm'));
  assert.equal(calls.length, 2, 'A silent handoff still starts exactly one reasoning pass');
  assert.equal(JSON.parse(calls[1].body).deep, true);
  assert.ok(JSON.parse(calls[1].body).messages.every(message => !message.content.includes('THINK')), 'Internal routing never enters spoken history');
  const speech = test.requests.filter(request => request.url.endsWith('/tts')).map(request => JSON.parse(request.body).text).join(' ');
  assert.equal(speech, 'Zero, from rest. Go ahead with your substitution.', 'Only the substantive response is synthesized');
  assert.equal(test.states[0], 'listening');
  test.cleanup();
}

// Startup uses simulated permissions/devices, including providers that ignore abort.
{
  const permission = deferred();
  const test = await mount({ autoStart: false, startup: { media: permission.promise } });
  assert.equal(test.states[10], false, 'An unopened page is idle, not preparing');
  test.hook.interrupt();
  test.hook.interrupt();
  assert.equal(test.resourceCounts().mediaRequests, 1, 'Repeated starts share one permission request');
  assert.equal(test.states[10], true);
  assert.equal(test.requests.some(r => r.url.endsWith('/tts')), false, 'Greeting waits for usable input');
  permission.resolve();
  await settle();
  assert.equal(test.states[9], true);
  assert.equal(test.states[10], false);
  assert.equal(test.requests.filter(r => r.url.endsWith('/tts')).length, 1);
  test.track.stop();
  test.tick(false, 100);
  await settle();
  assert.equal(test.states[9], false);
  test.hook.retryMicrophone();
  await settle();
  assert.equal(test.states[9], true, 'Retry acquires usable input');
  assert.equal(test.states[4], false, 'Retry resumes the conversation');
  assert.equal(test.resourceCounts().mediaRequests, 2);
  assert.equal(test.requests.filter(r => r.url.endsWith('/tts')).length, 1, 'Retry does not repeat the greeting');
  await test.record();
  test.stt.resolve(Response.json({ text: 'Can you hear me now?' }));
  await settle();
  assert.equal(test.requests.filter(r => r.url.endsWith('/llm')).length, 1, 'Replacement input handles the next utterance');
  test.cleanup();
}
for (const [phase, milliseconds, message] of [
  ['media', 15000, /permission is still pending/],
  ['health', 8000, /configuration could not load/],
  ['resume', 5000, /audio could not start/],
  ['detector', 20000, /could not get ready/],
]) {
  const pending = deferred();
  const test = await mount({ autoStart: false, startup: { [phase]: pending.promise } });
  test.hook.interrupt();
  await settle();
  test.expireStartup(milliseconds);
  await settle();
  assert.equal(test.states[9], false, `${phase}: never claims ready`);
  assert.equal(test.states[10], false, `${phase}: exits preparing`);
  assert.equal(test.states[4], true, `${phase}: returns control to the learner`);
  assert.match(test.states[3], message);
  pending.resolve(phase === 'health' ? Response.json({ grok: true, elevenlabs: true }) : undefined);
  await settle();
  assert.equal(test.track.readyState, 'ended', `${phase}: releases even a late microphone grant`);
  assert.equal(test.resourceCounts().closedContexts, 1, `${phase}: closes failed audio context`);
  if (phase === 'detector') assert.equal(test.resourceCounts().destroyedDetectors, 1, 'Late detector is destroyed');
  assert.equal(test.requests.some(r => r.url.endsWith('/tts')), false, `${phase}: late completion cannot speak`);
  test.cleanup();
}
for (const ended of ['permission', 'detector']) {
  const test = await mount({ autoStart: false, startup: { ended } });
  test.hook.interrupt();
  await settle();
  assert.equal(test.states[9], false, `${ended}: rejects an ended track before reporting readiness`);
  assert.equal(test.states[10], false);
  assert.match(test.states[3], /disconnected the microphone during startup/);
  assert.equal(test.resourceCounts().closedContexts, 1);
  test.cleanup();
}
{
  const permission = deferred();
  const test = await mount({ autoStart: false, startup: { media: permission.promise } });
  test.hook.interrupt();
  permission.reject(new DOMException('Denied', 'NotAllowedError'));
  await settle();
  assert.match(test.states[3], /Microphone access is blocked/);
  assert.equal(test.states[10], false);
  test.cleanup();
}
for (const action of ['ready', 'pause', 'unmount']) {
  const permission = deferred();
  const test = await mount({ autoStart: false, startup: { media: permission.promise } });
  await test.hook.sendUtterance('Explain a concept');
  assert.equal(test.requests.some(r => r.url.endsWith('/llm')), false, 'A chip waits for microphone readiness');
  if (action === 'pause') test.hook.pauseVoice();
  if (action === 'unmount') test.cleanup();
  permission.resolve();
  await settle();
  assert.equal(test.requests.filter(r => r.url.endsWith('/llm')).length, action === 'ready' ? 1 : 0, `${action}: only an active selection proceeds`);
  assert.equal(test.requests.some(r => r.url.endsWith('/tts')), false, 'A chip skips the lobby greeting');
  if (action === 'pause') assert.equal(test.states[4], true);
  if (action === 'unmount') assert.equal(test.track.readyState, 'ended', 'Unmount releases late permission grants');
  else test.cleanup();
}
console.log('PASS: explicit startup, bounded permission/configuration/audio/detector waits, ended-track rejection, late resource cleanup, deferred chips, and one-click retry.');

for (const action of ['pause', 'resume', 'leave', 'enter', 'remove', 'hide', 'unmount']) {
  const test = await mount();
  await test.record();
  const request = test.requests.find(r => r.url.endsWith('/stt'));
  if (action === 'pause' || action === 'resume') test.hook.pauseVoice();
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
  assert.equal(test.states[13], null, `${result} clears the processing stage`);
  test.cleanup();
}
console.log('PASS: pending STT state, single recording, late-response isolation on pause/resume/desk changes/hide/unmount, valid speech, noise, and failure recovery.');

{
  const route = deferred(), lesson = deferred();
  const test = await mount({ llmResponse: request => request.deep ? lesson.promise : route.promise });
  const turn = test.hook.sendUtterance('Help me picture this situation');
  await settle();
  assert.equal(test.states[13], 'thinking', 'Routing reports actual thinking');
  route.resolve(new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: '[THINK]' } }] })}\n\ndata: [DONE]\n\n`));
  await settle();
  assert.equal(test.states[13], 'explaining', 'The actual deep request advances the waiting stage');
  test.hook.pauseVoice();
  lesson.resolve(new Response('data: [DONE]\n\n'));
  await turn;
  assert.equal(test.states[13], null, 'A late deep response cannot restore the cancelled waiting stage');
  test.cleanup();
}

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
  test.hook.pauseVoice();
  assert.equal(test.states[4], true, 'Explicit pause stops without creating a turn');
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
  const test = await mount({ llmText: '[TEACH move=explain visual=notes] Here is the relation. [DRAW {"op":"text","id":"equation","at":{"x":0.5,"y":0.4},"text":"F = ma"}] What changes?', manualAudio: true });
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

// Auto-endpoint can race a tap already aimed at "finished". Primary taps must
// not change ownership or discard the transcript during processing/playback.
{
  const test = await mount();
  await test.record();
  const request = test.requests.find(r => r.url.endsWith('/stt'));
  test.hook.interrupt();
  assert.equal(request.signal.aborted, false, 'A late finish tap cannot cancel STT');
  assert.equal(test.states[4], false);
  test.stt.resolve(Response.json({ text: 'I want to understand the setup' }));
  await settle();
  assert.equal(test.requests.filter(r => r.url.endsWith('/llm')).length, 1);
  test.cleanup();
}
{
  const test = await mount({ llmText: explanation, manualAudio: true });
  const speaking = test.hook.sendUtterance('Explain this');
  await settle();
  test.hook.interrupt();
  assert.equal(test.audio[0].paused, false, 'Primary tap does not turn into cancellation during response');
  test.hook.pauseVoice();
  assert.equal(test.audio[0].paused, true, 'Explicit Pause still stops immediately');
  await speaking;
  test.cleanup();
}
console.log('PASS: finish-tap race across automatic endpoint and playback; separate pause control.');

{
  const test = await mount();
  test.tick(true, 1000);
  for (let i=0;i<20;i++) test.tick(true,20);
  for (let i=0;i<17;i++) test.tick(.45,100);
  await settle();
  assert.equal(test.requests.filter(r=>r.url.endsWith('/stt')).length,1,'Uncertain background sound cannot renew the endpoint indefinitely');
  test.cleanup();
}
{
  const test = await mount({livePage:{psetId:'uploaded',documentKind:'pset'}});
  await test.hook.sendEvent({kind:'pset_ready'});
  test.tick(false,1000); await settle();
  assert.equal(test.audio.length,0,'Upload receipt waits for quiet');
  test.tick(false,700); await settle();
  const spoken=test.requests.filter(r=>r.url.endsWith('/tts')).map(r=>JSON.parse(r.body).text);
  assert.deepEqual(spoken,['I can see your PDF now.']);
  assert.equal(test.requests.filter(r=>r.url.endsWith('/llm')).length,0,'Receipt cannot start a lesson');
  assert.equal(test.audio[0].playbackRate,1.08);
  await test.hook.sendEvent({kind:'pset_ready'});test.tick(false,2000);await settle();
  assert.equal(test.audio.length,1,'Same upload is acknowledged once');
  test.cleanup();
}
{
  const test = await mount({livePage:{psetId:'uploaded',documentKind:'pset'}});
  await test.hook.sendEvent({kind:'pset_ready'});
  test.tick(true,1000);for(let i=0;i<20;i++)test.tick(true,20);
  test.tick(false,800);await settle();
  assert.equal(test.audio.length,0,'Student speech cancels a pending receipt');
  test.cleanup();
}
console.log('PASS: low-confidence noise endpoint, quiet one-time upload receipt, speech priority, and brisk pitch-preserving playback.');

{
  const test = await mount();
  test.suspendAudio();test.tick(false,100);test.tick(false,2100);await settle();
  assert.match(test.states[3],/Microphone audio was suspended/);
  assert.equal(test.states[4],true,'Suspended input pauses instead of appearing to listen forever');
  test.cleanup();
}
console.log('PASS: suspended microphone audio has a bounded recovery path.');

// A processed silence frame is not proof that the microphone is available.
for (const fault of ['interrupted', 'closed', 'muted', 'ended', 'detector']) {
  const test = await mount();
  try {
    if (fault === 'interrupted' || fault === 'closed') test.setAudioState(fault);
    if (fault === 'muted') test.track.muted = true;
    if (fault === 'ended') test.track.readyState = 'ended';
    const hasFrames = fault === 'muted' || fault === 'ended';
    test.tick(false, 100, hasFrames);
    test.tick(false, 5100, hasFrames);
    await settle();
    assert.equal(test.states[4], true, `${fault}: unavailable input cannot keep claiming to listen`);
    assert.equal(test.states[0], 'idle');
    assert.ok(test.states[3].includes('Retry the microphone'), `${fault}: expose actionable recovery`);
  } finally { test.cleanup(); }
}
// Brief browser interruptions recover without requiring a new conversation.
for (const fault of ['interrupted', 'muted', 'disabled']) {
  const test = await mount();
  try {
    if (fault === 'interrupted') test.setAudioState(fault);
    if (fault === 'muted') test.track.muted = true;
    if (fault === 'disabled') test.track.enabled = false;
    test.tick(false, 100);
    test.setAudioState('running');
    test.track.muted = false;
    test.tick(false, 100);
    assert.equal(test.track.enabled, true, 'Active input restores an unexpectedly disabled track');
    assert.equal(test.states[4], false, 'Transient interruption keeps the session active');
    await test.record();
    test.stt.resolve(Response.json({ text: 'Can you hear me now?' }));
    await settle();
    assert.equal(test.requests.filter(r => r.url.endsWith('/llm')).length, 1);
  } finally { test.cleanup(); }
}
// Recovery must accept another utterance, not just change the displayed state.
for (const result of ['noise', 'failure', 'empty', 'timeout', 'misheard']) {
  const test = await mount({ llmText: 'Could you say that again?' });
  try {
    await test.record();
    if (result === 'failure') test.stt.reject(new Error('Network unavailable'));
    else if (result === 'timeout') test.expireTranscription();
    else test.stt.resolve(Response.json({ text: result === 'noise' ? '[background noise]' : result === 'misheard' ? 'An unclear phrase' : '' }));
    await settle();
    test.tick(true, 1000);
    for (let i = 0; i < 20; i++) test.tick(true, 20);
    test.tick(false, 1700);
    await settle();
    assert.equal(test.requests.filter(r => r.url.endsWith('/stt')).length, 2, `${result}: next utterance reaches transcription`);
    if (result === 'timeout') {
      test.stt.resolve(Response.json({ text: 'This old result must be ignored' }));
      await settle();
    }
    test.sttNext.resolve(Response.json({ text: 'Let me say that again' }));
    await settle();
    const calls = test.requests.filter(r => r.url.endsWith('/llm'));
    assert.equal(calls.length, result === 'misheard' ? 2 : 1, `${result}: retry reaches the tutor once`);
    assert.equal(JSON.parse(calls.at(-1).body).messages.at(-1).content, 'Let me say that again');
    assert.equal(test.states[0], 'listening');
  } finally { test.cleanup(); }
}
console.log('PASS: interrupted/closed/muted/ended/stalled input exposes recovery; transient faults and rejected transcripts accept the next utterance.');


{
  const bbox0={x:.1,y:.2,w:.3,h:.02}, bbox1={x:.1,y:.4,w:.3,h:.02};
  const test=await mount({livePage:{psetId:'page-a',page:0,textRegions:[{label:'first',bbox:bbox0},{label:'second',bbox:bbox1}]},llmText:'[HIGHLIGHT page=1 anchor=0] Notice the first given. [HIGHLIGHT page=1 anchor=1] Now the second given.',manualAudio:true});
  const speaking=test.hook.sendUtterance('Explain the givens');
  await settle();
  assert.equal(JSON.stringify(test.states[7]?.bbox),JSON.stringify(bbox0),'First measured highlight accompanies first speech');
  test.audio[0].onended();
  await settle();
  assert.equal(JSON.stringify(test.states[7]?.bbox),JSON.stringify(bbox1),'Second highlight waits for preceding speech');
  test.hook.pauseVoice();
  await speaking;
  test.cleanup();
}
console.log('PASS: actual voice queue advances measured PDF highlights with spoken sentences.');

for (const order of ['first-first','second-first']) {
  const test=await mount();
  await test.record();
  test.tick(true,1000);
  for(let i=0;i<20;i++)test.tick(true,20);
  assert.equal(test.recordings.length,2,'Capture continued speech during STT');
  assert.equal(test.requests.find(r=>r.url.endsWith('/stt')).signal.aborted,false,'Continuation preserves the opening transcript');
  if(order==='first-first') {test.stt.resolve(Response.json({text:'I understand the velocity'}));await settle();}
  assert.equal(test.requests.filter(r=>r.url.endsWith('/llm')).length,0,'Do not reply while the student continues');
  test.tick(false,1000);
  assert.equal(test.recordings[1].state,'recording','Allow a one-second thinking pause');
  test.tick(false,700);await settle();
  assert.equal(test.requests.filter(r=>r.url.endsWith('/stt')).length,2);
  test.sttNext.resolve(Response.json({text:'but I do not understand acceleration'}));await settle();
  if(order==='second-first') {
    assert.equal(test.requests.filter(r=>r.url.endsWith('/llm')).length,0,'Wait for the opening transcript even if it finishes later');
    test.stt.resolve(Response.json({text:'I understand the velocity'}));await settle();
  }
  const calls=test.requests.filter(r=>r.url.endsWith('/llm'));
  assert.equal(calls.length,1,'Continuation is one tutor turn');
  assert.equal(JSON.parse(calls[0].body).messages.at(-1).content,'I understand the velocity but I do not understand acceleration');
  test.cleanup();
}
{
 const test=await mount({llmText:'[TEACH move=elicit visual=none] What equation connects these quantities?' ,manualAudio:true});
 const speaking=test.hook.sendUtterance('Remind me of the equation');await settle();
 assert.equal(test.marks.length,0,'Elicitation does not automatically copy an equation from speech or the student');
 test.hook.pauseVoice();await speaking;test.cleanup();
}
console.log('PASS: resumed speech survives pending STT in either completion order; elicitation does not auto-reveal a relationship.');

for(const cancel of [false,true]) {
  const repair=deferred();
  const test=await mount({llmText:'[TEACH move=explain visual=diagram] Imagine opening a box that contains a smaller box. Each box waits for the one inside.',manualAudio:true,repairResponse:repair.promise});
  const speaking=test.hook.sendUtterance('Can you illustrate recursion?');await settle();
  assert.equal(test.requests.filter(r=>r.url.endsWith('/llm')&&JSON.parse(r.body).visualRepair).length,1,'One bounded repair for a missing conceptual diagram');
  if(cancel)test.hook.pauseVoice();
  const content='[MODE pset][DRAW {"op":"clear"}][DRAW {"op":"circle","id":"box","at":{"x":0.5,"y":0.3},"r":0.1}] These words must never be spoken.';
  repair.resolve(new Response(`data: ${JSON.stringify({choices:[{delta:{content}}]})}\n\ndata: [DONE]\n\n`));await settle();
  assert.equal(test.marks.length,cancel?0:1,'Cancelled repair cannot draw; valid repair never clears existing work');
  assert.ok(test.requests.filter(r=>r.url.endsWith('/tts')).every(r=>!JSON.parse(r.body).text.includes('These words')),'The repair lane cannot add speech');
  test.hook.pauseVoice();await speaking;test.cleanup();
}
console.log('PASS: one visual repair, no added speech or clearing, and late-response cancellation.');

{
  const repair=deferred();
  const test=await mount({llmText:'[TEACH move=orient visual=diagram][DRAW {"op":"text","id":"relation","at":{"x":0.5,"y":0.3},"text":"F = ma"}] Picture the object before choosing an equation. What could push it?',manualAudio:true,repairResponse:repair.promise});
  const speaking=test.hook.sendUtterance("I don't understand the setup");await settle();
  assert.equal(test.requests.filter(r=>r.url.endsWith('/llm')&&JSON.parse(r.body).visualRepair).length,1,'A formula alone must not satisfy a request to picture the situation');
  assert.equal(test.marks.length,0,'An orientation turn cannot reveal the relation');
  const content='[TEACH move=explain visual=notes][DRAW {"op":"text","id":"leak","at":{"x":0.5,"y":0.3},"text":"F = ma"}][DRAW {"op":"circle","id":"object","center":{"x":0.5,"y":0.5},"r":0.1}][DRAW {"op":"arrow","id":"force","from":{"x":0.5,"y":0.4},"to":{"x":0.5,"y":0.2},"label":"force"}]';
  repair.resolve(new Response(`data: ${JSON.stringify({choices:[{delta:{content}}]})}\n\ndata: [DONE]\n\n`));await settle();
  assert.ok(test.marks.some(mark=>mark.op==='circle')&&test.marks.some(mark=>mark.op==='arrow'),'Setup recovery contains actual geometry');
  assert.ok(!test.marks.some(mark=>mark.id==='leak'),'A repair cannot override the parent teaching move');
  test.hook.pauseVoice();await speaking;test.cleanup();
}
console.log('PASS: orientation withholds premature equations; geometry recovery cannot change the teaching move.');

// Synthesis and browser buffering must not play a visual before its narration.
for (const cancel of [false, true]) {
  const tts = deferred();
  const test = await mount({ llmText: '[TEACH move=orient visual=diagram][DRAW {"op":"circle","id":"object","center":{"x":0.4,"y":0.5},"r":0.05}] Here is the object.', manualAudio: true, deferredTts: tts.promise, deferPlaying: true });
  const speaking = test.hook.sendUtterance('Picture this situation');
  await settle();
  assert.equal(test.marks.length, 0, 'Pending synthesis leaves this beat pending');
  assert.equal(test.states[13], 'voice', 'Pending synthesis is not presented as model thinking');
  tts.resolve(new Response(new Blob(['audio'])));
  await settle();
  assert.equal(test.marks.length, 0, 'Calling play before the playing event cannot start the visual');
  if (cancel) test.hook.pauseVoice();
  test.audio[0].onplaying();
  assert.equal(test.states[13], null, 'Playing or cancellation clears the waiting stage');
  assert.equal(test.marks.length, cancel ? 0 : 1, 'Only an audible, uncancelled sentence releases its drawing');
  test.audio[0].onplaying();
  assert.equal(test.marks.length, cancel ? 0 : 1, 'Buffer recovery does not repeat drawing commands');
  test.audio[0].onended();
  await speaking; test.cleanup();
}
console.log('PASS: delayed synthesis, buffered playback, repeated playing events, and cancellation preserve visual/narration synchronization.');

// The first completed sentence must not wait for an expensive later figure.
for (const cancel of [false, true]) {
  let output;
  const response = new Response(new ReadableStream({ start(controller) { output = controller; } }));
  const test = await mount({ llmResponse: response, manualAudio: true });
  const speaking = test.hook.sendUtterance('Explain this picture');
  const emit = content => output.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ bohSpeechBoundary: true, choices: [{ delta: { content } }] })}\n\n`));
  emit('[TEACH move=explain visual=diagram]\nThese arrows describe two independent directions.\n');
  await settle();
  assert.equal(test.audio.length, 1, 'A complete introduction plays while the next beat is still generating');
  assert.equal(test.marks.length, 0, 'Upcoming visuals have not arrived yet');
  if (cancel) test.hook.pauseVoice(); else test.audio[0].onended();
  emit('[BOARD open][DRAW {"op":"arrow","id":"direction","from":{"x":0.2,"y":0.5},"to":{"x":0.7,"y":0.5}}]\nThis arrow shows the first direction.\n');
  await settle();
  assert.equal(test.marks.length, cancel ? 0 : 1, 'The later beat draws only at its own uncancelled audio start');
  if (!cancel) { assert.equal(test.audio.length, 2); test.audio[1].onended(); }
  output.close(); await speaking; test.cleanup();
}
console.log('PASS: completed sentence boundaries release speech before the next diagram, without duplicate speech or early/cancelled drawings.');

{
  const test = await mount({ autoStart: false, llmText: 'Yes, that comparison still applies.' });
  const archive = { kind: 'concept', current: {
    history: [{ role: 'user', content: 'Compare these two directions.' }, { role: 'assistant', content: 'They share the same time.' }],
    turns: [{ role: 'student', text: 'Compare these two directions.', at: '2026-09-11T20:00:00Z' }, { role: 'tutor', text: 'They share the same time.', at: '2026-09-11T20:00:01Z' }],
    board: { groups: [], playing: false },
  }, parked: { pset: null, concept: null } };
  test.hook.restoreSession(archive);
  assert.equal(test.resourceCounts().mediaRequests, 0, 'Restore requires a fresh user action before listening');
  assert.equal(test.requests.filter(r => r.url.endsWith('/tts')).length, 0, 'Restore does not speak a new greeting');
  const copy = test.hook.captureSession();
  copy.current.history[0].content = 'An unrelated edit';
  assert.equal(test.hook.captureSession().current.history[0].content, archive.current.history[0].content, 'Exported snapshots do not alias live conversation memory');
  test.hook.interrupt(); await settle();
  await test.hook.sendUtterance('Does that still apply?');
  const messages = JSON.parse(test.requests.find(r => r.url.endsWith('/llm')).body).messages;
  assert.deepEqual(messages.slice(0, 2), archive.current.history, 'The next voice request receives restored student and tutor context');
  assert.equal(messages.at(-1).content, 'Does that still apply?');
  test.cleanup();
}
console.log('PASS: paused session recovery restores conversation memory for the next voice turn without restarting a greeting.');

{
  const test = await mount();
  test.restartEffects(); await settle();
  assert.equal(test.states[9],false,'Fast Refresh invalidates input whose effect resources were destroyed');
  assert.equal(test.states[4],true,'Fast Refresh leaves voice visibly paused');
  assert.equal(test.resourceCounts().mediaRequests,1,'Effect restart never silently reacquires microphone');
  test.hook.interrupt(); await settle();
  assert.equal(test.states[9],true,'Next explicit start reacquires live input');
  assert.equal(test.resourceCounts().mediaRequests,2);
  await test.record(); test.stt.resolve(Response.json({text:'Can you hear me after that update?'})); await settle();
  assert.equal(test.requests.filter(r=>r.url.endsWith('/llm')).length,1,'Reacquired input actually transcribes the next utterance');
  test.cleanup();
}
{
  const permission=deferred();
  const test=await mount({autoStart:false,realIntent:true,startup:{media:permission.promise}});
  await test.hook.sendUtterance('Explain a concept');
  assert.equal(test.states[5],'concept','An explicit choice reveals the workspace before microphone permission resolves');
  assert.equal(test.states[10],true);
  permission.resolve();await settle();
  assert.equal(test.requests.filter(r=>r.url.endsWith('/llm')).length,1);
  test.cleanup();
}
for(const [mode,expected] of [['','concept'],['[MODE pset]','pset']]) {
  const test=await mount({llmText:mode+'[BOARD open] Here is the picture.'});
  await test.hook.sendUtterance('Help with this idea');
  assert.equal(test.states[5],expected,'Generated board opens the desk; explicit homework mode takes priority');
  test.cleanup();
}
console.log('PASS: Fast Refresh microphone reacquisition, immediate concept desk during permissions, and generated-board workspace visibility.');
