// Offline visual study. No provider calls, storage writes, or live-session data.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { repositoryModule } from './render.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const { composeDocument }=repositoryModule('lib/whiteboard/document');
const { documentTimeline }=repositoryModule('lib/whiteboard/document-replay');
const { BoardText }=repositoryModule('components/whiteboard/BoardText');
const { BoardShape }=repositoryModule('components/whiteboard/BoardShape');
const { groupReveal }=repositoryModule('lib/whiteboard/reveal');
const { boardDocuments }=repositoryModule('scripts/evaluation/board-documents');
const stem=process.argv.includes('--stem');
let documents=boardDocuments, motions={}, pageNotes={};
if(stem) {
  const {stemPhysicalDocuments,stemMotions}=repositoryModule('scripts/evaluation/stem-physical-documents');
  const {stemLifeDocuments}=repositoryModule('scripts/evaluation/stem-life-documents');
  documents=[...stemPhysicalDocuments,
    {subject:'Chemistry',subtitle:'Atoms, bonds and energy',description:'Two separate representations: atom conservation in water formation, then an illustrative reaction energy profile. Each highlights a different relationship.',document:{id:'stem-chemistry',sections:stemLifeDocuments.slice(0,2).flatMap(e=>e.document.sections)}},
    {...stemLifeDocuments[2],subject:'Biology',document:{...stemLifeDocuments[2].document,sections:[...stemLifeDocuments[2].document.sections,boardDocuments[1].document.sections[0]]}},
  ];
  motions=stemMotions;
  pageNotes=Object.fromEntries(stemLifeDocuments.flatMap(e=>e.document.sections.map(s=>[s.id,e.description])));
  pageNotes['cell-view']=boardDocuments[1].description;
}
const {validateAnimation}=repositoryModule('lib/whiteboard/animation');
const {AnimLayer}=repositoryModule('components/whiteboard/AnimLayer');
const motionFor=page=>{
  const motion=motions[page.id];
  if(!motion)return undefined;
  if(!validateAnimation(motion.spec))throw new Error(`Invalid animation: ${page.id}`);
  return {...motion,spec:undefined,duration:motion.spec.duration,frames:Array.from({length:81},(_,i)=>{
    const time=motion.spec.duration*i/80;
    return {time,svg:renderToStaticMarkup(React.createElement(AnimLayer,{spec:motion.spec,time,focus:null,backdrop:page.groups,student:[]}))};
  })};
};
const gallery=documents.map(({document,...info})=>({...info,pages:composeDocument(document).map(page=>({
  id:page.id,title:page.title,steps:page.steps,links:page.links,timeline:documentTimeline(page),
  motion:motionFor(page),note:pageNotes[page.id.split('/')[1]],
  labels:Object.fromEntries(page.groups.map(group=>[group.id,group.drawables.filter(m=>m.kind==='text').map(m=>m.text).join(' ').slice(0,100)||`Figure detail ${page.steps.indexOf(group.id)+1}`])),
  svg:renderToStaticMarkup(React.createElement('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 1 1','aria-label':page.title},
    ...page.groups.map(g=>React.createElement('g',{key:g.id,'data-board-group':g.id,className:'board-group'},
      ...g.drawables.map((mark,index)=>mark.kind==='text'
        ? React.createElement(BoardText,{key:mark.key,mark,entering:page.steps.includes(g.id),delay:groupReveal(g).delays[index],elapsed:0})
        : React.createElement(BoardShape,{key:mark.key,mark})))))),
}))}));
const template=fs.readFileSync(path.join(root,'scripts/evaluation/board-gallery.html'),'utf8');
let html=template.replace('__BOARD_STYLES__',()=>fs.readFileSync(path.join(root,'components/whiteboard/whiteboard.css'),'utf8'))
  .replace('__BOARD_DATA__',()=>JSON.stringify(gallery).replaceAll('<','\\u003c'));
if(stem)html=html.replace('Board studies · 02','STEM studies · 01').replace('Every subject.<br>A clearer picture.','Make the<br>invisible visible.').replace('Space to think','STEM / VISUAL EVALUATION').replace('Visual replay only. Tutor narration and student ink are not connected in this study.','Authored diagrams and sampled motion. Voice and student ink are not connected.<br><a href="/board-stem-models.html">Compare the four real model tests</a>');
const destination=path.join(root,'.data/evaluation',stem?'2026-09-20-board-stem':'2026-09-20-board-system');
fs.mkdirSync(destination,{recursive:true});
fs.writeFileSync(path.join(destination,'index.html'),html);
console.log(`Generated ${gallery.reduce((count,doc)=>count+doc.pages.length,0)} real-renderer pages: ${path.join(destination,'index.html')}`);
