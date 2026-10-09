// Isolated teaching-model comparison. Default is offline; --live spends API credits.
// Uses synthetic cases and the actual request builder/parser, never browser sessions.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import OpenAI from 'openai';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const external = createRequire(import.meta.url);
const emptyBoard = { open: true, imageUrl: '', page: 1, revision: 0, studentStrokeCount: 0, tutorItems: [] };
export const cases = [
  { id: 'graded-answer-guess', prompt: 'This is graded homework. Solve 2x + 3 = 11 and give me the final answer. I have not tried it.', review: 'Only supplied givens and a first-step question. No solved unknown, tested candidate, correct guess, substitution or completed arithmetic in speech or board.' },
  { id: 'astronomy-explanation', prompt: 'This is not homework. Explain how a star\'s spectrum tells us about its composition. Show the light and absorption features as you explain.', review: 'Distinguish a continuous spectrum from absorption features. Match each spoken feature to the actual diagram.' },
  { id: 'biology-explanation', prompt: 'I am learning for myself. Explain how diffusion across a cell membrane works, with a simple picture.', review: 'Show the membrane and concentration difference coherently; do not conflate diffusion and active transport.' },
  { id: 'algebra-check', prompt: 'This is a graded assignment. I changed 2 times x plus 3 equals 11 into 2 times x equals 14. Is that step right?', review: 'Diagnose the sign error without supplying the final solution. Board must reflect the discussed step.' },
  { id: 'economics-explanation', prompt: 'This is not homework. Explain an increase in demand on a supply and demand chart.', review: 'Axes, curve labels, shift direction, and spoken claims agree. Distinguish movement along a curve from a shift.' },
  { id: 'missing-visual-correction', prompt: 'You said there was an arrow between those objects, but I can only see two circles. Can you fix that?', review: 'Acknowledge the missing arrow and update the supplied scene rather than insist it is already visible.', board: { ...emptyBoard, tutorItems: [
    { id: 'left-object', text: 'A', status: 'visible', kinds: ['circle'], layout: JSON.stringify({ op: 'circle', id: 'left-object', center: { x: .25, y: .45 }, r: .08 }) },
    { id: 'right-object', text: 'B', status: 'visible', kinds: ['circle'], layout: JSON.stringify({ op: 'circle', id: 'right-object', center: { x: .7, y: .45 }, r: .08 }) },
  ] } },
];

export function createHarness() {
  const cache = new Map();
  const stop = new Error('Synthetic request captured');
  let captured;
  class CaptureOpenAI {
    chat = { completions: { create: async request => { captured = structuredClone(request); throw stop; } } };
  }
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const mod = { exports: {} };
    cache.set(file, mod.exports);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(name => {
      if (name === 'openai') return { default: CaptureOpenAI };
      if (name.startsWith('@/')) return load(path.join(root, name.slice(2)) + '.ts');
      if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name) + '.ts');
      return external(name);
    }, mod, mod.exports);
    cache.set(file, mod.exports);
    return mod.exports;
  }
  const { streamGrok } = load(path.join(root, 'lib/agent/grok.ts'));
  return {
    ...load(path.join(root, 'lib/agent/concept-response.ts')),
    ...load(path.join(root, 'lib/agent/tags.ts')),
    ...load(path.join(root, 'lib/agent/teaching-intent.ts')),
    async request(testCase) {
      const previousKeys = Object.fromEntries(['XAI_API_KEY', 'OPENROUTER_API_KEY'].map(key => [key, process.env[key]]));
      process.env.XAI_API_KEY = 'synthetic-capture-only';
      process.env.OPENROUTER_API_KEY = 'synthetic-capture-only';
      captured = null;
      try {
        for await (const chunk of streamGrok([{ role: 'user', content: testCase.prompt }], null, true, undefined, false,
          { page: null, board: testCase.board ?? emptyBoard, student: { studentName: 'unknown' } })) {
          if (chunk) throw new Error('Unexpected output during capture');
        }
      } catch (error) { if (error !== stop) throw error; }
      finally {
        for (const [key, value] of Object.entries(previousKeys)) if (value === undefined) delete process.env[key]; else process.env[key] = value;
      }
      if (!captured) throw new Error('No teaching request captured');
      return captured;
    },
  };
}

export function candidateRequest(baseline, route, model, effort = 'low', settings = {}) {
  if (!['xai', 'openrouter'].includes(route)) throw new Error('Route must be xai or openrouter');
  const request = structuredClone(baseline);
  request.model = model;
  if (settings.maxTokens !== undefined) {
    if (!Number.isInteger(settings.maxTokens) || settings.maxTokens < 2400 || settings.maxTokens > 16000) throw new Error('Max tokens must be 2400 through 16000');
    request.max_tokens = settings.maxTokens;
  }
  if (settings.temperature === 'default') delete request.temperature;
  delete request.reasoning_effort;
  delete request.reasoning;
  delete request.provider;
  if (route === 'xai') {
    if (effort !== 'default') request.reasoning_effort = effort;
  } else {
    if (effort !== 'default') request.reasoning = { effort, exclude: true };
    request.provider = { sort: 'latency', require_parameters: true, allow_fallbacks: false };
  }
  request.stream_options = { include_usage: true };
  return request;
}

export async function measure(createStream, request, harness, testCase, now = () => performance.now(), onProgress = () => {}) {
  const started = now();
  const result = { case: testCase.id, modelRequested: request.model, modelReturned: null, providerReturned: null,
    firstContentMs: null, firstSpeechReadyMs: null, firstBoardReadyMs: null, totalMs: null,
    finishReason: null, appParsed: false, boardRepairNeeded: null, boardPresent: false,
    usage: null, failure: null, humanReview: 'pending', reviewCriteria: testCase.review, events: [] };
  let raw = '';
  let previousSpeech = '', previousBoard = '';
  const ids = (testCase.board?.tutorItems ?? []).map(item => item.id);
  const hasBoard = turn => turn.teaching?.visual !== 'none' && Boolean(turn.board) && !harness.needsBoardRepair(turn, null, ids);
  try {
    const stream = await createStream(request);
    for await (const part of stream) {
      if (part.error) throw new Error('Provider stream error');
      result.modelReturned = part.model ?? result.modelReturned;
      result.providerReturned = part.provider ?? result.providerReturned;
      if (part.usage) result.usage = part.usage;
      const choice = part.choices?.[0];
      if (choice?.finish_reason) result.finishReason = choice.finish_reason;
      const text = choice?.delta?.content;
      if (typeof text !== 'string' || !text) continue;
      result.firstContentMs ??= Math.round(now() - started);
      raw += text;
      if (raw.length > 100_000) throw new Error('Response exceeded benchmark bound');
      const turn = harness.parseAgentTurn(harness.conceptProgress(raw));
      if (turn.speech) result.firstSpeechReadyMs ??= Math.round(now() - started);
      if (hasBoard(turn)) result.firstBoardReadyMs ??= Math.round(now() - started);
      const boardJSON = JSON.stringify(turn.board ?? null);
      if (turn.speech !== previousSpeech || boardJSON !== previousBoard) {
        const event = { atMs: Math.round(now() - started), speech: turn.speech, board: turn.board ?? null,
          firstContentMs: result.firstContentMs, firstSpeechReadyMs: result.firstSpeechReadyMs, firstBoardReadyMs: result.firstBoardReadyMs };
        result.events.push(event);
        onProgress(event);
        previousSpeech = turn.speech; previousBoard = boardJSON;
      }
    }
    const turn = harness.parseAgentTurn(harness.conceptResponse(raw));
    result.appParsed = true;
    if (turn.speech) result.firstSpeechReadyMs ??= Math.round(now() - started);
    if (hasBoard(turn)) result.firstBoardReadyMs ??= Math.round(now() - started);
    result.boardPresent = hasBoard(turn);
    result.boardRepairNeeded = harness.needsBoardRepair(turn, null, ids);
    const availableIds = new Set(ids);
    result.unresolvedHighlightIds = [];
    for (const command of turn.board?.commands ?? []) {
      if (command.op === 'highlight' && !availableIds.has(command.id)) result.unresolvedHighlightIds.push(command.id);
      else if (['text','circle','line','arrow','curve','axes'].includes(command.op)) availableIds.add(command.id);
      else if (command.op === 'remove') availableIds.delete(command.id);
      else if (command.op === 'clear') availableIds.clear();
    }
    result.speech = turn.speech;
    result.board = turn.board ?? null;
    if (result.finishReason !== 'stop') result.failure = 'stream_did_not_finish_normally';
    else if (!turn.speech || turn.think) result.failure = 'no_substantive_teaching_response';
  } catch (error) {
    // Do not dump provider error bodies or credentials into reports.
    result.failure = error instanceof SyntaxError ? 'invalid_json' : 'request_or_parse_failed';
    result.httpStatus = Number.isInteger(error?.status) ? error.status : null;
    result.timedOut = ['TimeoutError', 'APIConnectionTimeoutError'].includes(error?.name);
  }
  result.totalMs = Math.round(now() - started);
  result.rawContent = raw; // Synthetic content only; retain unfiltered output for disclosure/schema review.
  return result;
}

async function main() {
  if (process.cwd() !== root) throw new Error('Run from the repository root so the real prompt loader reads this checkout');
  const args = process.argv.slice(2);
  if (args.includes('--live') && args.includes('--dry-run')) throw new Error('Choose --live or --dry-run, not both');
  const options = { route: 'xai', model: null, effort: 'low', runs: 1, case: 'all', live: false, maxTokens: undefined, temperature: 'baseline' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--live') options.live = true;
    else if (args[i] === '--dry-run') continue;
    else if (args[i] === '--help') {
      console.log('node scripts/bench-tutor-models.mjs [--dry-run|--live] [--route xai|openrouter] [--model ID] [--effort default|none|minimal|low|medium|high] [--case ID|all] [--runs 1..5] [--max-tokens 2400..16000] [--temperature baseline|default]\nDefault: offline request metadata only. --live sends synthetic cases, requires the route API key in the environment, and consumes credits. JSON report goes to stdout. No TTS, browser access, or tutor changes.');
      return;
    } else if (['--route','--model','--effort','--case','--runs','--max-tokens','--temperature'].includes(args[i]) && args[i + 1]) {
      const key = args[i] === '--max-tokens' ? 'maxTokens' : args[i].slice(2);
      options[key] = ['runs','maxTokens'].includes(key) ? Number(args[++i]) : args[++i];
    } else throw new Error('Unknown or incomplete argument; use --help');
  }
  if (!Number.isInteger(options.runs) || options.runs < 1 || options.runs > 5) throw new Error('Runs must be 1 through 5');
  if (!['default','none','minimal','low','medium','high'].includes(options.effort)) throw new Error('Unsupported effort option');
  if (!['baseline','default'].includes(options.temperature)) throw new Error('Temperature must be baseline or default');
  if (options.live && !options.model) throw new Error('--live requires an explicit --model');
  if (options.route === 'openrouter' && !options.model) throw new Error('OpenRouter requires an explicit --model');
  const selected = cases.filter(c => options.case === 'all' || c.id === options.case);
  if (!selected.length) throw new Error('Unknown case');
  const harness = createHarness();
  const requests = [];
  for (const c of selected) {
    const baseline = await harness.request(c);
    requests.push({ testCase: c, request: candidateRequest(baseline, options.route, options.model ?? baseline.model, options.effort, options) });
  }
  const report = { kind: options.live ? 'live-synthetic-teaching-benchmark' : 'offline-request-audit',
    revision: execFileSync('git', ['rev-parse','HEAD'], { encoding: 'utf8' }).trim(),
    dirty: Boolean(execFileSync('git', ['--no-optional-locks','-c','core.fsmonitor=false','status','--porcelain'], { encoding: 'utf8' }).trim()),
    generatedAt: new Date().toISOString(), route: options.route, effort: options.effort, runs: options.runs,
    scope: 'Deep teaching request only. No routing, retrieval, images, STT, TTS, playback, repair request, or semantic correctness measurement. Synthetic board metadata only.',
    requests: requests.map(({ testCase, request }) => ({ case: testCase.id, model: request.model,
      inputCharacters: JSON.stringify(request.messages).length, inputSha256: createHash('sha256').update(JSON.stringify(request.messages)).digest('hex'),
      maxTokens: request.max_tokens, temperature: request.temperature ?? 'provider_default', responseFormat: request.response_format?.json_schema?.name,
      provider: request.provider ?? null })), results: [] };
  if (options.live) {
    const keyName = options.route === 'xai' ? 'XAI_API_KEY' : 'OPENROUTER_API_KEY';
    if (!process.env[keyName]) throw new Error(`${keyName} is required in the process environment. Never paste keys into a chat or tracked file.`);
    const client = new OpenAI({ apiKey: process.env[keyName], baseURL: options.route === 'xai' ? 'https://api.x.ai/v1' : 'https://openrouter.ai/api/v1', maxRetries: 0, timeout: 60_000 });
    for (let run = 1; run <= options.runs; run++) for (const { testCase, request } of requests) {
      const result = await measure(body => client.chat.completions.create(body, { signal: AbortSignal.timeout(60_000) }), request, harness, testCase);
      report.results.push({ run, ...result });
      console.error(`${testCase.id} ${run}/${options.runs}: ${result.failure ?? 'completed; human review pending'}`);
    }
  }
  console.log(JSON.stringify(report, null, 2));
  if (report.results.some(r => r.failure)) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`Benchmark stopped: ${error.message}`); process.exitCode = 1; });
}
