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

Restored rich visuals, ordered lettering, compact legends, and development-refresh preservation. Server restart and microphone retry recovered local access. David now likes the drawings and perceived speed but misses intentional animation and finds explanations curt.

Read-only review confirmed a stale Brownian takeaway on the projectile page and a static, 74-word projectile response. [Scene review](evaluations/2026-09-16-scene-direction.md) records evidence, the likely pagination gap, and a proposed next slice. No runtime or session changes during this review.

## Decisions

Keep Opus low for a fair capability test, not a production endorsement. Our panel-only restriction caused missing equations.

## Validation

Two synthetic calls produced waves and equations. Browser check: 297 frames, no ordering violations. Streaming/disclosure/layout/math/review/voice/session checks, TypeScript, and lint pass. Evidence and semantic limitations: [trial guide](TUTOR_TRIAL.md).

## Next action

Proposed next slice: general scene continuity and purposeful visual sequencing, preserving first-response speed. Use projectile motion as a regression example, never a scripted runtime scene. No implementation started; explanation-style work can follow. See the scene review above.

## Blockers

Update incident: replacing the board module reset the paused trial board and autosave saved it empty. Transcript remains; old drawings were not recovered. A tab-owned development store now survives module replacement, tested with retained callbacks/subscriptions.

Groundtrack tools unavailable. Physical audio/prosody remains a human check. Earlier Chrome session review remains queued.
