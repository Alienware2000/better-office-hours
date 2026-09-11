import { createRequire } from 'node:module';
const external = createRequire(import.meta.url);
// Deterministic renderer checks; no model calls or running server required.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
const root = process.cwd(),
  cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const loaded = { exports: {} };
  cache.set(file, loaded);
  const js = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const require = (name) => name.startsWith('@mathjax/') ? external(name) :
    load(
      (name.startsWith("@/")
        ? path.join(root, name.slice(2))
        : path.resolve(path.dirname(file), name)) + ".ts",
    );
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, {
    filename: file,
  })(require, loaded, loaded.exports);
  return loaded.exports;
}

const {validateAnimation,animationFrame}=load('lib/whiteboard/animation.ts');
const {composeDiagram}=load('lib/whiteboard/diagram-compose.ts');
const {interpretCommand}=load('lib/whiteboard/geometry.ts');
const {writingBounds}=load('lib/whiteboard/writing.ts');
const {labelsOverlap}=load('lib/whiteboard/diagram-layout.ts');
const store=load('lib/whiteboard/store.ts');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const at=t=>({x:.22+.12*t,y:.58-.2*t+.1*t*t});
const vector={op:'arrow',id:'vector',from:{x:0,y:0},to:{x:.22,y:-.2},label:'v',diagram:{attach:{to:'node',anchor:'center'},labelSide:'left'}};
const component=axis=>({op:'arrow',id:'part-'+axis,from:{x:0,y:0},to:{x:0,y:0},label:'v_'+axis,diagram:{component:{of:'vector',axis}}});
const commands=[{op:'circle',id:'node',center:at(0),r:.035,label:'body',diagram:{fill:'tint'}},vector,component('x'),component('y')];
const staticGroups=composeDiagram(commands.map(c=>interpretCommand(c,0).group));
assert.ok(staticGroups.every(g=>!g.unresolved));
const vectorPoints=staticGroups[1].geometry[0],xPoints=staticGroups[2].geometry[0],yPoints=staticGroups[3].geometry[0];
assert.deepEqual(xPoints[0],vectorPoints[0]);assert.deepEqual(yPoints[0],vectorPoints[0]);close(xPoints[1].x,vectorPoints[1].x);close(yPoints[1].y,vectorPoints[1].y);
const spec={id:'motion',duration:2,shapes:[
 {kind:'dot',id:'node',label:'body',keyframes:[0,1,2].map(t=>({t,at:at(t),r:.035}))},
 {kind:'arrow',id:'vector',label:'v',diagram:vector.diagram,keyframes:[0,1,2].map(t=>({t,from:{x:0,y:0},to:{x:.22,y:-.2+.2*t}}))},
 ...['x','y'].map(axis=>({kind:'arrow',id:'part-'+axis,label:'v_'+axis,diagram:component(axis).diagram,keyframes:[{t:0,from:{x:0,y:0},to:{x:0,y:0}}]}))
]};
assert.ok(validateAnimation(spec));
for(const bad of [
 {...spec,shapes:spec.shapes.map(s=>s.id==='vector'?{...s,diagram:{attach:{to:'missing',anchor:'center'}}}:s)},
 {...spec,shapes:spec.shapes.map(s=>s.id==='vector'?{...s,diagram:{component:{of:'part-x',axis:'x'}}}:s)},
 {...spec,shapes:spec.shapes.map(s=>s.id==='part-x'?{...s,diagram:{component:{of:'node',axis:'x'}}}:s)}
])assert.equal(validateAnimation(bad),null,'Bad references and cycles cannot animate');
assert.equal(validateAnimation({...spec,shapes:[{kind:'path',id:'bad-progress',points:[at(0),at(2)],keyframes:[{t:0,drawn:4}]}]}),null,'Point counts are not normalized path progress');
const ink=[{points:[{x:.1,y:.85},{x:.9,y:.85}]}], backdrop=[];
for(let t=0;t<=2;t+=.125){
 const groups=animationFrame(spec,t,backdrop,ink).groups;
 const [body,v,x,y]=groups;
 const center={x:body.geometry[0][0].x-.035,y:body.geometry[0][0].y};
 for(const g of [v,x,y]){close(g.geometry[0][0].x,center.x);close(g.geometry[0][0].y,center.y);}
 close(x.geometry[0][1].x,v.geometry[0][1].x);close(x.geometry[0][1].y,center.y);
 close(y.geometry[0][1].y,v.geometry[0][1].y);close(y.geometry[0][1].x,center.x);
 const labels=groups.flatMap(g=>g.drawables.filter(m=>m.kind==='text'));
 for(const m of labels){assert.equal(m.fontSize,.038);if(m.text.startsWith('v')){assert.ok(m.mathDrawing);assert.ok(m.mathDrawing.paths.every(p=>p.color===m.color),'Symbol label color matches its vector');}}
 for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)assert.ok(!labelsOverlap(writingBounds(labels[i]),writingBounds(labels[j])),`Labels overlap at ${t}: ${labels[i].text}, ${labels[j].text}`);
 assert.deepEqual(animationFrame(spec,t,backdrop,ink).groups,groups,'Scrubbing is deterministic');
}
store.resetBoard();store.applyDrawCommands(commands);store.addStudentStroke({id:'student',tool:'pen',color:'blue',points:ink[0].points});
assert.ok(store.loadAnimation({...spec,shapes:spec.shapes.map(s=>({...s,diagram:undefined}))}));
const state=store.getBoardState();assert.equal(state.pageId,1);assert.equal(state.student.length,1);
assert.deepEqual(state.animation.shapes[1].diagram.attach,vector.diagram.attach,'Static attachments survive the transition into motion');
assert.deepEqual(state.animation.shapes[2].diagram.component,component('x').diagram.component);
assert.equal(state.groups.length,0,'Animated counterparts replace the static vectors');
console.log('PASS: exact moving origins/projections, positive/zero/negative components, compact math, stable non-overlapping labels, invalid references, static inheritance, continuity, and student ink.');

// A moved annotation remains associated with its vector through a thin leader.
const {annotationDrawables}=load('lib/whiteboard/diagram-layout.ts');
const mark={kind:'text',key:'label',text:'v_x',size:'s',fontSize:.038,color:'#b95832',at:{x:.5,y:.5},labelAnchor:{x:.5,y:.45}};
const linked=annotationDrawables(mark,{...mark,at:{x:.65,y:.6}});
assert.equal(linked[0].annotation,true);assert.equal(linked[1].text,'v_x');assert.ok(!linked[0].d.includes('Z'));
const t0=performance.now();for(let i=0;i<100;i++)animationFrame(spec,2*i/100,backdrop,ink);
console.log(`Cached animation sampling: ${((performance.now()-t0)/100).toFixed(2)} ms/frame (local deterministic fixture).`);
