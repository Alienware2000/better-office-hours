# Active task

Updated: 2026-10-08
State: ready_for_review
Branch: lane/post-hackathon-local
Base: b8e9a2579053e5182b0ec65631a14a898afb01f8

## Objective

Prepare a reviewed main-integration plan, then lightly refresh the README around the continuing product.

## Scope and constraints

David requested relevant changes on main, identified undecided work, and asked to plan first. This checkpoint prepares publication scope; no push, PR, main merge or deployment has occurred. Preserve frozen files, graded boundaries, student data and the public pause. Groundtrack remains unavailable.

## Progress

Fetched origin/main at 3163d7ffea5ff820247403298546993295c70298. It has one remote-only README demo-link commit; HEAD b8e9a25 has 66 local-only commits. Merge-tree simulation is conflict-free. Local main is stale. Current integration plan is in DEVELOPMENT's October 8 section.

Verified public demo HTTP 503 / DEPLOYMENT_PAUSED. Identified 3116 listener cwd as its retained .data snapshot, not current source. No runtime was restarted.

## Decisions

Recommend accumulated integration with Grok as default and Opus remaining development-gated; save prototype/evaluation work without claiming it is integrated. Review existing panel/color/line-label shared-contract additions before merging. PR #11 remains unreconciled, outside this integration. Preserve remote LinkedIn demo link and hosted app URL during README cleanup; describe the hackathon as origin rather than current product scope.

Prior representation work is not complete: general guidance, matrix divider rendering and writing scale are committed, but timing/teaching results remain mixed. Preserve one meaningful operation plus its explanation, matrices, student ink and disclosure bounds. See [evidence](evaluations/2026-09-20-representation.md) and [prior checkpoint](archive/tasks/2026-09-20-representation.md).

## Validation

Isolated credential-free clone of b8e9a25: all 18 offline candidate checks pass. Next route type generation then TypeScript pass. Full lint fails with five react-hooks/refs errors in PdfViewer.tsx and one no-assign-module-variable in scripts/check-integration.mjs; both files are unchanged from fetched main. No build, real-provider, browser recovery or acoustic check was performed this turn. Test clone: /var/folders/pv/g5wp8n9d0ks14g87hdyh6vyh0000gn/T/boh-main-review-ccfcbp54. Raw synthetic gate report stays in its ignored .data/evaluation/consolidation/.

## Next action

Review the integration plan with David. Prepare the merge candidate from fresh origin/main, preserve its README change, resolve existing lint errors, review contract consumers, then run an isolated build and synthetic multi-turn PDF/ink/recovery checks. Present the concrete publication diff before merging/pushing. After integration, apply the light README cleanup. Model promotion and public reopening remain separate decisions.

## Blockers

Six existing lint errors, shared-contract review and browser/acoustic release evidence remain. Opus/model promotion is undecided but need not block merging development-gated code. Prior 3117 source 19a3681 is only a historical record, not freshly verified. No broad STEM reliability or learning-effectiveness claim.
