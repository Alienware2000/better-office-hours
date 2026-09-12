// Run against an isolated built copy, never the user's active dev session:
// BOH_TEST_BASE_URL=http://localhost:3103 PLAYWRIGHT_MODULE=/path/to/playwright node scripts/check-session-recovery.mjs
// Fresh browser profile, synthetic transcript/board/PDF. Real device access and model calls disabled.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import ts from 'typescript';
const external = createRequire(import.meta.url);
const base = process.env.BOH_TEST_BASE_URL;
if (!base || !['localhost','127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Set BOH_TEST_BASE_URL to an isolated local server.');
const { chromium } = external(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = fs.mkdtempSync(path.join(tmpdir(), 'boh-session-recovery-'));
function testPdf() {
  const content = 'BT /F1 16 Tf 70 720 Td (Session recovery test) Tj 0 -60 Td (Annotate this sample page.) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [4 0 R 6 0 R] /Count 2 >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents 5 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents 7 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf='%PDF-1.4\n'; const offsets=[0];
  for (const [i,object] of objects.entries()) { offsets.push(Buffer.byteLength(pdf)); pdf+=`${i+1} 0 obj\n${object}\nendobj\n`; }
  const start=Buffer.byteLength(pdf);
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(offset=>`${String(offset).padStart(10,'0')} 00000 n \n`).join('');
  return Buffer.from(pdf+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`);
}
const cache=new Map();function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInThisContext(`(function(require,module,exports){${js}\n})`,{filename:file})(n=>n.startsWith('@/')?load(n.slice(2)+'.ts'):n.startsWith('.')?load(path.resolve(path.dirname(file),n)+'.ts'):external(n),m,m.exports);return m.exports;}
const b=load('lib/whiteboard/store.ts'),s=load('app/(session)/voice/saved-sessions.ts');
b.resetBoard();b.applyDrawCommands([{op:'text',id:'topic',at:{x:.5,y:.1},text:'Earlier comparison',size:'s'}]);b.addStudentStroke({id:'earlier-ink',tool:'pen',color:'blue',points:[{x:.2,y:.5},{x:.4,y:.55}]});b.continueBoardPage();
b.applyDrawCommands([{op:'text',id:'topic',at:{x:.5,y:.09},text:'Components and motion',size:'s'},{op:'line',id:'ground',from:{x:.1,y:.65},to:{x:.9,y:.65}},{op:'circle',id:'body',center:{x:.2,y:.62},r:.025}]);
const points=Array.from({length:25},(_,i)=>{const u=i/24;return {x:.2+.6*u,y:.62-1.28*u*(1-u)}});
b.loadAnimation({id:'sample-motion',duration:6,shapes:[{kind:'path',id:'trajectory',points,keyframes:[{t:0,drawn:0,color:'muted'},{t:6,drawn:1,color:'muted'}]},{kind:'dot',id:'body',keyframes:[{t:0,at:{follow:{pathId:'trajectory'}},r:.025,color:'ink'}]},{kind:'arrow',id:'velocity',label:'v',diagram:{attach:{to:'body',anchor:'center'}},keyframes:[{t:0,from:{x:0,y:0},to:{x:.12,y:-.15}},{t:3,from:{x:0,y:0},to:{x:.12,y:0}},{t:6,from:{x:0,y:0},to:{x:.12,y:.15}}]},...['x','y'].map(axis=>({kind:'arrow',id:'component-'+axis,label:'v_'+axis,diagram:{component:{of:'velocity',axis}},keyframes:[{t:0,from:{x:0,y:0},to:{x:0,y:0},color:axis==='x'?'ink':'accent'}]}))]});
b.pauseAnimation();b.seekAnimation(2);b.applyDrawCommands([{op:'text',id:'note-acceleration',at:{x:.5,y:.32},text:'a_x = 0, a_y = -g',size:'s'}]);b.addStudentStroke({id:'own-work',tool:'pen',color:'blue',points:[{x:.1,y:.93},{x:.25,y:.91},{x:.35,y:.94}]});for(const g of b.getBoardState().groups)b.markGroupShown(g.id);
const session=s.newSession();session.title='Motion discussion';session.renamed=true;session.voice={kind:'concept',current:{history:[{role:'user',content:'Help me picture this motion.'},{role:'assistant',content:'The two directions share the same time.'}],turns:[{role:'student',text:'Help me picture this motion.',at:session.createdAt},{role:'tutor',text:'The two directions share the same time.',at:new Date(Date.now()+1).toISOString()}],board:structuredClone(b.getBoardState())},parked:{pset:null,concept:null}};
session.notes={id:'test-pdf',title:'Test notes',fileUrl:'/test-notes.pdf'};session.pdf={'test-pdf':{current:0,zoom:1,ink:{past:[],present:[{id:'pdf-ink',page:0,tool:'pen',color:'rust',points:[{x:.2,y:.2},{x:.4,y:.21}]}],future:[]}}};

(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({viewport:{width:1400,height:1000},reducedMotion:'reduce'}),errors=[],api=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.testMicCalls=0;navigator.mediaDevices.getUserMedia=async()=>{window.testMicCalls++;throw Error('Test disabled microphone');};});
 await p.route('**/api/agent/**',r=>{api.push(r.request().url());return r.fulfill({json:{grok:false,elevenlabs:false}})});
 await p.route('**/test-notes.pdf',r=>r.fulfill({contentType:'application/pdf',body:testPdf()}));
 await p.goto(base);await p.getByRole('button',{name:'Sessions',exact:true}).waitFor();await p.waitForTimeout(400);
 const storedRows=()=>p.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('better-office-hours-sessions',1);r.onsuccess=()=>resolve(r.result)});return new Promise(resolve=>{const tx=db.transaction('sessions','readonly'),r=tx.objectStore('sessions').getAll();tx.oncomplete=()=>{db.close();resolve(r.result)}})});
 assert.equal((await storedRows()).length,0,'An untouched startup page does not save an empty session');
 await p.getByRole('button',{name:'Sessions',exact:true}).click();
 await p.getByText('Your conversations will appear here automatically when you begin.').waitFor();
 await p.getByRole('button',{name:'Close saved sessions'}).click();
 const options=async title=>{const summary=p.getByLabel('Options for '+title,{exact:true});if(await summary.locator('..').getAttribute('open')===null)await summary.click();return summary.locator('..');};
 const rename=async(title,next)=>{await(await options(title)).getByRole('button',{name:'Rename',exact:true}).click();await p.getByRole('textbox',{name:'Session name',exact:true}).fill(next);await p.getByRole('button',{name:'Save name',exact:true}).click();await p.waitForTimeout(400);};
 const navClear=async()=>{const h=await p.locator('.session-header').boundingBox(),orb=await p.locator('.orb-frame:visible').boundingBox();assert.ok(h.y+h.height<=orb.y,'Session navigation never overlaps the orb');};
 const fixture=session;
 await p.evaluate(async f=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('better-office-hours-sessions',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise((resolve,reject)=>{const t=db.transaction(['sessions','meta'],'readwrite');t.objectStore('sessions').put(f);t.objectStore('meta').put(f.id,'active');t.oncomplete=resolve;t.onerror=()=>reject(t.error);});db.close();},fixture);
 await p.reload();await p.getByRole('region',{name:'Session transcript'}).waitFor();await p.locator('[data-animation="sample-motion"]').waitFor();
 assert.equal(await p.locator('[data-ink-id="own-work"]').count(),1);assert.equal(await p.locator('[data-ink-id="earlier-ink"]').count(),1);assert.equal(await p.evaluate(()=>window.testMicCalls),0,'Restoring never starts the mic');
 await p.screenshot({path:path.join(output, 'boh-saved-board.png')});
 await navClear();await p.getByRole('button',{name:'Sessions',exact:true}).click();await rename('Motion discussion','Motion and components');
 const download=p.waitForEvent('download');await(await options('Motion and components')).getByRole('button',{name:'Export session JSON',exact:true}).click();const exported=await download;const d=JSON.parse(fs.readFileSync(await exported.path()));assert.equal(d.title,'Motion and components');assert.equal(d.transcript.length,2);assert.equal(d.voice.current.board.animation.id,'sample-motion');assert.equal(d.pdf['test-pdf'].ink.present[0].id,'pdf-ink');
 await p.screenshot({path:path.join(output, 'boh-sessions-library.png')});
 await p.getByRole('dialog').getByRole('button',{name:'+ New session',exact:true}).click();await p.getByRole('button',{name:'Homework',exact:true}).waitFor();assert.equal(await p.getByRole('region',{name:'Session transcript'}).count(),0);
 assert.equal((await storedRows()).length,1,'New session opens a draft without cluttering history');
 await p.getByRole('button',{name:'Explain a concept',exact:true}).click();
 await p.getByRole('button',{name:'Whiteboard',exact:true}).waitFor();
 await p.getByText('Microphone unavailable',{exact:true}).waitFor();
 await p.waitForTimeout(700);
 assert.equal((await storedRows()).length,2,'Beginning a conversation automatically creates one separate session');
 await p.screenshot({path:path.join(output,'boh-concept-start-retry.png')});
 await p.getByRole('button',{name:'Sessions',exact:true}).click();await rename('Concept conversation','Another piece of work');
 await p.getByRole('textbox',{name:'Find a session'}).fill('motion');assert.equal(await p.locator('.session-resume').count(),1);await p.getByRole('textbox',{name:'Find a session'}).fill('');
 await p.locator('.session-resume').filter({hasText:'Motion and components'}).click();await p.getByRole('region',{name:'Session transcript'}).waitFor();await p.getByRole('button',{name:'Notes',exact:true}).click();await p.locator('[data-page="0"]').waitFor();await p.waitForTimeout(400);await p.screenshot({path:path.join(output, 'boh-restored-pdf.png')});
 assert.equal(await p.locator('.page-sheet .ink-layer .ink-pen').count(),1,'Saved PDF ink is visible');
 await p.getByRole('toolbar',{name:'Ink tools',exact:true}).getByRole('button',{name:'Pen',exact:true}).click();
 const sheet=await p.locator('.page-sheet[data-page="0"]').boundingBox();
 await p.mouse.move(sheet.x+sheet.width*.25,sheet.y+sheet.height*.25);await p.mouse.down();await p.mouse.move(sheet.x+sheet.width*.45,sheet.y+sheet.height*.26,{steps:12});await p.mouse.up();
 assert.equal(await p.locator('.page-sheet .ink-layer .ink-pen').count(),2,'A new annotation is added through the real pen');
 await p.getByRole('button',{name:'Zoom in',exact:true}).click();await p.getByRole('button',{name:'Next page',exact:true}).click();await p.waitForTimeout(800);
 await p.screenshot({path:path.join(output, 'boh-pdf-before-refresh.png')});await p.reload();await p.locator('[data-page="0"]').waitFor();await p.waitForTimeout(400);assert.equal(await p.getByRole('region',{name:'Session transcript'}).count(),1);assert.equal(await p.evaluate(()=>window.testMicCalls),0);
 assert.equal(await p.getByRole('button',{name:'Reset zoom',exact:true}).textContent(),'125%');
 await p.screenshot({path:path.join(output, 'boh-pdf-after-refresh.png')});assert.equal(await p.locator('.view-pages').textContent(),'2 / 2');
 assert.equal(await p.locator('.page-sheet .ink-layer .ink-pen').count(),2,'Both original and new PDF ink survive refresh');
 await p.getByRole('button',{name:'Undo PDF annotation',exact:true}).click();assert.equal(await p.locator('.page-sheet .ink-layer .ink-pen').count(),1,'Restored PDF undo history remains editable');
 await p.getByRole('button',{name:'Whiteboard',exact:true}).click();await p.locator('[data-animation="sample-motion"]').waitFor();assert.equal(await p.locator('[data-ink-id="own-work"]').count(),1);
 await p.setViewportSize({width:700,height:950});await navClear();await p.screenshot({path:path.join(output, 'boh-sessions-compact.png')});await p.getByRole('button',{name:'Sessions',exact:true}).click();await p.screenshot({path:path.join(output, 'boh-sessions-library-compact.png')});
 const textDownload=p.waitForEvent('download');await(await options('Motion and components')).getByRole('button',{name:'Export transcript',exact:true}).click();
 assert.ok(fs.readFileSync(await (await textDownload).path(),'utf8').includes('Tutor: The two directions share the same time.'));
 await(await options('Another piece of work')).getByRole('button',{name:'Delete',exact:true}).click();
 await p.locator('.session-delete-confirm').getByRole('button',{name:'Delete session',exact:true}).click();
 await p.getByRole('button',{name:/Another piece of work/}).waitFor({state:'detached'});
 await p.getByRole('button',{name:'Close saved sessions'}).click();
 await p.setViewportSize({width:380,height:850});await navClear();await p.screenshot({path:path.join(output,'boh-session-mobile.png')});await p.setViewportSize({width:1400,height:1000});
 await p.getByRole('button',{name:'Leave',exact:true}).click();await p.getByRole('button',{name:'Homework',exact:true}).waitFor();
 assert.equal((await storedRows()).length,1,'Leave saves the previous conversation and opens a clean draft');
 await p.reload();await p.getByRole('button',{name:'Homework',exact:true}).waitFor();assert.equal(await p.getByRole('region',{name:'Session transcript'}).count(),0,'Reloading a new draft never opens unrelated old work');
 await p.getByRole('button',{name:'Sessions',exact:true}).click();await p.locator('.session-resume').filter({hasText:'Motion and components'}).click();
 await p.getByRole('region',{name:'Session transcript'}).waitFor();await p.waitForTimeout(700);
 await p.getByRole('button',{name:'Sessions',exact:true}).click();
 // Simulate a newer save from another tab while this desk still has an old revision.
 const changed = await p.evaluate(async id=>{const db=await new Promise(resolve=>{const r=indexedDB.open('better-office-hours-sessions',1);r.onsuccess=()=>resolve(r.result)});return await new Promise((resolve,reject)=>{const tx=db.transaction('sessions','readwrite'),store=tx.objectStore('sessions'),get=store.get(id);let row;get.onsuccess=()=>{row={...get.result,title:'Saved in another tab',updatedAt:new Date(Date.now()+1000).toISOString()};store.put(row)};tx.oncomplete=()=>{db.close();resolve(row)};tx.onerror=()=>reject(tx.error)})},fixture.id);
 await rename('Motion and components','Stale edit');
 await p.getByRole('alert').filter({hasText:'changed in another tab'}).waitFor();
 const retained = await p.evaluate(async id=>{const db=await new Promise(resolve=>{const r=indexedDB.open('better-office-hours-sessions',1);r.onsuccess=()=>resolve(r.result)});return await new Promise(resolve=>{const tx=db.transaction('sessions','readonly'),r=tx.objectStore('sessions').get(id);tx.oncomplete=()=>{db.close();resolve(r.result)}})},fixture.id);
 assert.equal(retained.title,changed.title,'An older tab never overwrites a newer session');
 assert.equal(api.filter(u=>!u.endsWith('/health')).length,0);assert.deepEqual(errors,[]);console.log('PASS: real IndexedDB restore, no empty history entries, automatic separate session creation, immediate concept workspace with mic failure/retry, conversation title, rename/search/export/delete, leave and reload draft, history/board/ink/animation/PDF state and undo, stale-tab conflict protection, desktop/compact/mobile navigation. No real device or model calls.');
 console.log('Rendered artifacts:',output); }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
