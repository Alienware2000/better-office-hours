# Status

This file is the live snapshot. Chat is not the source of truth. If you are a human or an agent picking this up, start here, then `AGENTS.md`.

Updated: 2026-09-10 03:29 ET
By: David (Cursor)
Repo: https://github.com/Alienware2000/better-office-hours
Branch: `lane/voice`

## Now

Voice loop first pass is approved and landing on `lane/voice`. Next slice is the PDF workspace pointer, not UI polish.

Do not restyle the orb in this lane. Shell owns `components/orb`. Pointer work is `lane/workspace`.

## Done

- Spec, public repo, Next.js scaffold, `lib/types.ts`.
- Voice lane: Grok via `/api/agent/llm`, ElevenLabs STT/TTS, orb with four states, opening greeting, chips, barge-in, tag parser (tags stripped before speech; pointer/board not dispatched yet).
- Local loop is STT -> Grok -> TTS so it works on localhost. ElevenLabs Conversational AI custom LLM is not wired yet (needs a public URL).
- Human notes: layout is a good start; UI should look better later.

## Next

1. `lane/workspace`: pset PDF upload, pointer, highlight.
2. Then whiteboard strokes.
3. Teammate in parallel: shell (auth, orb visual, transcript) and context ingest. `lib/db/schema.sql` still missing.

## Lanes

| Lane | Owner | Branch | State |
|---|---|---|---|
| voice | David | `lane/voice` | first pass approved |
| workspace | David | not started | next |
| whiteboard | David | not started | |
| context | Teammate | not started | types ready |
| recap | Teammate | not started | |
| shell | Teammate | not started | home page currently mounts VoiceSession; orb visual is a placeholder |

## Run

```bash
cp .env.example .env.local
# fill XAI_API_KEY and ELEVENLABS_API_KEY
npm install
npm run dev
```

Open http://localhost:3000 (or 3001 if 3000 is taken). Allow the microphone.

## How to stop a session

Before you end, update this file: timestamp, who, what changed, what the next person or agent should do, blockers. Update `docs/NOTES.md` under your lane. Commit both with the slice.

## Blockers

Voice will not speak until `.env.local` has both keys.
