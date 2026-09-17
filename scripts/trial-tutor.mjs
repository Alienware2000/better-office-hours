// Isolated, opt-in development snapshot. No production configuration is copied.
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, lstatSync, symlinkSync } from 'node:fs';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--port' || !/^\d+$/.test(args[1]))) throw new Error('Usage: npm run trial:tutor -- [--port PORT]');
const port = args.length ? Number(args[1]) : 3107;
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Choose a local port from 1024 through 65535.');
await new Promise((accept, reject) => {
  const probe = createServer();
  probe.once('error', () => reject(new Error(`Port ${port} is occupied. Nothing was stopped.`)));
  probe.listen(port, '127.0.0.1', () => probe.close(accept));
});
// A second trial has independent storage/signing as well as its own origin.
const base = join(root, '.data', port === 3107 ? 'voice-trial' : `voice-trial-${port}`);
for (const dir of [join(root, '.data'), base]) {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  if (lstatSync(dir).isSymbolicLink()) throw new Error('Trial storage must be inside this checkout, without symlinks.');
}
const runtime = join(base, `run-${Date.now()}`);
mkdirSync(runtime, { mode: 0o700 });
const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
for (const name of new Set(files)) {
  if (name.startsWith('.env') || name.startsWith('.data/') || name.startsWith('.git/')) continue;
  const source = join(root, name);
  let stat;
  try { stat = lstatSync(source); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  if (!stat.isFile()) continue;
  const destination = join(runtime, name);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}
symlinkSync(join(root, 'node_modules'), join(runtime, 'node_modules'), 'dir');
const storage = join(base, 'storage');
mkdirSync(storage, { recursive: true, mode: 0o700 });
if (lstatSync(storage).isSymbolicLink()) throw new Error('Trial storage cannot be a symlink.');
symlinkSync(storage, join(runtime, '.data'), 'dir');
const local = parseEnv(readFileSync(join(root, '.env.local'), 'utf8'));
const benchmark = parseEnv(readFileSync(join(root, '.env.benchmark.local'), 'utf8'));
const env = { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR,
  NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1', BOH_VOICE_TRIAL: '1', NEXT_PUBLIC_BOH_VOICE_TRIAL: '1',
  OPENROUTER_API_KEY: benchmark.OPENROUTER_API_KEY, ELEVENLABS_API_KEY: local.ELEVENLABS_API_KEY, XAI_API_KEY: local.XAI_API_KEY };
for (const name of ['OPENROUTER_API_KEY', 'ELEVENLABS_API_KEY', 'XAI_API_KEY']) if (!env[name]) throw new Error(`Missing private ${name} configuration.`);
const signing = join(base, 'signing-key');
try { writeFileSync(signing, randomBytes(32).toString('hex'), { flag: 'wx', mode: 0o600 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
if (!lstatSync(signing).isFile() || lstatSync(signing).isSymbolicLink()) throw new Error('Invalid local signing file.');
env.INGEST_TOKEN = readFileSync(signing, 'utf8');
env.NEXTAUTH_SECRET = env.INGEST_TOKEN;
writeFileSync(join(base, 'latest.json'), JSON.stringify({ runtime: relative(root, runtime), port, createdAt: new Date().toISOString() }, null, 2), { mode: 0o600 });
console.log(`Local Opus-low voice trial: http://localhost:${port}`);
console.log('Separate sessions, storage, and build. Voice uses OpenRouter and ElevenLabs. Existing servers remain running.');
console.log(`Snapshot: ${runtime}\nCtrl-C stops only this trial. Saved trial data is retained.`);
const child = spawn('npm', ['run', 'dev', '--', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: runtime, env, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.once('error', error => { console.error(error.message); process.exitCode = 1; });
child.once('exit', code => { process.exitCode = code ?? 0; });
