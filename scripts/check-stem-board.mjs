// Offline gates for the authored examples, not a model-quality or voice benchmark.
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { repositoryModule as load } from './evaluation/render.mjs';
const {composeDocument}=load('lib/whiteboard/document');
const {writingBounds}=load('lib/whiteboard/writing');
const {animationFrame,validateAnimation}=load('lib/whiteboard/animation');
const {BoardDrawing}=load('components/whiteboard/BoardDrawing');
const {stemPhysicalDocuments,projectileAnimation}=load('scripts/evaluation/stem-physical-documents');
const {stemLifeDocuments}=load('scripts/evaluation/stem-life-documents');
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-8,`${message}: ${a} versus ${b}`);
const cell=load('scripts/evaluation/board-documents').boardDocuments[1].document;
const all=[...stemPhysicalDocuments,...stemLifeDocuments,{document:{...cell,sections:[cell.sections[0]]}}];
let count=0;
for(const {document} of all)for(const page of composeDocument(document)) {
  count++;
  const svg=renderToStaticMarkup(React.createElement('svg',{},React.createElement(BoardDrawing,{groups:page.groups.map(g=>({...g,appear:'done'})),student:[],animation:null,time:0,focus:null,earlier:true})));
  assert.ok(!/NaN|Infinity/.test(svg));
  for(const group of page.groups)for(const mark of group.drawables)if(mark.kind==='text'&&mark.math)assert.ok(mark.mathDrawing,'Math must have real glyph geometry');
}
// A tall matrix reserves space without scaling a square into a rectangle.
const matrix=composeDocument(stemPhysicalDocuments[0].document)[0];
const original=matrix.groups.filter(g=>g.source?.id?.startsWith('shear-figure-')&&g.source?.op==='line'&&g.source.dashed);
assert.equal(original.length,4);
const horizontal=original[0].source, vertical=original[1].source;
near(Math.abs(horizontal.to.x-horizontal.from.x),Math.abs(vertical.to.y-vertical.from.y),'Original remains a square');
const equation=matrix.groups.flatMap(g=>g.drawables).find(m=>m.kind==='text'&&m.text.includes('pmatrix'));
const caption=matrix.groups.flatMap(g=>g.drawables).find(m=>m.kind==='text'&&m.text.startsWith('Columns'));
assert.ok(writingBounds(equation).bottom<writingBounds(caption).top,'Tall equation clears caption');
assert.ok(equation.fontSize>=.04,'Matrix remains readable');
const wrapped=composeDocument({...stemPhysicalDocuments[0].document,sections:[{id:'wrapped',eyebrow:'HEADING CHECK',title:'Where do the basis vectors go?',blocks:[{kind:'prose',id:'short-note',text:'A short note below a two-line title.'}]}]});
assert.equal(wrapped[0].groups[0].drawables.filter(m=>m.key.includes('-title-')).length,2,'Two-line headings remain supported without overlap');

// Sample actual runtime output. This catches a stationary Follow object even
// when the animation schema is valid and changing vectors look plausible.
assert.ok(validateAnimation(projectileAnimation));
const flight=composeDocument(stemPhysicalDocuments[1].document)[0];
const frames=[0,1,2,3,4].map(t=>animationFrame(projectileAnimation,t,flight.groups,[]));
const balls=frames.map(f=>f.groups.find(g=>g.id==='ball').source.center);
const dx=balls[1].x-balls[0].x;
assert.ok(dx>.05,'Ball travels across the board');
for(let i=1;i<balls.length;i++)near(balls[i].x-balls[i-1].x,dx,'Equal time gives equal horizontal displacement');
assert.ok(balls[2].y<balls[0].y&&balls[2].y<balls[4].y,'Apex is above launch and landing');
near(balls[0].y,balls[4].y,'Symmetric flight returns to starting height');
const accelerations=balls.slice(2).map((p,i)=>p.y-2*balls[i+1].y+balls[i].y);
assert.ok(accelerations[0]>0,'Screen-space acceleration is downward');
accelerations.forEach(a=>near(a,accelerations[0],'Vertical acceleration stays constant'));
for(const [i,f] of frames.entries()) {
  const vx=f.groups.find(g=>g.id==='horizontal-velocity').source;
  const vy=f.groups.find(g=>g.id==='vertical-velocity').source;
  near(vx.from.x,balls[i].x,'Velocity remains attached to ball');
  near(vx.to.x-vx.from.x,.047736,'Horizontal vector stays the same length');
  near(vy.to.x,vy.from.x,'Vertical component has no horizontal component');
  if(i<2)assert.ok(vy.to.y<vy.from.y,'Rising vertical velocity points up');
  if(i===2)near(vy.to.y,vy.from.y,'Vertical component is zero at apex');
  if(i>2)assert.ok(vy.to.y>vy.from.y,'Falling vertical velocity points down');
}
// Basic scientific invariants of the authored counting/gradient diagrams.
const reaction=stemLifeDocuments[0].document.sections[0].blocks[0].commands;
const before=reaction.slice(0,reaction.findIndex(c=>c.id==='reaction-direction'));
const after=reaction.slice(reaction.findIndex(c=>c.id==='reaction-direction')+1);
for(const [element,total] of [['H',4],['O',2]])for(const side of [before,after])assert.equal(side.filter(c=>c.insideLabel?.text===element).length,total,'Atoms conserved across the reaction');
const diffusion=stemLifeDocuments[2].document.sections[0].blocks[0].commands;
const particles=diffusion.filter(c=>c.op==='circle');
assert.equal(particles.filter(c=>c.center.x<.48).length,9);
assert.equal(particles.filter(c=>c.center.x>.53).length,3);
const net=diffusion.find(c=>c.id==='net-flux');assert.ok(net.to.x>net.from.x,'Net flow points down concentration gradient');
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const staticText=flight.groups.flatMap(g=>g.drawables.filter(m=>m.kind==='text'));
for(let i=0;i<=80;i++) {
  const frame=animationFrame(projectileAnimation,i/20,flight.groups,[]);
  const labels=frame.groups.filter(g=>g.opacity>0).flatMap(g=>g.drawables.filter(m=>m.kind==='text'));
  for(const label of labels)for(const other of [...staticText,...labels.filter(m=>m!==label)])assert.ok(!overlaps(writingBounds(label),writingBounds(other)),`Motion label collision at ${i/20}: ${label.key} / ${other.key}`);
}
console.log(`PASS: ${count} STEM pages render; tall matrices preserve layout, projectile motion obeys sampled kinematics, atoms balance and net diffusion follows the gradient.`);
