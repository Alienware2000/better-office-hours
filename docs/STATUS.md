# Current status

Updated: 2026-09-16
By: Codex, David's local continuation
Branch: lane/post-hackathon-local
Submitted baseline: b74e11a85dab17a5951fdee6cd574b83b91e3c15

## Authority

All development stays local. No GitHub pushes, PR changes, deployments, or production data/configuration changes until David explicitly lifts the publication freeze. Submission is complete; results pending; the intended demo recording was not finished. Contest post-submission rules have not been verified.

David requested frictionless reorientation across coding agents, fresh chats, and different checkouts. See [TASK](TASK.md) for the active slice and [WORKFLOW](WORKFLOW.md) for commands. Current instructions are in [AGENTS](../AGENTS.md). Historical build notes and completed tasks are [archived](archive/README.md), not current work orders.

David's plain-language [memory walkthrough](MEMORY_GUIDE.md) explains everyday use; the [reproduction recipe](MEMORY_RECIPE.md) provides starter templates and setup instructions for other projects. These are on-demand references.

## Local runtime

- This runtime checkout: `/Users/davidantwi/.codex/worktrees/59de/boh`, branch above. It is an operational record, not a requirement to use that path everywhere. Run orientation in each checkout. Do not automatically switch to stale main, alter other checkouts, or assume cached code/data is present.
- Start: `npm ci`, then `npm run dev:local`. Default URL: http://localhost:3105, bound to loopback. Runtime data lives in this checkout's ignored `.data`; this is a separate browser origin from the old 3102 preview.
- September 16: trial 3107 had stopped. Restarted detached from the terminal; HTTP 200. Same storage/signing/origin, no data edits or provider calls. Runtime: .data/voice-trial/latest.json; log: .data/voice-trial/server-2026-09-16.log.
- Only xAI and ElevenLabs API settings were copied privately from the prior worktree. Local signing secrets were newly generated. No production storage, Google OAuth, or production signing credentials were copied. The local launcher disables cloud storage and Google auth even if inherited/configured.
- Root and configuration-only health endpoint return HTTP 200; health detects both provider keys. Start screen inspected. No new paid inference, speech synthesis, or human microphone validation in this setup slice.
- Restarting stops the current process but never deletes browser history or `.data`. Inspect process cwd before stopping anything. Keep source stable during user voice sessions; run browser regressions/builds in an isolated copy.

## Product baseline

One adaptive paper desk serves homework/PDF and concepts/whiteboard. Generated diagrams, local LaTeX, audio-timed visual beats, scene continuity, student ink, PDF highlights, and browser-local session recovery/export are implemented. Optional scoped Canvas ingestion/retrieval and student-first spoken recap are integrated. Private Vercel Blob stores public-runtime course/PDF data; Supabase remains optional. Full conversation/board/recap histories are browser-local, not cloud session sync or cross-session learner memory.

Hussein #6/#8/#9 and integration #10/#12/#13/#14 are included in the submitted baseline. #11 is a separate local reconciliation topic: its forced login and body-email/shared-bearer ingestion conflict with the optional/scoped-owner flow. No merge or remote change is authorized. OpenRouter is a possible benchmark option, not an agreed migration.

## Open issues

- September 14 priority: David reports severe latency, missing board use, and speech/visual disagreements across subjects. [TUTOR_EVALUATION](TUTOR_EVALUATION.md) records the requirements, source audit, synthetic comparison harness, and queued review of every saved Chrome session. The new every-spoken-turn board requirement is in DESIGN and is not yet implemented.

- Cadence: historical deep-request-to-first-audio medians were roughly 9 to 13 seconds, excluding endpointing/STT/routing. Quick work checks still incur reasoning latency. No fresh latency benchmark in this task.
- Visual correctness: a generated Follow object stayed stationary while its arrow changed. Renderer correctness does not guarantee model semantics. Replay actual specs/transcripts before choosing a fix.
- Teaching: repeated questions after confusion and an ungrounded recap reference were recorded. Do not infer understanding from tutor notes or assent. Keep graded-answer protection and direct ungraded concept teaching.
- Hardware: quiet speech, echo, interruption, and device failure need actual user evidence before retuning.
- Groundtrack: hooks 0.1.7 and Codex project config installed at 0d345a1; local Doctor passed. Tools remain unavailable in this task. Sign-in, hook approval, and one live verification event are still pending. Local handoffs do not depend on it.

## Next

Use `npm run context` to reorient and `npm run handoff` before switching chats. See WORKFLOW for older checkouts, independent clones, and cross-machine transfer.

The 3107 Opus trial restores rich geometry/math and ordered lettering. September 16: server restart and mic retry recovered access; David likes the improved visuals and perceived speed. Read-only review found stale prior-topic content on the projectile page and static presentation where motion would explain the idea. Next proposed slice: general scene continuity and purposeful sequencing, not another model switch. See [scene review](evaluations/2026-09-16-scene-direction.md) and [trial guide](TUTOR_TRIAL.md). Earlier update incident lost old trial drawings; transcript survived and a refresh safeguard is tested. Preserve remaining history. No publication or production migration.
