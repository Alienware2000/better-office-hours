export type InkPoint = { x: number; y: number };
export type InkBounds = { x: number; y: number; w: number; h: number };

// Midpoint quadratics remove jagged sample joins without inventing new marks.
// The same path is painted in the UI and in the model's snapshot.
export function inkPath(points: InkPoint[]) {
  if (!points.length) return '';
  const first = points[0];
  if (points.length === 1) return `M${first.x},${first.y}l.0001,.0001`;
  let d = `M${first.x},${first.y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i], next = points[i + 1];
    d += `Q${p.x},${p.y} ${(p.x + next.x) / 2},${(p.y + next.y) / 2}`;
  }
  const last = points.at(-1)!;
  return `${d}L${last.x},${last.y}`;
}

export function inkBounds(points: InkPoint[]): InkBounds {
  let x = 1, y = 1, right = 0, bottom = 0;
  for (const p of points) { x = Math.min(x,p.x); y = Math.min(y,p.y); right = Math.max(right,p.x); bottom = Math.max(bottom,p.y); }
  return { x, y, w: Math.max(0,right-x), h: Math.max(0,bottom-y) };
}

export function hitInk(points: InkPoint[], at: InkPoint, radius: InkPoint) {
  for (let i = 0; i < points.length; i++) {
    const a = { x: (points[i].x - at.x) / radius.x, y: (points[i].y - at.y) / radius.y };
    const next = points[Math.min(i + 1, points.length - 1)];
    const dx = (next.x - points[i].x) / radius.x, dy = (next.y - points[i].y) / radius.y;
    const t = Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / (dx * dx + dy * dy || 1)));
    if ((a.x + t * dx) ** 2 + (a.y + t * dy) ** 2 <= 1) return true;
  }
  return false;
}

export function moveInk<T extends { id: string; points: InkPoint[] }>(strokes: T[], ids: string[], delta: InkPoint): T[] {
  const points = strokes.filter(s => ids.includes(s.id)).flatMap(s => s.points);
  if (!points.length) return strokes;
  const b = inkBounds(points);
  const dx = Math.max(-b.x, Math.min(1 - b.x - b.w, delta.x));
  const dy = Math.max(-b.y, Math.min(1 - b.y - b.h, delta.y));
  return strokes.map(s => ids.includes(s.id) ? { ...s, points: s.points.map(p => ({ x: p.x + dx, y: p.y + dy })) } : s);
}
