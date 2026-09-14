import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createSpeechReview} from './evaluation/speech.mjs';
import {readReports} from './review-tutor-models.mjs';
import {spokenStages} from './evaluation/render.mjs';
const root=process.cwd(),dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'boh-speech-check-'));
const models=['anthropic/claude-opus-5','openai/gpt-6-astra','anthropic/claude-fable-5.1'];
const lesson={handoff:false,move:'explain',visual:'notes',introduction:'Consider a circle.',beats:[{pdf:'',draw:[JSON.stringify({op:'circle',id:'object',center:{x:.4,y:.4},r:.1})],animation:'',speech:'The circle is an object.'}],question:'What do you notice?'};
const records=models.map((model,i)=>({id:String(i),request:{maxTokens:8000,inputSha256:'same-input'},report:{effort:'low'},result:{case:'astronomy-explanation',modelRequested:model,appParsed:true,rawContent:JSON.stringify(lesson),failure:null}}));
let calls=0;
const synthesize=async text=>{calls++;assert.ok(!text.includes('[DRAW'));return new Response(Buffer.alloc(512,1),{headers:{'Content-Type':'audio/mpeg'}});};
try{
  const service=createSpeechReview({root,dataRoot:dir,records:()=>records,synthesize});
  assert.equal(service.state().task.state,'idle');assert.equal(calls,0);
  await service.prepare();assert.equal(service.state().task.state,'ready');assert.equal(calls,3,'Identical text/voice/settings shared across models is cached');
  const manifest=service.state().manifest;assert.equal(manifest.lessons.length,3);
  assert.deepEqual(spokenStages(records[0].result).map(s=>s.text),['Consider a circle.','The circle is an object.','What do you notice?']);
  assert.ok(manifest.lessons.every(l=>l.stages.every(s=>s.audioKey)));
  const key=manifest.lessons[0].stages[0].audioKey;
  assert.equal(service.audio(key).length,512);assert.throws(()=>service.audio('../secret'));assert.throws(()=>service.audio('a'.repeat(64)));
  assert.equal(fs.statSync(path.join(dir,'speech',key+'.mp3')).mode&0o777,0o600);
  await service.prepare();assert.equal(calls,3,'Preparing again does not spend credits for existing clips');
  const restored=createSpeechReview({root,dataRoot:dir,records:()=>records,synthesize});assert.equal(restored.state().manifest.lessons.length,3);assert.equal(restored.audio(key).length,512);
  const failed=createSpeechReview({root,dataRoot:path.join(dir,'failed'),records:()=>records,synthesize:async()=>new Response('{}',{status:429})});await failed.prepare();assert.equal(failed.state().task.state,'failed');assert.equal(failed.state().manifest,null);
  assert.equal(readReports(dir).length,0,'Audio metadata is not a model report');
  console.log('PASS: same-input selection, accepted speech boundaries, cached synthesis, private files, safe audio lookup, persistent replay, failures, and no live API calls.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
