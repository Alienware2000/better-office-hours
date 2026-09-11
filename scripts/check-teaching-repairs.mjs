import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
function load(file) {
  const loaded = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, { filename: file })(name =>
    load((name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(path.dirname(file), name)) + '.ts'), loaded, loaded.exports);
  return loaded.exports;
}
const { normalizeSpokenText: speak } = load('lib/agent/spoken-text.ts');
for (const [written, spoken] of [
  ['9.8 m/s²', '9.8 meters per second squared'],
  ['12 m/s', '12 meters per second'],
  ['3 m s⁻²', '3 meters per second squared'],
  ['4 km/h', '4 kilometers per hour'],
  ['2 kg and 5 N', '2 kilograms and 5 newtons'],
  ['1 m', '1 meter'],
  ['m = 2 kg', 'm equals 2 kilograms'],
  ['g = -9.8 m/s^2', 'g equals negative 9.8 meters per second squared'],
  ['v₀ = 5 m/s', 'v sub zero equals 5 meters per second'],
  ['θ = 30°', 'theta equals 30 degrees'],
  ['Wait—look here.', 'Wait, look here.'],
  ['\\frac{m}{s^2}', 'meters per second squared'],
  ['\\frac{cm}{s^{2}}', 'centimeters per second squared'],
]) assert.equal(speak(written), spoken, written);
assert.equal(speak('I am working on momentum.'), 'I am working on momentum.');
const { takeSpeechChunks, visualBeats, parseAgentTurn } = load('lib/agent/tags.ts');
const response = 'Notice this. Its speed is 9.8 m/s. Hold that thought. What do you predict?';
let emitted = 0;
const parts = [];
for (let end = 1; end <= response.length; end++) {
  let next = takeSpeechChunks(response.slice(0, end).trim(), emitted);
  while (next.chunk) {
    parts.push(next.chunk); emitted = next.consumed;
    next = takeSpeechChunks(response.slice(0, end).trim(), emitted);
  }
}
parts.push(response.slice(emitted).trim());
assert.equal(parts.join(' '), response, 'Streaming must not lose characters or cut decimals');
assert.equal(parts.length, 4);
const raw = 'Here is the relation. [BOARD open][DRAW {"op":"text","id":"eq","at":{"x":0.5,"y":0.3},"text":"F = ma"}] What changes?';
assert.equal(visualBeats(raw).length, 2);
assert.equal(visualBeats(raw)[1].speechBefore, 'Here is the relation.');
assert.equal(visualBeats(raw)[1].turn.board.commands[0].text, 'F = ma');
assert.equal(visualBeats('Look. [DRAW {"op":"text"').length, 0);
assert.equal(parseAgentTurn(raw).speech, 'Here is the relation. What changes?');
const targets = visualBeats('[POINT page=1 x=0.2 y=0.3] [HIGHLIGHT page=2 x=0.1 y=0.6 w=0.2 h=0.1] [BOARD open]');
assert.ok(targets[0].turn.pointer);
assert.equal(targets[1].turn.pointer, undefined);
assert.equal(targets[2].turn.highlight, undefined);
const { detectMode } = load('lib/agent/intent.ts');
assert.equal(detectMode('Can we switch topic?', 'pset'), 'concept');
const { boardLabel, boardTextSize } = load('lib/whiteboard/style.ts');
const equation = 'Δx = v₀ t + ½ a t²';
assert.equal(boardLabel(equation), equation, 'Do not silently truncate equations to six words');
assert.ok(boardTextSize(equation, 'm') * equation.length * .56 <= .94, 'Equation fits within paper margins');
const { revealPageTarget } = load('lib/pdf/coordinates.ts');
const view = { left: 100, top: 50, width: 600, height: 700 };
assert.deepEqual(revealPageTarget(view, view, { x: .5, y: .5 }), { left: 0, top: 0 });
assert.deepEqual(revealPageTarget(view, { left: 100, top: 50, width: 1200, height: 1400 }, { x: .8, y: .8 }), { left: 660, top: 840 });
assert.deepEqual(revealPageTarget(view, { left: -500, top: -650, width: 1200, height: 1400 }, { x: .8, y: .8 }), { left: 0, top: 0 });
const { describeEvent } = load('lib/agent/events.ts');
assert.ok(describeEvent({ kind: 'pset_ready' }).includes('Silence is not a request to continue'));
assert.ok(!describeEvent({ kind: 'pset_ready' }).includes('Speak now'));
console.log('PASS: spoken SI units, variables, Unicode/LaTeX, streamed decimal integrity, visual narration boundaries, equations, and zoom-aware region scrolling.');

const { isSpeechFrame } = load('app/(session)/voice/speech-detector.ts');
assert.equal(isSpeechFrame(.05, false, false), false, 'Non-speech probability never starts recording');
assert.equal(isSpeechFrame(.7, false, false), true);
assert.equal(isSpeechFrame(.4, true, false), true, 'Retain quieter syllables in a confirmed turn');
assert.equal(isSpeechFrame(.7, false, true), false, 'Playback interruption needs stronger speech evidence');
const { withRequestTimeout } = load('app/(session)/voice/request-timeout.ts');
await assert.rejects(withRequestTimeout(undefined, 5, 'Timed out', async () => new Promise(() => {})), /Timed out/);
const abort = new AbortController();
const waiting = withRequestTimeout(abort.signal, 10000, 'Timed out', async () => new Promise(() => {}));
abort.abort();
await assert.rejects(waiting, { name: 'AbortError' });
assert.equal(await withRequestTimeout(undefined, 1000, 'Timed out', async () => 'ready'), 'ready');
console.log('PASS: speech-probability gates, stalled-request timeout, cancellation, and successful request cleanup.');

const { textRuns, isMathText } = load('lib/whiteboard/text.ts');
const { boardStyle } = load('lib/whiteboard/style.ts');
const eqRuns = textRuns('v₀ = u + a t', boardStyle.colors.ink);
assert.equal(eqRuns.map(r => r.text).join(''), 'v₀ = u + a t');
assert.equal(eqRuns.find(r => r.text === 'v₀').color, textRuns('v₀ = ?', boardStyle.colors.ink)[0].color);
assert.equal(textRuns('u = ?', boardStyle.colors.accent).length, 1, 'Explicit emphasis is preserved');
assert.ok(isMathText('x² + y² = r²'));
const { textRegions, detectQuestionRegions } = load('lib/pdf/questions.ts');
const textItem = {str:'1. An object moves', x:100,y:200,w:300,h:20,pageWidth:1000,pageHeight:1400};
assert.equal(detectQuestionRegions([textItem])[0].label, '1');
const scaled = Object.fromEntries(Object.entries(textItem).map(([k,v])=>[k,typeof v === 'number'?v*2:v]));
assert.deepEqual(textRegions([textItem]), textRegions([scaled]), 'PDF anchors are invariant under rasterization scale');
assert.equal(detectQuestionRegions([{...textItem,str:'600'}]).length,0,'A numeric given is not a question heading');
console.log('PASS: colored symbolic runs preserve content, explicit emphasis, and measured PDF anchors stay scale invariant.');

const { isPutAwayPsetPhrase } = load('app/(session)/voice/speech.ts');
assert.equal(isPutAwayPsetPhrase('Do not remove the PDF'), false);
assert.equal(isPutAwayPsetPhrase('The rocket will take off in this question'), false);
assert.equal(isPutAwayPsetPhrase('Remove the PDF'), true);
assert.equal(boardLabel('u start v later a constant s displacement'), 'u start v later a constant s displacement');

const { layoutWriting, writingBounds } = load('lib/whiteboard/writing.ts');
const { interpretCommand } = load('lib/whiteboard/geometry.ts');
const writing = (id,text,y,size='s') => interpretCommand({op:'text',id,text,at:{x:.4,y},size},1).group;
const eq = layoutWriting(writing('equation','v² = u² + 2 a s',.25,'m'),[],[]);
const givens = layoutWriting(writing('givens','u = 0, a = +3 m/s², s = 600 m',.45),[eq],[]);
const nextLine = layoutWriting(writing('next','after fail: a = ? v_top = ?',.45,'m'),[eq,givens],[]);
assert.ok(givens.drawables.length > 1,'Long writing wraps instead of shrinking');
const all = [eq,givens,nextLine].flatMap(g=>g.drawables);
for (const mark of all) {
  assert.ok(mark.fontSize >= .068,'Standalone writing retains readable size');
  const a = writingBounds(mark);
  assert.ok(a.left >= .05 && a.right <= .95 && a.top >= .05 && a.bottom <= .95,'Writing stays on paper');
  for (const other of all.filter(m=>m!==mark)) {
    const b=writingBounds(other);
    assert.ok(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top,'Consecutive writing must not overlap');
  }
}
const replacement=layoutWriting(writing('givens','a = ?',.45),[eq,givens,nextLine],[]);
assert.equal(replacement.drawables[0].at.y,.45,'Updating a group reuses its space');
const withInk=layoutWriting(writing('ink-test','a = ?',.45),[],[{points:[{x:0,y:.35},{x:1,y:.55}]}]);
assert.ok(writingBounds(withInk.drawables[0]).top > .55,'Student ink reserves space');
assert.equal(layoutWriting(writing('full','a = ?',.45),[],[{points:[{x:0,y:0},{x:1,y:1}]}]),null,'A full board preserves existing work');
console.log('PASS: screenshot writing sequence wraps, avoids overlap, preserves size, updates IDs, and respects student ink.');

const source = {page:0,textRegions:[{label:'A given quantity',bbox:{x:.18,y:.4,w:.22,h:.02}},{label:'Another quantity',bbox:{x:.18,y:.45,w:.25,h:.02}}]};
const guided = visualBeats('[HIGHLIGHT page=1 anchor=0] Notice this quantity. [HIGHLIGHT page=1 anchor=1] Then compare this one.', source);
assert.deepEqual(guided[0].turn.highlight.bbox,source.textRegions[0].bbox);
assert.deepEqual(guided[1].turn.highlight.bbox,source.textRegions[1].bbox);
assert.equal(guided[1].speechBefore,'Notice this quantity.');
for (const tag of ['[HIGHLIGHT page=2 anchor=0]','[HIGHLIGHT page=1 anchor=99]','[HIGHLIGHT page=1 anchor=-1]','[HIGHLIGHT page=1 anchor=0.5]']) assert.equal(parseAgentTurn(tag,source).highlight,undefined,'Unresolvable anchor cannot point at guessed coordinates');
assert.equal(parseAgentTurn('[HIGHLIGHT page=1 anchor=0]').highlight,undefined);
const topic = layoutWriting(writing('topic','Constant acceleration',.13),[],[]);
const note1 = layoutWriting(writing('given-1','a = +3 m/s²',.45),[topic],[]);
const note2 = layoutWriting(writing('given-2','s = 600 m',.58),[topic,note1],[]);
assert.ok(topic.drawables[0].heading);
assert.equal(note1.drawables[0].textAnchor,'start');
assert.equal(note1.drawables[0].at.x,note2.drawables[0].at.x,'Given quantities form aligned note rows');
console.log('PASS: measured anchor IDs, invalid/page-mismatched targets, ordered highlight beats, and aligned note hierarchy.');
