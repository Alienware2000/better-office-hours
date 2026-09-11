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

async function mount({ llmText = '', manualAudio = false, failTts = false, livePage = null, repairResponse = null } = {}) {
  const effects = [], states = [], requests = [], recordings = [];
  let audioContext;
  const stt = deferred();
  const sttNext = deferred();
  let sttCount = 0;
  const audio = [];
  const marks = [];
  let now = 1000, loud = false, frame, stateIndex = 0;
  const listeners = new Map();
  let probabilityCallback = () => {};
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
    './speech-detector': {
      createSpeechDetector: async (_stream, _context, callback) => { probabilityCallback = callback; return { destroy: async () => {} }; },
      isSpeechFrame: (probability, recording, playback) => probability >= (playback ? .85 : recording ? .35 : .65),
    },
    '@/lib/agent/intent': { detectMode: () => null },

    '@/lib/pdf/live-page': { getLivePage: () => livePage, setLivePage: noOp },
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
      constructor() { audioContext = this; }
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
      if (url.endsWith('/stt')) return (sttCount++ ? sttNext : stt).promise; // Deliberately ignores abort.
      if (url.endsWith('/llm') && JSON.parse(options.body).visualRepair && repairResponse) return repairResponse;
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
  imports['@/lib/whiteboard/geometry'] = load('lib/whiteboard/geometry.ts');
  const hook = load('app/(session)/voice/useVoiceLoop.ts').useVoiceLoop();
  const cleanups = effects.map(effect => effect());
  await settle();
  hook.interrupt(); // Activate voice without relying on a rendered health update.
  const tick = (volume, elapsed) => { loud = volume; now += elapsed; probabilityCallback(typeof volume === 'number' ? volume : volume ? .98 : .01); frame(); };
  async function record() {
    tick(true, 1000);
    for (let i = 0; i < 20; i++) tick(true, 20);
    tick(false, 900);
    assert.equal(states[0], 'listening', 'A short thinking pause does not end the student turn');
    tick(false, 1000);
    await settle();
    assert.equal(states[0], 'thinking', 'Show processing while STT is pending');
    assert.equal(recordings.length, 1, 'One recording before the first transcription');
  }
  return { hook, states, stt, sttNext, recordings, requests, record, listeners, tick, audio, marks,
    suspendAudio: () => { audioContext.state = 'suspended'; },
    cleanup: () => cleanups.forEach(cleanup => cleanup?.()) };
}

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
 const test=await mount({llmText:'The general relationship is v² = u² + 2 a s. What is unknown?',manualAudio:true});
 const speaking=test.hook.sendUtterance('Remind me of the equation');await settle();
 assert.equal(test.marks[0]?.text,'v² = u² + 2 a s','A spoken formula appears even without a model DRAW tag');
 test.hook.pauseVoice();await speaking;test.cleanup();
}
console.log('PASS: resumed speech survives pending STT in either completion order; a missing DRAW tag cannot hide the spoken symbolic relation.');

for(const cancel of [false,true]) {
  const repair=deferred();
  const test=await mount({llmText:'Imagine opening a box that contains a smaller box. Each box waits for the one inside.',manualAudio:true,repairResponse:repair.promise});
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
