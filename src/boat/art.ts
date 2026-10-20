// SVG sources for boat-adventure props. Each is drawn around (0,0) as its
// anchor (noted per item), in room units, so the views can place them directly.
// Kept to plain paths/circles: the renderer-safe subset.

const ink = '#3b3350';

/** Four-point sparkle, centred. Invitation to imagine. */
export const SPARKLE = `<svg viewBox="-40 -40 80 80" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 -38 C6 -10 10 -6 38 0 C10 6 6 10 0 38 C-6 10 -10 6 -38 0 C-10 -6 -6 -10 0 -38 Z" fill="#ffe27a" stroke="#f4b740" stroke-width="3"/>
  <circle cx="0" cy="0" r="7" fill="#fff8d6"/>
</svg>`;

/** Round "home" bubble with a house silhouette, centred. The way back to the living room. */
export const HOME_BUBBLE = `<svg viewBox="-64 -64 128 128" xmlns="http://www.w3.org/2000/svg">
  <circle cx="0" cy="0" r="58" fill="#fdf6ec" stroke="${ink}" stroke-width="6"/>
  <path d="M-30 4 L0 -26 L30 4 L22 4 L22 30 L-22 30 L-22 4 Z" fill="#f2785c" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>
  <rect x="-7" y="10" width="14" height="20" rx="3" fill="${ink}"/>
</svg>`;

/** Fishing rod leaning out over the side; anchor = butt of the rod. Tip at (150,-150). */
export const ROD = `<svg viewBox="-20 -170 190 190" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 0 L150 -150" stroke="#8a5a3b" stroke-width="10" stroke-linecap="round"/>
  <circle cx="22" cy="-22" r="13" fill="#7cc6c2" stroke="${ink}" stroke-width="4"/>
</svg>`;
export const ROD_TIP = { x: 150, y: -150 };

/** Red-and-white float, centred on the water line. */
export const BOB = `<svg viewBox="-16 -20 32 34" xmlns="http://www.w3.org/2000/svg">
  <circle cx="0" cy="0" r="12" fill="#fdf6ec" stroke="${ink}" stroke-width="3"/>
  <path d="M-12 0 A12 12 0 0 1 12 0 Z" fill="#e8504a"/>
</svg>`;

/** Friendly fish, centred, facing right. */
export const FISH = `<svg viewBox="-50 -30 100 60" xmlns="http://www.w3.org/2000/svg">
  <path d="M-22 0 L-46 -20 L-42 0 L-46 20 Z" fill="#f4a24c" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
  <ellipse cx="6" cy="0" rx="34" ry="22" fill="#ffc35c" stroke="${ink}" stroke-width="4"/>
  <circle cx="22" cy="-5" r="5" fill="${ink}"/>
  <path d="M28 8 Q32 11 36 8" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`;

/** Smiling whale peeking out of the water; anchor = water line under its middle, facing right. */
export const WHALE = `<svg viewBox="-110 -90 220 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M-70 0 C-80 -40 -40 -78 20 -74 C70 -70 98 -40 96 0 Z" fill="#6aa9e0" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M-70 -14 C-92 -30 -104 -52 -96 -62 C-86 -50 -76 -46 -62 -40" fill="#6aa9e0" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M10 -20 C40 -14 70 -16 90 -24 L94 0 L6 0 Z" fill="#cfe6f7"/>
  <circle cx="58" cy="-42" r="6" fill="${ink}"/>
  <path d="M50 -24 Q64 -16 78 -26" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>`;
/** Blowhole position on the whale (for the answering spray). */
export const WHALE_SPOUT = { x: 10, y: -76 };

/** One spray droplet, centred. */
export const DROP = `<svg viewBox="-10 -14 20 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 -12 C6 -2 9 3 6 7 C3 11 -3 11 -6 7 C-9 3 -6 -2 0 -12 Z" fill="#bfe3ff" stroke="#5f9ed6" stroke-width="2"/>
</svg>`;
