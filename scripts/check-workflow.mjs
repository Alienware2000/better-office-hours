// Offline integration checks in disposable repositories. Never starts the tutor.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, symlinkSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = realpathSync(mkdtempSync(join(tmpdir(), 'boh-workflow-')));
const git = (...args) => execFileSync('git', args, {cwd: fixture, encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim();
function put(file, text) { mkdirSync(dirname(join(fixture,file)), {recursive:true}); writeFileSync(join(fixture,file),text); }
function copy(file) { put(file, readFileSync(join(root,file))); }
function run(script, args = [], env = {}) {
  return spawnSync(process.execPath, [join(fixture, 'scripts', script), ...(script === 'context.mjs' ? ['--repo', fixture] : []), ...args], {
    cwd: tmpdir(), encoding:'utf8', timeout:15_000, env:{...process.env, BOH_CONTEXT_HOME:join(fixture,'.data/context-index'), ...env},
  });
}
function pass(result) { assert.equal(result.status, 0, result.stderr || result.stdout); }
function fail(result, text) { assert.notEqual(result.status, 0); assert.match(result.stderr, text); }
let probe;
try {
  for (const file of ['AGENTS.md','CLAUDE.md','.gitignore','.cursor/rules/handoff.mdc','scripts/context.mjs','scripts/dev-local.mjs']) copy(file);
  for (const folder of ['docs', 'docs/archive', 'docs/archive/tasks']) for (const file of readdirSync(join(root,folder))) if (file.endsWith('.md')) copy(`${folder}/${file}`);
  git('init', '-b', 'lane/post-hackathon-local');
  git('add','.');
  git('-c','user.name=Workflow test','-c','user.email=workflow@example.invalid','-c','commit.gpgsign=false','commit','-m','Synthetic workflow fixture');
  const taskFile=join(fixture,'docs/TASK.md');
  const task=readFileSync(taskFile,'utf8').replace(/^Base: .+$/m,`Base: ${git('rev-parse','HEAD')}`);
  writeFileSync(taskFile,task);
  pass(run('context.mjs',['--check']));
  put('.env.local','PRIVATE_CANARY=must-never-enter-handoff\n');
  put('.data/student-session.json','private-student-canary');
  const brief=run('context.mjs'); pass(brief);
  assert.ok(!brief.stdout.includes('must-never-enter-handoff'));
  assert.ok(!brief.stdout.includes('private-student-canary'));
  assert.ok(brief.stdout.includes(fixture));
  assert.ok(brief.stdout.includes('Uncommitted work exists'));
  pass(run('context.mjs',['--write']));
  assert.ok(readFileSync(join(fixture,'.data/handoff/CONTINUE.md'),'utf8').includes('Continue Better Office Hours'));
  git('switch','-c','lane/wrong-context');
  fail(run('context.mjs',['--check']),/Wrong branch/);
  git('switch','lane/post-hackathon-local');
  writeFileSync(taskFile,task.replace(/^Base: .+$/m,`Base: ${'0'.repeat(40)}`));
  fail(run('context.mjs',['--check']),/not an ancestor/);
  writeFileSync(taskFile,task.replace('## Next action','## Missing next action'));
  fail(run('context.mjs',['--check']),/Next action/);
  writeFileSync(taskFile,task+'\n'+ 'x'.repeat(11_000));
  fail(run('context.mjs',['--check']),/startup budget/);
  writeFileSync(taskFile,task+'\n[missing](absent-file.md)\n');
  fail(run('context.mjs',['--check']),/Broken handoff link/);
  writeFileSync(taskFile,task);
  const outside=join(fixture,'untouched.txt');
  writeFileSync(outside,'preserve-me');
  rmSync(join(fixture,'.data/handoff/CONTINUE.md'));
  symlinkSync(outside,join(fixture,'.data/handoff/CONTINUE.md'));
  fail(run('context.mjs',['--write']),/symlink output/);
  assert.equal(readFileSync(outside,'utf8'),'preserve-me');
  rmSync(outside);
  fail(run('context.mjs',['--write']),/symlink output/);

  // Run the actual launcher against a fake dev task that loads Next dotenv.
  // This checks cloud credentials cannot leak through inherited or file config.
  const require=createRequire(import.meta.url);
  const nextEnv=require.resolve('@next/env');
  put('package.json',JSON.stringify({scripts:{dev:'node probe.cjs'}}));
  put('probe.cjs',`require(${JSON.stringify(nextEnv)}).loadEnvConfig(process.cwd(), true); console.log('ENV_PROBE='+JSON.stringify(Object.fromEntries(['BLOB_READ_WRITE_TOKEN','BLOB_STORE_ID','VERCEL','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','XAI_API_KEY'].map(k=>[k,process.env[k]]))));`);
  put('.env.local','BLOB_READ_WRITE_TOKEN=file-cloud-canary\nSUPABASE_SERVICE_ROLE_KEY=file-storage-canary\nGOOGLE_CLIENT_SECRET=file-oauth-canary\nXAI_API_KEY=synthetic-local-provider\n');
  probe=createServer();
  await new Promise(resolve => probe.listen(0,'127.0.0.1',resolve));
  const busyPort=probe.address().port;
  fail(run('dev-local.mjs',['--port',String(busyPort)]),/occupied/);
  assert.ok(probe.listening,'Occupied process is left intact');
  await new Promise(resolve=>probe.close(resolve));
  const started=run('dev-local.mjs',['--port',String(busyPort)], {
    BLOB_STORE_ID:'inherited-cloud-canary',VERCEL:'1',NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid',GOOGLE_CLIENT_ID:'inherited-oauth-canary',XAI_API_KEY:'synthetic-local-provider',
  });
  pass(started);
  const environment=JSON.parse(started.stdout.match(/^ENV_PROBE=(.+)$/m)[1]);
  for (const [name,value] of Object.entries(environment)) assert.equal(value,name==='XAI_API_KEY'?'synthetic-local-provider':'',name);
  rmSync(join(fixture,'.data'),{recursive:true});
  symlinkSync(tmpdir(),join(fixture,'.data'));
  fail(run('dev-local.mjs',['--port',String(busyPort)]),/outside this worktree/);
  console.log('PASS: fresh-repository continuation, dirty state, wrong branch/base, missing next action, size/link checks, private data exclusion, symlink output protection, occupied-port preservation, and local storage guards across inherited/Next dotenv configuration. No model calls or real user data.');
} finally {
  if (probe?.listening) await new Promise(resolve=>probe.close(resolve));
  rmSync(fixture,{recursive:true,force:true});
}
