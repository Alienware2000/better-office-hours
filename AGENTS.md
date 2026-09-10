# AGENTS.md

You are a coding agent working on Better Office Hours, a voice-first tutor for Yale students being built in about 36 hours for a hackathon. Two humans (David and a teammate) run agents on two machines against this repo. Other agents and harnesses will pick up the same repo. The repo is the source of truth, not any chat.

## Read in this order

1. `docs/STATUS.md` — where we are, what is waiting on a human, what to do next. Read this every session, including mid-conversation if you just resumed.
2. `docs/DESIGN.md` — what we are building and every decision made. This wins over anything else for product questions.
3. `docs/ARCHITECTURE.md` — system shape, your lane's directories, and the contracts in `lib/types.ts`.
4. `docs/PROMPT.md` — the tutor's system prompt. Do not rewrite it. Humans edit it.
5. `docs/PEDAGOGY.md` — the learning-science basis. Read it if your work touches tutor behavior, the recap, the whiteboard triggers, or timing.
6. `docs/DEMO.md` — the 90-second demo. Everything we build exists to make that take work.
7. `docs/NOTES.md` — per-lane stubs and gotchas.

If STATUS says we are waiting on human review, do not start the next checkpoint. Summarize where we are and stop.

## Rules

- Work only inside your lane's directories (ARCHITECTURE.md section 2). If you need to change a shared contract, stop and say so; do not edit `lib/types.ts` silently.
- Branch is `lane/<name>`. Commit small and often. Open a PR to `main` when your slice runs. `main` must always build and deploy.
- Never commit secrets. Use `.env.example` names.
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

Next.js (App Router, TypeScript), Tailwind, tldraw, PDF.js, ElevenLabs Conversational AI SDK, Grok via `https://api.x.ai/v1` with the OpenAI SDK, Supabase (Postgres, pgvector, storage), NextAuth with Google. Deploys to Vercel from `main`.

## Checkpoints and handoff

Humans review at checkpoints. Do not run ahead into the next lane or feature after a checkpoint unless STATUS or a human says to continue.

Before you stop a session, even if the slice is unfinished:

1. Update `docs/STATUS.md`: timestamp, who, what changed, what the next person or agent should do, blockers.
2. Update `docs/NOTES.md` under your lane: what works, what is stubbed, what the other lanes need to know. Keep it to a few lines.
3. Commit those files with the slice and push the lane branch (or `main` if you are on the shared scaffold).

A teammate or another harness should be able to clone, read STATUS, and continue without the previous chat.
