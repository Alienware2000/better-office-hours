# Active task

Updated: 2026-10-09
State: complete
Branch: lane/post-hackathon-local
Base: b8e9a2579053e5182b0ec65631a14a898afb01f8

## Objective

Integrate relevant accumulated work toward main, promote David's chosen Opus tutor, and lightly refresh README around the continuing product.

## Scope and constraints

David explicitly approved publishing all reviewed accumulated changes to main except PR #11. The publication step is complete. Public reopening/deployment remains unauthorized. Frozen contracts/human policy, graded boundaries, student data and existing runtime saves were preserved. Groundtrack tools unavailable.

## Progress

Published the development branch and merged [PR #15](https://github.com/Alienware2000/better-office-hours/pull/15) at fe59fa6503b453a5929af98ac147cdf9d61bb6ef. GitHub main contains candidate db98c97 and all its accumulated dependencies. PR #11 stays OPEN; its commit c1a69d8 is not an ancestor of main. origin/main was fetched after merge and this development branch fast-forwarded to it. The branch named local main is still stale; GitHub origin/main is authoritative.

Implementation 830980a uses pinned Opus 5 through OpenRouter for normal routing, teaching, repair and recap, with explicit Grok rollback and no missing-key fallback. README refreshed, demo links retained, existing shared-contract consumers reviewed, six lint errors fixed. Authored galleries remain prototypes. The [integration packet](evaluations/2026-10-09-main-integration.md) records scope, tests and limits. Candidate disables git-triggered Vercel deployment to preserve the pause.

The old 3116 runtime remains untouched. Tested localhost:3120 runs in isolated /var/folders/pv/g5wp8n9d0ks14g87hdyh6vyh0000gn/T/boh-opus-review-0n3fmnbl with separate synthetic data. No live snapshot or browser-origin saves were migrated or restarted during publication.

## Decisions

Opus is the local default by explicit user choice, not a proven universal model winner. The authored STEM gallery/document layout remain prototypes; generated matrix/diagram/animation and student ink are live. Board design is not signed off as complete. Persistence is browser-local recovery plus separate PDF storage, not cross-device sync or lasting learner memory.

A live graded test leaked the correct answer as a "guess" despite refusing it as a final answer. Tightened presentation guidance to prohibit candidate substitutions and completed arithmetic on no-attempt graded work. Two fresh equation/chemistry checks passed. Prompt mitigation does not guarantee semantic safety. No topic-specific runtime fixtures added.

## Validation

All 18 offline candidate checks, full lint, integration smoke and isolated default production build/TypeScript pass. Production Opus adapter regression covers routing/course selection/teaching/repair/closing/recap grounding, no temperature, missing key and Grok rollback. Browser matrix rendering and board/PDF ink, zoom, undo/redo and reload recovery pass. Real synthetic ElevenLabs TTS and STT return HTTP 200. Live biology, closing and recap pass parsing. Evidence and clock limitations are in the integration packet. Speech length exceeded the requested ceiling. No human acoustic test or full end-to-end latency measurement.

## Next action

This integration task is complete. Archive this TASK before defining the next bounded user-requested slice. Reorient first. Product release work remains: human microphone/listening/interruption checks, useful-response timing, broader graded adversarial tests and STEM diagram quality. PR #11 requires a separate reconciliation decision; do not merge it automatically. Public reopening remains separate.

## Blockers

No remaining blocker to the completed main integration. Public deployment is intentionally paused. Broad STEM semantics, speech length, acoustic quality and end-to-end latency remain unverified release concerns, not claims of readiness.
