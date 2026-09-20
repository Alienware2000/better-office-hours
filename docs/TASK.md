# Active task

Updated: 2026-09-20
State: ready_for_review
Branch: lane/post-hackathon-local
Base: 954c97d8b1015aedae6910094da78bf2ea26df73

## Objective

Prevent background speech interrupting the tutor. David explicitly requests a muted microphone while thinking/speaking, with tap-to-speak for every turn and Escape or a touch control to interrupt and speak.

## Scope and constraints

Voice/workspace local changes only. Public Vercel paused; preserve all live snapshots/session data. No model or frozen prompt/shared type changes. Groundtrack unavailable. This priority precedes board typography.

## Progress

Implemented tap-to-speak, synchronous track/PCM gating, discarded busy pre-roll, and Escape/Interrupt floor transfer. The first tap opens listening without a greeting. Normal completion stays muted. [Evidence](evaluations/2026-09-20-tap-to-speak.md) records research, behavior, tests, and limits.

## Decisions

Thinking/transcription/playback mute input; normal completion resumes listening. Busy control is Interrupt, Escape has the same action. While listening it remains Pause for full suspension. Background audio is discarded, never queued for later transcription. Preserve explicit writing/session/visibility cancellation and student ink.

## Validation

All 16 offline checks, typecheck, and focused lint pass. Actual controls rendered/inspected in isolated static fixtures; real-device validation pending. Synthetic audio checks are not real-device noise evidence.

## Next action

Human retest of tap-to-speak, three-second thinking pauses, manual finish, and deliberate interruption. Tune endpoint only from evidence. Keep 3110 untouched. Board typography remains next after voice review.

## Blockers

Actual iPad/headphone/speaker tests require human evidence. Existing session exports remain unverified. Consolidation/transcript review checkpoint archived; release gaps remain in DEVELOPMENT.
