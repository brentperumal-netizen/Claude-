import React from 'react';
import { Group } from '@shopify/react-native-skia';
import { PetAccessoryDef, PetAnchor, PetDef } from '../types';
import { GradientFill } from './GradientFill';
import { DetailShapes } from './DetailShapes';
import { resolveColor } from '../data/pets';

const PET_CENTER_X = 80;
const PET_GROUND_Y = 150;
const PET_SCALE = 0.65;

interface Props {
  pet: PetDef;
  color: string;
  accessory?: PetAccessoryDef;
  /** Where the pet's own ground point lands, in the character canvas's coordinate space. */
  at: PetAnchor;
}

/** Renders a pet at a world position derived from the character's actual ground line (see getPetSocket) — never a fixed guess independent of the outfit actually worn. */
export function PetGroup({ pet, color, accessory, at }: Props) {
  const resolvedDetails = (pet.details ?? []).map((d) => ({ ...d, color: resolveColor(d.color, color) }));
  const accessoryAnchor = accessory ? pet[accessory.anchor] : undefined;

  return (
    <Group
      transform={[
        { translateX: at.x },
        { translateY: at.y },
        { scale: PET_SCALE },
        { translateX: -PET_CENTER_X },
        { translateY: -PET_GROUND_Y },
      ]}
    >
      <GradientFill shapes={pet.body} color={color} lightAmt={0.3} darkAmt={0.28} />
      {resolvedDetails.length > 0 && <DetailShapes details={resolvedDetails} />}
      {accessory && accessoryAnchor && (
        <Group transform={[{ translateX: accessoryAnchor.x }, { translateY: accessoryAnchor.y }]}>
          <DetailShapes details={accessory.build(accessory.color)} />
        </Group>
      )}
    </Group>
  );
}
