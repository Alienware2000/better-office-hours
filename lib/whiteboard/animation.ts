import type { AnimationSpec, AnimShape, DrawCommand, Pt } from "../types";
import { interpretCommand, type ShapeGroup } from "./geometry";

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
type Frame = Record<string, unknown> & { t: number; ease?: string };
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const point = (v: unknown): boolean => object(v) && finite(v.x) && finite(v.y);

// Model output is untrusted data. Bound work and reject broken references before playback.
export function validateAnimation(input: unknown): AnimationSpec | null {
  if (
    !object(input) ||
    typeof input.id !== "string" ||
    !finite(input.duration) ||
    input.duration <= 0 ||
    input.duration > 30 ||
    !Array.isArray(input.shapes) ||
    !input.shapes.length ||
    input.shapes.length > 32
  )
    return null;
  const ids = new Set<string>();
  const paths = new Set(
    input.shapes.filter((s) => object(s) && s.kind === "path").map((s) => s.id),
  );
  const position = (v: unknown): boolean =>
    point(v) ||
    (object(v) &&
      object(v.follow) &&
      paths.has(v.follow.pathId) &&
      (v.follow.offset === undefined || point(v.follow.offset)));
  const frames = (v: unknown, check: (f: Record<string, unknown>) => boolean) =>
    Array.isArray(v) &&
    v.length > 0 &&
    v.length <= 120 &&
    v.every(
      (f, i) =>
        object(f) &&
        finite(f.t) &&
        f.t >= 0 &&
        f.t <= (input.duration as number) &&
        (i === 0 || f.t > v[i - 1].t) &&
        (f.ease === undefined ||
          ["linear", "inOut", "out"].includes(String(f.ease))) &&
        (f.opacity === undefined || finite(f.opacity)) &&
        check(f),
    );
  for (const s of input.shapes) {
    if (!object(s) || typeof s.id !== "string" || ids.has(s.id)) return null;
    ids.add(s.id);
    if (s.label !== undefined && typeof s.label !== "string") return null;
    let valid = false;
    switch (s.kind) {
      case "axes":
        valid =
          point(s.origin) &&
          (s.xLabel === undefined || typeof s.xLabel === "string") &&
          (s.yLabel === undefined || typeof s.yLabel === "string") &&
          (s.keyframes === undefined || frames(s.keyframes, () => true));
        break;
      case "path":
        valid =
          Array.isArray(s.points) &&
          s.points.length >= 2 &&
          s.points.length <= 256 &&
          s.points.every(point) &&
          frames(s.keyframes, (f) => finite(f.drawn));
        break;
      case "arrow":
        valid = frames(
          s.keyframes,
          (f) =>
            position(f.from) &&
            position(f.to) &&
            (f.color === undefined ||
              ["ink", "accent", "muted", "warn"].includes(String(f.color))),
        );
        break;
      case "dot":
        valid = frames(
          s.keyframes,
          (f) => position(f.at) && (f.r === undefined || finite(f.r)),
        );
        break;
      case "text":
        valid =
          typeof s.text === "string" && frames(s.keyframes, (f) => point(f.at));
        break;
      case "bar":
        valid = frames(
          s.keyframes,
          (f) => point(f.at) && finite(f.w) && finite(f.h),
        );
        break;
    }
    if (!valid) return null;
  }
  if (
    input.camera !== undefined &&
    (!object(input.camera) ||
      !frames(
        input.camera.keyframes,
        (f) =>
          finite(f.x) &&
          finite(f.y) &&
          finite(f.zoom) &&
          f.zoom >= 0.5 &&
          f.zoom <= 4,
      ))
  )
    return null;
  return structuredClone(input) as AnimationSpec;
}

function mix(a: unknown, b: unknown, u: number): unknown {
  if (finite(a) && finite(b)) return a + (b - a) * u;
  if (object(a) && object(b) && object(a.follow) && object(b.follow)) {
    return {
      follow: {
        pathId: u < 1 ? a.follow.pathId : b.follow.pathId,
        offset: mix(
          a.follow.offset ?? { x: 0, y: 0 },
          b.follow.offset ?? { x: 0, y: 0 },
          u,
        ),
      },
    };
  }
  if (object(a) && object(b))
    return Object.fromEntries(
      Object.keys(a).map((k) => [k, mix(a[k], b[k] ?? a[k], u)]),
    );
  return u < 1 ? a : b;
}

export function sampleFrames(frames: Frame[], time: number): Frame {
  const first = frames[0];
  if (time <= first.t)
    return { ...first, opacity: time < first.t ? 0 : (first.opacity ?? 1) };
  const right = frames.findIndex((f) => f.t > time);
  if (right < 0) return frames[frames.length - 1];
  const a = frames[right - 1],
    b = frames[right];
  let u = clamp((time - a.t) / (b.t - a.t));
  if (b.ease === "inOut") u = u * u * (3 - 2 * u);
  if (b.ease === "out") u = 1 - (1 - u) ** 3;
  return mix(a, b, u) as Frame;
}

// Point-index interpolation preserves time sampling supplied by the tutor.
export function pathPoint(points: Pt[], progress: number): Pt {
  const index = clamp(progress) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(index));
  return mix(points[i], points[i + 1], index - i) as Pt;
}

export type AnimGroup = ShapeGroup & { opacity: number };
export function animationFrame(
  spec: AnimationSpec,
  time: number,
): { groups: AnimGroup[]; camera: { x: number; y: number; zoom: number } } {
  const t = clamp(time, 0, spec.duration);
  const frames = new Map(
    spec.shapes.map((s) => [
      s.id,
      s.keyframes?.length
        ? sampleFrames(
            s.keyframes.map((f) => ({
              opacity: 1,
              r: 0.012,
              color: "accent",
              ...f,
            })),
            t,
          )
        : { t: 0, opacity: 1 },
    ]),
  );
  const resolve = (v: unknown): Pt => {
    if (object(v) && object(v.follow)) {
      const path = spec.shapes.find(
        (s) => s.id === (v.follow as Record<string, unknown>).pathId,
      ) as Extract<AnimShape, { kind: "path" }>;
      const at = pathPoint(
        path.points,
        Number(frames.get(path.id)?.drawn ?? t / spec.duration),
      );
      const offset = v.follow.offset as Pt | undefined;
      return { x: at.x + (offset?.x ?? 0), y: at.y + (offset?.y ?? 0) };
    }
    return v as Pt;
  };
  const groups: AnimGroup[] = [];
  for (const s of spec.shapes) {
    // Resolve each endpoint before interpolation so a fixed point can smoothly
    // transition to a Follow reference, including a change of followed path.
    const f = s.kind === "arrow" || s.kind === "dot"
      ? sampleFrames(s.keyframes.map(frame => ({
          opacity: 1, r: 0.012, color: "accent", ...frame,
          ...("from" in frame ? { from: resolve(frame.from), to: resolve(frame.to) } : {}),
          ...("at" in frame ? { at: resolve(frame.at) } : {}),
        })), t)
      : frames.get(s.id)!;
    let command: DrawCommand;
    switch (s.kind) {
      case "axes":
        command = {
          op: "axes",
          id: s.id,
          origin: s.origin,
          xLabel: s.xLabel,
          yLabel: s.yLabel,
        };
        break;
      case "arrow":
        command = {
          op: "arrow",
          id: s.id,
          from: resolve(f.from),
          to: resolve(f.to),
          color: f.color as "accent",
          label: s.label,
        };
        break;
      case "dot":
        command = {
          op: "circle",
          id: s.id,
          center: resolve(f.at),
          r: clamp(Number(f.r), 0.006, 0.04),
          label: s.label,
        };
        break;
      case "text":
        command = { op: "text", id: s.id, at: resolve(f.at), text: s.text };
        break;
      case "bar": {
        const at = resolve(f.at),
          w = clamp(Number(f.w)),
          h = clamp(Number(f.h));
        command = {
          op: "curve",
          id: s.id,
          points: [
            at,
            { x: at.x + w, y: at.y },
            { x: at.x + w, y: at.y - h },
            { x: at.x, y: at.y - h },
            at,
          ],
          color: "accent",
          label: s.label,
        };
        break;
      }
      case "path": {
        const progress = clamp(Number(f.drawn));
        const end = progress * (s.points.length - 1);
        const points = [
          ...s.points.slice(0, Math.floor(end) + 1),
          pathPoint(s.points, progress),
        ];
        command = {
          op: "curve",
          id: s.id,
          points,
          color: "muted",
          label: s.label,
        };
        break;
      }
    }
    const op = interpretCommand(command, 0);
    if (op?.kind === "draw") {
      // Animated trajectories use the same sampled polyline for drawing and Follow.
      if ((s.kind === "path" || s.kind === "bar") && command.op === "curve") {
        const d = command.points
          .map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`)
          .join(" ");
        op.group.drawables = op.group.drawables.map((m) =>
          m.kind === "path" ? { ...m, d } : m,
        );
      }
      if (
        s.kind === "arrow" &&
        Math.hypot(
          resolve(f.to).x - resolve(f.from).x,
          resolve(f.to).y - resolve(f.from).y,
        ) < 0.005
      ) {
        op.group.drawables = op.group.drawables.filter(
          (m) => m.kind === "text",
        );
      }
      // Moving labels keep their model attachment and stable size. Avoid a
      // per-frame collision solver that would make them jump between sides.
      op.group.drawables = op.group.drawables.map(mark => mark.kind === 'text'
        ? { ...mark, fontSize: .038, diagramLabel: true } : mark);
      groups.push({ ...op.group, opacity: clamp(Number(f.opacity ?? 1)) });
    }
  }
  const camera = spec.camera
    ? sampleFrames(spec.camera.keyframes, t)
    : { x: 0.5, y: 0.5, zoom: 1 };
  return { groups, camera: camera as { x: number; y: number; zoom: number } };
}
