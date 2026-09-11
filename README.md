# Better Office Hours

A voice-first tutor that sees your work and helps you reason through it.

Better Office Hours is being built around the feeling of sharing a desk with a good tutor. You talk, work through a problem, or mark something you do not understand. The tutor sees the material in front of you, points to the relevant part, and draws or animates a diagram when a picture helps. The goal is to learn with someone, not to receive a finished answer.

Built by **David Antwi and Hussein** for the Yale AI Association x SpaceXAI hackathon. This is an active prototype. The adaptive desk works locally; course integrations, authentication, and saved recaps are still being built.

## One desk, different ways to learn

Homework starts with a PDF upload. “Explain a concept” and “Something else” start with a large whiteboard. Each uses the same desk, with the voice orb and live captions alongside the work. You can switch between the whiteboard and an attached PDF without leaving the conversation.

The whiteboard is primarily how the tutor explains things. Students can also circle a confusing part, sketch their thinking, or work through a step on the same surface. Diagrams are generated for the topic at hand. Projectile motion is a development fixture, not the boundary of what the tutor is meant to teach.

The longer-term vision includes learning on an iPad, writing directly on the board with Apple Pencil. Pointer input is implemented; Pencil feel and palm rejection still need testing on a real device.

## What works today

- Voice conversation using ElevenLabs speech recognition and speech synthesis, with Grok handling the tutor's responses.
- Immediate workspace selection from recognized homework, concept, and other requests.
- PDF uploads for problem sets and supplemental notes, with page navigation, zoom, freehand ink, highlighting, and a tutor pointer.
- Shared diagram styling and generated SVG drawings and animations, including play, pause, focus, and scrubbing.
- Page and board snapshots supplied to the tutor, including student marks and the current animation frame.
- Settled PDF-mark events so the tutor can respond to a marked region without requiring the student to describe it again.
- Separate parked homework and concept sessions within the current browser session.
- Orb interruption that stops speech and freezes animation. Paused tabs do not take over an active conversation.

The tutor is instructed to ask short, focused questions and guide the student through graded work without giving the final answer. Those guardrails are part of the design, and model behavior still needs evaluation. The learning approach and human-maintained prompt are in [PEDAGOGY.md](docs/PEDAGOGY.md) and [PROMPT.md](docs/PROMPT.md).

## Where we are going

**Course context through Grok Bot and Canvas.** The tutor should already know the student's classes, assigned materials, and course conventions. A future collector will supply the course profile and materials for retrieval. This is a separate context layer, not a requirement for uploading a PDF today. The collector specification exists, but Canvas access and ingestion are not connected yet.

**Spoken and saved recaps.** After the student summarizes what they learned, the tutor should close with the sticking point, what changed, and something specific to review. Recap types exist; the spoken close flow, storage, and card are not wired yet.

**Identity and learning memory.** Authentication, durable course/session storage, and later retrieval of prior learning are planned. Uploaded files currently live on the local development machine. Sessions are not yet saved across reloads.

A recorded demo and hosted judge access will be added after the integrated flow is ready. The [demo plan](docs/DEMO.md) describes the target experience, not a list of completed features.

## Run locally

You need Node.js, npm, an xAI API key, and an ElevenLabs API key with access to speech recognition and speech synthesis.

```bash
git clone https://github.com/Alienware2000/better-office-hours.git
cd better-office-hours
npm ci
```

On first setup, copy `.env.example` to `.env.local`. Preserve your existing `.env.local` if you already have one. Set:

```dotenv
XAI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
```

The other names in `.env.example` are reserved for integrations that are not required by the current local voice loop.

```bash
npm run dev -- -p 3100
```

Open [localhost:3100](http://localhost:3100), allow microphone access, and tap the orb to activate the tutor. Say what you want to work on. The three entry chips can also open a desk. Attach a PDF or use the whiteboard; tap the orb again to stop voice.

API calls can consume credits. Audio is processed by ElevenLabs, and conversation content plus supplied page/board images are sent to xAI. Do not commit credentials or uploaded materials.

## Current limits

This is a local prototype, not a finished multi-user service. It has no authenticated user isolation or durable production storage. PDFs are stored in ignored `.data/psets`; that filesystem approach is not a serverless persistence solution. Production deployment and per-user context isolation still need integration work.

Hands-free barge-in is not implemented; use the orb to interrupt. Live diagram generation varies, and the reasoning pass can leave several seconds of quiet. Real microphone cadence, marked-page reactions, and iPad/Pencil behavior still need hands-on review.

## Stack and checks

The working app uses Next.js App Router, TypeScript, Tailwind, Motion, PDF.js, custom SVG whiteboard rendering, ElevenLabs STT/TTS, and the OpenAI-compatible xAI API. The fast spoken model and deeper reasoning model are configured in `lib/agent/grok.ts`. Supabase and authentication are planned integrations. tldraw and the ElevenLabs conversational SDK are not installed in the current implementation.

```bash
npm run build
npx tsc --noEmit
node scripts/check-workspace.mjs
node scripts/check-anim.mjs --unit
```

With the dev server and API keys available, `node scripts/check-board.mjs` and `node scripts/check-anim.mjs` exercise live model output. These checks are variable and use API credits. Full repo lint currently reports existing ref-access issues; changed code should still pass focused lint and add no new failures.

## Working together

David owns voice, workspace, and whiteboard. Hussein owns context, recap, and shell. Start from the latest `main`, work on `lane/<name>`, and open a PR. David reviews Hussein's PRs before they merge.

Read [STATUS](docs/STATUS.md) for the current baseline, [DESIGN](docs/DESIGN.md) for the product, [ARCHITECTURE](docs/ARCHITECTURE.md) for contracts, and [LANES](docs/LANES.md) for Hussein's first slices and acceptance checks. Coding agents must also read [AGENTS.md](AGENTS.md). Keep the human prompt and shared contracts stable, preserve the adaptive desk, and make missing integrations explicit.
