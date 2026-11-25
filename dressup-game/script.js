// ---------- Color & geometry helpers ----------

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
}

function lighten(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}

function darken(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amt), g * (1 - amt), b * (1 - amt));
}

function setGradient(gradId, baseColor, lightAmt, darkAmt) {
  const light = document.getElementById(`${gradId}-light`);
  const base = document.getElementById(`${gradId}-base`);
  const dark = document.getElementById(`${gradId}-dark`);
  if (light) light.setAttribute('stop-color', lighten(baseColor, lightAmt));
  if (base) base.setAttribute('stop-color', baseColor);
  if (dark) dark.setAttribute('stop-color', darken(baseColor, darkAmt));
}

// Builds a tapered "capsule" outline between two circles (r1 at x1,y1 and r2 at x2,y2),
// used to draw limbs as real tapered shapes instead of uniform-width strokes.
function capsulePath(x1, y1, r1, x2, y2, r2) {
  const perp = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
  const cos = Math.cos(perp);
  const sin = Math.sin(perp);
  const p1a = [x1 + r1 * cos, y1 + r1 * sin];
  const p1b = [x1 - r1 * cos, y1 - r1 * sin];
  const p2a = [x2 + r2 * cos, y2 + r2 * sin];
  const p2b = [x2 - r2 * cos, y2 - r2 * sin];
  return `M${p1a[0]},${p1a[1]} L${p2a[0]},${p2a[1]} A${r2},${r2} 0 0 0 ${p2b[0]},${p2b[1]} L${p1b[0]},${p1b[1]} A${r1},${r1} 0 0 0 ${p1a[0]},${p1a[1]} Z`;
}

const TORSO_Y = { shoulder: 148, chest: 175, waist: 206, hip: 250 };

// Builds a curved torso silhouette (shoulder -> chest -> waist -> hip) from a body
// profile's half-widths, so the torso reads as a real body shape instead of a block.
function bodyTorsoPath(bt, pad = 0) {
  const cx = 150;
  const { shoulder: sY, chest: bY, waist: wY, hip: hY } = TORSO_Y;
  const s = bt.shoulderHalf + pad, c = bt.chestHalf + pad, w = bt.waistHalf + pad, h = bt.hipHalf + pad;
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

// ---------- Data ----------

const BODY_TYPES = [
  { id: 'feminine', label: 'Feminine', emoji: '⚘', shoulderHalf: 32, chestHalf: 36, waistHalf: 24, hipHalf: 38, limbWidth: 22, armSpread: 0 },
  { id: 'masculine', label: 'Masculine', emoji: '◆', shoulderHalf: 44, chestHalf: 42, waistHalf: 36, hipHalf: 30, limbWidth: 28, armSpread: 14 },
  { id: 'neutral', label: 'Neutral', emoji: '●', shoulderHalf: 36, chestHalf: 36, waistHalf: 30, hipHalf: 32, limbWidth: 24, armSpread: 6 },
];

const THEMES = [
  { id: 'classic', label: 'Classic', emoji: '⭐' },
  { id: 'christmas', label: 'Christmas', emoji: '🎄' },
  { id: 'fairy', label: 'Fairy Tale', emoji: '🧚' },
  { id: 'halloween', label: 'Halloween', emoji: '🎃' },
  { id: 'birds', label: 'Birds', emoji: '🐦' },
  { id: 'metgala', label: 'Met Gala', emoji: '🌹' },
  { id: 'mermaid', label: 'Mermaid', emoji: '🧜‍♀️' },
  { id: 'school', label: 'School', emoji: '🎒' },
  { id: 'summer', label: 'Summer', emoji: '☀️' },
  { id: 'party', label: 'Party', emoji: '🎉' },
  { id: 'superhero', label: 'Superhero', emoji: '🦸' },
  { id: 'ballet', label: 'Ballet', emoji: '🩰' },
  { id: 'sleepy', label: 'Sleepover', emoji: '😴' },
];

const SKIN_TONES = ['#ffe0bd', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5a3825'];

// Draws a little spiderweb (spokes + rings) centered at cx,cy for spooky hairstyles.
function spiderWebSVG(cx, cy, r) {
  const spokes = 8;
  const pts = (rad) => Array.from({ length: spokes }, (_, i) => {
    const a = (Math.PI * 2 * i) / spokes;
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  });
  const outer = pts(r);
  const lines = outer.map(([x, y]) => `M${cx},${cy} L${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const rings = [0.35, 0.68, 1].map((f) => {
    const ring = pts(r * f);
    return 'M' + ring.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L') + ' Z';
  }).join(' ');
  return `<path d="${lines} ${rings}" fill="none" stroke="#ffffff" stroke-width="1" stroke-linejoin="round" opacity="0.85"/>`;
}

const HAIR_STYLES = [
  { id: 'bob', label: 'Bob', emoji: '💇‍♀️',
    svg: `<path d="M98,80 A58,58 0 0 1 202,80 Z"/>
          <rect x="98" y="80" width="20" height="60" rx="10"/>
          <rect x="182" y="80" width="20" height="60" rx="10"/>
          <path d="M112,62 Q126,53 140,58" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25"/>` },
  { id: 'long', label: 'Long Wave', emoji: '🌊',
    svg: `<path d="M96,82 A60,60 0 0 1 204,82 Z"/>
          <rect x="92" y="82" width="22" height="180" rx="11"/>
          <rect x="186" y="82" width="22" height="180" rx="11"/>
          <path d="M110,64 Q127,52 146,58" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25"/>
          <path d="M100,110 Q103,160 98,200" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.18"/>` },
  { id: 'curly', label: 'Curly', emoji: '✨',
    // Long curls: columns of ringlets fall past the shoulders (and gently sway).
    svg: `${['left', 'right'].map((side) => {
            const mx = (x) => (side === 'left' ? x : 300 - x);
            const curls = [[96, 146, 15], [108, 160, 13], [92, 172, 14], [104, 190, 13], [90, 202, 13], [102, 220, 12], [92, 236, 12], [100, 252, 11], [94, 266, 10]];
            return `<g class="hair-sway hair-sway-${side}">${curls.map(([x, y, r]) => `<circle cx="${mx(x)}" cy="${y}" r="${r}"/>`).join('')}
              <circle cx="${mx(92)}" cy="${172 - 4}" r="2.6" fill="#ffffff" opacity="0.2"/><circle cx="${mx(102)}" cy="${220 - 4}" r="2.4" fill="#ffffff" opacity="0.2"/></g>`;
          }).join('')}
          <circle cx="108" cy="72" r="17"/>
          <circle cx="128" cy="50" r="20"/>
          <circle cx="150" cy="42" r="21"/>
          <circle cx="172" cy="50" r="20"/>
          <circle cx="192" cy="72" r="17"/>
          <circle cx="98" cy="98" r="15"/>
          <circle cx="202" cy="98" r="15"/>
          <circle cx="104" cy="122" r="13"/>
          <circle cx="196" cy="122" r="13"/>
          <path d="M138,36 Q150,29 162,36" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>
          <circle cx="118" cy="58" r="3" fill="#ffffff" opacity="0.22"/>` },
  { id: 'short-curly', label: 'Short Curls', emoji: '🌀',
    svg: `<circle cx="108" cy="72" r="17"/>
          <circle cx="128" cy="50" r="20"/>
          <circle cx="150" cy="42" r="21"/>
          <circle cx="172" cy="50" r="20"/>
          <circle cx="192" cy="72" r="17"/>
          <circle cx="98" cy="98" r="15"/>
          <circle cx="202" cy="98" r="15"/>
          <circle cx="104" cy="122" r="13"/>
          <circle cx="196" cy="122" r="13"/>
          <path d="M138,36 Q150,29 162,36" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>
          <circle cx="118" cy="58" r="3" fill="#ffffff" opacity="0.22"/>` },
  { id: 'ponytail', label: 'Ponytail', emoji: '🎀',
    svg: `<path d="M98,80 A58,58 0 0 1 202,80 Z"/>
          <rect x="98" y="80" width="18" height="40" rx="9"/>
          <rect x="184" y="80" width="18" height="40" rx="9"/>
          <path d="M198,70 q34,10 26,90 q-4,26 -26,30 q14,-40 4,-70 q-6,-24 -4,-50 Z"/>
          <path d="M112,62 Q126,53 140,58" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25"/>
          <path d="M204,90 Q214,130 202,165" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.2"/>` },
  { id: 'none', label: 'Bald', emoji: '⚪', svg: `` },
  { id: 'bun', label: 'Top Bun', emoji: '🍩',
    svg: `<circle cx="150" cy="30" r="21"/>
          <path d="M140,22 Q148,14 158,18" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.25"/>
          <path d="M98,80 A58,58 0 0 1 202,80 Z"/>
          <rect x="98" y="80" width="14" height="28" rx="7"/>
          <rect x="188" y="80" width="14" height="28" rx="7"/>
          <rect x="134" y="44" width="32" height="7" rx="3.5" fill="#2b2b2b" stroke="none" opacity="0.55"/>
          <path d="M112,62 Q126,53 140,58" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25"/>` },
  { id: 'half-up', label: 'Half Up', emoji: '🎀',
    svg: `<circle cx="150" cy="40" r="14"/>
          <rect x="92" y="82" width="22" height="165" rx="11"/>
          <rect x="186" y="82" width="22" height="165" rx="11"/>
          <path d="M96,82 A60,60 0 0 1 204,82 Z"/>
          <path d="M150,34 L134,24 L134,44 Z" fill="#e0558f" stroke="#b83c6f" stroke-width="1"/>
          <path d="M150,34 L166,24 L166,44 Z" fill="#e0558f" stroke="#b83c6f" stroke-width="1"/>
          <circle cx="150" cy="34" r="4" fill="#b83c6f" stroke="none"/>
          <path d="M110,64 Q127,52 146,58" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25"/>
          <path d="M100,110 Q103,160 98,200" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.18"/>` },
  { id: 'spiderweb', label: 'Spiderweb Waves', emoji: '🕸️', theme: 'halloween',
    svg: `<path d="M96,82 A60,60 0 0 1 204,82 Z"/>
          <rect x="92" y="82" width="22" height="180" rx="11"/>
          <rect x="186" y="82" width="22" height="180" rx="11"/>
          <path d="M110,64 Q127,52 146,58" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25"/>
          ${spiderWebSVG(176, 60, 17)}
          ${spiderWebSVG(103, 190, 10)}
          <line x1="204" y1="84" x2="226" y2="122" stroke="#ffffff" stroke-width="1" opacity="0.85"/>
          <g transform="translate(227,130)">
            <g stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round" fill="none">
              <path d="M-4,-4 l-7,-4 M-4,-1 l-8,0 M-4,2 l-7,4 M-4,4 l-5,6"/>
              <path d="M4,-4 l7,-4 M4,-1 l8,0 M4,2 l7,4 M4,4 l5,6"/>
            </g>
            <ellipse cx="0" cy="0" rx="5.5" ry="6.5" fill="#1a1a1a" stroke="#ffffff" stroke-width="0.6" stroke-opacity="0.5"/>
            <circle cx="0" cy="-8" r="3.4" fill="#1a1a1a" stroke="#ffffff" stroke-width="0.5" stroke-opacity="0.5"/>
            <circle cx="-1.2" cy="-8.5" r="0.9" fill="#e05c5c" stroke="none"/>
            <circle cx="1.2" cy="-8.5" r="0.9" fill="#e05c5c" stroke="none"/>
          </g>` },
  { id: 'mermaid-waves', label: 'Mermaid Waves', emoji: '🌊',
    // The two side strands carry the "hair-sway" class, which CSS animates so the waves gently drift.
    svg: (() => {
      const left = 'M92,84 L114,84 C122,118 104,140 112,170 C120,200 102,226 110,256 C114,274 104,288 94,296 C88,272 100,256 92,232 C84,204 102,190 94,160 C86,130 100,114 92,84 Z';
      const mirror = (d) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${300 - Number(x)},${y}`);
      const shine = 'M100,100 C106,124 98,142 104,166 C110,190 98,212 104,238';
      return `<g class="hair-sway hair-sway-left"><path d="${left}"/>
                <path d="${shine}" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.22"/></g>
              <g class="hair-sway hair-sway-right"><path d="${mirror(left)}"/>
                <path d="${mirror(shine)}" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.22"/></g>
              <path d="M96,84 A60,60 0 0 1 204,84 Q192,70 176,72 Q164,60 150,66 Q136,60 124,72 Q108,70 96,84 Z"/>
              <path d="M110,64 Q127,52 146,58" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25"/>`;
    })() },
  { id: 'pigtails', label: 'Pigtails', emoji: '🎀',
    svg: (() => {
      const left = 'M106,70 C84,70 64,96 68,128 C70,150 84,164 94,154 C86,132 90,102 110,86 Z';
      const mirror = (d) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${300 - Number(x)},${y}`);
      return `<g class="hair-sway hair-sway-left"><path d="${left}"/>
                <path d="M84,96 C76,112 78,134 88,148" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.22"/></g>
              <g class="hair-sway hair-sway-right"><path d="${mirror(left)}"/>
                <path d="${mirror('M84,96 C76,112 78,134 88,148')}" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.22"/></g>
              <path d="M98,82 A58,58 0 0 1 202,82 Z"/>
              <rect x="98" y="80" width="12" height="18" rx="6"/>
              <rect x="190" y="80" width="12" height="18" rx="6"/>
              <path d="M150,38 L150,56" fill="none" stroke="#000000" stroke-width="1.5" opacity="0.25"/>
              <circle cx="106" cy="76" r="6" fill="#ff8fc7" stroke="#e0558f" stroke-width="1"/>
              <circle cx="194" cy="76" r="6" fill="#ff8fc7" stroke="#e0558f" stroke-width="1"/>
              <path d="M112,62 Q126,53 140,58" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25"/>`;
    })() },
  { id: 'cotton-candy-puffs', label: 'Cotton Candy Puffs', emoji: '☁️', pass: 'sweetie', passTier: 5,
    svg: `${[[-1, 108], [1, 192]].map(([d, x]) => `<g class="hair-sway hair-sway-${d < 0 ? 'left' : 'right'}">
            <circle cx="${x + d * 6}" cy="40" r="20"/><circle cx="${x + d * 18}" cy="52" r="17"/><circle cx="${x - d * 6}" cy="30" r="15"/>
            <circle cx="${x + d * 10}" cy="26" r="13"/><circle cx="${x + d * 4}" cy="58" r="14"/>
            <circle cx="${x + d * 2}" cy="34" r="3" fill="#ffffff" opacity="0.35"/></g>`).join('')}
          <path d="M98,82 A58,58 0 0 1 202,82 Z"/>
          <rect x="98" y="80" width="12" height="20" rx="6"/><rect x="190" y="80" width="12" height="20" rx="6"/>
          <path d="M112,62 Q126,53 140,58" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25"/>` },
  { id: 'braids', label: 'Long Braids', emoji: '🪢',
    svg: `${['left', 'right'].map((side) => {
            const mx = (x) => (side === 'left' ? x : 300 - x);
            const links = Array.from({ length: 9 }, (_, i) => {
              const y = 108 + i * 17, x = mx(100 + (i % 2 ? 4 : -4));
              return `<ellipse cx="${x}" cy="${y}" rx="11" ry="10" transform="rotate(${(i % 2 ? 1 : -1) * (side === 'left' ? 20 : -20)} ${x} ${y})"/>`;
            }).join('');
            return `<g class="hair-sway hair-sway-${side}">${links}
              <rect x="${mx(100) - 6}" y="254" width="12" height="7" rx="3" fill="#ff8fc7" stroke="none"/>
              <path d="M${mx(100) - 6},261 L${mx(100)},276 L${mx(100) + 6},261 Z"/></g>`;
          }).join('')}
          <path d="M98,82 A58,58 0 0 1 202,82 Z"/>
          <rect x="98" y="80" width="14" height="30" rx="7"/><rect x="188" y="80" width="14" height="30" rx="7"/>
          <path d="M150,38 L150,56" fill="none" stroke="#000000" stroke-width="1.5" opacity="0.25"/>
          <path d="M112,62 Q126,53 140,58" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25"/>` },
  { id: 'space-buns', label: 'Space Buns', emoji: '🪐',
    svg: `<circle cx="114" cy="40" r="18"/><circle cx="186" cy="40" r="18"/>
          <path d="M114,40 m0,-8 a8,8 0 1 1 -8,8 a5,5 0 1 1 5,5" fill="none" stroke="#000000" stroke-width="1.4" opacity="0.2"/>
          <path d="M186,40 m0,-8 a8,8 0 1 1 -8,8 a5,5 0 1 1 5,5" fill="none" stroke="#000000" stroke-width="1.4" opacity="0.2"/>
          <path d="M98,82 A58,58 0 0 1 202,82 Z"/>
          <rect x="98" y="80" width="12" height="22" rx="6"/><rect x="190" y="80" width="12" height="22" rx="6"/>
          <path d="M150,38 L150,56" fill="none" stroke="#000000" stroke-width="1.5" opacity="0.25"/>
          <circle cx="108" cy="32" r="3" fill="#ffffff" opacity="0.3"/><circle cx="180" cy="32" r="3" fill="#ffffff" opacity="0.3"/>` },
  { id: 'side-pony', label: 'Side Ponytail', emoji: '💁',
    svg: `<g class="hair-sway hair-sway-left">
            <path d="M108,66 C82,66 70,92 72,126 C74,160 66,196 78,220 C90,206 94,176 92,148 C90,118 98,92 114,80 Z"/>
            <path d="M84,104 C80,130 82,160 80,190" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.22"/>
          </g>
          <path d="M98,82 A58,58 0 0 1 202,82 Z"/>
          <rect x="188" y="80" width="14" height="26" rx="7"/>
          <circle cx="106" cy="72" r="6" fill="#8c5ce0" stroke="#5a3aa8" stroke-width="1"/>
          <path d="M112,62 Q126,53 140,58" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25"/>` },
  { id: 'crop', label: 'Short Crop', emoji: '💈',
    svg: `<path d="M100,78 A52,52 0 0 1 200,78 L198,96 A50,42 0 0 0 102,96 Z"/>
          <path d="M116,64 Q128,56 140,60" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.25"/>` },
];

const BANG_STYLES = [
  { id: 'none', label: 'No Bangs', emoji: '○' },
  { id: 'straight', label: 'Straight', emoji: '➖' },
  { id: 'side', label: 'Side Swept', emoji: '↗️' },
  { id: 'curtain', label: 'Curtain', emoji: '🪟' },
  { id: 'wispy', label: 'Wispy', emoji: '🌬️' },
  { id: 'micro', label: 'Short', emoji: '✂️' },
];

// Bangs sit over the forehead, drawn in the hair's own colour.
function bangsSVG(style) {
  if (!style || style === 'none') return '';
  if (style === 'straight') {
    // a blunt fringe with a softly jagged edge, from the right temple back to the left
    let edge = '';
    for (let i = 0; i <= 18; i++) {
      const x = 196 - i * (92 / 18);
      edge += ` L${x.toFixed(1)},${i % 2 ? 78 : 74}`;
    }
    return `<path d="M104,76 C102,50 124,42 150,42 C176,42 198,50 196,76${edge} Z" stroke-width="1"/>
            <path d="M118,52 Q134,46 150,47" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.25"/>`;
  }
  if (style === 'side') {
    return `<path d="M102,84 C100,54 124,40 154,42 C182,44 198,58 197,76 Q176,60 148,64 Q120,68 102,84 Z" stroke-width="1"/>
            <path d="M120,58 Q144,50 172,52" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.25"/>`;
  }
  if (style === 'curtain') {
    return `<path d="M103,88 C100,56 122,42 150,42 C178,42 200,56 197,88 Q188,72 174,63 Q160,55 152,49 L148,49 Q140,55 126,63 Q112,72 103,88 Z" stroke-width="1"/>
            <path d="M118,60 Q132,50 146,48 M182,60 Q168,50 154,48" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.25"/>`;
  }
  if (style === 'wispy') {
    const strands = [118, 130, 142, 154, 166, 178].map((x, i) =>
      `<path d="M${x - 6},58 Q${x - 3},68 ${x + (i % 2 ? 2 : -2)},${76 + (i % 3)} Q${x + 3},66 ${x + 6},58 Z" stroke-width="0.8"/>`).join('');
    return `${strands}<path d="M104,66 C104,50 126,42 150,42 C174,42 196,50 196,66 Q150,56 104,66 Z" stroke-width="1"/>`;
  }
  if (style === 'micro') {
    return `<path d="M106,66 C104,48 124,42 150,42 C176,42 196,48 194,66 Q150,60 106,66 Z" stroke-width="1"/>`;
  }
  return '';
}

const SALON_HAIR_COLORS = ['#2b2b2b', '#4b2e1e', '#8a5a2b', '#d9b45a', '#f2994a', '#e05c5c', '#ff6fb0', '#e0558f', '#8c5ce0', '#5cc4e0', '#43b581', '#e0e0e0'];

const HAIR_COLORS = ['#2b2b2b', '#4b2e1e', '#8a5a2b', '#d9b45a', '#e0558f', '#8c5ce0', '#5cc4e0', '#e0e0e0'];

// Draws a mermaid tail from the waist down: scaled body, pearl belt and a fin
// (class "tail-fin", which CSS animates into a gentle swish). With colors=null
// the tail takes the outfit color from the group's gradient fill.
function mermaidTailSVG(bt, colors) {
  const cx = 150;
  const { waist: wY, hip: hY } = TORSO_Y;
  const w = bt.waistHalf + 4, h = bt.hipHalf + 4;
  const fill = (c) => (colors ? ` fill="${c}"` : '');
  const scaleColor = colors ? colors.scale : '#000000';
  const scaleOpacity = colors ? 0.55 : 0.22;
  const profile = [[wY, w], [hY, h], [330, h * 0.78], [362, h * 0.56], [402, 24], [436, 12]];
  const halfAt = (y) => {
    for (let i = 1; i < profile.length; i++) {
      const [y0, h0] = profile[i - 1], [y1, h1] = profile[i];
      if (y <= y1) return h0 + (h1 - h0) * (y - y0) / (y1 - y0);
    }
    return 12;
  };
  let scales = '';
  let row = 0;
  for (let y = wY + 14; y < 430; y += 9, row++) {
    const half = halfAt(y) - 5;
    for (let x = cx - half + (row % 2 ? 4.5 : 0); x <= cx + half; x += 9) {
      scales += `M${(x - 4).toFixed(1)},${y} Q${x.toFixed(1)},${y + 5} ${(x + 4).toFixed(1)},${y} `;
    }
  }
  const pearls = Array.from({ length: 9 }, (_, i) => {
    const x = cx - w + (2 * w * i) / 8;
    return `<circle cx="${x.toFixed(1)}" cy="${wY + 1}" r="3" fill="${colors ? colors.belt : '#fff7ef'}" stroke="#d9c7b8" stroke-width="0.5"/>`;
  }).join('');
  return `<g class="tail-fin">
            <path d="M${cx - 12},430 Q${cx - 40},450 ${cx - 66},498 Q${cx - 34},488 ${cx},474 Q${cx + 34},488 ${cx + 66},498 Q${cx + 40},450 ${cx + 12},430 Z"${fill(colors && colors.fin)}/>
            <path d="M${cx - 6},440 L${cx - 40},486 M${cx - 4},446 L${cx - 22},482 M${cx + 6},440 L${cx + 40},486 M${cx + 4},446 L${cx + 22},482" fill="none" stroke="${colors ? colors.finLine : '#000000'}" stroke-width="1.4" opacity="${colors ? 0.6 : 0.2}" stroke-linecap="round"/>
          </g>
          <path d="M${cx - w},${wY} C${cx - w},${wY + 16} ${cx - h},${hY - 18} ${cx - h},${hY}
            C${cx - h},${hY + 40} ${cx - h * 0.78},318 ${cx - h * 0.56},362
            C${cx - 30},398 ${cx - 16},418 ${cx - 12},438 L${cx + 12},438
            C${cx + 16},418 ${cx + 30},398 ${cx + h * 0.56},362
            C${cx + h * 0.78},318 ${cx + h},${hY + 40} ${cx + h},${hY}
            C${cx + h},${hY - 18} ${cx + w},${wY + 16} ${cx + w},${wY} Z"${fill(colors && colors.body)}/>
          <path d="${scales}" fill="none" stroke="${scaleColor}" stroke-width="1.1" opacity="${scaleOpacity}"/>
          <path d="M${cx - w + 8},${wY + 10} C${cx - h + 10},${hY} ${cx - h * 0.6},330 ${cx - 20},400" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.18" stroke-linecap="round"/>
          ${colors ? [[-14, 270], [18, 300], [-6, 340], [10, 380], [-20, 230]].map(([x, y]) => `<path d="M${cx + x},${y - 4} L${cx + x + 1.2},${y - 1.2} L${cx + x + 4},${y} L${cx + x + 1.2},${y + 1.2} L${cx + x},${y + 4} L${cx + x - 1.2},${y + 1.2} L${cx + x - 4},${y} L${cx + x - 1.2},${y - 1.2} Z" fill="#ffffff" opacity="0.9"/>`).join('') : ''}
          ${pearls}`;
}

// Interpolated half-width of the body's torso at height y (shoulder -> hip).
function torsoHalfAt(bt, y) {
  const pts = [[TORSO_Y.shoulder, bt.shoulderHalf], [TORSO_Y.chest, bt.chestHalf], [TORSO_Y.waist, bt.waistHalf], [TORSO_Y.hip, bt.hipHalf]];
  if (y <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (y <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * (y - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
  }
  return bt.hipHalf;
}

// A fitted top (shoulders to just below the waist) with short sleeves.
function fittedTopSVG(bt, hemY, fill) {
  const cx = 150;
  const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
  const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4;
  const f = fill ? ` fill="${fill}"` : '';
  const hw = torsoHalfAt(bt, hemY) + 4;
  return `<ellipse cx="${cx - s - 2}" cy="${sY + 12}" rx="12" ry="14"${f}/>
          <ellipse cx="${cx + s + 2}" cy="${sY + 12}" rx="12" ry="14"${f}/>
          <path d="M${cx - s},${sY} L${cx + s},${sY}
            C${cx + s},${sY + 14} ${cx + c},${bY - 10} ${cx + c},${bY}
            C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY}
            L${cx + hw},${hemY} L${cx - hw},${hemY} L${cx - w},${wY}
            C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY}
            C${cx - c},${bY - 10} ${cx - s},${sY + 14} ${cx - s},${sY} Z"${f}/>`;
}

// A one-piece swimsuit: straps, a straight neckline and high-cut leg openings.
function swimsuitSVG(bt, fill) {
  const cx = 150;
  const { shoulder: sY, chest: bY, waist: wY, hip: hY } = TORSO_Y;
  const f = fill ? ` fill="${fill}"` : '';
  const topY = sY + 16;
  const t = torsoHalfAt(bt, topY) + 3, c = bt.chestHalf + 3, w = bt.waistHalf + 3, h = bt.hipHalf + 3;
  const sx = bt.shoulderHalf - 10;
  return `<path d="M${cx - sx - 4},${sY} L${cx - sx + 3},${sY} L${cx - t + 12},${topY + 2} L${cx - t + 4},${topY + 2} Z"${f}/>
          <path d="M${cx + sx + 4},${sY} L${cx + sx - 3},${sY} L${cx + t - 12},${topY + 2} L${cx + t - 4},${topY + 2} Z"${f}/>
          <path d="M${cx - t},${topY} L${cx + t},${topY}
            C${cx + c},${bY} ${cx + c},${bY + 6} ${cx + c},${bY + 4}
            C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY}
            C${cx + w},${wY + 16} ${cx + h},${hY - 18} ${cx + h},${hY - 8}
            Q${cx + 20},${hY - 2} ${cx + 10},${hY + 14} L${cx - 10},${hY + 14}
            Q${cx - 20},${hY - 2} ${cx - h},${hY - 8}
            C${cx - h},${hY - 18} ${cx - w},${wY + 16} ${cx - w},${wY}
            C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY + 4}
            C${cx - c},${bY + 6} ${cx - c},${bY} ${cx - t},${topY} Z"${f}/>
          <path d="M${cx - c + 6},${bY + 8} L${cx - w + 4},${wY + 20}" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.18" stroke-linecap="round"/>`;
}

// A leotard with a stiff, flat "pancake" tutu around the hips. colors=null uses the outfit colour.
function balletTutuSVG(bt, colors) {
  const cx = 150, y = TORSO_Y.hip - 10;
  const rx = bt.hipHalf + 62;
  const f = (c) => (colors ? ` fill="${c}"` : '');
  const layers = [0, 1, 2].map((i) => {
    const r = rx - i * 8, yy = y - i * 4;
    let edge = '';
    const n = 16;
    for (let k = 0; k <= n; k++) {
      const a = Math.PI * (k / n);
      const x0 = cx - r * Math.cos(a), y0 = yy + 12 * Math.sin(a);
      edge += `${k ? 'L' : 'M'}${x0.toFixed(1)},${(y0 + (k % 2 ? 5 : 0)).toFixed(1)} `;
    }
    return `<ellipse cx="${cx}" cy="${yy}" rx="${r}" ry="15"${f(colors && colors.tutu)} stroke="${colors ? colors.trim : '#000000'}" stroke-opacity="${colors ? 1 : 0.18}" stroke-width="1"/>
            <path d="${edge}" fill="none" stroke="${colors ? colors.trim : '#000000'}" stroke-opacity="${colors ? 0.8 : 0.15}" stroke-width="1"/>
            <ellipse cx="${cx}" cy="${yy}" rx="${r}" ry="15" fill="#ffffff" opacity="${colors ? 0 : 0.28}"/>`;
  }).join('');
  const net = Array.from({ length: 9 }, (_, i) => {
    const x = cx - rx + 14 + i * ((rx * 2 - 28) / 8);
    return `<line x1="${x.toFixed(1)}" y1="${y - 6}" x2="${(x + (x - cx) * 0.08).toFixed(1)}" y2="${y + 12}" stroke="#ffffff" stroke-width="1" opacity="0.5"/>`;
  }).join('');
  const sparkles = [[-12, 180], [10, 196], [-4, 214], [16, 172]].map(([x, yy]) =>
    `<circle cx="${cx + x}" cy="${yy}" r="1.8" fill="${colors ? colors.sparkle : '#ffffff'}" opacity="0.9"/>`).join('');
  return `${swimsuitSVG(bt, colors ? colors.suit : null)}
          ${sparkles}
          ${layers}${net}
          <path d="M${cx - bt.waistHalf - 3},${TORSO_Y.waist} L${cx + bt.waistHalf + 3},${TORSO_Y.waist}" stroke="${colors ? colors.trim : '#ffffff'}" stroke-width="3" opacity="0.8"/>`;
}

const OUTFIT_STYLES = [
  { id: 'aline', label: 'A-Line Dress', emoji: '👗',
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
      const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4;
      const hemY = 340, hemHalf = bt.hipHalf + 44;
      return `<path d="M${cx - s},${sY} L${cx + s},${sY}
                C${cx + s},${sY + 14} ${cx + c},${bY - 10} ${cx + c},${bY}
                C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY}
                L${cx + hemHalf},${hemY} Q${cx},${hemY + 18} ${cx - hemHalf},${hemY}
                L${cx - w},${wY}
                C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY}
                C${cx - c},${bY - 10} ${cx - s},${sY + 14} ${cx - s},${sY} Z"/>
              <path d="M${cx - s + 7},${sY + 6} L${cx - w + 2},${wY + 120}" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.15" stroke-linecap="round"/>
              <path d="M${cx - hemHalf + 18},252 Q${cx},260 ${cx + hemHalf - 18},252" fill="none" stroke="#000000" stroke-width="2" opacity="0.12"/>
              <path d="M${cx - s},${sY} L${cx + s},${sY} L${cx + s - 3},${sY + 14} L${cx - s + 3},${sY + 14} Z" fill="#000000" opacity="0.08"/>` } },
  { id: 'mermaid', label: 'Mermaid Gown', emoji: '💃',
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY, waist: wY, hip: hY } = TORSO_Y;
      const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4, h = bt.hipHalf + 4;
      const kneeY = 300, kneeHalf = h - 6;
      const hemY = 400, hemHalf = h + 46;
      return `<path d="M${cx - s},${sY} L${cx + s},${sY}
                C${cx + s},${sY + 14} ${cx + c},${bY - 10} ${cx + c},${bY}
                C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY}
                C${cx + w},${wY + 16} ${cx + h},${hY - 18} ${cx + h},${hY}
                L${cx + kneeHalf},${kneeY} Q${cx + hemHalf},${kneeY + 30} ${cx + hemHalf},${hemY}
                L${cx - hemHalf},${hemY} Q${cx - hemHalf},${kneeY + 30} ${cx - kneeHalf},${kneeY}
                L${cx - h},${hY}
                C${cx - h},${hY - 18} ${cx - w},${wY + 16} ${cx - w},${wY}
                C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY}
                C${cx - c},${bY - 10} ${cx - s},${sY + 14} ${cx - s},${sY} Z"/>
              <path d="M${cx - s + 8},${sY + 8} L${cx - w + 2},${kneeY - 12}" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.16" stroke-linecap="round"/>
              <path d="M${cx - kneeHalf + 10},${kneeY + 18} Q${cx},${kneeY + 30} ${cx + kneeHalf - 10},${kneeY + 18}" fill="none" stroke="#000000" stroke-width="2" opacity="0.12"/>
              <path d="M${cx - s},${sY} L${cx + s},${sY} L${cx + s - 3},${sY + 13} L${cx - s + 3},${sY + 13} Z" fill="#000000" opacity="0.08"/>` } },
  { id: 'jumpsuit', label: 'Jumpsuit', emoji: '👖',
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, hip: hY } = TORSO_Y;
      const rUpper = bt.limbWidth / 2 * 1.15 + 4;
      const rLower = bt.limbWidth / 2 * 0.68 * 0.9 + 3;
      const legL = capsulePath(133, 248, rUpper, 127, 418, rLower);
      const legR = capsulePath(167, 248, rUpper, 173, 418, rLower);
      return `<path d="${bodyTorsoPath(bt, 3)}"/>
              <path d="${legL}"/>
              <path d="${legR}"/>
              <line x1="${cx}" y1="152" x2="${cx}" y2="${hY - 4}" stroke="#000000" stroke-width="1.4" opacity="0.15"/>
              <path d="M${cx - bt.chestHalf + 6},158 L${cx - bt.waistHalf + 2},${hY - 4}" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.15" stroke-linecap="round"/>
              <path d="M${cx - bt.shoulderHalf},${sY} L${cx + bt.shoulderHalf},${sY} L${cx + bt.shoulderHalf - 3},${sY + 14} L${cx - bt.shoulderHalf + 3},${sY + 14} Z" fill="#000000" opacity="0.08"/>` } },
  { id: 'skirtset', label: 'Top & Skirt', emoji: '🩱',
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY } = TORSO_Y;
      const topHemY = 218;
      const s = bt.shoulderHalf, c = bt.chestHalf + 2;
      const skirtTopHalf = bt.waistHalf + 6;
      const skirtHemY = 330, skirtHemHalf = bt.hipHalf + 40;
      return `<path d="M${cx - s},${sY} L${cx + s},${sY}
                C${cx + s},${sY + 14} ${cx + c},${bY - 8} ${cx + c},${bY}
                L${cx + c - 2},${topHemY} Q${cx},${topHemY + 8} ${cx - c + 2},${topHemY}
                L${cx - c},${bY}
                C${cx - c},${bY - 8} ${cx - s},${sY + 14} ${cx - s},${sY} Z"/>
              <path d="M${cx - skirtTopHalf},${topHemY} L${cx + skirtTopHalf},${topHemY} L${cx + skirtHemHalf},${skirtHemY} Q${cx},${skirtHemY + 16} ${cx - skirtHemHalf},${skirtHemY} Z"/>
              <path d="M${cx - c + 4},${bY + 6} L${cx - skirtTopHalf + 2},${topHemY + 30}" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.15" stroke-linecap="round"/>
              <path d="M${cx - skirtHemHalf + 16},${skirtHemY - 14} Q${cx},${skirtHemY - 8} ${cx + skirtHemHalf - 16},${skirtHemY - 14}" fill="none" stroke="#000000" stroke-width="1.5" opacity="0.12"/>
              <path d="M${cx - s},${sY} L${cx + s},${sY} L${cx + s - 3},${sY + 12} L${cx - s + 3},${sY + 12} Z" fill="#000000" opacity="0.08"/>` } },
  { id: 'suit', label: 'Suit', emoji: '🤵',
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
      const s = bt.shoulderHalf + 3, c = bt.chestHalf + 4, w = bt.waistHalf + 3;
      const jacketHemY = 248;
      const rUpper = bt.limbWidth / 2 * 1.15 + 4;
      const rLower = bt.limbWidth / 2 * 0.68 * 0.9 + 3;
      const legL = capsulePath(133, 248, rUpper, 127, 418, rLower);
      const legR = capsulePath(167, 248, rUpper, 173, 418, rLower);
      return `<path d="M${cx - s},${sY} L${cx + s},${sY}
                C${cx + s},${sY + 14} ${cx + c},${bY - 10} ${cx + c},${bY}
                C${cx + c},${bY + 16} ${cx + w},${wY - 10} ${cx + w - 4},${jacketHemY}
                L${cx},${jacketHemY - 14}
                L${cx - w + 4},${jacketHemY}
                C${cx - w},${wY - 10} ${cx - c},${bY + 16} ${cx - c},${bY}
                C${cx - c},${bY - 10} ${cx - s},${sY + 14} ${cx - s},${sY} Z"/>
              <path d="${legL}"/>
              <path d="${legR}"/>
              <path d="M${cx - s},${sY} L${cx - s + 24},${sY} L${cx - c + 8},${sY + 26} Z" fill="#000000" opacity="0.14"/>
              <path d="M${cx + s},${sY} L${cx + s - 24},${sY} L${cx + c - 8},${sY + 26} Z" fill="#000000" opacity="0.14"/>
              <path d="M${cx - s + 8},${sY + 10} L${cx - w + 8},${jacketHemY - 10}" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.14" stroke-linecap="round"/>
              <path d="M${cx - s + 24},${sY} L${cx + s - 24},${sY} L${cx},${bY + 33} Z" fill="#fdfdfd"/>
              <path d="M${cx - 8},${sY} L${cx + 8},${sY} L${cx + 4},${bY + 15} L${cx - 4},${bY + 17} Z" fill="#7a1f2b"/>` } },
  { id: 'kitty-dress', label: 'Kitty Dress', emoji: '🐱',
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
      const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4;
      const hemY = 336, hemHalf = bt.hipHalf + 46, scallops = 7;
      const step = (hemHalf * 2) / scallops;
      let hem = '';
      for (let i = 0; i < scallops; i++) {
        const x0 = cx + hemHalf - step * i;
        hem += ` Q${x0 - step / 2},${hemY + 16} ${x0 - step},${hemY}`;
      }
      const paw = (x, y) => `<g fill="#ffffff" opacity="0.75">
          <ellipse cx="${x}" cy="${y}" rx="4.2" ry="3.6"/>
          <circle cx="${x - 4.6}" cy="${y - 5}" r="1.7"/><circle cx="${x - 1.5}" cy="${y - 6.8}" r="1.7"/>
          <circle cx="${x + 1.9}" cy="${y - 6.8}" r="1.7"/><circle cx="${x + 4.8}" cy="${y - 5}" r="1.7"/></g>`;
      const fy = 286;
      return `<path d="M${cx - s},${sY} L${cx + s},${sY}
                C${cx + s},${sY + 14} ${cx + c},${bY - 10} ${cx + c},${bY}
                C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY}
                L${cx + hemHalf},${hemY}${hem}
                L${cx - w},${wY}
                C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY}
                C${cx - c},${bY - 10} ${cx - s},${sY + 14} ${cx - s},${sY} Z"/>
              <path d="M${cx - s + 7},${sY + 6} L${cx - w + 2},${wY + 110}" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.15" stroke-linecap="round"/>
              <path d="M${cx - s},${sY} L${cx + s},${sY} L${cx + s - 3},${sY + 14} L${cx - s + 3},${sY + 14} Z" fill="#000000" opacity="0.08"/>
              <path d="M${cx - 1},${sY + 1} Q${cx - 24},${sY - 1} ${cx - 20},${sY + 12} Q${cx - 10},${sY + 18} ${cx - 1},${sY + 8} Z" fill="#ffffff" stroke="#e7d6e0" stroke-width="1"/>
              <path d="M${cx + 1},${sY + 1} Q${cx + 24},${sY - 1} ${cx + 20},${sY + 12} Q${cx + 10},${sY + 18} ${cx + 1},${sY + 8} Z" fill="#ffffff" stroke="#e7d6e0" stroke-width="1"/>
              <rect x="${cx - w}" y="${wY - 4}" width="${w * 2}" height="8" fill="#ffffff" opacity="0.9"/>
              <path d="M${cx},${wY} L${cx - 14},${wY - 8} L${cx - 14},${wY + 8} Z M${cx},${wY} L${cx + 14},${wY - 8} L${cx + 14},${wY + 8} Z" fill="#ffffff" stroke="#e7d6e0" stroke-width="1"/>
              <circle cx="${cx}" cy="${wY}" r="3.5" fill="#ff9fc7"/>
              <path d="M${cx - 20},${fy - 10} L${cx - 17},${fy - 30} L${cx - 5},${fy - 19} Z M${cx + 20},${fy - 10} L${cx + 17},${fy - 30} L${cx + 5},${fy - 19} Z" fill="#ffffff" stroke="#e7d6e0" stroke-width="1"/>
              <path d="M${cx - 16},${fy - 14} L${cx - 15},${fy - 25} L${cx - 8},${fy - 19} Z M${cx + 16},${fy - 14} L${cx + 15},${fy - 25} L${cx + 8},${fy - 19} Z" fill="#ff9fc7"/>
              <ellipse cx="${cx}" cy="${fy}" rx="22" ry="19" fill="#ffffff" stroke="#e7d6e0" stroke-width="1"/>
              <ellipse cx="${cx - 8}" cy="${fy - 3}" rx="2.6" ry="3.6" fill="#2b2b2b"/>
              <ellipse cx="${cx + 8}" cy="${fy - 3}" rx="2.6" ry="3.6" fill="#2b2b2b"/>
              <circle cx="${cx - 8.8}" cy="${fy - 4.4}" r="0.9" fill="#ffffff"/>
              <circle cx="${cx + 7.2}" cy="${fy - 4.4}" r="0.9" fill="#ffffff"/>
              <path d="M${cx - 2.5},${fy + 3} L${cx + 2.5},${fy + 3} L${cx},${fy + 5.5} Z" fill="#ff9fc7"/>
              <path d="M${cx - 4},${fy + 7} Q${cx - 2},${fy + 9} ${cx},${fy + 6} Q${cx + 2},${fy + 9} ${cx + 4},${fy + 7}" fill="none" stroke="#2b2b2b" stroke-width="1" stroke-linecap="round"/>
              <g stroke="#b9a9b3" stroke-width="0.9" stroke-linecap="round">
                <line x1="${cx - 12}" y1="${fy + 3}" x2="${cx - 26}" y2="${fy}"/><line x1="${cx - 12}" y1="${fy + 6}" x2="${cx - 26}" y2="${fy + 7}"/>
                <line x1="${cx + 12}" y1="${fy + 3}" x2="${cx + 26}" y2="${fy}"/><line x1="${cx + 12}" y1="${fy + 6}" x2="${cx + 26}" y2="${fy + 7}"/>
              </g>
              ${paw(cx - hemHalf + 26, 316)}${paw(cx + hemHalf - 26, 314)}${paw(cx - 40, 248)}${paw(cx + 42, 262)}` } },
  { id: 'feather-dress', label: 'Feather Dress', emoji: '🪶', theme: 'birds',
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
      const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4;
      const feather = (x, y, r) => `<path d="M${x},${y} C${x + r * 1.5},${y + r * 0.4} ${x + r * 1.1},${y + r * 2.2} ${x},${y + r * 2.7} C${x - r * 1.1},${y + r * 2.2} ${x - r * 1.5},${y + r * 0.4} ${x},${y} Z" stroke="#000000" stroke-opacity="0.18" stroke-width="1"/>
          <line x1="${x}" y1="${y + 2}" x2="${x}" y2="${y + r * 2.4}" stroke="#ffffff" stroke-width="1" opacity="0.35"/>`;
      const row = (y, half, count, r) => Array.from({ length: count }, (_, i) =>
        feather(cx - half + (2 * half * i) / (count - 1), y, r)).join('');
      const hip = bt.hipHalf;
      return `<path d="M${cx - s},${sY} L${cx + s},${sY}
                C${cx + s},${sY + 14} ${cx + c},${bY - 10} ${cx + c},${bY}
                C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY}
                L${cx + hip + 34},318 L${cx - hip - 34},318 L${cx - w},${wY}
                C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY}
                C${cx - c},${bY - 10} ${cx - s},${sY + 14} ${cx - s},${sY} Z"/>
              <path d="M${cx - s},${sY} L${cx + s},${sY} L${cx + s - 3},${sY + 14} L${cx - s + 3},${sY + 14} Z" fill="#000000" opacity="0.08"/>
              ${row(wY + 96, hip + 36, 9, 15)}
              ${row(wY + 64, hip + 24, 8, 14)}
              ${row(wY + 32, hip + 12, 7, 13)}
              ${row(wY - 2, w + 2, 6, 11)}
              <path d="M${cx - s + 7},${sY + 6} L${cx - w + 2},${wY}" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.15" stroke-linecap="round"/>` } },
  { id: 'peacock-gown', label: 'Peacock Gown', emoji: '🦚', theme: 'birds', fixedColor: true,
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
      const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4;
      const hemY = 404, hemHalf = bt.hipHalf + 62;
      const eye = (x, y, k) => `<path d="M${cx},${wY + 6} Q${(cx + x) / 2},${(wY + y) / 2 + 20} ${x},${y}" fill="none" stroke="#9bd16a" stroke-width="1.2" opacity="0.55"/>
          <ellipse cx="${x}" cy="${y}" rx="${11 * k}" ry="${13 * k}" fill="#e8c468"/>
          <ellipse cx="${x}" cy="${y + 1}" rx="${8 * k}" ry="${9.5 * k}" fill="#2bb3a3"/>
          <ellipse cx="${x}" cy="${y + 2}" rx="${5 * k}" ry="${6 * k}" fill="#1f3f9c"/>`;
      const eyes = [];
      for (let i = 0; i < 5; i++) eyes.push(eye(cx - hemHalf + 22 + i * (2 * hemHalf - 44) / 4, hemY - 22, 1));
      for (let i = 0; i < 4; i++) eyes.push(eye(cx - hemHalf + 48 + i * (2 * hemHalf - 96) / 3, hemY - 70, 0.85));
      for (let i = 0; i < 3; i++) eyes.push(eye(cx - 34 + i * 34, hemY - 116, 0.7));
      return `<path d="M${cx - w},${wY} L${cx + w},${wY} L${cx + hemHalf},${hemY} Q${cx},${hemY + 22} ${cx - hemHalf},${hemY} Z" fill="#1f7a8c"/>
              <path d="M${cx - w + 6},${wY} L${cx + w - 6},${wY} L${cx + hemHalf - 30},${hemY - 6} Q${cx},${hemY + 10} ${cx - hemHalf + 30},${hemY - 6} Z" fill="#2a9aa8" opacity="0.6"/>
              ${eyes.join('')}
              <path d="M${cx - s},${sY} L${cx + s},${sY}
                C${cx + s},${sY + 14} ${cx + c},${bY - 10} ${cx + c},${bY}
                C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY + 4}
                L${cx - w},${wY + 4}
                C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY}
                C${cx - c},${bY - 10} ${cx - s},${sY + 14} ${cx - s},${sY} Z" fill="#1f3f9c"/>
              <path d="M${cx - s + 6},${sY + 4} Q${cx},${sY + 40} ${cx + s - 6},${sY + 4}" fill="none" stroke="#2bb3a3" stroke-width="3" opacity="0.8"/>
              <rect x="${cx - w}" y="${wY - 2}" width="${w * 2}" height="7" fill="#e8c468"/>` } },
  { id: 'owl-costume', label: 'Owl Costume', emoji: '🦉', theme: 'birds', fixedColor: true,
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY } = TORSO_Y;
      const rUpper = bt.limbWidth / 2 * 1.15 + 4;
      const rLower = bt.limbWidth / 2 * 0.68 * 0.9 + 3;
      const legL = capsulePath(133, 248, rUpper, 127, 418, rLower);
      const legR = capsulePath(167, 248, rUpper, 173, 418, rLower);
      const lx = 93 - bt.armSpread, rx = 207 + bt.armSpread;
      const s = bt.shoulderHalf;
      const marks = [];
      for (let r = 0; r < 4; r++) for (let i = -1; i <= 1; i++) {
        const x = cx + i * 11 + (r % 2 ? 5 : 0) - 2, y = 186 + r * 13;
        marks.push(`<path d="M${x - 4},${y} Q${x},${y + 5} ${x + 4},${y}" fill="none" stroke="#a8743c" stroke-width="1.6" stroke-linecap="round"/>`);
      }
      return `<path d="${legL}" fill="#7a4e26"/>
              <path d="${legR}" fill="#7a4e26"/>
              <path d="${bodyTorsoPath(bt, 3)}" fill="#8a5a2b"/>
              <ellipse cx="${cx}" cy="205" rx="${bt.waistHalf * 0.75}" ry="40" fill="#f2dfc0"/>
              ${marks.join('')}
              <path d="M${cx - s},${sY + 2} Q${cx - s - 26},${sY + 56} ${lx - 6},282 L${lx + 4},270 L${lx + 10},284 L${lx + 16},268 Q${cx - s + 2},${sY + 60} ${cx - s + 8},${sY + 6} Z" fill="#6b4220"/>
              <path d="M${cx + s},${sY + 2} Q${cx + s + 26},${sY + 56} ${rx + 6},282 L${rx - 4},270 L${rx - 10},284 L${rx - 16},268 Q${cx + s - 2},${sY + 60} ${cx + s - 8},${sY + 6} Z" fill="#6b4220"/>
              <path d="M110,58 L108,26 L132,48 Z" fill="#6b4220"/>
              <path d="M190,58 L192,26 L168,48 Z" fill="#6b4220"/>` } },
  { id: 'rose-gown', label: 'Rose Petal Gown', emoji: '🌹', theme: 'metgala', price: 60, fixedColor: true,
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY, waist: wY, hip: hY } = TORSO_Y;
      const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4, h = bt.hipHalf + 4;
      const kneeY = 300, kneeHalf = h - 6, hemY = 410, hemHalf = h + 56;
      const rose = (x, y, r) => `<circle cx="${cx + x}" cy="${y}" r="${r}" fill="#e0245e"/>
          <path d="M${cx + x - r * 0.6},${y + r * 0.1} Q${cx + x},${y - r * 0.8} ${cx + x + r * 0.6},${y} Q${cx + x},${y + r * 0.7} ${cx + x - r * 0.3},${y - r * 0.15}" fill="none" stroke="#7a0b2a" stroke-width="1.2"/>
          <circle cx="${cx + x}" cy="${y}" r="${r * 0.28}" fill="none" stroke="#7a0b2a" stroke-width="1"/>`;
      const roses = [[0, 172, 8], [-18, 196, 7], [16, 212, 8], [-8, 236, 7], [20, 258, 7], [-22, 280, 8], [6, 296, 7],
        [-30, 328, 9], [26, 336, 9], [0, 360, 10], [-50, 384, 10], [44, 388, 10], [-12, 396, 9], [70, 400, 8], [-74, 398, 8]];
      return `<path d="M${cx - s},${sY + 8} L${cx + s},${sY + 8}
                C${cx + s},${sY + 18} ${cx + c},${bY - 8} ${cx + c},${bY}
                C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY}
                C${cx + w},${wY + 16} ${cx + h},${hY - 18} ${cx + h},${hY}
                L${cx + kneeHalf},${kneeY} Q${cx + hemHalf},${kneeY + 30} ${cx + hemHalf},${hemY}
                Q${cx},${hemY + 18} ${cx - hemHalf},${hemY} Q${cx - hemHalf},${kneeY + 30} ${cx - kneeHalf},${kneeY}
                L${cx - h},${hY}
                C${cx - h},${hY - 18} ${cx - w},${wY + 16} ${cx - w},${wY}
                C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY}
                C${cx - c},${bY - 8} ${cx - s},${sY + 18} ${cx - s},${sY + 8} Z" fill="#b0123f"/>
              <path d="M${cx - s + 8},${sY + 14} L${cx - w + 2},${kneeY - 12}" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.14" stroke-linecap="round"/>
              ${roses.map(([x, y, r]) => rose(x, y, r)).join('')}` } },
  { id: 'golden-goddess', label: 'Golden Goddess Gown', emoji: '🏆', theme: 'metgala', price: 90, fixedColor: true,
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
      const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4;
      const hemY = 412, hemHalf = bt.hipHalf + 50;
      const pleats = [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75].map((f) =>
        `<path d="M${cx + f * w},${wY + 6} Q${cx + f * (w + hemHalf) / 2},${(wY + hemY) / 2} ${cx + f * hemHalf},${hemY + 6}" fill="none" stroke="#b8862a" stroke-width="1.6" opacity="0.55"/>`).join('');
      const sparkles = [[-30, 250], [24, 290], [-12, 330], [40, 360], [-48, 380], [10, 395], [18, 190], [-14, 172]]
        .map(([x, y]) => `<path d="M${cx + x},${y - 4} L${cx + x + 1.2},${y - 1.2} L${cx + x + 4},${y} L${cx + x + 1.2},${y + 1.2} L${cx + x},${y + 4} L${cx + x - 1.2},${y + 1.2} L${cx + x - 4},${y} L${cx + x - 1.2},${y - 1.2} Z" fill="#fff7d6"/>`).join('');
      return `<path d="M${cx - s},${sY} L${cx - s + 16},${sY}
                L${cx + c},${bY}
                C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY}
                L${cx + hemHalf + 26},${hemY} Q${cx},${hemY + 22} ${cx - hemHalf},${hemY}
                L${cx - w},${wY}
                C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY}
                C${cx - c},${bY - 10} ${cx - s},${sY + 14} ${cx - s},${sY} Z" fill="#e8b84b"/>
              <path d="M${cx - s + 8},${sY + 2} L${cx + c - 4},${bY + 2}" fill="none" stroke="#b8862a" stroke-width="2" opacity="0.6"/>
              <path d="M${cx - s + 10},${sY + 14} L${cx + c - 10},${bY + 14}" fill="none" stroke="#b8862a" stroke-width="1.5" opacity="0.45"/>
              ${pleats}
              <rect x="${cx - w}" y="${wY - 3}" width="${w * 2}" height="7" rx="3" fill="#fff3c4"/>
              <path d="M${cx - s + 6},${sY + 10} L${cx - w + 4},${wY + 120}" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.2" stroke-linecap="round"/>
              ${sparkles}` } },
  { id: 'garden-gown', label: 'Garden Bloom Gown', emoji: '💐', theme: 'metgala', price: 120, fixedColor: true,
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
      const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4;
      const hemY = 418, hemHalf = bt.hipHalf + 72;
      const petals = ['#ff8fc7', '#b79cff', '#ffb38a', '#8fd3ff', '#ff6f91'];
      const flower = (x, y, r, col) => {
        let out = '';
        for (let i = 0; i < 5; i++) {
          const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          out += `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="${(r * 0.8).toFixed(1)}" fill="${col}"/>`;
        }
        return out + `<circle cx="${x}" cy="${y}" r="${(r * 0.55).toFixed(1)}" fill="#ffd23f"/>`;
      };
      let blooms = '', k = 0;
      for (let y = wY + 22; y <= hemY - 10; y += 30) {
        const half = w + (hemHalf - w) * (y - wY) / (hemY - wY) - 10;
        const count = Math.max(2, Math.round(half / 22));
        for (let i = 0; i <= count; i++) {
          const x = cx - half + (2 * half * i) / count + (k % 2 ? 8 : -8);
          blooms += `<ellipse cx="${x + 7}" cy="${y + 5}" rx="5" ry="2.4" fill="#6fbf5e" transform="rotate(30 ${x + 7} ${y + 5})"/>`;
          blooms += flower(x, y, 4.2, petals[(i + k) % petals.length]);
        }
        k++;
      }
      [[-14, 176], [12, 188], [-4, 204]].forEach(([x, y], i) => { blooms += flower(cx + x, y, 3.6, petals[i + 1]); });
      return `<path d="M${cx - w},${wY} L${cx + w},${wY} L${cx + hemHalf},${hemY} Q${cx},${hemY + 26} ${cx - hemHalf},${hemY} Z" fill="#f3f7ef" stroke="#d6e4cc" stroke-width="1.5"/>
              <path d="M${cx - w + 8},${wY} L${cx + w - 8},${wY} L${cx + hemHalf - 30},${hemY - 4} Q${cx},${hemY + 14} ${cx - hemHalf + 30},${hemY - 4} Z" fill="#e3f2dc" opacity="0.7"/>
              <path d="M${cx - s},${sY + 6} L${cx + s},${sY + 6}
                C${cx + s},${sY + 16} ${cx + c},${bY - 10} ${cx + c},${bY}
                C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY + 4}
                L${cx - w},${wY + 4}
                C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY}
                C${cx - c},${bY - 10} ${cx - s},${sY + 16} ${cx - s},${sY + 6} Z" fill="#f3f7ef" stroke="#d6e4cc" stroke-width="1.5"/>
              ${blooms}` } },
  { id: 'crystal-tux', label: 'Crystal Tuxedo', emoji: '💎', theme: 'metgala', price: 80, fixedColor: true,
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
      const s = bt.shoulderHalf + 3, c = bt.chestHalf + 4, w = bt.waistHalf + 3;
      const jacketHemY = 252;
      const rUpper = bt.limbWidth / 2 * 1.15 + 4;
      const rLower = bt.limbWidth / 2 * 0.68 * 0.9 + 3;
      const legL = capsulePath(133, 248, rUpper, 127, 418, rLower);
      const legR = capsulePath(167, 248, rUpper, 173, 418, rLower);
      const gem = (x, y, r) => `<path d="M${x},${y - r} L${x + r * 0.8},${y} L${x},${y + r} L${x - r * 0.8},${y} Z" fill="#e8f6ff" stroke="#9fc6dd" stroke-width="0.5"/>`;
      const gems = [];
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        gems.push(gem(cx - s + 6 + (c - s + 18) * t * 0.6 + 6, sY + 4 + t * 24, 2.6));
        gems.push(gem(cx + s - 6 - (c - s + 18) * t * 0.6 - 6, sY + 4 + t * 24, 2.6));
      }
      return `<path d="${legL}" fill="#141414"/>
              <path d="${legR}" fill="#141414"/>
              <path d="M${cx - s},${sY} L${cx + s},${sY}
                C${cx + s},${sY + 14} ${cx + c},${bY - 10} ${cx + c},${bY}
                C${cx + c},${bY + 16} ${cx + w},${wY - 10} ${cx + w - 4},${jacketHemY}
                L${cx},${jacketHemY - 14}
                L${cx - w + 4},${jacketHemY}
                C${cx - w},${wY - 10} ${cx - c},${bY + 16} ${cx - c},${bY}
                C${cx - c},${bY - 10} ${cx - s},${sY + 14} ${cx - s},${sY} Z" fill="#141414"/>
              <path d="M${cx - s + 24},${sY} L${cx + s - 24},${sY} L${cx},${bY + 33} Z" fill="#fdfdfd"/>
              <path d="M${cx - 11},${sY + 4} L${cx},${sY + 9} L${cx + 11},${sY + 4} L${cx + 11},${sY + 14} L${cx},${sY + 9} L${cx - 11},${sY + 14} Z" fill="#c0c8d0"/>
              <path d="M${cx - s + 8},${sY + 10} L${cx - w + 8},${jacketHemY - 10}" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.12" stroke-linecap="round"/>
              ${gems.join('')}
              ${gem(cx - c + 12, bY + 30, 3.4)}${gem(cx + c - 14, bY + 44, 3)}${gem(cx - c + 18, wY + 20, 2.6)}` } },
  { id: 'mermaid-tail', label: 'Mermaid Tail', emoji: '🧜‍♀️', theme: 'mermaid',
    hidesLegs: true,
    svg: (bt) => mermaidTailSVG(bt, null) },
  { id: 'ocean-sparkle-tail', label: 'Ocean Sparkle Tail', emoji: '🐚', theme: 'mermaid', fixedColor: true, hidesLegs: true,
    svg: (bt) => mermaidTailSVG(bt, { body: '#3fb8c9', scale: '#1f7a8c', fin: '#9b6be0', finLine: '#6b3fb0', belt: '#ffd6ec' }) },
  { id: 'baggy-jeans', label: 'Baggy Jeans', emoji: '👖', theme: 'classic',
    svg: (bt) => {
      const cx = 150, h = bt.hipHalf + 8;
      const leg = (side) => {
        const outer = cx + side * h, inner = cx + side * 2;
        const outerB = cx + side * (h + 12), innerB = cx + side * 4;
        return `<path d="M${outer},232 L${inner},232 L${inner},262 L${innerB},448 L${outerB},448 Z" fill="#5b86c4" stroke="#3d6199" stroke-width="1.5"/>
          <rect x="${Math.min(outerB, innerB)}" y="438" width="${Math.abs(outerB - innerB)}" height="10" fill="#7aa3d9" stroke="#3d6199" stroke-width="1"/>
          <path d="M${outer + side * -6},330 Q${(outer + inner) / 2},336 ${inner + side * 6},330 M${outerB + side * -6},400 Q${(outerB + innerB) / 2},408 ${innerB + side * 6},402 M${outerB + side * -4},420 Q${(outerB + innerB) / 2},428 ${innerB + side * 4},422" fill="none" stroke="#3d6199" stroke-width="1.2" opacity="0.7"/>
          <path d="M${(outer + inner) / 2},240 L${(outerB + innerB) / 2},436" fill="none" stroke="#e8c468" stroke-width="1" stroke-dasharray="3 3" opacity="0.7"/>`;
      };
      return `${leg(-1)}${leg(1)}
              <rect x="${cx - h}" y="226" width="${h * 2}" height="12" fill="#4a73ad" stroke="#3d6199" stroke-width="1.2"/>
              <rect x="${cx - 4}" y="228" width="8" height="8" rx="1" fill="#e8c468"/>
              <path d="M${cx - h + 6},240 Q${cx - h + 14},256 ${cx - 10},244 M${cx + h - 6},240 Q${cx + h - 14},256 ${cx + 10},244" fill="none" stroke="#e8c468" stroke-width="1" stroke-dasharray="2 2"/>
              ${fittedTopSVG(bt, 228, null)}
              <path d="M${cx - 12},${TORSO_Y.shoulder} Q${cx},${TORSO_Y.shoulder + 12} ${cx + 12},${TORSO_Y.shoulder}" fill="none" stroke="#000000" stroke-width="1.5" opacity="0.15"/>` } },
  { id: 'uniform-skirt', label: 'School Uniform', emoji: '🏫', theme: 'school',
    svg: (bt) => {
      const cx = 150, wY = TORSO_Y.waist;
      const top = wY + 4, hemY = 322;
      const tw = bt.waistHalf + 6, hw = bt.hipHalf + 30;
      const pleats = Array.from({ length: 7 }, (_, i) => {
        const f = -1 + (2 * (i + 0.5)) / 7;
        return `<line x1="${cx + f * tw}" y1="${top}" x2="${cx + f * hw}" y2="${hemY}" stroke="#000000" stroke-width="1.2" opacity="0.18"/>`;
      }).join('');
      const plaid = [0.3, 0.55, 0.8].map((k) => {
        const y = top + (hemY - top) * k, half = tw + (hw - tw) * k;
        return `<line x1="${cx - half}" y1="${y}" x2="${cx + half}" y2="${y}" stroke="#ffffff" stroke-width="2" opacity="0.45"/>
                <line x1="${cx - half}" y1="${y + 5}" x2="${cx + half}" y2="${y + 5}" stroke="#1b1b2e" stroke-width="1.5" opacity="0.35"/>`;
      }).join('') + [-0.6, -0.2, 0.2, 0.6].map((f) =>
        `<line x1="${cx + f * tw}" y1="${top}" x2="${cx + f * hw}" y2="${hemY}" stroke="#ffffff" stroke-width="2" opacity="0.4"/>`).join('');
      return `<path d="M${cx - tw},${top} L${cx + tw},${top} L${cx + hw},${hemY} L${cx - hw},${hemY} Z"/>
              ${plaid}${pleats}
              ${fittedTopSVG(bt, wY + 10, '#fdfdfd')}
              <path d="M${cx - 18},${TORSO_Y.shoulder - 2} L${cx},${TORSO_Y.shoulder + 10} L${cx - 4},${TORSO_Y.shoulder + 16} Z M${cx + 18},${TORSO_Y.shoulder - 2} L${cx},${TORSO_Y.shoulder + 10} L${cx + 4},${TORSO_Y.shoulder + 16} Z" fill="#ffffff" stroke="#d6d6d6" stroke-width="1"/>
              <path d="M${cx},${TORSO_Y.shoulder + 12} L${cx - 15},${TORSO_Y.shoulder + 4} L${cx - 15},${TORSO_Y.shoulder + 20} Z M${cx},${TORSO_Y.shoulder + 12} L${cx + 15},${TORSO_Y.shoulder + 4} L${cx + 15},${TORSO_Y.shoulder + 20} Z" fill="#d93b4a"/>
              <circle cx="${cx}" cy="${TORSO_Y.shoulder + 12}" r="3.6" fill="#a82432"/>
              ${[175, 192, 209].map((y) => `<circle cx="${cx}" cy="${y}" r="1.8" fill="#d6d6d6"/>`).join('')}` } },
  { id: 'uniform-trousers', label: 'Uniform & Trousers', emoji: '📚', theme: 'school',
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder;
      const rUpper = bt.limbWidth / 2 * 1.15 + 4;
      const rLower = bt.limbWidth / 2 * 0.68 * 0.9 + 4;
      const legL = capsulePath(133, 248, rUpper, 127, 430, rLower);
      const legR = capsulePath(167, 248, rUpper, 173, 430, rLower);
      const s = bt.shoulderHalf - 6;
      return `<path d="${legL}" fill="#5a5f6e"/>
              <path d="${legR}" fill="#5a5f6e"/>
              <line x1="133" y1="260" x2="128" y2="426" stroke="#000000" stroke-width="1" opacity="0.2"/>
              <line x1="167" y1="260" x2="172" y2="426" stroke="#000000" stroke-width="1" opacity="0.2"/>
              ${fittedTopSVG(bt, 252, '#fdfdfd')}
              <path d="M${cx - s},${sY + 4} L${cx - 10},${sY + 4} L${cx},${sY + 40} L${cx + 10},${sY + 4} L${cx + s},${sY + 4}
                L${cx + torsoHalfAt(bt, 248) + 4},248 L${cx - torsoHalfAt(bt, 248) - 4},248 Z"/>
              <path d="M${cx - s + 4},${sY + 10} L${cx - torsoHalfAt(bt, 240)},244" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.15" stroke-linecap="round"/>
              <path d="M${cx - 16},${sY - 2} L${cx},${sY + 8} L${cx - 6},${sY + 14} Z M${cx + 16},${sY - 2} L${cx},${sY + 8} L${cx + 6},${sY + 14} Z" fill="#ffffff" stroke="#d6d6d6" stroke-width="1"/>
              <path d="M${cx - 4},${sY + 8} L${cx + 4},${sY + 8} L${cx + 6},${sY + 44} L${cx},${sY + 52} L${cx - 6},${sY + 44} Z" fill="#d93b4a"/>
              <path d="M${cx - 4},${sY + 8} L${cx + 4},${sY + 8} L${cx + 3},${sY + 14} L${cx - 3},${sY + 14} Z" fill="#a82432"/>
              <rect x="${cx + 10}" y="${sY + 22}" width="12" height="10" rx="2" fill="#f2c94c" opacity="0.9"/>` } },
  { id: 'jester-suit', label: 'Jester Suit & Mask', emoji: '🃏', price: 250, fixedColor: true,
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, hip: hY } = TORSO_Y;
      const A = '#7b3fbf', B = '#f2c94c', C = '#2bb3a3';
      const rUpper = bt.limbWidth / 2 * 1.15 + 4;
      const rLower = bt.limbWidth / 2 * 0.68 * 0.9 + 3;
      const legL = capsulePath(133, 248, rUpper, 127, 418, rLower);
      const legR = capsulePath(167, 248, rUpper, 173, 418, rLower);
      const s = bt.shoulderHalf + 3, c = bt.chestHalf + 3, w = bt.waistHalf + 3, h = bt.hipHalf + 3;
      const { chest: bY, waist: wY } = TORSO_Y;
      const rightHalf = `M${cx},${sY} L${cx + s},${sY} C${cx + s},${sY + 14} ${cx + c},${bY - 10} ${cx + c},${bY}
        C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY} C${cx + w},${wY + 16} ${cx + h},${hY - 18} ${cx + h},${hY} L${cx},${hY} Z`;
      const diamond = (x, y, col) => `<path d="M${x},${y - 9} L${x + 6},${y} L${x},${y + 9} L${x - 6},${y} Z" fill="${col}"/>`;
      let diamonds = '';
      for (let y = 168, r = 0; y <= 240; y += 18, r++) {
        const half = torsoHalfAt(bt, y) + 1;
        for (let x = 10 + (r % 2) * 6; x < half - 4; x += 14) {
          diamonds += diamond(cx - x, y, B) + diamond(cx + x, y, A);
        }
      }
      const ruff = Array.from({ length: 9 }, (_, i) => {
        const x0 = cx - 40 + i * 10;
        return `<path d="M${x0},${sY - 4} L${x0 + 10},${sY - 4} L${x0 + 5},${sY + 16} Z" fill="${i % 2 ? C : A}"/><circle cx="${x0 + 5}" cy="${sY + 17}" r="2.6" fill="${B}" stroke="#c98f1f" stroke-width="0.6"/>`;
      }).join('');
      const bell = (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="${B}" stroke="#c98f1f" stroke-width="1"/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="1.4" fill="#fff7d6"/>`;
      return `<path d="${legL}" fill="${B}"/>
              <path d="${legR}" fill="${A}"/>
              ${diamond(130, 330, A)}${diamond(126, 380, A)}${diamond(170, 330, B)}${diamond(174, 380, B)}
              <path d="${bodyTorsoPath(bt, 3)}" fill="${A}"/>
              <path d="${rightHalf}" fill="${B}"/>
              ${diamonds}
              <rect x="${cx - w - 2}" y="${wY - 3}" width="${(w + 2) * 2}" height="7" fill="${C}"/>
              ${ruff}
              <path d="M106,58 Q90,34 78,56 Q70,72 84,80 Q88,64 106,64 Z" fill="${A}"/>
              <path d="M194,58 Q210,34 222,56 Q230,72 216,80 Q212,64 194,64 Z" fill="${C}"/>
              <path d="M122,52 Q140,6 150,-2 Q160,6 178,52 Z" fill="${B}"/>
              <path d="M102,52 Q150,40 198,52 L198,66 Q150,56 102,66 Z" fill="${C}" stroke="#1f7a8c" stroke-width="1"/>
              ${bell(84, 82)}${bell(216, 82)}${bell(150, -2)}
              <path fill-rule="evenodd" d="M110,86 Q114,74 132,76 Q146,77 150,84 Q154,77 168,76 Q186,74 190,86 Q186,104 168,102 Q156,101 150,94 Q144,101 132,102 Q114,104 110,86 Z
                M121,90 Q124,82 132,82 Q141,82 143,90 Q140,97 132,97 Q124,97 121,90 Z
                M157,90 Q160,82 168,82 Q176,82 179,90 Q176,97 168,97 Q160,97 157,90 Z" fill="${B}" stroke="${A}" stroke-width="1.6"/>
              <path d="M112,80 l3,-7 l3,7 Z M182,80 l3,-7 l3,7 Z" fill="${A}"/>
              <circle cx="150" cy="82" r="2.4" fill="${C}"/>` } },
  { id: 'ruffle-swimsuit', label: 'Ruffle Swimsuit', emoji: '👙', theme: 'summer',
    svg: (bt) => {
      const cx = 150, topY = TORSO_Y.shoulder + 16;
      const t = torsoHalfAt(bt, topY) + 3;
      const ruffles = Array.from({ length: 7 }, (_, i) => {
        const x = cx - t + 4 + i * ((2 * t - 8) / 6);
        return `<circle cx="${x.toFixed(1)}" cy="${topY + 1}" r="5.5" stroke="#000000" stroke-opacity="0.15" stroke-width="1"/>`;
      }).join('');
      return `${swimsuitSVG(bt, null)}${ruffles}
              <path d="M${cx},${topY + 8} L${cx - 9},${topY + 3} L${cx - 9},${topY + 13} Z M${cx},${topY + 8} L${cx + 9},${topY + 3} L${cx + 9},${topY + 13} Z" fill="#ffffff"/>
              <circle cx="${cx}" cy="${topY + 8}" r="2.6" fill="#ffffff"/>`;
    } },
  { id: 'polka-swimsuit', label: 'Polka Dot Swimsuit', emoji: '🔴', theme: 'summer', fixedColor: true,
    svg: (bt) => {
      const cx = 150;
      let dots = '';
      for (let y = 178, r = 0; y <= 250; y += 14, r++) {
        const half = torsoHalfAt(bt, y) - 2;
        for (let x = -half + 6 + (r % 2) * 7; x <= half - 4; x += 14) dots += `<circle cx="${(cx + x).toFixed(1)}" cy="${y}" r="3.2" fill="#ffffff"/>`;
      }
      return `${swimsuitSVG(bt, '#e05c5c')}${dots}
              <rect x="${cx - bt.waistHalf - 3}" y="${TORSO_Y.waist - 3}" width="${(bt.waistHalf + 3) * 2}" height="6" fill="#ffffff" opacity="0.9"/>`;
    } },
  { id: 'board-shorts', label: 'Surf Shorts & Rash Guard', emoji: '🏄', theme: 'summer',
    svg: (bt) => {
      const cx = 150, h = bt.hipHalf + 6;
      const leg = (side) => {
        const outer = cx + side * h, outerB = cx + side * (h + 4), inner = cx + side * 2;
        return `<path d="M${outer},230 L${inner},230 L${inner},262 L${cx + side * 4},322 L${outerB},322 Z" stroke="#000000" stroke-opacity="0.2" stroke-width="1.2"/>`;
      };
      const flower = (x, y) => `<g fill="#ffffff" opacity="0.8">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${x}" cy="${y - 4}" rx="2.4" ry="4.2" transform="rotate(${a} ${x} ${y})"/>`).join('')}</g><circle cx="${x}" cy="${y}" r="1.8" fill="#f2c94c"/>`;
      const leaf = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="2.6" fill="#ffffff" opacity="0.45" transform="rotate(${r} ${x} ${y})"/>`;
      return `${leg(-1)}${leg(1)}
              <rect x="${cx - h}" y="226" width="${h * 2}" height="9"/>
              <path d="M${cx - 6},230 L${cx - 2},242 M${cx + 6},230 L${cx + 2},242" stroke="#ffffff" stroke-width="1.4"/>
              ${flower(cx - h + 14, 262)}${flower(cx + h - 12, 290)}${flower(cx - 14, 304)}${leaf(cx + 18, 254, 30)}${leaf(cx - h + 10, 300, -40)}${leaf(cx + h - 8, 312, 20)}
              ${fittedTopSVG(bt, 230, '#ffffff')}
              <path d="M${cx - torsoHalfAt(bt, 196) - 4},196 L${cx + torsoHalfAt(bt, 196) + 4},196 M${cx - torsoHalfAt(bt, 206) - 4},206 L${cx + torsoHalfAt(bt, 206) + 4},206" stroke="#5cc4e0" stroke-width="5"/>
              <path d="M${cx - 12},${TORSO_Y.shoulder} Q${cx},${TORSO_Y.shoulder + 12} ${cx + 12},${TORSO_Y.shoulder}" fill="none" stroke="#5cc4e0" stroke-width="3"/>`;
    } },
  { id: 'ruffle-dress', label: 'Ruffle Dress', emoji: '💗', price: 100,
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
      const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4;
      const tier = (i) => {
        const top = wY + i * 38, bot = top + 48;
        const th = w + i * 16, bh = w + (i + 1) * 16 + 14;
        const n = 6 + i * 2, step = (bh * 2) / n;
        let hem = '';
        for (let k = 0; k < n; k++) {
          const x0 = cx + bh - step * k;
          hem += ` Q${(x0 - step / 2).toFixed(1)},${bot + 10} ${(x0 - step).toFixed(1)},${bot}`;
        }
        const folds = Array.from({ length: n - 1 }, (_, k) => {
          const f = -1 + (2 * (k + 1)) / n;
          return `<line x1="${(cx + f * th).toFixed(1)}" y1="${top + 4}" x2="${(cx + f * bh).toFixed(1)}" y2="${bot}" stroke="#000000" stroke-width="1" opacity="0.12"/>`;
        }).join('');
        return `<path d="M${cx - th},${top} L${cx + th},${top} L${cx + bh},${bot}${hem} Z" stroke="#000000" stroke-opacity="0.15" stroke-width="1"/>
                ${folds}
                <path d="M${cx - th},${top + 2} Q${cx},${top + 6} ${cx + th},${top + 2}" fill="none" stroke="#000000" stroke-width="1.5" opacity="0.15"/>`;
      };
      const neck = Array.from({ length: 7 }, (_, i) => `<circle cx="${(cx - s + 4 + i * ((2 * s - 8) / 6)).toFixed(1)}" cy="${sY + 1}" r="5" stroke="#000000" stroke-opacity="0.15" stroke-width="1"/>`).join('');
      return `${tier(2)}${tier(1)}${tier(0)}
              <path d="M${cx - s},${sY} L${cx + s},${sY}
                C${cx + s},${sY + 14} ${cx + c},${bY - 10} ${cx + c},${bY}
                C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY + 4}
                L${cx - w},${wY + 4}
                C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY}
                C${cx - c},${bY - 10} ${cx - s},${sY + 14} ${cx - s},${sY} Z"/>
              <ellipse cx="${cx - s - 2}" cy="${sY + 8}" rx="11" ry="9" stroke="#000000" stroke-opacity="0.15" stroke-width="1"/>
              <ellipse cx="${cx + s + 2}" cy="${sY + 8}" rx="11" ry="9" stroke="#000000" stroke-opacity="0.15" stroke-width="1"/>
              ${neck}
              <rect x="${cx - w}" y="${wY - 3}" width="${w * 2}" height="7" fill="#ffffff" opacity="0.9"/>
              <path d="M${cx},${wY} L${cx - 13},${wY - 7} L${cx - 13},${wY + 7} Z M${cx},${wY} L${cx + 13},${wY - 7} L${cx + 13},${wY + 7} Z" fill="#ffffff"/>
              <circle cx="${cx}" cy="${wY}" r="3" fill="#ffffff" stroke="#e7d6e0" stroke-width="1"/>
              <path d="M${cx - s + 7},${sY + 8} L${cx - w + 2},${wY}" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.15" stroke-linecap="round"/>`;
    } },
  { id: 'polka-party-dress', label: 'Polka Dot Party Dress', emoji: '🎉', theme: 'party',
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
      const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4;
      const hemY = 330, hemHalf = bt.hipHalf + 54;
      const halfAt = (y) => (y <= wY ? torsoHalfAt(bt, y) + 3 : w + (hemHalf - w) * Math.pow((y - wY) / (hemY - wY), 0.7));
      let dots = '';
      for (let y = sY + 18, r = 0; y < hemY - 6; y += 15, r++) {
        const half = halfAt(y) - 6;
        for (let x = -half + (r % 2) * 8; x <= half; x += 16) {
          if (Math.abs(y - wY) < 6) continue;
          dots += `<circle cx="${(cx + x).toFixed(1)}" cy="${y}" r="3.6" fill="#ffffff"/>`;
        }
      }
      let tulle = '';
      const n = 12, step = (hemHalf * 2 + 8) / n;
      for (let k = 0; k < n; k++) {
        const x0 = cx + hemHalf + 4 - step * k;
        tulle += ` Q${(x0 - step / 2).toFixed(1)},${hemY + 16} ${(x0 - step).toFixed(1)},${hemY + 6}`;
      }
      return `<path d="M${cx - hemHalf - 4},${hemY - 6} L${cx + hemHalf + 4},${hemY - 6} L${cx + hemHalf + 4},${hemY + 6}${tulle} Z" fill="#ffffff" stroke="#e7d6e0" stroke-width="1"/>
              <path d="M${cx - s},${sY} L${cx + s},${sY}
                C${cx + s},${sY + 14} ${cx + c},${bY - 10} ${cx + c},${bY}
                C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY}
                Q${cx + hemHalf - 10},${wY + 50} ${cx + hemHalf},${hemY} Q${cx},${hemY + 14} ${cx - hemHalf},${hemY}
                Q${cx - hemHalf + 10},${wY + 50} ${cx - w},${wY}
                C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY}
                C${cx - c},${bY - 10} ${cx - s},${sY + 14} ${cx - s},${sY} Z"/>
              ${dots}
              <path d="M${cx - s + 7},${sY + 6} L${cx - w},${wY + 80}" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.15" stroke-linecap="round"/>
              <rect x="${cx - w}" y="${wY - 4}" width="${w * 2}" height="9" rx="3" fill="#f2c94c"/>
              <path d="M${cx + w - 8},${wY} q14,-12 20,0 q-6,12 -20,0 Z M${cx + w - 8},${wY} l6,22 l5,-3 Z M${cx + w - 8},${wY} l14,18 l3,-5 Z" fill="#f2c94c" stroke="#c98f1f" stroke-width="0.8"/>` } },
  { id: 'christmas-dress', label: 'Christmas Party Dress', emoji: '🎄', theme: 'christmas', price: 100, fixedColor: true,
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
      const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4;
      const hemY = 336, hemHalf = bt.hipHalf + 50;
      const fur = (x0, x1, y, r) => {
        let out = `<rect x="${x0}" y="${y - r}" width="${x1 - x0}" height="${r * 2}" rx="${r}" fill="#f8f8f8"/>`;
        for (let x = x0 + r; x <= x1 - r; x += r * 1.4) out += `<circle cx="${x.toFixed(1)}" cy="${(y + ((x / r) % 2 > 1 ? -r * 0.5 : r * 0.5)).toFixed(1)}" r="${r}" fill="#f8f8f8"/>`;
        return out;
      };
      const flake = (x, y, r) => `<g stroke="#f2c94c" stroke-width="1.3" stroke-linecap="round">
          <line x1="${x - r}" y1="${y}" x2="${x + r}" y2="${y}"/><line x1="${x - r * 0.5}" y1="${y - r * 0.87}" x2="${x + r * 0.5}" y2="${y + r * 0.87}"/>
          <line x1="${x - r * 0.5}" y1="${y + r * 0.87}" x2="${x + r * 0.5}" y2="${y - r * 0.87}"/></g>`;
      return `<path d="M${cx - s},${sY} L${cx + s},${sY}
                C${cx + s},${sY + 14} ${cx + c},${bY - 10} ${cx + c},${bY}
                C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY}
                Q${cx + hemHalf - 12},${wY + 46} ${cx + hemHalf},${hemY} Q${cx},${hemY + 14} ${cx - hemHalf},${hemY}
                Q${cx - hemHalf + 12},${wY + 46} ${cx - w},${wY}
                C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY}
                C${cx - c},${bY - 10} ${cx - s},${sY + 14} ${cx - s},${sY} Z" fill="#c1272d"/>
              <path d="M${cx - s + 7},${sY + 6} L${cx - w},${wY + 90}" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.15" stroke-linecap="round"/>
              <path d="M${cx + 16},${wY + 10} Q${cx + 30},${wY + 70} ${cx + hemHalf - 16},${hemY - 6}" fill="none" stroke="#8e1b20" stroke-width="2" opacity="0.4"/>
              ${flake(cx - 30, wY + 50, 6)}${flake(cx + 26, wY + 80, 5)}${flake(cx - 10, wY + 104, 5)}${flake(cx - hemHalf + 30, hemY - 20, 4)}${flake(cx + hemHalf - 34, wY + 40, 4)}
              ${fur(cx - hemHalf - 2, cx + hemHalf + 2, hemY + 2, 6)}
              ${fur(cx - s - 2, cx + s + 2, sY + 2, 5)}
              <rect x="${cx - w}" y="${wY - 5}" width="${w * 2}" height="10" rx="3" fill="#1e7a46"/>
              <path d="M${cx},${wY} q-16,-14 -22,0 q6,14 22,0 Z M${cx},${wY} q16,-14 22,0 q-6,14 -22,0 Z" fill="#1e7a46" stroke="#145c33" stroke-width="1"/>
              <path d="M${cx - 6},${wY + 4} L${cx - 14},${wY + 26} L${cx - 8},${wY + 24} Z M${cx + 6},${wY + 4} L${cx + 14},${wY + 26} L${cx + 8},${wY + 24} Z" fill="#1e7a46"/>
              <ellipse cx="${cx - c + 10}" cy="${bY + 2}" rx="7" ry="3.5" fill="#2e9e5a" transform="rotate(-25 ${cx - c + 10} ${bY + 2})"/>
              <ellipse cx="${cx - c + 20}" cy="${bY - 2}" rx="7" ry="3.5" fill="#2e9e5a" transform="rotate(25 ${cx - c + 20} ${bY - 2})"/>
              <circle cx="${cx - c + 14}" cy="${bY + 4}" r="2.6" fill="#ff3b3b"/><circle cx="${cx - c + 18}" cy="${bY + 6}" r="2.6" fill="#ff3b3b"/>
              <circle cx="${cx}" cy="${wY}" r="4" fill="#f2c94c"/>`;
    } },
  { id: 'hero-suit', label: 'Hero Suit', emoji: '🦸', theme: 'superhero',
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder, wY = TORSO_Y.waist;
      const rUpper = bt.limbWidth / 2 * 1.15 + 4;
      const rLower = bt.limbWidth / 2 * 0.68 * 0.9 + 3;
      const legL = capsulePath(133, 248, rUpper, 127, 418, rLower);
      const legR = capsulePath(167, 248, rUpper, 173, 418, rLower);
      const bootL = capsulePath(128.5, 372, rLower + 3.5, 127, 424, rLower + 3);
      const bootR = capsulePath(171.5, 372, rLower + 3.5, 173, 424, rLower + 3);
      const w = bt.waistHalf + 4;
      return `<path d="${legL}"/><path d="${legR}"/>
              <path d="${bootL}" fill="#2b2b4a"/><path d="${bootR}" fill="#2b2b4a"/>
              <path d="M${128.5 - rLower - 4},374 L${128.5 + rLower + 4},374 L${128.5 + rLower + 2},382 L${128.5 - rLower - 2},382 Z M${171.5 - rLower - 4},374 L${171.5 + rLower + 4},374 L${171.5 + rLower + 2},382 L${171.5 - rLower - 2},382 Z" fill="#f2c94c"/>
              <path d="${bodyTorsoPath(bt, 3)}"/>
              <path d="M${cx - torsoHalfAt(bt, 180) - 3},180 L${cx - torsoHalfAt(bt, 180) + 8},196 L${cx - torsoHalfAt(bt, 214) - 3},214 L${cx - torsoHalfAt(bt, 214) + 6},236 M${cx + torsoHalfAt(bt, 180) + 3},180 L${cx + torsoHalfAt(bt, 180) - 8},196 L${cx + torsoHalfAt(bt, 214) + 3},214 L${cx + torsoHalfAt(bt, 214) - 6},236" fill="none" stroke="#f2c94c" stroke-width="3" stroke-linejoin="round"/>
              <circle cx="${cx}" cy="${sY + 30}" r="17" fill="#ffffff" stroke="#f2c94c" stroke-width="3"/>
              <path d="M${cx},${sY + 17} L${cx + 4},${sY + 26} L${cx + 13},${sY + 27} L${cx + 6},${sY + 33} L${cx + 8},${sY + 42} L${cx},${sY + 37} L${cx - 8},${sY + 42} L${cx - 6},${sY + 33} L${cx - 13},${sY + 27} L${cx - 4},${sY + 26} Z" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/>
              <rect x="${cx - w}" y="${wY + 10}" width="${w * 2}" height="9" rx="2" fill="#f2c94c"/>
              <rect x="${cx - 8}" y="${wY + 8}" width="16" height="13" rx="3" fill="#ffd76a" stroke="#c98f1f" stroke-width="1"/>
              <path d="M${cx - bt.chestHalf + 6},158 L${cx - bt.waistHalf + 2},${wY + 6}" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.16" stroke-linecap="round"/>`;
    } },
  { id: 'hero-dress', label: 'Hero Dress', emoji: '⚡', theme: 'superhero',
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder, wY = TORSO_Y.waist;
      const w = bt.waistHalf + 4, hemY = 300, hemHalf = bt.hipHalf + 36;
      let zig = '';
      const n = 8, step = (hemHalf * 2) / n;
      for (let k = 0; k < n; k++) {
        const x0 = cx + hemHalf - step * k;
        zig += ` L${(x0 - step / 2).toFixed(1)},${hemY + 12} L${(x0 - step).toFixed(1)},${hemY}`;
      }
      return `<path d="M${cx - w},${wY + 4} L${cx + w},${wY + 4} L${cx + hemHalf},${hemY}${zig} Z"/>
              <path d="M${cx - w + 6},${wY + 8} L${cx - hemHalf + 14},${hemY - 4}" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.15" stroke-linecap="round"/>
              ${fittedTopSVG(bt, wY + 8, null)}
              <path d="M${cx + 4},${sY + 14} L${cx - 10},${sY + 34} L${cx},${sY + 34} L${cx - 6},${sY + 52} L${cx + 12},${sY + 28} L${cx + 2},${sY + 28} Z" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/>
              <rect x="${cx - w}" y="${wY - 1}" width="${w * 2}" height="9" rx="2" fill="#f2c94c"/>
              <circle cx="${cx}" cy="${wY + 3.5}" r="5" fill="#ffd76a" stroke="#c98f1f" stroke-width="1"/>`;
    } },
  { id: 'rainbow-tutu', label: 'Rainbow Tutu Dress', emoji: '🌈', price: 80, fixedColor: true, shopLabel: 'Dress',
    svg: (bt) => {
      const cx = 150, wY = TORSO_Y.waist;
      const colors = ['#9b6be0', '#5c7ce0', '#5cc4e0', '#43b581', '#f2c94c', '#ff9a5c', '#e05c5c'];
      let tutu = '';
      colors.forEach((col, i) => {
        const hemY = wY + 96 - i * 12, half = bt.hipHalf + 50 - i * 6, top = bt.waistHalf + 4;
        const n = 10, step = (half * 2) / n;
        let hem = '';
        for (let k = 0; k < n; k++) {
          const x0 = cx + half - step * k;
          hem += ` Q${(x0 - step / 2).toFixed(1)},${hemY + 9} ${(x0 - step).toFixed(1)},${hemY}`;
        }
        tutu += `<path d="M${cx - top},${wY} L${cx + top},${wY} L${cx + half},${hemY}${hem} Z" fill="${col}" opacity="0.95"/>`;
      });
      return `${tutu}
              ${fittedTopSVG(bt, wY + 4, '#ffffff')}
              <path d="M${cx - torsoHalfAt(bt, 186) - 3},186 L${cx + torsoHalfAt(bt, 186) + 3},186" stroke="#ff8fc7" stroke-width="4"/>
              <path d="M${cx - torsoHalfAt(bt, 192) - 3},192 L${cx + torsoHalfAt(bt, 192) + 3},192" stroke="#f2c94c" stroke-width="4"/>
              <path d="M${cx - torsoHalfAt(bt, 198) - 3},198 L${cx + torsoHalfAt(bt, 198) + 3},198" stroke="#5cc4e0" stroke-width="4"/>
              <path d="M${cx},${TORSO_Y.shoulder + 10} l2,4 l4,1 l-3,3 l1,4 l-4,-2 l-4,2 l1,-4 l-3,-3 l4,-1 Z" fill="#f2c94c"/>`;
    } },
  { id: 'galaxy-gown', label: 'Galaxy Gown', emoji: '🌌', price: 150, fixedColor: true,
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
      const s = bt.shoulderHalf + 2, c = bt.chestHalf + 3, w = bt.waistHalf + 4;
      const hemY = 416, hemHalf = bt.hipHalf + 66;
      const stars = [[-40, 260, 2], [30, 240, 1.6], [-10, 300, 2.2], [52, 320, 1.8], [-70, 360, 2], [20, 370, 1.6], [70, 390, 2.2], [-30, 395, 1.8], [0, 340, 1.4], [-56, 300, 1.4], [44, 280, 1.4], [8, 200, 1.6], [-18, 180, 1.4]]
        .map(([x, y, r]) => `<circle cx="${cx + x}" cy="${y}" r="${r}" fill="#ffffff"/>`).join('');
      const sparkle = (x, y, r) => `<path d="M${cx + x},${y - r} L${cx + x + r * 0.3},${y - r * 0.3} L${cx + x + r},${y} L${cx + x + r * 0.3},${y + r * 0.3} L${cx + x},${y + r} L${cx + x - r * 0.3},${y + r * 0.3} L${cx + x - r},${y} L${cx + x - r * 0.3},${y - r * 0.3} Z" fill="#fff7d6"/>`;
      return `<path d="M${cx - w},${wY} L${cx + w},${wY} L${cx + hemHalf},${hemY} Q${cx},${hemY + 24} ${cx - hemHalf},${hemY} Z" fill="#241a4d"/>
              <path d="M${cx - w + 10},${wY} L${cx + w - 10},${wY} L${cx + hemHalf - 40},${hemY - 4} Q${cx},${hemY + 10} ${cx - hemHalf + 40},${hemY - 4} Z" fill="#5a3aa8" opacity="0.45"/>
              <path d="M${cx - hemHalf + 20},${hemY - 30} Q${cx},${hemY - 90} ${cx + hemHalf - 10},${hemY - 50}" fill="none" stroke="#ff8fc7" stroke-width="10" opacity="0.18" stroke-linecap="round"/>
              ${stars}${sparkle(-46, 330, 6)}${sparkle(40, 260, 5)}${sparkle(14, 395, 6)}
              <circle cx="${cx + 48}" cy="350" r="11" fill="#ff9a5c"/>
              <ellipse cx="${cx + 48}" cy="350" rx="19" ry="5" fill="none" stroke="#f2c94c" stroke-width="2" transform="rotate(-18 ${cx + 48} 350)"/>
              <circle cx="${cx - 50}" cy="250" r="8" fill="#fff4c2"/><circle cx="${cx - 46}" cy="247" r="7" fill="#241a4d"/>
              <path d="M${cx - s},${sY} L${cx + s},${sY}
                C${cx + s},${sY + 14} ${cx + c},${bY - 10} ${cx + c},${bY}
                C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY + 4}
                L${cx - w},${wY + 4}
                C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY}
                C${cx - c},${bY - 10} ${cx - s},${sY + 14} ${cx - s},${sY} Z" fill="#2f2366"/>
              ${sparkle(-12, 176, 4)}${sparkle(14, 194, 3)}
              <rect x="${cx - w}" y="${wY - 2}" width="${w * 2}" height="6" fill="#c9a6ff"/>`;
    } },
  { id: 'rockstar', label: 'Rockstar Outfit', emoji: '🎸', price: 90, fixedColor: true, shopLabel: 'Outfit',
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder;
      const rUpper = bt.limbWidth / 2 * 1.15 + 3;
      const rLower = bt.limbWidth / 2 * 0.68 * 0.9 + 3;
      const legL = capsulePath(133, 248, rUpper, 127, 428, rLower);
      const legR = capsulePath(167, 248, rUpper, 173, 428, rLower);
      const hw = torsoHalfAt(bt, 244) + 5;
      const jacketSide = (d) => {
        const sh = bt.shoulderHalf + 4;
        return `<path d="M${cx + d * 10},${sY} L${cx + d * sh},${sY} C${cx + d * (sh + 2)},${sY + 30} ${cx + d * (bt.chestHalf + 6)},${sY + 40} ${cx + d * (bt.waistHalf + 6)},${TORSO_Y.waist}
                L${cx + d * hw},246 L${cx + d * 12},246 L${cx + d * 16},${sY + 44} Z" fill="#1d1d24"/>
                <path d="M${cx + d * 10},${sY} L${cx + d * 24},${sY} L${cx + d * 18},${sY + 30} Z" fill="#2c2c36"/>
                ${[0, 1, 2, 3].map((i) => `<circle cx="${cx + d * (13 + i * 1.2)}" cy="${sY + 8 + i * 9}" r="1.6" fill="#d6dbe2"/>`).join('')}`;
      };
      return `<path d="${legL}" fill="#1d1d24"/><path d="${legR}" fill="#1d1d24"/>
              <line x1="${133 - rUpper + 3}" y1="256" x2="${127 - rLower + 2}" y2="424" stroke="#ff6fb0" stroke-width="3"/>
              <line x1="${167 + rUpper - 3}" y1="256" x2="${173 + rLower - 2}" y2="424" stroke="#ff6fb0" stroke-width="3"/>
              ${fittedTopSVG(bt, 244, '#ff6fb0')}
              <path d="M${cx},${sY + 26} L${cx + 5},${sY + 36} L${cx},${sY + 36} L${cx + 4},${sY + 50} L${cx - 6},${sY + 32} L${cx - 1},${sY + 32} Z" fill="#ffffff"/>
              ${jacketSide(-1)}${jacketSide(1)}
              <ellipse cx="${cx - bt.shoulderHalf - 4}" cy="${sY + 12}" rx="12" ry="14" fill="#1d1d24"/>
              <ellipse cx="${cx + bt.shoulderHalf + 4}" cy="${sY + 12}" rx="12" ry="14" fill="#1d1d24"/>
              <rect x="${cx - hw}" y="240" width="${hw * 2}" height="8" fill="#2c2c36"/>
              ${[-0.7, -0.35, 0.35, 0.7].map((f) => `<circle cx="${cx + f * hw}" cy="244" r="2" fill="#d6dbe2"/>`).join('')}`;
    } },
  { id: 'unicorn-hoodie', label: 'Unicorn Hoodie', emoji: '🦄', price: 60, fixedColor: true, shopLabel: 'Outfit',
    svg: (bt) => {
      const cx = 150;
      const rUpper = bt.limbWidth / 2 * 1.15 + 3;
      const rLower = bt.limbWidth / 2 * 0.68 * 0.9 + 3;
      const legL = capsulePath(133, 248, rUpper, 127, 424, rLower);
      const legR = capsulePath(167, 248, rUpper, 173, 424, rLower);
      const mane = ['#ff8fc7', '#f2c94c', '#5cc4e0', '#9b6be0', '#43b581'];
      return `<path d="${legL}" fill="#c9a6ff"/><path d="${legR}" fill="#c9a6ff"/>
              ${fittedTopSVG(bt, 262, '#f6e6ff')}
              <path d="M${cx - 30},230 L${cx + 30},230 L${cx + 26},254 L${cx - 26},254 Z" fill="#ead2ff" stroke="#d9c2f0" stroke-width="1"/>
              <path d="M${cx - 8},152 L${cx - 10},180 M${cx + 8},152 L${cx + 10},180" stroke="#ff8fc7" stroke-width="2" stroke-linecap="round"/>
              <circle cx="${cx - 10}" cy="182" r="2.6" fill="#ff8fc7"/><circle cx="${cx + 10}" cy="182" r="2.6" fill="#ff8fc7"/>
              <path d="M${cx},196 l3,6 l7,1 l-5,5 l1,7 l-6,-3 l-6,3 l1,-7 l-5,-5 l7,-1 Z" fill="#ff8fc7"/>
              ${mane.map((col, i) => `<ellipse cx="${200 + (i % 2) * 4}" cy="${62 + i * 16}" rx="8" ry="11" fill="${col}"/>`).join('')}
              <path fill-rule="evenodd" d="M150,30 A58,60 0 1 1 149.9,30 Z M150,56 A38,42 0 1 0 150.1,56 Z" fill="#f6e6ff" stroke="#d9c2f0" stroke-width="1.5"/>
              <path d="M116,46 L112,22 L132,38 Z M184,46 L188,22 L168,38 Z" fill="#f6e6ff" stroke="#d9c2f0" stroke-width="1.2"/>
              <path d="M118,40 L116,28 L127,37 Z M182,40 L184,28 L173,37 Z" fill="#ff8fc7"/>
              <path d="M142,34 L150,2 L158,34 Z" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/>
              <path d="M144,26 L156,22 M145,18 L155,14 M147,10 L153,8" stroke="#c98f1f" stroke-width="1"/>`;
    } },
  { id: 'glitter-bomber', label: 'Glitter Bomber Jacket', emoji: '✨', price: 70, shopLabel: 'Outfit',
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder;
      const rUpper = bt.limbWidth / 2 * 1.15 + 3;
      const rLower = bt.limbWidth / 2 * 0.68 * 0.9 + 3;
      const legL = capsulePath(133, 248, rUpper, 127, 428, rLower);
      const legR = capsulePath(167, 248, rUpper, 173, 428, rLower);
      const hw = torsoHalfAt(bt, 246) + 4;
      let glitter = '';
      for (let i = 0; i < 26; i++) {
        const y = 162 + ((i * 37) % 78), half = torsoHalfAt(bt, y) - 2;
        const x = cx - half + ((i * 53) % Math.max(1, Math.round(half * 2)));
        glitter += `<circle cx="${x.toFixed(1)}" cy="${y}" r="${i % 3 ? 1.2 : 1.8}" fill="#ffffff" opacity="0.85"/>`;
      }
      return `<path d="${legL}" fill="#2f3f66"/><path d="${legR}" fill="#2f3f66"/>
              ${fittedTopSVG(bt, 246, null)}
              ${glitter}
              <rect x="${cx - hw}" y="238" width="${hw * 2}" height="10" fill="#2b2b2b"/>
              <path d="M${cx - hw},242 L${cx + hw},242" stroke="#ffffff" stroke-width="1.5"/>
              <path d="M${cx - 16},${sY - 1} Q${cx},${sY + 12} ${cx + 16},${sY - 1}" fill="none" stroke="#2b2b2b" stroke-width="5"/>
              <path d="M${cx - 16},${sY - 1} Q${cx},${sY + 12} ${cx + 16},${sY - 1}" fill="none" stroke="#ffffff" stroke-width="1.2"/>
              <line x1="${cx}" y1="${sY + 10}" x2="${cx}" y2="240" stroke="#d6d6d6" stroke-width="2"/>
              <rect x="${cx - 2.5}" y="${sY + 18}" width="5" height="8" rx="1" fill="#d6d6d6"/>
              <path d="M${cx - bt.shoulderHalf - 14},${sY + 22} L${cx - bt.shoulderHalf + 8},${sY + 22} M${cx + bt.shoulderHalf - 8},${sY + 22} L${cx + bt.shoulderHalf + 14},${sY + 22}" stroke="#2b2b2b" stroke-width="4"/>`;
    } },
  { id: 'ballet-tutu', label: 'Ballerina Tutu', emoji: '🩰', theme: 'ballet',
    svg: (bt) => balletTutuSVG(bt, null) },
  { id: 'swan-tutu', label: 'Swan Tutu', emoji: '🦢', theme: 'ballet', fixedColor: true,
    svg: (bt) => balletTutuSVG(bt, { suit: '#fdfdfd', tutu: '#ffffff', trim: '#d9d0c0', sparkle: '#c9a6ff' }) },
  { id: 'puffer-jacket', label: 'Puffer & Cargos', emoji: '🧥', pass: 'baddie', passTier: 2, fixedColor: true,
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder, h = bt.hipHalf + 8;
      const leg = (d) => {
        const outer = cx + d * h, inner = cx + d * 2, outerB = cx + d * (h + 8), innerB = cx + d * 5;
        return `<path d="M${outer},236 L${inner},236 L${inner},262 L${innerB},444 L${outerB},444 Z" fill="#c9b18a" stroke="#a89068" stroke-width="1.2"/>
          <rect x="${Math.min(outer, outerB) + (d < 0 ? 2 : -18)}" y="312" width="16" height="20" rx="2" fill="#b89f78" stroke="#a89068" stroke-width="1"/>
          <rect x="${Math.min(outerB, innerB)}" y="436" width="${Math.abs(outerB - innerB)}" height="8" fill="#a89068"/>`;
      };
      let puffs = '';
      for (let y = sY + 2; y < 244; y += 17) {
        const half = torsoHalfAt(bt, Math.min(y + 8, 250)) + 9;
        puffs += `<rect x="${cx - half}" y="${y}" width="${half * 2}" height="19" rx="9.5" fill="#26262f" stroke="#111116" stroke-width="1.2"/>
                  <path d="M${cx - half + 8},${y + 5} L${cx - half + 22},${y + 5}" stroke="#ffffff" stroke-width="1.5" opacity="0.18" stroke-linecap="round"/>`;
      }
      return `${leg(-1)}${leg(1)}
              <ellipse cx="${cx - bt.shoulderHalf - 6}" cy="${sY + 16}" rx="17" ry="20" fill="#26262f" stroke="#111116" stroke-width="1.2"/>
              <ellipse cx="${cx + bt.shoulderHalf + 6}" cy="${sY + 16}" rx="17" ry="20" fill="#26262f" stroke="#111116" stroke-width="1.2"/>
              ${puffs}
              <path d="M${cx - 18},${sY - 4} Q${cx},${sY + 10} ${cx + 18},${sY - 4} L${cx + 16},${sY + 6} Q${cx},${sY + 18} ${cx - 16},${sY + 6} Z" fill="#26262f" stroke="#111116" stroke-width="1"/>
              <line x1="${cx}" y1="${sY + 10}" x2="${cx}" y2="244" stroke="#d6dbe2" stroke-width="2"/>
              <rect x="${cx - 2.5}" y="${sY + 16}" width="5" height="9" rx="1" fill="#d6dbe2"/>`;
    } },
  { id: 'glam-tracksuit', label: 'Glam Tracksuit', emoji: '💗', pass: 'baddie', passTier: 5, fixedColor: true,
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder, h = bt.hipHalf + 4;
      const leg = (d) => {
        const outer = cx + d * h, inner = cx + d * 2;
        return `<path d="M${outer},236 L${inner},236 L${cx + d * 5},440 L${cx + d * (h + 16)},440 Z" fill="#ff6fb0" stroke="#e0458f" stroke-width="1"/>
                <path d="M${outer - d * 3},240 L${cx + d * (h + 12)},438" stroke="#ffffff" stroke-width="3"/>`;
      };
      const gems = [[-10, 182], [8, 192], [-4, 206], [12, 214], [-14, 222], [2, 228]].map(([x, y]) =>
        `<path d="M${cx + x},${y - 2.6} L${cx + x + 2},${y} L${cx + x},${y + 2.6} L${cx + x - 2},${y} Z" fill="#ffffff"/>`).join('');
      return `${leg(-1)}${leg(1)}
              <path d="M${cx - 30},${sY - 2} Q${cx},${sY - 18} ${cx + 30},${sY - 2} L${cx + 26},${sY + 6} Q${cx},${sY - 6} ${cx - 26},${sY + 6} Z" fill="#e0458f"/>
              ${fittedTopSVG(bt, 244, '#ff6fb0')}
              <rect x="${cx - torsoHalfAt(bt, 240) - 4}" y="236" width="${(torsoHalfAt(bt, 240) + 4) * 2}" height="9" fill="#e0458f"/>
              <line x1="${cx}" y1="${sY + 4}" x2="${cx}" y2="240" stroke="#ffffff" stroke-width="2"/>
              <circle cx="${cx}" cy="${sY + 14}" r="3" fill="#ffffff"/>
              <path d="M${cx - bt.shoulderHalf - 12},${sY + 6} L${cx - bt.shoulderHalf - 12},${sY + 26} M${cx + bt.shoulderHalf + 12},${sY + 6} L${cx + bt.shoulderHalf + 12},${sY + 26}" stroke="#ffffff" stroke-width="3"/>
              ${gems}`;
    } },
  { id: 'cupcake-dress', label: 'Cupcake Dress', emoji: '🧁', pass: 'sweetie', passTier: 2, fixedColor: true,
    svg: (bt) => {
      const cx = 150;
      const { shoulder: sY, waist: wY } = TORSO_Y;
      const top = bt.waistHalf + 6, hemY = 316, hemHalf = bt.hipHalf + 40;
      const stripes = Array.from({ length: 9 }, (_, i) => {
        const f0 = -1 + (2 * i) / 9, f1 = -1 + (2 * (i + 1)) / 9;
        return `<path d="M${cx + f0 * top},${wY + 6} L${cx + f1 * top},${wY + 6} L${cx + f1 * hemHalf},${hemY} L${cx + f0 * hemHalf},${hemY} Z" fill="${i % 2 ? '#bff0dd' : '#8fe0c0'}"/>`;
      }).join('');
      let wave = '';
      const n = 8, t = torsoHalfAt(bt, wY + 8) + 10, step = (t * 2) / n;
      for (let k = 0; k < n; k++) { const x0 = cx + t - step * k; wave += ` Q${(x0 - step / 2).toFixed(1)},${wY + 22} ${(x0 - step).toFixed(1)},${wY + 10}`; }
      const sprinkles = [[-14, 176, '#e05c5c', 20], [10, 168, '#5cc4e0', -30], [-4, 194, '#f2c94c', 60], [16, 206, '#9b6be0', 10], [-18, 210, '#43b581', -50], [4, 182, '#ffffff', 40]]
        .map(([x, y, c, r]) => `<rect x="${cx + x - 3}" y="${y - 1}" width="6" height="2.2" rx="1.1" fill="${c}" transform="rotate(${r} ${cx + x} ${y})"/>`).join('');
      return `${stripes}
              <path d="M${cx - hemHalf},${hemY} L${cx + hemHalf},${hemY}" stroke="#6cc9a6" stroke-width="3"/>
              ${fittedTopSVG(bt, wY + 10, '#ffb3d6')}
              <path d="M${cx + t},${wY + 10}${wave} L${cx - t},${wY} L${cx + t},${wY} Z" fill="#ffb3d6"/>
              ${sprinkles}
              <circle cx="${cx}" cy="${sY + 2}" r="6" fill="#e0245e"/><path d="M${cx},${sY - 4} q4,-8 10,-8" fill="none" stroke="#3f8f3a" stroke-width="1.6"/>
              <circle cx="${cx - 2}" cy="${sY}" r="1.6" fill="#ffffff" opacity="0.7"/>`;
    } },
  { id: 'cozy-pajamas', label: 'Cozy Pajamas', emoji: '🌙', theme: 'sleepy',
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder;
      const rUpper = bt.limbWidth / 2 * 1.15 + 5;
      const rLower = bt.limbWidth / 2 * 0.68 * 0.9 + 6;
      const legL = capsulePath(133, 248, rUpper, 127, 432, rLower);
      const legR = capsulePath(167, 248, rUpper, 173, 432, rLower);
      const moon = (x, y) => `<path d="M${x + 3},${y - 4} A4.5,4.5 0 1 0 ${x + 3},${y + 4} A3.4,3.4 0 1 1 ${x + 3},${y - 4} Z" fill="#fff7d6" opacity="0.9"/>`;
      const star = (x, y) => `<path d="M${x},${y - 3} L${x + 0.9},${y - 0.9} L${x + 3},${y} L${x + 0.9},${y + 0.9} L${x},${y + 3} L${x - 0.9},${y + 0.9} L${x - 3},${y} L${x - 0.9},${y - 0.9} Z" fill="#ffffff" opacity="0.9"/>`;
      return `<path d="${legL}"/><path d="${legR}"/>
              <rect x="${127 - rLower - 1}" y="${424}" width="${rLower * 2 + 2}" height="8" rx="3" fill="#ffffff"/>
              <rect x="${173 - rLower - 1}" y="${424}" width="${rLower * 2 + 2}" height="8" rx="3" fill="#ffffff"/>
              ${moon(126, 300)}${star(134, 350)}${moon(170, 330)}${star(166, 386)}${star(124, 400)}${moon(176, 280)}
              ${fittedTopSVG(bt, 250, null)}
              <path d="M${cx - 16},${sY - 1} L${cx},${sY + 14} L${cx + 16},${sY - 1}" fill="none" stroke="#ffffff" stroke-width="3"/>
              <line x1="${cx}" y1="${sY + 14}" x2="${cx}" y2="248" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>
              ${[178, 198, 218, 238].map((y) => `<circle cx="${cx + 4}" cy="${y}" r="2.2" fill="#ffffff"/>`).join('')}
              ${moon(cx - 18, 196)}${star(cx + 18, 186)}${star(cx - 14, 228)}${moon(cx + 20, 222)}`;
    } },
  { id: 'nightgown', label: 'Nightgown', emoji: '💤', theme: 'sleepy',
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder, wY = TORSO_Y.waist;
      const w = bt.waistHalf + 6, hemY = 404, hemHalf = bt.hipHalf + 44;
      let ruffle = '';
      const n = 12, step = (hemHalf * 2 + 8) / n;
      for (let k = 0; k < n; k++) { const x0 = cx + hemHalf + 4 - step * k; ruffle += ` Q${(x0 - step / 2).toFixed(1)},${hemY + 14} ${(x0 - step).toFixed(1)},${hemY + 4}`; }
      const heart = (x, y) => `<path d="M${x},${y + 3} C${x - 5},${y} ${x - 4},${y - 3} ${x - 1.6},${y - 2.8} C${x - 0.6},${y - 2.6} ${x},${y - 1.8} ${x},${y - 1.2} C${x},${y - 1.8} ${x + 0.6},${y - 2.6} ${x + 1.6},${y - 2.8} C${x + 4},${y - 3} ${x + 5},${y} ${x},${y + 3} Z" fill="#ffffff" opacity="0.85"/>`;
      return `<path d="M${cx - w},${wY} L${cx + w},${wY} L${cx + hemHalf},${hemY} Q${cx},${hemY + 12} ${cx - hemHalf},${hemY} Z"/>
              <path d="M${cx - hemHalf - 4},${hemY - 4} L${cx + hemHalf + 4},${hemY - 4} L${cx + hemHalf + 4},${hemY + 4}${ruffle} Z" fill="#ffffff" stroke="#e7d6e0" stroke-width="1"/>
              ${[[-30, 260], [24, 290], [-12, 330], [36, 360], [-44, 380], [6, 230], [14, 380]].map(([x, y]) => heart(cx + x, y)).join('')}
              ${fittedTopSVG(bt, wY + 4, null)}
              <path d="M${cx - 18},${sY + 2} Q${cx},${sY + 16} ${cx + 18},${sY + 2}" fill="none" stroke="#ffffff" stroke-width="3"/>
              <path d="M${cx},${sY + 14} l-6,-4 l0,8 Z M${cx},${sY + 14} l6,-4 l0,8 Z" fill="#ffffff"/>
              <path d="M${cx - w + 6},${wY + 8} L${cx - hemHalf + 20},${hemY - 10}" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.15" stroke-linecap="round"/>`;
    } },
  { id: 'santa-dress', label: 'Santa Dress', emoji: '🎅', theme: 'christmas', fixedColor: true,
    svg: `<path d="M106,150 L194,150 L214,338 Q150,356 86,338 Z" fill="#c1272d"/>
          <path d="M92,320 L208,320 L214,338 Q150,356 86,338 Z" fill="#f5f5f5"/>
          <rect x="106" y="150" width="88" height="14" fill="#f5f5f5"/>
          <rect x="112" y="205" width="76" height="14" rx="4" fill="#1b1b1b"/>
          <rect x="140" y="205" width="20" height="14" rx="3" fill="#e8b84b"/>` },
  { id: 'elf-costume', label: 'Elf Costume', emoji: '🧝', theme: 'christmas', fixedColor: true,
    svg: `<path d="M106,150 L194,150 L200,270 L100,270 Z" fill="#1e7a46"/>
          <rect x="106" y="150" width="88" height="12" fill="#c1272d"/>
          <rect x="108" y="228" width="84" height="12" rx="4" fill="#7a3b12"/>
          <path d="M100,270 L130,270 L118,300 L92,300 Z" fill="#1e7a46"/>
          <path d="M200,270 L170,270 L182,300 L208,300 Z" fill="#1e7a46"/>` },
  { id: 'fairy-dress', label: 'Fairy Dress', emoji: '🧚‍♀️', theme: 'fairy', fixedColor: true,
    svg: `<path d="M106,150 L194,150 L206,300 Q150,320 94,300 Z" fill="#c9a6ff" opacity="0.9"/>
          <path d="M110,270 L190,270 L212,330 Q150,348 88,330 Z" fill="#ffb6e6" opacity="0.85"/>
          <path d="M122,150 L178,150 L180,230 Q150,244 120,230 Z" fill="#eddcff"/>` },
  { id: 'enchanted-robe', label: 'Enchanted Robe', emoji: '🪄', theme: 'fairy', fixedColor: true,
    svg: `<path d="M104,150 L196,150 L220,400 Q150,420 80,400 Z" fill="#2f2159"/>
          <path d="M128,150 L172,150 L160,260 Q150,266 140,260 Z" fill="#7c53d1"/>
          <circle cx="110" cy="260" r="3" fill="#ffe9a8"/>
          <circle cx="190" cy="300" r="3" fill="#ffe9a8"/>
          <circle cx="150" cy="360" r="3" fill="#ffe9a8"/>` },
  { id: 'pumpkin-costume', label: 'Pumpkin Costume', emoji: '🎃', theme: 'halloween', fixedColor: true,
    svg: (bt) => {
      const cx = 150, cy = 232, ry = 82;
      const rx = Math.max(bt.shoulderHalf, bt.hipHalf) + 30;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#f28c28" stroke="#c0621a" stroke-width="2"/>
              <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.6}" ry="${ry - 1}" fill="none" stroke="#c0621a" stroke-width="2" opacity="0.6"/>
              <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.22}" ry="${ry - 2}" fill="none" stroke="#c0621a" stroke-width="2" opacity="0.6"/>
              <ellipse cx="${cx - rx * 0.5}" cy="${cy - 36}" rx="10" ry="22" fill="#ffffff" opacity="0.18" transform="rotate(20 ${cx - rx * 0.5} ${cy - 36})"/>
              <path d="M${cx - 24},${cy - ry + 6} Q${cx},${cy - ry - 12} ${cx + 24},${cy - ry + 6} Q${cx},${cy - ry + 14} ${cx - 24},${cy - ry + 6} Z" fill="#3f8f3a"/>
              <path d="M${cx + 20},${cy - ry + 4} q16,-10 24,2 q-12,8 -24,-2 Z" fill="#4fae48"/>
              <path d="M${cx - 32},${cy - 10} L${cx - 20},${cy - 34} L${cx - 8},${cy - 10} Z" fill="#3a1f0a"/>
              <path d="M${cx + 8},${cy - 10} L${cx + 20},${cy - 34} L${cx + 32},${cy - 10} Z" fill="#3a1f0a"/>
              <path d="M${cx - 5},${cy + 2} L${cx},${cy - 7} L${cx + 5},${cy + 2} Z" fill="#3a1f0a"/>
              <path d="M${cx - 38},${cy + 12} L${cx - 26},${cy + 22} L${cx - 13},${cy + 13} L${cx},${cy + 24} L${cx + 13},${cy + 13} L${cx + 26},${cy + 22} L${cx + 38},${cy + 12} Q${cx},${cy + 50} ${cx - 38},${cy + 12} Z" fill="#3a1f0a"/>` } },
  { id: 'cat-costume', label: 'Cat Costume', emoji: '🐈‍⬛', theme: 'halloween', fixedColor: true,
    svg: (bt) => {
      const cx = 150;
      const rUpper = bt.limbWidth / 2 * 1.15 + 4;
      const rLower = bt.limbWidth / 2 * 0.68 * 0.9 + 3;
      const legL = capsulePath(133, 248, rUpper, 127, 418, rLower);
      const legR = capsulePath(167, 248, rUpper, 173, 418, rLower);
      const tx = cx + bt.hipHalf;
      return `<path d="M${tx - 6},240 Q${tx + 52},250 ${tx + 40},196 Q${tx + 34},176 ${tx + 48},168" fill="none" stroke="#2b2b2b" stroke-width="9" stroke-linecap="round"/>
              <path d="${bodyTorsoPath(bt, 3)}" fill="#2b2b2b"/>
              <path d="${legL}" fill="#2b2b2b"/>
              <path d="${legR}" fill="#2b2b2b"/>
              <ellipse cx="${cx}" cy="205" rx="${bt.waistHalf * 0.55}" ry="36" fill="#f4f4f4"/>
              <path d="M110,64 L116,28 L140,50 Z" fill="#2b2b2b"/>
              <path d="M117,56 L120,38 L132,50 Z" fill="#ff9fc7"/>
              <path d="M190,64 L184,28 L160,50 Z" fill="#2b2b2b"/>
              <path d="M183,56 L180,38 L168,50 Z" fill="#ff9fc7"/>
              <path d="M146,100 L154,100 L150,105 Z" fill="#ff9fc7"/>
              <g stroke="#2b2b2b" stroke-width="1.4" stroke-linecap="round" opacity="0.8">
                <line x1="124" y1="101" x2="104" y2="97"/><line x1="124" y1="105" x2="104" y2="106"/>
                <line x1="176" y1="101" x2="196" y2="97"/><line x1="176" y1="105" x2="196" y2="106"/>
              </g>` } },
  { id: 'car-costume', label: 'Car Costume', emoji: '🚗', theme: 'halloween', fixedColor: true,
    svg: (bt) => {
      const cx = 150;
      const w = Math.max(bt.hipHalf, bt.shoulderHalf) + 38;
      const sx = bt.shoulderHalf - 8;
      return `<path d="${bodyTorsoPath(bt, 3)}" fill="#5cc4e0"/>
              <line x1="${cx - sx}" y1="150" x2="${cx - sx}" y2="210" stroke="#2b2b2b" stroke-width="4"/>
              <line x1="${cx + sx}" y1="150" x2="${cx + sx}" y2="210" stroke="#2b2b2b" stroke-width="4"/>
              <path d="M${cx - 36},207 L${cx - 27},186 L${cx + 27},186 L${cx + 36},207 Z" fill="#bfe9ff" opacity="0.65" stroke="#7aa6b8" stroke-width="1.5"/>
              <rect x="${cx - w}" y="205" width="${2 * w}" height="62" rx="18" fill="#e05c5c" stroke="#a83232" stroke-width="2"/>
              <rect x="${cx - w + 2}" y="226" width="${2 * w - 4}" height="7" fill="#ffffff" opacity="0.85"/>
              <circle cx="${cx - w + 14}" cy="249" r="7" fill="#fff3a8" stroke="#c98f1f" stroke-width="1"/>
              <circle cx="${cx + w - 14}" cy="249" r="7" fill="#fff3a8" stroke="#c98f1f" stroke-width="1"/>
              <circle cx="${cx}" cy="249" r="13" fill="#ffffff" stroke="#a83232" stroke-width="1.5"/>
              <text x="${cx}" y="254.5" text-anchor="middle" font-size="15" font-weight="700" font-family="Arial, sans-serif" fill="#2b2b2b">8</text>
              <circle cx="${cx - w + 28}" cy="270" r="14" fill="#2b2b2b"/>
              <circle cx="${cx - w + 28}" cy="270" r="5" fill="#cfcfcf"/>
              <circle cx="${cx + w - 28}" cy="270" r="14" fill="#2b2b2b"/>
              <circle cx="${cx + w - 28}" cy="270" r="5" fill="#cfcfcf"/>` } },
  { id: 'sequin-gown', label: 'Sequin Gown', emoji: '💫', unlockLevel: 2, fixedColor: true,
    svg: `<path d="M106,150 L194,150 L196,400 Q150,414 104,400 Z" fill="#d94f8c"/>
          <circle cx="130" cy="200" r="3" fill="#fff7d6"/>
          <circle cx="150" cy="180" r="3" fill="#fff7d6"/>
          <circle cx="170" cy="210" r="3" fill="#fff7d6"/>
          <circle cx="140" cy="260" r="3" fill="#fff7d6"/>
          <circle cx="160" cy="290" r="3" fill="#fff7d6"/>
          <circle cx="125" cy="330" r="3" fill="#fff7d6"/>
          <circle cx="175" cy="350" r="3" fill="#fff7d6"/>` },
  { id: 'royal-cape', label: 'Royal Cape Gown', emoji: '👑', unlockLevel: 3, fixedColor: true,
    svg: `<path d="M100,150 Q60,220 78,360 L104,350 Q92,240 122,158 Z" fill="#5a3aa8"/>
          <path d="M200,150 Q240,220 222,360 L196,350 Q208,240 178,158 Z" fill="#5a3aa8"/>
          <path d="M106,150 L194,150 L206,350 Q150,368 94,350 Z" fill="#7c53d1"/>
          <rect x="106" y="150" width="88" height="12" fill="#f2c94c"/>` },
  { id: 'starlight-suit', label: 'Starlight Suit', emoji: '🌠', unlockLevel: 4, fixedColor: true,
    svg: `<path d="M104,150 L196,150 L184,250 L150,236 L116,250 Z" fill="#1b1b2e"/>
          <path d="M112,250 L150,236 L146,430 L108,430 Z" fill="#1b1b2e"/>
          <path d="M188,250 L150,236 L154,430 L192,430 Z" fill="#1b1b2e"/>
          <path d="M132,150 L168,150 L150,208 Z" fill="#fdfdfd"/>
          <path d="M144,150 L156,150 L152,190 L148,192 Z" fill="#2b6cb0"/>
          <circle cx="126" cy="180" r="2.5" fill="#ffe9a8"/>
          <circle cx="174" cy="200" r="2.5" fill="#ffe9a8"/>
          <circle cx="130" cy="260" r="2.5" fill="#ffe9a8"/>
          <circle cx="170" cy="300" r="2.5" fill="#ffe9a8"/>` },
  { id: 'legend-gown', label: "Legend's Gown", emoji: '✨', unlockLevel: 5, fixedColor: true,
    svg: `<path d="M104,150 L196,150 L226,410 Q150,432 74,410 Z" fill="#a83568"/>
          <path d="M104,150 L196,150 L200,300 Q150,312 100,300 Z" fill="#ffd77a"/>
          <rect x="106" y="150" width="88" height="10" fill="#ffd77a"/>
          <path d="M74,410 Q150,432 226,410 L226,424 Q150,448 74,424 Z" fill="#ffd77a"/>` },
];

const OUTFIT_COLORS = ['#e0558f', '#8c5ce0', '#5cc4e0', '#43b581', '#f2c94c', '#e05c5c', '#2b2b2b', '#ffffff'];

const SHOE_STYLES = [
  { id: 'heels', label: 'Heels', emoji: '👠',
    svg: `<ellipse cx="127" cy="497" rx="9" ry="3" fill="#000000" opacity="0.22"/>
          <path d="M123,449 L131,449 L128,495 L126,495 Z"/>
          <path d="M113,428 Q127,420 141,428 Q145,440 141,452 Q136,462 127,464 Q118,462 113,452 Q109,440 113,428 Z"/>
          <path d="M113,431 Q127,437 141,431 L141,436 Q127,442 113,436 Z" fill="#8a6247"/>
          <circle cx="141" cy="433" r="2.6" fill="#8a6247"/>
          <path d="M119,435 Q127,439 135,435" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
          <ellipse cx="173" cy="497" rx="9" ry="3" fill="#000000" opacity="0.22"/>
          <path d="M169,449 L177,449 L174,495 L172,495 Z"/>
          <path d="M159,428 Q173,420 187,428 Q191,440 187,452 Q182,462 173,464 Q164,462 159,452 Q155,440 159,428 Z"/>
          <path d="M159,431 Q173,437 187,431 L187,436 Q173,442 159,436 Z" fill="#8a6247"/>
          <circle cx="187" cy="433" r="2.6" fill="#8a6247"/>
          <path d="M165,435 Q173,439 181,435" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.3"/>` },
  { id: 'flats', label: 'Flats', emoji: '🥿',
    svg: `<ellipse cx="127" cy="454" rx="22" ry="6" fill="#000000" opacity="0.25"/>
          <ellipse cx="127" cy="447" rx="21" ry="10"/>
          <path d="M110,444 Q127,438 144,444" fill="none" stroke="#000000" stroke-width="1.3" opacity="0.22"/>
          <path d="M118,441 Q127,446 136,441" fill="none" stroke="#000000" stroke-width="1" opacity="0.18"/>
          <rect x="122" y="439" width="10" height="5" rx="2" fill="#8a6247"/>
          <ellipse cx="173" cy="454" rx="22" ry="6" fill="#000000" opacity="0.25"/>
          <ellipse cx="173" cy="447" rx="21" ry="10"/>
          <path d="M156,444 Q173,438 190,444" fill="none" stroke="#000000" stroke-width="1.3" opacity="0.22"/>
          <path d="M164,441 Q173,446 182,441" fill="none" stroke="#000000" stroke-width="1" opacity="0.18"/>
          <rect x="168" y="439" width="10" height="5" rx="2" fill="#8a6247"/>` },
  { id: 'boots', label: 'Boots', emoji: '👢',
    svg: `<rect x="110" y="392" width="34" height="66" rx="14"/>
          <rect x="105" y="449" width="44" height="13" rx="6" fill="#8a6247"/>
          <path d="M108,406 Q127,400 146,406" fill="none" stroke="#8a6247" stroke-width="2.2" opacity="0.9"/>
          <rect x="121" y="393" width="12" height="9" rx="3" fill="#8a6247"/>
          <rect x="156" y="392" width="34" height="66" rx="14"/>
          <rect x="151" y="449" width="44" height="13" rx="6" fill="#8a6247"/>
          <path d="M154,406 Q173,400 192,406" fill="none" stroke="#8a6247" stroke-width="2.2" opacity="0.9"/>
          <rect x="167" y="393" width="12" height="9" rx="3" fill="#8a6247"/>` },
  { id: 'sneakers', label: 'Sneakers', emoji: '👟',
    svg: `<rect x="104" y="446" width="46" height="10" rx="5" fill="#ffffff"/>
          <path d="M106,444 Q106,428 124,425 Q144,423 150,438 Q152,444 148,446 L106,446 Z"/>
          <path d="M106,446 Q106,436 116,434 Q124,433 126,438 L126,446 Z" fill="#ffffff" opacity="0.85"/>
          <line x1="130" y1="432" x2="142" y2="428" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
          <line x1="130" y1="437" x2="144" y2="433" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
          <line x1="130" y1="442" x2="146" y2="438" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
          <rect x="150" y="446" width="46" height="10" rx="5" fill="#ffffff"/>
          <path d="M152,444 Q152,428 170,425 Q190,423 196,438 Q198,444 194,446 L152,446 Z"/>
          <path d="M152,446 Q152,436 162,434 Q170,433 172,438 L172,446 Z" fill="#ffffff" opacity="0.85"/>
          <line x1="176" y1="432" x2="188" y2="428" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
          <line x1="176" y1="437" x2="190" y2="433" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
          <line x1="176" y1="442" x2="192" y2="438" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>` },
];

SHOE_STYLES.push({ id: 'platform-boots', label: 'Platform Boots', emoji: '🥾', pass: 'baddie', passTier: 4,
  svg: [127, 173].map((x) => `
        <rect x="${x - 13}" y="392" width="26" height="56" rx="8"/>
        <rect x="${x - 15}" y="446" width="30" height="16" rx="4" fill="#1d1d24" stroke="none"/>
        <path d="M${x - 15},452 L${x + 15},452" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
        <path d="M${x - 5},404 L${x + 5},410 M${x + 5},404 L${x - 5},410 M${x - 5},414 L${x + 5},420 M${x + 5},414 L${x - 5},420 M${x - 5},424 L${x + 5},430 M${x + 5},424 L${x - 5},430" fill="none" stroke="#f2c94c" stroke-width="1.4"/>
        <rect x="${x - 13}" y="392" width="26" height="7" rx="3" fill="#1d1d24" stroke="none"/>`).join('') });
SHOE_STYLES.push({ id: 'sprinkle-sneakers', label: 'Sprinkle Sneakers', emoji: '👟', pass: 'sweetie', passTier: 3,
  svg: [0, 46].map((dx) => `
        <rect x="${104 + dx}" y="446" width="46" height="10" rx="5" fill="#ffb3d6" stroke="none"/>
        <path d="M${106 + dx},444 Q${106 + dx},428 ${124 + dx},425 Q${144 + dx},423 ${150 + dx},438 Q${152 + dx},444 ${148 + dx},446 L${106 + dx},446 Z"/>
        ${[[114, 438, '#e05c5c', 20], [124, 432, '#5cc4e0', -30], [134, 438, '#f2c94c', 50], [142, 434, '#43b581', -10], [128, 441, '#9b6be0', 70]].map(([x, y, c, r]) =>
          `<rect x="${x + dx - 2.5}" y="${y - 0.9}" width="5" height="1.8" rx="0.9" fill="${c}" stroke="none" transform="rotate(${r} ${x + dx} ${y})"/>`).join('')}`).join('') });
SHOE_STYLES.push({ id: 'bunny-slippers', label: 'Bunny Slippers', emoji: '🐰', theme: 'sleepy',
  svg: [127, 173].map((x) => `
        <ellipse cx="${x}" cy="456" rx="17" ry="5" fill="#000000" opacity="0.15" stroke="none"/>
        <ellipse cx="${x - 6}" cy="430" rx="4" ry="11" transform="rotate(-12 ${x - 6} 430)"/>
        <ellipse cx="${x + 6}" cy="430" rx="4" ry="11" transform="rotate(12 ${x + 6} 430)"/>
        <ellipse cx="${x - 6}" cy="431" rx="1.8" ry="7" fill="#ffb3d6" stroke="none" transform="rotate(-12 ${x - 6} 431)"/>
        <ellipse cx="${x + 6}" cy="431" rx="1.8" ry="7" fill="#ffb3d6" stroke="none" transform="rotate(12 ${x + 6} 431)"/>
        <ellipse cx="${x}" cy="448" rx="16" ry="10"/>
        <circle cx="${x - 5}" cy="446" r="1.5" fill="#2b2b2b" stroke="none"/><circle cx="${x + 5}" cy="446" r="1.5" fill="#2b2b2b" stroke="none"/>
        <ellipse cx="${x}" cy="450" rx="2" ry="1.4" fill="#ff8fa3" stroke="none"/>`).join('') });
SHOE_STYLES.push({ id: 'ballet-slippers', label: 'Ballet Shoes', emoji: '🩰', theme: 'ballet',
  svg: [127, 173].map((x) => `
        <ellipse cx="${x}" cy="462" rx="9" ry="3" fill="#000000" opacity="0.18" stroke="none"/>
        <path d="M${x - 8},${404} L${x + 8},${420} M${x + 8},${404} L${x - 8},${420} M${x - 8},${420} L${x + 8},${436} M${x + 8},${420} L${x - 8},${436}" fill="none" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M${x - 10},440 Q${x - 10},428 ${x},428 Q${x + 10},428 ${x + 10},440 L${x + 7},456 Q${x},464 ${x - 7},456 Z" stroke-width="1.2"/>
        <path d="M${x - 6},438 Q${x},434 ${x + 6},438" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.5"/>
        <rect x="${x - 4}" y="456" width="8" height="5" rx="2" stroke="none" opacity="0.8"/>`).join('') });
SHOE_STYLES.push({ id: 'light-up-sneakers', label: 'Light-Up Sneakers', emoji: '💡', price: 40,
  svg: [0, 46].map((dx) => `
        <rect class="light-sole" x="${104 + dx}" y="446" width="46" height="10" rx="5" fill="#ff6fb0" stroke="none"/>
        <rect class="light-sole light-sole-b" x="${110 + dx}" y="449" width="10" height="4" rx="2" fill="#ffffff" stroke="none"/>
        <path d="M${106 + dx},444 Q${106 + dx},428 ${124 + dx},425 Q${144 + dx},423 ${150 + dx},438 Q${152 + dx},444 ${148 + dx},446 L${106 + dx},446 Z"/>
        <path d="M${124 + dx},428 L${122 + dx},444" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
        <line x1="${130 + dx}" y1="432" x2="${142 + dx}" y2="428" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
        <line x1="${130 + dx}" y1="437" x2="${144 + dx}" y2="433" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>`).join('') });
SHOE_STYLES.push({ id: 'flip-flops', label: 'Flip-Flops', emoji: '🩴', theme: 'summer',
  svg: `<ellipse cx="127" cy="454" rx="15" ry="6" fill="#000000" opacity="0.18"/>
        <ellipse cx="127" cy="450" rx="14" ry="6.5"/>
        <path d="M117,450 Q120,440 127,438 Q134,440 137,450" fill="none" stroke-width="3" stroke-linecap="round"/>
        <circle cx="127" cy="439" r="3.6" fill="#ff8fc7" stroke="none"/>
        <ellipse cx="173" cy="454" rx="15" ry="6" fill="#000000" opacity="0.18"/>
        <ellipse cx="173" cy="450" rx="14" ry="6.5"/>
        <path d="M163,450 Q166,440 173,438 Q180,440 183,450" fill="none" stroke-width="3" stroke-linecap="round"/>
        <circle cx="173" cy="439" r="3.6" fill="#ff8fc7" stroke="none"/>` });

const SHOE_COLORS = ['#2b2b2b', '#8a5a2b', '#e0558f', '#ffffff', '#c68642', '#5cc4e0'];

const ACCESSORIES = [
  { id: 'hat', label: 'Hat', emoji: '🎩', color: '#b83c6f',
    svg: `<ellipse cx="150" cy="46" rx="52" ry="10" fill="#000000" opacity="0.15"/>
          <ellipse cx="150" cy="44" rx="50" ry="9"/>
          <path d="M120,44 Q118,14 150,12 Q182,14 180,44 Z"/>
          <rect x="119" y="35" width="62" height="8" fill="#2b2b2b" opacity="0.3"/>
          <ellipse cx="150" cy="12" rx="16" ry="4" fill="#000000" opacity="0.12"/>
          <path d="M126,22 Q136,15 146,19" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.22" stroke-linecap="round"/>` },
  { id: 'glasses', label: 'Glasses', emoji: '🕶️', color: '#2b2b2b',
    svg: `<circle cx="132" cy="90" r="13" fill="#8ec9e0" opacity="0.2"/>
          <circle cx="168" cy="90" r="13" fill="#8ec9e0" opacity="0.2"/>
          <circle cx="132" cy="90" r="15" fill="none" stroke-width="4"/>
          <circle cx="168" cy="90" r="15" fill="none" stroke-width="4"/>
          <line x1="147" y1="90" x2="153" y2="90" stroke-width="4"/>
          <line x1="117" y1="88" x2="105" y2="82" stroke-width="4"/>
          <line x1="183" y1="88" x2="195" y2="82" stroke-width="4"/>
          <path d="M126,85 Q131,82 136,85" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/>` },
  { id: 'necklace', label: 'Necklace', emoji: '📿', color: '#f2c94c',
    svg: `<path d="M133,155 Q150,175 167,155" fill="none" stroke-width="4"/>
          <circle cx="150" cy="176" r="5"/>
          <circle cx="148" cy="174" r="1.4" fill="#ffffff" opacity="0.7"/>` },
  { id: 'bag', label: 'Handbag', emoji: '👛', color: '#8c5ce0',
    svg: `<rect x="192" y="280" width="34" height="26" rx="6"/>
          <path d="M192,280 Q209,274 226,280 L226,288 Q209,283 192,288 Z" fill="#000000" opacity="0.16"/>
          <rect x="205" y="286" width="8" height="6" rx="2" fill="#e8c468"/>
          <line x1="195" y1="299" x2="223" y2="299" stroke="#000000" stroke-width="1" opacity="0.15"/>
          <path d="M198,280 Q209,260 220,280" fill="none" stroke-width="4"/>` },
  { id: 'cat-ears', label: 'Cat Ears', emoji: '😺', color: '#2b2b2b',
    svg: `<path d="M104,68 Q150,26 196,68" fill="none" stroke-width="4" stroke-linecap="round"/>
          <path d="M110,58 L114,24 L138,44 Z"/>
          <path d="M116,51 L118,33 L131,44 Z" fill="#ff9fc7" stroke="none"/>
          <path d="M190,58 L186,24 L162,44 Z"/>
          <path d="M184,51 L182,33 L169,44 Z" fill="#ff9fc7" stroke="none"/>` },
  { id: 'feather-wings', label: 'Feather Wings', emoji: '🕊️', theme: 'birds', color: '#f7f4ee',
    svg: `<g stroke="#c9c2b5" stroke-width="1.2">
            <path d="M104,176 Q66,146 26,164 Q36,174 30,186 Q46,188 40,202 Q56,202 52,218 Q68,216 68,232 Q86,226 104,238 Z"/>
            <path d="M196,176 Q234,146 274,164 Q264,174 270,186 Q254,188 260,202 Q244,202 248,218 Q232,216 232,232 Q214,226 196,238 Z"/>
          </g>
          <g fill="none" stroke="#c9c2b5" stroke-width="1" opacity="0.8">
            <path d="M100,190 Q70,176 40,180 M100,204 Q72,196 50,200 M100,218 Q78,212 62,218"/>
            <path d="M200,190 Q230,176 260,180 M200,204 Q228,196 250,200 M200,218 Q222,212 238,218"/>
          </g>` },
  { id: 'nest-hat', label: 'Nest Hat', emoji: '🪺', theme: 'birds', color: '#8a5a2b',
    svg: `<ellipse cx="150" cy="44" rx="36" ry="13" fill="#8a5a2b" stroke="#5e3b1a" stroke-width="1.5"/>
          <g fill="none" stroke="#5e3b1a" stroke-width="1.4" stroke-linecap="round" opacity="0.8">
            <path d="M118,42 Q140,52 168,40 M122,50 Q150,56 180,46 M130,36 Q150,46 176,38"/>
          </g>
          <ellipse cx="138" cy="36" rx="6" ry="7.5" fill="#bfe9ff" stroke="#8ec9e0" stroke-width="1"/>
          <ellipse cx="150" cy="34" rx="6" ry="7.5" fill="#d6f1ff" stroke="#8ec9e0" stroke-width="1"/>
          <circle cx="166" cy="26" r="9" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/>
          <circle cx="170" cy="17" r="6" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/>
          <path d="M175,16 L181,18 L175,20 Z" fill="#f28c28" stroke="none"/>
          <circle cx="171.5" cy="15.5" r="1.2" fill="#2b2b2b" stroke="none"/>
          <path d="M158,26 Q162,20 168,26 Q162,30 158,26 Z" fill="#e0b13a" stroke="none"/>` },
  { id: 'rose-bouquet', label: 'Rose Bouquet', emoji: '💐', theme: 'metgala', price: 30, color: '#e0245e',
    svg: `<path d="M72,262 Q76,258 82,264 M96,262 Q92,256 86,262" fill="none" stroke="#3f8f3a" stroke-width="2"/>
          <ellipse cx="72" cy="258" rx="6" ry="3" fill="#4fae48" stroke="none" transform="rotate(-30 72 258)"/>
          <ellipse cx="98" cy="258" rx="6" ry="3" fill="#4fae48" stroke="none" transform="rotate(30 98 258)"/>
          <circle cx="78" cy="254" r="6.5" stroke="#9c0d3c" stroke-width="1"/>
          <circle cx="90" cy="254" r="6.5" stroke="#9c0d3c" stroke-width="1"/>
          <circle cx="84" cy="246" r="6.5" stroke="#9c0d3c" stroke-width="1"/>
          <circle cx="84" cy="259" r="6" fill="#ff6f91" stroke="#c0245e" stroke-width="1"/>
          <g fill="none" stroke="#7a0b2a" stroke-width="1" stroke-linecap="round">
            <path d="M75,254 Q78,250 81,254 Q78,257 76.5,253"/><path d="M87,254 Q90,250 93,254 Q90,257 88.5,253"/>
            <path d="M81,246 Q84,242 87,246 Q84,249 82.5,245"/>
          </g>
          <path d="M74,262 L94,262 L87,294 L81,294 Z" fill="#f4efe6" stroke="#d9cfbf" stroke-width="1"/>
          <path d="M77,276 L91,276 L90,281 L78,281 Z" fill="#e0245e" stroke="none"/>` },
  { id: 'rose-headpiece', label: 'Rose Headpiece', emoji: '🌹', theme: 'metgala', price: 40, color: '#e0245e',
    svg: `<ellipse cx="102" cy="56" rx="9" ry="4" fill="#4fae48" stroke="none" transform="rotate(-40 102 56)"/>
          <ellipse cx="140" cy="38" rx="9" ry="4" fill="#4fae48" stroke="none" transform="rotate(20 140 38)"/>
          <circle cx="114" cy="50" r="10" stroke="#9c0d3c" stroke-width="1"/>
          <circle cx="129" cy="42" r="8" fill="#ff6f91" stroke="#c0245e" stroke-width="1"/>
          <circle cx="106" cy="64" r="7" stroke="#9c0d3c" stroke-width="1"/>
          <g fill="none" stroke="#7a0b2a" stroke-width="1.1" stroke-linecap="round">
            <path d="M109,50 Q114,44 119,50 Q114,55 111.5,49"/><path d="M125,42 Q129,38 133,42 Q129,45 127,41.5"/>
            <path d="M102.5,64 Q106,60 109.5,64 Q106,67 104,63.5"/>
          </g>` },
  { id: 'gold-clutch', label: 'Gold Clutch', emoji: '👝', theme: 'metgala', price: 35, color: '#e8b84b',
    svg: `<rect x="199" y="270" width="32" height="18" rx="5" stroke="#b8862a" stroke-width="1.2"/>
          <path d="M199,276 Q215,284 231,276" fill="none" stroke="#b8862a" stroke-width="1.2"/>
          <circle cx="215" cy="280" r="2.6" fill="#fff7d6" stroke="none"/>
          <path d="M205,273 l1,2 l2,1 l-2,1 l-1,2 l-1,-2 l-2,-1 l2,-1 Z M224,283 l1,2 l2,1 l-2,1 l-1,2 l-1,-2 l-2,-1 l2,-1 Z" fill="#fff7d6" stroke="none"/>` },
  { id: 'pearl-necklace', label: 'Pearl Necklace', emoji: '📿', theme: 'metgala', price: 25, color: '#fbf7ef',
    svg: Array.from({ length: 13 }, (_, i) => {
      const t = i / 12;
      return `<circle cx="${(130 + 40 * t).toFixed(1)}" cy="${(155 + 18 * Math.sin(Math.PI * t)).toFixed(1)}" r="2.7" stroke="#d9d0c0" stroke-width="0.6"/>`;
    }).join('') + `<circle cx="150" cy="178" r="4" stroke="#d9d0c0" stroke-width="0.6"/><circle cx="149" cy="177" r="1.2" fill="#ffffff" stroke="none"/>` },
  { id: 'shell-top', label: 'Seashell Top', emoji: '🐚', theme: 'mermaid', color: '#ff9fc7',
    svg: `<path d="M140,152 L137,165 M160,152 L163,165 M146,175 L154,175" fill="none" stroke="#e0558f" stroke-width="1.6"/>
          <g fill="#ff9fc7" stroke="#e0558f" stroke-width="1.2"><path d="M133,190 L120,175 Q121,164 133,163 Q145,164 146,175 Z"/>
          <path d="M133,189 L125,168 M133,189 L133,164 M133,189 L141,168 M133,189 L121,175 M133,189 L145,175" fill="none" stroke-width="1" opacity="0.6"/>
          <path d="M129,191 L137,191 L133,187 Z"/><path d="M167,190 L154,175 Q155,164 167,163 Q179,164 180,175 Z"/>
          <path d="M167,189 L159,168 M167,189 L167,164 M167,189 L175,168 M167,189 L155,175 M167,189 L179,175" fill="none" stroke-width="1" opacity="0.6"/>
          <path d="M163,191 L171,191 L167,187 Z"/></g>
          <ellipse cx="128" cy="170" rx="3" ry="2" fill="#ffffff" stroke="none" opacity="0.6"/>
          <ellipse cx="162" cy="170" rx="3" ry="2" fill="#ffffff" stroke="none" opacity="0.6"/>` },
  { id: 'pearl-shell-top', label: 'Pearl Shell Top', emoji: '🦪', theme: 'mermaid', color: '#c9a6ff',
    svg: `<g fill="#fff7ef" stroke="#d9c7b8" stroke-width="0.5">
            ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${139 - i * 0.6}" cy="${153 + i * 2.8}" r="1.8"/><circle cx="${161 + i * 0.6}" cy="${153 + i * 2.8}" r="1.8"/>`).join('')}
            <circle cx="146" cy="176" r="1.8"/><circle cx="150" cy="176.5" r="1.8"/><circle cx="154" cy="176" r="1.8"/>
          </g>
          <g fill="#c9a6ff" stroke="#8c5ce0" stroke-width="1.2"><path d="M133,190 L120,175 Q121,164 133,163 Q145,164 146,175 Z"/>
          <path d="M133,189 L125,168 M133,189 L133,164 M133,189 L141,168 M133,189 L121,175 M133,189 L145,175" fill="none" stroke-width="1" opacity="0.6"/>
          <path d="M129,191 L137,191 L133,187 Z"/><path d="M167,190 L154,175 Q155,164 167,163 Q179,164 180,175 Z"/>
          <path d="M167,189 L159,168 M167,189 L167,164 M167,189 L175,168 M167,189 L155,175 M167,189 L179,175" fill="none" stroke-width="1" opacity="0.6"/>
          <path d="M163,191 L171,191 L167,187 Z"/></g>
          <circle cx="133" cy="184" r="2.6" fill="#fff7ef" stroke="#d9c7b8" stroke-width="0.5"/>
          <circle cx="167" cy="184" r="2.6" fill="#fff7ef" stroke="#d9c7b8" stroke-width="0.5"/>` },
  { id: 'starfish-clip', label: 'Starfish Clip', emoji: '⭐', theme: 'mermaid', color: '#ff9a5c',
    svg: `<path d="M186,46 L190,56 L201,57 L192,63 L195,74 L186,68 L177,74 L180,63 L171,57 L182,56 Z" stroke="#e0703a" stroke-width="1.2" stroke-linejoin="round"/>
          <g fill="#ffd2b0" stroke="none"><circle cx="186" cy="54" r="1"/><circle cx="192" cy="60" r="1"/><circle cx="180" cy="60" r="1"/><circle cx="183" cy="67" r="1"/><circle cx="189" cy="67" r="1"/><circle cx="186" cy="61" r="1.3"/></g>` },
  { id: 'backpack', label: 'Pink Backpack', emoji: '🎒', theme: 'school', color: '#ff8fc7',
    behindSvg: `<rect x="92" y="138" width="116" height="134" rx="26" fill="#ff8fc7" stroke="#e0558f" stroke-width="2"/>
          <path d="M128,138 Q150,116 172,138" fill="none" stroke="#e0558f" stroke-width="5" stroke-linecap="round"/>
          <rect x="92" y="222" width="18" height="40" rx="6" fill="#ff6fb0" stroke="#e0558f" stroke-width="1.5"/>
          <rect x="190" y="222" width="18" height="40" rx="6" fill="#ff6fb0" stroke="#e0558f" stroke-width="1.5"/>`,
    svg: `<path d="M134,152 Q118,190 116,236 M166,152 Q182,190 184,236" fill="none" stroke="#e0558f" stroke-width="7" stroke-linecap="round"/>
          <rect x="112" y="206" width="9" height="6" rx="2" fill="#d6d6d6" stroke="none"/>
          <rect x="179" y="206" width="9" height="6" rx="2" fill="#d6d6d6" stroke="none"/>` },
  { id: 'star-backpack', label: 'Star Backpack', emoji: '⭐', theme: 'school', color: '#5c7ce0',
    behindSvg: `<rect x="90" y="136" width="120" height="138" rx="22" fill="#5c7ce0" stroke="#3a55a8" stroke-width="2"/>
          <path d="M126,136 Q150,114 174,136" fill="none" stroke="#3a55a8" stroke-width="5" stroke-linecap="round"/>
          <path d="M98,150 L102,159 L112,160 L104,166 L107,176 L98,170 L89,176 L92,166 L84,160 L94,159 Z" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/>
          <path d="M202,150 L206,159 L216,160 L208,166 L211,176 L202,170 L193,176 L196,166 L188,160 L198,159 Z" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/>`,
    svg: `<path d="M134,152 Q118,190 116,236 M166,152 Q182,190 184,236" fill="none" stroke="#3a55a8" stroke-width="7" stroke-linecap="round"/>
          <path d="M184,236 L184,250" fill="none" stroke="#c98f1f" stroke-width="1.2"/>
          <path d="M184,250 L187,257 L194,258 L189,263 L190,270 L184,266 L178,270 L179,263 L174,258 L181,257 Z" fill="#f2c94c" stroke="#c98f1f" stroke-width="0.8"/>` },
  { id: 'big-bow', label: 'Big Hair Bow', emoji: '🎀', theme: 'school', color: '#d93b4a',
    svg: `<path d="M150,40 Q128,18 114,28 Q106,40 116,52 Q132,52 150,44 Z" stroke="#a82432" stroke-width="1.4"/>
          <path d="M150,40 Q172,18 186,28 Q194,40 184,52 Q168,52 150,44 Z" stroke="#a82432" stroke-width="1.4"/>
          <path d="M146,44 L138,66 L144,64 L148,46 Z M154,44 L162,66 L156,64 L152,46 Z" stroke="#a82432" stroke-width="1"/>
          <rect x="143" y="35" width="14" height="13" rx="4" fill="#a82432" stroke="none"/>
          <path d="M122,32 Q130,30 136,38" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.4"/>` },
  { id: 'twin-bows', label: 'Twin Bows', emoji: '💝', theme: 'school', color: '#ff8fc7',
    svg: `<g stroke="#e0558f" stroke-width="1.1">
            <path d="M106,64 L92,54 L92,74 Z M106,64 L120,54 L120,74 Z"/>
            <path d="M194,64 L180,54 L180,74 Z M194,64 L208,54 L208,74 Z"/>
          </g>
          <circle cx="106" cy="64" r="4" fill="#e0558f" stroke="none"/>
          <circle cx="194" cy="64" r="4" fill="#e0558f" stroke="none"/>` },
  { id: 'sun-hat', label: 'Sun Hat', emoji: '👒', theme: 'summer', color: '#f2d68a',
    svg: `<ellipse cx="150" cy="52" rx="74" ry="15" stroke="#c9a44e" stroke-width="1.5"/>
          <path d="M112,52 Q112,16 150,14 Q188,16 188,52 Z" stroke="#c9a44e" stroke-width="1.5"/>
          <path d="M113,40 Q150,48 187,40 L188,50 Q150,58 112,50 Z" fill="#ff8fc7" stroke="none"/>
          <path d="M186,46 q18,6 22,20 M186,48 q8,10 6,24" fill="none" stroke="#ff8fc7" stroke-width="4" stroke-linecap="round"/>
          <g fill="none" stroke="#c9a44e" stroke-width="0.8" opacity="0.6"><path d="M90,52 Q150,64 210,52 M100,58 Q150,68 200,58"/></g>` },
  { id: 'flower-lei', label: 'Flower Lei', emoji: '🌺', theme: 'summer', color: '#ff6f91',
    svg: Array.from({ length: 11 }, (_, i) => {
      const t = i / 10;
      const x = 124 + 52 * t, y = 154 + 24 * Math.sin(Math.PI * t);
      const col = ['#ff6f91', '#f2c94c', '#b79cff', '#ff9a5c'][i % 4];
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.2" fill="${col}" stroke="none"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="#fff7d6" stroke="none"/>`;
    }).join('') },
  { id: 'pineapple-glasses', label: 'Pineapple Glasses', emoji: '🍍', theme: 'summer', price: 50, color: '#f2c94c',
    svg: [132, 168].map((x) => `
          <path d="M${x - 8},74 L${x - 4},64 L${x},73 L${x + 4},62 L${x + 8},74 Z" fill="#4fae48" stroke="#2f7a2f" stroke-width="1"/>
          <ellipse cx="${x}" cy="90" rx="14" ry="16" fill="#f2c94c" stroke="#c98f1f" stroke-width="1.5"/>
          <path d="M${x - 10},82 L${+x + 6},98 M${x - 6},78 L${+x + 10},94 M${+x + 10},82 L${x - 6},98 M${+x + 6},78 L${x - 10},94" fill="none" stroke="#c98f1f" stroke-width="1" opacity="0.7"/>
          <ellipse cx="${x}" cy="90" rx="9" ry="10" fill="#3a2a1a" stroke="none" opacity="0.82"/>
          <path d="M${x - 5},85 Q${x - 2},82 ${+x + 1},84" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.6" stroke-linecap="round"/>`).join('') +
      `<path d="M146,90 Q150,86 154,90" fill="none" stroke="#c98f1f" stroke-width="2.5"/>
       <line x1="118" y1="88" x2="105" y2="83" stroke="#c98f1f" stroke-width="3"/><line x1="182" y1="88" x2="195" y2="83" stroke="#c98f1f" stroke-width="3"/>` },
  { id: 'party-hat', label: 'Party Hat', emoji: '🥳', theme: 'party', color: '#8c5ce0',
    svg: `<g transform="rotate(12 150 50)">
            <path d="M124,54 L150,-4 L176,54 Z" stroke="#5a3aa8" stroke-width="1.5"/>
            <path d="M133,34 L167,34 L170,42 L130,42 Z M140,18 L160,18 L162,24 L138,24 Z" fill="#f2c94c" stroke="none"/>
            <circle cx="144" cy="48" r="2.6" fill="#ff8fc7" stroke="none"/><circle cx="158" cy="50" r="2.6" fill="#5cc4e0" stroke="none"/>
            <circle cx="150" cy="30" r="2.2" fill="#ff8fc7" stroke="none"/>
            <path d="M122,54 Q150,62 178,54" fill="none" stroke="#5a3aa8" stroke-width="3" stroke-linecap="round"/>
            <g fill="#ff8fc7" stroke="none"><circle cx="150" cy="-6" r="6"/><circle cx="145" cy="-9" r="4"/><circle cx="155" cy="-9" r="4"/></g>
          </g>` },
  { id: 'cake', label: 'Birthday Cake', emoji: '🎂', theme: 'party', color: '#ffffff',
    svg: `<ellipse cx="86" cy="264" rx="26" ry="6" fill="#ffffff" stroke="#d6d6d6" stroke-width="1"/>
          <rect x="66" y="232" width="40" height="30" rx="4" fill="#ffd6ec" stroke="#e0a0c0" stroke-width="1"/>
          <rect x="66" y="246" width="40" height="5" fill="#ffffff" stroke="none"/>
          <path d="M66,236 Q66,228 86,228 Q106,228 106,236 L106,240 Q102,246 98,240 Q94,247 90,240 Q86,247 82,240 Q78,247 74,240 Q70,246 66,240 Z" fill="#ffffff" stroke="#e7d6e0" stroke-width="1"/>
          <g stroke="none"><rect x="72" y="254" width="4" height="1.6" rx="0.8" fill="#5cc4e0" transform="rotate(30 74 255)"/>
            <rect x="92" y="256" width="4" height="1.6" rx="0.8" fill="#f2c94c" transform="rotate(-20 94 257)"/>
            <rect x="82" y="236" width="4" height="1.6" rx="0.8" fill="#e05c5c"/><rect x="96" y="233" width="4" height="1.6" rx="0.8" fill="#43b581" transform="rotate(40 98 234)"/></g>
          <rect x="84" y="212" width="5" height="17" rx="1.5" fill="#5cc4e0" stroke="#3a8fb0" stroke-width="0.6"/>
          <path d="M84,216 L89,212 M84,221 L89,217 M84,226 L89,222" stroke="#ffffff" stroke-width="1.2"/>
          <path class="candle-flame" d="M86.5,211 Q81,204 86.5,196 Q92,204 86.5,211 Z" fill="#f2c94c" stroke="#f28c28" stroke-width="1"/>
          <circle cx="78" cy="231" r="3" fill="#e05c5c" stroke="none"/>` },
  { id: 'hero-cape', label: 'Hero Cape', emoji: '🧣', theme: 'superhero', color: '#d93b4a',
    behindSvg: `<g class="cape-flutter">
            <path d="M112,150 Q86,280 66,432 Q86,440 108,428 Q128,440 150,428 Q172,440 192,428 Q214,440 234,432 Q214,280 188,150 Z" stroke="#9e1f2c" stroke-width="2"/>
            <path d="M120,170 Q104,290 92,420 M150,160 L150,424 M180,170 Q196,290 208,420" fill="none" stroke="#9e1f2c" stroke-width="2" opacity="0.4"/>
          </g>`,
    svg: `<path d="M118,146 L106,166 L128,156 Z M182,146 L194,166 L172,156 Z" stroke="#9e1f2c" stroke-width="1.2"/>
          <circle cx="128" cy="152" r="5" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/>
          <circle cx="172" cy="152" r="5" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/>` },
  { id: 'hero-mask', label: 'Hero Mask', emoji: '🎭', theme: 'superhero', color: '#5a3aa8',
    svg: `<path fill-rule="evenodd" d="M112,88 Q114,76 132,78 Q144,79 150,86 Q156,79 168,78 Q186,76 188,88 Q186,100 168,99 Q156,99 150,93 Q144,99 132,99 Q114,100 112,88 Z
            M122,90 Q125,83 132,83 Q140,83 142,90 Q139,96 132,96 Q125,96 122,90 Z
            M158,90 Q161,83 168,83 Q175,83 178,90 Q175,96 168,96 Q161,96 158,90 Z" stroke="#3a2470" stroke-width="1.2"/>
          <path d="M112,86 L100,80 L104,90 Z M188,86 L200,80 L196,90 Z"/>` },
  { id: 'hero-sword', label: 'Hero Sword', emoji: '🗡️', theme: 'superhero', color: '#dfe6ee',
    svg: `<path d="M210,150 L218,150 L218,256 L214,262 L210,256 Z" stroke="#9aa6b4" stroke-width="1.2"/>
          <path d="M214,154 L214,252" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
          <path d="M209,150 L214,140 L219,150 Z" stroke="#9aa6b4" stroke-width="1.2"/>
          <rect x="200" y="256" width="28" height="7" rx="3" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/>
          <rect x="210" y="263" width="8" height="22" rx="2" fill="#7a3fbf" stroke="none"/>
          <circle cx="214" cy="289" r="5" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/>
          <circle cx="214" cy="259.5" r="2.4" fill="#5cc4e0" stroke="none"/>` },
  { id: 'hero-shield', label: 'Hero Shield', emoji: '🛡️', theme: 'superhero', color: '#5c7ce0',
    svg: `<path d="M60,236 L104,236 L104,262 Q104,288 82,300 Q60,288 60,262 Z" stroke="#3a55a8" stroke-width="2"/>
          <path d="M66,242 L98,242 L98,262 Q98,282 82,292 Q66,282 66,262 Z" fill="#f2c94c" stroke="none" opacity="0.95"/>
          <path d="M86,248 L76,266 L83,266 L78,284 L90,262 L83,262 Z" fill="#5c7ce0" stroke="#3a55a8" stroke-width="1"/>` },
  { id: 'heart-sunglasses', label: 'Heart Sunglasses', emoji: '😍', price: 30, color: '#ff3b7a',
    svg: [132, 168].map((x) => `<path d="M${x},102 C${x - 18},92 ${x - 16},76 ${x - 7},78 C${x - 3},79 ${x},83 ${x},86 C${x},83 ${x + 3},79 ${x + 7},78 C${x + 16},76 ${x + 18},92 ${x},102 Z" fill="#ff3b7a" fill-opacity="0.85" stroke="#c0245e" stroke-width="2"/>
          <path d="M${x - 9},84 Q${x - 6},81 ${x - 3},83" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.7" stroke-linecap="round"/>`).join('') +
      `<path d="M146,86 Q150,83 154,86" fill="none" stroke="#c0245e" stroke-width="2.5"/>
       <line x1="116" y1="86" x2="105" y2="82" stroke="#c0245e" stroke-width="3"/><line x1="184" y1="86" x2="195" y2="82" stroke="#c0245e" stroke-width="3"/>` },
  { id: 'butterfly-clips', label: 'Butterfly Clips', emoji: '🦋', price: 20, color: '#9b6be0',
    svg: [[118, 60, '#9b6be0', -20], [136, 46, '#5cc4e0', -8], [184, 54, '#ff8fc7', 18]].map(([x, y, col, r]) => `<g transform="rotate(${r} ${x} ${y})" stroke="none">
          <ellipse cx="${x - 5}" cy="${y - 3}" rx="5" ry="4" fill="${col}"/><ellipse cx="${x + 5}" cy="${y - 3}" rx="5" ry="4" fill="${col}"/>
          <ellipse cx="${x - 4}" cy="${y + 3}" rx="3.4" ry="3" fill="${col}" opacity="0.8"/><ellipse cx="${x + 4}" cy="${y + 3}" rx="3.4" ry="3" fill="${col}" opacity="0.8"/>
          <circle cx="${x - 5}" cy="${y - 3}" r="1.3" fill="#ffffff" opacity="0.8"/><circle cx="${x + 5}" cy="${y - 3}" r="1.3" fill="#ffffff" opacity="0.8"/>
          <rect x="${x - 1}" y="${y - 6}" width="2" height="12" rx="1" fill="#2b2b2b"/></g>`).join('') },
  { id: 'headphones', label: 'Cool Headphones', emoji: '🎧', price: 45, color: '#2b2b2b',
    svg: `<path d="M102,94 Q100,32 150,30 Q200,32 198,94" fill="none" stroke-width="7" stroke-linecap="round"/>
          <path d="M108,60 Q120,40 150,38" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
          <ellipse cx="100" cy="100" rx="11" ry="15" fill="#f2c94c" stroke="#c98f1f" stroke-width="1.5"/>
          <ellipse cx="200" cy="100" rx="11" ry="15" fill="#f2c94c" stroke="#c98f1f" stroke-width="1.5"/>
          <ellipse cx="100" cy="100" rx="5" ry="8" fill="#ff8fc7" stroke="none"/>
          <ellipse cx="200" cy="100" rx="5" ry="8" fill="#ff8fc7" stroke="none"/>` },
  { id: 'feather-headpiece', label: 'Feather Headpiece', emoji: '🪶', theme: 'ballet', unlockLevel: 2, color: '#ffffff',
    svg: `${[-50, -25, 0, 25, 50].map((a) => `<g transform="rotate(${a} 180 60)">
            <path d="M180,60 Q172,38 180,16 Q188,38 180,60 Z" fill="#ffffff" stroke="#d9d0c0" stroke-width="1"/>
            <path d="M180,58 L180,20" stroke="#d9d0c0" stroke-width="0.8"/></g>`).join('')}
          <path d="M114,62 Q150,40 186,62" fill="none" stroke="#f2c94c" stroke-width="3"/>
          ${[120, 132, 144, 156, 168].map((x, i) => `<circle cx="${x}" cy="${[58, 52, 49, 49, 52][i]}" r="2.6" fill="#fff7ef" stroke="#d9c7b8" stroke-width="0.5"/>`).join('')}
          <circle cx="180" cy="60" r="5" fill="#c9a6ff" stroke="#9b6be0" stroke-width="1"/>` },
  { id: 'feather-boa', label: 'Feather Boa', emoji: '🎀', theme: 'ballet', unlockLevel: 3, color: '#ff8fc7',
    svg: (() => {
      const pts = [];
      for (let i = 0; i <= 22; i++) {
        const t = i / 22;
        // drapes from the left hip, over the shoulders behind the neck, down to the right hip
        const x = 108 + 84 * t;
        const y = 250 - 100 * Math.sin(Math.PI * t) - (t > 0.25 && t < 0.75 ? 0 : 0);
        pts.push([x, y]);
      }
      return pts.map(([x, y], i) => `<circle cx="${(x + (i % 2 ? 2 : -2)).toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 3 ? 7 : 8}" fill="${i % 2 ? '#ff8fc7' : '#ffb3d6'}" stroke="none"/>`).join('') +
        pts.filter((_, i) => i % 2).map(([x, y]) => `<path d="M${x},${y} q-6,6 -10,4 M${x},${y} q6,6 10,4" fill="none" stroke="#ffd6ec" stroke-width="1.2"/>`).join('');
    })() },
  { id: 'feather-fan', label: 'Feather Fan', emoji: '🪭', theme: 'ballet', unlockLevel: 4, color: '#c9a6ff',
    svg: `${[-60, -36, -12, 12, 36, 60].map((a, i) => `<g transform="rotate(${a} 214 268)">
            <path d="M214,268 Q206,238 214,212 Q222,238 214,268 Z" fill="${i % 2 ? '#c9a6ff' : '#ffffff'}" stroke="#9b6be0" stroke-width="1"/>
            <path d="M214,264 L214,216" stroke="#9b6be0" stroke-width="0.7" opacity="0.7"/></g>`).join('')}
          <circle cx="214" cy="268" r="5" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/>
          <rect x="211" y="268" width="6" height="16" rx="2" fill="#f2c94c" stroke="#c98f1f" stroke-width="0.8"/>` },
  { id: 'aviator-sunglasses', label: 'Aviator Sunglasses', emoji: '🕶️', price: 35, color: '#c98f1f',
    svg: [132, 168].map((x) => `<path d="M${x - 14},83 Q${x},79 ${x + 14},83 Q${x + 15},97 ${x + 4},102 Q${x - 9},104 ${x - 14},93 Z" fill="#5a4a3a" fill-opacity="0.78" stroke="#c98f1f" stroke-width="1.8"/>
          <path d="M${x - 9},86 Q${x - 5},83 ${x - 1},85" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.6" stroke-linecap="round"/>`).join('') +
      `<path d="M146,84 L154,84 M147,89 Q150,87 153,89" fill="none" stroke="#c98f1f" stroke-width="1.6"/>
       <line x1="118" y1="85" x2="105" y2="82" stroke="#c98f1f" stroke-width="2.2"/><line x1="182" y1="85" x2="195" y2="82" stroke="#c98f1f" stroke-width="2.2"/>` },
  { id: 'star-sunglasses', label: 'Star Sunglasses', emoji: '🌟', price: 40, color: '#f2c94c',
    svg: [132, 168].map((x) => {
      const star = (r) => Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.48 : r;
        return `${i ? 'L' : 'M'}${(x + rr * Math.cos(a)).toFixed(1)},${(91 + rr * Math.sin(a)).toFixed(1)}`;
      }).join(' ') + ' Z';
      return `<path d="${star(17)}" fill="#f2c94c" stroke="#c98f1f" stroke-width="1.4" stroke-linejoin="round"/>
              <path d="${star(11)}" fill="#3a2a1a" fill-opacity="0.82" stroke="none"/>`;
    }).join('') +
      `<path d="M146,89 Q150,86 154,89" fill="none" stroke="#c98f1f" stroke-width="2.4"/>
       <line x1="116" y1="88" x2="105" y2="83" stroke="#c98f1f" stroke-width="2.6"/><line x1="184" y1="88" x2="195" y2="83" stroke="#c98f1f" stroke-width="2.6"/>` },
  { id: 'cat-eye-sunglasses', label: 'Cat-Eye Sunglasses', emoji: '😼', price: 45, color: '#e0558f',
    svg: [[132, -1], [168, 1]].map(([x, d]) => `<path d="M${x + d * 17},78 L${x - d * 11},85 Q${x - d * 13},98 ${x - d * 2},100 Q${x + d * 12},100 ${x + d * 14},90 Z" fill="#2b2b2b" fill-opacity="0.82" stroke="#e0558f" stroke-width="2.4" stroke-linejoin="round"/>
          <circle cx="${x + d * 15}" cy="80" r="1.8" fill="#ffffff" stroke="none"/>
          <path d="M${x - 5},87 Q${x - 1},84 ${x + 3},86" fill="none" stroke="#ffffff" stroke-width="1.4" opacity="0.6" stroke-linecap="round"/>`).join('') +
      `<path d="M146,88 Q150,85 154,88" fill="none" stroke="#e0558f" stroke-width="2.4"/>
       <line x1="115" y1="84" x2="105" y2="81" stroke="#e0558f" stroke-width="2.6"/><line x1="185" y1="84" x2="195" y2="81" stroke="#e0558f" stroke-width="2.6"/>` },
  { id: 'hoop-earrings', label: 'Hoop Earrings', emoji: '⭕', price: 25, color: '#f2c94c',
    svg: `<circle cx="102" cy="116" r="8" fill="none" stroke="#f2c94c" stroke-width="2.6"/>
          <circle cx="198" cy="116" r="8" fill="none" stroke="#f2c94c" stroke-width="2.6"/>
          <path d="M96,112 Q98,109 101,108 M192,112 Q194,109 197,108" fill="none" stroke="#fff7d6" stroke-width="1.2"/>` },
  { id: 'sparkle-scarf', label: 'Sparkle Scarf', emoji: '🧣', price: 35, color: '#5cc4e0',
    svg: `<path d="M134,142 Q150,154 166,142 L170,156 Q150,168 130,156 Z" stroke="#3a9ac0" stroke-width="1.2"/>
          <path d="M136,154 L130,214 L146,214 L146,158 Z" stroke="#3a9ac0" stroke-width="1.2"/>
          <path d="M131,200 L145,200 M132,188 L145,188" stroke="#ffffff" stroke-width="3" opacity="0.8"/>
          <path d="M131,214 l0,6 M135,214 l0,6 M139,214 l0,6 M143,214 l0,6" stroke="#3a9ac0" stroke-width="1.5"/>
          <g fill="#ffffff" stroke="none"><circle cx="142" cy="150" r="1.3"/><circle cx="156" cy="152" r="1.3"/><circle cx="138" cy="176" r="1.3"/><circle cx="140" cy="206" r="1.3"/></g>` },
  { id: 'beret', label: 'Beret', emoji: '🎨', price: 30, color: '#e05c5c',
    svg: `<g transform="rotate(-12 146 50)">
            <ellipse cx="146" cy="50" rx="54" ry="16" stroke="#a83232" stroke-width="1.5"/>
            <path d="M104,52 Q146,64 188,52" fill="none" stroke="#a83232" stroke-width="2" opacity="0.6"/>
            <path d="M144,34 L146,26 L150,34 Z" stroke="#a83232" stroke-width="1"/>
            <ellipse cx="128" cy="44" rx="14" ry="4" fill="#ffffff" opacity="0.25" stroke="none"/>
          </g>` },
  { id: 'bow-tie', label: 'Bow Tie', emoji: '🎀', price: 20, color: '#8c5ce0',
    svg: `<path d="M150,152 L134,143 L134,161 Z M150,152 L166,143 L166,161 Z" stroke="#5a3aa8" stroke-width="1.2"/>
          <rect x="145" y="147" width="10" height="10" rx="3" fill="#5a3aa8" stroke="none"/>
          <g fill="#ffffff" stroke="none" opacity="0.7"><circle cx="139" cy="149" r="1.2"/><circle cx="140" cy="155" r="1.2"/><circle cx="161" cy="149" r="1.2"/><circle cx="160" cy="155" r="1.2"/></g>` },
  { id: 'sparkle-headband', label: 'Sparkle Headband', emoji: '💖', unlockLevel: 2, color: '#ff8fc7',
    svg: `<path d="M104,72 Q104,30 150,28 Q196,30 196,72" fill="none" stroke="#ff8fc7" stroke-width="6" stroke-linecap="round"/>
          ${[[112, 48], [124, 37], [138, 31], [150, 30], [162, 31], [176, 37], [188, 48]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 3 ? 4.5 : 3}" fill="${['#ffffff', '#c9a6ff', '#ffffff', '#f2c94c', '#ffffff', '#c9a6ff', '#ffffff'][i]}" stroke="none"/>`).join('')}` },
  { id: 'neon-shades', label: 'Neon Shades', emoji: '😎', unlockLevel: 3, color: '#39d98a',
    svg: [132, 168].map((x) => `<rect x="${x - 15}" y="82" width="30" height="17" rx="5" fill="#1b1b2e" fill-opacity="0.85" stroke="#39d98a" stroke-width="3"/>
          <rect x="${x - 15}" y="82" width="30" height="17" rx="5" fill="none" stroke="#39d98a" stroke-width="7" opacity="0.25"/>
          <path d="M${x - 10},86 L${x - 2},86" stroke="#ff6fb0" stroke-width="2" stroke-linecap="round"/>`).join('') +
      `<path d="M147,88 L153,88" stroke="#39d98a" stroke-width="3"/>
       <line x1="117" y1="87" x2="105" y2="83" stroke="#39d98a" stroke-width="3"/><line x1="183" y1="87" x2="195" y2="83" stroke="#39d98a" stroke-width="3"/>` },
  { id: 'gold-chain', label: 'Gold Chain', emoji: '⛓️', unlockLevel: 4, color: '#f2c94c',
    svg: Array.from({ length: 15 }, (_, i) => {
      const t = i / 14, x = 128 + 44 * t, y = 154 + 22 * Math.sin(Math.PI * t);
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="3" ry="2" fill="none" stroke="#e0b13a" stroke-width="1.6" transform="rotate(${(Math.cos(Math.PI * t) * -40).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }).join('') + `<path d="M150,178 L153,185 L160,186 L155,191 L156,198 L150,194 L144,198 L145,191 L140,186 L147,185 Z" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/>` },
  { id: 'diamond-sunglasses', label: 'Diamond Sunglasses', emoji: '💎', unlockLevel: 5, color: '#dfe6ee',
    svg: [132, 168].map((x) => `<path d="M${x},74 L${x + 16},90 L${x},106 L${x - 16},90 Z" fill="#9fd8f0" fill-opacity="0.8" stroke="#dfe6ee" stroke-width="2.6" stroke-linejoin="round"/>
          <path d="M${x},74 L${x},106 M${x - 16},90 L${x + 16},90" stroke="#ffffff" stroke-width="0.8" opacity="0.6"/>
          <path d="M${x + 12},76 l1.5,3.5 l3.5,1.5 l-3.5,1.5 l-1.5,3.5 l-1.5,-3.5 l-3.5,-1.5 l3.5,-1.5 Z" fill="#ffffff" stroke="none"/>`).join('') +
      `<path d="M147,90 L153,90" stroke="#dfe6ee" stroke-width="2.6"/>
       <line x1="116" y1="90" x2="105" y2="84" stroke="#dfe6ee" stroke-width="2.6"/><line x1="184" y1="90" x2="195" y2="84" stroke="#dfe6ee" stroke-width="2.6"/>` },
  { id: 'angel-halo', label: 'Angel Halo', emoji: '😇', unlockLevel: 6, color: '#f2c94c',
    svg: `<g class="float-bob">
            <ellipse cx="150" cy="26" rx="36" ry="9" fill="none" stroke="#fff3a8" stroke-width="10" opacity="0.35"/>
            <ellipse cx="150" cy="26" rx="34" ry="8" fill="none" stroke="#f2c94c" stroke-width="4"/>
            <path d="M124,22 Q136,18 148,18" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.7"/>
          </g>` },
  { id: 'rainbow-wings', label: 'Rainbow Wings', emoji: '🌈', unlockLevel: 7, color: '#ff8fc7',
    behindSvg: `<g class="cape-flutter">${[['#e05c5c', 0], ['#f2c94c', 9], ['#43b581', 18], ['#5c7ce0', 27], ['#9b6be0', 36]].map(([c, k]) => `
            <path d="M120,180 Q${40 + k},${110 + k} ${18 + k},${180 + k * 0.4} Q${44 + k},${232 - k * 0.2} 120,224 Z" fill="${c}" opacity="0.95"/>
            <path d="M180,180 Q${260 - k},${110 + k} ${282 - k},${180 + k * 0.4} Q${256 - k},${232 - k * 0.2} 180,224 Z" fill="${c}" opacity="0.95"/>`).join('')}
            <g fill="#ffffff" opacity="0.8"><circle cx="60" cy="160" r="2"/><circle cx="240" cy="168" r="2"/><circle cx="76" cy="200" r="1.6"/><circle cx="226" cy="204" r="1.6"/></g>
          </g>`,
    svg: '' },
  { id: 'star-crown', label: 'Star Crown', emoji: '✨', unlockLevel: 8, color: '#f2c94c',
    svg: `${[-2, -1, 0, 1, 2].map((i) => {
            const x = 150 + i * 18, y = 30 - (2 - Math.abs(i)) * 6, r = i === 0 ? 11 : 8;
            const pts = Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.45 : r; return `${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`; }).join(' ');
            return `<polygon points="${pts}" fill="#f2c94c" stroke="#c98f1f" stroke-width="1" stroke-linejoin="round"/>`;
          }).join('')}
          <rect x="108" y="42" width="84" height="12" rx="4" stroke="#c98f1f" stroke-width="1.2"/>
          <circle cx="132" cy="48" r="3" fill="#ff6f91" stroke="none"/><circle cx="150" cy="48" r="3.4" fill="#5cc4e0" stroke="none"/><circle cx="168" cy="48" r="3" fill="#9b6be0" stroke="none"/>` },
  { id: 'baddie-shades', label: 'Baddie Shades', emoji: '🖤', pass: 'baddie', passTier: 0, color: '#111116',
    svg: [132, 168].map((x) => `<path d="M${x - 15},84 L${x + 15},84 L${x + 13},95 Q${x},98 ${x - 13},95 Z" fill="#111116" fill-opacity="0.92" stroke="#f2c94c" stroke-width="1.2"/>
          <path d="M${x - 10},87 L${x - 3},87" stroke="#ffffff" stroke-width="1.4" opacity="0.5" stroke-linecap="round"/>`).join('') +
      `<path d="M117,84 L183,84" stroke="#f2c94c" stroke-width="1.6"/>
       <line x1="117" y1="85" x2="105" y2="82" stroke="#111116" stroke-width="2.6"/><line x1="183" y1="85" x2="195" y2="82" stroke="#111116" stroke-width="2.6"/>` },
  { id: 'baddie-chain', label: 'Heart Bling Chain', emoji: '💛', pass: 'baddie', passTier: 1, color: '#f2c94c',
    svg: Array.from({ length: 13 }, (_, i) => {
      const t = i / 12, x = 126 + 48 * t, y = 154 + 26 * Math.sin(Math.PI * t);
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="2.8" fill="none" stroke="#e0b13a" stroke-width="2.4" transform="rotate(${(Math.cos(Math.PI * t) * -40).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }).join('') + `<path d="M150,206 C138,198 136,186 144,184 C147,183 150,186 150,189 C150,186 153,183 156,184 C164,186 162,198 150,206 Z" fill="#f2c94c" stroke="#c98f1f" stroke-width="1.2"/>
      <g fill="#ffffff" stroke="none"><circle cx="146" cy="190" r="1.4"/><circle cx="153" cy="193" r="1.1"/><circle cx="150" cy="198" r="1.2"/></g>` },
  { id: 'lollipop', label: 'Swirl Lollipop', emoji: '🍭', pass: 'sweetie', passTier: 0, color: '#ff6fb0',
    svg: `<line x1="214" y1="292" x2="220" y2="236" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round"/>
          <circle cx="221" cy="220" r="18" fill="#ffffff" stroke="#e0458f" stroke-width="1.5"/>
          <path d="M221,220 m0,-3 a3,3 0 1 1 -3,3 a6,6 0 1 1 6,6 a9,9 0 1 1 -9,-9 a12,12 0 1 1 12,12 a15,15 0 0 1 -15,-15" fill="none" stroke="#ff6fb0" stroke-width="3.4" stroke-linecap="round"/>
          <path d="M210,228 q-2,8 6,10" fill="none" stroke="#e0458f" stroke-width="2" stroke-linecap="round"/>
          <path d="M214,236 l-6,-4 l2,8 Z M222,237 l6,-3 l-1,8 Z" fill="#5cc4e0" stroke="none"/>` },
  { id: 'candy-clips', label: 'Candy Clips', emoji: '🍬', pass: 'sweetie', passTier: 1, color: '#f2c94c',
    svg: [[116, 58, '#ff6fb0', -20], [184, 58, '#5cc4e0', 20], [134, 44, '#f2c94c', -10]].map(([x, y, c, r]) => `<g transform="rotate(${r} ${x} ${y})" stroke="none">
          <path d="M${x - 7},${y} L${x - 14},${y - 6} L${x - 14},${y + 6} Z M${x + 7},${y} L${x + 14},${y - 6} L${x + 14},${y + 6} Z" fill="${c}" opacity="0.85"/>
          <ellipse cx="${x}" cy="${y}" rx="8" ry="6" fill="${c}"/>
          <path d="M${x - 4},${y - 4} L${x - 1},${y + 5} M${x + 1},${y - 5} L${x + 4},${y + 4}" stroke="#ffffff" stroke-width="1.6" opacity="0.8"/></g>`).join('') },
  { id: 'sleeping-mask', label: 'Sleeping Mask', emoji: '😴', theme: 'sleepy', color: '#ffb3d6',
    svg: `<path d="M106,86 L100,84 M194,86 L200,84" stroke="#e0458f" stroke-width="3"/>
          <path d="M106,86 Q108,74 132,75 Q150,78 168,75 Q192,74 194,86 Q194,102 170,101 Q150,97 130,101 Q106,102 106,86 Z" stroke="#e0458f" stroke-width="1.6"/>
          ${[132, 168].map((x) => `<path d="M${x - 8},88 Q${x},94 ${x + 8},88" fill="none" stroke="#e0458f" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M${x - 5},91 l-1.5,3.5 M${x},92.5 l0,3.6 M${x + 5},91 l1.5,3.5" stroke="#e0458f" stroke-width="1.3" stroke-linecap="round"/>`).join('')}
          <text x="196" y="66" font-family="Arial, sans-serif" font-weight="700" font-size="12" fill="#9b6be0" stroke="none">z</text>
          <text x="204" y="56" font-family="Arial, sans-serif" font-weight="700" font-size="15" fill="#9b6be0" stroke="none">Z</text>` },
  { id: 'sheet-mask', label: 'Sheet Face Mask', emoji: '🤍', theme: 'sleepy', color: '#ffffff',
    svg: `<path fill-rule="evenodd" d="M150,50 C178,50 196,68 196,94 C196,122 176,140 150,140 C124,140 104,122 104,94 C104,68 122,50 150,50 Z
            M122,90 Q132,80 142,90 Q132,99 122,90 Z M158,90 Q168,80 178,90 Q168,99 158,90 Z
            M138,112 Q150,104 162,112 Q150,121 138,112 Z" fill="#ffffff" fill-opacity="0.85" stroke="#e6e6e6" stroke-width="1"/>
          <path d="M120,70 Q130,62 142,64" fill="none" stroke="#e6e6e6" stroke-width="1.2"/>` },
  { id: 'cucumber-eyes', label: 'Cucumber Eyes', emoji: '🥒', theme: 'sleepy', color: '#6fbf5e',
    svg: [132, 168].map((x) => `<circle cx="${x}" cy="90" r="11" fill="#4fa04a" stroke="none"/>
          <circle cx="${x}" cy="90" r="9" fill="#cdeec0" stroke="none"/>
          ${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="${(x + Math.cos(a * Math.PI / 180) * 4.5).toFixed(1)}" cy="${(90 + Math.sin(a * Math.PI / 180) * 4.5).toFixed(1)}" rx="1.3" ry="0.8" fill="#9ccf8a" stroke="none" transform="rotate(${a} ${(x + Math.cos(a * Math.PI / 180) * 4.5).toFixed(1)} ${(90 + Math.sin(a * Math.PI / 180) * 4.5).toFixed(1)})"/>`).join('')}`).join('') },
  { id: 'clay-mask', label: 'Green Clay Mask', emoji: '💚', theme: 'sleepy', color: '#a8d8a0',
    svg: `<path fill-rule="evenodd" d="M150,58 C176,58 192,74 192,96 C192,120 174,134 150,134 C126,134 108,120 108,96 C108,74 124,58 150,58 Z
            M120,90 Q132,79 144,90 Q132,100 120,90 Z M156,90 Q168,79 180,90 Q168,100 156,90 Z
            M136,112 Q150,103 164,112 Q150,122 136,112 Z" fill="#a8d8a0" fill-opacity="0.92" stroke="#86bf7d" stroke-width="1"/>
          <g fill="#86bf7d" stroke="none" opacity="0.7"><circle cx="126" cy="72" r="1.2"/><circle cx="170" cy="70" r="1.2"/><circle cx="118" cy="108" r="1.2"/><circle cx="182" cy="110" r="1.2"/><circle cx="150" cy="126" r="1.2"/></g>` },
  { id: 'santa-hat', label: 'Santa Hat', emoji: '🎅', theme: 'christmas', color: '#c1272d',
    svg: `<path d="M108,58 C110,26 136,8 160,10 C186,12 206,36 214,72 C202,58 192,46 180,40 C186,46 190,52 192,58 Z" stroke="#8e1b20" stroke-width="1.2"/>
          <path d="M124,46 C128,30 142,20 158,18" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25"/>
          <path d="M186,30 C198,40 206,52 210,64" fill="none" stroke="#8e1b20" stroke-width="1.5" opacity="0.5"/>
          <g fill="#f8f8f8" stroke="#dcdcdc" stroke-width="0.8">
            <rect x="102" y="50" width="96" height="16" rx="8"/>
            ${[106, 116, 126, 136, 146, 156, 166, 176, 186, 194].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 51 : 64}" r="5"/>`).join('')}
            <circle cx="214" cy="76" r="8"/><circle cx="208" cy="80" r="5"/><circle cx="220" cy="81" r="5"/><circle cx="214" cy="69" r="5"/>
          </g>` },
  { id: 'hot-cocoa', label: 'Hot Cocoa', emoji: '☕', theme: 'christmas', color: '#e05c5c',
    svg: `<g fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.8">
            <path class="cocoa-steam" d="M78,236 q-4,-6 0,-12 q4,-6 0,-12"/>
            <path class="cocoa-steam cocoa-steam-b" d="M88,234 q-4,-6 0,-12 q4,-6 0,-12"/>
          </g>
          <path d="M70,248 q-12,0 -12,9 q0,9 12,9" fill="none" stroke="#e05c5c" stroke-width="4"/>
          <path d="M70,240 L98,240 L96,272 Q84,277 72,272 Z" stroke="#a83232" stroke-width="1.2"/>
          <ellipse cx="84" cy="241" rx="14" ry="3.6" fill="#6b3f1d" stroke="#a83232" stroke-width="1"/>
          <rect x="75" y="236" width="7" height="6" rx="2" fill="#ffffff" stroke="#e7d6e0" stroke-width="0.6"/>
          <rect x="84" y="235" width="7" height="6" rx="2" fill="#fff0f6" stroke="#e7d6e0" stroke-width="0.6" transform="rotate(12 87 238)"/>
          <g stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.9">
            <line x1="84" y1="252" x2="84" y2="264"/><line x1="78" y1="258" x2="90" y2="258"/><line x1="80" y1="254" x2="88" y2="262"/><line x1="88" y1="254" x2="80" y2="262"/>
          </g>` },
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
  { id: 'witch-hat', label: 'Witch Hat', emoji: '🧙', theme: 'halloween', color: '#3b2a5c',
    svg: `<ellipse cx="150" cy="54" rx="62" ry="12"/>
          <path d="M116,54 Q130,32 140,12 Q148,2 172,2 Q156,12 160,26 Q170,42 184,54 Z"/>
          <path d="M118,47 Q150,57 182,47 L184,54 Q150,64 116,54 Z" fill="#f28c28" stroke="none"/>
          <rect x="143" y="47" width="14" height="11" rx="2" fill="#f2c94c" stroke="none"/>` },
  { id: 'candy-bag', label: 'Candy Bag', emoji: '🍭', theme: 'halloween', color: '#f28c28',
    svg: `<path d="M197,294 Q214,262 231,294" fill="none" stroke="#3a2a1a" stroke-width="2.5"/>
          <circle cx="206" cy="284" r="4.5" fill="#e0558f" stroke="none"/>
          <circle cx="215" cy="281" r="4.5" fill="#5cc4e0" stroke="none"/>
          <circle cx="223" cy="285" r="4" fill="#f2c94c" stroke="none"/>
          <rect x="212" y="268" width="2" height="12" fill="#ffffff" stroke="none"/>
          <circle cx="213" cy="267" r="5" fill="#8c5ce0" stroke="none"/>
          <ellipse cx="214" cy="301" rx="19" ry="16" stroke="#c0621a" stroke-width="1.5"/>
          <path d="M206,297 l3.5,-6 l3.5,6 Z" fill="#3a1f0a" stroke="none"/>
          <path d="M215,297 l3.5,-6 l3.5,6 Z" fill="#3a1f0a" stroke="none"/>
          <path d="M204,304 Q214,313 224,304 Q214,309 204,304 Z" fill="#3a1f0a" stroke="none"/>` },
  { id: 'tiara', label: 'Tiara', emoji: '👑', unlockLevel: 2, color: '#f2c94c',
    svg: `<path d="M112,50 L130,30 L150,42 L170,30 L188,50 Z" stroke="#c98f1f" stroke-width="2"/>
          <circle cx="150" cy="36" r="4" fill="#fff7d6"/>
          <circle cx="151" cy="34" r="1.2" fill="#ffffff" opacity="0.8"/>` },
  { id: 'diamond-necklace', label: 'Diamond Necklace', emoji: '💎', unlockLevel: 3, color: '#bfe9ff',
    svg: `<path d="M128,155 Q150,180 172,155" fill="none" stroke-width="3"/>
          <circle cx="150" cy="182" r="6"/>
          <circle cx="136" cy="172" r="3.5"/>
          <circle cx="164" cy="172" r="3.5"/>
          <circle cx="151" cy="180" r="1.6" fill="#ffffff" opacity="0.8"/>
          <circle cx="137" cy="170" r="1" fill="#ffffff" opacity="0.7"/>
          <circle cx="165" cy="170" r="1" fill="#ffffff" opacity="0.7"/>` },
  { id: 'star-earrings', label: 'Star Earrings', emoji: '⭐', unlockLevel: 4, color: '#f2c94c',
    svg: `<path d="M100,108 l2,-5 l2,5 l5,2 l-5,2 l-2,5 l-2,-5 l-5,-2 Z"/>
          <path d="M200,108 l2,-5 l2,5 l5,2 l-5,2 l-2,5 l-2,-5 l-5,-2 Z"/>` },
  { id: 'crown', label: 'Royal Crown', emoji: '👑', unlockLevel: 5, color: '#f2c94c',
    svg: `<path d="M104,58 L118,20 L134,44 L150,14 L166,44 L182,20 L196,58 Z" stroke="#c98f1f" stroke-width="2"/>
          <circle cx="150" cy="18" r="5" fill="#e05c5c"/>
          <circle cx="122" cy="40" r="4" fill="#5cc4e0"/>
          <circle cx="178" cy="40" r="4" fill="#5cc4e0"/>
          <rect x="104" y="56" width="92" height="8" rx="3"/>
          <circle cx="148" cy="16" r="1.4" fill="#ffffff" opacity="0.8"/>
          <circle cx="121" cy="38" r="1" fill="#ffffff" opacity="0.7"/>
          <circle cx="177" cy="38" r="1" fill="#ffffff" opacity="0.7"/>` },
];

// Each pet is drawn in its own 0..160 square viewBox standing on a shared ground line,
// with a "collar" anchor (for bow/bandana/bell) and a "hat" anchor (for the party hat).
// The horse also carries a "mount" anchor used to seat the rider in Ride mode.
const PETS = [
  { id: 'none', label: 'No Pet', emoji: '🚫' },
  { id: 'dog', label: 'Dog', emoji: '🐶', color: '#c68642', collar: { x: 118, y: 90 }, hat: { x: 118, y: 48 },
    body: `<path d="M46,100 Q20,90 28,68 Q36,84 52,94 Z"/>
           <rect x="95" y="112" width="13" height="38" rx="6"/>
           <rect x="55" y="115" width="13" height="35" rx="6"/>
           <ellipse cx="80" cy="105" rx="38" ry="26"/>
           <circle cx="118" cy="72" r="22"/>
           <ellipse cx="104" cy="58" rx="8" ry="16" transform="rotate(-20 104 58)"/>
           <ellipse cx="130" cy="58" rx="8" ry="16" transform="rotate(20 130 58)"/>
           <ellipse cx="134" cy="80" rx="10" ry="8"/>`,
    details: `<circle cx="142" cy="78" r="3" fill="#2b2b2b"/>
           <circle cx="122" cy="66" r="2.5" fill="#2b2b2b"/>
           <circle cx="120" cy="64" r="0.9" fill="#ffffff"/>` },
  { id: 'cat', label: 'Cat', emoji: '🐱', color: '#8a8a8a', collar: { x: 116, y: 92 }, hat: { x: 116, y: 55 },
    body: `<path d="M50,105 Q20,110 18,80 Q16,55 34,50 Q28,72 40,90 Q46,100 56,102 Z"/>
           <rect x="98" y="118" width="12" height="32" rx="6"/>
           <rect x="58" y="120" width="12" height="30" rx="6"/>
           <ellipse cx="82" cy="108" rx="34" ry="24"/>
           <circle cx="116" cy="76" r="19"/>
           <path d="M100,64 L106,44 L114,66 Z"/>
           <path d="M120,64 L128,44 L132,68 Z"/>
           <ellipse cx="128" cy="82" rx="7" ry="5"/>`,
    details: `<path d="M132,80 L138,78 L132,84 Z" fill="#ff9fc7"/>
           <circle cx="120" cy="72" r="2.2" fill="#2b2b2b"/>
           <circle cx="108" cy="70" r="2.2" fill="#2b2b2b"/>` },
  { id: 'bunny', label: 'Bunny', emoji: '🐰', color: '#f5f0e6', collar: { x: 110, y: 96 }, hat: { x: 110, y: 50 },
    body: `<circle cx="52" cy="118" r="10"/>
           <ellipse cx="95" cy="132" rx="9" ry="12"/>
           <ellipse cx="80" cy="112" rx="32" ry="26"/>
           <circle cx="110" cy="80" r="20"/>
           <ellipse cx="100" cy="45" rx="6" ry="28" transform="rotate(-8 100 45)"/>
           <ellipse cx="118" cy="45" rx="6" ry="28" transform="rotate(8 118 45)"/>`,
    details: `<ellipse cx="122" cy="86" rx="4" ry="3" fill="#ff9fc7"/>
           <circle cx="112" cy="74" r="2.2" fill="#2b2b2b"/>
           <circle cx="100" cy="76" r="2.2" fill="#2b2b2b"/>` },
  { id: 'horse', label: 'Horse', emoji: '🐴', color: '#8a5a2b', collar: { x: 122, y: 65 }, mount: { x: 75, y: 74 }, rideable: true,
    body: `<path d="M32,95 Q15,90 20,68" fill="none" stroke-width="7" stroke-linecap="round"/>
           <rect x="40" y="105" width="11" height="42" rx="5"/>
           <rect x="58" y="108" width="11" height="40" rx="5"/>
           <rect x="92" y="108" width="11" height="40" rx="5"/>
           <rect x="112" y="105" width="11" height="42" rx="5"/>
           <ellipse cx="75" cy="98" rx="44" ry="26"/>
           <path d="M95,82 Q108,55 130,42 Q140,48 136,60 Q120,68 108,95 Z"/>
           <ellipse cx="145" cy="45" rx="16" ry="11"/>
           <ellipse cx="161" cy="49" rx="8" ry="6"/>
           <path d="M136,36 L132,24 L142,34 Z"/>
           <path d="M148,35 L152,22 L156,35 Z"/>`,
    details: `<path d="M112,88 L104,84 L114,80 Z" fill="mane"/>
           <path d="M118,76 L110,72 L120,68 Z" fill="mane"/>
           <path d="M124,64 L116,60 L126,56 Z" fill="mane"/>
           <path d="M130,50 L124,46 L133,44 Z" fill="mane"/>
           <circle cx="151" cy="42" r="2.2" fill="#2b2b2b"/>` },
  { id: 'bat', label: 'Bat', emoji: '🦇', color: '#4b3b63', collar: { x: 80, y: 74 }, hat: { x: 80, y: 44 },
    body: `<path d="M64,80 Q34,48 8,68 Q20,76 18,92 Q30,86 34,102 Q46,90 64,98 Z"/>
           <path d="M96,80 Q126,48 152,68 Q140,76 142,92 Q130,86 126,102 Q114,90 96,98 Z"/>
           <ellipse cx="80" cy="90" rx="19" ry="24"/>
           <path d="M66,52 L64,32 L76,46 Z"/>
           <path d="M94,52 L96,32 L84,46 Z"/>
           <circle cx="80" cy="60" r="16"/>`,
    details: `<circle cx="74" cy="58" r="3.4" fill="#ffe066"/>
           <circle cx="86" cy="58" r="3.4" fill="#ffe066"/>
           <circle cx="74" cy="58.5" r="1.4" fill="#2b2b2b"/>
           <circle cx="86" cy="58.5" r="1.4" fill="#2b2b2b"/>
           <path d="M76,66 L77.5,70 L79,66 Z" fill="#ffffff"/>
           <path d="M81,66 L82.5,70 L84,66 Z" fill="#ffffff"/>
           <path d="M74,114 l-3,8 M86,114 l3,8" stroke="#2b2b2b" stroke-width="2" stroke-linecap="round"/>` },
  { id: 'bird', label: 'Bird', emoji: '🐦', color: '#4aa3df', collar: { x: 102, y: 92 }, hat: { x: 106, y: 58 },
    body: `<path d="M56,104 L18,88 L24,104 L16,116 Z"/>
           <ellipse cx="80" cy="106" rx="32" ry="26"/>
           <circle cx="106" cy="78" r="19"/>
           <path d="M100,60 Q98,46 106,44 Q104,52 108,60 Z"/>
           <path d="M106,60 Q110,46 118,48 Q112,54 112,62 Z"/>`,
    details: `<ellipse cx="88" cy="114" rx="18" ry="14" fill="belly"/>
           <path d="M58,100 Q78,84 100,98 Q90,124 58,100 Z" fill="shade"/>
           <path d="M66,104 Q80,98 92,104" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.4"/>
           <path d="M122,74 L138,80 L122,86 Z" fill="#f2a33a"/>
           <circle cx="112" cy="74" r="4" fill="#ffffff"/>
           <circle cx="113" cy="74" r="2.4" fill="#2b2b2b"/>
           <circle cx="114" cy="73" r="0.8" fill="#ffffff"/>
           <ellipse cx="112" cy="86" rx="4" ry="2.5" fill="#ff8fa3" opacity="0.6"/>
           <g stroke="#f2a33a" stroke-width="3" stroke-linecap="round" fill="none">
             <path d="M76,130 L74,150 M74,150 l-6,0 M74,150 l5,0"/>
             <path d="M90,130 L92,150 M92,150 l-5,0 M92,150 l6,0"/>
           </g>` },
  { id: 'fish', label: 'Fish', emoji: '🐠', color: '#ff9a5c', collar: { x: 98, y: 76 }, hat: { x: 92, y: 52 },
    body: `<path d="M44,92 L14,68 Q20,92 14,116 Z"/>
           <path d="M74,62 Q92,36 112,58 Z"/>
           <path d="M76,120 Q90,138 104,118 Z"/>
           <ellipse cx="86" cy="92" rx="44" ry="31"/>`,
    details: `<path d="M70,64 Q60,92 70,120 L80,121 Q70,92 80,63 Z" fill="#ffffff" opacity="0.9"/>
           <path d="M100,62 Q92,92 100,122 L108,120 Q100,92 108,64 Z" fill="#ffffff" opacity="0.9"/>
           <path d="M40,92 L22,78 M40,92 L20,92 M40,92 L22,106" fill="none" stroke="shade" stroke-width="1.5" opacity="0.6"/>
           <circle cx="114" cy="84" r="7" fill="#ffffff"/>
           <circle cx="116" cy="84" r="4" fill="#2b2b2b"/>
           <circle cx="117.5" cy="82.5" r="1.4" fill="#ffffff"/>
           <path d="M124,100 Q128,104 124,107" fill="none" stroke="#2b2b2b" stroke-width="1.6" stroke-linecap="round"/>
           <ellipse cx="112" cy="98" rx="4" ry="2.4" fill="#ff8fa3" opacity="0.6"/>
           <circle cx="140" cy="62" r="4" fill="none" stroke="#bfe9ff" stroke-width="1.4"/>
           <circle cx="148" cy="48" r="2.6" fill="none" stroke="#bfe9ff" stroke-width="1.2"/>` },
  { id: 'giraffe', label: 'Giraffe', emoji: '🦒', color: '#e8c468', collar: { x: 100, y: 60 }, hat: { x: 118, y: 8 },
    body: `<rect x="42" y="98" width="9" height="50" rx="4"/>
           <rect x="58" y="100" width="9" height="48" rx="4"/>
           <rect x="90" y="100" width="9" height="48" rx="4"/>
           <rect x="105" y="98" width="9" height="50" rx="4"/>
           <ellipse cx="75" cy="92" rx="30" ry="20"/>
           <path d="M92,80 Q100,50 108,30 Q116,20 122,22 Q114,25 110,35 Q104,55 100,84 Z"/>
           <ellipse cx="118" cy="18" rx="13" ry="10"/>
           <circle cx="112" cy="7" r="3"/>
           <circle cx="123" cy="7" r="3"/>`,
    details: `<circle cx="60" cy="88" r="5" fill="spot" opacity="0.8"/>
           <circle cx="80" cy="82" r="4" fill="spot" opacity="0.8"/>
           <circle cx="70" cy="100" r="4.5" fill="spot" opacity="0.8"/>
           <circle cx="100" cy="55" r="4" fill="spot" opacity="0.8"/>
           <circle cx="106" cy="70" r="3.5" fill="spot" opacity="0.8"/>
           <circle cx="122" cy="22" r="2" fill="#2b2b2b"/>` },
];

const PET_ACCESSORIES = [
  { id: 'none', label: 'No Accessory', emoji: '—' },
  { id: 'bow', label: 'Bow', emoji: '🎀', color: '#e0558f', anchor: 'collar',
    svg: (c) => `<path d="M-9,0 L-2,-4.5 L-2,4.5 Z" fill="${c}"/><path d="M9,0 L2,-4.5 L2,4.5 Z" fill="${c}"/><circle cx="0" cy="0" r="3" fill="${darken(c, 0.2)}"/>` },
  { id: 'bandana', label: 'Bandana', emoji: '🧣', color: '#5cc4e0', anchor: 'collar',
    svg: (c) => `<path d="M-12,-3 L12,-3 L12,2 L-12,2 Z" fill="${c}"/><path d="M-4,2 L4,2 L0,13 Z" fill="${c}"/>` },
  { id: 'bell-collar', label: 'Bell Collar', emoji: '🔔', color: '#f2c94c', anchor: 'collar',
    svg: (c) => `<rect x="-11" y="-3" width="22" height="5" rx="2.5" fill="${c}"/><circle cx="0" cy="5" r="3.2" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/><circle cx="-1" cy="4" r="0.8" fill="#fff7d6"/>` },
  { id: 'party-hat', label: 'Party Hat', emoji: '🎉', color: '#8c5ce0', anchor: 'hat',
    svg: (c) => `<path d="M-9,0 L0,-20 L9,0 Z" fill="${c}"/><circle cx="0" cy="-20" r="2.4" fill="#fff7d6"/><circle cx="-3" cy="-8" r="1.6" fill="#fff7d6" opacity="0.8"/><circle cx="3" cy="-14" r="1.6" fill="#fff7d6" opacity="0.8"/>` },
];

function buildPetSVG(petDef, color, idSuffix) {
  const grad = `petGrad${idSuffix}`;
  const light = lighten(color, 0.3);
  const dark = darken(color, 0.28);
  const details = (petDef.details || '')
    .replace(/fill="mane"/g, `fill="${darken(color, 0.5)}"`)
    .replace(/fill="spot"/g, `fill="${darken(color, 0.45)}"`)
    .replace(/fill="shade"/g, `fill="${darken(color, 0.3)}"`)
    .replace(/stroke="shade"/g, `stroke="${darken(color, 0.3)}"`)
    .replace(/fill="belly"/g, `fill="${lighten(color, 0.6)}"`);
  return `
    <defs>
      <linearGradient id="${grad}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${light}"/>
        <stop offset="55%" stop-color="${color}"/>
        <stop offset="100%" stop-color="${dark}"/>
      </linearGradient>
    </defs>
    <g fill="url(#${grad})" stroke="${dark}" stroke-width="2">${petDef.body}</g>
    ${details}
  `;
}

function buildPetAccessorySVG(petDef, accessoryId) {
  if (!accessoryId || accessoryId === 'none') return '';
  const accDef = PET_ACCESSORIES.find((a) => a.id === accessoryId);
  if (!accDef || !accDef.svg) return '';
  const anchor = petDef[accDef.anchor];
  if (!anchor) return '';
  return `<g transform="translate(${anchor.x},${anchor.y})">${accDef.svg(accDef.color)}</g>`;
}

const EYE_SHAPES = [
  { id: 'round', label: 'Round', emoji: '●' },
  { id: 'almond', label: 'Almond', emoji: '◔' },
  { id: 'sleepy', label: 'Sleepy', emoji: '⌣' },
  { id: 'wide', label: 'Wide', emoji: '◎' },
  { id: 'closed', label: 'Closed', emoji: '😌' },
];

const EYE_COLORS = ['#3b2417', '#5b3a29', '#4a7043', '#3a6ea5', '#6b6b6b', '#9c6b2e'];

const EYEBROW_SHAPES = [
  { id: 'soft', label: 'Soft Arch', emoji: '⌒' },
  { id: 'straight', label: 'Straight', emoji: '—' },
  { id: 'thick', label: 'Bold', emoji: '▬' },
];

const MOUTH_SHAPES = [
  { id: 'smile', label: 'Smile', emoji: '🙂' },
  { id: 'grin', label: 'Grin', emoji: '😁' },
  { id: 'neutral', label: 'Neutral', emoji: '😐' },
  { id: 'surprised', label: 'Surprised', emoji: '😮' },
];

const LIP_COLORS = ['#d9a98c', '#c9707d', '#c0293b', '#e0558f', '#e8836b', '#8c4a6b'];

const LASH_STYLES = [
  { id: 'none', label: 'No Lashes', emoji: '○' },
  { id: 'natural', label: 'Natural', emoji: '👁️' },
  { id: 'long', label: 'Long', emoji: '🦋' },
  { id: 'glam', label: 'Glam', emoji: '💃' },
  { id: 'sparkle', label: 'Sparkle', emoji: '✨' },
  { id: 'rainbow', label: 'Rainbow', emoji: '🌈' },
];

// Upper-lid size for each eye shape, so lashes sit right on the lid.
const EYE_LID = {
  round: { cy: 90, rx: 7, ry: 6.5 },
  almond: { cy: 90, rx: 8, ry: 5 },
  sleepy: { cy: 91, rx: 7, ry: 3.4 },
  wide: { cy: 89, rx: 8.5, ry: 7.5 },
  closed: { cy: 91, rx: 7.5, ry: 2.6 },
};

function lashesSVG(style, shape, cx, side) {
  if (!style || style === 'none') return '';
  const lid = EYE_LID[shape] || EYE_LID.round;
  const cfg = {
    natural: { n: 3, len: 3, w: 1.1, curl: 0.3 },
    long: { n: 4, len: 5.5, w: 1.2, curl: 0.6 },
    glam: { n: 5, len: 6.5, w: 1.5, curl: 0.7 },
    sparkle: { n: 4, len: 5.5, w: 1.3, curl: 0.6 },
    rainbow: { n: 5, len: 5.5, w: 1.5, curl: 0.6 },
  }[style];
  const rainbow = ['#e05c5c', '#f2c94c', '#43b581', '#5c7ce0', '#9b6be0'];
  let out = '';
  for (let i = 0; i < cfg.n; i++) {
    const t = 0.15 + (0.85 * i) / Math.max(1, cfg.n - 1);
    const bx = cx + side * lid.rx * t;
    const closed = shape === 'closed';
    const by = closed ? lid.cy + 1.6 - lid.ry * t * t : lid.cy - lid.ry * Math.sqrt(Math.max(0, 1 - t * t));
    const ang = closed ? Math.PI / 2 - side * (0.2 + t * 0.7) : -Math.PI / 2 + side * (0.25 + t * 0.9);
    const ex = bx + Math.cos(ang) * cfg.len, ey = by + Math.sin(ang) * cfg.len;
    const qx = bx + Math.cos(ang - side * cfg.curl) * cfg.len * 0.6, qy = by + Math.sin(ang - side * cfg.curl) * cfg.len * 0.6;
    const col = style === 'rainbow' ? rainbow[i % rainbow.length] : style === 'sparkle' ? '#5a3aa8' : '#1a1a1a';
    out += `<path d="M${bx.toFixed(1)},${by.toFixed(1)} Q${qx.toFixed(1)},${qy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${cfg.w}" stroke-linecap="round"/>`;
  }
  if (style === 'glam') {
    const ox = cx + side * lid.rx, oy = lid.cy - 1;
    out = `<path d="M${cx - side * lid.rx * 0.6},${lid.cy - lid.ry * 0.8} Q${cx + side * lid.rx * 0.5},${lid.cy - lid.ry - 0.6} ${ox},${oy} L${ox + side * 5},${oy - 4} L${ox - side * 0.5},${oy + 1.2} Z" fill="#1a1a1a"/>` + out;
  }
  if (style === 'sparkle') {
    const gx = cx + side * (lid.rx + 3), gy = lid.cy + 2;
    out += `<path d="M${gx},${gy - 2.6} L${gx + 0.8},${gy - 0.8} L${gx + 2.6},${gy} L${gx + 0.8},${gy + 0.8} L${gx},${gy + 2.6} L${gx - 0.8},${gy + 0.8} L${gx - 2.6},${gy} L${gx - 0.8},${gy - 0.8} Z" fill="#c9a6ff"/>`;
  }
  return out;
}

const EYESHADOW_COLORS = ['#c9a6ff', '#ff8fc7', '#5cc4e0', '#f2c94c', '#43b581', '#d9a98c', '#9b6be0'];
const BLUSH_COLORS = ['#ff8fa3', '#ff6f91', '#ffb38a', '#e0558f', '#c9a6ff'];
const SALON_LIP_COLORS = ['#d9a98c', '#c9707d', '#c0293b', '#e0558f', '#e8836b', '#8c4a6b', '#9b6be0', '#ff6fb0'];
const CHEEK_ART = [
  { id: 'none', label: 'None', emoji: '○' },
  { id: 'heart', label: 'Heart', emoji: '💗' },
  { id: 'star', label: 'Star', emoji: '⭐' },
  { id: 'rainbow', label: 'Rainbow', emoji: '🌈' },
  { id: 'butterfly', label: 'Butterfly', emoji: '🦋' },
];

function makeupUnderSVG(face) {
  if (!face.eyeshadow) return '';
  return [132, 168].map((cx) => {
    const lid = EYE_LID[face.eyeShape] || EYE_LID.round;
    return `<ellipse cx="${cx}" cy="${lid.cy - lid.ry * 0.7}" rx="${lid.rx + 3}" ry="${Math.max(4, lid.ry * 0.95)}" fill="${face.eyeshadow}" opacity="0.6"/>`;
  }).join('');
}

function makeupOverSVG(face) {
  let out = '';
  if (face.gloss && face.mouth !== 'surprised') {
    out += `<ellipse cx="143" cy="${face.mouth === 'neutral' ? 111 : 113}" rx="4" ry="1.4" fill="#ffffff" opacity="0.75"/>`;
  }
  if (face.glitter) {
    out += [[124, 99], [128, 106], [176, 99], [172, 106], [126, 82], [174, 82]].map(([x, y]) =>
      `<path d="M${x},${y - 2} L${x + 0.6},${y - 0.6} L${x + 2},${y} L${x + 0.6},${y + 0.6} L${x},${y + 2} L${x - 0.6},${y + 0.6} L${x - 2},${y} L${x - 0.6},${y - 0.6} Z" fill="#fff7d6"/>`).join('');
  }
  const x = 176, y = 103;
  if (face.cheekArt === 'heart') out += `<path d="M${x},${y + 4} C${x - 6},${y} ${x - 5},${y - 4} ${x - 2},${y - 3.6} C${x - 1},${y - 3.4} ${x},${y - 2.4} ${x},${y - 1.6} C${x},${y - 2.4} ${x + 1},${y - 3.4} ${x + 2},${y - 3.6} C${x + 5},${y - 4} ${x + 6},${y} ${x},${y + 4} Z" fill="#ff3b7a"/>`;
  if (face.cheekArt === 'star') out += `<path d="M${x},${y - 4.5} L${x + 1.3},${y - 1.4} L${x + 4.4},${y - 1.2} L${x + 2},${y + 0.9} L${x + 2.8},${y + 4} L${x},${y + 2.3} L${x - 2.8},${y + 4} L${x - 2},${y + 0.9} L${x - 4.4},${y - 1.2} L${x - 1.3},${y - 1.4} Z" fill="#f2c94c" stroke="#c98f1f" stroke-width="0.5"/>`;
  if (face.cheekArt === 'rainbow') out += ['#e05c5c', '#f2c94c', '#43b581', '#5c7ce0'].map((c, i) => `<path d="M${x - 6 + i},${y + 3} A${6 - i},${6 - i} 0 0 1 ${x + 6 - i},${y + 3}" fill="none" stroke="${c}" stroke-width="1.2"/>`).join('');
  if (face.cheekArt === 'butterfly') out += `<g fill="#9b6be0"><ellipse cx="${x - 2.4}" cy="${y - 1.4}" rx="2.6" ry="2.2"/><ellipse cx="${x + 2.4}" cy="${y - 1.4}" rx="2.6" ry="2.2"/><ellipse cx="${x - 2}" cy="${y + 1.8}" rx="1.8" ry="1.6"/><ellipse cx="${x + 2}" cy="${y + 1.8}" rx="1.8" ry="1.6"/></g><rect x="${x - 0.5}" y="${y - 3}" width="1" height="6" fill="#2b2b2b"/>`;
  return out;
}

const DEFAULT_FACE = {
  eyeshadow: null,
  blushColor: '#ff8fa3',
  gloss: false,
  glitter: false,
  cheekArt: 'none',
  lashes: 'none',
  eyeShape: 'round',
  eyeColor: '#3b2417',
  eyebrowShape: 'soft',
  mouth: 'smile',
  lipColor: '#c9707d',
  blush: true,
  freckles: false,
};

function eyeShapeSVG(shape, cx, side, color) {
  if (shape === 'closed') {
    return `<path d="M${cx - 7.5},89.5 Q${cx},95.5 ${cx + 7.5},89.5" fill="none" stroke="#2b2b2b" stroke-width="1.7" stroke-linecap="round"/>`;
  }
  const outline = '#2b2b2b';
  if (shape === 'almond') {
    return `<ellipse cx="${cx}" cy="90" rx="8" ry="5" fill="#ffffff" stroke="${outline}" stroke-width="0.6"/>
            <circle cx="${cx}" cy="90" r="3" fill="${color}"/>
            <circle cx="${cx}" cy="90" r="1.2" fill="#1a1a1a"/>
            <circle cx="${cx - 1}" cy="88" r="0.8" fill="#ffffff"/>
            <line x1="${cx + side * 8}" y1="88" x2="${cx + side * 11}" y2="86" stroke="${outline}" stroke-width="1.2" stroke-linecap="round"/>`;
  }
  if (shape === 'sleepy') {
    return `<ellipse cx="${cx}" cy="91" rx="7" ry="3.4" fill="#ffffff" stroke="${outline}" stroke-width="0.6"/>
            <circle cx="${cx}" cy="91.5" r="2.6" fill="${color}"/>
            <circle cx="${cx}" cy="91.5" r="1.1" fill="#1a1a1a"/>
            <path d="M${cx - 7},88.5 Q${cx},85.3 ${cx + 7},88.5" fill="none" stroke="${outline}" stroke-width="1.3" stroke-linecap="round"/>`;
  }
  if (shape === 'wide') {
    return `<ellipse cx="${cx}" cy="89" rx="8.5" ry="7.5" fill="#ffffff" stroke="${outline}" stroke-width="0.6"/>
            <circle cx="${cx}" cy="89.5" r="3.6" fill="${color}"/>
            <circle cx="${cx}" cy="89.5" r="1.5" fill="#1a1a1a"/>
            <circle cx="${cx - 1.4}" cy="86.8" r="1" fill="#ffffff"/>`;
  }
  return `<ellipse cx="${cx}" cy="90" rx="7" ry="6.5" fill="#ffffff" stroke="${outline}" stroke-width="0.6"/>
          <circle cx="${cx}" cy="90" r="3.2" fill="${color}"/>
          <circle cx="${cx}" cy="90" r="1.3" fill="#1a1a1a"/>
          <circle cx="${cx - 1.2}" cy="87.5" r="0.9" fill="#ffffff"/>`;
}

function eyebrowSVG(shape, cx, color) {
  if (shape === 'straight') return `<line x1="${cx - 9}" y1="78" x2="${cx + 9}" y2="76" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
  if (shape === 'thick') return `<path d="M${cx - 11},81 Q${cx},72 ${cx + 11},77" fill="none" stroke="${color}" stroke-width="4.2" stroke-linecap="round"/>`;
  return `<path d="M${cx - 10},80 Q${cx},74 ${cx + 10},78" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>`;
}

function mouthSVG(shape, lipColor) {
  if (shape === 'grin') {
    return `<path d="M122,106 Q150,126 178,106 Q150,120 122,106 Z" fill="${lipColor}"/>
            <path d="M132,110 Q150,116 168,110 L166,113 Q150,117 134,113 Z" fill="#ffffff"/>`;
  }
  if (shape === 'neutral') return `<line x1="132" y1="112" x2="168" y2="112" stroke="${lipColor}" stroke-width="3" stroke-linecap="round"/>`;
  if (shape === 'surprised') return `<ellipse cx="150" cy="114" rx="6" ry="8" fill="#7a2f36" stroke="${lipColor}" stroke-width="2.5"/>`;
  return `<path d="M125,108 Q150,122 175,108" fill="none" stroke="${lipColor}" stroke-width="3.4" stroke-linecap="round"/>`;
}

function frecklesSVG() {
  return `<circle cx="122" cy="98" r="1" fill="#9c6b4a" opacity="0.55"/>
          <circle cx="127" cy="94" r="1" fill="#9c6b4a" opacity="0.55"/>
          <circle cx="118" cy="93" r="0.8" fill="#9c6b4a" opacity="0.5"/>
          <circle cx="178" cy="98" r="1" fill="#9c6b4a" opacity="0.55"/>
          <circle cx="173" cy="94" r="1" fill="#9c6b4a" opacity="0.55"/>
          <circle cx="182" cy="93" r="0.8" fill="#9c6b4a" opacity="0.5"/>`;
}

function buildFaceSVG(face, hairColor) {
  return `
    ${face.blush ? `<ellipse cx="130" cy="104" rx="8" ry="5.5" fill="${face.blushColor || '#ff8fa3'}" opacity="0.45"/><ellipse cx="170" cy="104" rx="8" ry="5.5" fill="${face.blushColor || '#ff8fa3'}" opacity="0.45"/>` : ''}
    ${makeupUnderSVG(face)}
    ${face.freckles ? frecklesSVG() : ''}
    <path d="M147,97 Q150,101 148,102.5" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="1.2" stroke-linecap="round"/>
    ${eyeShapeSVG(face.eyeShape, 132, -1, face.eyeColor)}
    ${eyeShapeSVG(face.eyeShape, 168, 1, face.eyeColor)}
    ${lashesSVG(face.lashes, face.eyeShape, 132, -1)}
    ${lashesSVG(face.lashes, face.eyeShape, 168, 1)}
    ${eyebrowSVG(face.eyebrowShape, 132, hairColor)}
    ${eyebrowSVG(face.eyebrowShape, 168, hairColor)}
    ${mouthSVG(face.mouth, face.lipColor)}
    ${makeupOverSVG(face)}
  `;
}

const BACKGROUNDS = [
  { id: 'pink', label: 'Pink Runway', emoji: '🎀', gradient: 'linear-gradient(180deg, #ffd6ec 0%, #ffb6d9 55%, #ff9fce 100%)' },
  { id: 'night', label: 'Night Gala', emoji: '🌌', gradient: 'linear-gradient(180deg, #1b1035 0%, #3a1f5d 55%, #6a3093 100%)' },
  { id: 'gold', label: 'Gold Stage', emoji: '🌟', gradient: 'linear-gradient(180deg, #fff6d8 0%, #ffe08a 55%, #f6c453 100%)' },
  { id: 'spring', label: 'Spring Bloom', emoji: '🌸', gradient: 'linear-gradient(180deg, #eaffea 0%, #b9f2d0 55%, #8fe3b0 100%)' },
  { id: 'winter-wonderland', label: 'Winter Wonderland', emoji: '⛄', theme: 'christmas', ambient: 'snow', decor: 'snowscene',
    gradient: 'linear-gradient(180deg, #bfe3ff 0%, #e3f2ff 60%, #ffffff 100%)' },
  { id: 'christmas-snow', label: 'Snowy Night', emoji: '❄️', theme: 'christmas', ambient: 'snow',
    gradient: 'linear-gradient(180deg, #0b2545 0%, #164a6b 55%, #2c7a9c 100%)' },
  { id: 'fairy-glade', label: 'Enchanted Glade', emoji: '🌌', theme: 'fairy', ambient: 'sparkle',
    gradient: 'linear-gradient(180deg, #1b3a2f 0%, #2d5a4a 45%, #6a3f8c 100%)' },
  { id: 'pumpkin-patch', label: 'Pumpkin Patch', emoji: '🎃', theme: 'halloween', ambient: 'bats', decor: 'pumpkins',
    gradient: 'linear-gradient(180deg, #2a1846 0%, #5a2a5e 50%, #e07a2c 100%)' },
  { id: 'treetop-sky', label: 'Treetop Sky', emoji: '🌳', theme: 'birds', ambient: 'birds', decor: 'branch',
    gradient: 'linear-gradient(180deg, #8fd3ff 0%, #c4ecff 55%, #a8e0a0 100%)' },
  { id: 'sunset-flock', label: 'Sunset Flock', emoji: '🌅', theme: 'birds', ambient: 'birds',
    gradient: 'linear-gradient(180deg, #ffb38a 0%, #ff8fab 50%, #9b7ad8 100%)' },
  { id: 'under-the-sea', label: 'Under the Sea', emoji: '🫧', theme: 'mermaid', ambient: 'bubbles', decor: 'seabed',
    gradient: 'linear-gradient(180deg, #5fd0e8 0%, #2a8fc4 50%, #164f8a 100%)' },
  { id: 'coral-reef', label: 'Coral Reef', emoji: '🪸', theme: 'mermaid', ambient: 'bubbles', decor: 'reef',
    gradient: 'linear-gradient(180deg, #a8f0e8 0%, #4cc9c0 50%, #2a8f9c 100%)' },
  { id: 'classroom', label: 'Classroom', emoji: '🍎', theme: 'school', decor: 'chalkboard',
    gradient: 'linear-gradient(180deg, #fff3d6 0%, #ffe6b0 62%, #c98f5a 62%, #b07a48 100%)' },
  { id: 'school-hallway', label: 'School Hallway', emoji: '🚪', theme: 'school', decor: 'lockers',
    gradient: 'linear-gradient(180deg, #e8f1ff 0%, #d4e4fb 60%, #b9c6d8 60%, #a8b6ca 100%)' },
  { id: 'pool-party', label: 'Pool Runway', emoji: '🏊', theme: 'summer', ambient: 'sparkle', decor: 'pool',
    gradient: 'linear-gradient(180deg, #7fd0ff 0%, #bfe9ff 50%, #f4e7cf 50%, #eadbc0 100%)' },
  { id: 'sunny-beach', label: 'Sunny Beach', emoji: '🏖️', theme: 'summer', decor: 'beach',
    gradient: 'linear-gradient(180deg, #ffd76a 0%, #8fd3ff 30%, #bfe9ff 58%, #3fa9d6 58%, #2a8fc4 66%, #f2dfb0 66%)' },
  { id: 'party-room', label: 'Party Room', emoji: '🎈', theme: 'party', ambient: 'confetti', decor: 'balloons',
    gradient: 'linear-gradient(180deg, #fff0f6 0%, #f4e6ff 60%, #e6d6ff 60%, #d6c2f5 100%)' },
  { id: 'disco-party', label: 'Dance Party', emoji: '🪩', theme: 'party', ambient: 'confetti', decor: 'disco',
    gradient: 'linear-gradient(180deg, #2a1650 0%, #5a2a8a 55%, #8c3aa8 100%)' },
  { id: 'hero-city', label: 'Hero City', emoji: '🌃', theme: 'superhero', ambient: 'sparkle', decor: 'skyline',
    gradient: 'linear-gradient(180deg, #141a3a 0%, #2a2f6a 55%, #5a4a9a 100%)' },
  { id: 'ballet-stage', label: 'Ballet Stage', emoji: '🎭', theme: 'ballet', ambient: 'sparkle', decor: 'curtains',
    gradient: 'linear-gradient(180deg, #3a1630 0%, #5a2448 60%, #c9935a 60%, #a8763f 100%)' },
  { id: 'dance-studio', label: 'Dance Studio', emoji: '🪞', theme: 'ballet', decor: 'studio',
    gradient: 'linear-gradient(180deg, #ffeef5 0%, #f6e6ff 58%, #e0b98a 58%, #cfa274 100%)' },
  { id: 'candy-land', label: 'Candy Land', emoji: '🍬', pass: 'sweetie', passTier: 4, ambient: 'sparkle', decor: 'candyland',
    gradient: 'linear-gradient(180deg, #ffe0f0 0%, #e8dcff 55%, #c8f2e0 55%, #a8e8cc 100%)' },
  { id: 'cozy-bedroom', label: 'Cozy Bedroom', emoji: '🛏️', theme: 'sleepy', decor: 'bedroom',
    gradient: 'linear-gradient(180deg, #e6dcff 0%, #f3e8ff 62%, #c9a27a 62%, #b88f68 100%)' },
  { id: 'dreamland', label: 'Dreamland', emoji: '🌙', theme: 'sleepy', ambient: 'sparkle', decor: 'dreamland',
    gradient: 'linear-gradient(180deg, #1a1f4a 0%, #3a2f7a 55%, #7a5ab0 100%)' },
  { id: 'met-steps', label: 'Met Gala Steps', emoji: '📸', theme: 'metgala', price: 50, ambient: 'flash', decor: 'carpet',
    gradient: 'linear-gradient(180deg, #1e1a2e 0%, #3b2f4f 60%, #5a4a6a 100%)' },
  { id: 'haunted-night', label: 'Haunted Night', emoji: '🦇', theme: 'halloween', ambient: 'bats', decor: 'moon',
    gradient: 'linear-gradient(180deg, #0d0b1f 0%, #241a3d 55%, #3d2b56 100%)' },
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
  "Spook-tacular! The judges are howling.",
  "So good it's scary!",
  "Tweet-tastic! The judges are all aflutter.",
  "Met Gala ready! The cameras can't stop flashing.",
  "Fin-tastic! Making waves on the runway.",
  "Top of the class! A+ for style.",
  "Making a splash! Summer style on point.",
  "Life of the party! Hip hip hooray!",
  "Super style! Saving the day, one runway at a time.",
  "Bravo! Graceful as a swan.",
  "Sweet dreams! Cozy and cute.",
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
      accessories: { glasses: true }, background: 'gold',
      face: { eyebrowShape: 'straight', mouth: 'neutral', blush: false } } },
  { id: 'kitty-cutie', label: 'Kitty Cutie', theme: 'classic',
    look: { bodyType: 'feminine', skin: SKIN_TONES[1], hair: { style: 'half-up', color: '#4b2e1e' },
      outfit: { style: 'kitty-dress', color: '#e0558f' }, shoes: { style: 'flats', color: '#ffffff' },
      accessories: { 'cat-ears': true }, pet: { species: 'cat', color: '#8a8a8a', accessory: 'bow' },
      background: 'pink', face: { eyeShape: 'wide', lashes: 'natural' } } },
  { id: 'weekend-chill', label: 'Weekend Chill', theme: 'classic',
    look: { bodyType: 'neutral', skin: SKIN_TONES[3], hair: { style: 'ponytail', color: '#2b2b2b' },
      outfit: { style: 'baggy-jeans', color: '#ffffff' }, shoes: { style: 'sneakers', color: '#ffffff' },
      accessories: { glasses: true }, background: 'spring', face: { mouth: 'grin' } } },
  { id: 'first-day', label: 'First Day of School', theme: 'school',
    look: { bodyType: 'feminine', skin: SKIN_TONES[1], hair: { style: 'ponytail', color: '#8a5a2b' },
      outfit: { style: 'uniform-skirt', color: '#2b4a8a' }, shoes: { style: 'flats', color: '#2b2b2b' },
      accessories: { backpack: true, 'big-bow': true }, background: 'classroom', face: { mouth: 'grin', freckles: true } } },
  { id: 'class-president', label: 'Class President', theme: 'school',
    look: { bodyType: 'masculine', skin: SKIN_TONES[4], hair: { style: 'crop', color: '#2b2b2b' },
      outfit: { style: 'uniform-trousers', color: '#2b4a8a' }, shoes: { style: 'sneakers', color: '#2b2b2b' },
      accessories: { 'star-backpack': true, glasses: true }, background: 'school-hallway' } },
  { id: 'pool-party-pal', label: 'Pool Party', theme: 'summer',
    look: { bodyType: 'feminine', skin: SKIN_TONES[2], hair: { style: 'pigtails', color: '#d9b45a' },
      outfit: { style: 'ruffle-swimsuit', color: '#5cc4e0' }, shoes: { style: 'flip-flops', color: '#ff8fc7' },
      accessories: { 'flower-lei': true }, background: 'pool-party', face: { mouth: 'grin', freckles: true } } },
  { id: 'surf-star', label: 'Surf Star', theme: 'summer',
    look: { bodyType: 'masculine', skin: SKIN_TONES[4], hair: { style: 'curly', color: '#2b2b2b' },
      outfit: { style: 'board-shorts', color: '#f2994a' }, shoes: { style: 'flip-flops', color: '#43b581' },
      accessories: { 'sun-hat': false }, background: 'sunny-beach', face: { mouth: 'grin' } } },
  { id: 'beach-day', label: 'Beach Day', theme: 'summer',
    look: { bodyType: 'neutral', skin: SKIN_TONES[0], hair: { style: 'long', color: '#8a5a2b' },
      outfit: { style: 'polka-swimsuit', color: '#e05c5c' }, shoes: { style: 'flip-flops', color: '#e05c5c' },
      accessories: { 'sun-hat': true }, background: 'sunny-beach' } },
  { id: 'birthday-star', label: 'Birthday Star', theme: 'party',
    look: { bodyType: 'feminine', skin: SKIN_TONES[1], hair: { style: 'pigtails', color: '#8a5a2b' },
      outfit: { style: 'polka-party-dress', color: '#e0558f' }, shoes: { style: 'flats', color: '#ffffff' },
      accessories: { 'party-hat': true, cake: true }, pet: { species: 'dog', color: '#c68642', accessory: 'party-hat' },
      background: 'party-room', face: { mouth: 'grin' } } },
  { id: 'dance-party', label: 'Dance Party', theme: 'party',
    look: { bodyType: 'neutral', skin: SKIN_TONES[4], hair: { style: 'curly', color: '#8c5ce0' },
      outfit: { style: 'polka-party-dress', color: '#5cc4e0' }, shoes: { style: 'sneakers', color: '#ffffff' },
      accessories: { 'party-hat': true }, background: 'disco-party', face: { eyeShape: 'wide' } } },
  { id: 'super-star', label: 'Super Star', theme: 'superhero',
    look: { bodyType: 'feminine', skin: SKIN_TONES[2], hair: { style: 'ponytail', color: '#2b2b2b' },
      outfit: { style: 'hero-dress', color: '#8c5ce0' }, shoes: { style: 'boots', color: '#f2c94c' },
      accessories: { 'hero-cape': true, 'hero-mask': true, 'hero-sword': true }, background: 'hero-city', face: { eyebrowShape: 'thick', mouth: 'grin' } } },
  { id: 'captain-courage', label: 'Captain Courage', theme: 'superhero',
    look: { bodyType: 'masculine', skin: SKIN_TONES[4], hair: { style: 'crop', color: '#2b2b2b' },
      outfit: { style: 'hero-suit', color: '#5c7ce0' }, shoes: { style: 'boots', color: '#2b2b2b' },
      accessories: { 'hero-cape': true, 'hero-shield': true }, background: 'hero-city', face: { eyebrowShape: 'thick' } } },
  { id: 'prima-ballerina', label: 'Prima Ballerina', theme: 'ballet',
    look: { bodyType: 'feminine', skin: SKIN_TONES[1], hair: { style: 'bun', color: '#4b2e1e' },
      outfit: { style: 'ballet-tutu', color: '#ff8fc7' }, shoes: { style: 'ballet-slippers', color: '#ffb3d6' },
      accessories: {}, background: 'ballet-stage', face: { eyeShape: 'almond', lashes: 'long' } } },
  { id: 'swan-dancer', label: 'Swan Dancer', theme: 'ballet',
    look: { bodyType: 'neutral', skin: SKIN_TONES[4], hair: { style: 'bun', color: '#2b2b2b' },
      outfit: { style: 'swan-tutu', color: '#ffffff' }, shoes: { style: 'ballet-slippers', color: '#ffffff' },
      accessories: {}, background: 'dance-studio', face: { eyeShape: 'sleepy' } } },
  { id: 'sleepover-star', label: 'Sleepover Star', theme: 'sleepy',
    look: { bodyType: 'feminine', skin: SKIN_TONES[2], hair: { style: 'bun', color: '#4b2e1e' },
      outfit: { style: 'cozy-pajamas', color: '#8c5ce0' }, shoes: { style: 'bunny-slippers', color: '#ffffff' },
      accessories: { 'cucumber-eyes': true }, background: 'cozy-bedroom', face: { mouth: 'grin' } } },
  { id: 'sweet-dreams', label: 'Sweet Dreams', theme: 'sleepy',
    look: { bodyType: 'neutral', skin: SKIN_TONES[4], hair: { style: 'long', color: '#2b2b2b' },
      outfit: { style: 'nightgown', color: '#5cc4e0' }, shoes: { style: 'bunny-slippers', color: '#ffb3d6' },
      accessories: { 'sleeping-mask': true }, background: 'dreamland', face: { eyeShape: 'closed', lashes: 'long' } } },
  { id: 'spa-night', label: 'Spa Night', theme: 'sleepy',
    look: { bodyType: 'masculine', skin: SKIN_TONES[1], hair: { style: 'crop', color: '#8a5a2b' },
      outfit: { style: 'cozy-pajamas', color: '#43b581' }, shoes: { style: 'bunny-slippers', color: '#d6d6d6' },
      accessories: { 'clay-mask': true }, background: 'cozy-bedroom', face: { eyeShape: 'closed' } } },
  { id: 'santas-helper', label: "Santa's Helper", theme: 'christmas',
    look: { bodyType: 'neutral', skin: SKIN_TONES[0], hair: { style: 'ponytail', color: '#8a5a2b' },
      outfit: { style: 'elf-costume', color: '#1e7a46' }, shoes: { style: 'boots', color: '#8a5a2b' },
      accessories: { 'santa-hat': true, 'candy-cane': true }, background: 'christmas-snow',
      face: { mouth: 'grin' } } },
  { id: 'snow-day', label: 'Snow Day', theme: 'christmas',
    look: { bodyType: 'feminine', skin: SKIN_TONES[3], hair: { style: 'half-up', color: '#4b2e1e' },
      outfit: { style: 'aline', color: '#e05c5c' }, shoes: { style: 'boots', color: '#ffffff' },
      accessories: { 'santa-hat': true, snowflake: true, 'hot-cocoa': true }, background: 'winter-wonderland', face: { mouth: 'grin', lashes: 'natural' } } },
  { id: 'winter-belle', label: 'Winter Belle', theme: 'christmas',
    look: { bodyType: 'feminine', skin: SKIN_TONES[2], hair: { style: 'long', color: '#d9b45a' },
      outfit: { style: 'santa-dress', color: '#c1272d' }, shoes: { style: 'flats', color: '#ffffff' },
      accessories: { snowflake: true }, background: 'christmas-snow',
      face: { eyeShape: 'almond', lipColor: '#c0293b' } } },
  { id: 'woodland-fairy', label: 'Woodland Fairy', theme: 'fairy',
    look: { bodyType: 'neutral', skin: SKIN_TONES[1], hair: { style: 'curly', color: '#8c5ce0' },
      outfit: { style: 'fairy-dress', color: '#c9a6ff' }, shoes: { style: 'flats', color: '#c9a6ff' },
      accessories: { 'fairy-wings': true, 'flower-crown': true, wand: true }, background: 'fairy-glade',
      face: { eyeShape: 'wide', eyeColor: '#4a7043', freckles: true } } },
  { id: 'pretty-peacock', label: 'Pretty Peacock', theme: 'birds',
    look: { bodyType: 'feminine', skin: SKIN_TONES[3], hair: { style: 'bun', color: '#2b2b2b' },
      outfit: { style: 'peacock-gown', color: '#1f7a8c' }, shoes: { style: 'heels', color: '#5cc4e0' },
      accessories: { 'diamond-necklace': false }, pet: { species: 'bird', color: '#4aa3df', accessory: 'none' },
      background: 'sunset-flock', face: { eyeShape: 'almond', lashes: 'sparkle' } } },
  { id: 'wise-owl', label: 'Wise Owl', theme: 'birds',
    look: { bodyType: 'neutral', skin: SKIN_TONES[1], hair: { style: 'crop', color: '#8a5a2b' },
      outfit: { style: 'owl-costume', color: '#8a5a2b' }, shoes: { style: 'boots', color: '#8a5a2b' },
      accessories: { glasses: true }, background: 'treetop-sky', face: { eyeShape: 'wide' } } },
  { id: 'songbird', label: 'Songbird', theme: 'birds',
    look: { bodyType: 'masculine', skin: SKIN_TONES[5], hair: { style: 'curly', color: '#2b2b2b' },
      outfit: { style: 'feather-dress', color: '#f2c94c' }, shoes: { style: 'sneakers', color: '#ffffff' },
      accessories: { 'feather-wings': true, 'nest-hat': true }, pet: { species: 'bird', color: '#e05c5c', accessory: 'party-hat' },
      background: 'treetop-sky', face: { mouth: 'grin' } } },
  { id: 'ocean-princess', label: 'Ocean Princess', theme: 'mermaid',
    look: { bodyType: 'feminine', skin: SKIN_TONES[1], hair: { style: 'mermaid-waves', color: '#e0558f' },
      outfit: { style: 'mermaid-tail', color: '#8c5ce0' }, shoes: { style: 'flats', color: '#5cc4e0' },
      accessories: { 'shell-top': true, 'starfish-clip': true }, pet: { species: 'fish', color: '#ff9a5c', accessory: 'bow' },
      background: 'under-the-sea' } },
  { id: 'coral-mermaid', label: 'Coral Mermaid', theme: 'mermaid',
    look: { bodyType: 'neutral', skin: SKIN_TONES[4], hair: { style: 'mermaid-waves', color: '#d9b45a' },
      outfit: { style: 'ocean-sparkle-tail', color: '#3fb8c9' }, shoes: { style: 'flats', color: '#5cc4e0' },
      accessories: { 'pearl-shell-top': true }, pet: { species: 'fish', color: '#5cc4e0', accessory: 'none' },
      background: 'coral-reef', face: { mouth: 'grin' } } },
  { id: 'sea-king', label: 'Sea King', theme: 'mermaid',
    look: { bodyType: 'masculine', skin: SKIN_TONES[2], hair: { style: 'mermaid-waves', color: '#5cc4e0' },
      outfit: { style: 'mermaid-tail', color: '#43b581' }, shoes: { style: 'flats', color: '#43b581' },
      accessories: { 'starfish-clip': true }, background: 'coral-reef', face: { eyebrowShape: 'thick' } } },
  { id: 'pumpkin-pal', label: 'Pumpkin Pal', theme: 'halloween',
    look: { bodyType: 'neutral', skin: SKIN_TONES[2], hair: { style: 'curly', color: '#4b2e1e' },
      outfit: { style: 'pumpkin-costume', color: '#f28c28' }, shoes: { style: 'sneakers', color: '#2b2b2b' },
      accessories: { 'candy-bag': true }, pet: { species: 'bat', color: '#4b3b63', accessory: 'none' },
      background: 'pumpkin-patch', face: { mouth: 'grin' } } },
  { id: 'midnight-kitty', label: 'Midnight Kitty', theme: 'halloween',
    look: { bodyType: 'feminine', skin: SKIN_TONES[0], hair: { style: 'bun', color: '#2b2b2b' },
      outfit: { style: 'cat-costume', color: '#2b2b2b' }, shoes: { style: 'flats', color: '#2b2b2b' },
      accessories: { 'candy-bag': true }, background: 'haunted-night',
      face: { eyeShape: 'almond', eyeColor: '#4a7043' } } },
  { id: 'race-car', label: 'Race Car', theme: 'halloween',
    look: { bodyType: 'masculine', skin: SKIN_TONES[3], hair: { style: 'crop', color: '#2b2b2b' },
      outfit: { style: 'car-costume', color: '#e05c5c' }, shoes: { style: 'sneakers', color: '#e05c5c' },
      accessories: { 'candy-bag': true }, background: 'pumpkin-patch',
      face: { mouth: 'grin', blush: false } } },
  { id: 'spooky-witch', label: 'Spooky Witch', theme: 'halloween',
    look: { bodyType: 'feminine', skin: SKIN_TONES[4], hair: { style: 'spiderweb', color: '#2b2b2b' },
      outfit: { style: 'aline', color: '#2b2b2b' }, shoes: { style: 'boots', color: '#2b2b2b' },
      accessories: { 'witch-hat': true, 'candy-bag': true }, pet: { species: 'bat', color: '#4b3b63', accessory: 'bow' },
      background: 'haunted-night', face: { lipColor: '#8c4a6b', lashes: 'glam' } } },
];

// ---------- Leveling / unlocks ----------

const LEVELS = [
  { level: 1, name: 'Newcomer', threshold: 0 },
  { level: 2, name: 'Rising Star', threshold: 8 },
  { level: 3, name: 'Runway Regular', threshold: 24 },
  { level: 4, name: 'Style Icon', threshold: 48 },
  { level: 5, name: 'Legend', threshold: 80 },
  { level: 6, name: 'Superstar', threshold: 120 },
  { level: 7, name: 'Runway Royalty', threshold: 170 },
  { level: 8, name: 'Hall of Fame', threshold: 240 },
];

const STARS_STORAGE_KEY = 'runwayReady.totalStars';
let totalStars = 0;
try { totalStars = Number(localStorage.getItem(STARS_STORAGE_KEY)) || 0; } catch (e) {}

function saveTotalStars() {
  try { localStorage.setItem(STARS_STORAGE_KEY, String(totalStars)); } catch (e) {}
}

function getLevelInfo(total) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (total >= l.threshold) current = l;
  const next = LEVELS.find((l) => l.threshold > total);
  return {
    level: current.level,
    name: current.name,
    total,
    next,
    progress: next ? (total - current.threshold) / (next.threshold - current.threshold) : 1,
  };
}

// ---------- Cash & shop ownership ----------
// Cash is earned on the runway and spent in the Met Gala Boutique. Items with a
// `price` stay locked until bought; both are remembered in this browser.

const CASH_KEY = 'runwayReady.cash';
const OWNED_KEY = 'runwayReady.owned';
const STARTING_CASH = 100;
const CASH_PER_STAR = 5;
const CASH_FOR_FINISH = 10;
const CASH_ALL_STARS_BONUS = 20;

let cash = STARTING_CASH;
let owned = new Set();
try {
  const savedCash = localStorage.getItem(CASH_KEY);
  if (savedCash !== null) cash = Number(savedCash) || 0;
  const savedOwned = JSON.parse(localStorage.getItem(OWNED_KEY) || '[]');
  if (Array.isArray(savedOwned)) owned = new Set(savedOwned);
} catch (e) {}

function saveShop() {
  try {
    localStorage.setItem(CASH_KEY, String(cash));
    localStorage.setItem(OWNED_KEY, JSON.stringify([...owned]));
  } catch (e) {}
}

function isOwned(item) {
  return !item.price || owned.has(item.id);
}

function levelUnlocked(item) {
  return !item.unlockLevel || getLevelInfo(totalStars).level >= item.unlockLevel;
}

// ---------- Style Passes ----------
// Buy a pass with cash, then earn pass points in every show. Each tier unlocks
// one exclusive item (tier 0 unlocks as soon as you buy the pass).

const PASS_TIER_POINTS = [0, 5, 12, 20, 30, 42];
const PASS_POINTS_PER_STAR = 1;
const PASS_POINTS_FOR_FINISH = 2;
const PASS_POINTS_PER_CATWALK = 3;

const PASSES = [
  { id: 'baddie', label: 'Baddie Pass', emoji: '💅', price: 150, color: '#e0458f',
    blurb: 'Bold shades, bling, a puffer, platform boots, the Baddie Strut and a glam tracksuit.',
    rewards: ['baddie-shades', 'baddie-chain', 'puffer-jacket', 'baddie-strut', 'platform-boots', 'glam-tracksuit'] },
  { id: 'sweetie', label: 'Sweetie Pass', emoji: '🍭', price: 100, color: '#9b6be0',
    blurb: 'A swirl lollipop, candy clips, a cupcake dress, sprinkle sneakers, Candy Land and cotton candy hair.',
    rewards: ['lollipop', 'candy-clips', 'cupcake-dress', 'sprinkle-sneakers', 'candy-land', 'cotton-candy-puffs'] },
];

const PASS_KEY = 'runwayReady.passes';
let passState = {};
try {
  const saved = JSON.parse(localStorage.getItem(PASS_KEY) || '{}');
  if (saved && typeof saved === 'object') passState = saved;
} catch (e) {}

function savePasses() {
  try { localStorage.setItem(PASS_KEY, JSON.stringify(passState)); } catch (e) {}
}

function passOwned(passId) {
  return !!(passState[passId] && passState[passId].owned);
}

function passPoints(passId) {
  return (passState[passId] && passState[passId].xp) || 0;
}

function passUnlocked(item) {
  if (!item.pass) return true;
  return passOwned(item.pass) && passPoints(item.pass) >= PASS_TIER_POINTS[item.passTier];
}

// Adds points to every owned pass; returns the labels of newly unlocked rewards.
function addPassPoints(n) {
  const unlocked = [];
  PASSES.forEach((pass) => {
    if (!passOwned(pass.id)) return;
    const before = passPoints(pass.id);
    passState[pass.id].xp = before + n;
    pass.rewards.forEach((id, tier) => {
      if (before < PASS_TIER_POINTS[tier] && before + n >= PASS_TIER_POINTS[tier]) {
        const found = findAnyItem(id);
        if (found) unlocked.push(`${found.item.emoji} ${found.item.label}`);
      }
    });
  });
  savePasses();
  return unlocked;
}

function isUnlocked(item) {
  return levelUnlocked(item) && isOwned(item) && passUnlocked(item);
}

function renderCash() {
  document.getElementById('cash-badge').textContent = `💵 $${cash}`;
  const shopCash = document.getElementById('shop-cash');
  if (shopCash) shopCash.textContent = `💵 $${cash}`;
  const mgCash = document.getElementById('mg-cash');
  if (mgCash) mgCash.textContent = `💵 $${cash}`;
  const passesCash = document.getElementById('passes-cash');
  if (passesCash) passesCash.textContent = `💵 $${cash}`;
}

function renderLevelBanner() {
  const info = getLevelInfo(totalStars);
  document.getElementById('level-badge').textContent = `🌟 Level ${info.level} — ${info.name}`;
  document.getElementById('level-progress-fill').style.width = `${info.progress * 100}%`;
  document.getElementById('level-next').textContent = info.next
    ? `${info.next.threshold - info.total} ⭐ to ${info.next.name}`
    : 'Max level reached!';
}

// ---------- State ----------

const state = {
  bodyType: 'feminine',
  theme: 'classic',
  skin: SKIN_TONES[0],
  face: { ...DEFAULT_FACE },
  hair: { style: 'bob', color: HAIR_COLORS[0] },
  outfit: { style: 'aline', color: OUTFIT_COLORS[0] },
  shoes: { style: 'heels', color: SHOE_COLORS[0] },
  accessories: Object.fromEntries(ACCESSORIES.map((a) => [a.id, false])),
  pet: { species: 'none', color: '#c68642', accessory: 'none' },
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
    const unlocked = isUnlocked(item);
    const btn = document.createElement('button');
    btn.className = 'option-btn' + (unlocked ? '' : ' locked');
    btn.dataset.id = item.id;
    const passDef = item.pass ? PASSES.find((x) => x.id === item.pass) : null;
    btn.innerHTML = `<span class="emoji">${item.emoji}</span>${item.label}`
      + (unlocked ? '' : !isOwned(item)
        ? `<span class="lock-badge">🛍️ $${item.price} in Shop</span>`
        : !passUnlocked(item)
          ? `<span class="lock-badge">🎟️ ${passDef.label}${passOwned(item.pass) ? ` · Tier ${item.passTier}` : ''}</span>`
          : `<span class="lock-badge">🔒 Lvl ${item.unlockLevel}</span>`);
    if (unlocked) {
      btn.addEventListener('click', () => onPick(item.id));
    } else if (!isOwned(item)) {
      btn.classList.add('shop-locked');
      btn.title = `Buy ${item.label} in the Shop for $${item.price}`;
      btn.addEventListener('click', () => openShop());
    } else if (!passUnlocked(item)) {
      btn.classList.add('shop-locked');
      btn.title = `Unlock ${item.label} with the ${passDef.label}`;
      btn.addEventListener('click', () => openPasses());
    } else {
      btn.disabled = true;
      const levelDef = LEVELS.find((l) => l.level === item.unlockLevel);
      btn.title = `Unlocks at Level ${item.unlockLevel} — ${levelDef.name}`;
    }
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

buildOptionButtons(document.getElementById('eye-shapes'), EYE_SHAPES, (id) => {
  state.face.eyeShape = id;
  render();
});

buildSwatches(document.getElementById('eye-colors'), EYE_COLORS, (c) => {
  state.face.eyeColor = c;
  render();
});

buildOptionButtons(document.getElementById('lash-styles'), LASH_STYLES, (id) => {
  state.face.lashes = id;
  render();
});

buildOptionButtons(document.getElementById('eyebrow-shapes'), EYEBROW_SHAPES, (id) => {
  state.face.eyebrowShape = id;
  render();
});

buildOptionButtons(document.getElementById('mouth-shapes'), MOUTH_SHAPES, (id) => {
  state.face.mouth = id;
  render();
});

buildSwatches(document.getElementById('lip-colors'), LIP_COLORS, (c) => {
  state.face.lipColor = c;
  render();
});

buildOptionButtons(document.getElementById('face-extras'), [
  { id: 'blush', label: 'Blush', emoji: '🌸' },
  { id: 'freckles', label: 'Freckles', emoji: '⁘' },
], (id) => {
  state.face[id] = !state.face[id];
  render();
});

buildOptionButtons(document.getElementById('bang-styles'), BANG_STYLES, (id) => {
  state.hair.bangs = id;
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

buildOptionButtons(document.getElementById('pet-species'), PETS, (id) => {
  state.pet.species = id;
  const def = PETS.find((p) => p.id === id);
  if (def && def.color) state.pet.color = def.color;
  render();
});

buildOptionButtons(document.getElementById('pet-accessories'), PET_ACCESSORIES, (id) => {
  state.pet.accessory = id;
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
  if (torso) torso.setAttribute('d', bodyTorsoPath(bt));

  const armLeft = root.querySelector('#arm-left, .p-arm-left');
  const armRight = root.querySelector('#arm-right, .p-arm-right');
  const legLeft = root.querySelector('#leg-left, .p-leg-left');
  const legRight = root.querySelector('#leg-right, .p-leg-right');
  const handLeft = root.querySelector('#hand-left, .p-hand-left');
  const handRight = root.querySelector('#hand-right, .p-hand-right');
  const armLeftShine = root.querySelector('#arm-left-shine');
  const armRightShine = root.querySelector('#arm-right-shine');
  const legLeftShine = root.querySelector('#leg-left-shine');
  const legRightShine = root.querySelector('#leg-right-shine');
  const armLeftOutline = root.querySelector('#arm-left-outline, .p-arm-left-outline');
  const armRightOutline = root.querySelector('#arm-right-outline, .p-arm-right-outline');
  const legLeftOutline = root.querySelector('#leg-left-outline, .p-leg-left-outline');
  const legRightOutline = root.querySelector('#leg-right-outline, .p-leg-right-outline');
  const handLeftDetail = root.querySelector('#hand-left-detail');
  const handRightDetail = root.querySelector('#hand-right-detail');

  const lx = 93 - bt.armSpread;
  const rx = 207 + bt.armSpread;
  const rUpper = bt.limbWidth / 2 * 1.15;
  const rLower = bt.limbWidth / 2 * 0.68;
  const outlineGrow = 2;

  if (armLeft) armLeft.setAttribute('d', capsulePath(125, 168, rUpper, lx, 272, rLower));
  if (armRight) armRight.setAttribute('d', capsulePath(175, 168, rUpper, rx, 272, rLower));
  if (armLeftOutline) armLeftOutline.setAttribute('d', capsulePath(125, 168, rUpper + outlineGrow, lx, 272, rLower + outlineGrow));
  if (armRightOutline) armRightOutline.setAttribute('d', capsulePath(175, 168, rUpper + outlineGrow, rx, 272, rLower + outlineGrow));
  if (legLeft) legLeft.setAttribute('d', capsulePath(133, 248, rUpper, 127, 445, rLower));
  if (legRight) legRight.setAttribute('d', capsulePath(167, 248, rUpper, 173, 445, rLower));
  if (legLeftOutline) legLeftOutline.setAttribute('d', capsulePath(133, 248, rUpper + outlineGrow, 127, 445, rLower + outlineGrow));
  if (legRightOutline) legRightOutline.setAttribute('d', capsulePath(167, 248, rUpper + outlineGrow, 173, 445, rLower + outlineGrow));

  [armLeftShine, armRightShine, legLeftShine, legRightShine].forEach((l) => l && l.setAttribute('stroke-width', Math.max(2, bt.limbWidth * 0.22)));

  if (handLeft) handLeft.setAttribute('transform', `translate(${lx},272)`);
  if (handRight) handRight.setAttribute('transform', `translate(${rx},272)`);
  if (armLeftShine) armLeftShine.setAttribute('x2', lx);
  if (armRightShine) armRightShine.setAttribute('x2', rx);
  if (handLeftDetail) handLeftDetail.setAttribute('transform', `translate(${lx},272)`);
  if (handRightDetail) handRightDetail.setAttribute('transform', `translate(${rx},272)`);
}

// ---------- Render (main stage) ----------

function render() {
  applyBodyGeometry(document, state.bodyType);

  // skin
  setGradient('skinGradient', state.skin, 0.35, 0.22);
  const skinEls = ['torso', 'neck', 'head', 'arm-left', 'arm-right', 'hand-left', 'hand-right', 'leg-left', 'leg-right', 'ear-left', 'ear-right'];
  skinEls.forEach((id) => {
    const node = document.getElementById(id);
    if (node.tagName === 'line') node.setAttribute('stroke', state.skin);
    else node.setAttribute('fill', 'url(#skinGradient)');
  });

  // hair
  setGradient('hairGradient', state.hair.color, 0.3, 0.35);
  const hairLayer = document.getElementById('layer-hair');
  const hairDef = HAIR_STYLES.find((h) => h.id === state.hair.style);
  hairLayer.innerHTML = hairDef.svg + (hairDef.id === 'none' ? '' : bangsSVG(state.hair.bangs));
  hairLayer.setAttribute('fill', 'url(#hairGradient)');
  hairLayer.setAttribute('stroke', darken(state.hair.color, 0.35));

  // face
  document.getElementById('layer-face').innerHTML = buildFaceSVG(state.face, state.hair.color);

  // outfit
  const bt = BODY_TYPES.find((b) => b.id === state.bodyType);
  const outfitLayer = document.getElementById('layer-outfit');
  const outfitDef = OUTFIT_STYLES.find((o) => o.id === state.outfit.style);
  outfitLayer.innerHTML = typeof outfitDef.svg === 'function' ? outfitDef.svg(bt) : outfitDef.svg;
  if (outfitDef.fixedColor) {
    outfitLayer.removeAttribute('fill');
  } else {
    setGradient('outfitGradient', state.outfit.color, 0.4, 0.3);
    outfitLayer.setAttribute('fill', 'url(#outfitGradient)');
  }
  // A mermaid tail replaces the legs and feet.
  ['leg-left', 'leg-right', 'leg-left-outline', 'leg-right-outline', 'leg-left-shine', 'leg-right-shine', 'layer-shoes']
    .forEach((id) => { document.getElementById(id).style.display = outfitDef.hidesLegs ? 'none' : ''; });
  document.getElementById('outfit-color-label').hidden = !!outfitDef.fixedColor;
  document.getElementById('outfit-colors').hidden = !!outfitDef.fixedColor;
  document.getElementById('outfit-fixed-note').hidden = !outfitDef.fixedColor;

  // shoes
  setGradient('shoeGradient', state.shoes.color, 0.35, 0.3);
  const shoeLayer = document.getElementById('layer-shoes');
  const shoeDef = SHOE_STYLES.find((s) => s.id === state.shoes.style);
  shoeLayer.innerHTML = shoeDef.svg;
  shoeLayer.setAttribute('fill', 'url(#shoeGradient)');
  shoeLayer.setAttribute('stroke', darken(state.shoes.color, 0.4));

  // accessories
  ACCESSORIES.forEach((acc) => {
    const layer = document.getElementById(`layer-acc-${acc.id}`);
    const backLayer = acc.behindSvg ? document.getElementById(`layer-acc-${acc.id}-back`) : null;
    if (backLayer) {
      backLayer.innerHTML = state.accessories[acc.id] ? acc.behindSvg : '';
      backLayer.setAttribute('fill', acc.color);
      backLayer.setAttribute('stroke', acc.color);
      backLayer.style.display = state.accessories[acc.id] ? '' : 'none';
    }
    if (state.accessories[acc.id]) {
      layer.innerHTML = acc.svg;
      layer.setAttribute('fill', acc.color);
      layer.setAttribute('stroke', acc.color);
      layer.style.display = '';
    } else {
      layer.style.display = 'none';
    }
  });

  // pet
  const petDisplay = document.getElementById('pet-display');
  const petDef = PETS.find((p) => p.id === state.pet.species);
  if (petDef && petDef.id !== 'none') {
    petDisplay.innerHTML = buildPetSVG(petDef, state.pet.color, 'stage') + buildPetAccessorySVG(petDef, state.pet.accessory);
    petDisplay.removeAttribute('hidden');
  } else {
    petDisplay.innerHTML = '';
    petDisplay.setAttribute('hidden', '');
  }

  // background
  const bgDef = BACKGROUNDS.find((b) => b.id === state.background);
  document.getElementById('stage').style.background = bgDef.gradient;
  setAmbient(bgDef.ambient, bgDef.decor);

  // selection highlighting
  highlightSelection('#bodytype-pills', state.bodyType, 'id');
  highlightSelection('#pet-species', state.pet.species, 'id');
  highlightSelection('#pet-accessories', state.pet.accessory, 'id');
  highlightSelection('#theme-pills', state.theme, 'id');
  highlightSelection('#skin-swatches', state.skin, 'color');
  highlightSelection('#eye-shapes', state.face.eyeShape, 'id');
  highlightSelection('#eye-colors', state.face.eyeColor, 'color');
  highlightSelection('#eyebrow-shapes', state.face.eyebrowShape, 'id');
  highlightSelection('#lash-styles', state.face.lashes || 'none', 'id');
  highlightSelection('#mouth-shapes', state.face.mouth, 'id');
  highlightSelection('#lip-colors', state.face.lipColor, 'color');
  highlightSelection('#hair-colors', state.hair.color, 'color');
  highlightSelection('#outfit-colors', state.outfit.color, 'color');
  highlightSelection('#shoe-colors', state.shoes.color, 'color');
  highlightSelection('#hair-styles', state.hair.style, 'id');
  highlightSelection('#bang-styles', state.hair.bangs || 'none', 'id');
  highlightSelection('#outfit-styles', state.outfit.style, 'id');
  highlightSelection('#shoe-styles', state.shoes.style, 'id');
  highlightSelection('#background-styles', state.background, 'id');

  document.querySelectorAll('#accessory-toggles .option-btn').forEach((btn) => {
    btn.classList.toggle('selected', !!state.accessories[btn.dataset.id]);
  });
  document.querySelectorAll('#face-extras .option-btn').forEach((btn) => {
    btn.classList.toggle('selected', !!state.face[btn.dataset.id]);
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

let currentAmbientKey = null;

function setAmbient(type, decor) {
  const key = `${type || ''}|${decor || ''}`;
  if (key === currentAmbientKey) return;
  currentAmbientKey = key;
  if (ambientTimer) {
    clearInterval(ambientTimer);
    ambientTimer = null;
  }
  ambientLayer.innerHTML = '';
  if (decor) addDecor(decor);
  if (!type || reduceMotion) return;

  ambientTimer = setInterval(() => {
    if (type === 'snow') spawnSnow();
    if (type === 'sparkle') spawnSparkle();
    if (type === 'bats' && Math.random() < 0.2) spawnBat();
    if (type === 'birds' && Math.random() < 0.2) spawnBat(BIRD_SVG);
    if (type === 'flash' && Math.random() < 0.35) spawnFlash();
    if (type === 'bubbles' && Math.random() < 0.45) spawnBubble();
    if (type === 'confetti' && Math.random() < 0.6) spawnConfetti();
  }, 350);
}

function pumpkinSVG(x, y, s, face) {
  return `<g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="24" ry="19" fill="#f28c28" stroke="#c0621a" stroke-width="1.5"/>
    <ellipse cx="0" cy="0" rx="13" ry="18.5" fill="none" stroke="#c0621a" stroke-width="1.5" opacity="0.7"/>
    <ellipse cx="0" cy="0" rx="4" ry="18.5" fill="none" stroke="#c0621a" stroke-width="1.5" opacity="0.7"/>
    <path d="M-2,-18 Q-3,-26 3,-28 L4,-25 Q1,-23 2,-18 Z" fill="#3f8f3a"/>
    ${face ? `<path d="M-12,-3 L-7,-11 L-2,-3 Z M2,-3 L7,-11 L12,-3 Z" fill="#ffd23f"/>
    <path d="M-13,4 L-8,8 L-4,5 L0,9 L4,5 L8,8 L13,4 Q0,18 -13,4 Z" fill="#ffd23f"/>` : ''}
  </g>`;
}

function addDecor(decor) {
  const el = document.createElement('div');
  el.className = 'ambient-decor';
  if (decor === 'pumpkins') {
    el.innerHTML = `<svg viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
      ${pumpkinSVG(228, 56, 1.15, true)}${pumpkinSVG(272, 62, 0.8, false)}${pumpkinSVG(24, 64, 0.7, true)}
    </svg>`;
  } else if (decor === 'bedroom') {
    const bulbs = Array.from({ length: 11 }, (_, i) => {
      const x = 10 + i * 28, y = 20 + 10 * Math.sin((i / 10) * Math.PI);
      const c = ['#ffd76a', '#ff8fc7', '#8fd3ff', '#b79cff'][i % 4];
      return `<circle cx="${x}" cy="${y + 6}" r="7" fill="${c}" opacity="0.35"/><circle cx="${x}" cy="${y + 6}" r="3.6" fill="${c}"/>`;
    }).join('');
    el.classList.add('ambient-decor-full');
    el.innerHTML = `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <path d="M0,20 Q150,44 300,20" fill="none" stroke="#6b5a8a" stroke-width="1.2"/>${bulbs}
      <rect x="18" y="60" width="74" height="96" rx="6" fill="#2a2f6a" stroke="#ffffff" stroke-width="5"/>
      <line x1="55" y1="60" x2="55" y2="156" stroke="#ffffff" stroke-width="3"/><line x1="18" y1="108" x2="92" y2="108" stroke="#ffffff" stroke-width="3"/>
      <path d="M78,72 A12,12 0 1 0 78,96 A9,9 0 1 1 78,72 Z" fill="#fff4c2"/>
      <g fill="#ffffff"><circle cx="34" cy="78" r="1.4"/><circle cx="44" cy="96" r="1"/><circle cx="30" cy="130" r="1.2"/><circle cx="74" cy="132" r="1"/></g>
      <rect x="214" y="300" width="96" height="44" rx="8" fill="#9b6be0"/>
      <rect x="220" y="282" width="38" height="22" rx="10" fill="#ffffff"/>
      <rect x="208" y="276" width="10" height="80" rx="4" fill="#a8763f"/>
      <path d="M232,306 Q262,296 300,304 L300,344 L232,344 Z" fill="#c9a6ff"/>
      <g fill="#ffffff" opacity="0.6"><circle cx="252" cy="320" r="2"/><circle cx="276" cy="330" r="2"/><circle cx="290" cy="316" r="2"/></g>
      <ellipse cx="150" cy="392" rx="110" ry="18" fill="#ff8fc7" opacity="0.5"/>
    </svg>`;
  } else if (decor === 'dreamland') {
    const cloud = (x, y, s2) => `<g transform="translate(${x},${y}) scale(${s2})" fill="#f6f0ff"><circle cx="0" cy="0" r="22"/><circle cx="26" cy="-8" r="26"/><circle cx="54" cy="0" r="20"/><rect x="0" y="0" width="54" height="20"/></g>`;
    el.classList.add('ambient-decor-full');
    el.innerHTML = `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <path d="M262,44 A30,30 0 1 0 262,104 A23,23 0 1 1 262,44 Z" fill="#fff4c2"/>
      <path d="M232,62 l2,4 l4,1 l-3,3 l1,4 l-4,-2 l-4,2 l1,-4 l-3,-3 l4,-1 Z" fill="#ffffff" opacity="0.8"/>
      ${[[30, 50], [70, 30], [120, 70], [180, 40], [40, 140], [210, 120]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#ffffff"/>`).join('')}
      ${cloud(-10, 380, 1.4)}${cloud(80, 395, 1.2)}${cloud(190, 382, 1.5)}${cloud(240, 300, 0.8)}${cloud(10, 290, 0.7)}
    </svg>`;
  } else if (decor === 'candyland') {
    const pop = (x, y, r, c) => `<line x1="${x}" y1="${y}" x2="${x}" y2="160" stroke="#ffffff" stroke-width="4"/>
        <circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff"/><path d="M${x},${y} m0,-3 a3,3 0 1 1 -3,3 a6,6 0 1 1 6,6 a9,9 0 1 1 -9,-9 a12,12 0 1 1 12,12" fill="none" stroke="${c}" stroke-width="3.4"/>`;
    const gum = (x, c) => `<path d="M${x - 12},158 Q${x - 12},140 ${x},138 Q${x + 12},140 ${x + 12},158 Z" fill="${c}"/><circle cx="${x - 4}" cy="146" r="2" fill="#ffffff" opacity="0.5"/>`;
    const cane = (x) => `<path d="M${x},160 L${x},120 Q${x},110 ${x + 8},110 Q${x + 16},110 ${x + 16},120" fill="none" stroke="#e05c5c" stroke-width="5" stroke-linecap="round"/>
        <path d="M${x},160 L${x},120 Q${x},110 ${x + 8},110 Q${x + 16},110 ${x + 16},120" fill="none" stroke="#ffffff" stroke-width="5" stroke-dasharray="5 5" stroke-linecap="round"/>`;
    el.innerHTML = `<svg viewBox="0 0 300 160" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
      ${pop(28, 70, 18, '#ff6fb0')}${pop(270, 60, 20, '#9b6be0')}${pop(60, 96, 13, '#5cc4e0')}
      ${cane(222)}${cane(240)}
      ${gum(20, '#43b581')}${gum(46, '#f2c94c')}${gum(254, '#ff6fb0')}${gum(282, '#5cc4e0')}
    </svg>`;
  } else if (decor === 'curtains') {
    const folds = (x0, dir) => Array.from({ length: 5 }, (_, i) => `<path d="M${x0 + dir * i * 11},0 Q${x0 + dir * (i * 11 + 6)},210 ${x0 + dir * (i * 13 + 4)},420" fill="none" stroke="#7a0f2a" stroke-width="3" opacity="0.6"/>`).join('');
    let valance = '';
    for (let i = 0; i < 10; i++) valance += `<path d="M${i * 30},0 L${i * 30 + 30},0 L${i * 30 + 30},26 Q${i * 30 + 15},44 ${i * 30},26 Z" fill="#b0123f"/>`;
    el.classList.add('ambient-decor-full');
    el.innerHTML = `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <path d="M150,30 L70,420 L230,420 Z" fill="#fff7d6" opacity="0.14"/>
      <ellipse cx="150" cy="404" rx="80" ry="14" fill="#fff7d6" opacity="0.22"/>
      <path d="M0,0 L66,0 Q50,160 60,250 Q30,330 0,420 Z" fill="#b0123f"/>${folds(10, 1)}
      <path d="M300,0 L234,0 Q250,160 240,250 Q270,330 300,420 Z" fill="#b0123f"/>${folds(290, -1)}
      <path d="M60,250 Q40,256 30,250 M240,250 Q260,256 270,250" stroke="#f2c94c" stroke-width="5" stroke-linecap="round"/>
      <circle cx="58" cy="252" r="6" fill="#f2c94c"/><circle cx="242" cy="252" r="6" fill="#f2c94c"/>
      ${valance}
      <path d="M0,26 Q150,40 300,26" fill="none" stroke="#f2c94c" stroke-width="3"/>
    </svg>`;
  } else if (decor === 'studio') {
    let mirrors = '';
    for (let i = 0; i < 4; i++) mirrors += `<rect x="${8 + i * 72}" y="60" width="66" height="180" rx="3" fill="#e8f4ff" stroke="#c9b6d6" stroke-width="3"/>
      <path d="M${20 + i * 72},90 L${44 + i * 72},70 M${20 + i * 72},120 L${60 + i * 72},86" stroke="#ffffff" stroke-width="4" opacity="0.7"/>`;
    el.classList.add('ambient-decor-full');
    el.innerHTML = `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      ${mirrors}
      <rect x="0" y="196" width="300" height="5" rx="2" fill="#c9935a"/>
      ${[20, 110, 190, 280].map((x) => `<rect x="${x - 2}" y="196" width="4" height="48" fill="#a8763f"/>`).join('')}
      ${Array.from({ length: 8 }, (_, i) => `<line x1="${i * 40}" y1="244" x2="${i * 40 - 30}" y2="420" stroke="#b88a5a" stroke-width="1" opacity="0.5"/>`).join('')}
    </svg>`;
  } else if (decor === 'skyline') {
    const builds = [[0, 70, 40], [38, 40, 30], [66, 96, 34], [98, 56, 28], [124, 80, 30], [152, 44, 26], [176, 104, 36], [210, 62, 30], [238, 86, 34], [270, 52, 30]];
    let city = '';
    builds.forEach(([x, h, w], i) => {
      city += `<rect x="${x}" y="${140 - h}" width="${w}" height="${h}" fill="${i % 2 ? '#1f2450' : '#262c5e'}"/>`;
      for (let wy = 140 - h + 8; wy < 134; wy += 12) for (let wx = x + 5; wx < x + w - 6; wx += 9) {
        if ((wx * 7 + wy * 3 + i) % 5 < 3) city += `<rect x="${wx}" y="${wy}" width="4" height="6" fill="#ffd76a" opacity="0.85"/>`;
      }
    });
    el.classList.add('ambient-decor-full');
    el.innerHTML = `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax slice">
      <path class="searchlight" d="M150,420 L40,40 L110,30 Z" fill="#fff7d6" opacity="0.12"/>
      <g transform="translate(64,62)"><circle cx="0" cy="0" r="22" fill="#fff7d6" opacity="0.5"/>
        <path d="M0,-12 L3.5,-4 L12,-3.6 L5.6,2 L7.4,10.5 L0,6 L-7.4,10.5 L-5.6,2 L-12,-3.6 L-3.5,-4 Z" fill="#2a2f6a" opacity="0.8"/></g>
      <g transform="translate(0,280)">${city}</g>
    </svg>`;
  } else if (decor === 'snowscene') {
    const tree = (x, y, sc) => `<g transform="translate(${x},${y}) scale(${sc})">
        <rect x="-4" y="0" width="8" height="12" fill="#7a5230"/>
        <path d="M0,-70 L-22,-36 L-12,-36 L-30,-8 L-18,-8 L-36,12 L36,12 L18,-8 L30,-8 L12,-36 L22,-36 Z" fill="#2e7d4f"/>
        <path d="M0,-70 L-12,-52 Q0,-48 12,-52 Z M-22,-36 Q0,-30 22,-36 L16,-40 Q0,-36 -16,-40 Z M-30,-8 Q0,-2 30,-8 L24,-12 Q0,-8 -24,-12 Z" fill="#ffffff"/>
      </g>`;
    el.innerHTML = `<svg viewBox="0 0 300 160" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
      <path d="M0,96 Q70,70 150,92 Q230,112 300,84 L300,160 L0,160 Z" fill="#f4f9ff"/>
      ${tree(30, 104, 1)}${tree(66, 112, 0.7)}${tree(268, 100, 1.1)}
      <path d="M0,124 Q90,108 170,122 Q240,134 300,118 L300,160 L0,160 Z" fill="#ffffff"/>
      <g transform="translate(232,112)">
        <circle cx="0" cy="22" r="18" fill="#ffffff" stroke="#d6e4f0" stroke-width="1.2"/>
        <circle cx="0" cy="-4" r="13" fill="#ffffff" stroke="#d6e4f0" stroke-width="1.2"/>
        <circle cx="0" cy="-24" r="10" fill="#ffffff" stroke="#d6e4f0" stroke-width="1.2"/>
        <rect x="-9" y="-40" width="18" height="10" fill="#2b2b2b"/><rect x="-13" y="-32" width="26" height="3" fill="#2b2b2b"/>
        <circle cx="-3.5" cy="-26" r="1.4" fill="#2b2b2b"/><circle cx="3.5" cy="-26" r="1.4" fill="#2b2b2b"/>
        <path d="M0,-23 L10,-21 L0,-19 Z" fill="#f28c28"/>
        <path d="M-10,-14 Q0,-10 10,-14 L12,-10 Q0,-6 -12,-10 Z" fill="#c1272d"/><path d="M6,-12 L10,0 L4,0 Z" fill="#c1272d"/>
        <circle cx="0" cy="-2" r="1.6" fill="#2b2b2b"/><circle cx="0" cy="6" r="1.6" fill="#2b2b2b"/>
        <path d="M-12,-6 L-28,-16 M12,-6 L28,-16" stroke="#7a5230" stroke-width="2" stroke-linecap="round"/>
      </g>
    </svg>`;
  } else if (decor === 'balloons' || decor === 'disco') {
    const balloon = (x, y, col, d) => `<g class="float-bob" style="animation-delay:${d}s">
        <path d="M${x},${y + 26} Q${x - 6},${y + 60} ${x + 4},${y + 96}" fill="none" stroke="#9a8aa8" stroke-width="1"/>
        <ellipse cx="${x}" cy="${y}" rx="18" ry="22" fill="${col}"/>
        <path d="M${x - 3},${y + 22} L${x + 3},${y + 22} L${x},${y + 27} Z" fill="${col}"/>
        <ellipse cx="${x - 6}" cy="${y - 8}" rx="4" ry="7" fill="#ffffff" opacity="0.35"/></g>`;
    const flags = Array.from({ length: 11 }, (_, i) => {
      const x = 8 + i * 26, y = 18 + 10 * Math.sin((i / 10) * Math.PI);
      const col = ['#e0558f', '#f2c94c', '#5cc4e0', '#43b581', '#8c5ce0'][i % 5];
      return `<path d="M${x},${y} L${x + 22},${y + 2} L${x + 11},${y + 24} Z" fill="${col}"/>`;
    }).join('');
    const gift = (x, col, rib) => `<rect x="${x}" y="368" width="40" height="34" rx="3" fill="${col}"/><rect x="${x - 3}" y="362" width="46" height="10" rx="2" fill="${col}" stroke="#000000" stroke-opacity="0.12"/>
        <rect x="${x + 17}" y="362" width="6" height="40" fill="${rib}"/><path d="M${x + 20},362 q-12,-12 -14,0 Z M${x + 20},362 q12,-12 14,0 Z" fill="${rib}"/>`;
    const disco = decor === 'disco';
    el.classList.add('ambient-decor-full');
    el.innerHTML = `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      ${disco ? `<line x1="246" y1="0" x2="246" y2="20" stroke="#d6d6d6" stroke-width="2"/>
        <g class="disco-spin"><circle cx="246" cy="42" r="22" fill="#c9d4e0"/>
        ${Array.from({ length: 5 }, (_, r) => `<line x1="224" y1="${28 + r * 7}" x2="268" y2="${28 + r * 7}" stroke="#8a98aa" stroke-width="0.8"/>`).join('')}
        ${Array.from({ length: 5 }, (_, r) => `<line x1="${228 + r * 9}" y1="20" x2="${228 + r * 9}" y2="64" stroke="#8a98aa" stroke-width="0.8"/>`).join('')}
        <circle cx="238" cy="34" r="4" fill="#ffffff" opacity="0.9"/></g>
        <path d="M246,58 L40,420 L100,420 Z M246,58 L180,420 L230,420 Z" fill="#ffffff" opacity="0.07"/>` : flags}
      ${balloon(34, 120, '#e0558f', 0)}${balloon(64, 150, '#f2c94c', -0.8)}${balloon(24, 178, '#5cc4e0', -1.6)}
      ${balloon(266, 112, '#8c5ce0', -0.4)}${balloon(238, 146, '#43b581', -1.2)}${balloon(276, 176, '#ff9a5c', -2)}
      ${gift(14, '#5cc4e0', '#e0558f')}${gift(246, '#f2c94c', '#8c5ce0')}
    </svg>`;
  } else if (decor === 'pool') {
    const tiles = Array.from({ length: 16 }, (_, i) => `<line x1="${i * 20}" y1="16" x2="${i * 20}" y2="22" stroke="#ffffff" stroke-width="1"/>`).join('');
    el.innerHTML = `<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
      <rect x="0" y="16" width="300" height="134" fill="#3fb8e0"/>
      <rect x="0" y="16" width="300" height="6" fill="#7fd6f0"/>${tiles}
      <g class="pool-wave" fill="none" stroke="#bff0ff" stroke-width="2" opacity="0.8" stroke-linecap="round">
        <path d="M-20,50 q15,-6 30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0"/>
        <path d="M-10,90 q15,-6 30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0"/>
        <path d="M-25,128 q15,-6 30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0"/>
      </g>
      <path d="M122,22 L178,22 L196,150 L104,150 Z" fill="#ffffff"/>
      <path d="M122,22 L126,22 L110,150 L104,150 Z M178,22 L174,22 L190,150 L196,150 Z" fill="#ff8fc7"/>
      <g class="float-bob">
        <ellipse cx="46" cy="96" rx="26" ry="11" fill="#ff8fc7"/><ellipse cx="46" cy="94" rx="11" ry="4" fill="#3fb8e0"/>
        <g fill="#ffffff"><rect x="28" y="92" width="5" height="2" rx="1" transform="rotate(20 30 93)"/><rect x="58" y="96" width="5" height="2" rx="1" transform="rotate(-30 60 97)"/><rect x="44" y="102" width="5" height="2" rx="1"/></g>
      </g>
      <g class="float-bob" style="animation-delay:-1.4s">
        <ellipse cx="252" cy="118" rx="20" ry="9" fill="#f2c94c"/><circle cx="266" cy="106" r="7" fill="#f2c94c"/>
        <path d="M272,106 L279,108 L272,110 Z" fill="#f28c28"/><circle cx="268" cy="104" r="1.3" fill="#2b2b2b"/>
      </g>
      <g stroke="#d6d6d6" stroke-width="3" fill="none"><path d="M224,4 L224,46 M240,4 L240,46"/><path d="M224,28 L240,28 M224,40 L240,40" stroke-width="2"/></g>
    </svg>`;
  } else if (decor === 'beach') {
    el.innerHTML = `<svg viewBox="0 0 300 140" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
      <g transform="translate(244,28)">
        <path d="M0,0 L-6,110" stroke="#8a5a2b" stroke-width="3"/>
        <path d="M-50,10 Q0,-34 50,10 Z" fill="#ff6f91"/>
        <path d="M-50,10 Q-30,-6 -16,-14 L-24,10 Z M16,-14 Q30,-6 50,10 L24,10 Z" fill="#ffffff"/>
      </g>
      <path d="M0,118 Q75,108 150,116 Q225,124 300,112 L300,140 L0,140 Z" fill="#f2dfb0"/>
      <path d="M40,118 l4,-10 l4,10 Z" fill="#c98f1f"/>
      <rect x="196" y="112" width="40" height="7" rx="3" fill="#5cc4e0"/>
      <g transform="translate(70,124)"><path d="M0,-6 L1.8,-1.8 L6,-1.6 L2.8,1.4 L3.8,5.6 L0,3.2 L-3.8,5.6 L-2.8,1.4 L-6,-1.6 L-1.8,-1.8 Z" fill="#ff9a5c"/></g>
      <circle cx="150" cy="128" r="8" fill="#ffffff"/><path d="M142,128 Q150,120 158,128" fill="none" stroke="#e05c5c" stroke-width="3"/><path d="M144,132 Q150,136 156,132" fill="none" stroke="#5cc4e0" stroke-width="3"/>
    </svg>`;
  } else if (decor === 'chalkboard') {
    el.classList.add('ambient-decor-top');
    el.innerHTML = `<svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMin meet">
      <rect x="30" y="14" width="240" height="96" rx="4" fill="#8a5a2b"/>
      <rect x="37" y="21" width="226" height="82" fill="#2f5d46"/>
      <text x="58" y="56" font-family="'Comic Sans MS', 'Chalkboard SE', cursive" font-size="22" fill="#f4f4f4" opacity="0.9">ABC</text>
      <text x="196" y="56" font-family="'Comic Sans MS', 'Chalkboard SE', cursive" font-size="22" fill="#f4f4f4" opacity="0.9">123</text>
      <text x="64" y="90" font-family="'Comic Sans MS', 'Chalkboard SE', cursive" font-size="14" fill="#ffd6ec" opacity="0.9">2 + 2 = 4</text>
      <path d="M200,80 l4,8 l9,1 l-7,6 l2,9 l-8,-5 l-8,5 l2,-9 l-7,-6 l9,-1 Z" fill="none" stroke="#f2c94c" stroke-width="1.5"/>
      <rect x="40" y="104" width="220" height="5" fill="#a87447"/>
      <rect x="236" y="100" width="14" height="5" rx="1" fill="#ffffff"/>
      <circle cx="284" cy="30" r="10" fill="#e05c5c"/><path d="M284,20 q2,-6 7,-6" fill="none" stroke="#5e3b1a" stroke-width="2"/>
      <ellipse cx="290" cy="17" rx="4" ry="2" fill="#4fae48"/>
    </svg>`;
  } else if (decor === 'lockers') {
    let lockers = '';
    const cols = ['#5c7ce0', '#e05c5c', '#43b581', '#f2c94c', '#8c5ce0', '#5cc4e0'];
    for (let i = 0; i < 10; i++) {
      const x = i * 30 + 1;
      lockers += `<rect x="${x}" y="0" width="28" height="118" rx="2" fill="${cols[i % cols.length]}" stroke="#2b2b2b" stroke-opacity="0.25"/>
        <g stroke="#000000" stroke-opacity="0.22" stroke-width="1.5">
          <line x1="${x + 6}" y1="10" x2="${x + 22}" y2="10"/><line x1="${x + 6}" y1="15" x2="${x + 22}" y2="15"/><line x1="${x + 6}" y1="20" x2="${x + 22}" y2="20"/>
        </g>
        <rect x="${x + 20}" y="56" width="4" height="12" rx="1" fill="#d6d6d6"/>`;
    }
    el.classList.add('ambient-decor-mid');
    el.innerHTML = `<svg viewBox="0 0 300 118" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">${lockers}</svg>`;
  } else if (decor === 'seabed' || decor === 'reef') {
    const weed = (x, h, d) => `<path class="seaweed" style="animation-delay:${d}s" d="M${x},96 C${x - 8},${96 - h * 0.3} ${x + 8},${96 - h * 0.55} ${x},${96 - h * 0.75} C${x - 6},${96 - h * 0.85} ${x + 4},${96 - h * 0.95} ${x},${96 - h}" fill="none" stroke="#2f9e5a" stroke-width="5" stroke-linecap="round"/>`;
    const coral = (x, col) => `<g stroke="${col}" stroke-width="5" stroke-linecap="round" fill="none">
        <path d="M${x},92 L${x},62 M${x},78 L${x - 12},64 L${x - 14},54 M${x},70 L${x + 10},58 L${x + 10},48 M${x - 12},64 L${x - 20},60"/></g>`;
    const star = (x, y) => `<path d="M${x},${y - 6} L${x + 1.8},${y - 1.8} L${x + 6},${y - 1.6} L${x + 2.8},${y + 1.4} L${x + 3.8},${y + 5.6} L${x},${y + 3.2} L${x - 3.8},${y + 5.6} L${x - 2.8},${y + 1.4} L${x - 6},${y - 1.6} L${x - 1.8},${y - 1.8} Z" fill="#ff9a5c"/>`;
    const reef = decor === 'reef';
    el.innerHTML = `<svg viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
      ${weed(16, 70, 0)}${weed(34, 50, -1.2)}${weed(268, 80, -0.6)}${weed(286, 56, -2)}
      ${reef ? coral(60, '#ff6f91') + coral(244, '#ff9a5c') + coral(214, '#b79cff') : coral(240, '#ff6f91')}
      <path d="M0,88 Q60,78 120,86 Q190,94 240,84 Q280,78 300,86 L300,100 L0,100 Z" fill="#f2dfb0"/>
      ${star(80, 92)}
      <path d="M200,95 L192,86 Q200,80 208,86 Z" fill="#ffd6ec" stroke="#e0a0c0" stroke-width="0.8"/>
      ${reef ? star(256, 94) : ''}
    </svg>`;
  } else if (decor === 'carpet') {
    let steps = '';
    for (let y = 14; y < 170; y += 20) steps += `<line x1="0" y1="${y}" x2="300" y2="${y}" stroke="#cbbfae" stroke-width="2"/>`;
    const post = (x) => `<rect x="${x - 2}" y="96" width="4" height="58" fill="#e8b84b"/><circle cx="${x}" cy="94" r="5" fill="#e8b84b"/><ellipse cx="${x}" cy="155" rx="9" ry="3" fill="#b8862a"/>`;
    el.innerHTML = `<svg viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
      <rect x="0" y="0" width="300" height="170" fill="#ebe3d6"/>
      ${steps}
      <path d="M118,0 L182,0 L232,170 L68,170 Z" fill="#b0123f"/>
      <path d="M118,0 L124,0 L76,170 L68,170 Z M182,0 L176,0 L224,170 L232,170 Z" fill="#e8b84b" opacity="0.8"/>
      ${post(26)}${post(78)}${post(222)}${post(274)}
      <path d="M26,100 Q52,118 78,100 M222,100 Q248,118 274,100" fill="none" stroke="#7a0b2a" stroke-width="4"/>
    </svg>`;
  } else if (decor === 'branch') {
    el.classList.add('ambient-decor-top');
    const leaf = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="4.5" fill="#5bb04f" transform="rotate(${r} ${x} ${y})"/>`;
    el.innerHTML = `<svg viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMin meet">
      <path d="M-4,18 Q60,30 120,22 Q100,30 86,40" fill="none" stroke="#7a5230" stroke-width="6" stroke-linecap="round"/>
      ${leaf(30, 16, -20)}${leaf(54, 32, 25)}${leaf(80, 18, -10)}${leaf(104, 30, 30)}${leaf(92, 44, 60)}
      <path d="M304,30 Q250,36 214,28" fill="none" stroke="#7a5230" stroke-width="5" stroke-linecap="round"/>
      ${leaf(280, 26, 15)}${leaf(240, 38, -25)}${leaf(222, 22, 10)}
      <g transform="translate(66,12)">
        <ellipse cx="0" cy="0" rx="8" ry="6.5" fill="#e05c5c"/><circle cx="6" cy="-5" r="4.5" fill="#e05c5c"/>
        <path d="M10,-5 L15,-4 L10,-2 Z" fill="#f2a33a"/><circle cx="7.4" cy="-6" r="1" fill="#2b2b2b"/>
        <path d="M-7,0 L-14,-4 L-12,3 Z" fill="#b83c3c"/>
      </g>
    </svg>`;
  } else if (decor === 'moon') {
    el.classList.add('ambient-decor-top');
    el.innerHTML = `<svg viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMin meet">
      <circle cx="248" cy="36" r="22" fill="#fff4c2" opacity="0.9"/>
      <circle cx="240" cy="30" r="4" fill="#efe0a0"/><circle cx="254" cy="44" r="3" fill="#efe0a0"/>
    </svg>`;
  }
  ambientLayer.appendChild(el);
}

const BAT_SVG = `<svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
  <path d="M30,10 Q20,0 4,6 Q10,10 8,16 Q16,13 18,20 Q24,14 30,18 Q36,14 42,20 Q44,13 52,16 Q50,10 56,6 Q40,0 30,10 Z" fill="#1a1226"/>
  <circle cx="27" cy="11" r="1.3" fill="#ffe066"/><circle cx="33" cy="11" r="1.3" fill="#ffe066"/>
</svg>`;

const BIRD_SVG = `<svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
  <path d="M4,10 Q16,4 30,16 Q44,4 56,10 Q44,8 30,20 Q16,8 4,10 Z" fill="#3a3550" opacity="0.75"/>
</svg>`;

function spawnConfetti() {
  const bit = document.createElement('div');
  bit.className = 'ambient-confetti';
  bit.style.left = `${Math.random() * 98}%`;
  bit.style.background = ['#e0558f', '#8c5ce0', '#5cc4e0', '#f2c94c', '#43b581'][Math.floor(Math.random() * 5)];
  bit.style.setProperty('--drift', `${(Math.random() - 0.5) * 50}px`);
  bit.style.animationDuration = `${3.5 + Math.random() * 2.5}s`;
  ambientLayer.appendChild(bit);
  setTimeout(() => bit.remove(), 6500);
}

function spawnBubble() {
  const bubble = document.createElement('div');
  bubble.className = 'ambient-bubble';
  const size = 5 + Math.random() * 10;
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  bubble.style.left = `${Math.random() * 96}%`;
  bubble.style.animationDuration = `${4 + Math.random() * 3}s`;
  ambientLayer.appendChild(bubble);
  setTimeout(() => bubble.remove(), 7500);
}

function spawnFlash() {
  const flash = document.createElement('div');
  flash.className = 'ambient-flash';
  flash.style.left = `${Math.random() * 90}%`;
  flash.style.top = `${10 + Math.random() * 45}%`;
  ambientLayer.appendChild(flash);
  setTimeout(() => flash.remove(), 700);
}

function spawnBat(svg = BAT_SVG) {
  const bat = document.createElement('div');
  bat.className = 'ambient-bat';
  const size = 26 + Math.random() * 18;
  bat.style.width = `${size}px`;
  bat.style.height = `${size / 2}px`;
  bat.style.top = `${5 + Math.random() * 45}%`;
  bat.style.setProperty('--rise', `${(Math.random() - 0.5) * 80}px`);
  bat.style.animationDuration = `${4 + Math.random() * 3}s`;
  bat.innerHTML = svg;
  ambientLayer.appendChild(bat);
  setTimeout(() => bat.remove(), 7500);
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

// ---------- Randomize ----------

document.getElementById('randomize-btn').addEventListener('click', () => {
  state.bodyType = pick(BODY_TYPES).id;
  state.skin = pick(SKIN_TONES);
  state.face = {
    eyeShape: pick(EYE_SHAPES).id,
    eyeColor: pick(EYE_COLORS),
    eyebrowShape: pick(EYEBROW_SHAPES).id,
    lashes: pick(LASH_STYLES).id,
    mouth: pick(MOUTH_SHAPES).id,
    lipColor: pick(LIP_COLORS),
    blush: Math.random() > 0.3,
    freckles: Math.random() > 0.6,
  };
  state.hair = { style: pick(HAIR_STYLES.filter(itemVisible).filter(isUnlocked)).id, color: pick(HAIR_COLORS), bangs: Math.random() < 0.35 ? pick(BANG_STYLES).id : 'none' };
  state.outfit = { style: pick(OUTFIT_STYLES.filter(itemVisible).filter(isUnlocked)).id, color: pick(OUTFIT_COLORS) };
  state.shoes = { style: pick(SHOE_STYLES.filter(itemVisible).filter(isUnlocked)).id, color: pick(SHOE_COLORS) };
  ACCESSORIES.filter(itemVisible).forEach((a) => { state.accessories[a.id] = isUnlocked(a) && Math.random() > 0.5; });
  const petDef = pick(PETS);
  state.pet = { species: petDef.id, color: petDef.color || state.pet.color, accessory: petDef.id === 'none' ? 'none' : pick(PET_ACCESSORIES).id };
  state.background = pick(BACKGROUNDS.filter(itemVisible)).id;
  render();
});

function launchConfetti(layer) {
  const colors = ['#e0558f', '#8c5ce0', '#5cc4e0', '#f2c94c', '#43b581'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 3500);
  }
}

// ---------- Wardrobe ----------

// opts.posed: draw the arms as bendable two-part limbs (on top of the outfit, so
// hands can rest on hips) and split each leg + shoe into its own group, so the
// Catwalk Show can animate arms and steps every frame.
function buildDollSVG(look, idSuffix = '', opts = {}) {
  const posed = !!opts.posed;
  const bt = BODY_TYPES.find((b) => b.id === look.bodyType);
  const hairDef = HAIR_STYLES.find((h) => h.id === look.hair.style);
  const outfitDef = OUTFIT_STYLES.find((o) => o.id === look.outfit.style);
  const shoeDef = SHOE_STYLES.find((s) => s.id === look.shoes.style);
  const lx = 93 - bt.armSpread;
  const rxHand = 207 + bt.armSpread;

  const accSvg = ACCESSORIES.filter((a) => look.accessories && look.accessories[a.id])
    .map((a) => `<g fill="${a.color}" stroke="${a.color}">${a.svg}</g>`)
    .join('');
  // Parts of accessories that sit behind the body (like a backpack).
  const accBehindSvg = ACCESSORIES.filter((a) => a.behindSvg && look.accessories && look.accessories[a.id])
    .map((a) => `<g fill="${a.color}" stroke="${a.color}">${a.behindSvg}</g>`)
    .join('');

  const face = look.face || DEFAULT_FACE;
  const rUpper = bt.limbWidth / 2 * 1.15;
  const rLower = bt.limbWidth / 2 * 0.68;
  const outlineGrow = 2;
  const shineWidth = Math.max(2, bt.limbWidth * 0.22);

  const skinGrad = `skinGrad${idSuffix}`;
  const hairGrad = `hairGrad${idSuffix}`;
  const outfitGrad = `outfitGrad${idSuffix}`;
  const shoeGrad = `shoeGrad${idSuffix}`;

  const skin = lighten(look.skin, 0.35);
  const skinBase = look.skin;
  const skinDark = darken(look.skin, 0.22);
  const hairLight = lighten(look.hair.color, 0.3);
  const hairDark = darken(look.hair.color, 0.35);
  const outfitLight = lighten(look.outfit.color, 0.4);
  const outfitDark = darken(look.outfit.color, 0.3);
  const shoeLight = lighten(look.shoes.color, 0.35);
  const shoeDark = darken(look.shoes.color, 0.3);
  const outfitFill = outfitDef.fixedColor ? 'none' : `url(#${outfitGrad})`;

  return `
    <defs>
      <linearGradient id="${skinGrad}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${skin}"/>
        <stop offset="55%" stop-color="${skinBase}"/>
        <stop offset="100%" stop-color="${skinDark}"/>
      </linearGradient>
      <linearGradient id="${hairGrad}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${hairLight}"/>
        <stop offset="55%" stop-color="${look.hair.color}"/>
        <stop offset="100%" stop-color="${hairDark}"/>
      </linearGradient>
      <linearGradient id="${outfitGrad}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${outfitLight}"/>
        <stop offset="55%" stop-color="${look.outfit.color}"/>
        <stop offset="100%" stop-color="${outfitDark}"/>
      </linearGradient>
      <linearGradient id="${shoeGrad}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${shoeLight}"/>
        <stop offset="55%" stop-color="${look.shoes.color}"/>
        <stop offset="100%" stop-color="${shoeDark}"/>
      </linearGradient>
    </defs>
    ${accBehindSvg}
    <g fill="url(#${skinGrad})">
      ${posed ? '' : `
      <path d="${capsulePath(125, 168, rUpper + outlineGrow, lx, 272, rLower + outlineGrow)}" fill="rgba(40,28,20,0.28)"/>
      <path d="${capsulePath(175, 168, rUpper + outlineGrow, rxHand, 272, rLower + outlineGrow)}" fill="rgba(40,28,20,0.28)"/>
      <path d="${capsulePath(125, 168, rUpper, lx, 272, rLower)}"/>
      <path d="${capsulePath(175, 168, rUpper, rxHand, 272, rLower)}"/>
      <line x1="125" y1="168" x2="${lx}" y2="272" stroke="#ffffff" stroke-width="${shineWidth}" stroke-linecap="round" opacity="0.28"/>
      <line x1="175" y1="168" x2="${rxHand}" y2="272" stroke="#ffffff" stroke-width="${shineWidth}" stroke-linecap="round" opacity="0.28"/>
      <g transform="translate(${lx},272)" stroke="rgba(40,28,20,0.28)" stroke-width="1.2">
        <ellipse cx="7" cy="-4" rx="4.4" ry="3" transform="rotate(35 7 -4)"/>
        <ellipse cx="0" cy="-1" rx="9" ry="9"/>
        <rect x="-6.4" y="5" width="3.2" height="9" rx="1.6"/>
        <rect x="-2.4" y="5" width="3.2" height="11" rx="1.6"/>
        <rect x="1.2" y="5" width="3.2" height="10" rx="1.6"/>
        <rect x="5.2" y="5" width="2.8" height="7.5" rx="1.4"/>
      </g>
      <g transform="translate(${rxHand},272)" stroke="rgba(40,28,20,0.28)" stroke-width="1.2">
        <ellipse cx="-7" cy="-4" rx="4.4" ry="3" transform="rotate(-35 -7 -4)"/>
        <ellipse cx="0" cy="-1" rx="9" ry="9"/>
        <rect x="3.2" y="5" width="3.2" height="9" rx="1.6"/>
        <rect x="-0.8" y="5" width="3.2" height="11" rx="1.6"/>
        <rect x="-4.4" y="5" width="3.2" height="10" rx="1.6"/>
        <rect x="-8" y="5" width="2.8" height="7.5" rx="1.4"/>
      </g>
      <g transform="translate(${lx},272)" opacity="0.3">
        <line x1="-3.4" y1="6" x2="-3.4" y2="13" stroke="#2b1c14" stroke-width="1" stroke-linecap="round"/>
        <line x1="0.4" y1="6" x2="0.4" y2="14" stroke="#2b1c14" stroke-width="1" stroke-linecap="round"/>
        <line x1="4.4" y1="6" x2="4.4" y2="12" stroke="#2b1c14" stroke-width="1" stroke-linecap="round"/>
      </g>
      <g transform="translate(${rxHand},272)" opacity="0.3">
        <line x1="3.4" y1="6" x2="3.4" y2="13" stroke="#2b1c14" stroke-width="1" stroke-linecap="round"/>
        <line x1="-0.4" y1="6" x2="-0.4" y2="14" stroke="#2b1c14" stroke-width="1" stroke-linecap="round"/>
        <line x1="-4.4" y1="6" x2="-4.4" y2="12" stroke="#2b1c14" stroke-width="1" stroke-linecap="round"/>
      </g>
      `}
      ${outfitDef.hidesLegs ? '' : `
      <g class="pl-left">
      <path d="${capsulePath(133, 248, rUpper + outlineGrow, 127, 445, rLower + outlineGrow)}" fill="rgba(40,28,20,0.28)"/>
      <path d="${capsulePath(133, 248, rUpper, 127, 445, rLower)}"/>
      <line x1="133" y1="248" x2="127" y2="445" stroke="#ffffff" stroke-width="${shineWidth}" stroke-linecap="round" opacity="0.22"/>
      </g>
      <g class="pl-right">
      <path d="${capsulePath(167, 248, rUpper + outlineGrow, 173, 445, rLower + outlineGrow)}" fill="rgba(40,28,20,0.28)"/>
      <path d="${capsulePath(167, 248, rUpper, 173, 445, rLower)}"/>
      <line x1="167" y1="248" x2="173" y2="445" stroke="#ffffff" stroke-width="${shineWidth}" stroke-linecap="round" opacity="0.22"/>
      </g>
      `}
      <path d="${bodyTorsoPath(bt)}" stroke="rgba(40,28,20,0.22)" stroke-width="2"/>
      <rect x="137" y="132" width="26" height="26" rx="8" stroke="rgba(40,28,20,0.18)" stroke-width="1.5"/>
      <ellipse cx="104" cy="97" rx="6" ry="11" stroke="rgba(40,28,20,0.22)" stroke-width="1.2"/>
      <ellipse cx="196" cy="97" rx="6" ry="11" stroke="rgba(40,28,20,0.22)" stroke-width="1.2"/>
      <circle cx="150" cy="93" r="48" stroke="rgba(40,28,20,0.22)" stroke-width="2"/>
      <ellipse cx="128" cy="72" rx="10" ry="7" fill="#ffffff" opacity="0.35"/>
    </g>
    <g fill="url(#${hairGrad})" stroke="${hairDark}">${hairDef.svg}${hairDef.id === 'none' ? '' : bangsSVG(look.hair.bangs)}</g>
    <g>${buildFaceSVG(face, look.hair.color)}</g>
    ${outfitDef.hidesLegs ? '' : posed ? `
      <clipPath id="shoeClipL${idSuffix}"><rect x="0" y="0" width="150" height="520"/></clipPath>
      <clipPath id="shoeClipR${idSuffix}"><rect x="150" y="0" width="150" height="520"/></clipPath>
      <g class="pl-left"><g clip-path="url(#shoeClipL${idSuffix})" fill="url(#${shoeGrad})" stroke="${shoeDark}">${shoeDef.svg}</g></g>
      <g class="pl-right"><g clip-path="url(#shoeClipR${idSuffix})" fill="url(#${shoeGrad})" stroke="${shoeDark}">${shoeDef.svg}</g></g>`
      : `<g fill="url(#${shoeGrad})" stroke="${shoeDark}">${shoeDef.svg}</g>`}
    <g fill="${outfitFill}">${typeof outfitDef.svg === 'function' ? outfitDef.svg(bt) : outfitDef.svg}</g>
    ${posed ? posedArmsSVG(skinGrad) : ''}
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
        <svg viewBox="0 0 300 520">${buildDollSVG(preset.look, preset.id)}</svg>
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
  state.face = { ...DEFAULT_FACE, ...(look.face || {}) };
  state.hair = { ...look.hair };
  state.outfit = { ...look.outfit };
  state.shoes = { ...look.shoes };
  state.accessories = Object.fromEntries(ACCESSORIES.map((a) => [a.id, !!(look.accessories && look.accessories[a.id])]));
  state.pet = look.pet ? { ...look.pet } : { species: 'none', color: '#c68642', accessory: 'none' };
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
  if (e.key === 'Escape' && !shopOverlay.hidden) closeShop();
  if (e.key === 'Escape' && !passesOverlay.hidden) closePasses();
  if (e.key === 'Escape' && !mgOverlay.hidden) closeMiniGames();
  if (e.key === 'Escape' && !salonOverlay.hidden) closeSalon();
  if (e.key === 'Escape' && !hairSalonOverlay.hidden) closeHairSalon();
  if (e.key === 'Escape' && !catwalkOverlay.hidden) closeCatwalk();
});

// ---------- Met Gala Boutique (shop) ----------

const shopOverlay = document.getElementById('shop-overlay');
const shopGrid = document.getElementById('shop-grid');
const shopToast = document.getElementById('shop-toast');

function shopItems() {
  return [
    ...OUTFIT_STYLES.filter((i) => i.price).map((item) => ({ item, kind: 'outfit' })),
    ...ACCESSORIES.filter((i) => i.price).map((item) => ({ item, kind: 'accessory' })),
    ...SHOE_STYLES.filter((i) => i.price).map((item) => ({ item, kind: 'shoes' })),
    ...WALK_STYLES.filter((i) => i.price).map((item) => ({ item, kind: 'walk' })),
    ...BACKGROUNDS.filter((i) => i.price).map((item) => ({ item, kind: 'background' })),
  ];
}

function previewLook(item, kind) {
  const look = {
    ...state,
    hair: { ...state.hair },
    outfit: { ...state.outfit },
    shoes: { ...state.shoes },
    accessories: { ...state.accessories },
  };
  if (kind === 'outfit') look.outfit.style = item.id;
  if (kind === 'accessory') look.accessories[item.id] = true;
  if (kind === 'shoes') look.shoes.style = item.id;
  // keep the preview clear of themed add-ons from other themes
  ACCESSORIES.forEach((a) => { if (a.theme && a.theme !== item.theme && a.id !== item.id) look.accessories[a.id] = false; });
  const outfitDef = OUTFIT_STYLES.find((o) => o.id === look.outfit.style);
  if (outfitDef.theme && outfitDef.theme !== item.theme) look.outfit.style = 'aline';
  return look;
}

function tryOn(item, kind) {
  if (item.theme && state.theme !== item.theme) {
    state.theme = item.theme;
    sanitizeStateForTheme();
  }
  if (kind === 'outfit') state.outfit.style = item.id;
  if (kind === 'accessory') state.accessories[item.id] = true;
  if (kind === 'shoes') state.shoes.style = item.id;
  if (kind === 'hair') state.hair.style = item.id;
  if (kind === 'background') state.background = item.id;
  if (kind === 'walk') {
    selectedWalk = item.id;
    try { localStorage.setItem('runwayReady.walk', item.id); } catch (e) {}
    refreshWalkPickers();
  }
  rebuildThemedLists();
  render();
}

function buyItem(item, kind) {
  if (owned.has(item.id) || cash < item.price) return;
  cash -= item.price;
  owned.add(item.id);
  saveShop();
  renderCash();
  tryOn(item, kind);
  renderShop(kind === 'walk'
    ? `🎉 You bought the ${item.label}! It's picked for the Catwalk Show and Runway Run.`
    : `🎉 You bought the ${item.label}! It's on now.`);
}

function renderShop(message) {
  renderCash();
  shopToast.textContent = message || '';
  shopToast.hidden = !message;
  shopGrid.innerHTML = '';
  const currentBg = BACKGROUNDS.find((b) => b.id === state.background);
  shopItems().forEach(({ item, kind }) => {
    const card = document.createElement('div');
    card.className = 'shop-card' + (owned.has(item.id) ? ' owned' : '');
    const bg = kind === 'background' ? item.gradient : (currentBg ? currentBg.gradient : '#f7eefb');
    const kindLabel = kind === 'outfit' ? (item.shopLabel || (item.id === 'jester-suit' ? 'Costume' : /Dress/.test(item.label) ? 'Dress' : 'Gown')) : { accessory: 'Accessory', shoes: 'Shoes', walk: 'Walk', background: 'Backdrop' }[kind];
    card.innerHTML = `
      <div class="thumb" style="background:${bg}">
        <svg viewBox="0 0 300 520">${buildDollSVG(previewLook(item, kind), `shop-${item.id}`, { posed: kind === 'walk' })}</svg>
      </div>
      <span class="label">${item.emoji} ${item.label}</span>
      <span class="theme-tag">${kindLabel}</span>
    `;
    const btn = document.createElement('button');
    btn.className = 'btn shop-buy';
    if (owned.has(item.id)) {
      btn.textContent = kind === 'walk' ? '✓ Owned — Use it' : '✓ Owned — Wear it';
      btn.classList.add('btn-ghost');
      btn.addEventListener('click', () => { tryOn(item, kind); renderShop(`✨ Wearing the ${item.label}.`); });
    } else if (cash >= item.price) {
      btn.textContent = `Buy for $${item.price}`;
      btn.classList.add('btn-primary');
      btn.addEventListener('click', () => buyItem(item, kind));
    } else {
      btn.textContent = `$${item.price} · need $${item.price - cash} more`;
      btn.classList.add('btn-ghost');
      btn.disabled = true;
    }
    card.appendChild(btn);
    shopGrid.appendChild(card);
    // Walk cards show the model striking that walk's final pose.
    if (kind === 'walk') poseLimbs(card.querySelector('.thumb'), item, 0, item.previewMid ? 0 : 1, false);
  });
}

function openShop() {
  renderShop();
  shopOverlay.hidden = false;
}

function closeShop() {
  shopOverlay.hidden = true;
}

document.getElementById('shop-btn').addEventListener('click', openShop);
document.getElementById('shop-close').addEventListener('click', closeShop);
shopOverlay.addEventListener('click', (e) => {
  if (e.target === shopOverlay) closeShop();
});

// ---------- Style Passes UI ----------

const passesOverlay = document.getElementById('passes-overlay');
const passesGrid = document.getElementById('passes-grid');
const passesToast = document.getElementById('passes-toast');

function findAnyItem(id) {
  const lists = [['outfit', OUTFIT_STYLES], ['accessory', ACCESSORIES], ['shoes', SHOE_STYLES], ['hair', HAIR_STYLES], ['background', BACKGROUNDS], ['walk', WALK_STYLES]];
  for (const [kind, list] of lists) {
    const item = list.find((x) => x.id === id);
    if (item) return { item, kind };
  }
  return null;
}

const PASS_KIND_LABEL = { outfit: 'Outfit', accessory: 'Accessory', shoes: 'Shoes', hair: 'Hair', background: 'Backdrop', walk: 'Walk' };

function renderPasses(message) {
  renderCash();
  passesToast.textContent = message || '';
  passesToast.hidden = !message;
  passesGrid.innerHTML = '';
  PASSES.forEach((pass) => {
    const owned = passOwned(pass.id);
    const pts = passPoints(pass.id);
    const nextTier = PASS_TIER_POINTS.findIndex((need) => need > pts);
    const prevNeed = nextTier > 0 ? PASS_TIER_POINTS[nextTier - 1] : PASS_TIER_POINTS[PASS_TIER_POINTS.length - 1];
    const progress = nextTier === -1 ? 1 : (pts - prevNeed) / (PASS_TIER_POINTS[nextTier] - prevNeed);
    const card = document.createElement('div');
    card.className = 'pass-card' + (owned ? ' owned' : '');
    card.style.setProperty('--pass-color', pass.color);
    const status = !owned
      ? 'Buy the pass to start unlocking rewards.'
      : nextTier === -1
        ? `🎉 ${pts} pass points · every reward unlocked!`
        : `${pts} pass points · ${PASS_TIER_POINTS[nextTier] - pts} more to Tier ${nextTier}`;
    card.innerHTML = `
      <div class="pass-head">
        <span class="pass-emoji">${pass.emoji}</span>
        <div class="pass-title"><h3>${pass.label}</h3><p>${pass.blurb}</p></div>
      </div>
      <div class="pass-progress"><div class="pass-bar"><div class="pass-bar-fill" style="width:${owned ? Math.round(progress * 100) : 0}%"></div></div>
        <span class="pass-status">${status}</span></div>
      <ol class="pass-tiers"></ol>`;
    const head = card.querySelector('.pass-head');
    const buy = document.createElement('button');
    buy.className = 'btn pass-buy';
    if (owned) {
      buy.textContent = '✓ Owned';
      buy.classList.add('btn-ghost');
      buy.disabled = true;
    } else if (cash >= pass.price) {
      buy.textContent = `Buy for $${pass.price}`;
      buy.classList.add('btn-primary');
      buy.addEventListener('click', () => buyPass(pass));
    } else {
      buy.textContent = `$${pass.price} · need $${pass.price - cash} more`;
      buy.classList.add('btn-ghost');
      buy.disabled = true;
    }
    head.appendChild(buy);
    const tiers = card.querySelector('.pass-tiers');
    pass.rewards.forEach((id, tier) => {
      const found = findAnyItem(id);
      if (!found) return;
      const { item, kind } = found;
      const open = owned && pts >= PASS_TIER_POINTS[tier];
      const li = document.createElement('li');
      li.className = 'pass-tier' + (open ? ' open' : '');
      li.innerHTML = `<span class="tier-num">${tier === 0 ? 'Free' : `Tier ${tier}`}</span>
        <span class="tier-emoji">${item.emoji}</span>
        <span class="tier-label">${item.label}<small>${PASS_KIND_LABEL[kind]}</small></span>`;
      const act = document.createElement('button');
      act.className = 'tier-action';
      if (open) {
        act.textContent = kind === 'walk' ? 'Use' : 'Wear';
        act.addEventListener('click', () => { tryOn(item, kind); renderPasses(`✨ ${kind === 'walk' ? 'Using' : 'Wearing'} the ${item.label}.`); });
      } else {
        act.textContent = tier === 0 ? '🔒 Pass' : `🔒 ${PASS_TIER_POINTS[tier]} pts`;
        act.disabled = true;
      }
      li.appendChild(act);
      tiers.appendChild(li);
    });
    passesGrid.appendChild(card);
  });
}

function buyPass(pass) {
  if (passOwned(pass.id) || cash < pass.price) return;
  cash -= pass.price;
  saveShop();
  passState[pass.id] = { owned: true, xp: 0 };
  savePasses();
  const first = findAnyItem(pass.rewards[0]);
  rebuildThemedLists();
  if (first) tryOn(first.item, first.kind);
  renderPasses(`🎉 You got the ${pass.label}! ${first ? `${first.item.emoji} ${first.item.label} is unlocked and on now.` : ''} Earn pass points in every show to unlock the rest.`);
}

function openPasses() {
  renderPasses();
  passesOverlay.hidden = false;
}

function closePasses() {
  passesOverlay.hidden = true;
  rebuildThemedLists();
  render();
  refreshWalkPickers();
}

document.getElementById('passes-btn').addEventListener('click', openPasses);
document.getElementById('passes-close').addEventListener('click', closePasses);
passesOverlay.addEventListener('click', (e) => {
  if (e.target === passesOverlay) closePasses();
});

// ---------- Hair Salon ----------
// A mirror close-up for trying hairstyles, bangs and colours.

const hairSalonOverlay = document.getElementById('hair-salon-overlay');
const hairMirror = document.getElementById('hair-mirror');

function renderHairMirror() {
  hairMirror.innerHTML = `<svg viewBox="40 0 220 200" xmlns="http://www.w3.org/2000/svg">${buildDollSVG(state, 'hairsalon')}</svg>`;
}

function hairSet(fn) {
  fn();
  render();
  renderHairMirror();
  highlightHairSalon();
}

function highlightHairSalon() {
  highlightSelection('#hs-styles', state.hair.style, 'id');
  highlightSelection('#hs-bangs', state.hair.bangs || 'none', 'id');
  highlightSelection('#hs-colors', state.hair.color, 'color');
}

function buildHairSalon() {
  buildOptionButtons(document.getElementById('hs-styles'), HAIR_STYLES.filter(itemVisible), (id) => hairSet(() => { state.hair.style = id; }));
  buildOptionButtons(document.getElementById('hs-bangs'), BANG_STYLES, (id) => hairSet(() => { state.hair.bangs = id; }));
  buildSwatches(document.getElementById('hs-colors'), SALON_HAIR_COLORS, (c) => hairSet(() => { state.hair.color = c; }));
}

function surpriseHair() {
  hairSet(() => {
    state.hair.style = pick(HAIR_STYLES.filter(itemVisible).filter(isUnlocked).filter((h) => h.id !== 'none')).id;
    state.hair.bangs = pick(BANG_STYLES).id;
    state.hair.color = pick(SALON_HAIR_COLORS);
  });
}

function openHairSalon() {
  buildHairSalon();
  renderHairMirror();
  highlightHairSalon();
  hairSalonOverlay.hidden = false;
}

function closeHairSalon() {
  hairSalonOverlay.hidden = true;
  render();
}

document.getElementById('hair-salon-btn').addEventListener('click', openHairSalon);
document.getElementById('hs-close').addEventListener('click', closeHairSalon);
document.getElementById('hs-done').addEventListener('click', closeHairSalon);
document.getElementById('hs-surprise').addEventListener('click', surpriseHair);
hairSalonOverlay.addEventListener('click', (e) => {
  if (e.target === hairSalonOverlay) closeHairSalon();
});

// ---------- Mini Salon ----------
// A close-up mirror of the model's face where you apply makeup and spa masks.

const salonOverlay = document.getElementById('salon-overlay');
const salonMirror = document.getElementById('salon-mirror');

function renderSalonMirror() {
  salonMirror.innerHTML = `<svg viewBox="78 14 144 138" xmlns="http://www.w3.org/2000/svg">${buildDollSVG(state, 'salon')}</svg>`;
}

function salonSet(fn) {
  fn();
  render();
  renderSalonMirror();
  highlightSalon();
}

function highlightSalon() {
  const f = state.face;
  highlightSelection('#salon-shadow', f.eyeshadow || 'none', 'color');
  highlightSelection('#salon-blush', f.blush ? (f.blushColor || '#ff8fa3') : 'none', 'color');
  highlightSelection('#salon-lips', f.lipColor, 'color');
  highlightSelection('#salon-lashes', f.lashes || 'none', 'id');
  highlightSelection('#salon-cheek', f.cheekArt || 'none', 'id');
  document.querySelectorAll('#salon-extras .option-btn').forEach((b) => {
    b.classList.toggle('selected', !!f[b.dataset.id]);
  });
  document.querySelectorAll('#salon-spa .option-btn').forEach((b) => {
    b.classList.toggle('selected', !!state.accessories[b.dataset.id]);
  });
}

function buildSalonSwatches(id, colors, onPick, withNone) {
  const el = document.getElementById(id);
  buildSwatches(el, colors, onPick);
  if (withNone) {
    const none = document.createElement('button');
    none.className = 'swatch swatch-none';
    none.dataset.color = 'none';
    none.title = 'None';
    none.setAttribute('aria-label', 'None');
    none.textContent = '✕';
    none.addEventListener('click', () => onPick('none'));
    el.prepend(none);
  }
}

function buildSalon() {
  buildSalonSwatches('salon-shadow', EYESHADOW_COLORS, (c) => salonSet(() => { state.face.eyeshadow = c === 'none' ? null : c; }), true);
  buildSalonSwatches('salon-blush', BLUSH_COLORS, (c) => salonSet(() => {
    if (c === 'none') state.face.blush = false;
    else { state.face.blush = true; state.face.blushColor = c; }
  }), true);
  buildSalonSwatches('salon-lips', SALON_LIP_COLORS, (c) => salonSet(() => { state.face.lipColor = c; }), false);
  buildOptionButtons(document.getElementById('salon-lashes'), LASH_STYLES, (id) => salonSet(() => { state.face.lashes = id; }));
  buildOptionButtons(document.getElementById('salon-cheek'), CHEEK_ART, (id) => salonSet(() => { state.face.cheekArt = id; }));
  buildOptionButtons(document.getElementById('salon-extras'), [
    { id: 'gloss', label: 'Lip Gloss', emoji: '💋' },
    { id: 'glitter', label: 'Glitter', emoji: '✨' },
    { id: 'freckles', label: 'Freckles', emoji: '⁘' },
  ], (id) => salonSet(() => { state.face[id] = !state.face[id]; }));
  buildOptionButtons(document.getElementById('salon-spa'), ACCESSORIES.filter((a) => ['sheet-mask', 'cucumber-eyes', 'clay-mask', 'sleeping-mask'].includes(a.id)),
    (id) => salonSet(() => { state.accessories[id] = !state.accessories[id]; }));
}

function wipeMakeup() {
  salonSet(() => {
    Object.assign(state.face, { eyeshadow: null, blushColor: '#ff8fa3', gloss: false, glitter: false, cheekArt: 'none', lashes: 'none', lipColor: '#c9707d', blush: true });
    ['sheet-mask', 'cucumber-eyes', 'clay-mask', 'sleeping-mask'].forEach((id) => { state.accessories[id] = false; });
  });
}

function openSalon() {
  buildSalon();
  renderSalonMirror();
  highlightSalon();
  salonOverlay.hidden = false;
}

function closeSalon() {
  salonOverlay.hidden = true;
  rebuildThemedLists();
  render();
}

document.getElementById('salon-btn').addEventListener('click', openSalon);
document.getElementById('salon-close').addEventListener('click', closeSalon);
document.getElementById('salon-done').addEventListener('click', closeSalon);
document.getElementById('salon-wipe').addEventListener('click', wipeMakeup);
salonOverlay.addEventListener('click', (e) => {
  if (e.target === salonOverlay) closeSalon();
});

// ---------- Mini Games ----------
// Three quick games that earn pass points (for every pass you own) and a little cash.

const mgOverlay = document.getElementById('minigames-overlay');
const mgMenu = document.getElementById('mg-menu');
const mgGame = document.getElementById('mg-game');
const mgArea = document.getElementById('mg-area');
const mgHud = document.getElementById('mg-hud-text');
const mgResult = document.getElementById('mg-result');

const MINI_GAMES = [
  { id: 'memory', label: 'Outfit Memory', emoji: '👗', blurb: 'Flip cards and find the matching pairs. Fewer flips = more points!', reward: 'Up to 6 pass points + $10' },
  { id: 'catch', label: 'Fashion Catch', emoji: '🛍️', blurb: 'Move the bag to catch falling fashion. Dodge the stinky socks!', reward: 'Up to 8 pass points + $20' },
  { id: 'poses', label: 'Pose Party', emoji: '💃', blurb: 'Watch the poses light up, then copy the pattern. It gets longer!', reward: 'Up to 8 pass points + $16' },
];

let mgCurrent = null;
let mgCleanup = null;

function renderMiniMenu() {
  mgMenu.innerHTML = '';
  const hasPass = PASSES.some((x) => passOwned(x.id));
  document.getElementById('mg-subtitle').textContent = hasPass
    ? 'Play to earn pass points for your passes, plus a little cash.'
    : 'Play to earn cash. Get a pass in 🎟️ Passes to earn pass points from mini games too!';
  MINI_GAMES.forEach((g) => {
    const card = document.createElement('button');
    card.className = 'mg-card';
    card.innerHTML = `<span class="mg-emoji">${g.emoji}</span><span class="mg-name">${g.label}</span>
      <span class="mg-blurb">${g.blurb}</span><span class="mg-reward">🎟️ ${g.reward}</span>`;
    card.addEventListener('click', () => startMiniGame(g.id));
    mgMenu.appendChild(card);
  });
}

function stopMiniGame() {
  if (mgCleanup) mgCleanup();
  mgCleanup = null;
}

function startMiniGame(id) {
  stopMiniGame();
  mgCurrent = id;
  mgMenu.hidden = true;
  mgGame.hidden = false;
  mgResult.hidden = true;
  mgArea.innerHTML = '';
  mgArea.className = `mg-area mg-area-${id}`;
  if (id === 'memory') startMemory();
  if (id === 'catch') startCatch();
  if (id === 'poses') startPoses();
}

function showMiniMenu() {
  stopMiniGame();
  mgGame.hidden = true;
  mgMenu.hidden = false;
  renderMiniMenu();
}

function finishMiniGame(title, points, cashWon) {
  stopMiniGame();
  cash += cashWon;
  saveShop();
  renderCash();
  const hasPass = PASSES.some((x) => passOwned(x.id));
  let text = `💵 +$${cashWon} (now $${cash})`;
  if (hasPass && points > 0) {
    const unlocked = addPassPoints(points);
    text += ` · 🎟️ +${points} pass points`;
    if (unlocked.length) text += ` · Unlocked ${unlocked.join(' & ')}!`;
    rebuildThemedLists();
    render();
  } else if (!hasPass) {
    text += ' · Get a pass to earn pass points too!';
  }
  document.getElementById('mg-result-title').textContent = title;
  document.getElementById('mg-result-text').textContent = text;
  mgResult.hidden = false;
  if (points >= 6) {
    const layer = document.getElementById('mg-confetti');
    layer.innerHTML = '';
    launchConfetti(layer);
  }
}

// --- Outfit Memory ---
function startMemory() {
  const faces = ['👗', '👠', '👜', '💄', '👑', '🕶️'];
  const deck = [...faces, ...faces].sort(() => Math.random() - 0.5);
  let flipped = [];
  let matched = 0;
  let flips = 0;
  let busy = false;
  const update = () => { mgHud.textContent = `👆 ${flips} flips · ✅ ${matched} / ${faces.length} pairs`; };
  update();
  deck.forEach((face, i) => {
    const card = document.createElement('button');
    card.className = 'mem-card';
    card.dataset.face = face;
    card.setAttribute('aria-label', `Card ${i + 1}`);
    card.innerHTML = `<span class="mem-back">✨</span><span class="mem-front">${face}</span>`;
    card.addEventListener('click', () => {
      if (busy || card.classList.contains('flipped')) return;
      card.classList.add('flipped');
      flipped.push(card);
      if (flipped.length < 2) return;
      flips += 1;
      const [a, b] = flipped;
      if (a.dataset.face === b.dataset.face) {
        a.classList.add('matched');
        b.classList.add('matched');
        flipped = [];
        matched += 1;
        update();
        if (matched === faces.length) {
          const points = flips <= 9 ? 6 : flips <= 12 ? 5 : flips <= 16 ? 4 : 3;
          setTimeout(() => finishMiniGame(`🎉 All pairs in ${flips} flips!`, points, 10), 400);
        }
      } else {
        busy = true;
        update();
        setTimeout(() => {
          a.classList.remove('flipped');
          b.classList.remove('flipped');
          flipped = [];
          busy = false;
        }, 750);
      }
    });
    mgArea.appendChild(card);
  });
}

// --- Fashion Catch ---
function startCatch() {
  const GOOD = ['👗', '👠', '💍', '👜', '💄', '⭐', '🎀', '🕶️'];
  const BAD = ['🧦', '🐛'];
  const DURATION = 30;
  mgArea.innerHTML = '<div class="catch-bag" id="catch-bag">🛍️</div>';
  const bag = document.getElementById('catch-bag');
  let bagX = 0.5;
  let caught = 0;
  let items = [];
  let raf = null;
  let last = 0;
  let spawnIn = 0;
  let timeLeft = DURATION;
  const keys = { left: false, right: false };
  const place = () => { bag.style.left = `${bagX * 100}%`; };
  place();
  const onMove = (e) => {
    const r = mgArea.getBoundingClientRect();
    bagX = Math.min(0.95, Math.max(0.05, (e.clientX - r.left) / r.width));
    place();
  };
  const onKey = (down) => (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = down; e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = down; e.preventDefault(); }
  };
  const kd = onKey(true), ku = onKey(false);
  const noTouch = (e) => e.preventDefault();
  mgArea.addEventListener('pointermove', onMove);
  mgArea.addEventListener('pointerdown', onMove);
  mgArea.addEventListener('touchstart', noTouch, { passive: false });
  mgArea.addEventListener('touchmove', noTouch, { passive: false });
  document.addEventListener('keydown', kd);
  document.addEventListener('keyup', ku);

  const tick = (ts) => {
    if (!last) last = ts;
    const dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    timeLeft -= dt;
    if (keys.left) bagX = Math.max(0.05, bagX - dt * 0.9);
    if (keys.right) bagX = Math.min(0.95, bagX + dt * 0.9);
    place();
    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawnIn = 0.55 + Math.random() * 0.35;
      const bad = Math.random() < 0.22;
      const el = document.createElement('div');
      el.className = 'catch-item';
      el.textContent = bad ? BAD[Math.floor(Math.random() * BAD.length)] : GOOD[Math.floor(Math.random() * GOOD.length)];
      const item = { el, x: 0.06 + Math.random() * 0.88, y: -0.08, speed: 0.32 + Math.random() * 0.22 + (DURATION - timeLeft) * 0.006, bad };
      el.style.left = `${item.x * 100}%`;
      mgArea.appendChild(el);
      items.push(item);
    }
    items = items.filter((it) => {
      it.y += it.speed * dt;
      it.el.style.top = `${it.y * 100}%`;
      if (it.y > 0.8 && it.y < 0.92 && Math.abs(it.x - bagX) < 0.09) {
        if (it.bad) caught = Math.max(0, caught - 2);
        else caught += 1;
        bag.classList.remove('bump');
        void bag.offsetWidth;
        bag.classList.add(it.bad ? 'bump-bad' : 'bump');
        setTimeout(() => bag.classList.remove('bump', 'bump-bad'), 250);
        it.el.remove();
        return false;
      }
      if (it.y > 1.05) { it.el.remove(); return false; }
      return true;
    });
    mgHud.textContent = `⏱️ ${Math.max(0, Math.ceil(timeLeft))}s · 🛍️ ${caught} caught`;
    if (timeLeft <= 0) {
      const points = Math.min(8, Math.ceil(caught / 3));
      finishMiniGame(`🛍️ You caught ${caught}!`, points, Math.min(20, caught));
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  mgCleanup = () => {
    if (raf) cancelAnimationFrame(raf);
    mgArea.removeEventListener('pointermove', onMove);
    mgArea.removeEventListener('pointerdown', onMove);
    mgArea.removeEventListener('touchstart', noTouch);
    mgArea.removeEventListener('touchmove', noTouch);
    document.removeEventListener('keydown', kd);
    document.removeEventListener('keyup', ku);
    items.forEach((it) => it.el.remove());
  };
}

// --- Pose Party ---
function startPoses() {
  const POSES = [
    { emoji: '💅', label: 'Slay', color: '#e0558f' },
    { emoji: '👑', label: 'Diva', color: '#f2c94c' },
    { emoji: '💃', label: 'Dance', color: '#8c5ce0' },
    { emoji: '✨', label: 'Sparkle', color: '#5cc4e0' },
  ];
  const MAX_ROUNDS = 8;
  let seq = [];
  let input = 0;
  let accepting = false;
  let timers = [];
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  mgArea.innerHTML = '<div class="pose-grid" id="pose-grid"></div><p class="pose-msg" id="pose-msg"></p>';
  const grid = document.getElementById('pose-grid');
  const msg = document.getElementById('pose-msg');
  const btns = POSES.map((pose, i) => {
    const b = document.createElement('button');
    b.className = 'pose-btn';
    b.style.setProperty('--pose-color', pose.color);
    b.innerHTML = `<span>${pose.emoji}</span><small>${pose.label}</small>`;
    b.addEventListener('click', () => press(i));
    grid.appendChild(b);
    return b;
  });
  const flash = (i, ms = 420) => {
    btns[i].classList.add('lit');
    later(() => btns[i].classList.remove('lit'), ms);
  };
  const rounds = () => seq.length - 1;
  const update = () => { mgHud.textContent = `💃 Round ${seq.length} · ✅ ${Math.max(0, rounds())} copied`; };
  const playSeq = () => {
    accepting = false;
    input = 0;
    msg.textContent = '👀 Watch the poses...';
    update();
    seq.forEach((p, k) => later(() => flash(p), 700 + k * 650));
    later(() => { accepting = true; msg.textContent = '👆 Your turn! Copy the pattern.'; }, 700 + seq.length * 650);
  };
  const nextRound = () => {
    seq.push(Math.floor(Math.random() * POSES.length));
    playSeq();
  };
  const press = (i) => {
    if (!accepting) return;
    flash(i, 220);
    if (i !== seq[input]) {
      accepting = false;
      const done = rounds();
      later(() => finishMiniGame(done > 0 ? `💃 You copied ${done} pattern${done === 1 ? '' : 's'}!` : '💃 Nice try!', done, done * 2), 400);
      return;
    }
    input += 1;
    if (input === seq.length) {
      accepting = false;
      if (seq.length >= MAX_ROUNDS) {
        later(() => finishMiniGame('🏆 Perfect Pose Party!', MAX_ROUNDS, MAX_ROUNDS * 2), 400);
        return;
      }
      msg.textContent = '🎉 Yes! Here comes a longer one...';
      later(nextRound, 700);
    }
  };
  nextRound();
  mgCleanup = () => { timers.forEach(clearTimeout); timers = []; accepting = false; };
}

function openMiniGames() {
  renderCash();
  showMiniMenu();
  mgOverlay.hidden = false;
}

function closeMiniGames() {
  stopMiniGame();
  mgOverlay.hidden = true;
}

document.getElementById('minigames-btn').addEventListener('click', openMiniGames);
document.getElementById('mg-close').addEventListener('click', closeMiniGames);
document.getElementById('mg-back').addEventListener('click', showMiniMenu);
document.getElementById('mg-done').addEventListener('click', showMiniMenu);
document.getElementById('mg-again').addEventListener('click', () => startMiniGame(mgCurrent));
mgOverlay.addEventListener('click', (e) => {
  if (e.target === mgOverlay) closeMiniGames();
});

// ---------- Catwalk Show (walk styles) ----------
// A second show mode: pick a walk, and the model struts toward the camera down a
// catwalk with arms, steps and sway animated per frame, then strikes a final pose.

const HAND_SHAPES = {
  L: `<ellipse cx="7" cy="-4" rx="4.4" ry="3" transform="rotate(35 7 -4)"/>
      <ellipse cx="0" cy="-1" rx="9" ry="9"/>
      <rect x="-6.4" y="5" width="3.2" height="9" rx="1.6"/>
      <rect x="-2.4" y="5" width="3.2" height="11" rx="1.6"/>
      <rect x="1.2" y="5" width="3.2" height="10" rx="1.6"/>
      <rect x="5.2" y="5" width="2.8" height="7.5" rx="1.4"/>`,
  R: `<ellipse cx="-7" cy="-4" rx="4.4" ry="3" transform="rotate(-35 -7 -4)"/>
      <ellipse cx="0" cy="-1" rx="9" ry="9"/>
      <rect x="3.2" y="5" width="3.2" height="9" rx="1.6"/>
      <rect x="-0.8" y="5" width="3.2" height="11" rx="1.6"/>
      <rect x="-4.4" y="5" width="3.2" height="10" rx="1.6"/>
      <rect x="-8" y="5" width="2.8" height="7.5" rx="1.4"/>`,
};

function posedArmsSVG(skinGrad) {
  const side = (k) => `
    <path class="pa-${k}-uo" fill="rgba(40,28,20,0.28)"/>
    <path class="pa-${k}-fo" fill="rgba(40,28,20,0.28)"/>
    <path class="pa-${k}-u"/>
    <path class="pa-${k}-f"/>
    <g class="pa-${k}-hand" stroke="rgba(40,28,20,0.28)" stroke-width="1.2">${HAND_SHAPES[k]}</g>`;
  return `<g class="posed-arms" fill="url(#${skinGrad})">${side('L')}${side('R')}</g>`;
}

const WALK_STYLES = [
  { id: 'slay', label: 'Slay Walk', emoji: '💅', duration: 5, cycle: 0.95, bob: 5, sway: 1.2, lift: 12, swing: 7,
    walkArms: 'sides', finalArms: 'slay', comment: 'Strong steps, arms locked in. That walk SLAYED!' },
  { id: 'diva', label: 'Diva Walk', emoji: '👑', duration: 6, cycle: 0.8, bob: 3, sway: 6, lift: 8, swing: 0,
    walkArms: 'hips', finalArms: 'hips', comment: 'Hands on hips, hips on point. Total diva!' },
  { id: 'strut', label: 'Model Strut', emoji: '🕶️', duration: 5, cycle: 0.9, bob: 4, sway: 3.5, lift: 10, swing: 7,
    walkArms: 'oneHip', finalArms: 'model', comment: 'Effortless strut, and that final pose? Iconic.' },
  { id: 'skip', label: 'Happy Skip', emoji: '🎈', duration: 4.5, cycle: 1.3, bob: 14, sway: 2, lift: 15, swing: 14,
    walkArms: 'sides', finalArms: 'tada', comment: 'So much joy! The crowd is bouncing with you.' },
  { id: 'ballet', label: 'Ballet Twirl', emoji: '🩰', duration: 5.5, cycle: 0.7, bob: 6, sway: 1, lift: 12, swing: 0, spin: true,
    walkArms: 'second', finalArms: 'arch', comment: 'Twirls, tiptoes and perfect arms. Bravo, ballerina!' },
  { id: 'glide', label: 'Moon Glide', emoji: '🌙', price: 90, duration: 5.5, cycle: 0.6, bob: 0, sway: 0, lift: 4, swing: 3,
    walkArms: 'sides', finalArms: 'model', comment: 'So smooth! You glided like you were on the moon.' },
  { id: 'robot', label: 'Robot Walk', emoji: '🤖', price: 90, robot: true, duration: 5, cycle: 0.9, bob: 2, sway: 0, lift: 8, swing: 12,
    walkArms: 'robot', finalArms: 'robot', comment: 'Beep boop! Precision strutting, 100% robot power.' },
  { id: 'hop', label: 'Bunny Hop', emoji: '🐰', price: 90, bothLegs: true, duration: 4.5, cycle: 1.1, bob: 18, sway: 0, lift: 10, swing: 0,
    walkArms: 'paws', finalArms: 'tada', comment: 'Hop, hop, hooray! The cutest walk on the runway.' },
  { id: 'power', label: 'Power Strut', emoji: '💪', price: 90, duration: 5, cycle: 0.95, bob: 6, sway: 1.5, lift: 13, swing: 10,
    walkArms: 'pump', finalArms: 'flex', comment: 'Strong and fierce! Total power move.' },
  { id: 'kiss', label: 'Blow a Kiss', emoji: '😘', price: 90, duration: 5, cycle: 0.85, bob: 4, sway: 2.5, lift: 9, swing: 6,
    walkArms: 'sides', finalArms: 'kiss', comment: 'Mwah! The crowd is blowing kisses back.' },
  { id: 'disco', label: 'Disco Strut', emoji: '🪩', price: 90, duration: 5.5, cycle: 1, bob: 6, sway: 4, lift: 11, swing: 0,
    walkArms: 'point', finalArms: 'disco', comment: 'Groovy! You turned the catwalk into a dance floor.' },
  { id: 'spin-pose', label: 'Spin & Pose', emoji: '🌀', price: 90, spin: true, duration: 5.5, cycle: 0.9, bob: 4, sway: 2, lift: 10, swing: 0,
    walkArms: 'hips', finalArms: 'model', comment: 'A spin, a pose, a superstar moment!' },
  { id: 'super-flight', label: 'Super Flight', emoji: '🦸', price: 90, flying: true, previewMid: true, duration: 5, cycle: 0.5, bob: 6, sway: 2, lift: 0, swing: 0,
    walkArms: 'superman', finalArms: 'heroLand', comment: 'Up, up and away! A super landing!' },
  { id: 'baddie-strut', label: 'Baddie Strut', emoji: '💅', pass: 'baddie', passTier: 3, duration: 5, cycle: 0.9, bob: 4, sway: 5.5, lift: 11, swing: 7,
    walkArms: 'oneHip', finalArms: 'model', comment: 'Main character energy! That walk was a whole moment.' },
  { id: 'wave', label: 'Royal Wave', emoji: '👋', duration: 5.5, cycle: 0.8, bob: 3, sway: 2, lift: 8, swing: 4,
    walkArms: 'wave', finalArms: 'wave', comment: 'Graceful and regal. Everyone waved back!' },
];

const CATWALK_CASH = 15;

// Arm poses in the 300x520 doll space. Each side: elbow e and hand h.
// s is the step swing (-1..1), t is time in seconds (for waving).
function armPose(kind, side, bt, s, t, swing) {
  const dir = side === 'L' ? -1 : 1;
  const mx = (x) => (side === 'L' ? x : 300 - x);
  const spread = bt.armSpread;
  const w = bt.waistHalf;
  const swingY = s * swing * (side === 'L' ? 1 : -1);
  if (kind === 'sides') {
    return { e: [mx(112 - spread * 0.5), 220 + swingY * 0.3], h: [mx(93 - spread), 272 + swingY] };
  }
  if (kind === 'hips') {
    return { e: [150 + dir * (w + 40), 200], h: [150 + dir * (w + 2), 214] };
  }
  if (kind === 'up') {
    return { e: [150 + dir * 66, 142], h: [150 + dir * 46, 96] };
  }
  if (kind === 'v') {
    return { e: [mx(98), 138], h: [mx(76), 98] };
  }
  if (kind === 'robot') {
    const up = s > 0 === (side === 'L') ? -14 : 14;
    return { e: [mx(106), 224], h: [mx(82), 214 + up * Math.min(1, Math.abs(s))] };
  }
  if (kind === 'paws') {
    return { e: [mx(116), 212], h: [mx(136), 194] };
  }
  if (kind === 'pump') {
    return { e: [mx(104), 214 + swingY * 0.4], h: [mx(118), 190 + swingY * 1.2] };
  }
  if (kind === 'flex') {
    return { e: [mx(82), 172], h: [mx(94), 128] };
  }
  if (kind === 'kiss') {
    return { e: [mx(98), 172], h: [mx(138), 116] };
  }
  if (kind === 'point') {
    const upNow = (s > 0) === (side === 'L');
    return upNow ? { e: [mx(94), 132], h: [mx(64), 90] } : { e: [mx(112 - spread * 0.5), 220], h: [mx(93 - spread), 268] };
  }
  if (kind === 'fistUp') {
    return { e: [mx(104), 122], h: [mx(96), 72] };
  }
  if (kind === 'pointUp') {
    return { e: [mx(94), 132], h: [mx(64), 90] };
  }
  if (kind === 'out') {
    return { e: [mx(96), 180 + Math.sin(t * 3) * 3], h: [mx(56), 186 + Math.sin(t * 3) * 6] };
  }
  if (kind === 'arch') {
    return { e: [mx(96), 108], h: [mx(138), 46] };
  }
  if (kind === 'waving') {
    return { e: [mx(88), 150], h: [mx(72) + Math.sin(t * 9) * 9, 100] };
  }
  return armPose('sides', side, bt, s, t, swing);
}

function walkArmKinds(kind) {
  switch (kind) {
    case 'hips': return { L: 'hips', R: 'hips' };
    case 'oneHip': return { L: 'hips', R: 'sides' };
    case 'wave': return { L: 'sides', R: 'waving' };
    case 'slay': return { L: 'hips', R: 'sides' };
    case 'model': return { L: 'hips', R: 'up' };
    case 'tada': return { L: 'v', R: 'v' };
    case 'second': return { L: 'out', R: 'out' };
    case 'robot': return { L: 'robot', R: 'robot' };
    case 'paws': return { L: 'paws', R: 'paws' };
    case 'pump': return { L: 'pump', R: 'pump' };
    case 'flex': return { L: 'flex', R: 'flex' };
    case 'kiss': return { L: 'hips', R: 'kiss' };
    case 'point': return { L: 'point', R: 'point' };
    case 'disco': return { L: 'hips', R: 'pointUp' };
    case 'superman': return { L: 'sides', R: 'fistUp' };
    case 'heroLand': return { L: 'hips', R: 'hips' };
    case 'arch': return { L: 'arch', R: 'arch' };
    default: return { L: 'sides', R: 'sides' };
  }
}

function lerp(a, b, k) { return a + (b - a) * k; }
function lerpPt(p, q, k) { return [lerp(p[0], q[0], k), lerp(p[1], q[1], k)]; }

function setArm(root, side, shoulder, elbow, hand, bt) {
  const rU = bt.limbWidth / 2 * 1.15;
  const rL = bt.limbWidth / 2 * 0.68;
  const rE = (rU + rL) / 2;
  const g = 2;
  const q = (c) => root.querySelector(`.pa-${side}-${c}`);
  q('uo').setAttribute('d', capsulePath(shoulder[0], shoulder[1], rU + g, elbow[0], elbow[1], rE + g));
  q('fo').setAttribute('d', capsulePath(elbow[0], elbow[1], rE + g, hand[0], hand[1], rL + g));
  q('u').setAttribute('d', capsulePath(shoulder[0], shoulder[1], rU, elbow[0], elbow[1], rE));
  q('f').setAttribute('d', capsulePath(elbow[0], elbow[1], rE, hand[0], hand[1], rL));
  const ang = Math.atan2(hand[1] - elbow[1], hand[0] - elbow[0]) * 180 / Math.PI - 90;
  q('hand').setAttribute('transform', `translate(${hand[0].toFixed(1)},${hand[1].toFixed(1)}) rotate(${ang.toFixed(1)})`);
}

const catwalkOverlay = document.getElementById('catwalk-overlay');
const cwStage = document.getElementById('cw-stage');
const cwModel = document.getElementById('cw-model');
const cwCaption = document.getElementById('cw-caption');
const cwResult = document.getElementById('cw-result');
const cwFlashes = document.getElementById('cw-flashes');
const cwWalkBtn = document.getElementById('cw-walk-btn');

let selectedWalk = 'slay';
try { selectedWalk = localStorage.getItem('runwayReady.walk') || 'slay'; } catch (e) {}
let cwRaf = null;
let cwStart = 0;
let cwFlashTimer = null;

function buildWalkPicker() {
  buildWalkPickerIn('walk-styles', resetCatwalk);
}

function buildCrowd() {
  const crowd = document.getElementById('cw-crowd');
  if (crowd.childElementCount) return;
  const colors = ['#3b2a5c', '#5a3a7a', '#2b2b4a', '#6a4a8a', '#463466'];
  // Fans sit in rows on both sides, kept outside the catwalk's slanted edge.
  let n = 0;
  [44, 33, 22, 11, 1].forEach((bottom) => {
    const y = 100 - bottom - 8;
    const edge = 41 - 29 * Math.max(0, y - 52) / 48;
    for (let x = 1 + (bottom % 2) * 2; x + 6 <= edge - 2; x += 6.5) {
      [x, 100 - x - 5.5].forEach((left) => {
        const head = document.createElement('span');
        head.className = 'cw-fan';
        head.style.left = `${left}%`;
        head.style.bottom = `${bottom}%`;
        head.style.background = colors[n++ % colors.length];
        crowd.appendChild(head);
      });
    }
  });
}

function mountCatwalkModel() {
  cwModel.innerHTML = `<svg viewBox="0 -10 300 520" preserveAspectRatio="xMidYMax meet">${buildDollSVG(state, 'cw', { posed: true })}</svg>`;
}

function poseFrame(walk, u, t, finalK) {
  const bt = BODY_TYPES.find((b) => b.id === state.bodyType);
  const walking = finalK < 1;
  const phase = t * walk.cycle * Math.PI * 2;
  const bob = Math.abs(Math.sin(phase)) * walk.bob * (1 - finalK) * (walking ? 1 : 0);
  const sway = Math.sin(phase) * walk.sway * (1 - finalK) + (walk.id === 'diva' ? finalK * 4 : 0) + (walk.id === 'slay' ? finalK * -3 : 0);
  const scale = 0.42 + 0.58 * u;
  const bottom = lerp(58, 3, u);
  cwModel.style.bottom = `${bottom}%`;
  // Ballet twirl: spin around (a squash of the width) while walking, ending face-forward.
  const spin = walk.spin ? lerp(Math.cos(t * Math.PI * 1.2), 1, finalK) : 1;
  const hover = walk.flying ? (46 + Math.sin(t * 2.4) * 6) * (1 - finalK) : 0;
  cwModel.style.transform = `translateX(-50%) translateY(${(-(bob + hover) * scale).toFixed(1)}px) scale(${scale.toFixed(3)}) scaleX(${spin.toFixed(3)}) rotate(${sway.toFixed(2)}deg)`;

  poseLimbs(cwModel, walk, t, finalK, true);
}

// The step swing (-1..1) of a walk at time t. Robot walks snap between steps.
function walkSwing(walk, t) {
  const v = Math.sin(t * walk.cycle * Math.PI * 2);
  return walk.robot ? Math.sign(v) : v;
}

// Poses the arms and legs of a posed doll (inside root) for a walk at time t.
// finalK blends toward the walk's final pose; active=false holds a standing pose.
function poseLimbs(root, walk, t, finalK, active) {
  const svg = root.querySelector('svg');
  if (!svg || !svg.querySelector('.posed-arms')) return;
  const bt = BODY_TYPES.find((b) => b.id === state.bodyType);
  const s = active ? walkSwing(walk, t) * (1 - finalK) : 0;
  const liftL = (walk.bothLegs ? Math.abs(s) : Math.max(0, s)) * walk.lift;
  const liftR = (walk.bothLegs ? Math.abs(s) : Math.max(0, -s)) * walk.lift;
  if (walk.flying) {
    // Legs stretched out behind: squash them toward the hips (they point away
    // from us) and bring them together, easing back to standing on landing.
    const k = 1 - finalK;
    const sy = 1 - 0.5 * k, dx = 7 * k;
    const legT = (d) => `translate(${(d * dx).toFixed(1)},248) scale(1,${sy.toFixed(3)}) translate(0,-248)`;
    root.querySelectorAll('.pl-left').forEach((g) => g.setAttribute('transform', legT(1)));
    root.querySelectorAll('.pl-right').forEach((g) => g.setAttribute('transform', legT(-1)));
  } else {
    root.querySelectorAll('.pl-left').forEach((g) => g.setAttribute('transform', `translate(0,${(-liftL).toFixed(1)})`));
    root.querySelectorAll('.pl-right').forEach((g) => g.setAttribute('transform', `translate(0,${(-liftR).toFixed(1)})`));
  }
  const walkK = walkArmKinds(walk.walkArms);
  const finK = walkArmKinds(walk.finalArms);
  ['L', 'R'].forEach((side) => {
    const a = armPose(walkK[side], side, bt, s, t, walk.swing);
    const b = armPose(finK[side], side, bt, 0, t, 0);
    const shoulder = side === 'L' ? [125, 168] : [175, 168];
    setArm(svg, side, shoulder, lerpPt(a.e, b.e, finalK), lerpPt(a.h, b.h, finalK), bt);
  });
}

function currentWalk() {
  const w = WALK_STYLES.find((x) => x.id === selectedWalk);
  return w && isOwned(w) && passUnlocked(w) ? w : WALK_STYLES[0];
}

// Walk pickers appear in both shows; locked walks show their price and open the shop.
function buildWalkPickerIn(containerId, onChange) {
  const el = document.getElementById(containerId);
  if (!el) return;
  buildOptionButtons(el, WALK_STYLES, (id) => {
    selectedWalk = id;
    try { localStorage.setItem('runwayReady.walk', id); } catch (e) {}
    refreshWalkPickers();
    if (onChange) onChange();
  });
  highlightSelection(`#${containerId}`, selectedWalk, 'id');
}

function refreshWalkPickers() {
  if (!catwalkOverlay.hidden) buildWalkPickerIn('walk-styles', resetCatwalk);
  if (!gameOverlay.hidden) buildWalkPickerIn('game-walk-styles', onGameWalkChange);
}

function spawnCwFlash() {
  const f = document.createElement('div');
  f.className = 'ambient-flash';
  f.style.left = `${Math.random() < 0.5 ? 4 + Math.random() * 22 : 74 + Math.random() * 22}%`;
  f.style.top = `${40 + Math.random() * 45}%`;
  cwFlashes.appendChild(f);
  setTimeout(() => f.remove(), 700);
}

function resetCatwalk() {
  if (cwRaf) cancelAnimationFrame(cwRaf);
  cwRaf = null;
  if (cwFlashTimer) clearInterval(cwFlashTimer);
  cwFlashTimer = null;
  cwFlashes.innerHTML = '';
  cwResult.hidden = true;
  cwWalkBtn.disabled = false;
  const walk = currentWalk();
  cwCaption.textContent = `${walk.emoji} ${walk.label}`;
  const bgDef = BACKGROUNDS.find((b) => b.id === state.background);
  document.getElementById('cw-backdrop').style.background = bgDef.gradient;
  mountCatwalkModel();
  poseFrame(walk, 0, 0, 0);
}

function catwalkLoop(ts) {
  if (!cwStart) cwStart = ts;
  const t = (ts - cwStart) / 1000;
  const walk = currentWalk();
  const u = Math.min(1, t / walk.duration);
  const ease = u < 1 ? u * (2 - u) * 0.15 + u * 0.85 : 1;
  const finalK = Math.min(1, Math.max(0, (t - walk.duration) / 0.45));
  poseFrame(walk, ease, t, finalK);
  if (t > walk.duration + 1.8) {
    finishCatwalk(walk);
    return;
  }
  cwRaf = requestAnimationFrame(catwalkLoop);
}

function finishCatwalk(walk) {
  cwRaf = null;
  if (cwFlashTimer) clearInterval(cwFlashTimer);
  cwFlashTimer = null;
  const score = Math.min(10, 8.4 + Math.random() * 1.6);
  cash += CATWALK_CASH;
  saveShop();
  renderCash();
  document.getElementById('cw-score').textContent = `${score.toFixed(1)} / 10`;
  document.getElementById('cw-comment').textContent = walk.comment;
  const passNew = PASSES.some((x) => passOwned(x.id)) ? addPassPoints(PASS_POINTS_PER_CATWALK) : null;
  document.getElementById('cw-cash').textContent = `💵 +$${CATWALK_CASH} (now $${cash})`
    + (passNew ? ` · 🎟️ +${PASS_POINTS_PER_CATWALK} pass points` : '')
    + (passNew && passNew.length ? ` · Unlocked ${passNew.join(' & ')}!` : '');
  rebuildThemedLists();
  render();
  cwResult.hidden = false;
  const confetti = document.getElementById('cw-confetti');
  confetti.innerHTML = '';
  if (score >= 9.3) launchConfetti(confetti);
}

function startCatwalk() {
  resetCatwalk();
  cwWalkBtn.disabled = true;
  cwStart = 0;
  cwFlashTimer = setInterval(() => { if (Math.random() < 0.6) spawnCwFlash(); }, 260);
  cwRaf = requestAnimationFrame(catwalkLoop);
}

function openCatwalk() {
  buildWalkPicker();
  buildCrowd();
  catwalkOverlay.hidden = false;
  resetCatwalk();
}

function closeCatwalk() {
  catwalkOverlay.hidden = true;
  if (cwRaf) cancelAnimationFrame(cwRaf);
  cwRaf = null;
  if (cwFlashTimer) clearInterval(cwFlashTimer);
  cwFlashTimer = null;
}

document.getElementById('catwalk-btn').addEventListener('click', openCatwalk);
document.getElementById('cw-close').addEventListener('click', closeCatwalk);
document.getElementById('cw-done-btn').addEventListener('click', closeCatwalk);
document.getElementById('cw-again-btn').addEventListener('click', startCatwalk);
cwWalkBtn.addEventListener('click', startCatwalk);
catwalkOverlay.addEventListener('click', (e) => {
  if (e.target === catwalkOverlay) closeCatwalk();
});

// ---------- Runway Run (mini side-scroller) ----------

const BASE_W = 720;
const BASE_H = 320;
const WORLD_WIDTH = 2300;
const GROUND_Y = 250;
const CHAR_W = 70;
const CHAR_H = 138;
const FINISH_X = WORLD_WIDTH - 100;

const MOUNT_W = 130;
const MOUNT_H = 108;
const RIDE_LIFT = 56;
const RIDE_SCALE = 0.85;
const COMPANION_SIZE = 58;
const COMPANION_LAG = 44;

// Movement mode is derived from the player's choices: a mermaid gown means you swim,
// riding a horse means you gallop, fairy wings mean you fly — otherwise you walk.
// Each mode has its own gravity/thrust feel so it plays like a distinct mini game.
const GAME_MODES = {
  walk: { gravity: 1500, jumpVelocity: -620, moveSpeed: 260, ceiling: 0, label: '🚶 Walk', hint: '◀ ▶ / A D to move · Space or ↑ to jump — reach the flag to finish!', jumpLabel: '⤒ Jump' },
  fly: { gravity: 420, thrust: 1500, moveSpeed: 300, ceiling: 100, label: '🦋 Fly', hint: '◀ ▶ / A D to move · Hold Space or ↑ to rise — reach the flag to finish!', jumpLabel: '⤒ Rise' },
  swim: { gravity: 320, thrust: 900, moveSpeed: 220, ceiling: 75, label: '🧜 Swim', hint: '◀ ▶ / A D to move · Hold Space or ↑ to swim up — reach the flag to finish!', jumpLabel: '⤒ Swim Up' },
  ride: { gravity: 1500, jumpVelocity: -680, moveSpeed: 380, ceiling: 0, label: '🐎 Ride', hint: '◀ ▶ / A D to move · Space or ↑ to jump — reach the flag to finish!', jumpLabel: '⤒ Jump' },
};

function computeGameMode() {
  const outfitDef = OUTFIT_STYLES.find((o) => o.id === state.outfit.style);
  if (outfitDef && ['mermaid', 'mermaid-tail', 'ocean-sparkle-tail'].includes(outfitDef.id)) return 'swim';
  if (state.pet.species === 'horse') return 'ride';
  if (['fairy-wings', 'feather-wings', 'hero-cape', 'rainbow-wings'].some((a) => state.accessories[a])) return 'fly';
  if (currentWalk().flying) return 'fly';
  return 'walk';
}

const STAR_LAYOUT = [
  { x: 220, elevation: 14 },
  { x: 420, elevation: 100 },
  { x: 640, elevation: 14 },
  { x: 860, elevation: 100 },
  { x: 1080, elevation: 14 },
  { x: 1300, elevation: 100 },
  { x: 1540, elevation: 14 },
  { x: 1780, elevation: 100 },
];

const STAR_ICON = `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <path d="M12,2 L14.7,8.6 L22,9.3 L16.6,14.1 L18.2,21 L12,17.3 L5.8,21 L7.4,14.1 L2,9.3 L9.3,8.6 Z" fill="#f7d154" stroke="#c98f1f" stroke-width="1"/>
</svg>`;

const gameOverlay = document.getElementById('game-overlay');
const gameViewport = document.getElementById('game-viewport');
const gameWorld = document.getElementById('game-world');
const gameFinish = document.getElementById('game-finish');
const gameResult = document.getElementById('game-result');
const gameScoreDisplay = document.getElementById('game-score-display');
const gameCommentDisplay = document.getElementById('game-comment-display');
const gameStarsSummary = document.getElementById('game-stars-summary');
const gameStarCount = document.getElementById('game-star-count');
const gameModeBadge = document.getElementById('game-mode-badge');
const gameHint = document.getElementById('game-hint');
const gameProgressFill = document.getElementById('game-progress-fill');
const gameConfettiLayer = document.getElementById('game-confetti-layer');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnJump = document.getElementById('btn-jump');

const keys = { left: false, right: false, up: false };
let gameCharacterEl = null;
let mountEl = null;
let companionEl = null;
let gameMode = 'walk';
let starEls = [];
let starCollected = [];
let charX = 30;
let elevation = 0;
let jumpV = 0;
let starsCollected = 0;
let rafId = null;
let lastTs = 0;
let gameWalkT = 0;

// Switching walks can change how you move (Super Flight flies), so restart the run then.
function onGameWalkChange() {
  updateGameWalkBadge();
  if (computeGameMode() !== gameMode) resetGameState();
  else poseLimbs(gameCharacterEl, currentWalk(), gameWalkT, 0, false);
}

function updateGameWalkBadge() {
  const walk = currentWalk();
  document.getElementById('game-walk-badge').textContent = `${walk.emoji} ${walk.label}`;
}

function buildStars() {
  gameWorld.querySelectorAll('.game-star').forEach((s) => s.remove());
  starEls = STAR_LAYOUT.map((star) => {
    const el = document.createElement('div');
    el.className = 'game-star';
    el.style.left = `${star.x}px`;
    el.style.top = `${GROUND_Y - star.elevation}px`;
    el.innerHTML = STAR_ICON;
    gameWorld.appendChild(el);
    return el;
  });
}

function collectStar(i) {
  starCollected[i] = true;
  starsCollected += 1;
  starEls[i].classList.add('collected');
  gameStarCount.textContent = `⭐ ${starsCollected} / ${STAR_LAYOUT.length}`;
}

function updateModeChrome() {
  const modeDef = GAME_MODES[gameMode];
  gameModeBadge.textContent = modeDef.label;
  gameHint.textContent = modeDef.hint;
  btnJump.textContent = modeDef.jumpLabel;
}

function resetGameState() {
  gameMode = computeGameMode();
  charX = 30;
  elevation = 0;
  jumpV = 0;
  keys.left = false;
  keys.right = false;
  keys.up = false;
  starsCollected = 0;
  starCollected = STAR_LAYOUT.map(() => false);
  lastTs = 0;

  gameResult.hidden = true;
  gameProgressFill.style.width = '0%';
  gameStarCount.textContent = `⭐ 0 / ${STAR_LAYOUT.length}`;
  gameFinish.style.left = `${FINISH_X}px`;

  buildStars();

  gameWorld.querySelectorAll('.game-character, .game-mount, .game-companion').forEach((c) => c.remove());
  gameCharacterEl = document.createElement('div');
  gameCharacterEl.className = 'game-character' + (gameMode === 'ride' ? ' riding' : '') + (gameMode === 'fly' ? ' flying' : '') + (gameMode === 'swim' ? ' swimming' : '');
  gameCharacterEl.innerHTML = `<svg viewBox="0 -10 300 480" preserveAspectRatio="xMidYMax meet">${buildDollSVG(state, 'game', { posed: true })}</svg>`;
  gameWalkT = 0;
  poseLimbs(gameCharacterEl, currentWalk(), 0, 0, false);
  gameWorld.appendChild(gameCharacterEl);

  mountEl = null;
  companionEl = null;
  const petDef = PETS.find((p) => p.id === state.pet.species);
  if (petDef && petDef.id !== 'none') {
    if (gameMode === 'ride') {
      mountEl = document.createElement('div');
      mountEl.className = 'game-mount';
      mountEl.innerHTML = `<svg viewBox="0 0 160 160" preserveAspectRatio="xMidYMax meet">${buildPetSVG(petDef, state.pet.color, 'mount')}</svg>`;
      gameWorld.appendChild(mountEl);
    } else {
      companionEl = document.createElement('div');
      companionEl.className = 'game-companion';
      companionEl.innerHTML = `<svg viewBox="0 0 160 160" preserveAspectRatio="xMidYMax meet">${buildPetSVG(petDef, state.pet.color, 'companion')}${buildPetAccessorySVG(petDef, state.pet.accessory)}</svg>`;
      gameWorld.appendChild(companionEl);
    }
  }

  gameViewport.classList.remove('mode-walk', 'mode-fly', 'mode-swim', 'mode-ride');
  gameViewport.classList.add(`mode-${gameMode}`);

  const bgDef = BACKGROUNDS.find((b) => b.id === state.background);
  gameViewport.style.background = gameMode === 'swim'
    ? 'linear-gradient(180deg, #bfeaff 0%, #6ec6e8 55%, #256d92 100%)'
    : bgDef.gradient;

  updateModeChrome();
}

function gameLoop(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min((ts - lastTs) / 1000, 0.05);
  lastTs = ts;

  const modeDef = GAME_MODES[gameMode];
  let vx = 0;
  if (keys.left) vx -= modeDef.moveSpeed;
  if (keys.right) vx += modeDef.moveSpeed;
  charX = Math.min(Math.max(charX + vx * dt, 0), WORLD_WIDTH - CHAR_W);

  if (gameMode === 'fly' || gameMode === 'swim') {
    const thrust = keys.up ? modeDef.thrust : 0;
    jumpV += (modeDef.gravity - thrust) * dt;
    elevation -= jumpV * dt;
    if (elevation <= 0) {
      elevation = 0;
      jumpV = Math.min(jumpV, 0);
    }
    if (elevation >= modeDef.ceiling) {
      elevation = modeDef.ceiling;
      jumpV = Math.max(jumpV, 0);
    }
  } else {
    jumpV += modeDef.gravity * dt;
    elevation -= jumpV * dt;
    if (elevation <= 0) {
      elevation = 0;
      jumpV = 0;
    }
  }

  const charCenterX = charX + CHAR_W / 2;
  STAR_LAYOUT.forEach((star, i) => {
    if (starCollected[i]) return;
    const dx = Math.abs(charCenterX - star.x);
    const dElevation = Math.abs(elevation - star.elevation);
    if (dx < 45 && dElevation < 60) collectStar(i);
  });

  const scale = gameViewport.clientWidth / BASE_W;
  const cameraX = Math.min(Math.max(charCenterX - BASE_W / 2, 0), Math.max(WORLD_WIDTH - BASE_W, 0));
  gameWorld.style.transform = `scale(${scale}) translateX(${-cameraX}px)`;

  if (gameMode === 'ride' && mountEl) {
    const mountLeft = charX + CHAR_W / 2 - MOUNT_W / 2 - 8;
    mountEl.style.left = `${mountLeft}px`;
    mountEl.style.top = `${GROUND_Y - MOUNT_H - elevation}px`;
    mountEl.classList.toggle('moving', vx !== 0);
    gameCharacterEl.style.left = `${charX}px`;
    gameCharacterEl.style.top = `${GROUND_Y - CHAR_H - elevation - RIDE_LIFT}px`;
  } else {
    gameCharacterEl.style.left = `${charX}px`;
    gameCharacterEl.style.top = `${GROUND_Y - CHAR_H - elevation}px`;
  }
  gameCharacterEl.classList.toggle('moving', vx !== 0);
  // Walk with the chosen walk style: arms and steps animate while moving.
  if (vx !== 0) gameWalkT += dt;
  poseLimbs(gameCharacterEl, currentWalk(), gameWalkT, 0, vx !== 0 && elevation === 0);

  if (companionEl) {
    const compLeft = Math.max(0, charX - COMPANION_LAG);
    companionEl.style.left = `${compLeft}px`;
    companionEl.style.top = `${GROUND_Y - COMPANION_SIZE}px`;
    companionEl.classList.toggle('moving', vx !== 0);
  }

  const progress = Math.min(1, charX / (FINISH_X - CHAR_W));
  gameProgressFill.style.width = `${progress * 100}%`;

  if (charX >= FINISH_X - CHAR_W) {
    endGame();
    return;
  }

  rafId = requestAnimationFrame(gameLoop);
}

function endGame() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;

  const total = STAR_LAYOUT.length;
  const allCollected = starsCollected === total;
  const score = Math.min(10, 6.5 + Math.random() * 0.5 + starsCollected * 0.35 + (allCollected ? 0.5 : 0));
  const comment = JUDGE_COMMENTS[Math.floor(Math.random() * JUDGE_COMMENTS.length)];

  const prevLevel = getLevelInfo(totalStars).level;
  totalStars += starsCollected;
  saveTotalStars();
  const newLevelInfo = getLevelInfo(totalStars);
  const leveledUp = newLevelInfo.level > prevLevel;
  const newlyUnlocked = leveledUp
    ? [...OUTFIT_STYLES, ...ACCESSORIES].filter((i) => i.unlockLevel === newLevelInfo.level)
    : [];

  gameScoreDisplay.textContent = `${score.toFixed(1)} / 10`;
  gameCommentDisplay.textContent = comment;
  const cashEarned = starsCollected * CASH_PER_STAR + CASH_FOR_FINISH + (allCollected ? CASH_ALL_STARS_BONUS : 0);
  cash += cashEarned;
  saveShop();
  renderCash();
  const passGain = starsCollected * PASS_POINTS_PER_STAR + PASS_POINTS_FOR_FINISH;
  const passNew = PASSES.some((x) => passOwned(x.id)) ? addPassPoints(passGain) : null;
  gameStarsSummary.textContent = `⭐ ${starsCollected} earned this run · ${totalStars} total · 💵 +$${cashEarned} (now $${cash})`
    + (passNew ? ` · 🎟️ +${passGain} pass points` : '')
    + (passNew && passNew.length ? ` · Unlocked ${passNew.join(' & ')}!` : '');

  const levelupEl = document.getElementById('game-levelup');
  if (leveledUp) {
    const names = newlyUnlocked.map((i) => i.label).join(' & ');
    levelupEl.textContent = `🎉 Level up! You're now ${newLevelInfo.name}${names ? ` — unlocked ${names}!` : ''}`;
    levelupEl.hidden = false;
  } else {
    levelupEl.hidden = true;
  }

  gameConfettiLayer.innerHTML = '';
  if (score >= 9 || leveledUp) launchConfetti(gameConfettiLayer);
  gameResult.hidden = false;

  renderLevelBanner();
  rebuildThemedLists();
  render();
}

function tryJump() {
  if (gameOverlay.hidden) return;
  if (gameMode === 'fly' || gameMode === 'swim') return;
  if (elevation === 0) jumpV = GAME_MODES[gameMode].jumpVelocity;
}

function onGameKeyDown(e) {
  const k = e.key;
  if (k === 'Escape') {
    closeGame();
    return;
  }
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
    keys.left = true;
    e.preventDefault();
  } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
    keys.right = true;
    e.preventDefault();
  } else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') {
    keys.up = true;
    tryJump();
    e.preventDefault();
  }
}

function onGameKeyUp(e) {
  const k = e.key;
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false;
  else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
  else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') keys.up = false;
}

function openGame() {
  resetGameState();
  gameOverlay.hidden = false;
  buildWalkPickerIn('game-walk-styles', onGameWalkChange);
  updateGameWalkBadge();
  document.addEventListener('keydown', onGameKeyDown);
  document.addEventListener('keyup', onGameKeyUp);
  rafId = requestAnimationFrame(gameLoop);
}

function closeGame() {
  gameOverlay.hidden = true;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  document.removeEventListener('keydown', onGameKeyDown);
  document.removeEventListener('keyup', onGameKeyUp);
}

document.getElementById('show-btn').addEventListener('click', openGame);
document.getElementById('game-close').addEventListener('click', closeGame);
document.getElementById('game-done-btn').addEventListener('click', closeGame);
document.getElementById('game-again-btn').addEventListener('click', () => {
  resetGameState();
  if (!rafId) rafId = requestAnimationFrame(gameLoop);
});
gameOverlay.addEventListener('click', (e) => {
  if (e.target === gameOverlay) closeGame();
});

// Touch controls: holding a button keeps moving. On iPad/iPhone a long press
// would otherwise start text selection, the copy/paste menu or the magnifier,
// so the default touch behaviour is cancelled and the finger is "captured" by
// the button until it lifts, even if it slides a little off the button.
function wireHoldButton(btn, onPress, onRelease) {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (btn.setPointerCapture) {
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
    }
    onPress();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => btn.addEventListener(ev, onRelease));
  btn.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
}

wireHoldButton(btnLeft, () => { keys.left = true; }, () => { keys.left = false; });
wireHoldButton(btnRight, () => { keys.right = true; }, () => { keys.right = false; });
wireHoldButton(btnJump, () => { keys.up = true; tryJump(); }, () => { keys.up = false; });

// Block long-press menus and double-tap zoom anywhere on the runway game.
const gameModalEl = gameOverlay.querySelector('.game-modal');
gameModalEl.addEventListener('contextmenu', (e) => e.preventDefault());
gameViewport.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

// ---------- Init ----------

renderLevelBanner();
renderCash();
rebuildThemedLists();
render();
