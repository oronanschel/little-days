import { describe, expect, it } from 'vitest';
import { createLivingRoom, revert, serialize, sit, transform, validate, worldPosition, type OpResult, type World } from '../world';
import { applyDrop, buildDropTargets, DragGesture, seatAtPointer } from './index';

function next(result: OpResult): World {
  if (!result.ok) throw new Error(result.reason);
  expect(validate(result.world)).toEqual([]);
  return result.world;
}

describe('world drop adapter', () => {
  it('accepts a pointer anywhere over the sofa back, cushions or arms', () => {
    const world = createLivingRoom();
    for (const point of [{ x: 640, y: 420 }, { x: 800, y: 560 }, { x: 1060, y: 650 }]) {
      expect(seatAtPointer(world, 'kid', point)?.kind).toBe('seat');
      expect(seatAtPointer(world, 'grown-up', point)?.kind).toBe('seat');
    }
  });

  it('snaps to another free slot when the pointer is over an occupied seat', () => {
    const world = next(sit(createLivingRoom(), 'grown-up', 'sofa', { x: 640, y: 610 }));
    expect(seatAtPointer(world, 'kid', { x: 640, y: 480 })?.slot).toBe(1);
    expect(seatAtPointer(world, 'grown-up', { x: 640, y: 480 })?.slot).toBe(0);
  });

  it('leaves intentional floor drops and props outside the seat catchment', () => {
    const world = createLivingRoom();
    expect(seatAtPointer(world, 'kid', { x: 800, y: 800 })).toBeUndefined();
    expect(seatAtPointer(world, 'snack', { x: 800, y: 500 })).toBeUndefined();
  });

  it('gives a snack to a seated person when dropped over their tummy, ahead of the sofa', () => {
    const world = next(sit(createLivingRoom(), 'grown-up', 'sofa', { x: 800, y: 610 }));
    const result = next(applyDrop(world, 'snack', { x: 800, y: 580 }, {
      characterBounds: (id) => id === 'grown-up'
        ? { x: 740, y: 350, width: 120, height: 360 }
        : undefined,
    }));
    expect(result.entities.snack.attachment).toEqual({ kind: 'held', by: 'grown-up' });
  });

  it('seats near an edge and keeps a held snack through a boat adventure and return', () => {
    let world = createLivingRoom();
    world = next(applyDrop(world, 'snack', { x: 470, y: 630 }));
    expect(world.entities.snack.attachment).toEqual({ kind: 'held', by: 'grown-up' });
    world = next(applyDrop(world, 'grown-up', { x: 560, y: 610 }));
    world = next(applyDrop(world, 'kid', { x: 800, y: 610 }));
    expect(world.entities['grown-up'].attachment).toEqual({ kind: 'seated', on: 'sofa', slot: 0 });
    expect(world.entities.kid.attachment).toEqual({ kind: 'seated', on: 'sofa', slot: 1 });
    const before = structuredClone(world.entities);
    world = next(transform(world, 'sofa-boat'));
    world = next(revert(world));
    expect(world.entities).toEqual(before);
    expect(worldPosition(world, 'snack')).toEqual({ x: 690, y: 380 });
  });

  it('excludes occupied seats but keeps the dragged person’s own seat available', () => {
    const world = next(sit(createLivingRoom(), 'grown-up', 'sofa', { x: 640, y: 610 }));
    expect(buildDropTargets(world, 'kid').filter(target => target.kind === 'seat').map(target => target.slot))
      .toEqual([1, 2]);
    expect(buildDropTargets(world, 'grown-up').filter(target => target.kind === 'seat').map(target => target.slot))
      .toEqual([0, 1, 2]);
  });

  it('places a hat on the head, but a snack has only hand and surface targets', () => {
    const world = next(applyDrop(createLivingRoom(), 'captain-hat', { x: 560, y: 650 }));
    expect(world.entities['captain-hat'].attachment).toEqual({ kind: 'worn', by: 'kid' });
    expect(buildDropTargets(world, 'snack').some(target => target.kind === 'head')).toBe(false);
    expect(buildDropTargets(world, 'kid').every(target => target.kind === 'seat')).toBe(true);
  });

  it('does not displace another held item when a second prop is dragged nearby', () => {
    let world = next(applyDrop(createLivingRoom(), 'snack', { x: 470, y: 630 }));
    expect(buildDropTargets(world, 'captain-hat').some(target => target.entityId === 'grown-up' && target.kind === 'hand'))
      .toBe(false);
    world = next(applyDrop(world, 'captain-hat', { x: 470, y: 630 }));
    expect(world.entities.snack.attachment).toEqual({ kind: 'held', by: 'grown-up' });
    expect(world.entities['captain-hat'].attachment).toBeNull();
  });

  it('packs a snack on the sofa and clamps a tolerance drop to the actual surface', () => {
    const world = next(applyDrop(createLivingRoom(), 'snack', { x: 540, y: 590 }));
    expect(world.entities.snack.attachment).toEqual({ kind: 'resting', on: 'sofa', offset: { x: -248, y: -110 } });
    expect(buildDropTargets(world, 'snack').some(target => target.entityId === 'snack')).toBe(false);
  });

  it('moves a seated character onto the floor while their worn hat follows', () => {
    let world = next(applyDrop(createLivingRoom(), 'captain-hat', { x: 560, y: 650 }));
    world = next(applyDrop(world, 'kid', { x: 640, y: 610 }));
    world = next(applyDrop(world, 'kid', { x: -100, y: 2000 }));
    expect(world.entities.kid.attachment).toBeNull();
    expect(worldPosition(world, 'kid')).toEqual({ x: 60, y: 950 });
    expect(worldPosition(world, 'captain-hat')).toEqual({ x: 60, y: 720 });
  });

  it('recomputes targets from the current world instead of a stale drag-start snapshot', () => {
    const initial = createLivingRoom();
    const before = buildDropTargets(initial, 'kid');
    expect(before.some(target => target.slot === 0)).toBe(true);
    const changed = next(sit(initial, 'grown-up', 'sofa', { x: 640, y: 610 }));
    const world = next(applyDrop(changed, 'kid', { x: 640, y: 610 }));
    expect(world.entities['grown-up'].attachment).toEqual({ kind: 'seated', on: 'sofa', slot: 0 });
    expect(world.entities.kid.attachment).toBeNull();
  });

  it('keeps cancelled previews out of the serialized world', () => {
    const world = next(applyDrop(createLivingRoom(), 'kid', { x: 640, y: 610 }));
    const saved = serialize(world);
    const origin = worldPosition(world, 'kid');
    const drag = new DragGesture();
    drag.begin(1, origin, 'kid', origin);
    drag.move(1, { x: 1200, y: 900 });
    expect(drag.cancel()).toEqual({ entityId: 'kid', position: origin });
    expect(serialize(world)).toBe(saved);
  });

  it('supports art-specific surface bounds and floor limits without changing rules', () => {
    const world = next(applyDrop(createLivingRoom(), 'snack', { x: 1180, y: 520 }, {
      surfaceBounds: { 'side-table': { x: -80, y: -220, width: 160, height: 40 } },
    }));
    expect(world.entities.snack.attachment).toEqual({ kind: 'resting', on: 'side-table', offset: { x: 0, y: -200 } });
    expect(next(applyDrop(world, 'kid', { x: 0, y: 0 }, {
      floor: { x: 100, y: 700, width: 1000, height: 200 },
    })).entities.kid.pos).toEqual({ x: 100, y: 700 });
  });

  it('refuses a missing dragged entity without changing the world', () => {
    expect(applyDrop(createLivingRoom(), 'missing', { x: 0, y: 0 }))
      .toEqual({ ok: false, reason: 'unknown-entity' });
  });

  it('uses the rendered hand and head anchors when a seated pose changes their offsets', () => {
    const seated = next(sit(createLivingRoom(), 'kid', 'sofa', { x: 640, y: 610 }));
    const options = {
      anchorOf: (id: string, anchor: 'hand' | 'head') => id === 'kid'
        ? (anchor === 'hand' ? { x: 700, y: 520 } : { x: 640, y: 400 })
        : undefined,
    };
    let world = next(applyDrop(seated, 'snack', { x: 700, y: 520 }, options));
    expect(world.entities.snack.attachment).toEqual({ kind: 'held', by: 'kid' });
    world = next(applyDrop(world, 'captain-hat', { x: 640, y: 400 }, options));
    expect(world.entities['captain-hat'].attachment).toEqual({ kind: 'worn', by: 'kid' });
  });
});
