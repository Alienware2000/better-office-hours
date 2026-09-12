import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);
const cache = new Map();

function resolveLocal(name, parent) {
  const base = name.startsWith("@/")
    ? path.resolve(name.slice(2))
    : path.resolve(path.dirname(parent), name);
  for (const extension of [".ts", ".tsx"]) {
    if (fs.existsSync(base + extension)) return base + extension;
  }
  throw new Error(`Cannot resolve ${name} from ${parent}`);
}

function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const loaded = { exports: {} };
  cache.set(file, loaded);
  const js = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const localRequire = (name) => {
    if (name.endsWith(".module.css")) {
      return new Proxy({}, { get: (_target, property) => String(property) });
    }
    if (name.startsWith(".") || name.startsWith("@/")) {
      return load(resolveLocal(name, file));
    }
    return nodeRequire(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, {
    filename: file,
  })(localRequire, loaded, loaded.exports);
  return loaded.exports;
}

const { deserializeRecap, serializeRecap, validateRecap } = load(
  "lib/session/recap.ts",
);
const { RecapCard } = load("components/recap/RecapCard.tsx");
const React = nodeRequire("react");
const { renderToStaticMarkup } = nodeRequire("react-dom/server");

const recap = {
  stuckOn: "  You treated horizontal speed as if gravity reduced it.  ",
  unlockedBy: "You separated the horizontal and vertical components.",
  reviewNext: {
    documentTitle: "Lecture 4",
    where: "slides 10 to 14",
  },
  studentSummary: "My own calculation ended at 42.7 metres.",
  spokenText: "You separated the two directions and identified gravity's role.",
};

const valid = validateRecap(recap);
assert.equal(valid.ok, true);
assert.equal(
  valid.value.stuckOn,
  "You treated horizontal speed as if gravity reduced it.",
);

const serialized = serializeRecap(recap);
const roundTrip = deserializeRecap(serialized);
assert.equal(roundTrip.ok, true);
assert.deepEqual(roundTrip.value, valid.value);

assert.equal(deserializeRecap("{not json").ok, false);
assert.equal(
  validateRecap({
    ...recap,
    reviewNext: { documentTitle: "Lecture 4", where: "" },
  }).ok,
  false,
);
assert.equal(
  validateRecap({
    ...recap,
    unlockedBy: "The final answer is 42.7 metres.",
  }).ok,
  false,
);
assert.equal(
  validateRecap({ ...recap, stuckOn: "x".repeat(501) }).ok,
  false,
);

const html = renderToStaticMarkup(
  React.createElement(RecapCard, { recap: valid.value }),
);
assert.match(html, /aria-label="Session recap"/);
assert.match(html, /Where you got stuck/);
assert.match(html, /What changed/);
assert.match(html, /Lecture 4/);
assert.match(html, /slides 10 to 14/);
assert.doesNotMatch(html, /42\.7 metres/);
assert.doesNotMatch(html, /gravity&#x27;s role/);

const noReference = validateRecap({
  ...recap,
  reviewNext: { documentTitle: "", where: "" },
});
assert.equal(noReference.ok, true);
const noReferenceHtml = renderToStaticMarkup(
  React.createElement(RecapCard, { recap: noReference.value }),
);
assert.match(
  noReferenceHtml,
  /No course reference was available for this session\./,
);

console.log(
  "PASS: recap validation, serialization, safe rendering, and honest missing context.",
);
