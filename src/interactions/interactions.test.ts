import { describe, expect, it } from 'vitest';
import { DragGesture, resolveDrop, toScenePoint, type DropTarget } from './index';

const floor = { x: 50, y: 450, width: 1100, height: 250 };
const seat: DropTarget = {
  id: 'sofa-left', kind: 'seat', bounds: { x: 300, y: 300, width: 120, height: 100 }, padding: 30,
};

describe('forgiving drop targets', () => {
  it('accepts an edge drop within the extra touch margin', () => {
    expect(resolveDrop({ x: 450, y: 350 }, [seat], floor)).toEqual({ kind: 'target', target: seat });
  });

  it('uses rounded tolerance rather than accepting distant diagonal corners', () => {
    expect(resolveDrop({ x: 449, y: 429 }, [seat], floor).kind).toBe('place');
  });

  it('ignores occupied or incompatible targets and keeps the entity on the floor', () => {
    expect(resolveDrop({ x: 350, y: 350 }, [{ ...seat, enabled: false }], floor))
      .toEqual({ kind: 'place', position: { x: 350, y: 450 } });
  });

  it('prefers a visible target over the tolerance region of a nearby target', () => {
    const nearby: DropTarget = { ...seat, id: 'nearby', bounds: { x: 430, y: 300, width: 50, height: 100 }, priority: 10 };
    expect(resolveDrop({ x: 415, y: 350 }, [nearby, seat], floor)).toEqual({ kind: 'target', target: seat });
  });

  it('uses priority for overlapping targets and stable IDs as the final tie breaker', () => {
    const hand: DropTarget = { ...seat, id: 'hand', kind: 'hand', priority: 1 };
    expect(resolveDrop({ x: 350, y: 350 }, [seat, hand], floor)).toEqual({ kind: 'target', target: hand });
    const other = { ...seat, id: 'a-seat' };
    expect(resolveDrop({ x: 350, y: 350 }, [seat, other], floor))
      .toEqual(resolveDrop({ x: 350, y: 350 }, [other, seat], floor));
  });

  it('clamps empty-space drops to legal anchor positions', () => {
    expect(resolveDrop({ x: 1500, y: 900 }, [], floor))
      .toEqual({ kind: 'place', position: { x: 1150, y: 700 } });
  });
});

describe('single pointer drag gestures', () => {
  it('preserves the grab offset and samples the release even without a move event', () => {
    const gesture = new DragGesture();
    gesture.begin(7, { x: 120, y: 130 }, 'snack', { x: 100, y: 100 });
    expect(gesture.end(7, { x: 170, y: 200 })).toEqual({
      kind: 'drop', entityId: 'snack', position: { x: 150, y: 170 }, dragging: true,
    });
    expect(gesture.entityId).toBeNull();
  });

  it('treats finger jitter as a tap without moving the entity', () => {
    const gesture = new DragGesture();
    gesture.begin(1, { x: 20, y: 30 }, 'person', { x: 10, y: 10 });
    expect(gesture.end(1, { x: 23, y: 32 })).toEqual({
      kind: 'tap', entityId: 'person', position: { x: 10, y: 10 }, dragging: false,
    });
  });

  it('stays a drag after crossing the threshold then returning to the start', () => {
    const gesture = new DragGesture();
    gesture.begin(1, { x: 20, y: 30 }, 'person', { x: 10, y: 10 });
    gesture.move(1, { x: 50, y: 30 });
    expect(gesture.end(1, { x: 20, y: 30 })?.kind).toBe('drop');
  });

  it('ignores a second finger without stealing or releasing the first gesture', () => {
    const gesture = new DragGesture();
    gesture.begin(1, { x: 20, y: 30 }, 'person', { x: 10, y: 10 });
    expect(gesture.begin(2, { x: 0, y: 0 }, 'snack', { x: 0, y: 0 })).toBe(false);
    expect(gesture.move(2, { x: 80, y: 80 })).toBeNull();
    expect(gesture.end(2, { x: 80, y: 80 })).toBeNull();
    expect(gesture.cancel(2)).toBeNull();
    expect(gesture.entityId).toBe('person');
    expect(gesture.end(1, { x: 30, y: 40 })?.kind).toBe('drop');
  });

  it('restores the original position on cancellation and allows the next drag', () => {
    const gesture = new DragGesture();
    const origin = { x: 10, y: 20 };
    gesture.begin(1, { x: 20, y: 30 }, 'person', origin);
    origin.x = 500;
    gesture.move(1, { x: 100, y: 200 });
    expect(gesture.cancel()).toEqual({ entityId: 'person', position: { x: 10, y: 20 } });
    expect(gesture.end(1, { x: 100, y: 200 })).toBeNull();
    expect(gesture.begin(2, { x: 0, y: 0 }, 'snack', { x: 0, y: 0 })).toBe(true);
  });
});

describe('viewport coordinates', () => {
  it('accounts for page offset, scale and letterboxing', () => {
    expect(toScenePoint({ x: 450, y: 300 },
      { x: 150, y: 100, width: 600, height: 400 },
      { x: -100, y: 0, width: 1200, height: 800 }))
      .toEqual({ x: 500, y: 400 });
  });

  it('refuses an unmeasurable viewport', () => {
    expect(() => toScenePoint({ x: 0, y: 0 }, { x: 0, y: 0, width: 0, height: 0 }, floor))
      .toThrow(RangeError);
  });
});
