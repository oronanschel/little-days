// Camera framing: which part of the 1600×1000 world to show on a given screen.
//
// Letterboxing the whole stage leaves a portrait tablet or phone using only its
// middle third. Instead we always show a core play area plus every person and
// toy (so nothing the child arranged is ever off screen), zoom to fit that,
// and let the extended backdrop fill whatever is left.

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Frame {
  /** Screen pixels per world unit. */
  scale: number;
  /** Screen position of world (0,0). */
  x: number;
  y: number;
}

export const STAGE: Rect = { x: 0, y: 0, width: 1600, height: 1000 };

/**
 * Always visible: the sofa/boat with its mast and rod, the floor band where
 * people stand, and the horizon. The far wall decorations at the sides may be
 * cropped on narrow screens.
 */
export const CORE: Rect = { x: 200, y: 0, width: 1200, height: 1000 };

/** Breathing room around the outermost toy, in world units. */
export const ENTITY_MARGIN = 40;

export function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y };
}

function clampRect(r: Rect, to: Rect): Rect {
  const x = Math.max(r.x, to.x);
  const y = Math.max(r.y, to.y);
  return {
    x,
    y,
    width: Math.max(0, Math.min(r.x + r.width, to.x + to.width) - x),
    height: Math.max(0, Math.min(r.y + r.height, to.y + to.height) - y),
  };
}

/** Centre along one axis: prefer the stage centre, keep `must` inside, stay on stage when possible. */
function centre(visible: number, mustLo: number, mustHi: number, stageLo: number, stageHi: number): number {
  let c = (stageLo + stageHi) / 2;
  c = Math.min(Math.max(c, mustHi - visible / 2), mustLo + visible / 2);
  if (visible <= stageHi - stageLo) c = Math.min(Math.max(c, stageLo + visible / 2), stageHi - visible / 2);
  return c;
}

/**
 * Frame the world for a `width`×`height` screen. `content` is the world-space
 * bounds of all entities (or null). Everything in CORE ∪ content is visible.
 */
export function frameFor(width: number, height: number, content: Rect | null): Frame {
  let must = CORE;
  if (content && content.width > 0 && content.height > 0) {
    const padded = {
      x: content.x - ENTITY_MARGIN,
      y: content.y - ENTITY_MARGIN,
      width: content.width + 2 * ENTITY_MARGIN,
      height: content.height + 2 * ENTITY_MARGIN,
    };
    must = union(CORE, clampRect(padded, STAGE));
  }
  const scale = Math.min(width / must.width, height / must.height);
  const vw = width / scale;
  const vh = height / scale;
  const cx = centre(vw, must.x, must.x + must.width, STAGE.x, STAGE.x + STAGE.width);
  const cy = centre(vh, must.y, must.y + must.height, STAGE.y, STAGE.y + STAGE.height);
  return { scale, x: width / 2 - cx * scale, y: height / 2 - cy * scale };
}

/** The world rectangle a frame shows on a `width`×`height` screen. */
export function visibleRect(frame: Frame, width: number, height: number): Rect {
  return { x: -frame.x / frame.scale, y: -frame.y / frame.scale, width: width / frame.scale, height: height / frame.scale };
}

/** Move `from` toward `to` by fraction `k` (0..1). Used to ease the camera. */
export function ease(from: Frame, to: Frame, k: number): Frame {
  return {
    scale: from.scale + (to.scale - from.scale) * k,
    x: from.x + (to.x - from.x) * k,
    y: from.y + (to.y - from.y) * k,
  };
}
