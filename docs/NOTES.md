# Current engineering notes

Updated: 2026-09-14. Keep this short and current. Search [archived notes](archive/README.md) for historical evidence; old OPEN/release directives are superseded.

## Workflow and environment

- AGENTS.md is shared authority; CLAUDE.md and Cursor point there. See MEMORY_GUIDE, MEMORY_RECIPE, and WORKFLOW for human instructions. Scripts validate/assemble memory; agents write it.
- Archive completed TASKs before replacing them. Caps: TASK 6,000, default context 12,000, full context 28,000 characters. Strict writes validate branch/base/fields/links. This review again exceeded the full cap; compact duplicate detail into linked guides, never increase the cap.
- Handoff writes .data/handoff/CONTINUE.md and the local checkout index. Worktrees are automatic; clones need registration. No code, private files, or chats are copied. Verify source status/commits; timestamps and stale snapshots are not authority. Cross-machine transfer is explicit. See WORKFLOW.
- Standalone helper: ~/.local/bin/boh-context, not on PATH. Refresh with npm run context -- --install after changes. BOH_CONTEXT_HOME isolates fixtures; see MEMORY_RECIPE for reuse.
- Groundtrack tools remain absent. Config and simulated enrichment passed; sign-in/hook approval and live verification are pending. Local continuation works without it. Never invent event IDs.
- npm run dev:local binds to loopback on 3105, uses this checkout's .data, refuses occupied ports/external data symlinks, and disables cloud storage/Google config including dotenv values. It is not an outbound-network sandbox. Preserve old PDF files, browser-origin saves, and server processes. Raw dev/build lack these guards.
- Fast Refresh can interrupt audio. Keep tutor source stable during live sessions; do not build there. Use isolated test data and a separate runtime for voice/renderer checks, never links to live data. Prior builds failed with an externally linked .data.

## Voice and pedagogy

- David prefers fewer choices and found Astra low promising for biology. Recommend a single voiced trial with cost visibility; no formal ratings or runtime selection were inferred. Diagram design-language work is deferred in DESIGN.
- Quality-first correction: David rejected starting with Flash/Haiku for speed. The active comparison uses flagship reasoning candidates, with explicit effort/budget settings. OpenRouter is now configured privately for benchmark children only; never put its key in notes. Current-stack controls and 8,000-token capability pilots are different experiments.
- Live synthetic discovery: Fable emitted seven DRAW strings in one beat; conceptResponse keeps six, dropping abs-label before a later highlight targets it. This reproduces a missing-target mechanism, not David's uninspected Chrome session. Benchmark detects unresolved highlights; no runtime fix. Opus initially returned fenced JSON; Gemini returned an empty object twice despite strict format requests. Stop identical Gemini retries and investigate schema/provider handling. Treat these as integration failures, not intelligence rankings.

- Synthetic deep input is 48,676 to 49,139 characters without images/history/retrieval. Causality is unmeasured. The real-parser harness measures text/board readiness, not audible latency. Old bench-deep is unsuitable for current structured lessons; see TUTOR_EVALUATION.
- David requires board involvement on every spoken turn; current visual=none and direct-definition paths do not fulfill this. Narration/rendering agreement requires semantic and actual playback review, beyond valid schema. Existing Chrome sessions across subjects are queued for review; the reported stars-related mismatch is not yet inspected. Do not infer the exact topic from its voice transcription.

- Fast routing chooses logistics versus substantive reasoning; handoffs are silent. Rejected direct fast confirmations misclassified ambiguity, new equations, and misconceptions. Extra compact reasoning verification still took seconds and could add a request. Do not restore either without a controlled evaluation.
- Spoken captions/history advance on actual sentence playback. Completed structured speech boundaries avoid waiting for a later visual chunk. Drawings release on the audio playing event. Keep cancellation epochs, barge-in, and student ink ownership.
- Historical delays are evidence of model planning costs, not microphone latency. Health checks only report key presence. Synthetic Silero tests do not prove quiet-voice or echo reliability.
- Concept teaching may explain requested equations/examples directly. Graded work retains final-answer protection across workspace modes. Change representation after repeated struggle; avoid forced quizzes and invented course citations. Human PROMPT/PEDAGOGY remain frozen.

- Local observability: npm run review:tutor serves port 3106 independently of the tutor. Reports and ratings stay in ignored .data/evaluation. See TUTOR_REVIEW for human steps and limitations. It uses real layout/drawing modules but bypasses audio/reveal/full-client filtering. New runs capture progress; historical boards are reconstructions.
- Visible biology discovery: Opus introduced animation IDs absent from its static scene, triggering loadAnimation's new-page rule. The membrane stayed on page 1 while molecules moved on page 2. See evaluations/2026-09-14-visible-biology.md. This is a current-store reconstruction, not a verified historical playback failure. No fix yet.

## Whiteboard and workspace

- Follow uses the path's `drawn` progress, normalized 0..1. Constant drawn=1 intentionally fixes the object at the endpoint; a valid schema can still contradict narration. Do not silently invent motion from topic names.
- Declared vector attachments/projections enforce geometry, not physics. Signed relative endpoints must remain signed until composition. Static/animated shapes and snapshots share math and annotation layout. Keep scene IDs, current pages, background, and student ink across revisions.
- Saved sessions are per browser origin and identity. New port 3105 does not inherit 3102's IndexedDB. PDF bytes are server references, not embedded in JSON exports. Never delete old data to fix a missing attachment; exports/old origin must be handled explicitly.

## Context, recap, and shell

- #6/#8/#9 are integrated, alongside scoped-owner storage/ingestion and optional sign-in. Use current code and ARCHITECTURE's final integration sections, not LANES's early inventory.
- Body email/userId is not ownership. Solutions are excluded from visible retrieval. Recap is optional, student-first, grounded in retrieved sources, and stored locally with the archive. No cloud session-memory adapter exists.
- #11 needs local review/reconciliation; publication freeze forbids remote PR changes. Groundtrack engineering memory is distinct from student learning memory.
