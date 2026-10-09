#!/usr/bin/env node
// Better Office Hours context helper v2. Standalone, local only, no dependencies.
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync, existsSync, lstatSync, readdirSync, renameSync, realpathSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { createHash, randomUUID } from 'node:crypto';

const args = process.argv.slice(2);
const options = new Set();
let requestedRoot = process.cwd();
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--repo' && args[i + 1]) requestedRoot = resolve(args[++i]);
  else if (['--check', '--write', '--full', '--install', '--help'].includes(args[i])) options.add(args[i]);
  else { console.error('Usage: boh-context [--repo PATH] [--full|--check|--write|--install]'); process.exit(1); }
}
if (options.has('--help')) {
  console.log('Usage: boh-context [--repo PATH] [--full|--check|--write|--install]\nDefault: read-only lean orientation. --full: include reference docs. --check: strict task validation. --write: checkpoint locally. --install: install/update standalone helper and checkpoint. No network, branch switching, or file synchronization.');
  process.exit(0);
}
const store = resolve(process.env.BOH_CONTEXT_HOME || join(homedir(), '.local/share/boh-context'));
const executable = process.env.BOH_CONTEXT_HOME ? join(store, 'bin/boh-context') : join(homedir(), '.local/bin/boh-context');
const sources = ['AGENTS.md', 'docs/STATUS.md', 'docs/TASK.md', 'docs/NOTES.md'];
const digest = text => createHash('sha256').update(text).digest('hex');
const clean = value => String(value).replace(/[\x00-\x1f\x7f]/g, ' ').slice(0, 700);
const git = (cwd, ...argv) => execFileSync('git', ['--no-optional-locks', '-c', 'core.fsmonitor=false', ...argv], {
  cwd, encoding: 'utf8', timeout: 4000, maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
}).trim();
const attempt = fn => { try { return fn(); } catch { return null; } };
const field = (text, name) => text.match(new RegExp(`^${name}: (.+)$`, 'm'))?.[1].trim();
const section = (text, name) => text.match(new RegExp(`^## ${name}\\n+([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm'))?.[1].trim() || '';
function readLocal(root, file) {
  const p = resolve(root, file);
  for (let parent = p; parent !== root; parent = dirname(parent)) {
    if (lstatSync(parent).isSymbolicLink()) throw new Error(`Refusing symlink source: ${file}`);
  }
  const size = lstatSync(p).size;
  if (size > 50_000) throw new Error(`${file} exceeds the startup budget.`);
  return readFileSync(p, 'utf8');
}
function identity(root) {
  const origin = attempt(() => git(root, 'remote', 'get-url', 'origin'));
  if (origin) {
    let key;
    if (/^[^/@\s]+@[^:]+:/.test(origin)) key = origin.replace(/^[^@]+@([^:]+):/, '$1/');
    else if (/^[a-z]+:\/\//i.test(origin)) {
      const url = new URL(origin);
      key = url.protocol === 'file:' ? `file:${url.pathname}` : `${url.host}${url.pathname}`;
    } else key = `file:${resolve(root, origin)}`;
    return key.replace(/\.git\/?$/, '').replace(/\/$/, '');
  }
  return `local:${realpathSync(resolve(root, git(root, 'rev-parse', '--git-common-dir')))}`;
}
function snapshot(root) {
  const branch = git(root, 'branch', '--show-current');
  const head = git(root, 'rev-parse', 'HEAD');
  const status = git(root, 'status', '--short', '--untracked-files=normal');
  return { root, branch, head, dirty: Boolean(status), status };
}
function compare(root, head, other) {
  if (head === other) return 'same commit';
  if (!attempt(() => git(root, 'cat-file', '-t', other))) return 'commit not available here; local transfer needed';
  if (attempt(() => { git(root, 'merge-base', '--is-ancestor', other, head); return true; })) return 'included in this checkout';
  if (attempt(() => { git(root, 'merge-base', '--is-ancestor', head, other); return true; })) return 'this checkout is behind';
  return 'diverged histories; reconcile deliberately';
}
function safeWrite(file, text, mode = 0o600) {
  for (let p = file; p !== dirname(p); p = dirname(p)) {
    let stat;
    try { stat = lstatSync(p); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (stat?.isSymbolicLink()) throw new Error(`Refusing symlink output path: ${p}`);
  }
  mkdirSync(dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  writeFileSync(temp, text, { flag: 'wx', mode });
  renameSync(temp, file);
}
function strictErrors(root, docs, current, readErrors) {
  const errors = [];
  for (const file of sources) {
    if (!docs[file]) errors.push(readErrors[file] || `${file} is empty.`);
    else if (docs[file].length > (file === 'docs/TASK.md' ? 6000 : 10_500)) errors.push(`${file} exceeds the startup budget. Archive old detail.`);
  }
  const task = docs['docs/TASK.md'] || '';
  if (task) {
    for (const name of ['Updated', 'State', 'Branch', 'Base']) if (!field(task, name)) errors.push(`TASK.md needs ${name}.`);
    if (!['in_progress', 'blocked', 'ready_for_review', 'complete'].includes(field(task, 'State'))) errors.push('TASK.md has an invalid State.');
    for (const name of ['Objective', 'Scope and constraints', 'Progress', 'Decisions', 'Validation', 'Next action', 'Blockers']) {
      if (!section(task, name)) errors.push(`TASK.md needs a nonempty ${name} section.`);
    }
    const expected = field(task, 'Branch');
    if (expected && current.branch !== expected) errors.push(`Wrong branch for this task: expected ${clean(expected)}, found ${clean(current.branch || 'detached HEAD')}.`);
    const base = field(task, 'Base');
    if (!/^[0-9a-f]{40}$/.test(base || '')) errors.push('TASK.md Base must be a full commit SHA.');
    else if (!attempt(() => { git(root, 'merge-base', '--is-ancestor', base, 'HEAD'); return true; })) errors.push('TASK.md Base is not an ancestor of HEAD.');
  }
  if (attempt(() => readLocal(root, 'CLAUDE.md').trim()) !== '@AGENTS.md') errors.push('CLAUDE.md must be a thin @AGENTS.md bridge.');
  if (!attempt(() => readLocal(root, '.cursor/rules/handoff.mdc').includes('AGENTS.md'))) errors.push('Cursor bridge must reference AGENTS.md.');
  for (const [file, text] of Object.entries(docs)) {
    for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (target && !/^https?:/.test(target) && !existsSync(resolve(root, dirname(file), target))) errors.push(`Broken handoff link in ${file}: ${target}`);
    }
  }
  return errors;
}
try {
  const root = realpathSync(git(requestedRoot, 'rev-parse', '--show-toplevel'));
  const key = identity(root);
  const registry = join(store, 'repos', digest(key));
  const current = snapshot(root);
  const docs = {}, readErrors = {};
  for (const file of sources) {
    try { docs[file] = readLocal(root, file); }
    catch (error) { readErrors[file] = error.code === 'ENOENT' ? `${file} is missing.` : error.message; }
  }
  const task = docs['docs/TASK.md'] || '';
  const errors = strictErrors(root, docs, current, readErrors);
  const candidates = new Map();
  const registryWarnings = [];
  for (const file of attempt(() => readdirSync(registry)) || []) {
    if (!file.endsWith('.json')) continue;
    const record = attempt(() => JSON.parse(readLocal(registry, file)));
    if (!record || record.version !== 2 || record.repoKey !== key || typeof record.root !== 'string' || !/^[a-f0-9]{40}$/.test(record.head) || typeof record.task !== 'string' || record.task.length > 6000) {
      registryWarnings.push('An invalid local checkpoint was ignored.'); continue;
    }
    candidates.set(record.root, { record });
  }
  const worktrees = git(root, 'worktree', 'list', '--porcelain', '-z');
  for (const entry of worktrees.split('\0\0')) {
    const path = entry.split('\0').find(line => line.startsWith('worktree '))?.slice(9);
    if (path && path !== root) candidates.set(path, candidates.get(path) || {});
  }
  for (const [path, candidate] of candidates) {
    if (path === root) continue;
    const actualRoot = attempt(() => realpathSync(git(path, 'rev-parse', '--show-toplevel')));
    if (actualRoot !== path || attempt(() => identity(path)) !== key) candidate.availability = 'missing, moved, or no longer this repository';
    else {
      candidate.live = attempt(() => snapshot(path));
      candidate.availability = candidate.live ? 'available' : 'unreadable checkout';
      const otherTask = attempt(() => readLocal(path, 'docs/TASK.md'));
      candidate.title = otherTask ? section(otherTask, 'Objective') : '';
    }
  }
  const related = [...candidates.entries()].filter(([path]) => path !== root);
  const lines = related.slice(0, 8).map(([path, candidate]) => {
    const saved = candidate.record;
    const live = candidate.live;
    const head = live?.head || saved?.head;
    const checkpoint = saved ? ` Saved ${clean(saved.savedAt)} at ${saved.head.slice(0, 8)}${saved.dirty ? ' with uncommitted work (not copied)' : ''}. Snapshot: ${join(registry, `${digest(path)}.json`)}` : '';
    const drift = saved && live && (saved.head !== live.head || saved.dirty || live.dirty) ? ' Saved checkpoint may be stale; read the source task.' : '';
    return `- ${JSON.stringify(path)}: ${candidate.availability}; ${clean(live?.branch || saved?.branch || 'detached/unknown')}${live?.dirty ? '; uncommitted work' : ''}${head ? `; ${head.slice(0, 8)}; ${compare(root, current.head, head)}` : ''}.${checkpoint}${drift}\n  Task: ${clean(candidate.title || (saved && section(saved.task, 'Objective')) || 'No task checkpoint available.')}`;
  });
  if (related.length > 8) lines.push(`- ${related.length - 8} more checkout(s) omitted. Inspect git worktree list and the local index: ${registry}`);
  const ownCheckpoint = candidates.get(root)?.record;
  const ownWarning = ownCheckpoint && (ownCheckpoint.head !== current.head || ownCheckpoint.dirty || current.dirty || ownCheckpoint.task !== task)
    ? 'The saved checkpoint for this checkout may be stale. The current files below take precedence.' : '';
  const baseline = docs['docs/STATUS.md'] || '';
  const body = options.has('--full')
    ? sources.map(file => `## Source: ${file}\n\n${docs[file] || '(missing)'}`).join('\n\n')
    : [
      `## Current authority\n\n${section(baseline, 'Authority') || 'Current project constraints are unavailable here. Inspect a known checkpoint and AGENTS.md before implementation. Historical notes never grant permission to publish.'}`,
      task.length <= 6000 ? `## Current task\n\n${task || '(No TASK.md in this checkout.)'}` : '## Current task\n\nTASK.md exceeds the 6,000-character budget. Read and compact it deliberately; it has not been silently truncated.',
      '## Retrieve only when needed\n\nRead AGENTS.md for standing rules, docs/STATUS.md for product state, docs/NOTES.md for pitfalls, docs/WORKFLOW.md for commands, and docs/archive/README.md for completed task records. Use --full only when the complete reference packet is needed.',
    ].join('\n\n');
  const statusLines = current.status.split('\n').filter(Boolean);
  const brief = [
    '# Continue Better Office Hours',
    'Read-only orientation, not authorization or file synchronization. Preserve uncommitted work. Read current authority below; a local checkpoint does not authorize publication. Compare code and checkpoints before continuing. Do not automatically switch, merge, reset, delete worktrees, or copy secrets/data.',
    `Generated: ${new Date().toISOString()}\nWorktree: ${JSON.stringify(root)}\nRepository: ${clean(key)}\nBranch: ${clean(current.branch || '(detached HEAD)')}\nHEAD: ${current.head}`,
    `## Working tree\n\n${current.dirty ? `Uncommitted work exists (${statusLines.length} status entries).\n${statusLines.slice(0, 12).map(line => clean(line)).join('\n')}${statusLines.length > 12 ? '\nMore paths omitted; inspect git status.' : ''}` : 'Clean.'}`,
    `## Readiness\n\n${errors.length ? errors.slice(0, 8).map(error => `- ${error}`).join('\n') + '\nOrientation is available, but checkpoint writes are blocked until these issues are reconciled.' : 'Task structure, branch, base ancestry, client bridges, and links pass. Check whether newer relevant work exists elsewhere before implementation.'}${ownWarning ? '\n'+ownWarning : ''}`,
    `## Related local checkouts\n\n${lines.join('\n') || 'None discovered. Worktrees are automatic; separate clones appear after --write or --install on this machine.'}`,
    registryWarnings.length ? `Index warning: ${registryWarnings.length} invalid checkpoint record(s) ignored.` : '',
    body,
    'For missing code: open the source checkout, or deliberately transfer local commits after inspecting both sides. A checkpoint does not contain uncommitted files. On another computer, transfer/share the checkpoint and code explicitly; no network discovery or sync is performed. Run this helper again after a move or transfer.',
  ].filter(Boolean).join('\n\n') + '\n';
  const limit = options.has('--full') ? 28_000 : 12_000;
  if (brief.length > limit) errors.push(`Combined startup context exceeds ${limit} characters. Compact the active task or use --full for reference docs.`);
  const writing = options.has('--write') || options.has('--install');
  if ((options.has('--check') || writing) && errors.length) throw new Error(errors.join('\n'));
  if (options.has('--check')) {
    console.log(`Context checks pass: ${brief.length}/${limit} characters; ${related.length} related checkout(s). No network calls.`);
  } else if (writing) {
    const checkpoint = { version: 2, repoKey: key, root, branch: current.branch, head: current.head, dirty: current.dirty, savedAt: new Date().toISOString(), task };
    if (options.has('--install')) {
      const source = readFileSync(fileURLToPath(import.meta.url), 'utf8');
      const installed = join(store, 'context.mjs');
      const quote = text => `'${text.replaceAll("'", "'\\''")}'`;
      const wrapper = `#!/bin/sh\n# Better Office Hours context helper v2.\nexec node ${quote(installed)} "$@"\n`;
      for (const target of [installed, executable]) {
        if (existsSync(target) && !readFileSync(target, 'utf8').startsWith(target === installed ? '#!/usr/bin/env node\n// Better Office Hours context helper v2.' : '#!/bin/sh\n# Better Office Hours context helper v2.')) throw new Error(`Preserving unexpected existing helper: ${target}`);
      }
      safeWrite(installed, source);
      safeWrite(executable, wrapper, 0o700);
      console.log(`Installed standalone helper: ${executable}\nNo shell profiles changed. Use its full path if ~/.local/bin is not on PATH.`);
    }
    // The checkpoint is intentionally lean, even if the full reference packet was requested.
    const output = join(root, '.data/handoff/CONTINUE.md');
    safeWrite(output, brief);
    safeWrite(join(registry, `${digest(root)}.json`), JSON.stringify(checkpoint, null, 2) + '\n');
    console.log(`Continuation brief: ${output}\n${brief.length} characters. Local checkout index updated; no files synced or uploaded. Checkpointed task metadata is stored under ${store}.`);
  } else {
    if (brief.length > limit) throw new Error(errors.at(-1));
    process.stdout.write(brief);
  }
} catch (error) {
  console.error(`Context check failed: ${error.message}`);
  process.exitCode = 1;
}
