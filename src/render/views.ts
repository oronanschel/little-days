import { Container, Rectangle, Sprite } from 'pixi.js';
import {
  characterParts,
  type ArmPose,
  type CharacterParts,
  type Expression,
  type Look,
  type Pose,
} from '../art/characters';
import {
  boatHull,
  boatMast,
  boatSailFurled,
  boatSailRaised,
  captainHat,
  contactShadow,
  ripple,
  sideTable,
  snack,
  sofaBack,
  sofaFront,
} from '../art/props';
import type { ArtPiece } from '../art/svg';
import { artSprite, setArt } from './textures';

/** Extra touch margin around art, in world units: forgiving targets for small hands. */
export const HIT_PADDING = 28;

export type Ground = 'floor' | 'sea';

function paddedHitArea(art: ArtPiece, pad = HIT_PADDING): Rectangle {
  return new Rectangle(-art.anchorX - pad, -art.anchorY - pad, art.width + pad * 2, art.height + pad * 2);
}

/** Common surface every entity view offers to the scene renderer. */
export interface EntityView {
  readonly id: string;
  /** Main container: positioned at the entity's anchor and depth-sorted. */
  readonly root: Container;
  /** Containers that need their own depth (e.g. a sofa's front layer). */
  readonly extraLayers: Container[];
  setGround(ground: Ground): void;
  destroy(): void;
}

export class ShadowedSprite {
  readonly shadow: Sprite;
  constructor(width: number) {
    this.shadow = artSprite(contactShadow);
    this.shadow.scale.set(width / contactShadow.width, 1);
  }
  setGround(ground: Ground): void {
    setArt(this.shadow, ground === 'sea' ? ripple : contactShadow);
  }
}

// --- Characters ---------------------------------------------------------------

export const LOOK_OF_TYPE: Record<string, Look> = {
  'character-grown': 'grownup',
  'character-kid': 'child',
};

export class CharacterView implements EntityView {
  readonly root = new Container();
  readonly extraLayers: Container[] = [];
  /** Body parts, offset so that the root's origin is the feet (standing) or hips (seated). */
  readonly body = new Container();
  /** Held item goes here; it sits between the torso and the front arm so the hand wraps it. */
  readonly handSlot = new Container();
  /** Worn item goes here. */
  readonly headSlot = new Container();
  private readonly parts: CharacterParts;
  private readonly shadow: ShadowedSprite;
  private readonly backArm: Sprite;
  private readonly legs: Sprite;
  private readonly face: Sprite;
  private readonly frontArm: Sprite;
  private pose: Pose = 'stand';
  private armPose: ArmPose = 'down';
  private expression: Expression = 'neutral';

  constructor(
    readonly id: string,
    readonly look: Look,
  ) {
    const p = (this.parts = characterParts(look));
    const g = p.geometry;
    this.shadow = new ShadowedSprite(g.width * 0.6);
    this.backArm = artSprite(p.backArm.down);
    this.legs = artSprite(p.legs.stand);
    this.face = artSprite(p.face.neutral);
    this.frontArm = artSprite(p.frontArm.down);
    this.handSlot.position.set(g.carryX - g.width / 2, g.carryY - g.height);
    this.headSlot.position.set(g.headTopX - g.width / 2, g.headTopY - g.height + 12);
    this.body.addChild(
      this.backArm,
      this.legs,
      artSprite(p.torso),
      artSprite(p.head),
      this.face,
      this.handSlot,
      this.frontArm,
      this.headSlot,
    );
    this.root.addChild(this.shadow.shadow, this.body);
    this.root.eventMode = 'static';
    this.root.cursor = 'grab';
    this.root.hitArea = new Rectangle(
      -g.width / 2 + 30 - HIT_PADDING,
      -g.height - HIT_PADDING,
      g.width - 60 + HIT_PADDING * 2,
      g.height + HIT_PADDING * 2,
    );
  }

  get geometry() {
    return this.parts.geometry;
  }

  setPose(pose: Pose): void {
    if (pose === this.pose) return;
    this.pose = pose;
    setArt(this.legs, this.parts.legs[pose]);
    const g = this.parts.geometry;
    // Seated characters are positioned by their hips; shift the body so the hips land on the origin.
    this.body.y = pose === 'sit' ? g.height - g.hipY : 0;
    this.shadow.shadow.visible = pose === 'stand';
    this.root.hitArea = new Rectangle(
      -g.width / 2 + 30 - HIT_PADDING,
      -g.height + this.body.y - HIT_PADDING,
      g.width - 60 + HIT_PADDING * 2,
      g.height + HIT_PADDING * 2,
    );
  }

  setArmPose(arm: ArmPose): void {
    if (arm === this.armPose) return;
    this.armPose = arm;
    setArt(this.backArm, this.parts.backArm[arm]);
    setArt(this.frontArm, this.parts.frontArm[arm]);
  }

  setExpression(e: Expression): void {
    if (e === this.expression) return;
    this.expression = e;
    setArt(this.face, this.parts.face[e]);
  }

  get currentArmPose(): ArmPose {
    return this.armPose;
  }

  get currentPose(): Pose {
    return this.pose;
  }

  /** Hand and head points relative to the root origin, for drop targets and attachments. */
  anchor(which: 'hand' | 'head'): { x: number; y: number } {
    const slot = which === 'hand' ? this.handSlot : this.headSlot;
    return { x: slot.x, y: slot.y + this.body.y };
  }

  setGround(ground: Ground): void {
    this.shadow.setGround(ground);
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }
}

// --- Sofa (and its boat role) -----------------------------------------------

export class SofaView implements EntityView {
  /** Back layer: backrest and seat. Seated characters are depth-sorted just in front of it. */
  readonly root = new Container();
  /** Front layer: armrests and legs, or the boat hull. */
  readonly front = new Container();
  readonly extraLayers: Container[];
  /** Boat-only pieces behind the sofa (mast, sail): tween or animate freely. */
  readonly boatBack = new Container();
  /** Boat-only pieces in front of the sofa (hull). */
  readonly boatFront = new Container();
  private readonly shadow: ShadowedSprite;
  private readonly armrests: Sprite;
  private readonly sail = new Container();
  private readonly sailRaised: Sprite;
  private readonly sailFurled: Sprite;
  private isBoat = false;

  constructor(readonly id: string) {
    this.extraLayers = [this.front];
    this.shadow = new ShadowedSprite(sofaBack.width * 1.05);
    this.boatBack.addChild(artSprite(boatMast));
    this.sailRaised = artSprite(boatSailRaised);
    this.sailFurled = artSprite(boatSailFurled);
    // The sail unrolls upwards from the boom, so it scales around its foot.
    this.sail.pivot.set(0, SAIL_FOOT_Y);
    this.sail.position.set(0, SAIL_FOOT_Y);
    this.sail.addChild(this.sailRaised);
    this.boatBack.addChild(this.sail, this.sailFurled);
    this.root.addChild(this.shadow.shadow, this.boatBack, artSprite(sofaBack));
    this.armrests = artSprite(sofaFront);
    this.boatFront.addChild(artSprite(boatHull));
    this.front.addChild(this.armrests, this.boatFront);
    this.root.eventMode = 'static';
    this.root.hitArea = paddedHitArea(sofaBack, 0);
    // This is visual occlusion only: its transparent middle must not intercept
    // touches meant for seated characters or props behind the armrests/hull.
    this.front.eventMode = 'none';
    this.setBoat(false, false);
  }

  setBoat(isBoat: boolean, sailUp: boolean): void {
    this.isBoat = isBoat;
    this.boatBack.visible = isBoat;
    this.boatFront.visible = isBoat;
    this.shadow.shadow.visible = !isBoat;
    this.setSailAmount(sailUp ? 1 : 0);
  }

  /** How far the sail is raised, 0 (furled) … 1 (full), for animating between states. */
  setSailAmount(amount: number): void {
    const a = Math.max(0, Math.min(1, amount));
    this.sail.visible = this.isBoat && a > 0.02;
    this.sail.scale.y = a;
    this.sailFurled.visible = this.isBoat && a < 0.35;
  }

  /** Lean the sofa/boat around its base (radians); the scene renderer tilts its passengers too. */
  setTilt(radians: number): void {
    this.root.rotation = radians;
    this.front.rotation = radians;
  }

  setGround(ground: Ground): void {
    this.shadow.setGround(ground);
  }

  destroy(): void {
    this.root.destroy({ children: true });
    this.front.destroy({ children: true });
  }
}

// --- Simple props ---------------------------------------------------------------

/** Bottom of the raised sail, relative to the sofa's base (see boatSailRaised). */
const SAIL_FOOT_Y = -290;

const PROP_ART: Record<string, ArtPiece> = {
  'side-table': sideTable,
  snack,
  'captain-hat': captainHat,
};

export class PropView implements EntityView {
  readonly root = new Container();
  readonly extraLayers: Container[] = [];
  readonly sprite: Sprite;
  private readonly shadow: ShadowedSprite;

  constructor(
    readonly id: string,
    readonly art: ArtPiece,
    draggable: boolean,
  ) {
    this.shadow = new ShadowedSprite(art.width * 0.9);
    this.sprite = artSprite(art);
    this.root.addChild(this.shadow.shadow, this.sprite);
    this.root.eventMode = 'static';
    this.root.hitArea = paddedHitArea(art, draggable ? HIT_PADDING + 12 : 0);
    if (draggable) this.root.cursor = 'grab';
  }

  /** Items on the floor cast a shadow; items held, worn or resting on furniture don't. */
  setOnFloor(onFloor: boolean): void {
    this.shadow.shadow.visible = onFloor;
  }

  setGround(ground: Ground): void {
    this.shadow.setGround(ground);
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }
}

export function propArt(type: string): ArtPiece | undefined {
  return PROP_ART[type];
}
