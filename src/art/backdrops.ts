import { OUTLINE, piece, type ArtPiece } from './svg';

/**
 * Backdrops are 2400 wide so wide phones see more room instead of bars. Full-bleed layers span
 * the whole width; scenery is drawn in a group shifted by PAD, so x=PAD in the SVG is world x=0.
 */
const PAD = 400;
export const BACKDROP_WIDTH = 1600 + PAD * 2;
const W = BACKDROP_WIDTH;
/** Scenery coordinates below were authored with world x=0 at 200. */
const DECOR = `translate(${PAD - 200} 0)`;
const H = 1000;
const FLOOR_Y = 560;

export const WALL_COLOR = '#fbe3c4';
/** Above and below the cut-away room, the letterbox shows the dollhouse's wooden shell. */
export const HOUSE_SHELL_TOP = '#c99a6a';
export const HOUSE_SHELL_BOTTOM = '#b9713f';
export const FLOOR_COLOR = '#e3a96e';
export const SKY_COLOR = '#9fd8f2';
export const SEA_COLOR = '#3fa3c9';

function planks(): string {
  let lines = '';
  for (let y = FLOOR_Y + 48; y < H; y += 56) {
    lines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#c98a55" stroke-opacity="0.35" stroke-width="3"/>`;
    const offset = (y / 56) % 2 === 0 ? 0 : 120;
    for (let x = offset; x < W; x += 240) {
      lines += `<line x1="${x}" y1="${y - 56}" x2="${x}" y2="${y}" stroke="#c98a55" stroke-opacity="0.25" stroke-width="2"/>`;
    }
  }
  return lines;
}

/** World x → x inside the DECOR group (scenery was authored with world x=0 at 200). */
const dx = (worldX: number) => worldX + 200;

export const livingRoom: ArtPiece = piece(
  'backdrop-living-room',
  W,
  H,
  `
  <defs>
    <pattern id="wp" width="64" height="80" patternUnits="userSpaceOnUse">
      <rect width="32" height="80" fill="#fde9cf"/>
      <circle cx="16" cy="20" r="4" fill="#f4b9a3" opacity="0.55"/>
      <circle cx="48" cy="60" r="4" fill="#f6cf9a" opacity="0.6"/>
    </pattern>
    <linearGradient id="wallshade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b9713f" stop-opacity="0.22"/>
      <stop offset="0.35" stop-color="#b9713f" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="warm" cx="0.5" cy="0.3" r="0.6">
      <stop offset="0" stop-color="#fff6dc" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#fff6dc" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="floorshade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9a5a2c" stop-opacity="0.38"/>
      <stop offset="0.25" stop-color="#9a5a2c" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#fff2d8" stop-opacity="0.18"/>
    </linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b8784a"/><stop offset="1" stop-color="#8f5631"/>
    </linearGradient>
    <linearGradient id="post" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f6e2c4"/><stop offset="0.75" stop-color="#e9cba3"/><stop offset="1" stop-color="#c99a6a"/>
    </linearGradient>
    <linearGradient id="curtain" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e98f86"/><stop offset="0.5" stop-color="#f6b3a8"/><stop offset="1" stop-color="#e98f86"/>
    </linearGradient>
    <radialGradient id="lampglow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff1b8" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#fff1b8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="rug" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#8fcbb9"/><stop offset="1" stop-color="#6fae9c"/>
    </radialGradient>
  </defs>

  <!-- wall: striped paper, wainscot panels, warm light, shade under the ceiling -->
  <rect x="0" y="0" width="${W}" height="${FLOOR_Y}" fill="${WALL_COLOR}"/>
  <rect x="0" y="0" width="${W}" height="${FLOOR_Y}" fill="url(#wp)"/>
  <rect x="0" y="440" width="${W}" height="${FLOOR_Y - 440}" fill="#f0c48f"/>
  ${Array.from({ length: Math.ceil(W / 160) }, (_, i) => `<rect x="${i * 160 + 14}" y="458" width="132" height="74" rx="6" fill="none" stroke="#d99f68" stroke-width="4" opacity="0.7"/>`).join('')}
  <rect x="0" y="434" width="${W}" height="12" rx="4" fill="#e3a86d"/>
  <rect x="0" y="0" width="${W}" height="${FLOOR_Y}" fill="url(#wallshade)"/>
  <rect x="0" y="0" width="${W}" height="${FLOOR_Y}" fill="url(#warm)"/>
  <rect x="0" y="${FLOOR_Y - 18}" width="${W}" height="18" fill="#c4834f"/>

  <!-- floor: warm planks, darker where they meet the wall -->
  <rect x="0" y="${FLOOR_Y}" width="${W}" height="${H - FLOOR_Y}" fill="${FLOOR_COLOR}"/>
  ${planks()}
  <rect x="0" y="${FLOOR_Y}" width="${W}" height="${H - FLOOR_Y}" fill="url(#floorshade)"/>

  <!-- ceiling beam of the dollhouse cut-away -->
  <rect x="0" y="0" width="${W}" height="44" fill="url(#beam)"/>
  <rect x="0" y="44" width="${W}" height="10" fill="#e9c08f"/>
  <rect x="0" y="54" width="${W}" height="6" fill="#b9713f" opacity="0.25"/>

  <g transform="${DECOR}">
  <!-- window with a garden view, set into the wall -->
  <g transform="translate(${dx(150)} 120)">
    <rect x="-18" y="-18" width="316" height="300" rx="20" fill="#fff8ee" ${OUTLINE}/>
    <rect x="0" y="0" width="280" height="262" rx="10" fill="${SKY_COLOR}"/>
    <circle cx="214" cy="58" r="26" fill="#ffe08a"/>
    <ellipse cx="72" cy="66" rx="44" ry="16" fill="#ffffff" opacity="0.9"/>
    <ellipse cx="60" cy="236" rx="120" ry="74" fill="#8fcf7e"/>
    <ellipse cx="226" cy="246" rx="126" ry="62" fill="#79bf6b"/>
    <circle cx="200" cy="170" r="34" fill="#6bb35f"/><rect x="196" y="190" width="8" height="40" fill="#8a5a3a"/>
    <rect x="0" y="0" width="280" height="14" fill="#5d8fb0" opacity="0.18"/>
    <rect x="134" y="0" width="12" height="262" fill="#fff8ee"/>
    <rect x="0" y="125" width="280" height="12" fill="#fff8ee"/>
    <rect x="-34" y="266" width="348" height="20" rx="10" fill="#f6e6cc" ${OUTLINE}/>
    <rect x="-28" y="284" width="336" height="8" rx="4" fill="#b9713f" opacity="0.2"/>
    <path d="M-52 -34 Q-6 120 -30 300 L-70 300 Q-58 120 -84 -34 Z" fill="url(#curtain)" ${OUTLINE}/>
    <path d="M332 -34 Q286 120 310 300 L350 300 Q338 120 364 -34 Z" fill="url(#curtain)" ${OUTLINE}/>
    <rect x="-100" y="-44" width="480" height="14" rx="7" fill="#b9713f"/>
  </g>

  <!-- pendant lamp over the sofa -->
  <g transform="translate(${dx(800)} 0)">
    <ellipse cx="0" cy="190" rx="230" ry="150" fill="url(#lampglow)"/>
    <rect x="-2" y="44" width="4" height="80" fill="#6b3f2a"/>
    <path d="M-56 168 Q-50 120 0 118 Q50 120 56 168 Z" fill="#f2c45c" ${OUTLINE}/>
    <ellipse cx="0" cy="168" rx="56" ry="9" fill="#fff6d0"/>
  </g>

  <!-- a little boat painting: a quiet hint of the make-believe to come -->
  <g transform="translate(${dx(700)} 200)">
    <rect x="6" y="8" width="200" height="150" rx="10" fill="#6b3f2a" opacity="0.18"/>
    <rect x="0" y="0" width="200" height="150" rx="10" fill="#d99b5f" ${OUTLINE}/>
    <rect x="14" y="14" width="172" height="122" rx="4" fill="#d6effa"/>
    <path d="M14 100 Q57 88 100 100 T186 100 L186 136 L14 136 Z" fill="${SEA_COLOR}"/>
    <path d="M70 96 L130 96 L120 110 L80 110 Z" fill="#ef7d4f"/>
    <path d="M100 50 L100 96 L128 92 Z" fill="#ffffff"/>
    <line x1="100" y1="44" x2="100" y2="98" stroke="#6b3f2a" stroke-width="3"/>
  </g>

  <!-- family photos -->
  <g transform="translate(${dx(1000)} 230)">
    <rect x="4" y="6" width="80" height="96" rx="8" fill="#6b3f2a" opacity="0.18"/>
    <rect x="0" y="0" width="80" height="96" rx="8" fill="#f2c45c" ${OUTLINE}/>
    <rect x="10" y="10" width="60" height="76" rx="4" fill="#fdf1dc"/>
    <circle cx="32" cy="44" r="12" fill="#e0a97e"/><circle cx="52" cy="52" r="9" fill="#b97a52"/>
    <path d="M18 86 Q32 58 46 86 Z" fill="#5f9fd6"/><path d="M42 86 Q52 64 64 86 Z" fill="#f2c45c"/>
  </g>
  <g transform="translate(${dx(1100)} 260)">
    <circle cx="44" cy="44" r="44" fill="#9fd3c7" ${OUTLINE}/><circle cx="44" cy="44" r="34" fill="#fdf1dc"/>
    <path d="M44 44 L44 20 M44 44 L60 52" stroke="#6b3f2a" stroke-width="5" stroke-linecap="round"/>
  </g>

  <!-- shelf with plants and books -->
  <g transform="translate(${dx(1250)} 250)">
    <rect x="4" y="18" width="200" height="10" rx="4" fill="#6b3f2a" opacity="0.18"/>
    <rect x="0" y="0" width="200" height="18" rx="6" fill="#c98a55" ${OUTLINE}/>
    <path d="M30 0 L40 -44 L84 -44 L94 0 Z" fill="#e98b6d" ${OUTLINE}/>
    <ellipse cx="62" cy="-70" rx="40" ry="30" fill="#79bf6b"/>
    <ellipse cx="42" cy="-88" rx="22" ry="18" fill="#8fcf7e"/>
    <path d="M62 -60 q-30 30 -40 60" stroke="#6bb35f" stroke-width="6" fill="none" stroke-linecap="round"/>
    <rect x="116" y="-56" width="20" height="56" rx="3" fill="#7fb3e0" ${OUTLINE}/>
    <rect x="138" y="-46" width="18" height="46" rx="3" fill="#f2c45c" ${OUTLINE}/>
    <rect x="158" y="-52" width="16" height="52" rx="3" fill="#e85d5d" ${OUTLINE} transform="rotate(10 166 0)"/>
  </g>

  <!-- floor lamp -->
  <g transform="translate(${dx(1490)} 0)">
    <ellipse cx="0" cy="250" rx="150" ry="150" fill="url(#lampglow)"/>
    <rect x="-6" y="240" width="12" height="330" fill="#8a5a3a"/>
    <ellipse cx="0" cy="572" rx="46" ry="11" fill="#8a5a3a"/>
    <path d="M-72 252 L-46 160 L46 160 L72 252 Z" fill="#fff0c8" ${OUTLINE}/>
    <path d="M-62 236 L62 236" stroke="#f2c45c" stroke-width="6"/>
  </g>

  <!-- potted plant -->
  <g transform="translate(${dx(60)} 570)">
    <ellipse cx="0" cy="0" rx="62" ry="12" fill="#6b3f2a" opacity="0.2"/>
    <ellipse cx="-34" cy="-150" rx="34" ry="72" fill="#79bf6b" transform="rotate(-22 -34 -150)"/>
    <ellipse cx="34" cy="-160" rx="34" ry="78" fill="#6bb35f" transform="rotate(20 34 -160)"/>
    <ellipse cx="0" cy="-196" rx="28" ry="84" fill="#8fcf7e"/>
    <path d="M-52 -4 L-42 -86 L42 -86 L52 -4 Z" fill="#e98b6d" ${OUTLINE}/>
    <rect x="-50" y="-92" width="100" height="16" rx="6" fill="#f2a487" ${OUTLINE}/>
  </g>

  <!-- layered round rug -->
  <ellipse cx="${dx(800)}" cy="842" rx="590" ry="138" fill="#6b3f2a" opacity="0.12"/>
  <ellipse cx="${dx(800)}" cy="832" rx="580" ry="130" fill="url(#rug)" ${OUTLINE}/>
  <ellipse cx="${dx(800)}" cy="832" rx="530" ry="108" fill="none" stroke="#f6efd9" stroke-width="10" stroke-dasharray="26 18"/>
  <ellipse cx="${dx(800)}" cy="832" rx="400" ry="74" fill="none" stroke="#f2c45c" stroke-width="12" opacity="0.8"/>
  <ellipse cx="${dx(800)}" cy="832" rx="250" ry="42" fill="#fbe9cf" opacity="0.85"/>
  </g>

  <!-- dollhouse cut-away: wall posts and floor slab framing the room -->
  <g transform="${DECOR}">
    <rect x="${dx(-60)}" y="0" width="76" height="${H}" fill="url(#post)" ${OUTLINE}/>
    <rect x="${dx(1584)}" y="0" width="76" height="${H}" fill="url(#post)" ${OUTLINE}/>
  </g>
  <rect x="0" y="${H - 34}" width="${W}" height="34" fill="#b9713f"/>
  <rect x="0" y="${H - 34}" width="${W}" height="8" fill="#e3a86d"/>
`,
  PAD,
  0,
);

function waveRow(y: number, amp: number, len: number, color: string, opacity = 1): string {
  let d = `M0 ${y}`;
  for (let x = 0; x < W; x += len) {
    d += ` Q${x + len / 4} ${y - amp} ${x + len / 2} ${y} T${x + len} ${y}`;
  }
  d += ` L${W} ${H} L0 ${H} Z`;
  return `<path d="${d}" fill="${color}" opacity="${opacity}"/>`;
}

/** Sky and open sea; the living room's lamp and window frame stay as a faint memory of home. */
export const sea: ArtPiece = piece(
  'backdrop-sea',
  W,
  H,
  `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9fd8f2"/>
      <stop offset="1" stop-color="#e3f5fb"/>
    </linearGradient>
  </defs>
  <!-- sky stops below the horizon: the scrolling water covers the rest, the sea fill continues below -->
  <rect x="0" y="0" width="${W}" height="700" fill="url(#sky)"/>
  <g transform="${DECOR}">
  <circle cx="1560" cy="150" r="70" fill="#ffe08a"/>
  <circle cx="1560" cy="150" r="96" fill="#ffe08a" opacity="0.3"/>
  <g fill="#ffffff" opacity="0.95">
    <ellipse cx="420" cy="140" rx="90" ry="34"/><ellipse cx="480" cy="120" rx="60" ry="34"/>
    <ellipse cx="1050" cy="90" rx="80" ry="28"/><ellipse cx="1100" cy="74" rx="50" ry="26"/>
  </g>
  <!-- distant island -->
  <path d="M120 470 Q260 360 400 470 Z" fill="#8fcf7e"/>
  <rect x="250" y="390" width="10" height="60" fill="#8a5a3a"/>
  <ellipse cx="255" cy="388" rx="34" ry="14" fill="#6bb35f"/>
  <!-- far gulls -->
  <path d="M760 220 q14 -14 28 0 q14 -14 28 0" fill="none" stroke="#6b3f2a" stroke-opacity="0.5" stroke-width="4"/>
  <path d="M860 260 q10 -10 20 0 q10 -10 20 0" fill="none" stroke="#6b3f2a" stroke-opacity="0.5" stroke-width="3"/>
  </g>
`,
  PAD,
  0,
);

/**
 * The water on its own, so it can scroll while the sky stays put. Every wave length
 * divides the width, so the texture tiles seamlessly.
 */
export const seaWater: ArtPiece = piece(
  'backdrop-sea-water',
  W,
  H,
  `
  ${waveRow(470, 10, 160, '#7cc6e2')}
  ${waveRow(540, 14, 200, '#5db3d6')}
  ${waveRow(640, 18, 240, SEA_COLOR)}
`,
  PAD,
  0,
);

/**
 * A sandbank in front of the boat. The room's floor becomes this shore at sea, so
 * people and things the child left on the floor stand on sand instead of in the waves.
 */
export const SHORE_Y = 770;

function shoreEdge(y: number, amp: number, len: number): string {
  let d = `M0 ${y}`;
  for (let x = 0; x < W; x += len) d += ` Q${x + len / 4} ${y - amp} ${x + len / 2} ${y} T${x + len} ${y}`;
  return d;
}

export const seaShore: ArtPiece = piece(
  'backdrop-sea-shore',
  W,
  H,
  `
  <defs>
    <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9c98f"/>
      <stop offset="0.35" stop-color="#f3d9a4"/>
      <stop offset="1" stop-color="#f7e3b8"/>
    </linearGradient>
  </defs>
  <path d="${shoreEdge(SHORE_Y - 14, 10, 300)} L${W} ${H} L0 ${H} Z" fill="#ffffff" opacity="0.55"/>
  <path d="${shoreEdge(SHORE_Y - 4, 9, 300)} L${W} ${H} L0 ${H} Z" fill="#d9b67a"/>
  <path d="${shoreEdge(SHORE_Y + 8, 8, 300)} L${W} ${H} L0 ${H} Z" fill="url(#sand)"/>
  <g transform="${DECOR}">
    <g fill="#e2bd80" opacity="0.7">
      <ellipse cx="420" cy="900" rx="60" ry="8"/><ellipse cx="1120" cy="950" rx="80" ry="9"/>
      <ellipse cx="1560" cy="860" rx="50" ry="7"/><ellipse cx="760" cy="975" rx="70" ry="8"/>
    </g>
    <!-- starfish and shells -->
    <path d="M330 820 l8 18 20 2 -15 13 5 20 -18 -11 -18 11 5 -20 -15 -13 20 -2 z" fill="#f2946b" stroke="#c96f4a" stroke-width="2"/>
    <path d="M1700 930 q20 -26 40 0 z" fill="#fbe7d6" stroke="#d9a98a" stroke-width="2"/>
    <path d="M1710 930 l10 -20 M1720 930 l0 -24 M1730 930 l-6 -20" stroke="#d9a98a" stroke-width="2"/>
    <circle cx="980" cy="985" r="7" fill="#fbe7d6" stroke="#d9a98a" stroke-width="2"/>
    <!-- sea grass tufts on the dunes -->
    <g stroke="#79bf6b" stroke-width="5" stroke-linecap="round" fill="none">
      <path d="M150 1000 q-6 -40 -26 -60 M160 1000 q2 -50 10 -70 M172 1000 q10 -36 30 -50"/>
      <path d="M1880 1000 q-6 -40 -26 -60 M1890 1000 q2 -50 10 -70 M1902 1000 q10 -36 30 -50"/>
    </g>
  </g>
`,
  PAD,
  0,
);
