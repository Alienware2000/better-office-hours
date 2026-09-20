# Current engineering notes

Updated: 2026-09-20. Keep this short and current. Search [archived notes](archive/README.md) for historical evidence; old OPEN/release directives are superseded.

## Workflow and environment

- AGENTS.md is shared authority; CLAUDE.md and Cursor point there. See MEMORY_GUIDE, MEMORY_RECIPE, and WORKFLOW for human instructions. Scripts validate/assemble memory; agents write it.
- Archive completed TASKs before replacing them. Caps: TASK 6,000, default context 12,000, full context 28,000 characters. Strict writes validate branch/base/fields/links. Compact detail into linked guides; keep the caps.
- DEVELOPMENT records product/candidate/evaluation separation and promotion. Hackathon won per David; public pause remains. Handoff indexes a brief, not code/data. Verify commits and dirty state; clone registration and cross-machine transfer are explicit. See WORKFLOW.
- Standalone helper: ~/.local/bin/boh-context, not on PATH. Refresh with npm run context -- --install after changes. BOH_CONTEXT_HOME isolates fixtures; see MEMORY_RECIPE for reuse.
- Groundtrack tools remain absent. Config and simulated enrichment passed; sign-in/hook approval and live verification are pending. Local continuation works without it. Never invent event IDs.
- dev:local uses loopback 3105 and checkout-local .data; rejects occupied ports/data symlinks and disables cloud/Google settings. It is not a network sandbox. Preserve files, saves, and other servers. Raw dev/build lack these guards; see WORKFLOW.
- A bare background nohup did not persist in the tool shell. September 16 trial restart used a detached process session with a local log; verify HTTP, not just spawn success.
- Fast Refresh lost saved trial drawings; transcript survived. A tested development store now survives module replacement. Verify a recovery export before live edits. Keep live source stable; build/test with isolated data/runtime, never linked live .data. See TUTOR_TRIAL for the incident.

## Voice and pedagogy

- Typing bypasses mic/STT; mute is independent of pause/abort and persists. Voice auto-listens unless muted. Orb stays plain, with a noninteractive caption. Keep integrated controls and collapsed trial details. See evaluations/2026-09-20-input-design.md and evaluations/2026-09-20-hybrid-voice-prose.md. Real-device review pending; old snapshot data retained.

- 1185aec drains accepted audio after late SSE errors while retaining cancellation. 3108 instead logged beat-2 disclosure_boundary; rejected text is unavailable. Narrow TeX-unit normalization fixes a reproduced false positive, not a proven historical cause; one guarded continuation is allowed. 3109 later logged stale_drawing after recovery. Current rendered inventory includes source-less text and full geometry; see evaluations/2026-09-20-drawing-focus.md and evaluations/2026-09-18-guard-recovery.md. Acoustic completion remains unverified. 3108 export failed; preserve data.

- Opus trial 3107 now supports full DRAW/ANIM/math with per-beat validation and ordered glyphs. Prior panel restriction confounded evaluation. See TUTOR_TRIAL for evidence and failures; semantics remain experimental. Human prompts stay frozen. Groundtrack unavailable.
- David rejected Flash/Haiku-first optimization. Compare flagship candidates with explicit effort/budgets. OpenRouter keys remain private. Current-stack controls and 8,000-token pilots are separate experiments.
- Pilot caveats: seventh-draw clipping, fenced JSON and two empty Gemini responses. See TUTOR_EVALUATION and evaluations/2026-09-14-model-pilot.md. Do not repeat unchanged Gemini requests or rank intelligence from compatibility failures.

- Model benchmarks measure text/board readiness, not audible latency. Old bench-deep is unsuitable for structured lessons. Input-size evidence and current harness are in TUTOR_EVALUATION.
- David requires board involvement on every spoken turn; visual=none/direct definitions do not always fulfill it. September 20 reviewed 33 transcripts across checked browser histories; see evaluations/2026-09-20-session-review.md. Visibility complaints, deferred equations, repeated questions, and background speech recur. Transcripts do not prove acoustic completion or actual rendered frames; no restorable backup verified.

- Fast routing chooses logistics versus substantive reasoning; handoffs are silent. Rejected direct fast confirmations misclassified ambiguity, new equations, and misconceptions. Extra compact reasoning verification still took seconds and could add a request. Do not restore either without a controlled evaluation.
- Keep completed beats in one TTS clip; sentence splitting stranded short closing caveats. Legacy streaming still releases sentences. playback_end measures media completion, not acoustic completeness. Keep audio-timed visuals, explicit interruption and ink ownership.
- Live mic tracks do not prove detector frames arrive. September 16 retry restored PCM; cause unconfirmed.
- Topic headings can append to unrelated overflow notes when that page has no prior topic ID. See evaluations/2026-09-16-scene-direction.md; diagnosis recorded, not fixed.
- Historical delays are evidence of model planning costs, not microphone latency. Health checks only report key presence. Synthetic Silero tests do not prove quiet-voice or echo reliability.
- Concept teaching may explain requested equations/examples directly. Graded work retains final-answer protection across workspace modes. Change representation after repeated struggle; avoid forced quizzes and invented course citations. Human PROMPT/PEDAGOGY remain frozen.

- Local observability: npm run review:tutor serves port 3106 independently of the tutor. Reports and ratings stay in ignored .data/evaluation. See TUTOR_REVIEW for human steps and limitations. Static panes bypass reveal; cached listening has ordered writing/audio but omits full-client filtering. New runs capture progress; historical boards are reconstructions.
- Visible biology discovery: Opus introduced animation IDs absent from its static scene, triggering loadAnimation's new-page rule. The membrane stayed on page 1 while molecules moved on page 2. See evaluations/2026-09-14-visible-biology.md. This is a current-store reconstruction, not a verified historical playback failure. No fix yet.

## Whiteboard and workspace

- STEM is open-ended; examples are diagnostic, never runtime scene presets. Four real model calls again exposed stationary Follow, wrong geometric proportions and fragmented pages. Static review must include actual board CSS. See evaluations/2026-09-20-stem-board.md.
- Document composition remains local; 3116/board-system-v2.html is synthetic, with no narration/ink integration. Preserve opaque paper fills when recoloring tint. SVG hit rectangles failed pointer checks; native HTML hit buttons worked. See evaluations/2026-09-20-board-experience.md.
- Follow uses the path's `drawn` progress, normalized 0..1. Constant drawn=1 intentionally fixes the object at the endpoint; a valid schema can still contradict narration. Do not silently invent motion from topic names.
- Declared vector attachments/projections enforce geometry, not physics. Signed relative endpoints must remain signed until composition. Static/animated shapes and snapshots share math and annotation layout. Keep scene IDs, current pages, background, and student ink across revisions.
- Speech reliability and latency precede diagram improvements; public Vercel stays paused. Jev is deferred; JEV_RESEARCH.md records browser-use motivation for later. No integration or benchmark. Board text now uses authored mark color; no character-derived rainbow. Short connective prose stays prose. Old cached math colors are neutralized in SVG/snapshot; old baked prose geometry is not migrated. See evaluations/2026-09-20-board-feedback.md for the next consistency pass.
- WHITEBOARD_LEARNING_RESEARCH.md separates attention, understanding, and retention. Instructor drawing effects do not prove a typewriter effect works; student-generated marks and tutor ink are different evidence.
- Saved sessions are per browser origin and identity. New port 3105 does not inherit 3102's IndexedDB. PDF bytes are server references, not embedded in JSON exports. Never delete old data to fix a missing attachment; exports/old origin must be handled explicitly.

## Context, recap, and shell

- #6/#8/#9 are integrated, alongside scoped-owner storage/ingestion and optional sign-in. Use current code and ARCHITECTURE's final integration sections, not LANES's early inventory.
- Body email/userId is not ownership. Solutions are excluded from visible retrieval. Recap is optional, student-first, grounded in retrieved sources, and stored locally with the archive. No cloud session-memory adapter exists.
- #11 needs review/reconciliation; no remote change is authorized by this consolidation. Groundtrack engineering memory is distinct from student learning memory.
