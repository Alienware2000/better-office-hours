// Synthetic protocol/rendering evidence only. This cannot show which
// representation a real model chooses or establish teaching quality.
import assert from 'node:assert/strict';
import { renderReview, repositoryModule } from './evaluation/render.mjs';

const { conceptProgress, conceptResponse } = repositoryModule('lib/agent/concept-response');
const { parseAgentTurn, visualBeats } = repositoryModule('lib/agent/tags');
const { writingBounds } = repositoryModule('lib/whiteboard/writing');
const { labelsOverlap } = repositoryModule('lib/whiteboard/diagram-layout');
const store = repositoryModule('lib/whiteboard/store');
const matrix = rows => String.raw`\left[\begin{array}{${'c'.repeat(rows[0].length - 1)}|c}${rows.map(row => row.join('&')).join('\\\\')}\end{array}\right]`;
const write = (id, text, y, size = 'm') => ({ op: 'text', id, text, at: { x: .5, y }, size });
const cases = [
  { before: [[1, 1, 3], [2, -1, 0]], after: [[1, 1, 3], [0, -3, -6]] },
  { before: [[1, 1, 1, 6], [2, -1, 1, 3], [1, 2, -1, 2]], after: [[1, 1, 1, 6], [0, -3, -1, -9], [1, 2, -1, 2]] },
];
const measuredHeights = [];
for (const example of cases) {
  assert.deepEqual(example.before[1].map((value, column) => value - 2 * example.before[0][column]), example.after[1], 'The synthetic row operation is arithmetically valid');
  const before = write('before', matrix(example.before), .32);
  const operation = write('operation', String.raw`R_{2}\leftarrow R_{2}-2R_{1}`, .54);
  const after = write('after', matrix(example.after), .77);
  const beat = (draw, speech) => ({ pdf: '', draw: draw.map(command => JSON.stringify(command)), animation: '', speech });
  const lesson = { handoff: false, move: 'explain', visual: 'notes', introduction: '', beats: [
    beat([write('topic', 'An equivalent system', .12, 's'), before], 'Each row represents one equation. The numbers after the bar are its constants, and the other columns keep the variable coefficients in the same order.'),
    beat([operation], 'Replace the second row by that row minus twice the first row. Apply this operation to every entry, including the constant, so the first coefficient becomes zero.'),
    beat([after], 'The new second row is easier to use because one variable has disappeared from it. This operation keeps exactly the same solutions: adding twice the first row back recovers the original equation.'),
  ], question: '' };
  const raw = JSON.stringify(lesson);
  const expectedSpeech = lesson.beats.map(item => item.speech).join(' ');
  const expectedText = new Map([before, operation, after].map(command => [command.id, command.text]));
  let emitted = '', firstMatrixAt = null, firstMatrixSpeech = '';
  for (let end = 1; end <= raw.length; end++) {
    const next = conceptProgress(raw.slice(0, end), { requireVisuals: true });
    assert.ok(next.startsWith(emitted), 'Streaming must not retract or repeat accepted content');
    emitted = next;
    const accepted = parseAgentTurn(next);
    for (const command of accepted.board?.commands ?? []) {
      if (expectedText.has(command.id)) assert.equal(command.text, expectedText.get(command.id), 'Only complete JSON-escaped mathematical structures are released');
    }
    if (firstMatrixAt === null && accepted.board?.commands.some(command => command.id === 'before')) {
      firstMatrixAt = end;
      firstMatrixSpeech = accepted.speech;
    }
  }
  assert.ok(firstMatrixAt < raw.indexOf('Replace the second row'), 'The first visual is released before the next explanation beat finishes');
  assert.equal(firstMatrixSpeech, lesson.beats[0].speech);
  const complete = conceptResponse(raw, { requireVisuals: true });
  const turn = parseAgentTurn(complete);
  assert.equal(turn.speech, expectedSpeech, 'All explanatory sentences survive without a word or sentence cap');
  assert.equal(turn.teaching.move, 'explain');
  assert.equal(turn.teaching.visual, 'notes', 'A mathematical structure can be the main visual without invented geometry');
  for (const command of turn.board.commands.filter(command => expectedText.has(command.id))) assert.equal(command.text, expectedText.get(command.id));
  const releases = visualBeats(complete);
  assert.equal(releases.find(item => item.turn.board?.commands.some(command => command.id === 'before')).speechBefore, '');
  assert.equal(releases.find(item => item.turn.board?.commands.some(command => command.id === 'after')).speechBefore, lesson.beats.slice(0, 2).map(item => item.speech).join(' '));
  const review = renderReview({ case: 'synthetic-structured-math', appParsed: true, rawContent: raw });
  assert.equal(review.pages.length, 1, 'Two compact augmented arrays and their row operation share one readable page');
  assert.equal(review.warnings.length, 0);
  assert.ok(!/NaN|Infinity/.test(review.pages[0].svg));
  const state = store.getBoardState();
  const marks = state.groups.flatMap(group => group.drawables.filter(mark => mark.kind === 'text'));
  for (const [id, source] of expectedText) {
    const group = state.groups.find(item => item.id === id);
    assert.ok(group, `Preserve the primary visual ${id}`);
    assert.equal(group.drawables.length, 1, 'A matrix stays one mathematical structure, not broken prose rows');
    const mark = group.drawables[0];
    assert.equal(mark.text, source);
    assert.ok(mark.mathDrawing?.paths.length, 'Structured notation uses actual MathJax glyph geometry');
    assert.ok(mark.fontSize >= .04, 'Primary mathematical notation stays readable');
    const box = writingBounds(mark);
    assert.ok(box.left >= .055 - 1e-8 && box.right <= .945 + 1e-8 && box.top >= .055 - 1e-8 && box.bottom <= .945 + 1e-8, 'Actual mathematical bounds stay on paper');
    if (id === 'before') measuredHeights.push(mark.mathDrawing.ascent + mark.mathDrawing.descent);
  }
  for (let i = 0; i < marks.length; i++) for (let j = i + 1; j < marks.length; j++) assert.ok(!labelsOverlap(writingBounds(marks[i]), writingBounds(marks[j])), 'Matrices, row operation and heading do not collide');
}
assert.ok(measuredHeights[1] > measuredHeights[0], 'Three rows reserve more actual glyph height than two');
console.log('PASS: two/three-row augmented arrays as primary visuals, complete multi-sentence narration, escaped incremental JSON, synchronized visual beats, readable row operations and resulting matrices.');
