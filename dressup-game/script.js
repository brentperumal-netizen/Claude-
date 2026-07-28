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
  { id: 'crop', label: 'Short Crop', emoji: '💈',
    svg: `<path d="M100,78 A52,52 0 0 1 200,78 L198,96 A50,42 0 0 0 102,96 Z"/>
          <path d="M116,64 Q128,56 140,60" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.25"/>` },
];

const HAIR_COLORS = ['#2b2b2b', '#4b2e1e', '#8a5a2b', '#d9b45a', '#e0558f', '#8c5ce0', '#5cc4e0', '#e0e0e0'];

const OUTFIT_STYLES = [
  { id: 'aline', label: 'A-Line Dress', emoji: '👗',
    svg: `<path d="M118,150 L182,150 L214,340 Q150,358 86,340 Z"/>
          <path d="M125,156 L120,328" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.15" stroke-linecap="round"/>
          <path d="M96,252 Q150,260 204,252" fill="none" stroke="#000000" stroke-width="2" opacity="0.12"/>
          <path d="M118,150 L182,150 L179,164 L121,164 Z" fill="#000000" opacity="0.08"/>` },
  { id: 'mermaid', label: 'Mermaid Gown', emoji: '💃',
    svg: `<path d="M120,150 L180,150 L184,300 Q214,330 200,400 L100,400 Q86,330 116,300 Z"/>
          <path d="M128,158 L126,288" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.16" stroke-linecap="round"/>
          <path d="M104,318 Q150,330 196,318" fill="none" stroke="#000000" stroke-width="2" opacity="0.12"/>
          <path d="M120,150 L180,150 L177,163 L123,163 Z" fill="#000000" opacity="0.08"/>` },
  { id: 'jumpsuit', label: 'Jumpsuit', emoji: '👖',
    svg: `<path d="M118,150 L182,150 L188,250 L150,262 L112,250 Z"/>
          <path d="M112,250 L150,262 L146,430 L108,430 Z"/>
          <path d="M188,250 L150,262 L154,430 L192,430 Z"/>
          <line x1="150" y1="152" x2="150" y2="248" stroke="#000000" stroke-width="1.4" opacity="0.15"/>
          <path d="M122,262 L118,418" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.15" stroke-linecap="round"/>
          <path d="M118,150 L182,150 L179,164 L121,164 Z" fill="#000000" opacity="0.08"/>` },
  { id: 'skirtset', label: 'Top & Skirt', emoji: '🩱',
    svg: `<rect x="114" y="150" width="72" height="66" rx="16"/>
          <path d="M108,216 L192,216 L216,326 Q150,342 84,326 Z"/>
          <path d="M108,232 L84,320" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.15" stroke-linecap="round"/>
          <path d="M118,230 Q150,236 182,230" fill="none" stroke="#000000" stroke-width="1.5" opacity="0.12"/>
          <rect x="114" y="150" width="72" height="12" rx="6" fill="#000000" opacity="0.08"/>` },
  { id: 'suit', label: 'Suit', emoji: '🤵',
    svg: `<path d="M112,150 L188,150 L184,250 L150,236 L116,250 Z"/>
          <path d="M112,250 L150,236 L146,430 L108,430 Z"/>
          <path d="M188,250 L150,236 L154,430 L192,430 Z"/>
          <path d="M112,150 L136,150 L128,176 Z" fill="#000000" opacity="0.14"/>
          <path d="M188,150 L164,150 L172,176 Z" fill="#000000" opacity="0.14"/>
          <path d="M120,160 L118,238" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.14" stroke-linecap="round"/>
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
  { id: 'sequin-gown', label: 'Sequin Gown', emoji: '💫', unlockLevel: 2, fixedColor: true,
    svg: `<path d="M120,150 L180,150 L196,400 Q150,414 104,400 Z" fill="#d94f8c"/>
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
          <path d="M118,150 L182,150 L206,350 Q150,368 94,350 Z" fill="#7c53d1"/>
          <rect x="118" y="150" width="64" height="12" fill="#f2c94c"/>` },
  { id: 'starlight-suit', label: 'Starlight Suit', emoji: '🌠', unlockLevel: 4, fixedColor: true,
    svg: `<path d="M112,150 L188,150 L184,250 L150,236 L116,250 Z" fill="#1b1b2e"/>
          <path d="M112,250 L150,236 L146,430 L108,430 Z" fill="#1b1b2e"/>
          <path d="M188,250 L150,236 L154,430 L192,430 Z" fill="#1b1b2e"/>
          <path d="M136,150 L164,150 L150,208 Z" fill="#fdfdfd"/>
          <path d="M144,150 L156,150 L152,190 L148,192 Z" fill="#2b6cb0"/>
          <circle cx="126" cy="180" r="2.5" fill="#ffe9a8"/>
          <circle cx="174" cy="200" r="2.5" fill="#ffe9a8"/>
          <circle cx="130" cy="260" r="2.5" fill="#ffe9a8"/>
          <circle cx="170" cy="300" r="2.5" fill="#ffe9a8"/>` },
  { id: 'legend-gown', label: "Legend's Gown", emoji: '✨', unlockLevel: 5, fixedColor: true,
    svg: `<path d="M116,150 L184,150 L226,410 Q150,432 74,410 Z" fill="#a83568"/>
          <path d="M116,150 L184,150 L200,300 Q150,312 100,300 Z" fill="#ffd77a"/>
          <rect x="118" y="150" width="64" height="10" fill="#ffd77a"/>
          <path d="M74,410 Q150,432 226,410 L226,424 Q150,448 74,424 Z" fill="#ffd77a"/>` },
];

const OUTFIT_COLORS = ['#e0558f', '#8c5ce0', '#5cc4e0', '#43b581', '#f2c94c', '#e05c5c', '#2b2b2b', '#ffffff'];

const SHOE_STYLES = [
  { id: 'heels', label: 'Heels', emoji: '👠',
    svg: `<path d="M108,440 Q106,432 118,430 Q140,428 149,440 Q152,446 146,449 L112,452 Q104,450 108,440 Z"/>
          <path d="M110,449 L118,451 L114,463 L108,461 Z"/>
          <rect x="107" y="461" width="8" height="4" rx="1.5" fill="#8a6247"/>
          <path d="M112,431 L127,426 L140,432 L127,435 Z" fill="#8a6247"/>
          <ellipse cx="127" cy="466" rx="16" ry="3" fill="#000000" opacity="0.2"/>
          <path d="M154,440 Q152,432 164,430 Q186,428 195,440 Q198,446 192,449 L158,452 Q150,450 154,440 Z"/>
          <path d="M156,449 L164,451 L160,463 L154,461 Z"/>
          <rect x="153" y="461" width="8" height="4" rx="1.5" fill="#8a6247"/>
          <path d="M158,431 L173,426 L186,432 L173,435 Z" fill="#8a6247"/>
          <ellipse cx="173" cy="466" rx="16" ry="3" fill="#000000" opacity="0.2"/>` },
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
    ${face.blush ? `<ellipse cx="118" cy="102" rx="9" ry="5.5" fill="#ff8fa3" opacity="0.4"/><ellipse cx="182" cy="102" rx="9" ry="5.5" fill="#ff8fa3" opacity="0.4"/>` : ''}
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
      accessories: { glasses: true }, background: 'gold',
      face: { eyebrowShape: 'straight', mouth: 'neutral', blush: false } } },
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
let totalStars = Number(localStorage.getItem(STARS_STORAGE_KEY)) || 0;

function saveTotalStars() {
  localStorage.setItem(STARS_STORAGE_KEY, String(totalStars));
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

function isUnlocked(item) {
  return !item.unlockLevel || getLevelInfo(totalStars).level >= item.unlockLevel;
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
      + (unlocked ? '' : `<span class="lock-badge">🔒 Lvl ${item.unlockLevel}</span>`);
    if (unlocked) {
      btn.addEventListener('click', () => onPick(item.id));
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
  const armLeftShine = root.querySelector('#arm-left-shine');
  const armRightShine = root.querySelector('#arm-right-shine');
  const legLeftShine = root.querySelector('#leg-left-shine');
  const legRightShine = root.querySelector('#leg-right-shine');
  const armLeftOutline = root.querySelector('#arm-left-outline');
  const armRightOutline = root.querySelector('#arm-right-outline');
  const legLeftOutline = root.querySelector('#leg-left-outline');
  const legRightOutline = root.querySelector('#leg-right-outline');
  const handLeftDetail = root.querySelector('#hand-left-detail');
  const handRightDetail = root.querySelector('#hand-right-detail');

  [armLeft, armRight, legLeft, legRight].forEach((l) => l && l.setAttribute('stroke-width', bt.limbWidth));
  [armLeftShine, armRightShine, legLeftShine, legRightShine].forEach((l) => l && l.setAttribute('stroke-width', Math.max(2, bt.limbWidth * 0.3)));
  [armLeftOutline, armRightOutline, legLeftOutline, legRightOutline].forEach((l) => l && l.setAttribute('stroke-width', bt.limbWidth + 3));

  const lx = 93 - bt.armSpread;
  const rx = 207 + bt.armSpread;
  if (armLeft) armLeft.setAttribute('x2', lx);
  if (handLeft) handLeft.setAttribute('cx', lx);
  if (armRight) armRight.setAttribute('x2', rx);
  if (handRight) handRight.setAttribute('cx', rx);
  if (armLeftShine) armLeftShine.setAttribute('x2', lx);
  if (armRightShine) armRightShine.setAttribute('x2', rx);
  if (armLeftOutline) armLeftOutline.setAttribute('x2', lx);
  if (armRightOutline) armRightOutline.setAttribute('x2', rx);
  if (handLeftDetail) handLeftDetail.setAttribute('transform', `translate(${lx},272)`);
  if (handRightDetail) handRightDetail.setAttribute('transform', `translate(${rx},272)`);
}

// ---------- Render (main stage) ----------

function render() {
  applyBodyGeometry(document, state.bodyType);

  // skin
  const skinEls = ['torso', 'neck', 'head', 'arm-left', 'arm-right', 'hand-left', 'hand-right', 'leg-left', 'leg-right', 'ear-left', 'ear-right'];
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

  // face
  document.getElementById('layer-face').innerHTML = buildFaceSVG(state.face, state.hair.color);

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
  shoeLayer.setAttribute('stroke', state.shoes.color);

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

  const face = look.face || DEFAULT_FACE;
  const shineWidth = Math.max(2, bt.limbWidth * 0.3);

  const outlineWidth = bt.limbWidth + 3;

  return `
    <g fill="${look.skin}" stroke="${look.skin}">
      <line x1="125" y1="168" x2="${lx}" y2="272" stroke="rgba(40,28,20,0.28)" stroke-width="${outlineWidth}" stroke-linecap="round"/>
      <line x1="175" y1="168" x2="${rxHand}" y2="272" stroke="rgba(40,28,20,0.28)" stroke-width="${outlineWidth}" stroke-linecap="round"/>
      <line x1="125" y1="168" x2="${lx}" y2="272" stroke-width="${bt.limbWidth}" stroke-linecap="round"/>
      <line x1="175" y1="168" x2="${rxHand}" y2="272" stroke-width="${bt.limbWidth}" stroke-linecap="round"/>
      <line x1="125" y1="168" x2="${lx}" y2="272" stroke="#ffffff" stroke-width="${shineWidth}" stroke-linecap="round" opacity="0.28"/>
      <line x1="175" y1="168" x2="${rxHand}" y2="272" stroke="#ffffff" stroke-width="${shineWidth}" stroke-linecap="round" opacity="0.28"/>
      <circle cx="${lx}" cy="272" r="12" stroke="rgba(40,28,20,0.28)" stroke-width="1.5"/>
      <circle cx="${rxHand}" cy="272" r="12" stroke="rgba(40,28,20,0.28)" stroke-width="1.5"/>
      <g transform="translate(${lx},272)" opacity="0.35">
        <line x1="-7" y1="6" x2="-9" y2="12" stroke="#2b1c14" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="0" y1="9" x2="0" y2="16" stroke="#2b1c14" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="7" y1="6" x2="9" y2="12" stroke="#2b1c14" stroke-width="1.2" stroke-linecap="round"/>
      </g>
      <g transform="translate(${rxHand},272)" opacity="0.35">
        <line x1="-7" y1="6" x2="-9" y2="12" stroke="#2b1c14" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="0" y1="9" x2="0" y2="16" stroke="#2b1c14" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="7" y1="6" x2="9" y2="12" stroke="#2b1c14" stroke-width="1.2" stroke-linecap="round"/>
      </g>
      <line x1="133" y1="248" x2="127" y2="445" stroke="rgba(40,28,20,0.28)" stroke-width="${outlineWidth}" stroke-linecap="round"/>
      <line x1="167" y1="248" x2="173" y2="445" stroke="rgba(40,28,20,0.28)" stroke-width="${outlineWidth}" stroke-linecap="round"/>
      <line x1="133" y1="248" x2="127" y2="445" stroke-width="${bt.limbWidth}" stroke-linecap="round"/>
      <line x1="167" y1="248" x2="173" y2="445" stroke-width="${bt.limbWidth}" stroke-linecap="round"/>
      <line x1="133" y1="248" x2="127" y2="445" stroke="#ffffff" stroke-width="${shineWidth}" stroke-linecap="round" opacity="0.22"/>
      <line x1="167" y1="248" x2="173" y2="445" stroke="#ffffff" stroke-width="${shineWidth}" stroke-linecap="round" opacity="0.22"/>
      <rect x="106" y="148" width="88" height="108" rx="${bt.torsoRx}" stroke="rgba(40,28,20,0.22)" stroke-width="2"/>
      <rect x="137" y="132" width="26" height="26" rx="8" stroke="rgba(40,28,20,0.18)" stroke-width="1.5"/>
      <ellipse cx="104" cy="97" rx="6" ry="11" stroke="rgba(40,28,20,0.22)" stroke-width="1.2"/>
      <ellipse cx="196" cy="97" rx="6" ry="11" stroke="rgba(40,28,20,0.22)" stroke-width="1.2"/>
      <circle cx="150" cy="93" r="48" stroke="rgba(40,28,20,0.22)" stroke-width="2"/>
      <ellipse cx="133" cy="82" rx="13" ry="9" fill="#ffffff" opacity="0.16"/>
      <ellipse cx="150" cy="136" rx="22" ry="7" fill="#000000" opacity="0.05"/>
    </g>
    <g fill="${look.hair.color}" stroke="${look.hair.color}">${hairDef.svg}</g>
    <g>${buildFaceSVG(face, look.hair.color)}</g>
    <g fill="${look.shoes.color}" stroke="${look.shoes.color}">${shoeDef.svg}</g>
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
  state.face = { ...DEFAULT_FACE, ...(look.face || {}) };
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

// ---------- Runway Run (mini side-scroller) ----------

const BASE_W = 720;
const BASE_H = 320;
const WORLD_WIDTH = 2300;
const GROUND_Y = 250;
const CHAR_W = 70;
const CHAR_H = 138;
const FINISH_X = WORLD_WIDTH - 100;
const GRAVITY = 1500;
const JUMP_VELOCITY = -620;
const MOVE_SPEED = 260;

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
const gameProgressFill = document.getElementById('game-progress-fill');
const gameConfettiLayer = document.getElementById('game-confetti-layer');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnJump = document.getElementById('btn-jump');

const keys = { left: false, right: false };
let gameCharacterEl = null;
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

function resetGameState() {
  charX = 30;
  elevation = 0;
  jumpV = 0;
  keys.left = false;
  keys.right = false;
  starsCollected = 0;
  starCollected = STAR_LAYOUT.map(() => false);
  lastTs = 0;

  gameResult.hidden = true;
  gameProgressFill.style.width = '0%';
  gameStarCount.textContent = `⭐ 0 / ${STAR_LAYOUT.length}`;
  gameFinish.style.left = `${FINISH_X}px`;

  buildStars();

  gameWorld.querySelectorAll('.game-character').forEach((c) => c.remove());
  gameCharacterEl = document.createElement('div');
  gameCharacterEl.className = 'game-character';
  gameCharacterEl.innerHTML = `<svg viewBox="0 -10 300 480" preserveAspectRatio="xMidYMax meet">${buildDollSVG(state)}</svg>`;
  gameWorld.appendChild(gameCharacterEl);

  const bgDef = BACKGROUNDS.find((b) => b.id === state.background);
  gameViewport.style.background = bgDef.gradient;
}

function gameLoop(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min((ts - lastTs) / 1000, 0.05);
  lastTs = ts;

  let vx = 0;
  if (keys.left) vx -= MOVE_SPEED;
  if (keys.right) vx += MOVE_SPEED;
  charX = Math.min(Math.max(charX + vx * dt, 0), WORLD_WIDTH - CHAR_W);

  jumpV += GRAVITY * dt;
  elevation -= jumpV * dt;
  if (elevation <= 0) {
    elevation = 0;
    jumpV = 0;
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
  gameCharacterEl.style.left = `${charX}px`;
  gameCharacterEl.style.top = `${GROUND_Y - CHAR_H - elevation}px`;
  gameCharacterEl.classList.toggle('moving', vx !== 0);

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
  gameStarsSummary.textContent = `⭐ ${starsCollected} earned this run · ${totalStars} total`;

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
  if (elevation === 0) jumpV = JUMP_VELOCITY;
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
    tryJump();
    e.preventDefault();
  }
}

function onGameKeyUp(e) {
  const k = e.key;
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false;
  else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
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

btnLeft.addEventListener('pointerdown', () => { keys.left = true; });
btnRight.addEventListener('pointerdown', () => { keys.right = true; });
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => {
  btnLeft.addEventListener(ev, () => { keys.left = false; });
  btnRight.addEventListener(ev, () => { keys.right = false; });
});
btnJump.addEventListener('pointerdown', tryJump);

// ---------- Init ----------

renderLevelBanner();
rebuildThemedLists();
render();
