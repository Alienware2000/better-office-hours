# Current engineering notes

Updated: 2026-09-14. Keep this short and current. Search [archived notes](archive/README.md) for historical evidence; old OPEN/release directives are superseded.

## Workflow and environment

- Shared rules live in AGENTS.md. CLAUDE.md imports them; Cursor's rule points there. Private client overrides stay ignored. Human reference: [MEMORY_GUIDE](MEMORY_GUIDE.md); reproduction: [MEMORY_RECIPE](MEMORY_RECIPE.md); operational detail: [WORKFLOW](WORKFLOW.md). The agent writes memory; scripts validate and assemble it, without chat summarization.
- Archive each completed TASK under docs/archive/tasks before replacing it. TASK cap is 6,000 characters, default context 12,000, and full context 28,000. Strict writes reject inconsistent branch/base/fields/links; read-only orientation still reports recovery information. September 14's new audit exceeded the full packet twice; duplicate setup detail was compacted into existing reference docs rather than increasing the cap.
- Handoff writes ignored .data/handoff/CONTINUE.md and one latest task snapshot per checkout under ~/.local/share/boh-context/repos. Worktrees are automatic; separate clones need registration. It copies no code, private files, or chat history. Recheck source status and available commits; dirty/moved/missing snapshots are not proof of current state. Never select solely by timestamp. Cross-machine use requires explicit transfer.
- The standalone ~/.local/bin/boh-context survives removal of its source checkout. Use its full path on David's machine; ~/.local/bin is not on PATH. Refresh with npm run context -- --install after helper changes. BOH_CONTEXT_HOME isolates fixture storage. Adapt names, policies, and installer signatures when reusing elsewhere.
- Both workflow suites passed September 14: check-workflow covers strict validation, private-data exclusion, unsafe symlinks, occupied-port preservation, and actual Next dotenv precedence; check-context-checkouts covers old/detached worktrees, independent clones, absent commits, dirty/moved sources, and repository isolation. These use synthetic repositories, not real user data or model calls.
- Groundtrack tools remain absent. Config and simulated enrichment passed; sign-in/hook approval and live verification are pending. Local continuation works without it. Never invent event IDs.
- npm run dev:local binds to loopback on 3105, uses this checkout's .data, refuses occupied ports/external data symlinks, and disables cloud storage/Google config including dotenv values. It is not an outbound-network sandbox. Preserve old PDF files, browser-origin saves, and server processes. Raw dev/build lack these guards.
- Fast Refresh can interrupt audio. Keep tutor source stable during live sessions; do not build there. Use isolated test data and a separate runtime for voice/renderer checks, never links to live data. Prior builds failed with an externally linked .data.

## Voice and pedagogy

- Quality-first correction: David rejected starting with Flash/Haiku for speed. The active comparison uses flagship reasoning candidates, with explicit effort/budget settings. OpenRouter is now configured privately for benchmark children only; never put its key in notes. Current-stack controls and 8,000-token capability pilots are different experiments.
- Live synthetic discovery: Fable emitted seven DRAW strings in one beat; conceptResponse keeps six, dropping abs-label before a later highlight targets it. This reproduces a missing-target mechanism, not David's uninspected Chrome session. Benchmark detects unresolved highlights; no runtime fix. Opus initially returned fenced JSON; Gemini returned an empty object twice despite strict format requests. Stop identical Gemini retries and investigate schema/provider handling. Treat these as integration failures, not intelligence rankings.

- September 14 audit: [TUTOR_EVALUATION](TUTOR_EVALUATION.md). Synthetic deep requests serialize to 48,676 to 49,139 message characters without images/history/retrieval; prompt-size causality is unmeasured. New benchmark uses real request capture/parsing and reports text vs speech/board readiness, not audible latency. Do not use the old simplified bench-deep to select a model for structured board lessons.
- David requires board involvement on every spoken turn; current visual=none and direct-definition paths do not fulfill this. Narration/rendering agreement requires semantic and actual playback review, beyond valid schema. Existing Chrome sessions across subjects are queued for review; the reported stars-related mismatch is not yet inspected. Do not infer the exact topic from its voice transcription.

- Fast routing chooses logistics versus substantive reasoning; handoffs are silent. Rejected direct fast confirmations misclassified ambiguity, new equations, and misconceptions. Extra compact reasoning verification still took seconds and could add a request. Do not restore either without a controlled evaluation.
- Spoken captions/history advance on actual sentence playback. Completed structured speech boundaries avoid waiting for a later visual chunk. Drawings release on the audio playing event. Keep cancellation epochs, barge-in, and student ink ownership.
- Historical delays are evidence of model planning costs, not microphone latency. Health checks only report key presence. Synthetic Silero tests do not prove quiet-voice or echo reliability.
- Concept teaching may explain requested equations/examples directly. Graded work retains final-answer protection across workspace modes. Change representation after repeated struggle; avoid forced quizzes and invented course citations. Human PROMPT/PEDAGOGY remain frozen.

## Whiteboard and workspace

- Follow uses the path's `drawn` progress, normalized 0..1. Constant drawn=1 intentionally fixes the object at the endpoint; a valid schema can still contradict narration. Do not silently invent motion from topic names.
- Declared vector attachments/projections enforce geometry, not physics. Signed relative endpoints must remain signed until composition. Static/animated shapes and snapshots share math and annotation layout. Keep scene IDs, current pages, background, and student ink across revisions.
- Saved sessions are per browser origin and identity. New port 3105 does not inherit 3102's IndexedDB. PDF bytes are server references, not embedded in JSON exports. Never delete old data to fix a missing attachment; exports/old origin must be handled explicitly.

## Context, recap, and shell

- #6/#8/#9 are integrated, alongside scoped-owner storage/ingestion and optional sign-in. Use current code and ARCHITECTURE's final integration sections, not LANES's early inventory.
- Body email/userId is not ownership. Solutions are excluded from visible retrieval. Recap is optional, student-first, grounded in retrieved sources, and stored locally with the archive. No cloud session-memory adapter exists.
- #11 needs local review/reconciliation; publication freeze forbids remote PR changes. Groundtrack engineering memory is distinct from student learning memory.
