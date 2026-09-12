# Better Office Hours

A voice tutor that knows your course and talks you to the answer instead of handing it to you.

Built by David Antwi and Hussein Zindonda for the Yale AI Association x SpaceXAI hackathon.

## Demo

The public demo video and live application link will be added after the integrated build is deployed. The planned 90-second walkthrough is documented in [DEMO.md](docs/DEMO.md).

## The problem

Office hours are crowded, time-conflicting, and intimidating. Generic AI tutors do not know the student's course and often solve the problem instead of teaching the student how to solve it. In a 2025 field study, unguarded AI assistance improved practice performance but reduced later unassisted exam performance by 17 percent; a tutor with learning safeguards largely removed that harm ([Bastani et al., PNAS](https://doi.org/10.1073/pnas.2422633122)). Better Office Hours combines those safeguards with course context, voice, and a shared visual workspace.

## What it does

- Talks with the student through ElevenLabs speech recognition and synthesis.
- Sees uploaded problem sets and notes, including the student's marks.
- Points to and highlights the relevant part of a PDF.
- Draws and animates generated explanations on a shared SVG whiteboard.
- Guides graded work with short hints and questions instead of final answers.
- Supports homework, concept explanations, and other office-hours conversations in one desk.
- Requires a verified Yale Google identity before opening the tutor.

## It has the answer key and will not give it to you

The tutor elicits the student's thinking first, advances one hint at a time, asks for predictions before explanations, and never bottoms out to the final answer on graded work. Stored solution chunks are available only through a server-only reference path and are never returned by the student retrieval API. Spoken recap generation is still being coordinated with the voice loop. See [PEDAGOGY.md](docs/PEDAGOGY.md) for the learning basis and [PROMPT.md](docs/PROMPT.md) for the human-maintained tutor policy.

## Built in Cursor

The team built and coordinated this project in Cursor across separate voice, workspace, whiteboard, context, recap, and shell lanes.

<!-- Add the required Cursor screenshot here before submission. -->

## Grok Bot course context

The planned Course Pack Collector uses Grok Bot to gather a student's Canvas course profile, syllabus, lecture material, assignments, and posted solutions after the student approves Yale Duo. Student-visible retrieval must exclude solution text. The collector specification exists in [grokbot/TASK.md](grokbot/TASK.md), but the bot share link and live ingestion are not connected yet.

<!-- Add the Grok Bot share link and collection GIF here after the collector is verified. -->

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, and Motion
- PDF.js with custom pointer, highlight, and student-ink overlays
- Custom SVG whiteboard with generated declarative animations
- ElevenLabs STT and TTS with local Silero voice activity detection
- Grok through the OpenAI-compatible xAI API
- NextAuth with Google OAuth for Yale sign-in
- Supabase Postgres for authenticated course context and recap persistence

## Try it

The hosted URL and judge instructions will be added after deployment. The demo course is archived PHYS 180 material; the same desk is designed to work with any course once its context has been loaded.

To run locally, install Node.js and configure xAI and ElevenLabs API keys:

```bash
git clone https://github.com/Alienware2000/better-office-hours.git
cd better-office-hours
npm ci
```

Copy `.env.example` to `.env.local` and preserve any existing local secrets:

```dotenv
XAI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
```

Google sign-in additionally requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXTAUTH_SECRET`. Durable context and recap APIs require `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, plus the tables in `lib/db/schema.sql`. Without the authentication values, `/sign-in` reports that authentication is unavailable. Never commit `.env.local`.

Production setup, OAuth callback configuration, and verification steps are in [DEPLOYMENT.md](docs/DEPLOYMENT.md).

```bash
npm run dev -- -p 3100
```

Open [localhost:3100](http://localhost:3100), allow microphone access, and activate the orb. API calls consume provider credits. Audio is processed by ElevenLabs, and conversation content plus supplied page and board images are sent to xAI.

## Current prototype limits

The tutor and persistence APIs require a verified Google session. The Supabase schema and adapters are implemented but are not live until a project is configured and the schema is applied. Local PDF files are still not durable serverless storage. Course retrieval and recap persistence are not yet wired into David's voice loop, and generated visual quality and microphone interruption still require real-device testing.

## Development checks

```bash
npm run build
npx tsc --noEmit
node scripts/check-auth.mjs
node scripts/check-context.mjs
node scripts/check-recap.mjs
node scripts/check-persistence.mjs
node scripts/check-workspace.mjs
node scripts/check-anim.mjs --unit
```

Live model checks require a running development server and API credentials and can consume credits.

## Roadmap

Professor-configurable course guidance, lecture transcription, live screen sharing for coding courses, iPad handwriting, spaced review reminders, cross-course learning memory, and transcript export.

## Team

- David Antwi: voice, workspace, and whiteboard
- Hussein: context, recap, authentication, and application shell

For current implementation status and contribution boundaries, read [STATUS.md](docs/STATUS.md), [DESIGN.md](docs/DESIGN.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), and [LANES.md](docs/LANES.md).
