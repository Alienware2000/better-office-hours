# Working across agents and chats

The same repository files carry the project forward regardless of the coding model or chat client. No chat export, background model, extra subscription, or automatic transcript upload is required. This workflow reduces repeated context loading; it cannot expand a model's context window or recover details that nobody recorded.

## Start here

Open the current checkout in the agent of your choice. During the publication freeze, use the same local branch/worktree, or explicitly transfer committed work locally. A fresh clone of GitHub will not contain unpushed changes. Do not push as a shortcut for transferring context.

Run:

```sh
npm run context
```

This command works with Node alone, before `npm ci`. It prints a bounded brief containing the canonical instructions, live STATUS, active TASK, current NOTES, exact checkout/branch/HEAD, and dirty paths. It refuses a wrong branch, unrelated starting commit, missing task sections, broken startup links, or oversized startup context. It does not reset/switch branches, summarize chats, run tests, or claim unfinished work is complete.

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

TASK states are `in_progress`, `blocked`, `ready_for_review`, and `complete`. Start a new task by replacing TASK's content with the next authorized slice, preserving important completed decisions in STATUS/NOTES or a dated archive. Set Branch to the intended branch and Base to its full starting commit (`git rev-parse HEAD`). Do not rewrite Base after every commit. Never label a partial slice complete because the chat is ending.

Each startup file is capped at 10,500 characters; the complete generated packet is capped at 28,000. These are deterministic size limits, not model-specific token estimates. Overflow fails loudly rather than silently dropping constraints. The original long build notes are preserved byte-for-byte under the history index; use `rg` to retrieve only relevant evidence.

## Move to a fresh chat

1. Ask the current agent: "Checkpoint this task for a fresh chat. Update TASK, STATUS, and NOTES, record checks and unfinished work, commit locally if appropriate, and run npm run handoff."
2. The agent runs `npm run context:check`, commits only its intended files, then runs `npm run handoff` to create ignored `.data/handoff/CONTINUE.md`. Explicit uncommitted WIP is supported and shown. No automatic commit, GitHub action, or cloud upload is performed by the command.
3. Open this same checkout in the next client/chat and say:

```text
Continue Better Office Hours from the repository checkpoint. Read AGENTS.md,
run npm run context, and follow docs/TASK.md. Verify the worktree and preserve
uncommitted changes. All work stays local; the publication freeze still applies.
Continue only the authorized next action and report any stale/conflicting state.
```

If the client cannot read local files, give it CONTINUE.md as context, but it will still need repository access to implement changes. Regenerate after switching branches or making further edits. Review before sending to another provider: the brief includes curated engineering notes and Git metadata, never automatically collected private files or secrets. It is not a secret scanner for mistakes manually entered into Markdown.

## Groundtrack

Groundtrack adds searchable engineering experiences when authenticated tools are available. It is separate from the tutor's student memory. Codex MCP/hook configuration is checked in; credentials and hook trust are user-local. Setup is not live-verified yet: reload the project, sign in, approve the hook (desktop prompt or CLI `/hooks`), then follow its setup verification once. Never fabricate enrichment or event ids. Do not configure other agents' hooks blindly; each client's setup/trust is separate.

Repository-only continuation works when Groundtrack is unavailable. Record that limitation and proceed with authorized local work. Groundtrack results cannot lift the publication freeze or override current product decisions.
