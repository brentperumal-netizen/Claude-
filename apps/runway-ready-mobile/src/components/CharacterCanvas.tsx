import React, { useMemo } from 'react';
import { Canvas, Group, Path, Circle, Skia } from '@shopify/react-native-skia';
import { CharacterState } from '../types';
import { BODY_TYPES } from '../data/bodyTypes';
import { HAIR_STYLES } from '../data/hair';
import { OUTFIT_STYLES } from '../data/outfits';
import { SHOE_STYLES } from '../data/shoes';
import { PETS, PET_ACCESSORIES } from '../data/pets';
import { buildRig, bodyTorsoPath, getPetSocket, CANVAS_W, CANVAS_H } from '../geometry/bodyRig';
import { handShapes } from '../geometry/hand';
import { GradientFill } from './GradientFill';
import { DetailShapes } from './DetailShapes';
import { PetGroup } from './PetGroup';
import { shapesToPath } from '../geometry/skPath';

interface Props {
  state: CharacterState;
  width: number;
}

export function CharacterCanvas({ state, width }: Props) {
  const scale = width / CANVAS_W;
  const height = CANVAS_H * scale;

  const bt = BODY_TYPES.find((b) => b.id === state.bodyType)!;
  const hairDef = HAIR_STYLES.find((h) => h.id === state.hair.style)!;
  const outfitDef = OUTFIT_STYLES.find((o) => o.id === state.outfit.style)!;
  const shoeDef = SHOE_STYLES.find((s) => s.id === state.shoes.style)!;
  const petDef = PETS.find((p) => p.id === state.pet.species);
  const petAccessory = PET_ACCESSORIES.find((a) => a.id === state.pet.accessory);

  const rig = useMemo(() => buildRig(bt), [bt]);
  const torso = useMemo(() => ({ kind: 'path' as const, d: bodyTorsoPath(bt) }), [bt]);
  const outfitShape = useMemo(() => outfitDef.build(bt, state.outfit.color), [outfitDef, bt, state.outfit.color]);
  const shoeShape = useMemo(() => shoeDef.build(state.shoes.color), [shoeDef, state.shoes.color]);
  const petSocket = petDef ? getPetSocket(outfitShape) : null;

  const skinShapes = useMemo(
    () => [
      torso,
      { kind: 'rrect' as const, x: 137, y: 132, width: 26, height: 26, rx: 8 },
      { kind: 'oval' as const, x: 98, y: 86, width: 12, height: 22 },
      { kind: 'oval' as const, x: 190, y: 86, width: 12, height: 22 },
      { kind: 'circle' as const, cx: 150, cy: 93, r: 48 },
      { kind: 'path' as const, d: rig.armPathL },
      { kind: 'path' as const, d: rig.armPathR },
      { kind: 'path' as const, d: rig.legPathL },
      { kind: 'path' as const, d: rig.legPathR },
    ],
    [torso, rig]
  );

  const outlineShapes = useMemo(
    () => [
      { kind: 'path' as const, d: rig.armOutlineL },
      { kind: 'path' as const, d: rig.armOutlineR },
      { kind: 'path' as const, d: rig.legOutlineL },
      { kind: 'path' as const, d: rig.legOutlineR },
    ],
    [rig]
  );

  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ scale }]}>
        {/* Companion pet stands at the character's own floor line, clear of the outfit's actual hem width. */}
        {petDef && petSocket && (
          <PetGroup pet={petDef} color={state.pet.color} accessory={petAccessory} at={petSocket} />
        )}

        {/* Body */}
        <Path path={shapesToPath(outlineShapes)} color="rgba(40,28,20,0.28)" />
        <GradientFill shapes={skinShapes} color={state.skin} lightAmt={0.35} darkAmt={0.22} />
        <Group transform={[{ translateX: rig.handL.x }, { translateY: rig.handL.y }]}>
          <GradientFill shapes={handShapes('left')} color={state.skin} lightAmt={0.35} darkAmt={0.22} />
        </Group>
        <Group transform={[{ translateX: rig.handR.x }, { translateY: rig.handR.y }]}>
          <GradientFill shapes={handShapes('right')} color={state.skin} lightAmt={0.35} darkAmt={0.22} />
        </Group>
        <Circle cx={128} cy={72} r={9} color="#ffffff" opacity={0.32} />

        {/* Hair (behind face) */}
        <GradientFill shapes={hairDef.shapes} color={state.hair.color} lightAmt={0.3} darkAmt={0.35} />

        {/* Simple face */}
        <SimpleFace faceColor={state.face.lipColor} eyeColor={state.face.eyeColor} blush={state.face.blush} />

        {/* Shoes */}
        <GradientFill shapes={shoeShape.fillShapes} color={state.shoes.color} lightAmt={0.35} darkAmt={0.3} />
        {shoeShape.details && <DetailShapes details={shoeShape.details} />}

        {/* Outfit */}
        {outfitDef.fixedColor ? (
          <Path path={shapesToPath(outfitShape.fillShapes)} color={state.outfit.color} />
        ) : (
          <GradientFill shapes={outfitShape.fillShapes} color={state.outfit.color} lightAmt={0.4} darkAmt={0.3} />
        )}
        {outfitShape.details && <DetailShapes details={outfitShape.details} />}
      </Group>
    </Canvas>
  );
}

function SimpleFace({ faceColor, eyeColor, blush }: { faceColor: string; eyeColor: string; blush: boolean }) {
  return (
    <>
      {blush && (
        <>
          <Circle cx={130} cy={104} r={7} color="#ff8fa3" opacity={0.4} />
          <Circle cx={170} cy={104} r={7} color="#ff8fa3" opacity={0.4} />
        </>
      )}
      <Circle cx={132} cy={90} r={3.4} color="#ffffff" />
      <Circle cx={168} cy={90} r={3.4} color="#ffffff" />
      <Circle cx={132} cy={90} r={2} color={eyeColor} />
      <Circle cx={168} cy={90} r={2} color={eyeColor} />
      <Circle cx={132} cy={90} r={0.9} color="#1a1a1a" />
      <Circle cx={168} cy={90} r={0.9} color="#1a1a1a" />
      <Path
        path={Skia.Path.MakeFromSVGString('M132,112 Q150,120 168,112')!}
        color={faceColor}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
      />
    </>
  );
}
