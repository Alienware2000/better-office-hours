import type { AnimationSpec } from "@/lib/types";
import { animationFrame } from "@/lib/whiteboard/animation";
import { boardStyle, boardTextSize } from "@/lib/whiteboard/style";

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
              <text
                key={mark.key}
                className="board-label"
                x={mark.at.x}
                y={mark.at.y}
                fill={mark.color}
                fontSize={boardTextSize(mark.text, mark.size, mark.at.x)}
                textAnchor="middle"
              >
                {mark.text}
              </text>
            ) : (
              <path
                key={mark.key}
                className="board-path"
                d={mark.d}
                stroke={mark.color}
                style={{
                  strokeWidth: focus === group.id ? 3 : boardStyle.stroke,
                }}
              />
            ),
          )}
        </g>
      ))}
    </g>
  );
}
