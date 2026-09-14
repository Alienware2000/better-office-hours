# Current engineering notes

Updated: 2026-09-14. Keep this short and current. Search [archived notes](archive/README.md) for historical evidence; old OPEN/release directives are superseded.

## Workflow and environment

- Shared instructions: root AGENTS.md. Claude imports them through a tracked, instruction-only CLAUDE.md; private overrides belong in ignored CLAUDE.local.md. Cursor's existing always-on rule points to AGENTS. Other tools can consume `npm run context` or the generated continuation brief without a plugin.
- TASK is the active task checkpoint. STATUS is the project snapshot. Neither is a transcript. Refresh them during work, before compaction/switching agents, and before ending. `npm run context:check` checks structure, branch, base ancestry, links, client bridges, and size. It cannot prove that a human-written summary is accurate or fresh.
- `npm run handoff` writes `.data/handoff/CONTINUE.md`. It includes only curated startup docs and Git metadata; it does not read secrets, student data, shell history, or provider logs. Review curated notes before sharing with another service. No automatic cloud upload or agent-specific model choice.
- `node scripts/check-workflow.mjs` checks continuation failure cases and actual Next dotenv precedence in a disposable synthetic repository. It starts no tutor and makes no model calls. Initial lint exposed one unused test import, removed before final validation. Archived startup files are byte-identical to their pre-workflow versions.
- Groundtrack tools are absent in this task. Local config and simulated enrichment passed; live sign-in/hook approval are pending. No setup verification event was sent.
- Local start is `npm run dev:local` on 3105. Occupied ports fail without killing their owner. Cloud storage/Google config is blanked for this process, including dotenv values. Worktree-local `.data` must not point elsewhere. Existing old data remains preserved. This does not implement a general network sandbox.
- Next Fast Refresh can interrupt active audio. Never build in the active checkout or edit voice code during a live test. Earlier isolated builds failed when `.data` was linked outside their root before build. Prefer genuinely isolated test data; do not link the live data.

## Voice and pedagogy

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
