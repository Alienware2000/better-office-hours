// Cache synthetic lesson audio only. GET and replay never invoke a provider.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { parseEnv } from 'node:util';
import { repositoryModule, spokenStages } from './render.mjs';
const candidates = ['anthropic/claude-opus-5', 'openai/gpt-6-astra', 'anthropic/claude-fable-5.1'];
const hash = value => createHash('sha256').update(value).digest('hex');
function safePath(file) {
  for(let p=path.resolve(file);p!==path.dirname(p);p=path.dirname(p)) {
    try { if(fs.lstatSync(p).isSymbolicLink()) throw new Error('Unsafe speech path'); }
    catch(e) { if(e.code!=='ENOENT') throw e; }
  }
}
function write(file, data) {
  safePath(file);fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
  const temp=file+'.'+randomUUID()+'.tmp';fs.writeFileSync(temp,data,{flag:'wx',mode:0o600});fs.renameSync(temp,file);
}
export function createSpeechReview({root,dataRoot,records,synthesize}) {
  const folder=path.join(dataRoot,'speech'), manifestPath=path.join(folder,'comparison.json');
  safePath(folder);
  let task={state:'idle',completed:0,total:0}, manifest=null;
  try {safePath(manifestPath);manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));} catch { /* No previous prepared comparison. */ }
  const {normalizeSpokenText}=repositoryModule('lib/agent/spoken-text');
  function audioFile(key) {
    if(!/^[a-f0-9]{64}$/.test(key))throw new Error('Invalid audio key');
    const file=path.join(folder,key+'.mp3');safePath(file);return file;
  }
  async function prepare() {
    if(task.state==='preparing')return;
    task={state:'preparing',completed:0,total:0,current:'Preparing comparison',error:null};
    try {
      const selected=candidates.map(model=>records().find(r=>r.result.modelRequested===model&&r.result.case==='astronomy-explanation'&&r.report.effort==='low'&&r.request.maxTokens===8000&&!r.result.failure));
      if(selected.some(r=>!r)||new Set(selected.map(r=>r.request.inputSha256)).size!==1)throw new Error('Matching reports unavailable');
      // Only the speech key/model are imported, never storage/auth/provider settings.
      if(!synthesize) {
        const envFile=path.join(root,'.env.local');safePath(envFile);
        const env=parseEnv(fs.readFileSync(envFile,'utf8'));
        if(!env.ELEVENLABS_API_KEY)throw new Error('Voice credential unavailable');
        process.env.ELEVENLABS_API_KEY=env.ELEVENLABS_API_KEY;
        if(env.ELEVENLABS_TTS_MODEL)process.env.ELEVENLABS_TTS_MODEL=env.ELEVENLABS_TTS_MODEL;
      }
      const config=repositoryModule('lib/agent/elevenlabs');
      const route=synthesize?null:repositoryModule('app/api/agent/tts/route');
      const version=hash(fs.readFileSync(path.join(root,'app/api/agent/tts/route.ts')));
      const lessons=selected.map(record=>({id:record.id,model:record.result.modelRequested,provider:record.result.providerReturned,
        firstSpeechReadyMs:record.result.firstSpeechReadyMs,firstBoardReadyMs:record.result.firstBoardReadyMs,cost:record.result.usage?.cost??null,
        stages:spokenStages(record.result).map(s=>({...s,spokenText:normalizeSpokenText(s.text)}))}));
      task.total=lessons.reduce((n,l)=>n+l.stages.filter(s=>s.spokenText).length,0);
      if(task.total>15||lessons.some(l=>l.stages.reduce((n,s)=>n+s.spokenText.length,0)>6000))throw new Error('Speech bound exceeded');
      for(const lesson of lessons)for(const stage of lesson.stages) {
        if(!stage.spokenText)continue;
        task.current=`${lesson.model.split('/').pop()} · ${stage.stage==='0'?'Introduction':stage.stage==='final'?'Closing question':'Beat '+stage.stage}`;
        const key=hash(JSON.stringify({text:stage.spokenText,voice:config.ELEVENLABS_VOICE_ID,model:config.ELEVENLABS_TTS_MODEL,version}));
        const file=audioFile(key),metadata=file+'.json';let info;
        if(fs.existsSync(file)&&fs.existsSync(metadata)){safePath(metadata);info=JSON.parse(fs.readFileSync(metadata,'utf8'));}
        else {
          const start=performance.now();
          const response=synthesize?await synthesize(stage.spokenText):await route.POST(new Request('http://localhost/review-speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:stage.spokenText}),signal:AbortSignal.timeout(60_000)}));
          if(!response.ok||!response.headers.get('content-type')?.includes('audio/'))throw new Error('Speech generation failed');
          const bytes=Buffer.from(await response.arrayBuffer());
          if(bytes.length<100||bytes.length>5_000_000)throw new Error('Invalid audio size');
          info={synthesisMs:Math.round(performance.now()-start),characters:stage.spokenText.length,generatedAt:new Date().toISOString(),dollarCost:null};
          write(file,bytes);write(metadata,JSON.stringify(info));
        }
        Object.assign(stage,{audioKey:key,...info});task.completed++;
      }
      manifest={version:1,preparedAt:new Date().toISOString(),voice:config.ELEVENLABS_VOICE_ID,ttsModel:config.ELEVENLABS_TTS_MODEL,
        note:'Newly synthesized replay of saved synthetic astronomy responses. Board stages follow clip playback. Original model waits are displayed separately; this is not a fresh voice-loop latency measurement. TTS dollar cost is not returned by this route.',lessons};
      write(manifestPath,JSON.stringify(manifest,null,2));task.state='ready';task.current='Ready to listen';
    } catch {task.state='failed';task.error='Audio preparation stopped. Completed clips are cached. Check matching reports, voice configuration, or provider availability before retrying.';}
  }
  return {state:()=>({task,manifest}),prepare,audio:key=>{
    if(!manifest?.lessons.some(l=>l.stages.some(s=>s.audioKey===key)))throw new Error('Audio not in comparison');
    return fs.readFileSync(audioFile(key));
  }};
}
