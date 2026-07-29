import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { ContentLayerStack, LAYER_ORDER } from '../components/ContentLayerStack';
import { CATEGORY_LABELS, CONTENT_ITEMS, ContentCategory, ContentItem } from '../data/contentManifest';

const BODY_PLACEHOLDER = CONTENT_ITEMS.body_decor.find((i) => i.id === '1')?.source;

/**
 * Technical proof-of-concept for the purchased/downloaded doll asset pack:
 * lets you pick one item per category and see them stack correctly on the
 * shared 800x1200 canvas. There's no real base body in the pack yet (only
 * clothes/accessories/decor), so a faint placeholder silhouette stands in
 * for it until that's added.
 */
export function ContentPreviewScreen() {
  const { width } = useWindowDimensions();
  const stageWidth = Math.min(360, width - 32);
  const [selection, setSelection] = useState<Partial<Record<ContentCategory, ContentItem | null>>>({});

  const categories = useMemo(
    () => LAYER_ORDER.filter((c) => c !== 'decor_bg_front' && c !== 'body_decor'),
    []
  );

  function pick(category: ContentCategory, item: ContentItem) {
    setSelection((s) => ({ ...s, [category]: s[category]?.id === item.id ? null : item }));
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Content Pack Preview</Text>
      <Text style={styles.notice}>
        Placeholder body shown faintly — waiting on the real base doll. Tap an item to toggle it on/off.
      </Text>

      <View style={styles.stageWrap}>
        <ContentLayerStack
          selection={selection}
          width={stageWidth}
          showBodyPlaceholder
          bodyPlaceholderSource={BODY_PLACEHOLDER}
        />
      </View>

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        {categories.map((category) => (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {CATEGORY_LABELS[category]} ({CONTENT_ITEMS[category].length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CONTENT_ITEMS[category].map((item) => {
                const active = selection[category]?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    testID={`thumb-${category}-${item.id}`}
                    style={[styles.thumbWrap, active && styles.thumbWrapActive]}
                    onPress={() => pick(category, item)}
                  >
                    <Image source={item.source} style={styles.thumb} resizeMode="contain" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 56, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#b83c6f' },
  notice: { fontSize: 12, color: '#8a5a72', textAlign: 'center', paddingHorizontal: 24, marginTop: 4 },
  stageWrap: { marginTop: 12, marginBottom: 8 },
  panel: { flex: 1, width: '100%' },
  panelContent: { paddingHorizontal: 16, paddingBottom: 24 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6 },
  thumbWrap: {
    width: 64,
    height: 64,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#f0d9e6',
    backgroundColor: '#fafafa',
  },
  thumbWrapActive: { borderColor: '#e0558f', backgroundColor: '#fff0f6' },
  thumb: { width: '100%', height: '100%' },
});
