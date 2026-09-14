# Active task

Updated: 2026-09-14
State: complete
Branch: lane/post-hackathon-local
Base: 75412c16864bbc2988e45e2b1a411c4727ccb13f

## Objective

Make reorientation work across different local checkouts and fresh chats while keeping active context lean. David wants the agent to handle this without making him manage files or worktrees.

## Scope and constraints

Local developer workflow only. Preserve other checkouts, uncommitted work, tutor data, running sessions, frozen contracts, and human prompts. No GitHub/production writes, pushes, automatic branch switches, merges, or provider calls. Keep a simple dependency-free CLI and plain Markdown, not a background service.

## Progress

- Archived the completed setup task at docs/archive/tasks/2026-09-14-portable-workflow.md.
- Confirmed the original command stops on branch mismatch and has no shared index for separate clones.
- Implemented checkout discovery, a standalone installed helper, and a lean default brief with full details on demand.
- Installed the helper outside the checkout and verified read-only orientation in the actual older b640 checkout. Added workflow instructions and isolated regression checks.

## Decisions

- Git worktrees are discovered automatically; separate clones are remembered when explicitly checkpointed/registered. Repository identity comes from the sanitized origin, or common Git directory when no origin exists. No disk-wide search or cloud synchronization.
- Local index stores curated task checkpoints and source commit/dirty metadata. It is evidence, not new authorization. Read actual checkout status and compare commit ancestry before advising where to continue; never select a task just because its timestamp is newest.
- Default orientation should work even when TASK or the matching branch is absent. Strict validation still blocks writing a misleading checkpoint.
- Install a standalone helper outside checkouts so older branches or removed source checkouts do not remove the entry point. Do not change shell profiles or other coding-agent configuration.

## Validation

Passed both offline workflow suites: sibling worktrees, separate clones, repository isolation, absent commits, dirty/moved sources, old-checkout discovery, installed helper survival, strict validation, private-data exclusion, and no-mutation checks. Local launcher guards also pass. ESLint for all three changed scripts and git diff --check pass. Default and full context fit their budgets. Actual old-checkout orientation succeeds without modifying it. No tutor source changes, model calls, or production writes.

## Next action

Use David's next concrete tutor issue to create the next task. Archive this completed TASK before replacing it. In a fresh chat, run npm run context or the installed ~/.local/bin/boh-context from the current checkout, inspect relevant source checkpoints, and reconcile available code before implementation.

## Blockers

Groundtrack tools remain unavailable. Cross-machine discovery requires transferred commits or an explicitly shared checkpoint; the local registry cannot discover another computer. No other blocker.
