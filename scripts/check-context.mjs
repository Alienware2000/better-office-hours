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
  const localRequire = (name) =>
    load(
      (name.startsWith("@/")
        ? path.resolve(name.slice(2))
        : path.resolve(path.dirname(file), name)) + ".ts",
    );
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, {
    filename: file,
  })(localRequire, loaded, loaded.exports);
  return loaded.exports;
}

const { chunkSourceRecords } = load("lib/context/chunk.ts");
const { retrieveStudentChunks } = load("lib/context/retrieve.ts");
const { retrieveServerReferenceChunks } = load(
  "lib/context/server-reference.ts",
);

const sources = [
  {
    courseId: "phys-180",
    documentId: "lecture-4",
    documentKind: "lecture",
    documentTitle: "Lecture 4: Projectile Motion",
    storagePath: "phys-180/lecture-4.pdf",
    page: 12,
    text: "Gravity changes the vertical velocity. Horizontal velocity remains constant when air resistance is ignored.",
  },
  {
    courseId: "phys-180",
    documentId: "solution-3",
    documentKind: "solution",
    documentTitle: "Problem Set 3 Solutions",
    storagePath: "phys-180/solution-3.pdf",
    page: 2,
    text: "The final range uses the horizontal velocity multiplied by flight time.",
    isSolution: false,
  },
  {
    courseId: "cs-223",
    documentId: "lecture-9",
    documentKind: "lecture",
    documentTitle: "Lecture 9: Graph Search",
    storagePath: "cs-223/lecture-9.pdf",
    page: 4,
    text: "A graph search can use a queue or stack. Horizontal velocity is not part of this course.",
  },
];

const index = chunkSourceRecords(sources, {
  maxCharacters: 140,
  overlapCharacters: 20,
});

const lectureChunk = index.find((item) => item.chunk.documentId === "lecture-4");
assert.ok(lectureChunk);
assert.equal(lectureChunk.courseId, "phys-180");
assert.equal(lectureChunk.documentKind, "lecture");
assert.equal(lectureChunk.documentTitle, "Lecture 4: Projectile Motion");
assert.equal(lectureChunk.chunk.page, 12);
assert.equal(lectureChunk.chunk.isSolution, false);
assert.deepEqual(lectureChunk.chunk.embedding, []);

const solutionChunk = index.find(
  (item) => item.chunk.documentId === "solution-3",
);
assert.ok(solutionChunk);
assert.equal(solutionChunk.chunk.isSolution, true);

const studentResults = retrieveStudentChunks(index, {
  courseId: "phys-180",
  query: "horizontal velocity",
});
assert.ok(studentResults.length > 0);
assert.ok(studentResults.every((item) => item.courseId === "phys-180"));
assert.ok(studentResults.every((item) => !item.chunk.isSolution));
assert.ok(
  studentResults.some((item) => item.chunk.documentId === "lecture-4"),
);
assert.ok(
  studentResults.every((item) => item.chunk.documentId !== "solution-3"),
);

const references = retrieveServerReferenceChunks(index, {
  courseId: "phys-180",
  query: "horizontal velocity range",
});
assert.ok(references.length > 0);
assert.ok(references.every((item) => item.courseId === "phys-180"));
assert.ok(references.every((item) => item.chunk.isSolution));

assert.deepEqual(
  retrieveStudentChunks(index, {
    courseId: "missing-course",
    query: "horizontal velocity",
  }),
  [],
);
assert.deepEqual(
  retrieveStudentChunks([], {
    courseId: "phys-180",
    query: "horizontal velocity",
  }),
  [],
);
assert.deepEqual(
  retrieveStudentChunks(index, { courseId: "phys-180", query: "the and of" }),
  [],
);

globalThis.window = {};
assert.throws(
  () =>
    retrieveServerReferenceChunks(index, {
      courseId: "phys-180",
      query: "range",
    }),
  /only on the server/,
);
delete globalThis.window;

console.log(
  "PASS: context chunking preserves provenance and retrieval isolates courses and solutions.",
);
