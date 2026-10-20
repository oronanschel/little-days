/**
 * Art kit conventions (see docs/art-conventions.md):
 * - Every art piece is a standalone SVG string with an explicit viewBox in world units
 *   (the stage is 1600×1000), so one SVG unit equals one world unit at scale 1.
 * - Each piece declares its anchor: the point that sits on the entity's world position.
 *   Furniture and characters anchor at bottom-centre (where they touch the floor).
 * - Parts of one figure share a viewBox, so they stack without per-part offsets.
 */
export interface ArtPiece {
  /** Unique key; used as the texture cache key. */
  key: string;
  svg: string;
  width: number;
  height: number;
  /** Anchor in SVG units, measured from the top-left of the viewBox. */
  anchorX: number;
  anchorY: number;
}

export function svgDoc(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}

export function piece(
  key: string,
  width: number,
  height: number,
  body: string,
  anchorX = width / 2,
  anchorY = height,
): ArtPiece {
  return { key, svg: svgDoc(width, height, body), width, height, anchorX, anchorY };
}

/** Soft outline used across the kit for a cohesive toy-theatre look. */
export const OUTLINE = 'stroke="#6b3f2a" stroke-opacity="0.35" stroke-width="3" stroke-linejoin="round"';
