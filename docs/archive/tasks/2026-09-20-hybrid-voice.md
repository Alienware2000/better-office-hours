# Active task

Updated: 2026-09-20
State: ready_for_review
Branch: lane/post-hackathon-local
Base: 954c97d8b1015aedae6910094da78bf2ea26df73

## Objective

David requests automatic listening after tutor playback, clearer microphone affordance, and readable board prose containing symbols. Tap-every-turn in 3111 felt cumbersome.

## Scope and constraints

Local voice/whiteboard only. Vercel paused. Preserve all live snapshots/saves, especially 3111. No model, frozen prompt, or shared type changes. Groundtrack unavailable.

## Progress

Completed turns rearm input after audio drains; busy input stays muted. Pause/cancellation/error safeguards remain. Start/resume shows a mic icon and Tap to speak. Trial guidance updated.

Inline m_{2} in prose becomes m₂ in ordinary text; equations retain LaTeX. See [evidence](evaluations/2026-09-20-hybrid-voice-prose.md).

## Decisions

Tap once to begin; completion automatically listens. Escape/Interrupt takes the floor; Pause suspends listening. Three-second endpoint remains provisional. No provider migration or general rich-text redesign.

## Validation

16 offline checks pass, including audio-drain/reopen and inline-prose regressions. Typecheck and targeted lint pass. Real components rendered and visually inspected with synthetic content; real acoustic/iPad validation pending.

## Next action

Retest http://localhost:3112 (131bfaf): automatic follow-up, interruption, pause, and prose. Preserve 3111 and its PDFs/saves. Broader board consistency follows voice review.

## Blockers

Real-device speech/noise evidence pending; session exports remain unverified. Existing archived drawings are not migrated. Consolidation/release gaps remain in DEVELOPMENT.
