# From board studies to a learning session

Updated September 20, 2026. Local development only; Vercel stays paused.

## What is saved and what is running

The live composition candidate is committed at `19a3681` on `lane/post-hackathon-local`. TASK, STATUS, STEM_WHITEBOARD and the evaluation reports preserve decisions, limitations and the next step. `npm run handoff` refreshes the machine-local continuation record. Local Git and handoff files are not a remote backup; no push has occurred.

| Surface | Purpose | Current state |
| --- | --- | --- |
| http://localhost:3116/ | Retained voice tutor baseline | Snapshot `1770053`, board-text fix and existing DRAW/ANIM pipeline |
| http://localhost:3117/ | Isolated live composition candidate | Snapshot `19a3681`, measured diagram equations and lateral placement; [evidence](evaluations/2026-09-20-live-composition.md) |
| http://localhost:3116/board-stem.html | Authored renderer/design examples | Eight pages using the document composition prototype |
| http://localhost:3116/board-stem-models.html | Inspection of real model output | Four saved synthetic requests, excluding the voice pipeline |

The document composition prototype is not connected to the tutor. Starting another snapshot of current HEAD alone will not integrate it. Both the root and gallery returned HTTP 200 when preparing this plan; that is reachability evidence only.

## Next bounded product milestone

The equation-layout slice below is implemented and checked in 3117. Next compare complete sessions, especially generated geometry accuracy and voice/visual timing. The broader document prototype is still separate.

Make a general improvement to diagram/equation composition in the live path, then judge it during complete learning sessions. Start by replaying the saved model output that split a related diagram and equation across pages. Inspect `lib/whiteboard/store.ts`, the live lesson validator and their layout contracts against `lib/whiteboard/document.ts` before selecting the smallest compatible change. Keep readable text, labels, related content and student working space together where they fit. Preserve meaningful page breaks and prior ink when they do not fit.

Concrete reproduction: `matrix-transform` in ignored `.data/evaluation/stem-models-1789930467123/report.json`, replayed through `renderReview`. Its second equation spills onto page 2. Investigate batch equation sizing/space reservation in `writing.ts` and `store.ts`, retaining narration timing and the current DRAW contract. Separately, panel/non-panel transitions force page breaks in both store and lesson validation; removing that rule without reserving space is not a safe shortcut. Composition changes cannot establish scientific correctness of generated geometry or motion.

Do not route student topics to gallery fixtures, promise arbitrary STEM accuracy, or adopt the whole prototype as a new model contract. Keep the model, voice and provider settings fixed for the first comparison. Any required frozen/shared-contract change needs coordination before implementation.

1. Reproduce the failure from the saved spec offline; retain it as regression evidence. Implement and check the general correction, including a case that must start a new page.
2. Commit the candidate and record its source/profile fingerprints. Use an isolated test runtime and fresh synthetic sessions. Preserve current student origins and PDF storage. Do not replace the runtime under an active lesson.
3. Run the same small learning-session protocol below on baseline and candidate. Include unfamiliar topics beyond the authored gallery. Separate agent-run text/UI checks from human microphone and listening checks.
4. Record what improved, regressed or remains unknown; fix the largest observed problem next. More aesthetic variants are not the next milestone. Public promotion is a separate reviewed step.

## Session protocol

Begin with one complete session on an unfamiliar topic using the sequence below, then widen to other subjects. Use self-contained, ungraded requests for concept tests. Topics are test samples, never the supported-topic list. Keep initial prompts and follow-ups matched across versions and repeat enough turns to expose inconsistency; a single attractive output is not a pass.

| Step | What to exercise | Evidence to keep |
| --- | --- | --- |
| Explain | Ask for a STEM concept with a useful visual; sample mathematical, physical, chemical and biological reasoning | Scientific correctness, readable labels/LaTeX, meaningful color, uncluttered board and a visible action or focus during teaching |
| Respond to confusion | Say which part is unclear; ask for a smaller step | Explanation actually changes; narration and visible content agree |
| Change something | Ask a counterfactual or modify a quantity/relationship | Diagram and equation update consistently; motion is physically meaningful when used |
| Collaborate | Write or circle something, then explicitly ask about the mark | Student ink survives; tutor refers to the actual mark at the next turn. Current ink awareness is not continuous |
| Control the conversation | Try typing, independent mute, interruption, then another spoken turn | Shared context/board, complete speech endings, predictable listening state and recovery |
| Apply | Ask the learner to explain or apply the idea to a new case | Record their actual response and remaining confusion; tutor notes are not mastery evidence |
| Recover | Export, leave and reopen the synthetic session | Transcript, pages, equations, motion and ink remain; attached PDF still opens |

Also run a synthetic graded-work/PDF case to check hints, grounding and answer protection. Check compact and expanded boards. Background noise, quiet speech, physical audio endings and iPad writing require real device/human evidence.

The [Studdy study](evaluations/2026-09-20-studdy-study.md) adds three comparison criteria: keep related working/diagrams spatially stable, visibly identify where to continue on return, and distinguish lesson preparation from unexpected follow-up latency. Compare automatic endpointing with explicit submission separately; BOH currently allows about three seconds of quiet. Preserve thinking pauses while measuring that cost. Session restoration exists, but a completion-linked return highlight is not implemented.

Record the app's end-of-speech-to-audio diagnostic alongside whether the first audible teaching was useful. Record first useful visual separately where observable, complete playback, errors/repairs and provider cost where available. Report sample counts and per-turn values before aggregates. A model's first token or complete speech-unit timing is not end-to-end latency. Do not invent a latency target or claim improvement without matched evidence.

## Keep engineering work and learner work safe

Code and decisions belong in Git; raw session exports, diagnostic reports and uploads stay in ignored local storage. Save a dated run note containing revision, profile, scenario, session ID, observations and links to private local evidence. Only a concise non-private summary belongs in `docs/evaluations/`.

Sessions are browser-local and tied to their origin. A JSON export includes structured board/ink state and transcript, but excludes PDF bytes and microphone recordings. Preserve corresponding server PDF storage separately. A clicked export button is not a verified backup: locate the downloaded file, parse it and check the expected session, transcript and board contents. Test reopening the synthetic session on the same origin; do not promise a JSON import feature or a verified restoration from export without testing one.

Before replacing a runtime used by David, verify recovery evidence and preserve its old source/storage. An isolated fresh test runtime can proceed without overwriting his sessions. Existing 3114, 3115 and 3116 listeners were identified by cwd and left untouched during this checkpoint.
