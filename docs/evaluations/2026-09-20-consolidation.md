# Local consolidation review

September 20, 2026. Starting source revision: `6b665d0936b69e566487ba7238622f63a0a6526f`. Integration base is fetched `origin/main` at `1b8c7c2`, already merged into the development branch. The local `main` branch remains stale. This is a local integration packet, not a release or a remote backup.

Implementation committed locally at `121aa59`. Its source/profile hashes match the passing offline report below, which was generated before the commit. Documentation changes do not enter the code fingerprint.

## Explicit configuration

`lib/agent/trial.ts` now exports one `TRIAL_PROFILE`: `opus-low-v1`, OpenRouter model `anthropic/claude-opus-5`, low effort, 8,000 maximum tokens, 60-second provider timeout, no SDK retries, latency-sorted provider selection with required parameter support and no provider fallback. These are the existing candidate values, consolidated without changing behavior. The guarded continuation is separate from SDK retries and remains bounded to one recovery request.

`lib/agent/grok.ts` uses the profile for both initial and recovery requests. Ordinary configuration remains Grok routing/reasoning. The trial requires the development environment, the explicit server trial flag, and absence of Vercel. No production model switch was made.

Future snapshots written by `scripts/trial-tutor.mjs` include source commit, dirty state, source SHA256, and profile-source SHA256 in their ignored `latest.json`. The fingerprint covers app/lib/components/scripts/public and package/Next/TypeScript configuration, including uncommitted source. It excludes environment files, sessions, and uploads. It is engineering provenance, not a dependency binary hash or full reproducible-build guarantee. The preserved 3110 snapshot predates these metadata fields and was not recreated.

## Accumulated change groups

| Group | Relevant files | Integration assessment |
| --- | --- | --- |
| Workflow and evaluation | AGENTS/client bridges, context/local launchers, model benchmark/review scripts, docs | Tooling is separate from tutor runtime. Private evaluation records and session material stay ignored. No automatic sync, publication, or provider selection. |
| General speech reliability | voice/useVoiceLoop, saved-sessions diagnostics, LLM route error codes | Accepted audio drains after late generation errors; explicit cancellation still wins. Records first playback and playback endings. Offline checks cover lifecycle ordering, not heard completeness. |
| General renderer changes | BoardDrawing/BoardText, geometry/layout/writing/store/math | Changes apply outside the trial too. Ordered writing, label layout, state refresh, and ink checks pass; semantic diagram quality still needs human review. |
| Trial behavior | agent/trial, grok, concept-stream/response, TrialStatus, client trial flag | Provider, per-beat validation/continuation, direct deep routing, and presentation rules remain experimental. Do not turn on a development flag in production as a shortcut to promotion. |
| Shared contract additions already present | lib/types Color, PanelCommand, optional line label | Additive fields/union cases match the documented September 14 local-trial exception. No storage-version bump or removal of an existing operation. Review with the other lane before broader integration; consumers with exhaustive handling may still need consideration. No new shared type changes in this consolidation. |

The accumulated branch is interdependent. Review behavior against origin/main rather than cherry-picking solely by commit names. No context/recap API, auth requirement, storage migration, or public configuration was changed in this step.

## Repeatable offline gate

```sh
node scripts/check-candidate.mjs
```

Runs 16 existing/focused checks in separate Node processes: candidate gating, concept streaming/recovery, teaching intent/panels, voice lifecycle/deadlines, saved-session serialization, workspace transitions, board refresh/writing, diagrams/motion/math/ink, and teaching repair. The runner resets trial flags for a reproducible default; tests explicitly activate the candidate when needed. A preload rejects unmocked Node fetch/HTTP/socket requests. This is a guard for these tests, not a general OS network sandbox.

Reports go to ignored `.data/evaluation/consolidation/offline-*.json` with source/profile hashes and explicit untested categories. The adapter regression asserts that initial and recovery requests use the same pinned model/effort/budget/provider settings.

The first run found an outdated saved-session route mock, now updated for LessonValidationError. It also exposed that check-anim mixes pure checks with a live localhost generation request; that check is excluded from the offline runner. The attempted local connection was refused. No live provider evaluation was performed. A targeted lint error in the new CommonJS preload was corrected before completion.

Final validation: all 16 checks passed in `.data/evaluation/consolidation/offline-1789888632911.json`; TypeScript and targeted ESLint passed. `npm run build -- --webpack` passed in a temporary source copy with separate build/storage, no copied credentials, and no live-session writes. ONNX Runtime emitted dynamic-require dependency warnings. Log: `.data/evaluation/consolidation/build-2026-09-20.log`. The temporary copy was removed after the build. Context validation and whitespace checks pass. These results do not establish human acoustic quality or provider availability.

## Promotion status

The current source and preserved 3110 candidate are distinct versions. No hot reload/restart, main merge, push, PR, deployment, or public reopening occurred. The [33-session transcript review](2026-09-20-session-review.md) informs the improvement backlog but does not close these remaining release checks:

- Browser save/reopen with synthetic PDF/ink and a verified recovery export in an isolated origin.
- Human listening through complete responses, interruptions, and resumes, with actual timing/cost evidence.
- Visual replay of key narration disagreements, clutter, and motion semantics.
- Shared-contract/integration review and an explicit choice about which trial behavior becomes default.

The next product slice is prose/math typography and scene composition. Keep this candidate fixed as the comparison point; preserve first-useful-response latency and speech completion while improving visual quality. Publication and reopening remain separate decisions.
