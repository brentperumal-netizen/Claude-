/**
 * Builds a tapered "capsule" outline between two circles (r1 at x1,y1 and r2 at x2,y2).
 * Used to draw limbs as real tapered shapes instead of uniform-width strokes.
 * Ported verbatim from the web prototype (dressup-game/script.js) — the math was
 * already verified there, only the output target (Skia Path via SVG string) changed.
 */
export function capsulePath(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): string {
  const perp = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
  const cos = Math.cos(perp);
  const sin = Math.sin(perp);
  const p1a = [x1 + r1 * cos, y1 + r1 * sin];
  const p1b = [x1 - r1 * cos, y1 - r1 * sin];
  const p2a = [x2 + r2 * cos, y2 + r2 * sin];
  const p2b = [x2 - r2 * cos, y2 - r2 * sin];
  return `M${p1a[0]},${p1a[1]} L${p2a[0]},${p2a[1]} A${r2},${r2} 0 0 0 ${p2b[0]},${p2b[1]} L${p1b[0]},${p1b[1]} A${r1},${r1} 0 0 0 ${p1a[0]},${p1a[1]} Z`;
}
