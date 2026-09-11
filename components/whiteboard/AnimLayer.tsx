import { BoardText } from "./BoardText";
import type { AnimationSpec } from "@/lib/types";
import { animationFrame } from "@/lib/whiteboard/animation";
import { BoardShape } from './BoardShape';
import type { ShapeGroup } from '@/lib/whiteboard/geometry';
import type { BoardStroke } from '@/lib/whiteboard/store';

export function AnimLayer({
  spec,
  time,
  focus,
  backdrop,
  student,
}: {
  spec: AnimationSpec;
  time: number;
  focus: string | null;
  backdrop: ShapeGroup[];
  student: BoardStroke[];
}) {
  const { groups, camera } = animationFrame(spec, time, backdrop, student);
  return (
    <g
      data-animation={spec.id}
      transform={`translate(0.5 0.5) scale(${camera.zoom}) translate(${-camera.x} ${-camera.y})`}
    >
      {groups.map((group) => (
        <g
          key={group.id}
          data-shape={group.id}
          opacity={group.opacity * (focus && focus !== group.id ? 0.72 : 1)}
        >
          {group.drawables.map((mark) =>
            mark.kind === "text" ? (
              <BoardText key={mark.key} mark={mark} />
            ) : (
              <BoardShape key={mark.key} mark={mark} focused={focus === group.id} />
            ),
          )}
        </g>
      ))}
    </g>
  );
}
