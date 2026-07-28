export interface BodyProfile {
  id: 'feminine' | 'masculine' | 'neutral';
  label: string;
  emoji: string;
  shoulderHalf: number;
  chestHalf: number;
  waistHalf: number;
  hipHalf: number;
  limbWidth: number;
  armSpread: number;
}

/**
 * A drawable primitive, built via Skia's own path-construction methods
 * (addCircle/addOval/addRRect) rather than hand-derived SVG arc strings —
 * only genuinely custom silhouettes (a dress hem, a horse's neck) fall back
 * to raw path data, which Skia parses with the same SVG path grammar.
 */
export type Shape =
  | { kind: 'path'; d: string }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'oval'; x: number; y: number; width: number; height: number }
  | { kind: 'rrect'; x: number; y: number; width: number; height: number; rx: number; ry?: number };

export interface DetailShape {
  shape: Shape;
  /** Literal hex color, or a `{{dark}}`/`{{light}}` token resolved against the owner's base color at render time. */
  color: string;
  opacity?: number;
  /** If set, painted as a stroke of this width instead of a fill. */
  strokeWidth?: number;
}

export interface OutfitShape {
  /** Shapes painted with the outfit's gradient fill. */
  fillShapes: Shape[];
  /** Fixed-color decorative details (seams, shading), painted after the fill. */
  details?: DetailShape[];
  /** Half-width of the garment's widest point — used to keep the pet clear of the hem. */
  hemHalfWidth: number;
  /** Y of the garment's widest point. */
  hemY: number;
}

export interface OutfitDef {
  id: string;
  label: string;
  emoji: string;
  fixedColor?: boolean;
  defaultColor: string;
  build: (bt: BodyProfile, color: string) => OutfitShape;
}

export interface HairDef {
  id: string;
  label: string;
  emoji: string;
  shapes: Shape[];
}

export interface ShoeShape {
  fillShapes: Shape[];
  details?: DetailShape[];
}

export interface ShoeDef {
  id: string;
  label: string;
  emoji: string;
  defaultColor: string;
  build: (color: string) => ShoeShape;
}

export interface PetAnchor {
  x: number;
  y: number;
}

export interface PetDef {
  id: string;
  label: string;
  emoji: string;
  color: string;
  /** Local 0..160 square, painted with the pet's gradient fill. */
  body: Shape[];
  /** Fixed-color details (eyes, nose, mane/spot tint via a `{{dark}}` color token). */
  details?: DetailShape[];
  collar?: PetAnchor;
  hat?: PetAnchor;
  mount?: PetAnchor;
  rideable?: boolean;
}

export interface PetAccessoryDef {
  id: string;
  label: string;
  emoji: string;
  color: string;
  anchor: 'collar' | 'hat';
  build: (color: string) => DetailShape[];
}

export interface FaceState {
  eyeShape: string;
  eyeColor: string;
  eyebrowShape: string;
  mouth: string;
  lipColor: string;
  blush: boolean;
  freckles: boolean;
}

export interface CharacterState {
  bodyType: BodyProfile['id'];
  skin: string;
  hair: { style: string; color: string };
  face: FaceState;
  outfit: { style: string; color: string };
  shoes: { style: string; color: string };
  pet: { species: string; color: string; accessory: string };
}
