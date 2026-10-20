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

export const livingRoom: ArtPiece = piece(
  'backdrop-living-room',
  W,
  H,
  `
  <defs>
    <pattern id="wp" width="80" height="80" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="5" fill="#f6c9a6" opacity="0.6"/>
      <circle cx="60" cy="60" r="5" fill="#f2b6b0" opacity="0.5"/>
    </pattern>
    <radialGradient id="lampglow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff3c4" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#fff3c4" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="${W}" height="${FLOOR_Y}" fill="${WALL_COLOR}"/>
  <rect x="0" y="0" width="${W}" height="${FLOOR_Y}" fill="url(#wp)"/>
  <rect x="0" y="470" width="${W}" height="${FLOOR_Y - 470}" fill="#f3c99b"/>
  <rect x="0" y="466" width="${W}" height="10" fill="#e8b27f"/>
  <rect x="0" y="${FLOOR_Y - 14}" width="${W}" height="14" fill="#c98a55"/>
  <rect x="0" y="${FLOOR_Y}" width="${W}" height="${H - FLOOR_Y}" fill="${FLOOR_COLOR}"/>
  ${planks()}
  <g transform="${DECOR}">

  <!-- window with a garden view -->
  <g transform="translate(380 110)">
    <rect x="-14" y="-14" width="308" height="288" rx="22" fill="#fff8ee" ${OUTLINE}/>
    <rect x="0" y="0" width="280" height="260" rx="12" fill="${SKY_COLOR}"/>
    <circle cx="210" cy="60" r="28" fill="#ffe08a"/>
    <ellipse cx="70" cy="70" rx="44" ry="18" fill="#ffffff" opacity="0.9"/>
    <ellipse cx="60" cy="230" rx="110" ry="70" fill="#8fcf7e"/>
    <ellipse cx="220" cy="240" rx="120" ry="60" fill="#79bf6b"/>
    <rect x="134" y="0" width="12" height="260" fill="#fff8ee"/>
    <rect x="0" y="124" width="280" height="12" fill="#fff8ee"/>
    <rect x="-30" y="268" width="340" height="18" rx="9" fill="#f1dcc0" ${OUTLINE}/>
    <path d="M-40 -24 Q20 120 -10 300 L-40 300 Z" fill="#f2a7a0"/>
    <path d="M320 -24 Q260 120 290 300 L320 300 Z" fill="#f2a7a0"/>
  </g>

  <!-- a little boat painting: a quiet hint of the make-believe to come -->
  <g transform="translate(900 150)">
    <rect x="0" y="0" width="200" height="150" rx="10" fill="#d99b5f" ${OUTLINE}/>
    <rect x="14" y="14" width="172" height="122" rx="4" fill="#d6effa"/>
    <path d="M14 100 Q57 88 100 100 T186 100 L186 136 L14 136 Z" fill="${SEA_COLOR}"/>
    <path d="M70 96 L130 96 L120 110 L80 110 Z" fill="#c9784a"/>
    <path d="M100 50 L100 96 L128 92 Z" fill="#ffffff"/>
    <line x1="100" y1="44" x2="100" y2="98" stroke="#6b3f2a" stroke-width="3"/>
  </g>

  <!-- shelf with a plant -->
  <g transform="translate(1340 230)">
    <rect x="0" y="0" width="180" height="16" rx="6" fill="#c98a55" ${OUTLINE}/>
    <path d="M40 0 L50 -40 L90 -40 L100 0 Z" fill="#e98b6d"/>
    <ellipse cx="70" cy="-62" rx="36" ry="28" fill="#79bf6b"/>
    <ellipse cx="50" cy="-80" rx="20" ry="16" fill="#8fcf7e"/>
    <rect x="120" y="-50" width="18" height="50" rx="3" fill="#7fb3e0"/>
    <rect x="140" y="-42" width="16" height="42" rx="3" fill="#f2c45c"/>
  </g>

  <!-- floor lamp -->
  <g transform="translate(1690 0)">
    <ellipse cx="0" cy="250" rx="140" ry="140" fill="url(#lampglow)"/>
    <rect x="-6" y="240" width="12" height="330" fill="#8a5a3a"/>
    <ellipse cx="0" cy="572" rx="44" ry="10" fill="#8a5a3a"/>
    <path d="M-70 250 L-44 160 L44 160 L70 250 Z" fill="#fff0c8" ${OUTLINE}/>
  </g>

  <!-- potted plant -->
  <g transform="translate(250 560)">
    <path d="M-50 0 L-40 -80 L40 -80 L50 0 Z" fill="#e98b6d" ${OUTLINE}/>
    <ellipse cx="-30" cy="-150" rx="34" ry="70" fill="#79bf6b" transform="rotate(-20 -30 -150)"/>
    <ellipse cx="30" cy="-160" rx="34" ry="76" fill="#6bb35f" transform="rotate(18 30 -160)"/>
    <ellipse cx="0" cy="-190" rx="28" ry="80" fill="#8fcf7e"/>
  </g>

  <!-- rug -->
  <ellipse cx="1000" cy="830" rx="560" ry="125" fill="#7fbfae"/>
  <ellipse cx="1000" cy="830" rx="520" ry="105" fill="none" stroke="#f6efd9" stroke-width="10" stroke-dasharray="26 18"/>
  </g>
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
