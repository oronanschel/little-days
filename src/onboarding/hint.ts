// First-time drag hint: the plan's "one gentle visual cue demonstrates drag-and-drop
// without text". Pure logic only (no PixiJS, no DOM), so it can be unit-tested.
//
// A see-through hand presses on a family member, carries it over to a free sofa seat
// and lets go. It only appears while the child is idle, stops after a few loops so it
// never nags, and is retired for good after the child's first successful drag.

import { CATALOG, type EntityId, type Vec2, type World, type WorldEvent } from '../world';

/** Stored separately from the world save so the hint never touches the world schema. */
export const HINT_SEEN_KEY = 'little-days/drag-hint-seen';

/** How long the child must be idle before the hint shows, ms. */
export const FIRST_DELAY_MS = 1500;
export const IDLE_DELAY_MS = 8000;
/** Loops per idle spell; after that the hint waits for the next idle spell. */
export const LOOPS_PER_SPELL = 3;

// One loop of the gesture, ms.
const FADE_IN = 400;
const PRESS = 300;
const CARRY = 1400;
const RELEASE = 300;
const FADE_OUT = 500;
const REST = 700;
export const LOOP_MS = FADE_IN + PRESS + CARRY + RELEASE + FADE_OUT + REST;

/** Where the finger grabs a character, above its feet: roughly its tummy. */
const GRAB_ABOVE_FEET = 110;
/** The finger lands a little above the seat point, where the tummy will be. */
const DROP_ABOVE_SEAT = 60;
/** Height of the carrying arc, world units. */
const ARC = 90;

export interface HintPath {
  character: EntityId;
  from: Vec2;
  to: Vec2;
  /** Finger point minus the character's feet, to carry a preview of the character along. */
  grab: Vec2;
}

export interface HintFrame {
  pos: Vec2;
  /** 0 = hidden, 1 = fully visible. */
  alpha: number;
  /** 0 = finger up, 1 = pressed. */
  press: number;
  /** Whether the character is being carried in this frame. */
  carrying: boolean;
}

/**
 * The hint demonstrates seating, the first thing the plan wants children to discover.
 * Nothing to show (null) once anyone sits, outside the living room, or with no free seat.
 */
export function hintPath(world: World): HintPath | null {
  if (world.scene !== 'living-room' || world.transformation) return null;
  const entities = Object.values(world.entities);
  if (entities.some((e) => e.attachment?.kind === 'seated')) return null;

  const sofa = entities.find((e) => CATALOG[e.type]?.seats?.length && !e.attachment);
  const characters = entities.filter((e) => CATALOG[e.type]?.character && !e.attachment);
  if (!sofa || characters.length === 0) return null;

  const seats = CATALOG[sofa.type].seats!.map((s) => ({ x: sofa.pos.x + s.x, y: sofa.pos.y + s.y }));
  // The character nearest the sofa makes the shortest, clearest demonstration.
  const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);
  const character = characters.reduce((best, c) => (dist(c.pos, sofa.pos) < dist(best.pos, sofa.pos) ? c : best));
  const seat = seats.reduce((best, s) => (dist(character.pos, s) < dist(character.pos, best) ? s : best));

  return {
    character: character.id,
    from: { x: character.pos.x, y: character.pos.y - GRAB_ABOVE_FEET },
    to: { x: seat.x, y: seat.y - DROP_ABOVE_SEAT },
    grab: { x: 0, y: -GRAB_ABOVE_FEET },
  };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => v * v * (3 - 2 * v);

/**
 * The hand at time `t` (ms) into a loop. With `reducedMotion`, the hand does not glide:
 * it fades in pressing at the character, then fades in again releasing at the seat.
 */
export function hintFrame(path: HintPath, t: number, reducedMotion = false): HintFrame {
  const u = ((t % LOOP_MS) + LOOP_MS) % LOOP_MS;
  const { from, to } = path;

  if (reducedMotion) {
    const half = LOOP_MS / 2;
    const local = u % half;
    const alpha = clamp01(Math.min(local / FADE_IN, (half - REST / 2 - local) / FADE_OUT));
    return u < half
      ? { pos: { ...from }, alpha, press: 1, carrying: false }
      : { pos: { ...to }, alpha, press: 0, carrying: false };
  }

  let k = u;
  if (k < FADE_IN) return { pos: { ...from }, alpha: k / FADE_IN, press: 0, carrying: false };
  k -= FADE_IN;
  if (k < PRESS) return { pos: { ...from }, alpha: 1, press: ease(k / PRESS), carrying: false };
  k -= PRESS;
  if (k < CARRY) {
    const s = ease(k / CARRY);
    return {
      pos: {
        x: from.x + (to.x - from.x) * s,
        y: from.y + (to.y - from.y) * s - Math.sin(Math.PI * s) * ARC,
      },
      alpha: 1,
      press: 1,
      carrying: true,
    };
  }
  k -= CARRY;
  if (k < RELEASE) return { pos: { ...to }, alpha: 1, press: 1 - ease(k / RELEASE), carrying: true };
  k -= RELEASE;
  if (k < FADE_OUT) return { pos: { ...to }, alpha: 1 - k / FADE_OUT, press: 0, carrying: false };
  return { pos: { ...to }, alpha: 0, press: 0, carrying: false };
}

/** A committed drag that moved something counts as "the child has got it". */
export function isSuccessfulDrag(events: WorldEvent[]): boolean {
  return events.some((e) =>
    ['moved', 'sat', 'stood', 'picked-up', 'dropped', 'wore', 'placed'].includes(e.type),
  );
}

/**
 * When the hint shows. Time only advances while idle; any touch resets the idle clock
 * and hides the hand; a successful drag retires it permanently.
 */
export class HintSchedule {
  private idle = 0;
  private delay = FIRST_DELAY_MS;
  private retired: boolean;

  constructor(seen: boolean) {
    this.retired = seen;
  }

  get done(): boolean {
    return this.retired;
  }

  /** Advance by `dt` ms; returns the time into the current loop, or null when hidden. */
  tick(dt: number): number | null {
    if (this.retired) return null;
    this.idle += dt;
    const t = this.idle - this.delay;
    if (t < 0 || t >= LOOPS_PER_SPELL * LOOP_MS) return null;
    return t;
  }

  touched(): void {
    this.idle = 0;
    this.delay = IDLE_DELAY_MS;
  }

  retire(): void {
    this.retired = true;
  }
}
