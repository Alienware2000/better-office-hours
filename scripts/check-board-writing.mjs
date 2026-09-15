import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { repositoryModule } from './evaluation/render.mjs';
const { BoardText } = repositoryModule('components/whiteboard/BoardText');
const { textReveal } = repositoryModule('lib/whiteboard/reveal');
const render = (text, elapsed, math = false) => renderToStaticMarkup(React.createElement('svg', {}, React.createElement(BoardText, {
  mark: { kind: 'text', key: 'label', text, at: { x: .5, y: .5 }, color: '#222', size: 's', math }, entering: true, delay: 100, elapsed,
})));
for (const text of ['wavelength', 'Cooler outer gas', 'Momentum p', 'café 👩🏽‍🔬']) {
  const { glyphs, duration } = textReveal(text);
  let previous = 0;
  for (let elapsed = 0; elapsed <= duration + 200; elapsed += 8) {
    const markup = render(text, elapsed);
    const visibility = [...markup.matchAll(/class="board-glyph" opacity="([01])"/g)].map(m => Number(m[1]));
    assert.equal(visibility.length, glyphs.length);
    assert.ok(!visibility.join('').includes('01'), 'Visible letters always form a continuous prefix');
    const shown = visibility.reduce((a,b) => a+b, 0);
    assert.ok(shown >= previous, 'Letters cannot disappear later'); previous = shown;
    assert.equal(render(text, elapsed), markup, 'An unrelated render cannot change the reveal phase');
  }
  assert.equal(previous, glyphs.length);
}
const latex = String.raw`\lambda = \frac{h}{p}`;
assert.ok(render(latex, 0, true).includes('opacity="0"'));
assert.ok(!render(latex, 10000, true).includes('opacity="0"'));
console.log('PASS: monotonic complete prefixes, repeat renders, graphemes, and equation completion.');

const store = repositoryModule('lib/whiteboard/store');
const { writingBounds } = repositoryModule('lib/whiteboard/writing');
const { labelsOverlap } = repositoryModule('lib/whiteboard/diagram-layout');
const scene = [
 {op:'text',id:'topic',at:{x:.5,y:.12},text:'A wave and its wavelength',size:'s'},
 {op:'curve',id:'wave',points:[{x:.15,y:.42},{x:.22,y:.3},{x:.29,y:.42},{x:.36,y:.54},{x:.43,y:.42},{x:.5,y:.3},{x:.57,y:.42},{x:.64,y:.54},{x:.71,y:.42}]},
 {op:'arrow',id:'distance',from:{x:.22,y:.24},to:{x:.5,y:.24},label:'one wavelength'},
 {op:'text',id:'relation',at:{x:.5,y:.68},text:latex,size:'m'},
 {op:'text',id:'note-1',at:{x:.5,y:.78},text:String.raw`h = Planck constant,\; m = mass,\; v = speed`,size:'s'},
];
store.resetBoard();store.applyDrawCommands(scene);
const state=store.getBoardState();assert.equal(state.pageId,1,'A short symbol legend stays with its diagram and equation');
assert.ok(state.groups.find(g=>g.id==='relation').drawables[0].mathDrawing);
const labels=state.groups.flatMap(g=>g.drawables.filter(m=>m.kind==='text'));
assert.ok(labels.every(m=>!m.text.includes('\\;')));
for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)assert.ok(!labelsOverlap(writingBounds(labels[i]),writingBounds(labels[j])),`${labels[i].text} overlaps ${labels[j].text}`);
store.applyDrawCommands([{op:'panel',id:'next',slot:0,title:'Next idea',items:[{shape:'circle',label:'Object'}]}]);
const archived=store.getBoardState().earlierPages[0];assert.equal(archived.groups.length,scene.length);
console.log('PASS: compact prose legends, typeset equations, non-overlapping labels, and preserved composed pages.');
