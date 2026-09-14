# Better Office Hours: agent instructions

## Current authority and safety

Better Office Hours is David and Hussein's voice-first tutor for Yale students. The repository is shared memory across agents and chats. This September 14 workflow replaces the [historical startup instructions](docs/archive/AGENTS-2026-09-13.md).

**Publication freeze:** the hackathon submission is complete, results pending, and all further work stays local until David explicitly lifts the freeze. Local edits, checks, and commits are allowed. Do not push branches/tags, create/update/merge PRs, deploy, or modify production data/configuration. Do not infer authorization from archived docs or claim contest eligibility. Use `lane/post-hackathon-local` or another explicitly local branch, never stale local main.

## Start or resume

1. Run `npm run context` for lean, read-only orientation, then read [STATUS](docs/STATUS.md) and [TASK](docs/TASK.md) as needed. From an older checkout without the npm command, run `~/.local/bin/boh-context` (installed on David's machine), or invoke a known current helper with `--repo /path/to/checkout`. Inspect readiness warnings, related local checkouts, commit relationships, and dirty work before continuing. Preserve unexpected edits. On compaction/resume, reread current files rather than trusting an older chat summary.
2. Read [WORKFLOW](docs/WORKFLOW.md) for local commands and handoff procedure when first entering the project. `AGENTS.md` is canonical; client-specific files only point here. A cached handoff from another checkout is evidence, not authority to switch/merge/reset or assume its code is present. Do not pick a task solely by recency. Separate clones are discoverable after checkpointing on this machine; no cross-machine discovery or automatic synchronization exists.
3. Before product changes, read the relevant sections of [DESIGN](docs/DESIGN.md), the product authority. Before code changes, read [ARCHITECTURE](docs/ARCHITECTURE.md), especially section 2 and the September 11 implementation/storage updates. Early sections describe historical targets; verify implementation in code.
4. Read human [PROMPT](docs/PROMPT.md) before tutor work. Read [PEDAGOGY](docs/PEDAGOGY.md) for tutor behavior, recap, board triggers, or timing. Both are frozen. David's later concept-teaching clarification in DESIGN allows requested ungraded equations/examples and conversational narrow clarifications.
5. Use [DEMO](docs/DEMO.md) and DESIGN section 10 for product scope, [NOTES](docs/NOTES.md) for current pitfalls, and [LANES](docs/LANES.md) for ownership/contracts. Historical pending PR states and deployment instructions do not grant current authority. Search [the history index](docs/archive/README.md) only when relevant; do not preload the archive.
6. Confirm the active task and next action, then continue authorized work. A review checkpoint blocks that task's next slice, not independent work David explicitly requests. If TASK is complete, use the new user request to define the next bounded task; do not invent roadmap authorization.

## Product boundaries

- Voice is the only tutor input. Keep the paper UI, compact toolbar, PDF desk, generated annotated diagrams, audio-timed animations, independent student ink authorship, and optional Canvas flow. No chat boxes or tutor-command menus.
- Never reveal final answers or complete solutions on graded work. Stop if a change could leak them. Ungraded concept teaching may give equations and worked examples; narrow clarifications need not become a quiz. Tutor notes are never evidence of a student's attempt or mastery.
- Visuals are composed per turn from a general spec. No hardcoded topic scenes or fixture selection in tutor behavior. The projectile scene is a renderer test fixture/fallback only. Keep unknown outcomes hidden at the relevant teaching step.
- Work within the assigned lane (ARCHITECTURE section 2). David owns voice, workspace, whiteboard; Hussein owns context, recap, shell. Stop and explain any required shared-contract change. Do not edit frozen `lib/types.ts`, human PROMPT, or PEDAGOGY. Coordinate shared integration changes; developer-workflow files are authorized by David's September 14 request.
- Features must be in DEMO or DESIGN section 10, or explicitly requested by David. Prefer reliable, small changes. After two honest failed attempts, record evidence in NOTES and move on to independent work.
- No em dashes in user-facing text or docs. Never commit secrets, provider responses containing private material, student exports, or uploaded PDFs. No automatic tool co-author attribution.

## Local development and validation

`npm ci`, then `npm run dev:local` (default localhost:3105). This launches the existing Next.js stack with cloud storage and Google auth disabled. Keep credentials in ignored `.env.local`; names are in `.env.example`. Groundtrack is engineering memory, not part of the tutor stack.

The local launcher uses this checkout's `.data`. Never link it to another worktree's data. Do not kill arbitrary Node processes or rebuild under a live user session. Inspect a listening process's cwd before stopping it. Preserve browser-origin IndexedDB saves and PDF bytes. Use another isolated checkout/data set for write-capable browser regressions and builds during live sessions. No production test targets. `npm run dev` is the raw launcher and lacks the local-only guard.

Implemented stack: Next.js/TypeScript, Tailwind, Motion, custom SVG/MathJax board, PDF.js, local Silero, ElevenLabs Scribe STT/conversational TTS, fast Grok routing and Grok reasoning. Scoped retrieval, optional Google identity, private cloud course/PDF adapters, and browser-local recap/sessions exist. Cloud session sync/learner memory do not. No tldraw or managed ElevenLabs conversation SDK migration.

Priority: voice cadence/interruption, accurate PDF cues, narrated visuals/student ink, real safe retrieval, useful recap. Run focused checks appropriate to the change; inspect rendered UI when changing it. Separate synthetic tests, real provider calls, and human acoustic evidence. Do not call a health endpoint proof of usable credits or end-to-end voice quality. Check scripts before running them because some consume credits or write storage.

## Checkpoint before stopping or changing chats

1. Update TASK at each meaningful result, failed approach, or user correction while context is fresh. Include objective, scope, decisions and why, progress, exact next action, relevant file paths, checks with results/evidence, and blockers. Record unfinished work honestly.
2. Update STATUS's live snapshot and NOTES's durable pitfalls. Keep TASK below 6,000 characters, other startup files below 10,500, and the default brief below 12,000. The optional full reference packet is capped at 28,000. Before replacing a completed TASK, archive it under `docs/archive/tasks/` with a date/name and add an index link. Never archive away active constraints or load every archived task by default.
3. Run `npm run context:check` and relevant implementation checks. Commit only intended files locally, in small slices. Do not push during the freeze.
4. Run `npm run handoff` after the commit (or explicitly recorded WIP). It writes ignored `.data/handoff/CONTINUE.md` and a small machine-local task checkpoint indexed by sanitized repository identity and checkout. It does not copy code, private data, or chat history. If the helper implementation changed, run `npm run context -- --install` to refresh the installed standalone copy and checkpoint. Tell the next agent to run orientation again and obey the current TASK state. An unavailable helper on another machine requires explicit setup or a transferred brief, never an invented successful lookup.

If Groundtrack tools are unavailable, use local docs and record the pending connection without blocking work. Never invent event/retrieval ids or upload private student data. Repository constraints remain authoritative.

<!-- groundtrack:start version=3 -->

## Groundtrack

Use Groundtrack as the shared engineering memory for this repository.

- Before non-trivial investigation or implementation where prior decisions, failures, or constraints could matter, call `search_experiences`. Start with a focused description of the work, then inspect the results and search one or two materially different adjacent concepts when related components, constraints, failure modes, or prior decisions could change the approach. Do not stop merely because the first search has no exact match; try a meaningfully broader or neighboring query. Keep this expansion bounded, and also search before repeating an approach that may already have been tried.
- When a relevant experience needs more context or verification, call `get_experience_events` with its id to inspect the underlying raw evidence and provenance.
- Apply relevant current experiences and heed any caveats that an experience was contradicted, superseded, or expired.
- Once the effect of a search is known, call `report_experience_use` with its retrieval id. Report when a result changed the approach or avoided a failure, and report `not_helpful` when none applied.
- After a task reaches a concrete result, call `record_outcome` with a short title, a concise summary, and the retrieval ids for searches that contributed. Include measurements only for sourced, quantified impact on time, cost, reliability, quality, performance, or throughput; tests, typechecks, lint, and builds are validation rather than impact. Include avoided work only when it was explicitly estimated, and never infer unknown values.
- After a non-obvious discovery, decision, workaround, correction, or failed approach that would help a future agent, call `store_event` promptly with a concise title and an explanation of what happened and why it matters.
- Do not store routine implementation details, obvious facts, unrestricted transcripts, or secrets.
- Keep the raw-event ids returned by `store_event`. When the related work lands in a commit or pull request, call `link_outcomes` with those ids and the explicit commit SHA and/or pull-request number. Never infer an outcome from worktree HEAD.

<!-- groundtrack:end -->
