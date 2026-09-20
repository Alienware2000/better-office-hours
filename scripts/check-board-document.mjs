import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { repositoryModule } from './evaluation/render.mjs';

const { composeDocument, documentLines } = repositoryModule('lib/whiteboard/document');
const { writingBounds } = repositoryModule('lib/whiteboard/writing');
const { BoardDrawing } = repositoryModule('components/whiteboard/BoardDrawing');
const { boardDocuments } = repositoryModule('scripts/evaluation/board-documents');
const textMarks = page => page.groups.flatMap(g=>g.drawables.filter(m=>m.kind==='text'));
const document = blocks => ({id:'test',sections:[{id:'section',eyebrow:'TEST',title:'A useful question',blocks}]});
const intersects = (a,b) => a.left<b.right && a.right>b.left && a.top<b.bottom && a.bottom>b.top;

let pageCount = 0;
for (const { subject, document } of boardDocuments) {
  const before=JSON.stringify(document);
  const pages=composeDocument(document);
  assert.equal(JSON.stringify(document),before,'Composition does not mutate authored content');
  assert.deepEqual(composeDocument(document),pages,'Composition is deterministic');
  for (const page of pages) {
    pageCount++;
    const marks=textMarks(page);
    for(const mark of marks) {
      const box=writingBounds(mark);
      assert.ok(Object.values(box).every(Number.isFinite));
      assert.ok(box.left>=.04 && box.right<=.975 && box.top>=.04 && box.bottom<=.98,`${subject}: ${mark.text} fits the page: ${JSON.stringify(box)}`);
    }
    for(let i=0;i<marks.length;i++)for(let j=i+1;j<marks.length;j++)assert.ok(!intersects(writingBounds(marks[i]),writingBounds(marks[j])),`${subject}: ${marks[i].text} overlaps ${marks[j].text}`);
    const svg=renderToStaticMarkup(React.createElement('svg',{},React.createElement(BoardDrawing,{groups:page.groups.map(g=>({...g,appear:'done'})),student:[],animation:null,time:0,focus:null,earlier:true})));
    assert.ok(!/NaN|Infinity/.test(svg));
    assert.equal((svg.match(/data-board-group=/g)||[]).length,page.groups.length);
    if(marks.some(m=>m.math))assert.ok(svg.includes('data-latex='),'Math uses real paths in the renderer');
  }
}
console.log(`PASS: ${pageCount} cross-subject pages preserve content, render deterministically and have no overlapping text bounds.`);

// Long content must continue, with no loss or microscopic type to force a fit.
const long=Array.from({length:160},(_,i)=>`observation${i}`).join(' ');
const longDoc=document([{kind:'prose',id:'long',text:long}]);
const pages=composeDocument(longDoc);
assert.ok(pages.length>2);
const prose=pages.flatMap(p=>p.groups.filter(g=>g.id.startsWith('long-')).flatMap(g=>g.drawables));
assert.equal(prose.map(m=>m.text).join(' '),long);
assert.ok(prose.every(m=>m.fontSize===.034));
const graphemes='👩🏽‍🔬'.repeat(40);
const lines=documentLines(graphemes,.5);
assert.equal(lines.join(''),graphemes);
assert.ok(lines.every(line=>[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(line)].every(g=>g.segment==='👩🏽‍🔬')));
const original=composeDocument(boardDocuments[0].document);
const appended=composeDocument({...boardDocuments[0].document,sections:[...boardDocuments[0].document.sections,{id:'later',eyebrow:'LATER',title:'Another idea',blocks:[{kind:'prose',id:'later-note',text:'A new thought.'}]}]});
for(let i=0;i<original.length;i++)assert.deepEqual(appended[i].groups.slice(0,-1),original[i].groups.slice(0,-1),'Later content does not move earlier notes');
console.log('PASS: overflow pagination preserves words and type size, graphemes remain intact, earlier pages stay stable.');

const branches=Array.from({length:9},(_,i)=>({id:`branch${i}`,label:`Idea ${i}`,detail:'One related detail.'}));
const maps=composeDocument(document([{kind:'mindmap',id:'map',root:'A topic',branches}]));
assert.equal(maps.length,3);
assert.equal(maps.flatMap(p=>p.steps.filter(id=>id.startsWith('branch'))).length,9);
assert.ok(maps.every(page=>textMarks(page).some(m=>m.text==='A topic')));
assert.throws(()=>composeDocument(document([{kind:'equation',id:'long-equation',latex:'x+'.repeat(120)+'x'}])),/Split a long equation/);
assert.throws(()=>composeDocument(document([{kind:'prose',id:'same',text:'First'},{kind:'prose',id:'same',text:'Second'}])),/Duplicate/);
assert.throws(()=>composeDocument(document([{kind:'prose',id:'x',text:'First'},{kind:'equation',id:'x-0',latex:'x=1'}])),/colliding/);
assert.throws(()=>composeDocument(document([{kind:'prose',id:'blank',text:''}])),/empty/);
assert.throws(()=>composeDocument(document([{kind:'figure',id:'invalid',commands:[{op:'circle',id:'c',center:{x:.5,y:.5},r:.8}]}])),/outside/);
assert.throws(()=>composeDocument(document([{kind:'figure',id:'long-label',commands:[{op:'line',id:'l',from:{x:.1,y:.1},to:{x:.5,y:.5},label:'one two three four five six seven'}]}])),/shorter/);
const circle=composeDocument(document([{kind:'figure',id:'circle',commands:[{op:'circle',id:'c',center:{x:.5,y:.5},r:.2}]}]))[0].groups.find(g=>g.id==='circle-0');
const trace=circle.geometry.flat();
assert.ok(Math.abs(Math.max(...trace.map(p=>p.x))-Math.min(...trace.map(p=>p.x))-(Math.max(...trace.map(p=>p.y))-Math.min(...trace.map(p=>p.y))))<.001,'Figure placement preserves geometry aspect ratio');
console.log('PASS: maps continue with a repeated root, invalid/dense input fails explicitly, and figure proportions stay intact.');
