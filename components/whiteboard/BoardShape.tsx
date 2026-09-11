import type { Drawable } from '@/lib/whiteboard/geometry';

export function BoardShape({ mark, entering = false, focused = false }: {
  mark: Exclude<Drawable, { kind: 'text' }>; entering?: boolean; focused?: boolean;
}) {
  const filled = mark.kind === 'fill' || mark.kind === 'head';
  return <path
    className={[`board-${mark.kind}`, mark.kind === 'path' && mark.dashed && !entering ? 'is-dashed' : '', entering ? 'is-entering' : ''].filter(Boolean).join(' ')}
    d={mark.d} pathLength={mark.kind === 'path' ? 1 : undefined}
    style={{ fill: filled ? mark.color : 'none', stroke: filled ? 'none' : mark.color,
      strokeWidth: mark.kind === 'path' ? (focused ? 3 : mark.width ?? 2.1) : undefined,
      opacity: 'opacity' in mark ? mark.opacity : undefined }} />;
}
