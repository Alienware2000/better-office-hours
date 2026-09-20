import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const external=createRequire(import.meta.url), cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const mod={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(name=>name.startsWith('@mathjax/')?external(name):load((name.startsWith('@/')?path.resolve(name.slice(2)):path.resolve(path.dirname(file),name))+'.ts'),mod,mod.exports);cache.set(file,mod.exports);return mod.exports;}
const {typesetMath}=load('lib/whiteboard/math-layout.ts');
const {layoutWriting,writingBounds}=load('lib/whiteboard/writing.ts');
const {interpretCommand}=load('lib/whiteboard/geometry.ts');
const {parseAgentTurn}=load('lib/agent/tags.ts');
const ink='#292621';
const examples=[String.raw`v^{2}=v_{0}^{2}+2a\Delta y`,String.raw`\frac{\Delta x}{\Delta t}`,String.raw`r=\sqrt{x^{2}+y^{2}}`,String.raw`\vec{v}_{0}`,String.raw`\int_{0}^{t}a(\tau)\,d\tau`,String.raw`\begin{aligned}u&=0\\a&=3\,\mathrm{m/s^{2}}\\s&=?\end{aligned}`,String.raw`\begin{pmatrix}a&b\\c&d\end{pmatrix}`];
for(const text of examples){const formula=typesetMath(text,ink);assert.ok(formula?.paths.length,text);assert.ok(formula.ascent>0&&formula.width>0);assert.ok(formula.paths.every(p=>p.d&&p.matrix.every(Number.isFinite)));}
assert.deepEqual(typesetMath('v^2 = v0^2 + 2aΔy',ink),typesetMath(examples[0],ink),'Previously stored ASCII notation also typesets correctly');
const fraction=typesetMath(examples[1],ink),plain=typesetMath('v = u',ink);assert.ok(fraction.ascent+fraction.descent>plain.ascent+plain.descent,'Fractions reserve numerator and denominator height');
assert.ok(typesetMath(examples[5],ink).ascent+typesetMath(examples[5],ink).descent>3,'Aligned rows retain their full height');
assert.deepEqual(typesetMath('v² = v₀² + 2aΔy',ink),typesetMath(examples[0],ink),'Legacy Unicode and LaTeX share the same mathematical layout');
for(const text of [String.raw`\frac{x}{`,String.raw`\href{https://example.com}{x}`,String.raw`\require{html}`,String.raw`\htmlClass{hidden}{x}`])assert.equal(typesetMath(text,ink),null,'Malformed or unsupported commands cannot add HTML, links, or packages');
const groups=[];
for(const [i,text] of [examples[1],examples[2],examples[5]].entries()){
 const group=layoutWriting(interpretCommand({op:'text',id:'eq-'+i,text,at:{x:.5,y:.24},size:'s'},i).group,groups,[]);assert.ok(group,'Math finds space without clipping');groups.push(group);
 const mark=group.drawables[0];assert.ok(mark.mathDrawing,'Math is resolved before rendering/capture: '+text);const box=writingBounds(mark);assert.ok(box.left>=.05&&box.right<=.95&&box.top>=.05&&box.bottom<=.95);
 for(const other of groups.slice(0,-1).flatMap(g=>g.drawables)){const b=writingBounds(other);assert.ok(box.bottom<=b.top||b.bottom<=box.top,'Tall formulas cannot overlap adjacent notes');}
}
for(const text of examples.slice(0,3)){const draw=`[DRAW ${JSON.stringify({op:'text',id:'eq',text,at:{x:.5,y:.3}})}]`;assert.equal(parseAgentTurn('[TEACH move=elicit visual=none]'+draw).board?.commands.length??0,0,'LaTeX cannot bypass elicitation');assert.equal(parseAgentTurn('[TEACH move=hint visual=notes]'+draw).board.commands[0].text,text);}
console.log('PASS: real MathJax fractions, roots, indices, vectors, integrals, alignments, matrices, Unicode compatibility, safe fallback, measured math spacing, and LaTeX teaching boundaries.');

const {isMathNotation}=load('lib/whiteboard/math-source.ts');
for(const text of ['v_x','v_y','x^2','θ',String.raw`\theta`]) {
 assert.ok(isMathNotation(text),text);
 const group=layoutWriting(interpretCommand({op:'text',id:'symbol',text,at:{x:.5,y:.5}},0).group,[],[]);
 assert.ok(group.drawables[0].mathDrawing,'Symbol is rendered through MathJax');
 assert.equal(group.drawables[0].fontSize,.038,'A symbol is a compact label, not an equation row');
}
for(const text of ['ball','launch speed','current_page','ice cream'])assert.equal(isMathNotation(text),false,'Ordinary labels stay prose');
console.log('PASS: compact TeX/Unicode labels render as math without changing prose or equation sizing.');
for (const text of ['line pattern = element fingerprint', 'mass = density × volume', 'concentration ≥ outside concentration', 'speed = 5 metres per second']) {
 assert.equal(isMathNotation(text),false,'A relation between phrases is prose: '+text);
 const group=layoutWriting(interpretCommand({op:'text',id:'note-prose',text,at:{x:.5,y:.3}},0).group,[],[]);
 assert.ok(group.drawables.every(mark=>!mark.math&&!mark.mathDrawing),'Prose keeps its spaces and ordinary lettering');
}
for(const text of ['F = ma','v² = v₀² + 2aΔy','x ≈ 3','sin(x) = 0',String.raw`E_{\text{photon}} = E_{\text{upper}} - E_{\text{lower}}`]) assert.ok(isMathNotation(text),'Symbolic equations still typeset: '+text);
console.log('PASS: relation signs inside prose preserve ordinary text; symbolic equations and explicit LaTeX remain math.');

for (const text of [String.raw`what else touches or pulls m_{2}?`, String.raw`What else touches or pulls $m_2$?`, 'what else touches or pulls m₂?', String.raw`Compare m_{1} and m_{2}`, String.raw`line pattern = element fingerprint`]) {
 assert.equal(isMathNotation(text), false, 'Inline symbols do not turn prose into an equation');
 const group = layoutWriting(interpretCommand({op:'text',id:'note-question',text,at:{x:.5,y:.7}},0).group,[],[]);
 assert.ok(group.drawables.every(mark => !mark.math && !mark.mathDrawing), 'Questions use ordinary text');
 const rendered = group.drawables.map(mark => mark.text).join(' ');
 assert.ok(rendered.includes(' '), 'Prose retains word spaces');
 if (text.includes('pulls')) assert.equal(rendered, text.startsWith('What') ? 'What else touches or pulls m₂?' : 'what else touches or pulls m₂?');
}
console.log('PASS: inline numeric TeX subscripts retain readable, spaced prose without mathematical word coloring.');

for (const text of [String.raw`m_{2} is up`, String.raw`T for m_{2}`, String.raw`m_{1} and m_{2}`]) {
 assert.equal(isMathNotation(text), false, 'Short prose stays prose: '+text);
 const marks=layoutWriting(interpretCommand({op:'text',id:'note-short',text,at:{x:.5,y:.5}},0).group,[],[]).drawables;
 assert.ok(marks.every(m=>!m.math&&!m.mathDrawing));
 assert.ok(marks.map(m=>m.text).join(' ').includes(' '));
}
for (const color of [ink,'#b95832','#347ac5']) {
 for (const text of examples) assert.ok(typesetMath(text,color).paths.every(p=>p.color===color), 'Only authored equation color is used');
}
console.log('PASS: short prose retains spaces; neutral math and explicit emphasis use the authored color throughout.');
