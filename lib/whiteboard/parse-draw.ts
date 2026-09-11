import type { Color, DrawCommand, Pt } from "@/lib/types";
import { isDrawCommand } from "./geometry";

const ATTR = /(\w+)=(?:"([^"]*)"|(\S+))/g;

function attrs(inner: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of inner.matchAll(ATTR)) {
    out[match[1]] = match[2] ?? match[3] ?? "";
  }
  return out;
}

function readJson(source: string, openAt: number): unknown | null {
  if (openAt < 0 || source[openAt] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = openAt; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === "\"") inString = false;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(source.slice(openAt, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function ptPair(raw: string | undefined): Pt | null {
  if (!raw) return null;
  const match = raw.trim().match(/^([\d.]+)\s*,\s*([\d.]+)$/);
  if (!match) return null;
  const x = Number(match[1]);
  const y = Number(match[2]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function colorOf(value: string | undefined): Color | undefined {
  if (value === "ink" || value === "accent" || value === "muted" || value === "warn") {
    return value;
  }
  return undefined;
}

function fromAttrs(body: string): DrawCommand | null {
  const a = attrs(body);
  const op = (a.op || body.trim().split(/\s+/)[0] || "").toLowerCase();
  const id = a.id || op || "shape";

  if (op === "clear") return { op: "clear" };
  if (op === "remove" && a.id) return { op: "remove", id: a.id };
  if (op === "highlight" && a.id) return { op: "highlight", id: a.id };

  if (op === "axes") {
    const origin = ptPair(a.origin) ?? ptPair(a.at) ?? { x: 0.2, y: 0.78 };
    return {
      op: "axes",
      id,
      origin,
      xLabel: a.xLabel || a.xlabel,
      yLabel: a.yLabel || a.ylabel,
    };
  }

  if (op === "arrow" || op === "line") {
    const from = ptPair(a.from);
    const to = ptPair(a.to);
    if (!from || !to) return null;
    if (op === "line") {
      return {
        op: "line",
        id,
        from,
        to,
        dashed: a.dashed === "true" || a.dashed === "1",
        color: colorOf(a.color),
      };
    }
    return { op: "arrow", id, from, to, label: a.label, color: colorOf(a.color) };
  }

  if (op === "circle") {
    const center = ptPair(a.center) ?? ptPair(a.at);
    if (!center) return null;
    return {
      op: "circle",
      id,
      center,
      r: Number(a.r) || 0.08,
      label: a.label,
    };
  }

  if (op === "text") {
    const at = ptPair(a.at);
    if (!at || !a.text) return null;
    return {
      op: "text",
      id,
      at,
      text: a.text,
      size: a.size === "m" ? "m" : "s",
    };
  }

  if (op === "curve" && a.points) {
    const points = a.points
      .split(";")
      .map((item) => ptPair(item))
      .filter((point): point is Pt => Boolean(point));
    if (points.length < 2) return null;
    return { op: "curve", id, points, label: a.label, color: colorOf(a.color) };
  }

  return null;
}

// Models sometimes emit POINT-style DRAW tags instead of JSON. Accept both.
function fromShorthand(body: string): DrawCommand | null {
  const trimmed = body.trim();
  if (!trimmed) return null;
  if (/^clear$/i.test(trimmed)) return { op: "clear" };

  const labeled = trimmed.match(
    /^(arrow|line|axes|circle|text|curve)\b([\s\S]*)$/i,
  );
  if (!labeled) return fromAttrs(trimmed);

  const op = labeled[1].toLowerCase();
  const rest = labeled[2];
  const labelMatch = rest.match(/\blabel\s*=\s*"([^"]+)"/i);
  const colorMatch = rest.match(/\bcolor\s*=\s*(\w+)/i);
  const label = labelMatch?.[1];
  const color = colorOf(colorMatch?.[1]);
  const pts = [...rest.matchAll(/\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g)].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
  }));

  if (op === "axes") {
    const origin = pts[0] ?? { x: 0.2, y: 0.78 };
    const xLabel = rest.match(/\bxLabel\s*=\s*"([^"]+)"/i)?.[1];
    const yLabel = rest.match(/\byLabel\s*=\s*"([^"]+)"/i)?.[1];
    return { op: "axes", id: "axes", origin, xLabel, yLabel };
  }

  if ((op === "arrow" || op === "line") && pts.length >= 2) {
    if (op === "line") {
      return {
        op: "line",
        id: label || "line",
        from: pts[0],
        to: pts[1],
        dashed: /\bdashed\b/i.test(rest),
        color,
      };
    }
    return {
      op: "arrow",
      id: label || "arrow",
      from: pts[0],
      to: pts[1],
      label,
      color,
    };
  }

  if (op === "circle" && pts[0]) {
    const r = Number(rest.match(/\br\s*=\s*([\d.]+)/i)?.[1]) || 0.08;
    return { op: "circle", id: label || "circle", center: pts[0], r, label };
  }

  if (op === "text" && pts[0]) {
    const text =
      rest.match(/"([^"]+)"/)?.[1] ||
      rest.match(/\btext\s*=\s*"([^"]+)"/i)?.[1] ||
      "";
    if (!text) return null;
    return { op: "text", id: "label", at: pts[0], text, size: "s" };
  }

  if (op === "curve" && pts.length >= 2) {
    return { op: "curve", id: label || "curve", points: pts, label, color };
  }

  return fromAttrs(`op=${op} ${rest}`);
}

export function parseDrawCommand(body: string): DrawCommand | null {
  const trimmed = body.trim();
  const json = readJson(trimmed, trimmed.indexOf("{"));
  if (json && isDrawCommand(json)) return json;
  // Tolerate the model wrapping the shape kind in a generic draw operation.
  if (json && typeof json === 'object' && 'op' in json && json.op === 'draw' && 'kind' in json) {
    const normalized = { ...json, op: json.kind };
    if (isDrawCommand(normalized)) return normalized;
  }
  return fromShorthand(trimmed);
}
