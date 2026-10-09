/* global el */
// Real BoardDrawing reveal markup, driven by media time. No invented geometry.
window.BoardPlayback = class BoardPlayback {
  constructor(area) { this.area=area; this.previous=new Map(); this.tracks=[]; this.scale=1; }
  reset() { this.tracks=[];this.previous.clear();this.area.replaceChildren(); }
  mount(report, clipDuration) {
    this.tracks=[];
    const next=new Map();let offset=0;
    this.area.replaceChildren();
    for(const page of report.rendering.pages) {
      this.area.append(el('p',`Page ${page.page}`,'page-label'));
      const board=el('div',null,'board');board.dataset.page=page.page;board.innerHTML=page.svg;this.area.append(board);
      for(const reveal of page.reveals??[]) {
        const key=page.page+':'+reveal.id;next.set(key,reveal.source);
        if(this.previous.get(key)===reveal.source||window.matchMedia('(prefers-reduced-motion: reduce)').matches)continue;
        const target=[...board.querySelectorAll('[data-board-group]')].find(n=>n.dataset.boardGroup===reveal.id);
        if(!target)continue;
        const wrapper=document.createElement('div');wrapper.innerHTML=reveal.svg;
        const entering=wrapper.querySelector('[data-board-group]');if(!entering)continue;
        const finishedPaths=[...target.querySelectorAll('.board-path')].map(node=>getComputedStyle(node).strokeDasharray);
        let pathIndex=0;
        // Keep glyph layout from BoardDrawing, but use the media clock directly.
        // This avoids creating a browser animation object for every glyph.
        for(const node of entering.querySelectorAll('.is-entering,.board-glyph,.board-math-glyph')) {
          const delay=node.style.animationDelay;
          const milliseconds=parseFloat(delay)*(delay.endsWith('ms')?1:1000)||0;
          const kind=node.classList.contains('board-path')?'path':node.classList.contains('board-fill')?'fill':node.classList.contains('board-head')?'head':'glyph';
          const opacity=node.style.opacity||'1';
          node.style.animation='none';
          this.tracks.push({node,kind,start:offset+milliseconds+(kind==='head'?360:0),opacity,
            dash:kind==='path'?finishedPaths[pathIndex++]:'none'});
        }
        entering.style.animation='none';
        this.tracks.push({node:entering,kind:'group',start:offset,opacity:'1'});
        target.replaceWith(entering);
        offset+=reveal.duration+80;
      }
    }
    this.previous=next;
    this.scale=Number.isFinite(clipDuration)&&clipDuration>0?Math.max(1,offset/(clipDuration*850)):1;
    this.seek(0);
  }
  seek(seconds) {
    const time=Number.isFinite(seconds)?Math.max(0,seconds)*1000*this.scale:Infinity;
    for(const {node,kind,start,opacity,dash} of this.tracks) {
      const elapsed=time-start;
      if(kind==='path') {
        const progress=Math.min(1,Math.max(0,elapsed/520));
        node.style.strokeDasharray=progress===1?dash:'1';
        node.style.strokeDashoffset=String(1-progress);
      } else if(kind==='fill') node.style.fillOpacity=String(Math.min(1,Math.max(0,elapsed/300)));
      else if(kind==='head') node.style.opacity=String(Number(opacity)*Math.min(1,Math.max(0,elapsed/180)));
      else node.style.opacity=elapsed>=(kind==='glyph'?80:0)?opacity:'0';
    }
  }
  motion(report) {
    // Updating motion must never recreate writing or restart its reveal.
    for(const page of report.rendering.pages) {
      const board=[...this.area.querySelectorAll('[data-page]')].find(n=>n.dataset.page===String(page.page));if(!board)continue;
      const wrapper=document.createElement('div');wrapper.innerHTML=page.svg;
      const next=wrapper.querySelector('[data-animation]'),old=board.querySelector('[data-animation]');
      if(next&&old)old.replaceWith(next);
    }
  }
};
