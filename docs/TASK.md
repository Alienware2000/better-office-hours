# Active task

Updated: 2026-09-17
State: ready_for_review
Branch: lane/post-hackathon-local
Base: d68cd607a64bad917c9e001675a6677e4457056b

## Objective

Investigate David's sparse trial diagrams and abruptly cut speech; fix the bounded response/playback failure without starting the deferred board redesign.

## Scope and constraints

Local voice/board work only. Preserve 3105/3106/3107 and private history. Frozen human prompts/shared types and graded-work limits remain. Latency and quality together remain the priority. Groundtrack unavailable.

## Progress

Two 3107 streams failed after initial visuals, without cancellation; the precise cause was not logged. A reproduced client bug aborted accepted audio on later SSE errors. The source/3108 fix lets accepted beats finish before reporting failure, withholds incomplete output, and preserves pause/barge-in/new-turn cancellation. Generation deadlines end before audio drains. Safe visual failure codes identify the failing beat.

[Investigation](evaluations/2026-09-17-incomplete-responses.md) records evidence and limits. One synthetic Opus request completed two visual beats, so it did not reproduce the historical generation failure. No private inputs or TTS.

## Decisions

Model, voice, teaching limits, and first-beat streaming are unchanged. Board redesign stays deferred. Recovery export could not be verified, so 3107 is untouched. Patched 3108 has independent sessions/storage/signing; .data/voice-trial-3108/latest.json and server-2026-09-17.log identify its snapshot/log.

## Validation

Voice lifecycle, concept streaming, and teaching-panel checks pass, including late-error playback completion and new-turn isolation. TypeScript, focused lint, diff/context checks pass. 3108 landing UI loads, microphone unactivated. No acoustic verification.

## Next action

David tests a fresh session at http://localhost:3108. Correlate any generation error code/beat with playback_end. Evaluate complete diagrams after generation is reliable. Broader latency comparison and Chrome review remain queued.

## Blockers

Exact historical failure and diagram/acoustic quality remain unverified. Do not patch/restart 3107 without recovery. Groundtrack unavailable; publication freeze remains.
