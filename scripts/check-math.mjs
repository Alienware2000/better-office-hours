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
