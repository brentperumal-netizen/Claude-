import React from 'react';
import { Path } from '@shopify/react-native-skia';
import { DetailShape } from '../types';
import { shapeToPath } from '../geometry/skPath';

export function DetailShapes({ details }: { details: DetailShape[] }) {
  return (
    <>
      {details.map((d, i) => (
        <Path
          key={i}
          path={shapeToPath(d.shape)}
          color={d.color}
          opacity={d.opacity ?? 1}
          style={d.strokeWidth ? 'stroke' : 'fill'}
          strokeWidth={d.strokeWidth}
          strokeCap="round"
        />
      ))}
    </>
  );
}
