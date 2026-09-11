import type { AnimShape, Color, DrawCommand, Pt } from '../types';
import { diagramOptions } from './diagram-command';

// Local rendering metadata, retained in live board/session state. No SVG or
// executable content: the model still draws with the shared primitive commands.
export type BodyAppearance = {
  points: Pt[]; // Local coordinates centered on the bounding box, within -1..1.
  radius: number;
  interpolation: 'linear' | 'smooth';
  fill: 'paper' | 'tint';
  color: Color;
  weight: 'light' | 'normal' | 'strong';
};
export type BodyDot = Extract<AnimShape, { kind: 'dot' }> & { appearance?: BodyAppearance };

export function validAppearance(value: unknown): value is BodyAppearance {
  if (!value || typeof value !== 'object') return false;
  const v = value as BodyAppearance;
  return Array.isArray(v.points) && v.points.length >= 4 && v.points.length <= 256 &&
    v.points.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(p.x) <= 1.000001 && Math.abs(p.y) <= 1.000001) &&
    Math.hypot(v.points[0].x - v.points.at(-1)!.x, v.points[0].y - v.points.at(-1)!.y) < .000001 &&
    Number.isFinite(v.radius) && v.radius >= .006 && v.radius <= .45 &&
    ['linear', 'smooth'].includes(v.interpolation) && ['paper', 'tint'].includes(v.fill) &&
    ['ink', 'accent', 'muted', 'warn'].includes(v.color) && ['light', 'normal', 'strong'].includes(v.weight);
}

export function closedBody(command: DrawCommand): { center: Pt; appearance: BodyAppearance } | null {
  if (command.op !== 'curve') return null;
  const options = diagramOptions(command), points = command.points;
  if (!options?.fill || !Array.isArray(points) || points.length < 4 || points.length > 256 ||
    !points.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1) ||
    Math.hypot(points[0].x - points.at(-1)!.x, points[0].y - points.at(-1)!.y) >= .001) return null;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
  if (right - left < .003 || bottom - top < .003) return null;
  const center = { x: (left + right) / 2, y: (top + bottom) / 2 }, radius = Math.max(right - left, bottom - top) / 2;
  const local = points.map(p => ({ x: (p.x - center.x) / radius, y: (p.y - center.y) / radius }));
  local[local.length - 1] = { ...local[0] };
  const appearance: BodyAppearance = { points: local, radius, interpolation: options.interpolation ?? 'smooth', fill: options.fill, color: command.color ?? 'ink', weight: options.weight ?? 'normal' };
  return validAppearance(appearance) ? { center, appearance } : null;
}
