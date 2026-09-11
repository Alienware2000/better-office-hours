import { BoardText } from "./BoardText";
import type { AnimationSpec } from "@/lib/types";
import { animationFrame } from "@/lib/whiteboard/animation";
import { BoardShape } from './BoardShape';

export function AnimLayer({
  spec,
  time,
  focus,
}: {
  spec: AnimationSpec;
  time: number;
  focus: string | null;
}) {
  const { groups, camera } = animationFrame(spec, time);
  return (
    <g
      data-animation={spec.id}
      transform={`translate(0.5 0.5) scale(${camera.zoom}) translate(${-camera.x} ${-camera.y})`}
    >
      {groups.map((group) => (
        <g
          key={group.id}
          data-shape={group.id}
          opacity={group.opacity * (focus && focus !== group.id ? 0.4 : 1)}
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
