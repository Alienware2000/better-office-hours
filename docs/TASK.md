# Active task

Updated: 2026-09-14
State: in_progress
Branch: lane/post-hackathon-local
Base: 189cc7f5028ca8d2a18c9762d8dea8371fabf3cf

## Objective

Reduce tutor latency while retaining smart teaching and accurate whiteboard use. Compare OpenRouter/model options; review David's saved Chrome sessions separately.

## Scope and constraints

Local only. Preserve the running tutor, Chrome sessions, private exports, and submitted baseline. No provider-default change without comparison and David's choice. PROMPT/PEDAGOGY and lib/types.ts remain frozen. No production writes or transmission of private sessions to new providers.

## Progress

Recorded every-spoken-turn board use and narration/visible-state agreement in DESIGN; these are not yet implemented. Audited routing, deep generation, TTS, buffering, timing boundaries, and visual exceptions. Added bench-tutor-models.mjs and check-tutor-benchmark.mjs with five synthetic cases and real request capture/parsing. Full findings, candidate screening, commands, and saved-session review procedure are in [TUTOR_EVALUATION](TUTOR_EVALUATION.md). No live model calls, Chrome inspection, or runtime changes.

## Decisions

Compare Grok directly and via OpenRouter before attributing differences to a model change. Measure content, speech readiness, board readiness, and completion separately. Same prompt/schema/budget; explicit effort/provider settings; no hidden retries/fallbacks. Human quality review and actual rendered/audio timing remain necessary. Preserve all-turn board scope rather than silently narrowing it.

## Validation

Offline benchmark suite and changed-script lint pass. Dry-run inputs contain 48,676 to 49,139 serialized message characters, not a latency measurement. Document links, archive fidelity, unchanged runtime/frozen files, diff formatting, and both context budgets pass. Full context overflow was resolved by compacting duplicate detail into existing references.

## Next action

Configure OPENROUTER_API_KEY through local secret handling. Run TUTOR_EVALUATION's small synthetic comparison, review output/rendering, then expand repetitions before selecting a model. Review every saved Chrome session across topics when that separate task starts. Archive this task only when the agreed latency slice is complete.

## Blockers

OpenRouter key is not configured; live comparisons have not run. Groundtrack tools are unavailable. Chrome origin/session inventory and the reported stars-related mismatch are unverified. Latency and broader board coverage remain unresolved.
