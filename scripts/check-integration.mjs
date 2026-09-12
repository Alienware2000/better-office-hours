// Isolated local integration only. Creates synthetic course data, never contacts Canvas.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const external = createRequire(import.meta.url);
const cache = new Map();
function load(file) {
  file = path.resolve(file); if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, { filename: file })(name => name.startsWith('@/') ? load(name.slice(2) + '.ts') : name.startsWith('.') ? load(path.resolve(path.dirname(file), name) + '.ts') : external(name), module, module.exports);
  return module.exports;
}
const { pickGreeting } = load('app/(session)/voice/constants.ts');
assert.match(pickGreeting('Alex Student'), /^Hi Alex\./);
assert.doesNotMatch(pickGreeting(), /David|undefined|null/);
const { buildContextBlock } = load('lib/agent/context.ts');
assert.match(buildContextBlock(), /<student>unknown/);
assert.doesNotMatch(buildContextBlock(), /David/);
assert.match(buildContextBlock({ studentName: 'Sam' }), /<student>Sam/);
const { buildGrokMessages } = load('lib/agent/grok.ts');
const sam = { student: { studentName: 'Sam' }, page: null, board: null };
const alex = { student: { studentName: 'Alex' }, page: null, board: null };
assert.match(buildGrokMessages([], null, true, sam)[0].content, /<student>Sam/);
assert.match(buildGrokMessages([], null, true, alex)[0].content, /<student>Alex/);
assert.doesNotMatch(buildGrokMessages([], null, true, sam)[0].content, /<student>Alex/);
const { parseAgentTurn } = load('lib/agent/tags.ts');
const { awaitingSummary } = load('lib/agent/closing.ts');
assert.equal(awaitingSummary([{ role: 'assistant', content: '[SUMMARY_REQUEST]What changed?' }, { role: 'user', content: 'I see the difference.' }]), true);
assert.equal(awaitingSummary([{ role: 'assistant', content: 'What changed?' }]), false);
const recap = { stuckOn: 'A [literal] label', unlockedBy: 'A useful comparison', studentSummary: 'I see the difference.', spokenText: 'You compared the two cases.', reviewNext: { documentTitle: '', where: '' } };
const raw = `[RECAP ${JSON.stringify(recap)}]${recap.spokenText}`;
for (let n = 1; n < raw.indexOf(']You'); n++) assert.equal(parseAgentTurn(raw.slice(0, n)).speech, '', 'No partial JSON leaks into captions');
assert.deepEqual(parseAgentTurn(raw).recapData, recap);
assert.equal(parseAgentTurn('[COURSE {"id":"canvas-42"}][THINK]').courseId, 'canvas-42');
console.log('PASS: unnamed defaults, explicit request identity isolation, student-first recap state, and safe structured metadata.');

const base = process.env.BOH_TEST_BASE_URL;
if (base) {
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const connect = await fetch(base + '/api/courses/connect', { method: 'POST' }); assert.equal(connect.status, 200);
  const cookie = connect.headers.get('set-cookie').split(';')[0], { token } = await connect.json();
  const headers = { 'content-type': 'application/json', authorization: `Bearer ${token}` };
  const post = (route, body, extra = headers) => fetch(base + route, { method: 'POST', headers: extra, body: JSON.stringify(body) });
  assert.equal((await post('/api/ingest/profile', {}, { ...headers, authorization: 'Bearer bogus' })).status, 401);
  assert.equal((await fetch(base + '/api/courses/connect', { method: 'POST', headers: { origin: 'https://unrelated.example' } })).status, 403);
  const profile = { name: 'Alex Test', email: 'alex@example.edu', term: 'Test term', userId: 'someone-else', courses: [{ courseId: 'course-a', courseName: 'Mechanics', code: 'TEST101', assignments: [] }, { courseId: 'course-b', courseName: 'Biology', code: 'TEST102', assignments: [] }] };
  assert.equal((await post('/api/ingest/profile', profile)).status, 200);
  const document = { courseId: 'course-a', courseName: 'Mechanics', term: 'Test term', documentId: 'lecture-1', kind: 'lecture', title: 'Motion lecture', sourceUrl: 'https://canvas.example.edu/courses/a/files/1', pages: [{ page: 2, text: 'Velocity describes changes in position over time. The two directions share one clock.' }] };
  assert.equal((await post('/api/ingest', document)).status, 200);
  assert.equal((await post('/api/ingest', { ...document, documentId: 'solution-1', title: 'Posted solution', kind: 'solution', pages: [{ page: 0, text: 'HIDDEN_SOLUTION_SENTINEL' }] })).status, 200);
  assert.equal((await post('/api/ingest', { ...document, courseId: 'unknown' })).status, 400);
  const owned = await (await fetch(base + '/api/courses', { headers: { cookie } })).json();
  assert.equal(owned.name, 'Alex Test'); assert.equal(owned.courses[0].documents.length, 1); assert.equal(owned.courses[1].documents.length, 0);
  assert.doesNotMatch(JSON.stringify(owned), /HIDDEN_SOLUTION_SENTINEL|Posted solution/);
  assert.deepEqual((await (await fetch(base + '/api/courses')).json()).courses, []);
  const other = await fetch(base + '/api/courses/connect', { method: 'POST' });
  const otherCookie = other.headers.get('set-cookie').split(';')[0];
  assert.deepEqual((await (await fetch(base + '/api/courses', { headers: { cookie: otherCookie } })).json()).courses, []);
  const { collectorOwner } = load('lib/context/ownership.ts');
  // Server process has its own connection secret, so use a controlled local key.
  const original = process.env.INGEST_TOKEN; process.env.INGEST_TOKEN = 'test-secret-only';
  const { collectorToken } = load('lib/context/ownership.ts');
  const signed = collectorToken('guests/11111111-1111-4111-8111-111111111111');
  assert.equal(collectorOwner(`Bearer ${signed}`), 'guests/11111111-1111-4111-8111-111111111111');
  assert.equal(collectorOwner(`Bearer ${signed}extra`), null);
  if (original === undefined) delete process.env.INGEST_TOKEN; else process.env.INGEST_TOKEN = original;
  console.log('PASS: scoped collector token, profile/document ingestion, source visibility, cross-browser isolation, and rejected invalid inputs.');
}
