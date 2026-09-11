import type { AnimationSpec, Pt } from '@/lib/types';
import type { AnimGroup } from './animation';
import type { Drawable, ShapeGroup } from './geometry';
import { annotationDrawables, crossesLabel, labelsOverlap } from './diagram-layout';
import { writingBounds } from './writing';

type Text = Extract<Drawable, { kind: 'text' }>;
type Box = ReturnType<typeof writingBounds>;
type Ink = { points: Pt[] }[];
type Plan = { backdrop: ShapeGroup[]; ink: Ink; offsets: Map<string, Pt> };
const cache = new WeakMap<AnimationSpec, Plan[]>();
const candidates: Pt[] = [{ x: 0, y: 0 }];
for (const d of [.035, .07, .105, .14]) {
  for (const [x, y] of [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [-1, -1], [1, 1], [-1, 1]]) candidates.push({ x: x * d, y: y * d });
}
const moved = (mark: Text, offset: Pt): Text => ({ ...mark, at: { x: mark.at.x + offset.x, y: mark.at.y + offset.y } });
function obstacles(groups: ShapeGroup[], ink: Ink) {
  const traces = [...groups.flatMap(g => g.geometry ?? []), ...ink.map(s => s.points)];
  const segments = traces.flatMap(points => points.length === 1 ? [[points[0], points[0]]] : points.slice(1).map((p, i) => [points[i], p]));
  const bodies: Box[] = groups.filter(g => g.drawables.some(m => m.kind === 'fill')).flatMap(g => {
    const points = g.geometry?.flat() ?? [];
    return points.length ? [{ left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)), top: Math.min(...points.map(p => p.y)), bottom: Math.max(...points.map(p => p.y)) }] : [];
  });
  return { segments, bodies };
}

// Choose one offset per label for the entire motion, including keyframes and
// intermediate samples. Recompute only when scene/backdrop/ink changes, never
// while scrubbing: a local collision solver on each frame makes labels jump.
export function layoutAnimationLabels(spec: AnimationSpec, groups: AnimGroup[], sample: (t: number) => { groups: AnimGroup[]; camera: { x: number; y: number; zoom: number } }, backdrop: ShapeGroup[], ink: Ink): AnimGroup[] {
  let plans = cache.get(spec);
  let plan = plans?.find(p => p.backdrop === backdrop && p.ink === ink);
  if (!plan) {
    const times = new Set(Array.from({ length: 17 }, (_, i) => spec.duration * i / 16));
    for (const shape of spec.shapes) for (const frame of shape.keyframes ?? []) times.add(frame.t);
    const sorted = [...times].sort((a, b) => a - b);
    const bounded = sorted.length <= 65 ? sorted : Array.from({ length: 65 }, (_, i) => sorted[Math.round(i * (sorted.length - 1) / 64)]);
    const samples = bounded.map(t => {
      const frame = sample(t), { x, y, zoom } = frame.camera;
      const project = (p: Pt): Pt => ({ x: .5 + (p.x - x) * zoom, y: .5 + (p.y - y) * zoom });
      const boxOnPaper = (b: Box): Box => {
        const a = project({ x: b.left, y: b.top }), z = project({ x: b.right, y: b.bottom });
        return { left: a.x, top: a.y, right: z.x, bottom: z.y };
      };
      const visible = frame.groups.filter(g => g.opacity > .03);
      return { labels: new Map(visible.flatMap(g => g.drawables.filter((m): m is Text => m.kind === 'text').map(m => [m.key, m]))),
        boxOnPaper,
        occupied: backdrop.flatMap(g => g.drawables.filter((m): m is Text => m.kind === 'text').map(writingBounds)),
        ...obstacles([...backdrop, ...visible.map(g => ({ ...g, geometry: g.geometry?.map(points => points.map(project)) }))], ink) };
    });
    const offsets = new Map<string, Pt>();
    const keys = new Set(samples.flatMap(s => [...s.labels.keys()]));
    for (const key of keys) {
      let best = candidates[0], bestCost = Infinity;
      for (const offset of candidates) {
        let cost = Math.hypot(offset.x, offset.y);
        for (const s of samples) {
          const mark = s.labels.get(key);
          if (!mark) continue;
          const box = s.boxOnPaper(writingBounds(moved(mark, offset)));
          if (box.left < .035 || box.right > .965 || box.top < .045 || box.bottom > .955) cost += 1000;
          cost += s.occupied.filter(other => labelsOverlap(box, other)).length * 100;
          cost += s.bodies.filter(other => labelsOverlap(box, other)).length * 20;
          cost += s.segments.filter(([a, b]) => crossesLabel(a, b, box)).length * 10;
        }
        if (cost < bestCost) { bestCost = cost; best = offset; }
      }
      offsets.set(key, best);
      for (const s of samples) {
        const mark = s.labels.get(key);
        if (mark) s.occupied.push(s.boxOnPaper(writingBounds(moved(mark, best))));
      }
    }
    plan = { backdrop, ink, offsets };
    plans = [plan, ...(plans ?? [])].slice(0, 3);
    cache.set(spec, plans);
  }
  return groups.map(group => ({ ...group, drawables: group.drawables.flatMap(mark => mark.kind === 'text' ? annotationDrawables(mark, moved(mark, plan.offsets.get(mark.key) ?? candidates[0])) : [mark]) }));
}
