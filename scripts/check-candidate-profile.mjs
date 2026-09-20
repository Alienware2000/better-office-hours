// Offline profile/gating checks. No provider client is constructed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const code = ts.transpileModule(fs.readFileSync('lib/agent/trial.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
for (const [env, expected] of [
  [{NODE_ENV:'development'},false],
  [{NODE_ENV:'development',BOH_VOICE_TRIAL:'1'},true],
  [{NODE_ENV:'production',BOH_VOICE_TRIAL:'1'},false],
  [{NODE_ENV:'development',BOH_VOICE_TRIAL:'1',VERCEL:'1'},false],
]) {
  const mod={exports:{}};
  vm.runInNewContext(`(function(module,exports){${code}\n})(module,module.exports)`,{module:mod,process:{env}});
  assert.equal(mod.exports.trialEnabled(), expected);
  const profile=mod.exports.TRIAL_PROFILE;
  assert.equal(profile.id,'opus-low-v1'); assert.equal(profile.model,mod.exports.TRIAL_MODEL);
  assert.equal(profile.effort,'low'); assert.equal(profile.maxTokens,8000);
  assert.equal(profile.requestTimeoutMs,60000); assert.equal(profile.maxRetries,0);
  assert.equal(profile.provider.allow_fallbacks,false);
}
console.log('PASS: pinned candidate and default/development/production/Vercel isolation.');
