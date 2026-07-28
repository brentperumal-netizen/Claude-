import { HairDef } from '../types';

export const HAIR_STYLES: HairDef[] = [
  {
    id: 'bob',
    label: 'Bob',
    emoji: '💇‍♀️',
    shapes: [
      {
        kind: 'path',
        d: `M98,88
          Q98,36 150,34
          Q202,36 202,88
          L202,145
          Q202,160 188,158
          L186,76
          L114,76
          L112,158
          Q98,160 98,145
          Z`,
      },
    ],
  },
  {
    id: 'long',
    label: 'Long Wave',
    emoji: '💁‍♀️',
    shapes: [
      {
        kind: 'path',
        d: `M94,90
          Q94,36 150,34
          Q206,36 206,90
          L212,230
          Q212,246 198,244
          L190,76
          L110,76
          L102,244
          Q88,246 88,230
          Z`,
      },
    ],
  },
  {
    id: 'ponytail',
    label: 'Ponytail',
    emoji: '🎀',
    shapes: [
      {
        kind: 'path',
        d: `M97,65
          Q97,36 150,34
          Q203,36 203,65
          L203,72
          L97,72
          Z`,
      },
      {
        kind: 'path',
        d: `M186,96
          Q210,104 214,150
          Q216,182 202,204
          Q206,164 196,132
          Q190,110 178,98
          Z`,
      },
    ],
  },
];
