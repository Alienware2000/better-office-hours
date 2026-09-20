// Synthetic live-store regressions. No model calls, sessions, or gallery document layout.
import assert from 'node:assert/strict';
import { renderReview, repositoryModule } from './evaluation/render.mjs';

const store = repositoryModule('lib/whiteboard/store');
const { writingBounds } = repositoryModule('lib/whiteboard/writing');
const { labelsOverlap, crossesLabel } = repositoryModule('lib/whiteboard/diagram-layout');
const { animationFrame } = repositoryModule('lib/whiteboard/animation');
const { conceptResponse } = repositoryModule('lib/agent/concept-response');
const { parseAgentTurn } = repositoryModule('lib/agent/tags');
const text = (id, value, x, y, size = 'm') => ({ op: 'text', id, text: value, at: { x, y }, size });
const marks = state => state.groups.flatMap(group => group.drawables.filter(mark => mark.kind === 'text'));
const byId = (state, id) => {
  const group = state.groups.find(group => group.id === id);
  assert.ok(group, `Expected group ${id} on the working page`);
  return group;
};
const checkMath = mark => {
  assert.ok(mark.mathDrawing?.paths.length, `Real math glyphs required: ${mark.text}`);
  assert.ok(mark.fontSize >= .04, 'Composed equation stays readable');
  const box = writingBounds(mark), tolerance = 1e-8;
  assert.ok(box.left >= .055 - tolerance && box.right <= .945 + tolerance, 'Equation fits paper width');
  assert.ok(box.top >= .055 - tolerance && box.bottom <= .945 + tolerance, 'Full math ascent/descent fits paper height');
  return box;
};
const checkTextCollisions = state => {
  const items = marks(state);
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    assert.ok(!labelsOverlap(writingBounds(items[i]), writingBounds(items[j])), `Text collision: ${items[i].text} / ${items[j].text}`);
  }
};
const checkGeometryClear = (mark, groups) => {
  const box = writingBounds(mark);
  for (const group of groups) for (const points of group.geometry ?? []) {
    for (let i = 1; i < points.length; i++) assert.ok(!crossesLabel(points[i - 1], points[i], box), `Equation intersects ${group.id}`);
  }
};

// An ordinary two-column figure followed by two matrix relations. The source
// commands are synthetic, deliberately independent of saved provider reports.
const shape = (id, left, right, label) => ({ op: 'curve', id, label, interpolation: 'linear', fill: 'tint',
  points: [{ x: left, y: .62 }, { x: right, y: .62 }, { x: right, y: .38 }, { x: left, y: .38 }, { x: left, y: .62 }] });
const diagram = [
  text('topic', 'Two basis directions', .5, .12, 's'),
  shape('original', .1, .34, 'before'),
  shape('transformed', .46, .94, 'after'),
  { op: 'arrow', id: 'basis-x', from: { x: .1, y: .62 }, to: { x: .34, y: .62 }, label: 'e_1' },
  { op: 'arrow', id: 'basis-y', from: { x: .1, y: .62 }, to: { x: .1, y: .38 }, label: 'e_2' },
  { op: 'arrow', id: 'image-x', from: { x: .46, y: .62 }, to: { x: .94, y: .62 }, label: '2e_1' },
  { op: 'arrow', id: 'image-y', from: { x: .46, y: .62 }, to: { x: .46, y: .38 }, label: 'e_2' },
];
const relations = [
  text('relation-x', String.raw`\begin{bmatrix}2&0\\0&1\end{bmatrix}\begin{bmatrix}1\\0\end{bmatrix}=\begin{bmatrix}2\\0\end{bmatrix}`, .3, .8),
  text('relation-y', String.raw`\begin{bmatrix}2&0\\0&1\end{bmatrix}\begin{bmatrix}0\\1\end{bmatrix}=\begin{bmatrix}0\\1\end{bmatrix}`, .72, .8),
];
const beat = commands => ({ pdf: '', draw: commands.map(command => JSON.stringify(command)), animation: '', speech: 'Compare the marked directions.' });
const rawContent = JSON.stringify({ handoff: false, move: 'explain', visual: 'diagram', introduction: '',
  beats: [beat(diagram.slice(0, 5)), beat(diagram.slice(5)), beat(relations)], question: '' });
const parsed = parseAgentTurn(conceptResponse(rawContent, { requireVisuals: true }));
assert.equal(parsed.board.commands.length, diagram.length + relations.length, 'All synthetic teaching commands are accepted');
const review = renderReview({ case: 'synthetic-composition', appParsed: true, rawContent });
assert.equal(review.pages.length, 1, 'Two matrix relations stay with their diagram');
assert.equal(review.warnings.length, 0);
assert.ok(!/NaN|Infinity/.test(review.pages[0].svg), 'The real React drawing renderer produces finite output');
let state = store.getBoardState();
for (const relation of relations) {
  const mark = byId(state, relation.id).drawables[0];
  checkMath(mark);
  checkGeometryClear(mark, state.groups);
}
checkTextCollisions(state);

// New writing must not make already shown objects, formulas, or student ink jump.
store.resetBoard();
store.applyDrawCommands(diagram);
for (const group of store.getBoardState().groups) store.markGroupShown(group.id);
const ink = { id: 'student-note', tool: 'pen', color: 'blue', points: [{ x: .06, y: .91 }, { x: .1, y: .93 }] };
store.addStudentStroke(ink);
const initial = structuredClone(store.getBoardState());
store.applyDrawCommands([relations[0]]);
const firstRelation = structuredClone(byId(store.getBoardState(), relations[0].id));
store.markGroupShown(firstRelation.id);
store.applyDrawCommands([relations[1]]);
state = store.getBoardState();
assert.equal(state.pageId, 1);
assert.deepEqual(state.student, initial.student, 'Student ink remains exact');
for (const group of initial.groups) assert.deepEqual(byId(state, group.id), group, 'Old figure and labels remain stable in available space');
assert.deepEqual(byId(state, firstRelation.id).drawables, firstRelation.drawables, 'A later relation does not reflow the previous equation');
const beforeUpdate = structuredClone(state);
const updated = { ...relations[0], text: relations[0].text.replaceAll('2', '3') };
store.applyDrawCommands([updated]);
state = store.getBoardState();
assert.equal(state.pageId, 1, 'Updating a relation reuses its own space');
assert.equal(state.groups.filter(group => group.id === updated.id).length, 1, 'An updated ID does not duplicate its equation');
assert.deepEqual(byId(state, updated.id).drawables[0].at, byId(beforeUpdate, updated.id).drawables[0].at);
for (const group of beforeUpdate.groups.filter(group => group.id !== updated.id)) assert.deepEqual(byId(state, group.id), group);
assert.deepEqual(state.student, beforeUpdate.student);
checkTextCollisions(state);

// Dense handwritten lines leave no real equation-sized space. Continue the
// page while retaining every old group and stroke at its original coordinates.
store.resetBoard();
store.applyDrawCommands([text('topic', 'Working notes', .5, .12, 's')]);
for (let line = 0; line < 11; line++) store.addStudentStroke({ id: `line-${line}`, tool: 'pen', color: 'blue',
  points: [{ x: .06, y: .17 + line * .068 }, { x: .94, y: .213 + line * .068 }] });
const full = structuredClone(store.getBoardState());
store.applyDrawCommands([relations[0]]);
state = store.getBoardState();
assert.equal(state.pageId, 2, 'A genuinely full page continues');
assert.equal(state.earlierPages.length, 1);
assert.deepEqual(state.earlierPages[0].groups, full.groups, 'Earlier tutor notes are preserved');
assert.deepEqual(state.earlierPages[0].student, full.student, 'Full-page student ink is preserved');
assert.equal(state.student.length, 0, 'Ink stays on the page where it was written');
checkMath(byId(state, relations[0].id).drawables[0]);

// Tall math uses measured glyph height, including nested fractions and cases.
const tall = [
  String.raw`\begin{bmatrix}1&0&0&0\\0&1&0&0\\0&0&1&0\\0&0&0&1\end{bmatrix}\begin{bmatrix}x_1\\x_2\\x_3\\x_4\end{bmatrix}=\begin{bmatrix}x_1\\x_2\\x_3\\x_4\end{bmatrix}`,
  String.raw`f(x)=\begin{cases}\dfrac{x^2+1}{x-1}&x>1\\[4pt]\dfrac{1}{1+x^2}&x\leq1\end{cases}`,
];
for (const formula of tall) {
  store.resetBoard();
  store.applyDrawCommands([{ op: 'line', id: 'reference', from: { x: .12, y: .22 }, to: { x: .88, y: .22 } },
    text('tall-relation', formula, .5, .92)]);
  state = store.getBoardState();
  const mark = byId(state, 'tall-relation').drawables[0];
  assert.equal(state.pageId, 1, 'A tall relation uses clear space on its current page');
  checkMath(mark);
  checkGeometryClear(mark, state.groups);
}

// A moving object contributes the same space reservation as static geometry.
store.resetBoard();
const animation = { id: 'moving-object', duration: 2, shapes: [{ kind: 'dot', id: 'object', keyframes: [
  { t: 0, at: { x: .2, y: .35 }, r: .025 }, { t: 2, at: { x: .8, y: .55 }, r: .025 },
] }] };
assert.ok(store.loadAnimation(animation));
store.applyDrawCommands(relations);
state = store.getBoardState();
assert.equal(state.pageId, 1, 'Matrix relations remain with their animation');
assert.deepEqual(state.animation, animation, 'Writing does not modify the animation');
for (const relation of relations) {
  const mark = byId(state, relation.id).drawables[0];
  checkMath(mark);
  for (const time of [0, .5, 1, 1.5, 2]) checkGeometryClear(mark, animationFrame(animation, time).groups);
}
checkTextCollisions(state);
console.log('PASS: live parser/store matrix composition, stable existing content and updates, preserved full-page ink, tall LaTeX, and animation clearance.');
