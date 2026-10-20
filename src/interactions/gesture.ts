import type { Point } from './geometry';

export interface GesturePreview {
  entityId: string;
  position: Point;
  dragging: boolean;
}
export interface GestureEnd extends GesturePreview { kind: 'tap' | 'drop' }
export interface GestureCancel { entityId: string; position: Point }

interface ActiveGesture {
  pointerId: number;
  entityId: string;
  start: Point;
  origin: Point;
  dragging: boolean;
}

/** Keeps previews out of authoritative world state until a gesture completes. */
export class DragGesture {
  private active: ActiveGesture | null = null;

  constructor(private readonly dragThreshold = 8) {}

  get entityId(): string | null { return this.active?.entityId ?? null; }

  begin(pointerId: number, point: Point, entityId: string, origin: Point): boolean {
    if (this.active) return false;
    this.active = {
      pointerId, entityId, start: { ...point }, origin: { ...origin }, dragging: false,
    };
    return true;
  }

  move(pointerId: number, point: Point): GesturePreview | null {
    const active = this.active;
    if (!active || active.pointerId !== pointerId) return null;
    const dx = point.x - active.start.x;
    const dy = point.y - active.start.y;
    active.dragging ||= Math.hypot(dx, dy) >= this.dragThreshold;
    return {
      entityId: active.entityId,
      position: active.dragging
        ? { x: active.origin.x + dx, y: active.origin.y + dy }
        : { ...active.origin },
      dragging: active.dragging,
    };
  }

  end(pointerId: number, point: Point): GestureEnd | null {
    const preview = this.move(pointerId, point);
    if (!preview) return null;
    this.active = null;
    return { ...preview, kind: preview.dragging ? 'drop' : 'tap' };
  }

  /** Omitting pointerId cancels the active gesture on blur, resize or teardown. */
  cancel(pointerId?: number): GestureCancel | null {
    const active = this.active;
    if (!active || (pointerId !== undefined && active.pointerId !== pointerId)) return null;
    this.active = null;
    return { entityId: active.entityId, position: { ...active.origin } };
  }
}
