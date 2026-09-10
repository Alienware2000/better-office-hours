# Status

This file is the live snapshot. Chat is not the source of truth. If you are a human or an agent picking this up, start here, then `AGENTS.md`.

Updated: 2026-09-10 15:47 ET
By: David (Cursor)
Repo: https://github.com/Alienware2000/better-office-hours
Branch: `lane/workspace` (from `lane/voice`), pushed, PR open to `main`

## Now

Voice safety and workspace checkpoint is ready for human review.

The tutor now starts paused and cannot speak or listen until the human taps the orb. Tapping the orb again aborts the LLM request, queued TTS, active audio, recorder, and mic input. Hidden tabs suspend voice, and a newly active tab takes voice control from older tabs.

Human review passed for the revised transition and PDF upload/rendering. Waiting on: review the voice safety pass, then ask about a visible PDF question and confirm the tutor pointer/highlight lands correctly. Drag on the PDF to confirm circle or underline input.

Do not start the whiteboard until that is approved.

## Done

- Spec, repo, Next.js scaffold, types, voice loop.
- Workspace: PDF upload to `.data/psets`, PDF.js viewer, easing pointer, highlight ring, drag annotations.
- Homework chip (or `[MODE pset]`) splits the layout. Current page image is sent to Grok so POINT tags can land.
- Student marks stay on the page locally. They are not yet attached to the next model turn.
- Transition revision after repeated human feedback: removed the competing hand-written CSS transitions. Motion now performs a spring shared-layout move for the orb while the workspace enters independently.
- Setup text no longer overlaps the orb, and missing API keys do not replace the friendly setup message with a raw server error.
- Responsive baseline: tablet uses a 58/42 split so the agent panel does not overflow. Widths at 640px and below stack the agent strip above the workspace. Dedicated mobile design remains a later pass.
- Human verified a real PHYS 180 Homework 1 PDF uploads and renders in the workspace.
- Voice feedback-loop safety pass: no automatic greeting or listening on page load, no mic input while tutor audio plays, 450ms post-audio cooldown, hidden-tab suspension, and cross-tab voice handoff.
- Orb restored to a black minimal treatment. It is the single pause/resume control and exposes quiet idle, listening, thinking, and speaking states.
- TTS uses ElevenLabs Flash with sentence-level continuity and a warmer conversational voice. Spoken turns are capped at two sentence chunks and 70 words.
- `npm run build` passes. An isolated preview stayed silent on startup with no TTS requests.
- Fixed the tutor opening by naming "Problem Set 3" with nothing uploaded. `lib/agent/context.ts` had a hardcoded demo course and pset; it now reports only what is loaded, and the Homework chip with no PDF speaks a fixed line instead of calling the model.
- Two model lanes, human approved. The fast non-reasoning model runs every turn; when the student shows work it says one short line, emits `[THINK]`, and the client immediately issues a `deep: true` request to `grok-4.6` at low reasoning effort. Measured: handoff decision 0.8s, reasoning reply 9 to 12s, and the reasoning fetch starts before the lead-in audio plays so most of that wait is covered. Verified the reasoning lane diagnoses a wrong attempt, points at the page, asks one question, and refuses to hand over the answer. `[THINK]` is a new shared tag, so `lib/types.ts` and ARCHITECTURE.md sections 3.4 and 3.5 changed together.
- Live captions in the agent panel, filling in as the reply streams. They live in `app/(session)/voice/Captions.tsx` rather than `components/transcript/` so the shell lane keeps that directory.
- The layout now follows speech. Saying "my physics homework" opens the pset workspace with no chip tap, via `lib/agent/intent.ts`.
- The tutor speaks on its own when the PDF finishes rendering, naming something actually on the page and asking which problem to start with. DESIGN.md section 4 already required this ("once loaded, the tutor starts"); it was simply missing.
- Opening line is now a brief warm self-introduction, one of four variants per session, still fixed text so the first word is instant.
- Phrasing variety: the tutor had opened every session with "Got it, physics homework". `buildVoiceNote` now bans its stock openers and its own recent openings, and temperature moved to 0.85.
- Fixed a 26s wait before the first spoken word. The spoken turn moved from `grok-4.6` to `grok-4.20-0309-non-reasoning`, measured at 0.62s to first token and 1.0s total through `/api/agent/llm`. Both models read the page image, so the pointer is unaffected. Human approved the switch.

## Next

1. Human voice review on `http://localhost:3100`: confirm silent startup, tap to start, tap to stop, no self-triggered reply, fast first word, no invented assignment, the tutor speaking on its own after the PDF renders, the lead-in and reasoning handoff, captions, and preferred voice.
2. Human review of upload + pointer.
3. After approval: `lane/whiteboard` strokes.
4. Teammate: shell UI polish, auth, transcript; context ingest. `lib/db/schema.sql` still missing. Branch off `main` once this PR merges, because `main` had no voice loop or workspace before it.

Also open: `docs/PROMPT.md` still tells the tutor it has the syllabus, lecture notes, past psets, and exam reviews, none of which exist until the context lane lands. The per-turn `<no_context_yet>` block counteracts it, but the prompt is edited by humans, so a human should decide the wording. It is also the source of the "Got it" opener, via "confirm what you understood".

Rotate `XAI_API_KEY` and `ELEVENLABS_API_KEY` before anything deploys. Both were pasted into a chat and the ElevenLabs one was issued as a one-day key.

## Lanes

| Lane | Owner | Branch | State |
|---|---|---|---|
| voice | David | `lane/voice` | first pass on GitHub |
| workspace | David | `lane/workspace` | pushed, PR open, waiting on human |
| whiteboard | David | not started | next after this |
| context | Teammate | not started | types ready |
| recap | Teammate | not started | |
| shell | Teammate | not started | VoiceSession still composes the split layout |

## Run

```bash
cp .env.example .env.local
# fill XAI_API_KEY and ELEVENLABS_API_KEY
npm install
npm run dev
```

Open http://localhost:3100 for the current isolated preview. Tap the orb to start voice. Tap Homework and drop a PDF.

## How to stop a session

Before you end, update this file: timestamp, who, what changed, what the next person or agent should do, blockers. Update `docs/NOTES.md` under your lane. Commit both with the slice.

## Blockers

Pointer quality depends on Grok seeing the page image. Without API keys you can still open the split and drop a PDF, but it will not point.

The reasoning lane leaves roughly 5 to 8s of quiet after the lead-in line. That is the honest cost of real reasoning and needs a human ear on whether it feels like a TA reading your work or like a hang.

True simultaneous acoustic barge-in is disabled in the homemade RMS loop because speaker echo can create runaway tutor turns. Tap the orb to interrupt. Proper hands-free barge-in should use the ElevenLabs Conversational AI SDK echo and turn handling.
