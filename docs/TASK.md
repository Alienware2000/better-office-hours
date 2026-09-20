# Active task

Updated: 2026-09-20
State: ready_for_review
Branch: lane/post-hackathon-local
Base: 3b3dceb85eed13bb9a0668423f18ba962365927e

## Objective

Warm, modern voice-first UI foundation and server cleanup. Preserve the broader PRODUCT_CHECKLIST.

## Scope and constraints

Local voice/workspace UI only. Keep plain orb, voice logic, PDFs and saves. 3115 now has a saved homework conversation; do not treat it as an unused test draft. No deployment/frozen-contract change. Groundtrack unavailable. Preserve live 3114.

## Progress

Stopped verified BOH listeners 3107–3113, retaining all files/browser saves. Kept 3114 and isolated 3115. Shared surfaces/navigation and explicit active-state labels/motion implemented. David rejected boxed welcome controls; restored the restrained version. Latest correction: Tap to speak is a noninteractive label; only the orb starts voice. Typing defaults closed. Welcome now asks “What do you want to work on?” per David.

## Decisions

No border/fill/icon on the welcome start cue; avoid boxing every action. Keep subtle hover/focus for secondary controls. State labels/motion do not change voice behavior. See UI_FOUNDATION.md.

## Validation

Prior UI typecheck/lint pass; welcome-only copy change passes diff checks. Browser verifies one Tap to speak button (the orb), a plain text caption, and typing closed. Active states inspected synthetically. No provider calls. Evidence: evaluations/2026-09-20-voice-foundation.md.

## Next action

David reviews 3115 (9e0e00b). Next proposed slice: board text, label collisions and meaningful color, with first-audio latency retained as a guardrail. Acoustic/iPad review stays open.

## Blockers

Physical iPad/acoustic review remains pending. Preserve stopped-origin data and current sessions.
