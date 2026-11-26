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

// A natural-looking limb: a smooth outline whose width follows a profile along the
// limb (thigh -> knee -> calf -> ankle, or shoulder -> elbow -> forearm -> wrist).
// Every width stays inside the old capsule, so clothes drawn as capsules still cover it.
const LEG_PROFILE = [[0, 1], [0.12, 1], [0.3, 0.93], [0.44, 0.8], [0.5, 0.8], [0.6, 0.97], [0.7, 0.95], [0.84, 0.76], [0.93, 0.68], [1, 0.74]];
const ARM_PROFILE = [[0, 1], [0.1, 1], [0.3, 0.9], [0.46, 0.8], [0.52, 0.8], [0.64, 0.93], [0.8, 0.84], [0.93, 0.7], [1, 0.75]];

function smoothThrough(pts) {
  // Catmull-Rom through points -> cubic Bezier commands (starts after the first point).
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function limbPath(x1, y1, x2, y2, rU, rL, profile, grow = 0) {
  const ang = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
  const nx = Math.cos(ang), ny = Math.sin(ang);
  const side = (k) => profile.map(([t, f]) => {
    const r = f * (rU + (rL - rU) * t) + grow;
    return [x1 + (x2 - x1) * t + k * nx * r, y1 + (y2 - y1) * t + k * ny * r];
  });
  const a = side(1), b = side(-1).reverse();
  const rEnd = profile[profile.length - 1][1] * rL + grow, rStart = profile[0][1] * rU + grow;
  return `M${a[0][0].toFixed(1)},${a[0][1].toFixed(1)}${smoothThrough(a)}
    A${rEnd.toFixed(1)},${rEnd.toFixed(1)} 0 0 0 ${b[0][0].toFixed(1)},${b[0][1].toFixed(1)}${smoothThrough(b)}
    A${rStart.toFixed(1)},${rStart.toFixed(1)} 0 0 0 ${a[0][0].toFixed(1)},${a[0][1].toFixed(1)} Z`;
}
const legPath = (x1, y1, x2, y2, rU, rL, grow = 0) => limbPath(x1, y1, x2, y2, rU, rL, LEG_PROFILE, grow);
const armPath = (x1, y1, x2, y2, rU, rL, grow = 0) => limbPath(x1, y1, x2, y2, rU, rL, ARM_PROFILE, grow);

// A face with a soft jaw and chin, and a neck that flows into the shoulders.
const HEAD_PATH = 'M102,93 A48,48 0 0 1 198,93 C198,117 188,134 172,141 Q150,149 128,141 C112,134 102,117 102,93 Z';
const NECK_PATH = 'M139,126 L161,126 Q161,145 166,152 Q172,156 180,158 L120,158 Q128,156 134,152 Q139,145 139,126 Z';
const BODY_DETAILS = `<path d="M150,136 Q150,145 150,150" fill="none" stroke="rgba(40,28,20,0.08)" stroke-width="2" stroke-linecap="round"/>
  <path d="M131,160 Q140,157 147,161 M169,160 Q160,157 153,161" fill="none" stroke="rgba(40,28,20,0.16)" stroke-width="1.3" stroke-linecap="round"/>`;
function jointLinesSVG(lx, rx) {
  // Soft hints of knees and elbows.
  return `<path d="M125,345 Q130,349 135,345 M165,345 Q170,349 175,345" fill="none" stroke="rgba(40,28,20,0.16)" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M${(125 + (lx - 125) * 0.49 + 3).toFixed(1)},220 q3,2 5,0 M${(175 + (rx - 175) * 0.49 - 8).toFixed(1)},220 q3,2 5,0" fill="none" stroke="rgba(40,28,20,0.13)" stroke-width="1" stroke-linecap="round"/>`;
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
  { id: 'y2k', label: 'Y2K', emoji: '💿' },
  { id: 'goddess', label: 'Goddess', emoji: '🏛️' },
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
  { id: 'flippy-bob', label: 'Flippy Bob', emoji: '💁‍♀️', theme: 'y2k',
    svg: `<path d="M98,80 A58,58 0 0 1 202,80 Z"/>
          <path d="M98,78 L112,78 L112,128 Q104,140 84,138 Q96,130 98,118 Z"/>
          <path d="M202,78 L188,78 L188,128 Q196,140 216,138 Q204,130 202,118 Z"/>
          <path d="M140,40 L150,52 L160,40" fill="none" stroke="#000000" stroke-width="1.4" opacity="0.25"/>
          <path d="M112,62 Q126,53 140,58" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25"/>` },
  { id: 'spiky', label: 'Spiky', emoji: '⚡',
    svg: `<path d="M100,84 L98,62 L108,66 L110,42 L124,56 L132,32 L144,52 L154,28 L162,50 L176,34 L178,58 L194,46 L190,66 L202,62 L200,84 A50,40 0 0 0 100,84 Z"/>
          <path d="M120,60 Q132,52 144,56" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.25"/>` },
  { id: 'buzz', label: 'Buzz Cut', emoji: '🪒',
    svg: `<path d="M103,86 A47,47 0 0 1 197,86 Q194,74 186,66 Q150,48 114,66 Q106,74 103,86 Z" opacity="0.92"/>
          <path d="M104,84 A47,47 0 0 1 196,84" fill="none" stroke="#000000" stroke-width="1" opacity="0.15" stroke-dasharray="1 3"/>` },
  { id: 'side-part', label: 'Side Part', emoji: '🧑',
    svg: `<path d="M100,80 A52,52 0 0 1 200,80 L198,92 Q190,72 168,64 Q150,60 136,66 Q116,74 104,92 Z"/>
          <path d="M128,46 Q150,44 172,54 Q186,62 194,76" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.25"/>
          <path d="M124,46 L130,64" stroke="#000000" stroke-width="1.6" opacity="0.25"/>` },
  { id: 'curly-top', label: 'Curly Top', emoji: '🌀',
    svg: `<path d="M104,84 A46,40 0 0 1 196,84 Z"/>
          ${[[112, 62, 12], [126, 50, 13], [142, 44, 13], [158, 44, 13], [174, 50, 13], [188, 62, 12], [118, 74, 10], [182, 74, 10], [134, 58, 11], [166, 58, 11], [150, 54, 11]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}
          <circle cx="140" cy="40" r="3" fill="#ffffff" opacity="0.25"/>` },
  { id: 'goddess-waves', label: 'Goddess Waves', emoji: '🏛️', theme: 'goddess',
    svg: `<path d="M96,82 A60,60 0 0 1 204,82 Z"/>
          ${['left', 'right'].map((side) => {
            const m = (x) => (side === 'left' ? x : 300 - x);
            return `<g class="hair-sway hair-sway-${side}"><path d="M${m(116)},80 Q${m(122)},126 ${m(112)},168 Q${m(104)},208 ${m(114)},248 Q${m(112)},272 ${m(98)},280 Q${m(84)},252 ${m(94)},212 Q${m(100)},172 ${m(88)},132 Q${m(84)},102 ${m(92)},80 Z"/>
              <path d="M${m(102)},120 Q${m(108)},160 ${m(98)},200 Q${m(92)},236 ${m(102)},262" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.18" stroke-linecap="round"/></g>`;
          }).join('')}
          ${Array.from({ length: 11 }, (_, i) => {
            const t = i / 10, x = (1 - t) * (1 - t) * 102 + 2 * t * (1 - t) * 150 + t * t * 198, y = (1 - t) * (1 - t) * 74 + 2 * t * (1 - t) * 26 + t * t * 74;
            return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="4" stroke="#000000" stroke-opacity="0.25" stroke-width="0.8" transform="rotate(${(i % 2 ? 30 : -30) + (t - 0.5) * 80} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
          }).join('')}
          ${[[118, 58], [150, 50], [182, 58]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="1.6" fill="#f2c94c" stroke="none" transform="rotate(${x < 150 ? -25 : x > 150 ? 25 : 0} ${x} ${y})"/>`).join('')}
          <path d="M112,64 Q126,55 140,60" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.25"/>` },
  // ----- Hairstyles with hair you can see behind the head and shoulders (backSvg) -----
  { id: 'straight', label: 'Long Straight', emoji: '💁‍♀️',
    backSvg: `<path d="M94,92 Q90,36 150,33 Q210,36 206,92 L210,252 Q150,260 90,252 Z"/>
          <path d="M94,92 Q90,36 150,33 Q210,36 206,92 L210,252 Q150,260 90,252 Z" fill="#000000" opacity="0.16" stroke="none"/>
          ${[100, 112, 188, 200].map((x) => `<line x1="${x}" y1="120" x2="${x + (x < 150 ? -2 : 2)}" y2="248" stroke="#000000" stroke-width="1" opacity="0.15"/>`).join('')}`,
    svg: `<path d="M97,100 Q94,38 150,36 Q206,38 203,100 Q196,76 176,64 Q160,58 150,58 Q140,58 124,64 Q104,76 97,100 Z"/>
          <path d="M150,38 L150,58" stroke="#000000" stroke-width="1.2" opacity="0.3"/>
          <path d="M97,84 Q93,150 98,210 L119,210 Q113,150 116,100 Q112,86 104,80 Z"/>
          <path d="M203,84 Q207,150 202,210 L181,210 Q187,150 184,100 Q188,86 196,80 Z"/>
          <path d="M103,110 Q101,160 104,204 M197,110 Q199,160 196,204" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.2" stroke-linecap="round"/>
          <path d="M112,58 Q126,47 144,46" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.28"/>` },
  { id: 'lob', label: 'Straight Lob', emoji: '👩',
    backSvg: `<path d="M96,92 Q92,38 150,35 Q208,38 204,92 L206,170 Q150,178 94,170 Z"/>
          <path d="M96,92 Q92,38 150,35 Q208,38 204,92 L206,170 Q150,178 94,170 Z" fill="#000000" opacity="0.16" stroke="none"/>`,
    svg: `<path d="M97,100 Q94,38 150,36 Q206,38 203,100 Q194,74 170,62 Q150,56 132,58 Q110,68 97,100 Z"/>
          <path d="M132,39 L132,58" stroke="#000000" stroke-width="1.2" opacity="0.3"/>
          <path d="M97,84 Q94,130 96,166 L120,160 Q113,130 116,100 Q112,86 104,80 Z"/>
          <path d="M203,84 Q206,130 204,166 L180,160 Q187,130 184,100 Q188,86 196,80 Z"/>
          <path d="M104,112 Q102,140 104,160 M196,112 Q198,140 196,160" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.2" stroke-linecap="round"/>
          <path d="M140,46 Q160,44 180,54" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.28"/>` },
  { id: 'butterfly', label: 'Butterfly Layers', emoji: '🦋',
    backSvg: `<path d="M94,92 Q90,36 150,33 Q210,36 206,92 L210,236 Q200,250 188,240 Q176,254 162,244 Q150,256 138,244 Q124,254 112,240 Q100,250 90,236 Z"/>
          <path d="M94,92 Q90,36 150,33 Q210,36 206,92 L210,236 Q200,250 188,240 Q176,254 162,244 Q150,256 138,244 Q124,254 112,240 Q100,250 90,236 Z" fill="#000000" opacity="0.16" stroke="none"/>`,
    svg: `<path d="M97,100 Q94,38 150,36 Q206,38 203,100 Q196,76 176,64 Q160,58 150,58 Q140,58 124,64 Q104,76 97,100 Z"/>
          <path d="M150,58 Q132,62 124,80 Q118,96 120,104 Q112,92 110,80 Q118,62 150,56 Z"/>
          <path d="M150,58 Q168,62 176,80 Q182,96 180,104 Q188,92 190,80 Q182,62 150,56 Z"/>
          <path d="M97,84 Q92,130 100,160 Q94,176 100,196 Q88,206 84,202 Q96,214 116,206 Q110,186 116,170 Q110,140 116,100 Q112,86 104,80 Z"/>
          <path d="M203,84 Q208,130 200,160 Q206,176 200,196 Q212,206 216,202 Q204,214 184,206 Q190,186 184,170 Q190,140 184,100 Q188,86 196,80 Z"/>
          <path d="M104,120 Q102,150 106,170 M196,120 Q198,150 194,170" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.2" stroke-linecap="round"/>
          <path d="M112,58 Q126,47 144,46" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.28"/>` },
  { id: 'afro', label: 'Big Afro', emoji: '🌀',
    backSvg: `<path stroke="none" d="M80,78 a70,70 0 1,0 140,0 a70,70 0 1,0 -140,0 ${Array.from({ length: 22 }, (_, i) => { const a = i / 22 * Math.PI * 2, x = 150 + 66 * Math.cos(a), y = 78 + 64 * Math.sin(a); return `M${(x - 11).toFixed(1)},${y.toFixed(1)} a11,11 0 1,0 22,0 a11,11 0 1,0 -22,0`; }).join(' ')}"/>
          ${Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2 + 0.2; return `<circle cx="${(150 + 56 * Math.cos(a)).toFixed(1)}" cy="${(78 + 54 * Math.sin(a)).toFixed(1)}" r="3" fill="#000000" opacity="0.12" stroke="none"/>`; }).join('')}`,
    svg: `<path d="M100,96 Q96,44 150,40 Q204,44 200,96 Q196,74 180,64 Q150,54 120,64 Q104,74 100,96 Z"/>
          <path stroke="none" d="${[[108, 70], [118, 58], [132, 52], [150, 50], [168, 52], [182, 58], [192, 70]].map(([x, y]) => `M${x - 8},${y} a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0`).join(' ')}"/>
          ${[[122, 50], [146, 44], [170, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#ffffff" opacity="0.2" stroke="none"/>`).join('')}` },
  { id: 'pixie', label: 'Pixie Cut', emoji: '🧚',
    backSvg: `<path d="M102,96 Q100,44 150,40 Q200,44 198,96 L196,122 Q150,128 104,122 Z"/>`,
    svg: `<path d="M100,98 Q96,42 150,40 Q204,42 200,98 Q196,80 186,70 Q160,58 128,72 Q112,80 104,98 Z"/>
          <path d="M116,74 Q138,52 182,62 Q160,66 140,76 Q124,84 112,88 Z"/>
          <path d="M100,92 L104,110 L108,96 M200,92 L196,110 L192,96" stroke-width="1"/>
          <path d="M130,50 Q150,44 172,50" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.28"/>` },
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

// Long pants on both legs (fill=null takes the outfit colour).
function pantsSVG(bt, fill, bottomY = 430, extra = 4) {
  const rUpper = bt.limbWidth / 2 * 1.15 + extra;
  const rLower = bt.limbWidth / 2 * 0.68 * 0.9 + extra;
  const f = fill ? ` fill="${fill}"` : '';
  return `<path d="${capsulePath(133, 248, rUpper, 127, bottomY, rLower)}"${f}/>
          <path d="${capsulePath(167, 248, rUpper, 173, bottomY, rLower)}"${f}/>
          <rect x="${150 - bt.hipHalf - 2}" y="236" width="${(bt.hipHalf + 2) * 2}" height="24" rx="6"${f}/>`;
}

// Shorts down to hemY.
function shortsSVG(bt, fill, hemY = 310) {
  const cx = 150, h = bt.hipHalf + 6;
  const f = fill ? ` fill="${fill}"` : '';
  return `<path d="M${cx - h},230 L${cx + h},230 L${cx + h + 6},${hemY} L${cx + 4},${hemY} L${cx},262 L${cx - 4},${hemY} L${cx - h - 6},${hemY} Z"${f}/>`;
}

// A sleeveless top (tank / jersey).
function tankSVG(bt, hemY, fill) {
  const cx = 150, { shoulder: sY, chest: bY, waist: wY } = TORSO_Y;
  const s2 = bt.shoulderHalf - 4, c = bt.chestHalf + 3, w = bt.waistHalf + 4, hw = torsoHalfAt(bt, hemY) + 4;
  const f = fill ? ` fill="${fill}"` : '';
  return `<path d="M${cx - s2},${sY - 2} L${cx - 14},${sY - 2} Q${cx},${sY + 18} ${cx + 14},${sY - 2} L${cx + s2},${sY - 2}
            Q${cx + c},${bY - 12} ${cx + c},${bY} C${cx + c},${bY + 16} ${cx + w},${wY - 14} ${cx + w},${wY}
            L${cx + hw},${hemY} L${cx - hw},${hemY} L${cx - w},${wY}
            C${cx - w},${wY - 14} ${cx - c},${bY + 16} ${cx - c},${bY} Q${cx - c},${bY - 12} ${cx - s2},${sY - 2} Z"${f}/>`;
}

function basicsSVG(bt, top, bottom) {
  const cx = 150;
  return `${bottom ? `${shortsSVG(bt, '#2b2b2b', 296)}
      <rect x="${cx - bt.hipHalf - 6}" y="228" width="${(bt.hipHalf + 6) * 2}" height="6" fill="#444444"/>` : ''}
    ${top ? `${fittedTopSVG(bt, 240, '#2b2b2b')}
      <path d="M${cx - 12},${TORSO_Y.shoulder} Q${cx},${TORSO_Y.shoulder + 12} ${cx + 12},${TORSO_Y.shoulder}" fill="none" stroke="#555555" stroke-width="2"/>` : ''}`;
}

// ----- Dress & skirt building blocks -----
// A fitted bodice from the shoulders (or straps) down to endY.
function bodiceSVG(bt, endY, style = 'cap') {
  const cx = 150, { shoulder: sY, chest: bY } = TORSO_Y;
  const e = torsoHalfAt(bt, endY) + 4, c = bt.chestHalf + 3;
  if (style === 'straps') {
    const topY = sY + 16, t = torsoHalfAt(bt, topY) + 3, sx = bt.shoulderHalf - 10;
    return `<path d="M${cx - sx - 3},${sY} L${cx - sx + 3},${sY} L${cx - t + 10},${topY + 2} L${cx - t + 4},${topY + 2} Z M${cx + sx + 3},${sY} L${cx + sx - 3},${sY} L${cx + t - 10},${topY + 2} L${cx + t - 4},${topY + 2} Z"/>
      <path d="M${cx - t},${topY} Q${cx},${topY + 6} ${cx + t},${topY} C${cx + c},${bY} ${cx + c},${bY + 6} ${cx + c},${bY + 4} L${cx + e},${endY} L${cx - e},${endY} L${cx - c},${bY + 4} C${cx - c},${bY + 6} ${cx - c},${bY} ${cx - t},${topY} Z"/>`;
  }
  const s2 = bt.shoulderHalf + 2;
  return `<path d="M${cx - s2},${sY} L${cx + s2},${sY} C${cx + s2},${sY + 14} ${cx + c},${bY - 10} ${cx + c},${bY} L${cx + e},${endY} L${cx - e},${endY} L${cx - c},${bY} C${cx - c},${bY - 10} ${cx - s2},${sY + 14} ${cx - s2},${sY} Z"/>
    ${style === 'cap' ? `<ellipse cx="${cx - s2 - 2}" cy="${sY + 8}" rx="11" ry="9"/><ellipse cx="${cx + s2 + 2}" cy="${sY + 8}" rx="11" ry="9"/>` : ''}`;
}

// A skirt from topY (half-width topHalf) down to hemY (half-width hemHalf).
// hem: 'straight' | 'scallop' | 'wave' | 'round'
function skirtShapeSVG(topY, topHalf, hemY, hemHalf, hem = 'straight', flare = 0.5) {
  const cx = 150;
  let bottom = ` Q${cx},${hemY + 10} ${cx - hemHalf},${hemY}`;
  if (hem === 'scallop' || hem === 'wave') {
    const n = hem === 'scallop' ? 9 : 7, step = (hemHalf * 2) / n;
    bottom = '';
    for (let k = 0; k < n; k++) { const x0 = cx + hemHalf - step * k; bottom += ` Q${(x0 - step / 2).toFixed(1)},${hemY + (hem === 'scallop' ? 10 : (k % 2 ? 4 : 12))} ${(x0 - step).toFixed(1)},${hemY}`; }
  }
  if (hem === 'round') bottom = ` Q${cx + hemHalf},${hemY + 22} ${cx},${hemY + 20} Q${cx - hemHalf},${hemY + 22} ${cx - hemHalf},${hemY}`;
  const midY = topY + (hemY - topY) * 0.45;
  const midHalf = topHalf + (hemHalf - topHalf) * flare;
  return `<path d="M${cx - topHalf},${topY} L${cx + topHalf},${topY} Q${cx + midHalf},${midY} ${cx + hemHalf},${hemY}${bottom} Q${cx - midHalf},${midY} ${cx - topHalf},${topY} Z"/>`;
}

function shineSVG(x1, y1, x2, y2) {
  return `<path d="M${x1},${y1} L${x2},${y2}" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.15" stroke-linecap="round"/>`;
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
      const legL = capsulePath(133, 248, rUpper, 127, 412, rLower);
      const legR = capsulePath(167, 248, rUpper, 173, 412, rLower);
      const moon = (x, y) => `<path d="M${x + 3},${y - 4} A4.5,4.5 0 1 0 ${x + 3},${y + 4} A3.4,3.4 0 1 1 ${x + 3},${y - 4} Z" fill="#fff7d6" opacity="0.9"/>`;
      const star = (x, y) => `<path d="M${x},${y - 3} L${x + 0.9},${y - 0.9} L${x + 3},${y} L${x + 0.9},${y + 0.9} L${x},${y + 3} L${x - 0.9},${y + 0.9} L${x - 3},${y} L${x - 0.9},${y - 0.9} Z" fill="#ffffff" opacity="0.9"/>`;
      return `<path d="${legL}"/><path d="${legR}"/>
              <rect x="${127 - rLower - 1}" y="${404}" width="${rLower * 2 + 2}" height="8" rx="3" fill="#ffffff"/>
              <rect x="${173 - rLower - 1}" y="${404}" width="${rLower * 2 + 2}" height="8" rx="3" fill="#ffffff"/>
              ${moon(126, 300)}${star(134, 350)}${moon(170, 330)}${star(166, 386)}${star(124, 392)}${moon(176, 280)}
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
  { id: 'butterfly-flares', label: 'Butterfly Top & Flares', emoji: '🦋', theme: 'y2k',
    svg: (bt) => {
      const cx = 150, h = bt.hipHalf + 6;
      const leg = (d) => {
        const outer = cx + d * h, inner = cx + d * 2;
        return `<path d="M${outer},230 L${inner},230 L${inner},262 L${cx + d * 4},360 L${cx + d * 2},446 L${cx + d * (h + 22)},446 L${cx + d * (h + 4)},360 Z" fill="#7aa3d9" stroke="#4f78b0" stroke-width="1.4"/>
          <path d="M${cx + d * (h - 2)},250 L${cx + d * (h + 14)},440" stroke="#ffffff" stroke-width="1" stroke-dasharray="2 4" opacity="0.8"/>
          ${[300, 330, 360].map((y, i) => `<circle cx="${cx + d * (h - 6 + i * 3)}" cy="${y}" r="1.8" fill="#ffffff"/>`).join('')}`;
      };
      const tw = torsoHalfAt(bt, 186) + 3, bw = torsoHalfAt(bt, 226) + 3;
      return `${leg(-1)}${leg(1)}
              <rect x="${cx - h}" y="224" width="${h * 2}" height="9" fill="#5a85c0"/>
              <path d="M${cx - h + 4},228 L${cx + h - 4},228" stroke="#d6dbe2" stroke-width="2" stroke-dasharray="3 2"/>
              <path d="M${cx - 10},150 L${cx - tw},186 L${cx - bw},226 L${cx + bw},226 L${cx + tw},186 L${cx + 10},150 Z"/>
              <path d="M${cx - 10},150 L${cx - 22},146 M${cx + 10},150 L${cx + 22},146" stroke="#ffffff" stroke-width="2"/>
              <g transform="translate(${cx},200)">
                <path d="M0,0 C-14,-16 -22,-6 -14,2 C-22,8 -14,18 0,6 Z M0,0 C14,-16 22,-6 14,2 C22,8 14,18 0,6 Z" fill="#ffffff" opacity="0.9"/>
                <rect x="-1.2" y="-6" width="2.4" height="14" rx="1.2" fill="#2b2b2b"/>
                <circle cx="-10" cy="-4" r="1.8" fill="#ff6fb0"/><circle cx="10" cy="-4" r="1.8" fill="#ff6fb0"/>
              </g>`;
    } },
  { id: 'chrome-dress', label: 'Chrome Mini Dress', emoji: '🪩', theme: 'y2k', fixedColor: true,
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder, wY = TORSO_Y.waist;
      const w = bt.waistHalf + 4, hemY = 300, hemHalf = bt.hipHalf + 24;
      const top = `M${cx - torsoHalfAt(bt, sY + 18) - 3},${sY + 18} L${cx + torsoHalfAt(bt, sY + 18) + 3},${sY + 18} L${cx + w},${wY} L${cx + hemHalf},${hemY} Q${cx},${hemY + 8} ${cx - hemHalf},${hemY} L${cx - w},${wY} Z`;
      const bands = ['#e8eef6', '#c9d4e2', '#f6f9ff', '#b6c2d4', '#eef3fa'];
      return `<path d="${top}" fill="#dfe6ee"/>
              ${bands.map((c, i) => `<path d="M${cx - hemHalf + i * 2},${180 + i * 24} Q${cx},${170 + i * 24} ${cx + hemHalf - i * 2},${186 + i * 24}" fill="none" stroke="${c}" stroke-width="10" opacity="0.8"/>`).join('')}
              <path d="${top}" fill="none" stroke="#9aa6b8" stroke-width="1.5"/>
              <path d="M${cx - w + 6},${wY - 30} L${cx - hemHalf + 14},${hemY - 10}" stroke="#ffffff" stroke-width="6" opacity="0.6" stroke-linecap="round"/>
              <path d="M${cx - torsoHalfAt(bt, sY + 18) + 4},${sY + 18} L${cx - 20},${sY - 2} M${cx + torsoHalfAt(bt, sY + 18) - 4},${sY + 18} L${cx + 20},${sY - 2}" stroke="#c9d4e2" stroke-width="3"/>
              ${[[-18, 200], [16, 230], [-8, 262], [22, 280], [-26, 282]].map(([x, y]) => `<path d="M${cx + x},${y - 4} L${cx + x + 1.2},${y - 1.2} L${cx + x + 4},${y} L${cx + x + 1.2},${y + 1.2} L${cx + x},${y + 4} L${cx + x - 1.2},${y + 1.2} L${cx + x - 4},${y} L${cx + x - 1.2},${y - 1.2} Z" fill="#ffffff"/>`).join('')}`;
    } },
  { id: 'denim-skirt-tee', label: 'Baby Tee & Denim Skirt', emoji: '👚', theme: 'y2k',
    svg: (bt) => {
      const cx = 150, wY = TORSO_Y.waist;
      const tw = bt.waistHalf + 6, hw = bt.hipHalf + 20, hemY = 296;
      return `<path d="M${cx - tw},${wY + 6} L${cx + tw},${wY + 6} L${cx + hw},${hemY} L${cx - hw},${hemY} Z" fill="#6b93cf" stroke="#4f78b0" stroke-width="1.4"/>
              <path d="M${cx - hw + 3},${hemY - 4} L${cx + hw - 3},${hemY - 4}" stroke="#ffffff" stroke-width="1" stroke-dasharray="3 3" opacity="0.8"/>
              <path d="M${cx},${wY + 8} L${cx},${hemY - 6}" stroke="#4f78b0" stroke-width="1.2"/>
              <path d="M${cx - 30},${wY + 50} l6,-6 l6,6 l-6,6 Z" fill="#ff6fb0"/>
              <path d="M${cx + 24},${wY + 64} l2.4,5 l5.4,0.6 l-4,3.6 l1.2,5.4 l-5,-2.8 l-5,2.8 l1.2,-5.4 l-4,-3.6 l5.4,-0.6 Z" fill="#f2c94c"/>
              ${fittedTopSVG(bt, wY + 10, null)}
              <path d="M${cx - 12},${TORSO_Y.shoulder} Q${cx},${TORSO_Y.shoulder + 12} ${cx + 12},${TORSO_Y.shoulder}" fill="none" stroke="#ffffff" stroke-width="3"/>
              <text x="${cx}" y="${TORSO_Y.chest + 8}" font-size="13" font-weight="800" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif">✿ cutie ✿</text>`;
    } },
  { id: 'hoodie-joggers', label: 'Hoodie & Joggers', emoji: '🧥',
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder;
      return `${pantsSVG(bt, '#8a8f9c', 432, 5)}
              <rect x="${127 - 11}" y="424" width="22" height="9" rx="4" fill="#6f7482"/><rect x="${173 - 11}" y="424" width="22" height="9" rx="4" fill="#6f7482"/>
              ${fittedTopSVG(bt, 256, null)}
              <path d="M${cx - 36},${sY + 8} Q${cx - 34},${sY - 8} ${cx - 16},${sY - 6} Q${cx},${sY + 10} ${cx + 16},${sY - 6} Q${cx + 34},${sY - 8} ${cx + 36},${sY + 8} Q${cx},${sY + 22} ${cx - 36},${sY + 8} Z"/>
              <path d="M${cx - 30},${sY + 6} Q${cx},${sY + 18} ${cx + 30},${sY + 6}" fill="none" stroke="#000000" stroke-width="1.5" opacity="0.2"/>
              <rect x="${cx - torsoHalfAt(bt, 250) - 4}" y="248" width="${(torsoHalfAt(bt, 250) + 4) * 2}" height="8" fill="#000000" opacity="0.15"/>
              <path d="M${cx - 30},214 L${cx + 30},214 L${cx + 26},242 L${cx - 26},242 Z" fill="#000000" opacity="0.12"/>
              <path d="M${cx - 6},${sY + 4} L${cx - 8},${sY + 34} M${cx + 6},${sY + 4} L${cx + 8},${sY + 34}" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
              <circle cx="${cx - 8}" cy="${sY + 36}" r="2.2" fill="#ffffff"/><circle cx="${cx + 8}" cy="${sY + 36}" r="2.2" fill="#ffffff"/>`;
    } },
  { id: 'varsity-jacket', label: 'Varsity Jacket & Jeans', emoji: '🏈',
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder;
      const hw = torsoHalfAt(bt, 246) + 5;
      const side = (d) => {
        const sh = bt.shoulderHalf + 4;
        return `<path d="M${cx + d * 12},${sY} L${cx + d * sh},${sY} C${cx + d * (sh + 2)},${sY + 30} ${cx + d * (bt.chestHalf + 6)},${sY + 40} ${cx + d * (bt.waistHalf + 6)},${TORSO_Y.waist}
                L${cx + d * hw},246 L${cx + d * 14},246 L${cx + d * 14},${sY + 30} Z"/>`;
      };
      return `${pantsSVG(bt, '#4f6fa0', 432, 4)}
              <line x1="133" y1="262" x2="128" y2="428" stroke="#3a5684" stroke-width="1"/><line x1="167" y1="262" x2="172" y2="428" stroke="#3a5684" stroke-width="1"/>
              ${fittedTopSVG(bt, 244, '#ffffff')}
              ${side(-1)}${side(1)}
              <ellipse cx="${cx - bt.shoulderHalf - 4}" cy="${sY + 12}" rx="12" ry="14" fill="#f4f4f4"/>
              <ellipse cx="${cx + bt.shoulderHalf + 4}" cy="${sY + 12}" rx="12" ry="14" fill="#f4f4f4"/>
              <rect x="${cx - hw}" y="238" width="${hw * 2}" height="10" fill="#ffffff"/>
              <path d="M${cx - hw},241 L${cx + hw},241 M${cx - hw},245 L${cx + hw},245" stroke="#2b2b2b" stroke-width="1" opacity="0.5"/>
              <path d="M${cx - 14},${sY} L${cx - 22},${sY + 6} M${cx + 14},${sY} L${cx + 22},${sY + 6}" stroke="#ffffff" stroke-width="4"/>
              ${[196, 212, 228].map((y) => `<circle cx="${cx - 16}" cy="${y}" r="2" fill="#f4f4f4"/>`).join('')}
              <circle cx="${cx - bt.chestHalf + 12}" cy="${TORSO_Y.chest + 8}" r="11" fill="#ffffff"/>
              <text x="${cx - bt.chestHalf + 12}" y="${TORSO_Y.chest + 14}" font-size="16" font-weight="900" text-anchor="middle" fill="#c0392b" font-family="Georgia, serif">S</text>`;
    } },
  { id: 'flannel-chinos', label: 'Flannel & Chinos', emoji: '🪵', fixedColor: true,
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder;
      let plaid = '';
      for (let y = sY + 10; y < 248; y += 14) {
        const half = torsoHalfAt(bt, y) + 3;
        plaid += `<line x1="${cx - half}" y1="${y}" x2="${cx + half}" y2="${y}" stroke="#2b2b2b" stroke-width="3" opacity="0.35"/>`;
      }
      for (let x = -40; x <= 40; x += 14) plaid += `<line x1="${cx + x}" y1="${sY + 2}" x2="${cx + x}" y2="248" stroke="#2b2b2b" stroke-width="3" opacity="0.3"/>`;
      return `${pantsSVG(bt, '#c9a874', 432, 4)}
              <line x1="133" y1="262" x2="128" y2="428" stroke="#a8895a" stroke-width="1"/><line x1="167" y1="262" x2="172" y2="428" stroke="#a8895a" stroke-width="1"/>
              ${fittedTopSVG(bt, 250, '#c0392b')}
              <g clip-path="none">${plaid}</g>
              ${fittedTopSVG(bt, 250, 'none').replace(/fill="none"/g, 'fill="none" stroke="#8e2a20" stroke-width="2"')}
              <path d="M${cx - 16},${sY - 2} L${cx},${sY + 10} L${cx - 4},${sY + 18} Z M${cx + 16},${sY - 2} L${cx},${sY + 10} L${cx + 4},${sY + 18} Z" fill="#a83228"/>
              ${[176, 194, 212, 230].map((y) => `<circle cx="${cx}" cy="${y}" r="2" fill="#f4e3c0"/>`).join('')}
              <rect x="${cx - bt.hipHalf - 2}" y="236" width="${(bt.hipHalf + 2) * 2}" height="7" fill="#7a5230"/>
              <rect x="${cx - 5}" y="235" width="10" height="9" rx="1.5" fill="#d6b45a"/>`;
    } },
  { id: 'jersey-shorts', label: 'Basketball Jersey', emoji: '🏀',
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder;
      return `${shortsSVG(bt, null, 314)}
              <path d="M${cx - bt.hipHalf - 8},236 L${cx - bt.hipHalf - 12},312 M${cx + bt.hipHalf + 8},236 L${cx + bt.hipHalf + 12},312" stroke="#ffffff" stroke-width="5"/>
              <rect x="${cx - bt.hipHalf - 6}" y="228" width="${(bt.hipHalf + 6) * 2}" height="8" fill="#ffffff" opacity="0.9"/>
              ${tankSVG(bt, 244, null)}
              <path d="M${cx - 14},${sY - 2} Q${cx},${sY + 18} ${cx + 14},${sY - 2}" fill="none" stroke="#ffffff" stroke-width="4"/>
              <text x="${cx}" y="${TORSO_Y.chest + 30}" font-size="34" font-weight="900" text-anchor="middle" fill="#ffffff" stroke="#2b2b2b" stroke-width="1.2" font-family="Arial Black, Arial, sans-serif">8</text>
              <rect x="${127 - 10}" y="392" width="20" height="34" rx="6" fill="#ffffff"/><rect x="${173 - 10}" y="392" width="20" height="34" rx="6" fill="#ffffff"/>
              <path d="M${127 - 10},398 L${127 + 10},398 M${173 - 10},398 L${173 + 10},398" stroke="#e05c5c" stroke-width="2"/>`;
    } },
  { id: 'overalls', label: 'Overalls & Tee', emoji: '👖',
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder;
      const bw = bt.waistHalf - 2;
      return `${pantsSVG(bt, '#5b86c4', 428, 5)}
              <rect x="${127 - 13}" y="418" width="26" height="10" rx="3" fill="#7aa3d9"/><rect x="${173 - 13}" y="418" width="26" height="10" rx="3" fill="#7aa3d9"/>
              ${fittedTopSVG(bt, 240, null)}
              <path d="M${cx - bw},190 L${cx + bw},190 L${cx + bt.waistHalf + 4},236 L${cx - bt.waistHalf - 4},236 Z" fill="#5b86c4" stroke="#3d6199" stroke-width="1.2"/>
              <rect x="${cx - 14}" y="198" width="28" height="18" rx="3" fill="#4f78b0" stroke="#3d6199" stroke-width="1"/>
              <path d="M${cx - bw + 4},192 L${cx - bt.shoulderHalf + 8},${sY} M${cx + bw - 4},192 L${cx + bt.shoulderHalf - 8},${sY}" stroke="#5b86c4" stroke-width="7"/>
              <circle cx="${cx - bw + 5}" cy="194" r="3.2" fill="#f2c94c"/><circle cx="${cx + bw - 5}" cy="194" r="3.2" fill="#f2c94c"/>
              <path d="M${cx - bw},236 L${cx + bw},236" stroke="#f2c94c" stroke-width="1" stroke-dasharray="3 3"/>`;
    } },
  { id: 'graphic-tee-cargo', label: 'Dino Tee & Cargo Shorts', emoji: '🦖',
    svg: (bt) => {
      const cx = 150, h = bt.hipHalf + 6;
      return `${shortsSVG(bt, '#b5a27a', 318)}
              <rect x="${cx - h - 2}" y="270" width="18" height="22" rx="3" fill="#a3906a" stroke="#8f7c58" stroke-width="1"/>
              <rect x="${cx + h - 16}" y="270" width="18" height="22" rx="3" fill="#a3906a" stroke="#8f7c58" stroke-width="1"/>
              ${fittedTopSVG(bt, 240, null)}
              <path d="M${cx - 12},${TORSO_Y.shoulder} Q${cx},${TORSO_Y.shoulder + 12} ${cx + 12},${TORSO_Y.shoulder}" fill="none" stroke="#000000" stroke-width="1.5" opacity="0.18"/>
              <circle cx="${cx}" cy="${TORSO_Y.chest + 14}" r="19" fill="#ffffff" opacity="0.9"/>
              <text x="${cx}" y="${TORSO_Y.chest + 25}" font-size="26" text-anchor="middle">🦖</text>`;
    } },
  { id: 'low-rise-jeans', label: 'Low-Rise Y2K Jeans', emoji: '👖', theme: 'y2k',
    svg: (bt) => {
      const cx = 150, h = bt.hipHalf + 6;
      const leg = (d) => {
        const outer = cx + d * h, inner = cx + d * 2;
        return `<path d="M${outer},244 L${inner},244 L${inner},268 L${cx + d * 4},360 L${cx + d * 2},446 L${cx + d * (h + 20)},446 L${cx + d * (h + 3)},360 Z" fill="#9cc0ea" stroke="#6f97c8" stroke-width="1.4"/>
          <path d="M${cx + d * (h - 4)},262 L${cx + d * (h + 12)},440" stroke="#ffffff" stroke-width="1" stroke-dasharray="2 4" opacity="0.8"/>
          <path d="M${cx + d * 8},330 Q${cx + d * 18},336 ${cx + d * 28},330" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.5"/>
          <path d="M${cx + d * (h - 22)},282 l3,4 l-3,4 l-3,-4 Z" fill="#ffffff"/>`;
      };
      return `${leg(-1)}${leg(1)}
              <rect x="${cx - h}" y="240" width="${h * 2}" height="9" fill="#86ade0" stroke="#6f97c8" stroke-width="1"/>
              ${fittedTopSVG(bt, 244, null)}
              <path d="M${cx - h + 2},252 Q${cx},266 ${cx + h - 2},252" fill="none" stroke="#d6dbe2" stroke-width="2.4" stroke-dasharray="4 2"/>
              <path d="M${cx - 6},${TORSO_Y.chest + 2} l6,-8 l6,8 l-6,8 Z" fill="#ffffff" opacity="0.9"/>
              <path d="M${cx - 12},${TORSO_Y.shoulder} Q${cx},${TORSO_Y.shoulder + 12} ${cx + 12},${TORSO_Y.shoulder}" fill="none" stroke="#ffffff" stroke-width="3"/>`;
    } },
  { id: 'striped-shirt', label: 'Striped Shirt & Jeans', emoji: '🦓',
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder;
      let stripes = '';
      for (let y = sY + 8; y < 246; y += 12) {
        const half = torsoHalfAt(bt, Math.min(y + 3, 250)) + 4;
        stripes += `<rect x="${cx - half}" y="${y}" width="${half * 2}" height="5" rx="1"/>`;
      }
      const sleeve = (d) => `<rect x="${cx + d * (bt.shoulderHalf + 2) - 10}" y="${sY + 4}" width="20" height="4" rx="1"/><rect x="${cx + d * (bt.shoulderHalf + 2) - 10}" y="${sY + 14}" width="20" height="4" rx="1"/>`;
      return `${pantsSVG(bt, '#5b86c4', 432, 4)}
              <line x1="133" y1="262" x2="128" y2="428" stroke="#3d6199" stroke-width="1"/><line x1="167" y1="262" x2="172" y2="428" stroke="#3d6199" stroke-width="1"/>
              ${fittedTopSVG(bt, 250, '#ffffff')}
              ${stripes}${sleeve(-1)}${sleeve(1)}
              <path d="M${cx - 14},${sY} Q${cx},${sY + 12} ${cx + 14},${sY}" fill="none" stroke="#d6d6d6" stroke-width="2"/>
              <rect x="${cx - bt.hipHalf - 2}" y="244" width="${(bt.hipHalf + 2) * 2}" height="6" fill="#3d6199"/>`;
    } },
  // ----- Basics: a black top and black shorts that are always on underneath.
  // They never count toward the 3 pieces and only show where nothing covers them.
  { id: 'basics', label: 'Black Basics', emoji: '🖤', piece: 'base', fixedColor: true,
    svg: (bt) => basicsSVG(bt, true, true) },
  // ----- More dresses -----
  { id: 'sundress', label: 'Sundress', emoji: '🌻',
    svg: (bt) => {
      const wY = TORSO_Y.waist, w = bt.waistHalf + 4, hemHalf = bt.hipHalf + 42;
      const daisy = (x, y) => `<g>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${x}" cy="${y - 3.2}" rx="1.8" ry="3.2" fill="#ffffff" transform="rotate(${a} ${x} ${y})"/>`).join('')}<circle cx="${x}" cy="${y}" r="1.8" fill="#f2c94c"/></g>`;
      return `${skirtShapeSVG(wY, w, 326, hemHalf, 'straight', 0.6)}${bodiceSVG(bt, wY + 2, 'straps')}
        <rect x="${150 - w}" y="${wY - 3}" width="${w * 2}" height="6" fill="#ffffff" opacity="0.8"/>
        ${[[-30, 260], [20, 250], [-8, 290], [36, 300], [-46, 310], [6, 318], [-18, 186], [16, 200]].map(([x, y]) => daisy(150 + x, y)).join('')}
        ${shineSVG(150 - w + 4, wY + 10, 150 - hemHalf + 16, 316)}`;
    } },
  { id: 'wrap-dress', label: 'Wrap Dress', emoji: '🎀',
    svg: (bt) => {
      const sY = TORSO_Y.shoulder, wY = TORSO_Y.waist, w = bt.waistHalf + 4, hemHalf = bt.hipHalf + 28;
      return `${skirtShapeSVG(wY, w, 352, hemHalf, 'straight', 0.5)}${bodiceSVG(bt, wY + 2, 'cap')}
        <path d="M${150 - bt.shoulderHalf + 6},${sY + 2} L${150 + 8},${wY} M${150 + bt.shoulderHalf - 6},${sY + 2} L${150 - 4},${wY - 14}" stroke="#000000" stroke-width="1.6" opacity="0.2"/>
        <path d="M${150 + 8},${wY} L${150 + hemHalf - 30},350" stroke="#000000" stroke-width="1.6" opacity="0.2"/>
        <rect x="${150 - w}" y="${wY - 3}" width="${w * 2}" height="6" fill="#000000" opacity="0.15"/>
        <path d="M${150 + w - 4},${wY} q12,-8 18,2 q-8,8 -18,-2 Z M${150 + w - 4},${wY} l6,26 l5,-3 Z M${150 + w - 4},${wY} l14,22 l4,-4 Z" fill="#000000" opacity="0.18"/>
        ${shineSVG(150 - w + 4, wY + 10, 150 - hemHalf + 14, 340)}`;
    } },
  { id: 'babydoll-dress', label: 'Babydoll Dress', emoji: '🍼',
    svg: (bt) => {
      const bY = TORSO_Y.chest + 10, e = torsoHalfAt(bt, bY) + 4, hemHalf = bt.hipHalf + 46;
      return `${skirtShapeSVG(bY, e, 304, hemHalf, 'scallop', 0.7)}${bodiceSVG(bt, bY + 2, 'cap')}
        <rect x="${150 - e}" y="${bY - 2}" width="${e * 2}" height="6" fill="#ffffff" opacity="0.85"/>
        <path d="M150,${bY + 1} l-9,-6 l0,12 Z M150,${bY + 1} l9,-6 l0,12 Z" fill="#ffffff"/><circle cx="150" cy="${bY + 1}" r="2.6" fill="#ffffff"/>
        ${[-30, -12, 8, 26].map((x) => `<path d="M${150 + x},${bY + 10} Q${150 + x * 1.6},250 ${150 + x * 2.2},298" fill="none" stroke="#000000" stroke-width="1" opacity="0.12"/>`).join('')}`;
    } },
  { id: 'heart-dress', label: 'Heart Print Dress', emoji: '💕',
    svg: (bt) => {
      const wY = TORSO_Y.waist, w = bt.waistHalf + 4, hemHalf = bt.hipHalf + 40;
      const heart = (x, y) => `<path d="M${x},${y + 4} C${x - 6},${y} ${x - 5},${y - 4} ${x - 2},${y - 3.6} C${x - 1},${y - 3.4} ${x},${y - 2.4} ${x},${y - 1.6} C${x},${y - 2.4} ${x + 1},${y - 3.4} ${x + 2},${y - 3.6} C${x + 5},${y - 4} ${x + 6},${y} ${x},${y + 4} Z" fill="#ffffff" opacity="0.9"/>`;
      const spots = [];
      for (let y = 168, r = 0; y < 330; y += 18, r++) {
        const half = (y <= wY ? torsoHalfAt(bt, y) + 3 : w + (hemHalf - w) * ((y - wY) / (334 - wY))) - 8;
        for (let x = -half + (r % 2) * 9; x <= half; x += 18) spots.push(heart(150 + x, y));
      }
      return `${skirtShapeSVG(wY, w, 334, hemHalf, 'straight', 0.6)}${bodiceSVG(bt, wY + 2, 'cap')}${spots.join('')}
        <rect x="${150 - w}" y="${wY - 3}" width="${w * 2}" height="6" fill="#ffffff" opacity="0.9"/>`;
    } },
  { id: 'big-bow-dress', label: 'Big Bow Dress', emoji: '🎁',
    svg: (bt) => {
      const wY = TORSO_Y.waist, w = bt.waistHalf + 4, hemHalf = bt.hipHalf + 48;
      return `<g fill="#ffffff" opacity="0.85">${skirtShapeSVG(wY + 6, w + 4, 330, hemHalf + 6, 'scallop', 0.8)}</g>
        ${skirtShapeSVG(wY, w, 320, hemHalf, 'straight', 0.7)}${bodiceSVG(bt, wY + 2, 'straps')}
        <path d="M150,${wY} Q126,${wY - 26} 112,${wY - 8} Q120,${wY + 16} 150,${wY + 4} Z M150,${wY} Q174,${wY - 26} 188,${wY - 8} Q180,${wY + 16} 150,${wY + 4} Z" fill="#ffffff" stroke="#e7d6e0" stroke-width="1"/>
        <path d="M146,${wY + 4} L132,${wY + 40} L140,${wY + 38} Z M154,${wY + 4} L168,${wY + 40} L160,${wY + 38} Z" fill="#ffffff" stroke="#e7d6e0" stroke-width="1"/>
        <circle cx="150" cy="${wY + 2}" r="6" fill="#ffffff" stroke="#e7d6e0" stroke-width="1"/>
        ${shineSVG(150 - w + 4, wY + 16, 150 - hemHalf + 18, 312)}`;
    } },
  { id: 'floral-maxi', label: 'Floral Maxi Dress', emoji: '🌺',
    svg: (bt) => {
      const wY = TORSO_Y.waist, w = bt.waistHalf + 4, hemHalf = bt.hipHalf + 46;
      const flower = (x, y, c) => `<g>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos(a * Math.PI / 180) * 3.4).toFixed(1)}" cy="${(y + Math.sin(a * Math.PI / 180) * 3.4).toFixed(1)}" r="2.8" fill="${c}"/>`).join('')}<circle cx="${x}" cy="${y}" r="1.8" fill="#f2c94c"/></g>`;
      const cols = ['#ffffff', '#ffd6e8', '#fff7d6'];
      const fl = [];
      for (let y = 176, r = 0; y < 410; y += 26, r++) {
        const half = (y <= wY ? torsoHalfAt(bt, y) + 2 : w + (hemHalf - w) * ((y - wY) / (414 - wY))) - 8;
        for (let x = -half + (r % 2) * 12; x <= half; x += 24) fl.push(flower(150 + x, y, cols[(r + Math.round(x)) % 3 < 0 ? 0 : (r + Math.round(Math.abs(x))) % 3]));
      }
      return `${skirtShapeSVG(wY, w, 414, hemHalf, 'wave', 0.45)}${bodiceSVG(bt, wY + 2, 'straps')}${fl.join('')}
        <rect x="${150 - w}" y="${wY - 3}" width="${w * 2}" height="6" fill="#000000" opacity="0.12"/>`;
    } },
  { id: 'princess-gown', label: 'Princess Gown', emoji: '👸',
    svg: (bt) => {
      const wY = TORSO_Y.waist, w = bt.waistHalf + 4, hemHalf = bt.hipHalf + 74;
      const sparkles = [[-40, 280], [30, 300], [-10, 340], [50, 370], [-60, 390], [10, 400], [-20, 250], [40, 240], [0, 190], [-14, 176], [16, 210]]
        .map(([x, y]) => `<path d="M${150 + x},${y - 4} L${151.2 + x},${y - 1.2} L${154 + x},${y} L${151.2 + x},${y + 1.2} L${150 + x},${y + 4} L${148.8 + x},${y + 1.2} L${146 + x},${y} L${148.8 + x},${y - 1.2} Z" fill="#ffffff"/>`).join('');
      return `${skirtShapeSVG(wY, w, 420, hemHalf, 'round', 0.85)}
        <g fill="#ffffff" opacity="0.25">${skirtShapeSVG(wY + 10, w - 6, 410, hemHalf - 36, 'round', 0.8)}</g>
        ${bodiceSVG(bt, wY + 4, 'cap')}
        <path d="M${150 - w},${wY + 2} Q150,${wY + 18} ${150 + w},${wY + 2}" fill="none" stroke="#f2c94c" stroke-width="4"/>
        ${sparkles}`;
    } },

  // ----- More skirts -----
  { id: 'tutu-skirt', label: 'Tutu Dress', emoji: '🩰',
    svg: (bt) => {
      const wY = TORSO_Y.waist + 4, w = bt.waistHalf + 5;
      return bodiceSVG(bt, wY + 4, 'straps') + [0, 1, 2].map((i) => `<g opacity="${0.75 + i * 0.08}">${skirtShapeSVG(wY + i * 4, w, 276 - i * 6, bt.hipHalf + 54 - i * 10, 'scallop', 0.95)}</g>`).join('')
        + `<rect x="${150 - w}" y="${wY - 2}" width="${w * 2}" height="8" fill="#ffffff" opacity="0.6"/>
           ${[-34, -14, 6, 26].map((x) => `<circle cx="${150 + x}" cy="${256 + (x % 3) * 3}" r="1.6" fill="#ffffff"/>`).join('')}`;
    } },
  { id: 'denim-skirt', label: 'Denim Skirt', emoji: '👖', piece: 'bottom', fixedColor: true,
    svg: (bt) => {
      const wY = TORSO_Y.waist + 4, w = bt.waistHalf + 5, hemHalf = bt.hipHalf + 18;
      return `<g fill="#5b86c4" stroke="#3d6199" stroke-width="1.4">${skirtShapeSVG(wY, w, 300, hemHalf, 'straight', 0.6)}</g>
        <rect x="${150 - w}" y="${wY - 2}" width="${w * 2}" height="9" fill="#4f78b0"/>
        <line x1="150" y1="${wY + 6}" x2="150" y2="300" stroke="#3d6199" stroke-width="1.4"/>
        ${[230, 250, 270, 290].map((y) => `<circle cx="146" cy="${y}" r="2.2" fill="#d6b45a"/>`).join('')}
        <path d="M${150 - hemHalf + 4},296 L${150 + hemHalf - 4},296" stroke="#ffffff" stroke-width="1" stroke-dasharray="3 3" opacity="0.7"/>`;
    } },
  { id: 'tiered-skirt', label: 'Tiered Skirt', emoji: '🎂', piece: 'bottom',
    svg: (bt) => {
      const wY = TORSO_Y.waist + 4, w = bt.waistHalf + 5;
      return [2, 1, 0].map((i) => {
        const top = wY + i * 34, bot = top + 44, th = w + i * 12, bh = w + (i + 1) * 12 + 12;
        return `${skirtShapeSVG(top, th, bot, bh, 'wave', 0.6)}<path d="M${150 - th},${top + 2} L${150 + th},${top + 2}" stroke="#000000" stroke-width="1.5" opacity="0.15"/>`;
      }).join('');
    } },
  { id: 'bubble-skirt', label: 'Bubble Skirt', emoji: '🫧', piece: 'bottom',
    svg: (bt) => {
      const wY = TORSO_Y.waist + 4, w = bt.waistHalf + 5, h = bt.hipHalf + 30;
      return `<path d="M${150 - w},${wY} L${150 + w},${wY} C${150 + h + 10},${wY + 20} ${150 + h + 12},280 ${150 + h - 10},292 Q150,302 ${150 - h + 10},292 C${150 - h - 12},280 ${150 - h - 10},${wY + 20} ${150 - w},${wY} Z"/>
        <path d="M${150 - h + 6},288 Q150,296 ${150 + h - 6},288" fill="none" stroke="#000000" stroke-width="3" opacity="0.15"/>
        <rect x="${150 - w}" y="${wY - 2}" width="${w * 2}" height="8" fill="#000000" opacity="0.15"/>
        <ellipse cx="${150 - 20}" cy="252" rx="8" ry="16" fill="#ffffff" opacity="0.2"/>`;
    } },
  { id: 'polka-skirt', label: 'Polka Dot Skirt', emoji: '⚪', piece: 'bottom',
    svg: (bt) => {
      const wY = TORSO_Y.waist + 4, w = bt.waistHalf + 5, hemHalf = bt.hipHalf + 34;
      const dots = [];
      for (let y = wY + 16, r = 0; y < 316; y += 15, r++) {
        const half = w + (hemHalf - w) * ((y - wY) / (320 - wY)) - 6;
        for (let x = -half + (r % 2) * 8; x <= half; x += 16) dots.push(`<circle cx="${150 + x}" cy="${y}" r="3.4" fill="#ffffff"/>`);
      }
      return `${skirtShapeSVG(wY, w, 320, hemHalf, 'straight', 0.6)}${dots.join('')}
        <rect x="${150 - w}" y="${wY - 2}" width="${w * 2}" height="8" fill="#000000" opacity="0.15"/>`;
    } },
  { id: 'pencil-skirt', label: 'Pencil Skirt', emoji: '✏️', piece: 'bottom',
    svg: (bt) => {
      const wY = TORSO_Y.waist + 4, w = bt.waistHalf + 5, h = bt.hipHalf + 6;
      return `<path d="M${150 - w},${wY} L${150 + w},${wY} C${150 + h + 4},${wY + 30} ${150 + h},300 ${150 + h - 4},344 L${150 - h + 4},344 C${150 - h},300 ${150 - h - 4},${wY + 30} ${150 - w},${wY} Z"/>
        <path d="M${150 + 10},344 L${150 + 10},318" stroke="#000000" stroke-width="1.4" opacity="0.25"/>
        <rect x="${150 - w}" y="${wY - 2}" width="${w * 2}" height="8" fill="#000000" opacity="0.15"/>
        <circle cx="${150 - w + 8}" cy="${wY + 2}" r="2.4" fill="#f2c94c"/>`;
    } },
  { id: 'twirl-skirt', label: 'Twirl Skirt', emoji: '🌀', piece: 'bottom',
    svg: (bt) => {
      const wY = TORSO_Y.waist + 4, w = bt.waistHalf + 5, hemHalf = bt.hipHalf + 58;
      return `${skirtShapeSVG(wY, w, 308, hemHalf, 'scallop', 0.95)}
        ${[-0.7, -0.35, 0, 0.35, 0.7].map((f) => `<path d="M${150 + f * w},${wY + 6} Q${150 + f * hemHalf * 0.8},270 ${150 + f * hemHalf},306" fill="none" stroke="#000000" stroke-width="1" opacity="0.15"/>`).join('')}
        <path d="M${150 - hemHalf + 6},300 Q150,312 ${150 + hemHalf - 6},300" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6"/>
        <rect x="${150 - w}" y="${wY - 2}" width="${w * 2}" height="8" fill="#000000" opacity="0.15"/>`;
    } },

  // ----- Even more full outfits -----
  { id: 'romper', label: 'Romper', emoji: '🩳',
    svg: (bt) => `${shortsSVG(bt, null, 292)}${bodiceSVG(bt, 240, 'straps')}
      <rect x="${150 - bt.waistHalf - 4}" y="${TORSO_Y.waist - 3}" width="${(bt.waistHalf + 4) * 2}" height="7" fill="#ffffff" opacity="0.85"/>
      <path d="M150,${TORSO_Y.waist} l-8,-5 l0,10 Z M150,${TORSO_Y.waist} l8,-5 l0,10 Z" fill="#ffffff"/>
      ${[[-16, 190], [14, 176], [-6, 262], [22, 272], [-28, 280]].map(([x, y]) => `<circle cx="${150 + x}" cy="${y}" r="2.6" fill="#ffffff" opacity="0.8"/>`).join('')}` },
  { id: 'wide-jumpsuit', label: 'Wide-Leg Jumpsuit', emoji: '🕴️',
    svg: (bt) => {
      const cx = 150, h = bt.hipHalf + 6;
      const leg = (d) => `<path d="M${cx + d * h},236 L${cx + d * 2},236 L${cx + d * 3},262 L${cx + d * 4},440 L${cx + d * (h + 22)},440 L${cx + d * (h + 6)},262 Z"/>`;
      return `${leg(-1)}${leg(1)}${bodiceSVG(bt, 244, 'none')}
        <rect x="${cx - bt.waistHalf - 4}" y="${TORSO_Y.waist - 3}" width="${(bt.waistHalf + 4) * 2}" height="7" fill="#000000" opacity="0.18"/>
        <path d="M${cx},${TORSO_Y.shoulder} L${cx},${TORSO_Y.shoulder + 30}" stroke="#000000" stroke-width="1.4" opacity="0.2"/>
        ${shineSVG(cx - h + 6, 250, cx - h - 10, 430)}`;
    } },
  { id: 'sweater-dress', label: 'Sweater Dress', emoji: '🧶',
    svg: (bt) => {
      const hw = bt.hipHalf + 10, hemY = 318;
      const ribs = Array.from({ length: 12 }, (_, i) => `<line x1="${150 - hw + 4 + i * ((hw * 2 - 8) / 11)}" y1="${hemY - 12}" x2="${150 - hw + 4 + i * ((hw * 2 - 8) / 11)}" y2="${hemY}" stroke="#000000" stroke-width="1" opacity="0.2"/>`).join('');
      return `${skirtShapeSVG(TORSO_Y.waist, bt.waistHalf + 6, hemY, hw, 'straight', 0.4)}${fittedTopSVG(bt, TORSO_Y.waist + 6, null)}
        <rect x="${150 - hw}" y="${hemY - 12}" width="${hw * 2}" height="12" fill="#000000" opacity="0.12"/>${ribs}
        <path d="M${150 - 16},${TORSO_Y.shoulder - 4} Q150,${TORSO_Y.shoulder + 14} ${150 + 16},${TORSO_Y.shoulder - 4}" fill="none" stroke="#000000" stroke-width="6" opacity="0.15"/>
        <path d="M140,${TORSO_Y.shoulder + 18} q6,10 0,20 q-6,10 0,20 q6,10 0,20 q-6,10 0,20 q6,10 0,20 M160,${TORSO_Y.shoulder + 18} q-6,10 0,20 q6,10 0,20 q-6,10 0,20 q6,10 0,20 q-6,10 0,20" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.3"/>`;
    } },
  { id: 'tulle-party-dress', label: 'Tulle Party Dress', emoji: '🎊',
    svg: (bt) => {
      const wY = TORSO_Y.waist, w = bt.waistHalf + 4;
      return [0, 1, 2].map((i) => `<g opacity="${0.7 + i * 0.1}">${skirtShapeSVG(wY + i * 2, w, 330 - i * 10, bt.hipHalf + 60 - i * 12, 'scallop', 0.9)}</g>`).join('')
        + `${bodiceSVG(bt, wY + 4, 'straps')}
        ${[[-40, 280], [26, 300], [-10, 316], [44, 270], [-54, 300], [8, 260], [-14, 184], [14, 196]].map(([x, y]) => `<circle cx="${150 + x}" cy="${y}" r="1.8" fill="#ffffff"/>`).join('')}
        <path d="M${150 - w},${wY + 2} Q150,${wY + 12} ${150 + w},${wY + 2}" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.8"/>`;
    } },
  { id: 'shirt-dress', label: 'Shirt Dress', emoji: '👔',
    svg: (bt) => {
      const sY = TORSO_Y.shoulder, wY = TORSO_Y.waist, w = bt.waistHalf + 4, hemHalf = bt.hipHalf + 24;
      return `${skirtShapeSVG(wY, w, 334, hemHalf, 'straight', 0.5)}${bodiceSVG(bt, wY + 2, 'cap')}
        <path d="M${150 - 16},${sY - 2} L150,${sY + 10} L${150 - 4},${sY + 18} Z M${150 + 16},${sY - 2} L150,${sY + 10} L${150 + 4},${sY + 18} Z" fill="#ffffff"/>
        <line x1="150" y1="${sY + 10}" x2="150" y2="330" stroke="#000000" stroke-width="1.2" opacity="0.2"/>
        ${[176, 196, 216, 246, 270, 296].map((y) => `<circle cx="146" cy="${y}" r="2" fill="#ffffff"/>`).join('')}
        <rect x="${150 - w}" y="${wY - 3}" width="${w * 2}" height="7" fill="#7a5230"/>
        <rect x="${150 - 6}" y="${wY - 4}" width="12" height="9" rx="2" fill="#d6b45a"/>
        <rect x="${150 + bt.chestHalf - 22}" y="${sY + 28}" width="14" height="12" rx="2" fill="#000000" opacity="0.12"/>`;
    } },
  { id: 'denim-pinafore', label: 'Denim Pinafore', emoji: '🧵', fixedColor: true,
    svg: (bt) => {
      const wY = TORSO_Y.waist, w = bt.waistHalf + 4, hemHalf = bt.hipHalf + 22;
      return `${fittedTopSVG(bt, wY, '#fdfdfd')}
        <g fill="#5b86c4" stroke="#3d6199" stroke-width="1.2">${skirtShapeSVG(wY, w, 312, hemHalf, 'straight', 0.5)}</g>
        <path d="M${150 - w + 4},${wY + 2} L${150 - w + 6},${TORSO_Y.chest - 4} L${150 + w - 6},${TORSO_Y.chest - 4} L${150 + w - 4},${wY + 2} Z" fill="#5b86c4" stroke="#3d6199" stroke-width="1.2"/>
        <path d="M${150 - w + 8},${TORSO_Y.chest - 2} L${150 - bt.shoulderHalf + 8},${TORSO_Y.shoulder} M${150 + w - 8},${TORSO_Y.chest - 2} L${150 + bt.shoulderHalf - 8},${TORSO_Y.shoulder}" stroke="#5b86c4" stroke-width="7"/>
        <circle cx="${150 - w + 9}" cy="${TORSO_Y.chest - 1}" r="2.8" fill="#f2c94c"/><circle cx="${150 + w - 9}" cy="${TORSO_Y.chest - 1}" r="2.8" fill="#f2c94c"/>
        <rect x="${150 - 12}" y="${TORSO_Y.chest + 4}" width="24" height="16" rx="3" fill="#4f78b0" stroke="#3d6199" stroke-width="1"/>
        <path d="M${150 - hemHalf + 4},308 L${150 + hemHalf - 4},308" stroke="#ffffff" stroke-width="1" stroke-dasharray="3 3" opacity="0.7"/>`;
    } },
  { id: 'gingham-dress', label: 'Gingham Dress', emoji: '🧺',
    svg: (bt) => {
      const wY = TORSO_Y.waist, w = bt.waistHalf + 4, hemHalf = bt.hipHalf + 40;
      let checks = '';
      for (let y = TORSO_Y.shoulder + 6; y < 330; y += 12) checks += `<rect x="${150 - hemHalf}" y="${y}" width="${hemHalf * 2}" height="5" fill="#ffffff" opacity="0.4"/>`;
      for (let x = -hemHalf; x < hemHalf; x += 12) checks += `<rect x="${150 + x}" y="${TORSO_Y.shoulder}" width="5" height="${330 - TORSO_Y.shoulder}" fill="#ffffff" opacity="0.4"/>`;
      return `<clipPath id="ging-clip-${bt.id}"><path d="M${150 - bt.shoulderHalf - 2},${TORSO_Y.shoulder} L${150 + bt.shoulderHalf + 2},${TORSO_Y.shoulder} L${150 + bt.chestHalf + 3},${TORSO_Y.chest} L${150 + w},${wY} L${150 + hemHalf},328 L${150 - hemHalf},328 L${150 - w},${wY} L${150 - bt.chestHalf - 3},${TORSO_Y.chest} Z"/></clipPath>
        ${skirtShapeSVG(wY, w, 328, hemHalf, 'straight', 0.6)}${bodiceSVG(bt, wY + 2, 'cap')}
        <g clip-path="url(#ging-clip-${bt.id})">${checks}</g>
        <path d="M${150 - 16},${TORSO_Y.shoulder} Q150,${TORSO_Y.shoulder + 16} ${150 + 16},${TORSO_Y.shoulder}" fill="#ffffff" stroke="#e7d6e0" stroke-width="1"/>
        <rect x="${150 - w}" y="${wY - 3}" width="${w * 2}" height="7" fill="#ffffff"/>`;
    } },

  // ----- Even more tops -----
  { id: 'button-shirt', label: 'Button-Up Shirt', emoji: '👔', piece: 'top',
    svg: (bt) => {
      const sY = TORSO_Y.shoulder;
      return `${fittedTopSVG(bt, 250, null)}
        <path d="M${150 - 16},${sY - 2} L150,${sY + 10} L${150 - 4},${sY + 18} Z M${150 + 16},${sY - 2} L150,${sY + 10} L${150 + 4},${sY + 18} Z" fill="#ffffff" stroke="#000000" stroke-opacity="0.15" stroke-width="1"/>
        <line x1="150" y1="${sY + 10}" x2="150" y2="250" stroke="#000000" stroke-width="1.2" opacity="0.2"/>
        ${[178, 196, 214, 232].map((y) => `<circle cx="146" cy="${y}" r="2" fill="#ffffff"/>`).join('')}
        <rect x="${150 + bt.chestHalf - 22}" y="${sY + 26}" width="14" height="12" rx="2" fill="#000000" opacity="0.12"/>`;
    } },
  { id: 'peplum-top', label: 'Peplum Top', emoji: '🌷', piece: 'top',
    svg: (bt) => `${skirtShapeSVG(TORSO_Y.waist + 2, bt.waistHalf + 4, 252, bt.hipHalf + 22, 'scallop', 0.9)}${bodiceSVG(bt, TORSO_Y.waist + 4, 'cap')}
      <rect x="${150 - bt.waistHalf - 4}" y="${TORSO_Y.waist - 2}" width="${(bt.waistHalf + 4) * 2}" height="6" fill="#000000" opacity="0.15"/>` },
  { id: 'off-shoulder-top', label: 'Off-Shoulder Top', emoji: '🌸', piece: 'top',
    svg: (bt) => {
      const topY = TORSO_Y.shoulder + 14, t = torsoHalfAt(bt, topY) + 14;
      const ruffle = Array.from({ length: 9 }, (_, i) => `<circle cx="${(150 - t + i * (t * 2 / 8)).toFixed(1)}" cy="${topY + 2 + 3 * Math.sin(i)}" r="6" stroke="#000000" stroke-opacity="0.15" stroke-width="1"/>`).join('');
      return `${bodiceSVG(bt, 246, 'straps').replace(/<path d="M[^"]*Z M[^"]*Z"\/>/, '')}
        <path d="M${150 - t},${topY} L${150 + t},${topY} L${150 + t - 4},${topY + 16} L${150 - t + 4},${topY + 16} Z"/>${ruffle}`;
    } },
  { id: 'sequin-top', label: 'Sequin Top', emoji: '✨', piece: 'top',
    svg: (bt) => {
      let dots = '';
      for (let y = 170, r = 0; y < 244; y += 8, r++) {
        const half = torsoHalfAt(bt, y) - 2;
        for (let x = -half + (r % 2) * 4; x <= half; x += 8) dots += `<circle cx="${(150 + x).toFixed(1)}" cy="${y}" r="2.2" fill="#ffffff" opacity="${0.25 + ((r + Math.abs(x)) % 3) * 0.2}"/>`;
      }
      return `${tankSVG(bt, 246, null)}${dots}`;
    } },
  { id: 'heart-sweater', label: 'Heart Sweater', emoji: '💗', piece: 'top',
    svg: (bt) => `${fittedTopSVG(bt, 256, null)}
      <rect x="${150 - torsoHalfAt(bt, 252) - 4}" y="246" width="${(torsoHalfAt(bt, 252) + 4) * 2}" height="10" rx="3" fill="#000000" opacity="0.12"/>
      <path d="M150,${TORSO_Y.chest + 30} C132,${TORSO_Y.chest + 16} 134,${TORSO_Y.chest - 4} 144,${TORSO_Y.chest - 2} C147,${TORSO_Y.chest - 1} 150,${TORSO_Y.chest + 3} 150,${TORSO_Y.chest + 6} C150,${TORSO_Y.chest + 3} 153,${TORSO_Y.chest - 1} 156,${TORSO_Y.chest - 2} C166,${TORSO_Y.chest - 4} 168,${TORSO_Y.chest + 16} 150,${TORSO_Y.chest + 30} Z" fill="#ffffff" opacity="0.9"/>` },
  { id: 'polo-shirt', label: 'Polo Shirt', emoji: '🏌️', piece: 'top',
    svg: (bt) => {
      const sY = TORSO_Y.shoulder;
      return `${fittedTopSVG(bt, 248, null)}
        <path d="M${150 - 16},${sY - 2} L150,${sY + 8} L${150 - 6},${sY + 14} Z M${150 + 16},${sY - 2} L150,${sY + 8} L${150 + 6},${sY + 14} Z" fill="#ffffff"/>
        <line x1="150" y1="${sY + 8}" x2="150" y2="${sY + 32}" stroke="#000000" stroke-width="1.2" opacity="0.2"/>
        <circle cx="148" cy="${sY + 18}" r="1.6" fill="#ffffff"/><circle cx="148" cy="${sY + 27}" r="1.6" fill="#ffffff"/>
        <circle cx="${150 + bt.chestHalf - 14}" cy="${sY + 30}" r="3.4" fill="#ffffff" opacity="0.8"/>`;
    } },

  // ----- Even more bottoms -----
  { id: 'jean-shorts', label: 'Jean Shorts', emoji: '🩳', piece: 'bottom', fixedColor: true,
    svg: (bt) => {
      const cx = 150, h = bt.hipHalf + 6;
      const fray = (d) => Array.from({ length: 5 }, (_, i) => `<line x1="${cx + d * (8 + i * (h / 5))}" y1="298" x2="${cx + d * (8 + i * (h / 5))}" y2="303" stroke="#ffffff" stroke-width="1.4" opacity="0.8"/>`).join('');
      return `<g fill="#6b93cf" stroke="#4f78b0" stroke-width="1.2">${shortsSVG(bt, null, 300)}</g>
        <rect x="${cx - h}" y="228" width="${h * 2}" height="8" fill="#5a85c0"/>
        <rect x="${cx - 4}" y="229" width="8" height="6" rx="1" fill="#d6b45a"/>
        ${fray(-1)}${fray(1)}
        <path d="M${cx - h + 6},240 Q${cx - h + 14},254 ${cx - 10},244 M${cx + h - 6},240 Q${cx + h - 14},254 ${cx + 10},244" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="2 2" opacity="0.8"/>`;
    } },
  { id: 'cargo-pants', label: 'Cargo Pants', emoji: '🪖', piece: 'bottom',
    svg: (bt) => `${pantsSVG(bt, null, 432, 6)}
      <rect x="${150 - bt.hipHalf - 14}" y="300" width="18" height="24" rx="3" fill="#000000" opacity="0.15"/>
      <rect x="${150 + bt.hipHalf - 4}" y="300" width="18" height="24" rx="3" fill="#000000" opacity="0.15"/>
      <rect x="${150 - bt.hipHalf - 2}" y="234" width="${(bt.hipHalf + 2) * 2}" height="7" fill="#000000" opacity="0.18"/>` },
  { id: 'flare-pants', label: 'Flare Pants', emoji: '🌼', piece: 'bottom',
    svg: (bt) => {
      const cx = 150, h = bt.hipHalf + 4;
      const leg = (d) => `<path d="M${cx + d * h},236 L${cx + d * 2},236 L${cx + d * 4},350 L${cx + d * 2},444 L${cx + d * (h + 22)},444 L${cx + d * (h + 2)},350 Z"/>`;
      return `${leg(-1)}${leg(1)}<rect x="${cx - h}" y="232" width="${h * 2}" height="8" fill="#000000" opacity="0.15"/>`;
    } },
  { id: 'joggers', label: 'Joggers', emoji: '🏃', piece: 'bottom',
    svg: (bt) => `${pantsSVG(bt, null, 428, 6)}
      <rect x="${127 - 11}" y="420" width="22" height="9" rx="4" fill="#000000" opacity="0.2"/><rect x="${173 - 11}" y="420" width="22" height="9" rx="4" fill="#000000" opacity="0.2"/>
      <path d="M${150 - bt.hipHalf - 2},250 L${150 - bt.hipHalf + 2},420 M${150 + bt.hipHalf + 2},250 L${150 + bt.hipHalf - 2},420" stroke="#ffffff" stroke-width="3" opacity="0.7"/>
      <rect x="${150 - bt.hipHalf - 2}" y="232" width="${(bt.hipHalf + 2) * 2}" height="8" fill="#000000" opacity="0.15"/>` },
  { id: 'bike-shorts', label: 'Bike Shorts', emoji: '🚲', piece: 'bottom', under: true,
    svg: (bt) => `${pantsSVG(bt, null, 320, 1)}
      <rect x="${150 - bt.hipHalf - 2}" y="234" width="${(bt.hipHalf + 2) * 2}" height="6" fill="#000000" opacity="0.15"/>` },
  { id: 'ruffle-mini', label: 'Ruffle Mini Skirt', emoji: '🎀', piece: 'bottom',
    svg: (bt) => {
      const wY = TORSO_Y.waist + 4, w = bt.waistHalf + 5;
      return `${skirtShapeSVG(wY, w, 284, bt.hipHalf + 26, 'scallop', 0.7)}
        <g opacity="0.85">${skirtShapeSVG(258, bt.hipHalf + 18, 298, bt.hipHalf + 34, 'scallop', 0.6)}</g>
        <rect x="${150 - w}" y="${wY - 2}" width="${w * 2}" height="8" fill="#000000" opacity="0.15"/>`;
    } },
  { id: 'tennis-skirt', label: 'Tennis Skirt', emoji: '🎾', piece: 'bottom',
    svg: (bt) => {
      const wY = TORSO_Y.waist + 4, w = bt.waistHalf + 5, hw = bt.hipHalf + 24, hemY = 294;
      const pleats = Array.from({ length: 10 }, (_, i) => { const f = -1 + (2 * (i + 0.5)) / 10; return `<line x1="${150 + f * w}" y1="${wY + 6}" x2="${150 + f * hw}" y2="${hemY}" stroke="#000000" stroke-width="1" opacity="0.18"/>`; }).join('');
      return `<path d="M${150 - w},${wY} L${150 + w},${wY} L${150 + hw},${hemY} L${150 - hw},${hemY} Z"/>${pleats}
        <path d="M${150 - hw + 2},${hemY - 6} L${150 + hw - 2},${hemY - 6} M${150 - hw + 3},${hemY - 11} L${150 + hw - 3},${hemY - 11}" stroke="#ffffff" stroke-width="2.4"/>
        <rect x="${150 - w}" y="${wY - 2}" width="${w * 2}" height="8" fill="#000000" opacity="0.15"/>`;
    } },
  { id: 'sparkle-skirt', label: 'Sparkle Skirt', emoji: '💫', piece: 'bottom',
    svg: (bt) => {
      const wY = TORSO_Y.waist + 4, w = bt.waistHalf + 5, hemHalf = bt.hipHalf + 30;
      let sp = '';
      for (let y = wY + 12, r = 0; y < 312; y += 9, r++) {
        const half = w + (hemHalf - w) * ((y - wY) / (316 - wY)) - 4;
        for (let x = -half + (r % 2) * 5; x <= half; x += 10) sp += `<circle cx="${(150 + x).toFixed(1)}" cy="${y}" r="2.2" fill="#ffffff" opacity="${0.2 + ((r + Math.round(Math.abs(x))) % 3) * 0.22}"/>`;
      }
      return `${skirtShapeSVG(wY, w, 316, hemHalf, 'straight', 0.6)}${sp}<rect x="${150 - w}" y="${wY - 2}" width="${w * 2}" height="8" fill="#000000" opacity="0.15"/>`;
    } },
  { id: 'midi-skirt', label: 'Midi Skirt', emoji: '🍂', piece: 'bottom',
    svg: (bt) => {
      const wY = TORSO_Y.waist + 4, w = bt.waistHalf + 5;
      return `${skirtShapeSVG(wY, w, 368, bt.hipHalf + 30, 'straight', 0.55)}
        <path d="M${150 - 8},${wY + 10} Q${150 - 14},300 ${150 - 20},364 M${150 + 12},${wY + 10} Q${150 + 18},300 ${150 + 24},364" fill="none" stroke="#000000" stroke-width="1.2" opacity="0.15"/>
        <rect x="${150 - w}" y="${wY - 2}" width="${w * 2}" height="8" fill="#000000" opacity="0.15"/>`;
    } },
  { id: 'plaid-mini', label: 'Plaid Mini Skirt', emoji: '🧣', piece: 'bottom',
    svg: (bt) => {
      const wY = TORSO_Y.waist + 4, tw = bt.waistHalf + 6, hw = bt.hipHalf + 26, hemY = 298;
      const lines = [0.3, 0.6, 0.85].map((k) => {
        const y = wY + (hemY - wY) * k, half = tw + (hw - tw) * k;
        return `<line x1="${150 - half}" y1="${y}" x2="${150 + half}" y2="${y}" stroke="#2b2b2b" stroke-width="3" opacity="0.35"/><line x1="${150 - half}" y1="${y + 5}" x2="${150 + half}" y2="${y + 5}" stroke="#ffffff" stroke-width="1.4" opacity="0.6"/>`;
      }).join('') + [-0.6, -0.2, 0.2, 0.6].map((f) => `<line x1="${150 + f * tw}" y1="${wY}" x2="${150 + f * hw}" y2="${hemY}" stroke="#2b2b2b" stroke-width="3" opacity="0.3"/>`).join('');
      return `<path d="M${150 - tw},${wY} L${150 + tw},${wY} L${150 + hw},${hemY} L${150 - hw},${hemY} Z"/>${lines}
        <rect x="${150 - tw}" y="${wY - 2}" width="${tw * 2}" height="8" fill="#000000" opacity="0.2"/>`;
    } },

  // ----- Separates: tops and bottoms you can mix and match -----
  { id: 'tee', label: 'T-Shirt', emoji: '👕', piece: 'top',
    svg: (bt) => `${fittedTopSVG(bt, 246, null)}
      <path d="M${150 - 12},${TORSO_Y.shoulder} Q150,${TORSO_Y.shoulder + 12} ${150 + 12},${TORSO_Y.shoulder}" fill="none" stroke="#000000" stroke-width="1.5" opacity="0.18"/>` },
  { id: 'tank', label: 'Tank Top', emoji: '🎽', piece: 'top',
    svg: (bt) => `${tankSVG(bt, 246, null)}
      <path d="M136,${TORSO_Y.shoulder - 2} Q150,${TORSO_Y.shoulder + 18} 164,${TORSO_Y.shoulder - 2}" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.5"/>` },
  { id: 'ruffle-blouse', label: 'Ruffle Blouse', emoji: '🎀', piece: 'top',
    svg: (bt) => {
      const sY = TORSO_Y.shoulder;
      const ruffles = Array.from({ length: 7 }, (_, i) => {
        const t = i / 6, x = 150 - 22 + 44 * t, y = sY + 2 + 10 * Math.sin(Math.PI * t);
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" stroke="#000000" stroke-opacity="0.15" stroke-width="1"/>`;
      }).join('');
      return `${fittedTopSVG(bt, 244, null)}${ruffles}
        <path d="M150,${sY + 16} l-8,-5 l0,10 Z M150,${sY + 16} l8,-5 l0,10 Z" fill="#ffffff"/><circle cx="150" cy="${sY + 16}" r="2.4" fill="#ffffff"/>
        ${[190, 206, 222].map((y) => `<circle cx="150" cy="${y}" r="1.8" fill="#ffffff" opacity="0.9"/>`).join('')}`;
    } },
  { id: 'cozy-sweater', label: 'Cozy Sweater', emoji: '🧶', piece: 'top',
    svg: (bt) => {
      const sY = TORSO_Y.shoulder, hw = torsoHalfAt(bt, 252) + 4;
      const ribs = Array.from({ length: 12 }, (_, i) => `<line x1="${150 - hw + 4 + i * ((hw * 2 - 8) / 11)}" y1="248" x2="${150 - hw + 4 + i * ((hw * 2 - 8) / 11)}" y2="258" stroke="#000000" stroke-width="1" opacity="0.2"/>`).join('');
      return `${fittedTopSVG(bt, 258, null)}
        <rect x="${150 - hw}" y="247" width="${hw * 2}" height="11" rx="3" fill="#000000" opacity="0.12"/>${ribs}
        <path d="M${150 - 14},${sY - 1} Q150,${sY + 12} ${150 + 14},${sY - 1}" fill="none" stroke="#000000" stroke-width="4" opacity="0.15"/>
        <path d="M140,${sY + 16} q6,8 0,16 q-6,8 0,16 q6,8 0,16 q-6,8 0,16 M160,${sY + 16} q-6,8 0,16 q6,8 0,16 q-6,8 0,16 q6,8 0,16" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.35"/>`;
    } },
  { id: 'stripe-tee', label: 'Striped Tee', emoji: '🦓', piece: 'top',
    svg: (bt) => {
      let stripes = '';
      for (let y = TORSO_Y.shoulder + 8; y < 244; y += 12) {
        const half = torsoHalfAt(bt, Math.min(y + 3, 250)) + 4;
        stripes += `<rect x="${150 - half}" y="${y}" width="${half * 2}" height="5" rx="1"/>`;
      }
      return `${fittedTopSVG(bt, 246, '#ffffff')}${stripes}
        <path d="M${150 - 14},${TORSO_Y.shoulder} Q150,${TORSO_Y.shoulder + 12} ${150 + 14},${TORSO_Y.shoulder}" fill="none" stroke="#d6d6d6" stroke-width="2"/>`;
    } },
  { id: 'mini-skirt', label: 'Mini Skirt', emoji: '👗', piece: 'bottom',
    svg: (bt) => {
      const cx = 150, wY = TORSO_Y.waist, tw = bt.waistHalf + 5, hw = bt.hipHalf + 24;
      return `<path d="M${cx - tw},${wY + 4} L${cx + tw},${wY + 4} Q${cx + hw - 8},260 ${cx + hw},298 Q${cx},306 ${cx - hw},298 Q${cx - hw + 8},260 ${cx - tw},${wY + 4} Z"/>
        <rect x="${cx - tw}" y="${wY + 2}" width="${tw * 2}" height="8" fill="#000000" opacity="0.15"/>
        <path d="M${cx - tw + 6},${wY + 14} L${cx - hw + 16},292" stroke="#ffffff" stroke-width="5" opacity="0.15" stroke-linecap="round"/>`;
    } },
  { id: 'pleated-skirt', label: 'Pleated Skirt', emoji: '🩰', piece: 'bottom',
    svg: (bt) => {
      const cx = 150, wY = TORSO_Y.waist, tw = bt.waistHalf + 6, hw = bt.hipHalf + 30, hemY = 318;
      const pleats = Array.from({ length: 8 }, (_, i) => {
        const f = -1 + (2 * (i + 0.5)) / 8;
        return `<line x1="${cx + f * tw}" y1="${wY + 6}" x2="${cx + f * hw}" y2="${hemY}" stroke="#000000" stroke-width="1.2" opacity="0.2"/>`;
      }).join('');
      return `<path d="M${cx - tw},${wY + 4} L${cx + tw},${wY + 4} L${cx + hw},${hemY} L${cx - hw},${hemY} Z"/>${pleats}
        <rect x="${cx - tw}" y="${wY + 2}" width="${tw * 2}" height="8" fill="#000000" opacity="0.15"/>`;
    } },
  { id: 'maxi-skirt', label: 'Long Flowy Skirt', emoji: '🌸', piece: 'bottom',
    svg: (bt) => {
      const cx = 150, wY = TORSO_Y.waist, tw = bt.waistHalf + 5, hw = bt.hipHalf + 40, hemY = 418;
      let hem = '';
      const n = 8, step = (hw * 2) / n;
      for (let k = 0; k < n; k++) { const x0 = cx + hw - step * k; hem += ` Q${(x0 - step / 2).toFixed(1)},${hemY + (k % 2 ? 6 : 12)} ${(x0 - step).toFixed(1)},${hemY}`; }
      return `<path d="M${cx - tw},${wY + 4} L${cx + tw},${wY + 4} C${cx + tw + 20},300 ${cx + hw - 10},360 ${cx + hw},${hemY}${hem} C${cx - hw + 10},360 ${cx - tw - 20},300 ${cx - tw},${wY + 4} Z"/>
        <path d="M${cx - 10},${wY + 20} Q${cx - 22},320 ${cx - 30},${hemY - 6} M${cx + 16},${wY + 20} Q${cx + 26},330 ${cx + 34},${hemY - 6}" fill="none" stroke="#000000" stroke-width="1.2" opacity="0.15"/>
        <rect x="${cx - tw}" y="${wY + 2}" width="${tw * 2}" height="8" fill="#000000" opacity="0.15"/>`;
    } },
  { id: 'skinny-jeans', label: 'Jeans', emoji: '👖', piece: 'bottom', under: true, fixedColor: true,
    svg: (bt) => `${pantsSVG(bt, '#5b86c4', 434, 3)}
      <line x1="133" y1="262" x2="128" y2="430" stroke="#3d6199" stroke-width="1"/><line x1="167" y1="262" x2="172" y2="430" stroke="#3d6199" stroke-width="1"/>
      <rect x="${150 - bt.hipHalf - 2}" y="232" width="${(bt.hipHalf + 2) * 2}" height="7" fill="#3d6199"/>` },
  { id: 'shorts', label: 'Shorts', emoji: '🩳', piece: 'bottom',
    svg: (bt) => `${shortsSVG(bt, null, 300)}
      <rect x="${150 - bt.hipHalf - 6}" y="228" width="${(bt.hipHalf + 6) * 2}" height="7" fill="#000000" opacity="0.15"/>` },
  { id: 'leggings', label: 'Leggings', emoji: '🧘', piece: 'bottom', under: true,
    svg: (bt) => `${pantsSVG(bt, null, 440, 1)}
      <rect x="${150 - bt.hipHalf - 2}" y="234" width="${(bt.hipHalf + 2) * 2}" height="6" fill="#000000" opacity="0.15"/>` },
  { id: 'grecian-gown', label: 'Grecian Goddess Gown', emoji: '🏛️', theme: 'goddess',
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder, beltY = TORSO_Y.chest + 12;
      const sh = bt.shoulderHalf, uY = sY + 22, uw = torsoHalfAt(bt, uY) + 2;
      const top = torsoHalfAt(bt, beltY) + 3, hemHalf = bt.hipHalf + 30;
      const drapes = [-2, -1, 0, 1, 2].map((k) => `<path d="M${cx + k * 7},${beltY + 6} Q${cx + k * 13},320 ${(cx + k * hemHalf / 2.6).toFixed(1)},428" fill="none" stroke="#000000" stroke-width="1.3" opacity="0.1"/>
          <path d="M${cx + k * 7 + 3},${beltY + 8} Q${cx + k * 13 + 4},320 ${(cx + k * hemHalf / 2.6 + 4).toFixed(1)},426" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.22"/>`).join('');
      return `${skirtShapeSVG(beltY, top, 432, hemHalf, 'wave', 0.75)}
        ${drapes}
        <path d="M${cx - sh + 2},${sY - 1} L${cx - sh + 16},${sY - 3} Q${cx + 4},${sY + 8} ${cx + uw},${uY} L${cx + top},${beltY} L${cx - top},${beltY} L${cx - uw},${uY} Z"/>
        ${[0, 7, 14].map((o) => `<path d="M${cx - sh + 8 + o},${sY + 1 + o * 0.4} Q${cx - 4 + o},${sY + 18 + o} ${cx + top - 6},${beltY - 2 - (14 - o) * 0.3}" fill="none" stroke="#ffffff" stroke-width="1.4" opacity="0.3"/>`).join('')}
        <rect x="${cx - top}" y="${beltY - 3}" width="${top * 2}" height="6" rx="2" fill="#f2c94c" stroke="#c98f1f" stroke-width="0.8"/>
        <circle cx="${cx}" cy="${beltY}" r="4.5" fill="#f2c94c" stroke="#c98f1f" stroke-width="1"/>
        <circle cx="${cx}" cy="${beltY}" r="1.8" fill="#ffffff" opacity="0.7"/>
        <circle cx="${cx - sh + 9}" cy="${sY + 1}" r="4" fill="#f2c94c" stroke="#c98f1f" stroke-width="0.8"/>
        <ellipse cx="${cx - sh + 3}" cy="${sY + 4}" rx="3.4" ry="1.6" fill="#f2c94c" transform="rotate(30 ${cx - sh + 3} ${sY + 4})"/>
        <ellipse cx="${cx - sh + 15}" cy="${sY + 4}" rx="3.4" ry="1.6" fill="#f2c94c" transform="rotate(-30 ${cx - sh + 15} ${sY + 4})"/>`;
    } },
  { id: 'olympus-gown', label: 'Olympus Gold Gown', emoji: '👑', theme: 'goddess', fixedColor: true, price: 150, shopLabel: 'Gown',
    svg: (bt) => {
      const cx = 150, wY = TORSO_Y.waist, sY = TORSO_Y.shoulder;
      const w = bt.waistHalf + 4, hemHalf = bt.hipHalf + 44, gold = '#f2c94c', goldDark = '#c98f1f', white = '#fffaf2';
      const pleats = [-3, -2, -1, 0, 1, 2, 3].map((k) => `<path d="M${cx + k * 5},${wY + 8} L${(cx + k * hemHalf / 3.4).toFixed(1)},${440 + (3 - Math.abs(k)) * 4}" stroke="#e8dcc0" stroke-width="1.2"/>`).join('');
      const leaves = Array.from({ length: 9 }, (_, i) => {
        const t = (i + 0.5) / 9, x = cx - hemHalf + t * hemHalf * 2, y = 432 + 20 * (1 - Math.pow(2 * t - 1, 2)) - 9;
        return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="1.8" fill="${gold}" transform="rotate(${i % 2 ? 30 : -30} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      }).join('');
      return `<g fill="${white}" stroke="#e8dcc0" stroke-width="1.2">${skirtShapeSVG(wY, w, 432, hemHalf, 'round', 0.8)}</g>
        ${pleats}
        <path d="M${cx - hemHalf},432 Q${cx - hemHalf},454 ${cx},452 Q${cx + hemHalf},454 ${cx + hemHalf},432" fill="none" stroke="${gold}" stroke-width="5"/>
        ${leaves}
        <g fill="${white}" stroke="#e8dcc0" stroke-width="1">${bodiceSVG(bt, wY + 4, 'straps')}</g>
        <path d="M${cx - 10},${sY - 4} L${cx},${sY + 26} L${cx + 10},${sY - 4}" fill="none" stroke="${gold}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M${cx - 14},${sY - 6} Q${cx},${sY + 2} ${cx + 14},${sY - 6}" fill="none" stroke="${gold}" stroke-width="3.5"/>
        <rect x="${cx - w - 1}" y="${wY - 8}" width="${(w + 1) * 2}" height="14" rx="3" fill="${gold}" stroke="${goldDark}" stroke-width="1"/>
        ${[-2, -1, 0, 1, 2].map((k) => `<path d="M${cx + k * 6 - 2},${wY - 5} L${cx + k * 6 + 2},${wY + 3}" stroke="${goldDark}" stroke-width="1"/>`).join('')}
        <g transform="translate(${cx},${wY - 1})">${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="0" x2="${(9 * Math.cos(i * Math.PI / 6)).toFixed(1)}" y2="${(9 * Math.sin(i * Math.PI / 6)).toFixed(1)}" stroke="${goldDark}" stroke-width="1.2"/>`).join('')}<circle r="4.5" fill="#fff3a8" stroke="${goldDark}"/></g>`;
    } },
  { id: 'moon-goddess', label: 'Moon Goddess Gown', emoji: '🌙', theme: 'goddess', fixedColor: true,
    svg: (bt) => {
      const cx = 150, wY = TORSO_Y.waist, sY = TORSO_Y.shoulder;
      const w = bt.waistHalf + 4, hemHalf = bt.hipHalf + 50, s2 = bt.shoulderHalf + 2;
      const stars = [[-40, 280], [30, 300], [-10, 340], [50, 380], [-62, 400], [12, 410], [-24, 250], [40, 244], [-2, 300], [-50, 340], [62, 340], [22, 365], [-30, 375], [0, 186], [-16, 196], [18, 170]]
        .map(([x, y], i) => `<circle cx="${cx + x}" cy="${y}" r="${i % 3 ? 1.2 : 1.9}" fill="#e8eef6" opacity="${i % 2 ? 0.75 : 1}"/>`).join('');
      return `<g fill="#1f2a5c" stroke="#121a3d" stroke-width="1.2">${skirtShapeSVG(wY, w, 434, hemHalf, 'wave', 0.85)}</g>
        <g fill="#5c6fc2" opacity="0.45">${skirtShapeSVG(wY + 6, w - 2, 420, hemHalf - 26, 'wave', 0.8)}</g>
        <g fill="#1f2a5c" stroke="#121a3d" stroke-width="1">${bodiceSVG(bt, wY + 4, 'tube')}</g>
        <ellipse cx="${cx - s2 - 6}" cy="${sY + 14}" rx="12" ry="7" fill="#9fb3ff" opacity="0.55"/>
        <ellipse cx="${cx + s2 + 6}" cy="${sY + 14}" rx="12" ry="7" fill="#9fb3ff" opacity="0.55"/>
        <path d="M${cx - s2 - 4},${sY + 2} Q${cx},${sY + 14} ${cx + s2 + 4},${sY + 2}" fill="none" stroke="#c9d4e2" stroke-width="2.5"/>
        ${stars}
        <path d="M${cx + 2},${wY - 9} A10,10 0 1,0 ${cx + 2},${wY + 9} A12,12 0 0,1 ${cx + 2},${wY - 9} Z" fill="#e8eef6" stroke="#9aa6b8" stroke-width="0.8"/>
        <path d="M${cx - w},${wY + 2} L${cx + w},${wY + 2}" stroke="#c9d4e2" stroke-width="2" opacity="0.8"/>`;
    } },
  { id: 'goddess-tunic', label: 'Olympian Tunic', emoji: '⚡', theme: 'goddess',
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder, wY = TORSO_Y.waist;
      const sh = bt.shoulderHalf, uY = sY + 22, uw = torsoHalfAt(bt, uY) + 2;
      const ww = torsoHalfAt(bt, wY) + 3, hemHalf = bt.hipHalf + 12, hemY = 304;
      let key = '';
      for (let x = cx - hemHalf + 6; x < cx + hemHalf - 10; x += 9) key += `M${x.toFixed(1)},${hemY - 4} l0,-7 l6,0 l0,4 l-3,0`;
      return `${skirtShapeSVG(wY, ww, hemY, hemHalf, 'straight', 0.6)}
        <path d="M${cx - sh + 2},${sY - 1} L${cx - sh + 16},${sY - 3} Q${cx + 4},${sY + 8} ${cx + uw},${uY} L${cx + ww},${wY + 2} L${cx - ww},${wY + 2} L${cx - uw},${uY} Z"/>
        <path d="M${cx - sh + 6},${sY} L${cx + ww - 2},${wY + 40}" stroke="#ffffff" stroke-width="7" opacity="0.22" stroke-linecap="round"/>
        ${[-1, 0, 1].map((k) => `<path d="M${cx + k * 10},${wY + 8} L${cx + k * 15},${hemY - 12}" stroke="#000000" stroke-width="1.2" opacity="0.12"/>`).join('')}
        <path d="${key}" fill="none" stroke="#f2c94c" stroke-width="1.6"/>
        <rect x="${cx - ww}" y="${wY - 2}" width="${ww * 2}" height="7" rx="2" fill="#f2c94c" stroke="#c98f1f" stroke-width="0.8"/>
        <circle cx="${cx}" cy="${wY + 1.5}" r="4" fill="#f2c94c" stroke="#c98f1f"/>
        <path d="M${cx - 1.5},${wY - 1} L${cx + 1.5},${wY + 1.5} L${cx - 1},${wY + 1.5} L${cx + 1.5},${wY + 4}" fill="none" stroke="#c98f1f" stroke-width="0.9"/>
        <circle cx="${cx - sh + 9}" cy="${sY + 1}" r="4" fill="#f2c94c" stroke="#c98f1f" stroke-width="0.8"/>`;
    } },
  { id: 'spring-goddess', label: 'Spring Goddess Dress', emoji: '🌺', theme: 'goddess',
    svg: (bt) => {
      const cx = 150, wY = TORSO_Y.waist, w = bt.waistHalf + 4, hemHalf = bt.hipHalf + 36;
      const flowers = [[-16, 168, '#ffffff'], [-4, 186, '#ff8fc7'], [10, 200, '#fff3a8'], [18, 222, '#ffffff'], [24, 250, '#ff8fc7'], [30, 282, '#fff3a8'], [36, 318, '#ffffff'], [42, 356, '#ff8fc7'], [48, 396, '#fff3a8']]
        .map(([x, y, c]) => `<g transform="translate(${cx + x},${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-3" rx="2.2" ry="3" fill="${c}" transform="rotate(${a})"/>`).join('')}<circle r="1.6" fill="#f2c94c"/></g>`).join('');
      return `${skirtShapeSVG(wY, w, 432, hemHalf, 'wave', 0.7)}
        <g fill="#ffffff" opacity="0.28">${skirtShapeSVG(wY + 4, w - 2, 418, hemHalf - 14, 'wave', 0.75)}</g>
        ${bodiceSVG(bt, wY + 4, 'straps')}
        <path d="M${cx - 22},160 Q${cx},190 ${cx + 18},222 Q${cx + 30},300 ${cx + 50},400" fill="none" stroke="#43b581" stroke-width="1.8"/>
        ${[[-10, 174, -30], [6, 196, 30], [20, 236, -20], [28, 300, 30], [40, 360, -25]].map(([x, y, r]) => `<ellipse cx="${cx + x}" cy="${y}" rx="4" ry="1.8" fill="#43b581" transform="rotate(${r} ${cx + x} ${y})"/>`).join('')}
        ${flowers}`;
    } },
  { id: 'vip-gown', label: 'VIP Sequin Gown', emoji: '💎', vip: true, fixedColor: true,
    svg: (bt) => {
      const cx = 150, wY = TORSO_Y.waist, w = bt.waistHalf + 4, hemHalf = bt.hipHalf + 40;
      const seq = [];
      for (let y = 160; y < 428; y += 11) {
        const half = y < wY ? torsoHalfAt(bt, y) : w + (hemHalf - w) * Math.min(1, (y - wY) / (430 - wY)) * 0.85;
        for (let x = -half + 5; x < half - 3; x += 9) seq.push(`<circle cx="${(cx + x + (y % 2 ? 4 : 0)).toFixed(1)}" cy="${y}" r="1.3" fill="${(x + y) % 3 ? '#f2c94c' : '#ffffff'}" opacity="${(x + y) % 3 ? 0.75 : 0.9}"/>`);
      }
      return `<g fill="#1a1a1a" stroke="#000000" stroke-width="1">${skirtShapeSVG(wY, w, 432, hemHalf, 'straight', 0.55)}${bodiceSVG(bt, wY + 4, 'straps')}</g>
        <path d="M${cx + w - 2},${wY + 60} L${cx + hemHalf - 22},432" stroke="#2b2b2b" stroke-width="3"/>
        ${seq.join('')}
        <rect x="${cx - w - 1}" y="${wY - 3}" width="${(w + 1) * 2}" height="6" rx="2" fill="#f2c94c"/>
        <path d="M${cx},${wY - 6} l5,6 l-5,6 l-5,-6 Z" fill="#d6f0ff" stroke="#ffffff" stroke-width="0.8"/>`;
    } },
  { id: 'vip-suit', label: 'VIP Velvet Suit', emoji: '🎩', vip: true,
    svg: (bt) => {
      const cx = 150, sY = TORSO_Y.shoulder, wY = TORSO_Y.waist;
      return `${pantsSVG(bt, '#1a1a1a')}
        <rect x="${cx - bt.hipHalf - 6}" y="226" width="${(bt.hipHalf + 6) * 2}" height="7" fill="#111111"/>
        ${fittedTopSVG(bt, 262, null)}
        <path d="M${cx - 12},${sY} L${cx},${sY + 46} L${cx + 12},${sY} Z" fill="#ffffff"/>
        <path d="M${cx - 7},${sY + 4} l7,5 l7,-5 l0,8 l-7,-5 l-7,5 Z" fill="#1a1a1a"/>
        <path d="M${cx - 12},${sY} L${cx - 26},${sY + 6} L${cx - 4},${wY + 10} L${cx},${sY + 46} Z" fill="#000000" opacity="0.28"/>
        <path d="M${cx + 12},${sY} L${cx + 26},${sY + 6} L${cx + 4},${wY + 10} L${cx},${sY + 46} Z" fill="#000000" opacity="0.28"/>
        <path d="M${cx - 12},${sY} L${cx - 26},${sY + 6} L${cx - 4},${wY + 10}" fill="none" stroke="#f2c94c" stroke-width="1.6"/>
        <path d="M${cx + 12},${sY} L${cx + 26},${sY + 6} L${cx + 4},${wY + 10}" fill="none" stroke="#f2c94c" stroke-width="1.6"/>
        ${[wY + 18, wY + 36].map((y) => `<circle cx="${cx}" cy="${y}" r="2.6" fill="#f2c94c"/>`).join('')}
        <path d="M${cx + 18},${sY + 22} l4,-4 l4,4 l-4,3 Z" fill="#d6f0ff" stroke="#ffffff" stroke-width="0.6"/>`;
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
// The big colour palette for clothes, in rainbow order.
const CLOTHES_PALETTE = [
  '#ffd6e8', '#ffb3d6', '#ff8fc7', '#e0558f', '#c0245e', '#ff6f61', '#e05c5c', '#a83232',
  '#ffd2b0', '#ffb38a', '#f2994a', '#fff3a8', '#f2c94c', '#d9b45a', '#c8f2c0', '#8fd8a0',
  '#43b581', '#2e7d4f', '#bfe9ff', '#5cc4e0', '#5c7ce0', '#2b4a8a', '#e6dcff', '#c9a6ff',
  '#8c5ce0', '#5a3aa8', '#ffffff', '#e8e3dc', '#c9b59a', '#8a5a2b', '#9aa3ad', '#2b2b2b',
];

// Strappy high-heeled sandals seen from the front: rounded toes peek out,
// with a toe strap, a crossover strap, an ankle strap with a buckle, and a
// thin stiletto heel peeking out behind each foot.
function stilettoPumpsSVG() {
  return [[127, -1], [173, 1]].map(([cx, side]) => {
    const o = (dx) => (cx + dx * side).toFixed(1); // dx > 0 means toward the outside
    const skin = 'style="fill:var(--skin, #f1c9a5)"';
    const toes = [[-6.5, 490.6, 2.9], [-1.8, 492.6, 2.8], [2.8, 492.2, 2.5], [6.8, 490.6, 2.2], [10.2, 487.8, 1.9]];
    return `
      <ellipse cx="${cx}" cy="498" rx="15" ry="3.2" fill="#000000" opacity="0.2" stroke="none"/>
      <ellipse cx="${o(14)}" cy="498" rx="3.5" ry="1.5" fill="#000000" opacity="0.28" stroke="none"/>
      <path d="M${o(10)},466 L${o(15.2)},466 L${o(14.5)},496 L${o(13.3)},496 Z" stroke-width="0.7"/>
      <path d="M${o(13.2)},493 L${o(14.6)},493 L${o(14.5)},497.5 L${o(13.3)},497.5 Z" fill="#2b2b2b" stroke="none"/>
      <path d="M${o(-11.5)},489 Q${cx},499.5 ${o(12.8)},488 L${o(12.8)},490.8 Q${cx},502.5 ${o(-11.5)},491.8 Z" stroke-width="0.8"/>
      <path d="M${o(-10.5)},444 Q${o(-14)},462 ${o(-12.5)},478 Q${o(-11.5)},492 ${cx},495 Q${o(12.5)},492 ${o(13.5)},478 Q${o(14)},462 ${o(10.5)},444 Z" ${skin} stroke="#000000" stroke-opacity="0.18" stroke-width="1"/>
      ${toes.map(([dx, y, r]) => `<ellipse cx="${o(dx)}" cy="${y}" rx="${r}" ry="${(r * 1.05).toFixed(1)}" ${skin} stroke="#000000" stroke-opacity="0.2" stroke-width="0.7"/>
        <ellipse cx="${o(dx)}" cy="${(y + r * 0.35).toFixed(1)}" rx="${(r * 0.55).toFixed(1)}" ry="${(r * 0.45).toFixed(1)}" fill="#ff8fb1" stroke="none" opacity="0.9"/>`).join('')}
      <path d="M${o(-13.2)},474 Q${cx},479 ${o(13.8)},474 L${o(13.6)},482 Q${cx},487 ${o(-12.8)},482 Z" stroke-width="0.9"/>
      <path d="M${o(-9)},477.5 Q${cx},481 ${o(9)},477.5" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" opacity="0.5"/>
      <path d="M${o(-12)},458 L${o(-9)},455 L${o(12.8)},467 L${o(10.5)},471 Z" stroke-width="0.8"/>
      <path d="M${o(12.5)},458 L${o(9.5)},455 L${o(-12)},467 L${o(-10)},471 Z" stroke-width="0.8"/>
      <path d="M${o(-11.5)},445 Q${cx},449 ${o(11.5)},445 L${o(11.5)},450.5 Q${cx},454.5 ${o(-11.5)},450.5 Z" stroke-width="0.9"/>
      <rect x="${(cx + 7 * side - 2.2).toFixed(1)}" y="445.6" width="4.4" height="5.4" rx="1" fill="none" stroke="#f2c94c" stroke-width="1.3"/>
      <circle cx="${cx}" cy="461.5" r="1.8" fill="#ffffff" stroke="none" opacity="0.75"/>`;
  }).join('');
}

// Closed-toe heels: a rounded toe box that covers the toes, a low U-shaped
// opening where the top of the foot shows, an ankle strap with a buckle and a
// thin stiletto peeking out behind each foot.
function closedHeelsSVG() {
  return [[127, -1], [173, 1]].map(([cx, side]) => {
    const o = (dx) => (cx + dx * side).toFixed(1); // dx > 0 means toward the outside
    return `
      <ellipse cx="${cx}" cy="498" rx="15" ry="3.2" fill="#000000" opacity="0.2" stroke="none"/>
      <ellipse cx="${o(14)}" cy="498" rx="3.5" ry="1.5" fill="#000000" opacity="0.28" stroke="none"/>
      <path d="M${o(10)},466 L${o(15.2)},466 L${o(14.5)},496 L${o(13.3)},496 Z" stroke-width="0.7"/>
      <path d="M${o(13.2)},493 L${o(14.6)},493 L${o(14.5)},497.5 L${o(13.3)},497.5 Z" fill="#2b2b2b" stroke="none"/>
      <path d="M${o(-11.5)},446 Q${o(-14.5)},462 ${o(-13)},478 C${o(-13)},492 ${o(-7.5)},498 ${cx},498 C${o(7.5)},498 ${o(13.5)},492 ${o(13.5)},478 Q${o(14.5)},462 ${o(11.5)},446 Z" stroke-width="1"/>
      <path d="M${o(-10)},449 L${o(10)},449 Q${o(9.5)},462 ${cx},470 Q${o(-9.5)},462 ${o(-10)},449 Z" style="fill:var(--skin, #f1c9a5)" stroke="none"/>
      <path d="M${o(-10)},449.5 Q${o(-9.5)},462 ${cx},470 Q${o(9.5)},462 ${o(10)},449.5" fill="none" stroke="#000000" stroke-width="1.3" opacity="0.4"/>
      <path d="M${o(-2.5)},467 Q${cx},471 ${o(2.5)},467" fill="none" stroke="#000000" stroke-width="0.8" opacity="0.3"/>
      <path d="M${o(-11)},487 Q${o(-7)},497 ${cx},498 Q${o(7)},497 ${o(11.5)},487" fill="none" stroke="#000000" stroke-width="1.5" opacity="0.28"/>
      <path d="M${o(-8)},476 Q${o(-7)},487 ${o(-2)},492" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>
      <path d="M${o(-12)},454 Q${o(-13)},462 ${o(-11.8)},469" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" opacity="0.4"/>
      <path d="M${o(-11.5)},444 Q${cx},448 ${o(11.5)},444 L${o(11.5)},449.5 Q${cx},453.5 ${o(-11.5)},449.5 Z" stroke-width="0.9"/>
      <rect x="${(cx + 7 * side - 2.2).toFixed(1)}" y="444.6" width="4.4" height="5.4" rx="1" fill="none" stroke="#f2c94c" stroke-width="1.3"/>`;
  }).join('');
}

const SHOE_STYLES = [
  { id: 'heels', label: 'Open-Toe Heels', emoji: '👡', svg: stilettoPumpsSVG() },
  { id: 'closed-heels', label: 'Closed-Toe Heels', emoji: '👠', svg: closedHeelsSVG() },
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
SHOE_STYLES.push({ id: 'high-tops', label: 'High-Tops', emoji: '👟',
  svg: [0, 46].map((dx) => `
        <rect x="${104 + dx}" y="446" width="46" height="11" rx="5" fill="#ffffff" stroke="#d6d6d6" stroke-width="1"/>
        <path d="M${108 + dx},446 L${108 + dx},414 Q${110 + dx},404 ${124 + dx},404 L${132 + dx},404 Q${136 + dx},418 ${148 + dx},432 Q${152 + dx},440 ${150 + dx},446 Z"/>
        <circle cx="${116 + dx}" cy="426" r="5" fill="#ffffff" stroke="none"/>
        <path d="M${113 + dx},426 l3,-3 l3,3 l-3,3 Z" fill="#5c7ce0" stroke="none"/>
        <path d="M${124 + dx},410 L${132 + dx},412 M${125 + dx},417 L${134 + dx},420 M${127 + dx},424 L${137 + dx},428" stroke="#ffffff" stroke-width="1.6"/>
        <rect x="${108 + dx}" y="404" width="24" height="5" rx="2" fill="#ffffff" stroke="none" opacity="0.9"/>`).join('') });
SHOE_STYLES.push({ id: 'loafers', label: 'Loafers', emoji: '👞',
  svg: [127, 173].map((x) => `
        <ellipse cx="${x}" cy="456" rx="17" ry="4" fill="#000000" opacity="0.2" stroke="none"/>
        <path d="M${x - 15},452 Q${x - 16},438 ${x},436 Q${x + 16},438 ${x + 15},452 Z"/>
        <rect x="${x - 15}" y="450" width="30" height="5" rx="2" fill="#3a2a1a" stroke="none"/>
        <rect x="${x - 8}" y="440" width="16" height="4" rx="1.5" fill="#000000" opacity="0.25" stroke="none"/>
        <ellipse cx="${x}" cy="442" rx="2.4" ry="1.2" fill="#f2c94c" stroke="none"/>`).join('') });
SHOE_STYLES.push({ id: 'chunky-platforms', label: 'Chunky Platforms', emoji: '👟', theme: 'y2k',
  svg: [0, 46].map((dx) => `
        <rect x="${103 + dx}" y="444" width="48" height="18" rx="6" fill="#ffffff" stroke="#d6d6d6" stroke-width="1"/>
        <path d="M${103 + dx},452 L${151 + dx},452" stroke="#ff8fc7" stroke-width="2"/>
        <path d="M${106 + dx},444 Q${106 + dx},426 ${124 + dx},423 Q${144 + dx},421 ${150 + dx},436 Q${152 + dx},442 ${148 + dx},444 Z"/>
        <path d="M${126 + dx},430 L${142 + dx},427 M${126 + dx},435 L${144 + dx},432" stroke="#ffffff" stroke-width="1.6"/>
        <path d="M${112 + dx},436 l2,-4 l2,4 l4,1 l-4,1 l-2,4 l-2,-4 l-4,-1 Z" fill="#ffffff" stroke="none"/>`).join('') });
SHOE_STYLES.push({ id: 'gladiator-sandals', label: 'Gladiator Sandals', emoji: '🏛️', theme: 'goddess',
  svg: [127, 173].map((cx) => `
        <ellipse cx="${cx}" cy="463" rx="15" ry="3" fill="#000000" opacity="0.2" stroke="none"/>
        <ellipse cx="${cx}" cy="458" rx="14" ry="4" stroke-width="0.8"/>
        <ellipse cx="${cx}" cy="451" rx="11" ry="8" style="fill:var(--skin, #f1c9a5)" stroke="#000000" stroke-opacity="0.15" stroke-width="0.8"/>
        ${[-6, -2, 2, 6].map((dx, i) => `<circle cx="${cx + dx}" cy="${457 - Math.abs(dx) * 0.3}" r="${i === 1 ? 2.3 : 2}" style="fill:var(--skin, #f1c9a5)" stroke="#000000" stroke-opacity="0.2" stroke-width="0.6"/>`).join('')}
        <rect x="${cx - 11}" y="449" width="22" height="3.6" rx="1.6" stroke-width="0.6"/>
        ${[404, 413, 422, 431, 440].map((y) => `<rect x="${cx - 11.5}" y="${y}" width="23" height="3.6" rx="1.6" stroke-width="0.6"/>`).join('')}
        <rect x="${cx - 1.6}" y="402" width="3.2" height="50" rx="1.4" stroke-width="0.6"/>
        <circle cx="${cx}" cy="405.8" r="3" fill="#f2c94c" stroke="#c98f1f" stroke-width="0.7"/>`).join('') });
SHOE_STYLES.push({ id: 'fluffy-slippers', label: 'Fluffy Slippers', emoji: '☁️', theme: 'sleepy',
  svg: [127, 173].map((x) => `
        <ellipse cx="${x}" cy="458" rx="18" ry="5" fill="#000000" opacity="0.15" stroke="none"/>
        <ellipse cx="${x}" cy="450" rx="16" ry="9"/>
        ${Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI + (i / 8) * Math.PI;
          return `<circle cx="${(x + Math.cos(a) * 15).toFixed(1)}" cy="${(447 + Math.sin(a) * 9).toFixed(1)}" r="5" stroke="none"/>`;
        }).join('')}
        <circle cx="${x}" cy="436" r="6" fill="#ffffff" stroke="none" opacity="0.9"/>
        <circle cx="${x - 2}" cy="434" r="2" fill="#ffffff" stroke="none"/>`).join('') });
SHOE_STYLES.push({ id: 'unicorn-slippers', label: 'Unicorn Slippers', emoji: '🦄', theme: 'sleepy',
  svg: [127, 173].map((x) => `
        <ellipse cx="${x}" cy="458" rx="17" ry="5" fill="#000000" opacity="0.15" stroke="none"/>
        <path d="M${x - 2},436 L${x},418 L${x + 3},436 Z" fill="#f2c94c" stroke="#c98f1f" stroke-width="0.8"/>
        <path d="M${x - 1},430 L${x + 2},428 M${x - 1.5},425 L${x + 1.5},423" stroke="#c98f1f" stroke-width="0.8"/>
        <path d="M${x - 10},440 L${x - 13},429 L${x - 5},436 Z M${x + 10},440 L${x + 13},429 L${x + 5},436 Z"/>
        <ellipse cx="${x}" cy="448" rx="16" ry="10"/>
        <path d="M${x + 9},440 Q${x + 18},444 ${x + 15},454" fill="none" stroke="#ff8fc7" stroke-width="3" stroke-linecap="round"/>
        <path d="M${x + 11},442 Q${x + 19},448 ${x + 13},457" fill="none" stroke="#c9a6ff" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M${x - 7},446 q2,2 4,0 M${x + 3},446 q2,2 4,0" fill="none" stroke="#2b2b2b" stroke-width="1.2" stroke-linecap="round"/>
        <ellipse cx="${x - 8}" cy="450" rx="2.4" ry="1.4" fill="#ff8fa3" stroke="none" opacity="0.7"/><ellipse cx="${x + 8}" cy="450" rx="2.4" ry="1.4" fill="#ff8fa3" stroke="none" opacity="0.7"/>`).join('') });
SHOE_STYLES.push({ id: 'bear-slippers', label: 'Teddy Bear Slippers', emoji: '🧸', theme: 'sleepy',
  svg: [127, 173].map((x) => `
        <ellipse cx="${x}" cy="458" rx="17" ry="5" fill="#000000" opacity="0.15" stroke="none"/>
        <circle cx="${x - 11}" cy="438" r="5.5"/><circle cx="${x + 11}" cy="438" r="5.5"/>
        <circle cx="${x - 11}" cy="438" r="2.6" fill="#ffd6b0" stroke="none"/><circle cx="${x + 11}" cy="438" r="2.6" fill="#ffd6b0" stroke="none"/>
        <ellipse cx="${x}" cy="448" rx="16" ry="10"/>
        <ellipse cx="${x}" cy="451" rx="6" ry="4.4" fill="#ffd6b0" stroke="none"/>
        <ellipse cx="${x}" cy="449.4" rx="2" ry="1.4" fill="#3a2a1a" stroke="none"/>
        <circle cx="${x - 5.5}" cy="445" r="1.5" fill="#2b2b2b" stroke="none"/><circle cx="${x + 5.5}" cy="445" r="1.5" fill="#2b2b2b" stroke="none"/>`).join('') });
SHOE_STYLES.push({ id: 'heart-slippers', label: 'Heart Slippers', emoji: '💗', theme: 'sleepy',
  svg: [127, 173].map((x) => `
        <ellipse cx="${x}" cy="458" rx="17" ry="5" fill="#000000" opacity="0.15" stroke="none"/>
        <ellipse cx="${x}" cy="450" rx="15" ry="8.5"/>
        <path d="M${x - 15},450 Q${x},440 ${x + 15},450" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.8"/>
        <path d="M${x},450 C${x - 10},443 ${x - 9},434 ${x - 4},434.6 C${x - 2},434.8 ${x},436.6 ${x},438 C${x},436.6 ${x + 2},434.8 ${x + 4},434.6 C${x + 9},434 ${x + 10},443 ${x},450 Z" fill="#ff3b7a" stroke="#c0245e" stroke-width="1"/>
        <path d="M${x - 5},438 Q${x - 3.5},436.6 ${x - 2},437.4" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.7" stroke-linecap="round"/>`).join('') });
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
  { id: 'tinted-shades', label: 'Tinted Shades', emoji: '🕶️', theme: 'y2k', color: '#ff9a5c',
    svg: [132, 168].map((x) => `<ellipse cx="${x}" cy="90" rx="13" ry="8" fill="#ff9a5c" fill-opacity="0.55" stroke="#c9d4e2" stroke-width="1.6"/>
          <path d="M${x - 7},87 Q${x - 3},85 ${x + 1},86" fill="none" stroke="#ffffff" stroke-width="1.4" opacity="0.7" stroke-linecap="round"/>`).join('') +
      `<path d="M145,89 L155,89" stroke="#c9d4e2" stroke-width="1.6"/>
       <line x1="119" y1="89" x2="105" y2="84" stroke="#c9d4e2" stroke-width="1.6"/><line x1="181" y1="89" x2="195" y2="84" stroke="#c9d4e2" stroke-width="1.6"/>` },
  { id: 'flip-phone', label: 'Flip Phone', emoji: '📱', theme: 'y2k', color: '#ff8fc7',
    svg: `<rect x="206" y="246" width="18" height="24" rx="4" stroke="#e0458f" stroke-width="1.2"/>
          <rect x="209" y="249" width="12" height="10" rx="2" fill="#bfe9ff" stroke="none"/>
          <rect x="206" y="270" width="18" height="24" rx="4" stroke="#e0458f" stroke-width="1.2"/>
          ${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${209 + c * 4.4}" y="${274 + r * 5}" width="3" height="3" rx="1" fill="#ffffff" stroke="none"/>`).join('')).join('')}
          <path d="M224,256 q8,-2 6,8 q-2,8 4,10" fill="none" stroke="#c9a6ff" stroke-width="1.6"/>
          <circle cx="234" cy="276" r="3" fill="#f2c94c" stroke="none"/>
          <path d="M213,252 l1.5,1.5 l3,-3" fill="none" stroke="#e0458f" stroke-width="1"/>` },
  { id: 'bucket-hat', label: 'Fuzzy Bucket Hat', emoji: '👒', theme: 'y2k', color: '#c9a6ff',
    svg: `<path d="M102,60 Q100,70 92,74 Q150,86 208,74 Q200,70 198,60 Z" stroke="#9b6be0" stroke-width="1.4"/>
          <path d="M112,62 Q112,22 150,20 Q188,22 188,62 Z" stroke="#9b6be0" stroke-width="1.4"/>
          ${Array.from({ length: 14 }, (_, i) => `<circle cx="${(116 + (i % 7) * 11).toFixed(1)}" cy="${i < 7 ? 34 : 50}" r="1.6" fill="#ffffff" opacity="0.6" stroke="none"/>`).join('')}
          <path d="M146,44 l2.4,5 l5.4,0.6 l-4,3.6 l1.2,5.4 l-5,-2.8 l-5,2.8 l1.2,-5.4 l-4,-3.6 l5.4,-0.6 Z" fill="#ff8fc7" stroke="none"/>` },
  { id: 'star-clips', label: 'Star Clips', emoji: '⭐', theme: 'y2k', color: '#f2c94c',
    svg: [[116, 60, '#f2c94c'], [126, 52, '#ff8fc7'], [180, 58, '#5cc4e0'], [188, 66, '#c9a6ff']].map(([x, y, c]) =>
      `<path d="M${x},${y - 6} L${x + 1.8},${y - 1.8} L${x + 6},${y - 1.6} L${x + 2.8},${y + 1.4} L${x + 3.8},${y + 5.6} L${x},${y + 3.2} L${x - 3.8},${y + 5.6} L${x - 2.8},${y + 1.4} L${x - 6},${y - 1.6} L${x - 1.8},${y - 1.8} Z" fill="${c}" stroke="#ffffff" stroke-width="0.8"/>`).join('') },
  { id: 'baseball-cap', label: 'Baseball Cap', emoji: '🧢', color: '#e05c5c',
    svg: `<path d="M102,66 Q102,24 150,22 Q198,24 198,66 Z" stroke="#a83232" stroke-width="1.4"/>
          <path d="M150,24 L150,66 M126,28 Q122,46 120,66 M174,28 Q178,46 180,66" fill="none" stroke="#a83232" stroke-width="1" opacity="0.6"/>
          <circle cx="150" cy="23" r="3.5" stroke="#a83232" stroke-width="1"/>
          <path d="M98,66 Q150,58 202,66 Q204,80 150,82 Q96,80 98,66 Z" stroke="#a83232" stroke-width="1.4"/>
          <path d="M106,70 Q150,64 194,70" fill="none" stroke="#000000" stroke-width="1" opacity="0.2"/>
          <path d="M150,36 l3,6 l6.6,0.8 l-4.8,4.6 l1.2,6.6 l-6,-3.2 l-6,3.2 l1.2,-6.6 l-4.8,-4.6 l6.6,-0.8 Z" fill="#ffffff" stroke="none"/>` },
  { id: 'beanie', label: 'Beanie', emoji: '🧶', color: '#43b581',
    svg: `<path d="M104,66 Q102,26 150,24 Q198,26 196,66 Z" stroke="#2f8a5f" stroke-width="1.4"/>
          ${[116, 128, 140, 152, 164, 176, 188].map((x) => `<path d="M${x},32 L${x},62" stroke="#2f8a5f" stroke-width="1" opacity="0.5"/>`).join('')}
          <rect x="100" y="58" width="100" height="16" rx="6" stroke="#2f8a5f" stroke-width="1.4"/>
          ${Array.from({ length: 12 }, (_, i) => `<line x1="${106 + i * 8}" y1="60" x2="${106 + i * 8}" y2="72" stroke="#2f8a5f" stroke-width="1.2" opacity="0.6"/>`).join('')}
          <circle cx="150" cy="20" r="10" fill="#ffffff" stroke="#d6d6d6" stroke-width="1"/>` },
  { id: 'sweatband', label: 'Sports Headband', emoji: '🏃', color: '#ffffff',
    svg: `<path d="M103,70 Q150,52 197,70 L197,80 Q150,62 103,80 Z" stroke="#d6d6d6" stroke-width="1.2"/>
          <path d="M103,75 Q150,57 197,75" fill="none" stroke="#e05c5c" stroke-width="2.4"/>` },
  { id: 'off-shoulder-jacket', label: 'Off-Shoulder Jacket', emoji: '🧥', color: '#9aa3ad',
    // A grey hip-length jacket zipped up the middle, with full sleeves: the left
    // side slips off the shoulder, the right side stays on. (In the shows the arms
    // move, so the sleeves are left off there and only the jacket body is drawn.)
    svg: (bt, opts = {}) => {
      const cx = 150, sY = TORSO_Y.shoulder;
      const sh = bt.shoulderHalf, c = bt.chestHalf + 5, ax = bt.armSpread;
      const hemY = 272, hemHalf = bt.hipHalf + 10;
      const dark = '#6f7782', light = '#c9d0d8', pocket = '#b3bbc4', fluff = '#f1f3f5';
      const rU = bt.limbWidth / 2 * 1.15 + 4, rL = bt.limbWidth / 2 * 0.68 + 4;
      const arm = (side, t) => {
        const sx = side < 0 ? 125 : 175, ex = side < 0 ? 93 - ax : 207 + ax;
        return [sx + (ex - sx) * t, 168 + (272 - 168) * t];
      };
      const sleeve = (side, t0) => {
        const [x0, y0] = arm(side, t0), [x1, y1] = arm(side, 0.86), [xc, yc] = arm(side, 0.78);
        const r0 = rU + (rL - rU) * t0;
        return `<path d="${capsulePath(x0, y0, r0, x1, y1, rL)}" stroke="${dark}" stroke-width="1.4"/>
                <path d="${capsulePath(xc, yc, rL + 0.8, x1, y1, rL + 0.8)}" fill="${dark}" stroke="none"/>
                <path d="M${(x0 + x1) / 2 - side * 2},${(y0 + y1) / 2 - 10} L${(x0 + x1) / 2 + side * 2},${(y0 + y1) / 2 + 12}" stroke="${dark}" stroke-width="1" stroke-dasharray="2 3"/>`;
      };
      const offTop = arm(-1, 0.3);
      const left = `M${cx},${sY + 16}
        Q${cx - c * 0.5},${sY + 34} ${cx - c + 2},${sY + 32}
        L${offTop[0] + 6},${offTop[1] - 2}
        L${cx - c - 2},${sY + 56}
        L${cx - hemHalf},${hemY}
        L${cx},${hemY + 2} Z`;
      const right = `M${cx},${sY + 2}
        L${cx + sh + 2},${sY + 2}
        Q${cx + c + 6},${sY + 14} ${cx + c + 2},${sY + 40}
        L${cx + hemHalf},${hemY}
        L${cx},${hemY + 2} Z`;
      const fluffy = (pts) => pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${fluff}" stroke="none"/>`).join('');
      const offTrim = [0, 0.25, 0.5, 0.75, 1].map((t) => [cx + (offTop[0] - cx) * t, sY + 16 + (offTop[1] - (sY + 16)) * t + 8 * Math.sin(Math.PI * t)]);
      const onTrim = [0, 0.25, 0.5, 0.75, 1].map((t) => [cx + 6 + (sh - 4) * t, sY + 2 - 3 * Math.sin(Math.PI * t)]);
      const teeth = Array.from({ length: 14 }, (_, i) => `<line x1="${cx - 2.5}" y1="${sY + 20 + i * 7.5}" x2="${cx + 2.5}" y2="${sY + 20 + i * 7.5}" stroke="#7d8692" stroke-width="1.2"/>`).join('');
      const sleeves = opts.posed ? '' : `${sleeve(-1, 0.3)}${sleeve(1, 0)}`;
      return `${sleeves}
              <path d="${left}" stroke="${dark}" stroke-width="1.4"/>
              <path d="${right}" stroke="${dark}" stroke-width="1.4"/>
              <path d="M${cx - hemHalf},${hemY - 2} L${cx + hemHalf},${hemY - 2}" stroke="${dark}" stroke-width="6" stroke-linecap="round"/>
              <rect x="${cx - hemHalf + 8}" y="${hemY - 34}" width="16" height="12" rx="2" fill="${pocket}" stroke="${dark}" stroke-width="1"/>
              <rect x="${cx + hemHalf - 24}" y="${hemY - 34}" width="16" height="12" rx="2" fill="${pocket}" stroke="${dark}" stroke-width="1"/>
              <path d="M${cx + sh - 2},${sY + 6} Q${cx + c + 2},${sY + 16} ${cx + c},${sY + 36}" fill="none" stroke="${dark}" stroke-width="1" stroke-dasharray="2 3"/>
              <line x1="${cx}" y1="${sY + 14}" x2="${cx}" y2="${hemY}" stroke="${light}" stroke-width="3.4"/>
              ${teeth}
              <rect x="${cx - 3}" y="${sY + 24}" width="6" height="11" rx="2" fill="#e8ecf0" stroke="#7d8692" stroke-width="0.8"/>
              <circle cx="${cx}" cy="${sY + 38}" r="2.2" fill="none" stroke="#7d8692" stroke-width="1"/>
              ${fluffy(offTrim)}${fluffy(onTrim)}`;
    } },
  { id: 'goddess-wings', label: 'Goddess Wings', emoji: '🪽', theme: 'goddess', color: '#fffaf2', svg: '',
    behindSvg: `<g class="float-bob">${[[126, 1], [174, -1]].map(([rx, m]) => {
      const rows = [[130, 7, '#fffaf2', 11], [96, 8.5, '#fff3d6', 9], [62, 9.5, '#f7e1b5', 7]];
      const glow = `<ellipse cx="${150 - m * 70}" cy="150" rx="70" ry="95" fill="#fff3a8" opacity="0.22" stroke="none"/>`;
      return glow + rows.map(([len, ry, fill, n]) => Array.from({ length: n }, (_, i) => {
        const a = (218 - i * (78 / (n - 1))) * Math.PI / 180;
        const dx = Math.cos(a) * m, dy = Math.sin(a);
        const cx = rx + dx * len / 2, cy = 170 + dy * len / 2;
        const deg = Math.atan2(dy, dx) * 180 / Math.PI;
        return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${len / 2}" ry="${ry}" fill="${fill}" stroke="#d9b45a" stroke-width="1" transform="rotate(${deg.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>
          <line x1="${rx + dx * 6}" y1="${170 + dy * 6}" x2="${(rx + dx * (len - 6)).toFixed(1)}" y2="${(170 + dy * (len - 6)).toFixed(1)}" stroke="#e8c468" stroke-width="0.8" opacity="0.7"/>`;
      }).join('')).join('');
    }).join('')}</g>` },
  { id: 'laurel-crown', label: 'Golden Laurel Crown', emoji: '🌿', theme: 'goddess', color: '#f2c94c',
    svg: Array.from({ length: 12 }, (_, i) => {
      const t = 0.04 + i * 0.08, q = (a, b, c) => (1 - t) * (1 - t) * a + 2 * t * (1 - t) * b + t * t * c;
      const x = q(104, 150, 196), y = q(72, 16, 72);
      const ang = Math.atan2(2 * (1 - t) * (16 - 72) + 2 * t * (72 - 16), 2 * (1 - t) * 46 + 2 * t * 46) * 180 / Math.PI;
      const dir = t < 0.5 ? 1 : -1;
      return [35, -35].map((o) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="2.4" stroke="#c98f1f" stroke-width="0.6" transform="rotate(${(ang + o * dir).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}) translate(${4 * dir} 0)"/>`).join('');
    }).join('') + `<circle cx="150" cy="44" r="3.2" fill="#fff3a8" stroke="#c98f1f" stroke-width="0.8"/>` },
  { id: 'sun-crown', label: 'Sun Goddess Crown', emoji: '☀️', theme: 'goddess', color: '#f2c94c',
    svg: Array.from({ length: 11 }, (_, i) => {
      const a = (-160 + i * 14) * Math.PI / 180, r1 = 48, r2 = i % 2 ? 62 : 72, da = 0.07;
      const p = (r, aa) => `${(150 + r * Math.cos(aa)).toFixed(1)},${(82 + r * Math.sin(aa)).toFixed(1)}`;
      return `<path d="M${p(r1, a - da)} L${p(r2, a)} L${p(r1, a + da)} Z" stroke="#c98f1f" stroke-width="0.8"/>`;
    }).join('') + `<path d="M${(150 + 50 * Math.cos(-165 * Math.PI / 180)).toFixed(1)},${(82 + 50 * Math.sin(-165 * Math.PI / 180)).toFixed(1)} A50,50 0 0 1 ${(150 + 50 * Math.cos(-15 * Math.PI / 180)).toFixed(1)},${(82 + 50 * Math.sin(-15 * Math.PI / 180)).toFixed(1)}" fill="none" stroke="#f2c94c" stroke-width="5"/>
      <path d="M${(150 + 50 * Math.cos(-165 * Math.PI / 180)).toFixed(1)},${(82 + 50 * Math.sin(-165 * Math.PI / 180)).toFixed(1)} A50,50 0 0 1 ${(150 + 50 * Math.cos(-15 * Math.PI / 180)).toFixed(1)},${(82 + 50 * Math.sin(-15 * Math.PI / 180)).toFixed(1)}" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.6"/>
      <circle cx="150" cy="32" r="5" fill="#e05c5c" stroke="#c98f1f" stroke-width="1.2"/>
      <circle cx="148.5" cy="30.5" r="1.5" fill="#ffffff" opacity="0.8"/>` },
  { id: 'gold-collar', label: 'Goddess Gold Collar', emoji: '📿', theme: 'goddess', color: '#f2c94c',
    svg: `<path d="M126,150 Q150,164 174,150 L180,157 Q150,186 120,157 Z" stroke="#c98f1f" stroke-width="1"/>
          <path d="M124,155 Q150,176 176,155" fill="none" stroke="#c98f1f" stroke-width="0.8"/>
          ${[132, 141, 150, 159, 168].map((x, i) => `<circle cx="${x}" cy="${(166 - Math.abs(x - 150) * 0.22).toFixed(1)}" r="2.3" fill="${['#5cc4e0', '#e05c5c', '#43b581', '#e05c5c', '#5cc4e0'][i]}" stroke="#ffffff" stroke-width="0.5"/>`).join('')}
          ${[136, 150, 164].map((x) => `<path d="M${x},${x === 150 ? 174 : 171} q-2.4,4 0,6.5 q2.4,-2.5 0,-6.5 Z" stroke="#c98f1f" stroke-width="0.6"/>`).join('')}` },
  { id: 'moon-staff', label: 'Moon Staff', emoji: '🌙', theme: 'goddess', color: '#d9b45a',
    svg: (bt) => {
      const x = 210 + bt.armSpread;
      return `<line x1="${x}" y1="122" x2="${x}" y2="478" stroke="#b8923a" stroke-width="4.5" stroke-linecap="round"/>
        <line x1="${x - 1}" y1="126" x2="${x - 1}" y2="474" stroke="#fff3a8" stroke-width="1" opacity="0.6"/>
        <circle cx="${x}" cy="104" r="20" fill="#fff3a8" opacity="0.3" stroke="none"/>
        <path d="M${x + 4},90 A15,15 0 1,0 ${x + 4},118 A18,18 0 0,1 ${x + 4},90 Z" fill="#fff3a8" stroke="#c98f1f" stroke-width="1"/>
        <circle cx="${x}" cy="122" r="3.4" fill="#c9a6ff" stroke="#8c5ce0" stroke-width="0.8"/>
        <path d="M${x + 12},84 l1.2,3 l3,1.2 l-3,1.2 l-1.2,3 l-1.2,-3 l-3,-1.2 l3,-1.2 Z" fill="#ffffff" stroke="none"/>`;
    } },
  { id: 'vip-crown', label: 'VIP Diamond Crown', emoji: '👑', vip: true, color: '#f2c94c',
    svg: `<path d="M112,58 L116,30 L130,46 L140,22 L150,40 L160,22 L170,46 L184,30 L188,58 Q150,50 112,58 Z" stroke="#c98f1f" stroke-width="1.2"/>
          <path d="M112,58 Q150,50 188,58 L188,64 Q150,56 112,64 Z" fill="#c98f1f" stroke="none"/>
          ${[[116, 30], [140, 22], [160, 22], [184, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#ffffff" stroke="#c9d4e2" stroke-width="0.8"/>`).join('')}
          <path d="M150,42 l6,7 l-6,7 l-6,-7 Z" fill="#d6f0ff" stroke="#ffffff" stroke-width="1"/>
          ${[128, 172].map((x) => `<path d="M${x},50 l3,4 l-3,4 l-3,-4 Z" fill="#ff8fc7" stroke="#ffffff" stroke-width="0.6"/>`).join('')}` },
  { id: 'vip-shades', label: 'VIP Gold Shades', emoji: '😎', vip: true, color: '#f2c94c',
    svg: `${[132, 168].map((x) => `<path d="M${x - 13},84 L${x + 13},84 Q${x + 13},98 ${x},98 Q${x - 13},98 ${x - 13},84 Z" fill="#1a1a1a" stroke="#f2c94c" stroke-width="2"/>
            <path d="M${x - 8},87 L${x - 2},87" stroke="#ffffff" stroke-width="1.4" opacity="0.6" stroke-linecap="round"/>`).join('')}
          <path d="M145,86 Q150,82 155,86" fill="none" stroke="#f2c94c" stroke-width="2"/>
          <line x1="119" y1="86" x2="105" y2="82" stroke="#f2c94c" stroke-width="2"/><line x1="181" y1="86" x2="195" y2="82" stroke="#f2c94c" stroke-width="2"/>
          <path d="M180,84 l2,2.5 l-2,2.5 l-2,-2.5 Z" fill="#ffffff" stroke="none"/>` },
  { id: 'vip-badge', label: 'VIP Pass Badge', emoji: '🎫', vip: true, color: '#f2c94c',
    svg: `<path d="M134,150 L146,196 M166,150 L154,196" stroke="#c0245e" stroke-width="3.4" fill="none"/>
          <rect x="136" y="194" width="28" height="36" rx="4" fill="#1a1a1a" stroke="#f2c94c" stroke-width="2"/>
          <text x="150" y="210" font-size="9" font-weight="900" text-anchor="middle" fill="#f2c94c" stroke="none" font-family="Arial Black, Arial, sans-serif">VIP</text>
          <path d="M150,214 l1.6,3.4 l3.6,0.4 l-2.7,2.4 l0.8,3.6 l-3.3,-1.9 l-3.3,1.9 l0.8,-3.6 l-2.7,-2.4 l3.6,-0.4 Z" fill="#f2c94c" stroke="none"/>` },
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

const EYESHADOW_COLORS = ['#c9a6ff', '#ff8fc7', '#5cc4e0', '#f2c94c', '#43b581', '#d9a98c', '#9b6be0', '#f7e1b5', '#d4a017', '#8a5a2b', '#c0245e', '#2b4a8a', '#2b2b2b'];
const BLUSH_COLORS = ['#ff8fa3', '#ff6f91', '#ffb38a', '#e0558f', '#c9a6ff', '#d9826b', '#ffa8c5'];
const SALON_LIP_COLORS = ['#d9a98c', '#f2a7a0', '#c9707d', '#b5655a', '#c0293b', '#a83232', '#e0558f', '#e8836b', '#ff8a5c', '#8c4a6b', '#5a2a3a', '#9b6be0', '#ff6fb0'];
const LINER_COLORS = ['#1a1a1a', '#5a3825', '#2b4a8a', '#d4a017', '#8c5ce0', '#43b581', '#ffffff'];
const HIGHLIGHT_COLORS = ['#fff6e8', '#f7e1b5', '#f2c94c', '#ffc6d9', '#d6f0ff'];
const SHADOW_STYLES = [
  { id: 'soft', label: 'Soft Blend', emoji: '🌫️' },
  { id: 'smoky', label: 'Smoky', emoji: '🖤' },
  { id: 'crease', label: 'Cut Crease', emoji: '✂️' },
  { id: 'wing', label: 'Winged', emoji: '🪽' },
  { id: 'shimmer', label: 'Shimmer', emoji: '✨' },
];
const LINER_STYLES = [
  { id: 'none', label: 'None', emoji: '○' },
  { id: 'thin', label: 'Thin', emoji: '✏️' },
  { id: 'bold', label: 'Bold', emoji: '🖊️' },
  { id: 'wing', label: 'Winged', emoji: '🪽' },
  { id: 'cat', label: 'Cat-Eye', emoji: '🐱' },
];
const LIP_SHAPES = [
  { id: 'line', label: 'Natural', emoji: '🙂' },
  { id: 'full', label: 'Full Lips', emoji: '👄' },
];
const LIP_FINISHES = [
  { id: 'satin', label: 'Satin', emoji: '🎀' },
  { id: 'matte', label: 'Matte', emoji: '🧱' },
  { id: 'gloss', label: 'Gloss', emoji: '💧' },
  { id: 'shimmer', label: 'Shimmer', emoji: '✨' },
];
const CHEEK_ART = [
  { id: 'none', label: 'None', emoji: '○' },
  { id: 'heart', label: 'Heart', emoji: '💗' },
  { id: 'star', label: 'Star', emoji: '⭐' },
  { id: 'rainbow', label: 'Rainbow', emoji: '🌈' },
  { id: 'butterfly', label: 'Butterfly', emoji: '🦋' },
];

// Soft, blended makeup drawn under the eyes: contour shading and layered eyeshadow.
function makeupUnderSVG(face) {
  let out = '';
  if (face.contour) {
    out += [[118, 1], [182, -1]].map(([x, k]) => `<ellipse cx="${x}" cy="104" rx="11" ry="3.4" fill="#7a4a2e" opacity="0.1" transform="rotate(${30 * k} ${x} 104)"/>
      <ellipse cx="${x}" cy="104" rx="7" ry="2" fill="#7a4a2e" opacity="0.1" transform="rotate(${30 * k} ${x} 104)"/>`).join('')
      + `<path d="M145,84 Q144,92 145.5,99 M155,84 Q156,92 154.5,99" fill="none" stroke="#7a4a2e" stroke-width="1.6" opacity="0.1" stroke-linecap="round"/>`;
  }
  if (!face.eyeshadow) return out;
  const c = face.eyeshadow, d = darken(c, 0.35), st = face.shadowStyle || 'soft';
  const lid = EYE_LID[face.eyeShape] || EYE_LID.round;
  const top = lid.cy - lid.ry;
  return out + [[132, -1], [168, 1]].map(([cx, side]) => {
    const outer = cx + side * lid.rx;
    if (st === 'smoky') {
      return `<ellipse cx="${cx + side * 1.5}" cy="${top + 1}" rx="${lid.rx + 5}" ry="${lid.ry + 4}" fill="${d}" opacity="0.28"/>
        <ellipse cx="${cx + side}" cy="${top + 2}" rx="${lid.rx + 2.5}" ry="${lid.ry + 1.5}" fill="${d}" opacity="0.42"/>
        <ellipse cx="${cx}" cy="${lid.cy + lid.ry * 0.9}" rx="${lid.rx + 1}" ry="2.4" fill="${d}" opacity="0.32"/>`;
    }
    if (st === 'crease') {
      return `<ellipse cx="${cx}" cy="${top + 1.5}" rx="${lid.rx + 2}" ry="${lid.ry * 0.8 + 1.5}" fill="${c}" opacity="0.6"/>
        <path d="M${cx - lid.rx - 3},${lid.cy - 1} Q${cx},${top - 8} ${cx + lid.rx + 3},${lid.cy - 1}" fill="none" stroke="${d}" stroke-width="2" opacity="0.6" stroke-linecap="round"/>
        <ellipse cx="${cx}" cy="${top - 0.5}" rx="3" ry="1.5" fill="#ffffff" opacity="0.6"/>`;
    }
    let s = `<ellipse cx="${cx + side}" cy="${top + 1}" rx="${lid.rx + 5}" ry="${lid.ry + 3.5}" fill="${c}" opacity="0.18"/>
        <ellipse cx="${cx + side * 0.5}" cy="${top + 1.5}" rx="${lid.rx + 3}" ry="${lid.ry + 1.5}" fill="${c}" opacity="0.28"/>
        <ellipse cx="${cx}" cy="${top + 2}" rx="${lid.rx + 1}" ry="${lid.ry * 0.8}" fill="${c}" opacity="0.34"/>`;
    if (st === 'wing') s += `<path d="M${outer},${lid.cy - 1} L${outer + side * 8},${lid.cy - 6.5} L${outer - side * 1},${top - 2} Z" fill="${c}" opacity="0.55"/>`;
    if (st === 'shimmer') s += [[-4, -1.5], [0, -3], [4, -2], [-1.5, -4.5], [3, -5]].map(([x, y]) => `<circle cx="${cx + x}" cy="${top + y}" r="0.7" fill="#ffffff" opacity="0.95"/>`).join('');
    return s;
  }).join('');
}

// Eyeliner along the upper lash line, with optional wings.
function linerSVG(face, cx, side) {
  const st = face.liner;
  if (!st || st === 'none' || face.eyeShape === 'closed') return '';
  const lid = EYE_LID[face.eyeShape] || EYE_LID.round;
  const c = face.linerColor || '#1a1a1a';
  const inner = cx - side * lid.rx, outer = cx + side * lid.rx, cy = lid.cy;
  let s = `<path d="M${inner},${cy} Q${cx},${cy - 2 * lid.ry} ${outer},${cy}" fill="none" stroke="${c}" stroke-width="${st === 'thin' ? 1.1 : 1.9}" stroke-linecap="round"/>`;
  if (st === 'wing' || st === 'cat') {
    const L = st === 'cat' ? 8.5 : 5.5, H = st === 'cat' ? 6.5 : 4.5;
    s += `<path d="M${outer - side * 2.5},${(cy - lid.ry * 0.72).toFixed(1)} L${outer + side * L},${cy - H} L${outer},${cy + 0.4} Z" fill="${c}"/>`;
  }
  if (st === 'cat') s += `<path d="M${cx},${cy + lid.ry} Q${cx + side * lid.rx * 0.7},${cy + lid.ry * 0.9} ${outer + side},${cy}" fill="none" stroke="${c}" stroke-width="1" opacity="0.85"/>`;
  return s;
}

// Realistic full lips with a cupid's bow, in different finishes.
function lipsSVG(face) {
  const c = face.lipColor || '#c9707d', d = darken(c, 0.3), l = lighten(c, 0.35);
  const neutral = face.mouth === 'neutral';
  const y0 = neutral ? 110 : 108, dip = neutral ? 1 : 8;
  const finish = face.lipFinish || (face.gloss ? 'gloss' : 'satin');
  let s = `<path d="M127,${y0} Q137,${y0 - 4.5} 145,${y0 - 3} Q150,${y0 - 1.2} 155,${y0 - 3} Q163,${y0 - 4.5} 173,${y0} Q150,${y0 + dip} 127,${y0} Z" fill="${d}"/>
    <path d="M127,${y0} Q150,${y0 + dip} 173,${y0} Q165,${y0 + dip / 2 + 7} 150,${y0 + dip / 2 + 7.5} Q135,${y0 + dip / 2 + 7} 127,${y0} Z" fill="${c}"/>
    <path d="M127,${y0} Q150,${y0 + dip} 173,${y0}" fill="none" stroke="${darken(c, 0.5)}" stroke-width="1" opacity="0.7" stroke-linecap="round"/>`;
  const ly = y0 + dip / 2 + 4;
  if (finish === 'satin') s += `<ellipse cx="150" cy="${ly}" rx="6" ry="1.4" fill="${l}" opacity="0.45"/>`;
  if (finish === 'gloss') s += `<ellipse cx="150" cy="${ly}" rx="6" ry="1.6" fill="#ffffff" opacity="0.85"/><ellipse cx="141" cy="${y0 - 1.5}" rx="2.2" ry="0.8" fill="#ffffff" opacity="0.6"/>`;
  if (finish === 'shimmer') s += [[-8, 3], [-3, 4.5], [3, 4], [8, 2.5], [-5, -1], [5, -1]].map(([x, y]) => `<circle cx="${150 + x}" cy="${y0 + y + (y > 0 ? dip / 2 : 0)}" r="0.7" fill="#ffffff" opacity="0.95"/>`).join('');
  return s;
}

// Highlighter glow on the cheekbones, nose and cupid's bow.
function highlightSVG(face) {
  const h = face.highlight;
  if (!h) return '';
  return `${[[123, -15], [177, 15]].map(([x, r]) => `<ellipse cx="${x}" cy="97.5" rx="6" ry="2.4" fill="${h}" opacity="0.35" transform="rotate(${r} ${x} 97.5)"/>
      <ellipse cx="${x}" cy="97.5" rx="3.5" ry="1.3" fill="${h}" opacity="0.55" transform="rotate(${r} ${x} 97.5)"/>`).join('')}
    ${[[128, 82], [172, 82]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="1.1" fill="${h}" opacity="0.4"/>`).join('')}
    <path d="M150,85 L150,96" stroke="${h}" stroke-width="1.8" opacity="0.45" stroke-linecap="round"/>
    <circle cx="150" cy="104.6" r="1.2" fill="${h}" opacity="0.6"/>`;
}

// Little golden goddess face gems along the outer eyes.
function faceGemsSVG() {
  return [[132, -1], [168, 1]].map(([cx, side]) => [[9, 97.5, 1.2], [11.6, 94.2, 1], [13.2, 90.6, 0.85], [13.4, 86.8, 0.7]].map(([dx, y, r]) =>
    `<circle cx="${cx + side * dx}" cy="${y}" r="${r}" fill="#f2c94c" stroke="#c98f1f" stroke-width="0.3"/><circle cx="${cx + side * dx - 0.3}" cy="${y - 0.3}" r="${r * 0.35}" fill="#ffffff"/>`).join('')).join('')
    + `<path d="M150,70.5 L152,73 L150,75.5 L148,73 Z" fill="#f2c94c" stroke="#c98f1f" stroke-width="0.4"/>`;
}

function makeupOverSVG(face) {
  let out = highlightSVG(face);
  if (face.gems) out += faceGemsSVG();
  if (face.gloss && face.mouth !== 'surprised' && !(face.lipShape === 'full' && (face.mouth === 'smile' || face.mouth === 'neutral'))) {
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
  shadowStyle: 'soft',
  liner: 'none',
  linerColor: '#1a1a1a',
  lipShape: 'line',
  lipFinish: 'satin',
  highlight: null,
  contour: false,
  gems: false,
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
    ${face.blush ? [130, 170].map((x) => [[11, 7.5, 0.14], [8.5, 5.8, 0.17], [6, 4, 0.2]].map(([rx, ry, o]) => `<ellipse cx="${x}" cy="104" rx="${rx}" ry="${ry}" fill="${face.blushColor || '#ff8fa3'}" opacity="${o}"/>`).join('')).join('') : ''}
    ${makeupUnderSVG(face)}
    ${face.freckles ? frecklesSVG() : ''}
    <path d="M147,97 Q150,101 148,102.5" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="1.2" stroke-linecap="round"/>
    ${eyeShapeSVG(face.eyeShape, 132, -1, face.eyeColor)}
    ${eyeShapeSVG(face.eyeShape, 168, 1, face.eyeColor)}
    ${linerSVG(face, 132, -1)}
    ${linerSVG(face, 168, 1)}
    ${lashesSVG(face.lashes, face.eyeShape, 132, -1)}
    ${lashesSVG(face.lashes, face.eyeShape, 168, 1)}
    ${eyebrowSVG(face.eyebrowShape, 132, hairColor)}
    ${eyebrowSVG(face.eyebrowShape, 168, hairColor)}
    ${face.lipShape === 'full' && (face.mouth === 'smile' || face.mouth === 'neutral') ? lipsSVG(face) : mouthSVG(face.mouth, face.lipColor)}
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
  { id: 'cyber-dream', label: 'Cyber Dream', emoji: '💿', theme: 'y2k', ambient: 'sparkle', decor: 'y2k',
    gradient: 'linear-gradient(180deg, #a8e6ff 0%, #d6c8ff 45%, #ffc6e8 100%)' },
  { id: 'bubblegum-chrome', label: 'Bubblegum Chrome', emoji: '🫧', theme: 'y2k', ambient: 'bubbles',
    gradient: 'linear-gradient(135deg, #ff9fd6 0%, #ffd6ef 30%, #e8eef6 50%, #c8f0ff 70%, #b49fff 100%)' },
  { id: 'olympus', label: 'Mount Olympus', emoji: '🏛️', theme: 'goddess', ambient: 'sparkle', decor: 'temple',
    gradient: 'linear-gradient(180deg, #ffe9b8 0%, #fff4dc 40%, #e3f1ff 100%)' },
  { id: 'moon-temple', label: 'Moonlit Temple', emoji: '🌙', theme: 'goddess', ambient: 'sparkle', decor: 'temple',
    gradient: 'linear-gradient(180deg, #121a3d 0%, #2b3a7a 55%, #6a5cb8 100%)' },
  { id: 'vip-lounge', label: 'VIP Lounge', emoji: '🥂', vip: true, ambient: 'sparkle', decor: 'vip',
    gradient: 'linear-gradient(180deg, #3a0d1e 0%, #6b1430 55%, #2b0a16 100%)' },
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
  "Totally Y2K! That look is so iconic! 💿",
  "A true goddess! Mount Olympus is bowing! 🏛️",
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
      outfit: { style: 'nightgown', color: '#5cc4e0' }, shoes: { style: 'unicorn-slippers', color: '#ffffff' },
      accessories: { 'sleeping-mask': true }, background: 'dreamland', face: { eyeShape: 'closed', lashes: 'long' } } },
  { id: 'spa-night', label: 'Spa Night', theme: 'sleepy',
    look: { bodyType: 'masculine', skin: SKIN_TONES[1], hair: { style: 'crop', color: '#8a5a2b' },
      outfit: { style: 'cozy-pajamas', color: '#43b581' }, shoes: { style: 'bear-slippers', color: '#a8763f' },
      accessories: { 'clay-mask': true }, background: 'cozy-bedroom', face: { eyeShape: 'closed' } } },
  { id: 'y2k-icon', label: 'Y2K Icon', theme: 'y2k',
    look: { bodyType: 'feminine', skin: SKIN_TONES[2], hair: { style: 'flippy-bob', color: '#d9b45a' },
      outfit: { style: 'butterfly-flares', color: '#ff6fb0' }, shoes: { style: 'chunky-platforms', color: '#ff8fc7' },
      accessories: { 'tinted-shades': true, 'flip-phone': true, 'star-clips': true }, background: 'cyber-dream',
      face: { lipColor: '#e0558f', lashes: 'long' } } },
  { id: 'chrome-cutie', label: 'Chrome Cutie', theme: 'y2k',
    look: { bodyType: 'neutral', skin: SKIN_TONES[4], hair: { style: 'space-buns', color: '#8c5ce0' },
      outfit: { style: 'chrome-dress', color: '#dfe6ee' }, shoes: { style: 'chunky-platforms', color: '#ffffff' },
      accessories: { 'bucket-hat': false, 'flip-phone': true }, background: 'bubblegum-chrome', face: { mouth: 'grin' } } },
  { id: 'y2k-chill', label: 'Y2K Chill', theme: 'y2k',
    look: { bodyType: 'masculine', skin: SKIN_TONES[1], hair: { style: 'crop', color: '#2b2b2b' },
      outfit: { style: 'denim-skirt-tee', color: '#5cc4e0' }, shoes: { style: 'chunky-platforms', color: '#5cc4e0' },
      accessories: { 'bucket-hat': true, 'tinted-shades': true }, background: 'cyber-dream' } },
  { id: 'skate-park', label: 'Skate Park', theme: 'classic',
    look: { bodyType: 'masculine', skin: SKIN_TONES[3], hair: { style: 'spiky', color: '#2b2b2b' },
      outfit: { style: 'hoodie-joggers', color: '#5c7ce0' }, shoes: { style: 'high-tops', color: '#2b2b2b' },
      accessories: { beanie: false }, background: 'spring', face: { mouth: 'grin', eyebrowShape: 'thick' } } },
  { id: 'game-day', label: 'Game Day', theme: 'classic',
    look: { bodyType: 'masculine', skin: SKIN_TONES[5], hair: { style: 'buzz', color: '#2b2b2b' },
      outfit: { style: 'jersey-shorts', color: '#e05c5c' }, shoes: { style: 'high-tops', color: '#e05c5c' },
      accessories: { sweatband: true }, background: 'gold', face: { mouth: 'grin' } } },
  { id: 'campus-cool', label: 'Campus Cool', theme: 'classic',
    look: { bodyType: 'masculine', skin: SKIN_TONES[1], hair: { style: 'side-part', color: '#8a5a2b' },
      outfit: { style: 'varsity-jacket', color: '#2b4a8a' }, shoes: { style: 'loafers', color: '#7a5230' },
      accessories: {}, background: 'night', face: { eyebrowShape: 'straight' } } },
  { id: 'cozy-weekend', label: 'Cozy Weekend', theme: 'classic',
    look: { bodyType: 'neutral', skin: SKIN_TONES[2], hair: { style: 'curly-top', color: '#4b2e1e' },
      outfit: { style: 'flannel-chinos', color: '#c0392b' }, shoes: { style: 'boots', color: '#8a5a2b' },
      accessories: { 'baseball-cap': false }, background: 'spring', face: { mouth: 'smile' } } },
  { id: 'mall-day', label: 'Mall Day', theme: 'y2k',
    look: { bodyType: 'feminine', skin: SKIN_TONES[1], hair: { style: 'half-up', color: '#4b2e1e', bangs: 'curtain' },
      outfit: { style: 'low-rise-jeans', color: '#c9a6ff' }, shoes: { style: 'chunky-platforms', color: '#ffffff' },
      accessories: { 'off-shoulder-jacket': true, 'tinted-shades': true }, background: 'bubblegum-chrome', face: { lashes: 'natural', lipColor: '#e0558f' } } },
  { id: 'seaside-stripes', label: 'Seaside Stripes', theme: 'classic',
    look: { bodyType: 'neutral', skin: SKIN_TONES[3], hair: { style: 'bob', color: '#2b2b2b', bangs: 'straight' },
      outfit: { style: 'striped-shirt', color: '#2b4a8a' }, shoes: { style: 'flats', color: '#e05c5c' },
      accessories: { beret: false }, background: 'spring', face: { mouth: 'grin' } } },
  { id: 'golden-goddess-look', label: 'Golden Goddess', theme: 'goddess',
    look: { bodyType: 'feminine', skin: SKIN_TONES[3], hair: { style: 'goddess-waves', color: '#2b2b2b' },
      outfit: { style: 'grecian-gown', color: '#fffaf2' }, shoes: { style: 'gladiator-sandals', color: '#f2c94c' },
      accessories: { 'laurel-crown': true, 'gold-collar': true, 'goddess-wings': true }, background: 'olympus',
      face: { eyeshadow: '#d4a017', shadowStyle: 'shimmer', liner: 'wing', linerColor: '#1a1a1a', lashes: 'long', highlight: '#f2c94c', contour: true, lipColor: '#b5655a', lipShape: 'full', lipFinish: 'gloss', gems: true } } },
  { id: 'moon-goddess-look', label: 'Moon Goddess', theme: 'goddess',
    look: { bodyType: 'neutral', skin: SKIN_TONES[1], hair: { style: 'long', color: '#e8e3dc' },
      outfit: { style: 'grecian-gown', color: '#5c7ce0' }, shoes: { style: 'gladiator-sandals', color: '#c9d4e2' },
      accessories: { 'moon-staff': true }, background: 'moon-temple',
      face: { eyeshadow: '#5c7ce0', shadowStyle: 'smoky', liner: 'cat', linerColor: '#2b4a8a', lashes: 'glam', highlight: '#d6f0ff', lipColor: '#8c4a6b', lipShape: 'full', lipFinish: 'shimmer' } } },
  { id: 'olympian-look', label: 'Olympian', theme: 'goddess',
    look: { bodyType: 'masculine', skin: SKIN_TONES[4], hair: { style: 'crop', color: '#2b2b2b' },
      outfit: { style: 'goddess-tunic', color: '#ffffff' }, shoes: { style: 'gladiator-sandals', color: '#8a5a2b' },
      accessories: { 'laurel-crown': true }, background: 'olympus', face: { highlight: '#f7e1b5', contour: true } } },
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

// ---------- VIP membership ($200) ----------
const VIP_ID = 'vip-membership';
const VIP_PRICE = 200;
const VIP_DAILY_BONUS = 25;
const VIP_BONUS_KEY = 'runwayReady.vipBonusDay';
function isVip() { return owned.has(VIP_ID); }
function vipUnlocked(item) { return !item.vip || isVip(); }

function isUnlocked(item) {
  return levelUnlocked(item) && isOwned(item) && passUnlocked(item) && vipUnlocked(item);
}

function renderCash() {
  document.getElementById('cash-badge').textContent = `${isVip() ? '👑 VIP · ' : ''}💵 $${cash}`;
  const shopCash = document.getElementById('shop-cash');
  if (shopCash) shopCash.textContent = `💵 $${cash}`;
  const exCash = document.getElementById('ex-cash');
  if (exCash) exCash.textContent = `💵 $${cash}`;
  const olCash = document.getElementById('ol-cash');
  if (olCash) olCash.textContent = `💵 $${cash}`;
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
  outfit: { style: 'basics', color: '#2b2b2b' },
  shoes: { style: 'heels', color: SHOE_COLORS[0] },
  accessories: Object.fromEntries(ACCESSORIES.map((a) => [a.id, false])),
  pet: { species: 'none', color: '#c68642', accessory: 'none' },
  background: 'pink',
  extras: [],
  nails: [null, null, null, null, null],
  nailArt: [[], [], [], [], []],
  nailTopCoat: false,
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
      + (unlocked ? '' : !vipUnlocked(item)
        ? '<span class="lock-badge">👑 VIP only</span>'
        : !isOwned(item)
        ? `<span class="lock-badge">🛍️ $${item.price} in Shop</span>`
        : !passUnlocked(item)
          ? `<span class="lock-badge">🎟️ ${passDef.label}${passOwned(item.pass) ? ` · Tier ${item.passTier}` : ''}</span>`
          : `<span class="lock-badge">🔒 Lvl ${item.unlockLevel}</span>`);
    if (unlocked) {
      btn.addEventListener('click', () => onPick(item.id));
    } else if (!vipUnlocked(item)) {
      btn.classList.add('shop-locked');
      btn.title = `${item.label} is for VIP members. Join VIP for $${VIP_PRICE}!`;
      btn.addEventListener('click', () => openVip());
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

function paintTargetPiece(c) {
  const t = colorTargetPiece();
  if (t) t.color = c;
  render();
}
buildSwatches(document.getElementById('outfit-colors'), CLOTHES_PALETTE, paintTargetPiece);
// 🌈 Any colour: the device's own colour picker.
const customColor = document.getElementById('outfit-custom-color');
customColor.addEventListener('input', (e) => paintTargetPiece(e.target.value));

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

let colorTarget = null;

function wornPieceList() {
  return [state.outfit, ...(state.extras || [])].filter((pc) => pc && pc.style && pc.style !== 'basics');
}

function setWornPieceList(list) {
  state.outfit = list[0] || { style: 'basics', color: '#2b2b2b' };
  state.extras = list.slice(1);
}

function colorTargetPiece() {
  const list = wornPieceList();
  return list.find((pc) => pc.style === colorTarget) || list[list.length - 1];
}

// Tap a piece to put it on (it replaces a piece of the same kind) or, if you're
// already wearing it, to take it off. Up to 3 pieces: a full outfit, a top and a bottom.
function pickPiece(id) {
  const def = OUTFIT_STYLES.find((o) => o.id === id);
  let list = wornPieceList();
  const at = list.findIndex((pc) => pc.style === id);
  if (at >= 0) {
    if (colorTarget !== id) { colorTarget = id; render(); return; }
    list.splice(at, 1);
    setWornPieceList(list);
    colorTarget = list.length ? list[list.length - 1].style : null;
    render();
    return;
  }
  // Layering: any mix of tops, bottoms and full outfits, up to 3 pieces.
  // The newest piece goes on top of its kind; a 4th piece bumps the oldest one off.
  const ctp = colorTargetPiece();
  const color = ctp ? ctp.color : OUTFIT_COLORS[0];
  let bumped = null;
  const kind = pieceKind(def);
  const sameKind = list.filter((pc) => pieceKind(OUTFIT_STYLES.find((o) => o.id === pc.style)) === kind);
  if (sameKind.length >= MAX_PIECES) {
    bumped = sameKind[0];
    list = list.filter((pc) => pc !== bumped);
  }
  list.push({ style: id, color });
  setWornPieceList(list);
  colorTarget = id;
  render();
  if (bumped) {
    const bdef = OUTFIT_STYLES.find((o) => o.id === bumped.style);
    pieceMessage(`3 ${KIND_LABELS[pieceKind(def)].name} max! Took off the ${bdef.emoji} ${bdef.label} to make room.`);
  }
}

let pieceMsgTimer = null;
function pieceMessage(text) {
  const el = document.getElementById('piece-msg');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(pieceMsgTimer);
  pieceMsgTimer = setTimeout(() => { el.hidden = true; }, 3000);
}

// ---------- Clothes on hangers ----------
// Each piece is drawn as a little garment hanging on a hanger (tops and dresses)
// or a clip hanger (bottoms and skirts). Tap the hanger to put it on.
const HANGER_COLORS = ['#e0558f', '#8c5ce0', '#5cc4e0', '#43b581', '#f2994a', '#e05c5c', '#ff8fc7'];
const HANGER_BODY = { id: 'hanger', shoulderHalf: 34, chestHalf: 36, waistHalf: 26, hipHalf: 36, limbWidth: 22, armSpread: 0 };
const HANGER_VIEW = { top: '62 108 176 170', full: '30 108 240 400', bottom: '34 182 232 290' };

function hangerColorFor(def, i) {
  const worn = wornPieceList().find((pc) => pc.style === def.id);
  return worn ? worn.color : HANGER_COLORS[i % HANGER_COLORS.length];
}

function hangerSVG(def, color) {
  const kind = pieceKind(def);
  const body = typeof def.svg === 'function' ? def.svg(HANGER_BODY) : def.svg;
  const gid = `hg-${def.id}`;
  const metal = '#a8a29a';
  const fill = def.fixedColor ? 'none' : `url(#${gid})`;
  const grad = def.fixedColor ? '' : `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${lighten(color, 0.4)}"/><stop offset="55%" stop-color="${color}"/><stop offset="100%" stop-color="${darken(color, 0.3)}"/></linearGradient></defs>`;
  if (kind === 'bottom') {
    const y = 204;
    return `<svg viewBox="${HANGER_VIEW.bottom}" xmlns="http://www.w3.org/2000/svg">${grad}
      <path d="M150,${y - 20} q8,0 8,-7 q0,-7 -8,-7" fill="none" stroke="${metal}" stroke-width="3.4" stroke-linecap="round"/>
      <line x1="150" y1="${y - 20}" x2="150" y2="${y - 4}" stroke="${metal}" stroke-width="3.4"/>
      <line x1="94" y1="${y - 4}" x2="206" y2="${y - 4}" stroke="${metal}" stroke-width="5" stroke-linecap="round"/>
      <g fill="${fill}">${body}</g>
      <rect x="112" y="${y - 6}" width="10" height="14" rx="2" fill="#c9c3bb" stroke="${metal}" stroke-width="1"/>
      <rect x="178" y="${y - 6}" width="10" height="14" rx="2" fill="#c9c3bb" stroke="${metal}" stroke-width="1"/>
    </svg>`;
  }
  const y = 150;
  return `<svg viewBox="${HANGER_VIEW[kind] || HANGER_VIEW.full}" xmlns="http://www.w3.org/2000/svg">${grad}
    <path d="M150,${y - 8} L104,${y + 8} Q97,${y + 12} 104,${y + 13} L196,${y + 13} Q203,${y + 12} 196,${y + 8} Z" fill="none" stroke="${metal}" stroke-width="4" stroke-linejoin="round"/>
    <g fill="${fill}">${body}</g>
    <path d="M150,${y - 8} L150,${y - 18} q0,-8 8,-8 q8,0 8,7" fill="none" stroke="${metal}" stroke-width="3.4" stroke-linecap="round"/>
  </svg>`;
}

function buildHangerRack(container, items) {
  buildOptionButtons(container, items, pickPiece);
  container.classList.add('hanger-rack');
  container.querySelectorAll('.option-btn').forEach((btn, i) => {
    const def = items.find((it) => it.id === btn.dataset.id);
    if (!def) return;
    btn.classList.add('hanger-btn');
    const pic = document.createElement('span');
    pic.className = 'hanger-pic';
    pic.innerHTML = hangerSVG(def, hangerColorFor(def, i));
    const emoji = btn.querySelector('.emoji');
    if (emoji) emoji.replaceWith(pic);
    btn.setAttribute('aria-label', def.label);
  });
}

// Keep the hanger pictures in the colours you picked for the pieces you're wearing.
function refreshHangerColors() {
  wornPieceList().forEach((pc) => {
    const stops = document.querySelectorAll(`#hg-${CSS.escape(pc.style)} stop`);
    if (stops.length === 3) {
      stops[0].setAttribute('stop-color', lighten(pc.color, 0.4));
      stops[1].setAttribute('stop-color', pc.color);
      stops[2].setAttribute('stop-color', darken(pc.color, 0.3));
    }
  });
}

// ---------- Shoe closet: real little pictures of each pair on a shelf ----------
const shoeViewBoxCache = {};
function shoeMarkup(def) { return typeof def.svg === 'function' ? def.svg() : def.svg; }
function shoeViewBox(def) {
  if (shoeViewBoxCache[def.id]) return shoeViewBoxCache[def.id];
  let vb = '96 384 108 122';
  try {
    const NS = 'http://www.w3.org/2000/svg';
    const probe = document.createElementNS(NS, 'svg');
    probe.setAttribute('width', '300'); probe.setAttribute('height', '520');
    probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden';
    probe.innerHTML = `<g>${shoeMarkup(def)}</g>`;
    document.body.appendChild(probe);
    const bb = probe.firstChild.getBBox();
    probe.remove();
    if (bb.width > 0 && bb.height > 0) {
      const pad = 4, side = Math.max(bb.width, bb.height) + pad * 2;
      const x = bb.x + bb.width / 2 - side / 2, y = bb.y + bb.height / 2 - side / 2;
      vb = `${x.toFixed(1)} ${y.toFixed(1)} ${side.toFixed(1)} ${side.toFixed(1)}`;
    }
  } catch (e) { /* keep the default box */ }
  shoeViewBoxCache[def.id] = vb;
  return vb;
}
function shoePicSVG(def, color) {
  const gid = `shoepic-${def.id}`;
  return `<svg viewBox="${shoeViewBox(def)}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${lighten(color, 0.35)}"/><stop offset="55%" stop-color="${color}"/><stop offset="100%" stop-color="${darken(color, 0.3)}"/>
    </linearGradient></defs>
    <g class="shoepic-g" fill="url(#${gid})" stroke="${darken(color, 0.3)}" style="--skin:${state.skin || '#f1c9a5'}">${shoeMarkup(def)}</g>
  </svg>`;
}
function buildShoeShelves(container, items) {
  buildOptionButtons(container, items, (id) => { state.shoes.style = id; render(); });
  container.querySelectorAll('.option-btn').forEach((btn) => {
    const def = items.find((it) => it.id === btn.dataset.id);
    const emoji = btn.querySelector('.emoji');
    if (!def || !emoji) return;
    const pic = document.createElement('span');
    pic.className = 'emoji shoe-pic';
    pic.innerHTML = shoePicSVG(def, state.shoes.color);
    emoji.replaceWith(pic);
    btn.setAttribute('aria-label', def.label);
  });
}
// Every pair on the shelf shows the colour you've picked.
function refreshShoeShelfColors() {
  const c = state.shoes.color;
  document.querySelectorAll('#shoe-styles linearGradient').forEach((g) => {
    const stops = g.querySelectorAll('stop');
    stops[0].setAttribute('stop-color', lighten(c, 0.35));
    stops[1].setAttribute('stop-color', c);
    stops[2].setAttribute('stop-color', darken(c, 0.3));
  });
  document.querySelectorAll('#shoe-styles .shoepic-g').forEach((g) => {
    g.setAttribute('stroke', darken(c, 0.3));
    g.style.setProperty('--skin', state.skin || '#f1c9a5');
  });
}

function rebuildThemedLists() {
  buildOptionButtons(document.getElementById('hair-styles'), HAIR_STYLES.filter(itemVisible), (id) => {
    state.hair.style = id;
    render();
  });
  const visible = OUTFIT_STYLES.filter(itemVisible);
  buildHangerRack(document.getElementById('outfit-styles'), visible.filter((o) => pieceKind(o) === 'full'));
  buildHangerRack(document.getElementById('top-styles'), visible.filter((o) => pieceKind(o) === 'top'));
  buildHangerRack(document.getElementById('bottom-styles'), visible.filter((o) => pieceKind(o) === 'bottom'));
  buildShoeShelves(document.getElementById('shoe-styles'), SHOE_STYLES.filter(itemVisible));
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
  if (!itemVisible(outfitDef)) state.outfit = { style: 'basics', color: '#2b2b2b' };
  state.extras = (state.extras || []).filter((pc) => itemVisible(OUTFIT_STYLES.find((o) => o.id === pc.style)));

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

  if (armLeft) armLeft.setAttribute('d', armPath(125, 168, lx, 272, rUpper, rLower));
  if (armRight) armRight.setAttribute('d', armPath(175, 168, rx, 272, rUpper, rLower));
  if (armLeftOutline) armLeftOutline.setAttribute('d', armPath(125, 168, lx, 272, rUpper, rLower, outlineGrow));
  if (armRightOutline) armRightOutline.setAttribute('d', armPath(175, 168, rx, 272, rUpper, rLower, outlineGrow));
  if (legLeft) legLeft.setAttribute('d', legPath(133, 248, 127, 445, rUpper, rLower));
  if (legRight) legRight.setAttribute('d', legPath(167, 248, 173, 445, rUpper, rLower));
  if (legLeftOutline) legLeftOutline.setAttribute('d', legPath(133, 248, 127, 445, rUpper, rLower, outlineGrow));
  if (legRightOutline) legRightOutline.setAttribute('d', legPath(167, 248, 173, 445, rUpper, rLower, outlineGrow));
  const joints = root.querySelector('#body-joints');
  if (joints) joints.innerHTML = jointLinesSVG(lx, rx);

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
  const hairBackLayer = document.getElementById('layer-hair-back');
  hairBackLayer.innerHTML = hairDef.backSvg || '';
  hairBackLayer.setAttribute('fill', 'url(#hairGradient)');
  hairBackLayer.setAttribute('stroke', darken(state.hair.color, 0.35));

  // face
  document.getElementById('layer-face').innerHTML = buildFaceSVG(state.face, state.hair.color);

  // outfit
  const bt = BODY_TYPES.find((b) => b.id === state.bodyType);
  const outfitLayer = document.getElementById('layer-outfit');
  const worn = outfitPieces(state);
  outfitLayer.removeAttribute('fill');
  outfitLayer.innerHTML = piecesSVG(state, bt, 'main');
  // A mermaid tail replaces the legs and feet.
  const hideLegs = worn.some((pc) => pc.def.hidesLegs);
  ['leg-left', 'leg-right', 'leg-left-outline', 'leg-right-outline', 'leg-left-shine', 'leg-right-shine', 'layer-shoes']
    .forEach((id) => { document.getElementById(id).style.display = hideLegs ? 'none' : ''; });
  // the colour swatches paint the piece you tapped most recently
  const target = colorTargetPiece();
  const targetDef = target && OUTFIT_STYLES.find((o) => o.id === target.style);
  const fixed = !targetDef || !!targetDef.fixedColor;
  document.getElementById('outfit-color-label').hidden = fixed;
  document.getElementById('outfit-color-label').textContent = targetDef ? `Colour · ${targetDef.emoji} ${targetDef.label}` : 'Colour';
  document.getElementById('outfit-colors').hidden = fixed;
  document.getElementById('outfit-custom').hidden = fixed;
  document.getElementById('outfit-fixed-note').hidden = !targetDef || !targetDef.fixedColor;
  const perKind = ['top', 'bottom', 'full'].map((k) => `${KIND_LABELS[k].emoji} ${worn.filter((pc) => pieceKind(pc.def) === k).length}/${MAX_PIECES}`).join(' · ');
  document.getElementById('piece-count').textContent = worn.length
    ? `${perKind} — ${worn.map((pc) => `${pc.def.emoji} ${pc.def.label}`).join(' + ')}`
    : `${perKind} · 🖤 black basics on (they don't count)`;

  // shoes
  setGradient('shoeGradient', state.shoes.color, 0.35, 0.3);
  const shoeLayer = document.getElementById('layer-shoes');
  const shoeDef = SHOE_STYLES.find((s) => s.id === state.shoes.style);
  shoeLayer.innerHTML = shoeDef.svg;
  shoeLayer.style.setProperty('--skin', state.skin);
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
      layer.innerHTML = typeof acc.svg === 'function' ? acc.svg(bt) : acc.svg;
      layer.setAttribute('fill', acc.color);
      layer.setAttribute('stroke', acc.color);
      layer.style.display = '';
    } else {
      layer.style.display = 'none';
    }
  });

  // painted nails on the main stage hands
  document.getElementById('nails-left').innerHTML = dollNailsSVG('L', state.nails);
  document.getElementById('nails-right').innerHTML = dollNailsSVG('R', state.nails);

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
  const ct = colorTargetPiece();
  highlightSelection('#outfit-colors', ct ? ct.color : '', 'color');
  if (ct && /^#[0-9a-f]{6}$/i.test(ct.color)) {
    document.getElementById('outfit-custom-color').value = ct.color;
    document.getElementById('outfit-custom').classList.toggle('selected', !CLOTHES_PALETTE.includes(ct.color));
  }
  highlightSelection('#shoe-colors', state.shoes.color, 'color');
  highlightSelection('#hair-styles', state.hair.style, 'id');
  highlightSelection('#bang-styles', state.hair.bangs || 'none', 'id');
  const wornIds = new Set(outfitPieces(state).map((pc) => pc.style));
  ['#outfit-styles', '#top-styles', '#bottom-styles'].forEach((sel) => {
    document.querySelectorAll(`${sel} [data-id]`).forEach((elm) => {
      elm.classList.toggle('selected', wornIds.has(elm.dataset.id));
      elm.classList.toggle('editing', elm.dataset.id === (ct && ct.style));
    });
  });
  refreshHangerColors();
  highlightSelection('#shoe-styles', state.shoes.style, 'id');
  refreshShoeShelfColors();
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
  } else if (decor === 'y2k') {
    const star = (x, y, r, c) => `<path d="M${x},${y - r} L${x + r * 0.3},${y - r * 0.3} L${x + r},${y} L${x + r * 0.3},${y + r * 0.3} L${x},${y + r} L${x - r * 0.3},${y + r * 0.3} L${x - r},${y} L${x - r * 0.3},${y - r * 0.3} Z" fill="${c}"/>`;
    const cd = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e8eef6" stroke="#c9d4e2" stroke-width="2"/>
        <circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#ff9fd6" stroke-width="${r * 0.5}" opacity="0.35"/>
        <circle cx="${x}" cy="${y}" r="${r * 0.22}" fill="#ffffff" stroke="#c9d4e2"/>`;
    const heart = (x, y, s2, c) => `<path transform="translate(${x},${y}) scale(${s2})" d="M0,8 C-12,0 -10,-8 -4,-7.2 C-2,-7 0,-5 0,-3.4 C0,-5 2,-7 4,-7.2 C10,-8 12,0 0,8 Z" fill="${c}"/>`;
    const fly = (x, y, c) => `<g transform="translate(${x},${y})"><path d="M0,0 C-10,-12 -16,-4 -10,2 C-16,6 -10,14 0,4 Z M0,0 C10,-12 16,-4 10,2 C16,6 10,14 0,4 Z" fill="${c}"/><rect x="-1" y="-5" width="2" height="11" rx="1" fill="#2b2b2b"/></g>`;
    el.classList.add('ambient-decor-full');
    el.innerHTML = `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      ${cd(40, 60, 24)}${cd(262, 330, 30)}
      ${star(250, 50, 14, '#ffffff')}${star(30, 300, 10, '#ffffff')}${star(270, 180, 8, '#fff7d6')}${star(60, 200, 7, '#fff7d6')}
      ${heart(220, 110, 1.6, '#ff6fb0')}${heart(40, 380, 1.4, '#c9a6ff')}${heart(150, 30, 1, '#ff9fd6')}
      ${fly(80, 130, '#5cc4e0')}${fly(240, 250, '#ff8fc7')}${fly(20, 240, '#c9a6ff')}
      <text x="150" y="410" font-size="18" font-weight="900" text-anchor="middle" fill="#ffffff" opacity="0.8" font-family="Arial Black, Arial, sans-serif" letter-spacing="3">✧ Y2K ✧</text>
    </svg>`;
  } else if (decor === 'temple') {
    const column = (x) => `<g>
        <rect x="${x - 2}" y="96" width="34" height="10" rx="2" fill="#ffffff" opacity="0.9"/>
        <path d="M${x - 4},96 q6,-8 12,0 M${x + 22},96 q6,-8 12,0" fill="none" stroke="#e8dcc0" stroke-width="2.4"/>
        <rect x="${x + 2}" y="106" width="26" height="268" fill="#fffaf2" opacity="0.92"/>
        ${[7, 13, 19, 25].map((dx) => `<line x1="${x + dx}" y1="110" x2="${x + dx}" y2="370" stroke="#e8dcc0" stroke-width="1.4"/>`).join('')}
        <rect x="${x - 4}" y="374" width="38" height="10" rx="2" fill="#ffffff" opacity="0.9"/></g>`;
    const cloud = (x, y, k) => `<g transform="translate(${x},${y}) scale(${k})" fill="#ffffff" opacity="0.85"><ellipse cx="0" cy="0" rx="40" ry="14"/><ellipse cx="-18" cy="-8" rx="18" ry="14"/><ellipse cx="14" cy="-12" rx="22" ry="17"/></g>`;
    el.classList.add('ambient-decor-full');
    el.innerHTML = `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <g transform="translate(150,70)" opacity="0.5">${Array.from({ length: 16 }, (_, i) => `<path d="M0,0 L${(140 * Math.cos(i * Math.PI / 8 - 0.06)).toFixed(1)},${(140 * Math.sin(i * Math.PI / 8 - 0.06)).toFixed(1)} L${(140 * Math.cos(i * Math.PI / 8 + 0.06)).toFixed(1)},${(140 * Math.sin(i * Math.PI / 8 + 0.06)).toFixed(1)} Z" fill="#fff3a8"/>`).join('')}<circle r="26" fill="#fff3a8"/></g>
      <path d="M-10,96 L150,34 L310,96 Z" fill="#fffaf2" opacity="0.85" stroke="#e8dcc0" stroke-width="3"/>
      <path d="M40,88 L150,46 L260,88 Z" fill="none" stroke="#f2c94c" stroke-width="2" opacity="0.8"/>
      ${column(10)}${column(258)}
      ${cloud(40, 400, 1.3)}${cloud(150, 412, 1.6)}${cloud(262, 398, 1.3)}${cloud(250, 150, 0.6)}${cloud(50, 200, 0.5)}
      <path d="M0,384 L300,384" stroke="#e8dcc0" stroke-width="3"/>
    </svg>`;
  } else if (decor === 'vip') {
    const curtain = (x, flip) => `<path d="M${x},0 L${x + flip * 70},0 Q${x + flip * 50},160 ${x + flip * 14},230 Q${x + flip * 36},320 ${x + flip * 26},420 L${x},420 Z" fill="#8a1c3a"/>
        ${[16, 32, 48].map((d) => `<path d="M${x + flip * d},0 Q${x + flip * (d - 6)},180 ${x + flip * d * 0.4},420" fill="none" stroke="#5a0f24" stroke-width="3" opacity="0.6"/>`).join('')}
        <path d="M${x + flip * 6},226 Q${x + flip * 30},236 ${x + flip * 22},250" fill="none" stroke="#f2c94c" stroke-width="4"/>`;
    const post = (x) => `<rect x="${x - 3}" y="330" width="6" height="66" fill="#f2c94c"/><circle cx="${x}" cy="328" r="6" fill="#f2c94c"/><ellipse cx="${x}" cy="398" rx="12" ry="4" fill="#c98f1f"/>`;
    el.classList.add('ambient-decor-full');
    el.innerHTML = `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <g transform="translate(150,22)">
        <path d="M-40,0 L40,0 L28,26 L-28,26 Z" fill="#f2c94c" opacity="0.85"/>
        ${[-30, -15, 0, 15, 30].map((x, i) => `<line x1="${x}" y1="26" x2="${x * 0.9}" y2="${40 + (i % 2) * 8}" stroke="#fff3a8" stroke-width="1"/><path d="M${x * 0.9},${40 + (i % 2) * 8} l3,5 l-3,5 l-3,-5 Z" fill="#d6f0ff"/>`).join('')}
        <ellipse cx="0" cy="36" rx="60" ry="22" fill="#fff3a8" opacity="0.18"/>
      </g>
      ${curtain(0, 1)}${curtain(300, -1)}
      <rect x="0" y="0" width="300" height="16" fill="#5a0f24"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<path d="M${i * 30},16 q15,14 30,0" fill="#8a1c3a" stroke="#f2c94c" stroke-width="1.5"/>`).join('')}
      <text x="150" y="88" font-size="22" font-weight="900" text-anchor="middle" fill="#f2c94c" opacity="0.85" font-family="Georgia, serif" letter-spacing="6">VIP</text>
      ${post(36)}${post(264)}
      <path d="M42,334 Q90,370 150,352 Q210,370 258,334" fill="none" stroke="#c0245e" stroke-width="6"/>
      <rect x="0" y="396" width="300" height="24" fill="#c0245e" opacity="0.7"/>
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
  state.outfit = { style: pick(OUTFIT_STYLES.filter(itemVisible).filter(isUnlocked).filter((o) => pieceKind(o) === 'full')).id, color: pick(OUTFIT_COLORS) };
  state.extras = [];
  colorTarget = null;
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
// ---------- Outfit pieces ----------
// You can wear up to 3 clothing pieces at once: one full outfit, one top and one
// bottom. look.outfit is the first piece and look.extras holds the rest; each
// piece keeps its own colour. Pieces are drawn bottoms -> full outfits -> tops.
// Leggings and jeans go under a dress; skirts and shorts go over it.
const PIECE_ORDER = { under: 0, full: 1, bottom: 2, top: 3 };
function pieceLayer(def) {
  const k = pieceKind(def);
  return k === 'bottom' && def.under ? 'under' : k;
}
const MAX_PIECES = 3; // per kind: up to 3 tops, 3 bottoms/skirts and 3 full outfits
const KIND_LABELS = { top: { emoji: '👕', name: 'tops' }, bottom: { emoji: '👖', name: 'bottoms & skirts' }, full: { emoji: '👗', name: 'full outfits' } };

function pieceKind(def) {
  return (def && def.piece) || 'full';
}

function outfitPieces(look) {
  return [look.outfit, ...(look.extras || [])]
    .filter((pc) => pc && pc.style && pc.style !== 'basics')
    .map((pc) => ({ ...pc, def: OUTFIT_STYLES.find((o) => o.id === pc.style) }))
    .filter((pc) => pc.def)
    .sort((a, b) => PIECE_ORDER[pieceLayer(a.def)] - PIECE_ORDER[pieceLayer(b.def)]);
}

function piecesSVG(look, bt, suffix) {
  const pcs = outfitPieces(look);
  const kinds = new Set(pcs.map((pc) => pieceKind(pc.def)));
  const base = kinds.has('full') ? '' : basicsSVG(bt, !kinds.has('top'), !kinds.has('bottom'));
  return base + pcs.map((pc, i) => {
    const body = typeof pc.def.svg === 'function' ? pc.def.svg(bt) : pc.def.svg;
    if (pc.def.fixedColor) return `<g fill="none">${body}</g>`;
    const id = `pc${suffix}_${i}`;
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${lighten(pc.color, 0.4)}"/><stop offset="55%" stop-color="${pc.color}"/><stop offset="100%" stop-color="${darken(pc.color, 0.3)}"/>
      </linearGradient></defs><g fill="url(#${id})">${body}</g>`;
  }).join('');
}

function buildDollSVG(look, idSuffix = '', opts = {}) {
  const posed = !!opts.posed;
  const bt = BODY_TYPES.find((b) => b.id === look.bodyType);
  const hairDef = HAIR_STYLES.find((h) => h.id === look.hair.style);
  const outfitDef = { hidesLegs: outfitPieces(look).some((pc) => pc.def.hidesLegs) };
  const shoeDef = SHOE_STYLES.find((s) => s.id === look.shoes.style);
  const lx = 93 - bt.armSpread;
  const rxHand = 207 + bt.armSpread;

  const accSvg = ACCESSORIES.filter((a) => look.accessories && look.accessories[a.id])
    .map((a) => `<g fill="${a.color}" stroke="${a.color}">${typeof a.svg === 'function' ? a.svg(bt, { posed: !!opts.posed }) : a.svg}</g>`)
    .join('');
  // Parts of accessories that sit behind the body (like a backpack).
  const hairBackDef = HAIR_STYLES.find((h) => h.id === look.hair.style);
  const hairBackSvg = hairBackDef && hairBackDef.backSvg ? `<g class="hair-back" fill="url(#hairGrad${idSuffix})" stroke="${darken(look.hair.color, 0.35)}">${hairBackDef.backSvg}</g>` : '';
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
    ${hairBackSvg}
    <g fill="url(#${skinGrad})">
      ${posed ? '' : `
      <path d="${armPath(125, 168, lx, 272, rUpper, rLower, outlineGrow)}" fill="rgba(40,28,20,0.28)"/>
      <path d="${armPath(175, 168, rxHand, 272, rUpper, rLower, outlineGrow)}" fill="rgba(40,28,20,0.28)"/>
      <path d="${armPath(125, 168, lx, 272, rUpper, rLower)}"/>
      <path d="${armPath(175, 168, rxHand, 272, rUpper, rLower)}"/>
      <line x1="125" y1="168" x2="${lx}" y2="272" stroke="#ffffff" stroke-width="${shineWidth}" stroke-linecap="round" opacity="0.28"/>
      <line x1="175" y1="168" x2="${rxHand}" y2="272" stroke="#ffffff" stroke-width="${shineWidth}" stroke-linecap="round" opacity="0.28"/>
      <g transform="translate(${lx},272)" stroke="rgba(40,28,20,0.28)" stroke-width="1.2">
        <ellipse cx="7" cy="-4" rx="4.4" ry="3" transform="rotate(35 7 -4)"/>
        <ellipse cx="0" cy="-1" rx="9" ry="9"/>
        <rect x="-6.4" y="5" width="3.2" height="9" rx="1.6"/>
        <rect x="-2.4" y="5" width="3.2" height="11" rx="1.6"/>
        <rect x="1.2" y="5" width="3.2" height="10" rx="1.6"/>
        <rect x="5.2" y="5" width="2.8" height="7.5" rx="1.4"/>
        ${dollNailsSVG('L', look.nails)}
      </g>
      <g transform="translate(${rxHand},272)" stroke="rgba(40,28,20,0.28)" stroke-width="1.2">
        <ellipse cx="-7" cy="-4" rx="4.4" ry="3" transform="rotate(-35 -7 -4)"/>
        <ellipse cx="0" cy="-1" rx="9" ry="9"/>
        <rect x="3.2" y="5" width="3.2" height="9" rx="1.6"/>
        <rect x="-0.8" y="5" width="3.2" height="11" rx="1.6"/>
        <rect x="-4.4" y="5" width="3.2" height="10" rx="1.6"/>
        <rect x="-8" y="5" width="2.8" height="7.5" rx="1.4"/>
        ${dollNailsSVG('R', look.nails)}
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
      <path d="${legPath(133, 248, 127, 445, rUpper, rLower, outlineGrow)}" fill="rgba(40,28,20,0.28)"/>
      <path d="${legPath(133, 248, 127, 445, rUpper, rLower)}"/>
      <line x1="133" y1="248" x2="127" y2="445" stroke="#ffffff" stroke-width="${shineWidth}" stroke-linecap="round" opacity="0.22"/>
      </g>
      <g class="pl-right">
      <path d="${legPath(167, 248, 173, 445, rUpper, rLower, outlineGrow)}" fill="rgba(40,28,20,0.28)"/>
      <path d="${legPath(167, 248, 173, 445, rUpper, rLower)}"/>
      <line x1="167" y1="248" x2="173" y2="445" stroke="#ffffff" stroke-width="${shineWidth}" stroke-linecap="round" opacity="0.22"/>
      </g>
      `}
      <path d="${bodyTorsoPath(bt)}" stroke="rgba(40,28,20,0.22)" stroke-width="2"/>
      <path d="${NECK_PATH}" stroke="rgba(40,28,20,0.18)" stroke-width="1.5"/>
      ${BODY_DETAILS}
      ${posed ? '' : jointLinesSVG(lx, rxHand)}
      <ellipse cx="104" cy="97" rx="6" ry="11" stroke="rgba(40,28,20,0.22)" stroke-width="1.2"/>
      <ellipse cx="196" cy="97" rx="6" ry="11" stroke="rgba(40,28,20,0.22)" stroke-width="1.2"/>
      <path d="${HEAD_PATH}" stroke="rgba(40,28,20,0.22)" stroke-width="2"/>
      <ellipse cx="128" cy="72" rx="10" ry="7" fill="#ffffff" opacity="0.35"/>
    </g>
    <g fill="url(#${hairGrad})" stroke="${hairDark}">${hairDef.svg}${hairDef.id === 'none' ? '' : bangsSVG(look.hair.bangs)}</g>
    <g>${buildFaceSVG(face, look.hair.color)}</g>
    ${outfitDef.hidesLegs ? '' : posed ? `
      <clipPath id="shoeClipL${idSuffix}"><rect x="0" y="0" width="150" height="520"/></clipPath>
      <clipPath id="shoeClipR${idSuffix}"><rect x="150" y="0" width="150" height="520"/></clipPath>
      <g class="pl-left"><g clip-path="url(#shoeClipL${idSuffix})" fill="url(#${shoeGrad})" stroke="${shoeDark}" style="--skin:url(#${skinGrad})">${shoeDef.svg}</g></g>
      <g class="pl-right"><g clip-path="url(#shoeClipR${idSuffix})" fill="url(#${shoeGrad})" stroke="${shoeDark}" style="--skin:url(#${skinGrad})">${shoeDef.svg}</g></g>`
      : `<g fill="url(#${shoeGrad})" stroke="${shoeDark}" style="--skin:url(#${skinGrad})">${shoeDef.svg}</g>`}
    ${piecesSVG(look, bt, idSuffix)}
    ${posed ? posedArmsSVG(skinGrad, look.nails) : ''}
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
  state.extras = (look.extras || []).map((pc) => ({ ...pc }));
  colorTarget = null;
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
  if (e.key === 'Escape' && !nailSalonOverlay.hidden) closeNailSalon();
  if (e.key === 'Escape' && !onlineOverlay.hidden) closeOnline();
  if (e.key === 'Escape' && !exploreOverlay.hidden) closeExplore();
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
  if (kind === 'outfit' && !wornPieceList().some((pc) => pc.style === item.id)) pickPiece(item.id);
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

// ---------- Play Online (robot servers) ----------
// Two pretend servers filled with friendly robot players (no real people, no internet):
// Free Play is a hangout with emotes, Competition is a dress-to-the-theme contest.

const onlineOverlay = document.getElementById('online-overlay');
const onlineBody = document.getElementById('online-body');
const compBanner = document.getElementById('comp-banner');

const ROBOT_NAMES = ['RoboRuby', 'Bolt Bella', 'Pixel Pip', 'Sparkle-9', 'Chip Chic', 'Glitterbot', 'Nova Nuts', 'Beep Bijou', 'Zappy Zoe', 'Circuit Coco'];
const ROBOT_LINES = ['Cute outfit! 😍', 'Love your shoes!', 'Slay! 💅', 'Want to compete? 🏆', 'Beep boop, so stylish!', 'Your hair is amazing!', 'Best friends! 💖', 'Let\'s go to the runway!', 'Twirl time! 💃', 'Those colours! 🌈'];
const EMOTES = [
  { id: 'wave', label: 'Wave', emoji: '👋' },
  { id: 'dance', label: 'Dance', emoji: '💃' },
  { id: 'love', label: 'Love', emoji: '💖' },
  { id: 'laugh', label: 'Laugh', emoji: '😂' },
  { id: 'wow', label: 'Wow', emoji: '🤩' },
  { id: 'compliment', label: 'Nice outfit!', emoji: '✨' },
];

const CHALLENGES = [
  { id: 'beach', label: 'Beach Day', emoji: '☀️', theme: 'summer', items: ['ruffle-swimsuit', 'polka-swimsuit', 'board-shorts', 'flip-flops', 'sun-hat', 'flower-lei', 'pineapple-glasses'], colors: ['#5cc4e0', '#f2c94c'], bg: 'sunny-beach' },
  { id: 'spooky', label: 'Spooky Night', emoji: '🎃', theme: 'halloween', items: ['pumpkin-costume', 'cat-costume', 'car-costume', 'witch-hat', 'candy-bag', 'spiderweb'], colors: ['#2b2b2b', '#8c5ce0'], bg: 'haunted-night' },
  { id: 'hero', label: 'Superhero Squad', emoji: '🦸', theme: 'superhero', items: ['hero-suit', 'hero-dress', 'hero-cape', 'hero-mask', 'hero-sword', 'hero-shield'], colors: ['#d93b4a', '#5c7ce0'], bg: 'hero-city' },
  { id: 'gala', label: 'Met Gala Glam', emoji: '🌹', theme: 'metgala', items: ['rose-gown', 'golden-goddess', 'garden-gown', 'crystal-tux', 'rose-bouquet', 'rose-headpiece', 'gold-clutch', 'pearl-necklace', 'galaxy-gown'], colors: ['#e0558f', '#f2c94c'], bg: 'met-steps' },
  { id: 'winter', label: 'Winter Wonderland', emoji: '❄️', theme: 'christmas', items: ['santa-hat', 'christmas-dress', 'hot-cocoa', 'santa-dress', 'elf-costume', 'snowflake', 'candy-cane'], colors: ['#e05c5c', '#ffffff'], bg: 'winter-wonderland' },
  { id: 'mermaid', label: 'Under the Sea', emoji: '🧜‍♀️', theme: 'mermaid', items: ['mermaid-tail', 'ocean-sparkle-tail', 'shell-top', 'pearl-shell-top', 'starfish-clip', 'mermaid-waves'], colors: ['#5cc4e0', '#8c5ce0'], bg: 'under-the-sea' },
  { id: 'party', label: 'Birthday Party', emoji: '🎉', theme: 'party', items: ['polka-party-dress', 'party-hat', 'cake'], colors: ['#e0558f', '#f2c94c'], bg: 'party-room' },
  { id: 'pink', label: 'Pink Everything', emoji: '💗', theme: null, items: ['ruffle-dress', 'kitty-dress', 'heart-sunglasses', 'glam-tracksuit', 'cat-ears'], colors: ['#e0558f', '#ff8fc7', '#ff6fb0', '#ffb3d6'], bg: 'pink' },
  { id: 'sleepover', label: 'Cozy Sleepover', emoji: '😴', theme: 'sleepy', items: ['cozy-pajamas', 'nightgown', 'bunny-slippers', 'fluffy-slippers', 'unicorn-slippers', 'bear-slippers', 'heart-slippers', 'sleeping-mask'], colors: ['#8c5ce0', '#5cc4e0'], bg: 'cozy-bedroom' },
  { id: 'ballet', label: 'Ballet Recital', emoji: '🩰', theme: 'ballet', items: ['ballet-tutu', 'swan-tutu', 'ballet-slippers', 'bun'], colors: ['#ff8fc7', '#ffffff'], bg: 'ballet-stage' },
  { id: 'y2k', label: 'Totally Y2K', emoji: '💿', theme: 'y2k', items: ['butterfly-flares', 'chrome-dress', 'denim-skirt-tee', 'chunky-platforms', 'tinted-shades', 'flip-phone', 'bucket-hat', 'star-clips', 'flippy-bob'], colors: ['#ff6fb0', '#c9a6ff', '#5cc4e0'], bg: 'cyber-dream' },
  { id: 'goddess', label: 'Goddess of Glam', emoji: '🏛️', theme: 'goddess', items: ['grecian-gown', 'olympus-gown', 'moon-goddess', 'goddess-tunic', 'spring-goddess', 'gladiator-sandals', 'laurel-crown', 'sun-crown', 'gold-collar', 'moon-staff', 'goddess-wings', 'goddess-waves'], colors: ['#f2c94c', '#fffaf2', '#5c7ce0'], bg: 'olympus' },
  { id: 'school', label: 'First Day of School', emoji: '🎒', theme: 'school', items: ['uniform-skirt', 'uniform-trousers', 'backpack', 'star-backpack', 'big-bow', 'twin-bows'], colors: ['#2b4a8a', '#e05c5c'], bg: 'classroom' },
];

const COMP_PRIZES = [
  { cash: 60, points: 8, label: '🥇 1st place' },
  { cash: 35, points: 5, label: '🥈 2nd place' },
  { cash: 20, points: 3, label: '🥉 3rd place' },
  { cash: 10, points: 1, label: '🎀 4th place' },
  { cash: 10, points: 1, label: '🎀 5th place' },
];
const DRESS_SECONDS = 90;

let onlineTimers = [];
let compState = null;
const onlineLater = (fn, ms) => { onlineTimers.push(setTimeout(fn, ms)); };
const onlineEvery = (fn, ms) => { onlineTimers.push(setInterval(fn, ms)); };
function clearOnlineTimers() {
  onlineTimers.forEach((t) => { clearTimeout(t); clearInterval(t); });
  onlineTimers = [];
}

function freeItems(list) {
  return list.filter((i) => !i.price && !i.pass && !i.unlockLevel && !i.vip && i.id !== 'none');
}

// A robot's look: random everyday pieces, or mostly matching a challenge.
function robotLook(challenge) {
  const look = {
    bodyType: pick(BODY_TYPES).id,
    skin: pick(SKIN_TONES),
    hair: { style: pick(freeItems(HAIR_STYLES)).id, color: pick(SALON_HAIR_COLORS), bangs: Math.random() < 0.3 ? pick(BANG_STYLES).id : 'none' },
    outfit: { style: pick(freeItems(OUTFIT_STYLES).filter((o) => !o.theme && pieceKind(o) === 'full')).id, color: pick(OUTFIT_COLORS) },
    extras: [],
    shoes: { style: pick(freeItems(SHOE_STYLES).filter((o) => !o.theme)).id, color: pick(SHOE_COLORS) },
    accessories: {},
    face: { ...DEFAULT_FACE, eyeShape: pick(EYE_SHAPES.filter((e) => e.id !== 'closed')).id, mouth: pick(MOUTH_SHAPES).id, lipColor: pick(LIP_COLORS), lashes: pick(LASH_STYLES).id, eyeColor: pick(EYE_COLORS) },
  };
  freeItems(ACCESSORIES).filter((a) => !a.theme && !a.behindSvg).sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 2))
    .forEach((a) => { look.accessories[a.id] = true; });
  let matched = 0;
  if (challenge) {
    if (Math.random() < 0.8) look.outfit.color = pick(challenge.colors);
    challenge.items.forEach((id) => {
      if (Math.random() > 0.45) return;
      const found = findAnyItem(id);
      if (!found || found.item.price || found.item.pass) return;
      matched += 1;
      if (found.kind === 'outfit') look.outfit.style = id;
      if (found.kind === 'shoes') look.shoes.style = id;
      if (found.kind === 'hair') look.hair.style = id;
      if (found.kind === 'accessory') look.accessories[id] = true;
    });
  }
  return { look, matched };
}

function dollThumb(look, id, bgGradient) {
  return `<div class="ol-thumb" style="background:${bgGradient || 'transparent'}"><svg viewBox="0 -10 300 530">${buildDollSVG(look, id)}</svg></div>`;
}

function currentLookCopy() {
  return {
    ...state,
    hair: { ...state.hair },
    outfit: { ...state.outfit },
    extras: (state.extras || []).map((pc) => ({ ...pc })),
    shoes: { ...state.shoes },
    accessories: { ...state.accessories },
    face: { ...state.face },
    nails: state.nails ? [...state.nails] : null,
  };
}

// ---------- server picker ----------
function showServerPicker() {
  clearOnlineTimers();
  compState = null;
  compBanner.hidden = true;
  onlineBody.innerHTML = `
    <p class="ol-note">🤖 These servers are filled with friendly robot players, not real people, so it's always safe to play.</p>
    <div class="ol-servers">
      <button class="mg-card ol-server" id="ol-free"><span class="mg-emoji">🌐</span><span class="mg-name">Free Play Server</span>
        <span class="mg-blurb">Hang out in the lounge with robot friends, send emotes and show off your look.</span><span class="mg-reward">🟢 5 robots online</span></button>
      <button class="mg-card ol-server" id="ol-comp"><span class="mg-emoji">🏆</span><span class="mg-name">Competition Server</span>
        <span class="mg-blurb">Get a theme, dress up before time runs out, then walk against 4 robots for the crown.</span><span class="mg-reward">🎁 Win up to $60 + 8 pass points</span></button>
    </div>`;
  document.getElementById('ol-free').addEventListener('click', startFreePlay);
  document.getElementById('ol-comp').addEventListener('click', startCompetitionLobby);
}

// ---------- Free Play ----------
function startFreePlay() {
  clearOnlineTimers();
  const robots = ROBOT_NAMES.slice().sort(() => Math.random() - 0.5).slice(0, 5).map((name, i) => ({ name, ...robotLook(null), id: `fp${i}` }));
  const people = [{ name: 'You ⭐', look: currentLookCopy(), id: 'fpme', me: true }, ...robots];
  onlineBody.innerHTML = `
    <div class="ol-head"><button class="btn btn-ghost mg-back" id="ol-leave">← Servers</button><span class="ol-server-name">🌐 Free Play Server · 🟢 ${people.length} online</span></div>
    <div class="fp-lounge" id="fp-lounge">
      <div class="fp-sign">✨ Style Lounge ✨</div>
      ${people.map((pp, i) => `<div class="fp-avatar${pp.me ? ' me' : ''}" id="fpa-${i}" style="left:${8 + i * 15}%; animation-duration:${6 + Math.random() * 5}s; animation-delay:${-Math.random() * 5}s">
          <div class="fp-bubble" id="fpb-${i}" hidden></div>
          ${dollThumb(pp.look, pp.id)}
          <span class="fp-name">${pp.name.startsWith('You') ? pp.name : `🤖 ${pp.name}`}</span>
        </div>`).join('')}
    </div>
    <div class="option-row walk-picker fp-emotes" id="fp-emotes"></div>
    <button class="btn btn-primary fp-to-comp" id="fp-to-comp">🏆 Join a Competition</button>`;
  document.getElementById('ol-leave').addEventListener('click', showServerPicker);
  document.getElementById('fp-to-comp').addEventListener('click', startCompetitionLobby);
  const say = (i, text) => {
    const bub = document.getElementById(`fpb-${i}`);
    if (!bub) return;
    bub.textContent = text;
    bub.hidden = false;
    const av = document.getElementById(`fpa-${i}`);
    if (text.includes('💃')) { av.classList.remove('dancing'); void av.offsetWidth; av.classList.add('dancing'); }
    onlineLater(() => { bub.hidden = true; }, 2200);
  };
  buildOptionButtons(document.getElementById('fp-emotes'), EMOTES, (id) => {
    const em = EMOTES.find((e) => e.id === id);
    say(0, `${em.emoji} ${em.id === 'compliment' ? 'Nice outfit!' : em.label}`);
    // a robot or two answers back
    const answer = 1 + Math.floor(Math.random() * robots.length);
    onlineLater(() => say(answer, id === 'compliment' ? 'Aww thank you! 💖' : pick(ROBOT_LINES)), 700 + Math.random() * 600);
    if (id === 'dance') onlineLater(() => say(1 + Math.floor(Math.random() * robots.length), '💃 Dance party!'), 1100);
  });
  onlineEvery(() => {
    const i = 1 + Math.floor(Math.random() * robots.length);
    say(i, Math.random() < 0.3 ? `${pick(EMOTES).emoji}` : pick(ROBOT_LINES));
  }, 2600);
}

// ---------- Competition ----------
function startCompetitionLobby() {
  clearOnlineTimers();
  const challenge = pick(CHALLENGES);
  const robots = ROBOT_NAMES.slice().sort(() => Math.random() - 0.5).slice(0, 4).map((name, i) => ({ name, ...robotLook(challenge), id: `cp${i}` }));
  compState = { challenge, robots, timeLeft: DRESS_SECONDS };
  const bg = BACKGROUNDS.find((b) => b.id === challenge.bg);
  onlineBody.innerHTML = `
    <div class="ol-head"><button class="btn btn-ghost mg-back" id="ol-leave">← Servers</button><span class="ol-server-name">🏆 Competition Server · Round starting</span></div>
    <div class="comp-theme" style="background:${bg ? bg.gradient : '#f6f0ff'}">
      <span class="comp-theme-label">This round's theme</span>
      <span class="comp-theme-name">${challenge.emoji} ${challenge.label}</span>
      <span class="comp-theme-tip">${challenge.theme ? `Tip: try the ${THEMES.find((t) => t.id === challenge.theme).emoji} ${THEMES.find((t) => t.id === challenge.theme).label} theme. ` : ''}Matching clothes and colours score the most!</span>
    </div>
    <h3 class="comp-sub">Your competitors</h3>
    <div class="comp-lineup">${robots.map((r) => `<div class="comp-card">${dollThumb(r.look, r.id + 'l')}<span class="comp-name">🤖 ${r.name}</span><span class="comp-ready">✅ Ready</span></div>`).join('')}</div>
    <button class="btn btn-primary comp-go" id="comp-go">👗 Start Dressing (${DRESS_SECONDS}s)</button>`;
  document.getElementById('ol-leave').addEventListener('click', showServerPicker);
  document.getElementById('comp-go').addEventListener('click', startDressing);
}

function startDressing() {
  const { challenge } = compState;
  if (challenge.theme && state.theme !== challenge.theme) {
    state.theme = challenge.theme;
    sanitizeStateForTheme();
    rebuildThemedLists();
  }
  render();
  onlineOverlay.hidden = true;
  compBanner.hidden = false;
  compState.timeLeft = DRESS_SECONDS;
  const update = () => {
    compBanner.querySelector('.cb-text').textContent = `🏆 ${challenge.emoji} ${challenge.label} · ⏱️ ${compState.timeLeft}s`;
    compBanner.classList.toggle('hurry', compState.timeLeft <= 10);
  };
  update();
  onlineEvery(() => {
    compState.timeLeft -= 1;
    update();
    if (compState.timeLeft <= 0) finishDressing();
  }, 1000);
}

function scorePlayer(challenge) {
  let score = 6;
  const reasons = [];
  if (challenge.theme && state.theme === challenge.theme) { score += 1.2; reasons.push('on theme'); }
  const worn = [...outfitPieces(state).map((pc) => pc.style), state.shoes.style, state.hair.style, ...Object.keys(state.accessories).filter((k) => state.accessories[k])];
  const hits = challenge.items.filter((id) => worn.includes(id)).length;
  if (hits) { score += Math.min(2, hits * 0.7); reasons.push(`${hits} matching piece${hits === 1 ? '' : 's'}`); }
  if (challenge.colors.includes(state.outfit.color)) { score += 0.7; reasons.push('great colours'); }
  const accCount = Object.values(state.accessories).filter(Boolean).length;
  score += Math.min(0.6, accCount * 0.2);
  if (state.nails && state.nails.some(Boolean)) { score += 0.2; reasons.push('painted nails'); }
  score += Math.random() * 0.6;
  return { score: Math.min(10, score), reasons };
}

function finishDressing() {
  clearOnlineTimers();
  compBanner.hidden = true;
  const { challenge, robots } = compState;
  const me = scorePlayer(challenge);
  const entries = [
    { name: 'You ⭐', look: currentLookCopy(), id: 'cpme', me: true, score: me.score, reasons: me.reasons },
    ...robots.map((r) => ({ ...r, score: Math.min(9.6, 6.2 + Math.random() * 2.4 + r.matched * 0.35) })),
  ].sort(() => Math.random() - 0.5);
  const bg = BACKGROUNDS.find((b) => b.id === challenge.bg);
  onlineOverlay.hidden = false;
  onlineBody.innerHTML = `
    <div class="ol-head"><span class="ol-server-name">🏆 ${challenge.emoji} ${challenge.label} · The judges are scoring...</span></div>
    <div class="comp-runway" style="background:${bg ? bg.gradient : '#f6f0ff'}">
      ${entries.map((e, i) => `<div class="comp-card${e.me ? ' me' : ''}" id="cr-${i}">${dollThumb(e.look, e.id + 'r')}<span class="comp-name">${e.me ? e.name : `🤖 ${e.name}`}</span><span class="comp-score" id="cs-${i}">⭐ ...</span></div>`).join('')}
    </div>
    <div class="comp-results" id="comp-results"></div>`;
  entries.forEach((e, i) => onlineLater(() => {
    const el = document.getElementById(`cs-${i}`);
    if (!el) return;
    el.textContent = `⭐ ${e.score.toFixed(1)}`;
    document.getElementById(`cr-${i}`).classList.add('scored');
  }, 900 + i * 900));
  onlineLater(() => showCompetitionResults(entries), 900 + entries.length * 900 + 600);
}

function showCompetitionResults(entries) {
  const ranked = entries.slice().sort((a, b) => b.score - a.score);
  const place = ranked.findIndex((e) => e.me);
  const prize = COMP_PRIZES[place];
  cash += prize.cash;
  saveShop();
  renderCash();
  const hasPass = PASSES.some((x) => passOwned(x.id));
  const unlocked = hasPass ? addPassPoints(prize.points) : [];
  rebuildThemedLists();
  render();
  const me = ranked[place];
  const box = document.getElementById('comp-results');
  box.innerHTML = `
    <div class="comp-podium">${ranked.map((e, i) => `<div class="podium-row${e.me ? ' me' : ''}"><span>${COMP_PRIZES[i].label.split(' ')[0]}</span><span class="podium-name">${e.me ? e.name : `🤖 ${e.name}`}</span><span>⭐ ${e.score.toFixed(1)}</span></div>`).join('')}</div>
    <p class="comp-you">${place === 0 ? '👑 You won the round!' : `You came ${prize.label.split(' ').slice(1).join(' ')}!`}
      ${me.reasons.length ? `The judges loved: ${me.reasons.join(', ')}.` : 'Tip: wear clothes and colours that match the theme to score higher.'}</p>
    <p class="comp-prize">💵 +$${prize.cash} (now $${cash})${hasPass ? ` · 🎟️ +${prize.points} pass points` : ''}${unlocked.length ? ` · Unlocked ${unlocked.join(' & ')}!` : ''}</p>
    <div class="game-result-actions"><button class="btn btn-ghost" id="comp-again">🔁 Next Round</button><button class="btn btn-primary" id="comp-leave">🌐 Back to Servers</button></div>
    <div class="confetti-layer" id="comp-confetti"></div>`;
  document.getElementById('comp-again').addEventListener('click', startCompetitionLobby);
  document.getElementById('comp-leave').addEventListener('click', showServerPicker);
  if (place === 0) launchConfetti(document.getElementById('comp-confetti'));
  document.querySelector('#online-overlay .ol-server-name').textContent = `🏆 ${compState.challenge.emoji} ${compState.challenge.label} · Results`;
}

function openOnline() {
  if (compState && !compBanner.hidden) return;
  renderCash();
  showServerPicker();
  onlineOverlay.hidden = false;
}

function closeOnline() {
  clearOnlineTimers();
  compState = null;
  compBanner.hidden = true;
  onlineOverlay.hidden = true;
}

document.getElementById('online-btn').addEventListener('click', openOnline);
document.getElementById('ol-close').addEventListener('click', closeOnline);
document.getElementById('cb-ready').addEventListener('click', () => { if (compState) finishDressing(); });
onlineOverlay.addEventListener('click', (e) => {
  if (e.target === onlineOverlay) closeOnline();
});

// ---------- Explore the Map ----------
// An island with a land for every theme. Walk (tap a spot or use the arrow keys),
// visit lands to switch theme and backdrop, find each land's treasure and pick up gems.

const exploreOverlay = document.getElementById('explore-overlay');
const mapWrap = document.getElementById('map-wrap');
const mapPanel = document.getElementById('map-panel');

const MAP_W = 1000, MAP_H = 700;
const LANDS = [
  { id: 'classic', name: 'Fashion City', emoji: '🏙️', x: 500, y: 350, tint: '#ffd6ec', bg: 'pink', says: 'Welcome to Fashion City, the heart of the runway!' },
  { id: 'halloween', name: 'Spooky Woods', emoji: '🎃', x: 165, y: 175, tint: '#5a3a7a', bg: 'pumpkin-patch', says: 'Boo! The pumpkins here glow all night long.' },
  { id: 'christmas', name: 'Snowy Peak', emoji: '❄️', x: 420, y: 115, tint: '#ffffff', bg: 'winter-wonderland', says: 'Brrr! Grab some hot cocoa and build a snowman.' },
  { id: 'fairy', name: 'Fairy Forest', emoji: '🧚', x: 290, y: 305, tint: '#b9f2d0', bg: 'fairy-glade', says: 'Shh... the fairies are sprinkling sparkles.' },
  { id: 'birds', name: 'Bird Sanctuary', emoji: '🐦', x: 700, y: 120, tint: '#c8f2c0', bg: 'treetop-sky', says: 'Tweet tweet! The peacocks are showing off today.' },
  { id: 'metgala', name: 'Gala Palace', emoji: '🌹', x: 640, y: 265, tint: '#ffe08a', bg: 'met-steps', says: 'Only the most glamorous looks walk these steps.' },
  { id: 'superhero', name: 'Hero Tower', emoji: '🦸', x: 860, y: 230, tint: '#9fb2ff', bg: 'hero-city', says: 'Up, up and away! Heroes train at the top of the tower.' },
  { id: 'ballet', name: 'Ballet Theater', emoji: '🩰', x: 790, y: 405, tint: '#ffc6dc', bg: 'ballet-stage', says: 'The curtain is rising. Time to twirl!' },
  { id: 'school', name: 'Style Academy', emoji: '🎒', x: 335, y: 470, tint: '#ffe6b0', bg: 'classroom', says: 'Today\'s lesson: how to slay a runway walk.' },
  { id: 'party', name: 'Party Plaza', emoji: '🎉', x: 565, y: 505, tint: '#f4c6ff', bg: 'party-room', says: 'There\'s always a party here. Cake, anyone?' },
  { id: 'sleepy', name: 'Dreamy Cottage', emoji: '😴', x: 185, y: 520, tint: '#d6ccff', bg: 'cozy-bedroom', says: 'Pajamas on! It\'s sleepover time.' },
  { id: 'summer', name: 'Sunny Beach', emoji: '☀️', x: 755, y: 590, tint: '#ffe9a8', bg: 'pool-party', says: 'Surf\'s up! Don\'t forget your sun hat.' },
  { id: 'mermaid', name: 'Mermaid Lagoon', emoji: '🧜‍♀️', x: 925, y: 515, tint: '#7fd6f0', bg: 'under-the-sea', says: 'Splash! The mermaids are singing by the coral.' },
];
const TREASURE_CASH = 15;
const TREASURE_POINTS = 2;
const ALL_LANDS_BONUS = 100;
const GEM_CASH = 2;
const EXPLORE_KEY = 'runwayReady.explored';

let explored = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(EXPLORE_KEY) || '[]');
  if (Array.isArray(saved)) explored = new Set(saved);
} catch (e) {}
function saveExplored() {
  try { localStorage.setItem(EXPLORE_KEY, JSON.stringify([...explored])); } catch (e) {}
}

let mapPos = { x: 500, y: 395 };
let mapTarget = null;
let mapRaf = null;
let mapLast = 0;
let mapLand = null;
let mapGems = [];
const mapKeys = { up: false, down: false, left: false, right: false };

function islandPath() {
  return 'M120,90 C220,30 380,40 520,55 C680,40 860,60 930,150 C985,240 960,330 975,430 C990,560 900,650 760,660 C600,675 460,640 330,660 C190,680 70,620 55,500 C40,390 80,330 60,240 C45,160 70,120 120,90 Z';
}

function drawMap() {
  const roads = LANDS.filter((l) => l.id !== 'classic').map((l) => {
    const mx = (500 + l.x) / 2 + (l.y - 350) * 0.15, my = (350 + l.y) / 2 - (l.x - 500) * 0.15;
    return `<path d="M500,350 Q${mx},${my} ${l.x},${l.y}" fill="none" stroke="#f4e3c0" stroke-width="16" stroke-linecap="round"/>
            <path d="M500,350 Q${mx},${my} ${l.x},${l.y}" fill="none" stroke="#e2c991" stroke-width="2" stroke-dasharray="8 10"/>`;
  }).join('');
  const regions = LANDS.map((l) => `<ellipse cx="${l.x}" cy="${l.y}" rx="${l.id === 'classic' ? 95 : 85}" ry="${l.id === 'classic' ? 75 : 62}" fill="${l.tint}" opacity="0.75"/>`).join('');
  const deco = [
    ...[[110, 230], [210, 120], [130, 140], [230, 210]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="26" text-anchor="middle">🌲</text>`),
    ...[[380, 90], [455, 80], [470, 150]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="26" text-anchor="middle">🏔️</text>`),
    ...[[250, 345], [330, 270]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="22" text-anchor="middle">🍄</text>`),
    ...[[660, 80], [745, 160]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="24" text-anchor="middle">🌳</text>`),
    ...[[700, 625], [820, 630]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="24" text-anchor="middle">🌴</text>`),
    `<text x="960" y="600" font-size="24" text-anchor="middle">🐚</text>`,
    `<text x="80" y="420" font-size="24" text-anchor="middle">🌙</text>`,
  ].join('');
  const waves = Array.from({ length: 14 }, (_, i) => `<path d="M${(i * 73) % 1000},${(i * 137) % 700} q10,-6 20,0 t20,0" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.5"/>`).join('');
  const lands = LANDS.map((l) => {
    const done = explored.has(l.id);
    return `<g class="map-land" data-land="${l.id}">
        <circle cx="${l.x}" cy="${l.y}" r="34" fill="#ffffff" opacity="0.9" stroke="${done ? '#43b581' : '#e0558f'}" stroke-width="4"/>
        <text x="${l.x}" y="${l.y + 12}" font-size="34" text-anchor="middle">${l.emoji}</text>
        <rect x="${l.x - 62}" y="${l.y + 38}" width="124" height="24" rx="12" fill="#ffffff" opacity="0.92"/>
        <text x="${l.x}" y="${l.y + 55}" font-size="15" font-weight="700" text-anchor="middle" fill="#3a2e3a" font-family="Segoe UI, Helvetica Neue, Arial, sans-serif">${l.name}${done ? ' ✅' : ''}</text>
        ${done ? '' : `<text class="map-treasure" x="${l.x + 30}" y="${l.y - 22}" font-size="20" text-anchor="middle">🎁</text>`}
      </g>`;
  }).join('');
  const gems = mapGems.map((g, i) => (g.taken ? '' : `<text class="map-gem" id="gem-${i}" x="${g.x}" y="${g.y}" font-size="20" text-anchor="middle">💎</text>`)).join('');
  mapWrap.innerHTML = `<svg id="map-svg" viewBox="0 0 ${MAP_W} ${MAP_H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <rect width="${MAP_W}" height="${MAP_H}" fill="#6ec6e8"/>${waves}
      <path d="${islandPath()}" fill="#f2e3b0" stroke="#e6cf8a" stroke-width="6"/>
      <path d="${islandPath()}" fill="#bfe7a8" transform="translate(500 350) scale(0.93) translate(-500 -350)"/>
      ${regions}${roads}${deco}${lands}${gems}
      <g id="map-me" transform="translate(${mapPos.x},${mapPos.y})">
        <ellipse cx="0" cy="30" rx="22" ry="6" fill="#000000" opacity="0.18"/>
        <circle cx="0" cy="0" r="30" fill="#ffffff" stroke="#8c5ce0" stroke-width="4"/>
        <svg x="-28" y="-30" width="56" height="58" viewBox="88 26 124 124">${buildDollSVG(currentLookCopy(), 'map')}</svg>
        <text x="0" y="-36" font-size="14" font-weight="800" text-anchor="middle" fill="#8c5ce0" font-family="Segoe UI, Helvetica Neue, Arial, sans-serif">You</text>
      </g>
    </svg>`;
  document.getElementById('map-progress').textContent = `🗺️ ${explored.size} / ${LANDS.length} lands discovered · 💎 ${mapGems.filter((g) => g.taken).length} / ${mapGems.length} gems`;
}

function placeMe() {
  const me = document.getElementById('map-me');
  if (me) me.setAttribute('transform', `translate(${mapPos.x.toFixed(1)},${mapPos.y.toFixed(1)})`);
}

function scatterGems() {
  mapGems = Array.from({ length: 12 }, () => {
    const l = pick(LANDS);
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 60;
    return { x: Math.round(Math.min(940, Math.max(70, l.x + Math.cos(a) * d))), y: Math.round(Math.min(640, Math.max(70, l.y + Math.sin(a) * d * 0.7))), taken: false };
  });
}

function showLandPanel(land) {
  const done = explored.has(land.id);
  const theme = THEMES.find((t) => t.id === land.id);
  mapPanel.innerHTML = `
    <div class="map-panel-head"><span class="map-panel-emoji">${land.emoji}</span>
      <div><strong>${land.name}</strong><span>🤖 Guide-Bot: "${land.says}"</span></div></div>
    <div class="map-panel-actions">
      <button class="btn btn-primary" id="map-enter">🚪 Go Inside</button>
      ${done ? '' : `<button class="btn btn-ghost" id="map-treasure">🎁 Open Treasure</button>`}
      <button class="btn btn-ghost" id="map-visit">${theme ? `${theme.emoji} Wear ${theme.label} Style` : '✨ Visit'}</button>
    </div>
    <p class="map-panel-note" id="map-note"></p>`;
  mapPanel.hidden = false;
  const tBtn = document.getElementById('map-treasure');
  if (tBtn) tBtn.addEventListener('click', () => openTreasure(land));
  document.getElementById('map-visit').addEventListener('click', () => visitLand(land));
  document.getElementById('map-enter').addEventListener('click', () => enterLand(land));
}

function openTreasure(land) {
  if (explored.has(land.id)) return;
  explored.add(land.id);
  saveExplored();
  cash += TREASURE_CASH;
  let note = `🎉 Treasure found! 💵 +$${TREASURE_CASH}`;
  if (PASSES.some((x) => passOwned(x.id))) {
    const unlocked = addPassPoints(TREASURE_POINTS);
    note += ` · 🎟️ +${TREASURE_POINTS} pass points${unlocked.length ? ` · Unlocked ${unlocked.join(' & ')}!` : ''}`;
  }
  if (explored.size === LANDS.length) {
    cash += ALL_LANDS_BONUS;
    note += ` · 🏆 You discovered every land! Bonus 💵 +$${ALL_LANDS_BONUS}!`;
  }
  saveShop();
  renderCash();
  rebuildThemedLists();
  render();
  drawMap();
  showLandPanel(land);
  document.getElementById('map-note').textContent = note;
}

function visitLand(land) {
  if (THEMES.some((t) => t.id === land.id) && state.theme !== land.id) {
    state.theme = land.id;
    sanitizeStateForTheme();
  }
  const bg = BACKGROUNDS.find((b) => b.id === land.bg);
  if (bg && isUnlocked(bg)) state.background = bg.id;
  rebuildThemedLists();
  render();
  document.getElementById('map-note').textContent = `✨ You're now in ${land.name} style! Close the map to dress up for it.`;
}

function mapTick(ts) {
  if (!mapLast) mapLast = ts;
  const dt = Math.min(0.05, (ts - mapLast) / 1000);
  mapLast = ts;
  const speed = 280;
  let vx = (mapKeys.right ? 1 : 0) - (mapKeys.left ? 1 : 0);
  let vy = (mapKeys.down ? 1 : 0) - (mapKeys.up ? 1 : 0);
  if (vx || vy) {
    mapTarget = null;
    const n = Math.hypot(vx, vy);
    mapPos.x += (vx / n) * speed * dt;
    mapPos.y += (vy / n) * speed * dt;
  } else if (mapTarget) {
    const dx = mapTarget.x - mapPos.x, dy = mapTarget.y - mapPos.y, d = Math.hypot(dx, dy);
    if (d < 4) mapTarget = null;
    else { const step = Math.min(d, speed * dt); mapPos.x += (dx / d) * step; mapPos.y += (dy / d) * step; }
  }
  mapPos.x = Math.min(MAP_W - 40, Math.max(40, mapPos.x));
  mapPos.y = Math.min(MAP_H - 40, Math.max(40, mapPos.y));
  placeMe();

  mapGems.forEach((g, i) => {
    if (g.taken || Math.hypot(g.x - mapPos.x, g.y - 8 - mapPos.y) > 32) return;
    g.taken = true;
    cash += GEM_CASH;
    saveShop();
    renderCash();
    const el = document.getElementById(`gem-${i}`);
    if (el) el.remove();
    document.getElementById('map-progress').textContent = `🗺️ ${explored.size} / ${LANDS.length} lands discovered · 💎 ${mapGems.filter((x) => x.taken).length} / ${mapGems.length} gems (+$${GEM_CASH}!)`;
  });

  const near = LANDS.find((l) => Math.hypot(l.x - mapPos.x, l.y - mapPos.y) < 48);
  if (near && near !== mapLand) { mapLand = near; showLandPanel(near); }
  if (!near && mapLand && Math.hypot(mapLand.x - mapPos.x, mapLand.y - mapPos.y) > 80) { mapLand = null; mapPanel.hidden = true; }
  mapRaf = requestAnimationFrame(mapTick);
}

function mapPointer(e) {
  const svg = document.getElementById('map-svg');
  if (!svg) return;
  e.preventDefault();
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  const tapped = LANDS.find((l) => Math.hypot(l.x - p.x, l.y - p.y) < 40);
  if (tapped && mapLand === tapped) { enterLand(tapped); return; }
  mapTarget = { x: p.x, y: p.y };
}

function mapKey(down) {
  return (e) => {
    const k = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' }[e.key];
    if (!k) return;
    mapKeys[k] = down;
    e.preventDefault();
  };
}
const mapKeyDown = mapKey(true), mapKeyUp = mapKey(false);

mapWrap.addEventListener('pointerdown', mapPointer);
mapWrap.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
mapWrap.addEventListener('contextmenu', (e) => e.preventDefault());

function startIsland() {
  stopTown();
  worldStage.hidden = true;
  if (worldRaf) cancelAnimationFrame(worldRaf);
  worldRaf = null;
  mapStage.hidden = false;
  document.getElementById('island-bar').hidden = false;
  document.getElementById('map-progress').hidden = false;
  document.getElementById('ex-title').textContent = '🏝️ Style Island';
  scatterGems();
  mapPos = { x: 500, y: 395 };
  mapTarget = null;
  mapLand = null;
  mapPanel.hidden = true;
  drawMap();
  document.addEventListener('keydown', mapKeyDown);
  document.addEventListener('keyup', mapKeyUp);
  mapLast = 0;
  mapRaf = requestAnimationFrame(mapTick);
}

function stopIsland() {
  if (mapRaf) cancelAnimationFrame(mapRaf);
  mapRaf = null;
  Object.keys(mapKeys).forEach((k) => { mapKeys[k] = false; });
  document.removeEventListener('keydown', mapKeyDown);
  document.removeEventListener('keyup', mapKeyUp);
  mapStage.hidden = true;
  document.getElementById('island-bar').hidden = true;
}

function openExplore() {
  renderCash();
  exploreOverlay.hidden = false;
  showTown();
}

function closeExplore() {
  stopTown();
  stopLand();
  if (worldRaf) cancelAnimationFrame(worldRaf);
  worldRaf = null;
  landStage.hidden = true;
  landStage.innerHTML = '';
  mapStage.hidden = false;
  document.getElementById('map-progress').hidden = false;
  exploreOverlay.hidden = true;
  if (mapRaf) cancelAnimationFrame(mapRaf);
  mapRaf = null;
  Object.keys(mapKeys).forEach((k) => { mapKeys[k] = false; });
  document.removeEventListener('keydown', mapKeyDown);
  document.removeEventListener('keyup', mapKeyUp);
}

document.getElementById('explore-btn').addEventListener('click', openExplore);
document.getElementById('ex-close').addEventListener('click', closeExplore);
exploreOverlay.addEventListener('click', (e) => {
  if (e.target === exploreOverlay) closeExplore();
});

// ---------- Inside a land ----------
// Each land is a side-scrolling world: walk with your chosen walk, find the land's
// hidden items, chat with robot locals, then open the treasure chest at the end.

const landStage = document.getElementById('land-stage');
const mapStage = document.getElementById('map-stage');
const LAND_W = 2600, VIEW_W = 800, VIEW_H = 450, LAND_GROUND_Y = 372, LAND_ITEMS = 6;
const LAND_FIRST_CASH = 20, LAND_FIRST_POINTS = 3, LAND_REPEAT_CASH = 5;

const LAND_SCENES = {
  classic: { ground: '#d9c7e8', back: ['🏬', '🏙️', '🏢', '🏬', '🏛️'], front: ['🌳', '🚕', '☕', '🛍️', '🌷', '🛴'], collect: { emoji: '👜', name: 'designer bag', plural: 'designer bags' }, particle: null, lines: ['Welcome to Fashion City!', 'The boutiques here are super fancy.', 'I lost my designer bags. Can you find them?'] },
  halloween: { ground: '#3a2a4a', back: ['🌲', '🏚️', '🌲', '🌕', '🌲'], front: ['🪦', '🕸️', '🦉', '🍂', '🪦', '🕯️'], collect: { emoji: '🎃', name: 'pumpkin', plural: 'pumpkins' }, particle: { emoji: '🦇', dir: 'across' }, lines: ['Boo! Did I scare you?', 'Spooky pumpkins are hiding everywhere!', 'Watch out for the friendly ghosts 👻'] },
  christmas: { ground: '#ffffff', back: ['🏔️', '🌲', '🏠', '🌲', '🏔️'], front: ['⛄', '🎄', '🛷', '🌲', '🦌', '🧦'], collect: { emoji: '🎁', name: 'present', plural: 'presents' }, particle: { emoji: '❄️', dir: 'down' }, lines: ['Brrr, it\'s chilly!', 'Santa dropped his presents!', 'Want to build a snowman?'] },
  fairy: { ground: '#8fd8a0', back: ['🌳', '🌈', '🌳', '🏰', '🌳'], front: ['🍄', '🌸', '🦋', '🌼', '🍄', '🐞'], collect: { emoji: '🌟', name: 'fairy star', plural: 'fairy stars' }, particle: { emoji: '✨', dir: 'float' }, lines: ['The fairies left their stars around!', 'Make a wish! ✨', 'Mushrooms make great umbrellas.'] },
  birds: { ground: '#9fd88a', back: ['🌳', '🌳', '🌲', '🌳', '🌴'], front: ['🌻', '🪺', '🦚', '🦜', '🌻', '🐦'], collect: { emoji: '🪶', name: 'feather', plural: 'feathers' }, particle: { emoji: '🍃', dir: 'across' }, lines: ['Tweet tweet!', 'The birds dropped their pretty feathers.', 'Have you seen the peacock?'] },
  metgala: { ground: '#b0123f', back: ['🏛️', '🏛️', '🏰', '🏛️', '🏛️'], front: ['🌹', '📸', '💐', '🎻', '🌹', '🕯️'], collect: { emoji: '💎', name: 'diamond', plural: 'diamonds' }, particle: { emoji: '✨', dir: 'float' }, lines: ['Welcome to the Gala Palace, darling!', 'Someone lost their diamonds on the red carpet!', 'Strike a pose for the cameras 📸'] },
  superhero: { ground: '#4a4f7a', back: ['🏙️', '🏢', '🏬', '🏢', '🏙️'], front: ['🚀', '🛸', '🚓', '⚡', '🏗️', '🚁'], collect: { emoji: '⚡', name: 'power bolt', plural: 'power bolts' }, particle: { emoji: '⭐', dir: 'float' }, lines: ['Hero training is about to begin!', 'Collect the power bolts to charge up!', 'Up, up and away!'] },
  ballet: { ground: '#c9935a', back: ['🎭', '🪞', '🏛️', '🪞', '🎭'], front: ['🌹', '🎻', '🩰', '💐', '🎹', '🌹'], collect: { emoji: '🎀', name: 'ribbon', plural: 'ribbons' }, particle: { emoji: '🌸', dir: 'down' }, lines: ['Point your toes! 🩰', 'The dancers lost their ribbons.', 'Bravo! Bravo!'] },
  school: { ground: '#c98f5a', back: ['🏫', '🏫', '🏟️', '🏫', '🏫'], front: ['📚', '🍎', '🎨', '✏️', '🧮', '🔬'], collect: { emoji: '⭐', name: 'gold star', plural: 'gold stars' }, particle: null, lines: ['Class is in session!', 'Find all the gold stars for an A+!', 'Art class is my favourite 🎨'] },
  party: { ground: '#e6c2ff', back: ['🎪', '🎡', '🎪', '🎠', '🎪'], front: ['🎈', '🎂', '🎁', '🪩', '🎈', '🍿'], collect: { emoji: '🧁', name: 'cupcake', plural: 'cupcakes' }, particle: { emoji: '🎊', dir: 'down' }, lines: ['Let\'s party! 🎉', 'Someone hid all the cupcakes!', 'Dance with me! 💃'] },
  sleepy: { ground: '#b9a6e8', back: ['🏡', '🌙', '🏡', '⭐', '🏡'], front: ['🧸', '🛏️', '🕯️', '📚', '🧸', '🌙'], collect: { emoji: '💫', name: 'dream star', plural: 'dream stars' }, particle: { emoji: '💤', dir: 'float' }, lines: ['*yawn* Is it bedtime yet?', 'Dream stars are floating around!', 'Pillow fight! 🛏️'] },
  summer: { ground: '#f2dfb0', back: ['🌴', '⛱️', '🌴', '🏖️', '🌴'], front: ['🐚', '🦀', '🏄', '⛱️', '🏐', '🦀'], collect: { emoji: '🐚', name: 'seashell', plural: 'seashells' }, particle: null, lines: ['Surf\'s up! 🏄', 'Pretty seashells washed up on the sand!', 'Don\'t forget your sunscreen ☀️'] },
  mermaid: { ground: '#e8d6a8', back: ['🪸', '🐋', '🪸', '🏝️', '🪸'], front: ['🐠', '🐙', '🐢', '🪸', '🐡', '🦑'], collect: { emoji: '🦪', name: 'pearl', plural: 'pearls' }, particle: { emoji: '🫧', dir: 'up' }, lines: ['Splash! Welcome to the lagoon!', 'The pearls rolled out of their shells!', 'Swim with the turtles! 🐢'] },
};

const LAND_QUEST_KEY = 'runwayReady.landQuests';
let landQuests = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(LAND_QUEST_KEY) || '[]');
  if (Array.isArray(saved)) landQuests = new Set(saved);
} catch (e) {}

let landState = null;

function enterLand(land) {
  if (mapRaf) cancelAnimationFrame(mapRaf);
  mapRaf = null;
  if (worldRaf) cancelAnimationFrame(worldRaf);
  worldRaf = null;
  const sc = LAND_SCENES[land.id];
  const bg = BACKGROUNDS.find((b) => b.id === land.bg);
  const rand = (a, b) => a + Math.random() * (b - a);
  const items = Array.from({ length: LAND_ITEMS }, (_, i) => ({
    x: Math.round(300 + i * ((LAND_W - 650) / LAND_ITEMS) + rand(0, 220)),
    y: Math.random() < 0.35 ? LAND_GROUND_Y - rand(70, 120) : LAND_GROUND_Y - 6,
    got: false,
  }));
  const npcs = [Math.round(rand(520, 800)), Math.round(rand(1400, 1700))].map((x, i) => ({ x, ...robotLook(null), name: pick(ROBOT_NAMES), id: `ln${i}`, said: false }));
  landState = { land, sc, items, npcs, x: 110, target: null, facing: 1, t: 0, last: 0, keys: { left: false, right: false }, chestOpen: false, raf: null, timers: [] };

  const backProps = Array.from({ length: 12 }, (_, i) => `<span class="land-prop back" style="left:${80 + i * 210 + rand(-40, 40)}px; font-size:${Math.round(rand(80, 130))}px">${sc.back[i % sc.back.length]}</span>`).join('');
  const frontProps = Array.from({ length: 16 }, (_, i) => `<span class="land-prop front" style="left:${150 + i * 155 + rand(-30, 30)}px; font-size:${Math.round(rand(38, 60))}px">${sc.front[i % sc.front.length]}</span>`).join('');
  const particles = sc.particle ? Array.from({ length: 10 }, (_, i) => `<span class="land-particle ${sc.particle.dir}" style="left:${rand(0, 96)}%; top:${rand(0, 70)}%; animation-duration:${rand(5, 9)}s; animation-delay:${-rand(0, 8)}s">${sc.particle.emoji}</span>`).join('') : '';

  landStage.innerHTML = `
    <div class="land-hud">
      <button class="btn btn-ghost mg-back" id="land-exit">← Map</button>
      <span class="land-title">${land.emoji} ${land.name}</span>
      <span class="land-count" id="land-count"></span>
    </div>
    <div class="land-scene" id="land-scene" style="background:${land.gradient || (bg ? bg.gradient : '#bfe9ff')}">
      ${particles}
      <div class="land-world" id="land-world" style="width:${LAND_W}px; height:${VIEW_H}px">
        ${backProps}
        <div class="land-ground" style="top:${LAND_GROUND_Y}px; background:${sc.ground}"></div>
        ${npcs.map((n, i) => `<div class="land-npc" id="lnpc-${i}" style="left:${n.x}px"><div class="land-bubble" id="lnb-${i}" hidden></div>${dollThumb(n.look, n.id)}<span class="fp-name">🤖 ${n.name}</span></div>`).join('')}
        ${items.map((it, i) => `<span class="land-item" id="litem-${i}" style="left:${it.x}px; top:${it.y}px">${sc.collect.emoji}</span>`).join('')}
        <div class="land-chest" id="land-chest" style="left:${LAND_W - 170}px"><div class="land-bubble" id="land-chest-bubble" hidden></div><span id="land-chest-icon">🧰</span></div>
        <div class="land-player" id="land-player"><svg viewBox="0 -10 300 520" preserveAspectRatio="xMidYMax meet">${buildDollSVG(currentLookCopy(), 'land', { posed: true })}</svg></div>
        ${frontProps}
      </div>
      <div class="land-toast" id="land-toast" hidden></div>
    </div>
    <div class="game-controls-mobile land-controls">
      <button class="game-btn" id="land-left" aria-label="Walk left">◀</button>
      <button class="game-btn" id="land-right" aria-label="Walk right">▶</button>
    </div>
    <p class="game-hint">Tap where to walk, hold ◀ ▶, or use the arrow keys. Find every ${sc.collect.emoji} ${sc.collect.name}, then open the treasure chest at the end!</p>`;
  mapStage.hidden = true;
  worldStage.hidden = true;
  document.getElementById('island-bar').hidden = true;
  landStage.hidden = false;
  document.getElementById('map-progress').hidden = true;

  const scene = document.getElementById('land-scene');
  scene.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    const r = scene.getBoundingClientRect();
    const scale = r.width / VIEW_W;
    landState.target = landState.camX + (e.clientX - r.left) / scale;
  });
  scene.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  const hold = (id, key) => {
    const btn = document.getElementById(id);
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); landState.keys[key] = true; landState.target = null; });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, () => { landState.keys[key] = false; }));
    btn.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  };
  hold('land-left', 'left');
  hold('land-right', 'right');
  document.getElementById('land-exit').addEventListener('click', exitLand);
  document.addEventListener('keydown', landKeyDown);
  document.addEventListener('keyup', landKeyUp);
  updateLandCount();
  poseLimbs(document.getElementById('land-player'), currentWalk(), 0, 0, false);
  landState.raf = requestAnimationFrame(landTick);
}

function landKey(down) {
  return (e) => {
    if (!landState) return;
    const k = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' }[e.key];
    if (!k) return;
    landState.keys[k] = down;
    if (down) landState.target = null;
    e.preventDefault();
  };
}
const landKeyDown = landKey(true), landKeyUp = landKey(false);

function updateLandCount() {
  const { items, sc } = landState;
  const got = items.filter((i) => i.got).length;
  document.getElementById('land-count').textContent = `${sc.collect.emoji} ${got} / ${items.length} ${sc.collect.plural}`;
}

function landToast(text) {
  const t = document.getElementById('land-toast');
  if (!t) return;
  t.textContent = text;
  t.hidden = false;
  t.classList.remove('pop');
  void t.offsetWidth;
  t.classList.add('pop');
  clearTimeout(landState.toastTimer);
  landState.toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

function landBubble(id, text) {
  const b = document.getElementById(id);
  if (!b) return;
  b.textContent = text;
  b.hidden = false;
  landState.timers.push(setTimeout(() => { b.hidden = true; }, 2800));
}

function landTick(ts) {
  const L = landState;
  if (!L) return;
  if (!L.last) L.last = ts;
  const dt = Math.min(0.05, (ts - L.last) / 1000);
  L.last = ts;
  const speed = 240;
  let vx = (L.keys.right ? 1 : 0) - (L.keys.left ? 1 : 0);
  if (!vx && L.target != null) {
    const d = L.target - L.x;
    if (Math.abs(d) < 6) L.target = null;
    else vx = Math.sign(d);
  }
  L.x = Math.min(LAND_W - 60, Math.max(40, L.x + vx * speed * dt));
  if (vx) { L.facing = vx; L.t += dt; }

  const scene = document.getElementById('land-scene');
  const scale = scene.clientWidth / VIEW_W;
  L.camX = Math.min(Math.max(L.x - VIEW_W / 2, 0), LAND_W - VIEW_W);
  document.getElementById('land-world').style.transform = `scale(${scale}) translateX(${-L.camX}px)`;
  const player = document.getElementById('land-player');
  player.style.left = `${L.x}px`;
  player.style.transform = `translateX(-50%) scaleX(${L.facing})`;
  poseLimbs(player, currentWalk(), L.t, 0, vx !== 0);

  L.items.forEach((it, i) => {
    if (it.got || Math.abs(it.x - L.x) > 42) return;
    it.got = true;
    const el = document.getElementById(`litem-${i}`);
    if (el) el.classList.add('got');
    updateLandCount();
    const left = L.items.filter((x) => !x.got).length;
    landToast(left ? `${L.sc.collect.emoji} Found a ${L.sc.collect.name}! ${left} to go.` : `🎉 You found every ${L.sc.collect.name}! Go open the chest! ➡️`);
  });

  L.npcs.forEach((n, i) => {
    const near = Math.abs(n.x - L.x) < 110;
    if (near && !n.said) { n.said = true; landBubble(`lnb-${i}`, pick(L.sc.lines)); }
    if (!near && Math.abs(n.x - L.x) > 220) n.said = false;
  });

  const chestX = LAND_W - 170;
  if (Math.abs(chestX - L.x) < 90 && !L.chestNear) {
    L.chestNear = true;
    if (L.items.every((x) => x.got)) openLandChest();
    else landBubble('land-chest-bubble', `🔒 Find all ${L.items.length} ${L.sc.collect.plural} first!`);
  }
  if (Math.abs(chestX - L.x) > 160) L.chestNear = false;

  L.raf = requestAnimationFrame(landTick);
}

function openLandChest() {
  const L = landState;
  if (L.chestOpen) return;
  L.chestOpen = true;
  document.getElementById('land-chest-icon').textContent = '💰';
  document.getElementById('land-chest').classList.add('open');
  const first = !landQuests.has(L.land.id);
  let msg;
  if (first) {
    landQuests.add(L.land.id);
    try { localStorage.setItem(LAND_QUEST_KEY, JSON.stringify([...landQuests])); } catch (e) {}
    cash += LAND_FIRST_CASH;
    msg = `🎉 Treasure! 💵 +$${LAND_FIRST_CASH}`;
    if (PASSES.some((x) => passOwned(x.id))) {
      const unlocked = addPassPoints(LAND_FIRST_POINTS);
      msg += ` · 🎟️ +${LAND_FIRST_POINTS} pass points${unlocked.length ? ` · Unlocked ${unlocked.join(' & ')}!` : ''}`;
    }
  } else {
    cash += LAND_REPEAT_CASH;
    msg = `💰 Bonus treasure! 💵 +$${LAND_REPEAT_CASH}`;
  }
  saveShop();
  renderCash();
  rebuildThemedLists();
  render();
  landBubble('land-chest-bubble', msg);
  landToast(msg);
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  document.getElementById('land-scene').appendChild(layer);
  launchConfetti(layer);
}

function stopLand() {
  if (!landState) return;
  if (landState.raf) cancelAnimationFrame(landState.raf);
  landState.timers.forEach(clearTimeout);
  clearTimeout(landState.toastTimer);
  landState = null;
  document.removeEventListener('keydown', landKeyDown);
  document.removeEventListener('keyup', landKeyUp);
}

function exitLand() {
  const land = landState && landState.land;
  stopLand();
  landStage.hidden = true;
  landStage.innerHTML = '';
  if (land && land.world) { showWorld(land); return; }
  document.getElementById('island-bar').hidden = false;
  mapStage.hidden = false;
  document.getElementById('map-progress').hidden = false;
  drawMap();
  if (land) { mapPos = { x: land.x, y: land.y + 10 }; placeMe(); mapLand = land; showLandPanel(land); }
  mapLast = 0;
  mapRaf = requestAnimationFrame(mapTick);
}

// ---------- Style Town (free-play map) ----------
// A town to roam freely: walk around (tap, arrow keys or the d-pad), meet robot
// shoppers, and walk up to a door to go inside a building. The airport flies you
// to the World Map and the ferry dock goes to Style Island.

const townStage = document.getElementById('town-stage');
const townWrap = document.getElementById('town-wrap');
const townPanel = document.getElementById('town-panel');
const TOWN_W = 1600, TOWN_H = 1100, TVIEW_W = 800, TVIEW_H = 520;

const TOWN_BUILDINGS = [
  { id: 'dressing', name: 'Dressing Room', emoji: '👗', x: 160, y: 130, w: 260, h: 170, wall: '#ffe0ef', roof: '#e0558f', blurb: 'Try on whole looks from the wardrobe.' },
  { id: 'hair', name: 'Hair Salon', emoji: '💇', x: 500, y: 130, w: 240, h: 170, wall: '#e6f4ff', roof: '#5c7ce0', blurb: 'New hairstyles, bangs and colours.' },
  { id: 'makeup', name: 'Makeup Salon', emoji: '💄', x: 840, y: 130, w: 240, h: 170, wall: '#fff0f6', roof: '#c0293b', blurb: 'Eyeshadow, lashes, lipstick and face paint.' },
  { id: 'nails', name: 'Nail Salon', emoji: '💅', x: 1180, y: 130, w: 240, h: 170, wall: '#fff6e0', roof: '#ff6fb0', blurb: 'Paint your nails yourself!' },
  { id: 'shop', name: 'Boutique', emoji: '🛍️', x: 120, y: 450, w: 280, h: 180, wall: '#f6ecff', roof: '#8c5ce0', blurb: 'Spend your cash on cool clothes and walks.' },
  { id: 'passes', name: 'Pass Station', emoji: '🎟️', x: 140, y: 740, w: 240, h: 160, wall: '#fff0e0', roof: '#f2994a', blurb: 'Baddie Pass, Sweetie Pass and their rewards.' },
  { id: 'arcade', name: 'Arcade', emoji: '🎮', x: 1200, y: 450, w: 280, h: 180, wall: '#e8fff4', roof: '#43b581', blurb: 'Mini games for pass points and cash.' },
  { id: 'comp', name: 'Competition Hall', emoji: '🏆', x: 1210, y: 740, w: 270, h: 170, wall: '#fff8d6', roof: '#c98f1f', blurb: 'Dress to the theme and beat the robots!' },
  { id: 'runway', name: 'Runway Stage', emoji: '💃', x: 560, y: 840, w: 480, h: 150, wall: '#2b2140', roof: '#e0558f', blurb: 'Strut down the catwalk in the Catwalk Show.' },
  { id: 'airport', name: 'Airport', emoji: '✈️', x: 140, y: 960, w: 250, h: 110, wall: '#eef3f8', roof: '#5cc4e0', blurb: 'Fly around the world to explore!' },
  { id: 'ferry', name: 'Ferry Dock', emoji: '⛴️', x: 1230, y: 960, w: 240, h: 110, wall: '#f2e3b0', roof: '#2a8fc4', blurb: 'Sail to Style Island and its 13 lands.' },
];
const FOUNTAIN = { x: 800, y: 560, r: 70 };

let townPos = { x: 800, y: 700 };
let townTarget = null;
let townRaf = null;
let townLast = 0;
let townDoor = null;
let townT = 0;
let townRobots = [];
let townBubbleTimer = 0;
const townKeys = { up: false, down: false, left: false, right: false };

function townDoorSpot(b) {
  return { x: b.x + b.w / 2, y: b.y + b.h + 22 };
}

function townBlocked(x, y) {
  if (x < 30 || y < 70 || x > TOWN_W - 30 || y > TOWN_H - 20) return true;
  if (Math.hypot(x - FOUNTAIN.x, y - FOUNTAIN.y) < FOUNTAIN.r + 14) return true;
  return TOWN_BUILDINGS.some((b) => x > b.x - 12 && x < b.x + b.w + 12 && y > b.y - 30 && y < b.y + b.h + 6);
}

function townBuildingSVG(b) {
  const door = { x: b.x + b.w / 2 - 22, y: b.y + b.h - 50 };
  if (b.id === 'runway') {
    const lights = Array.from({ length: 9 }, (_, i) => `<circle cx="${b.x + 30 + i * 52}" cy="${b.y + 14}" r="6" fill="#ffd76a"/>`).join('');
    return `<g>
      <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="16" fill="${b.wall}"/>
      <path d="M${b.x + b.w / 2 - 50},${b.y + 30} L${b.x + b.w / 2 + 50},${b.y + 30} L${b.x + b.w / 2 + 34},${b.y + b.h} L${b.x + b.w / 2 - 34},${b.y + b.h} Z" fill="#e0558f"/>
      ${lights}
      <rect x="${b.x + b.w / 2 - 90}" y="${b.y - 34}" width="180" height="34" rx="10" fill="#ffffff" stroke="${b.roof}" stroke-width="3"/>
      <text x="${b.x + b.w / 2}" y="${b.y - 11}" font-size="18" font-weight="800" text-anchor="middle" fill="#2b2140" font-family="Segoe UI, Helvetica Neue, Arial, sans-serif">${b.emoji} ${b.name}</text>
      <text x="${b.x + 50}" y="${b.y + 110}" font-size="34">🎤</text><text x="${b.x + b.w - 90}" y="${b.y + 110}" font-size="34">📸</text>
    </g>`;
  }
  const windows = [0.2, 0.8].map((f) => `<rect x="${b.x + b.w * f - 26}" y="${b.y + 46}" width="52" height="42" rx="6" fill="#bfe9ff" stroke="#ffffff" stroke-width="4"/>`).join('');
  return `<g>
    <rect x="${b.x + 6}" y="${b.y + b.h - 6}" width="${b.w - 12}" height="12" rx="6" fill="#000000" opacity="0.12"/>
    <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="12" fill="${b.wall}" stroke="#d9cbd9" stroke-width="2"/>
    <path d="M${b.x - 14},${b.y + 14} L${b.x + 18},${b.y - 36} L${b.x + b.w - 18},${b.y - 36} L${b.x + b.w + 14},${b.y + 14} Z" fill="${b.roof}"/>
    <path d="M${b.x - 14},${b.y + 14} L${b.x + b.w + 14},${b.y + 14}" stroke="#ffffff" stroke-width="3" opacity="0.5"/>
    ${windows}
    <rect x="${door.x}" y="${door.y}" width="44" height="50" rx="6" fill="#8a5a2b"/>
    <circle cx="${door.x + 34}" cy="${door.y + 27}" r="3" fill="#f2c94c"/>
    <rect x="${b.x + b.w / 2 - 82}" y="${b.y - 30}" width="164" height="30" rx="10" fill="#ffffff" opacity="0.95"/>
    <text x="${b.x + b.w / 2}" y="${b.y - 9}" font-size="16" font-weight="800" text-anchor="middle" fill="#2b2140" font-family="Segoe UI, Helvetica Neue, Arial, sans-serif">${b.emoji} ${b.name}</text>
    <rect x="${door.x - 8}" y="${b.y + b.h}" width="60" height="10" rx="4" fill="#d9a0b8" opacity="0.8"/>
  </g>`;
}

function townActorSVG(look, id, name, me) {
  return `<g class="town-actor" id="${id}">
      <ellipse cx="0" cy="0" rx="18" ry="6" fill="#000000" opacity="0.18"/>
      <svg x="-24" y="-82" width="48" height="84" viewBox="0 -10 300 530" overflow="visible"><g class="town-bob">${buildDollSVG(look, id)}</g></svg>
      <rect x="-40" y="-104" width="80" height="18" rx="9" fill="${me ? '#e0558f' : '#ffffff'}" opacity="0.92"/>
      <text x="0" y="-91" font-size="11" font-weight="800" text-anchor="middle" fill="${me ? '#ffffff' : '#2b2140'}" font-family="Segoe UI, Helvetica Neue, Arial, sans-serif">${name}</text>
      <g class="town-bubble" id="${id}-bubble" style="display:none">
        <rect x="-70" y="-140" width="140" height="28" rx="12" fill="#ffffff" stroke="#e0d6ea" stroke-width="1.5"/>
        <text x="0" y="-121" font-size="12" font-weight="700" text-anchor="middle" fill="#2b2140" font-family="Segoe UI, Helvetica Neue, Arial, sans-serif"></text>
      </g>
    </g>`;
}

function drawTown() {
  const paths = TOWN_BUILDINGS.map((b) => {
    const d = townDoorSpot(b);
    return `<path d="M${FOUNTAIN.x},${FOUNTAIN.y} Q${(FOUNTAIN.x + d.x) / 2},${d.y} ${d.x},${d.y}" fill="none" stroke="#f4e3d0" stroke-width="46" stroke-linecap="round"/>`;
  }).join('');
  const decoSpots = [[470, 420], [1120, 420], [460, 700], [1130, 700], [80, 360], [1520, 360], [80, 690], [1530, 680], [470, 1040], [1120, 1040], [800, 80], [440, 80], [1160, 80]];
  const deco = decoSpots.map(([x, y], i) => `<text x="${x}" y="${y}" font-size="${i % 3 ? 34 : 42}" text-anchor="middle">${['🌳', '🌷', '🌸', '🌳', '🌼', '🪴'][i % 6]}</text>`).join('')
    + [[650, 470], [950, 470], [650, 660], [950, 660]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="26" text-anchor="middle">🪑</text>`).join('');
  townWrap.innerHTML = `<svg id="town-svg" viewBox="0 0 ${TVIEW_W} ${TVIEW_H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <rect width="${TOWN_W}" height="${TOWN_H}" fill="#bfe7a8"/>
      ${Array.from({ length: 40 }, (_, i) => `<path d="M${(i * 137) % TOWN_W},${(i * 251) % TOWN_H} l4,-8 l4,8" fill="none" stroke="#9fd38a" stroke-width="2"/>`).join('')}
      <circle cx="${FOUNTAIN.x}" cy="${FOUNTAIN.y}" r="230" fill="#f4e3d0"/>
      ${paths}
      <circle cx="${FOUNTAIN.x}" cy="${FOUNTAIN.y}" r="230" fill="none" stroke="#e8d2bc" stroke-width="4" stroke-dasharray="14 10"/>
      <circle cx="${FOUNTAIN.x}" cy="${FOUNTAIN.y}" r="${FOUNTAIN.r}" fill="#9fdcf0" stroke="#ffffff" stroke-width="10"/>
      <circle cx="${FOUNTAIN.x}" cy="${FOUNTAIN.y}" r="24" fill="#ffffff"/>
      <text class="town-fountain" x="${FOUNTAIN.x}" y="${FOUNTAIN.y + 12}" font-size="34" text-anchor="middle">⛲</text>
      ${TOWN_BUILDINGS.map(townBuildingSVG).join('')}
      ${deco}
      <g id="town-actors">
        ${townRobots.map((r) => townActorSVG(r.look, r.id, `🤖 ${r.name}`, false)).join('')}
        ${townActorSVG(currentLookCopy(), 'town-me', 'You ⭐', true)}
      </g>
    </svg>`;
  placeTownActors();
}

function placeTownActors() {
  const me = document.getElementById('town-me');
  if (me) me.setAttribute('transform', `translate(${townPos.x.toFixed(1)},${townPos.y.toFixed(1)})`);
  townRobots.forEach((r) => {
    const el = document.getElementById(r.id);
    if (el) el.setAttribute('transform', `translate(${r.x.toFixed(1)},${r.y.toFixed(1)})`);
  });
  const camX = Math.min(Math.max(townPos.x - TVIEW_W / 2, 0), TOWN_W - TVIEW_W);
  const camY = Math.min(Math.max(townPos.y - TVIEW_H / 2 - 30, 0), TOWN_H - TVIEW_H);
  const svg = document.getElementById('town-svg');
  if (svg) svg.setAttribute('viewBox', `${camX.toFixed(1)} ${camY.toFixed(1)} ${TVIEW_W} ${TVIEW_H}`);
}

function townSay(id, text) {
  const g = document.getElementById(`${id}-bubble`);
  if (!g) return;
  g.querySelector('text').textContent = text;
  g.style.display = '';
  setTimeout(() => { g.style.display = 'none'; }, 2600);
}

function newRobotTarget(r) {
  for (let k = 0; k < 20; k++) {
    const x = 60 + Math.random() * (TOWN_W - 120), y = 120 + Math.random() * (TOWN_H - 180);
    if (!townBlocked(x, y)) { r.tx = x; r.ty = y; return; }
  }
}

function townTick(ts) {
  if (!townLast) townLast = ts;
  const dt = Math.min(0.05, (ts - townLast) / 1000);
  townLast = ts;
  const speed = 250;
  let vx = (townKeys.right ? 1 : 0) - (townKeys.left ? 1 : 0);
  let vy = (townKeys.down ? 1 : 0) - (townKeys.up ? 1 : 0);
  if (vx || vy) townTarget = null;
  else if (townTarget) {
    const dx = townTarget.x - townPos.x, dy = townTarget.y - townPos.y, d = Math.hypot(dx, dy);
    if (d < 6) townTarget = null;
    else { vx = dx / d; vy = dy / d; }
  }
  if (vx || vy) {
    const n = Math.hypot(vx, vy);
    const nx = townPos.x + (vx / n) * speed * dt, ny = townPos.y + (vy / n) * speed * dt;
    let moved = false;
    if (!townBlocked(nx, townPos.y)) { townPos.x = nx; moved = true; }
    if (!townBlocked(townPos.x, ny)) { townPos.y = ny; moved = true; }
    if (!moved) townTarget = null;
    townT += dt;
  }
  const me = document.getElementById('town-me');
  if (me) me.classList.toggle('walking', !!(vx || vy));

  townRobots.forEach((r) => {
    const dx = r.tx - r.x, dy = r.ty - r.y, d = Math.hypot(dx, dy);
    if (r.wait > 0) { r.wait -= dt; return; }
    if (d < 6) { r.wait = 1 + Math.random() * 3; newRobotTarget(r); return; }
    const nx = r.x + (dx / d) * 90 * dt, ny = r.y + (dy / d) * 90 * dt;
    if (townBlocked(nx, ny)) { newRobotTarget(r); return; }
    r.x = nx; r.y = ny;
  });
  townBubbleTimer -= dt;
  if (townBubbleTimer <= 0 && townRobots.length) {
    townBubbleTimer = 2.5 + Math.random() * 2;
    const r = pick(townRobots);
    townSay(r.id, Math.hypot(r.x - townPos.x, r.y - townPos.y) < 220 ? pick(['Hi! 👋', 'Cute outfit! 😍', 'Love your look!', 'Slay! 💅']) : pick(ROBOT_LINES));
  }
  placeTownActors();

  const near = TOWN_BUILDINGS.find((b) => { const d = townDoorSpot(b); return Math.hypot(d.x - townPos.x, d.y - townPos.y) < 60; });
  if (near !== townDoor) {
    townDoor = near || null;
    if (townDoor) showTownPanel(townDoor);
    else townPanel.hidden = true;
  }
  townRaf = requestAnimationFrame(townTick);
}

function showTownPanel(b) {
  townPanel.innerHTML = `
    <div class="map-panel-head"><span class="map-panel-emoji">${b.emoji}</span>
      <div><strong>${b.name}</strong><span>${b.blurb}</span></div></div>
    <div class="map-panel-actions"><button class="btn btn-primary" id="town-enter">🚪 Go Inside</button></div>`;
  townPanel.hidden = false;
  document.getElementById('town-enter').addEventListener('click', () => enterBuilding(b));
}

// Opens a feature from a building, then brings you back to town when it closes.
function returnToTownWhenClosed(overlay) {
  const obs = new MutationObserver(() => {
    if (!overlay.hidden) return;
    if (compState && !compBanner.hidden) return;
    obs.disconnect();
    renderCash();
    exploreOverlay.hidden = false;
    showTown(true);
  });
  obs.observe(overlay, { attributes: true, attributeFilter: ['hidden'] });
}

function enterBuilding(b) {
  if (b.id === 'airport') { showWorld(null); return; }
  if (b.id === 'ferry') { startIsland(); return; }
  const open = {
    dressing: [openWardrobe, wardrobeOverlay],
    hair: [openHairSalon, hairSalonOverlay],
    makeup: [openSalon, salonOverlay],
    nails: [openNailSalon, nailSalonOverlay],
    shop: [openShop, shopOverlay],
    passes: [openPasses, passesOverlay],
    arcade: [openMiniGames, mgOverlay],
    runway: [openCatwalk, catwalkOverlay],
    comp: [() => { openOnline(); startCompetitionLobby(); }, onlineOverlay],
  }[b.id];
  if (!open) return;
  townDoor = null;
  closeExplore();
  open[0]();
  returnToTownWhenClosed(open[1]);
}

function townKey(down) {
  return (e) => {
    const k = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' }[e.key];
    if (!k) return;
    townKeys[k] = down;
    e.preventDefault();
  };
}
const townKeyDown = townKey(true), townKeyUp = townKey(false);

function showTown(keepPos) {
  stopTown();
  stopIsland();
  if (worldRaf) cancelAnimationFrame(worldRaf);
  worldRaf = null;
  stopLand();
  landStage.hidden = true;
  worldStage.hidden = true;
  document.getElementById('map-progress').hidden = true;
  townStage.hidden = false;
  document.getElementById('ex-title').textContent = '🏙️ Style Town';
  if (!keepPos) townPos = { x: 800, y: 700 };
  townTarget = null;
  townDoor = null;
  townPanel.hidden = true;
  if (!townRobots.length) {
    townRobots = ROBOT_NAMES.slice().sort(() => Math.random() - 0.5).slice(0, 6).map((name, i) => {
      const r = { name, id: `tr${i}`, look: robotLook(null).look, x: 0, y: 0, tx: 0, ty: 0, wait: 0 };
      newRobotTarget(r); r.x = r.tx; r.y = r.ty; newRobotTarget(r);
      return r;
    });
  }
  drawTown();
  document.addEventListener('keydown', townKeyDown);
  document.addEventListener('keyup', townKeyUp);
  townLast = 0;
  townRaf = requestAnimationFrame(townTick);
}

function stopTown() {
  if (townRaf) cancelAnimationFrame(townRaf);
  townRaf = null;
  Object.keys(townKeys).forEach((k) => { townKeys[k] = false; });
  document.removeEventListener('keydown', townKeyDown);
  document.removeEventListener('keyup', townKeyUp);
  if (townStage) townStage.hidden = true;
}

townWrap.addEventListener('pointerdown', (e) => {
  const svg = document.getElementById('town-svg');
  if (!svg) return;
  e.preventDefault();
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  // tapping a building walks you to its door
  const b = TOWN_BUILDINGS.find((bb) => p.x > bb.x - 14 && p.x < bb.x + bb.w + 14 && p.y > bb.y - 40 && p.y < bb.y + bb.h + 6);
  if (b) {
    const d = townDoorSpot(b);
    if (townDoor === b) { enterBuilding(b); return; }
    townTarget = d;
    return;
  }
  townTarget = { x: p.x, y: p.y };
});
townWrap.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
townWrap.addEventListener('contextmenu', (e) => e.preventDefault());
[['town-up', 'up'], ['town-down', 'down'], ['town-left', 'left'], ['town-right', 'right']].forEach(([id, k]) => {
  const btn = document.getElementById(id);
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); townKeys[k] = true; });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, () => { townKeys[k] = false; }));
  btn.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
});
document.getElementById('world-to-town').addEventListener('click', () => showTown(true));

// ---------- World Map ----------
// The whole world to explore: fly your plane to real places, read a fun fact,
// and go inside each one. Style Island is one of the stops.

const worldStage = document.getElementById('world-stage');
const worldWrap = document.getElementById('world-wrap');
const worldPanel = document.getElementById('world-panel');
const WORLD_W = 1000, WORLD_H = 560;

const WORLD_PLACES = [
  { id: 'w-newyork', name: 'New York', emoji: '🗽', x: 300, y: 150, theme: 'classic', gradient: 'linear-gradient(180deg, #8fd3ff 0%, #c4ecff 60%, #9aa6b8 60%, #8a95a8 100%)', fact: 'The Statue of Liberty was a gift from France to the United States!' },
  { id: 'w-canada', name: 'Canadian Rockies', emoji: '🍁', x: 215, y: 92, theme: 'christmas', gradient: 'linear-gradient(180deg, #a8dcff 0%, #e6f6ff 62%, #ffffff 62%, #e8f0f8 100%)', fact: 'Canada has more lakes than any other country in the world!' },
  { id: 'w-hawaii', name: 'Hawaii', emoji: '🌺', x: 75, y: 255, theme: 'summer', gradient: 'linear-gradient(180deg, #ffb38a 0%, #ffd9a0 35%, #8fd3ff 36%, #4cb8e0 62%, #f2dfb0 62%)', fact: 'The Hawaiian islands were made by volcanoes in the Pacific Ocean!' },
  { id: 'w-mexico', name: 'Mexico', emoji: '🌵', x: 215, y: 238, theme: 'party', gradient: 'linear-gradient(180deg, #ffd27a 0%, #ffe9b8 60%, #e8b07a 60%, #d89a62 100%)', fact: 'Colourful piñatas are a favourite at Mexican parties!' },
  { id: 'w-rio', name: 'Rio de Janeiro', emoji: '🎭', x: 350, y: 388, theme: 'party', gradient: 'linear-gradient(180deg, #ff9f6a 0%, #ffd27a 40%, #5cc4e0 41%, #3fa9d6 62%, #f2dfb0 62%)', fact: 'Rio\'s Carnival is one of the biggest parties on Earth!' },
  { id: 'w-london', name: 'London', emoji: '💂', x: 455, y: 92, theme: 'school', gradient: 'linear-gradient(180deg, #b8c4d6 0%, #dde4ee 60%, #8a95a8 60%, #7a8598 100%)', fact: 'Big Ben is the name of the giant bell inside the famous clock tower!' },
  { id: 'w-paris', name: 'Paris', emoji: '🗼', x: 505, y: 135, theme: 'metgala', gradient: 'linear-gradient(180deg, #ffc6dc 0%, #ffe6f2 60%, #d9c7b0 60%, #c9b59a 100%)', fact: 'The Eiffel Tower gets a fresh coat of paint about every 7 years!' },
  { id: 'w-rome', name: 'Rome', emoji: '🏛️', x: 552, y: 178, theme: 'classic', gradient: 'linear-gradient(180deg, #ffd9a0 0%, #fff0d6 60%, #d9b48a 60%, #c99f74 100%)', fact: 'The Colosseum in Rome is almost 2,000 years old!' },
  { id: 'w-egypt', name: 'Egypt', emoji: '🐪', x: 585, y: 240, theme: 'summer', gradient: 'linear-gradient(180deg, #ffc46a 0%, #ffe6a8 60%, #e8c98a 60%, #d8b26a 100%)', fact: 'The Great Pyramid was the tallest building in the world for thousands of years!' },
  { id: 'w-kenya', name: 'Kenya Safari', emoji: '🦁', x: 600, y: 335, theme: 'birds', gradient: 'linear-gradient(180deg, #ff9f5a 0%, #ffd27a 55%, #c9b26a 55%, #b89f58 100%)', fact: 'Giraffes, lions and elephants roam the grassy savanna!' },
  { id: 'w-india', name: 'India', emoji: '🕌', x: 705, y: 238, theme: 'metgala', gradient: 'linear-gradient(180deg, #ffb3c6 0%, #ffe0c6 60%, #f2dfc0 60%, #e6ceaa 100%)', fact: 'The Taj Mahal is made of white marble that seems to change colour in the sunlight!' },
  { id: 'w-china', name: 'China', emoji: '🐼', x: 775, y: 168, theme: 'fairy', gradient: 'linear-gradient(180deg, #c8f2c0 0%, #eaffe6 60%, #9fd88a 60%, #86c470 100%)', fact: 'Giant pandas spend about half of their day eating bamboo!' },
  { id: 'w-tokyo', name: 'Tokyo', emoji: '🗻', x: 868, y: 178, theme: 'ballet', gradient: 'linear-gradient(180deg, #ffd6ec 0%, #fff0f6 60%, #c9b6d6 60%, #b8a2c8 100%)', fact: 'In spring, people in Japan have picnics under the cherry blossoms!' },
  { id: 'w-sydney', name: 'Sydney', emoji: '🦘', x: 872, y: 420, theme: 'summer', gradient: 'linear-gradient(180deg, #8fd3ff 0%, #c4ecff 45%, #3fa9d6 46%, #2a8fc4 60%, #f2dfb0 60%)', fact: 'Baby kangaroos are called joeys and ride in their mum\'s pouch!' },
  { id: 'w-antarctica', name: 'Antarctica', emoji: '🐧', x: 500, y: 528, theme: 'christmas', gradient: 'linear-gradient(180deg, #2a3f7a 0%, #6a8fd0 40%, #cfe6ff 62%, #ffffff 62%, #e8f4ff 100%)', fact: 'Antarctica is the coldest place on Earth, and penguins love it!' },
  { id: 'style-island', name: 'Style Island', emoji: '🏝️', x: 412, y: 282, island: true, fact: 'Our very own island, with a land for every style!' },
];
WORLD_PLACES.forEach((pl) => { pl.world = true; });

// Inside-scene settings for each real-world place (used by the land explorer).
Object.assign(LAND_SCENES, {
  'w-newyork': { ground: '#8a95a8', back: ['🏙️', '🗽', '🏢', '🏙️', '🌉'], front: ['🚕', '🌭', '🥨', '🚖', '🌳', '🛍️'], collect: { emoji: '🍎', name: 'big apple', plural: 'big apples' }, particle: null, lines: ['Welcome to the Big Apple!', 'Want a pretzel? 🥨', 'Taxi! 🚕'] },
  'w-canada': { ground: '#ffffff', back: ['🏔️', '🌲', '🏔️', '🌲', '🏔️'], front: ['🦫', '🌲', '🍁', '🦌', '🛶', '🐻'], collect: { emoji: '🍁', name: 'maple leaf', plural: 'maple leaves' }, particle: { emoji: '🍁', dir: 'down' }, lines: ['Hello, eh! 🍁', 'Watch out for the moose!', 'Maple syrup pancakes, anyone?'] },
  'w-hawaii': { ground: '#f2dfb0', back: ['🌋', '🌴', '🌴', '🏄', '🌴'], front: ['🌺', '🐢', '🍍', '🌺', '🥥', '🐠'], collect: { emoji: '🌺', name: 'hibiscus flower', plural: 'hibiscus flowers' }, particle: null, lines: ['Aloha! 🌺', 'Surf\'s up!', 'Look at that volcano! 🌋'] },
  'w-mexico': { ground: '#d89a62', back: ['🌵', '⛰️', '🌵', '🏜️', '🌵'], front: ['🪅', '🌮', '🎺', '🌵', '🌽', '🪅'], collect: { emoji: '🪅', name: 'piñata', plural: 'piñatas' }, particle: { emoji: '🎊', dir: 'down' }, lines: ['¡Hola! 👋', 'Fiesta time! 🎉', 'Tacos for everyone! 🌮'] },
  'w-rio': { ground: '#f2dfb0', back: ['⛰️', '🌴', '🏖️', '🌴', '⛰️'], front: ['🦜', '🥁', '🎭', '⚽', '🦜', '🥥'], collect: { emoji: '🦜', name: 'parrot', plural: 'parrots' }, particle: { emoji: '🎊', dir: 'down' }, lines: ['Olá! Welcome to Carnival!', 'Dance to the drums! 🥁', 'The parrots are so colourful!'] },
  'w-london': { ground: '#7a8598', back: ['🏰', '🕰️', '🎡', '🏰', '🌉'], front: ['💂', '🚌', '☂️', '🫖', '🌳', '🚇'], collect: { emoji: '☂️', name: 'umbrella', plural: 'umbrellas' }, particle: { emoji: '💧', dir: 'down' }, lines: ['Cheerio! 👋', 'Fancy a cup of tea? 🫖', 'It might rain, grab an umbrella!'] },
  'w-paris': { ground: '#c9b59a', back: ['🗼', '🏛️', '🗼', '🏰', '🌳'], front: ['🥐', '🎨', '🌹', '🥖', '☕', '🛍️'], collect: { emoji: '🥐', name: 'croissant', plural: 'croissants' }, particle: { emoji: '🌸', dir: 'down' }, lines: ['Bonjour! 🥐', 'Paris is the city of fashion!', 'Ooh la la, magnifique!'] },
  'w-rome': { ground: '#c99f74', back: ['🏟️', '🏛️', '⛲', '🏛️', '🏟️'], front: ['🍕', '🍝', '🛵', '🍦', '🏺', '🌿'], collect: { emoji: '🍦', name: 'gelato', plural: 'gelatos' }, particle: null, lines: ['Ciao! 👋', 'Toss a coin in the fountain! ⛲', 'Pizza time! 🍕'] },
  'w-egypt': { ground: '#d8b26a', back: ['🏜️', '🐪', '🌴', '🏜️', '🐪'], front: ['🏺', '🌴', '🐫', '🦂', '🏺', '🌞'], collect: { emoji: '🏺', name: 'ancient vase', plural: 'ancient vases' }, particle: null, lines: ['Welcome to the land of the pyramids!', 'Camels can go days without water! 🐪', 'Ancient treasures are buried here!'] },
  'w-kenya': { ground: '#b89f58', back: ['🌳', '🦒', '🌳', '🐘', '🌳'], front: ['🦁', '🦓', '🦒', '🐘', '🦛', '🌾'], collect: { emoji: '🐾', name: 'paw print', plural: 'paw prints' }, particle: null, lines: ['Jambo! Welcome to the safari!', 'Shh... the lions are napping 🦁', 'Look at that tall giraffe! 🦒'] },
  'w-india': { ground: '#e6ceaa', back: ['🕌', '🐘', '🕌', '🌴', '🕌'], front: ['🪷', '🦚', '🪔', '🌺', '🐅', '🪷'], collect: { emoji: '🪷', name: 'lotus flower', plural: 'lotus flowers' }, particle: { emoji: '🌸', dir: 'down' }, lines: ['Namaste! 🙏', 'The peacock is India\'s national bird! 🦚', 'So many beautiful colours!'] },
  'w-china': { ground: '#86c470', back: ['🏯', '🎋', '⛰️', '🎋', '🏯'], front: ['🐼', '🎋', '🏮', '🥟', '🐼', '🐉'], collect: { emoji: '🏮', name: 'lantern', plural: 'lanterns' }, particle: { emoji: '🌸', dir: 'down' }, lines: ['Nǐ hǎo! 👋', 'The pandas are munching bamboo 🐼', 'Dumplings are delicious! 🥟'] },
  'w-tokyo': { ground: '#b8a2c8', back: ['🗻', '🏯', '🌸', '🗼', '🌸'], front: ['🍣', '🌸', '🎎', '🍡', '🚄', '🐱'], collect: { emoji: '🍡', name: 'dango', plural: 'dango' }, particle: { emoji: '🌸', dir: 'down' }, lines: ['Konnichiwa! 👋', 'The cherry blossoms are so pretty 🌸', 'Ride the bullet train! 🚄'] },
  'w-sydney': { ground: '#f2dfb0', back: ['🌉', '🏖️', '🌳', '🌉', '🌳'], front: ['🦘', '🐨', '🏄', '🦘', '🐚', '🌊'], collect: { emoji: '🪃', name: 'boomerang', plural: 'boomerangs' }, particle: null, lines: ['G\'day mate! 👋', 'Koalas sleep most of the day 🐨', 'Hop like a kangaroo! 🦘'] },
  'w-antarctica': { ground: '#ffffff', back: ['🏔️', '🧊', '🏔️', '🐋', '🏔️'], front: ['🐧', '🧊', '🦭', '🐧', '❄️', '🐧'], collect: { emoji: '🐟', name: 'fish for the penguins', plural: 'fish for the penguins' }, particle: { emoji: '❄️', dir: 'down' }, lines: ['Brrrr! Welcome to Antarctica!', 'The penguins are hungry, find them some fish! 🐟', 'Slide on your tummy like a penguin! 🐧'] },
});

let worldPos = { x: 412, y: 282 };
let worldRaf = null;
let worldPlace = null;

function continentPaths() {
  return [
    'M120,70 C180,40 300,50 340,90 C360,120 330,150 300,170 C290,200 260,230 235,258 C220,280 205,300 192,290 C170,262 150,222 132,202 C102,172 82,122 120,70 Z',
    'M360,48 C392,38 422,55 412,80 C402,100 372,95 360,80 Z',
    'M290,300 C330,290 372,320 382,360 C388,402 362,452 332,492 C316,506 300,480 300,450 C296,410 280,360 290,300 Z',
    'M462,88 C502,68 562,78 582,108 C592,140 562,170 534,178 C502,182 472,166 462,142 C456,122 452,104 462,88 Z',
    'M446,84 C454,78 460,92 454,106 C448,110 442,98 446,84 Z',
    'M472,200 C522,190 592,200 612,240 C632,290 612,330 592,370 C572,410 552,442 532,432 C512,412 502,362 492,322 C472,292 457,242 472,200 Z',
    'M592,80 C682,50 822,60 902,100 C942,130 902,170 872,200 C842,240 802,252 762,262 C722,272 692,272 662,252 C632,232 612,202 602,172 C592,142 582,110 592,80 Z',
    'M858,160 C868,154 874,172 866,194 C860,200 852,184 858,160 Z',
    'M792,380 C832,360 892,370 907,400 C917,432 892,456 852,456 C817,456 792,442 787,416 C784,400 785,388 792,380 Z',
    'M300,518 C400,498 600,498 700,518 C722,538 702,556 600,558 L400,558 C320,557 280,540 300,518 Z',
  ];
}

function drawWorld() {
  const explored = WORLD_PLACES.filter((pl) => !pl.island && landQuests.has(pl.id)).length;
  const total = WORLD_PLACES.filter((pl) => !pl.island).length;
  document.getElementById('world-progress').textContent = `🌍 ${explored} / ${total} places explored`;
  const routes = WORLD_PLACES.filter((pl) => !pl.island).map((pl) => `<path d="M412,282 Q${(412 + pl.x) / 2},${Math.min(282, pl.y) - 60} ${pl.x},${pl.y}" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="4 7" opacity="0.55"/>`).join('');
  const lands = continentPaths().map((d) => `<path d="${d}" fill="#a8dc8f" stroke="#86c470" stroke-width="2.5"/>`).join('');
  const places = WORLD_PLACES.map((pl) => {
    const done = pl.island ? false : landQuests.has(pl.id);
    return `<g class="world-place" data-place="${pl.id}">
        ${pl.island ? `<ellipse cx="${pl.x}" cy="${pl.y + 4}" rx="34" ry="18" fill="#f2e3b0" stroke="#e6cf8a" stroke-width="2"/>` : ''}
        <circle cx="${pl.x}" cy="${pl.y}" r="21" fill="#ffffff" stroke="${pl.island ? '#8c5ce0' : done ? '#43b581' : '#e0558f'}" stroke-width="3"/>
        <text x="${pl.x}" y="${pl.y + 8}" font-size="22" text-anchor="middle">${pl.emoji}</text>
        <text x="${pl.x}" y="${pl.y + 37}" font-size="12" font-weight="800" text-anchor="middle" fill="#2b2140" stroke="#ffffff" stroke-width="3" paint-order="stroke" font-family="Segoe UI, Helvetica Neue, Arial, sans-serif">${pl.name}${done ? ' ✅' : ''}</text>
      </g>`;
  }).join('');
  worldWrap.innerHTML = `<svg id="world-svg" viewBox="0 0 ${WORLD_W} ${WORLD_H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <rect width="${WORLD_W}" height="${WORLD_H}" fill="#5cb8e6"/>
      ${Array.from({ length: 18 }, (_, i) => `<path d="M${(i * 97) % 1000},${(i * 151) % 560} q8,-5 16,0 t16,0" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.45"/>`).join('')}
      ${lands}${routes}${places}
      <g id="world-me" transform="translate(${worldPos.x},${worldPos.y})">
        <circle cx="0" cy="-30" r="17" fill="#ffffff" stroke="#8c5ce0" stroke-width="3"/>
        <svg x="-16" y="-47" width="32" height="34" viewBox="88 26 124 124">${buildDollSVG(currentLookCopy(), 'world')}</svg>
        <text x="16" y="-16" font-size="20" text-anchor="middle">✈️</text>
      </g>
    </svg>`;
}

function placeWorldMe() {
  const me = document.getElementById('world-me');
  if (me) me.setAttribute('transform', `translate(${worldPos.x.toFixed(1)},${worldPos.y.toFixed(1)})`);
}

function flyTo(place) {
  if (worldRaf) cancelAnimationFrame(worldRaf);
  worldPanel.hidden = true;
  const from = { ...worldPos };
  const to = { x: place.x, y: place.y };
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const dur = Math.max(400, dist * 2.4);
  const lift = Math.min(90, dist * 0.25);
  let start = 0;
  const step = (ts) => {
    if (!start) start = ts;
    const k = Math.min(1, (ts - start) / dur);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    worldPos = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e - Math.sin(Math.PI * e) * lift };
    placeWorldMe();
    if (k < 1) worldRaf = requestAnimationFrame(step);
    else { worldRaf = null; showWorldPanel(place); }
  };
  worldRaf = requestAnimationFrame(step);
}

function showWorldPanel(place) {
  worldPlace = place;
  const done = !place.island && landQuests.has(place.id);
  worldPanel.innerHTML = `
    <div class="map-panel-head"><span class="map-panel-emoji">${place.emoji}</span>
      <div><strong>${place.name}${done ? ' ✅' : ''}</strong><span>🌍 Fun fact: ${place.fact}</span></div></div>
    <div class="map-panel-actions">
      ${place.island
        ? '<button class="btn btn-primary" id="world-island">🏝️ Visit Style Island</button>'
        : `<button class="btn btn-primary" id="world-enter">🚪 Explore ${place.name}</button>
           <button class="btn btn-ghost" id="world-style">${THEMES.find((t) => t.id === place.theme).emoji} Wear the Look</button>`}
    </div>
    <p class="map-panel-note" id="world-note"></p>`;
  worldPanel.hidden = false;
  if (place.island) {
    document.getElementById('world-island').addEventListener('click', () => { worldPanel.hidden = true; startIsland(); });
  } else {
    document.getElementById('world-enter').addEventListener('click', () => enterLand(place));
    document.getElementById('world-style').addEventListener('click', () => {
      if (state.theme !== place.theme) { state.theme = place.theme; sanitizeStateForTheme(); }
      rebuildThemedLists();
      render();
      document.getElementById('world-note').textContent = `✨ Switched to the ${THEMES.find((t) => t.id === place.theme).label} theme to match ${place.name}!`;
    });
  }
}

function showWorld(fromPlace) {
  stopTown();
  stopIsland();
  if (worldRaf) cancelAnimationFrame(worldRaf);
  worldRaf = null;
  landStage.hidden = true;
  worldStage.hidden = false;
  document.getElementById('map-progress').hidden = true;
  document.getElementById('ex-title').textContent = '🌍 World Explorer';
  if (fromPlace) worldPos = { x: fromPlace.x, y: fromPlace.y };
  drawWorld();
  if (fromPlace) showWorldPanel(fromPlace);
  else worldPanel.hidden = true;
}

worldWrap.addEventListener('pointerdown', (e) => {
  const svg = document.getElementById('world-svg');
  if (!svg) return;
  e.preventDefault();
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  const place = WORLD_PLACES.slice().sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
  if (Math.hypot(place.x - p.x, place.y - p.y) > 45) return;
  if (worldPlace === place && Math.hypot(worldPos.x - place.x, worldPos.y - place.y) < 2) {
    if (place.island) startIsland(); else enterLand(place);
    return;
  }
  flyTo(place);
});
worldWrap.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
worldWrap.addEventListener('contextmenu', (e) => e.preventDefault());
document.getElementById('to-world').addEventListener('click', () => showWorld(WORLD_PLACES.find((pl) => pl.island)));

// ---------- Nail Salon ----------
// A big hand you paint yourself: pick a polish, then rub your finger over a nail.
// Every dab is remembered, and each nail's latest colour shows on the model's fingertips.

const nailSalonOverlay = document.getElementById('nail-salon-overlay');
const nailHand = document.getElementById('nail-hand');

const POLISH_COLORS = ['#e0245e', '#ff6fb0', '#ffb3d6', '#c0293b', '#ff9a5c', '#f2c94c', '#43b581', '#5cc4e0', '#5c7ce0', '#9b6be0', '#2b2b2b', '#ffffff'];
const NAIL_STICKERS = [
  { id: 'heart', label: 'Heart', emoji: '💗' },
  { id: 'star', label: 'Star', emoji: '⭐' },
  { id: 'flower', label: 'Flower', emoji: '🌸' },
  { id: 'dot', label: 'Dots', emoji: '⚪' },
  { id: 'gem', label: 'Gem', emoji: '💎' },
];
const NAIL_ART_LIMIT = 500;

// Finger geometry in the big hand's 300x340 space; nail i sits at the fingertip.
const NAIL_FINGERS = [
  { x1: 92, y1: 236, x2: 44, y2: 156, r: 19 },   // thumb
  { x1: 112, y1: 190, x2: 108, y2: 62, r: 18 },  // index
  { x1: 152, y1: 190, x2: 152, y2: 42, r: 19 },  // middle
  { x1: 192, y1: 190, x2: 196, y2: 58, r: 18 },  // ring
  { x1: 228, y1: 196, x2: 238, y2: 100, r: 15 }, // pinky
];

let nailTool = 'brush';
let nailColor = POLISH_COLORS[0];
let nailGlitter = false;
let nailSticker = 'heart';
let nailPainting = false;

function nailGeom(i) {
  const f = NAIL_FINGERS[i];
  const ang = Math.atan2(f.y2 - f.y1, f.x2 - f.x1);
  const len = f.r * 1.15;
  const cx = f.x2 - Math.cos(ang) * (f.r * 0.15);
  const cy = f.y2 - Math.sin(ang) * (f.r * 0.15);
  return { cx, cy, rx: f.r * 0.72, ry: len, rot: ang * 180 / Math.PI + 90 };
}

function insideNail(i, x, y) {
  const g = nailGeom(i);
  const a = -g.rot * Math.PI / 180;
  const dx = x - g.cx, dy = y - g.cy;
  const lx = dx * Math.cos(a) - dy * Math.sin(a);
  const ly = dx * Math.sin(a) + dy * Math.cos(a);
  return (lx * lx) / (g.rx * g.rx) + (ly * ly) / (g.ry * g.ry) <= 1.15;
}

function stickerSVG(type, x, y) {
  if (type === 'heart') return `<path d="M${x},${y + 4} C${x - 6},${y} ${x - 5},${y - 4} ${x - 2},${y - 3.6} C${x - 1},${y - 3.4} ${x},${y - 2.4} ${x},${y - 1.6} C${x},${y - 2.4} ${x + 1},${y - 3.4} ${x + 2},${y - 3.6} C${x + 5},${y - 4} ${x + 6},${y} ${x},${y + 4} Z" fill="#ff3b7a" stroke="#ffffff" stroke-width="0.8"/>`;
  if (type === 'star') return `<path d="M${x},${y - 5} L${x + 1.5},${y - 1.6} L${x + 5},${y - 1.4} L${x + 2.3},${y + 1} L${x + 3.1},${y + 4.6} L${x},${y + 2.6} L${x - 3.1},${y + 4.6} L${x - 2.3},${y + 1} L${x - 5},${y - 1.4} L${x - 1.5},${y - 1.6} Z" fill="#f2c94c" stroke="#c98f1f" stroke-width="0.6"/>`;
  if (type === 'flower') return `<g>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos(a * Math.PI / 180) * 3).toFixed(1)}" cy="${(y + Math.sin(a * Math.PI / 180) * 3).toFixed(1)}" r="2.4" fill="#ffffff"/>`).join('')}<circle cx="${x}" cy="${y}" r="1.8" fill="#f2c94c"/></g>`;
  if (type === 'dot') return `<circle cx="${x}" cy="${y}" r="2.6" fill="#ffffff"/>`;
  if (type === 'gem') return `<path d="M${x},${y - 4} L${x + 3.4},${y} L${x},${y + 4} L${x - 3.4},${y} Z" fill="#bfe9ff" stroke="#ffffff" stroke-width="0.8"/>`;
  return '';
}

function dabSVG(d) {
  if (d.k === 'sticker') return stickerSVG(d.s, d.x, d.y);
  let out = `<circle cx="${d.x}" cy="${d.y}" r="7.5" fill="${d.c}"/>`;
  if (d.g) {
    out += `<circle cx="${d.x - 3}" cy="${d.y - 2}" r="1" fill="#ffffff" opacity="0.9"/><circle cx="${d.x + 2.5}" cy="${d.y + 2}" r="0.8" fill="#fff7d6" opacity="0.9"/><circle cx="${d.x + 1}" cy="${d.y - 4}" r="0.7" fill="#ffffff" opacity="0.8"/>`;
  }
  return out;
}

function drawNailHand() {
  const skin = state.skin;
  const dark = darken(skin, 0.25);
  const fingers = NAIL_FINGERS.map((f) => `<path d="${capsulePath(f.x1, f.y1, f.r, f.x2, f.y2, f.r * 0.92)}" fill="${skin}" stroke="${dark}" stroke-width="2"/>`).join('');
  const clips = NAIL_FINGERS.map((_, i) => {
    const g = nailGeom(i);
    return `<clipPath id="nail-clip-${i}"><ellipse cx="${g.cx}" cy="${g.cy}" rx="${g.rx}" ry="${g.ry}" transform="rotate(${g.rot} ${g.cx} ${g.cy})"/></clipPath>`;
  }).join('');
  const nails = NAIL_FINGERS.map((_, i) => {
    const g = nailGeom(i);
    const shine = state.nailTopCoat
      ? `<ellipse cx="${g.cx}" cy="${g.cy}" rx="${g.rx * 0.28}" ry="${g.ry * 0.6}" transform="rotate(${g.rot} ${g.cx} ${g.cy}) translate(${-g.rx * 0.35},${-g.ry * 0.1})" fill="#ffffff" opacity="0.55"/>`
      : '';
    return `<g class="nail" data-nail="${i}">
        <ellipse cx="${g.cx}" cy="${g.cy}" rx="${g.rx}" ry="${g.ry}" transform="rotate(${g.rot} ${g.cx} ${g.cy})" fill="#f7ddd5" stroke="#e3b9ab" stroke-width="1.5"/>
        <g clip-path="url(#nail-clip-${i})" class="nail-paint" id="nail-paint-${i}">${(state.nailArt[i] || []).map(dabSVG).join('')}</g>
        ${shine}
        <ellipse cx="${g.cx}" cy="${g.cy}" rx="${g.rx}" ry="${g.ry}" transform="rotate(${g.rot} ${g.cx} ${g.cy})" fill="none" stroke="#d9a99a" stroke-width="1.2" opacity="0.8"/>
      </g>`;
  }).join('');
  nailHand.innerHTML = `<svg viewBox="0 0 300 340" xmlns="http://www.w3.org/2000/svg" id="nail-hand-svg">
      <defs>${clips}</defs>
      <ellipse cx="160" cy="330" rx="120" ry="14" fill="#000000" opacity="0.08"/>
      ${fingers}
      <path d="M78,340 L76,214 Q78,184 112,178 L240,180 Q250,186 250,212 L248,340 Z" fill="${skin}"/>
      <path d="M78,340 L76,214 Q78,190 96,182 M250,206 Q250,220 249,240 L248,340" fill="none" stroke="${dark}" stroke-width="2"/>
      <path d="M126,196 Q132,200 138,196 M166,194 Q172,198 178,194 M204,196 Q210,200 216,196" fill="none" stroke="${dark}" stroke-width="1.4" opacity="0.5"/>
      ${nails}
    </svg>`;
}

function svgPoint(evt) {
  const svg = document.getElementById('nail-hand-svg');
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function nailAt(x, y) {
  for (let i = 0; i < NAIL_FINGERS.length; i++) if (insideNail(i, x, y)) return i;
  return -1;
}

function addDab(i, dab) {
  const art = state.nailArt[i];
  art.push(dab);
  if (art.length > NAIL_ART_LIMIT) art.splice(0, art.length - NAIL_ART_LIMIT);
  const g = document.getElementById(`nail-paint-${i}`);
  if (g) g.insertAdjacentHTML('beforeend', dabSVG(dab));
  if (dab.k !== 'sticker') state.nails[i] = dab.c;
}

function nailAction(evt, first) {
  const { x, y } = svgPoint(evt);
  const i = nailAt(x, y);
  if (i < 0) return;
  const rx = Math.round(x * 10) / 10, ry = Math.round(y * 10) / 10;
  if (nailTool === 'brush') {
    addDab(i, { k: 'paint', x: rx, y: ry, c: nailColor, g: nailGlitter });
  } else if (nailTool === 'sticker' && first) {
    addDab(i, { k: 'sticker', x: rx, y: ry, s: nailSticker });
  } else if (nailTool === 'remover' && first) {
    state.nailArt[i] = [];
    state.nails[i] = null;
    drawNailHand();
  }
}

nailHand.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  nailPainting = true;
  try { nailHand.setPointerCapture(e.pointerId); } catch (err) {}
  nailAction(e, true);
});
nailHand.addEventListener('pointermove', (e) => {
  if (!nailPainting) return;
  e.preventDefault();
  nailAction(e, false);
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => nailHand.addEventListener(ev, () => { nailPainting = false; render(); }));
nailHand.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
nailHand.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
nailHand.addEventListener('contextmenu', (e) => e.preventDefault());

function setNailTool(tool) {
  nailTool = tool;
  highlightSelection('#nail-tools', nailTool, 'id');
  document.getElementById('nail-sticker-row').hidden = tool !== 'sticker';
  document.getElementById('nail-color-row').hidden = tool !== 'brush';
  document.getElementById('nail-hint').textContent = {
    brush: '🖌️ Rub your finger across a nail to paint it.',
    sticker: '⭐ Tap a nail to add a sticker.',
    remover: '🧽 Tap a nail to wipe it clean.',
  }[tool];
}

function buildNailSalon() {
  buildOptionButtons(document.getElementById('nail-tools'), [
    { id: 'brush', label: 'Brush', emoji: '🖌️' },
    { id: 'sticker', label: 'Stickers', emoji: '⭐' },
    { id: 'remover', label: 'Remover', emoji: '🧽' },
  ], setNailTool);
  buildSwatches(document.getElementById('nail-colors'), POLISH_COLORS, (c) => { nailColor = c; highlightSelection('#nail-colors', nailColor, 'color'); });
  buildOptionButtons(document.getElementById('nail-glitter'), [{ id: 'glitter', label: 'Glitter Polish', emoji: '✨' }], () => {
    nailGlitter = !nailGlitter;
    document.querySelector('#nail-glitter .option-btn').classList.toggle('selected', nailGlitter);
  });
  buildOptionButtons(document.getElementById('nail-stickers'), NAIL_STICKERS, (id) => { nailSticker = id; highlightSelection('#nail-stickers', nailSticker, 'id'); });
  highlightSelection('#nail-colors', nailColor, 'color');
  highlightSelection('#nail-stickers', nailSticker, 'id');
  document.querySelector('#nail-glitter .option-btn').classList.toggle('selected', nailGlitter);
  setNailTool(nailTool);
}

function paintAllNails() {
  NAIL_FINGERS.forEach((_, i) => {
    const g = nailGeom(i);
    state.nailArt[i] = [];
    const a = g.rot * Math.PI / 180;
    for (let k = -2; k <= 2; k++) for (let j = -1; j <= 1; j++) {
      const lx = j * g.rx * 0.6, ly = k * g.ry * 0.42;
      const x = g.cx + lx * Math.cos(a) - ly * Math.sin(a);
      const y = g.cy + lx * Math.sin(a) + ly * Math.cos(a);
      state.nailArt[i].push({ k: 'paint', x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, c: nailColor, g: nailGlitter });
    }
    state.nails[i] = nailColor;
  });
  drawNailHand();
  render();
}

function removeAllNails() {
  state.nailArt = [[], [], [], [], []];
  state.nails = [null, null, null, null, null];
  state.nailTopCoat = false;
  drawNailHand();
  render();
}

function openNailSalon() {
  if (!Array.isArray(state.nailArt) || state.nailArt.length !== 5) state.nailArt = [[], [], [], [], []];
  if (!Array.isArray(state.nails) || state.nails.length !== 5) state.nails = [null, null, null, null, null];
  buildNailSalon();
  drawNailHand();
  nailSalonOverlay.hidden = false;
}

function closeNailSalon() {
  nailSalonOverlay.hidden = true;
  render();
}

document.getElementById('nail-salon-btn').addEventListener('click', openNailSalon);
document.getElementById('ns-close').addEventListener('click', closeNailSalon);
document.getElementById('ns-done').addEventListener('click', closeNailSalon);
document.getElementById('ns-all').addEventListener('click', paintAllNails);
document.getElementById('ns-clear').addEventListener('click', removeAllNails);
document.getElementById('ns-topcoat').addEventListener('click', () => { state.nailTopCoat = !state.nailTopCoat; drawNailHand(); });
nailSalonOverlay.addEventListener('click', (e) => {
  if (e.target === nailSalonOverlay) closeNailSalon();
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

function markSalonCustom(id, value, palette) {
  const lab = document.querySelector(`#${id} .custom-color`);
  if (!lab) return;
  const inPalette = !value || value === 'none' || palette.includes(value);
  lab.classList.toggle('selected', !inPalette);
  if (value && value !== 'none' && /^#[0-9a-f]{6}$/i.test(value)) lab.querySelector('input').value = value;
}

function highlightSalon() {
  const f = state.face;
  highlightSelection('#salon-shadow', f.eyeshadow || 'none', 'color');
  highlightSelection('#salon-blush', f.blush ? (f.blushColor || '#ff8fa3') : 'none', 'color');
  highlightSelection('#salon-lips', f.lipColor, 'color');
  highlightSelection('#salon-liner-color', f.linerColor || '#1a1a1a', 'color');
  highlightSelection('#salon-highlight', f.highlight || 'none', 'color');
  markSalonCustom('salon-shadow', f.eyeshadow, EYESHADOW_COLORS);
  markSalonCustom('salon-blush', f.blush ? f.blushColor : null, BLUSH_COLORS);
  markSalonCustom('salon-lips', f.lipColor, SALON_LIP_COLORS);
  markSalonCustom('salon-liner-color', f.linerColor, LINER_COLORS);
  markSalonCustom('salon-highlight', f.highlight, HIGHLIGHT_COLORS);
  highlightSelection('#salon-shadow-style', f.shadowStyle || 'soft', 'id');
  highlightSelection('#salon-liner', f.liner || 'none', 'id');
  highlightSelection('#salon-lip-shape', f.lipShape || 'line', 'id');
  highlightSelection('#salon-lip-finish', f.lipFinish || (f.gloss ? 'gloss' : 'satin'), 'id');
  document.querySelectorAll('#salon-contour .option-btn').forEach((b) => b.classList.toggle('selected', !!f[b.dataset.id]));
  highlightSelection('#salon-lashes', f.lashes || 'none', 'id');
  highlightSelection('#salon-cheek', f.cheekArt || 'none', 'id');
  document.querySelectorAll('#salon-extras .option-btn').forEach((b) => {
    b.classList.toggle('selected', !!f[b.dataset.id]);
  });
  document.querySelectorAll('#salon-spa .option-btn').forEach((b) => {
    b.classList.toggle('selected', !!state.accessories[b.dataset.id]);
  });
}

function buildSalonSwatches(id, colors, onPick, withNone, withCustom = true) {
  const el = document.getElementById(id);
  buildSwatches(el, colors, onPick);
  if (withCustom) {
    const lab = document.createElement('label');
    lab.className = 'custom-color custom-color-mini';
    lab.title = 'Pick any colour';
    lab.innerHTML = '<input type="color" value="#e0558f" aria-label="Pick any colour"><span class="custom-color-dot"></span><span>Any</span>';
    lab.querySelector('input').addEventListener('input', (e) => onPick(e.target.value));
    el.appendChild(lab);
  }
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
  buildSalonSwatches('salon-liner-color', LINER_COLORS, (c) => salonSet(() => {
    state.face.linerColor = c;
    if (!state.face.liner || state.face.liner === 'none') state.face.liner = 'thin';
  }), false);
  buildSalonSwatches('salon-highlight', HIGHLIGHT_COLORS, (c) => salonSet(() => { state.face.highlight = c === 'none' ? null : c; }), true);
  buildOptionButtons(document.getElementById('salon-shadow-style'), SHADOW_STYLES, (id) => salonSet(() => {
    state.face.shadowStyle = id;
    if (!state.face.eyeshadow) state.face.eyeshadow = EYESHADOW_COLORS[0];
  }));
  buildOptionButtons(document.getElementById('salon-liner'), LINER_STYLES, (id) => salonSet(() => { state.face.liner = id; }));
  buildOptionButtons(document.getElementById('salon-lip-shape'), LIP_SHAPES, (id) => salonSet(() => {
    state.face.lipShape = id;
    if (id === 'full' && state.face.mouth !== 'neutral') state.face.mouth = 'smile';
  }));
  buildOptionButtons(document.getElementById('salon-lip-finish'), LIP_FINISHES, (id) => salonSet(() => {
    state.face.lipFinish = id;
    state.face.gloss = id === 'gloss';
  }));
  buildOptionButtons(document.getElementById('salon-contour'), [
    { id: 'contour', label: 'Contour', emoji: '🎨' },
  ], (id) => salonSet(() => { state.face[id] = !state.face[id]; }));
  buildOptionButtons(document.getElementById('salon-presets'), MAKEUP_PRESETS, (id) => salonSet(() => {
    const preset = MAKEUP_PRESETS.find((m) => m.id === id);
    Object.assign(state.face, { glitter: false, freckles: false, cheekArt: 'none', gems: false }, preset.face);
  }));
  buildOptionButtons(document.getElementById('salon-lashes'), LASH_STYLES, (id) => salonSet(() => { state.face.lashes = id; }));
  buildOptionButtons(document.getElementById('salon-cheek'), CHEEK_ART, (id) => salonSet(() => { state.face.cheekArt = id; }));
  buildOptionButtons(document.getElementById('salon-extras'), [
    { id: 'glitter', label: 'Glitter', emoji: '✨' },
    { id: 'freckles', label: 'Freckles', emoji: '⁘' },
    { id: 'gems', label: 'Goddess Gems', emoji: '💎' },
  ], (id) => salonSet(() => { state.face[id] = !state.face[id]; }));
  buildOptionButtons(document.getElementById('salon-spa'), ACCESSORIES.filter((a) => ['sheet-mask', 'cucumber-eyes', 'clay-mask', 'sleeping-mask'].includes(a.id)),
    (id) => salonSet(() => { state.accessories[id] = !state.accessories[id]; }));
}

const MAKEUP_PRESETS = [
  { id: 'natural', label: 'Natural', emoji: '🌸', face: { eyeshadow: '#d9a98c', shadowStyle: 'soft', liner: 'thin', linerColor: '#5a3825', lashes: 'natural', blush: true, blushColor: '#ff8fa3', lipColor: '#c9707d', lipShape: 'full', lipFinish: 'satin', gloss: false, highlight: '#fff6e8', contour: false, gems: false } },
  { id: 'glam', label: 'Red Carpet', emoji: '💋', face: { eyeshadow: '#8a5a2b', shadowStyle: 'smoky', liner: 'wing', linerColor: '#1a1a1a', lashes: 'glam', blush: true, blushColor: '#d9826b', lipColor: '#c0293b', lipShape: 'full', lipFinish: 'matte', gloss: false, highlight: '#f7e1b5', contour: true, gems: false } },
  { id: 'goddess', label: 'Goddess', emoji: '🏛️', face: { eyeshadow: '#d4a017', shadowStyle: 'shimmer', liner: 'cat', linerColor: '#1a1a1a', lashes: 'long', blush: true, blushColor: '#ffb38a', lipColor: '#b5655a', lipShape: 'full', lipFinish: 'gloss', gloss: true, highlight: '#f2c94c', contour: true, gems: true } },
  { id: 'pink', label: 'Pretty in Pink', emoji: '🎀', face: { eyeshadow: '#ff8fc7', shadowStyle: 'soft', liner: 'thin', linerColor: '#5a3825', lashes: 'long', blush: true, blushColor: '#ff6f91', lipColor: '#ff6fb0', lipShape: 'full', lipFinish: 'gloss', gloss: true, highlight: '#ffc6d9', contour: false, gems: false } },
  { id: 'party', label: 'Sparkle Party', emoji: '🪩', face: { eyeshadow: '#c9a6ff', shadowStyle: 'shimmer', liner: 'wing', linerColor: '#8c5ce0', lashes: 'rainbow', blush: true, blushColor: '#ffa8c5', lipColor: '#9b6be0', lipShape: 'full', lipFinish: 'shimmer', gloss: false, highlight: '#d6f0ff', contour: false, gems: false, glitter: true } },
  { id: 'smoky', label: 'Smoky Night', emoji: '🌙', face: { eyeshadow: '#2b2b2b', shadowStyle: 'smoky', liner: 'cat', linerColor: '#1a1a1a', lashes: 'glam', blush: true, blushColor: '#d9826b', lipColor: '#8c4a6b', lipShape: 'full', lipFinish: 'matte', gloss: false, highlight: '#f7e1b5', contour: true, gems: false } },
  { id: 'fresh', label: 'Fresh Face', emoji: '🧼', face: { eyeshadow: null, shadowStyle: 'soft', liner: 'none', lashes: 'none', blush: true, blushColor: '#ff8fa3', lipColor: '#c9707d', lipShape: 'line', lipFinish: 'satin', gloss: false, highlight: null, contour: false, gems: false, glitter: false, cheekArt: 'none' } },
];

// ---------- Custom Makeup Kit ($200) and saved faces ----------
const CUSTOM_MAKEUP_ID = 'custom-makeup-kit';
const CUSTOM_MAKEUP_PRICE = 200;
const SAVED_FACES_KEY = 'runwayReady.savedFaces';
const MAX_SAVED_FACES = 8;
let savedFaces = [];
try {
  const raw = JSON.parse(localStorage.getItem(SAVED_FACES_KEY) || '[]');
  if (Array.isArray(raw)) savedFaces = raw.filter((f) => f && f.face).slice(0, MAX_SAVED_FACES);
} catch (e) {}

function hasCustomMakeup() { return owned.has(CUSTOM_MAKEUP_ID); }
function persistSavedFaces() {
  try { localStorage.setItem(SAVED_FACES_KEY, JSON.stringify(savedFaces)); } catch (e) {}
}

function faceThumbSVG(face) {
  return `<svg viewBox="108 62 84 62" xmlns="http://www.w3.org/2000/svg">
    <rect x="100" y="55" width="100" height="80" fill="${state.skin}"/>
    ${buildFaceSVG({ ...DEFAULT_FACE, ...face }, state.hair.color)}
  </svg>`;
}

function salonMessage(text) {
  const el = document.getElementById('salon-save-msg');
  el.textContent = text;
  el.hidden = !text;
}

function renderSavedFaces() {
  const box = document.getElementById('salon-saved-box');
  const list = document.getElementById('salon-saved');
  box.hidden = !hasCustomMakeup();
  list.innerHTML = '';
  if (!savedFaces.length) {
    list.innerHTML = '<p class="saved-empty">No saved faces yet. Make a look, then tap 💾 Save Face!</p>';
    return;
  }
  savedFaces.forEach((sf, i) => {
    const card = document.createElement('div');
    card.className = 'saved-face';
    const use = document.createElement('button');
    use.className = 'saved-face-use';
    use.setAttribute('aria-label', `Put on ${sf.name}`);
    use.innerHTML = `<span class="saved-face-pic">${faceThumbSVG(sf.face)}</span><span>${sf.name}</span>`;
    use.addEventListener('click', () => salonSet(() => { Object.assign(state.face, sf.face); }));
    const del = document.createElement('button');
    del.className = 'saved-face-del';
    del.setAttribute('aria-label', `Delete ${sf.name}`);
    del.textContent = '✕';
    del.addEventListener('click', () => {
      savedFaces.splice(i, 1);
      persistSavedFaces();
      renderSavedFaces();
      salonMessage(`🗑️ ${sf.name} deleted.`);
    });
    card.append(use, del);
    list.appendChild(card);
  });
}

function saveCurrentFace() {
  if (!hasCustomMakeup()) return;
  if (savedFaces.length >= MAX_SAVED_FACES) {
    salonMessage(`You can save up to ${MAX_SAVED_FACES} faces. Tap ✕ on one to make room.`);
    return;
  }
  let n = savedFaces.length + 1;
  while (savedFaces.some((f) => f.name === `My Face ${n}`)) n++;
  savedFaces.push({ name: `My Face ${n}`, face: { ...state.face } });
  persistSavedFaces();
  renderSavedFaces();
  salonMessage(`💾 Saved as "My Face ${n}"!`);
}

function renderSalonLock() {
  const unlocked = hasCustomMakeup();
  document.getElementById('salon-lock').hidden = unlocked;
  document.getElementById('salon-custom').hidden = !unlocked;
  document.getElementById('salon-save').hidden = !unlocked;
  document.getElementById('salon-subtitle').textContent = unlocked
    ? 'Tap a colour or style to try it on, or tap 🌈 Any to mix your own colour. Tap 💾 Save Face to keep a look!'
    : 'Tap a default face to try it on for free. Buy the Custom Makeup Kit to make your own!';
  const buy = document.getElementById('salon-buy');
  const note = document.getElementById('salon-lock-note');
  const short = CUSTOM_MAKEUP_PRICE - cash;
  buy.disabled = short > 0;
  note.textContent = short > 0
    ? `You have $${cash}. Earn $${short} more on the runway or in the mini games. Until then, try the free Default Faces above!`
    : `You have $${cash}. You can buy it now!`;
  renderSavedFaces();
}

function buyCustomMakeup() {
  if (hasCustomMakeup() || cash < CUSTOM_MAKEUP_PRICE) return;
  cash -= CUSTOM_MAKEUP_PRICE;
  owned.add(CUSTOM_MAKEUP_ID);
  saveShop();
  renderCash();
  renderSalonLock();
  salonMessage('🎉 You bought the Custom Makeup Kit! Make any face you like and save it.');
}

function wipeMakeup() {
  salonSet(() => {
    Object.assign(state.face, { eyeshadow: null, blushColor: '#ff8fa3', gloss: false, glitter: false, cheekArt: 'none', lashes: 'none', lipColor: '#c9707d', blush: true,
      shadowStyle: 'soft', liner: 'none', linerColor: '#1a1a1a', lipShape: 'line', lipFinish: 'satin', highlight: null, contour: false, gems: false });
    ['sheet-mask', 'cucumber-eyes', 'clay-mask', 'sleeping-mask'].forEach((id) => { state.accessories[id] = false; });
  });
}

function openSalon() {
  buildSalon();
  renderSalonLock();
  salonMessage('');
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
document.getElementById('salon-save').addEventListener('click', saveCurrentFace);
document.getElementById('salon-buy').addEventListener('click', buyCustomMakeup);
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
  { id: 'spot', label: 'Spot the Match', emoji: '🔍', blurb: 'Look at the model on top, then find her exact twin below. Watch the tiny details!', reward: 'Up to 8 pass points + $16' },
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
  if (id === 'spot') startSpot();
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

// --- Spot the Match ---
// A target model, plus look-alikes that each differ by one detail. Find the exact twin.
function cloneLook(look) {
  return { ...look, hair: { ...look.hair }, outfit: { ...look.outfit }, shoes: { ...look.shoes }, accessories: { ...look.accessories }, face: { ...look.face } };
}

function tweakLook(base, used) {
  const v = cloneLook(base);
  const differentFrom = (list, current) => pick(list.filter((x) => x !== current));
  const plainOutfits = freeItems(OUTFIT_STYLES).filter((o) => !o.theme && !o.fixedColor).map((o) => o.id);
  const plainShoes = freeItems(SHOE_STYLES).filter((o) => !o.theme).map((o) => o.id);
  const plainHair = freeItems(HAIR_STYLES).filter((o) => !o.theme).map((o) => o.id);
  const plainAcc = freeItems(ACCESSORIES).filter((a) => !a.theme && !a.behindSvg).map((a) => a.id);
  const changes = [
    ['outfit colour', () => { v.outfit.color = differentFrom(OUTFIT_COLORS, base.outfit.color); }],
    ['hair colour', () => { v.hair.color = differentFrom(SALON_HAIR_COLORS, base.hair.color); }],
    ['hairstyle', () => { v.hair.style = differentFrom(plainHair, base.hair.style); }],
    ['shoes', () => { v.shoes.style = differentFrom(plainShoes, base.shoes.style); }],
    ['shoe colour', () => { v.shoes.color = differentFrom(SHOE_COLORS, base.shoes.color); }],
    ['accessory', () => {
      const on = Object.keys(v.accessories).filter((k) => v.accessories[k]);
      if (on.length && Math.random() < 0.5) v.accessories[pick(on)] = false;
      else v.accessories[pick(plainAcc.filter((a) => !v.accessories[a]))] = true;
    }],
    ['outfit', () => { v.outfit.style = differentFrom(plainOutfits, base.outfit.style); }],
    ['skin', () => { v.skin = differentFrom(SKIN_TONES, base.skin); }],
  ];
  const options = changes.filter(([name]) => !used.has(name));
  const [name, apply] = pick(options.length ? options : changes);
  used.add(name);
  apply();
  return v;
}

function startSpot() {
  const ROUNDS = 8;
  let round = 0;
  let firstTry = 0;
  let missedThisRound = false;
  const update = () => { mgHud.textContent = `🔍 Round ${round + 1} / ${ROUNDS} · ✅ ${firstTry} found first try`; };
  const nextRound = () => {
    if (round >= ROUNDS) {
      finishMiniGame(firstTry === ROUNDS ? '🏆 Perfect eye for detail!' : `🔍 You found ${firstTry} on the first try!`, firstTry, firstTry * 2);
      return;
    }
    missedThisRound = false;
    update();
    const base = robotLook(null).look;
    base.outfit.style = pick(freeItems(OUTFIT_STYLES).filter((o) => !o.theme && !o.fixedColor)).id;
    const count = round < 3 ? 4 : 6;
    const used = new Set();
    const cands = Array.from({ length: count - 1 }, () => ({ look: tweakLook(base, used), twin: false }));
    cands.push({ look: cloneLook(base), twin: true });
    cands.sort(() => Math.random() - 0.5);
    mgArea.innerHTML = `
      <div class="spot-target"><span class="spot-label">🎯 Find this model</span>${dollThumb(base, `spt${round}`)}</div>
      <div class="spot-grid spot-grid-${count}">${cands.map((c, i) => `<button class="spot-card" data-i="${i}" aria-label="Model ${i + 1}">${dollThumb(c.look, `spc${round}_${i}`)}</button>`).join('')}</div>`;
    mgArea.querySelectorAll('.spot-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = cands[Number(btn.dataset.i)];
        if (btn.disabled) return;
        if (c.twin) {
          btn.classList.add('right');
          if (!missedThisRound) firstTry += 1;
          mgArea.querySelectorAll('.spot-card').forEach((b) => { b.disabled = true; });
          round += 1;
          update();
          setTimeout(nextRound, 650);
        } else {
          missedThisRound = true;
          btn.classList.add('wrong');
          btn.disabled = true;
        }
      });
    });
  };
  nextRound();
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

// Painted nail tips on the small doll hands (fingers 1-4; the thumb is hidden).
const DOLL_NAIL_SPOTS = { L: [[-4.8, 12.4], [-0.8, 14.4], [2.8, 13.4], [6.6, 10.9]], R: [[4.8, 12.4], [0.8, 14.4], [-2.8, 13.4], [-6.6, 10.9]] };

function dollNailsSVG(side, nails) {
  if (!nails) return '';
  return DOLL_NAIL_SPOTS[side].map(([x, y], i) => {
    const c = nails[i + 1];
    return c ? `<ellipse class="doll-nail" cx="${x}" cy="${y}" rx="1.35" ry="1.8" fill="${c}" stroke="none"/>` : '';
  }).join('');
}

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

function posedArmsSVG(skinGrad, nails) {
  const side = (k) => `
    <path class="pa-${k}-uo" fill="rgba(40,28,20,0.28)"/>
    <path class="pa-${k}-fo" fill="rgba(40,28,20,0.28)"/>
    <path class="pa-${k}-u"/>
    <path class="pa-${k}-f"/>
    <g class="pa-${k}-hand" stroke="rgba(40,28,20,0.28)" stroke-width="1.2">${HAND_SHAPES[k]}${dollNailsSVG(k, nails)}</g>`;
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
  if (outfitPieces(state).some((pc) => ['mermaid', 'mermaid-tail', 'ocean-sparkle-tail'].includes(pc.style))) return 'swim';
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


// ---------- 👑 VIP Lounge ----------
const vipOverlay = document.getElementById('vip-overlay');

function vipTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function vipBonusClaimedToday() {
  try { return localStorage.getItem(VIP_BONUS_KEY) === vipTodayKey(); } catch (e) { return false; }
}

function vipItems() {
  return [
    ...OUTFIT_STYLES.filter((i) => i.vip).map((item) => ({ item, kind: 'outfit' })),
    ...ACCESSORIES.filter((i) => i.vip).map((item) => ({ item, kind: 'accessory' })),
    ...BACKGROUNDS.filter((i) => i.vip).map((item) => ({ item, kind: 'background' })),
  ];
}

function vipToast(text) {
  const el = document.getElementById('vip-toast');
  el.textContent = text || '';
  el.hidden = !text;
}

function renderVip() {
  const member = isVip();
  document.getElementById('vip-cash').textContent = `💵 $${cash}`;
  document.getElementById('vip-gate').hidden = member;
  document.getElementById('vip-inside').hidden = !member;
  const join = document.getElementById('vip-join');
  const short = VIP_PRICE - cash;
  join.disabled = short > 0;
  document.getElementById('vip-join-note').textContent = short > 0
    ? `You have $${cash}. Earn $${short} more on the runway or in the mini games to get past the velvet rope!`
    : `You have $${cash}. Step right in!`;
  const bonus = document.getElementById('vip-bonus');
  const claimed = vipBonusClaimedToday();
  bonus.disabled = claimed;
  bonus.textContent = claimed ? '✅ Bonus collected! Come back tomorrow' : `🎁 Collect today's $${VIP_DAILY_BONUS} VIP bonus`;
  const grid = document.getElementById('vip-closet');
  grid.innerHTML = '';
  vipItems().forEach(({ item, kind }) => {
    const card = document.createElement('div');
    card.className = 'vip-card';
    card.innerHTML = `<span class="vip-card-emoji">${item.emoji}</span><span class="vip-card-label">${item.label}</span>`;
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary vip-try';
    btn.textContent = kind === 'background' ? 'Go there' : 'Try on';
    btn.addEventListener('click', () => {
      tryOn(item, kind);
      rebuildThemedLists();
      render();
      vipToast(`✨ ${item.label} is on! You look like a superstar.`);
    });
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

function joinVip() {
  if (isVip() || cash < VIP_PRICE) return;
  cash -= VIP_PRICE;
  owned.add(VIP_ID);
  saveShop();
  renderCash();
  rebuildThemedLists();
  render();
  renderVip();
  vipToast('🎉 Welcome to VIP! The velvet rope is open just for you.');
}

function collectVipBonus() {
  if (!isVip() || vipBonusClaimedToday()) return;
  try { localStorage.setItem(VIP_BONUS_KEY, vipTodayKey()); } catch (e) {}
  cash += VIP_DAILY_BONUS;
  saveShop();
  renderCash();
  renderVip();
  vipToast(`💵 +$${VIP_DAILY_BONUS}! Thanks for being VIP.`);
}

function openVip() {
  document.querySelectorAll('.modal-overlay').forEach((o) => { if (o !== vipOverlay) o.hidden = true; });
  vipToast('');
  renderVip();
  vipOverlay.hidden = false;
}
function closeVip() { vipOverlay.hidden = true; }

document.getElementById('vip-btn').addEventListener('click', openVip);
document.getElementById('vip-close').addEventListener('click', closeVip);
document.getElementById('vip-join').addEventListener('click', joinVip);
document.getElementById('vip-bonus').addEventListener('click', collectVipBonus);
vipOverlay.addEventListener('click', (e) => { if (e.target === vipOverlay) closeVip(); });
renderCash();
