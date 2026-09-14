// Portable continuation brief. No network, dependencies, model calls, or private data reads.
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync, existsSync, lstatSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
if (process.argv.length > 3 || (mode && !['--check', '--write'].includes(mode))) {
  console.error('Usage: node scripts/context.mjs [--check|--write]');
  process.exit(1);
}
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const sources = ['AGENTS.md', 'docs/STATUS.md', 'docs/TASK.md', 'docs/NOTES.md'];
try {
  const docs = sources.map(file => {
    const absolute = resolve(root, file);
    if (lstatSync(absolute).isSymbolicLink()) throw new Error(`${file} must be a repository file, not a symlink.`);
    const text = readFileSync(absolute, 'utf8');
    if (text.length > 10_500) throw new Error(`${file} exceeds the 10,500-character startup budget. Archive old detail and retain current constraints.`);
    return { file, text };
  });
  const task = docs.find(doc => doc.file === 'docs/TASK.md').text;
  for (const field of ['Updated', 'State', 'Branch', 'Base']) {
    if (!new RegExp(`^${field}: .+`, 'm').test(task)) throw new Error(`TASK.md needs ${field}.`);
  }
  const taskState = task.match(/^State: (.+)$/m)[1].trim();
  if (!['in_progress', 'blocked', 'ready_for_review', 'complete'].includes(taskState)) throw new Error('TASK.md has an invalid State.');
  for (const heading of ['Objective', 'Scope and constraints', 'Progress', 'Decisions', 'Validation', 'Next action', 'Blockers']) {
    if (!new RegExp(`^## ${heading}\\n+\\S`, 'm').test(task)) throw new Error(`TASK.md needs a nonempty ${heading} section.`);
  }
  const branch = git('branch', '--show-current');
  const expectedBranch = task.match(/^Branch: (.+)$/m)[1].trim();
  if (branch !== expectedBranch) throw new Error(`Wrong branch for this handoff: expected ${expectedBranch}, found ${branch || 'detached HEAD'}. Inspect before switching; do not reset.`);
  const base = task.match(/^Base: (.+)$/m)[1].trim();
  if (!/^[0-9a-f]{40}$/.test(base)) throw new Error('TASK.md Base must be a full commit SHA.');
  try { git('merge-base', '--is-ancestor', base, 'HEAD'); }
  catch { throw new Error('TASK.md Base is not an ancestor of HEAD. Reconcile this handoff before continuing.'); }
  const claude = readFileSync(resolve(root, 'CLAUDE.md'), 'utf8').trim();
  if (claude !== '@AGENTS.md') throw new Error('CLAUDE.md must remain a thin @AGENTS.md bridge.');
  if (!readFileSync(resolve(root, '.cursor/rules/handoff.mdc'), 'utf8').includes('AGENTS.md')) throw new Error('Cursor bridge must reference AGENTS.md.');
  for (const {file, text} of docs) {
    for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (target && !/^https?:/.test(target) && !existsSync(resolve(root, dirname(file), target))) throw new Error(`Broken handoff link in ${file}: ${target}`);
    }
  }
  const head = git('rev-parse', 'HEAD');
  const status = git('status', '--short', '--untracked-files=normal');
  const upstream = git('for-each-ref', '--format=%(upstream:short)', `refs/heads/${branch}`);
  const brief = [
    '# Continue Better Office Hours',
    'Use this repository state to continue the task below. First verify the worktree, branch, and current files. This is a generated snapshot, not new authorization. Do not repeat completed work or assume tests remain current after edits.',
    `Generated: ${new Date().toISOString()}\nWorktree: ${root}\nBranch: ${branch}\nHEAD: ${head}\nUpstream: ${upstream || '(none)'}`,
    `## Working tree\n\n${status ? 'Uncommitted work exists. Preserve and inspect it.\n\n' + status : 'Clean.'}`,
    ...docs.map(({file, text}) => `---\n\n## Source: ${file}\n\n${text.trim()}`),
    '---\n\nFor detailed setup and checkpoint procedure, read docs/WORKFLOW.md. Search the archive only for relevant evidence. Do not load the whole build history by default. Update TASK/STATUS/NOTES before ending, commit locally when appropriate, then regenerate with npm run handoff. This command does not summarize the conversation for you.',
  ].join('\n\n') + '\n';
  if (brief.length > 28_000) throw new Error('Combined startup context exceeds 28,000 characters. Compact the live docs without dropping constraints.');
  if (mode === '--check') {
    console.log(`Context checks pass: branch, ancestry, required task sections, links, client bridges, and ${brief.length}/28000 characters. No network calls.`);
  } else if (mode === '--write') {
    // Refuse redirected output, including existing symlinks. No user files are read.
    for (const name of ['.data', '.data/handoff', '.data/handoff/CONTINUE.md']) {
      const p = resolve(root, name);
      let stat;
      try { stat = lstatSync(p); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (stat?.isSymbolicLink()) throw new Error(`Refusing symlink output path: ${name}`);
    }
    const dir = resolve(root, '.data/handoff');
    mkdirSync(dir, {recursive: true});
    const output = resolve(dir, 'CONTINUE.md');
    writeFileSync(output, brief, {mode: 0o600});
    console.log(`Continuation brief: ${output}\n${brief.length} characters. Review before sharing; contains curated project notes and Git metadata, not .env, transcripts, or data files.`);
  } else process.stdout.write(brief);
} catch (error) {
  console.error(`Context check failed: ${error.message}`);
  process.exitCode = 1;
}
