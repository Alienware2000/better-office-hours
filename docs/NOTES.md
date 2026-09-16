# Current engineering notes

Updated: 2026-09-16. Keep this short and current. Search [archived notes](archive/README.md) for historical evidence; old OPEN/release directives are superseded.

## Workflow and environment

- AGENTS.md is shared authority; CLAUDE.md and Cursor point there. See MEMORY_GUIDE, MEMORY_RECIPE, and WORKFLOW for human instructions. Scripts validate/assemble memory; agents write it.
- Archive completed TASKs before replacing them. Caps: TASK 6,000, default context 12,000, full context 28,000 characters. Strict writes validate branch/base/fields/links. This review again exceeded the full cap; compact duplicate detail into linked guides, never increase the cap.
- Handoff writes a local brief/index, not code or private data. Worktrees are automatic; clones need registration. Verify source commits/dirty state; cross-machine transfer is explicit. See WORKFLOW.
- Standalone helper: ~/.local/bin/boh-context, not on PATH. Refresh with npm run context -- --install after changes. BOH_CONTEXT_HOME isolates fixtures; see MEMORY_RECIPE for reuse.
- Groundtrack tools remain absent. Config and simulated enrichment passed; sign-in/hook approval and live verification are pending. Local continuation works without it. Never invent event IDs.
- dev:local uses loopback 3105 and checkout-local .data; rejects occupied ports/data symlinks and disables cloud/Google settings. It is not a network sandbox. Preserve files, saves, and other servers. Raw dev/build lack these guards; see WORKFLOW.
- A bare background nohup did not persist in the tool shell. September 16 trial restart used a detached process session with a local log; verify HTTP, not just spawn success.
- Fast Refresh lost saved trial drawings; transcript survived. A tested development store now survives module replacement. Verify a recovery export before live edits. Keep live source stable; build/test with isolated data/runtime, never linked live .data. See TUTOR_TRIAL for the incident.

## Voice and pedagogy

- Opus trial 3107 now supports full DRAW/ANIM/math with per-beat validation and ordered glyphs. Prior panel restriction confounded evaluation. See TUTOR_TRIAL for evidence and failures; semantics remain experimental. Human prompts stay frozen. Groundtrack unavailable.
- Quality-first correction: David rejected starting with Flash/Haiku for speed. The active comparison uses flagship reasoning candidates, with explicit effort/budget settings. OpenRouter is configured privately for benchmark children and the isolated trial; never put its key in notes. Current-stack controls and 8,000-token capability pilots are different experiments.
- Pilot failure evidence is in TUTOR_EVALUATION and evaluations/2026-09-14-model-pilot.md: Fable's seventh draw was clipped before a highlight referenced it; Opus returned fenced JSON; Gemini returned an empty object twice. No runtime fix. Do not repeat unchanged Gemini requests or treat compatibility failures as intelligence rankings.

- Synthetic deep input is 48,676 to 49,139 characters without images/history/retrieval. Causality is unmeasured. The real-parser harness measures text/board readiness, not audible latency. Old bench-deep is unsuitable for current structured lessons; see TUTOR_EVALUATION.
- David requires board involvement on every spoken turn; current visual=none and direct-definition paths do not fulfill this. Narration/rendering agreement requires semantic and actual playback review, beyond valid schema. Existing Chrome sessions across subjects are queued for review; the reported stars-related mismatch is not yet inspected. Do not infer the exact topic from its voice transcription.

- Fast routing chooses logistics versus substantive reasoning; handoffs are silent. Rejected direct fast confirmations misclassified ambiguity, new equations, and misconceptions. Extra compact reasoning verification still took seconds and could add a request. Do not restore either without a controlled evaluation.
- Completed structured beats stay in one TTS clip; sentence splitting stranded five-word closing caveats. Legacy streaming still releases sentences. Playback_end records ended/interrupted/error plus media position/duration, not acoustic completeness. No retained old audio. Keep audio-timed visuals, cancellation, barge-in, and ink ownership.
- Live mic tracks do not prove detector frames arrive. September 16 retry restored PCM; cause unconfirmed.
- Topic headings can append to unrelated overflow notes when that page has no prior topic ID. See evaluations/2026-09-16-scene-direction.md; diagnosis recorded, not fixed.
- Historical delays are evidence of model planning costs, not microphone latency. Health checks only report key presence. Synthetic Silero tests do not prove quiet-voice or echo reliability.
- Concept teaching may explain requested equations/examples directly. Graded work retains final-answer protection across workspace modes. Change representation after repeated struggle; avoid forced quizzes and invented course citations. Human PROMPT/PEDAGOGY remain frozen.

- Local observability: npm run review:tutor serves port 3106 independently of the tutor. Reports and ratings stay in ignored .data/evaluation. See TUTOR_REVIEW for human steps and limitations. Static panes bypass reveal; cached listening has ordered writing/audio but omits full-client filtering. New runs capture progress; historical boards are reconstructions.
- Visible biology discovery: Opus introduced animation IDs absent from its static scene, triggering loadAnimation's new-page rule. The membrane stayed on page 1 while molecules moved on page 2. See evaluations/2026-09-14-visible-biology.md. This is a current-store reconstruction, not a verified historical playback failure. No fix yet.

## Whiteboard and workspace

- Follow uses the path's `drawn` progress, normalized 0..1. Constant drawn=1 intentionally fixes the object at the endpoint; a valid schema can still contradict narration. Do not silently invent motion from topic names.
- Declared vector attachments/projections enforce geometry, not physics. Signed relative endpoints must remain signed until composition. Static/animated shapes and snapshots share math and annotation layout. Keep scene IDs, current pages, background, and student ink across revisions.
- Visual quality is broader than reveal timing. Math colors in text.ts/math-layout.ts derive partly from symbol identity, not scene quantities. WHITEBOARD_RESEARCH.md proposes linked quantity roles, stable scenes, and measured composition; no redesign implemented.
- WHITEBOARD_LEARNING_RESEARCH.md separates attention, understanding, and retention. Instructor drawing effects do not prove a typewriter effect works; student-generated marks and tutor ink are different evidence.
- Saved sessions are per browser origin and identity. New port 3105 does not inherit 3102's IndexedDB. PDF bytes are server references, not embedded in JSON exports. Never delete old data to fix a missing attachment; exports/old origin must be handled explicitly.

## Context, recap, and shell

- #6/#8/#9 are integrated, alongside scoped-owner storage/ingestion and optional sign-in. Use current code and ARCHITECTURE's final integration sections, not LANES's early inventory.
- Body email/userId is not ownership. Solutions are excluded from visible retrieval. Recap is optional, student-first, grounded in retrieved sources, and stored locally with the archive. No cloud session-memory adapter exists.
- #11 needs local review/reconciliation; publication freeze forbids remote PR changes. Groundtrack engineering memory is distinct from student learning memory.
