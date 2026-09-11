import type { Color } from "../types";

export const boardStyle = {
  paper: "#fffcf6",
  colors: {
    ink: "#292621",
    accent: "#b95832",
    muted: "#938b7d",
    warn: "#a77726",
  } satisfies Record<Color, string>,
  stroke: 2.25,
  label: { s: 0.048, m: 0.06 },
  motion: {
    reveal: 0.52,
    hold: 0.65,
    spring: { type: "spring" as const, stiffness: 180, damping: 28 },
  },
};

export function boardLabel(value: string) {
  return String(value)
    .replace(/[\u2014\u2013]/g, ", ")
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join(" ")
    .slice(0, 48);
}
