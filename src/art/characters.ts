import { OUTLINE, piece, type ArtPiece } from './svg';

/*
 * Modular character kit. Each character is a set of parts that share one viewBox
 * anchored at the feet (bottom-centre), so a pose is just a choice of part variants.
 * Layer order (back → front): backArm, legs, torso, head, face, frontArm.
 */

export type Look = 'grownup' | 'child';
export type Pose = 'stand' | 'sit';
export type ArmPose = 'down' | 'carry' | 'wave';
export type Expression = 'neutral' | 'happy' | 'surprised';

interface Spec {
  look: Look;
  legLen: number;
  torsoLen: number;
  torsoW: number;
  headR: number;
  skin: string;
  hair: string;
  shirt: string;
  shirtAccent: string;
  trousers: string;
  shoes: string;
  hairStyle: 'bun' | 'curls';
}

const SPECS: Record<Look, Spec> = {
  grownup: {
    look: 'grownup',
    legLen: 112,
    torsoLen: 104,
    torsoW: 86,
    headR: 54,
    skin: '#e0a97e',
    hair: '#4a2c20',
    shirt: '#5f9fd6',
    shirtAccent: '#4785bd',
    trousers: '#3f5a7a',
    shoes: '#6b3f2a',
    hairStyle: 'bun',
  },
  child: {
    look: 'child',
    legLen: 66,
    torsoLen: 66,
    torsoW: 66,
    headR: 50,
    skin: '#b97a52',
    hair: '#2a1a14',
    shirt: '#f2c45c',
    shirtAccent: '#e85d5d',
    trousers: '#79bf6b',
    shoes: '#e85d5d',
    hairStyle: 'curls',
  },
};

/** Key points in part space; the renderer uses them to attach held and worn items. */
export interface CharacterGeometry {
  width: number;
  height: number;
  /** Hip point (where a seated character meets the seat), from the top-left of the viewBox. */
  hipX: number;
  hipY: number;
  /** Where a carried item's bottom-centre goes. */
  carryX: number;
  carryY: number;
  /** Where a hat's bottom-centre goes. */
  headTopX: number;
  headTopY: number;
}

function geometry(s: Spec): CharacterGeometry & { shoulderY: number; headCY: number; cx: number } {
  const width = 220;
  const headCY = s.headR + 22;
  const shoulderY = headCY + s.headR * 0.92;
  const hipY = shoulderY + s.torsoLen;
  const height = hipY + s.legLen;
  const cx = width / 2;
  return {
    width,
    height,
    cx,
    headCY,
    shoulderY,
    hipX: cx,
    hipY,
    carryX: cx + s.torsoW / 2 + 22,
    carryY: shoulderY + s.torsoLen * 0.62,
    headTopX: cx,
    headTopY: headCY - s.headR * 0.72,
  };
}

export interface CharacterParts {
  geometry: CharacterGeometry;
  backArm: Record<ArmPose, ArtPiece>;
  frontArm: Record<ArmPose, ArtPiece>;
  legs: Record<Pose, ArtPiece>;
  torso: ArtPiece;
  head: ArtPiece;
  face: Record<Expression, ArtPiece>;
}

function arm(s: Spec, g: ReturnType<typeof geometry>, side: 'back' | 'front', pose: ArmPose): string {
  const dir = side === 'front' ? 1 : -1;
  const sx = g.cx + dir * (s.torsoW / 2 - 6);
  const sy = g.shoulderY + 12;
  const upper = s.torsoLen * 0.5;
  const w = s.look === 'child' ? 18 : 20;
  let elbow: [number, number];
  let hand: [number, number];
  if (pose === 'carry' && side === 'front') {
    elbow = [sx + 8, sy + upper];
    hand = [g.carryX, g.carryY + 6];
  } else if (pose === 'carry') {
    // Both hands cradle the item; the back hand reaches across the body.
    elbow = [sx + 4, sy + upper];
    hand = [g.carryX - 30, g.carryY + 8];
  } else if (pose === 'wave' && side === 'front') {
    elbow = [sx + 34, sy - 10];
    hand = [sx + 40, sy - upper - 8];
  } else {
    elbow = [sx + dir * 8, sy + upper];
    hand = [sx + dir * 10, sy + upper * 1.9];
  }
  const sleeve = `<path d="M${sx} ${sy} L${elbow[0]} ${elbow[1]}" stroke="${s.shirt}" stroke-width="${w + 6}" stroke-linecap="round"/>`;
  const fore = `<path d="M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}" stroke="${s.skin}" stroke-width="${w}" stroke-linecap="round"/>`;
  const handDot = `<circle cx="${hand[0]}" cy="${hand[1]}" r="${w * 0.72}" fill="${s.skin}" ${OUTLINE}/>`;
  const shade = side === 'back' ? `<g opacity="0.85">` : '<g>';
  return `${shade}${fore}${sleeve}${handDot}</g>`;
}

function legs(s: Spec, g: ReturnType<typeof geometry>, pose: Pose): string {
  const w = s.look === 'child' ? 24 : 28;
  const gap = s.torsoW * 0.22;
  const out: string[] = [];
  for (const dx of [-gap, gap]) {
    const x = g.cx + dx;
    if (pose === 'stand') {
      out.push(`<path d="M${x} ${g.hipY - 6} L${x} ${g.height - 12}" stroke="${s.trousers}" stroke-width="${w}" stroke-linecap="round"/>`);
      out.push(`<ellipse cx="${x + 6}" cy="${g.height - 10}" rx="${w * 0.75}" ry="${w * 0.42}" fill="${s.shoes}" ${OUTLINE}/>`);
    } else {
      // Seated: thighs come toward the viewer (short), shins hang over the seat edge.
      const knee = g.hipY + s.legLen * 0.32;
      const foot = g.hipY + s.legLen * 0.8;
      out.push(`<path d="M${x} ${g.hipY - 6} L${x} ${knee}" stroke="${s.trousers}" stroke-width="${w + 6}" stroke-linecap="round"/>`);
      out.push(`<path d="M${x} ${knee} L${x} ${foot}" stroke="${s.trousers}" stroke-width="${w}" stroke-linecap="round"/>`);
      out.push(`<ellipse cx="${x + 4}" cy="${foot + 4}" rx="${w * 0.72}" ry="${w * 0.4}" fill="${s.shoes}" ${OUTLINE}/>`);
    }
  }
  return out.join('');
}

function torso(s: Spec, g: ReturnType<typeof geometry>): string {
  const x = g.cx - s.torsoW / 2;
  const y = g.shoulderY - 4;
  const h = s.torsoLen + 14;
  const stripe =
    s.look === 'child'
      ? `<rect x="${x + 4}" y="${y + h * 0.42}" width="${s.torsoW - 8}" height="${h * 0.16}" fill="${s.shirtAccent}"/>`
      : `<path d="M${g.cx - 14} ${y + 2} L${g.cx} ${y + 22} L${g.cx + 14} ${y + 2}" fill="${s.shirtAccent}"/>`;
  const rx = s.torsoW * 0.36;
  return `
    <defs><linearGradient id="tshade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="0.45" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.7" stop-color="#2a1a14" stop-opacity="0"/><stop offset="1" stop-color="#2a1a14" stop-opacity="0.22"/>
    </linearGradient></defs>
    <rect x="${g.cx - 10}" y="${y - 12}" width="20" height="18" fill="${s.skin}"/>
    <rect x="${g.cx - 10}" y="${y - 12}" width="20" height="8" fill="#2a1a14" opacity="0.15"/>
    <rect x="${x}" y="${y}" width="${s.torsoW}" height="${h}" rx="${rx}" fill="${s.shirt}" ${OUTLINE}/>
    ${stripe}
    <rect x="${x}" y="${y}" width="${s.torsoW}" height="${h}" rx="${rx}" fill="url(#tshade)"/>
    <path d="M${g.cx - 18} ${y + 2} Q${g.cx} ${y + 16} ${g.cx + 18} ${y + 2}" stroke="#ffffff" stroke-width="4" fill="none" opacity="0.5"/>`;
}

function head(s: Spec, g: ReturnType<typeof geometry>): string {
  const r = s.headR;
  const cx = g.cx;
  const cy = g.headCY;
  const hairBack =
    s.hairStyle === 'bun'
      ? `<circle cx="${cx + r * 0.2}" cy="${cy - r * 1.05}" r="${r * 0.42}" fill="${s.hair}" ${OUTLINE}/>
         <path d="M${cx - r * 1.04} ${cy + r * 0.3} Q${cx - r * 1.1} ${cy - r * 1.1} ${cx} ${cy - r * 1.04} Q${cx + r * 1.1} ${cy - r * 1.1} ${cx + r * 1.04} ${cy + r * 0.3} Z" fill="${s.hair}"/>`
      : Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI * (0.95 + (i / 8) * 1.1);
          return `<circle cx="${cx + Math.cos(a) * r * 0.92}" cy="${cy + Math.sin(a) * r * 0.92}" r="${r * 0.36}" fill="${s.hair}"/>`;
        }).join('');
  const hairFront =
    s.hairStyle === 'bun'
      ? `<path d="M${cx - r * 0.95} ${cy - r * 0.15} Q${cx - r * 0.6} ${cy - r * 1.05} ${cx + r * 0.2} ${cy - r * 0.98} Q${cx + r * 0.1} ${cy - r * 0.55} ${cx - r * 0.95} ${cy - r * 0.15} Z" fill="${s.hair}"/>
         <path d="M${cx + r * 0.1} ${cy - r * 0.98} Q${cx + r * 0.85} ${cy - r * 0.9} ${cx + r * 0.98} ${cy - r * 0.1} Q${cx + r * 0.5} ${cy - r * 0.6} ${cx + r * 0.1} ${cy - r * 0.98} Z" fill="${s.hair}"/>`
      : Array.from({ length: 6 }, (_, i) => {
          const x = cx - r * 0.7 + (i / 5) * r * 1.4;
          return `<circle cx="${x}" cy="${cy - r * 0.78 + Math.abs(i - 2.5) * 3}" r="${r * 0.26}" fill="${s.hair}"/>`;
        }).join('');
  return `
    ${hairBack}
    <circle cx="${cx - r * 0.98}" cy="${cy + r * 0.08}" r="${r * 0.2}" fill="${s.skin}" ${OUTLINE}/>
    <circle cx="${cx + r * 0.98}" cy="${cy + r * 0.08}" r="${r * 0.2}" fill="${s.skin}" ${OUTLINE}/>
    <defs><radialGradient id="hshade" cx="0.4" cy="0.35" r="0.75">
      <stop offset="0.55" stop-color="#2a1a14" stop-opacity="0"/><stop offset="1" stop-color="#2a1a14" stop-opacity="0.18"/>
    </radialGradient></defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${s.skin}" ${OUTLINE}/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#hshade)"/>
    ${hairFront}
    <path d="M${cx - r * 0.55} ${cy - r * 0.78} Q${cx - r * 0.2} ${cy - r * 0.98} ${cx + r * 0.15} ${cy - r * 0.86}" stroke="#ffffff" stroke-width="${r * 0.09}" stroke-linecap="round" fill="none" opacity="0.28"/>`;
}

function face(s: Spec, g: ReturnType<typeof geometry>, e: Expression): string {
  const r = s.headR;
  const cx = g.cx;
  const ey = g.headCY + r * 0.08;
  const ex = r * 0.36;
  const ink = '#3a2218';
  const cheeks = `<ellipse cx="${cx - r * 0.55}" cy="${ey + r * 0.3}" rx="${r * 0.15}" ry="${r * 0.09}" fill="#f28a8a" opacity="${e === 'happy' ? 0.8 : 0.45}"/>
    <ellipse cx="${cx + r * 0.55}" cy="${ey + r * 0.3}" rx="${r * 0.15}" ry="${r * 0.09}" fill="#f28a8a" opacity="${e === 'happy' ? 0.8 : 0.45}"/>`;
  let eyes: string;
  let mouth: string;
  if (e === 'happy') {
    eyes = [-ex, ex]
      .map((dx) => `<path d="M${cx + dx - 8} ${ey + 3} Q${cx + dx} ${ey - 8} ${cx + dx + 8} ${ey + 3}" stroke="${ink}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`)
      .join('');
    mouth = `<path d="M${cx - r * 0.3} ${ey + r * 0.3} Q${cx} ${ey + r * 0.72} ${cx + r * 0.3} ${ey + r * 0.3} Z" fill="#a8423f" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`;
  } else if (e === 'surprised') {
    eyes = [-ex, ex]
      .map((dx) => `<ellipse cx="${cx + dx}" cy="${ey - 2}" rx="7" ry="9" fill="${ink}"/><circle cx="${cx + dx + 2}" cy="${ey - 5}" r="2.5" fill="#fff"/>`)
      .join('');
    mouth = `<ellipse cx="${cx}" cy="${ey + r * 0.45}" rx="${r * 0.12}" ry="${r * 0.16}" fill="#a8423f" stroke="${ink}" stroke-width="3"/>`;
  } else {
    eyes = [-ex, ex]
      .map((dx) => `<ellipse cx="${cx + dx}" cy="${ey}" rx="7" ry="9" fill="${ink}"/><circle cx="${cx + dx + 2}" cy="${ey - 3}" r="2.8" fill="#fff"/><circle cx="${cx + dx - 2}" cy="${ey + 3}" r="1.2" fill="#fff" opacity="0.8"/>`)
      .join('');
    mouth = `<path d="M${cx - r * 0.22} ${ey + r * 0.36} Q${cx} ${ey + r * 0.55} ${cx + r * 0.22} ${ey + r * 0.36}" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
  const browY = ey - r * 0.3 - (e === 'surprised' ? 6 : 0);
  const brows = [-ex, ex]
    .map((dx) => `<path d="M${cx + dx - 9} ${browY + 2} Q${cx + dx} ${browY - 4} ${cx + dx + 9} ${browY + 2}" stroke="${s.hair}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.85"/>`)
    .join('');
  const nose = `<path d="M${cx - 4} ${ey + r * 0.2} Q${cx} ${ey + r * 0.27} ${cx + 4} ${ey + r * 0.2}" stroke="#2a1a14" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.35"/>`;
  return cheeks + brows + eyes + nose + mouth;
}

const cache = new Map<Look, CharacterParts>();

export function characterParts(look: Look): CharacterParts {
  const hit = cache.get(look);
  if (hit) return hit;
  const s = SPECS[look];
  const g = geometry(s);
  const p = (name: string, body: string) => piece(`char-${look}-${name}`, g.width, g.height, body);
  const armPoses: ArmPose[] = ['down', 'carry', 'wave'];
  const parts: CharacterParts = {
    geometry: g,
    backArm: Object.fromEntries(armPoses.map((a) => [a, p(`backarm-${a}`, arm(s, g, 'back', a))])) as Record<ArmPose, ArtPiece>,
    frontArm: Object.fromEntries(armPoses.map((a) => [a, p(`frontarm-${a}`, arm(s, g, 'front', a))])) as Record<ArmPose, ArtPiece>,
    legs: { stand: p('legs-stand', legs(s, g, 'stand')), sit: p('legs-sit', legs(s, g, 'sit')) },
    torso: p('torso', torso(s, g)),
    head: p('head', head(s, g)),
    face: {
      neutral: p('face-neutral', face(s, g, 'neutral')),
      happy: p('face-happy', face(s, g, 'happy')),
      surprised: p('face-surprised', face(s, g, 'surprised')),
    },
  };
  cache.set(look, parts);
  return parts;
}

export const LOOKS: Look[] = ['grownup', 'child'];
