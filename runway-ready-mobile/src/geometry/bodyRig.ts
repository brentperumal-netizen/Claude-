import { BodyProfile, OutfitShape, PetAnchor } from '../types';
import { capsulePath } from './capsule';

/**
 * Single source of truth for every skeletal coordinate on the character.
 *
 * The web prototype's overlap bugs (clothes clipping hands, the pet getting
 * sliced by a garment's hem) came from the same numbers being re-guessed in
 * several places — a fixed CSS corner for the pet, fixed pixel offsets for
 * clothing — that quietly drifted apart as body types and outfits changed.
 * Everything here (limbs, hands, ground line, pet socket) is derived from one
 * body profile, so nothing can be positioned against stale or approximate
 * assumptions about where the body actually is.
 */

export const CANVAS_W = 300;
export const CANVAS_H = 520;
export const CENTER_X = 150;
export const GROUND_Y = 445; // ankle line — where feet/shoes meet the floor
export const TORSO_Y = { shoulder: 148, chest: 175, waist: 206, hip: 250 };

const SHOULDER_Y = 168;
const HAND_Y = 272;
const LEG_TOP_Y = 248;
const LEG_CLEARANCE = 26; // floor-level half-width of a bare leg + shoe

export interface Rig {
  shoulderL: PetAnchor;
  shoulderR: PetAnchor;
  handL: PetAnchor;
  handR: PetAnchor;
  legTopL: PetAnchor;
  legTopR: PetAnchor;
  ankleL: PetAnchor;
  ankleR: PetAnchor;
  armPathL: string;
  armPathR: string;
  armOutlineL: string;
  armOutlineR: string;
  legPathL: string;
  legPathR: string;
  legOutlineL: string;
  legOutlineR: string;
  limbShineWidth: number;
}

export function buildRig(bt: BodyProfile): Rig {
  const lx = 93 - bt.armSpread;
  const rx = 207 + bt.armSpread;
  const rUpper = (bt.limbWidth / 2) * 1.15;
  const rLower = (bt.limbWidth / 2) * 0.68;
  const outlineGrow = 2;

  return {
    shoulderL: { x: 125, y: SHOULDER_Y },
    shoulderR: { x: 175, y: SHOULDER_Y },
    handL: { x: lx, y: HAND_Y },
    handR: { x: rx, y: HAND_Y },
    legTopL: { x: 133, y: LEG_TOP_Y },
    legTopR: { x: 167, y: LEG_TOP_Y },
    ankleL: { x: 127, y: GROUND_Y },
    ankleR: { x: 173, y: GROUND_Y },
    armPathL: capsulePath(125, SHOULDER_Y, rUpper, lx, HAND_Y, rLower),
    armPathR: capsulePath(175, SHOULDER_Y, rUpper, rx, HAND_Y, rLower),
    armOutlineL: capsulePath(125, SHOULDER_Y, rUpper + outlineGrow, lx, HAND_Y, rLower + outlineGrow),
    armOutlineR: capsulePath(175, SHOULDER_Y, rUpper + outlineGrow, rx, HAND_Y, rLower + outlineGrow),
    legPathL: capsulePath(133, LEG_TOP_Y, rUpper, 127, GROUND_Y, rLower),
    legPathR: capsulePath(167, LEG_TOP_Y, rUpper, 173, GROUND_Y, rLower),
    legOutlineL: capsulePath(133, LEG_TOP_Y, rUpper + outlineGrow, 127, GROUND_Y, rLower + outlineGrow),
    legOutlineR: capsulePath(167, LEG_TOP_Y, rUpper + outlineGrow, 173, GROUND_Y, rLower + outlineGrow),
    limbShineWidth: Math.max(2, bt.limbWidth * 0.22),
  };
}

/** Curved torso silhouette (shoulder -> chest -> waist -> hip). */
export function bodyTorsoPath(bt: BodyProfile, pad = 0): string {
  const cx = CENTER_X;
  const { shoulder: sY, chest: bY, waist: wY, hip: hY } = TORSO_Y;
  const s = bt.shoulderHalf + pad;
  const c = bt.chestHalf + pad;
  const w = bt.waistHalf + pad;
  const h = bt.hipHalf + pad;
  return `M${cx - s},${sY}
    C${cx - s},${sY + 14} ${cx - c},${bY - 10} ${cx - c},${bY}
    C${cx - c},${bY + 16} ${cx - w},${wY - 14} ${cx - w},${wY}
    C${cx - w},${wY + 16} ${cx - h},${hY - 18} ${cx - h},${hY}
    L${cx + h},${hY}
    C${cx + h},${hY - 18} ${cx + w},${wY + 16} ${cx + w},${wY}
    C${cx + w},${wY - 14} ${cx + c},${bY + 16} ${cx + c},${bY}
    C${cx + c},${bY - 10} ${cx + s},${sY + 14} ${cx + s},${sY}
    Z`;
}

/**
 * How wide the character's silhouette actually is at floor level. If the
 * garment's hem reaches the floor (a long gown), that hem is what a
 * ground-standing companion needs to clear; otherwise the floor-level
 * silhouette is just bare legs/shoes.
 */
export function getGroundClearanceHalfWidth(outfit: OutfitShape): number {
  if (outfit.hemY >= GROUND_Y - 40) return outfit.hemHalfWidth;
  return LEG_CLEARANCE;
}

/** Where a companion pet stands: at the character's own floor line, clear of whatever is actually there. */
export function getPetSocket(outfit: OutfitShape, petHalfWidth = 34): PetAnchor {
  const clearance = getGroundClearanceHalfWidth(outfit);
  return { x: CENTER_X - clearance - petHalfWidth, y: GROUND_Y };
}
