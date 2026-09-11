import { createRequire } from 'node:module';
const external = createRequire(import.meta.url);
// Deterministic runtime checks plus a live generated ANIM through :3100.
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
const { validateAnimation, animationFrame, sampleFrames } = load(
  "lib/whiteboard/animation.ts",
);
const store = load("lib/whiteboard/store.ts");
const { projectileFixture } = load("components/scenes/projectile.ts");
const { parseAgentTurn } = load("lib/agent/tags.ts");
const fixture = projectileFixture();
assert.equal(
  parseAgentTurn(
    '[DRAW {"op":"draw","kind":"arrow","id":"v","from":{"x":0.2,"y":0.7},"to":{"x":0.6,"y":0.3}}]',
  ).board.commands[0].op,
  "arrow",
);
assert.ok(validateAnimation(fixture));
assert.equal(validateAnimation({ ...fixture, duration: Infinity }), null);
assert.equal(
  validateAnimation({
    ...fixture,
    shapes: [
      {
        kind: "dot",
        id: "bad",
        keyframes: [{ t: 0, at: { follow: { pathId: "missing" } } }],
      },
    ],
  }),
  null,
);
assert.equal(
  sampleFrames(
    [
      { t: 0, x: 0 },
      { t: 2, x: 10 },
    ],
    1,
  ).x,
  5,
);
assert.equal(
  sampleFrames(
    [
      { t: 0, x: 0 },
      { t: 2, x: 10, ease: "out" },
    ],
    1,
  ).x,
  8.75,
);
assert.equal(sampleFrames([{ t: 1, x: 0 }], 0).opacity, 0);
store.loadAnimation(fixture);
store.advanceAnimation(1);
store.pauseAnimation();
store.advanceAnimation(1);
assert.equal(store.getBoardState().time, 1);
store.seekAnimation(99);
assert.equal(store.getBoardState().time, fixture.duration);
store.playAnimation();
assert.equal(store.getBoardState().time, 0);
store.focusAnimation("vy");
assert.equal(store.getBoardState().focus, "vy");
store.advanceAnimation(99);
assert.equal(store.getBoardState().playing, false);
const peak = animationFrame(fixture, 3.8);
assert.equal(
  peak.groups
    .find((g) => g.id === "vy")
    .drawables.filter((d) => d.kind !== "text").length,
  0,
);
const raw = `Watch the arrow. [ANIM ${JSON.stringify(fixture)}] What changes?`;
for (let i = 25; i < raw.indexOf("] What"); i += 31)
  assert.ok(!parseAgentTurn(raw.slice(0, i)).speech.includes("keyframes"));
assert.equal(parseAgentTurn(raw).board.animation.id, fixture.id);
assert.equal(
  parseAgentTurn("[ANIM resume][ANIM focus=vy]").board.animControl.focus,
  "vy",
);
store.applyDrawCommands([{ op: "clear" }]);
assert.equal(store.getBoardState().animation, null);
const generic = {
  id: "algorithm-growth",
  duration: 2,
  camera: {
    keyframes: [
      { t: 0, x: 0.5, y: 0.5, zoom: 1 },
      { t: 2, x: 0.4, y: 0.5, zoom: 2 },
    ],
  },
  shapes: [
    {
      kind: "bar",
      id: "work",
      label: "work",
      keyframes: [
        { t: 0, at: { x: 0.2, y: 0.8 }, w: 0.15, h: 0 },
        { t: 2, at: { x: 0.2, y: 0.8 }, w: 0.15, h: 0.5 },
      ],
    },
    {
      kind: "text",
      id: "label",
      text: "input size",
      keyframes: [{ t: 0.5, at: { x: 0.5, y: 0.9 } }],
    },
  ],
};
assert.ok(validateAnimation(generic));
assert.equal(animationFrame(generic, 1).camera.zoom, 1.5);
assert.equal(
  animationFrame(generic, 0).groups.find((g) => g.id === "label").opacity,
  0,
);
assert.ok(
  animationFrame(generic, 1)
    .groups.find((g) => g.id === "work")
    .drawables[0].d.includes("0.55"),
);
console.log(
  "PASS: general bar/text diagram and camera, independent of projectile fixture.",
);
console.log(
  "PASS: validation, interpolation, holds, Follow, pause/freeze, seek, focus, replay, clear, streaming parser.",
);
// Sparse, nonuniform, turning, and repeated samples exercise the shared path.
const { curvePath, curvePoint } = load("lib/whiteboard/curve.ts");
const { interpretCommand } = load("lib/whiteboard/geometry.ts");
for (const points of [
  [{x:.1,y:.8},{x:.3,y:.3},{x:.7,y:.2},{x:.9,y:.7}],
  [{x:.2,y:.8},{x:.2,y:.4},{x:.2,y:.4},{x:.2,y:.1}],
  [{x:.1,y:.5},{x:.8,y:.5}],
  [{x:.2,y:.3},{x:.8,y:.3},{x:.8,y:.7},{x:.2,y:.3}],
]) {
  const spec = {id:'curve-regression',duration:4,shapes:[
    {kind:'path',id:'track',points,label:'path',keyframes:[{t:0,drawn:0},{t:3,drawn:1},{t:4,drawn:1}]},
    {kind:'dot',id:'body',keyframes:[{t:0,at:{follow:{pathId:'track'}}}]},
    {kind:'arrow',id:'attached',keyframes:[{t:0,from:{follow:{pathId:'track'}},to:{follow:{pathId:'track',offset:{x:.02,y:0}}}}]},
  ]};
  assert.ok(validateAnimation(spec));
  for (let i=0;i<points.length;i++) {
    const actual=curvePoint(points,i/(points.length-1));
    assert.ok(Math.hypot(actual.x-points[i].x,actual.y-points[i].y)<1e-12,'Declared samples retain exact timing');
  }
  const labelPositions=[];
  for (let k=0;k<=100;k++) {
    const progress=k/100, at=curvePoint(points,progress);
    const segment=Math.min(points.length-2,Math.floor(progress*(points.length-1)));
    for (const axis of ['x','y']) assert.ok(at[axis]>=Math.min(points[segment][axis],points[segment+1][axis])-1e-12 && at[axis]<=Math.max(points[segment][axis],points[segment+1][axis])+1e-12,'No overshoot');
    const frame=animationFrame(spec,progress*3);
    const body=frame.groups.find(g=>g.id==='body').source.center;
    assert.ok(Math.hypot(body.x-at.x,body.y-at.y)<1e-12,'Follow uses visible curve');
    const arrow=frame.groups.find(g=>g.id==='attached').source;
    assert.ok(Math.hypot(arrow.from.x-at.x,arrow.from.y-at.y)<1e-12);
    assert.ok(Math.abs(arrow.to.x-arrow.from.x-.02)<1e-12,'Offset remains attached');
    labelPositions.push(frame.groups.find(g=>g.id==='track').drawables.find(m=>m.kind==='text').at);
  }
  assert.ok(labelPositions.every(p=>p.x===labelPositions[0].x&&p.y===labelPositions[0].y),'Path annotation stays fixed during reveal');
  assert.deepEqual(animationFrame(spec,3),animationFrame(spec,4),'Final hold stays unchanged');
  const staticPath=interpretCommand({op:'curve',id:'track',points},0).group.drawables[0].d;
  assert.equal(curvePath(points),staticPath,'Static and animated geometry match');
  assert.equal(animationFrame(spec,4).groups[0].drawables[0].d,staticPath);
}
for (let i=0;i<=100;i++) {
  const p=curvePoint([{x:.1,y:.5},{x:.3,y:.5},{x:.5,y:.5},{x:.7,y:.5}],i/100);
  assert.ok(Math.abs(p.x-(.1+.6*i/100))<1e-12,'Uniform straight samples retain constant speed');
}
console.log('PASS: bounded smooth paths, sample timing, attached vectors, duplicate holds, static continuity, stable labels.');
if (process.argv.includes("--unit")) process.exit(0);
const response = await fetch(
  `${process.env.BASE ?? "http://localhost:3100"}/api/agent/llm`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stream: true,
      messages: [
        {
          role: "user",
          content:
            "I am studying an ungraded concept: a dot moves horizontally at constant speed. I predict it moves equal distances in equal times. I can't picture it. Please animate one dot moving left to right so I can watch it.",
        },
      ],
      liveBoard: { open: true, imageUrl: "", studentShapesSince: "" },
    }),
  },
);
assert.ok(response.ok, `HTTP ${response.status}`);
const body = await response.text();
let output = "";
for (const line of body.split("\n")) {
  if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
  const data = JSON.parse(line.slice(6));
  assert.ok(!data.error, data.error?.message);
  output += data.choices?.[0]?.delta?.content ?? "";
}
const turn = parseAgentTurn(output);
assert.ok(turn.board?.animation, `Expected ANIM: ${output}`);
assert.ok(validateAnimation(turn.board.animation), `Invalid spec: ${output}`);
assert.ok(store.loadAnimation(turn.board.animation));
assert.ok(store.getBoardState().open);
console.log(
  `PASS: live model emitted valid ${turn.board.animation.id}; ANIM opens board.`,
);
console.log(turn.speech);
