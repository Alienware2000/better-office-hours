// The existing DRAW text contract accepts either plain notation or LaTeX.
export const hasLatex = (text: string) => /\\[a-zA-Z]+|\\[([]|\$|[_^]\{/.test(text);
export const isMathNotation = (text: string) => hasLatex(text) || /[=≈∝≤≥∫∑√]|[²³₀-₉]/.test(text);

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
