import { CanvasSource, Sprite, Texture } from 'pixi.js';
import type { ArtPiece } from '../art/svg';

/**
 * SVG art is rasterised once per piece at a resolution matched to the screen, so the
 * browser's full SVG renderer (gradients, patterns, transforms) is available and drawing
 * stays cheap during play.
 */
const textures = new Map<string, Texture>();

/** Stay under the smallest common GPU texture limit, even for the 2000-wide backdrops. */
const MAX_TEXTURE_SIZE = 4096;

/**
 * Resolutions are snapped to quarter steps (exact in floating point), and canvas sizes are
 * rounded, so Pixi's derived pixel size is a whole number. A fractional product (e.g.
 * 680 × 1.35 → 918.99) made some textures upload blank: no boat hull at 1920×1080.
 */
function snapResolution(wanted: number, art: ArtPiece): number {
  const cap = MAX_TEXTURE_SIZE / Math.max(art.width, art.height);
  return Math.max(0.5, Math.floor(Math.min(Math.max(wanted, 0.5), cap) * 4) / 4);
}

async function rasterise(art: ArtPiece, wanted: number): Promise<Texture> {
  const resolution = snapResolution(wanted, art);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(art.svg)}`;
  const img = new Image();
  img.src = url;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(art.width * resolution);
  canvas.height = Math.round(art.height * resolution);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Texture({ source: new CanvasSource({ resource: canvas, resolution }) });
}

export async function preload(pieces: ArtPiece[], resolution: number): Promise<void> {
  await Promise.all(
    pieces
      .filter((p) => !textures.has(p.key))
      .map(async (p) => {
        textures.set(p.key, await rasterise(p, resolution));
      }),
  );
}

export function textureOf(art: ArtPiece): Texture {
  const t = textures.get(art.key);
  if (!t) throw new Error(`Art not preloaded: ${art.key}`);
  return t;
}

/** A sprite whose origin is the art's anchor, so positioning it means positioning the anchor. */
export function artSprite(art: ArtPiece): Sprite {
  const s = new Sprite(textureOf(art));
  s.anchor.set(art.anchorX / art.width, art.anchorY / art.height);
  return s;
}

export function setArt(sprite: Sprite, art: ArtPiece): void {
  sprite.texture = textureOf(art);
  sprite.anchor.set(art.anchorX / art.width, art.anchorY / art.height);
}
