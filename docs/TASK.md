# Active task

Updated: 2026-09-14
State: complete
Branch: lane/post-hackathon-local
Base: 0d345a126050f969f662ea7259f93b2087f538a4

## Objective

David asked to continue building locally, close the old stack, start this checkout, and make it easy to switch coding agents or fresh chats without losing the working context.

## Scope and constraints

This slice covers local developer setup, shared agent instructions, compact checkpoint documents, and a portable continuation command. Preserve app behavior, prior worktrees, old browser saves and data. Publication freeze remains in force. No pushes, PR changes, deployments, production writes, provider migration, paid benchmarks, or edits to lib/types.ts or human PROMPT/PEDAGOGY.

## Progress

- Installed current lockfile dependencies. No old BOH listener existed; unrelated Adventure World services were left alone.
- Started this worktree on localhost:3105 with local data and private provider keys. Production storage and OAuth settings are disabled in the local launcher; signing secrets are newly generated.
- Root/health HTTP 200 and tutor start screen verified. Health reports provider key presence, not credential validity/credits or acoustic quality.
- Preserved the previous STATUS, NOTES, and AGENTS verbatim in docs/archive. Replaced the live summaries with compact current state, preserved Groundtrack policy, and added Claude/Cursor bridges to canonical AGENTS.md.
- Added context/check/handoff commands and a local-only dev entry point. Setup validation passed. The tutor is left running and visible; publication remains frozen.

## Decisions

- Use repository Markdown and a dependency-free Node script as the portable core. A client plugin or paid memory service is not required to resume work.
- Keep project state, active task, durable pitfalls, and historical evidence in separate documents. Load old history by search only. Summaries must be updated by the working agent; the exporter does not hallucinate missing context.
- TASK Base records the starting commit, not a constantly rewritten self-referential HEAD. The generator verifies ancestry and includes the actual HEAD/dirty state every run.
- Track only a thin CLAUDE.md import; keep private Claude overrides ignored. This replaces the old rule that ignored every CLAUDE.md, as part of David's agent-portability request.
- Start on port 3105 with separate storage. No automatic origin/session migration. Existing xAI/ElevenLabs settings were copied locally by name allowlist; no production credentials were copied.

## Validation

- PASS: npm ci; root and health GET; visible initial UI with voice inactive.
- PASS: context integrity and size checks; offline disposable-repository checks for dirty work, wrong branch/base, missing next action, oversized context, broken links, private data exclusion, and symlink output protection (including dangling links).
- PASS: actual local launcher against a synthetic dev task using Next's dotenv loader, proving cloud/OAuth overrides beat inherited and file settings; occupied-port owner preservation; external-data-link rejection.
- PASS: focused ESLint for the three workflow scripts, git diff whitespace check, byte-identical historical archives, ignored credentials, unchanged lib/types.ts and human PROMPT/PEDAGOGY.
- No human microphone, paid inference, or current full-app production build claimed. Runtime product code is unchanged.

## Next action

This setup slice is complete. David can use the local desk and describe the next concrete product issue. On his next request, replace this task with that bounded slice and set Base to the new starting commit. Recommended product work is cadence and visual-correctness evaluation; no broad provider/auth rewrite has been selected. Do not restart the setup or reload an active voice session unnecessarily.

Key files: scripts/context.mjs, scripts/dev-local.mjs, AGENTS.md, docs/WORKFLOW.md, docs/STATUS.md, docs/NOTES.md, and client bridge files. Local URL: http://localhost:3105.

## Blockers

Groundtrack tools are not loaded in this task. Sign-in, hook approval, and the prescribed single verification event remain pending. This does not block the local workflow. No other setup blocker is known.
