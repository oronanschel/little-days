// Boat-adventure layer: the sparkle that invites a trip, the way home, and the
// rock / sail / fish / wave interactions. It owns its own props (rod, whale,
// sparkle, home bubble) and drives the shared scene only through `BoatHost`,
// so it stays independent of how the living room is drawn.
//
// Layers: add `play.behind` under the boat (far-away whale and its spray) and
// `play` itself above the boat (rod, sparkle, home bubble).
//
// Input: the scene's gesture code calls `tap(point)` with a room-unit point when
// it recognises a tap (not a drag). `tap` returns true if the boat used it.

import { Container, Graphics } from 'pixi.js';
import {
  applyAction,
  revert,
  transform,
  worldPosition,
  type OpResult,
  type Vec2,
  type World,
} from '../world';
import { BOB, DROP, FISH, HOME_BUBBLE, ROD, ROD_TIP, SPARKLE, WHALE, WHALE_SPOUT } from './art';
import {
  REDUCED_MOTION_SCALE,
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

export type Expression = 'neutral' | 'happy' | 'surprised';

/** What the boat layer needs from the scene. Optional hooks degrade to no-ops. */
export interface BoatHost {
  world(): World;
  /** Apply a world operation (and save). Refusals are ignored. */
  apply(op: (w: World) => OpResult): void;
  /** Tilt the boat (sofa view and its passengers) around the hull base, radians. */
  setBoatTilt?(radians: number): void;
  /** How raised the sail is, 0..1 (the art reads `boat.sail` for the resting state). */
  setSail?(progress: number): void;
  /** Sea backdrop scroll speed, room units per second. */
  setSeaSpeed?(unitsPerSecond: number): void;
  /** Raise a character's waving arm, 0..1. */
  setWave?(charId: string, amount: number): void;
  setExpression?(charId: string, expression: Expression): void;
}

/** Tap targets relative to the boat anchor (the sofa's base), in room units. Generous on purpose. */
export const BOAT_TARGETS = {
  sparkle: { x: 250, y: -250, r: 80 },
  mast: { x: 0, y: -330, r: 110 },
  hull: { left: -300, right: 300, top: -150, bottom: 30 },
  rodButt: { x: 280, y: -120 },
  rod: { x: 350, y: -190, r: 100 },
  waterY: 40,
};
export const HOME = { x: 110, y: 110, r: 80 };
const WHALE_HIT_R = 120;

const svg = (src: string) => new Graphics().svg(src);

const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);

export class BoatPlay extends Container {
  /** Far-away things on the horizon; the scene adds this under the boat. */
  readonly behind = new Container();
  private readonly motion: number;
  private t = 0;

  private readonly sparkle = svg(SPARKLE);
  private readonly home = svg(HOME_BUBBLE);
  private readonly boatProps = new Container();
  private readonly line = new Graphics();
  private readonly bob = svg(BOB);
  private readonly fish = svg(FISH);
  private readonly splash = new Graphics();
  private readonly whale = svg(WHALE);
  private readonly drops: Graphics[] = [];

  private rockAt = -Infinity;
  private rockAmp = 0;
  private sailRaised = false;
  private sailFrom = 0;
  private sailAt = -Infinity;
  private fishAt = -Infinity;
  private waveAt = -Infinity;

  constructor(private readonly host: BoatHost) {
    super();
    const reduced =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.motion = reduced ? REDUCED_MOTION_SCALE : 1;

    const rod = svg(ROD);
    rod.position.set(BOAT_TARGETS.rodButt.x, BOAT_TARGETS.rodButt.y);
    this.boatProps.addChild(rod, this.line, this.bob, this.fish, this.splash);
    this.addChild(this.boatProps, this.sparkle, this.home);
    this.behind.addChild(this.whale);
    for (let i = 0; i < 5; i++) {
      const d = svg(DROP);
      this.drops.push(d);
      this.behind.addChild(d);
    }
    this.home.position.set(HOME.x, HOME.y);

    const s = host.world().transformation ? host.world().entities[host.world().transformation!.anchor] : undefined;
    this.sailRaised = Boolean(s?.state['boat.sail']);
    this.sailFrom = this.sailRaised ? 1 : 0;
  }

  private get atSea(): boolean {
    return this.host.world().transformation?.def === 'sofa-boat';
  }

  private anchor(): Vec2 {
    const w = this.host.world();
    return worldPosition(w, w.transformation?.anchor ?? 'sofa');
  }

  private local(p: Vec2): Vec2 {
    const a = this.anchor();
    return { x: p.x - a.x, y: p.y - a.y };
  }

  /** Handle a recognised tap at a room-unit point. Returns true if used. */
  tap(p: Vec2): boolean {
    const T = BOAT_TARGETS;
    const q = this.local(p);
    if (!this.atSea) {
      if (dist(q, T.sparkle) <= T.sparkle.r) {
        this.host.apply((w) => transform(w, 'sofa-boat'));
        return true;
      }
      return false;
    }
    if (dist(p, HOME) <= HOME.r) {
      this.host.apply(revert);
      return true;
    }
    // The boat wins over the whale: it drifts behind the mast on the horizon.
    if (dist(q, T.rod) <= T.rod.r) return this.start('fish');
    if (dist(q, T.mast) <= T.mast.r) return this.start('sail');
    if (q.x >= T.hull.left && q.x <= T.hull.right && q.y >= T.hull.top && q.y <= T.hull.bottom)
      return this.start('rock');
    if (dist(p, creaturePose(this.t, this.motion)) <= WHALE_HIT_R) return this.start('wave');
    return false;
  }

  private start(action: 'rock' | 'sail' | 'fish' | 'wave'): boolean {
    const now = this.t;
    if (action === 'rock') {
      this.rockAmp = nextRockAmp(this.rockAmp, now - this.rockAt);
      this.rockAt = now;
      this.expressAll('happy');
    } else if (action === 'sail') {
      this.sailFrom = this.currentSail();
      this.sailRaised = !this.sailRaised;
      this.sailAt = now;
    } else if (action === 'fish') {
      if (fishFrame(now - this.fishAt).phase !== 'done') return true; // one line at a time
      this.fishAt = now;
    } else {
      this.waveAt = now;
      this.expressAll('happy');
    }
    this.host.apply((w) => applyAction(w, action));
    return true;
  }

  private currentSail(): number {
    return sailProgress(this.t - this.sailAt, this.sailRaised, this.sailFrom);
  }

  private expressAll(e: Expression) {
    for (const id of passengers(this.host.world())) this.host.setExpression?.(id, e);
  }

  /** Advance animations by `dt` seconds. Call from the app ticker. */
  update(dt: number): void {
    this.t += dt;
    const w = this.host.world();
    const atSea = this.atSea;
    const a = this.anchor();

    // Invitation sparkle (living room only).
    const level = inviteLevel(w);
    const pulse = invitePulse(this.t, level);
    this.sparkle.visible = level !== 'none';
    this.sparkle.position.set(a.x + BOAT_TARGETS.sparkle.x, a.y + BOAT_TARGETS.sparkle.y);
    this.sparkle.alpha = pulse;
    this.sparkle.scale.set(0.8 + 0.4 * pulse * this.motion + (1 - this.motion) * 0.2);
    this.sparkle.rotation = this.t * 0.6 * this.motion;

    this.home.visible = atSea;
    this.boatProps.visible = atSea;
    this.whale.visible = atSea;
    for (const d of this.drops) d.visible = false;
    this.splash.clear();
    if (!atSea) {
      this.host.setBoatTilt?.(0);
      this.host.setSeaSpeed?.(0);
      return;
    }

    // Keep the sail in step with the saved state (e.g. after loading a save).
    const saved = Boolean(w.entities[w.transformation!.anchor]?.state['boat.sail']);
    if (saved !== this.sailRaised) {
      this.sailRaised = saved;
      this.sailFrom = saved ? 1 : 0;
      this.sailAt = -Infinity;
    }
    const sail = this.currentSail();
    this.host.setSail?.(sail);
    this.host.setSeaSpeed?.(seaSpeed(sail));

    // Rock: tilt the boat and our props together around the hull base.
    const tilt = rockAngle(this.t - this.rockAt, this.rockAmp, this.motion);
    this.host.setBoatTilt?.(tilt);
    this.boatProps.position.set(a.x, a.y);
    this.boatProps.rotation = tilt;
    this.home.scale.set(1 + 0.04 * this.motion * Math.sin(this.t * 2));

    // Fish.
    const f = fishFrame(this.t - this.fishAt, this.motion);
    const tip = { x: BOAT_TARGETS.rodButt.x + ROD_TIP.x, y: BOAT_TARGETS.rodButt.y + ROD_TIP.y };
    const bobAt = { x: tip.x + 40 + 120 * f.line, y: BOAT_TARGETS.waterY + f.bobY };
    this.line.clear();
    if (f.phase !== 'done') {
      this.line
        .moveTo(tip.x, tip.y)
        .quadraticCurveTo(tip.x + 60, tip.y + 60, bobAt.x, bobAt.y)
        .stroke({ width: 3, color: '#3b3350', alpha: 0.8 });
    }
    this.bob.visible = f.phase !== 'done' && f.phase !== 'cast';
    this.bob.position.set(bobAt.x, bobAt.y);
    this.fish.visible = f.fish !== null;
    if (f.fish) {
      this.fish.position.set(bobAt.x + f.fish.x, bobAt.y + f.fish.y);
      this.fish.rotation = f.fish.rotation;
      if (f.fish.y < -60) this.expressAll('surprised');
    }
    if (f.splash > 0) {
      this.splash
        .ellipse(bobAt.x + 90, bobAt.y, 20 + 60 * f.splash, 6 + 14 * f.splash)
        .stroke({ width: 4, color: '#ffffff', alpha: 1 - f.splash });
      if (f.splash > 0.9) this.expressAll('happy');
    }

    // Whale drifts on the horizon; waving makes passengers wave and the whale spray back.
    const pose = creaturePose(this.t, this.motion);
    this.whale.position.set(pose.x, pose.y);
    this.whale.scale.x = pose.facing;
    const wf = waveFrame(this.t - this.waveAt);
    for (const id of passengers(w)) this.host.setWave?.(id, wf.arm);
    if (wf.spray > 0) {
      this.drops.forEach((d, i) => {
        const spread = (i - 2) * 22 * wf.spray;
        d.visible = true;
        d.alpha = Math.min(1, wf.spray * 1.5);
        d.position.set(pose.x + WHALE_SPOUT.x * pose.facing + spread, pose.y + WHALE_SPOUT.y - 90 * wf.spray + Math.abs(i - 2) * 14);
      });
    }
  }
}
