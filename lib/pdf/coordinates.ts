/** Minimal scroll needed to bring a page-relative target into the reading area.
 * Rectangles are measured after zoom, so no second zoom factor is applied.
 */
export function revealPageTarget(
  viewport: { left: number; top: number; width: number; height: number },
  page: { left: number; top: number; width: number; height: number },
  target: { x: number; y: number },
) {
  const x = page.left - viewport.left + Math.max(0, Math.min(1, target.x)) * page.width;
  const y = page.top - viewport.top + Math.max(0, Math.min(1, target.y)) * page.height;
  const marginX = Math.min(80, viewport.width * 0.15);
  const marginY = Math.min(100, viewport.height * 0.15);
  return {
    left: x < marginX || x > viewport.width - marginX ? x - viewport.width * 0.5 : 0,
    top: y < marginY || y > viewport.height - marginY ? y - viewport.height * 0.4 : 0,
  };
}
