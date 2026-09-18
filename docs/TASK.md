# Active task

Updated: 2026-09-18
State: ready_for_review
Branch: lane/post-hackathon-local
Base: d68cd607a64bad917c9e001675a6677e4457056b

## Objective

Fix interrupted trial explanations while preserving fast first speech, graded-work limits, and existing sessions. Board redesign stays deferred.

## Scope and constraints

Local voice lane only. Preserve all existing origins and private data. Frozen prompts/shared types and publication freeze remain. Groundtrack unavailable.

## Progress

The previous audio-drain fix is in 1185aec. David's 3108 retest finished its first sentence, then stopped: logs identify disclosure_boundary in beat 2, not demonstrated TTS truncation. Exact rejected text was not retained.

Fixed a reproduced guard false positive for numeric givens formatted with TeX units/degrees. Added one bounded trial continuation request on visual rejection, preserving accepted output and teaching intent. Revalidates the combined lesson; no repeated opening or rejected narration. Successful requests need no extra call; a rejection can add one call and waiting. [Evidence and limits](evaluations/2026-09-18-guard-recovery.md).

## Decisions

Model, voice, disclosure restrictions, and first-beat streaming remain. User confirmed JSON export produced no download. Do not update/restart live 3107/3108 without verified recovery. New isolated 3109 has independent storage, signing, and build; .data/voice-trial-3109/latest.json and server-2026-09-18.log identify it.

## Validation

Teaching-intent, concept-recovery, concept-lessons/trial adapter, teaching-panels, TypeScript, focused lint, and diff checks passed. One synthetic provider request completed two visual steps and a question without recovery: first speech text 6.760s, total 10.897s, not audible latency. 3109 landing UI loaded; microphone unactivated. No human acoustic verification of this patch.

## Next action

David tests a fresh session at http://localhost:3109. If it stops, correlate validation/recovery events with playback_end. Judge complete diagrams once continuation is reliable. Export failure is recorded; do not mistake another click for a backup. Larger latency comparison and Chrome review stay queued.

## Blockers

Exact rejected payload and acoustic/diagram quality remain unverified. Groundtrack unavailable. Older trials remain because their session recovery has not been verified.
