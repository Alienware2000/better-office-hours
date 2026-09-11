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
assert.ok(boardTextSize(equation, 'm') <= 0.06);
const { revealPageTarget } = load('lib/pdf/coordinates.ts');
const view = { left: 100, top: 50, width: 600, height: 700 };
assert.deepEqual(revealPageTarget(view, view, { x: .5, y: .5 }), { left: 0, top: 0 });
assert.deepEqual(revealPageTarget(view, { left: 100, top: 50, width: 1200, height: 1400 }, { x: .8, y: .8 }), { left: 660, top: 840 });
assert.deepEqual(revealPageTarget(view, { left: -500, top: -650, width: 1200, height: 1400 }, { x: .8, y: .8 }), { left: 0, top: 0 });
const { describeEvent } = load('lib/agent/events.ts');
assert.ok(describeEvent({ kind: 'pset_ready' }).includes('Silence is not a request to continue'));
assert.ok(!describeEvent({ kind: 'pset_ready' }).includes('Speak now'));
console.log('PASS: spoken SI units, variables, Unicode/LaTeX, streamed decimal integrity, visual narration boundaries, equations, and zoom-aware region scrolling.');
