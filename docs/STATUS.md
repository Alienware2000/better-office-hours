# Current status

Updated: 2026-09-14
By: Codex, David's local continuation
Branch: lane/post-hackathon-local
Submitted baseline: b74e11a85dab17a5951fdee6cd574b83b91e3c15

## Authority

All development stays local. No GitHub pushes, PR changes, deployments, or production data/configuration changes until David explicitly lifts the publication freeze. Submission is complete; results pending; the intended demo recording was not finished. Contest post-submission rules have not been verified.

David requested a local stack restart and a workspace that supports switching coding agents and starting fresh chats. See [TASK](TASK.md) for this slice and [WORKFLOW](WORKFLOW.md) for repeatable commands. Current instructions are in [AGENTS](../AGENTS.md). Historical build notes are [archived](archive/README.md), not current work orders.

## Local runtime

- Current checkout: `/Users/davidantwi/.codex/worktrees/59de/boh`, branch above. Do not switch to the saved project's stale main or edit the previous worktree.
- Start: `npm ci`, then `npm run dev:local`. Default URL: http://localhost:3105, bound to loopback. Runtime data lives in this checkout's ignored `.data`; this is a separate browser origin from the old 3102 preview.
- September 14: no old BOH listener was running. Ports 3000/3001/3002 belonged to Adventure World and were left alone. Earlier worktrees, PDF storage, and browser sessions were preserved.
- Only xAI and ElevenLabs API settings were copied privately from the prior worktree. Local signing secrets were newly generated. No production storage, Google OAuth, or production signing credentials were copied. The local launcher disables cloud storage and Google auth even if inherited/configured.
- Root and configuration-only health endpoint return HTTP 200; health detects both provider keys. Start screen inspected. No new paid inference, speech synthesis, or human microphone validation in this setup slice.
- Restarting stops the current process but never deletes browser history or `.data`. Inspect process cwd before stopping anything. Keep source stable during user voice sessions; run browser regressions/builds in an isolated copy.

## Product baseline

One adaptive paper desk serves homework/PDF and concepts/whiteboard. Generated diagrams, local LaTeX, audio-timed visual beats, scene continuity, student ink, PDF highlights, and browser-local session recovery/export are implemented. Optional scoped Canvas ingestion/retrieval and student-first spoken recap are integrated. Private Vercel Blob stores public-runtime course/PDF data; Supabase remains optional. Full conversation/board/recap histories are browser-local, not cloud session sync or cross-session learner memory.

Hussein #6/#8/#9 and integration #10/#12/#13/#14 are included in the submitted baseline. #11 is a separate local reconciliation topic: its forced login and body-email/shared-bearer ingestion conflict with the optional/scoped-owner flow. No merge or remote change is authorized. OpenRouter is a possible benchmark option, not an agreed migration.

## Open issues

- Cadence: historical deep-request-to-first-audio medians were roughly 9 to 13 seconds, excluding endpointing/STT/routing. Quick work checks still incur reasoning latency. No fresh latency benchmark in this task.
- Visual correctness: a generated Follow object stayed stationary while its arrow changed. Renderer correctness does not guarantee model semantics. Replay actual specs/transcripts before choosing a fix.
- Teaching: repeated questions after confusion and an ungrounded recap reference were recorded. Do not infer understanding from tutor notes or assent. Keep graded-answer protection and direct ungraded concept teaching.
- Hardware: quiet speech, echo, interruption, and device failure need actual user evidence before retuning.
- Groundtrack: hooks 0.1.7 and Codex project config installed at 0d345a1; local Doctor passed. Tools remain unavailable in this task. Sign-in, hook approval, and one live verification event are still pending. Local handoffs do not depend on it.

## Next

The local stack and portable workflow slice is complete. `npm run context:check`, offline workflow integration checks, focused script lint, and whitespace checks pass. The historical archives match their original bytes; frozen contracts/human prompts are unchanged. See TASK for exact evidence and limitations. Use `npm run handoff` before moving to another agent/chat; it creates an ignored continuation brief without sending data anywhere.

Gather David's next concrete product issue against the new local desk. Cadence and visual correctness evaluation remain the recommended next product slice; cloud memory and auth/collector reconciliation are separate. No current acoustic quality or full production-build result is implied by the workflow checks.
