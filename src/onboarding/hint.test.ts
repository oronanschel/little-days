import { describe, expect, it } from 'vitest';
import { createLivingRoom, sit, transform, type World } from '../world';
import {
  FIRST_DELAY_MS,
  HintSchedule,
  IDLE_DELAY_MS,
  LOOP_MS,
  LOOPS_PER_SPELL,
  hintFrame,
  hintPath,
  isSuccessfulDrag,
} from './hint';

const ok = (r: { ok: boolean; world?: World }) => {
  if (!r.ok || !r.world) throw new Error('op refused');
  return r.world;
};

describe('hintPath', () => {
  it('carries the character nearest the sofa to the nearest seat', () => {
    const world = createLivingRoom();
    const path = hintPath(world)!;
    expect(path.character).toBe('kid');
    // Grab point is above the kid's feet; drop point is above a sofa seat.
    expect(path.from.y).toBeLessThan(world.entities.kid.pos.y);
    expect(path.to.x).toBe(world.entities.sofa.pos.x - 160);
  });

  it('has nothing to show once someone sits', () => {
    const world = ok(sit(createLivingRoom(), 'kid', 'sofa'));
    expect(hintPath(world)).toBeNull();
  });

  it('has nothing to show at sea', () => {
    const world = ok(transform(createLivingRoom(), 'sofa-boat', 'sofa'));
    expect(hintPath(world)).toBeNull();
  });
});

describe('hintFrame', () => {
  const path = { character: 'kid', from: { x: 0, y: 0 }, to: { x: 100, y: 0 }, grab: { x: 0, y: -100 } };

  it('starts hidden at the character and ends hidden at the seat', () => {
    expect(hintFrame(path, 0)).toMatchObject({ pos: path.from, alpha: 0 });
    expect(hintFrame(path, LOOP_MS - 1)).toMatchObject({ pos: path.to, alpha: 0 });
  });

  it('arcs upward while carrying, pressed', () => {
    const mid = hintFrame(path, 400 + 300 + 700);
    expect(mid.press).toBe(1);
    expect(mid.carrying).toBe(true);
    expect(mid.pos.y).toBeLessThan(0);
    expect(mid.pos.x).toBeGreaterThan(0);
    expect(mid.pos.x).toBeLessThan(100);
  });

  it('never glides with reduced motion', () => {
    for (let t = 0; t < LOOP_MS; t += 50) {
      const f = hintFrame(path, t, true);
      expect([path.from.x, path.to.x]).toContain(f.pos.x);
      expect(f.alpha).toBeGreaterThanOrEqual(0);
      expect(f.alpha).toBeLessThanOrEqual(1);
    }
  });
});

describe('HintSchedule', () => {
  it('waits, plays a few loops, then rests', () => {
    const s = new HintSchedule(false);
    expect(s.tick(FIRST_DELAY_MS - 1)).toBeNull();
    expect(s.tick(1)).toBe(0);
    expect(s.tick(LOOPS_PER_SPELL * LOOP_MS)).toBeNull();
  });

  it('hides on touch and waits longer before showing again', () => {
    const s = new HintSchedule(false);
    s.tick(FIRST_DELAY_MS + 100);
    s.touched();
    expect(s.tick(IDLE_DELAY_MS - 1)).toBeNull();
    expect(s.tick(1)).toBe(0);
  });

  it('never shows once seen or retired', () => {
    expect(new HintSchedule(true).tick(FIRST_DELAY_MS + 1)).toBeNull();
    const s = new HintSchedule(false);
    s.retire();
    expect(s.tick(FIRST_DELAY_MS + 1)).toBeNull();
  });
});

describe('isSuccessfulDrag', () => {
  it('counts moves and seating but not transformations', () => {
    expect(isSuccessfulDrag([{ type: 'sat', id: 'kid', on: 'sofa' }])).toBe(true);
    expect(isSuccessfulDrag([{ type: 'moved', id: 'kid' }])).toBe(true);
    expect(isSuccessfulDrag([{ type: 'transformed', def: 'sofa-boat', anchor: 'sofa' }])).toBe(false);
  });
});
