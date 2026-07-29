import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { CONTENT_CANVAS_WIDTH, CONTENT_CANVAS_HEIGHT, ContentCategory, ContentItem } from '../data/contentManifest';

// Every item in the pack is painted against the same 800x1200 canvas, so
// alignment is achieved purely by stacking full-canvas images in this order —
// no per-item anchor points are needed (unlike the hand-built vector rig).
export const LAYER_ORDER: ContentCategory[] = [
  'decor_bg_front',
  'body_decor',
  'body_parts',
  'top_underwear',
  'bottom',
  'dress',
  'top',
  'jacket',
  'socks',
  'shoes',
  'accessories',
  'hand_weapons',
  'face_items',
];

interface Props {
  /** One selected item per category slot that should render; omit a category to leave it empty. */
  selection: Partial<Record<ContentCategory, ContentItem | null>>;
  width: number;
  /** Renders the placeholder body silhouette (body_decor/1) faintly so clothes have something to sit on. */
  showBodyPlaceholder?: boolean;
  bodyPlaceholderSource?: number;
}

export function ContentLayerStack({ selection, width, showBodyPlaceholder, bodyPlaceholderSource }: Props) {
  const height = (width * CONTENT_CANVAS_HEIGHT) / CONTENT_CANVAS_WIDTH;

  const layerStyle = { position: 'absolute' as const, top: 0, left: 0, width, height };

  return (
    <View style={[styles.stage, { width, height }]}>
      {showBodyPlaceholder && bodyPlaceholderSource && (
        <Image source={bodyPlaceholderSource} style={[layerStyle, { opacity: 0.35 }]} resizeMode="stretch" />
      )}
      {LAYER_ORDER.map((category) => {
        const item = selection[category];
        if (!item) return null;
        return <Image key={category} source={item.source} style={layerStyle} resizeMode="stretch" />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
