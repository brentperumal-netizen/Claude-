// ---------- Data ----------

const BODY_TYPES = [
  { id: 'feminine', label: 'Feminine', emoji: '⚘', torsoRx: 38, limbWidth: 22, armSpread: 0 },
  { id: 'masculine', label: 'Masculine', emoji: '◆', torsoRx: 16, limbWidth: 28, armSpread: 14 },
  { id: 'neutral', label: 'Neutral', emoji: '●', torsoRx: 28, limbWidth: 24, armSpread: 6 },
];

const THEMES = [
  { id: 'classic', label: 'Classic', emoji: '⭐' },
  { id: 'christmas', label: 'Christmas', emoji: '🎄' },
  { id: 'fairy', label: 'Fairy Tale', emoji: '🧚' },
];

const SKIN_TONES = ['#ffe0bd', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5a3825'];

const HAIR_STYLES = [
  { id: 'bob', label: 'Bob', emoji: '💇‍♀️',
    svg: `<path d="M98,80 A58,58 0 0 1 202,80 Z"/>
          <rect x="98" y="80" width="20" height="60" rx="10"/>
          <rect x="182" y="80" width="20" height="60" rx="10"/>` },
  { id: 'long', label: 'Long Wave', emoji: '🌊',
    svg: `<path d="M96,82 A60,60 0 0 1 204,82 Z"/>
          <rect x="92" y="82" width="22" height="180" rx="11"/>
          <rect x="186" y="82" width="22" height="180" rx="11"/>` },
  { id: 'curly', label: 'Curly', emoji: '✨',
    svg: `<circle cx="108" cy="72" r="17"/>
          <circle cx="128" cy="50" r="20"/>
          <circle cx="150" cy="42" r="21"/>
          <circle cx="172" cy="50" r="20"/>
          <circle cx="192" cy="72" r="17"/>
          <circle cx="98" cy="98" r="15"/>
          <circle cx="202" cy="98" r="15"/>
          <circle cx="104" cy="122" r="13"/>
          <circle cx="196" cy="122" r="13"/>` },
  { id: 'ponytail', label: 'Ponytail', emoji: '🎀',
    svg: `<path d="M98,80 A58,58 0 0 1 202,80 Z"/>
          <rect x="98" y="80" width="18" height="40" rx="9"/>
          <rect x="184" y="80" width="18" height="40" rx="9"/>
          <path d="M198,70 q34,10 26,90 q-4,26 -26,30 q14,-40 4,-70 q-6,-24 -4,-50 Z"/>` },
  { id: 'none', label: 'Bald', emoji: '⚪', svg: `` },
  { id: 'crop', label: 'Short Crop', emoji: '💈',
    svg: `<path d="M100,78 A52,52 0 0 1 200,78 L198,96 A50,42 0 0 0 102,96 Z"/>` },
];

const HAIR_COLORS = ['#2b2b2b', '#4b2e1e', '#8a5a2b', '#d9b45a', '#e0558f', '#8c5ce0', '#5cc4e0', '#e0e0e0'];

const OUTFIT_STYLES = [
  { id: 'aline', label: 'A-Line Dress', emoji: '👗',
    svg: `<path d="M118,150 L182,150 L214,340 Q150,358 86,340 Z"/>` },
  { id: 'mermaid', label: 'Mermaid Gown', emoji: '💃',
    svg: `<path d="M120,150 L180,150 L184,300 Q214,330 200,400 L100,400 Q86,330 116,300 Z"/>` },
  { id: 'jumpsuit', label: 'Jumpsuit', emoji: '👖',
    svg: `<path d="M118,150 L182,150 L188,250 L150,262 L112,250 Z"/>
          <path d="M112,250 L150,262 L146,430 L108,430 Z"/>
          <path d="M188,250 L150,262 L154,430 L192,430 Z"/>` },
  { id: 'skirtset', label: 'Top & Skirt', emoji: '🩱',
    svg: `<rect x="114" y="150" width="72" height="66" rx="16"/>
          <path d="M108,216 L192,216 L216,326 Q150,342 84,326 Z"/>` },
  { id: 'suit', label: 'Suit', emoji: '🤵',
    svg: `<path d="M112,150 L188,150 L184,250 L150,236 L116,250 Z"/>
          <path d="M112,250 L150,236 L146,430 L108,430 Z"/>
          <path d="M188,250 L150,236 L154,430 L192,430 Z"/>
          <path d="M136,150 L164,150 L150,208 Z" fill="#fdfdfd"/>
          <path d="M144,150 L156,150 L152,190 L148,192 Z" fill="#7a1f2b"/>` },
  { id: 'santa-dress', label: 'Santa Dress', emoji: '🎅', theme: 'christmas', fixedColor: true,
    svg: `<path d="M118,150 L182,150 L214,338 Q150,356 86,338 Z" fill="#c1272d"/>
          <path d="M92,320 L208,320 L214,338 Q150,356 86,338 Z" fill="#f5f5f5"/>
          <rect x="118" y="150" width="64" height="14" fill="#f5f5f5"/>
          <rect x="112" y="205" width="76" height="14" rx="4" fill="#1b1b1b"/>
          <rect x="140" y="205" width="20" height="14" rx="3" fill="#e8b84b"/>` },
  { id: 'elf-costume', label: 'Elf Costume', emoji: '🧝', theme: 'christmas', fixedColor: true,
    svg: `<path d="M120,150 L180,150 L200,270 L100,270 Z" fill="#1e7a46"/>
          <rect x="118" y="150" width="64" height="12" fill="#c1272d"/>
          <rect x="108" y="228" width="84" height="12" rx="4" fill="#7a3b12"/>
          <path d="M100,270 L130,270 L118,300 L92,300 Z" fill="#1e7a46"/>
          <path d="M200,270 L170,270 L182,300 L208,300 Z" fill="#1e7a46"/>` },
  { id: 'fairy-dress', label: 'Fairy Dress', emoji: '🧚‍♀️', theme: 'fairy', fixedColor: true,
    svg: `<path d="M118,150 L182,150 L206,300 Q150,320 94,300 Z" fill="#c9a6ff" opacity="0.9"/>
          <path d="M110,270 L190,270 L212,330 Q150,348 88,330 Z" fill="#ffb6e6" opacity="0.85"/>
          <path d="M126,150 L174,150 L180,230 Q150,244 120,230 Z" fill="#eddcff"/>` },
  { id: 'enchanted-robe', label: 'Enchanted Robe', emoji: '🪄', theme: 'fairy', fixedColor: true,
    svg: `<path d="M116,150 L184,150 L220,400 Q150,420 80,400 Z" fill="#2f2159"/>
          <path d="M130,150 L170,150 L160,260 Q150,266 140,260 Z" fill="#7c53d1"/>
          <circle cx="110" cy="260" r="3" fill="#ffe9a8"/>
          <circle cx="190" cy="300" r="3" fill="#ffe9a8"/>
          <circle cx="150" cy="360" r="3" fill="#ffe9a8"/>` },
];

const OUTFIT_COLORS = ['#e0558f', '#8c5ce0', '#5cc4e0', '#43b581', '#f2c94c', '#e05c5c', '#2b2b2b', '#ffffff'];

const SHOE_STYLES = [
  { id: 'heels', label: 'Heels', emoji: '👠',
    svg: `<ellipse cx="127" cy="448" rx="19" ry="10"/>
          <ellipse cx="173" cy="448" rx="19" ry="10"/>
          <rect x="122" y="452" width="8" height="16" rx="3"/>
          <rect x="168" y="452" width="8" height="16" rx="3"/>` },
  { id: 'flats', label: 'Flats', emoji: '🥿',
    svg: `<ellipse cx="127" cy="446" rx="20" ry="11"/>
          <ellipse cx="173" cy="446" rx="20" ry="11"/>` },
  { id: 'boots', label: 'Boots', emoji: '👢',
    svg: `<rect x="110" y="392" width="34" height="66" rx="14"/>
          <rect x="156" y="392" width="34" height="66" rx="14"/>` },
];

const SHOE_COLORS = ['#2b2b2b', '#8a5a2b', '#e0558f', '#ffffff', '#c68642', '#5cc4e0'];

const ACCESSORIES = [
  { id: 'hat', label: 'Hat', emoji: '🎩', color: '#b83c6f',
    svg: `<ellipse cx="150" cy="40" rx="48" ry="16"/><circle cx="150" cy="24" r="6"/>` },
  { id: 'glasses', label: 'Glasses', emoji: '🕶️', color: '#2b2b2b',
    svg: `<circle cx="132" cy="90" r="15" fill="none" stroke-width="4"/>
          <circle cx="168" cy="90" r="15" fill="none" stroke-width="4"/>
          <line x1="147" y1="90" x2="153" y2="90" stroke-width="4"/>
          <line x1="117" y1="88" x2="105" y2="82" stroke-width="4"/>
          <line x1="183" y1="88" x2="195" y2="82" stroke-width="4"/>` },
  { id: 'necklace', label: 'Necklace', emoji: '📿', color: '#f2c94c',
    svg: `<path d="M133,155 Q150,175 167,155" fill="none" stroke-width="4"/>
          <circle cx="150" cy="176" r="5"/>` },
  { id: 'bag', label: 'Handbag', emoji: '👛', color: '#8c5ce0',
    svg: `<rect x="192" y="278" width="34" height="28" rx="6"/>
          <path d="M198,278 Q209,258 220,278" fill="none" stroke-width="4"/>` },
  { id: 'santa-hat', label: 'Santa Hat', emoji: '🎅', theme: 'christmas', color: '#c1272d',
    svg: `<path d="M108,58 L150,4 L192,58 Z"/>
          <ellipse cx="150" cy="58" rx="44" ry="13" fill="#f4f4f4"/>
          <circle cx="150" cy="6" r="8" fill="#f4f4f4"/>` },
  { id: 'candy-cane', label: 'Candy Cane', emoji: '🍬', theme: 'christmas', color: '#e03131',
    svg: `<path d="M205,250 Q222,228 208,212" fill="none" stroke="#e03131" stroke-width="8" stroke-linecap="round"/>
          <path d="M205,250 Q222,228 208,212" fill="none" stroke="#ffffff" stroke-width="8" stroke-dasharray="6 6" stroke-linecap="round"/>` },
  { id: 'snowflake', label: 'Snowflake', emoji: '❄️', theme: 'christmas', color: '#bfe9ff',
    svg: `<path d="M133,155 Q150,172 167,155" fill="none" stroke="#bfe9ff" stroke-width="3"/>
          <g stroke="#bfe9ff" stroke-width="2.5" stroke-linecap="round">
            <line x1="150" y1="168" x2="150" y2="184"/>
            <line x1="142" y1="176" x2="158" y2="176"/>
            <line x1="144" y1="170" x2="156" y2="182"/>
            <line x1="156" y1="170" x2="144" y2="182"/>
          </g>` },
  { id: 'fairy-wings', label: 'Fairy Wings', emoji: '🦋', theme: 'fairy', color: '#c9a6ff',
    svg: `<path d="M100,180 Q40,150 55,220 Q65,260 105,250 Z" opacity="0.55"/>
          <path d="M200,180 Q260,150 245,220 Q235,260 195,250 Z" opacity="0.55"/>
          <path d="M100,180 Q60,200 90,230 Z" fill="#eddcff" opacity="0.6"/>
          <path d="M200,180 Q240,200 210,230 Z" fill="#eddcff" opacity="0.6"/>` },
  { id: 'flower-crown', label: 'Flower Crown', emoji: '🌸', theme: 'fairy', color: '#ff8fc7',
    svg: `<circle cx="118" cy="60" r="7" fill="#ff8fc7"/>
          <circle cx="134" cy="48" r="7" fill="#ffd166"/>
          <circle cx="150" cy="42" r="8" fill="#ff8fc7"/>
          <circle cx="166" cy="48" r="7" fill="#ffd166"/>
          <circle cx="182" cy="60" r="7" fill="#ff8fc7"/>
          <circle cx="150" cy="42" r="3" fill="#fff7e6"/>` },
  { id: 'wand', label: 'Magic Wand', emoji: '✨', theme: 'fairy', color: '#f2c94c',
    svg: `<line x1="207" y1="272" x2="228" y2="240" stroke="#f2c94c" stroke-width="4" stroke-linecap="round"/>
          <path d="M228,240 l4,-8 l4,8 l8,4 l-8,4 l-4,8 l-4,-8 l-8,-4 Z" fill="#f2c94c"/>` },
];

const BACKGROUNDS = [
  { id: 'pink', label: 'Pink Runway', emoji: '🎀', gradient: 'linear-gradient(180deg, #ffd6ec 0%, #ffb6d9 55%, #ff9fce 100%)' },
  { id: 'night', label: 'Night Gala', emoji: '🌌', gradient: 'linear-gradient(180deg, #1b1035 0%, #3a1f5d 55%, #6a3093 100%)' },
  { id: 'gold', label: 'Gold Stage', emoji: '🌟', gradient: 'linear-gradient(180deg, #fff6d8 0%, #ffe08a 55%, #f6c453 100%)' },
  { id: 'spring', label: 'Spring Bloom', emoji: '🌸', gradient: 'linear-gradient(180deg, #eaffea 0%, #b9f2d0 55%, #8fe3b0 100%)' },
  { id: 'christmas-snow', label: 'Snowy Night', emoji: '❄️', theme: 'christmas', ambient: 'snow',
    gradient: 'linear-gradient(180deg, #0b2545 0%, #164a6b 55%, #2c7a9c 100%)' },
  { id: 'fairy-glade', label: 'Enchanted Glade', emoji: '🌌', theme: 'fairy', ambient: 'sparkle',
    gradient: 'linear-gradient(180deg, #1b3a2f 0%, #2d5a4a 45%, #6a3f8c 100%)' },
];

const JUDGE_COMMENTS = [
  "A show-stopping look!",
  "Fierce, fabulous, and flawless.",
  "The judges are obsessed.",
  "That's a strut worthy of the front row.",
  "Bold choices that really paid off.",
  "Effortlessly chic.",
  "The crowd is on its feet!",
  "A star is born on this runway.",
];

const WARDROBE_PRESETS = [
  { id: 'classic-chic', label: 'Classic Chic', theme: 'classic',
    look: { bodyType: 'feminine', skin: SKIN_TONES[1], hair: { style: 'bob', color: '#2b2b2b' },
      outfit: { style: 'aline', color: '#e0558f' }, shoes: { style: 'heels', color: '#2b2b2b' },
      accessories: { necklace: true, bag: true }, background: 'pink' } },
  { id: 'midnight-glam', label: 'Midnight Glam', theme: 'classic',
    look: { bodyType: 'feminine', skin: SKIN_TONES[3], hair: { style: 'long', color: '#2b2b2b' },
      outfit: { style: 'mermaid', color: '#8c5ce0' }, shoes: { style: 'heels', color: '#ffffff' },
      accessories: { necklace: true, hat: false, glasses: false, bag: true }, background: 'night' } },
  { id: 'sharp-suit', label: 'Sharp Suit', theme: 'classic',
    look: { bodyType: 'masculine', skin: SKIN_TONES[4], hair: { style: 'none', color: '#2b2b2b' },
      outfit: { style: 'suit', color: '#2b2b2b' }, shoes: { style: 'boots', color: '#2b2b2b' },
      accessories: { glasses: true }, background: 'gold' } },
  { id: 'santas-helper', label: "Santa's Helper", theme: 'christmas',
    look: { bodyType: 'neutral', skin: SKIN_TONES[0], hair: { style: 'ponytail', color: '#8a5a2b' },
      outfit: { style: 'elf-costume', color: '#1e7a46' }, shoes: { style: 'boots', color: '#8a5a2b' },
      accessories: { 'santa-hat': true, 'candy-cane': true }, background: 'christmas-snow' } },
  { id: 'winter-belle', label: 'Winter Belle', theme: 'christmas',
    look: { bodyType: 'feminine', skin: SKIN_TONES[2], hair: { style: 'long', color: '#d9b45a' },
      outfit: { style: 'santa-dress', color: '#c1272d' }, shoes: { style: 'flats', color: '#ffffff' },
      accessories: { snowflake: true }, background: 'christmas-snow' } },
  { id: 'woodland-fairy', label: 'Woodland Fairy', theme: 'fairy',
    look: { bodyType: 'neutral', skin: SKIN_TONES[1], hair: { style: 'curly', color: '#8c5ce0' },
      outfit: { style: 'fairy-dress', color: '#c9a6ff' }, shoes: { style: 'flats', color: '#c9a6ff' },
      accessories: { 'fairy-wings': true, 'flower-crown': true, wand: true }, background: 'fairy-glade' } },
];

// ---------- State ----------

const state = {
  bodyType: 'feminine',
  theme: 'classic',
  skin: SKIN_TONES[0],
  hair: { style: 'bob', color: HAIR_COLORS[0] },
  outfit: { style: 'aline', color: OUTFIT_COLORS[0] },
  shoes: { style: 'heels', color: SHOE_COLORS[0] },
  accessories: Object.fromEntries(ACCESSORIES.map((a) => [a.id, false])),
  background: 'pink',
};

// ---------- Helpers ----------

function itemVisible(item) {
  return !item.theme || item.theme === state.theme;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------- Build UI ----------

function buildSwatches(container, colors, onPick, isSelected) {
  container.innerHTML = '';
  colors.forEach((c) => {
    const btn = document.createElement('button');
    btn.className = 'swatch';
    btn.style.background = c;
    btn.dataset.color = c;
    btn.title = c;
    btn.setAttribute('aria-label', c);
    btn.addEventListener('click', () => onPick(c));
    container.appendChild(btn);
  });
}

function buildOptionButtons(container, items, onPick) {
  container.innerHTML = '';
  items.forEach((item) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.dataset.id = item.id;
    btn.innerHTML = `<span class="emoji">${item.emoji}</span>${item.label}`;
    btn.addEventListener('click', () => onPick(item.id));
    container.appendChild(btn);
  });
}

buildOptionButtons(document.getElementById('bodytype-pills'), BODY_TYPES, (id) => {
  state.bodyType = id;
  render();
});

buildOptionButtons(document.getElementById('theme-pills'), THEMES, (id) => {
  state.theme = id;
  sanitizeStateForTheme();
  rebuildThemedLists();
  render();
});

buildSwatches(document.getElementById('skin-swatches'), SKIN_TONES, (c) => {
  state.skin = c;
  render();
});

buildSwatches(document.getElementById('hair-colors'), HAIR_COLORS, (c) => {
  state.hair.color = c;
  render();
});

buildSwatches(document.getElementById('outfit-colors'), OUTFIT_COLORS, (c) => {
  state.outfit.color = c;
  render();
});

buildSwatches(document.getElementById('shoe-colors'), SHOE_COLORS, (c) => {
  state.shoes.color = c;
  render();
});

function rebuildThemedLists() {
  buildOptionButtons(document.getElementById('hair-styles'), HAIR_STYLES.filter(itemVisible), (id) => {
    state.hair.style = id;
    render();
  });
  buildOptionButtons(document.getElementById('outfit-styles'), OUTFIT_STYLES.filter(itemVisible), (id) => {
    state.outfit.style = id;
    render();
  });
  buildOptionButtons(document.getElementById('shoe-styles'), SHOE_STYLES.filter(itemVisible), (id) => {
    state.shoes.style = id;
    render();
  });
  buildOptionButtons(document.getElementById('accessory-toggles'), ACCESSORIES.filter(itemVisible), (id) => {
    state.accessories[id] = !state.accessories[id];
    render();
  });
  buildOptionButtons(document.getElementById('background-styles'), BACKGROUNDS.filter(itemVisible), (id) => {
    state.background = id;
    render();
  });
}

function sanitizeStateForTheme() {
  const hairDef = HAIR_STYLES.find((h) => h.id === state.hair.style);
  if (!itemVisible(hairDef)) state.hair.style = HAIR_STYLES.find((h) => !h.theme).id;

  const outfitDef = OUTFIT_STYLES.find((o) => o.id === state.outfit.style);
  if (!itemVisible(outfitDef)) state.outfit.style = OUTFIT_STYLES.find((o) => !o.theme).id;

  const shoeDef = SHOE_STYLES.find((s) => s.id === state.shoes.style);
  if (!itemVisible(shoeDef)) state.shoes.style = SHOE_STYLES.find((s) => !s.theme).id;

  ACCESSORIES.forEach((a) => {
    if (a.theme && a.theme !== state.theme) state.accessories[a.id] = false;
  });

  const bgDef = BACKGROUNDS.find((b) => b.id === state.background);
  if (!itemVisible(bgDef)) state.background = BACKGROUNDS.find((b) => !b.theme).id;
}

// ---------- Tabs ----------

function wireTabs(tabBarId, panelsId) {
  document.getElementById(tabBarId).addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    const bar = document.getElementById(tabBarId);
    const panels = document.getElementById(panelsId);
    bar.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    panels.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    panels.querySelector(`.tab-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
  });
}

wireTabs('left-tabs', 'left-panels');
wireTabs('right-tabs', 'right-panels');

// ---------- Body geometry ----------

function applyBodyGeometry(root, bodyTypeId) {
  const bt = BODY_TYPES.find((b) => b.id === bodyTypeId);
  const torso = root.querySelector('#torso, .p-torso');
  if (torso) torso.setAttribute('rx', bt.torsoRx);

  const armLeft = root.querySelector('#arm-left, .p-arm-left');
  const armRight = root.querySelector('#arm-right, .p-arm-right');
  const legLeft = root.querySelector('#leg-left, .p-leg-left');
  const legRight = root.querySelector('#leg-right, .p-leg-right');
  const handLeft = root.querySelector('#hand-left, .p-hand-left');
  const handRight = root.querySelector('#hand-right, .p-hand-right');

  [armLeft, armRight, legLeft, legRight].forEach((l) => l && l.setAttribute('stroke-width', bt.limbWidth));

  const lx = 93 - bt.armSpread;
  const rx = 207 + bt.armSpread;
  if (armLeft) armLeft.setAttribute('x2', lx);
  if (handLeft) handLeft.setAttribute('cx', lx);
  if (armRight) armRight.setAttribute('x2', rx);
  if (handRight) handRight.setAttribute('cx', rx);
}

// ---------- Render (main stage) ----------

function render() {
  applyBodyGeometry(document, state.bodyType);

  // skin
  const skinEls = ['torso', 'neck', 'head', 'arm-left', 'arm-right', 'hand-left', 'hand-right', 'leg-left', 'leg-right'];
  skinEls.forEach((id) => {
    const node = document.getElementById(id);
    if (node.tagName === 'line') node.setAttribute('stroke', state.skin);
    else node.setAttribute('fill', state.skin);
  });

  // hair
  const hairLayer = document.getElementById('layer-hair');
  const hairDef = HAIR_STYLES.find((h) => h.id === state.hair.style);
  hairLayer.innerHTML = hairDef.svg;
  hairLayer.setAttribute('fill', state.hair.color);
  hairLayer.setAttribute('stroke', state.hair.color);

  // outfit
  const outfitLayer = document.getElementById('layer-outfit');
  const outfitDef = OUTFIT_STYLES.find((o) => o.id === state.outfit.style);
  outfitLayer.innerHTML = outfitDef.svg;
  if (outfitDef.fixedColor) {
    outfitLayer.removeAttribute('fill');
  } else {
    outfitLayer.setAttribute('fill', state.outfit.color);
  }
  document.getElementById('outfit-color-label').hidden = !!outfitDef.fixedColor;
  document.getElementById('outfit-colors').hidden = !!outfitDef.fixedColor;
  document.getElementById('outfit-fixed-note').hidden = !outfitDef.fixedColor;

  // shoes
  const shoeLayer = document.getElementById('layer-shoes');
  const shoeDef = SHOE_STYLES.find((s) => s.id === state.shoes.style);
  shoeLayer.innerHTML = shoeDef.svg;
  shoeLayer.setAttribute('fill', state.shoes.color);

  // accessories
  ACCESSORIES.forEach((acc) => {
    const layer = document.getElementById(`layer-acc-${acc.id}`);
    if (state.accessories[acc.id]) {
      layer.innerHTML = acc.svg;
      layer.setAttribute('fill', acc.color);
      layer.setAttribute('stroke', acc.color);
      layer.style.display = '';
    } else {
      layer.style.display = 'none';
    }
  });

  // background
  const bgDef = BACKGROUNDS.find((b) => b.id === state.background);
  document.getElementById('stage').style.background = bgDef.gradient;
  setAmbient(bgDef.ambient);

  // selection highlighting
  highlightSelection('#bodytype-pills', state.bodyType, 'id');
  highlightSelection('#theme-pills', state.theme, 'id');
  highlightSelection('#skin-swatches', state.skin, 'color');
  highlightSelection('#hair-colors', state.hair.color, 'color');
  highlightSelection('#outfit-colors', state.outfit.color, 'color');
  highlightSelection('#shoe-colors', state.shoes.color, 'color');
  highlightSelection('#hair-styles', state.hair.style, 'id');
  highlightSelection('#outfit-styles', state.outfit.style, 'id');
  highlightSelection('#shoe-styles', state.shoes.style, 'id');
  highlightSelection('#background-styles', state.background, 'id');

  document.querySelectorAll('#accessory-toggles .option-btn').forEach((btn) => {
    btn.classList.toggle('selected', !!state.accessories[btn.dataset.id]);
  });
}

function highlightSelection(containerSel, value, datasetKey) {
  document.querySelectorAll(`${containerSel} [data-${datasetKey}]`).forEach((elm) => {
    elm.classList.toggle('selected', elm.dataset[datasetKey] === value);
  });
}

// ---------- Ambient effects ----------

let ambientTimer = null;
const ambientLayer = document.getElementById('ambient-layer');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setAmbient(type) {
  if (ambientTimer) {
    clearInterval(ambientTimer);
    ambientTimer = null;
  }
  ambientLayer.innerHTML = '';
  if (!type || reduceMotion) return;

  ambientTimer = setInterval(() => {
    if (type === 'snow') spawnSnow();
    if (type === 'sparkle') spawnSparkle();
  }, 350);
}

function spawnSnow() {
  const flake = document.createElement('div');
  flake.className = 'ambient-snow';
  const size = 4 + Math.random() * 5;
  flake.style.width = `${size}px`;
  flake.style.height = `${size}px`;
  flake.style.left = `${Math.random() * 100}%`;
  flake.style.setProperty('--drift', `${(Math.random() - 0.5) * 40}px`);
  flake.style.animationDuration = `${4 + Math.random() * 3}s`;
  ambientLayer.appendChild(flake);
  setTimeout(() => flake.remove(), 7500);
}

function spawnSparkle() {
  const sparkle = document.createElement('div');
  sparkle.className = 'ambient-sparkle';
  const size = 6 + Math.random() * 10;
  sparkle.style.width = `${size}px`;
  sparkle.style.height = `${size}px`;
  sparkle.style.left = `${Math.random() * 100}%`;
  sparkle.style.top = `${Math.random() * 100}%`;
  ambientLayer.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 1900);
}

// ---------- Fashion Show ----------

const stage = document.getElementById('stage');
const judging = document.getElementById('judging');
const scoreDisplay = document.getElementById('score-display');
const commentDisplay = document.getElementById('comment-display');
const confettiLayer = document.getElementById('confetti-layer');

document.getElementById('show-btn').addEventListener('click', () => {
  judging.hidden = true;
  stage.classList.remove('walking');
  void stage.offsetWidth;
  stage.classList.add('walking');

  setTimeout(() => {
    const score = (Math.random() * 2.5 + 7.5).toFixed(1);
    const comment = JUDGE_COMMENTS[Math.floor(Math.random() * JUDGE_COMMENTS.length)];
    scoreDisplay.textContent = `${score} / 10`;
    commentDisplay.textContent = comment;
    judging.hidden = false;
    if (score >= 9) launchConfetti();
  }, 1800);
});

document.getElementById('randomize-btn').addEventListener('click', () => {
  state.bodyType = pick(BODY_TYPES).id;
  state.skin = pick(SKIN_TONES);
  state.hair = { style: pick(HAIR_STYLES.filter(itemVisible)).id, color: pick(HAIR_COLORS) };
  state.outfit = { style: pick(OUTFIT_STYLES.filter(itemVisible)).id, color: pick(OUTFIT_COLORS) };
  state.shoes = { style: pick(SHOE_STYLES.filter(itemVisible)).id, color: pick(SHOE_COLORS) };
  ACCESSORIES.filter(itemVisible).forEach((a) => { state.accessories[a.id] = Math.random() > 0.5; });
  state.background = pick(BACKGROUNDS.filter(itemVisible)).id;
  render();
});

function launchConfetti() {
  const colors = ['#e0558f', '#8c5ce0', '#5cc4e0', '#f2c94c', '#43b581'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    confettiLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 3500);
  }
}

// ---------- Wardrobe ----------

function buildDollSVG(look) {
  const bt = BODY_TYPES.find((b) => b.id === look.bodyType);
  const hairDef = HAIR_STYLES.find((h) => h.id === look.hair.style);
  const outfitDef = OUTFIT_STYLES.find((o) => o.id === look.outfit.style);
  const shoeDef = SHOE_STYLES.find((s) => s.id === look.shoes.style);
  const lx = 93 - bt.armSpread;
  const rxHand = 207 + bt.armSpread;
  const outfitFill = outfitDef.fixedColor ? 'none' : look.outfit.color;

  const accSvg = ACCESSORIES.filter((a) => look.accessories && look.accessories[a.id])
    .map((a) => `<g fill="${a.color}" stroke="${a.color}">${a.svg}</g>`)
    .join('');

  return `
    <g fill="${look.skin}" stroke="${look.skin}">
      <line x1="125" y1="168" x2="${lx}" y2="272" stroke-width="${bt.limbWidth}" stroke-linecap="round"/>
      <line x1="175" y1="168" x2="${rxHand}" y2="272" stroke-width="${bt.limbWidth}" stroke-linecap="round"/>
      <circle cx="${lx}" cy="272" r="12"/>
      <circle cx="${rxHand}" cy="272" r="12"/>
      <line x1="133" y1="248" x2="127" y2="445" stroke-width="${bt.limbWidth}" stroke-linecap="round"/>
      <line x1="167" y1="248" x2="173" y2="445" stroke-width="${bt.limbWidth}" stroke-linecap="round"/>
      <rect x="106" y="148" width="88" height="108" rx="${bt.torsoRx}"/>
      <rect x="137" y="132" width="26" height="26" rx="8"/>
      <circle cx="150" cy="93" r="48"/>
    </g>
    <g fill="${look.hair.color}" stroke="${look.hair.color}">${hairDef.svg}</g>
    <g>
      <ellipse cx="118" cy="102" rx="9" ry="5.5" fill="#e0558f" opacity="0.35"/>
      <ellipse cx="182" cy="102" rx="9" ry="5.5" fill="#e0558f" opacity="0.35"/>
      <ellipse cx="132" cy="90" rx="4" ry="6" fill="#2b2b2b"/>
      <ellipse cx="168" cy="90" rx="4" ry="6" fill="#2b2b2b"/>
      <path d="M125,108 Q150,122 175,108" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>
    </g>
    <g fill="${look.shoes.color}">${shoeDef.svg}</g>
    <g fill="${outfitFill}">${outfitDef.svg}</g>
    ${accSvg}
  `;
}

const wardrobeOverlay = document.getElementById('wardrobe-overlay');
const wardrobeGrid = document.getElementById('wardrobe-grid');

function renderWardrobe() {
  wardrobeGrid.innerHTML = '';
  WARDROBE_PRESETS.forEach((preset) => {
    const themeDef = THEMES.find((t) => t.id === preset.theme);
    const card = document.createElement('button');
    card.className = 'wardrobe-card';
    const bgDef = BACKGROUNDS.find((b) => b.id === preset.look.background);
    card.innerHTML = `
      <div class="thumb" style="background:${bgDef.gradient}">
        <svg viewBox="0 0 300 520">${buildDollSVG(preset.look)}</svg>
      </div>
      <span class="label">${preset.label}</span>
      <span class="theme-tag">${themeDef.emoji} ${themeDef.label}</span>
    `;
    card.addEventListener('click', () => applyPreset(preset));
    wardrobeGrid.appendChild(card);
  });
}

function applyPreset(preset) {
  const look = preset.look;
  state.bodyType = look.bodyType;
  state.theme = preset.theme;
  state.skin = look.skin;
  state.hair = { ...look.hair };
  state.outfit = { ...look.outfit };
  state.shoes = { ...look.shoes };
  state.accessories = Object.fromEntries(ACCESSORIES.map((a) => [a.id, !!(look.accessories && look.accessories[a.id])]));
  state.background = look.background;
  rebuildThemedLists();
  render();
  closeWardrobe();
}

function openWardrobe() {
  renderWardrobe();
  wardrobeOverlay.hidden = false;
}

function closeWardrobe() {
  wardrobeOverlay.hidden = true;
}

document.getElementById('wardrobe-btn').addEventListener('click', openWardrobe);
document.getElementById('wardrobe-close').addEventListener('click', closeWardrobe);
wardrobeOverlay.addEventListener('click', (e) => {
  if (e.target === wardrobeOverlay) closeWardrobe();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !wardrobeOverlay.hidden) closeWardrobe();
});

// ---------- Init ----------

rebuildThemedLists();
render();
