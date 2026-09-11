# Status

This file is the live snapshot. Chat is not the source of truth. If you are a human or an agent picking this up, start here, then `AGENTS.md`.

Updated: 2026-09-10 20:51 ET
By: David (Cursor)
Repo: https://github.com/Alienware2000/better-office-hours
Branch: `lane/workspace` (tracks `origin/lane/workspace`)
PR: https://github.com/Alienware2000/better-office-hours/pull/1 (open against `main`)

## Now

David signed off on the desk pass: cream, black orb, live captions, ink, zoom with pan, Leave / Remove, and the tutor seeing the open page. "Definitely much better." Continue in a new chat.

Next slice is the whiteboard. Branch `lane/whiteboard` from current `lane/workspace` (or from `main` after PR #1 lands). Do not keep polishing the PDF viewer unless a new human note says a desk bug is blocking the demo.

`lane/workspace` is 5 commits ahead of `origin/lane/workspace` and not pushed. Push before another machine or a cloud agent needs this tip. Dev server: `http://localhost:3100`. Do not commit `.env.local`, `CLAUDE.md`, or `.data/psets`.

## What to do next (new chat)

1. Read `docs/STATUS.md`, `AGENTS.md`, `docs/DESIGN.md` section 4 (whiteboard), `docs/ARCHITECTURE.md` section 3.3, `docs/DEMO.md` 20 to 45s, `docs/NOTES.md` workspace + whiteboard.
2. Branch `lane/whiteboard`. Stay in `components/whiteboard/*`, `components/scenes/*`, `lib/whiteboard/*`. Wire into the agent pane from `VoiceSession` only as much as needed to mount the board. Do not silently edit `lib/types.ts`.
3. First working slice: board collapsed until the tutor draws; `[BOARD open]` then `[DRAW ...]` strokes that animate in as the tutor names them. Match the ink bar (cream, black, rust, gold). Student can draw; the tutor sees those marks.
4. Then generated animation from the tutor's own spec, using the student's numbers. Nothing on the board is scripted for the demo. The hand-written projectile scene is a test fixture and fallback only.

## After the first board drawing works

Declarative animation runtime (`play`, `pause`, `seek`). Concept mode can become the full-size board. Recap is still a teammate lane; do not skip the board to build a recap card.

## Later, not Friday

A notebook library of past PDFs (GoodNotes gallery). Today: one open paper, Remove to switch.

Transcript export, for professors who will eventually shape the tutor's priors. Already in `docs/DESIGN.md` section 13.

Dedicated mobile design. Current rule: laptop and iPad primary, stacked fallback at 640px, usable everywhere.

## Do not

- Go back to PDF chrome unless David files a new desk bug.
- Edit `docs/PROMPT.md` unless he asks. It still claims the tutor has a syllabus and lecture notes, which is false until the context lane exists. It is also the source of the "Got it" tic ("confirm what you understood"). Propose a diff if needed.
- Silently edit `lib/types.ts`. `[THINK]` already landed with ARCHITECTURE.md 3.4 and 3.5. Student ink is workspace-local; do not replace `StudentAnnotation` in this slice.
- Put a reasoning model on the spoken (fast) turn. Measured: non-reasoning 0.6s, `grok-4.6` default 26s.
- Restore CSS transform choreography for the orb, or a gradient-stroked laser path.
- Add chat boxes or command buttons for talking to the tutor. Voice is the only input. Mouse is for pointing, drawing, paging, zoom, Leave, and Remove.
- Commit secrets.
- Wire the prompt to the projectile test fixture.

## Done (this branch)

- Spec, scaffold, types, own voice loop (ElevenLabs STT / Grok / ElevenLabs TTS). Not ConvAI yet; localhost cannot receive ElevenLabs server callbacks.
- Voice starts paused. Orb tap starts, orb tap stops and cancels queued speech. Hidden tab and second tab suspend voice. Mic off while the tutor speaks. Acoustic barge-in removed because it heard the speakers and answered itself.
- Two model lanes. Fast: `grok-4.20-0309-non-reasoning`. Reasoning: `grok-4.6` at low effort when the fast lane emits `[THINK]`. Lead-in audio covers most of the wait.
- Honest context: no hardcoded "Problem Set 3". Layout follows speech (`lib/agent/intent.ts`). Tutor speaks when the PDF is ready (`pset_ready` event). That event waits until the orb is listening, and a live page tells the tutor not to ask for an upload.
- PDF workspace: upload, PDF.js, fit-width zoom with pan, laser pointer, marker highlight, student ink, Remove to switch papers, live captions.
- Leave / Escape parks the desk and the homework session. Remove throws that paper away. Homework chip restores a parked desk. Parked viewer does not keep the pset in Grok's view.
- David approved the desk feel on 2026-09-10.

## Lanes

| Lane | Owner | Branch | State |
|---|---|---|---|
| voice | David | `lane/voice` | first pass on GitHub; later voice work is on `lane/workspace` |
| workspace | David | `lane/workspace` | PR #1 open; desk pass approved; 5 commits not pushed |
| whiteboard | David | not started | **next**; branch off current workspace tip |
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
