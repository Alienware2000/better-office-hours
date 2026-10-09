# Current status

Updated: 2026-10-09
By: Codex, David's local continuation
Branch: lane/post-hackathon-local
Submitted baseline: b74e11a85dab17a5951fdee6cd574b83b91e3c15

## Authority

October 9: David explicitly authorized moving all reviewed work to main except PR #11. [PR #15](https://github.com/Alienware2000/better-office-hours/pull/15) merged at fe59fa6, including Opus default, product improvements, prototypes/tooling and README cleanup. PR #11 is now DRAFT on hold, with no auto-merge. Public Vercel remains paused; no deployment or reopening occurred. See [integration packet](evaluations/2026-10-09-main-integration.md).

September 20: David reports the hackathon win and authorizes continued development/consolidation. The contest hold is retired. Vercel remains paused until explicitly reopened. That initial local-only scope was superseded by the October 9 publication approval; deployment/public reopening remain separate. [DEVELOPMENT](DEVELOPMENT.md) defines baseline, trial, evaluation, and promotion.

David requested frictionless reorientation across coding agents, fresh chats, and different checkouts. See [TASK](TASK.md) for the active slice and [WORKFLOW](WORKFLOW.md) for commands. Current instructions are in [AGENTS](../AGENTS.md). Historical build notes and completed tasks are [archived](archive/README.md), not current work orders.

## Repository protection

Other contributors require a PR approved by David, with fresh review after new commits and resolved conversations. `.github/CODEOWNERS` assigns all paths to @Alienware2000. David explicitly retains admin exemption and direct-push access; force pushes/deletion are blocked for non-admins. Verified through GitHub API October 9. No CI checks are required yet. Agent publication still needs its applicable authorization; do not disable protection for checkpoints.

## Local runtime

- Checkout: `/Users/davidantwi/.codex/worktrees/59de/boh`. Reorient in each checkout; cached state is not code/data synchronization.
- Default: `npm ci`, then `npm run dev:local` on loopback 3105, with checkout-local .data. Cloud storage and Google auth are disabled. Local signing secrets are separate from production.
- October 9: isolated tested candidate at localhost:3120 in a temporary review clone with separate data. 3116 listener verified in its retained `.data/voice-trial-3116/run-1789915952031` snapshot. No runtime restart. Last recorded September 20: 3114 retained David’s session; 3115 f94112e; 3116 1770053; 3117 19a3681. Other ports were not reverified this turn. Preserve snapshots, storage and browser saves. See [checklist](PRODUCT_CHECKLIST.md) for server discipline.
- Inspect a listener's cwd before stopping it. Preserve all origins' browser saves and PDF data. Keep live source stable; isolate browser regressions/builds. Configuration health is not proof of usable provider credits.

## Product baseline

The shared paper desk supports homework/PDF and concepts, generated diagrams/LaTeX, narrated visuals, student ink, PDF cues, local sessions/export, optional scoped Canvas retrieval and recap. Histories remain browser-local; no cloud session sync or learner memory. Private Vercel Blob stores public-runtime PDFs; Supabase is optional.

GitHub main now includes reviewed candidate db98c97 through PR #15 / fe59fa6. Opus 5 through OpenRouter handles normal routing/teaching/repair/recap; missing keys fail visibly and Grok rollback is explicit. #11 remains excluded because identity/ingestion assumptions require reconciliation. Public demo still returns HTTP 503 / DEPLOYMENT_PAUSED; main disables git-triggered deployment. The local branch named main is stale and is not the publication reference.

## Open issues

- Latency, board use, and speech/visual agreement remain priorities. [Session review](evaluations/2026-09-20-session-review.md) covers 33 transcripts found in checked browser histories, not every historical origin or timed visual. Every-spoken-turn board use is not yet universal.

- Cadence: historical deep-request-to-first-audio medians were roughly 9 to 13 seconds, excluding endpointing/STT/routing. Fresh Opus checks measure deep HTTP output only, not audible teaching. Speech length remains inconsistent.
- Visual correctness: a generated Follow object stayed stationary while its arrow changed. Renderer correctness does not guarantee model semantics. Replay actual specs/transcripts before choosing a fix.
- Teaching: a fresh graded equation leaked the correct answer as a guess. Tightened guidance passed two new equation/chemistry checks, without semantic guarantees. Historical repeated questions after confusion and an ungrounded recap reference were recorded. Do not infer understanding from tutor notes or assent. Keep graded-answer protection and direct ungraded concept teaching.
- Hardware: quiet speech, echo, interruption, and device failure need actual user evidence before retuning.
- Groundtrack: hooks 0.1.7 and Codex project config installed at 0d345a1; local Doctor passed. Tools remain unavailable in this task. Sign-in, hook approval, and one live verification event are still pending. Local handoffs do not depend on it.

## Next

October 9: integration complete and published through PR #15. All 18 offline checks, full lint, integration smoke and isolated production build pass. Browser matrix/PDF/ink/zoom/undo/reload checks and real synthetic TTS/STT pass. Human listening/interruption, broader STEM/graded safety and full latency remain release evidence. Main protection and PR #11 hold are complete. Next product recommendation is a real voice learning-session test; automated PR checks are the remaining repository safeguard. Define implementation scope from a new bounded request.

September 20: [Representation audit](evaluations/2026-09-20-representation.md) follows Gaussian-elimination feedback. General guidance selected matrices in one sample, exposing an augmented-divider rendering bug. Candidate timing/teaching remain mixed. Live 3117 stays on 19a3681; [test plan](APP_TEST_PLAN.md) and acoustic review remain open.

Use `npm run context` to reorient and `npm run handoff` before switching chats. See WORKFLOW for older checkouts, independent clones, and cross-machine transfer.

[DEVELOPMENT](DEVELOPMENT.md) records consolidation evidence and release gaps. [Optional typing and mic mute](evaluations/2026-09-20-typed-input.md) share the tutor/board. Main integration complete, synthetic evidence retained, Jev deferred and Vercel paused.
