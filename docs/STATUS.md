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
- Running: 3114 retains David’s current session; 3115 retains live 9e0e00b; refined Back to start is source-only pending a safe preview refresh. Old listeners 3107–3113 stopped at David’s request; snapshots, storage, and browser saves retained. 3105 stopped. See [checklist](PRODUCT_CHECKLIST.md) for server discipline. Never swap another origin’s data.
- Inspect a listener's cwd before stopping it. Preserve all origins' browser saves and PDF data. Keep live source stable; isolate browser regressions/builds. Configuration health is not proof of usable provider credits.

## Product baseline

One adaptive paper desk serves homework/PDF and concepts/whiteboard. Generated diagrams, local LaTeX, audio-timed visual beats, scene continuity, student ink, PDF highlights, and browser-local session recovery/export are implemented. Optional scoped Canvas ingestion/retrieval and student-first spoken recap are integrated. Private Vercel Blob stores public-runtime course/PDF data; Supabase remains optional. Full conversation/board/recap histories are browser-local, not cloud session sync or cross-session learner memory.

Hussein #6/#8/#9 and integration #10/#12/#13/#14 are included in the submitted baseline. #11 is a separate local reconciliation topic: its forced login and body-email/shared-bearer ingestion conflict with the optional/scoped-owner flow. No merge or remote change is authorized. OpenRouter/Opus is the current local candidate, not yet the default product configuration.

## Open issues

- Latency, board use, and speech/visual agreement remain priorities. [Session review](evaluations/2026-09-20-session-review.md) covers 33 transcripts found in checked browser histories, not every historical origin or timed visual. Every-spoken-turn board use is not yet universal.

- Cadence: historical deep-request-to-first-audio medians were roughly 9 to 13 seconds, excluding endpointing/STT/routing. Quick work checks still incur reasoning latency. No fresh latency benchmark in this task.
- Visual correctness: a generated Follow object stayed stationary while its arrow changed. Renderer correctness does not guarantee model semantics. Replay actual specs/transcripts before choosing a fix.
- Teaching: repeated questions after confusion and an ungrounded recap reference were recorded. Do not infer understanding from tutor notes or assent. Keep graded-answer protection and direct ungraded concept teaching.
- Hardware: quiet speech, echo, interruption, and device failure need actual user evidence before retuning.
- Groundtrack: hooks 0.1.7 and Codex project config installed at 0d345a1; local Doctor passed. Tools remain unavailable in this task. Sign-in, hook approval, and one live verification event are still pending. Local handoffs do not depend on it.

## Next

Use `npm run context` to reorient and `npm run handoff` before switching chats. See WORKFLOW for older checkouts, independent clones, and cross-machine transfer.

Local consolidation is ready for review: pinned candidate, source fingerprints, 16 passing offline checks, typecheck/lint, isolated build. [DEVELOPMENT](DEVELOPMENT.md) links evidence and release gaps. Remote main unchanged; old candidate data preserved. Optional typing and independent mic mute added to the same tutor/board; see [input changes](evaluations/2026-09-20-typed-input.md). Jev deferred; Vercel paused.
