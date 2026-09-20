# Active task

Updated: 2026-09-20
State: in_progress
Branch: lane/post-hackathon-local
Base: 3b3dceb85eed13bb9a0668423f18ba962365927e

## Objective

Warm, modern voice-first UI foundation and server cleanup. Preserve the broader PRODUCT_CHECKLIST.

## Scope and constraints

Local voice/workspace UI only. Keep plain orb, voice logic, PDFs and saves. No deployment/frozen-contract change. Groundtrack unavailable. Preserve live 3114.

## Progress

Stopped verified BOH listeners 3107–3113, retaining all files/browser saves. Kept 3114 and isolated 3115. Shared surfaces/navigation and explicit active-state labels/motion implemented. David rejected boxed welcome controls; restored the restrained version. Latest correction: Tap to speak is a noninteractive label; only the orb starts voice. Typing defaults closed and must be closed at handoff.

## Decisions

No border/fill/icon on the welcome start cue; avoid boxing every action. Keep subtle hover/focus for secondary controls. State labels/motion do not change voice behavior. See UI_FOUNDATION.md.

## Validation

Typecheck/lint and desktop/state checks passed before the final label correction. Rechecking final label semantics. No provider calls. Evidence: evaluations/2026-09-20-voice-foundation.md.

## Next action

Finish final 3115 review/checkpoint. Follow PRODUCT_CHECKLIST for voice reliability, latency and whiteboard work.

## Blockers

Physical iPad/acoustic review remains pending. Preserve stopped-origin data and current sessions.
