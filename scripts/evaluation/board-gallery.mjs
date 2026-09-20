// Offline visual study. No provider calls, storage writes, or live-session data.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { repositoryModule } from './render.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const { composeDocument }=repositoryModule('lib/whiteboard/document');
const { BoardDrawing }=repositoryModule('components/whiteboard/BoardDrawing');
const { boardDocuments }=repositoryModule('scripts/evaluation/board-documents');
const gallery=boardDocuments.map(({document,...info})=>({...info,pages:composeDocument(document).map(page=>({
  id:page.id,title:page.title,steps:page.steps,
  labels:Object.fromEntries(page.groups.map(group=>[group.id,group.drawables.filter(m=>m.kind==='text').map(m=>m.text).join(' ').slice(0,100)||`Figure detail ${page.steps.indexOf(group.id)+1}`])),
  svg:renderToStaticMarkup(React.createElement('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 1 1','aria-label':page.title},
    React.createElement(BoardDrawing,{groups:page.groups.map(g=>({...g,appear:'done'})),student:[],animation:null,time:0,focus:null,earlier:true}))),
}))}));
const template=fs.readFileSync(path.join(root,'scripts/evaluation/board-gallery.html'),'utf8');
const html=template.replace('__BOARD_STYLES__',()=>fs.readFileSync(path.join(root,'components/whiteboard/whiteboard.css'),'utf8'))
  .replace('__BOARD_DATA__',()=>JSON.stringify(gallery).replaceAll('<','\\u003c'));
const destination=path.join(root,'.data/evaluation/2026-09-20-board-system');
fs.mkdirSync(destination,{recursive:true});
fs.writeFileSync(path.join(destination,'index.html'),html);
console.log(`Generated ${gallery.reduce((count,doc)=>count+doc.pages.length,0)} real-renderer pages: ${path.join(destination,'index.html')}`);
