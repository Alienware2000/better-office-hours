export type InkTool = "hand" | "pen" | "highlighter" | "eraser";

export type InkColor = "ink" | "gold" | "rust";

export type InkPoint = { x: number; y: number };

export type InkStroke = {
  id: string;
  page: number;
  tool: "pen" | "highlighter";
  color: InkColor;
  points: InkPoint[];
};

export const INK_HEX: Record<InkColor, string> = {
  ink: "#1c1917",
  gold: "#e0b15a",
  rust: "#c45c26",
};

export function strokeWidth(tool: "pen" | "highlighter") {
  return tool === "highlighter" ? 22 : 2.6;
}

export function pointsToSvg(points: InkPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function hitStroke(stroke: InkStroke, point: InkPoint, radius?: number) {
  const reach = radius ?? (stroke.tool === "highlighter" ? 0.04 : 0.022);
  return stroke.points.some((existing) => {
    const dx = existing.x - point.x;
    const dy = existing.y - point.y;
    return dx * dx + dy * dy <= reach * reach;
  });
}

export function paintInkOnImage(imageUrl: string, strokes: InkStroke[]): Promise<string> {
  if (!strokes.length) return Promise.resolve(imageUrl);

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(imageUrl);
        return;
      }
      ctx.drawImage(image, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const stroke of strokes) {
        if (stroke.points.length < 2) continue;
        ctx.beginPath();
        ctx.strokeStyle = INK_HEX[stroke.color];
        ctx.globalAlpha = stroke.tool === "highlighter" ? 0.42 : 0.92;
        ctx.lineWidth =
          stroke.tool === "highlighter"
            ? Math.max(10, image.width * 0.028)
            : Math.max(2, image.width * 0.004);
        ctx.moveTo(stroke.points[0].x * image.width, stroke.points[0].y * image.height);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x * image.width, stroke.points[i].y * image.height);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    image.onerror = () => resolve(imageUrl);
    image.src = imageUrl;
  });
}
