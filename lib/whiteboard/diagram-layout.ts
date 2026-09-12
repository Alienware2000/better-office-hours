import type { Pt } from '@/lib/types';
import type { Drawable, ShapeGroup } from './geometry';
import { isMathText } from './text';
import { textWidth, writingBounds } from './writing';
import { typesetMath } from './math-layout';

type TextMark = Extract<Drawable, { kind: 'text' }>;
type Box = ReturnType<typeof writingBounds>;
const margin = .045;
const gap = .018;
const overlaps = (a: Box, b: Box) => a.left < b.right + gap && a.right > b.left - gap && a.top < b.bottom + gap && a.bottom > b.top - gap;

// Liang-Barsky segment/rectangle intersection catches sparse strokes too.
export function crossesLabel(from: Pt, to: Pt, box: Box): boolean {
  const dx = to.x - from.x, dy = to.y - from.y;
  let enter = 0, leave = 1;
  for (const [p, q] of [[-dx, from.x - box.left + gap], [dx, box.right - from.x + gap], [-dy, from.y - box.top + gap], [dy, box.bottom - from.y + gap]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0) enter = Math.max(enter, r); else leave = Math.min(leave, r);
    if (enter > leave) return false;
  }
  return true;
}

// Geometry is immutable. Only annotations are moved and their resolved layout
// is stored for both SVG and snapshot. Prefer the original local attachment,
// then a nearby clear position; never silently delete a crowded label.
export function layoutDiagram<T extends ShapeGroup>(groups: T[], ink: { points: Pt[] }[] = []): T[] {
  if (!groups.some(group => group.geometry?.length)) return groups;
  const traces = [...groups.flatMap(group => group.geometry ?? []), ...ink.map(stroke => stroke.points)];
  const segments = traces.flatMap(points => points.length === 1 ? [[points[0], points[0]]] : points.slice(1).map((point, i) => [points[i], point]));
  const isLabel = (group: T, mark: TextMark) => mark.diagramLabel || Boolean(group.geometry?.length) ||
    (!mark.heading && !/^(?:topic(?:-|$)|(?:given|note|definition)-)/.test(group.id) && !isMathText(mark.text));
  const occupied: Box[] = groups.flatMap(group => group.drawables.flatMap(mark => mark.kind === 'text' && !isLabel(group, mark) ? [writingBounds(mark)] : []));
  return groups.map(group => ({ ...group, drawables: group.drawables.map(mark => {
    if (mark.kind === 'text' && mark.heading) return { ...mark, fontSize: .048 };
    if (mark.kind !== 'text' || !isLabel(group, mark)) return mark;
    const preferred = mark.preferredAt ?? mark.at;
    const size = .038;
    const half = textWidth(mark.text, size, isMathText(mark.text)) / 2;
    // Overlong labels keep their existing wrapping rather than becoming tiny.
    if (half > .455) { occupied.push(writingBounds(mark)); return mark; }
    const base: TextMark = { ...mark, diagramLabel: true, preferredAt: preferred, fontSize: size, textAnchor: 'middle', math: isMathText(mark.text), mathDrawing: isMathText(mark.text) ? typesetMath(mark.text, mark.color) ?? undefined : undefined };
    const fit = (at: Pt) => ({ x: Math.max(margin + half, Math.min(1 - margin - half, at.x)), y: Math.max(margin + size, Math.min(1 - margin - size * .25, at.y)) });
    const candidates = [fit(preferred)];
    // Small concentric offsets retain association with the labeled object.
    for (const distance of [.035, .07, .105, .14, .19]) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [-1, -1], [1, 1], [-1, 1]]) candidates.push(fit({ x: preferred.x + dx * distance, y: preferred.y + dy * distance }));
    }
    let best = candidates[0], score = Infinity;
    for (const at of candidates) {
      const box = writingBounds({ ...base, at });
      const clashes = segments.filter(([from, to]) => crossesLabel(from, to, box)).length;
      const labels = occupied.filter(other => overlaps(box, other)).length;
      const cost = labels * 100 + clashes * 10 + Math.hypot(at.x - preferred.x, at.y - preferred.y);
      if (cost < score) { best = at; score = cost; }
    }
    const placed = { ...base, at: best };
    occupied.push(writingBounds(placed));
    return placed;
  }) }));
}
