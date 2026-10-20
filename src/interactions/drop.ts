import { clampPoint, distanceToRect, type Point, type Rect } from './geometry';

export interface DropTarget {
  id: string;
  kind: 'seat' | 'hand' | 'container';
  bounds: Rect;
  /** World units beyond the visible target; include at least a finger's width. */
  padding?: number;
  /** Disable occupied or incompatible targets before resolving a drop. */
  enabled?: boolean;
  /** Higher priority wins when equally close (e.g. a hand over a sofa). */
  priority?: number;
}

export type DropResult =
  | { kind: 'target'; target: DropTarget }
  | { kind: 'place'; position: Point };

/** Resolve at the released entity anchor, so grabbing an edge never causes a jump. */
export function resolveDrop(position: Point, targets: readonly DropTarget[], floor: Rect): DropResult {
  const candidates = targets
    .filter(target => target.enabled !== false)
    .map(target => ({ target, distance: distanceToRect(position, target.bounds) }))
    .filter(({ target, distance }) => distance <= Math.max(0, target.padding ?? 24))
    .sort((a, b) => a.distance - b.distance
      || (b.target.priority ?? 0) - (a.target.priority ?? 0)
      || a.target.id.localeCompare(b.target.id));
  return candidates.length
    ? { kind: 'target', target: candidates[0].target }
    : { kind: 'place', position: clampPoint(position, floor) };
}
