# Active task

Updated: 2026-09-20
State: in_progress
Branch: lane/post-hackathon-local
Base: fd84303f7861e30f8103edf518b15a26b51c477f

## Objective

Improve live diagram/equation composition, then prepare an isolated app candidate for a complete learning session.

## Scope and constraints

Local edits/tests/commits; preserve existing runtimes, frozen contracts, graded boundaries and public pause. Groundtrack unavailable. No model, voice or provider changes; no fixture routing.

## Progress

Reproduced saved matrix and projectile equations splitting onto separate pages. New diagram-equation size and bounded lateral placement implemented in writing.ts/style.ts; composition, writing, math, diagram/motion and teaching checks pass, as do TypeScript and targeted lint. Saved matrix/projectile replays both change from two pages to one. Visual review pending.

## Decisions

Use a stable equation tier beside geometry, including motion; preserve standalone writing and compact symbols. Existing writing and ink are not reflowed. Panel page boundaries remain. Document prototype stays separate. No scientific correctness or latency improvement claim.

## Validation

Saved model specs replayed offline. Complete session and human acoustic evidence remain open. Follow [test plan](APP_TEST_PLAN.md).

## Next action

Verify saved cases, tall math, genuinely full pages and ink preservation; inspect compact/expanded output. Commit candidate and launch fresh isolated origin without replacing David’s sessions. Record exact runtime and checks.

## Blockers

Broad STEM correctness, image grounding, acoustic/iPad and continuous ink feedback remain unverified. Preserve current 3114/3115/3116 sessions.
