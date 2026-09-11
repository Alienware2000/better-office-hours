import { isMathText, LABEL_FONT, MATH_FONT, textRuns } from "./text";
import { animationFrame } from "./animation";
import { boardTextSize } from "./style";
import type { AnimationSpec, BoardSnapshot } from "@/lib/types";
import { BOARD_CREAM, STUDENT_HEX } from "./colors";
import type { BoardStroke } from "./store";
import type { ShapeGroup } from "./geometry";
import { inkPath } from "./ink-path";
import { typesetMath } from './math-layout';

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
    ? animationFrame(animation.spec, animation.time, groups, student)
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
        ctx.globalAlpha = opacity;
        if (mark.kind === "text") {
          ctx.save();
          const formula = mark.mathDrawing ?? ((mark.math ?? (!mark.heading && isMathText(mark.text))) ? typesetMath(mark.text, mark.color) : null);
          if (formula) {
            const size = mark.fontSize ?? .068;
            ctx.translate(mark.at.x - (mark.textAnchor === 'start' ? 0 : formula.width * size / 2), mark.at.y);
            ctx.scale(size / 1000, size / 1000);
            for (const path of formula.paths) {
              ctx.save();
              ctx.transform(...path.matrix);
              ctx.fillStyle = path.color;
              ctx.fill(new Path2D(path.d));
              ctx.restore();
            }
            ctx.restore();
            continue;
          }
          // Match SVG's preserveAspectRatio=none: horizontal glyph metrics use
          // board width, vertical metrics use height even on a compact board.
          ctx.scale(1 / h, 1 / h);
          ctx.fillStyle = mark.color;
          ctx.font = `500 ${(mark.fontSize ?? boardTextSize(mark.text, mark.size, mark.at.x)) * h}px ${(mark.math ?? (!mark.heading && isMathText(mark.text))) ? MATH_FONT : LABEL_FONT}`;
          ctx.textAlign = "left";
          let x = mark.at.x * h - (mark.textAnchor === "start" ? 0 : ctx.measureText(mark.text).width / 2);
          for (const run of textRuns(mark.text, mark.color)) {
            ctx.fillStyle = run.color;
            ctx.fillText(run.text, x, mark.at.y * h);
            x += ctx.measureText(run.text).width;
          }
          ctx.restore();
          continue;
        }
        const path = new Path2D(mark.d);
        if (mark.kind === 'fill' || mark.kind === 'head') {
          ctx.fillStyle = mark.color;
          ctx.globalAlpha = opacity * (mark.kind === 'fill' ? mark.opacity ?? 1 : 1);
          ctx.fill(path);
          continue;
        }
        ctx.strokeStyle = mark.color;
        ctx.globalAlpha = opacity * (mark.opacity ?? 1);
        ctx.lineWidth = (mark.width ?? 2.1) / width;
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
    if (!stroke.points.length) continue;
    ctx.save();
    ctx.scale(w, h);
    ctx.strokeStyle = STUDENT_HEX[stroke.color];
    ctx.globalAlpha = stroke.tool === "highlighter" ? 0.42 : 0.92;
    ctx.lineWidth =
      stroke.tool === "highlighter"
            ? 18 / width
            : 2.5 / width;
    ctx.stroke(new Path2D(inkPath(stroke.points)));
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  return {
    imageUrl: canvas.toDataURL("image/jpeg", 0.72),
    studentShapesSince: new Date().toISOString(),
  };
}
