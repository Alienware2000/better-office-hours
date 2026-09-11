// Routing and desk isolation checks, without microphone or model variability.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
const cache = new Map();
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
  const require = (name) =>
    load(
      (name.startsWith("@/")
        ? path.resolve(name.slice(2))
        : path.resolve(path.dirname(file), name)) + ".ts",
    );
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, {
    filename: file,
  })(require, loaded, loaded.exports);
  return loaded.exports;
}
const { detectMode } = load("lib/agent/intent.ts");
for (const phrase of [
  "Homework",
  "Can you help with my home work?",
  "I have a p set",
  "I need help with my assignments",
  "Let us do problem set 3",
])
  assert.equal(detectMode(phrase), "pset", phrase);
for (const phrase of [
  "Explain a concept",
  "Something else",
  "Teach me about sorting",
  "Help me understand recursion",
  "I don’t understand derivatives",
])
  assert.equal(detectMode(phrase), "concept", phrase);
assert.equal(detectMode("Why does this work?", "pset"), null);
assert.equal(detectMode("Explain a concept", "pset"), "concept");
assert.equal(detectMode("I want to do homework", "concept"), "pset");
assert.equal(detectMode("Hello"), null);
const board = load("lib/whiteboard/store.ts");
board.applyDrawCommands([
  {
    op: "arrow",
    id: "homework",
    from: { x: 0.2, y: 0.8 },
    to: { x: 0.7, y: 0.3 },
  },
]);
const homework = structuredClone(board.getBoardState());
board.resetBoard();
board.openBoard();
assert.equal(board.getBoardState().groups.length, 0);
board.applyDrawCommands([
  { op: "text", id: "concept", at: { x: 0.5, y: 0.5 }, text: "recursion" },
]);
board.restoreBoard(homework);
assert.deepEqual(
  board.getBoardState().groups.map((g) => g.id),
  ["homework"],
);
assert.equal(board.getBoardState().playing, false);
console.log(
  "PASS: spoken-intent routing, homework stability, concept entry, and separate desk board state.",
);

const { buildContextBlock } = load("lib/agent/context.ts");
const notesContext = buildContextBlock({
  psetTitle: "Recursion notes",
  documentKind: "notes",
  mode: "concept",
  page: 1,
  pages: 2,
});
assert.ok(notesContext.includes("<notes>Recursion notes, page 1 of 2</notes>"));
assert.ok(notesContext.includes("<mode>concept</mode>"));
assert.ok(!notesContext.includes("assignment is open"));
const { asSessionEvent } = load("lib/agent/events.ts");
assert.equal(asSessionEvent({ kind: "notes_ready" }).kind, "notes_ready");
console.log(
  "PASS: supplemental notes retain concept context and have an allowlisted ready event.",
);
