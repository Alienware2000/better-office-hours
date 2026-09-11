import type { Pt } from "../types";

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

// Interpolate the declared points, including extrema and attached markers.
// Bound each cubic to its segment box so smoothing cannot invent an overshoot.
function curveSegments(points: Pt[]) {
  return points.slice(1).map((end, i) => {
    const start = points[i];
    // Extrapolate endpoint neighbors so uniform straight samples stay uniform
    // in time, without an accidental ease-in/ease-out at the ends.
    const before = points[i - 1] ?? { x: 2 * start.x - end.x, y: 2 * start.y - end.y };
    const after = points[i + 2] ?? { x: 2 * end.x - start.x, y: 2 * end.y - start.y };
    const bound = (p: Pt): Pt => ({
      x: clamp(p.x, Math.min(start.x, end.x), Math.max(start.x, end.x)),
      y: clamp(p.y, Math.min(start.y, end.y), Math.max(start.y, end.y)),
    });
    return { start, end,
      a: bound({ x: start.x + (end.x - before.x) / 6, y: start.y + (end.y - before.y) / 6 }),
      b: bound({ x: end.x - (after.x - start.x) / 6, y: end.y - (after.y - start.y) / 6 }),
    };
  });
}

type Segment = ReturnType<typeof curveSegments>[number];
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

// De Casteljau subdivision retains the full curve's controls during reveal.
// Rebuilding a spline from a truncated point list would bend earlier strokes.
function prefix(s: Segment, t: number): Segment {
  const a = lerp(s.start, s.a, t), middle = lerp(s.a, s.b, t), last = lerp(s.b, s.end, t);
  const b = lerp(a, middle, t);
  return { start: s.start, a, b, end: lerp(b, lerp(middle, last, t), t) };
}

// Preserve the tutor's point-index timing, including duplicate-point holds.
// This is an interpolant, not an arc-length or physical simulation engine.
export function curvePoint(points: Pt[], progress: number): Pt {
  if (points.length < 2) return points[0] ?? { x: 0, y: 0 };
  const index = clamp(progress) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(index));
  if (points.length === 2) return lerp(points[0], points[1], index);
  return prefix(curveSegments(points)[i], index - i).end;
}

export function curvePath(points: Pt[], progress = 1): string {
  if (!points.length) return '';
  const move = `M ${points[0].x} ${points[0].y}`;
  if (points.length < 2 || progress <= 0) return move;
  if (points.length === 2) {
    const end = curvePoint(points, progress);
    return `${move} L ${end.x} ${end.y}`;
  }
  const index = clamp(progress) * (points.length - 1), complete = Math.floor(index);
  const segments = curveSegments(points);
  const visible = segments.slice(0, complete);
  if (complete < segments.length && index > complete) visible.push(prefix(segments[complete], index - complete));
  return move + visible.map(({ a, b, end }) => ` C ${a.x} ${a.y} ${b.x} ${b.y} ${end.x} ${end.y}`).join('');
}

export function curveTrace(points: Pt[]): Pt[] {
  if (points.length <= 2) return points;
  return [points[0], ...curveSegments(points).flatMap(segment =>
    Array.from({ length: 12 }, (_, i) => prefix(segment, (i + 1) / 12).end))];
}
