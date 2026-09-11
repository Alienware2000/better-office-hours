// Portable export and interrupted-stream checks. Real IndexedDB/refresh/ink
// behavior is additionally checked in an isolated browser, not mocked here.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, imports = {}) {
  const mod = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`)(name => {
    if (!(name in imports)) throw new Error(`Unexpected runtime import: ${name}`);
    return imports[name];
  }, mod, mod.exports);
  return mod.exports;
}
const { newSession, exportSession, allTranscript, sessionTitle } = load('app/(session)/voice/saved-sessions.ts');
const first = newSession(), second = newSession();
assert.notEqual(first.id, second.id);
const student = { role: 'student', text: 'Explain this idea', at: '2026-09-11T20:00:00.000Z' };
const tutor = { role: 'tutor', text: 'Here is a useful comparison.', at: '2026-09-11T20:00:01.000Z' };
const board = { groups: [], student: [{ id: 'student-ink' }], earlierPages: [{ id: 1 }], animation: { id: 'current-motion' }, time: 1.2, playing: false };
first.voice = { kind: 'concept', current: { turns: [student,tutor], history: [{ role: 'assistant', content: tutor.text }], board },
  parked: { pset: null, concept: { turns: [student], history: [], board } } };
first.diagnostics = [{ kind: 'first_audio', at: tutor.at, elapsedMs: 9100, request: 'test-request' }];
assert.deepEqual(allTranscript(first), [student,tutor], 'Park/resume copies are not duplicate utterances');
assert.equal(sessionTitle(first), student.text);
assert.equal(sessionTitle({...first,renamed:true,title:'My own title'}), 'My own title');
const text = exportSession(first, 'txt'), data = exportSession(first, 'json');
assert.ok(text.text.includes(`[${student.at}] You: ${student.text}`));
assert.ok(text.text.includes(`[${tutor.at}] Tutor: ${tutor.text}`));
assert.notEqual(text.filename, exportSession(second,'txt').filename, 'Same-day sessions have distinct export filenames');
const roundtrip = JSON.parse(data.text);
assert.deepEqual(roundtrip.voice.current.board,board);
assert.deepEqual(roundtrip.transcript,[student,tutor]);
assert.equal(roundtrip.diagnostics[0].elapsedMs,9100);
assert.deepEqual(second.voice,null,'A new session does not inherit previous conversation or ink');
console.log('PASS: unique sessions/exports, parked-transcript deduplication, timestamps/roles, renamed titles, structured board/ink/animation/timing export.');

const route = load('app/api/agent/llm/route.ts', {
  '@/lib/agent/events': { asSessionEvent: () => null },
  '@/lib/agent/grok': { GROK_MODEL:'test-fast', GROK_DEEP_MODEL:'test-deep', usesConceptLesson:()=>true,
    streamGrok:async function*(){ yield '[TEACH move=explain visual=none]\nA complete sentence.\n'; throw new SyntaxError('Unterminated string in JSON at position 218'); } },
  '@/lib/pdf/live-page': { setLivePage:()=>{} },
  '@/lib/whiteboard/live-board': { asLiveBoard:()=>null,setLiveBoard:()=>{} },
  '@/lib/agent/tags': { parseAgentTurn:()=>({speech:'A complete sentence.'}) },
});
const response = await route.POST(new Request('http://localhost/api/agent/llm',{method:'POST',body:JSON.stringify({deep:true,messages:[]})}));
const events = (await response.text()).split('\n\n').filter(Boolean).map(line=>JSON.parse(line.slice(6)));
assert.equal(events[0].bohSpeechBoundary,true,'Completed structured units retain their playback boundary');
assert.ok(events.at(-1).error.message.includes('Your work is still here'));
assert.ok(!events.at(-1).error.message.includes('JSON at position'),'Parser internals stay out of the user-facing error');
console.log('PASS: structured SSE playback boundary and safe incomplete-response error, without discarding earlier streamed content.');
