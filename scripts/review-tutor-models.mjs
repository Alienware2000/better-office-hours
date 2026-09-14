// Separate loopback review server. Never imports the live app or reads browser saves.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import OpenAI from 'openai';
import { createSpeechReview } from './evaluation/speech.mjs';
import { cases, createHarness, candidateRequest, measure } from './bench-tutor-models.mjs';
import { renderReview, renderAcceptedBoard } from './evaluation/render.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'scripts/evaluation');
const models = ['anthropic/claude-opus-5', 'openai/gpt-6-astra'];
const hash = text => createHash('sha256').update(text).digest('hex');
function noSymlinks(file) {
  for (let p = path.resolve(file); p !== path.dirname(p); p = path.dirname(p)) {
    try { if (fs.lstatSync(p).isSymbolicLink()) throw new Error('Symlink paths are not allowed'); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
}
function privateWrite(file, value) {
  noSymlinks(file); fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${randomUUID()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), { mode: 0o600, flag: 'wx' });
  fs.renameSync(temp, file);
}
function readJSON(file) {
  noSymlinks(file);
  if (fs.statSync(file).size > 2_000_000) throw new Error('Report too large');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
export function readReports(dataRoot) {
  noSymlinks(dataRoot);
  const found = [];
  if (!fs.existsSync(dataRoot)) return found;
  let files = [];
  for (const entry of fs.readdirSync(dataRoot, { withFileTypes: true }).sort((a,b) => b.name.localeCompare(a.name))) {
    if (entry.isSymbolicLink()) continue;
    if (entry.isFile() && entry.name.endsWith('.json')) files.push(path.join(dataRoot, entry.name));
    if (entry.isDirectory()) files.push(...fs.readdirSync(path.join(dataRoot, entry.name), { withFileTypes: true })
      .filter(f => f.isFile() && f.name.endsWith('.json')).map(f => path.join(dataRoot, entry.name, f.name)));
  }
  files = files.slice(0, 200);
  for (const file of files) {
    try {
      const report = readJSON(file);
      if (report.kind !== 'live-synthetic-teaching-benchmark' || !Array.isArray(report.results) || !Array.isArray(report.requests)) continue;
      for (const [index, result] of report.results.entries()) {
        if (!cases.some(c => c.id === result.case) || typeof result.rawContent !== 'string' || result.rawContent.length > 100_000) continue;
        const request = report.requests.find(r => r.case === result.case);
        if (!request || typeof result.modelRequested !== 'string') continue;
        const source = path.relative(dataRoot, file);
        const id = hash(source + ':' + index + ':' + request.inputSha256 + ':' + result.rawContent).slice(0, 24);
        found.push({ id, source, report, request, result });
      }
    } catch { /* Ignore incomplete writes and unrelated/unsafe records; never serve arbitrary files. */ }
  }
  return found.sort((a,b) => (Date.parse(b.report.generatedAt) || 0) - (Date.parse(a.report.generatedAt) || 0));
}
const metric = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
function summary(record, ratings) {
  const { result: r, report: d, request: q } = record;
  return { id: record.id, source: record.source, case: r.case, model: r.modelRequested, returnedModel: r.modelReturned ?? null,
    provider: r.providerReturned ?? null, effort: d.effort, maxTokens: q.maxTokens, temperature: q.temperature ?? 'not recorded',
    generatedAt: d.generatedAt, revision: d.revision, dirty: Boolean(d.dirty), inputSha256: q.inputSha256,
    firstContentMs: metric(r.firstContentMs), firstSpeechReadyMs: metric(r.firstSpeechReadyMs), firstBoardReadyMs: metric(r.firstBoardReadyMs), totalMs: metric(r.totalMs),
    failure: r.failure ?? null, boardPresent: Boolean(r.boardPresent), cost: metric(r.usage?.cost),
    words: typeof r.speech === 'string' ? r.speech.trim().split(/\s+/).filter(Boolean).length : 0,
    rating: ratings[record.id] ?? null, eventCount: r.events?.length ?? 0 };
}

export function createReviewServer({ dataRoot = path.join(root, '.data/evaluation'), port = 3106, generate, synthesize } = {}) {
  noSymlinks(dataRoot);
  const ratingsFile = path.join(dataRoot, 'review/ratings.json');
  let ratings = {};
  try { ratings = readJSON(ratingsFile); } catch { /* New local review store. */ }
  const csrf = randomUUID();
  let job = null, activeAbort = null, liveSnapshots = [];
  const harness = createHarness();
  const requestCache = new Map();
  let captureQueue = Promise.resolve();
  function capture(fixture) {
    const pending = captureQueue.then(() => harness.request(fixture));
    captureQueue = pending.catch(() => {});
    return pending;
  }
  const records = () => readReports(dataRoot);
  const speech = createSpeechReview({ root, dataRoot, records, synthesize });
  async function inputFor(record) {
    if (!requestCache.has(record.result.case)) requestCache.set(record.result.case, await capture(cases.find(c => c.id === record.result.case)));
    const input = requestCache.get(record.result.case).messages;
    return hash(JSON.stringify(input)) === record.request.inputSha256 ? input : null;
  }
  async function runBatch(spec) {
    const plan = [];
    for (let run = 1; run <= spec.repeats; run++) for (const caseId of spec.cases) for (const model of spec.models) plan.push({ caseId, model, run });
    job = { id: randomUUID(), state: 'running', startedAt: Date.now(), total: plan.length, completed: 0, current: null, results: [], error: null };
    activeAbort = new AbortController();
    const ownJob = job, signal = activeAbort.signal;
    try {
      let key;
      if (!generate) {
        const keyFile = path.join(root, '.env.benchmark.local');
        noSymlinks(keyFile);
        key = fs.readFileSync(keyFile, 'utf8').match(/^OPENROUTER_API_KEY=(.+)$/m)?.[1].trim();
        if (!key) throw new Error('Benchmark credential unavailable');
      }
      const client = generate ? null : new OpenAI({ apiKey: key, baseURL: 'https://openrouter.ai/api/v1', maxRetries: 0, timeout: 60_000 });
      for (const item of plan) {
        if (signal.aborted) break;
        const fixture = cases.find(c => c.id === item.caseId);
        const base = await capture(fixture);
        const request = candidateRequest(base, 'openrouter', item.model, 'low', { maxTokens: 8000, temperature: 'default' });
        const current = { ...item, startedAt: Date.now(), progress: null };
        ownJob.current = current;
        liveSnapshots = [];
        const progress = event => { current.progress = event; liveSnapshots.push(event); };
        const result = generate ? await generate(request, fixture, progress, signal) : await measure(
          body => client.chat.completions.create(body, { signal: AbortSignal.any([signal, AbortSignal.timeout(60_000)]) }), request, harness, fixture, () => performance.now(), progress);
        const report = { kind: 'live-synthetic-teaching-benchmark', generatedAt: new Date().toISOString(),
          revision: execFileSync('git', ['rev-parse','HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
          dirty: Boolean(execFileSync('git', ['--no-optional-locks','-c','core.fsmonitor=false','status','--porcelain'], { cwd: root, encoding: 'utf8' }).trim()),
          route: 'openrouter', effort: 'low', runs: 1, observer: 'Local review UI; includes incremental parsing and review-server overhead. No audio.',
          caseInput: { id: fixture.id, prompt: fixture.prompt, review: fixture.review },
          requests: [{ case: fixture.id, model: item.model, inputCharacters: JSON.stringify(request.messages).length,
            inputSha256: hash(JSON.stringify(request.messages)), maxTokens: request.max_tokens, temperature: 'provider_default',
            responseFormat: request.response_format.json_schema.name, provider: request.provider }], results: [{ run: item.run, ...result }] };
        const filename = path.join(dataRoot, `review-run-${ownJob.id}`, `${ownJob.completed + 1}-${fixture.id}.json`);
        privateWrite(filename, report);
        ownJob.completed++;
        const entry = records().find(r => r.source === path.relative(dataRoot, filename));
        if (entry) ownJob.results.push(entry.id);
      }
      ownJob.state = signal.aborted ? 'cancelled' : 'complete';
    } catch { ownJob.state = 'failed'; ownJob.error = 'The comparison stopped. Check the local benchmark credential, connection, and report folder.'; }
    finally { ownJob.current = null; activeAbort = null; }
  }
  async function body(req) {
    let text = '';
    for await (const part of req) { text += part; if (text.length > 12_000) throw new Error('Request too large'); }
    return JSON.parse(text);
  }
  const server = http.createServer(async (req, res) => {
    const actualPort = server.address()?.port;
    const hosts = [`localhost:${actualPort}`, `127.0.0.1:${actualPort}`];
    const send = (status, value, type = 'application/json') => {
      res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; media-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" });
      res.end(type === 'application/json' ? JSON.stringify(value) : value);
    };
    if (!hosts.includes(req.headers.host)) return send(403, { error: 'Local host only' });
    if (req.headers.origin && !hosts.some(host => req.headers.origin === `http://${host}`)) return send(403, { error: 'Same-origin access only' });
    const url = new URL(req.url, `http://${req.headers.host}`);
    try {
      if (req.method === 'GET' && ['/', '/review.js', '/speech.js', '/review.css', '/board.css'].includes(url.pathname)) {
        const file = url.pathname === '/' ? path.join(assets, 'review.html') : url.pathname === '/board.css' ? path.join(root, 'components/whiteboard/whiteboard.css') : path.join(assets, url.pathname.slice(1));
        return send(200, fs.readFileSync(file), url.pathname === '/' ? 'text/html; charset=utf-8' : url.pathname.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/css; charset=utf-8');
      }
      if (req.method === 'GET' && url.pathname === '/api/speech') return send(200, speech.state());
      if (req.method === 'GET' && url.pathname === '/api/audio') return send(200, speech.audio(url.searchParams.get('key') ?? ''), 'audio/mpeg');
      if (req.method === 'GET' && url.pathname === '/api/state') return send(200, { csrf, reports: records().map(r => summary(r, ratings)), job,
        models, cases: cases.map(({ id, prompt, review }) => ({ id, prompt, review })) });
      if (req.method === 'GET' && url.pathname === '/api/reviews') return send(200, ratings);
      if (req.method === 'GET' && url.pathname === '/api/live-board') {
        return send(200, { svg: job?.current?.progress ? renderAcceptedBoard(job.current.caseId, job.current.progress.board, liveSnapshots) : null });
      }
      if (req.method === 'GET' && url.pathname === '/api/report') {
        const record = records().find(r => r.id === url.searchParams.get('id'));
        if (!record) return send(404, { error: 'Report not found' });
        const r = record.result;
        return send(200, { ...summary(record, ratings), prompt: cases.find(c => c.id === r.case)?.prompt,
          reviewCriteria: r.reviewCriteria ?? cases.find(c => c.id === r.case)?.review, inputMessages: await inputFor(record),
          rawContent: r.rawContent, acceptedSpeech: r.speech ?? '', acceptedBoard: r.board ?? null,
          unresolvedHighlightIds: r.unresolvedHighlightIds ?? [], events: r.events ?? [],
          rendering: renderReview(r, url.searchParams.get('stage') ?? 'final', Number(url.searchParams.get('time') ?? 0)) });
      }
      if (req.method !== 'POST') return send(404, { error: 'Not found' });
      if (!req.headers.origin || req.headers['x-review-token'] !== csrf || !req.headers['content-type']?.startsWith('application/json')) return send(403, { error: 'Same-origin review token required' });
      const value = await body(req);
      if (url.pathname === '/api/speech/prepare') { void speech.prepare(); return send(202, { started: true }); }
      if (url.pathname === '/api/rating') {
        if (!records().some(r => r.id === value.id)) return send(404, { error: 'Report not found' });
        const rating = { updatedAt: new Date().toISOString() };
        for (const field of ['correctness','teaching','visuals']) {
          if (!['unrated','pass','concern'].includes(value[field])) throw new Error('Invalid rating');
          rating[field] = value[field];
        }
        if (typeof value.notes !== 'string' || value.notes.length > 4000) throw new Error('Invalid notes');
        rating.notes = value.notes;
        const next = { ...ratings, [value.id]: rating }; privateWrite(ratingsFile, next); ratings = next;
        return send(200, { saved: true, rating });
      }
      if (url.pathname === '/api/cancel') { activeAbort?.abort(); return send(200, { cancelling: true }); }
      if (url.pathname === '/api/run') {
        if (job?.state === 'running') return send(409, { error: 'A comparison is already running' });
        if (!Array.isArray(value.models) || !value.models.length || value.models.length > 2 || new Set(value.models).size !== value.models.length || value.models.some(m => !models.includes(m))) throw new Error('Choose supported models');
        if (!Array.isArray(value.cases) || !value.cases.length || value.cases.length > 5 || new Set(value.cases).size !== value.cases.length || value.cases.some(id => !cases.some(c => c.id === id))) throw new Error('Choose known synthetic cases');
        if (!Number.isInteger(value.repeats) || value.repeats < 1 || value.repeats > 3 || value.repeats * value.models.length * value.cases.length > 10) throw new Error('Choose up to 10 requests per batch');
        void runBatch(value);
        return send(202, { started: true });
      }
      return send(404, { error: 'Not found' });
    } catch { return send(400, { error: 'Could not process this review request. Check the selected settings or local report.' }); }
  });
  return { server, start: () => new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server.address().port));
  }), stop: () => { activeAbort?.abort(); server.close(); } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.cwd() !== root) throw new Error('Run the review server from the repository root');
  const app = createReviewServer();
  app.start().then(port => console.log(`Tutor review: http://localhost:${port}\nLocal reports and judgments only. Paid requests start only through the review controls.`))
    .catch(() => { console.error('Review server could not start. Check that port 3106 is free and the local report path is not a symlink.'); process.exitCode = 1; });
}
