import type { DrawCommand } from '@/lib/types';
import type { ShapeGroup, Drawable } from './geometry';
import { interpretCommand } from './geometry';
import { layoutDiagram } from './diagram-layout';
import { typesetMath } from './math-layout';
import { textWidth, writingBounds } from './writing';
import { boardStyle } from './style';
import type { DiagramOptions } from './diagram-command';

// Local composition experiment. This is not a new tutor tool contract.
// Subjects supply content; they never select a hardcoded scene here.
export const documentStyle = {
  margin: .07, bottom: .87, start: .23, gap: .035,
  title: .050, body: .034, label: .034, caption: .030, equation: .062,
  line: .052, ink: boardStyle.colors.ink, muted: boardStyle.colors.muted,
  accent: boardStyle.colors.accent, relation: '#397b78', rule: '#d8d1c5',
} as const;
type FigureCommand = Extract<DrawCommand, { op: 'circle' | 'line' | 'arrow' | 'curve' }> & {
  diagram?: Pick<DiagramOptions, 'interpolation' | 'fill' | 'weight' | 'surface' | 'labelSide'>;
};
export type DocumentBlock =
  | { kind: 'prose'; id: string; text: string }
  | { kind: 'equation'; id: string; latex: string; caption?: string; emphasis?: boolean }
  | { kind: 'mindmap'; id: string; root: string; branches: { id: string; label: string; detail?: string }[] }
  | { kind: 'sequence'; id: string; steps: { id: string; label: string; detail: string }[] }
  | { kind: 'figure'; id: string; commands: FigureCommand[]; caption?: string };
export type BoardDocument = { id: string; sections: { id: string; title: string; eyebrow: string; blocks: DocumentBlock[] }[] };
export type DocumentRegion = { id: string; role: string; left: number; right: number; top: number; bottom: number };
export type DocumentPage = { id: string; title: string; groups: ShapeGroup[]; regions: DocumentRegion[]; steps: string[] };

const S = documentStyle;
function requireText(value: string, limit = 5000) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) throw new Error('Board text is empty or exceeds the document limit.');
  return value.trim();
}

// Wrap using the same measurement as the renderer, including unusually long
// words. No characters are silently discarded to fit a caption or a page.
export function documentLines(value: string, width: number, size: number = S.body): string[] {
  if (!Number.isFinite(width) || !Number.isFinite(size) || width < size || size <= 0) throw new Error('Invalid text frame.');
  const lines: string[] = [];
  for (const paragraph of requireText(value).split(/\n+/)) {
    let line = '';
    for (const word of paragraph.trim().split(/\s+/)) {
      if (line && textWidth(`${line} ${word}`, size, false) <= width) { line += ` ${word}`; continue; }
      if (line) lines.push(line);
      line = '';
      for (const { segment } of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word)) {
        if (line && textWidth(line + segment, size, false) > width) { lines.push(line); line = ''; }
        line += segment;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function text(key: string, value: string, x: number, y: number, size: number, color: string = S.ink, anchor: 'start' | 'middle' = 'start'): Drawable {
  return { kind: 'text', key, text: value, at: { x, y }, size: 's', fontSize: size, math: false, color, textAnchor: anchor, diagramLabel: true };
}
function line(key: string, d: string, color: string = S.rule, width = 1.2): Drawable { return { kind: 'path', key, d, color, width }; }
function group(id: string, drawables: Drawable[]): ShapeGroup { return { id, fixedLayout: true, drawables }; }
function textRegion(id: string, role: string, marks: Drawable[]): DocumentRegion {
  const boxes = marks.filter((m): m is Extract<Drawable, {kind:'text'}> => m.kind === 'text').map(writingBounds);
  return { id, role, left: Math.min(...boxes.map(b=>b.left)), right: Math.max(...boxes.map(b=>b.right)), top: Math.min(...boxes.map(b=>b.top)), bottom: Math.max(...boxes.map(b=>b.bottom)) };
}

export function composeDocument(document: BoardDocument): DocumentPage[] {
  requireText(document.id, 80);
  if (!document.sections.length || document.sections.length > 24) throw new Error('A document needs 1 to 24 sections.');
  const ids = new Set<string>();
  const unique = (id: string) => { requireText(id, 80); if (ids.has(id)) throw new Error(`Duplicate board identity: ${id}`); ids.add(id); };
  const pages: DocumentPage[] = [];
  for (const section of document.sections) {
    unique(section.id);
    if (!section.blocks.length || section.blocks.length > 64) throw new Error('A section needs 1 to 64 blocks.');
    const title = documentLines(section.title, .86, S.title);
    if (title.length > 2) throw new Error('Use a shorter section title.');
    let page!: DocumentPage;
    let cursor: number = S.start;
    let part = 0;
    const start = () => {
      if (pages.length >= 64) throw new Error('Document exceeds 64 pages.');
      page = { id: `${document.id}/${section.id}/${++part}`, title: section.title, groups: [], regions: [], steps: [] };
      const header = [text(`${page.id}-eyebrow`, requireText(section.eyebrow, 48), S.margin, .075, .023, S.muted),
        ...title.map((t,i)=>text(`${page.id}-title-${i}`,t,S.margin,.15+i*.059,S.title))];
      page.groups.push(group(`${page.id}-header`,header));
      page.regions.push(textRegion(`${page.id}-header`,'heading',header));
      cursor = title.length === 2 ? .285 : S.start;
      pages.push(page);
    };
    start();
    const add = (id: string, marks: Drawable[], role: string) => {
      page.groups.push(group(id,marks)); page.steps.push(id);
      if (marks.some(m=>m.kind==='text')) page.regions.push(textRegion(id,role,marks));
    };
    const space = (height: number) => { if (cursor + height > S.bottom) start(); if (cursor + height > S.bottom) throw new Error('This block needs to be split before layout.'); };
    for (const block of section.blocks) {
      unique(block.id);
      if (block.kind === 'prose') {
        const rows = documentLines(block.text,.86);
        let offset = 0;
        while (offset < rows.length) {
          space(S.line * Math.min(2,rows.length-offset));
          const count = Math.min(rows.length-offset,Math.floor((S.bottom-cursor)/S.line));
          const marks=rows.slice(offset,offset+count).map((t,i)=>text(`${block.id}-${offset+i}`,t,S.margin,cursor+S.body+i*S.line,S.body));
          add(`${block.id}-${offset}`,marks,'prose'); cursor += count*S.line+S.gap; offset+=count;
        }
      } else if (block.kind === 'equation') {
        const formula = typesetMath(requireText(block.latex,800),block.emphasis?S.accent:S.ink);
        if (!formula) throw new Error(`Unsupported equation: ${block.id}`);
        const size=Math.min(S.equation,.86/formula.width);
        if (size < .040) throw new Error('Split a long equation instead of shrinking it below reading size.');
        const captions=block.caption?documentLines(block.caption,.82,S.caption):[];
        const height=(formula.ascent+formula.descent)*size+(captions.length? .028+captions.length*.042:0);
        space(height);
        const marks: Drawable[]=[{kind:'text',key:block.id,text:block.latex,at:{x:.5,y:cursor+formula.ascent*size},size:'s',fontSize:size,math:true,mathDrawing:formula,color:block.emphasis?S.accent:S.ink,textAnchor:'middle'}];
        const bottom=cursor+(formula.ascent+formula.descent)*size;
        captions.forEach((t,i)=>marks.push(text(`${block.id}-caption-${i}`,t,.5,bottom+.05+i*.042,S.caption,S.muted,'middle')));
        add(block.id,marks,'equation');cursor += height+S.gap;
      } else if (block.kind === 'mindmap') {
        if (!block.branches.length || block.branches.length > 24) throw new Error('A map needs 1 to 24 branches.');
        const root=documentLines(block.root,.25,S.label);
        if(root.length>3) throw new Error('Shorten the central map label.');
        for(let offset=0;offset<block.branches.length;offset+=4) {
          if(page.steps.length) start();
          const centerY=.51;
          const rootMarks=root.map((t,i)=>text(`${block.id}-root-${i}`,t,.5,centerY-(root.length-1)*.025+i*.05,S.label,S.ink,'middle'));
          add(`${block.id}-root-${offset}`,rootMarks,'map-root');
          block.branches.slice(offset,offset+4).forEach((branch,index)=>{
            unique(branch.id);
            const left=index%2===0, x=left?.07:.69, y=index<2?.29:.58;
            const labels=documentLines(branch.label,.24,S.label), details=branch.detail?documentLines(branch.detail,.24,S.caption):[];
            if(labels.length>3||details.length>4)throw new Error('Split a dense map branch into its own section.');
            const end=left?.32:.68, origin=left?.355:.645;
            const marks:Drawable[]=[line(`${branch.id}-link`,`M ${origin} ${centerY} C ${(origin+end)/2} ${centerY} ${(origin+end)/2} ${y+.01} ${end} ${y+.01}`,S.relation,1.4),
              ...labels.map((t,i)=>text(`${branch.id}-title-${i}`,t,x,y+i*.042,S.label,S.ink)),
              ...details.map((t,i)=>text(`${branch.id}-detail-${i}`,t,x,y+labels.length*.042+.014+i*.041,S.caption,S.muted))];
            add(branch.id,marks,'map-branch');
          });
          cursor=S.bottom;
        }
      } else if(block.kind==='sequence') {
        if(!block.steps.length||block.steps.length>24)throw new Error('A sequence needs 1 to 24 steps.');
        for(const [index,step] of block.steps.entries()) {
          unique(step.id);
          const labels=documentLines(step.label,.73,S.label),details=documentLines(step.detail,.73,S.body);
          const height=labels.length*.047+details.length*S.line+.025;
          space(height);
          const marks:Drawable[]=[text(`${step.id}-number`,String(index+1).padStart(2,'0'),S.margin,cursor+S.label,.027,S.accent),
            ...labels.map((t,i)=>text(`${step.id}-label-${i}`,t,.18,cursor+S.label+i*.047,S.label)),
            ...details.map((t,i)=>text(`${step.id}-detail-${i}`,t,.18,cursor+labels.length*.047+S.body+i*S.line,S.body,S.muted))];
          add(step.id,marks,'sequence');cursor+=height+S.gap;
        }
      } else {
        if(page.steps.length)start();
        if(!block.commands.length || block.commands.length>80)throw new Error('A figure needs 1 to 80 primitives.');
        const point=(p:{x:number;y:number})=>{if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1)throw new Error('Figure coordinate outside its frame.');return {x:.23+p.x*.54,y:.24+p.y*.54};};
        const figures=block.commands.map((cmd,index)=>{
          if (cmd.label && (requireText(cmd.label,64).split(/\s+/).length > 6)) throw new Error('Use a shorter figure label.');
          if (cmd.diagram && ['attach','contact','component'].some(key=>key in cmd.diagram!)) throw new Error('Resolve figure relationships before document layout.');
          if (cmd.op==='circle' && (!Number.isFinite(cmd.r) || cmd.r * .54 < .006 || cmd.center.x-cmd.r<0 || cmd.center.x+cmd.r>1 || cmd.center.y-cmd.r<0 || cmd.center.y+cmd.r>1)) throw new Error('Circle extends outside its figure or is too small.');
          if (cmd.op==='curve' && (cmd.points.length<2 || cmd.points.length>256)) throw new Error('A figure curve needs 2 to 256 points.');
          const mapped = cmd.op==='circle'?{...cmd,center:point(cmd.center),r:cmd.r*.54}:
            cmd.op==='curve'?{...cmd,points:cmd.points.map(point)}:{...cmd,from:point(cmd.from),to:point(cmd.to)};
          const op=interpretCommand({...mapped,id:`${block.id}-${index}`},index);
          if(!op||op.kind!=='draw')throw new Error('Unsupported figure primitive.');
          return op.group;
        });
        const caption=block.caption?documentLines(block.caption,.86,S.caption):[];
        if(caption.length>2)throw new Error('Use a separate prose block for a long figure caption.');
        const captionMarks=caption.map((t,i)=>text(`${block.id}-caption-${i}`,t,.5,.845+i*.04,S.caption,S.muted,'middle'));
        // Header and caption are reservations in the ordinary annotation layout.
        const resolved=layoutDiagram([...page.groups,...figures,group(`${block.id}-caption`,captionMarks)]);
        for(const figure of resolved.slice(page.groups.length,page.groups.length+figures.length)) {
          page.groups.push(figure);page.steps.push(figure.id);
          if(figure.drawables.some(m=>m.kind==='text'))page.regions.push(textRegion(figure.id,'figure-label',figure.drawables));
        }
        if(captionMarks.length)add(`${block.id}-caption`,captionMarks,'caption');
        cursor=S.bottom;
      }
    }
  }
  pages.forEach((page,index)=>page.groups.push(group(`${page.id}-footer`,[
    line(`${page.id}-rule`,'M .07 .925 H .93'),text(`${page.id}-page`,`${index+1} / ${pages.length}`,.93,.967,.022,S.muted,'middle'),
  ])));
  const groupIds = pages.flatMap(page=>page.groups.map(group=>group.id));
  if (new Set(groupIds).size !== groupIds.length) throw new Error('Document contains colliding generated identities.');
  // Do not ship a visually broken page when a dense figure has no clear label
  // placement. The caller can split that content or ask for a shorter label.
  for (const page of pages) {
    const marks = page.groups.flatMap(group=>group.drawables.filter((mark): mark is Extract<Drawable, {kind:'text'}>=>mark.kind==='text'));
    const boxes = marks.map(writingBounds);
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (box.left < .04 || box.right > .975 || box.top < .04 || box.bottom > .98) throw new Error(`Text exceeds page bounds: ${marks[i].key}`);
      for (let j = i + 1; j < boxes.length; j++) {
        const other = boxes[j];
        if (box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top) throw new Error('Split this content to give its labels more space.');
      }
    }
  }
  return pages;
}
