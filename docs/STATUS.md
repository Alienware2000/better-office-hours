# Status

This file is the live snapshot. Chat is not the source of truth. If you are a human or an agent picking this up, start here, then `AGENTS.md`.

Updated: 2026-09-11 01:32 ET
By: David (Cursor)
Repo: https://github.com/Alienware2000/better-office-hours
Branch: `lane/voice-stress-fixes`, from main
Review: David's voice stress-test work is on PR #6 (or the open stress-fix PR on this branch) and awaits review. That does **not** block Hussein.

## Unblock for Hussein (read this first)

**Hussein may begin the isolated recap card slice now** while PR #6 awaits review. He may also open additional lane PRs (context, recap, shell) from the latest `origin/main` without waiting for David's stress-test PR to merge.

- Branch from `origin/main`: `lane/recap` (or `lane/context` / `lane/shell`).
- Follow `docs/LANES.md` for the first reviewable slice boundaries.
- Open a PR to `main` for David to review. Do not merge your own PRs.
- Stay in recap/context/shell directories. Do not wait on mic hardware checks or PR #6.
- Recap first slice = isolated card + validation/serialization + persistence interface proposal. Do not wire the spoken close flow into `useVoiceLoop` until David coordinates that later.

## Now

Third stress-test follow-up: fixed the reproduced lecture-mention routing bug that hid the homework PDF by opening a separate concept session. Ordinary lecture references and requests to teach a term keep the homework desk. Explicit topic changes still work. Captions retain the full active session, scroll without pulling readers down, and offer subtle Latest/Export controls. Scribe v2 replaces v1; Flash v2.5 remains TTS. Runtime source limits prohibit unsupported lecture attribution, and equation reminders request written definitions. No human prompt or shared-type edits.

Validation: build, focused lint, lifecycle and workspace checks pass. Browser tested transcript scrolling, incoming-response scroll preservation, Latest, and full text export. Actual TTS-to-Scribe v2 round trip returned the physics sentence correctly. A live model probe wrote the general equation and four variable definitions. These synthetic probes do not establish real microphone quality or broad hallucination prevention.

Second stress-test follow-up is ready on the same PR #5: stable controls, local speech detection, request deadlines, microphone retry, and stronger visual setup/reminder hints. The screenshot's paused state is consistent with the old tap race; this branch removes that ambiguous cancellation path. Current setup adds `@ricky0123/vad-web` and automatic local asset preparation through predev/prebuild. No shared types or human prompt changes. Review before merge.

David and Hussein stress-tested the desk and reported premature problem selection, interruptions, missing audio, awkward SI pronunciation, repetitive wording, and weak board/pointer use. This repair is ready for a new human stress test before merge. See STRESS-TEST.md for the consolidated findings, changes, and remaining acceptance checks.

Uploads and ink no longer start autonomous speech. The orb starts or submits only. A separate Pause button and Escape stop voice without leaving the desk, avoiding the automatic-endpoint/tap-to-cancel race. Local Silero v5 speech detection replaces RMS triggering; the endpoint is about 1.1s of non-speech. Startup and request stalls have deadlines and visible recovery. All response chunks are spoken, with captions/history following sentence playback and upcoming audio prepared ahead. Unit/symbol normalization is applied only to TTS. Board equations and queued visual narration are supported; writing on the board stops speech. PDF scrolling targets the requested region using measured zoomed geometry.

Empty-state fix: removed automatic projectile loading from the `boardFixture` URL parameter. A fresh board stays blank until the tutor or student draws. The explicit development fixture helper remains available for tests. Reload an old fixture tab to discard its already loaded in-memory diagram. Focused whiteboard lint and animation unit checks pass. David approved merging this slice as PR #4.

Voice reliability follow-up: delayed transcriptions are cancelled and ignored after pause, resume, desk changes, tab suspension, or unmount. The orb shows thinking during transcription, preventing a competing recording while STT is pending. Noise and STT failure return to listening. Desk transitions discard unfinished recordings and restore the input state. Automated lifecycle checks exercise the real hook with deferred STT and a simulated microphone. David authorized merging PR #3. Try pause/resume and Leave while a recording is processing as the remaining hardware check. This earlier slice established delayed-input isolation; the current stress-test branch adds prototype acoustic interruption, still requiring hardware validation.

One adaptive desk now handles homework, concepts, and other requests. The orb and captions keep the same position. Every desk offers Whiteboard and PDF views: homework starts at Attach pset, concepts and Something else start on the large board with Attach notes available. While viewing a PDF, tutor drawings use the smaller board alongside it. A tutor pointer switches to the attached PDF view. Supplemental notes use the existing upload, highlighting, and ink tools, with their own concept-session state and model context.

Fixed two entry issues: concept state previously never rendered a workspace, and paused tabs claimed voice on microphone initialization, interrupting other tabs. Only an activated tab now claims voice. Starting the orb clears the old handoff message and resumes a suspended audio context. Speech intent accepts homework, home work, p set, assignments, and concept/other requests before waiting for a model tag.

Whiteboard state parks separately with homework and concept sessions and restores paused. Notes do not replace the homework PDF. The existing declarative animation runtime and runtime-only visual hints remain in place. No changes to the human prompt, pedagogy, or shared types. David approved this baseline for main so Hussein can branch from the working desk. Hussein owns context, recap, and shell. Read LANES.md for authorized first slices, acceptance checks, and integration boundaries. Hardware checks remain known follow-ups, not a block on those independent first PRs.

## What to do next

**Hussein (unblocked):** start `lane/recap` from `origin/main` and ship the isolated recap card PR per LANES.md. Open more lane PRs as needed. Do not wait for PR #6.

**David:** keep reviewing PR #6 / stress-test on real mics when ready. Hardware checks do not gate Hussein.

1. Hussein: branch `lane/recap` from latest `origin/main`, build the isolated recap card slice, open a PR to `main`.
2. Hussein: may also open `lane/context` or `lane/shell` first-slice PRs in parallel if capacity allows; each PR stays inside its LANES.md boundary.
3. David: review and merge Hussein's lane PRs independently of PR #6.
4. Human mic check on the stress-test branch when convenient (headphones, then speakers): interruption, quiet voices, pauses, pronunciation, equation use, zoomed pointers. See STRESS-TEST.md.
5. Canvas/Grok Bot operation and live cross-lane wiring still need a separate assignment; not part of the first isolated slices.

## Validation

- Second pass: build, TypeScript, focused lint, voice lifecycle, teaching repair, workspace, and animation checks pass. Headless Chrome loaded the real local speech detector assets and rejected synthetic non-speech input; Pause and Escape work, failed model loading recovers through Retry microphone, and the 768px control layout was inspected. Real microphone/music quality is not established by this smoke test.

- Stress-test branch: build, voice lifecycle harness, teaching repair checks, workspace checks, and animation unit checks pass. Focused voice/runtime/whiteboard lint passes; legacy PDF viewer ref-access lint errors remain.
- The live upload-only model probe still chose problem one despite revised wording. Automatic readiness turns are now disabled in the client. The live general-equation probe produced a DRAW text equation and one question (about 5.8s to first token in the reasoning lane). These are isolated probes, not broad model-quality validation.

- Voice follow-up: production build, lifecycle harness, workspace checks, and animation unit checks pass. `node scripts/check-voice-lifecycle.mjs` requires no credentials. The current branch also fixes the earlier voice-hook ref lint failures; the harness passes lint.

- `npm run build` and `npx tsc --noEmit` pass.
- `node scripts/check-workspace.mjs` passes intent routing, separate board restoration, notes context, and notes event checks.
- Browser verified Homework, Explain a concept, and Something else entry; full-board switching; notes PDF upload/render with annotation controls; return to Whiteboard and Leave. Actual microphone recognition still needs human testing.
- Focused ESLint on whiteboard, scenes, runtime hints, events, and the animation check passes. Full repo lint still reports existing PDF workspace ref-access errors.
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
| context | Hussein | `lane/context` from main | authorized now; first isolated slice in LANES.md; schema missing |
| recap | Hussein | `lane/recap` from main | **start now**; isolated card slice while PR #6 awaits review |
| shell | Hussein | `lane/shell` from main | authorized now; first auth/shell slice; preserve VoiceSession |

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

The reasoning lane still leaves several seconds of quiet after the lead-in; the latest equation reminder probe took about 9s to its first token.

Hands-free interruption now uses browser echo cancellation and local speech probabilities. Background vocals, speaker echo, and quiet voices remain hardware risks. The orb starts/submits; the separate Pause button and Escape stop voice.

PROMPT.md still does not show a JSON DRAW example; the runtime hint and shorthand parser cover it for now.
