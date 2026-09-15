import assert from 'node:assert/strict';
import { repositoryModule } from './evaluation/render.mjs';
const { parseDrawCommand } = repositoryModule('lib/whiteboard/parse-draw');
const { interpretCommand } = repositoryModule('lib/whiteboard/geometry');
const { writingBounds } = repositoryModule('lib/whiteboard/writing');
const { labelsOverlap } = repositoryModule('lib/whiteboard/diagram-layout');
const { teachingDraw, needsBoardRepair } = repositoryModule('lib/agent/teaching-intent');
const { parseAgentTurn } = repositoryModule('lib/agent/tags');
const { conceptResponse } = repositoryModule('lib/agent/concept-response');
const store = repositoryModule('lib/whiteboard/store');
const panel = { op: 'panel', id: 'colors', slot: 0, title: 'Compare the light', connect: true, items: [
  { label: 'Before the gas', shape: 'band', colors: ['violet', 'blue', 'green', 'yellow', 'orange', 'red'] },
  { label: 'After: schematic gaps', shape: 'band', colors: ['violet', 'blue', 'green', 'yellow', 'orange', 'red'], gaps: [.2, .5, .8] },
] };
assert.deepEqual(parseDrawCommand(JSON.stringify(panel)), panel);
for (const bad of [ { ...panel, slot: 2 }, { ...panel, items: [] }, { ...panel, items: [{ label: 'No palette', shape: 'band' }] },
  { ...panel, items: [{ ...panel.items[0], gaps: [2] }] }, { ...panel, items: [{ ...panel.items[0], colors: ['red', 'invented'] }] },
  { ...panel, title: 'x'.repeat(37) }, { ...panel, items: [{ label: '<script>', shape: 'box' }] } ]) assert.equal(parseDrawCommand(JSON.stringify(bad)), null);
const lesson = { handoff: false, move: 'explain', visual: 'diagram', introduction: '', beats: [{ draw: [JSON.stringify(panel)], speech: 'The gas leaves dark gaps in the colors.', pdf: '', animation: '' }], question: '' };
const turn = parseAgentTurn(conceptResponse(JSON.stringify(lesson)));
assert.equal(turn.board.commands[0].op, 'panel');
assert.equal(needsBoardRepair(turn), false);
store.resetBoard(); store.applyDrawCommands(turn.board.commands);
let state = store.getBoardState();
assert.equal(state.groups[0].unresolved, false);
assert.ok(state.groups[0].fixedLayout);
assert.ok(new Set(state.groups[0].drawables.filter(d => d.kind === 'fill').map(d => d.color)).size > 40, 'Spectrum preserves a continuous range of colors');
for (const count of [1, 2, 3]) {
  const sample = { ...panel, items: Array.from({ length: count }, () => ({ label: 'Very long label for a figure', shape: 'box' })) };
  const group = interpretCommand(sample, 0).group;
  const text = group.drawables.filter(d => d.kind === 'text');
  for (const mark of text) {
    const bounds = writingBounds(mark);
    assert.ok(bounds.left >= .02 && bounds.right <= .98 && bounds.top >= .02 && bounds.bottom <= .98);
  }
  for (let i = 0; i < text.length; i++) for (let j = i + 1; j < text.length; j++) assert.equal(labelsOverlap(writingBounds(text[i]), writingBounds(text[j])), false);
}
store.markGroupShown(panel.id);
store.applyDrawCommands([panel]);
assert.equal(store.getBoardState().groups.length, 1);
store.applyDrawCommands([{ ...panel, id: 'next-step', slot: 1 }]);
assert.equal(store.getBoardState().groups.length, 2);
const stroke = { id: 'student', tool: 'pen', color: 'ink', points: [{ x: .1, y: .9 }, { x: .3, y: .9 }] };
store.addStudentStroke(stroke);
store.applyDrawCommands([{ ...panel, id: 'fresh-page' }]);
state = store.getBoardState();
assert.equal(state.groups.length, 1);
assert.ok(JSON.stringify(state).includes('student'), 'Earlier student ink survives panel pagination');
assert.equal(teachingDraw({ ...panel, title: 'F = ma' }, { move: 'elicit', visual: 'diagram' }), null);
assert.equal(teachingDraw(panel, { move: 'orient', visual: 'diagram' }).id, panel.id);
const line = interpretCommand({ op: 'line', id: 'line', from: { x: .1, y: .5 }, to: { x: .8, y: .5 }, label: 'Visible caption', color: 'blue' }, 0).group;
assert.ok(line.drawables.some(d => d.kind === 'text' && d.text === 'Visible caption'));
console.log('Teaching panels: parsing, disclosure guard, color, layout, line labels, and page continuity passed.');

assert.throws(() => conceptResponse(JSON.stringify({ ...lesson, beats: [{ ...lesson.beats[0], draw: [] }] }), { panelsOnly: true }), /matching drawing/);
assert.throws(() => conceptResponse(JSON.stringify({ ...lesson, beats: [{ ...lesson.beats[0], draw: [JSON.stringify({ op: 'highlight', id: 'missing' })] }] }), { panelsOnly: true }), /no longer/);
assert.doesNotThrow(() => conceptResponse(JSON.stringify(lesson), { panelsOnly: true }));
console.log('Trial rejects speech with invalid, absent, or stale-panel drawing commands.');

const { conceptProgress } = repositoryModule('lib/agent/concept-response');
const invalidLater = JSON.stringify({ ...lesson, beats: [lesson.beats[0], { ...lesson.beats[0], draw: [], speech: 'Unmatched claim must stay silent.' }] });
for (let end = 1; end <= invalidLater.length; end++) {
  try { assert.ok(!conceptProgress(invalidLater.slice(0, end), { panelsOnly: true }).includes('Unmatched claim')); }
  catch (error) { assert.match(error.message, /matching drawing/); }
}
store.resetBoard(); store.applyDrawCommands([panel]); store.markGroupShown(panel.id);
store.applyDrawCommands([{ ...panel, title: 'A refined explanation' }]);
assert.equal(store.getBoardState().groups[0].appear, 'pending', 'Revised panel text gets the writing reveal again');
console.log('Every streaming boundary withholds unmatched speech; panel revisions animate.');

// Rich trial vocabulary must survive every streaming prefix without allowing
// a spoken beat whose drawing cannot be rendered.
const equation = {op:'text',id:'relation',at:{x:.5,y:.8},text:String.raw`\lambda = \frac{h}{p}`,size:'m'};
const wave = {op:'curve',id:'wave',points:[{x:.1,y:.4},{x:.3,y:.2},{x:.5,y:.4},{x:.7,y:.6},{x:.9,y:.4}],label:'Wavelength'};
const rich = {...lesson, beats:[{...lesson.beats[0],draw:[JSON.stringify(wave)],speech:'A wave has a spacing.'},{...lesson.beats[0],draw:[JSON.stringify(equation)],speech:'The equation connects spacing and momentum.'}]};
const encoded = JSON.stringify(rich);
assert.doesNotThrow(()=>conceptResponse(encoded,{requireVisuals:true}));
for(let i=0;i<=encoded.length;i++) {
  const partial = conceptProgress(encoded.slice(0,i),{requireVisuals:true});
  if(partial.includes(rich.beats[1].speech)) assert.ok(partial.includes('\\\\lambda'));
}
for(const draw of [[],[{op:'circle',id:'invalid'}],[{op:'highlight',id:'missing'}],[{op:'clear'}]]) {
  assert.throws(()=>conceptResponse(JSON.stringify({...lesson,beats:[{...lesson.beats[0],draw:draw.map(JSON.stringify)}]}),{requireVisuals:true}));
}
assert.throws(()=>conceptResponse(JSON.stringify({...rich,move:'orient'}),{requireVisuals:true}), /matching drawing/);
assert.doesNotThrow(()=>conceptResponse(JSON.stringify({...lesson,beats:[{...lesson.beats[0],draw:[JSON.stringify({op:'highlight',id:'wave'})]}]}),{requireVisuals:true,currentDraw:[wave]}));
store.resetBoard();store.applyDrawCommands([panel]);store.addStudentStroke(stroke);store.applyDrawCommands([wave,equation]);
assert.equal(store.getBoardState().pageId,2);
assert.equal(store.getBoardState().groups.length,2);
assert.ok(JSON.stringify(store.getBoardState().earlierPages).includes('student'));
store.applyDrawCommands([panel]);assert.equal(store.getBoardState().pageId,3);
console.log('PASS: rich equations/geometry, streamed visual pairing, invalid/stale/disallowed drawing rejection, and format pagination.');
const animation={id:'motion',duration:1,shapes:[{kind:'dot',id:'particle',keyframes:[{t:0,at:{x:.2,y:.5},r:.03},{t:1,at:{x:.6,y:.5},r:.03}]}]};
const motionLesson={...lesson,visual:'animation',beats:[{...lesson.beats[0],draw:[],animation:JSON.stringify(animation)}]};
assert.doesNotThrow(()=>conceptResponse(JSON.stringify(motionLesson),{requireVisuals:true}));
assert.doesNotThrow(()=>conceptResponse(JSON.stringify({...motionLesson,beats:[{...motionLesson.beats[0],animation:'focus=particle'}]}),{requireVisuals:true,currentAnimation:animation}));
assert.throws(()=>conceptResponse(JSON.stringify({...motionLesson,beats:[{...motionLesson.beats[0],animation:'resume'}]}),{requireVisuals:true}));
console.log('PASS: rich trial animation, valid focus, and missing-scene rejection.');
