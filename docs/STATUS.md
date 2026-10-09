# Current status

Updated: 2026-10-09
By: Codex, David's local continuation
Branch: lane/post-hackathon-local
Submitted baseline: b74e11a85dab17a5951fdee6cd574b83b91e3c15

## Authority

October 9: David accepted the main-integration plan and selected Opus over slow Grok. Opus is now the normal local default with explicit Grok rollback; README refreshed and demo links retained. origin/main merged locally; no push, PR, main merge or deployment occurred. Concrete publication review is pending. Public pause remains. See [integration packet](evaluations/2026-10-09-main-integration.md).

September 20: David reports the hackathon win and authorizes continued development/consolidation. The contest hold is retired. Vercel remains paused until explicitly reopened. Current work is local; no push, PR, deployment, or public reopening occurred. [DEVELOPMENT](DEVELOPMENT.md) defines baseline, trial, evaluation, and promotion.

David requested frictionless reorientation across coding agents, fresh chats, and different checkouts. See [TASK](TASK.md) for the active slice and [WORKFLOW](WORKFLOW.md) for commands. Current instructions are in [AGENTS](../AGENTS.md). Historical build notes and completed tasks are [archived](archive/README.md), not current work orders.

## Local runtime

- Checkout: `/Users/davidantwi/.codex/worktrees/59de/boh`. Reorient in each checkout; cached state is not code/data synchronization.
- Default: `npm ci`, then `npm run dev:local` on loopback 3105, with checkout-local .data. Cloud storage and Google auth are disabled. Local signing secrets are separate from production.
- October 9: isolated tested candidate at localhost:3120 in a temporary review clone with separate data. 3116 listener verified in its retained `.data/voice-trial-3116/run-1789915952031` snapshot. No runtime restart. Last recorded September 20: 3114 retained David’s session; 3115 f94112e; 3116 1770053; 3117 19a3681. Other ports were not reverified this turn. Preserve snapshots, storage and browser saves. See [checklist](PRODUCT_CHECKLIST.md) for server discipline.
- Inspect a listener's cwd before stopping it. Preserve all origins' browser saves and PDF data. Keep live source stable; isolate browser regressions/builds. Configuration health is not proof of usable provider credits.

## Product baseline

The shared paper desk supports homework/PDF and concepts, generated diagrams/LaTeX, narrated visuals, student ink, PDF cues, local sessions/export, optional scoped Canvas retrieval and recap. Histories remain browser-local; no cloud session sync or learner memory. Private Vercel Blob stores public-runtime PDFs; Supabase is optional.

Submitted integrations are included. Fetched origin/main 3163d7f was merged locally at d0d4d31. Opus 5 through OpenRouter now handles normal routing/teaching/repair/recap; missing keys fail visibly and Grok rollback is explicit. #11 remains outside integration because identity/ingestion assumptions conflict with current scope. Public demo pause was verified October 8 with HTTP 503 / DEPLOYMENT_PAUSED; candidate disables git-triggered deployment.

## Open issues

- Latency, board use, and speech/visual agreement remain priorities. [Session review](evaluations/2026-09-20-session-review.md) covers 33 transcripts found in checked browser histories, not every historical origin or timed visual. Every-spoken-turn board use is not yet universal.

- Cadence: historical deep-request-to-first-audio medians were roughly 9 to 13 seconds, excluding endpointing/STT/routing. Fresh Opus checks measure deep HTTP output only, not audible teaching. Speech length remains inconsistent.
- Visual correctness: a generated Follow object stayed stationary while its arrow changed. Renderer correctness does not guarantee model semantics. Replay actual specs/transcripts before choosing a fix.
- Teaching: a fresh graded equation leaked the correct answer as a guess. Tightened guidance passed two new equation/chemistry checks, without semantic guarantees. Historical repeated questions after confusion and an ungrounded recap reference were recorded. Do not infer understanding from tutor notes or assent. Keep graded-answer protection and direct ungraded concept teaching.
- Hardware: quiet speech, echo, interruption, and device failure need actual user evidence before retuning.
- Groundtrack: hooks 0.1.7 and Codex project config installed at 0d345a1; local Doctor passed. Tools remain unavailable in this task. Sign-in, hook approval, and one live verification event are still pending. Local handoffs do not depend on it.

## Next

October 9: committed integration candidate is ready for David's concrete publication review. All 18 offline checks, full lint, integration smoke and isolated production build pass. Browser matrix/PDF/ink/zoom/undo/reload checks and real synthetic TTS/STT pass. Human listening/interruption, broader STEM/graded safety and full latency remain release evidence. See TASK and the integration packet.

September 20: [Representation audit](evaluations/2026-09-20-representation.md) follows Gaussian-elimination feedback. General guidance selected matrices in one sample, exposing an augmented-divider rendering bug. Candidate timing/teaching remain mixed. Live 3117 stays on 19a3681; [test plan](APP_TEST_PLAN.md) and acoustic review remain open.

Use `npm run context` to reorient and `npm run handoff` before switching chats. See WORKFLOW for older checkouts, independent clones, and cross-machine transfer.

[DEVELOPMENT](DEVELOPMENT.md) records consolidation evidence and release gaps. [Optional typing and mic mute](evaluations/2026-09-20-typed-input.md) share the tutor/board. Remote main unchanged, candidate data retained, Jev deferred and Vercel paused.
