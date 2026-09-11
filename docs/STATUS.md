# Status

This file is the live snapshot. Chat is not the source of truth. If you are a human or an agent picking this up, start here, then `AGENTS.md`.

Updated: 2026-09-10 23:16 ET
By: Whiteboard lane
Repo: https://github.com/Alienware2000/better-office-hours
Branch: `lane/whiteboard` (from `lane/workspace`)
PR: whiteboard PR not opened yet; workspace PR #1 still open against `main`
    https://github.com/Alienware2000/better-office-hours/pull/1

## Now

The declarative whiteboard slice is implemented locally on `lane/whiteboard`, ready for human feel review. No push or PR for this slice. DRAW and ANIM share the paper, color roles, labels, axes, and geometry. The tutor composes visuals for the current topic; projectile motion is only a development fixture.

ANIM supports validated keyframes, path following, camera movement, focus, play/pause, and scrubbing. Its reveal waits for preceding narration. Orb stop, student recording, and board ink pause motion on its current frame. PDF marks publish a fresh image and a debounced `student_mark` event; reactions wait while the tutor is busy and are discarded if the page changes or voice is paused. Board snapshots are captured at request time, including the current animation frame.

## What to do next

1. Human review: ask for a diagram on an arbitrary topic, ask to animate a change, scrub, then interrupt with the orb. Check narration and drawing feel together.
2. Mark a PDF while listening and confirm the tutor refers to that marked region without needing a verbal description. The live mic and PDF event flow still need this manual check.
3. Review model consistency: the first live DRAW check passed its tag-count threshold, but the latest returned only one arrow across two turns and failed that threshold. The renderer accepts both standard DRAW JSON and the observed generic `op: draw` plus `kind` variation. Do not weaken the pedagogy to force extra shapes.
4. Concept mode as a full-size board remains a separate checkpoint. Do not start recap or programmatic animation from this slice.

## Validation

- `npm run build` and `npx tsc --noEmit` pass.
- Focused ESLint on whiteboard, scenes, runtime hints, events, and the animation check passes. Full repo lint still reports existing voice/workspace ref-access errors.
- `node scripts/check-anim.mjs --unit` passes validation, interpolation, holds, Follow, pause/freeze, seek, focus, replay, clear, streaming parser, and a general bar/text/camera example.
- Live ANIM generated a valid general motion spec through `:3100`. Live DRAW behavior varies as described above.
- Browser fixture renders; playback ends and stops; keyboard scrubbing changes the frame. Review real speech synchronization and PDF ink with a mic before merging.

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
- Board JPEG (tutor + student marks + current animation frame) captured for the LLM turn.
- General declarative ANIM runtime, shared style system, playback controls, runtime visual hints, and settled PDF mark events.

## Lanes

| Lane | Owner | Branch | State |
|---|---|---|---|
| voice | David | `lane/voice` | first pass on GitHub; later voice work is on workspace / whiteboard |
| workspace | David | `lane/workspace` | PR #1 open; desk pass approved |
| whiteboard | David | `lane/whiteboard` | **declarative runtime in**; waiting on human feel check |
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
