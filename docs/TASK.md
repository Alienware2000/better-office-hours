# Active task

Updated: 2026-09-20
State: ready_for_review
Branch: lane/post-hackathon-local
Base: d68cd607a64bad917c9e001675a6677e4457056b

## Objective

Consolidate product/candidate/evaluation and study saved transcripts before board improvements.

## Scope and constraints

David authorized consolidation and session review after the hackathon win. Work local; Vercel paused. Preserve live origins/PDFs: no verified recovery backup. Frozen contracts/prompts and graded boundaries remain. Groundtrack unavailable.

## Progress

[DEVELOPMENT](DEVELOPMENT.md) indexes decisions; [integration packet](evaluations/2026-09-20-consolidation.md) classifies changes and release gaps. Origin/main's README update merged locally; local main stale.

TRIAL_PROFILE pins existing Opus-low settings for initial/recovery requests. Future snapshots carry source/profile fingerprints. `node scripts/check-candidate.mjs` runs 16 offline checks with unmocked Node network calls blocked. No model promotion or live restart.

[Review](evaluations/2026-09-20-session-review.md): read all 33 transcripts found in checked Chrome/IAB histories. Private study guide: `.data/session-review/2026-09-20-review.md`. Tab selections restored. Raw sessions remain browser-local; timed visual/audio review incomplete.

## Decisions

Keep candidate fixed. Next product slice: prose/math and composition. Review found deferred equations, repeated questions, visibility disagreements, background speech, and successful misconception-focused animation. No model ranking from historical sessions. Jev deferred; 3110 unchanged.

## Validation

16 offline checks, typecheck, targeted lint, isolated build pass; ONNX dependency warnings. Fixed stale session-test mock; excluded check-anim's live request. Evidence in integration packet. No live provider calls. Context/whitespace checks pass.

## Next action

Review the study guide with David, then typography/composition per board-feedback while preserving latency and speech completion. Archive this TASK before replacing it. Release still needs browser save/reopen/PDF checks, human listening/timing, visual replay, and shared-contract review. Do not promote by flipping a dev flag.

## Blockers

Local commits are not remote backup. Historical audio/rejected payloads unavailable. Private guide is not a session export. Public reopening not authorized.
