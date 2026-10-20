// Pure animation timelines for the boat adventure. Times are in seconds, lengths
// in room units (1600×1000 stage). No PixiJS here, so everything is unit-tested;
// the views in this folder only sample these functions each frame.

import { childrenOf, getEntity, type World } from '../world';

/** Multiplies amplitudes when the player prefers reduced motion. */
export const REDUCED_MOTION_SCALE = 0.35;

// --- Invitation --------------------------------------------------------------

export type InviteLevel = 'none' | 'subtle' | 'strong';

/**
 * How strongly the sofa invites a boat trip. Always at least subtle in the
 * living room so it stays discoverable; strong once the captain's hat is in
 * someone's hand or on someone's head. Never more than a sparkle: no nagging.
 */
export function inviteLevel(world: World): InviteLevel {
  if (world.transformation) return 'none';
  const hat = getEntity(world, 'captain-hat');
  const k = hat?.attachment?.kind;
  return k === 'held' || k === 'worn' ? 'strong' : 'subtle';
}

/** Sparkle opacity/scale pulse for the invitation, 0..1. */
export function invitePulse(t: number, level: InviteLevel): number {
  if (level === 'none') return 0;
  const base = level === 'strong' ? 0.65 : 0.25;
  const swing = level === 'strong' ? 0.35 : 0.15;
  return base + swing * (0.5 + 0.5 * Math.sin(t * Math.PI * (level === 'strong' ? 1.6 : 0.8)));
}

// --- Rock --------------------------------------------------------------------

export const ROCK_PERIOD = 1.1;
export const ROCK_DECAY = 1.4;
export const ROCK_MAX_AMP = 0.16; // radians, about 9°
const ROCK_TAP_AMP = 0.09;

/** Boat tilt in radians, `elapsed` seconds after a tap with amplitude `amp`. */
export function rockAngle(elapsed: number, amp: number, motion = 1): number {
  if (elapsed < 0) return 0;
  const a = amp * motion * Math.exp(-elapsed / ROCK_DECAY);
  return Math.abs(a) < 0.002 ? 0 : a * Math.sin((2 * Math.PI * elapsed) / ROCK_PERIOD);
}

/**
 * Amplitude for a new tap. Tapping again while rocking rocks harder, up to a
 * gentle cap, so excited repeated tapping feels responsive but never wild.
 */
export function nextRockAmp(previousAmp: number, elapsedSincePrevious: number): number {
  const remaining = previousAmp * Math.exp(-Math.max(0, elapsedSincePrevious) / ROCK_DECAY);
  return Math.min(ROCK_MAX_AMP, remaining + ROCK_TAP_AMP);
}

// --- Sail --------------------------------------------------------------------

export const SAIL_DURATION = 0.8;

const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * How raised the sail is (0 furled .. 1 full), `elapsed` seconds after it was
 * toggled to `raised`. Start from `from` so a mid-animation tap reverses smoothly.
 */
export function sailProgress(elapsed: number, raised: boolean, from = raised ? 0 : 1): number {
  const target = raised ? 1 : 0;
  const span = Math.abs(target - from);
  if (span === 0) return target;
  const k = easeInOut(clamp01(elapsed / (SAIL_DURATION * span)));
  return from + (target - from) * k;
}

/** Sea scroll speed in room units per second: calm drift, faster under sail. */
export function seaSpeed(sail: number): number {
  return 18 + 72 * clamp01(sail);
}

// --- Fish --------------------------------------------------------------------

export type FishPhase = 'cast' | 'float' | 'bite' | 'leap' | 'splash' | 'done';

export const FISH_TIMES = { cast: 0.6, float: 1.6, bite: 0.4, leap: 1.0, splash: 0.5 } as const;
export const FISH_TOTAL = Object.values(FISH_TIMES).reduce((a, b) => a + b, 0);

export interface FishFrame {
  phase: FishPhase;
  /** How far the line has flown out, 0..1. */
  line: number;
  /** Bob vertical offset from the water line. */
  bobY: number;
  /** Leaping fish, relative to the bob, or null when underwater. */
  fish: { x: number; y: number; rotation: number } | null;
  /** Splash ring size, 0..1. */
  splash: number;
}

/** One cast: line out, bob floats, a nibble, a fish leaps over the bob and splashes home. No catch count. */
export function fishFrame(elapsed: number, motion = 1): FishFrame {
  const T = FISH_TIMES;
  let t = elapsed;
  const frame = (phase: FishPhase, rest: Partial<FishFrame>): FishFrame => ({
    phase,
    line: 1,
    bobY: 0,
    fish: null,
    splash: 0,
    ...rest,
  });
  if (t < 0) return frame('cast', { line: 0 });
  if (t < T.cast) return frame('cast', { line: easeInOut(t / T.cast) });
  t -= T.cast;
  if (t < T.float) return frame('float', { bobY: 4 * motion * Math.sin(t * Math.PI * 2) });
  t -= T.float;
  if (t < T.bite) return frame('bite', { bobY: 14 * motion * Math.sin((t / T.bite) * Math.PI * 3) });
  t -= T.bite;
  if (t < T.leap) {
    const p = t / T.leap;
    const height = 160 * (0.5 + 0.5 * motion);
    return frame('leap', {
      fish: { x: -90 + 180 * p, y: -4 * height * p * (1 - p), rotation: (p - 0.5) * 2.2 },
    });
  }
  t -= T.leap;
  if (t < T.splash) return frame('splash', { splash: t / T.splash });
  return frame('done', { line: 0 });
}

// --- Wave / passing creature -------------------------------------------------

export const CREATURE_PERIOD = 26;

/**
 * A friendly sea creature drifting back and forth along the horizon, so it is
 * always on screen and always tappable (no timing skill needed).
 */
export function creaturePose(t: number, motion = 1): { x: number; y: number; facing: 1 | -1 } {
  const phase = (2 * Math.PI * t) / CREATURE_PERIOD;
  return {
    x: 800 + 520 * Math.sin(phase),
    y: 470 + 6 * motion * Math.sin(t * 2.3),
    facing: Math.cos(phase) >= 0 ? 1 : -1,
  };
}

export const WAVE_DURATION = 1.8;

/** Passengers wave (arm 0..1), and the creature answers with a spray (0..1) a beat later. */
export function waveFrame(elapsed: number): { arm: number; spray: number; done: boolean } {
  if (elapsed < 0 || elapsed >= WAVE_DURATION) return { arm: 0, spray: 0, done: elapsed >= WAVE_DURATION };
  const arm = Math.sin((elapsed / WAVE_DURATION) * Math.PI) * (0.75 + 0.25 * Math.sin(elapsed * 14));
  const s = (elapsed - 0.5) / 1.0;
  const spray = s > 0 && s < 1 ? Math.sin(s * Math.PI) : 0;
  return { arm: clamp01(arm), spray, done: false };
}

/** Characters on the boat: they sway with it and join in the waving. */
export function passengers(world: World): string[] {
  const t = world.transformation;
  return t ? childrenOf(world, t.anchor).filter((e) => e.attachment?.kind === 'seated').map((e) => e.id) : [];
}
