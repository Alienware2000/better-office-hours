import type { BBox } from "@/lib/types";

export type PdfTextItem = {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
  pageWidth: number;
  pageHeight: number;
};

const LABEL = /^(?:q(?:uest(?:ion)?)?[\s.]*)?(\d+[a-z]?)[.)](?:\s|$)/i;

export function detectQuestionRegions(
  items: PdfTextItem[],
): { label: string; bbox: BBox }[] {
  const regions: { label: string; bbox: BBox }[] = [];
  for (const item of items) {
    const label = item.str.trim().match(LABEL)?.[1];
    if (!label) continue;
    regions.push({
      label,
      bbox: {
        x: item.x / item.pageWidth,
        y: item.y / item.pageHeight,
        w: Math.min(0.55, Math.max(0.18, (item.w * 8) / item.pageWidth)),
        h: Math.min(0.08, Math.max(0.02, (item.h * 1.6) / item.pageHeight)),
      },
    });
  }
  return regions;
}

// PDF text fragments carry measured full-page geometry. These are anchors,
// not model-estimated coordinates; ambiguous repeated text remains explicit.
export function textRegions(items: PdfTextItem[]): { label: string; bbox: BBox }[] {
  return items.filter(item => item.str.trim() && item.w > 0 && item.h > 0).slice(0, 180).map(item => ({
    label: item.str.trim().slice(0, 160),
    bbox: { x: item.x / item.pageWidth, y: item.y / item.pageHeight,
      w: Math.min(item.w / item.pageWidth, 1 - item.x / item.pageWidth),
      h: item.h / item.pageHeight },
  }));
}
