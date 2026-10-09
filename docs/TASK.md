# Active task

Updated: 2026-10-09
State: ready_for_review
Branch: lane/post-hackathon-local
Base: b8e9a2579053e5182b0ec65631a14a898afb01f8

## Objective

Integrate relevant accumulated work toward main, promote David's chosen Opus tutor, and lightly refresh README around the continuing product.

## Scope and constraints

David accepted the integration plan and chose Opus because Grok felt slow. All implementation, tests and commits are local. No push, PR, main merge, deployment or public reopening occurred. AGENTS requires a concrete reviewed publication step. Preserve frozen contracts/human policy, graded boundaries, student data and the public pause. Groundtrack tools unavailable.

## Progress

Fetched origin/main 3163d7ffea5ff820247403298546993295c70298 and merged locally at d0d4d31. Remote LinkedIn demo link retained; local main remains stale. The accumulated interdependent candidate and technical review are in [integration packet](evaluations/2026-10-09-main-integration.md). PR #11 remains separate.

Implementation commit 830980a: normal routing, teaching, visual repair and recap now use pinned Opus 5 through OpenRouter. Explicit BOH_TUTOR_PROVIDER=grok restores previous xAI routes; missing credentials fail without fallback. Course selection and student-first recap remain. Existing panel/color/line-label consumers reviewed without expanding lib/types.ts. README cleaned up, public links retained, prototype limits explicit. Fixed six existing lint errors; ignored generated/runtime directories in lint. Candidate disables git-triggered Vercel deployment to preserve the pause.

Old 3116 listener verified in its retained .data snapshot and left untouched. Isolated review app is localhost:3120 in /var/folders/pv/g5wp8n9d0ks14g87hdyh6vyh0000gn/T/boh-opus-review-0n3fmnbl with separate data. Its browser uses only synthetic material.

## Decisions

Opus is the local default by explicit user choice, not a proven universal model winner. The authored STEM gallery/document layout remain prototypes; generated matrix/diagram/animation and student ink are live. Board design is not signed off as complete. Persistence is browser-local recovery plus separate PDF storage, not cross-device sync or lasting learner memory.

A live graded test leaked the correct answer as a "guess" despite refusing it as a final answer. Tightened presentation guidance to prohibit candidate substitutions and completed arithmetic on no-attempt graded work. Two fresh equation/chemistry checks passed. Prompt mitigation does not guarantee semantic safety. No topic-specific runtime fixtures added.

## Validation

All 18 offline candidate checks, full lint, integration smoke and isolated default production build/TypeScript pass. Production Opus adapter regression covers routing/course selection/teaching/repair/closing/recap grounding, no temperature, missing key and Grok rollback. Browser matrix rendering and board/PDF ink, zoom, undo/redo and reload recovery pass. Real synthetic ElevenLabs TTS and STT return HTTP 200. Live biology, closing and recap pass parsing. Evidence and clock limitations are in the integration packet. Speech length exceeded the requested ceiling. No human acoustic test or full end-to-end latency measurement.

## Next action

Present committed candidate and integration packet for David's publication review. After authorization, fetch main again, inspect any new diff, push the reviewed branch and create/attach a PR or merge by the agreed path. Preserve deployment pause and rollback origin/main 3163d7f. Before release, run human acoustic/interruption checks and broader graded/STEM evaluation. Reorient before changing any old live snapshot.

## Blockers

Main publication awaits concrete review under AGENTS. Public reopening has no authorization. Broad STEM semantics, speech length, acoustic quality and end-to-end latency remain unverified. Prior 3117 source 19a3681 is historical evidence, not freshly verified. No broad reliability/learning-effectiveness claim.
