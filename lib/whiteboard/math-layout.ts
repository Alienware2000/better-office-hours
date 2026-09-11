import { mathjax } from '@mathjax/src/js/mathjax.js';
import { TeX } from '@mathjax/src/js/input/tex.js';
import { SVG } from '@mathjax/src/js/output/svg.js';
import { liteAdaptor } from '@mathjax/src/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from '@mathjax/src/js/handlers/html.js';
import { MathJaxTexFont } from '@mathjax/mathjax-tex-font/js/svg.js';
import '@mathjax/src/js/input/tex/base/BaseConfiguration.js';
import '@mathjax/src/js/input/tex/ams/AmsConfiguration.js';
import type { LiteElement } from '@mathjax/src/js/adaptors/lite/Element.js';
import { mathSource } from './math-source';
import { textRuns } from './text';

export type Matrix = [number, number, number, number, number, number];
export type MathDrawing = {
  width: number; ascent: number; descent: number;
  paths: { d: string; matrix: Matrix; color: string }[];
};
const identity: Matrix = [1, 0, 0, 1, 0, 0];
function multiply(a: Matrix, b: Matrix): Matrix {
  return [a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1], a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3], a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]];
}
function transform(value: string): Matrix {
  let result = identity;
  for (const match of value.matchAll(/(translate|scale|matrix)\(([^)]+)\)/g)) {
    const n = match[2].trim().split(/[\s,]+/).map(Number);
    if (!n.every(Number.isFinite)) throw new Error('Invalid math transform');
    const next: Matrix = match[1] === 'translate' ? [1,0,0,1,n[0],n[1]??0]
      : match[1] === 'scale' ? [n[0],0,0,n[1]??n[0],0,0] : n as Matrix;
    if (next.length !== 6) throw new Error('Invalid math matrix');
    result = multiply(result, next);
  }
  return result;
}

// Explicit synchronous packages and bundled TeX font: no CDN, dynamic macro
// loading, HTML embedding, links, or per-equation network request.
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const document = mathjax.document('', {
  InputJax: new TeX({ packages: ['base', 'ams'], maxBuffer: 1200, maxMacros: 1000,
    formatError: (_jax: unknown, error: Error) => { throw error; } }),
  OutputJax: new SVG({ fontCache: 'none', fontData: MathJaxTexFont }),
});
const cache = new Map<string, MathDrawing | null>();

export function typesetMath(text: string, color: string): MathDrawing | null {
  const source = mathSource(text);
  const key = `${color}:${source}`;
  if (cache.has(key)) return cache.get(key)!;
  let result: MathDrawing | null = null;
  try {
    if (!source || source.length > 800 || /\\(?:def|gdef|edef|xdef|let|futurelet|newcommand|renewcommand|require|href|url|html\w*)\b/.test(source)) throw new Error('Unsupported math source');
    const node = document.convert(source, { display: true, em: 16, ex: 8, containerWidth: 1280 });
    const svg = adaptor.tags(node, 'svg')[0];
    const box = adaptor.getAttribute(svg, 'viewBox').split(/\s+/).map(Number);
    if (box.length !== 4 || !box.every(Number.isFinite) || box[2] <= 0 || box[3] <= 0) throw new Error('Empty math');
    const paths: MathDrawing['paths'] = [];
    const visit = (element: LiteElement, parent: Matrix, inheritedColor: string) => {
      const kind = adaptor.kind(element);
      const matrix = multiply(parent, transform(adaptor.getAttribute(element, 'transform') ?? ''));
      let fill = inheritedColor;
      const code = adaptor.getAttribute(element, 'data-c');
      if (kind === 'path' && code) {
        const n = parseInt(code, 16);
        // Italic identifiers and Greek symbols keep the board's semantic colors;
        // upright unit text stays in the equation's ink color.
        if (n >= 0x1d400 || (n >= 0x391 && n <= 0x3c9)) {
          const symbol = String.fromCodePoint(n).normalize('NFKC');
          fill = textRuns(`${symbol} =`, color)[0]?.color ?? color;
        }
      }
      if (kind === 'path') paths.push({ d: adaptor.getAttribute(element, 'd'), matrix, color: fill });
      else if (kind === 'rect') {
        const num = (name: string) => Number(adaptor.getAttribute(element, name) ?? 0);
        paths.push({ d: `M${num('x')},${num('y')}h${num('width')}v${num('height')}h${-num('width')}Z`, matrix, color: fill });
      } else if (kind !== 'g' && kind !== 'svg') throw new Error('Unsupported math output');
      if (paths.length > 512) throw new Error('Too many math glyphs');
      for (const child of adaptor.childNodes(element)) if (adaptor.kind(child) !== '#text') visit(child as LiteElement, matrix, fill);
    };
    visit(svg, identity, color);
    if (!paths.length) throw new Error('Empty math');
    result = { width: box[2] / 1000, ascent: -box[1] / 1000, descent: (box[1] + box[3]) / 1000, paths };
  } catch { /* Malformed or unsupported notation keeps a readable text fallback. */ }
  if (cache.size >= 160) cache.delete(cache.keys().next().value!);
  cache.set(key, result);
  return result;
}
