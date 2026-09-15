import type { PanelCommand, Pt } from '@/lib/types';
import type { Drawable, ShapeGroup } from './geometry';
import { boardStyle } from './style';
import { textWidth } from './writing';

const object = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
const label = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max && !/[<>\[\]{}\\]/.test(v);
const color = (v: unknown) => typeof v === 'string' && Object.hasOwn(boardStyle.colors, v);
export function validPanel(value: unknown): value is PanelCommand {
  if (!object(value) || value.op !== 'panel' || !label(value.id, 80) || !label(value.title, 36) || ![0, 1].includes(Number(value.slot)) || typeof value.slot !== 'number') return false;
  if (value.connect !== undefined && typeof value.connect !== 'boolean') return false;
  return Array.isArray(value.items) && value.items.length >= 1 && value.items.length <= 3 && value.items.every(item => {
    if (!object(item) || !label(item.label, 28) || String(item.label).split(/\s+/).some(word => word.length > 16) || !['circle', 'box', 'band'].includes(String(item.shape))) return false;
    if (item.color !== undefined && !color(item.color)) return false;
    if (item.colors !== undefined && (!Array.isArray(item.colors) || item.colors.length < 2 || item.colors.length > 8 || !item.colors.every(color))) return false;
    if (item.shape === 'band' && !item.colors) return false;
    return item.gaps === undefined || (item.shape === 'band' && Array.isArray(item.gaps) && item.gaps.length <= 8 && item.gaps.every(n => typeof n === 'number' && Number.isFinite(n) && n >= .02 && n <= .98));
  });
}
const boxPath = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
function mix(a: string, b: string, t: number) {
  const rgb = [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t));
  return `#${rgb.map(n => n.toString(16).padStart(2, '0')).join('')}`;
}
// Fixed title, figure, and caption rows prevent text/geometry competition.
// Items are generic objects, boxes, or continuous bands, never topic fixtures.
export function panelGroup(command: PanelCommand): ShapeGroup {
  const top = .10 + command.slot * .36, ink = boardStyle.colors.ink;
  const drawables: Drawable[] = [], geometry: Pt[][] = [];
  let seq = 0;
  const key = () => `${command.id}-${seq++}`;
  const text = (value: string, x: number, y: number, size: number, start = false) => drawables.push({ kind: 'text', key: key(), text: value, at: { x, y }, size: 's', fontSize: size, math: false, color: ink, textAnchor: start ? 'start' : 'middle', diagramLabel: true });
  text(command.title, .07, top + .035, Math.min(.030, .86 / textWidth(command.title, 1, false)), true);
  const cell = .86 / command.items.length;
  command.items.forEach((item, index) => {
    const x = .07 + index * cell, center = x + cell / 2, y = top + .10, w = cell - .055;
    const chosen = boardStyle.colors[item.color ?? 'ink'];
    if (item.shape === 'band') {
      const stops = item.colors!.map(c => boardStyle.colors[c]);
      for (let i = 0; i < 64; i++) {
        const at = i / 63 * (stops.length - 1), lo = Math.min(stops.length - 2, Math.floor(at));
        drawables.push({ kind: 'fill', key: key(), d: boxPath(center - w / 2 + i * w / 64, y, w / 64 + .0002, .075), color: mix(stops[lo], stops[lo + 1], at - lo) });
      }
      for (const gap of item.gaps ?? []) drawables.push({ kind: 'fill', key: key(), d: boxPath(center - w / 2 + gap * w - .0025, y, .005, .075), color: ink });
    } else {
      const radius = .047;
      const d = item.shape === 'circle' ? `M ${center - radius} ${y + radius} a ${radius} ${radius} 0 1 0 ${2 * radius} 0 a ${radius} ${radius} 0 1 0 ${-2 * radius} 0` : boxPath(center - .065, y, .13, .095);
      drawables.push({ kind: 'fill', key: key(), d, color: chosen, opacity: .12 }, { kind: 'path', key: key(), d, color: chosen, width: 2 });
    }
    geometry.push([{ x: center - w / 2, y }, { x: center + w / 2, y: y + .095 }]);
    const maxChars = Math.floor(w / (.026 * .62));
    const words = item.label.split(/\s+/), lines: string[] = [''];
    for (const word of words) {
      if (lines.at(-1) && (lines.at(-1)!.length + word.length + 1) > maxChars) lines.push('');
      lines[lines.length - 1] += (lines.at(-1) ? ' ' : '') + word;
    }
    // Validation bounds the source; use at most three caption rows.
    const size = Math.min(.026, w / Math.max(...lines.map(line => textWidth(line, 1, false))));
    lines.forEach((line, row) => text(line, center, top + .235 + row * .052, size));
    if (command.connect && index < command.items.length - 1) {
      const halfWidth = (shape: string) => shape === 'band' ? w / 2 : shape === 'box' ? .065 : .047;
      const from = center + halfWidth(item.shape) + .008, to = center + cell - halfWidth(command.items[index + 1].shape) - .008, mid = y + .045;
      drawables.push({ kind: 'path', key: key(), d: `M ${from} ${mid} L ${to} ${mid}`, color: ink, width: 1.5 }, { kind: 'head', key: key(), d: `M ${to} ${mid} l -.012 -.006 v .012 Z`, color: ink });
    }
  });
  return { id: command.id, source: command, drawables, geometry, fixedLayout: true };
}
