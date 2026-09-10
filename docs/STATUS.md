# Status

This file is the live snapshot. Chat is not the source of truth. If you are a human or an agent picking this up, start here, then `AGENTS.md`.

Updated: 2026-09-10 16:25 ET
By: David (Cursor)
Repo: https://github.com/Alienware2000/better-office-hours
Branch: `lane/workspace` (tracks `origin/lane/workspace`)
PR: https://github.com/Alienware2000/better-office-hours/pull/1 (open against `main`, mergeable)

## Now

David likes the look: cream, black orb, live captions. Keep that direction. Minimal, not colorful, not old.

He is iterating in person at checkpoints. Do not run ahead into the whiteboard until he says the pointer, highlight, and Leave feel right on a real PDF.

Laser pointer, marker highlight, Leave (and Escape), page Prev/Next, and the pset held by `VoiceSession` are committed on this branch. Next: keep iterating on workspace feel and voice. Do not commit `.env.local`, `CLAUDE.md`, or `.data/psets`.

Dev server: `http://localhost:3100` may already be up. Keys live in `.env.local` (gitignored). Rotate them before deploy: they were pasted into an old chat, and the ElevenLabs key was a one-day key.

## What to try next (human)

1. Reload `http://localhost:3100`. Tap the orb to start. Say homework (or tap the chip). **Leave** or Escape should return to the orb without the browser back button. The PDF, if uploaded, should still be there when you come back.
2. Drop a real pset. Confirm the tutor speaks on its own once the page is readable.
3. Ask about a visible problem. Confirm the laser glides instead of jumping, and the highlight reads as a marker, not a box. Drag to circle or underline.
4. Show wrong working and listen for "let me look" then a careful follow-up. There will be a few seconds of quiet after the lead-in. Say whether that feels like a TA reading or a hang.

## After that approval

`lane/whiteboard`: tldraw strokes that animate in as the tutor names them, then generated animation from the tutor's own spec. Never cut. Nothing on the board is scripted for the demo.

## Later, not Friday

Transcript export, for professors who will eventually shape the tutor's priors. Already in `docs/DESIGN.md` section 13. The live captions are the seed.

Dedicated mobile design. Current rule: laptop and iPad primary, stacked fallback at 640px, usable everywhere.

## Do not

- Start the whiteboard until David approves this workspace pass.
- Edit `docs/PROMPT.md` unless he asks. It still claims the tutor has a syllabus and lecture notes, which is false until the context lane exists. It is also the source of the "Got it" tic ("confirm what you understood"). Propose a diff if needed.
- Silently edit `lib/types.ts`. `[THINK]` already landed with ARCHITECTURE.md 3.4 and 3.5.
- Put a reasoning model on the spoken (fast) turn. Measured: non-reasoning 0.6s, `grok-4.6` default 26s.
- Restore CSS transform choreography for the orb, or a gradient-stroked laser path.
- Add chat boxes or command buttons for talking to the tutor. Voice is the only input. Mouse is for pointing, drawing, and navigation (Leave, pages).
- Commit secrets.

## Done (this branch)

- Spec, scaffold, types, own voice loop (ElevenLabs STT / Grok / ElevenLabs TTS). Not ConvAI yet; localhost cannot receive ElevenLabs server callbacks.
- Voice starts paused. Orb tap starts, orb tap stops and cancels queued speech. Hidden tab and second tab suspend voice. Mic off while the tutor speaks. Acoustic barge-in removed because it heard the speakers and answered itself.
- Two model lanes. Fast: `grok-4.20-0309-non-reasoning`. Reasoning: `grok-4.6` at low effort when the fast lane emits `[THINK]`. Lead-in audio covers most of the wait.
- Honest context: no hardcoded "Problem Set 3". Layout follows speech (`lib/agent/intent.ts`). Tutor speaks when the PDF is ready (`pset_ready` event).
- PDF workspace: upload, PDF.js, laser pointer, marker highlight, student marks (local only), live captions.
- Leave / Escape to leave the workspace without ending the conversation.

## Lanes

| Lane | Owner | Branch | State |
|---|---|---|---|
| voice | David | `lane/voice` | first pass on GitHub; later voice work is on `lane/workspace` |
| workspace | David | `lane/workspace` | PR #1 open; laser, marker, Leave committed |
| whiteboard | David | not started | next after human approval |
| context | Teammate | not started | types ready; `lib/db/schema.sql` missing |
| recap | Teammate | not started | |
| shell | Teammate | not started | VoiceSession still composes the split |

## Run

```bash
cd /Users/davidantwi/Dev/boh
# .env.local should already have XAI_API_KEY and ELEVENLABS_API_KEY
npm run dev -- -p 3100
```

Open http://localhost:3100. Allow the mic. Tap the orb.

Checks without a mic: `node scripts/check-turns.mjs` and `node scripts/check-lanes.mjs` against that server.

## Blockers

Pointer quality depends on Grok seeing the page image.

The reasoning lane still leaves about 5 to 8s of quiet after the lead-in.

Hands-free barge-in is off until ElevenLabs Conversational AI SDK turn handling. Tap the orb to interrupt.
