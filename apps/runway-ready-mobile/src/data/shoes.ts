import { ShoeDef } from '../types';

export const SHOE_STYLES: ShoeDef[] = [
  {
    id: 'heels',
    label: 'Heels',
    emoji: '👠',
    defaultColor: '#2b2b2b',
    build: () => ({
      fillShapes: [
        { kind: 'path', d: 'M123,449 L131,449 L128,495 L126,495 Z' },
        { kind: 'path', d: 'M113,428 Q127,420 141,428 Q145,440 141,452 Q136,462 127,464 Q118,462 113,452 Q109,440 113,428 Z' },
        { kind: 'path', d: 'M169,449 L177,449 L174,495 L172,495 Z' },
        { kind: 'path', d: 'M159,428 Q173,420 187,428 Q191,440 187,452 Q182,462 173,464 Q164,462 159,452 Q155,440 159,428 Z' },
      ],
      details: [
        { shape: { kind: 'path', d: 'M113,431 Q127,437 141,431 L141,436 Q127,442 113,436 Z' }, color: '#8a6247' },
        { shape: { kind: 'path', d: 'M157,431 Q173,437 189,431 L189,436 Q173,442 157,436 Z' }, color: '#8a6247' },
        { shape: { kind: 'oval', x: 118, y: 477, width: 18, height: 6 }, color: '#000000', opacity: 0.22 },
        { shape: { kind: 'oval', x: 164, y: 477, width: 18, height: 6 }, color: '#000000', opacity: 0.22 },
      ],
    }),
  },
  {
    id: 'flats',
    label: 'Flats',
    emoji: '🥿',
    defaultColor: '#e0558f',
    build: () => ({
      fillShapes: [
        { kind: 'path', d: 'M106,447 Q127,438 148,447 Q150,452 148,456 L106,456 Q104,452 106,447 Z' },
        { kind: 'path', d: 'M152,447 Q173,438 194,447 Q196,452 194,456 L152,456 Q150,452 152,447 Z' },
      ],
      details: [
        { shape: { kind: 'path', d: 'M122,439 Q127,444 132,439' }, color: '#000000', opacity: 0.18 },
        { shape: { kind: 'path', d: 'M168,439 Q173,444 178,439' }, color: '#000000', opacity: 0.18 },
        { shape: { kind: 'oval', x: 105, y: 448, width: 44, height: 12 }, color: '#000000', opacity: 0.2 },
        { shape: { kind: 'oval', x: 151, y: 448, width: 44, height: 12 }, color: '#000000', opacity: 0.2 },
      ],
    }),
  },
];
