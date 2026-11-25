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
  { id: 'crop', label: 'Short Crop', emoji: '💈',
    svg: `<path d="M100,78 A52,52 0 0 1 200,78 L198,96 A50,42 0 0 0 102,96 Z"/>
          <path d="M116,64 Q128,56 140,60" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.25"/>` },
];

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

const DEFAULT_FACE = {
  eyeShape: 'round',
  eyeColor: '#3b2417',
  eyebrowShape: 'soft',
  mouth: 'smile',
  lipColor: '#c9707d',
  blush: true,
  freckles: false,
};

function eyeShapeSVG(shape, cx, side, color) {
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
    ${face.blush ? `<ellipse cx="130" cy="104" rx="8" ry="5.5" fill="#ff8fa3" opacity="0.45"/><ellipse cx="170" cy="104" rx="8" ry="5.5" fill="#ff8fa3" opacity="0.45"/>` : ''}
    ${face.freckles ? frecklesSVG() : ''}
    <path d="M147,97 Q150,101 148,102.5" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="1.2" stroke-linecap="round"/>
    ${eyeShapeSVG(face.eyeShape, 132, -1, face.eyeColor)}
    ${eyeShapeSVG(face.eyeShape, 168, 1, face.eyeColor)}
    ${eyebrowSVG(face.eyebrowShape, 132, hairColor)}
    ${eyebrowSVG(face.eyebrowShape, 168, hairColor)}
    ${mouthSVG(face.mouth, face.lipColor)}
  `;
}

const BACKGROUNDS = [
  { id: 'pink', label: 'Pink Runway', emoji: '🎀', gradient: 'linear-gradient(180deg, #ffd6ec 0%, #ffb6d9 55%, #ff9fce 100%)' },
  { id: 'night', label: 'Night Gala', emoji: '🌌', gradient: 'linear-gradient(180deg, #1b1035 0%, #3a1f5d 55%, #6a3093 100%)' },
  { id: 'gold', label: 'Gold Stage', emoji: '🌟', gradient: 'linear-gradient(180deg, #fff6d8 0%, #ffe08a 55%, #f6c453 100%)' },
  { id: 'spring', label: 'Spring Bloom', emoji: '🌸', gradient: 'linear-gradient(180deg, #eaffea 0%, #b9f2d0 55%, #8fe3b0 100%)' },
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
      background: 'pink', face: { eyeShape: 'wide' } } },
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
  { id: 'santas-helper', label: "Santa's Helper", theme: 'christmas',
    look: { bodyType: 'neutral', skin: SKIN_TONES[0], hair: { style: 'ponytail', color: '#8a5a2b' },
      outfit: { style: 'elf-costume', color: '#1e7a46' }, shoes: { style: 'boots', color: '#8a5a2b' },
      accessories: { 'santa-hat': true, 'candy-cane': true }, background: 'christmas-snow',
      face: { mouth: 'grin' } } },
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
      background: 'sunset-flock', face: { eyeShape: 'almond' } } },
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
      background: 'haunted-night', face: { lipColor: '#8c4a6b' } } },
];

// ---------- Leveling / unlocks ----------

const LEVELS = [
  { level: 1, name: 'Newcomer', threshold: 0 },
  { level: 2, name: 'Rising Star', threshold: 8 },
  { level: 3, name: 'Runway Regular', threshold: 24 },
  { level: 4, name: 'Style Icon', threshold: 48 },
  { level: 5, name: 'Legend', threshold: 80 },
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

function isUnlocked(item) {
  return levelUnlocked(item) && isOwned(item);
}

function renderCash() {
  document.getElementById('cash-badge').textContent = `💵 $${cash}`;
  const shopCash = document.getElementById('shop-cash');
  if (shopCash) shopCash.textContent = `💵 $${cash}`;
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
    btn.innerHTML = `<span class="emoji">${item.emoji}</span>${item.label}`
      + (unlocked ? '' : !isOwned(item)
        ? `<span class="lock-badge">🛍️ $${item.price} in Shop</span>`
        : `<span class="lock-badge">🔒 Lvl ${item.unlockLevel}</span>`);
    if (unlocked) {
      btn.addEventListener('click', () => onPick(item.id));
    } else if (!isOwned(item)) {
      btn.classList.add('shop-locked');
      btn.title = `Buy ${item.label} in the Shop for $${item.price}`;
      btn.addEventListener('click', () => openShop());
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
  hairLayer.innerHTML = hairDef.svg;
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
  highlightSelection('#mouth-shapes', state.face.mouth, 'id');
  highlightSelection('#lip-colors', state.face.lipColor, 'color');
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
    mouth: pick(MOUTH_SHAPES).id,
    lipColor: pick(LIP_COLORS),
    blush: Math.random() > 0.3,
    freckles: Math.random() > 0.6,
  };
  state.hair = { style: pick(HAIR_STYLES.filter(itemVisible).filter(isUnlocked)).id, color: pick(HAIR_COLORS) };
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
    <g fill="url(#${hairGrad})" stroke="${hairDark}">${hairDef.svg}</g>
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
  if (kind === 'background') state.background = item.id;
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
  renderShop(`🎉 You bought the ${item.label}! It's on now.`);
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
    const kindLabel = kind === 'outfit' ? (item.id === 'jester-suit' ? 'Costume' : item.id === 'ruffle-dress' ? 'Dress' : 'Gown') : { accessory: 'Accessory', background: 'Backdrop' }[kind];
    card.innerHTML = `
      <div class="thumb" style="background:${bg}">
        <svg viewBox="0 0 300 520">${buildDollSVG(previewLook(item, kind), `shop-${item.id}`)}</svg>
      </div>
      <span class="label">${item.emoji} ${item.label}</span>
      <span class="theme-tag">${kindLabel}</span>
    `;
    const btn = document.createElement('button');
    btn.className = 'btn shop-buy';
    if (owned.has(item.id)) {
      btn.textContent = '✓ Owned — Wear it';
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
let cwRaf = null;
let cwStart = 0;
let cwFlashTimer = null;

function buildWalkPicker() {
  buildOptionButtons(document.getElementById('walk-styles'), WALK_STYLES, (id) => {
    selectedWalk = id;
    highlightSelection('#walk-styles', selectedWalk, 'id');
    resetCatwalk();
  });
  highlightSelection('#walk-styles', selectedWalk, 'id');
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
  const s = walking ? Math.sin(phase) * (1 - finalK) : 0;
  const bob = Math.abs(Math.sin(phase)) * walk.bob * (1 - finalK);
  const sway = Math.sin(phase) * walk.sway * (1 - finalK) + (walk.id === 'diva' ? finalK * 4 : 0) + (walk.id === 'slay' ? finalK * -3 : 0);
  const scale = 0.42 + 0.58 * u;
  const bottom = lerp(58, 3, u);
  cwModel.style.bottom = `${bottom}%`;
  cwModel.style.transform = `translateX(-50%) translateY(${(-bob * scale).toFixed(1)}px) scale(${scale.toFixed(3)}) rotate(${sway.toFixed(2)}deg)`;

  const liftL = Math.max(0, s) * walk.lift;
  const liftR = Math.max(0, -s) * walk.lift;
  cwModel.querySelectorAll('.pl-left').forEach((g) => g.setAttribute('transform', `translate(0,${(-liftL).toFixed(1)})`));
  cwModel.querySelectorAll('.pl-right').forEach((g) => g.setAttribute('transform', `translate(0,${(-liftR).toFixed(1)})`));

  const walkK = walkArmKinds(walk.walkArms);
  const finK = walkArmKinds(walk.finalArms);
  const svg = cwModel.querySelector('svg');
  ['L', 'R'].forEach((side) => {
    const a = armPose(walkK[side], side, bt, s, t, walk.swing);
    const b = armPose(finK[side], side, bt, 0, t, 0);
    const shoulder = side === 'L' ? [125, 168] : [175, 168];
    setArm(svg, side, shoulder, lerpPt(a.e, b.e, finalK), lerpPt(a.h, b.h, finalK), bt);
  });
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
  const walk = WALK_STYLES.find((w) => w.id === selectedWalk);
  cwCaption.textContent = `${walk.emoji} ${walk.label}`;
  const bgDef = BACKGROUNDS.find((b) => b.id === state.background);
  document.getElementById('cw-backdrop').style.background = bgDef.gradient;
  mountCatwalkModel();
  poseFrame(walk, 0, 0, 0);
}

function catwalkLoop(ts) {
  if (!cwStart) cwStart = ts;
  const t = (ts - cwStart) / 1000;
  const walk = WALK_STYLES.find((w) => w.id === selectedWalk);
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
  document.getElementById('cw-cash').textContent = `💵 +$${CATWALK_CASH} (now $${cash})`;
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
  if (state.accessories['fairy-wings'] || state.accessories['feather-wings']) return 'fly';
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
  gameCharacterEl.innerHTML = `<svg viewBox="0 -10 300 480" preserveAspectRatio="xMidYMax meet">${buildDollSVG(state, 'game')}</svg>`;
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
  gameStarsSummary.textContent = `⭐ ${starsCollected} earned this run · ${totalStars} total · 💵 +$${cashEarned} (now $${cash})`;

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
