import type { AnimationSpec } from "@/lib/types";

// Development fixture only. Never selected by the tutor or production runtime.
export function projectileFixture(speed = 20, angle = 35): AnimationSpec {
  const theta = (angle * Math.PI) / 180;
  const vx = speed * Math.cos(theta),
    vy = speed * Math.sin(theta);
  const peakTime = vy / 9.81;
  const scale = 0.62 / Math.max(vx * peakTime, 1);
  const points = Array.from({ length: 41 }, (_, i) => {
    const t = (peakTime * i) / 40;
    return {
      x: 0.18 + vx * t * scale,
      y: 0.78 - (vy * t - 0.5 * 9.81 * t * t) * scale,
    };
  });
  const follow = { follow: { pathId: "flight" } };
  return {
    id: "projectile-fixture",
    duration: 4.8,
    shapes: [
      { kind: "axes", id: "axes", origin: points[0], xLabel: "x", yLabel: "y" },
      {
        kind: "path",
        id: "flight",
        points,
        keyframes: [
          { t: 0, drawn: 0 },
          { t: 0.65, drawn: 0 },
          { t: 3.8, drawn: 1 },
          { t: 4.8, drawn: 1 },
        ],
      },
      { kind: "dot", id: "ball", keyframes: [{ t: 0, at: follow, r: 0.008 }] },
      {
        kind: "arrow",
        id: "vx",
        label: "vₓ",
        keyframes: [
          {
            t: 0,
            from: follow,
            to: { follow: { pathId: "flight", offset: { x: 0.13, y: 0 } } },
            color: "ink",
          },
        ],
      },
      {
        kind: "arrow",
        id: "vy",
        label: "vᵧ",
        keyframes: [
          {
            t: 0,
            from: follow,
            to: { follow: { pathId: "flight", offset: { x: 0, y: -0.15 } } },
            color: "accent",
          },
          {
            t: 0.65,
            from: follow,
            to: { follow: { pathId: "flight", offset: { x: 0, y: -0.15 } } },
            color: "accent",
          },
          { t: 3.8, from: follow, to: follow, color: "accent" },
        ],
      },
    ],
  };
}
