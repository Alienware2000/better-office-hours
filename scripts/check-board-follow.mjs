// Exercise the actual follow hook with scroll events delivered mid-animation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const slots = [], effects = [];
let cursor = 0;
const same = (a, b) => a && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const react = {
  useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
  useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = value; return [slots[i], next => { slots[i] = next; }]; },
  useCallback(callback, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) slots[i] = { callback, deps }; return slots[i].callback; },
  useLayoutEffect(effect, deps) { const i = cursor++; if (!same(slots[i], deps)) { slots[i] = deps; effects.push(effect); } },
};
const code = ts.transpileModule(fs.readFileSync('components/whiteboard/useBoardFollow.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = { exports: {} };
vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(() => react, mod, mod.exports);
let page = 1, reduced = false, pageOffset = 0;
const movements = [];
const scroll = {
  scrollTop: 0, scrollHeight: 600, clientHeight: 300,
  getBoundingClientRect: () => ({ top: 100, bottom: 400 }),
  querySelector: () => ({ getBoundingClientRect: () => ({ top: 100 + pageOffset - scroll.scrollTop }) }),
  scrollTo(value) { movements.push(value); if (value.behavior === 'instant') this.scrollTop = value.top; },
};
const render = () => {
  cursor = 0;
  const hook = mod.exports.useBoardFollow(page, true, reduced);
  hook.scrollRef.current = scroll;
  effects.splice(0).forEach(effect => effect());
  return hook;
};
let hook = render();
page = 2; pageOffset = 600; scroll.scrollHeight = 1200; hook = render();
assert.equal(movements.at(-1).top, 600);
scroll.scrollTop = 200; hook.scrollHandlers.onScroll();
assert.equal(hook.followRef.current, true, 'Intermediate smooth scrolling does not disable following');
hook = render(); assert.equal(hook.readingEarlier, false);
scroll.scrollTop = 600; hook.scrollHandlers.onScroll();
hook.scrollHandlers.onWheel(); scroll.scrollTop = 80; hook.scrollHandlers.onScroll();
hook = render(); assert.equal(hook.readingEarlier, true, 'Intentional history browsing stays available');
const before = movements.length;
hook.reveal({ getBoundingClientRect: () => ({ top: 900, bottom: 960 }) });
assert.equal(movements.length, before, 'Same-page additions do not pull the learner out of history');
page = 3; pageOffset = 1200; scroll.scrollHeight = 1800; hook = render();
assert.equal(movements.at(-1).top, 1200, 'A new working page resumes automatic following from history');
assert.equal(hook.readingEarlier, false);
scroll.scrollTop = 400; hook.scrollHandlers.onScroll();
hook.reveal({ getBoundingClientRect: () => ({ top: 950, bottom: 980 }) });
assert.equal(movements.at(-1).top, 1200, 'A visible mark cannot cancel an in-flight page transition');
scroll.scrollTop = 1200; hook.scrollHandlers.onScroll();
hook.reveal({ getBoundingClientRect: () => ({ top: 480, bottom: 520 }) });
assert.equal(movements.at(-1).top, 1344, 'New writing below the viewport is brought into view');
scroll.scrollTop = 1250; hook.scrollHandlers.onWheel();
assert.equal(movements.at(-1).behavior, 'instant', 'Manual input stops programmatic smooth scrolling');
scroll.scrollTop = 200; hook.scrollHandlers.onScroll(); hook = render();
assert.equal(hook.readingEarlier, true);
hook.latest(); assert.equal(movements.at(-1).top, 1200);
reduced = true; page = 4; pageOffset = 1800; scroll.scrollHeight = 2000; hook = render();
assert.equal(movements.at(-1).top, 1700, 'Short pages clamp to the scrollable end');
assert.equal(movements.at(-1).behavior, 'instant', 'Reduced motion skips animation');
hook.scrollHandlers.onScroll(); hook = render();
assert.equal(hook.readingEarlier, false);
console.log('PASS: new-page following, smooth-scroll events, reader control, new writing visibility, Latest, clamping, and reduced motion.');
