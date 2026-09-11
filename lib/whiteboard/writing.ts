import type { Drawable, ShapeGroup } from './geometry';
import { boardStyle, boardTextSize } from './style';

type TextMark = Extract<Drawable, { kind: 'text' }>;
type Box = { left: number; right: number; top: number; bottom: number };
const margin = .055;
const gap = .025;
const width = (text: string, size: number) => text.length * size * .65;
const intersects = (a: Box, b: Box) => a.left < b.right + gap && a.right > b.left - gap && a.top < b.bottom + gap && a.bottom > b.top - gap;

export function writingBounds(mark: TextMark): Box {
  const size = mark.fontSize ?? boardTextSize(mark.text, mark.size, mark.at.x);
  const half = width(mark.text, size) / 2;
  const left = mark.textAnchor === "start" ? mark.at.x : mark.at.x - half;
  return { left, right: left + half * 2, top: mark.at.y - size, bottom: mark.at.y + size * .25 };
}

// Resolve writing once in board coordinates. The snapshot and rendered board
// consume the same lines; existing writing never jumps when a new line arrives.
export function layoutWriting(group: ShapeGroup, groups: ShapeGroup[], ink: { points: { x: number; y: number }[] }[]): ShapeGroup | null {
  if (group.drawables.length !== 1 || group.drawables[0].kind !== 'text') return group;
  const mark = group.drawables[0];
  const heading = group.id === 'topic' || group.id.startsWith('topic-');
  const note = heading || /^(given|note|definition)-/.test(group.id);
  const fontSize = heading ? .057 : mark.size === 'm' ? .085 : .068;
  const maxCharacters = Math.floor((1 - margin * 2) / (fontSize * .65));
  const lines: string[] = [];
  let line = '';
  // Keep a short assignment such as a = ? on the same line.
  for (const word of mark.text.match(/\S+\s*=\s*\S+|\S+/g) ?? []) {
    if (line && line.length + word.length + 1 > maxCharacters) { lines.push(line); line = ''; }
    // Even an unbroken model token must stay inside the paper.
    let rest = word;
    while (rest.length > maxCharacters) { lines.push(rest.slice(0, maxCharacters)); rest = rest.slice(maxCharacters); }
    line = line ? `${line} ${rest}` : rest;
  }
  if (line) lines.push(line);
  const occupied: Box[] = groups.filter(g => g.id !== group.id).flatMap(g => g.drawables.filter((d): d is TextMark => d.kind === 'text').map(writingBounds));
  for (const stroke of ink) {
    if (!stroke.points.length) continue;
    occupied.push({ left: Math.min(...stroke.points.map(p => p.x)), right: Math.max(...stroke.points.map(p => p.x)), top: Math.min(...stroke.points.map(p => p.y)), bottom: Math.max(...stroke.points.map(p => p.y)) });
  }
  const half = Math.max(...lines.map(text => width(text, fontSize)), 0) / 2;
  const x = note ? margin + half : Math.max(margin + half, Math.min(1 - margin - half, mark.at.x));
  const height = (lines.length - 1) * fontSize * 1.45;
  const firstY = Math.max(margin + fontSize, mark.at.y);
  const candidates = [firstY];
  for (let y = firstY + .025; y + height + fontSize * .25 <= 1 - margin; y += .025) candidates.push(y);
  for (let y = margin + fontSize; y < firstY; y += .025) candidates.push(y);
  for (const y of candidates) {
    const bounds = { left: x - half, right: x + half, top: y - fontSize, bottom: y + height + fontSize * .25 };
    if (bounds.bottom > 1 - margin || occupied.some(box => intersects(bounds, box))) continue;
    return { ...group, drawables: lines.map((text, i) => ({ ...mark, key: `${mark.key}-line-${i}`, text, fontSize, heading, color: heading ? boardStyle.colors.muted : mark.color, textAnchor: note ? 'start' as const : 'middle' as const, at: { x: note ? margin : x, y: y + i * fontSize * 1.45 } })) };
  }
  // Keep the existing board intact when full. The tutor can remove/replace its
  // earlier groups; never erase student work or squeeze writing to make it fit.
  return null;
}
