import type { ShapeGroup } from './geometry';

// Keep all glyphs laid out from the start; opacity reveals them without reflow.
export function textReveal(text: string) {
  let elapsed = 0;
  const glyphs = Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), part => part.segment);
  const delays = glyphs.map(glyph => {
    const at = elapsed;
    elapsed += /\s/.test(glyph) ? 16 : /[,;:]/.test(glyph) ? 75 : 32;
    return at;
  });
  return { glyphs, delays, duration: elapsed + 90 };
}

export function groupReveal(group: ShapeGroup) {
  let cursor = 0;
  const delays = group.drawables.map(mark => {
    if (mark.kind !== 'text') { cursor = Math.max(cursor, 520); return 0; }
    const start = cursor;
    cursor += (mark.mathDrawing ? mark.mathDrawing.paths.length * 32 + 90 : textReveal(mark.text).duration) + 80;
    return start;
  });
  return { delays, duration: Math.max(560, cursor) };
}
