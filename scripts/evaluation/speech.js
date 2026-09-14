/* global api, safe, $, el, seconds, state */
let speechManifest=null, playing=false, playbackEpoch=0, renderEpoch=0;
const player=$('#listen-audio');
async function speechState(){
  const data=await api('/api/speech'); speechManifest=data.manifest;
  $('#prepare-speech').disabled=data.task.state==='preparing'||playing;
  $('#prepare-speech').textContent=speechManifest?'Audio prepared':'Prepare comparison audio';
  $('#prepare-speech').hidden=Boolean(speechManifest)&&data.task.state!=='failed';
  $('#play-comparison').disabled=!speechManifest||playing;
  if(!playing&&(playbackEpoch===0||data.task.state==='preparing'||data.task.error))$('#speech-status').textContent=data.task.state==='preparing'?`Preparing audio: ${data.task.completed}/${data.task.total} clips · ${data.task.current}`:data.task.error|| (speechManifest?'Ready. Press Play comparison to hear all three. Replays are free.':'Audio has not been prepared yet.');
  if(speechManifest&&!$('#listen-models').childElementCount)for(let i=0;i<speechManifest.lessons.length;i++){
    const b=el('button',`Listen to ${speechManifest.lessons[i].model.split('/').pop()}`);b.onclick=safe(()=>playLessons([i]));$('#listen-models').append(b);
  }
}
function stopSpeech(){playbackEpoch++;renderEpoch++;playing=false;player.hidden=true;player.pause();player.removeAttribute('src');player.load();$('#stop-speech').disabled=true;$('#play-comparison').disabled=!speechManifest;$('#speech-status').textContent='Stopped. Choose Play comparison to restart.';player.dispatchEvent(new Event('review-stop'));}
function applyBoard(report){
  const area=$('#listen-board');area.replaceChildren();
  for(const page of report.rendering.pages){area.append(el('p',`Page ${page.page}`,'page-label'));const b=el('div',null,'board');b.innerHTML=page.svg;area.append(b);}
  $('#listen-warning').textContent=(report.rendering.warnings??[]).join(' ');
  return Math.max(0,...report.rendering.pages.map(p=>p.duration));
}
async function showBoard(id,stage,time,epoch){
  const request=++renderEpoch;
  const report=await api(`/api/report?id=${id}&stage=${stage}&time=${time}`);
  if(epoch!==playbackEpoch||request!==renderEpoch)return;
  return applyBoard(report);
}
async function playLessons(indices){
  stopSpeech();const epoch=playbackEpoch;let scrolled=false;playing=true;$('#play-comparison').disabled=true;$('#stop-speech').disabled=false;$('#listen-stage').hidden=false;
  try{
    for(const i of indices){
      const lesson=speechManifest.lessons[i];if(epoch!==playbackEpoch)return;
      $('#listen-title').textContent=lesson.model.split('/').pop();
      $('#listen-metrics').textContent=`Recorded speech readiness: ${seconds(lesson.firstSpeechReadyMs)} · Board readiness: ${seconds(lesson.firstBoardReadyMs)} · Model cost: ${lesson.cost==null?'unknown':'$'+lesson.cost.toFixed(4)} · Voice: same Jessica / ${speechManifest.ttsModel}. TTS dollar cost unavailable.`;
      for(const stage of lesson.stages){
        if(epoch!==playbackEpoch)return;
        let duration=0,frameBusy=false;
        if(!stage.audioKey){await showBoard(lesson.id,stage.stage,0,epoch);continue;}
        $('#speech-status').textContent=`Playing ${i+1}/${speechManifest.lessons.length}: ${lesson.model.split('/').pop()} · ${stage.stage==='0'?'introduction':stage.stage==='final'?'closing question':'beat '+stage.stage}`;
        const prepared=await api(`/api/report?id=${lesson.id}&stage=${stage.stage}&time=0`);
        if(epoch!==playbackEpoch)return;
        renderEpoch++;
        player.hidden=false;player.src=`/api/audio?key=${stage.audioKey}`;
        let started=false;
        const playStart=()=>{if(epoch!==playbackEpoch||started)return;started=true;$('#listen-caption').textContent=stage.text;duration=applyBoard(prepared);if(!scrolled){scrolled=true;$('#listen-stage').scrollIntoView({behavior:'smooth',block:'start'});}};
        const tick=async()=>{if(frameBusy||!duration||player.paused||epoch!==playbackEpoch)return;frameBusy=true;try{await showBoard(lesson.id,stage.stage,player.currentTime,epoch);}catch{ $('#listen-warning').textContent='Board refresh failed; audio is still playing.'; }finally{frameBusy=false;}};
        player.addEventListener('playing',playStart);player.addEventListener('timeupdate',tick);
        await new Promise((resolve,reject)=>{
          const cleanup=()=>{player.removeEventListener('ended',end);player.removeEventListener('error',fail);player.removeEventListener('review-stop',end);player.removeEventListener('playing',playStart);player.removeEventListener('timeupdate',tick);};
          const end=()=>{cleanup();resolve();};const fail=()=>{cleanup();reject(new Error('Audio playback failed. Use Play comparison to retry the cached clips.'));};
          player.addEventListener('ended',end,{once:true});player.addEventListener('error',fail,{once:true});player.addEventListener('review-stop',end,{once:true});player.play().catch(e=>{cleanup();reject(e);});
        });
      }
    }
    if(epoch===playbackEpoch)$('#speech-status').textContent='Comparison finished. Which explanation felt clearest, and did the board match what you heard?';
  }finally{if(epoch===playbackEpoch){playing=false;$('#stop-speech').disabled=true;$('#play-comparison').disabled=false;}}
}
$('#prepare-speech').onclick=safe(async()=>{await api('/api/speech/prepare',{});await speechState();});
$('#play-comparison').onclick=safe(()=>playLessons(speechManifest.lessons.map((_,i)=>i)));
$('#stop-speech').onclick=stopSpeech;
window.addEventListener('pagehide',stopSpeech);
const speechPoll=setInterval(safe(async()=>{if(state)await speechState();}),1500);
window.addEventListener('pagehide',()=>clearInterval(speechPoll));
