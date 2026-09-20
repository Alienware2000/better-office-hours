# Current status

Updated: 2026-09-20
By: Codex, David's local continuation
Branch: lane/post-hackathon-local
Submitted baseline: b74e11a85dab17a5951fdee6cd574b83b91e3c15

## Authority

September 20: David reports the hackathon win and authorizes continued development/consolidation. The contest hold is retired. Vercel remains paused until explicitly reopened. Current work is local; no push, PR, deployment, or public reopening occurred. [DEVELOPMENT](DEVELOPMENT.md) defines baseline, trial, evaluation, and promotion.

David requested frictionless reorientation across coding agents, fresh chats, and different checkouts. See [TASK](TASK.md) for the active slice and [WORKFLOW](WORKFLOW.md) for commands. Current instructions are in [AGENTS](../AGENTS.md). Historical build notes and completed tasks are [archived](archive/README.md), not current work orders.

## Local runtime

- Checkout: `/Users/davidantwi/.codex/worktrees/59de/boh`. Reorient in each checkout; cached state is not code/data synchronization.
- Default: `npm ci`, then `npm run dev:local` on loopback 3105, with checkout-local .data. Cloud storage and Google auth are disabled. Local signing secrets are separate from production.
- Original trial 3107 remains untouched. Snapshot: .data/voice-trial/latest.json; log: server-2026-09-16.log in that directory.
- Patched trial: `npm run trial:tutor -- --port 3109`, isolated under .data/voice-trial-3109. September 19: 3109 HTTP/UI and saved session load verified; 3105 stopped. Audio quality remains unverified; later beat-3 stale_drawing failure persists. 3108 remains intact.
- Inspect a listener's cwd before stopping it. Preserve all origins' browser saves and PDF data. Keep live source stable; isolate browser regressions/builds. Configuration health is not proof of usable provider credits.

## Product baseline

One adaptive paper desk serves homework/PDF and concepts/whiteboard. Generated diagrams, local LaTeX, audio-timed visual beats, scene continuity, student ink, PDF highlights, and browser-local session recovery/export are implemented. Optional scoped Canvas ingestion/retrieval and student-first spoken recap are integrated. Private Vercel Blob stores public-runtime course/PDF data; Supabase remains optional. Full conversation/board/recap histories are browser-local, not cloud session sync or cross-session learner memory.

Hussein #6/#8/#9 and integration #10/#12/#13/#14 are included in the submitted baseline. #11 is a separate local reconciliation topic: its forced login and body-email/shared-bearer ingestion conflict with the optional/scoped-owner flow. No merge or remote change is authorized. OpenRouter/Opus is the current local candidate, not yet the default product configuration.

## Open issues

- September 14 priority: David reports severe latency, missing board use, and speech/visual disagreements across subjects. [TUTOR_EVALUATION](TUTOR_EVALUATION.md) records the requirements, source audit, synthetic comparison harness, and queued review of every saved Chrome session. The new every-spoken-turn board requirement is in DESIGN and is not yet implemented.

- Cadence: historical deep-request-to-first-audio medians were roughly 9 to 13 seconds, excluding endpointing/STT/routing. Quick work checks still incur reasoning latency. No fresh latency benchmark in this task.
- Visual correctness: a generated Follow object stayed stationary while its arrow changed. Renderer correctness does not guarantee model semantics. Replay actual specs/transcripts before choosing a fix.
- Teaching: repeated questions after confusion and an ungrounded recap reference were recorded. Do not infer understanding from tutor notes or assent. Keep graded-answer protection and direct ungraded concept teaching.
- Hardware: quiet speech, echo, interruption, and device failure need actual user evidence before retuning.
- Groundtrack: hooks 0.1.7 and Codex project config installed at 0d345a1; local Doctor passed. Tools remain unavailable in this task. Sign-in, hook approval, and one live verification event are still pending. Local handoffs do not depend on it.

## Next

Use `npm run context` to reorient and `npm run handoff` before switching chats. See WORKFLOW for older checkouts, independent clones, and cross-machine transfer.

Consolidation precedes board changes. Latest origin/main README update is merged locally; remote main remains unchanged. 3110 is the preserved candidate, reported working well. [DEVELOPMENT](DEVELOPMENT.md) tracks promotion and [board feedback](evaluations/2026-09-20-board-feedback.md) the next product slice. Jev deferred; Vercel paused.
