// Engineering metadata only. Never read environment files or saved sessions.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
export function candidateManifest(root) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const paths = [...new Set(git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0'))]
    .filter(path => /^(app\/|lib\/|components\/|scripts\/|public\/|package(?:-lock)?\.json$|next\.config\.|tsconfig\.json$)/.test(path)).sort();
  const hash = createHash('sha256');
  for (const path of paths) {
    try { hash.update(path).update('\0').update(readFileSync(join(root, path))).update('\0'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; hash.update(path).update('\0deleted\0'); }
  }
  return { sourceRevision: git('rev-parse', 'HEAD'), dirty: Boolean(git('status', '--porcelain')),
    sourceSha256: hash.digest('hex'), profileSource: 'lib/agent/trial.ts',
    profileSha256: createHash('sha256').update(readFileSync(join(root, 'lib/agent/trial.ts'))).digest('hex'),
  };
}
