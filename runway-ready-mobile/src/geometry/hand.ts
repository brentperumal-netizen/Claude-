import { Shape } from '../types';

/** A hand's palm+fingers, in local coordinates relative to the wrist (0,0). */
export function handShapes(side: 'left' | 'right'): Shape[] {
  if (side === 'left') {
    return [
      { kind: 'oval', x: 2.6, y: -7, width: 8.8, height: 6 }, // thumb, toward body center
      { kind: 'oval', x: -9, y: -10, width: 18, height: 18 }, // palm
      { kind: 'rrect', x: -6.4, y: 5, width: 3.2, height: 9, rx: 1.6 },
      { kind: 'rrect', x: -2.4, y: 5, width: 3.2, height: 11, rx: 1.6 },
      { kind: 'rrect', x: 1.2, y: 5, width: 3.2, height: 10, rx: 1.6 },
      { kind: 'rrect', x: 5.2, y: 5, width: 2.8, height: 7.5, rx: 1.4 },
    ];
  }
  return [
    { kind: 'oval', x: -11.4, y: -7, width: 8.8, height: 6 }, // thumb, toward body center
    { kind: 'oval', x: -9, y: -10, width: 18, height: 18 }, // palm
    { kind: 'rrect', x: 3.2, y: 5, width: 3.2, height: 9, rx: 1.6 },
    { kind: 'rrect', x: -0.8, y: 5, width: 3.2, height: 11, rx: 1.6 },
    { kind: 'rrect', x: -4.4, y: 5, width: 3.2, height: 10, rx: 1.6 },
    { kind: 'rrect', x: -8, y: 5, width: 2.8, height: 7.5, rx: 1.4 },
  ];
}
