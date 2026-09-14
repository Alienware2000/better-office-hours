# Active task

Updated: 2026-09-14
State: in_progress
Branch: lane/post-hackathon-local
Base: 189cc7f5028ca8d2a18c9762d8dea8371fabf3cf

## Objective

Find the strongest teaching model that can respond quickly with accurate whiteboard use. Quality is the gate, then latency. Compare OpenRouter/model options; review David's saved Chrome sessions separately.

## Scope and constraints

Local only. Preserve the running tutor, Chrome sessions, private exports, and submitted baseline. No provider-default change without comparison and David's choice. PROMPT/PEDAGOGY and lib/types.ts remain frozen. No production writes or transmission of private sessions to new providers.

## Progress

Board requirements recorded, not implemented. Benchmark supports explicit budgets, temperature omission, and unresolved-highlight diagnostics. David's OpenRouter key is stored only in ignored benchmark config. Eleven synthetic pilot requests completed for Grok, Astra, Opus, Fable, and Gemini Pro. See [pilot results](evaluations/2026-09-14-model-pilot.md) and [TUTOR_EVALUATION](TUTOR_EVALUATION.md). No runtime or Chrome changes; no model selected.

## Decisions

Compare Grok directly and via OpenRouter before attributing differences to a model change. Measure content, speech readiness, board readiness, and completion separately. Same prompt/schema/budget; explicit effort/provider settings; no hidden retries/fallbacks. Human quality review and actual rendered/audio timing remain necessary. Preserve all-turn board scope rather than silently narrowing it.

## Validation

Eleven live reports share identical message hashes. Offline benchmark checks, changed-script lint, context budgets, and diff formatting pass. Credential is ignored, mode 600, and absent from reports/changed files. Runtime/frozen files are unchanged. Pilot timings exclude actual audio/rendering and do not establish quality or tail latency.

## Next action

Expand Opus/Astra checks across subjects with repeated samples and pinned/recorded providers, then review rendered boards and actual voice latency. Investigate Gemini's repeated empty-object output separately rather than rerunning identical requests. Review every saved Chrome session when that task starts. Archive only when the agreed latency slice is complete.

## Blockers

Groundtrack tools are unavailable. Chrome origin/session inventory and the reported stars-related mismatch are unverified. Latency and broader board coverage remain unresolved. Provider/parser compatibility failures in the initial pilot need investigation; one-case timing is not a model ranking.
