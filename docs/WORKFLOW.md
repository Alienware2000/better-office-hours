# Working across agents and chats

The same repository files carry the project forward regardless of the coding model or chat client. No chat export, background model, extra subscription, or automatic transcript upload is required. This workflow reduces repeated context loading; it cannot expand a model's context window or recover details that nobody recorded.

## Start here

Open any local checkout of this repository in the coding agent of your choice. Ask: "Reorient here and continue from the relevant checkpoint." The agent handles the commands and checks; you do not need to manage memory files.

```sh
npm run context
```

Default output is a lean orientation: current root/branch/commit, dirty work, readiness warnings, related local checkouts, current authority, and the active task. It does not dump every standing instruction or archived task. It works with Node alone before npm ci. `npm run context -- --full` includes the full reference packet when needed. `npm run context:check` remains strict and fails when the branch/base/task structure is inconsistent; default read-only orientation still shows useful recovery information in that situation.

### Older checkouts and separate clones

An older checkout may not have the npm command. On David's machine an independent helper is installed with:

```sh
npm run context -- --install
```

This creates `~/.local/bin/boh-context` and its standalone implementation under `~/.local/share/boh-context/`, then checkpoints this checkout. From any checkout or subdirectory, the agent can run:

```sh
~/.local/bin/boh-context
# Or orient a different checkout without changing directories:
~/.local/bin/boh-context --repo /path/to/checkout
```

The helper survives deletion/movement of the checkout that installed it. It requires Node on PATH. No shell profile, other agent configuration, or global npm dependency is changed. Use the full path when ~/.local/bin is not on PATH. Rerun --install after changing the helper implementation. Never overwrite an unrelated executable at that path.

Git worktrees are discovered automatically. Separate clones join the machine-local index when an agent runs --write (npm run handoff) or --install there. Identity is derived from the sanitized origin, normalizing ordinary HTTPS and SSH forms; no credentials enter the identity. Forks with different origins are deliberately separate. Without an origin, discovery is limited to the common Git directory. There is no whole-disk search.

The index stores one latest JSON checkpoint per checkout: curated task text, source root, branch, commit, dirty flag, and checkpoint time. It never stores code diffs, environment values, student exports, or complete chats. Read-only orientation does not register the current checkout or alter another checkout. It refreshes reachable candidate metadata, flags moved/missing sources or potentially stale snapshots, and shows an explicit snapshot path for deeper retrieval.

Compare the intended task and code, not just checkpoint timestamps. "Same commit", "included", "behind", "diverged", and "commit not available here" describe different states. A dirty checkpoint means uncommitted code remains at its source. If the current branch doesn't match TASK, first determine whether to continue there, use the source checkout, or deliberately transfer local commits. Don't merely rewrite Branch to silence the check. The helper never switches, merges, fetches, resets, deletes, or synchronizes files.

On another computer, this local index is not available. Transfer/share the committed code and a lean checkpoint explicitly, then install/checkpoint there. The publication freeze forbids using a GitHub push as a convenient shortcut. A plain brief transfers task context, not missing code, credentials, PDF bytes, or browser saves. Truly seamless cross-machine synchronization remains separate work.

Codex reads root AGENTS.md. Claude Code loads the tracked `CLAUDE.md` import of AGENTS.md. The existing Cursor rule points to AGENTS.md. For any agent without automatic instruction loading, paste the generated brief or ask it to read AGENTS.md and run `npm run context`. Agent logins, models, tools, and permissions remain the responsibility of each client; this repo does not install or configure every client.

The Claude bridge follows [Claude's documented AGENTS.md import](https://code.claude.com/docs/en/memory#agentsmd); Cursor's entry follows [its project rules](https://prod.cursor.com/docs/rules). There is one set of project policies, not separately maintained copies per agent.

## Start the tutor locally

```sh
npm ci
npm run dev:local
```

Open http://localhost:3105. Put existing xAI/ElevenLabs development keys in ignored `.env.local`, using names from `.env.example`. Missing keys still permit UI exploration. Real tutor usage calls the configured providers and consumes credits. Signing secrets for local Canvas experiments should be generated locally, not copied from production. Google sign-in is disabled in this launcher.

`dev:local` binds to 127.0.0.1, uses this checkout's `.data`, and disables the existing Blob/Supabase cloud adapters and production mode via process environment overrides, including when `.env` contains those settings. It rejects externally linked `.data`. This is a local convenience guard, not a general outbound-network sandbox. Raw `npm run dev`/`build` do not have this guard.

For a different port use `npm run dev:local -- --port 3106`. If occupied, the launcher stops with an error; it never kills the owner. Stop your own server with Ctrl-C. Before stopping an older server, identify the listening PID and its cwd (`lsof -nP -iTCP:3105 -sTCP:LISTEN`, then `lsof -a -p <pid> -d cwd` on macOS). Never kill all Node processes. When a task host owns the process, its terminal/process handle may not survive an app quit; verify the port before restarting.

The old localhost:3102 browser history and PDFs are preserved. The new port has its own IndexedDB sessions. The exporter does not migrate student sessions or credentials. If an old saved session is needed, handle that origin and its file storage explicitly with David.

Do not run a production build in a checkout serving a live session. For renderer/voice tests use a separate checkout, port, local `.data`, and fresh test browser. Inspect scripts first: live model tests and deployed-storage checks are not offline checks. Keep source stable while David is talking; development hot reload can interrupt audio.

## Keep checkpoints small and useful

| File | Purpose | Update when |
| --- | --- | --- |
| AGENTS.md | Stable constraints, startup, checkpoint policy | A real workflow or safety decision changes |
| docs/STATUS.md | Current implementation, runtime, blockers | The project state changes |
| docs/TASK.md | One active objective, progress, decisions, exact next action | A result, failed attempt, correction, or pause occurs |
| docs/NOTES.md | Durable pitfalls and pointers to evidence | A future agent could avoid repeating a mistake |
| docs/archive/ | Superseded history, explicitly dated | Live notes become too long |
| DESIGN / ARCHITECTURE | Product decisions and system/contracts | An authorized decision changes |

Update TASK while you still remember the work, not only when a window is nearly full. Record what changed, what remains, why an approach was rejected, and the exact check/result. Store private test exports outside Git and reference them only when necessary. Checks are evidence at the tested revision; a later agent must assess whether changes invalidate them.

TASK states are `in_progress`, `blocked`, `ready_for_review`, and `complete`. Before starting a new task, save the completed TASK under docs/archive/tasks with a date and short name, and link it from docs/archive/README.md. Then replace TASK with the next authorized slice, retaining important current decisions in STATUS/NOTES. Set Branch to the intended branch and Base to its full starting commit (`git rev-parse HEAD`). Do not rewrite Base after every commit. Never label a partial slice complete because the chat is ending.

TASK is capped at 6,000 characters, other startup files at 10,500. The default brief is capped at 12,000; the optional full reference packet at 28,000. These are deterministic size limits, not model-specific token estimates. Overflow fails loudly rather than silently dropping constraints. The original long build notes are preserved byte-for-byte under the history index; use `rg` to retrieve only relevant evidence.

## Move to a fresh chat

1. Ask the current agent: "Checkpoint this task for a fresh chat. Update TASK, STATUS, and NOTES, record checks and unfinished work, commit locally if appropriate, and run npm run handoff."
2. The agent runs `npm run context:check`, commits only its intended files, then runs `npm run handoff` to create ignored `.data/handoff/CONTINUE.md` and update the machine-local checkout index. Explicit uncommitted WIP is supported and shown, but its files are not copied. No automatic commit, GitHub action, or cloud upload is performed by the command.
3. Open a checkout in the next client/chat and say:

```text
Continue Better Office Hours from the repository checkpoint. Read AGENTS.md,
run npm run context (or ~/.local/bin/boh-context in an older checkout), and
inspect the relevant task checkpoint. Verify which code is actually present
and preserve uncommitted changes. All work stays local; the publication freeze still applies.
Continue only the authorized next action and report any stale/conflicting state.
```

If the client cannot read local files, give it CONTINUE.md as context, but it will still need repository access to implement changes. Regenerate after switching branches or making further edits. Review before sending to another provider: the brief includes curated engineering notes and Git metadata, never automatically collected private files or secrets. It is not a secret scanner for mistakes manually entered into Markdown.

## Groundtrack

Groundtrack adds searchable engineering experiences when authenticated tools are available. It is separate from the tutor's student memory. Codex MCP/hook configuration is checked in; credentials and hook trust are user-local. Setup is not live-verified yet: reload the project, sign in, approve the hook (desktop prompt or CLI `/hooks`), then follow its setup verification once. Never fabricate enrichment or event ids. Do not configure other agents' hooks blindly; each client's setup/trust is separate.

Repository-only continuation works when Groundtrack is unavailable. Record that limitation and proceed with authorized local work. Groundtrack results cannot lift the publication freeze or override current product decisions.
