# Active task

Updated: 2026-09-16
State: ready_for_review
Branch: lane/post-hackathon-local
Base: 88892ff6bfd63aa4e5f1ada6933ed8911c8ed036

## Objective

Correct the Opus trial after David reported out-of-order letters, box-only explanations, and missing requested equations. Inspect the saved visible session before judging the model.

## Scope and constraints

Local only. Preserve 3105/3106, paused 3107, browser histories, and private data. No publication or production model choice. Human PROMPT/PEDAGOGY and shared types unchanged. No private-session transmission.

## Progress

September 16: restarted 3107 detached, same data/origin, HTTP 200. Later mic stall had live tracks but no detector frames. One UI retry restored Listening and fresh PCM/probabilities after five seconds. No code change; physical speech remains unverified.

Restored DRAW/ANIM/math with per-beat visual validation. Panels remain optional. Shared-clock prefixes prevent independent letter animation; queued groups no longer restart the current timer. Compact legends stay beside diagrams.

## Decisions

Keep Opus low for a fair capability test, not a production endorsement. Our panel-only restriction caused missing equations.

## Validation

Two synthetic calls produced waves and equations. Browser check: 297 frames, no ordering violations. Streaming/disclosure/layout/math/review/voice/session checks, TypeScript, and lint pass. Evidence and semantic limitations: [trial guide](TUTOR_TRIAL.md).

## Next action

Retry a requested equation or spatial explanation at 3107. Judge actual diagram relevance, clarity, ordered rendering, and voice completion. This correction is ready for human review; broader scientific accuracy and cross-subject evaluation remain open.

## Blockers

Update incident: replacing the board module reset the paused trial board and autosave saved it empty. Transcript remains; old drawings were not recovered. A tab-owned development store now survives module replacement, tested with retained callbacks/subscriptions.

Groundtrack tools unavailable. Physical audio/prosody remains a human check. Earlier Chrome session review remains queued.
