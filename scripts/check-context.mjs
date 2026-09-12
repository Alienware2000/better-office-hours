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

const { chunkSourceRecord, chunkSourceRecords } = load("lib/context/chunk.ts");
const { retrieveStudentContext } = load("lib/context/retrieve.ts");
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
  {
    courseId: "phys-180",
    documentId: "worked-answer",
    documentKind: "lecture",
    documentTitle: "Instructor worked answer",
    storagePath: "phys-180/private/worked-answer.pdf",
    page: 1,
    text: "This mislabeled record contains a secret horizontal velocity answer.",
    isSolution: true,
  },
];

const index = chunkSourceRecords(sources, {
  maxCharacters: 140,
  overlapCharacters: 20,
});

const longSource = {
  courseId: "math-120",
  documentId: "notes-2",
  documentKind: "lecture",
  documentTitle: "Limits and λ notation",
  storagePath: "math-120/notes-2.pdf",
  page: 3,
  text: [
    "For ε > 0, choose δ so the input remains close to the limit point.",
    "The expression λ² + x² preserves its mathematical symbols after chunking.",
    "A repeated explanation makes this source long enough to split predictably.",
    "The final sentence verifies that no chunk exceeds the configured boundary.",
  ].join(" "),
};
const longChunks = chunkSourceRecord(longSource, {
  maxCharacters: 140,
  overlapCharacters: 20,
});
assert.ok(longChunks.length > 1);
assert.ok(longChunks.every((item) => item.chunk.text.length <= 140));
assert.ok(longChunks.some((item) => item.chunk.text.includes("λ²")));
assert.deepEqual(
  longChunks.map((item) => item.chunk.id),
  chunkSourceRecord(longSource, {
    maxCharacters: 140,
    overlapCharacters: 20,
  }).map((item) => item.chunk.id),
);

const repeated = chunkSourceRecords([longSource, longSource], {
  maxCharacters: 140,
  overlapCharacters: 20,
});
assert.equal(repeated.length, longChunks.length);

const sameTextNextPage = chunkSourceRecord(
  { ...longSource, page: 4 },
  { maxCharacters: 140, overlapCharacters: 20 },
);
assert.notEqual(sameTextNextPage[0].chunk.id, longChunks[0].chunk.id);

assert.throws(
  () => chunkSourceRecord({ ...longSource, courseId: " " }),
  /courseId/,
);
assert.throws(
  () => chunkSourceRecord({ ...longSource, page: -1 }),
  /page/,
);

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

const studentResults = retrieveStudentContext(index, {
  courseId: "phys-180",
  query: "horizontal velocity",
});
assert.ok(studentResults.length > 0);
assert.deepEqual(Object.keys(studentResults[0]).sort(), [
  "documentKind",
  "documentTitle",
  "page",
  "text",
]);
assert.ok(studentResults.every((item) => item.documentKind !== "solution"));
assert.ok(
  studentResults.some(
    (item) => item.documentTitle === "Lecture 4: Projectile Motion",
  ),
);
assert.ok(
  studentResults.every(
    (item) =>
      item.documentTitle !== "Problem Set 3 Solutions" &&
      item.documentTitle !== "Instructor worked answer",
  ),
);
assert.ok(
  studentResults.every(
    (item) =>
      !("courseId" in item) &&
      !("storagePath" in item) &&
      !("embedding" in item) &&
      !("isSolution" in item) &&
      !("chunk" in item),
  ),
);

const rankedResults = retrieveStudentContext(index, {
  courseId: "phys-180",
  query: "projectile gravity vertical",
});
assert.equal(
  rankedResults[0]?.documentTitle,
  "Lecture 4: Projectile Motion",
);

const references = retrieveServerReferenceChunks(index, {
  courseId: "phys-180",
  query: "horizontal velocity range",
});
assert.ok(references.length > 0);
assert.ok(references.every((item) => item.courseId === "phys-180"));
assert.ok(references.every((item) => item.chunk.isSolution));

assert.deepEqual(
  retrieveStudentContext(index, {
    courseId: "missing-course",
    query: "horizontal velocity",
  }),
  [],
);
assert.deepEqual(
  retrieveStudentContext([], {
    courseId: "phys-180",
    query: "horizontal velocity",
  }),
  [],
);
assert.deepEqual(
  retrieveStudentContext(index, { courseId: "phys-180", query: "the and of" }),
  [],
);
assert.deepEqual(
  retrieveStudentContext(index, {
    courseId: "phys-180",
    query: "horizontal velocity",
    limit: 0,
  }),
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
