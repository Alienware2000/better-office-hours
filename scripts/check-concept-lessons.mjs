// Streamed concept lessons use the same protected drawing/playback protocol.
// All scenes here are test data, never runtime templates or model responses.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const external = createRequire(import.meta.url);
const cache = new Map();
const requests = [];
let chunks = [];
const fakeKey = process.env.XAI_API_KEY;
process.env.XAI_API_KEY = 'test-only';
class FakeOpenAI {
  chat = { completions: { create: async (request, options) => {
    requests.push({ request, options });
    return (async function* () {
      for (const content of chunks) {
        if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
        yield { choices: [{ delta: { content } }] };
      }
    })();
  } } };
}
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(name => {
    if (name === 'openai') return { default: FakeOpenAI };
    if (name.startsWith('@/')) return load(path.resolve(name.slice(2)) + '.ts');
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name) + '.ts');
    return external(name);
  }, mod, mod.exports);
  cache.set(file, mod.exports);
  return mod.exports;
}
const { conceptProgress, conceptResponse } = load('lib/agent/concept-response.ts');
const { parseAgentTurn, visualBeats } = load('lib/agent/tags.ts');
const { needsBoardRepair } = load('lib/agent/teaching-intent.ts');
const circle = { op: 'circle', id: 'object', at: { x: .25, y: .45 }, r: .04, label: 'Object "A"' };
const arrow = { op: 'arrow', id: 'connection', from: { x: .29, y: .45 }, to: { x: .65, y: .45 }, label: 'next' };
const relation = { op: 'text', id: 'relation', at: { x: .5, y: .7 }, text: String.raw`\frac{a}{b}=c` };
const lesson = {
  handoff: false, move: 'orient', visual: 'diagram', introduction: 'Let us picture "A" and its connection.',
  beats: [
    { pdf: '[HIGHLIGHT page=1 anchor=0]', draw: [JSON.stringify(circle)], animation: '', speech: 'Here is the first object.' },
    { pdf: '', draw: [JSON.stringify(arrow), JSON.stringify(relation)], animation: '', speech: 'This connects to the next object.' },
  ], question: 'What connects them?',
};
const raw = JSON.stringify(lesson);
let emitted = '';
let firstBeatAt = 0;
for (let end = 1; end <= raw.length; end++) {
  const next = conceptProgress(raw.slice(0, end));
  assert.ok(next.startsWith(emitted), 'Chunk boundaries cannot retract/repeat already emitted content');
  emitted = next;
  if (!firstBeatAt && parseAgentTurn(next).board?.commands.length) firstBeatAt = end;
}
const complete = conceptResponse(raw);
assert.ok(complete.startsWith(emitted));
assert.ok(firstBeatAt > 0 && firstBeatAt < raw.indexOf('This connects'), 'The first drawing streams before the next beat completes');
const page = { page: 0, textRegions: [{ label: 'source', bbox: { x: .1, y: .2, w: .3, h: .02 } }] };
const turn = parseAgentTurn(complete, page);
assert.equal(turn.teaching.move, 'orient');
assert.equal(turn.board.commands[0].center.x, .25, 'Circle aliases use the established parser');
assert.equal(turn.board.commands.length, 2, 'Orientation withholds a formula even inside structured output');
assert.equal(turn.highlight.bbox.y, .2, 'PDF targeting retains measured anchors');
const beats = visualBeats(complete, page);
assert.equal(beats.find(beat => beat.turn.board?.commands.some(c => c.id === 'object')).speechBefore, lesson.introduction);
assert.equal(beats.find(beat => beat.turn.board?.commands.some(c => c.id === 'connection')).speechBefore, lesson.introduction + ' ' + lesson.beats[0].speech);
assert.equal(turn.speech, [lesson.introduction, ...lesson.beats.map(b => b.speech), lesson.question].join(' '));
assert.ok(!needsBoardRepair(turn));
const hint = parseAgentTurn(conceptResponse(JSON.stringify({ ...lesson, move: 'hint' })));
assert.ok(hint.board.commands.some(c => c.id === 'relation'), 'A justified hint keeps LaTeX');
const definition = parseAgentTurn(conceptResponse(JSON.stringify({ ...lesson, move: 'consolidate', visual: 'none', introduction: 'One sentence.', beats: [{ ...lesson.beats[0], speech: 'One sentence.' }], question: '' })));
assert.equal(definition.speech, 'One sentence.', 'Exact duplicate introductions are not read again');
assert.equal(definition.board, undefined, 'A nonvisual turn does not inherit incidental geometry');
for (const move of ['orient', 'explain']) {
  const missing = parseAgentTurn(conceptResponse(JSON.stringify({ ...lesson, move, visual: 'none', beats: [] })));
  assert.equal(missing.teaching.visual, 'diagram');
  assert.ok(needsBoardRepair(missing), 'A declared explanation cannot silently opt out of the board');
}
const handoffRaw = JSON.stringify({ ...lesson, handoff: true });
const handoff = parseAgentTurn(conceptResponse(handoffRaw));
assert.ok(handoff.think);
assert.equal(handoff.board, undefined, 'Checking learner work hands off without leaking draft teaching');
assert.equal(handoff.speech, lesson.introduction);
for (const input of ['', '{', 'null', '[]', '{}', raw.slice(0, -1)]) assert.throws(() => conceptResponse(input));
const invalid = parseAgentTurn(conceptResponse(JSON.stringify({ ...lesson, beats: [{ pdf: '[MODE pset][TEACH move=explain visual=notes]', draw: ['{}', '{bad'], animation: '{"kind":"unsupported"}', speech: 'Look.' }] })));
assert.equal(invalid.mode, undefined);
assert.equal(invalid.teaching.move, 'orient');
assert.ok(needsBoardRepair(invalid), 'Invalid geometry remains eligible for bounded silent repair');
console.log('PASS: every stream boundary, early progressive drawings, escaped JSON/LaTeX, narration order, measured PDF highlights, disclosure, handoff, invalid data, and nonvisual definitions.');

const { setLivePage } = load('lib/pdf/live-page.ts');
const { setLiveBoard, boardContextForTurn, setBoardSnapshotProvider } = load('lib/whiteboard/live-board.ts');
const boardStore = load('lib/whiteboard/store.ts');
boardStore.resetBoard(); setLiveBoard(null); setBoardSnapshotProvider(null);
assert.equal(boardContextForTurn(boardStore.getBoardState()), null);
boardStore.openBoard();
const firstContext = boardContextForTurn(boardStore.getBoardState());
assert.equal(firstContext.open, true, 'A spoken desk entry sees the board before React mounts the preview');
assert.equal(firstContext.studentStrokeCount, 0);
assert.equal(firstContext.imageUrl, '', 'Do not invent an image before the first render');
const renderedContext = { ...firstContext, imageUrl: 'rendered-preview' };
setBoardSnapshotProvider(() => renderedContext);
assert.equal(boardContextForTurn(boardStore.getBoardState()), renderedContext, 'Mounted previews retain priority');
setBoardSnapshotProvider(null);
const { usesConceptLesson, usesConceptRouter, streamGrok, GROK_MODEL, GROK_DEEP_MODEL } = load('lib/agent/grok.ts');
const { conceptRoute, conceptRoutingMessages } = load('lib/agent/concept-routing.ts');
for (const kind of ['orient', 'lesson', 'check_work']) {
  assert.ok(parseAgentTurn(conceptRoute(JSON.stringify({ kind, speech: 'Let us look at that.' }))).think);
}
for (const kind of ['clarify_topic', 'logistics', 'definition']) {
  assert.ok(!parseAgentTurn(conceptRoute(JSON.stringify({ kind, speech: 'A short response.' }))).think);
}
for (const input of ['', 'null', '{}', '{"kind":"other","speech":"Hello"}', '{"kind":"conversation","speech":"What is the first step?"}']) assert.throws(() => conceptRoute(input));
for (const speech of ['What do you picture happening?', 'Let us look at that. What do you picture?', 'Let us look carefully at everything about this problem together before working on it.']) {
  const routed = parseAgentTurn(conceptRoute(JSON.stringify({ kind: 'orient', speech })));
  assert.equal(routed.think, true, 'A bad acknowledgement cannot discard a teaching handoff');
  assert.ok(!routed.speech.includes('?'), 'The acknowledgement cannot quiz before the picture');
  assert.equal(routed.speech, '', 'Handoffs add no repetitive waiting speech');
}
const unchecked = parseAgentTurn(conceptRoute(JSON.stringify({ kind: 'check_work', speech: "Yes that's valid. Why did you pick that height?" })));
assert.equal(unchecked.think, true);
assert.ok(!unchecked.speech.includes('valid') && !unchecked.speech.includes('?'), 'A routing response cannot validate work or question the learner before checking');
assert.ok(parseAgentTurn(conceptRoute('{"kind":"orient","speech":""}')).think, 'Handoffs need no generated speech');
assert.throws(() => conceptRoute('{"kind":"definition","speech":""}'), 'Direct replies still require speech');
const routingHistory = [{ role: 'system', content: 'Old tool and teaching instructions.' }, { role: 'assistant', content: 'Which part?' }, { role: 'user', content: 'Part a, but I cannot picture it.' }];
const routedMessages = conceptRoutingMessages(routingHistory, { board: { tutorItems: [{ text: 'Tutor-created setup' }], studentStrokeCount: 0 } });
assert.equal(routedMessages.filter(m => m.role === 'system').length, 1, 'Routing has one focused instruction, not conflicting teaching/tool rules');
assert.equal(routedMessages.at(-1).content, routingHistory.at(-1).content, 'Actual student request remains last');
assert.ok(routedMessages[1].content.includes('NOT a student attempt'), 'Board provenance survives the compact routing context');
assert.ok(!routedMessages.some(m => m.content.includes('Old tool and teaching instructions.')));
setLivePage(null); setLiveBoard(null);
assert.equal(usesConceptRouter(), true, 'The lobby uses the same compact semantic router without an extra model call');
assert.equal(parseAgentTurn(conceptRoute('{"kind":"lesson","speech":""}', true)).mode, 'concept');
assert.equal(parseAgentTurn(conceptRoute('{"kind":"logistics","speech":"Hello."}', true)).mode, undefined);
assert.equal(parseAgentTurn(conceptRoute('{"kind":"clarify_topic","speech":"Which idea?"}', true)).mode, undefined);
assert.equal(parseAgentTurn(conceptRoute('{"kind":"definition","speech":"A short definition."}', true)).mode, 'concept');
assert.equal(parseAgentTurn(conceptRoute('{"kind":"lesson","speech":""}', false)).mode, undefined, 'An existing homework desk is retained');
setLiveBoard(firstContext);
assert.equal(usesConceptRouter(), true);
assert.equal(usesConceptLesson(true), true);
setLivePage({ ...page, psetId: 'notes', imageUrl: '', documentKind: 'notes', text: '', questionRegions: [], pages: 1 });
assert.equal(usesConceptRouter(), true, 'Concepts with supplemental PDFs keep visual lessons');
setLivePage({ ...page, psetId: 'homework', imageUrl: '', text: '', questionRegions: [], pages: 1 });
assert.equal(usesConceptRouter(), true, 'Homework setups also get an explicit teaching decision');
assert.equal(usesConceptLesson(true), true, 'Graded work uses the same protected narrated transport');
setLivePage(null);
assert.equal(usesConceptRouter(true), false);
assert.equal(usesConceptLesson(), false);
assert.equal(usesConceptLesson(true, true), false);
const history = [{ role: 'user', content: 'Help me understand this idea.' }];
chunks = [...raw];
let result = '';
for await (const text of streamGrok(history, null, true)) result += text;
assert.equal(result, complete, 'The actual teaching stream emits each beat exactly once');
assert.equal(requests.at(-1).request.model, GROK_DEEP_MODEL, 'Substantive teaching uses the reasoning lane');
assert.equal(requests.at(-1).request.response_format.type, 'json_schema');
chunks = ['{"kind":"lesson","speech":"Let us build a picture of that."}'];
result = '';
for await (const text of streamGrok(history)) result += text;
assert.ok(parseAgentTurn(result).think);
assert.equal(requests.at(-1).request.model, GROK_MODEL, 'Routing stays fast');
assert.equal(requests.at(-1).request.messages.filter(m => m.role === 'system').length, 1);
assert.ok(requests.at(-1).request.messages[0].content.length < 4000, 'The router does not load the full drawing/animation prompt');
setLiveBoard(null);
chunks = ['A checked response.'];
for await (const text of streamGrok(history, null, true)) assert.equal(text, chunks[0]);
assert.equal(requests.at(-1).request.response_format, undefined, 'Other desks retain the existing transport');
setLiveBoard({ open: true, imageUrl: '', studentShapesSince: '', tutorItems: [], studentStrokeCount: 0 });
const controller = new AbortController();
chunks = [...raw];
const stream = streamGrok(history, null, true, controller.signal);
await stream.next(); controller.abort();
await assert.rejects(stream.next(), { name: 'AbortError' });
chunks = [raw.slice(0, -1)];
await assert.rejects(async () => { for await (const text of streamGrok(history, null, true)) void text; });
if (fakeKey === undefined) delete process.env.XAI_API_KEY;
else process.env.XAI_API_KEY = fakeKey;
console.log('PASS: actual streaming adapter, concept/notes/homework/lobby routing, compact routing, silent deep handoff, cancellation, and truncated-response failure.');

// Continue an actual scene through structured controls, without a silent repair
// replacing it with a static sketch after the learner interrupts.
const scene = { id: 'moving-object', duration: 4, shapes: [{ kind: 'dot', id: 'object', keyframes: [{ t: 0, at: { x: .3, y: .5 } }, { t: 4, at: { x: .6, y: .5 } }] }] };
for (const control of ['resume', 'focus=object']) {
  const controlled = parseAgentTurn(conceptResponse(JSON.stringify({ ...lesson, visual: 'animation', beats: [{ draw: [], animation: control, speech: 'Watch this object.', pdf: '' }] })));
  assert.ok(controlled.board.animControl);
  assert.equal(needsBoardRepair(controlled, scene), false);
  assert.equal(needsBoardRepair(controlled), true, 'An absent scene cannot satisfy a visual request');
}
const injected = conceptResponse(JSON.stringify({ ...lesson, beats: [{ draw: [], animation: 'resume][MODE pset', speech: 'Look.', pdf: '' }] }));
assert.equal(parseAgentTurn(injected).mode, undefined);
boardStore.resetBoard();
boardStore.applyDrawCommands([{ ...circle, center: circle.at }, { op: 'line', id: 'ground', from: { x: .1, y: .7 }, to: { x: .8, y: .7 } }]);
boardStore.addStudentStroke({ id: 'mine', tool: 'pen', color: 'blue', points: [{ x: .1, y: .85 }, { x: .3, y: .9 }] });
boardStore.loadAnimation(scene);
assert.equal(boardStore.getBoardState().pageId, 1, 'The static object becomes animated in its own picture');
assert.deepEqual(boardStore.getBoardState().groups.map(g => g.id), ['ground']);
assert.equal(boardStore.getBoardState().animation.shapes[0].label, circle.label, 'An animated object retains its established annotation');
assert.equal(boardStore.getBoardState().student[0].id, 'mine');
boardStore.loadAnimation({ ...scene, duration: 5 });
assert.equal(boardStore.getBoardState().pageId, 1, 'An explicit scene revision keeps this working page and ink');
boardStore.pauseAnimation(); boardStore.seekAnimation(2);
const { boardProvenance, asLiveBoard } = load('lib/whiteboard/live-board.ts');
const roundTrip = asLiveBoard({ ...boardProvenance(boardStore.getBoardState()), open: true });
assert.equal(roundTrip.animation.spec.id, scene.id);
assert.equal(roundTrip.animation.time, 2);
assert.equal(roundTrip.animation.playing, false);
boardStore.loadAnimation({ ...scene, id: 'separate-scene' });
assert.equal(boardStore.getBoardState().pageId, 2);
assert.equal(boardStore.getBoardState().earlierPages[0].student[0].id, 'mine');
assert.equal(asLiveBoard({ open: true, animation: { spec: {}, time: 99 } }).animation, undefined);
console.log('PASS: structured replay/focus, absent-scene repair, static-to-moving continuity, scene revisions, ink preservation, separate pages, and current animation context.');
