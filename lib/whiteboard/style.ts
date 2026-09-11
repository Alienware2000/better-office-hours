import type { Color } from "../types";
import { hasLatex } from './math-source';

export const boardStyle = {
  paper: "#fffcf6",
  colors: {
    ink: "#292621",
    accent: "#b95832",
    muted: "#938b7d",
    warn: "#a77726",
  } satisfies Record<Color, string>,
  stroke: 2.25,
  label: { s: 0.054, m: 0.075 },
  motion: {
    reveal: 0.52,
    hold: 0.65,
    spring: { type: "spring" as const, stiffness: 180, damping: 28 },
  },
};

export function boardLabel(value: string) {
  // Never truncate a TeX command or normalize its braces into invalid source.
  if (hasLatex(String(value))) return String(value).trim().slice(0, 800);
  return String(value)
    .replace(/[\u2014\u2013]/g, ", ")
    .replace(/\^([23])/g, (_, digit: string) => digit === '2' ? '²' : '³')
    .replace(/\b([a-zA-Z])_?(\d+)\b/g, (_, symbol: string, digits: string) => symbol + [...digits].map(digit => '₀₁₂₃₄₅₆₇₈₉'[Number(digit)]).join(''))
    .trim()
    .split(/\s+/)
    .slice(0, 20)
    .join(" ")
    .slice(0, 64);
}

// Fit longer symbolic lines consistently in SVG and in the tutor's snapshot.
export function boardTextSize(text: string, size: "s" | "m", x = 0.5) {
  const available = Math.max(0.12, 2 * Math.min(x, 1 - x) - 0.06);
  return Math.min(boardStyle.label[size], available / Math.max(1, text.length * 0.56));
}
