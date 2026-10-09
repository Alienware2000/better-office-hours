// Local-only entry point. Does not stop other processes or alter saved data.
import { spawn } from 'node:child_process';
import { lstatSync, realpathSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--port')) {
  console.error('Usage: npm run dev:local -- [--port 3105]');
  process.exit(1);
}
const port = Number(args[1] ?? 3105);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Choose a port from 1024 to 65535.');
const data = resolve(root, '.data');
let dataStat;
try { dataStat = lstatSync(data); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (dataStat) {
  const location = relative(realpathSync(root), realpathSync(data));
  if (location === '..' || location.startsWith(`..${sep}`) || isAbsolute(location)) {
    throw new Error('Local .data points outside this worktree. Preserve it and choose an isolated checkout.');
  }
}
await new Promise((accept, reject) => {
  const probe = createServer();
  probe.once('error', () => reject(new Error(`Port ${port} is occupied. Identify its owner or choose --port; nothing was stopped.`)));
  probe.listen(port, '127.0.0.1', () => probe.close(accept));
});

// Empty values intentionally take precedence over Next's .env files as well
// as inherited shell credentials. Never point this local entry at cloud data.
const env = { ...process.env, NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1' };
for (const name of [
  'BLOB_READ_WRITE_TOKEN', 'BLOB_STORE_ID', 'VERCEL', 'VERCEL_OIDC_TOKEN',
  'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_URL',
]) env[name] = '';
console.log(`Better Office Hours: http://localhost:${port}`);
console.log(`Worktree: ${root}\nStorage: ${data} (local only); Google sign-in disabled.`);
console.log('Voice uses the configured tutor provider and ElevenLabs credentials when you start speaking. Ctrl-C stops this server.');
const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', String(port)],
  { cwd: root, env, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.once('error', error => { console.error(error.message); process.exitCode = 1; });
child.once('exit', (code, signal) => { process.exitCode = code ?? (signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1); });
