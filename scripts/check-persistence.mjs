import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

function source(file) {
  return fs.readFileSync(path.resolve(file), "utf8");
}

function loadIdentifiers() {
  const file = path.resolve("lib/db/identifiers.ts");
  const js = ts.transpileModule(source(file), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInThisContext(`(function(module,exports){${js}\n})`, {
    filename: file,
  })(loaded, loaded.exports);
  return loaded.exports;
}

const { requireIdentifier, requireShortText } = loadIdentifiers();
assert.equal(requireIdentifier("phys180-fall2024", "courseId"), "phys180-fall2024");
assert.throws(() => requireIdentifier("../other-user", "courseId"));
assert.throws(() => requireIdentifier("", "courseId"));
assert.equal(requireShortText("  Physics 180  ", "courseName"), "Physics 180");
assert.throws(() => requireShortText("x".repeat(201), "courseName"));

const schema = source("lib/db/schema.sql");
for (const table of [
  "app_users",
  "courses",
  "course_memberships",
  "context_chunks",
  "session_recaps",
]) {
  assert.match(schema, new RegExp(`alter table public\\.${table} enable row level security`));
  assert.match(schema, new RegExp(`revoke all on public\\.${table} from anon, authenticated`));
}
assert.match(schema, /primary key \(user_id, course_id, session_id\)/);
assert.match(
  schema,
  /foreign key \(user_id, course_id\)[\s\S]*course_memberships\(user_id, course_id\)/,
);

const home = source("app/page.tsx");
assert.match(home, /getServerIdentity\(\)/);
assert.match(home, /redirect\("\/sign-in"\)/);

const retrieveRoute = source("app/api/retrieve/route.ts");
const recapRoute = source("app/api/session/recap/route.ts");
for (const route of [retrieveRoute, recapRoute]) {
  assert.match(route, /getServerIdentity\(\)/);
  assert.doesNotMatch(route, /body\.userId|searchParams\.get\("userId"\)/);
}

const ingestRoute = source("app/api/ingest/route.ts");
assert.match(ingestRoute, /timingSafeEqual/);
assert.match(ingestRoute, /INGEST_TOKEN/);
assert.doesNotMatch(ingestRoute, /getServerIdentity\(\)/);
assert.match(ingestRoute, /userEmail/);

const contextPersistence = source("lib/context/persistence.ts");
assert.match(contextPersistence, /retrieveStudentContext\(index, request\)/);
assert.match(contextPersistence, /retrieveServerReferenceChunks\(index, request\)/);
assert.doesNotMatch(retrieveRoute, /retrievePersistedSolutionReferences/);

console.log(
  "PASS: authenticated ownership, private solution retrieval, idempotent recap keys, and locked-down schema.",
);
