# Active task

Updated: 2026-09-20
State: in_progress
Branch: lane/post-hackathon-local
Base: 27899cd31cf3b62a70080d2f011f6b568d797d83

## Objective

Add optional typing with the same tutor/whiteboard and independent microphone mute, explicitly requested by David. This supersedes the older voice-only input rule.

## Scope and constraints

Local voice/workspace only. Preserve 3111/3112 and all saves/PDFs. Vercel paused. No provider, frozen prompt, or shared type changes. Groundtrack unavailable.

## Progress

Typed input bypasses permission/STT and uses the existing lesson, board, narration, guardrail, and transcript path. Opening typing mutes input; it does not stop output. Separate mic mute survives response completion without aborting inference or playback. Stop/Interrupt remains separate.

## Decisions

Drafting is allowed while responding; Send waits until done or explicitly stopped. Enter sends, Shift+Enter inserts a line, IME composition does not send. Unsent drafts stay in this desk only. Typed mode still produces spoken output/captions; no silent-output feature added. Prior automatic-listening/prose fixes remain.

## Validation

Focused lifecycle tests and typecheck/lint pass. Full offline gate/browser inspection underway; see [evidence](evaluations/2026-09-20-typed-input.md). Hardware speech/noise checks still need human evidence.

## Next action

Finish validation, launch isolated preview, inspect typing/mute controls, checkpoint.

## Blockers

No verified session backups; preserve existing origins. Prior acoustic/iPad review remains pending.
