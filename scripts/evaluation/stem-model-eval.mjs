// Bounded synthetic STEM evaluation. Offline by default; --live makes four paid requests.
// No browser/session reads, STT, TTS, retrieval, repairs, or live server changes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import OpenAI from 'openai';
import { createHarness, measure } from '../bench-tutor-models.mjs';
import { renderReview, repositoryModule } from './render.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const stemModelCases = [
  { id: 'matrix-transform', subject: 'Mathematics', prompt: 'This is ungraded self-study. Explain the linear transformation A = [[2, 0], [0, 1]] with a geometric picture of a unit square before and after. Show the matrix equation and explain what happens to the two basis directions. Keep it to one useful teaching step.', review: 'The x basis doubles and the y basis is unchanged; the square becomes a width-two rectangle. Equation, labels, geometry, and narration agree. Coordinate spacing is clear.' },
  { id: 'projectile-components', subject: 'Physics', prompt: 'This is ungraded self-study. Show why the horizontal velocity of an ideal projectile stays constant while its vertical velocity changes. Ignore air resistance and assume uniform downward gravity. Use a helpful moving diagram if your animation can show the changing vectors accurately, and include the component equations.', review: 'Parabolic path under uniform gravity; equal-time horizontal spacing and constant horizontal velocity; vertical velocity changes sign at the apex, acceleration remains downward. Motion and equations agree.' },
  { id: 'balanced-reaction', subject: 'Chemistry', prompt: 'This is ungraded self-study. Explain why 2 H2 + O2 -> 2 H2O conserves atoms. Show the balanced reaction with properly typeset chemical subscripts and a simple particle-count picture before and after. It is a schematic counting model, not a reaction mechanism or laboratory instructions.', review: 'Both sides contain four H and two O atoms. Chemical subscripts and stoichiometric coefficients have different roles. Grouping shows two H2, one O2, and two H2O molecules without claiming a mechanism or realistic scale.' },
  { id: 'membrane-diffusion', subject: 'Biology', prompt: 'This is ungraded self-study. Explain simple diffusion of small nonpolar molecules across a cell membrane. Show unequal concentrations, movement both ways, and the net movement down the concentration gradient. Use a clear labeled schematic and distinguish net flow from individual random motion.', review: 'Membrane and unequal concentrations are explicit. Individual motion is both ways while net flow is down the concentration gradient; no ATP pump or claim that all molecules move in one direction. Molecular scale and membrane are schematic.' },
];

const hash = value => createHash('sha256').update(value).digest('hex');
const escape = value => String(value ?? '').replace(/[&<>\"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
const seconds = value => typeof value === 'number' ? `${(value / 1000).toFixed(2)} s` : 'unavailable';
function noSymlinks(file) {
  for (let current = path.resolve(file); current !== path.dirname(current); current = path.dirname(current)) {
    try { if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Evaluation paths cannot be symlinks'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
export function stemModelPreview(report) {
  const boardStyles = fs.readFileSync(path.join(root, 'components/whiteboard/whiteboard.css'), 'utf8');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>STEM model audit</title>
<style>${boardStyles}</style>
<style>body{font:16px/1.55 system-ui,sans-serif;color:#292621;background:#f5f3ec;margin:0;padding:40px}main{max-width:1160px;margin:auto}h1{font-size:38px;line-height:1.15}h2{margin:0 0 12px}article{margin:40px 0;padding:28px;background:#fffdf7;border:1px solid #ddd7ca;border-radius:20px}.meta{color:#6b695f;font-size:14px}blockquote{margin:22px 0;padding-left:18px;border-left:2px solid #397b78}.pages{display:flex;gap:20px;overflow:auto}.page{min-width:360px;max-width:560px;flex:1}.page>svg{width:100%;background:#fffdf7;aspect-ratio:1}.warning{color:#a33f22}summary{cursor:pointer}pre{white-space:pre-wrap;font:13px/1.45 ui-monospace,monospace}svg text{font-family:system-ui,sans-serif}@media(max-width:600px){body{padding:20px}article{padding:16px}.page{min-width:300px}}</style>
<main><p class="meta">BOH / SYNTHETIC MODEL EVALUATION</p><h1>What the current tutor actually generated</h1><p>Four ungraded synthetic turns, one sample each. These are model outputs reconstructed with the current BOH parser and renderer. No speech playback was tested. Figures are evaluated separately from the authored STEM design gallery.</p><p class="meta">${escape(report.profile.model)} · ${escape(report.profile.effort)} effort · ${escape(report.generatedAt)}<br>Times run from the deep model request to parser readiness, not end of student speech to audible response.</p>
${report.results.map(result => { const testCase = stemModelCases.find(item => item.id === result.case); return `<article id="${escape(result.case)}"><p class="meta">${escape(testCase.subject)}</p><h2>${escape(result.case.replaceAll('-', ' '))}</h2><p>${escape(testCase.prompt)}</p><p class="meta">First complete speech ${seconds(result.firstSpeechReadyMs)} · First accepted board ${seconds(result.firstBoardReadyMs)} · Complete ${seconds(result.totalMs)} · ${escape(result.finishReason || result.failure)}</p><blockquote>${escape(result.speech)}</blockquote>${result.render.warnings?.length ? `<p class="warning">${result.render.warnings.map(escape).join('<br>')}</p>` : ''}<div class="pages">${result.render.pages.map(page => `<div class="page"><p class="meta">Page ${page.page}${page.duration ? ` · animation start (${page.duration} s duration)` : ''}</p>${page.svg}</div>`).join('')}</div>${result.motionFrames?.length ? `<details><summary>Animation midpoint and end</summary><div class="pages">${result.motionFrames.map(frame => `<div class="page"><p class="meta">${frame.time} s</p>${frame.svg}</div>`).join('')}</div></details>` : ''}<details><summary>Review criteria and accepted commands</summary><p>${escape(testCase.review)}</p><pre>${escape(JSON.stringify(result.board, null, 2))}</pre></details></article>`; }).join('')}
<p class="meta">One sample cannot establish reliable latency percentiles, broad STEM competence, teaching benefit, or collaborative-canvas quality. No production configuration or live session was changed.</p></main></html>`;
}

async function main() {
  if (process.cwd() !== root) throw new Error('Run from the repository root');
  const args = process.argv.slice(2);
  if (args.some(arg => !['--live', '--dry-run'].includes(arg)) || (args.includes('--live') && args.includes('--dry-run'))) throw new Error('Use --dry-run or --live');
  const live = args.includes('--live');
  process.env.NODE_ENV = 'development';
  process.env.BOH_VOICE_TRIAL = '1';
  delete process.env.VERCEL;
  // The actual request builder requires a key before the SDK interception.
  process.env.OPENROUTER_API_KEY ||= 'synthetic-capture-only';
  const { TRIAL_PROFILE } = repositoryModule('lib/agent/trial');
  const harness = createHarness();
  const requests = [];
  for (const testCase of stemModelCases) {
    const request = await harness.request(testCase);
    request.stream_options = { include_usage: true };
    if (request.model !== TRIAL_PROFILE.model || request.max_tokens !== TRIAL_PROFILE.maxTokens || request.reasoning?.effort !== TRIAL_PROFILE.effort) throw new Error('Capture does not match the current trial profile');
    requests.push({ testCase, request });
  }
  const report = { kind: live ? 'live-synthetic-stem-evaluation' : 'offline-stem-request-audit', generatedAt: new Date().toISOString(),
    revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    dirty: Boolean(execFileSync('git', ['--no-optional-locks', '-c', 'core.fsmonitor=false', 'status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim()),
    profile: TRIAL_PROFILE, scope: 'Four sequential synthetic deep teaching requests, current trial prompt and parser. No routing, retrieval, images, STT, TTS, browser playback, or repair requests. Model/provider timing includes incremental parser overhead. One sample per case.',
    requests: requests.map(({ testCase, request }) => ({ case: testCase.id, prompt: testCase.prompt, review: testCase.review,
      inputCharacters: JSON.stringify(request.messages).length, inputSha256: hash(JSON.stringify(request.messages)), requestSha256: hash(JSON.stringify(request)),
      model: request.model, maxTokens: request.max_tokens, temperature: request.temperature ?? 'provider_default', responseFormat: request.response_format?.json_schema?.name, provider: request.provider })), results: [] };
  if (!live) { console.log(JSON.stringify(report, null, 2)); return; }
  const keyFile = path.join(root, '.env.benchmark.local');
  noSymlinks(keyFile);
  const key = parseEnv(fs.readFileSync(keyFile, 'utf8')).OPENROUTER_API_KEY;
  if (!key) throw new Error('Private benchmark credential unavailable');
  const client = new OpenAI({ apiKey: key, baseURL: 'https://openrouter.ai/api/v1', maxRetries: TRIAL_PROFILE.maxRetries, timeout: TRIAL_PROFILE.requestTimeoutMs });
  const output = path.join(root, '.data/evaluation', `stem-models-${Date.now()}`);
  noSymlinks(output);
  fs.mkdirSync(output, { recursive: true, mode: 0o700 });
  for (const { testCase, request } of requests) {
    const result = await measure(body => client.chat.completions.create(body, { signal: AbortSignal.timeout(TRIAL_PROFILE.requestTimeoutMs) }), request, harness, testCase);
    result.render = renderReview(result);
    result.motionFrames = result.render.pages.flatMap(page => page.duration ? [page.duration / 2, page.duration].map(time => ({ time,
      page: page.page, svg: renderReview(result, 'final', time).pages.find(candidate => candidate.page === page.page).svg })) : []);
    report.results.push(result);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2), { mode: 0o600 });
    fs.writeFileSync(path.join(output, 'index.html'), stemModelPreview(report), { mode: 0o600 });
    console.log(JSON.stringify({ case: result.case, failure: result.failure, speechReadyMs: result.firstSpeechReadyMs, boardReadyMs: result.firstBoardReadyMs, totalMs: result.totalMs, pages: result.render.pages.length, warnings: result.render.warnings, cost: result.usage?.cost ?? null }));
  }
  console.log(`Saved synthetic report and renderer preview: ${path.relative(root, output)}`);
  if (report.results.some(result => result.failure)) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(() => { console.error('STEM evaluation stopped. Check the bounded runner, local credential availability, and saved report. Provider error bodies are not printed.'); process.exitCode = 1; });
