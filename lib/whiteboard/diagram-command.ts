import type { DrawCommand, Pt } from '@/lib/types';

// Optional local DRAW metadata. The shared DrawCommand contract stays frozen;
// the voice/board adapter resolves relationships into ordinary geometry.
export type DiagramOptions = {
  interpolation?: 'linear' | 'smooth';
  fill?: 'paper' | 'tint';
  weight?: 'light' | 'normal' | 'strong';
  surface?: 'left' | 'right';
  labelSide?: 'left' | 'right';
  contact?: { with: string; t: number; side: 'left' | 'right' };
  attach?: { to: string; anchor: 'center' | 'start' | 'end'; offset?: Pt };
};
export type DiagramCommand = DrawCommand & { diagram?: DiagramOptions };

const object = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const id = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 100;

export function diagramOptions(command: DrawCommand): DiagramOptions | null {
  const input: unknown = (command as DiagramCommand).diagram;
  if (input === undefined) return {};
  if (!object(input)) return null;
  if (input.interpolation !== undefined && (command.op !== 'curve' || !['linear', 'smooth'].includes(String(input.interpolation)))) return null;
  if (input.fill !== undefined && !['paper', 'tint'].includes(String(input.fill))) return null;
  if (input.weight !== undefined && !['light', 'normal', 'strong'].includes(String(input.weight))) return null;
  for (const key of ['surface', 'labelSide']) if (input[key] !== undefined && !['left', 'right'].includes(String(input[key]))) return null;
  if (input.surface && command.op !== 'line') return null;
  if (input.contact !== undefined) {
    const c = input.contact;
    if (command.op !== 'circle' || !object(c) || !id(c.with) || !finite(c.t) || c.t < 0 || c.t > 1 || !['left', 'right'].includes(String(c.side))) return null;
  }
  if (input.attach !== undefined) {
    const a = input.attach;
    if (!['line', 'arrow'].includes(command.op) || !object(a) || !id(a.to) || !['center', 'start', 'end'].includes(String(a.anchor))) return null;
    if (a.offset !== undefined && (!object(a.offset) || !finite(a.offset.x) || !finite(a.offset.y) || Math.abs(a.offset.x) > .3 || Math.abs(a.offset.y) > .3)) return null;
  }
  if (input.contact && input.attach) return null;
  return input as DiagramOptions;
}
