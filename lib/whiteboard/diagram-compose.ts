import type { DrawCommand, Pt } from '@/lib/types';
import { interpretCommand, type ShapeGroup } from './geometry';
import { diagramOptions } from './diagram-command';

const inside = (p: Pt) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });

function anchor(command: DrawCommand, name: 'center' | 'start' | 'end'): Pt | null {
  if (command.op === 'circle') return name === 'center' ? command.center : null;
  if (command.op === 'line' || command.op === 'arrow') return name === 'start' ? command.from : name === 'end' ? command.to : { x: (command.from.x + command.to.x) / 2, y: (command.from.y + command.to.y) / 2 };
  return null;
}

// Resolve only relationships the tutor explicitly declares. Never infer a
// surface/object/force from its name, label, or the student's spoken words.
export function composeDiagram<T extends ShapeGroup>(groups: T[]): T[] {
  const sources = new Map(groups.filter(g => g.source).map(g => [g.id, g.source!]));
  const resolved = new Map<string, DrawCommand | null>();
  const visiting = new Set<string>();
  function resolve(id: string, depth = 0): DrawCommand | null {
    if (resolved.has(id)) return resolved.get(id)!;
    if (visiting.has(id) || depth > 32) return null;
    const source = sources.get(id);
    if (!source) return null;
    visiting.add(id);
    const options = diagramOptions(source);
    let command: DrawCommand | null = options ? source : null;
    if (options?.contact && source.op === 'circle') {
      const contact = options.contact;
      const surface = resolve(contact.with, depth + 1);
      command = null;
      if (surface?.op === 'line') {
        const delta = sub(surface.to, surface.from), length = Math.hypot(delta.x, delta.y);
        const r = source.r;
        if (length > .005 && Number.isFinite(r) && r >= .006 && r <= .45) {
          const sign = contact.side === 'left' ? 1 : -1;
          const center = {
            x: surface.from.x + contact.t * delta.x + sign * delta.y / length * r,
            y: surface.from.y + contact.t * delta.y - sign * delta.x / length * r,
          };
          if (inside({ x: center.x - r, y: center.y - r }) && inside({ x: center.x + r, y: center.y + r })) command = { ...source, center };
        }
      }
    } else if (options?.attach && (source.op === 'arrow' || source.op === 'line')) {
      const attach = options.attach, target = resolve(attach.to, depth + 1);
      const at = target && anchor(target, attach.anchor);
      command = null;
      if (at) {
        const from = add(at, attach.offset ?? { x: 0, y: 0 });
        const to = add(from, sub(source.to, source.from));
        if (inside(from) && inside(to)) command = { ...source, from, to };
      }
    }
    visiting.delete(id);
    resolved.set(id, command);
    return command;
  }
  return groups.map(group => {
    if (!group.source) return group;
    const command = resolve(group.id);
    const op = command && interpretCommand(command, 0);
    if (!op || op.kind !== 'draw') return { ...group, drawables: [], geometry: undefined, unresolved: true };
    return { ...group, ...op.group, source: group.source, unresolved: false };
  });
}
