// Offline streams only. These scenes are synthetic test data, never fixtures
// selected by tutor behavior.
import assert from 'node:assert/strict';
import { repositoryModule } from './evaluation/render.mjs';
const { streamValidatedLesson } = repositoryModule('lib/agent/concept-stream');
const { parseAgentTurn } = repositoryModule('lib/agent/tags');
const { conceptResponse } = repositoryModule('lib/agent/concept-response');
const circle={op:'circle',id:'object',center:{x:.3,y:.5},r:.04};
const beat=(draw,speech)=>({pdf:'',draw:draw.map(JSON.stringify),animation:'',speech});
const first=beat([circle],'Here is the object.');
const blocked=beat([{op:'text',id:'premature',at:{x:.4,y:.7},text:'F = ma'}],'REJECTED SPEECH');
const good=beat([{op:'highlight',id:'object'}],'Which given describes this object?');
const lesson=beats=>({handoff:false,move:'orient',visual:'diagram',introduction:'',beats,question:''});
const original=lesson([first,blocked]);
const tail=lesson([good]);
async function run(responses,{abort=false,chunked=true}={}) {
  const calls=[], controller=new AbortController();let text='',error;
  try {
    for await(const delta of streamValidatedLesson(async recovery=>{
      calls.push(recovery);
      const raw=typeof responses[calls.length-1]==='string'?responses[calls.length-1]:JSON.stringify(responses[calls.length-1]);
      return (async function*(){for(const content of chunked?[...raw]:[raw]) yield {choices:[{delta:{content}}]};})();
    },{requireVisuals:true},controller.signal)) {
      text+=delta;
      if(abort && parseAgentTurn(text).board?.commands.length) controller.abort();
    }
  } catch(e){error=e;}
  return {calls,text,error,turn:parseAgentTurn(text)};
}
let result=await run([original,tail]);
assert.equal(result.error,undefined);
assert.equal(result.calls.length,2);
assert.equal(result.calls[1].failure.code,'disclosure_boundary');
assert.equal(result.calls[1].prefix.beats.length,1);
assert.equal(result.calls[1].remaining,2);
assert.deepEqual(result.turn.board.commands.map(c=>c.id),['object','object']);
assert.equal(result.turn.speech,'Here is the object. Which given describes this object?');
assert.ok(!result.text.includes('REJECTED') && !result.text.includes('ma'));
result=await run([lesson([first,good])]);assert.equal(result.calls.length,1);assert.equal(result.error,undefined);
// First-beat rejection and a provider coalescing the whole failed lesson into
// one chunk cannot smuggle a rejected prefix into recovery.
for(const source of [lesson([blocked]),original]) {
  result=await run([source,lesson([first,good])],{chunked:false});
  assert.equal(result.error,undefined);assert.equal(result.calls[1].prefix.beats.length,0);
  assert.ok(!result.text.includes('REJECTED'));
}
for(const badTail of [lesson([blocked]),{...tail,move:'explain'},{...tail,introduction:'Repeat the opening.'},lesson([good,good,good]),lesson([])]) {
  result=await run([original,badTail]);
  assert.ok(result.error);assert.equal(result.calls.length,2,'Never retry a second time');
  assert.ok(!result.text.includes('REJECTED') && !result.text.includes('Repeat the opening'));
}
result=await run([original,tail],{abort:true});assert.equal(result.calls.length,1);assert.equal(result.error.name,'AbortError');
result=await run(['{broken']);assert.equal(result.calls.length,1);assert.equal(result.error.name,'SyntaxError');
// TeX presentation of givens survives the real trial validator and downstream
// speech/board parser, with no extra provider request.
const given=beat([{op:'text',id:'given-1',at:{x:.4,y:.7},text:String.raw`v_0 = 12\,\mathrm{m/s}`}],'This is the stated starting speed.');
result=await run([lesson([first,given])]);assert.equal(result.calls.length,1);assert.equal(result.error,undefined);
assert.equal(result.turn.board.commands.length,2);
assert.ok(result.turn.board.commands.some(c=>c.id==='given-1'));
assert.throws(()=>conceptResponse(JSON.stringify(original),{requireVisuals:true}),e=>e.code==='disclosure_boundary');
console.log('PASS: early beats, single bounded continuation, pinned disclosure, no repeats/rejected output, current-object highlights, first-beat rejection, cancellation, and typeset givens.');
