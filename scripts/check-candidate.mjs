// One repeatable offline gate. Individual checks use synthetic state/providers.
// Browser/acoustic and real-provider evaluations are explicitly separate.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { candidateManifest } from './candidate-manifest.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const checks=['candidate-profile','concept-lessons','concept-recovery','teaching-intent','teaching-panels','voice-lifecycle','request-deadlines','saved-sessions','workspace','board-refresh','board-writing','board-composition','diagrams','diagram-motion','math','structured-math','ink','teaching-repairs'];
const report={...candidateManifest(root),createdAt:new Date().toISOString(),kind:'offline-synthetic',checks:[],notTested:['human audio quality','real provider latency/cost','browser reload/PDF persistence','historical diagram playback']};
for(const name of checks){
  const result=spawnSync(process.execPath,['--require','./scripts/offline-network.cjs',`scripts/check-${name}.mjs`],{
    cwd:root,encoding:'utf8',timeout:60000,
    env:{...process.env,NODE_ENV:'test',BOH_VOICE_TRIAL:'',NEXT_PUBLIC_BOH_VOICE_TRIAL:'',VERCEL:''},
  });
  const passed=result.status===0;
  report.checks.push({name,passed,exitCode:result.status,error:result.error?.message,output:(result.stdout+result.stderr).slice(-12000)});
  console.log(`${passed?'PASS':'FAIL'} ${name}`);
  if(!passed)console.error((result.stderr||result.stdout).slice(-2500));
}
report.passed=report.checks.every(check=>check.passed);
const dir=resolve(root,'.data/evaluation/consolidation');mkdirSync(dir,{recursive:true,mode:0o700});
const file=resolve(dir,`offline-${Date.now()}.json`);writeFileSync(file,JSON.stringify(report,null,2),{mode:0o600});
console.log(`Evidence: ${file}`);
process.exitCode=report.passed?0:1;
