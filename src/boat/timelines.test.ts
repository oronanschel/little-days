import { describe, expect, it } from 'vitest';
import { createLivingRoom, pickUp, sit, transform, wear, type OpResult, type World } from '../world';
import {
  FISH_TOTAL,
  REDUCED_MOTION_SCALE,
  ROCK_MAX_AMP,
  WAVE_DURATION,
  creaturePose,
  fishFrame,
  inviteLevel,
  invitePulse,
  nextRockAmp,
  passengers,
  rockAngle,
  sailProgress,
  seaSpeed,
  waveFrame,
} from './timelines';

const must = (r: OpResult): World => {
  if (!r.ok) throw new Error(r.reason);
  return r.world;
};

describe('invitation', () => {
  it('is subtle by default, strong with the hat, gone at sea', () => {
    let w = createLivingRoom();
    expect(inviteLevel(w)).toBe('subtle');
    w = must(pickUp(w, 'kid', 'captain-hat'));
    expect(inviteLevel(w)).toBe('strong');
    w = must(wear(w, 'captain-hat', 'kid'));
    expect(inviteLevel(w)).toBe('strong');
    w = must(transform(w, 'sofa-boat'));
    expect(inviteLevel(w)).toBe('none');
    expect(invitePulse(3, 'none')).toBe(0);
  });

  it('pulses within 0..1 and strong is always brighter than subtle', () => {
    for (let t = 0; t < 5; t += 0.1) {
      const s = invitePulse(t, 'subtle');
      const g = invitePulse(t, 'strong');
      expect(s).toBeGreaterThan(0);
      expect(g).toBeLessThanOrEqual(1);
      expect(g).toBeGreaterThan(s);
    }
  });
});

describe('rock', () => {
  it('swings both ways, decays to rest and never exceeds the cap', () => {
    const angles = Array.from({ length: 200 }, (_, i) => rockAngle(i * 0.05, ROCK_MAX_AMP));
    expect(Math.max(...angles)).toBeGreaterThan(0.05);
    expect(Math.min(...angles)).toBeLessThan(-0.05);
    expect(Math.max(...angles.map(Math.abs))).toBeLessThanOrEqual(ROCK_MAX_AMP);
    expect(rockAngle(10, ROCK_MAX_AMP)).toBe(0);
    expect(rockAngle(-1, ROCK_MAX_AMP)).toBe(0);
  });

  it('repeated taps rock harder up to a gentle cap', () => {
    let amp = nextRockAmp(0, 0);
    const first = amp;
    for (let i = 0; i < 20; i++) amp = nextRockAmp(amp, 0.1);
    expect(amp).toBeGreaterThan(first);
    expect(amp).toBeLessThanOrEqual(ROCK_MAX_AMP);
  });

  it('reduced motion shrinks the swing', () => {
    const full = Math.abs(rockAngle(0.3, 0.1));
    expect(Math.abs(rockAngle(0.3, 0.1, REDUCED_MOTION_SCALE))).toBeCloseTo(full * REDUCED_MOTION_SCALE);
  });
});

describe('sail', () => {
  it('raises and furls smoothly and reverses from midway', () => {
    expect(sailProgress(0, true)).toBe(0);
    expect(sailProgress(5, true)).toBe(1);
    expect(sailProgress(5, false)).toBe(0);
    const mid = sailProgress(0.4, true);
    expect(mid).toBeGreaterThan(0.2);
    expect(mid).toBeLessThan(0.8);
    // Furling from mid starts exactly where it was.
    expect(sailProgress(0, false, mid)).toBeCloseTo(mid);
    expect(sailProgress(5, false, mid)).toBe(0);
    expect(seaSpeed(1)).toBeGreaterThan(seaSpeed(0));
  });
});

describe('fish', () => {
  it('runs cast → float → bite → leap → splash → done with no catch count', () => {
    const phases: string[] = [];
    for (let t = 0; t <= FISH_TOTAL + 0.2; t += 0.05) {
      const f = fishFrame(t);
      if (phases[phases.length - 1] !== f.phase) phases.push(f.phase);
      expect(Object.keys(f).sort()).toEqual(['bobY', 'fish', 'line', 'phase', 'splash']);
    }
    expect(phases).toEqual(['cast', 'float', 'bite', 'leap', 'splash', 'done']);
  });

  it('the fish leaps above the water and lands back', () => {
    const ys: number[] = [];
    for (let t = 0; t < FISH_TOTAL; t += 0.02) {
      const f = fishFrame(t);
      if (f.fish) ys.push(f.fish.y);
    }
    expect(Math.min(...ys)).toBeLessThan(-100);
    expect(ys[0]).toBeCloseTo(0, 0);
    expect(Math.abs(ys[ys.length - 1])).toBeLessThan(15);
  });
});

describe('wave', () => {
  it('creature stays on the horizon and on screen', () => {
    for (let t = 0; t < 60; t += 0.5) {
      const p = creaturePose(t);
      expect(p.x).toBeGreaterThan(200);
      expect(p.x).toBeLessThan(1400);
      expect(Math.abs(p.y - 470)).toBeLessThan(10);
    }
  });

  it('passengers wave and the creature sprays back, then it ends', () => {
    const frames = Array.from({ length: 40 }, (_, i) => waveFrame(i * 0.05));
    expect(Math.max(...frames.map((f) => f.arm))).toBeGreaterThan(0.6);
    expect(Math.max(...frames.map((f) => f.spray))).toBeGreaterThan(0.9);
    expect(frames[0].spray).toBe(0);
    expect(waveFrame(WAVE_DURATION).done).toBe(true);
  });

  it('passengers are the characters seated on the boat', () => {
    let w = must(sit(createLivingRoom(), 'kid', 'sofa'));
    expect(passengers(w)).toEqual([]);
    w = must(transform(w, 'sofa-boat'));
    expect(passengers(w)).toEqual(['kid']);
  });
});
