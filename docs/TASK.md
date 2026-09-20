# Active task

Updated: 2026-09-20
State: in_progress
Branch: lane/post-hackathon-local
Base: d68cd607a64bad917c9e001675a6677e4457056b

## Objective

Pause public access first, then improve speech completion, first-response latency, and diagram presentation in that order. Preserve graded-work limits and existing sessions.

## Scope and constraints

Local voice lane. David authorized only the public Vercel pause as an exception to the publication freeze. No general deployment permission. Preserve private data and origins; frozen prompts/shared types remain. Groundtrack unavailable.

## Progress

September 20 requested Jev research completed: [report](JEV_RESEARCH.md). Text-only decision model; plausible advisory semantic checks, not a renderer or tutor replacement. No integration or paid calls. Evaluation proposal preserves first audio and exact drawing validation.

1185aec drains accepted audio after generation errors. b1ccabd fixes numeric TeX false positives and adds one guarded continuation, preserving accepted speech and teaching intent. Successful requests add no call; a rejection can add one. [Evidence](evaluations/2026-09-18-guard-recovery.md).

## Decisions

Model, voice, disclosure limits, and first-beat streaming remain. Preserve live 3107/3108/3109 and data: JSON export produced no backup. 3109 runtime/log are under .data/voice-trial-3109.

## Validation

Offline intent/recovery/lesson/panel checks, TypeScript, lint, and diff checks passed. One synthetic provider lesson completed: first speech text 6.760s, total 10.897s, not audible latency. David reports improved perceived latency; acoustic completion is unverified.

## Next action

Public Vercel pause is verified and remains until David requests resumption; [record](evaluations/2026-09-19-public-pause.md). Jev research is complete; no implementation selected. Next investigate 3109 stale_drawing after one recovery/two accepted beats, then compare useful-audio latency and board/narration quality. Preserve live snapshots and private data; export remains unverified. Use JEV_RESEARCH.md for a later synthetic evaluator, not an immediate serial gate before speech.

## Blockers

Exact rejected payload and acoustic/diagram quality remain unverified. Groundtrack unavailable. Older trials remain because their session recovery has not been verified.
