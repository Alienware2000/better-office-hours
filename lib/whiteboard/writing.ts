import type { Drawable, ShapeGroup } from './geometry';
import { boardStyle, boardTextSize } from './style';
import { isMathText, LABEL_FONT, MATH_FONT } from './text';
import { hasLatex } from './math-source';
import { typesetMath } from './math-layout';

type TextMark = Extract<Drawable, { kind: 'text' }>;
type Box = { left: number; right: number; top: number; bottom: number };
const margin = .055;
const gap = .025;
let measure: CanvasRenderingContext2D | null = null;
export const textWidth = (text: string, size: number, math = isMathText(text)) => {
  const formula = math ? typesetMath(text, boardStyle.colors.ink) : null;
  if (formula) return formula.width * size;
  if (typeof document !== 'undefined') measure ??= document.createElement('canvas').getContext('2d');
  if (measure) {
    measure.font = `500 100px ${math ? MATH_FONT : LABEL_FONT}`;
    return measure.measureText(text).width / 100 * size;
  }
  // Server/test fallback. Spaces and superscripts are not full-width letters.
  return [...text].reduce((sum, char) => sum + (/\s/.test(char) ? .27 : /[il.,:;!|₀-₉²³]/.test(char) ? .32 : /[MW@]/.test(char) ? .95 : /[=+−×]/.test(char) ? .75 : .57), 0) * size;
};
const width = textWidth;
const intersects = (a: Box, b: Box) => a.left < b.right + gap && a.right > b.left - gap && a.top < b.bottom + gap && a.bottom > b.top - gap;

export function writingBounds(mark: TextMark): Box {
  const size = mark.fontSize ?? boardTextSize(mark.text, mark.size, mark.at.x);
  const half = width(mark.text, size, mark.math ?? (!mark.heading && isMathText(mark.text))) / 2;
  const left = mark.textAnchor === "start" ? mark.at.x : mark.at.x - half;
  const formula = mark.mathDrawing;
  return { left, right: left + half * 2, top: mark.at.y - size * (formula?.ascent ?? 1), bottom: mark.at.y + size * (formula?.descent ?? .25) };
}

// Resolve writing once in board coordinates. The snapshot and rendered board
// consume the same lines; existing writing never jumps when a new line arrives.
export function layoutWriting(group: ShapeGroup, groups: ShapeGroup[], ink: { points: { x: number; y: number }[] }[]): ShapeGroup | null {
  if (group.drawables.length !== 1 || group.drawables[0].kind !== 'text') return group;
  const mark = group.drawables[0];
  const heading = group.id === 'topic' || group.id.startsWith('topic-');
  const math = !heading && isMathText(mark.text);
  const note = heading || /^(given|note|definition)-/.test(group.id);
  if (!note && !math && width(mark.text, .038, false) <= .91 && groups.some(group => group.geometry?.length)) return group;
  let fontSize = heading ? .057 : mark.size === 'm' ? .085 : .068;
  const available = 1 - margin * 2;
  const fullFormula = math && hasLatex(mark.text) ? typesetMath(mark.text, mark.color) : null;
  const latex = Boolean(fullFormula);
  if (fullFormula) fontSize = Math.min(fontSize, available / Math.max(1, fullFormula.width));
  const fits = (text: string) => width(text, fontSize, math) <= available;
  const lines: string[] = latex ? [mark.text] : [];
  let line = '';
  // Keep a product such as 2 a Δy together. Only long expressions need a
  // continuation, preferably at a relation or additive operator.
  const rows = note && !heading && !latex ? mark.text.split(/,\s*(?=[^,]+[=≈])/u) : [mark.text];
  for (const row of latex ? [] : rows) {
    const tokens = latex ? [row] : math ? row.split(/\s+(?=[=+−]|-(?!\d))/) : row.split(/\s+/);
    for (const token of tokens) {
      const words = fits(token) ? [token] : token.split(/\s+/);
      for (const word of words) {
        if (line && !fits(`${line} ${word}`)) { lines.push(line); line = ''; }
        let rest = '';
        for (const char of word) {
          if (!fits(rest + char)) { lines.push(rest); rest = ''; }
          rest += char;
        }
        line = line ? `${line} ${rest}` : rest;
      }
    }
    if (line) lines.push(line);
    line = '';
  }
  const occupied: Box[] = groups.filter(g => g.id !== group.id).flatMap(g => g.drawables.filter((d): d is TextMark => d.kind === 'text').map(writingBounds));
  for (const stroke of ink) {
    if (!stroke.points.length) continue;
    occupied.push({ left: Math.min(...stroke.points.map(p => p.x)), right: Math.max(...stroke.points.map(p => p.x)), top: Math.min(...stroke.points.map(p => p.y)), bottom: Math.max(...stroke.points.map(p => p.y)) });
  }
  const half = Math.max(...lines.map(text => width(text, fontSize, math)), 0) / 2;
  const x = note ? margin + half : Math.max(margin + half, Math.min(1 - margin - half, mark.at.x));
  const formulas = lines.map(text => math ? typesetMath(text, mark.color) : null);
  const offsets = [0];
  for (let i = 1; i < lines.length; i++) offsets.push(offsets[i - 1] + Math.max(fontSize * 1.45, fontSize * ((formulas[i - 1]?.descent ?? .25) + (formulas[i]?.ascent ?? 1)) + gap));
  const height = offsets.at(-1) ?? 0;
  const ascent = fontSize * (formulas[0]?.ascent ?? 1);
  const descent = fontSize * (formulas.at(-1)?.descent ?? .25);
  const firstY = Math.max(margin + ascent, mark.at.y);
  const candidates = [firstY];
  for (let y = firstY + .025; y + height + descent <= 1 - margin; y += .025) candidates.push(y);
  for (let y = margin + ascent; y < firstY; y += .025) candidates.push(y);
  for (const y of candidates) {
    const bounds = { left: x - half, right: x + half, top: y - ascent, bottom: y + height + descent };
    if (bounds.bottom > 1 - margin || occupied.some(box => intersects(bounds, box))) continue;
    return { ...group, drawables: lines.map((text, i) => ({ ...mark, key: `${mark.key}-line-${i}`, text, fontSize, heading, math, mathDrawing: formulas[i] ?? undefined, color: heading ? boardStyle.colors.muted : mark.color, textAnchor: note ? 'start' as const : 'middle' as const, at: { x: note ? margin : x, y: y + offsets[i] } })) };
  }
  // Keep the existing board intact when full. The tutor can remove/replace its
  // earlier groups; never erase student work or squeeze writing to make it fit.
  return null;
}
