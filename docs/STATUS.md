# Status

This file is the live snapshot. Chat is not the source of truth. If you are a human or an agent picking this up, start here, then `AGENTS.md`.

Updated: 2026-09-10 21:20 ET
By: David (Cursor)
Repo: https://github.com/Alienware2000/better-office-hours
Branch: `lane/whiteboard` (from `lane/workspace`)
PR: whiteboard PR not opened yet; workspace PR #1 still open against `main`
    https://github.com/Alienware2000/better-office-hours/pull/1

## Now

First whiteboard slice is in: board collapsed until `[BOARD open]`, `[DRAW ...]` strokes animate in one at a time, student ink (cream / black / rust / gold) snapshots to the model. Custom SVG board (not tldraw yet). Fast-lane `max_tokens` raised to 700 so DRAW tags are not cut mid-JSON. Shorthand DRAW bodies are accepted as a fallback when the model skips JSON.

Human should tap the orb on a homework desk and ask to split velocity into components; confirm the board slides open and strokes draw in. `node scripts/check-board.mjs` against `:3100` checks tags without a mic.

## What to do next

1. Human review of the first board drawing feel (open, stroke-in, student ink reaching the tutor).
2. If that passes: declarative animation runtime (`[ANIM ...]`, play / pause / seek) using the student's numbers. Projectile scene stays a fixture only.
3. Concept mode as full-size board is after that. Do not skip to recap.
4. Propose a PROMPT.md tweak so DRAW always shows a JSON example (POINT-style attrs make the model invent non-JSON DRAW). Do not edit PROMPT.md without David.

## Do not

- Go back to PDF chrome unless David files a new desk bug.
- Edit `docs/PROMPT.md` unless he asks.
- Silently edit `lib/types.ts`.
- Wire the prompt to the projectile test fixture.
- Put a reasoning model on the spoken (fast) turn.
- Add chat boxes or command buttons for talking to the tutor.
- Commit secrets. Do not commit `.env.local`, `CLAUDE.md`, or `.data/psets`.

## Done (this branch)

- Everything on `lane/workspace` (desk pass approved).
- Whiteboard mount in the agent pane under captions.
- `lib/whiteboard/*` store, geometry, snapshot, live board, DRAW parse (JSON + shorthand).
- `components/whiteboard/*` paper, stroke-in animation, BoardInkBar.
- Voice loop applies `[BOARD open]` / `[DRAW ...]` as the reply streams; resets command cursor per model pass so `[THINK]` deep turns still draw.
- Board JPEG (tutor + student marks) posted with the LLM turn when the board has content.

## Lanes

| Lane | Owner | Branch | State |
|---|---|---|---|
| voice | David | `lane/voice` | first pass on GitHub; later voice work is on workspace / whiteboard |
| workspace | David | `lane/workspace` | PR #1 open; desk pass approved |
| whiteboard | David | `lane/whiteboard` | **first draw slice in**; waiting on human feel check |
| context | Teammate | not started | types ready; `lib/db/schema.sql` missing |
| recap | Teammate | not started | |
| shell | Teammate | not started | VoiceSession still composes the split |

## Run

```bash
cd /Users/davidantwi/Dev/boh
# .env.local should already have XAI_API_KEY and ELEVENLABS_API_KEY
npm run dev -- -p 3100
```

Open http://localhost:3100. Allow the mic. Tap the orb. Upload a pset, ask to draw components.

Checks without a mic: `node scripts/check-board.mjs`, `node scripts/check-turns.mjs`, `node scripts/check-lanes.mjs`.

## Blockers

Pointer quality depends on Grok seeing the page image.

The reasoning lane still leaves about 5 to 8s of quiet after the lead-in.

Hands-free barge-in is off until ElevenLabs Conversational AI SDK turn handling. Tap the orb to interrupt.

PROMPT.md still does not show a JSON DRAW example; the runtime hint and shorthand parser cover it for now.
