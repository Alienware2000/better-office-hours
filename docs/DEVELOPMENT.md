# Development baseline and promotion

Updated September 20, 2026. David reports BOH won the hackathon. He requested consolidation before further board work. The contest hold is retired; the public Vercel pause remains. This document is the small index of what belongs where, not another transcript or complete history.

## One repository, three uses

| Use | Current truth | How it advances |
| --- | --- | --- |
| Product baseline | GitHub `origin/main`, fetched at `1b8c7c2`. Default source uses Grok routing/reasoning. Public deployment is separately paused. | Reviewed integration and deliberate release. A merge is not evidence of a deployment. |
| Development candidate | This checkout, `lane/post-hackathon-local`; current manual test is isolated localhost:3110. OpenRouter Opus-low and protected structured lessons are trial-gated. | Small committed changes with checks and human review. Do not modify a live snapshot underneath a session. |
| Evaluation | `scripts/bench-tutor-models.mjs`, `scripts/evaluation/`, `scripts/review-tutor-models.mjs`; dashboard conventionally 3106. | Synthetic comparisons and saved human judgments, independent of the default tutor configuration. |

These are uses of the same codebase, not three products or separate permanent repositories. Evaluations should reuse the real parser/renderer. Evaluation fixtures must never select a student's runtime scene. Provider switching belongs in explicit configuration, not in duplicated app implementations.

`npm run dev:local` starts the normal configuration on 3105. `npm run trial:tutor -- --port 3110` created the current candidate snapshot; do not rerun against an occupied port. `npm run review:tutor` starts the separate evaluation dashboard. Commands are documented in WORKFLOW, TUTOR_TRIAL, and TUTOR_REVIEW. A port is an address, not a version: record the source revision, configuration, and snapshot path.

## Audit at the start of consolidation

- Source was clean at `b5cb137`, with 28 local commits absent from fetched origin/main. They span workflow, evaluation infrastructure, shared renderer changes, and trial-only behavior. Saved locally does not mean backed up on GitHub.
- Remote main had one new commit, `1b8c7c2`, changing the demo-video README link. That commit was merged into this development branch locally, retaining our memory-guide link. Neither local main nor remote main was changed. Local main (`f4853db`) is stale and must not be used as the integration base.
- The test candidate is `.data/voice-trial-3110/run-1789879799663`. David reports that it works well, with inconsistent/crowded diagrams. It is not the normal/default app configuration and has not been promoted.
- Trial gating is in `lib/agent/trial.ts`, `lib/agent/grok.ts`, and voice-loop configuration. Production cannot activate this trial merely from a request flag. Promotion requires an explicit configuration design, not enabling the development-only flag in production.
- Some experimental support already changes shared renderer/type files even when the trial is off. Review the diff against origin/main by behavior, not only by filename or commit title. Existing additions to frozen `lib/types.ts` include panels, literal colors, and line labels; their integration needs shared-contract review. Do not expand that contract during consolidation.

## Decision register

| Decision | Status and evidence |
| --- | --- |
| Preserve accepted speech after late errors | Implemented `1185aec`; offline lifecycle checks. Keep interruption/barge-in. |
| Numeric TeX guards and one bounded continuation | Implemented `b1ccabd`; [guard evidence](evaluations/2026-09-18-guard-recovery.md). Trial-specific continuation, not a blanket relaxation. |
| Current-board focus validation | Implemented `3584f41`; [reproduction](evaluations/2026-09-20-drawing-focus.md). Historical cutoff cause remains unproven. |
| Opus-low through OpenRouter | Candidate, not permanent model winner. 3110 human feedback is positive; cost, broader quality, and end-to-end latency remain evaluation criteria. |
| Board typography/composition | Next product slice after consolidation; [feedback](evaluations/2026-09-20-board-feedback.md). Not implemented yet. |
| Jev and broader renderer redesign | Deferred; [Jev research](JEV_RESEARCH.md), [board research](WHITEBOARD_RESEARCH.md). Research is not an integration decision. |
| Public reopening | Deferred until David requests it and a release candidate is ready. Hackathon win does not reopen access. |

## Promotion checklist

1. Review the accumulated diff in three groups: workflow/evaluation tooling, general reliability fixes, and experimental provider/presentation behavior. Retain dependencies; do not blindly cherry-pick interdependent commits.
2. Keep one candidate configuration fixed while testing. Record revision, model/provider/effort, inputs, and applicable tests. Separate offline mocks, real provider results, rendered inspection, and human listening evidence. Synthetic readiness clocks do not prove time to first audible teaching.
3. Exercise concept explanation, PDF-guided teaching, follow-up to existing board content, interruption/resume, and saving/reopening in an isolated synthetic session. Check complete speech, valid visuals, graded-work boundaries, and absence of new regressions. Measure first useful audible response and cost where observable; record unknowns instead of inventing acceptance thresholds.
4. Produce a reviewable integration change against current origin/main, describing exactly which behavior becomes default and which remains experimental. Coordinate shared contracts with the other lane. No automatic promotion based on one good model response or one green unit test.
5. After authorization, integrate the reviewed change and verify the resulting revision. Deployment and public reopening are separate actions. Preserve a rollback revision and student storage compatibility.

September 20 consolidation: candidate settings now live in one pinned profile, future trial snapshots carry source/profile fingerprints, and `node scripts/check-candidate.mjs` runs 16 offline checks. All pass, along with TypeScript, targeted lint, and an isolated production build (ONNX dependency warnings). See the [integration packet](evaluations/2026-09-20-consolidation.md) for change groups and remaining browser/acoustic/shared-contract checks. No product promotion, release, or remote backup occurred.

The [saved-session review](evaluations/2026-09-20-session-review.md) covers all 33 transcripts found across the checked histories. Private study notes are in `.data/session-review/2026-09-20-review.md`. Typography/composition remains the next product slice; no new model selection or broad board rewrite is needed to start it.

## Where progress lives

- Git commits: exact code and documentation history, currently local additions.
- `docs/TASK.md`: active objective and exact next step.
- `docs/STATUS.md`: current baseline, runtime, and authority.
- `docs/evaluations/`: concise evidence and limitations. `docs/archive/`: older handoffs.
- Ignored `.data/evaluation/`: raw local results and ratings; not a Git backup.
- `.data/handoff/CONTINUE.md` and the machine-local index: fresh-chat reorientation, not code/session synchronization.

Update this register when a candidate is promoted or a decision changes. Keep detailed evidence in linked reports. Groundtrack remains unavailable; local docs are the current engineering memory. Credentials, private transcripts, uploads, and student exports never belong in committed evaluation records.
