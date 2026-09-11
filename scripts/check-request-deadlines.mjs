import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const code = ts.transpileModule(fs.readFileSync('app/(session)/voice/request-timeout.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function clock() {
  let now = 0, id = 0;
  const timers = new Map(), loaded = { exports: {} };
  vm.runInNewContext(`(function(module,exports){${code}\n})(module,module.exports)`, {
    module: loaded, AbortController,
    setTimeout(fn, delay) { const key = ++id; timers.set(key, { at: now + delay, fn }); return key; },
    clearTimeout(key) { timers.delete(key); },
  });
  return { run: loaded.exports.withRequestTimeout, timers, advance(to) {
    for (;;) {
      const next = [...timers].filter(([, t]) => t.at <= to).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      now = next[1].at; timers.delete(next[0]); next[1].fn();
    }
    now = to;
  } };
}
const limits = { idleMilliseconds: 20000, totalMilliseconds: 60000 };
{
  const c = clock(); let progress, finish;
  const result = c.run(undefined, 30000, 'Stopped', (_signal, next) => { progress = next; return new Promise(resolve => { finish = resolve; }); }, limits);
  c.advance(27000); progress(); // First completed narration/drawing beat.
  c.advance(34000); progress(); // Animation spec arrives after the old deadline.
  c.advance(40000); finish('drawn');
  assert.equal(await result, 'drawn');
  assert.equal(c.timers.size, 0);
  progress(); assert.equal(c.timers.size, 0, 'Late progress cannot revive a completed request');
}
for (const scenario of ['initial', 'idle', 'total', 'cancel']) {
  const c = clock(), parent = new AbortController(); let progress, signal;
  const result = c.run(parent.signal, 30000, 'Stopped', (current, next) => { signal = current; progress = next; return new Promise(() => {}); }, limits);
  const rejected = assert.rejects(result, scenario === 'cancel' ? { name: 'AbortError' } : /Stopped/);
  if (scenario === 'initial') c.advance(30000);
  if (scenario === 'idle') { c.advance(10000); progress(); c.advance(30000); }
  if (scenario === 'total') { for (let t = 10000; t < 60000; t += 10000) { c.advance(t); progress(); } c.advance(60000); }
  if (scenario === 'cancel') { c.advance(10000); progress(); parent.abort(); }
  await rejected;
  assert.ok(signal.aborted, scenario);
  assert.equal(c.timers.size, 0, scenario + ' cleans all deadlines');
  progress(); assert.equal(c.timers.size, 0);
}
console.log('PASS: narrated streams finish beyond the old deadline; initial/idle stalls, total ceiling, cancellation, and late progress remain bounded.');
