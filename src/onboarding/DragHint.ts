import { Container, Graphics } from 'pixi.js';
import type { EntityId, Vec2, World, WorldEvent } from '../world';
import { HINT_SEEN_KEY, HintSchedule, hintFrame, hintPath, isSuccessfulDrag } from './hint';

// A soft, see-through pointing hand, fingertip at (0, 0), in world units.
const HAND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -6 96 128">
  <path d="M-8 4 Q0 -6 8 4 L8 48 Q18 40 26 48 Q36 42 42 52 Q52 48 54 60 L52 92 Q48 116 22 118 L2 118
    Q-18 116 -26 96 L-38 66 Q-42 54 -32 52 Q-24 50 -18 60 L-8 74 Z"
    fill="#ffffff" stroke="#6b3f2a" stroke-opacity="0.7" stroke-width="5" stroke-linejoin="round"/>
</svg>`;

/** Highest opacity of the hand: present, but clearly not part of the scene. */
const MAX_ALPHA = 0.9;
/** Big enough to read at a glance on a phone, where the stage is scaled down most. */
const HAND_SCALE = 1.5;

/**
 * Shows a see-through stand-in of the character under the hand while it is carried,
 * so the hand is clearly *moving someone*. Called with null to put it back.
 */
export type HintPuppet = (id: EntityId | null, feet?: Vec2) => void;

/**
 * Draws the first-time drag hint above the scene. The owner feeds it world changes and
 * touches; it hides itself whenever the child plays and retires after the first drag.
 */
export class DragHint extends Container {
  private readonly hand = new Graphics().svg(HAND_SVG);
  private readonly ripple = new Graphics().circle(0, 0, 44).fill({ color: '#ffffff', alpha: 0.6 });
  private readonly schedule: HintSchedule;
  /** Only release the puppet if we took it, so a real drag is never cleared. */
  private puppeting = false;

  constructor(
    private world: World,
    private readonly store: Pick<Storage, 'getItem' | 'setItem'> | null,
    private readonly reducedMotion = false,
    private readonly puppet: HintPuppet = () => {},
  ) {
    super();
    this.eventMode = 'none'; // never steals a touch from the toys underneath
    this.schedule = new HintSchedule(store?.getItem(HINT_SEEN_KEY) === '1');
    this.addChild(this.ripple, this.hand);
    this.visible = false;
  }

  /** Call every frame with elapsed ms. */
  update(dt: number): void {
    const t = this.schedule.tick(dt);
    const path = t === null ? null : hintPath(this.world);
    if (t === null || !path) {
      this.hide();
      return;
    }
    const f = hintFrame(path, t, this.reducedMotion);
    if (f.carrying) {
      this.puppeting = true;
      this.puppet(path.character, { x: f.pos.x - path.grab.x, y: f.pos.y - path.grab.y });
    } else this.releasePuppet();
    this.visible = f.alpha > 0;
    this.alpha = f.alpha * MAX_ALPHA;
    this.position.set(f.pos.x, f.pos.y);
    this.hand.scale.set(HAND_SCALE * (1 - 0.12 * f.press));
    this.ripple.alpha = f.press;
    this.ripple.scale.set(0.6 + 0.4 * f.press);
  }

  /** The child touched the screen: hide and wait for the next idle spell. */
  touched(): void {
    this.schedule.touched();
    this.hide();
  }

  /** The world changed; a successful drag retires the hint for good. */
  changed(world: World, events: WorldEvent[]): void {
    this.world = world;
    if (this.schedule.done || !isSuccessfulDrag(events)) return;
    this.schedule.retire();
    this.hide();
    try {
      this.store?.setItem(HINT_SEEN_KEY, '1');
    } catch {
      // Storage full or blocked: the hint simply may show again next time.
    }
  }

  private hide(): void {
    this.visible = false;
    this.releasePuppet();
  }

  private releasePuppet(): void {
    if (!this.puppeting) return;
    this.puppeting = false;
    this.puppet(null);
  }
}
