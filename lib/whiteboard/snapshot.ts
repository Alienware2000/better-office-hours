import { animationFrame } from "./animation";
import { boardTextSize } from "./style";
import type { AnimationSpec, BoardSnapshot } from "@/lib/types";
import { BOARD_CREAM, STUDENT_HEX } from "./colors";
import type { BoardStroke } from "./store";
import type { ShapeGroup } from "./geometry";

const MAX_WIDTH = 768;

export function snapshotBoard(
  groups: ShapeGroup[],
  student: BoardStroke[],
  cssWidth: number,
  cssHeight: number,
  animation?: { spec: AnimationSpec; time: number; focus: string | null },
): BoardSnapshot | null {
  const width = Math.max(120, Math.round(cssWidth));
  const height = Math.max(80, Math.round(cssHeight));
  const scale = Math.min(1, MAX_WIDTH / width);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = BOARD_CREAM;
  ctx.fillRect(0, 0, w, h);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.save();
  ctx.scale(w, h);
  ctx.lineWidth = 2.3 / w;
  const animated = animation
    ? animationFrame(animation.spec, animation.time)
    : null;
  const layers = [{ groups, camera: null }, ...(animated ? [animated] : [])];
  for (const layer of layers) {
    ctx.save();
    if (layer.camera) {
      ctx.translate(0.5, 0.5);
      ctx.scale(layer.camera.zoom, layer.camera.zoom);
      ctx.translate(-layer.camera.x, -layer.camera.y);
    }
    for (const group of layer.groups) {
      const opacity =
        ("opacity" in group ? Number(group.opacity) : 1) *
        (layer.camera && animation?.focus && animation.focus !== group.id
          ? 0.4
          : 1);
      ctx.globalAlpha = opacity;
      for (const mark of group.drawables) {
        if (mark.kind === "text") {
          ctx.save();
          ctx.scale(1 / w, 1 / h);
          ctx.fillStyle = mark.color;
          ctx.font = `${boardTextSize(mark.text, mark.size, mark.at.x) * h}px "Source Sans 3", system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(mark.text, mark.at.x * w, mark.at.y * h);
          ctx.restore();
          continue;
        }
        const path = new Path2D(mark.d);
        ctx.strokeStyle = mark.color;
        ctx.globalAlpha = opacity;
        if (mark.kind === "path" && mark.dashed) {
          ctx.setLineDash([8 / w, 6 / w]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke(path);
      }
    }
    ctx.restore();
  }
  ctx.restore();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const stroke of student) {
    if (stroke.points.length < 2) continue;
    ctx.beginPath();
    ctx.strokeStyle = STUDENT_HEX[stroke.color];
    ctx.globalAlpha = stroke.tool === "highlighter" ? 0.42 : 0.92;
    ctx.lineWidth =
      stroke.tool === "highlighter"
        ? Math.max(10, w * 0.045)
        : Math.max(2, w * 0.007);
    ctx.moveTo(stroke.points[0].x * w, stroke.points[0].y * h);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x * w, stroke.points[i].y * h);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  return {
    imageUrl: canvas.toDataURL("image/jpeg", 0.72),
    studentShapesSince: new Date().toISOString(),
  };
}
