// Entirely local Git fixtures. Exercises actual independent clones and worktrees.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, realpathSync, renameSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = resolve(dirname(fileURLToPath(import.meta.url)), 'context.mjs');
const temp = realpathSync(mkdtempSync(join(tmpdir(), 'boh-checkouts-')));
const a = join(temp, 'source'), b = join(temp, 'older-worktree'), c = join(temp, 'separate-clone'), d = join(temp, 'other-project');
const store = join(temp, 'index'), helper = join(store, 'context.mjs');
const env = {...process.env, BOH_CONTEXT_HOME:store};
const git = (cwd, ...args) => execFileSync('git', args, {cwd, encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim();
const put = (root, file, text) => { mkdirSync(dirname(join(root,file)), {recursive:true}); writeFileSync(join(root,file), text); };
const commit = (cwd, message) => {
  git(cwd, 'add','.');
  git(cwd,'-c','user.name=Context test','-c','user.email=context@example.invalid','-c','commit.gpgsign=false','commit','-m',message);
  return git(cwd,'rev-parse','HEAD');
};
function run(cwd, args=[], installed=true) {
  return spawnSync(process.execPath,[installed ? helper : source,...args],{cwd,env,encoding:'utf8',timeout:20_000});
}
function pass(result) { assert.equal(result.status,0,result.stderr || result.stdout); return result.stdout; }
try {
  mkdirSync(a);
  git(a,'init','-b','lane/workflow-test');
  git(a,'remote','add','origin','git@example.invalid:team/boh.git');
  put(a,'.gitignore','.data/\n.env*\n'); put(a,'README.md','Synthetic repository.\n');
  const base=commit(a,'Initial fixture without workflow tools');
  put(a,'AGENTS.md','# Instructions\nLocal only.\n');
  put(a,'CLAUDE.md','@AGENTS.md\n');
  put(a,'.cursor/rules/handoff.mdc','Read AGENTS.md.\n');
  put(a,'docs/STATUS.md','# Status\n\n## Authority\n\nNo publishing.\n');
  put(a,'docs/NOTES.md','# Notes\nSynthetic notes.\n');
  put(a,'docs/TASK.md',`# Active task\n\nUpdated: 2026-09-14\nState: in_progress\nBranch: lane/workflow-test\nBase: ${base}\n\n${['Objective','Scope and constraints','Progress','Decisions','Validation','Next action','Blockers'].map(name=>`## ${name}\n\n${name==='Objective'?'Continue the synthetic checkout task.':'Fixture evidence.'}`).join('\n\n')}\n`);
  put(a,'scripts/context.mjs',readFileSync(source,'utf8'));
  const setup=commit(a,'Add synthetic workflow');
  pass(run(a,['--install'],false));
  assert.ok(readFileSync(helper,'utf8').includes('context helper v2'));
  const wrapper=spawnSync(join(store,'bin/boh-context'),['--check'],{cwd:a,env,encoding:'utf8'});
  pass(wrapper);

  git(a,'worktree','add','--detach',b,base);
  const beforeB=git(b,'status','--porcelain');
  const old=pass(run(b));
  assert.ok(old.includes('detached HEAD'));
  assert.ok(old.includes('No TASK.md'));
  assert.ok(old.includes(a));
  assert.ok(old.includes('this checkout is behind'));
  assert.equal(git(b,'rev-parse','HEAD'),base);
  assert.equal(git(b,'status','--porcelain'),beforeB);
  assert.notEqual(run(b,['--write']).status,0,'An incompatible checkout cannot publish a misleading checkpoint');
  mkdirSync(join(b,'nested'));
  assert.ok(pass(run(join(b,'nested'))).includes(JSON.stringify(b)),'Resolve the actual checkout from a subdirectory');

  // Local clone only; the example.invalid origin is never contacted.
  git(temp,'clone','--no-local',a,c);
  git(c,'remote','set-url','origin','https://example.invalid/team/boh.git');
  put(a,'new-code.txt','not yet present in the independent clone');
  const latest=commit(a,'New local-only work');
  put(a,'uncommitted.txt','uncommitted-canary-do-not-copy');
  put(a,'.env.local','SECRET=secret-canary-do-not-read');
  put(a,'.data/private.json','student-canary-do-not-read');
  pass(run(a,['--write']));
  const beforeC=git(c,'status','--porcelain');
  const cloned=pass(run(c));
  assert.ok(cloned.includes('commit not available here; local transfer needed'));
  assert.ok(cloned.includes(latest.slice(0,8)));
  assert.ok(cloned.includes('uncommitted work (not copied)'));
  assert.ok(!cloned.includes('uncommitted-canary-do-not-copy'));
  assert.ok(!cloned.includes('secret-canary-do-not-read'));
  assert.ok(!cloned.includes('student-canary-do-not-read'));
  assert.equal(git(c,'status','--porcelain'),beforeC);
  assert.equal(git(c,'rev-parse','HEAD'),setup,'Orientation never transfers commits');
  pass(run(c,['--write']));
  assert.ok(pass(run(a)).includes(c),'Separately registered clones are discoverable in either direction');
  const oversized=readFileSync(join(c,'docs/TASK.md'),'utf8');
  put(c,'docs/TASK.md',oversized+'\n'+'x'.repeat(6500));
  assert.ok(pass(run(c)).includes('TASK.md exceeds'),'Oversized active detail is omitted with an explicit reason');
  assert.notEqual(run(c,['--check']).status,0);
  put(c,'docs/TASK.md',oversized);

  renameSync(a,join(temp,'moved-source'));
  const moved=pass(run(c));
  assert.ok(moved.includes('missing, moved, or no longer this repository'));
  assert.ok(moved.includes('Continue the synthetic checkout task.'));
  assert.ok(moved.includes('Snapshot:'));
  assert.ok(moved.length < 12_000);
  assert.equal(run(c,['--check']).status,0,'Installed helper survives removal/move of the original checkout');

  mkdirSync(d);git(d,'init','-b','lane/other');
  git(d,'remote','add','origin','https://user:credential-canary@example.invalid/team/unrelated.git');
  put(d,'README.md','Different repository');commit(d,'Unrelated fixture');
  const unrelated=pass(run(d));
  assert.ok(!unrelated.includes('credential-canary'));
  assert.ok(!unrelated.includes('Continue the synthetic checkout task.'));
  assert.ok(!unrelated.includes(a));
  const repoDirs=readdirSync(join(store,'repos'));
  assert.equal(repoDirs.length,1,'Read-only orientation does not register an unrelated checkout');
  console.log('PASS: detached old checkout, nested directories, sibling discovery, HTTPS/SSH identity equivalence, independent local clone, absent commits, dirty work, stale checkpoints, moved source recovery, installed helper survival, lean output, secret exclusion, and unrelated-repository isolation. No network or existing checkout mutation.');
} finally { rmSync(temp,{recursive:true,force:true}); }
