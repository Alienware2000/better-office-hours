import type { Color, DrawCommand, Pt } from "@/lib/types";
import { boardLabel } from "./style";
import { TUTOR_HEX } from "./colors";

export type Drawable =
  | {
      kind: "path";
      key: string;
      d: string;
      color: string;
      dashed?: boolean;
    }
  | {
      kind: "head";
      key: string;
      d: string;
      color: string;
    }
  | {
      kind: "text";
      key: string;
      at: Pt;
      text: string;
      size: "s" | "m";
      textAnchor?: "start" | "middle";
      heading?: boolean;
      fontSize?: number; // Resolved standalone writing size, shared by SVG and snapshots.
      color: string;
    };

export type ShapeGroup = {
  id: string;
  drawables: Drawable[];
};

export type BoardOp =
  | { kind: "draw"; group: ShapeGroup }
  | { kind: "clear" }
  | { kind: "remove"; id: string }
  | { kind: "highlight"; id: string };

export function interpretCommand(
  command: DrawCommand,
  seq: number,
): BoardOp | null {
  if (command.op === "clear") return { kind: "clear" };
  if (command.op === "remove") {
    const id = typeof command.id === "string" ? command.id.trim() : "";
    return id ? { kind: "remove", id } : null;
  }
  if (command.op === "highlight") {
    const id = typeof command.id === "string" ? command.id.trim() : "";
    return id ? { kind: "highlight", id } : null;
  }

  const id = (typeof command.id === "string" && command.id.trim()) || `draw-${seq}`;
  const color = TUTOR_HEX[command.op === "axes" ? "muted" : colorOf(command)] ?? TUTOR_HEX.ink;

  if (command.op === "axes") {
    const origin = pt(command.origin) ?? { x: 0.2, y: 0.78 };
    const xTo: Pt = { x: clamp(origin.x + 0.68, 0.12, 0.94), y: origin.y };
    const yTo: Pt = { x: origin.x, y: clamp(origin.y - 0.62, 0.06, 0.9) };
    const drawables: Drawable[] = [
      ...arrowDrawables(`${id}-x`, origin, xTo, color),
      ...arrowDrawables(`${id}-y`, origin, yTo, color),
    ];
    if (command.xLabel) {
      drawables.push({
        kind: "text",
        key: `${id}-xl`,
        at: { x: clamp(xTo.x - 0.01, 0.04, 0.96), y: clamp(origin.y + 0.055, 0.04, 0.96) },
        text: label(command.xLabel),
        size: "s",
        color,
      });
    }
    if (command.yLabel) {
      drawables.push({
        kind: "text",
        key: `${id}-yl`,
        at: { x: clamp(origin.x - 0.02, 0.04, 0.96), y: clamp(yTo.y + 0.01, 0.04, 0.96) },
        text: label(command.yLabel),
        size: "s",
        color,
      });
    }
    return { kind: "draw", group: { id, drawables } };
  }

  if (command.op === "arrow") {
    const from = pt(command.from);
    const to = pt(command.to);
    if (!from || !to) return null;
    const drawables = arrowDrawables(id, from, to, color);
    if (command.label) {
      drawables.push(midLabel(`${id}-l`, from, to, command.label, color));
    }
    return { kind: "draw", group: { id, drawables } };
  }

  if (command.op === "line") {
    const from = pt(command.from);
    const to = pt(command.to);
    if (!from || !to) return null;
    const drawables: Drawable[] = [
      {
        kind: "path",
        key: `${id}-p`,
        d: `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
        color,
        dashed: Boolean(command.dashed),
      },
    ];
    return { kind: "draw", group: { id, drawables } };
  }

  if (command.op === "curve") {
    const points = (Array.isArray(command.points) ? command.points : []).slice(0, 256).map(pt).filter((p): p is Pt => Boolean(p));
    if (points.length < 2) return null;
    const drawables: Drawable[] = [
      { kind: "path", key: `${id}-p`, d: curvePath(points), color },
    ];
    if (command.label) {
      const mid = points[Math.floor(points.length / 2)];
      drawables.push({
        kind: "text",
        key: `${id}-l`,
        at: { x: clamp(mid.x + 0.02, 0.04, 0.96), y: clamp(mid.y - 0.04, 0.04, 0.96) },
        text: label(command.label),
        size: "s",
        color,
      });
    }
    return { kind: "draw", group: { id, drawables } };
  }

  if (command.op === "circle") {
    const center = pt(command.center);
    if (!center) return null;
    const r = radius(command.r);
    const drawables: Drawable[] = [
      { kind: "path", key: `${id}-p`, d: circlePath(center, r), color },
    ];
    if (command.label) {
      drawables.push({
        kind: "text",
        key: `${id}-l`,
        at: { x: clamp(center.x, 0.04, 0.96), y: clamp(center.y - r - 0.04, 0.04, 0.96) },
        text: label(command.label),
        size: "s",
        color,
      });
    }
    return { kind: "draw", group: { id, drawables } };
  }

  if (command.op === "text") {
    if (typeof command.text !== "string" || !command.text.trim()) return null;
    const at = pt(command.at);
    if (!at) return null;
    return {
      kind: "draw",
      group: {
        id,
        drawables: [
          {
            kind: "text",
            key: `${id}-t`,
            at,
            text: boardLabel(command.text),
            size: command.size === "m" ? "m" : "s",
            color,
          },
        ],
      },
    };
  }

  return null;
}

function colorOf(command: DrawCommand): Color {
  if ("color" in command && command.color) return command.color;
  return "ink";
}

function pt(value: Pt | undefined): Pt | null {
  if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y)) return null;
  return { x: clamp(value.x, 0, 1), y: clamp(value.y, 0, 1) };
}

function radius(value: number | undefined) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0.08;
  if (n > 1) return clamp(n / 100, 0.03, 0.45);
  return clamp(n, 0.006, 0.45);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function label(text: string, maxWords = 6) {
  return boardLabel(text).split(/\s+/).slice(0, maxWords).join(" ");
}

function arrowDrawables(id: string, from: Pt, to: Pt, color: string): Drawable[] {
  const tip = shorten(from, to, 0.012);
  return [
    {
      kind: "path",
      key: `${id}-p`,
      d: `M ${from.x} ${from.y} L ${tip.x} ${tip.y}`,
      color,
    },
    { kind: "head", key: `${id}-h`, d: arrowHead(from, to), color },
  ];
}

function shorten(from: Pt, to: Pt, amount: number): Pt {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const t = Math.max(0, (len - amount) / len);
  return { x: from.x + dx * t, y: from.y + dy * t };
}

function arrowHead(from: Pt, to: Pt, size = 0.028): string {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const left = {
    x: to.x - size * Math.cos(angle - 0.42),
    y: to.y - size * Math.sin(angle - 0.42),
  };
  const right = {
    x: to.x - size * Math.cos(angle + 0.42),
    y: to.y - size * Math.sin(angle + 0.42),
  };
  return `M ${left.x} ${left.y} L ${to.x} ${to.y} L ${right.x} ${right.y}`;
}

function midLabel(key: string, from: Pt, to: Pt, text: string, color: string): Drawable {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ox = (-dy / len) * 0.05;
  const oy = (dx / len) * 0.05;
  return {
    kind: "text",
    key,
    at: {
      x: clamp((from.x + to.x) / 2 + ox, 0.04, 0.96),
      y: clamp((from.y + to.y) / 2 + oy, 0.04, 0.96),
    },
    text: label(text),
    size: "s",
    color,
  };
}

function curvePath(points: Pt[]): string {
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const mx = (current.x + next.x) / 2;
    const my = (current.y + next.y) / 2;
    d += ` Q ${current.x} ${current.y} ${mx} ${my}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last.x} ${last.y}`;
  return d;
}

function circlePath(center: Pt, r: number): string {
  const x = center.x + r;
  return [
    `M ${x} ${center.y}`,
    `A ${r} ${r} 0 1 1 ${center.x - r} ${center.y}`,
    `A ${r} ${r} 0 1 1 ${x} ${center.y}`,
  ].join(" ");
}

export function isDrawCommand(value: unknown): value is DrawCommand {
  if (!value || typeof value !== "object") return false;
  const op = (value as { op?: unknown }).op;
  return (
    op === "clear" ||
    op === "axes" ||
    op === "arrow" ||
    op === "line" ||
    op === "curve" ||
    op === "circle" ||
    op === "text" ||
    op === "highlight" ||
    op === "remove"
  );
}
