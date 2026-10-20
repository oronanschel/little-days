export interface Point { x: number; y: number }
export interface Rect extends Point { width: number; height: number }

/** Convert browser client coordinates into the renderer's logical scene. */
export function toScenePoint(client: Point, viewport: Rect, scene: Rect): Point {
  if (viewport.width <= 0 || viewport.height <= 0) {
    throw new RangeError('The viewport must have a positive size.');
  }
  return {
    x: scene.x + (client.x - viewport.x) * scene.width / viewport.width,
    y: scene.y + (client.y - viewport.y) * scene.height / viewport.height,
  };
}

/** Bounds describe legal entity anchor positions, rather than sprite edges. */
export function clampPoint(point: Point, bounds: Rect): Point {
  return {
    x: Math.max(bounds.x, Math.min(bounds.x + bounds.width, point.x)),
    y: Math.max(bounds.y, Math.min(bounds.y + bounds.height, point.y)),
  };
}

export function distanceToRect(point: Point, rect: Rect): number {
  const nearest = clampPoint(point, rect);
  return Math.hypot(point.x - nearest.x, point.y - nearest.y);
}
