import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { CharacterCanvas } from '../components/CharacterCanvas';
import { CharacterState } from '../types';
import { BODY_TYPES, SKIN_TONES } from '../data/bodyTypes';
import { HAIR_STYLES } from '../data/hair';
import { OUTFIT_STYLES } from '../data/outfits';
import { SHOE_STYLES } from '../data/shoes';
import { PETS, PET_ACCESSORIES } from '../data/pets';

const TABS = ['Body', 'Skin', 'Hair', 'Outfit', 'Shoes', 'Pet'] as const;
type Tab = (typeof TABS)[number];

const INITIAL_STATE: CharacterState = {
  bodyType: 'feminine',
  skin: SKIN_TONES[0],
  hair: { style: 'bob', color: '#2b2b2b' },
  face: {
    eyeShape: 'round',
    eyeColor: '#3b2417',
    eyebrowShape: 'soft',
    mouth: 'smile',
    lipColor: '#c9748b',
    blush: true,
    freckles: false,
  },
  outfit: { style: 'aline', color: '#e0558f' },
  shoes: { style: 'heels', color: '#2b2b2b' },
  pet: { species: 'none', color: '#c68642', accessory: 'none' },
};

export function DressUpScreen() {
  const { width } = useWindowDimensions();
  const [state, setState] = useState<CharacterState>(INITIAL_STATE);
  const [tab, setTab] = useState<Tab>('Body');
  const canvasWidth = Math.min(320, width - 40);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Runway Ready</Text>
      <View style={styles.stage}>
        <CharacterCanvas state={state} width={canvasWidth} />
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        {tab === 'Body' && (
          <OptionRow
            items={BODY_TYPES.map((b) => ({ id: b.id, label: b.label, emoji: b.emoji }))}
            selected={state.bodyType}
            onPick={(id) => setState((s) => ({ ...s, bodyType: id as CharacterState['bodyType'] }))}
          />
        )}

        {tab === 'Skin' && <SwatchRow colors={SKIN_TONES} selected={state.skin} onPick={(c) => setState((s) => ({ ...s, skin: c }))} />}

        {tab === 'Hair' && (
          <>
            <OptionRow
              items={HAIR_STYLES.map((h) => ({ id: h.id, label: h.label, emoji: h.emoji }))}
              selected={state.hair.style}
              onPick={(id) => setState((s) => ({ ...s, hair: { ...s.hair, style: id } }))}
            />
            <SwatchRow
              colors={['#2b2b2b', '#4b2e1e', '#8a5a2b', '#d9b45a', '#e0558f', '#8c5ce0']}
              selected={state.hair.color}
              onPick={(c) => setState((s) => ({ ...s, hair: { ...s.hair, color: c } }))}
            />
          </>
        )}

        {tab === 'Outfit' && (
          <>
            <OptionRow
              items={OUTFIT_STYLES.map((o) => ({ id: o.id, label: o.label, emoji: o.emoji }))}
              selected={state.outfit.style}
              onPick={(id) => setState((s) => ({ ...s, outfit: { ...s.outfit, style: id } }))}
            />
            <SwatchRow
              colors={['#e0558f', '#8c5ce0', '#5cc4e0', '#43b581', '#f2c94c', '#e05c5c']}
              selected={state.outfit.color}
              onPick={(c) => setState((s) => ({ ...s, outfit: { ...s.outfit, color: c } }))}
            />
          </>
        )}

        {tab === 'Shoes' && (
          <>
            <OptionRow
              items={SHOE_STYLES.map((sh) => ({ id: sh.id, label: sh.label, emoji: sh.emoji }))}
              selected={state.shoes.style}
              onPick={(id) => setState((s) => ({ ...s, shoes: { ...s.shoes, style: id } }))}
            />
            <SwatchRow
              colors={['#2b2b2b', '#8a5a2b', '#e0558f', '#ffffff', '#c68642', '#5cc4e0']}
              selected={state.shoes.color}
              onPick={(c) => setState((s) => ({ ...s, shoes: { ...s.shoes, color: c } }))}
            />
          </>
        )}

        {tab === 'Pet' && (
          <>
            <OptionRow
              items={[{ id: 'none', label: 'No Pet', emoji: '🚫' }, ...PETS.map((p) => ({ id: p.id, label: p.label, emoji: p.emoji }))]}
              selected={state.pet.species}
              onPick={(id) => {
                const def = PETS.find((p) => p.id === id);
                setState((s) => ({ ...s, pet: { ...s.pet, species: id, color: def?.color ?? s.pet.color } }));
              }}
            />
            <OptionRow
              items={[{ id: 'none', label: 'No Accessory', emoji: '—' }, ...PET_ACCESSORIES.map((a) => ({ id: a.id, label: a.label, emoji: a.emoji }))]}
              selected={state.pet.accessory}
              onPick={(id) => setState((s) => ({ ...s, pet: { ...s.pet, accessory: id } }))}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function OptionRow({
  items,
  selected,
  onPick,
}: {
  items: { id: string; label: string; emoji: string }[];
  selected: string;
  onPick: (id: string) => void;
}) {
  return (
    <View style={styles.optionRow}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.optionBtn, selected === item.id && styles.optionBtnActive]}
          onPress={() => onPick(item.id)}
        >
          <Text style={styles.optionEmoji}>{item.emoji}</Text>
          <Text style={[styles.optionLabel, selected === item.id && styles.optionLabelActive]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SwatchRow({ colors, selected, onPick }: { colors: string[]; selected: string; onPick: (c: string) => void }) {
  return (
    <View style={styles.optionRow}>
      {colors.map((c) => (
        <TouchableOpacity
          key={c}
          style={[styles.swatch, { backgroundColor: c }, selected === c && styles.swatchActive]}
          onPress={() => onPick(c)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 56, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#b83c6f', marginBottom: 8 },
  stage: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#ffd6ec',
    paddingVertical: 12,
    borderRadius: 16,
    marginHorizontal: 16,
  },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 12, paddingHorizontal: 12 },
  tab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#f7e3ee' },
  tabActive: { backgroundColor: '#e0558f' },
  tabText: { color: '#8a5a72', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#ffffff' },
  panel: { flex: 1, width: '100%', marginTop: 10 },
  panelContent: { paddingHorizontal: 16, paddingBottom: 24 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  optionBtn: {
    borderWidth: 1.5,
    borderColor: '#f0d9e6',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 74,
  },
  optionBtnActive: { borderColor: '#e0558f', backgroundColor: '#fff0f6' },
  optionEmoji: { fontSize: 20 },
  optionLabel: { fontSize: 11, color: '#555', marginTop: 2, textAlign: 'center' },
  optionLabelActive: { color: '#b83c6f', fontWeight: '700' },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: '#b83c6f' },
});
