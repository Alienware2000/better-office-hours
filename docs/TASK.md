# Active task

Updated: 2026-09-19
State: in_progress
Branch: lane/post-hackathon-local
Base: d68cd607a64bad917c9e001675a6677e4457056b

## Objective

Pause public access first, then improve speech completion, first-response latency, and diagram presentation in that order. Preserve graded-work limits and existing sessions.

## Scope and constraints

Local voice lane. David authorized only the public Vercel pause as an exception to the publication freeze. No general deployment permission. Preserve private data and origins; frozen prompts/shared types remain. Groundtrack unavailable.

## Progress

1185aec drains accepted audio after generation errors. b1ccabd fixes numeric TeX false positives and adds one guarded continuation, preserving accepted speech and teaching intent. Successful requests add no call; a rejection can add one. [Evidence](evaluations/2026-09-18-guard-recovery.md).

## Decisions

Model, voice, disclosure limits, and first-beat streaming remain. Preserve live 3107/3108/3109 and data: JSON export produced no backup. 3109 runtime/log are under .data/voice-trial-3109.

## Validation

Offline intent/recovery/lesson/panel checks, TypeScript, lint, and diff checks passed. One synthetic provider lesson completed: first speech text 6.760s, total 10.897s, not audible latency. David reports improved perceived latency; acoustic completion is unverified.

## Next action

September 19: David reports somewhat improved perceived latency and authorizes speech, latency, and diagram work, with public access paused first. Vercel project better-office-hours (prj_IOWquvgWDDE06vwIxZn4scu6twV1) was paused successfully via API. Main URL, alternate alias, and production deployment URL verified HTTP 503 DEPLOYMENT_PAUSED. No deployment, data deletion, or local restart. Details/resume procedure: [pause record](evaluations/2026-09-19-public-pause.md).

Next locally investigate 3109 stale_drawing at beat 3 after one recovery and two accepted beats. 3109 saved session/PDF loaded; keep live snapshot unchanged without recovery. Then compare useful-audio latency and complete board/narration before diagram work. 3105 is stopped; older trials preserved. JSON export still unverified. No claim of acoustic completion.

## Blockers

Exact rejected payload and acoustic/diagram quality remain unverified. Groundtrack unavailable. Older trials remain because their session recovery has not been verified.
