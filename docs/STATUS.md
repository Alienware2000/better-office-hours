# Status

This file is the live snapshot. Chat is not the source of truth. If you are a human or an agent picking this up, start here, then `AGENTS.md`.

Updated: 2026-09-11 14:39 ET
By: Hussein (shell lane)
Repo: https://github.com/Alienware2000/better-office-hours
Branch: `lane/shell`, from `origin/main`
Review: David authorized Hussein's independent shell first slice while the context, recap, and voice PRs remain open. This PR requires review before authentication gates the tutor or supplies identity to storage.

## Now

Shell first slice is ready for review. Stable NextAuth v4 provides a Google OAuth route and `/sign-in` shell without replacing or gating the working `VoiceSession`. The policy accepts Yale addresses and reserves the documented judge address, normalizes authenticated identity, and disables sign-in with an explicit missing-configuration message unless all three existing auth environment variables are present. The judge password provider, root-route gate, course identity, and persistence wiring are intentionally absent. The README distinguishes this first slice from finished authentication.

Empty-state fix: removed automatic projectile loading from the `boardFixture` URL parameter. A fresh board stays blank until the tutor or student draws. The explicit development fixture helper remains available for tests. Reload an old fixture tab to discard its already loaded in-memory diagram. Focused whiteboard lint and animation unit checks pass. David approved merging this slice as PR #4.

Voice reliability follow-up: delayed transcriptions are cancelled and ignored after pause, resume, desk changes, tab suspension, or unmount. The orb shows thinking during transcription, preventing a competing recording while STT is pending. Noise and STT failure return to listening. Desk transitions discard unfinished recordings and restore the input state. Automated lifecycle checks exercise the real hook with deferred STT and a simulated microphone. David authorized merging PR #3. Try pause/resume and Leave while a recording is processing as the remaining hardware check. This slice does not enable hands-free barge-in or establish real-device latency.

One adaptive desk now handles homework, concepts, and other requests. The orb and captions keep the same position. Every desk offers Whiteboard and PDF views: homework starts at Attach pset, concepts and Something else start on the large board with Attach notes available. While viewing a PDF, tutor drawings use the smaller board alongside it. A tutor pointer switches to the attached PDF view. Supplemental notes use the existing upload, highlighting, and ink tools, with their own concept-session state and model context.

Fixed two entry issues: concept state previously never rendered a workspace, and paused tabs claimed voice on microphone initialization, interrupting other tabs. Only an activated tab now claims voice. Starting the orb clears the old handoff message and resumes a suspended audio context. Speech intent accepts homework, home work, p set, assignments, and concept/other requests before waiting for a model tag.

Whiteboard state parks separately with homework and concept sessions and restores paused. Notes do not replace the homework PDF. The existing declarative animation runtime and runtime-only visual hints remain in place. No changes to the human prompt, pedagogy, or shared types. David approved this baseline for main so Hussein can branch from the working desk. Hussein owns context, recap, and shell. Read LANES.md for authorized first slices, acceptance checks, and integration boundaries. Hardware checks remain known follow-ups, not a block on those independent first PRs.

## What to do next

Next proposed David voice slice: reduce gaps between spoken sentences by preparing upcoming audio while the current sentence plays, preserving one playback queue and cancellation. Measure first-audio latency and inter-sentence gaps; retain the hardware checks below. Coordinate speech and drawing timing after that. Hussein continues his isolated lanes.

1. Human mic check: tap the orb, say a homework request, then leave and ask for a concept. Confirm the desk opens from speech and the response feels natural.
2. Try a notes PDF in the concept desk. Switch between Notes and Whiteboard, mark the PDF, and confirm the tutor notices the marked region.
3. Try the board on an iPad with Apple Pencil. Pointer input is implemented, but Pencil behavior, palm rejection, and device-specific feel are not verified.
4. Review live drawing cadence. Model DRAW output still varies: one earlier probe returned just one arrow across two turns. Do not weaken the pedagogy to force extra shapes.
5. David reviews Hussein's shell identity boundary before the tutor is gated or context/recap persistence depends on it.

## Validation

- Shell: `node scripts/check-auth.mjs`, focused ESLint, `npx tsc --noEmit`, production build, voice lifecycle, workspace, and animation unit checks pass. Browser verified the honest missing-config `/sign-in` state and unchanged tutor home. `npm ci --dry-run` validates the synchronized lockfile; a later local clean install hit Windows `EPERM` locks on native binaries in the OneDrive checkout and is recorded in NOTES.
- Voice follow-up: production build, lifecycle harness, workspace checks, and animation unit checks pass. `node scripts/check-voice-lifecycle.mjs` requires no credentials. Existing hook ref-access/immutability lint failures remain; the new harness passes lint.

- `npm run build` and `npx tsc --noEmit` pass.
- `node scripts/check-workspace.mjs` passes intent routing, separate board restoration, notes context, and notes event checks.
- Browser verified Homework, Explain a concept, and Something else entry; full-board switching; notes PDF upload/render with annotation controls; return to Whiteboard and Leave. Actual microphone recognition still needs human testing.
- Focused ESLint on whiteboard, scenes, runtime hints, events, and the animation check passes. Full repo lint still reports existing voice/workspace ref-access errors.
- `node scripts/check-anim.mjs --unit` passes validation, interpolation, holds, Follow, pause/freeze, seek, focus, replay, clear, streaming parser, and a general bar/text/camera example.
- Live ANIM generated a valid general motion spec through `:3100`. Live DRAW behavior varies as described above.
- Browser fixture renders; playback ends and stops; keyboard scrubbing changes the frame. Review real speech synchronization and PDF ink with a mic as a hardware follow-up.

## Do not

- Go back to PDF chrome unless David files a new desk bug.
- Edit `docs/PROMPT.md` unless he asks.
- Silently edit `lib/types.ts`.
- Wire the prompt to the projectile test fixture.
- Put a reasoning model on the spoken (fast) turn.
- Add chat boxes or command buttons for talking to the tutor.
- Commit secrets. Do not commit `.env.local`, `CLAUDE.md`, or `.data/psets`.

## Included in main

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
| voice | David | next voice branch from main | custom voice loop and delayed-input isolation included in main |
| workspace | David | next workspace branch from main | adaptive PDF desk included in main |
| whiteboard | David | next whiteboard branch from main | SVG runtime included; hardware follow-ups remain |
| context | Hussein | `lane/context` from main | first isolated slice authorized in LANES.md; schema missing |
| recap | Hussein | `lane/recap` from main | first card/interface slice authorized in LANES.md |
| shell | Hussein | `lane/shell` from main | Google/Yale auth shell ready for review; tutor remains ungated |

## Run

```bash
cd /Users/davidantwi/Dev/boh
# .env.local should already have XAI_API_KEY and ELEVENLABS_API_KEY
npm run dev -- -p 3100
```

Open http://localhost:3100. Allow the mic. Tap the orb. Upload a pset, ask to draw components.

Checks without a mic: `node scripts/check-board.mjs`, `node scripts/check-turns.mjs`, `node scripts/check-lanes.mjs`.

## Blockers

Shell integration needs real Google OAuth credentials, a reviewed authenticated identity contract, and a decision on secure judge-password storage before it can gate the tutor.

Pointer quality depends on Grok seeing the page image.

The reasoning lane still leaves about 5 to 8s of quiet after the lead-in.

Hands-free barge-in is off until ElevenLabs Conversational AI SDK turn handling. Tap the orb to interrupt.

PROMPT.md still does not show a JSON DRAW example; the runtime hint and shorthand parser cover it for now.
