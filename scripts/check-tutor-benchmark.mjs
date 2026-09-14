// Offline checks: real request capture/parsing with a synthetic provider stream.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHarness, candidateRequest, measure, cases } from './bench-tutor-models.mjs';

const harness = createHarness();
const beforeKey = process.env.XAI_API_KEY;
const baseline = await harness.request(cases[0]);
assert.equal(process.env.XAI_API_KEY, beforeKey, 'Capture restores the prior environment');
assert.equal(baseline.response_format.json_schema.name, 'concept_lesson');
assert.ok(baseline.messages.some(m => m.content.includes('board_ownership')));
assert.ok(baseline.messages.some(m => m.content.includes(cases[0].prompt)));
assert.ok(baseline.messages.some(m => m.content.includes('Never give the final answer')));
const nextCase = await harness.request(cases[1]);
assert.ok(nextCase.messages.some(m => m.content.includes(cases[1].prompt)));
assert.ok(!nextCase.messages.some(m => m.content.includes(cases[0].prompt)), 'Cases cannot share captured inputs');
const routed = candidateRequest(baseline, 'openrouter', 'synthetic/model', 'minimal');
assert.equal(routed.reasoning_effort, undefined);
assert.equal(routed.reasoning.effort, 'minimal');
assert.equal(routed.provider.require_parameters, true);
assert.equal(routed.provider.allow_fallbacks, false);
assert.deepEqual(routed.messages, baseline.messages, 'Compare the same real prompt');
assert.deepEqual(routed.response_format, baseline.response_format);
assert.equal(baseline.reasoning_effort, 'low', 'Candidate configuration cannot mutate the baseline');
const quality = candidateRequest(baseline, 'openrouter', 'synthetic/model', 'high', { maxTokens: 8000, temperature: 'default' });
assert.equal(quality.max_tokens, 8000);
assert.equal(quality.temperature, undefined, 'Models without temperature support can retain strict parameter routing');
assert.equal(baseline.max_tokens, 2400);
assert.equal(baseline.temperature, .5);
assert.throws(() => candidateRequest(baseline, 'openrouter', 'synthetic/model', 'high', { maxTokens: 100000 }));
assert.equal(candidateRequest(baseline, 'openrouter', 'synthetic/model', 'default').reasoning, undefined);
assert.throws(() => candidateRequest(baseline, 'unknown', 'synthetic/model'));

const lesson = { handoff: false, move: 'explain', visual: 'diagram', introduction: 'Consider this object.',
  beats: [{ pdf: '', draw: [JSON.stringify({ op: 'circle', id: 'object', center: { x: .4, y: .4 }, r: .1 })], animation: '', speech: 'This circle is our object.' }], question: '' };
async function run(text, finish = 'stop', before = []) {
  let time = 0;
  return measure(async () => (async function* () {
    for (const chunk of before) { time += 100; yield chunk; }
    for (let i = 0; i < text.length; i++) {
      time += 10;
      yield { model: 'synthetic/returned', provider: 'synthetic-endpoint', choices: [{ delta: { content: text[i] } }] };
    }
    time += 10;
    yield { choices: [{ delta: {}, finish_reason: finish }] };
    yield { choices: [], usage: { prompt_tokens: 10, completion_tokens: 20 } };
  })(), routed, harness, cases[0], () => time);
}
const result = await run(JSON.stringify(lesson), 'stop', [{ choices: [{ delta: { reasoning: 'Reasoning must not count as speech or appear in the report.' } }] }]);
assert.equal(result.firstContentMs, 110);
assert.ok(result.firstSpeechReadyMs > result.firstContentMs);
assert.ok(result.firstBoardReadyMs > result.firstSpeechReadyMs, 'JSON arrival and playable visual are different milestones');
assert.equal(result.appParsed, true);
assert.equal(result.boardPresent, true);
assert.equal(result.failure, null);
assert.equal(result.humanReview, 'pending', 'Parser success cannot prove teaching correctness');
assert.equal(result.providerReturned, 'synthetic-endpoint');
assert.equal(result.usage.completion_tokens, 20);
assert.ok(!JSON.stringify(result).includes('Reasoning must'));
const badVisual = await run(JSON.stringify({ ...lesson, beats: [{ ...lesson.beats[0], draw: ['{"op":"nonsense"}'] }] }));
assert.equal(badVisual.firstBoardReadyMs, null);
assert.equal(badVisual.boardRepairNeeded, true);
const truncated = await run(JSON.stringify(lesson).slice(0, -5), 'length');
assert.notEqual(truncated.failure, null);
const earlyEnd = await run(JSON.stringify(lesson), null);
assert.equal(earlyEnd.failure, 'stream_did_not_finish_normally');
const verbal = await run(JSON.stringify({ ...lesson, move: 'consolidate', visual: 'none', beats: [] }));
assert.equal(verbal.boardPresent, false, 'Old visual=none policy must remain visible in benchmark results');
const clipped = await run(JSON.stringify({ ...lesson, beats: [
  { ...lesson.beats[0], draw: Array.from({ length: 7 }, (_, i) => JSON.stringify({ op: 'text', id: `label-${i}`, at: { x: .5, y: .2 + i * .08 }, text: `Label ${i}` })) },
  { ...lesson.beats[0], draw: [JSON.stringify({ op: 'highlight', id: 'label-6' })] },
] }));
assert.ok(!clipped.board.commands.some(c => c.op === 'text' && c.id === 'label-6'));
assert.deepEqual(clipped.unresolvedHighlightIds, ['label-6'], 'A label clipped by the six-command limit must not silently pass focus review');
const failed = await measure(async () => { throw new Error('private-key-canary'); }, routed, harness, cases[0]);
assert.equal(failed.failure, 'request_or_parse_failed');
assert.ok(!JSON.stringify(failed).includes('private-key-canary'));
const refused = spawnSync(process.execPath, ['scripts/bench-tutor-models.mjs', '--live'], { encoding: 'utf8' });
assert.notEqual(refused.status, 0);
assert.ok(refused.stderr.includes('explicit --model'));
const conflict = spawnSync(process.execPath, ['scripts/bench-tutor-models.mjs', '--live', '--dry-run', '--model', 'synthetic/model'], { encoding: 'utf8' });
assert.notEqual(conflict.status, 0);
assert.ok(conflict.stderr.includes('not both'), 'A dry-run flag cannot accidentally permit a paid request');
const dry = spawnSync(process.execPath, ['scripts/bench-tutor-models.mjs'], { encoding: 'utf8' });
assert.equal(dry.status, 0, dry.stderr);
const audit = JSON.parse(dry.stdout);
assert.equal(audit.kind, 'offline-request-audit');
assert.equal(audit.requests.length, cases.length);
assert.equal(audit.results.length, 0);
assert.equal(new Set(audit.requests.map(r => r.inputSha256)).size, cases.length);
console.log('PASS: real request capture, case isolation, provider options, distinct content/speech/board readiness, reasoning exclusion, invalid visual/truncated/error handling, explicit live opt-in, and offline default. No API calls.');
