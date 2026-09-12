// Explicit live deployment smoke test. Creates isolated synthetic guest data.
// BOH_TEST_BASE_URL=https://your-deployment BOH_ALLOW_STORAGE_WRITES=1 node scripts/check-deployed-storage.mjs
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const base = process.env.BOH_TEST_BASE_URL;
if (!base || process.env.BOH_ALLOW_STORAGE_WRITES !== '1') throw new Error('Supply the intended deployment and explicitly enable isolated storage writes.');
const id = randomUUID();
const connect = await fetch(`${base}/api/courses/connect`, { method: 'POST', headers: { Origin: new URL(base).origin } });
assert.equal(connect.status, 200);
const cookie = connect.headers.get('set-cookie').split(';')[0];
const { token } = await connect.json();
const post = (route, body, headers = {}) => fetch(base + route, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...headers }, body: JSON.stringify(body) });
const courseId = `storage-test-${id}`;
const profile = { name: 'Storage Test', email: '', term: 'Synthetic test', courses: [{ courseId, courseName: 'Synthetic course', code: 'TEST', assignments: [] }] };
assert.equal((await post('/api/ingest/profile', profile)).status, 200, 'Profile persists');
const doc = { courseId, courseName: 'Synthetic course', term: 'Synthetic test', documentId: 'one', title: 'First source', kind: 'lecture', sourceUrl: 'https://example.edu/lecture', pages: [{ page: 0, text: 'Synthetic lecture excerpt about measurement.' }] };
assert.equal((await post('/api/ingest', doc)).status, 200);
assert.equal((await post('/api/ingest', { ...doc, documentId: 'two', title: 'Second source' })).status, 200);
assert.equal((await post('/api/ingest', { ...doc, documentId: 'hidden', title: 'Posted solution', kind: 'solution', pages: [{ page: 0, text: 'PRIVATE_SOLUTION_TEST' }] })).status, 200);
const catalog = await (await fetch(base + '/api/courses', { headers: { cookie } })).json();
assert.deepEqual(catalog.courses[0].documents.map(d => d.title).sort(), ['First source', 'Second source'], 'Sequential updates use fresh reads and hide solutions');
assert.doesNotMatch(JSON.stringify(catalog), /PRIVATE_SOLUTION_TEST|Posted solution/);
assert.deepEqual((await (await fetch(base + '/api/courses')).json()).courses, [], 'Anonymous requests cannot read another owner');

// Over 4.5 MB deliberately verifies direct transfer outside the function body.
const pdf = Buffer.from('%PDF-1.4\n% Synthetic upload-size probe\n' + '% padding\n'.repeat(650_000) + '%%EOF\n');
const ticket = await post('/api/pset/upload', { filename: 'storage-test.pdf', size: pdf.length }, { cookie, Origin: new URL(base).origin });
assert.equal(ticket.status, 200);
const upload = await ticket.json();
assert.equal(upload.direct, true);
const put = await fetch(upload.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: pdf });
assert.ok(put.ok, `Signed PDF upload: ${put.status}`);
const file = await fetch(base + upload.fileUrl, { headers: { cookie } });
assert.equal(file.status, 200);
assert.equal(Buffer.compare(Buffer.from(await file.arrayBuffer()), pdf), 0, 'Downloaded PDF matches after a separate request');
const privateUrl = new URL(file.url); privateUrl.search = '';
assert.ok(!(await fetch(privateUrl)).ok, 'Raw private Blob URL is not public');
assert.equal((await fetch(base + upload.fileUrl)).status, 404, 'App file route requires its owner');
const otherConnection = await fetch(base + '/api/courses/connect', { method: 'POST' });
const otherCookie = otherConnection.headers.get('set-cookie').split(';')[0];
assert.ok(!(await fetch(base + upload.fileUrl, { headers: { cookie: otherCookie } })).ok, 'Another guest cannot read the PDF');
assert.ok(!(await fetch(upload.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: pdf })).ok, 'Single-file upload cannot overwrite the existing PDF');
console.log('PASS deployed private profile/source persistence, immediate sequential updates, solution exclusion, guest isolation, >4.5MB direct PDF upload and download, private URL protection, and overwrite denial. Synthetic data only.');
