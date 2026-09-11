import { boardStyle } from './style';

export const MATH_FONT = '"Cambria Math", "STIX Two Math", Georgia, serif';
export const LABEL_FONT = '"Source Sans 3", system-ui, sans-serif';
export const isMathText = (text: string) => /[=≈∝≤≥∫∑√]|[²³₀₁₂]/.test(text);

// Keep a symbol's identity across lines, independent of the order it was drawn.
const SYMBOL_COLORS = ['#b95832', '#397b78', '#76649a'];
export function textRuns(text: string, color: string) {
  if (!isMathText(text) || color !== boardStyle.colors.ink) return [{ text, color }];
  return text.split(/((?<![\p{L}\p{N}])[a-zA-Z][₀₁₂₃₄₅₆₇₈₉]*(?![\p{L}\p{N}])|[α-ωΑ-Ω])/u).filter(Boolean).map(part => ({
    text: part,
    color: /^[a-zA-Z][₀₁₂₃₄₅₆₇₈₉]*$|^[α-ωΑ-Ω]$/u.test(part)
      ? SYMBOL_COLORS[part.codePointAt(0)! % SYMBOL_COLORS.length] : color,
  }));
}
