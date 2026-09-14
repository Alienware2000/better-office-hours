# Reproduce this memory workflow in another project

This recipe describes the file-based pattern used in Better Office Hours. It is a reproducible setup specification with starter text, not a published package or universal installer. The reference implementation contains BOH-specific policies and names that must be adapted. For an explanation of everyday use, read [MEMORY_GUIDE](MEMORY_GUIDE.md).

## Give a future agent this request

Copy this text into the new project's coding agent and supply this recipe plus the referenced source files. If both projects are on the same machine, point the agent at this folder. Otherwise transfer those files explicitly; the prompt alone does not contain the implementation.

```text
Set up a lean, model-agnostic project memory workflow using the supplied
MEMORY_RECIPE.md and reference helper. Inspect this project's existing
instructions and package scripts first. Merge the workflow into them;
preserve existing rules and files.

Use shared Markdown for stable instructions, current project status,
one active task, durable lessons, and dated task archives. Implement
read-only context, strict validation, and an explicit handoff command.
Support sibling worktrees and locally registered independent clones.
Keep active context bounded, retrieve archives only when relevant,
and verify actual code before resuming another checkout's task.

Adapt the reference helper's project name, policies, local paths,
executable name, environment override, and client checks for this project.
Use a unique installation namespace so it cannot overwrite another
project's helper. Do not copy BOH's publication policy or app launcher.
No background service, AI summarization dependency, automatic Git actions,
cloud sync, or transcript collection is needed.

Write a human guide with start/pause prompts. Validate in disposable local
Git repositories, including an old worktree and an independent clone.
Show me how to resume a fresh chat and report any remaining limitations.
Keep setup local; do not push, publish, or deploy as part of this request.
```

## 1. Start with the notebook

Keep this structure, adapting paths if the project already has equivalent files:

```text
AGENTS.md
docs/
  STATUS.md
  TASK.md
  NOTES.md
  WORKFLOW.md
  archive/
    README.md
    tasks/
scripts/
  context.mjs
```

Merge into an existing AGENTS.md. Do not replace its product rules with generic ones. Keep the detailed guide outside the default startup packet.

Use this policy as a starting point:

```markdown
## Project memory

At startup or resume, run the context command. Read the shared rules,
current task, and relevant project status. Verify branch, commit,
uncommitted work, and any relevant source checkout before implementation.
Read detailed design documents or archived tasks only when needed.

During meaningful progress, update TASK with results, decisions and why,
checks, unfinished work, and the exact next action. Before stopping,
update STATUS and durable NOTES where needed, validate the checkpoint,
and run the handoff command. Commit only when authorized by project policy.

Before replacing a completed task, archive its page with a date/name
and add an index link. Keep active constraints in current files.
Never treat old notes as permission to publish, overwrite work, or change
scope. A saved checkpoint does not prove its code is present here.
```

## 2. Create the first current pages

For STATUS, write the actual project state and its authority explicitly:

```markdown
# Current status

Updated: YYYY-MM-DD

## Authority

Describe this project's current scope, permissions, and constraints.

## Current state

What actually works, current runtime information, and relevant blockers.

## Next

Point to TASK.md and the next authorized work.
```

For TASK, replace every placeholder with real values. Obtain Branch with `git branch --show-current` and Base with `git rev-parse HEAD` in the intended checkout. A new repository needs an initial commit first, under its normal commit policy. A detached checkout can be oriented but needs an intended task branch before writing a strict checkpoint in the reference design.

```markdown
# Active task

Updated: YYYY-MM-DD
State: in_progress
Branch: actual-branch-name
Base: actual-full-40-character-starting-commit

## Objective

One concrete outcome requested by the user.

## Scope and constraints

Boundaries, relevant permissions, and what must be preserved.

## Progress

What is already done, or "Not started."

## Decisions

Choices and reasons, or "None yet."

## Validation

Exact checks and results, or "Not run yet."

## Next action

The next concrete step another agent should take.

## Blockers

What prevents progress, or "None."
```

Keep Base as the starting revision of the task. Do not update it after every commit. Allowed states in the reference helper are `in_progress`, `blocked`, `ready_for_review`, and `complete`. Ending a chat does not make unfinished work complete.

NOTES can begin with a title, update date, and "No durable lessons recorded yet." The archive index can begin with a sentence identifying historical records as evidence, plus links as tasks finish. Archive names should be unique, for example `2026-09-14-checkout-discovery.md`.

## 3. Adapt the command implementation

Use [scripts/context.mjs](../scripts/context.mjs) as the reference. It uses Node's built-in modules and invokes local Git commands. Read [scripts/check-context-checkouts.mjs](../scripts/check-context-checkouts.mjs) for portable behavior checks and the context-related cases in [scripts/check-workflow.mjs](../scripts/check-workflow.mjs). The latter also tests BOH's application launcher; those parts do not belong in a generic memory setup.

Adapt these points together:

| Reference detail | Adaptation |
| --- | --- |
| Better Office Hours / BOH in headings, usage, and errors | New project's name |
| `boh-context` executable and `~/.local/share/boh-context` | A unique project slug, used consistently in install and recovery instructions |
| `BOH_CONTEXT_HOME` | A matching project-specific test/storage override |
| Installer signature checks | New project signature, preventing accidental overwrite of an unrelated helper |
| Hardcoded David/publication-freeze text | Actual project policy; when unavailable, require reading current instructions before consequential work |
| Source paths and document fields | Keep the schema above, or update validation and output together |
| Required CLAUDE/Cursor checks | Match clients actually configured in that project; do not require unused clients |
| Absolute paths and ports in BOH docs | Replace with the new project's actual information |

The BOH launcher, student memory, provider configuration, Groundtrack hooks, and credentials are outside this recipe. Do not copy `.env`, `.data`, machine-local indexes, old TASK contents, or old publication authorizations into a new project.

Preserve the useful behavior: resolve the current Git root from nested directories; inspect Git without refreshing indexes; normalize repository identity without retaining credentials; discover sibling worktrees and explicitly registered clones; recheck live state; identify unavailable commits and uncommitted work; retain a small snapshot if a source moves; refuse unsafe output symlinks; make read-only orientation useful when strict validation fails.

Default budgets can remain TASK 6,000 characters, other startup sources 10,500 each, brief 12,000 total, and full packet 28,000 total. Per-file limits do not guarantee the combined packet fits. Fail explicitly on oversized writes; have the agent curate the notes. Do not silently remove constraints to satisfy the budget.

## 4. Wire commands and client entry points

In an npm project, merge these keys into the existing `scripts` object without replacing other scripts:

```json
{
  "context": "node scripts/context.mjs",
  "context:check": "node scripts/context.mjs --check",
  "handoff": "node scripts/context.mjs --write"
}
```

For a project without npm, use the `node scripts/context.mjs` commands directly or expose them through the project's existing task runner. Node and Git are prerequisites for this reference implementation. No package installation is needed for the memory script itself.

Ignore the generated brief, for example `.data/handoff/`, while retaining the source Markdown and script in Git. Respect existing ignore rules. The per-machine index should live outside the repository. A handoff command writes the brief/index; it neither updates the authored Markdown nor creates a Git commit on its own.

Have each selected client point to the shared instructions using its supported project instruction mechanism. Inspect existing configuration and verify the client's current documented syntax during setup. BOH's [CLAUDE.md](../CLAUDE.md) and [Cursor rule](../.cursor/rules/handoff.mdc) are examples of thin pointers, not a requirement to install those clients. Provide an explicit startup prompt for clients without automatic instruction loading.

## 5. Verify, then install

Adapt the reference fixture tests to the new paths, project signature, and rules. Run them with an isolated storage override so they do not register synthetic repositories in the real index. Use local temporary repositories, not a network remote or a working user's checkout.

Confirm these outcomes:

1. A valid task produces a bounded brief; read-only orientation changes no files, branch, or commit.
2. Strict writes fail on the wrong branch/base, missing fields, oversized notes, broken links, and unsafe output paths.
3. An older detached worktree without the script can still be oriented through the installed helper.
4. An independent local clone with the same repository identity becomes discoverable after registration; unavailable commits and dirty work are explicit.
5. Moving the source folder leaves the installed helper usable and marks the missing source honestly.
6. An unrelated repository's checkpoints and credentials do not appear. Private file contents are excluded.
7. The new project installs under its own namespace and leaves other projects' installed helpers intact.

After the current task structure passes, run:

```sh
node scripts/context.mjs --check
node scripts/context.mjs --install
```

Use the full installed path if its bin directory is not on PATH. From another compatible clone, run that helper with `--write` to register it. On a fresh machine, transfer the code/checkpoint and install again. No global machine index is transferred automatically.

The reference installer creates a POSIX shell wrapper and is exercised here on macOS. A Windows port needs an appropriate wrapper, path handling, and tests; it is not verified by the BOH checks.

## 6. Demonstrate the everyday workflow

Ask the agent to make a small authorized change, record an honest checkpoint, and run handoff. Start a fresh chat in the same checkout and give it the startup prompt. It should identify the task, available code, checks already run, and exact next action without needing the previous conversation.

Then try an older checkout. The desired result is an accurate explanation of where relevant work lives and what code is missing. Automatic branch switching or a confident continuation from stale notes is not a successful demonstration.

Keep the habit simple: agents update memory as they work, archive completed tasks, and checkpoint before stopping. Start without a database or semantic-search service. Add such a service only for a demonstrated retrieval need, with separate setup and data permissions.
