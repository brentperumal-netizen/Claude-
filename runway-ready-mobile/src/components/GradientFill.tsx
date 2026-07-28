import React, { useMemo } from 'react';
import { Path, LinearGradient, vec } from '@shopify/react-native-skia';
import { Shape } from '../types';
import { shapeToPath } from '../geometry/skPath';
import { lighten, darken } from '../geometry/colors';

interface Props {
  shapes: Shape[];
  color: string;
  lightAmt?: number;
  darkAmt?: number;
}

/**
 * Fills a shape group with a diagonal light->base->dark gradient scaled to the
 * group's combined bounding box — the same "every colorable part gets its own
 * consistent glossy shading, regardless of its size or position" trick the web
 * prototype used, now backed by Skia's real gradient shader instead of a
 * hand-placed SVG defs block.
 *
 * Each shape is drawn as its own <Path> rather than merged into one combined
 * path: merging subpaths with opposite winding direction (e.g. a bodice
 * contour and a capsule contour) can cancel out under Skia's nonzero fill
 * rule wherever they overlap, punching an unwanted hole instead of a solid
 * union. Separate draw calls always paint solid regardless of winding.
 */
export function GradientFill({ shapes, color, lightAmt = 0.35, darkAmt = 0.3 }: Props) {
  const paths = useMemo(() => shapes.map(shapeToPath), [shapes]);
  const bounds = useMemo(() => {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (const p of paths) {
      const b = p.getBounds();
      x1 = Math.min(x1, b.x);
      y1 = Math.min(y1, b.y);
      x2 = Math.max(x2, b.x + b.width);
      y2 = Math.max(y2, b.y + b.height);
    }
    return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  }, [paths]);
  const light = lighten(color, lightAmt);
  const dark = darken(color, darkAmt);
  return (
    <>
      {paths.map((path, i) => (
        <Path key={i} path={path}>
          <LinearGradient
            start={vec(bounds.x, bounds.y)}
            end={vec(bounds.x + bounds.width, bounds.y + bounds.height)}
            colors={[light, color, dark]}
            positions={[0, 0.55, 1]}
          />
        </Path>
      ))}
    </>
  );
}
