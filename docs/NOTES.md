# Build notes

Each lane keeps a few lines here: what works, what is stubbed, what other lanes need to know.

## voice
On `lane/voice`. Own loop: ElevenLabs STT, Grok (`grok-4.6` via `/api/agent/llm`), ElevenLabs TTS. Greeting is a fixed first line so it starts immediately. Barge-in via mic RMS. Chips inject as utterances. Tag parser lives in `lib/agent/tags.ts`; UI commands are not dispatched yet. ConvAI custom LLM not wired (localhost cannot receive ElevenLabs server callbacks). Home page mounts `VoiceSession` so this can be tested; shell can take that composition later. Needs `.env.local` with `XAI_API_KEY` and `ELEVENLABS_API_KEY`.

## workspace
Not started.

## whiteboard
Not started.

## context
Not started. `lib/types.ts` is in the repo (`StudentProfile`, `CoursePack`, ingest shapes). `lib/db/schema.sql` is not.

## recap
Not started.

## shell
Next.js 16 + Tailwind 4 scaffold is on `main`. Home page: cream background, "Better Office Hours" centered. No auth, no orb, no transcript. `app/layout.tsx` is still the default root layout; teammate owns the real shell on `lane/shell`.
