# Active task

Updated: 2026-09-20
State: in_progress
Branch: lane/post-hackathon-local
Base: d68cd607a64bad917c9e001675a6677e4457056b

## Objective

Complete speech reliably, then improve first-response latency and diagram presentation.

## Scope and constraints

Local voice lane; frozen prompts/types and graded-work limits remain. Public Vercel is paused by explicit exception to the publication freeze; resume only on request. [Pause record](evaluations/2026-09-19-public-pause.md). Groundtrack unavailable.

## Progress

Jev deferred by David until core stability improves. [Research](JEV_RESEARCH.md) records his browser/computer-use motivation for later.

September 20 source fixes false stale_drawing for existing text (no source) and detailed geometry (shortened source JSON). Identity now uses the rendered inventory; topic comparison uses rendered text. [Evidence](evaluations/2026-09-20-drawing-focus.md). Historical 3109 rejection remains unattributed.

1185aec drains accepted audio after generation errors. b1ccabd fixes numeric TeX rejection and permits one guarded continuation. [Evidence](evaluations/2026-09-18-guard-recovery.md).

## Decisions

Preserve model, voice, disclosure limits, and first-beat streaming. Preserve 3107/3108/3109: JSON export produced no verified backup. New trial 3110 has independent storage.

## Validation

Offline intent/recovery/lesson/panel checks, TypeScript and focused lint pass. Real store/serialization plus mocked provider reproduces old focus failures and completes with the fix in one request. Missing/removed/previous-page/unresolved/animation-only IDs remain rejected. No new provider calls. Acoustic completion unverified; David reports perceived latency improvement.

## Next action

Acoustically test http://localhost:3110, especially follow-ups focusing existing notes/curves. Compare first useful audio and full ending. Snapshot: .data/voice-trial-3110/run-1789879799663; HTTP 200. Do not change old snapshots or copy private data. Jev stays deferred.

## Blockers

Exact historical rejected payload is unavailable. Acoustic completion, other scene transitions, and diagram quality still need review. Groundtrack unavailable.
