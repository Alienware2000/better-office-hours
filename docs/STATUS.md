# Status

This file is the live snapshot. Chat is not the source of truth. If you are a human or an agent picking this up, start here, then `AGENTS.md`.

Updated: 2026-09-10 20:25 ET
By: David (Cursor)
Repo: https://github.com/Alienware2000/better-office-hours
Branch: `lane/workspace` (tracks `origin/lane/workspace`)
PR: https://github.com/Alienware2000/better-office-hours/pull/1 (open against `main`)

## Now

David likes the look: cream, black orb, live captions. Keep that direction. Minimal, not colorful, not old.

He is iterating in person at checkpoints. Do not start the whiteboard until he says the pointer, highlight, Leave, ink, zoom, Remove, and session parking feel right on a real PDF.

This pass: the tutor should feel like it can see the desk (assignment and problem on screen, no "please upload" after the PDF is there). Zoom should pan like a document, and the split should fit laptop and stacked widths. Dev server: `http://localhost:3100`. Do not commit `.env.local`, `CLAUDE.md`, or `.data/psets`.

## What to try next (human)

1. Reload `http://localhost:3100`. Homework, drop a pset. Confirm the paper fills the desk at 100% with no crop.
2. If the orb still says Tap to start, tap it after the PDF is up. The tutor should name something on the page, not ask you to upload.
3. Zoom with − / +, pinch or Ctrl-scroll. Drag with the hand tool to pan. Click the percent to fit again. Draw at 150% and confirm ink and the laser still land.
4. Narrow the window toward stacked (640px). The bar should still fit. Leave still parks. Remove still puts the paper away.

## After that approval

`lane/whiteboard`: tldraw strokes that animate in as the tutor names them, then generated animation from the tutor's own spec. Never cut. Nothing on the board is scripted for the demo. Match the ink bar's drawing feel, not a new tool language.

## Later, not Friday

A notebook library of past PDFs (GoodNotes gallery). Today: one open paper, Remove to switch.

Transcript export, for professors who will eventually shape the tutor's priors. Already in `docs/DESIGN.md` section 13.

Dedicated mobile design. Current rule: laptop and iPad primary, stacked fallback at 640px, usable everywhere.

## Do not

- Start the whiteboard until David approves this workspace pass.
- Edit `docs/PROMPT.md` unless he asks. It still claims the tutor has a syllabus and lecture notes, which is false until the context lane exists. It is also the source of the "Got it" tic ("confirm what you understood"). Propose a diff if needed.
- Silently edit `lib/types.ts`. `[THINK]` already landed with ARCHITECTURE.md 3.4 and 3.5. Student ink is workspace-local; do not replace `StudentAnnotation` in this slice.
- Put a reasoning model on the spoken (fast) turn. Measured: non-reasoning 0.6s, `grok-4.6` default 26s.
- Restore CSS transform choreography for the orb, or a gradient-stroked laser path.
- Add chat boxes or command buttons for talking to the tutor. Voice is the only input. Mouse is for pointing, drawing, paging, zoom, Leave, and Remove.
- Commit secrets.

## Done (this branch)

- Spec, scaffold, types, own voice loop (ElevenLabs STT / Grok / ElevenLabs TTS). Not ConvAI yet; localhost cannot receive ElevenLabs server callbacks.
- Voice starts paused. Orb tap starts, orb tap stops and cancels queued speech. Hidden tab and second tab suspend voice. Mic off while the tutor speaks. Acoustic barge-in removed because it heard the speakers and answered itself.
- Two model lanes. Fast: `grok-4.20-0309-non-reasoning`. Reasoning: `grok-4.6` at low effort when the fast lane emits `[THINK]`. Lead-in audio covers most of the wait.
- Honest context: no hardcoded "Problem Set 3". Layout follows speech (`lib/agent/intent.ts`). Tutor speaks when the PDF is ready (`pset_ready` event). That event waits until the orb is listening, and a live page tells the tutor not to ask for an upload.
- PDF workspace: upload, PDF.js, fit-width zoom with pan, laser pointer, marker highlight, student ink, Remove to switch papers, live captions.
- Leave / Escape parks the desk and the homework session. Remove throws that paper away. Homework chip restores a parked desk. Parked viewer does not keep the pset in Grok's view.

## Lanes

| Lane | Owner | Branch | State |
|---|---|---|---|
| voice | David | `lane/voice` | first pass on GitHub; later voice work is on `lane/workspace` |
| workspace | David | `lane/workspace` | PR #1 open; iterating on desk feel, ink, and sessions |
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
