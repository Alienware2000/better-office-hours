import { createRequire } from 'node:module';
const external = createRequire(import.meta.url);
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const mod={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(name=>name.startsWith('@mathjax/') ? external(name) : load((name.startsWith('@/')?path.resolve(name.slice(2)):path.resolve(path.dirname(file),name))+'.ts'),mod,mod.exports);cache.set(file,mod.exports);return mod.exports;}
const {parseAgentTurn,visualBeats}=load('lib/agent/tags.ts');
const {isRelationship,needsBoardRepair}=load('lib/agent/teaching-intent.ts');
const draw=command=>`[DRAW ${JSON.stringify(command)}]`;
const relation={op:'text',id:'relation',at:{x:.5,y:.3},text:'v² = v₀² + 2aΔy'};
const given={op:'text',id:'given-1',at:{x:.5,y:.5},text:'a = +3 m/s²'};
for(const text of ['v² = v₀² + 2aΔy','y = mx + b','P(A|B) = P(A∩B)/P(B)','v² = 2as','F = ma','u² + 2as','∫f(x)dx'])assert.ok(isRelationship(text),text);
for(const text of ['v₀ = 0','Δy = 600 m','a = -9.81 m/s²','v = ?','θ = 30°','engine off','input','output'])assert.ok(!isRelationship(text),text);
for(const move of ['elicit','orient']){
 const raw=`[TEACH move=${move} visual=notes] Which relationship would help? ${draw(relation)}${draw(given)}`;
 const turn=parseAgentTurn(raw);
 assert.equal(turn.speech,'Which relationship would help?');
 assert.deepEqual(turn.board.commands,[given],'The screenshot recall question cannot reveal its target');
 assert.ok(visualBeats(raw).every(beat=>!beat.turn.board?.commands.some(c=>c.id==='relation')),'No early stream beat leaks the relation');
}
for(const move of ['hint','consolidate','explain'])assert.equal(parseAgentTurn(`[TEACH move=${move} visual=notes]${draw(relation)}`).board.commands[0].text,relation.text,'Contingent teaching and checked student work can show notation');
for(const prefix of ['', '[TEACH move=unknown visual=notes]', 'Which equation? [TEACH move=explain visual=notes]','[TEACH move=elicit visual=none][TEACH move=explain visual=notes]'])assert.equal(parseAgentTurn(prefix+draw(relation)).board?.commands.length??0,0,'Missing, malformed, late, or duplicate metadata cannot authorize a reveal');
const repaired=parseAgentTurn('[TEACH move=explain visual=notes]'+draw(relation)+draw(given),null,{move:'orient',visual:'diagram'});
assert.deepEqual(repaired.board.commands,[given],'Repair cannot promote itself to a new hint');
const geometry={op:'arrow',id:'direction',from:{x:.3,y:.4},to:{x:.6,y:.4},label:'F = ma'};
assert.equal(parseAgentTurn('[TEACH move=elicit visual=diagram]'+draw(geometry)).board.commands[0].label,undefined,'An arrow label cannot bypass the disclosure boundary');
const animation={id:'test',duration:1,shapes:[{kind:'text',id:'equation',text:'F = ma',keyframes:[{t:0,at:{x:.3,y:.3}}]},{kind:'dot',id:'body',label:'F = ma',keyframes:[{t:0,at:{x:.5,y:.4},r:.02}]}]};
const anim=parseAgentTurn(`[TEACH move=orient visual=animation][ANIM ${JSON.stringify(animation)}]`).board.animation;
assert.equal(anim.shapes.length,1);assert.equal(anim.shapes[0].label,undefined);
assert.ok(!needsBoardRepair(parseAgentTurn('[TEACH move=elicit visual=none] Which relationship?')));
assert.ok(!needsBoardRepair(parseAgentTurn('[TEACH move=consolidate visual=none] That sign matches your chosen direction.')));
for (const move of ['orient','explain']) assert.ok(needsBoardRepair(parseAgentTurn(`[TEACH move=${move} visual=none] Let us look at the setup.`)), 'Explanation needs a visual even when the model omits it');
const focused = parseAgentTurn('[TEACH move=explain visual=diagram][DRAW {"op":"highlight","id":"existing-object"}] Look at this part.');
assert.ok(!needsBoardRepair(focused, null, ['existing-object']), 'Emphasizing the current picture does not generate a replacement');
assert.ok(needsBoardRepair(focused, null, ['other-object']), 'Unknown focus targets still need repair');
assert.ok(!needsBoardRepair(parseAgentTurn('Can you picture this?')), 'Speech words never trigger repairs');
assert.ok(needsBoardRepair(parseAgentTurn('[TEACH move=orient visual=diagram]'+draw(given))));
assert.ok(!needsBoardRepair(parseAgentTurn('[TEACH move=orient visual=diagram]'+draw(geometry))));
assert.ok(needsBoardRepair(parseAgentTurn('[TEACH move=hint visual=notes] The requested reminder.')));
assert.ok(!needsBoardRepair(parseAgentTurn('[TEACH move=hint visual=notes]'+draw(relation))));
console.log('PASS: elicitation and orientation withhold equations in streamed notes and diagram/animation labels; hints and checked work can show them; silent recovery inherits the teaching move without phrase triggers.');

const {interpretCommand}=load('lib/whiteboard/geometry.ts');
const {layoutDiagram,crossesLabel}=load('lib/whiteboard/diagram-layout.ts');
const {writingBounds}=load('lib/whiteboard/writing.ts');
// Reproductions from live generated traces, never runtime scene templates.
const scenes=[
 [{op:'line',id:'string',from:{x:.5,y:.15},to:{x:.5,y:.55}},{op:'circle',id:'bob',center:{x:.5,y:.6},r:.05},{op:'text',id:'support',at:{x:.5,y:.1},text:'fixed support'},{op:'arrow',id:'motion',from:{x:.65,y:.6},to:{x:.35,y:.6},label:'swing'},{op:'text',id:'caption',at:{x:.5,y:.8},text:'bob swings side to side'}],
 [{op:'line',id:'ground',from:{x:.28,y:.62},to:{x:.72,y:.62}},{op:'arrow',id:'reference',from:{x:.5,y:.62},to:{x:.5,y:.22},label:'up'},{op:'circle',id:'body',center:{x:.5,y:.4},r:.025},{op:'text',id:'state',at:{x:.72,y:.4},text:'engine off'},{op:'arrow',id:'velocity',from:{x:.5,y:.4},to:{x:.5,y:.26},label:'v'}],
];
for(const scene of scenes){
 const groups=scene.map((command,i)=>interpretCommand(command,i).group);
 const ink=[{points:[{x:.65,y:.39},{x:.85,y:.39}]}];
 const placed=layoutDiagram(groups,ink);
 assert.deepEqual(placed.map(g=>g.geometry),groups.map(g=>g.geometry),'Annotation layout never moves physical geometry');
 assert.deepEqual(layoutDiagram(placed,ink),placed,'Unchanged diagrams do not jitter or drift on repeated layout');
 const labels=placed.flatMap(g=>g.drawables.filter(m=>m.kind==='text'));
 const traces=[...placed.flatMap(g=>g.geometry??[]),...ink.map(i=>i.points)];
 for(const label of labels){
  const box=writingBounds(label);assert.ok(box.left>=.04&&box.right<=.96&&box.top>=.04&&box.bottom<=.96);
  assert.equal(label.fontSize,.038,'Diagram annotation has its own consistent readable scale');
  for(const points of traces)for(let i=1;i<points.length;i++)assert.ok(!crossesLabel(points[i-1],points[i],box),`${label.text} clears diagram and ink`);
  for(const other of labels.filter(m=>m!==label)){const b=writingBounds(other);assert.ok(box.right<=b.left||b.right<=box.left||box.bottom<=b.top||b.bottom<=box.top,'Labels do not collide');}
 }
}
console.log('PASS: real generated rocket/pendulum annotations stay on paper, clear geometry/labels/student ink, retain consistent size, and leave the physical scene unchanged.');

const {boardLabel}=load('lib/whiteboard/style.ts');
assert.equal(boardLabel('v^2 = v0^2 + 2 a Δy'), 'v² = v₀² + 2 a Δy');
assert.equal(boardLabel('a = 3 m/s^2'), 'a = 3 m/s²');
assert.equal(boardLabel('factorial3 returns'), 'factorial3 returns');
const {layoutWriting}=load('lib/whiteboard/writing.ts');
const rows=layoutWriting(interpretCommand({op:'text',id:'given-1',at:{x:.08,y:.22},text:'v0 = 0, a = +3 m/s^2, Δy = 600 m'},0).group,[],[]);
assert.deepEqual(rows.drawables.map(m=>m.text),['v₀ = 0','a = +3 m/s²','Δy = 600 m']);
assert.ok(rows.drawables.every(m=>m.at.x===rows.drawables[0].at.x));
console.log('PASS: live-model ASCII powers/subscripts normalize, and comma-separated givens become aligned rows.');
