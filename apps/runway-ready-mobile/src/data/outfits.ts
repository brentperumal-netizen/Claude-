import { OutfitDef } from '../types';
import { TORSO_Y } from '../geometry/bodyRig';
import { capsulePath } from '../geometry/capsule';

const CX = 150;

export const OUTFIT_STYLES: OutfitDef[] = [
  {
    id: 'aline',
    label: 'A-Line Dress',
    emoji: '👗',
    defaultColor: '#e0558f',
    build: (bt) => {
      const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
      const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4;
      const hemY = 340, hemHalf = bt.hipHalf + 44;
      return {
        fillShapes: [
          {
            kind: 'path',
            d: `M${CX - s},${sY} L${CX + s},${sY}
                C${CX + s},${sY + 14} ${CX + c},${bY - 10} ${CX + c},${bY}
                C${CX + c},${bY + 16} ${CX + w},${wY - 14} ${CX + w},${wY}
                L${CX + hemHalf},${hemY} Q${CX},${hemY + 18} ${CX - hemHalf},${hemY}
                L${CX - w},${wY}
                C${CX - w},${wY - 14} ${CX - c},${bY + 16} ${CX - c},${bY}
                C${CX - c},${bY - 10} ${CX - s},${sY + 14} ${CX - s},${sY} Z`,
          },
        ],
        details: [
          { shape: { kind: 'path', d: `M${CX - s + 7},${sY + 6} L${CX - w + 2},${wY + 120}` }, color: '#ffffff', opacity: 0.15, strokeWidth: 6 },
          { shape: { kind: 'path', d: `M${CX - hemHalf + 18},252 Q${CX},260 ${CX + hemHalf - 18},252` }, color: '#000000', opacity: 0.12, strokeWidth: 2 },
          { shape: { kind: 'path', d: `M${CX - s},${sY} L${CX + s},${sY} L${CX + s - 3},${sY + 14} L${CX - s + 3},${sY + 14} Z` }, color: '#000000', opacity: 0.08 },
        ],
        hemHalfWidth: hemHalf,
        hemY,
      };
    },
  },
  {
    id: 'mermaid',
    label: 'Mermaid Gown',
    emoji: '💃',
    defaultColor: '#8c5ce0',
    build: (bt) => {
      const { shoulder: sY, chest: bY, waist: wY, hip: hY } = TORSO_Y;
      const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4, h = bt.hipHalf + 4;
      const kneeY = 300, kneeHalf = h - 6;
      const hemY = 400, hemHalf = h + 46;
      return {
        fillShapes: [
          {
            kind: 'path',
            d: `M${CX - s},${sY} L${CX + s},${sY}
                C${CX + s},${sY + 14} ${CX + c},${bY - 10} ${CX + c},${bY}
                C${CX + c},${bY + 16} ${CX + w},${wY - 14} ${CX + w},${wY}
                C${CX + w},${wY + 16} ${CX + h},${hY - 18} ${CX + h},${hY}
                L${CX + kneeHalf},${kneeY} Q${CX + hemHalf},${kneeY + 30} ${CX + hemHalf},${hemY}
                L${CX - hemHalf},${hemY} Q${CX - hemHalf},${kneeY + 30} ${CX - kneeHalf},${kneeY}
                L${CX - h},${hY}
                C${CX - h},${hY - 18} ${CX - w},${wY + 16} ${CX - w},${wY}
                C${CX - w},${wY - 14} ${CX - c},${bY + 16} ${CX - c},${bY}
                C${CX - c},${bY - 10} ${CX - s},${sY + 14} ${CX - s},${sY} Z`,
          },
        ],
        details: [
          { shape: { kind: 'path', d: `M${CX - s + 8},${sY + 8} L${CX - w + 2},${kneeY - 12}` }, color: '#ffffff', opacity: 0.16, strokeWidth: 5 },
          { shape: { kind: 'path', d: `M${CX - kneeHalf + 10},${kneeY + 18} Q${CX},${kneeY + 30} ${CX + kneeHalf - 10},${kneeY + 18}` }, color: '#000000', opacity: 0.12, strokeWidth: 2 },
          { shape: { kind: 'path', d: `M${CX - s},${sY} L${CX + s},${sY} L${CX + s - 3},${sY + 13} L${CX - s + 3},${sY + 13} Z` }, color: '#000000', opacity: 0.08 },
        ],
        hemHalfWidth: hemHalf,
        hemY,
      };
    },
  },
  {
    id: 'jumpsuit',
    label: 'Jumpsuit',
    emoji: '👖',
    defaultColor: '#5cc4e0',
    build: (bt) => {
      const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
      const rUpper = (bt.limbWidth / 2) * 1.15 + 4;
      const rLower = (bt.limbWidth / 2) * 0.68 * 0.9 + 3;
      const legTopY = 248;
      const legL = capsulePath(133, legTopY, rUpper, 127, 418, rLower);
      const legR = capsulePath(167, legTopY, rUpper, 173, 418, rLower);
      const s = bt.shoulderHalf, c = bt.chestHalf + 3, w = bt.waistHalf + 4;
      // The bodice's hip corners are derived from the leg capsules' own top
      // circles (not a fixed hip-width guess), so the bodice always fully
      // overlaps the pant legs with no exposed-skin seam, regardless of body profile.
      const hipOuterL = 133 - rUpper;
      const hipOuterR = 167 + rUpper;
      const hipDipY = legTopY + rUpper * 0.7;
      const bodice = `M${CX - s},${sY} L${CX + s},${sY}
        C${CX + s},${sY + 14} ${CX + c},${bY - 10} ${CX + c},${bY}
        C${CX + c},${bY + 16} ${CX + w},${wY - 14} ${CX + w},${wY}
        C${CX + w},${wY + 16} ${hipOuterR},${legTopY - 6} ${hipOuterR},${hipDipY}
        L${hipOuterL},${hipDipY}
        C${hipOuterL},${legTopY - 6} ${CX - w},${wY + 16} ${CX - w},${wY}
        C${CX - w},${wY - 14} ${CX - c},${bY + 16} ${CX - c},${bY}
        C${CX - c},${bY - 10} ${CX - s},${sY + 14} ${CX - s},${sY} Z`;
      return {
        fillShapes: [
          { kind: 'path', d: bodice },
          { kind: 'path', d: legL },
          { kind: 'path', d: legR },
        ],
        details: [
          { shape: { kind: 'path', d: `M${CX},152 L${CX},${hipDipY - 4}` }, color: '#000000', opacity: 0.15, strokeWidth: 1.4 },
          { shape: { kind: 'path', d: `M${CX - bt.chestHalf + 6},158 L${CX - bt.waistHalf + 2},${hipDipY - 4}` }, color: '#ffffff', opacity: 0.15, strokeWidth: 4 },
          { shape: { kind: 'path', d: `M${CX - s},${sY} L${CX + s},${sY} L${CX + s - 3},${sY + 14} L${CX - s + 3},${sY + 14} Z` }, color: '#000000', opacity: 0.08 },
        ],
        hemHalfWidth: 22,
        hemY: 418,
      };
    },
  },
];
