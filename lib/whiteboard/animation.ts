import { validAppearance, type BodyDot } from "./body";
import type { AnimationSpec, AnimShape, DrawCommand, Pt } from "../types";
import { curvePath, curvePoint } from "./curve";
import { interpretCommand, type ShapeGroup } from "./geometry";
import { typesetMath } from './math-layout';
import { diagramOptions, type DiagramCommand, type DiagramOptions } from './diagram-command';
import { composeDiagram } from './diagram-compose';
import { layoutAnimationLabels } from './animation-labels';
import { isMathText } from './text';

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
type Frame = Record<string, unknown> & { t: number; ease?: string };
export type DiagramAnimShape = AnimShape & { diagram?: Pick<DiagramOptions, 'attach' | 'component' | 'labelSide'> };
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
  const shapes = new Map(input.shapes.filter(object).map(s => [s.id, s]));
  const dependencies = new Map<string, string>();
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
    if (s.diagram !== undefined) {
      if (s.kind !== 'arrow' || !object(s.diagram) || Object.keys(s.diagram).some(key => !['attach', 'component', 'labelSide'].includes(key))) return null;
      const options = diagramOptions({ op: 'arrow', id: s.id, from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, diagram: s.diagram } as DiagramCommand);
      if (!options) return null;
      const targetId = options.attach?.to ?? options.component?.of;
      if (targetId) {
        const target = shapes.get(targetId);
        if (!target || (options.component ? target.kind !== 'arrow' : !['dot', 'arrow'].includes(String(target.kind)))) return null;
        if (target.kind === 'dot' && options.attach?.anchor !== 'center') return null;
        dependencies.set(s.id, targetId);
      }
    }
    if (s.appearance !== undefined && (s.kind !== "dot" || !validAppearance(s.appearance))) return null;
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
          frames(s.keyframes, (f) => finite(f.drawn) && f.drawn >= 0 && f.drawn <= 1);
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
  for (const id of dependencies.keys()) {
    const seen = new Set<string>();
    for (let next: string | undefined = id; next; next = dependencies.get(next)) {
      if (seen.has(next)) return null;
      seen.add(next);
    }
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

// The visible prefix and its attached objects use exactly the same interpolant.
export const pathPoint = curvePoint;

export type AnimGroup = ShapeGroup & { opacity: number };
function rawAnimationFrame(
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
          opacity: 1, r: (s as BodyDot).appearance?.radius ?? 0.012, color: "accent", ...frame,
          ...("from" in frame ? { from: resolve(frame.from), to: resolve(frame.to) } : {}),
          ...("at" in frame ? { at: resolve(frame.at) } : {}),
        })), t)
      : frames.get(s.id)!;
    let command: DrawCommand | DiagramCommand;
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
      case "dot": {
        const appearance = (s as BodyDot).appearance;
        if (appearance) {
          const at = resolve(f.at);
          // Missing radius keeps the original outline's scale. Rotation is not
          // inferred from velocity: an object's orientation is a separate fact.
          const keyedRadius = s.keyframes.some(frame => frame.r !== undefined);
          const r = keyedRadius ? clamp(Number(f.r), .006, .45) : appearance.radius;
          const points = appearance.points.map(p => ({ x: at.x + p.x * r, y: at.y + p.y * r }));
          // Hide a partly off-board body instead of clamping its vertices and
          // distorting its shape. The complete geometry returns on re-entry.
          if (points.some(p => p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1)) continue;
          command = { op: 'curve', id: s.id, points, label: s.label, color: appearance.color,
            diagram: { fill: appearance.fill, interpolation: appearance.interpolation, weight: appearance.weight } };
          break;
        }
        command = {
          op: "circle",
          id: s.id,
          center: resolve(f.at),
          r: clamp(Number(f.r), 0.006, 0.04),
          diagram: { fill: "tint" },
          label: s.label,
        };
        break;
      }
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
        command = {
          op: "curve",
          id: s.id,
          points: s.points,
          color: "muted",
          label: s.label,
        };
        break;
      }
    }
    if (s.kind === 'arrow') command = { ...command, diagram: (s as DiagramAnimShape).diagram } as DiagramCommand;
    const op = interpretCommand(command, 0);
    if (op?.kind === "draw") {
      // Paths reveal a prefix of the full spline. Bars keep their sharp corners.
      if ((s.kind === "path" || s.kind === "bar") && command.op === "curve") {
        const d = s.kind === "path" ? curvePath(s.points, Number(f.drawn)) : command.points
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
        ).map(m => m.kind === 'text' ? { ...m, labelAnchor: undefined } : m);
      }
      // Moving labels keep their model attachment and stable size. Avoid a
      // per-frame collision solver that would make them jump between sides.
      op.group.drawables = op.group.drawables.map(mark => mark.kind === 'text'
        ? { ...mark, fontSize: .038, diagramLabel: true, mathDrawing: isMathText(mark.text) ? typesetMath(mark.text, mark.color, false) ?? undefined : undefined } : mark);
      groups.push({ ...op.group, opacity: clamp(Number(f.opacity ?? 1)) });
    }
  }
  const composed = composeDiagram(groups);
  const resolvedGroups = groups.map((group, i) => {
    const options = (group.source as DiagramCommand | undefined)?.diagram;
    if (!options?.attach && !options?.component) return group;
    const resolved = composed[i];
    const ends = resolved.geometry?.[0];
    const zero = ends?.length === 2 && Math.hypot(ends[1].x - ends[0].x, ends[1].y - ends[0].y) < .003;
    return { ...resolved, drawables: resolved.drawables.map(mark => mark.kind === 'text'
      ? { ...mark, ...(zero ? { labelAnchor: undefined } : {}), fontSize: .038, diagramLabel: true, mathDrawing: isMathText(mark.text) ? typesetMath(mark.text, mark.color, false) ?? undefined : undefined } : mark) };
  });
  const camera = spec.camera
    ? sampleFrames(spec.camera.keyframes, t)
    : { x: 0.5, y: 0.5, zoom: 1 };
  return { groups: resolvedGroups, camera: camera as { x: number; y: number; zoom: number } };
}

const emptyBackdrop: ShapeGroup[] = [];
const emptyInk: { points: Pt[] }[] = [];
export function animationFrame(spec: AnimationSpec, time: number, backdrop: ShapeGroup[] = emptyBackdrop, ink: { points: Pt[] }[] = emptyInk) {
  const frame = rawAnimationFrame(spec, time);
  return { ...frame, groups: layoutAnimationLabels(spec, frame.groups, t => rawAnimationFrame(spec, t), backdrop, ink) };
}

const writingObstacleCache = new WeakMap<AnimationSpec, ShapeGroup[]>();
// New equations reserve the scene's movement, not merely its current frame.
// This runs once per spec and does not invoke animated label layout recursively.
export function animationWritingObstacles(spec: AnimationSpec): ShapeGroup[] {
  const cached = writingObstacleCache.get(spec);
  if (cached) return cached;
  const times = [...new Set([
    ...Array.from({ length: 25 }, (_, i) => spec.duration * i / 24),
    ...spec.shapes.flatMap(s => s.keyframes?.map(f => f.t) ?? []),
  ])].sort((a, b) => a - b);
  const bounded = times.length <= 65 ? times : Array.from({ length: 65 }, (_, i) => times[Math.round(i * (times.length - 1) / 64)]);
  const result = bounded.flatMap(time => {
    const { groups, camera } = rawAnimationFrame(spec, time);
    const project = (p: Pt): Pt => ({ x: .5 + (p.x - camera.x) * camera.zoom, y: .5 + (p.y - camera.y) * camera.zoom });
    return groups.filter(g => g.opacity > .03).map(group => ({ ...group,
      geometry: group.geometry?.map(points => points.map(project)),
      drawables: group.drawables.map(mark => mark.kind === 'text' ? { ...mark, at: project(mark.at), fontSize: (mark.fontSize ?? .038) * camera.zoom } : mark),
    }));
  });
  writingObstacleCache.set(spec, result);
  return result;
}
