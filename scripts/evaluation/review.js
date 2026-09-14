'use strict';
const $ = (s, p = document) => p.querySelector(s);
const el = (tag, text, className) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (className) n.className = className; return n; };
const seconds = n => n == null ? 'Unavailable' : `${(n / 1000).toFixed(1)}s`;
const name = model => model?.split('/').pop() ?? 'Unknown';
let state, busy = false, lastReportIds = '';
const drafts = new Map();
const slots = [{ node: $('#left'), id: null, stage: 'final', time: 0, version: 0 }, { node: $('#right'), id: null, stage: 'final', time: 0, version: 0 }];
function message(text = '') { $('#message').textContent = text; }
async function api(url, value) { const r = await fetch(url, value === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Review-Token': state.csrf }, body: JSON.stringify(value) }); const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Request failed'); return data; }
function safe(action) { return (...args) => { try { return Promise.resolve(action(...args)).catch(e => message(e.message)); } catch (e) { message(e.message); } }; }
function options(select, values, current) { select.replaceChildren(...values.map(([value, label]) => { const o = el('option', label); o.value = value; return o; })); if (values.some(v => v[0] === current)) select.value = current; }
function filtered() { return state.reports.filter(r => $('#case-filter').value === 'all' || r.case === $('#case-filter').value); }
function label(r) { return `${name(r.model)} · ${r.effort ?? 'default'} · ${r.maxTokens} · ${r.case.replace('-explanation','')} · ${new Date(r.generatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`; }
function metrics(r, parent) { parent.replaceChildren(); for (const [field, title] of [['firstSpeechReadyMs','FIRST SPEECH TEXT READY'],['firstBoardReadyMs','BOARD DATA READY'],['totalMs','FULL GENERATION (SECONDARY)']]) { const m = el('div', null, 'metric'); m.append(el('strong', seconds(r[field])), el('span', title)); const bar = el('div', null, 'timing'), fill = el('i'); fill.style.width = `${r[field] == null ? 0 : Math.min(100, r[field] / Math.max(r.totalMs ?? 60000, 1) * 100)}%`; bar.append(fill); m.append(bar); parent.append(m); } }
function details(parent, title, value) { const d = el('details'); d.append(el('summary', title), el('pre', typeof value === 'string' ? value : JSON.stringify(value, null, 2))); parent.append(d); }
async function render(slot) {
  const version = ++slot.version, list = filtered();
  if (!list.some(r => r.id === slot.id)) slot.id = list[0]?.id;
  if (!slot.id) { slot.node.replaceChildren(el('p', 'No reports for this lesson yet. Start a comparison below.')); return; }
  const r = await api(`/api/report?id=${slot.id}&stage=${slot.stage}&time=${slot.time}`);
  if (version !== slot.version) return;
  const n = slot.node; n.replaceChildren();
  const picker = el('select', null, 'report-picker'); picker.setAttribute('aria-label', `Result ${slot === slots[0] ? 'A' : 'B'}`); options(picker, list.map(r => [r.id, label(r)]), slot.id); picker.onchange = safe(async () => { slot.id = picker.value; slot.stage = 'final'; slot.time = 0; await render(slot); }); n.append(picker);
  n.append(el('h2', name(r.model)), el('p', `${r.provider ?? 'Provider not recorded'} · effort ${r.effort ?? 'default'} · ${r.maxTokens} tokens · ${r.cost == null ? 'cost not reported' : '$' + r.cost.toFixed(4)} usage`, 'model-meta'));
  const m = el('div', null, 'metrics'); metrics(r, m); n.append(m, el('p', r.prompt, 'prompt'));
  if (r.failure) n.append(el('p', `Integration failure: ${r.failure}. This is not a usable tutor response.`, 'failure'));
  if (r.rendering.error) n.append(el('p', r.rendering.error, 'failure'));
  if (r.rendering.stages.length) { const controls = el('div', null, 'board-controls'), select = el('select'); select.setAttribute('aria-label','Board stage'); options(select, r.rendering.stages.map(s => [s.value, s.label]), slot.stage); select.onchange = safe(async () => { slot.stage = select.value; slot.time = 0; await render(slot); }); controls.append(el('span', 'RECONSTRUCTED BOARD', 'eyebrow'), select); n.append(controls); const duration = Math.max(...r.rendering.pages.map(p => p.duration)); if (duration > 0) { const slider = el('input'); slider.type = 'range'; slider.min = 0; slider.max = duration; slider.step = .1; slider.value = slot.time; slider.setAttribute('aria-label', 'Animation time'); slider.onchange = safe(async () => { slot.time = Number(slider.value); await render(slot); }); controls.append(slider, el('span', `${slot.time.toFixed(1)} / ${duration}s`, 'small')); } }
  for (const page of r.rendering.pages) { n.append(el('p', `Page ${page.page}`, 'page-label')); const board = el('div', null, 'board'); board.innerHTML = page.svg; n.append(board); }
  for (const warning of r.rendering.warnings ?? []) n.append(el('p', warning, 'warning'));
  n.append(el('p', r.rendering.speech || r.acceptedSpeech || 'No accepted speech.', 'speech'));
  if(r.words > 70) n.append(el('p', 'This response exceeds the current 70-word speech guidance.', 'warning'));
  n.append(el('p', `${r.words} spoken words in full response · ${r.eventCount ? r.eventCount + ' recorded progress snapshots' : 'historical readiness milestones only'}`, 'small'));
  details(n, 'What to judge in this lesson', r.reviewCriteria);
  details(n, 'Raw model response', r.rawContent);
  details(n, 'What the app accepted: speech and board commands', {speech:r.acceptedSpeech, board:r.acceptedBoard, unresolvedHighlightIds:r.unresolvedHighlightIds});
  details(n, 'Recorded progress timeline', r.events.length ? r.events : 'No incremental snapshots were captured for this historical report.');
  details(n, 'Exact model input and test provenance', {inputMessages:r.inputMessages ?? 'Current input differs from the saved hash; original full input unavailable.',inputSha256:r.inputSha256,revision:r.revision,dirty:r.dirty,source:r.source,firstContentMs:r.firstContentMs,temperature:r.temperature});
  const draft = drafts.get(r.id), judgment = draft ?? r.rating;
  const form = el('form', null, 'ratings'); form.append(el('span','YOUR JUDGMENT','eyebrow')); const fields = el('div', null, 'rating-fields');
  for (const [key,title] of [['correctness','Correctness'],['teaching','Teaching'],['visuals','Speech + board agreement']]) { const l = el('label',title), select = el('select'); select.name=key; options(select,[['unrated','Unrated'],['pass','Looks good'],['concern','Needs work']],judgment?.[key] ?? 'unrated'); l.append(select); fields.append(l); }
  const notes=el('textarea'); notes.name='notes'; notes.maxLength=4000; notes.placeholder='What worked? What felt wrong or slow?'; notes.setAttribute('aria-label','Review notes'); notes.value=judgment?.notes ?? ''; const row=el('div',null,'save-row'), save=el('button','Save my review'), status=el('span',draft ? 'Unsaved changes' : r.rating ? 'Saved locally' : 'Not reviewed','save-status'); save.type='submit'; row.append(save,status); form.append(fields,notes,row);
  form.oninput=form.onchange=()=>{drafts.set(r.id,Object.fromEntries(new FormData(form)));status.textContent='Unsaved changes';};
  form.onsubmit=safe(async e=>{e.preventDefault(); const data=Object.fromEntries(new FormData(form)); await api('/api/rating',{id:r.id,...data}); drafts.delete(r.id);status.textContent='Saved locally';}); n.append(form);
}
function refreshPickers() { for (const s of slots) { const p=$('.report-picker',s.node); if(p) options(p,filtered().map(r=>[r.id,label(r)]),s.id); } }
function spec() { return {models:[...document.querySelectorAll('[name=model]:checked')].map(i=>i.value),cases:$('#run-case').value === 'all' ? state.cases.map(c=>c.id) : [$('#run-case').value],repeats:Number($('#repeats').value)}; }
function count() { if(!state)return; const s=spec(),n=s.models.length*s.cases.length*s.repeats; $('#run').textContent=`Run paid comparison · ${n} requests`; $('#run').disabled=busy || state.job?.state==='running' || n<1 || n>10; }
async function updateLive() { const j=state.job; $('#live').hidden=!j; if(!j)return; const active=j.state==='running'; $('#live-title').textContent=active?'Comparison running':`Comparison ${j.state}`; $('#cancel').hidden=!active; $('#review-new').hidden=active||!j.results.length; $('#live-status').textContent=j.error || `${j.completed} of ${j.total} requests completed${j.current ? ` · ${name(j.current.model)} · ${j.current.caseId} · ${Math.floor((Date.now()-j.current.startedAt)/1000)}s elapsed` : ''}`; if(j.current) { const p=j.current.progress??{}; metrics(p,$('#live-metrics')); $('#live-speech').textContent=p.speech||'Waiting for usable speech text…'; const board=await api('/api/live-board'); $('#live-board').innerHTML=board.svg??''; } else { $('#live-metrics').replaceChildren(); $('#live-speech').textContent='Completed reports include raw output, accepted commands, timing, and captured progress.'; $('#live-board').replaceChildren(); } }
$('#case-filter').onchange=safe(async()=>{slots.forEach(s=>{s.id=null;s.stage='final';s.time=0;}); const list=filtered(); slots[1].id=list[1]?.id; await Promise.all(slots.map(render));});
$('#run-form').onchange=count;
$('#run-form').onsubmit=safe(async e=>{e.preventDefault();busy=true;count();try{await api('/api/run',spec());message('Comparison started. Live progress is shown below.');$('#live').hidden=false;$('#live').scrollIntoView({behavior:'smooth',block:'start'});}finally{busy=false;await poll();}});
$('#cancel').onclick=safe(async()=>{await api('/api/cancel',{});message('Cancellation requested. Any completed report remains available.');});
$('#review-new').onclick=safe(async()=>{message();const ids=state.job.results;$('#case-filter').value='all';slots.forEach((s,i)=>{s.id=ids[Math.max(0,ids.length-2)+i]??ids[0];s.stage='final';s.time=0;});await Promise.all(slots.map(render));$('#comparison').scrollIntoView({behavior:'smooth'});});
$('#export').onclick=safe(async()=>{const data=await api('/api/reviews'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=el('a');a.href=url;a.download='tutor-reviews.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
async function poll(){state=await api('/api/state');$('#report-count').textContent=`${state.reports.length} recorded responses`;const ids=state.reports.map(r=>r.id).join(',');if(ids!==lastReportIds){refreshPickers();lastReportIds=ids;}count();await updateLive();}
safe(async()=>{await poll();options($('#case-filter'),[['all','All subjects'],...state.cases.map(c=>[c.id,c.id.replaceAll('-',' ')])],'all');options($('#run-case'),[...state.cases.map(c=>[c.id,c.id.replaceAll('-',' ')]),['all','All five lessons']],'biology-explanation');for(const [i,model] of state.models.entries()){slots[i].id=state.reports.find(r=>r.model===model&&r.effort==='low'&&r.maxTokens===8000)?.id;}await Promise.all(slots.map(render));count();setInterval(safe(poll),2000);})();
