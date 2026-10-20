import { OUTLINE, piece, type ArtPiece } from './svg';

/*
 * Furniture is split into a back and a front layer so seated characters sit *in* it:
 * back (backrest, cushions, seat) → seated characters → front (armrests, legs).
 * All sofa/boat layers share one 560×300 viewBox anchored at bottom-centre.
 */
const SW = 560;
const SH = 300;

/** Sofa geometry other layers need, relative to the sofa's anchor (bottom-centre). */
export const SOFA = {
  width: SW,
  height: SH,
  /** Seat surface y relative to the anchor: seated characters put their hips here. */
  seatY: -90,
  seatXs: [-160, 0, 160],
} as const;

const SOFA_ORANGE = '#ef7d4f';

export const sofaBack: ArtPiece = piece(
  'sofa-back',
  SW,
  SH,
  `
  <rect x="44" y="18" width="472" height="170" rx="44" fill="${SOFA_ORANGE}" ${OUTLINE}/>
  <rect x="74" y="44" width="130" height="122" rx="30" fill="#f59a6b"/>
  <rect x="215" y="44" width="130" height="122" rx="30" fill="#f59a6b"/>
  <rect x="356" y="44" width="130" height="122" rx="30" fill="#f59a6b"/>
  <rect x="96" y="70" width="70" height="56" rx="18" fill="#fbe7c8" transform="rotate(-8 131 98)"/>
  <rect x="396" y="70" width="70" height="56" rx="18" fill="#9fd3c7" transform="rotate(8 431 98)"/>
  <rect x="32" y="160" width="496" height="58" rx="24" fill="#f28a5c" ${OUTLINE}/>
  <rect x="32" y="200" width="496" height="66" rx="20" fill="#e06d42" ${OUTLINE}/>
`,
);

export const sofaFront: ArtPiece = piece(
  'sofa-front',
  SW,
  SH,
  `
  <rect x="62" y="262" width="22" height="34" rx="6" fill="#8a5a3a"/>
  <rect x="476" y="262" width="22" height="34" rx="6" fill="#8a5a3a"/>
  <rect x="0" y="96" width="84" height="172" rx="38" fill="${SOFA_ORANGE}" ${OUTLINE}/>
  <rect x="476" y="96" width="84" height="172" rx="38" fill="${SOFA_ORANGE}" ${OUTLINE}/>
  <ellipse cx="42" cy="112" rx="34" ry="14" fill="#f59a6b"/>
  <ellipse cx="518" cy="112" rx="34" ry="14" fill="#f59a6b"/>
`,
);

/* Boat view: the same sofa, with a mast behind and a wooden hull wrapped around its base. */

const MAST_TOP = -320;
/** The boat layers extend above the sofa's box for the mast, so they use a taller viewBox. */
const BH = SH - MAST_TOP;

export const boatMast: ArtPiece = piece(
  'boat-mast',
  SW,
  BH,
  `
  <rect x="${SW / 2 - 8}" y="0" width="16" height="${BH - 120}" rx="6" fill="#a8703f" ${OUTLINE}/>
  <path d="M${SW / 2 + 8} 6 L${SW / 2 + 70} 24 L${SW / 2 + 8} 42 Z" fill="#e85d5d"/>
`,
);

export const boatSailRaised: ArtPiece = piece(
  'boat-sail-raised',
  SW,
  BH,
  `
  <path d="M${SW / 2 - 12} 50 Q${SW / 2 - 180} 200 ${SW / 2 - 200} 330 L${SW / 2 - 12} 330 Z" fill="#fffaf0" ${OUTLINE}/>
  <path d="M${SW / 2 - 60} 150 L${SW / 2 - 120} 300 M${SW / 2 - 30} 120 L${SW / 2 - 60} 300" stroke="#f2c45c" stroke-width="10" stroke-linecap="round" opacity="0.8"/>
`,
);

export const boatSailFurled: ArtPiece = piece(
  'boat-sail-furled',
  SW,
  BH,
  `
  <rect x="${SW / 2 - 20}" y="300" width="40" height="34" rx="14" fill="#fffaf0" ${OUTLINE}/>
  <rect x="${SW / 2 - 22}" y="310" width="44" height="6" fill="#f2c45c"/>
`,
);

export const boatHull: ArtPiece = piece(
  'boat-hull',
  SW + 120,
  SH + 40,
  `
  <path d="M0 196 L680 196 Q650 300 560 330 L120 330 Q30 300 0 196 Z" fill="#c9784a" ${OUTLINE}/>
  <path d="M8 214 L672 214" stroke="#a85e36" stroke-width="10"/>
  <path d="M40 262 L640 262" stroke="#a85e36" stroke-width="6" opacity="0.6"/>
  <rect x="-2" y="188" width="684" height="20" rx="10" fill="#e8a36f" ${OUTLINE}/>
  <circle cx="160" cy="268" r="20" fill="#d6effa" stroke="#e8a36f" stroke-width="7"/>
  <circle cx="520" cy="268" r="20" fill="#d6effa" stroke="#e8a36f" stroke-width="7"/>
  <path d="M70 328 Q170 312 270 326 T470 326 T610 328 Q340 348 70 328 Z" fill="#ffffff" opacity="0.75"/>
`,
  (SW + 120) / 2,
  // Rim sits just below the seated characters' waists so the whole family shows above the hull.
  SH - 25,
);

/** Side table: its top surface (y -150 from the feet, matching the world scene) is where things rest. */
export const TABLE = { width: 180, height: 166, surfaceY: -150 } as const;

export const sideTable: ArtPiece = piece(
  'side-table',
  TABLE.width,
  TABLE.height,
  `
  <rect x="30" y="20" width="16" height="144" rx="6" fill="#a8703f"/>
  <rect x="134" y="20" width="16" height="144" rx="6" fill="#a8703f"/>
  <rect x="40" y="96" width="100" height="10" rx="4" fill="#a8703f"/>
  <ellipse cx="90" cy="20" rx="88" ry="18" fill="#d99b5f" ${OUTLINE}/>
  <ellipse cx="90" cy="16" rx="78" ry="12" fill="#e8b27f"/>
`,
);

export const snack: ArtPiece = piece(
  'snack',
  96,
  56,
  `
  <ellipse cx="48" cy="44" rx="44" ry="11" fill="#ffffff" ${OUTLINE}/>
  <ellipse cx="48" cy="42" rx="34" ry="7" fill="#e9f4f7"/>
  <circle cx="34" cy="30" r="13" fill="#d9a25f" ${OUTLINE}/>
  <circle cx="30" cy="27" r="2.5" fill="#6b3f2a"/><circle cx="38" cy="33" r="2.5" fill="#6b3f2a"/>
  <circle cx="60" cy="24" r="16" fill="#e85d5d" ${OUTLINE}/>
  <path d="M60 9 q2 -6 8 -7" stroke="#6b3f2a" stroke-width="3" fill="none"/>
  <ellipse cx="68" cy="6" rx="6" ry="3" fill="#79bf6b"/>
  <ellipse cx="54" cy="18" rx="4" ry="6" fill="#ffffff" opacity="0.5"/>
`,
);

export const captainHat: ArtPiece = piece(
  'captain-hat',
  110,
  64,
  `
  <path d="M10 44 Q8 6 55 6 Q102 6 100 44 Z" fill="#ffffff" ${OUTLINE}/>
  <rect x="12" y="36" width="86" height="14" rx="6" fill="#2f4b8a"/>
  <path d="M8 50 Q55 70 102 50 L96 46 Q55 60 14 46 Z" fill="#1f3366"/>
  <circle cx="55" cy="26" r="11" fill="#f2c45c"/>
  <path d="M55 18 L55 33 M49 22 L61 22 M49 30 Q55 36 61 30" stroke="#2f4b8a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
`,
);

/** Soft contact shadow under anything resting on the floor. */
export const contactShadow: ArtPiece = piece(
  'contact-shadow',
  200,
  40,
  `<ellipse cx="100" cy="20" rx="96" ry="16" fill="#6b3f2a" opacity="0.18"/>`,
  100,
  20,
);

/** In the sea, shadows become gentle ripples so standing characters look like they're paddling. */
export const ripple: ArtPiece = piece(
  'ripple',
  200,
  40,
  `
  <ellipse cx="100" cy="20" rx="94" ry="15" fill="#ffffff" opacity="0.25"/>
  <ellipse cx="100" cy="20" rx="70" ry="10" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.7"/>
`,
  100,
  20,
);
