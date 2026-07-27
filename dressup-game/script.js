// ---------- Data ----------

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
];

const HAIR_COLORS = ['#2b2b2b', '#4b2e1e', '#8a5a2b', '#d9b45a', '#e0558f', '#8c5ce0', '#5cc4e0', '#e0e0e0'];

const OUTFIT_STYLES = [
  { id: 'aline', label: 'A-Line Dress', emoji: '👗',
    svg: `<path d="M118,150 L182,150 L214,340 Q150,358 86,340 Z"/>` },
  { id: 'mermaid', label: 'Mermaid Gown', emoji: '💃',
    svg: `<path d="M120,150 L180,150 L184,300 Q214,330 200,400 L100,400 Q86,330 116,300 Z"/>` },
  { id: 'jumpsuit', label: 'Jumpsuit', emoji: '🤵',
    svg: `<path d="M118,150 L182,150 L188,250 L150,262 L112,250 Z"/>
          <path d="M112,250 L150,262 L146,430 L108,430 Z"/>
          <path d="M188,250 L150,262 L154,430 L192,430 Z"/>` },
  { id: 'skirtset', label: 'Top & Skirt', emoji: '🩱',
    svg: `<rect x="114" y="150" width="72" height="66" rx="16"/>
          <path d="M108,216 L192,216 L216,326 Q150,342 84,326 Z"/>` },
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
];

const BACKGROUNDS = [
  { id: 'pink', label: 'Pink Runway', emoji: '🎀', gradient: 'linear-gradient(180deg, #ffd6ec 0%, #ffb6d9 55%, #ff9fce 100%)' },
  { id: 'night', label: 'Night Gala', emoji: '🌌', gradient: 'linear-gradient(180deg, #1b1035 0%, #3a1f5d 55%, #6a3093 100%)' },
  { id: 'gold', label: 'Gold Stage', emoji: '🌟', gradient: 'linear-gradient(180deg, #fff6d8 0%, #ffe08a 55%, #f6c453 100%)' },
  { id: 'spring', label: 'Spring Bloom', emoji: '🌸', gradient: 'linear-gradient(180deg, #eaffea 0%, #b9f2d0 55%, #8fe3b0 100%)' },
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

// ---------- State ----------

const state = {
  skin: SKIN_TONES[0],
  hair: { style: 'bob', color: HAIR_COLORS[0] },
  outfit: { style: 'aline', color: OUTFIT_COLORS[0] },
  shoes: { style: 'heels', color: SHOE_COLORS[0] },
  accessories: { hat: false, glasses: false, necklace: false, bag: false },
  background: 'pink',
};

// ---------- Build static option UI ----------

function el(html) {
  const div = document.createElement('div');
  div.innerHTML = html.trim();
  return div.firstElementChild;
}

function buildSwatches(container, colors, onPick) {
  container.innerHTML = '';
  colors.forEach((c) => {
    const btn = document.createElement('button');
    btn.className = 'swatch';
    btn.style.background = c;
    btn.dataset.color = c;
    btn.title = c;
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

buildSwatches(document.getElementById('skin-swatches'), SKIN_TONES, (c) => {
  state.skin = c;
  render();
});

buildOptionButtons(document.getElementById('hair-styles'), HAIR_STYLES, (id) => {
  state.hair.style = id;
  render();
});
buildSwatches(document.getElementById('hair-colors'), HAIR_COLORS, (c) => {
  state.hair.color = c;
  render();
});

buildOptionButtons(document.getElementById('outfit-styles'), OUTFIT_STYLES, (id) => {
  state.outfit.style = id;
  render();
});
buildSwatches(document.getElementById('outfit-colors'), OUTFIT_COLORS, (c) => {
  state.outfit.color = c;
  render();
});

buildOptionButtons(document.getElementById('shoe-styles'), SHOE_STYLES, (id) => {
  state.shoes.style = id;
  render();
});
buildSwatches(document.getElementById('shoe-colors'), SHOE_COLORS, (c) => {
  state.shoes.color = c;
  render();
});

buildOptionButtons(document.getElementById('accessory-toggles'), ACCESSORIES, (id) => {
  state.accessories[id] = !state.accessories[id];
  render();
});

buildOptionButtons(document.getElementById('background-styles'), BACKGROUNDS, (id) => {
  state.background = id;
  render();
});

// ---------- Tabs ----------

document.getElementById('tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
  tab.classList.add('active');
  document.querySelector(`.tab-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
});

// ---------- Render ----------

function render() {
  // skin
  const skinEls = ['torso', 'neck', 'head', 'arm-left', 'arm-right', 'hand-left', 'hand-right', 'leg-left', 'leg-right'];
  skinEls.forEach((id) => {
    const node = document.getElementById(id);
    if (node.tagName === 'line') node.setAttribute('stroke', state.skin);
    else node.setAttribute('fill', state.skin);
  });
  document.querySelectorAll('#layer-body line').forEach((l) => l.setAttribute('stroke', state.skin));

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
  outfitLayer.setAttribute('fill', state.outfit.color);

  // shoes
  const shoeLayer = document.getElementById('layer-shoes');
  const shoeDef = SHOE_STYLES.find((s) => s.id === state.shoes.style);
  shoeLayer.innerHTML = shoeDef.svg;
  shoeLayer.setAttribute('fill', state.shoes.color);

  // accessories
  ACCESSORIES.forEach((acc) => {
    const layer = document.getElementById(`layer-${acc.id}`);
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

  // selection highlighting
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

// ---------- Fashion Show ----------

const stage = document.getElementById('stage');
const judging = document.getElementById('judging');
const scoreDisplay = document.getElementById('score-display');
const commentDisplay = document.getElementById('comment-display');
const confettiLayer = document.getElementById('confetti-layer');

document.getElementById('show-btn').addEventListener('click', () => {
  judging.hidden = true;
  stage.classList.remove('walking');
  // force reflow so the animation restarts
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
  state.skin = pick(SKIN_TONES);
  state.hair = { style: pick(HAIR_STYLES).id, color: pick(HAIR_COLORS) };
  state.outfit = { style: pick(OUTFIT_STYLES).id, color: pick(OUTFIT_COLORS) };
  state.shoes = { style: pick(SHOE_STYLES).id, color: pick(SHOE_COLORS) };
  ACCESSORIES.forEach((a) => { state.accessories[a.id] = Math.random() > 0.5; });
  state.background = pick(BACKGROUNDS).id;
  render();
});

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

// ---------- Init ----------

render();
