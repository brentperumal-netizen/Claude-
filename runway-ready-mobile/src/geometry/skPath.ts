import { Skia, SkPath } from '@shopify/react-native-skia';
import { Shape } from '../types';

/**
 * Turns our declarative shape descriptors into one combined Skia path, using
 * Skia's own primitive constructors (addCircle/addOval/addRRect) instead of
 * hand-derived SVG arc math for circles/ellipses/rounded rects. Only genuinely
 * custom silhouettes fall back to raw path data, parsed by the same SVG path
 * grammar Skia already understands.
 */
export function shapesToPath(shapes: Shape[]): SkPath {
  const path = Skia.Path.Make();
  for (const shape of shapes) {
    switch (shape.kind) {
      case 'circle':
        path.addCircle(shape.cx, shape.cy, shape.r);
        break;
      case 'oval':
        path.addOval(Skia.XYWHRect(shape.x, shape.y, shape.width, shape.height));
        break;
      case 'rrect':
        path.addRRect(Skia.RRectXY(Skia.XYWHRect(shape.x, shape.y, shape.width, shape.height), shape.rx, shape.ry ?? shape.rx));
        break;
      case 'path': {
        const sub = Skia.Path.MakeFromSVGString(shape.d);
        if (sub) path.addPath(sub);
        break;
      }
    }
  }
  return path;
}

export function shapeToPath(shape: Shape): SkPath {
  return shapesToPath([shape]);
}
