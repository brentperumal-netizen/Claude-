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
          L186,95
          L114,95
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
          L190,97
          L110,97
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
        d: `M97,90
          Q97,36 150,34
          Q203,36 203,90
          L203,100
          L97,100
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
