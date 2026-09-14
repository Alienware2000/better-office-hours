# Active task

Updated: 2026-09-14
State: complete
Branch: lane/post-hackathon-local
Base: e66a21fe69112120f01242db72942c91e7cbd25d

## Objective

Explain project memory to David in plain language and document a reproducible setup for future projects.

## Scope and constraints

Local documentation only. Preserve the running tutor, other checkouts, private data, and existing implementation. Publication freeze remains active. Do not turn the explanation into a new service or claim automatic conversation capture.

## Progress

- Archived the completed checkout-aware task at docs/archive/tasks/2026-09-14-checkout-aware-handoffs.md.
- Wrote docs/MEMORY_GUIDE.md with everyday prompts, command explanations, the file map, checkout examples, limits, and recovery steps.
- Wrote docs/MEMORY_RECIPE.md with a reusable setup request, starter templates, implementation adaptation points, and acceptance checks.
- Linked the guides from README, WORKFLOW, and current notes; they are retrieved on demand rather than included in the default brief.

## Decisions

The agent curates memory; scripts validate and assemble it. Document that distinction explicitly. Reuse the plain Markdown/Git pattern, adapting BOH-specific policies and installation namespaces in another project. Provide a setup recipe rather than claiming the current helper is a universal installer. No new dependencies or client configuration changes.

## Validation

Passed 31 local document-link checks, no-em-dash checks, byte-for-byte archive fidelity, default/full context budgets, and git diff --check. Command descriptions were checked against package.json and scripts/context.mjs. Implementation regression results remain in the prior task archive; no implementation changes or application tests in this documentation task. Reproduction is an adaptation recipe, not a claim that another real project was installed.

## Next action

Take David's next concrete request; archive this task before replacing it. For memory questions, use MEMORY_GUIDE. For another project's setup, follow MEMORY_RECIPE with its actual policies and an isolated installation namespace.

## Blockers

Groundtrack tools remain unavailable; the guides document its pending live verification and the functioning local fallback. No documentation blocker.
