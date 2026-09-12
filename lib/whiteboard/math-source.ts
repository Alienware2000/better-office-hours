// The existing DRAW text contract accepts either plain notation or LaTeX.
export const hasLatex = (text: string) => /\\[a-zA-Z]+|\\[([]|\$|[_^]\{/.test(text);
// Standalone symbols are labels, not prose or full-size equation rows. Accept
// ordinary TeX scripts too: v_x must render just like v_{x}.
export const isCompactMath = (text: string) => /^(?:[a-zA-Zα-ωΑ-Ω]|\\(?:theta|alpha|beta|gamma|phi|omega|Delta|pi))(?:[_^](?:\{[^{}]+\}|[a-zA-Z0-9+-]+)|[²³₀-₉])*$/u.test(text.trim());
export const isMathNotation = (text: string) => isCompactMath(text) || hasLatex(text) || /[=≈∝≤≥∫∑√]|[²³₀-₉]/.test(text);

export function mathSource(text: string): string {
  const source = hasLatex(text) ? text : text.replace(/\b([a-zA-Z])_?(\d+)\b/g, (_, symbol: string, digits: string) => `${symbol}_{${digits}}`);
  return source.trim().replace(/^\$\$([\s\S]*)\$\$$/, '$1').replace(/^\$([\s\S]*)\$$/, '$1')
    .replace(/^\\\[([\s\S]*)\\\]$/, '$1').replace(/^\\\(([\s\S]*)\\\)$/, '$1')
    .replace(/[₀-₉]+/g, digits => `_{${[...digits].map(digit => '₀₁₂₃₄₅₆₇₈₉'.indexOf(digit)).join('')}}`)
    .replace(/²/g, '^{2}').replace(/³/g, '^{3}').replace(/−/g, '-')
    .replace(/×/g, '\\times ').replace(/·/g, '\\cdot ')
    .replace(/Δ/g, '\\Delta ').replace(/θ/g, '\\theta ').replace(/π/g, '\\pi ')
    .replace(/≤/g, '\\le ').replace(/≥/g, '\\ge ').replace(/≈/g, '\\approx ')
    .replace(/∝/g, '\\propto ').replace(/∞/g, '\\infty ');
}
