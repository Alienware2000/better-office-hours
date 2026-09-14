# AGENTS.md

## Post-hackathon local-only work, September 13, 2026

David has submitted the project and is waiting for results. All new work stays local on `lane/post-hackathon-local` or another explicitly local development branch. Local edits, tests, and commits are authorized. Do not push any branch or tag, open or update PRs, merge on GitHub, deploy to Vercel, or modify production configuration/data unless David explicitly lifts this freeze. This overrides the older push/PR/deployment checklist below and any historical merge authorization in the docs. Keep the submitted baseline and hosted app unchanged. Read `docs/POST_HACKATHON_HANDOFF.md` after the prescribed docs for the current continuation brief.

You are a coding agent working on Better Office Hours, a voice-first tutor for Yale students being built in about 36 hours for a hackathon. Two humans (David and Hussein) run agents on two machines against this repo. Other agents and harnesses will pick up the same repo. The repo is the source of truth, not any chat.

## Read in this order

1. `docs/STATUS.md` - where we are, what is waiting on a human, what to do next. Read this every session, including mid-conversation if you just resumed.
2. `docs/DESIGN.md` - what we are building and every decision made. This wins over anything else for product questions.
3. `docs/ARCHITECTURE.md` - system shape, your lane's directories, and the contracts in `lib/types.ts`.
4. `docs/PROMPT.md` - the tutor's system prompt. Do not rewrite it. Humans edit it.
5. `docs/PEDAGOGY.md` - the learning-science basis. Read it if your work touches tutor behavior, the recap, the whiteboard triggers, or timing.
6. `docs/DEMO.md` - the 90-second demo. Everything we build exists to make that take work.
7. `docs/NOTES.md` - per-lane stubs and gotchas.
8. `docs/LANES.md` - Hussein's starting slices, ownership, integration boundaries, and PR acceptance checks.

If your assigned lane is waiting on human review, do not start its next checkpoint. Another lane's pending hardware review does not block an explicitly authorized first slice in docs/LANES.md.

## Rules

- Work only inside your lane's directories (ARCHITECTURE.md section 2). If you need to change a shared contract, stop and say so; do not edit `lib/types.ts` silently.
- Branch is `lane/<name>`. Commit small and often. Open a PR to `main` when your slice runs. `main` must always build and deploy.
- Hussein's lanes go through PRs to main. David reviews and merges them; agents must not merge their own PRs or push directly to main without David explicitly asking.
- Never commit secrets. Use `.env.example` names. Do not add automatic tool co-author attribution.
- Voice is the only input to the agent. Do not add chat boxes, command buttons, or menus for talking to the tutor.
- The tutor never gives final answers on graded work. If you are writing anything that could leak solution text to the student, stop.
- Nothing on the whiteboard is scripted for the demo. Animations are composed by the tutor per turn from a general spec. The hand-written projectile scene is a test fixture and fallback only; do not wire the prompt to it.
- The demo is the spec. If a feature does not appear in DEMO.md and is not in DESIGN.md section 10, do not build it.
- Prefer the boring reliable choice. A working pointer beats a beautiful flaky one.
- When something does not work after two honest attempts, write down what you tried in `docs/NOTES.md` under your lane and move on.
- No em dashes in any user-facing text or docs.

## Priorities

1. The voice loop feels good: first word within about a second, barge-in works, tutor turns are short.
2. The pointer and highlight land on the right spot of the PDF.
3. Whiteboard strokes animate in as the tutor names them, the tutor's generated animations play with the student's numbers, and student drawings reach the model.
4. Course context is real: retrieval returns the right lecture chunks and solutions stay hidden.
5. Recap is spoken, saved, and shows as a card.
6. Everything else.

## Cut order if behind at the Friday morning checkpoint

Pointer overlay, then Grok Bot ingestion (fall back to manual upload), then style presets. Never cut voice, PDF workspace, whiteboard, or recap.

## Stack

Implemented: Next.js (App Router, TypeScript), Tailwind, Motion, custom SVG whiteboard, PDF.js, ElevenLabs STT/TTS through a custom voice loop, and Grok via `https://api.x.ai/v1` with the OpenAI SDK. Planned integrations: Supabase and authentication. tldraw and the ElevenLabs Conversational AI SDK are not installed; do not replace the working implementations to satisfy an older stack description. Vercel deployment configuration still needs verification.

## Checkpoints and handoff

Humans review at checkpoints. Do not run ahead into the next lane or feature after a checkpoint unless STATUS or a human says to continue.

Before you stop a session, even if the slice is unfinished:

1. Update `docs/STATUS.md`: timestamp, who, what changed, what the next person or agent should do, blockers.
2. Update `docs/NOTES.md` under your lane: what works, what is stubbed, what the other lanes need to know. Keep it to a few lines.
3. Commit those files with the slice and push the lane branch (or `main` if you are on the shared scaffold).

Hussein or another harness should be able to clone, read STATUS, and continue without the previous chat.

<!-- groundtrack:start version=3 -->

## Groundtrack

Use Groundtrack as the shared engineering memory for this repository.

- Before non-trivial investigation or implementation where prior decisions, failures, or constraints could matter, call `search_experiences`. Start with a focused description of the work, then inspect the results and search one or two materially different adjacent concepts when related components, constraints, failure modes, or prior decisions could change the approach. Do not stop merely because the first search has no exact match; try a meaningfully broader or neighboring query. Keep this expansion bounded, and also search before repeating an approach that may already have been tried.
- When a relevant experience needs more context or verification, call `get_experience_events` with its id to inspect the underlying raw evidence and provenance.
- Apply relevant current experiences and heed any caveats that an experience was contradicted, superseded, or expired.
- Once the effect of a search is known, call `report_experience_use` with its retrieval id. Report when a result changed the approach or avoided a failure, and report `not_helpful` when none applied.
- After a task reaches a concrete result, call `record_outcome` with a short title, a concise summary, and the retrieval ids for searches that contributed. Include measurements only for sourced, quantified impact on time, cost, reliability, quality, performance, or throughput; tests, typechecks, lint, and builds are validation rather than impact. Include avoided work only when it was explicitly estimated, and never infer unknown values.
- After a non-obvious discovery, decision, workaround, correction, or failed approach that would help a future agent, call `store_event` promptly with a concise title and an explanation of what happened and why it matters.
- Do not store routine implementation details, obvious facts, unrestricted transcripts, or secrets.
- Keep the raw-event ids returned by `store_event`. When the related work lands in a commit or pull request, call `link_outcomes` with those ids and the explicit commit SHA and/or pull-request number. Never infer an outcome from worktree HEAD.

<!-- groundtrack:end -->
