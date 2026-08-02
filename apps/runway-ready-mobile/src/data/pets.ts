import { DetailShape, PetAccessoryDef, PetDef } from '../types';
import { darken } from '../geometry/colors';

// Each pet is drawn in its own 0..160 square, standing on a shared ground line,
// with a "collar" anchor (bow/bandana/bell) and a "hat" anchor (party hat).
// The horse also carries a "mount" anchor used to seat the rider in Ride mode.
export const PETS: PetDef[] = [
  {
    id: 'dog', label: 'Dog', emoji: '🐶', color: '#c68642',
    collar: { x: 118, y: 90 }, hat: { x: 118, y: 48 },
    body: [
      { kind: 'path', d: 'M46,100 Q20,90 28,68 Q36,84 52,94 Z' },
      { kind: 'rrect', x: 95, y: 112, width: 13, height: 38, rx: 6 },
      { kind: 'rrect', x: 55, y: 115, width: 13, height: 35, rx: 6 },
      { kind: 'oval', x: 42, y: 79, width: 76, height: 52 },
      { kind: 'circle', cx: 118, cy: 72, r: 22 },
      { kind: 'path', d: 'M100,46 Q88,50 90,66 Q92,80 104,82 Q100,66 100,46 Z' },
      { kind: 'path', d: 'M136,46 Q148,50 146,66 Q144,80 132,82 Q136,66 136,46 Z' },
      { kind: 'oval', x: 124, y: 72, width: 20, height: 16 },
    ],
    details: [
      { shape: { kind: 'circle', cx: 142, cy: 78, r: 3 }, color: '#2b2b2b' },
      { shape: { kind: 'circle', cx: 122, cy: 66, r: 2.5 }, color: '#2b2b2b' },
      { shape: { kind: 'circle', cx: 120, cy: 64, r: 0.9 }, color: '#ffffff' },
    ],
  },
  {
    id: 'cat', label: 'Cat', emoji: '🐱', color: '#8a8a8a',
    collar: { x: 116, y: 92 }, hat: { x: 116, y: 55 },
    body: [
      { kind: 'path', d: 'M50,105 Q20,110 18,80 Q16,55 34,50 Q28,72 40,90 Q46,100 56,102 Z' },
      { kind: 'rrect', x: 98, y: 118, width: 12, height: 32, rx: 6 },
      { kind: 'rrect', x: 58, y: 120, width: 12, height: 30, rx: 6 },
      { kind: 'oval', x: 48, y: 84, width: 68, height: 48 },
      { kind: 'circle', cx: 116, cy: 76, r: 19 },
      { kind: 'path', d: 'M100,64 L106,44 L114,66 Z' },
      { kind: 'path', d: 'M120,64 L128,44 L132,68 Z' },
      { kind: 'oval', x: 121, y: 77, width: 14, height: 10 },
    ],
    details: [
      { shape: { kind: 'path', d: 'M132,80 L138,78 L132,84 Z' }, color: '#ff9fc7' },
      { shape: { kind: 'circle', cx: 120, cy: 72, r: 2.2 }, color: '#2b2b2b' },
      { shape: { kind: 'circle', cx: 108, cy: 70, r: 2.2 }, color: '#2b2b2b' },
    ],
  },
  {
    id: 'bunny', label: 'Bunny', emoji: '🐰', color: '#f5f0e6',
    collar: { x: 110, y: 96 }, hat: { x: 110, y: 50 },
    body: [
      { kind: 'circle', cx: 52, cy: 118, r: 10 },
      { kind: 'oval', x: 86, y: 120, width: 18, height: 24 },
      { kind: 'oval', x: 48, y: 86, width: 64, height: 52 },
      { kind: 'circle', cx: 110, cy: 80, r: 20 },
      { kind: 'path', d: 'M92,90 Q86,50 96,20 Q102,14 104,22 Q100,50 104,90 Z' },
      { kind: 'path', d: 'M108,90 Q104,50 108,22 Q110,14 116,20 Q126,50 120,90 Z' },
    ],
    details: [
      { shape: { kind: 'oval', x: 118, y: 83, width: 8, height: 6 }, color: '#ff9fc7' },
      { shape: { kind: 'circle', cx: 112, cy: 74, r: 2.2 }, color: '#2b2b2b' },
      { shape: { kind: 'circle', cx: 100, cy: 76, r: 2.2 }, color: '#2b2b2b' },
    ],
  },
  {
    id: 'horse', label: 'Horse', emoji: '🐴', color: '#8a5a2b',
    collar: { x: 122, y: 65 }, mount: { x: 75, y: 74 }, rideable: true,
    body: [
      { kind: 'path', d: 'M32,95 Q15,90 20,68 Q26,80 38,90 Z' },
      { kind: 'rrect', x: 40, y: 105, width: 11, height: 42, rx: 5 },
      { kind: 'rrect', x: 58, y: 108, width: 11, height: 40, rx: 5 },
      { kind: 'rrect', x: 92, y: 108, width: 11, height: 40, rx: 5 },
      { kind: 'rrect', x: 112, y: 105, width: 11, height: 42, rx: 5 },
      { kind: 'oval', x: 31, y: 72, width: 88, height: 52 },
      { kind: 'path', d: 'M95,82 Q108,55 130,42 Q140,48 136,60 Q120,68 108,95 Z' },
      { kind: 'oval', x: 129, y: 34, width: 32, height: 22 },
      { kind: 'oval', x: 153, y: 43, width: 16, height: 12 },
      { kind: 'path', d: 'M136,36 L132,24 L142,34 Z' },
      { kind: 'path', d: 'M148,35 L152,22 L156,35 Z' },
    ],
    details: [
      { shape: { kind: 'path', d: 'M112,88 L104,84 L114,80 Z' }, color: '{{dark}}' },
      { shape: { kind: 'path', d: 'M118,76 L110,72 L120,68 Z' }, color: '{{dark}}' },
      { shape: { kind: 'path', d: 'M124,64 L116,60 L126,56 Z' }, color: '{{dark}}' },
      { shape: { kind: 'path', d: 'M130,50 L124,46 L133,44 Z' }, color: '{{dark}}' },
      { shape: { kind: 'circle', cx: 151, cy: 42, r: 2.2 }, color: '#2b2b2b' },
    ],
  },
  {
    id: 'giraffe', label: 'Giraffe', emoji: '🦒', color: '#e8c468',
    collar: { x: 100, y: 60 }, hat: { x: 118, y: 8 },
    body: [
      { kind: 'rrect', x: 42, y: 98, width: 9, height: 50, rx: 4 },
      { kind: 'rrect', x: 58, y: 100, width: 9, height: 48, rx: 4 },
      { kind: 'rrect', x: 90, y: 100, width: 9, height: 48, rx: 4 },
      { kind: 'rrect', x: 105, y: 98, width: 9, height: 50, rx: 4 },
      { kind: 'oval', x: 45, y: 72, width: 60, height: 40 },
      { kind: 'path', d: 'M92,80 Q100,50 108,30 Q116,20 122,22 Q114,25 110,35 Q104,55 100,84 Z' },
      { kind: 'oval', x: 105, y: 8, width: 26, height: 20 },
      { kind: 'circle', cx: 112, cy: 7, r: 3 },
      { kind: 'circle', cx: 123, cy: 7, r: 3 },
    ],
    details: [
      { shape: { kind: 'circle', cx: 60, cy: 88, r: 5 }, color: '{{dark}}', opacity: 0.8 },
      { shape: { kind: 'circle', cx: 80, cy: 82, r: 4 }, color: '{{dark}}', opacity: 0.8 },
      { shape: { kind: 'circle', cx: 70, cy: 100, r: 4.5 }, color: '{{dark}}', opacity: 0.8 },
      { shape: { kind: 'circle', cx: 100, cy: 55, r: 4 }, color: '{{dark}}', opacity: 0.8 },
      { shape: { kind: 'circle', cx: 106, cy: 70, r: 3.5 }, color: '{{dark}}', opacity: 0.8 },
      { shape: { kind: 'circle', cx: 122, cy: 22, r: 2 }, color: '#2b2b2b' },
    ],
  },
];

/** Resolves `{{dark}}` color tokens (mane tufts, giraffe spots) against the pet's own base color. */
export function resolveColor(token: string, baseColor: string): string {
  return token === '{{dark}}' ? darken(baseColor, 0.45) : token;
}

export const PET_ACCESSORIES: PetAccessoryDef[] = [
  {
    id: 'bow', label: 'Bow', emoji: '🎀', color: '#e0558f', anchor: 'collar',
    build: (c): DetailShape[] => [
      { shape: { kind: 'path', d: 'M-9,0 L-2,-4.5 L-2,4.5 Z' }, color: c },
      { shape: { kind: 'path', d: 'M9,0 L2,-4.5 L2,4.5 Z' }, color: c },
      { shape: { kind: 'circle', cx: 0, cy: 0, r: 3 }, color: darken(c, 0.2) },
    ],
  },
  {
    id: 'bandana', label: 'Bandana', emoji: '🧣', color: '#5cc4e0', anchor: 'collar',
    build: (c): DetailShape[] => [
      { shape: { kind: 'path', d: 'M-12,-3 L12,-3 L12,2 L-12,2 Z' }, color: c },
      { shape: { kind: 'path', d: 'M-4,2 L4,2 L0,13 Z' }, color: c },
    ],
  },
  {
    id: 'bell-collar', label: 'Bell Collar', emoji: '🔔', color: '#f2c94c', anchor: 'collar',
    build: (c): DetailShape[] => [
      { shape: { kind: 'rrect', x: -11, y: -3, width: 22, height: 5, rx: 2.5 }, color: c },
      { shape: { kind: 'circle', cx: 0, cy: 5, r: 3.2 }, color: '#f2c94c' },
      { shape: { kind: 'circle', cx: -1, cy: 4, r: 0.8 }, color: '#fff7d6' },
    ],
  },
  {
    id: 'party-hat', label: 'Party Hat', emoji: '🎉', color: '#8c5ce0', anchor: 'hat',
    build: (c): DetailShape[] => [
      { shape: { kind: 'path', d: 'M-9,0 L0,-20 L9,0 Z' }, color: c },
      { shape: { kind: 'circle', cx: 0, cy: -20, r: 2.4 }, color: '#fff7d6' },
      { shape: { kind: 'circle', cx: -3, cy: -8, r: 1.6 }, color: '#fff7d6', opacity: 0.8 },
      { shape: { kind: 'circle', cx: 3, cy: -14, r: 1.6 }, color: '#fff7d6', opacity: 0.8 },
    ],
  },
];
