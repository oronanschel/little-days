import { frameFor, union, visibleRect, ease, type Frame, type Rect } from './layout';
import { Application, Container, Graphics, Rectangle, TilingSprite, type FederatedPointerEvent, type PointData } from 'pixi.js';
import { characterParts, LOOKS, type Expression } from '../art/characters';
import { BACKDROP_WIDTH, FLOOR_COLOR, HOUSE_SHELL_BOTTOM, HOUSE_SHELL_TOP, livingRoom, sea, SEA_COLOR, seaShore, seaWater, SHORE_Y, SKY_COLOR, WALL_COLOR } from '../art/backdrops';
import * as props from '../art/props';
import type { ArtPiece } from '../art/svg';
import { worldPosition, type Entity, type EntityId, type World, type WorldEvent } from '../world';
import { artSprite, preload, textureOf } from './textures';
import { CharacterView, LOOK_OF_TYPE, PropView, SofaView, propArt, type EntityView, type Ground } from './views';

/** Logical stage size in world units; everything is laid out in this space and letterboxed. */
export const STAGE_WIDTH = 1600;
export const STAGE_HEIGHT = 1000;
/** Camera easing time constant, ms. */
const CAMERA_EASE_MS = 140;
/** Where the wall meets the floor (and the horizon sits at sea). */
const HORIZON_Y = 560;

/** How long a reaction face stays before relaxing back to neutral. */
const REACTION_MS = 1600;
const FADE_MS = 450;

function allArt(): ArtPiece[] {
  const pieces: ArtPiece[] = [livingRoom, sea, seaWater, seaShore];
  for (const v of Object.values(props)) if (v && typeof v === 'object' && 'svg' in v) pieces.push(v as ArtPiece);
  for (const look of LOOKS) {
    const p = characterParts(look);
    pieces.push(
      p.torso,
      p.head,
      ...Object.values(p.backArm),
      ...Object.values(p.frontArm),
      ...Object.values(p.legs),
      ...Object.values(p.face),
    );
  }
  return pieces;
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface Reaction {
  expression: Expression;
  until: number;
}

/**
 * Presentation layer: draws a `World` and never changes it. Input code asks it where
 * things are (`toWorld`, `anchorOf`, `boundsOf`) and shows drag previews with `setDragPreview`.
 */
export class SceneRenderer {
  /** Letterboxed container in world units (1600×1000). */
  readonly stage = new Container();
  readonly backdrop = new Container();
  /** Depth-sorted entities; zIndex is the floor y. */
  readonly entities = new Container();
  /** Particles and other effects above the scene. */
  readonly fx = new Container();
  /** Called when a child touches an entity; the input controller decides what that means. */
  onEntityPointerDown?: (id: EntityId, event: FederatedPointerEvent) => void;

  private readonly views = new Map<EntityId, EntityView>();
  private readonly livingLayer = new Container();
  private readonly seaLayer = new Container();
  private water!: TilingSprite;
  private seaSpeed = 0;
  /** Lean per transformation anchor (e.g. the rocking boat), radians. */
  private readonly tilts = new Map<EntityId, number>();
  private readonly reactions = new Map<EntityId, Reaction>();
  private world: World | null = null;
  private drag: { id: EntityId; pos: PointData } | null = null;
  private elapsed = 0;
  private readonly reducedMotion = prefersReducedMotion();
  /** Current and target camera; the camera eases toward the target after world changes. */
  private camera: Frame | null = null;
  private cameraTarget: Frame | null = null;

  private constructor(readonly app: Application) {
    this.entities.sortableChildren = true;
    this.livingLayer.addChild(
      fill(WALL_COLOR, FLOOR_COLOR),
      new Graphics().rect(-4000, -4000, 9600, 4000).fill(HOUSE_SHELL_TOP).rect(-4000, STAGE_HEIGHT - 2, 9600, 4000).fill(HOUSE_SHELL_BOTTOM),
      artSprite(livingRoom),
    );
    // The water tiles far beyond the stage so it also fills letterbox margins while scrolling.
    this.water = new TilingSprite({ texture: textureOf(seaWater), width: 9600, height: STAGE_HEIGHT });
    this.water.position.set(-4000, 0);
    this.water.tilePosition.x = 4000 - seaWater.anchorX;
    // The floor becomes a sandbank at sea, tiled as wide as the water; sand continues below.
    const shore = new TilingSprite({ texture: textureOf(seaShore), width: 9600, height: STAGE_HEIGHT });
    shore.position.set(-4000, 0);
    shore.tilePosition.x = 4000 - seaShore.anchorX;
    const sandBelow = new Graphics().rect(-4000, STAGE_HEIGHT - 2, 9600, 4000).fill('#f7e3b8');
    // The sky art's top pixel row is antialiased; a thin strip of the same colour hides the seam
    // where it meets the sky fill above the stage (visible on tall screens).
    const skySeam = new Graphics().rect(-4000, -4, 9600, 8).fill(SKY_COLOR);
    this.seaLayer.addChild(fill(SKY_COLOR, SEA_COLOR), artSprite(sea), skySeam, this.water, shore, sandBelow);
    this.seaLayer.alpha = 0;
    this.backdrop.addChild(this.livingLayer, this.seaLayer);
    this.stage.addChild(this.backdrop, this.entities, this.fx);
    app.stage.addChild(this.stage);
    app.ticker.add((t) => this.tick(t.deltaMS));
    this.layout();
    app.renderer.on('resize', () => this.layout());
  }

  static async create(app: Application): Promise<SceneRenderer> {
    // Rasterise art for the closest zoom the camera uses on this screen, so a
    // portrait tablet (which zooms in on the play area) stays crisp.
    const scale = frameFor(app.screen.width, app.screen.height, null).scale;
    const resolution = Math.min(3, Math.max(1, scale * app.renderer.resolution * 1.25));
    await preload(allArt(), resolution);
    return new SceneRenderer(app);
  }

  /**
   * Frame the world for the current screen (see layout.ts): the core play area
   * and every person and toy stay visible, zoomed to fill the screen. Snaps on
   * resize; after world changes `reframe` eases there instead.
   */
  layout(): void {
    this.cameraTarget = this.computeFrame();
    this.camera = this.cameraTarget;
    this.applyCamera();
  }

  /** Convert a screen (global) point to world units. */
  toWorld(global: PointData): PointData {
    return this.stage.toLocal(global);
  }

  /** The part of the world currently on screen, in world units (e.g. to place screen-corner buttons). */
  visibleWorldRect(): Rect {
    const { width, height } = this.app.screen;
    return visibleRect(this.camera ?? this.computeFrame(), width, height);
  }

  private computeFrame(): Frame {
    const { width, height } = this.app.screen;
    return frameFor(width, height, this.contentBounds());
  }

  /** World bounds of everything standing in the scene (held and worn items ride inside their holder). */
  private contentBounds(): Rect | null {
    let r: Rect | null = null;
    for (const [id, view] of this.views) {
      if (view.root.parent !== this.entities || this.drag?.id === id) continue;
      const b = this.boundsOf(id);
      if (b && b.width > 0 && b.height > 0) r = r ? union(r, b) : { x: b.x, y: b.y, width: b.width, height: b.height };
    }
    return r;
  }

  private reframe(): void {
    this.cameraTarget = this.computeFrame();
    if (!this.camera || this.reducedMotion) {
      this.camera = this.cameraTarget;
      this.applyCamera();
    }
  }

  private applyCamera(): void {
    if (!this.camera) return;
    this.stage.scale.set(this.camera.scale);
    this.stage.position.set(this.camera.x, this.camera.y);
  }

  // --- Sync -------------------------------------------------------------------

  sync(world: World, events: WorldEvent[] = []): void {
    this.world = world;
    const ids = new Set(Object.keys(world.entities));
    for (const [id, view] of this.views) {
      if (!ids.has(id)) {
        view.destroy();
        this.views.delete(id);
      }
    }
    for (const e of Object.values(world.entities)) if (!this.views.has(e.id)) this.createView(e);


    // Attach held/worn items to their holder's hand/head before positioning the rest.
    for (const e of Object.values(world.entities)) this.place(world, e);

    for (const ev of events) this.react(world, ev);
    this.applyTilts();
    this.applyDrag();
    this.reframe();
  }

  private createView(e: Entity): void {
    let view: EntityView | undefined;
    const look = LOOK_OF_TYPE[e.type];
    if (look) view = new CharacterView(e.id, look);
    else if (e.type === 'sofa') view = new SofaView(e.id);
    else {
      const art = propArt(e.type);
      if (art) view = new PropView(e.id, art, e.type !== 'side-table');
    }
    if (!view) {
      console.warn(`No art for entity type "${e.type}"`);
      return;
    }
    const id = e.id;
    view.root.on('pointerdown', (ev: FederatedPointerEvent) => {
      ev.stopPropagation();
      this.onEntityPointerDown?.(id, ev);
    });
    this.views.set(e.id, view);
    this.entities.addChild(view.root, ...view.extraLayers);
  }

  private place(world: World, e: Entity): void {
    const view = this.views.get(e.id);
    if (!view) return;
    const a = e.attachment;

    if (view instanceof CharacterView) {
      view.setPose(a?.kind === 'seated' ? 'sit' : 'stand');
      const holding = Object.values(world.entities).some((o) => o.attachment?.kind === 'held' && o.attachment.by === e.id);
      if (view.currentArmPose !== 'wave') view.setArmPose(holding ? 'carry' : 'down');
    }
    if (view instanceof SofaView) {
      const isBoat = world.transformation?.anchor === e.id;
      view.setBoat(isBoat, Boolean(e.state['boat.sail']));
    }
    if (view instanceof PropView) view.setOnFloor(a === null);

    if (a && (a.kind === 'held' || a.kind === 'worn')) {
      const holder = this.views.get(a.by);
      if (holder instanceof CharacterView) {
        const slot = a.kind === 'held' ? holder.handSlot : holder.headSlot;
        if (view.root.parent !== slot) slot.addChild(view.root);
        view.root.position.set(0, 0);
        view.root.scale.set(1);
        view.root.rotation = 0;
        return;
      }
    }

    if (view.root.parent !== this.entities) this.entities.addChild(view.root);
    const p = worldPosition(world, e.id);
    // At sea, things on the sandbank cast shadows; things out in the water get ripples.
    const ground: Ground = world.scene === 'sea' && p.y < SHORE_Y ? 'sea' : 'floor';
    view.setGround(ground);
    view.root.position.set(p.x, p.y);
    view.root.scale.set(1);
    view.root.rotation = 0;
    const z = this.depthOf(world, e);
    view.root.zIndex = z;
    for (const layer of view.extraLayers) {
      layer.position.set(p.x, p.y);
      layer.zIndex = z + 0.5;
    }
  }

  /** Depth = floor y; things on furniture sort just in front of its back and behind its front. */
  private depthOf(world: World, e: Entity, guard = 0): number {
    const a = e.attachment;
    if (!a || guard > 8) return e.pos.y;
    const parentId = 'on' in a ? a.on : a.by;
    const parent = world.entities[parentId];
    if (!parent) return e.pos.y;
    const base = this.depthOf(world, parent, guard + 1);
    if (a.kind === 'seated') return base + 0.2 + a.slot * 0.01;
    if (a.kind === 'resting') return base + 0.3;
    return base + 0.01;
  }

  // --- Reactions ----------------------------------------------------------------

  /** Show a face on a character for a moment, then relax back to neutral. */
  showExpression(id: EntityId, expression: Expression, ms = REACTION_MS): void {
    if (this.views.get(id) instanceof CharacterView) this.reactions.set(id, { expression, until: this.elapsed + ms });
  }

  /** Faces that follow from what just happened (e.g. delight on sitting down). */
  private react(world: World, ev: WorldEvent): void {
    const set = (id: EntityId, expression: Expression) => this.showExpression(id, expression);
    switch (ev.type) {
      case 'sat':
        set(ev.id, 'happy');
        break;
      case 'picked-up':
        set(ev.by, 'happy');
        break;
      case 'wore':
        set(ev.by, 'happy');
        break;
      case 'transformed':
      case 'reverted':
        for (const e of Object.values(world.entities)) if (LOOK_OF_TYPE[e.type]) set(e.id, 'surprised');
        break;
    }
  }

  /** The view for an entity, for other presentation code (e.g. boat actions) to animate. */
  viewOf(id: EntityId): EntityView | undefined {
    return this.views.get(id);
  }

  // --- Boat motion hooks (presentation only; the world never changes) ---------------

  /**
   * Lean an anchor (the sofa/boat) around its base, carrying everyone seated or resting
   * on it. Held and worn items follow their holders automatically.
   */
  setAnchorTilt(id: EntityId, radians: number): void {
    if (radians === 0) this.tilts.delete(id);
    else this.tilts.set(id, radians);
    if (this.world) {
      for (const e of Object.values(this.world.entities)) this.place(this.world, e);
      this.applyTilts();
      this.applyDrag();
    }
  }

  /** Raise or lower the boat's sail, 0…1, for animating between its saved states. */
  setSailAmount(anchorId: EntityId, amount: number): void {
    const view = this.views.get(anchorId);
    if (view instanceof SofaView) view.setSailAmount(amount);
  }

  /** How fast the sea drifts past, world units per second (0 = calm). */
  setSeaSpeed(unitsPerSecond: number): void {
    this.seaSpeed = this.reducedMotion ? 0 : unitsPerSecond;
  }

  private applyTilts(): void {
    const world = this.world;
    if (!world) return;
    for (const [anchorId, angle] of this.tilts) {
      const anchor = this.views.get(anchorId);
      if (!(anchor instanceof SofaView)) continue;
      anchor.setTilt(angle);
      const base = anchor.root.position;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      for (const e of Object.values(world.entities)) {
        const a = e.attachment;
        if (!a || !(a.kind === 'seated' || a.kind === 'resting') || a.on !== anchorId) continue;
        if (this.drag?.id === e.id) continue;
        const view = this.views.get(e.id);
        if (!view) continue;
        const dx = view.root.x - base.x;
        const dy = view.root.y - base.y;
        view.root.position.set(base.x + dx * cos - dy * sin, base.y + dx * sin + dy * cos);
        view.root.rotation = angle;
      }
    }
    // Untilted sofas stand straight again.
    for (const view of this.views.values()) {
      if (view instanceof SofaView && !this.tilts.has(view.id)) view.setTilt(0);
    }
  }

  // --- Dragging -------------------------------------------------------------------

  /** Show `id` lifted under the finger at `pos` (world units), or clear with null. Never changes the world. */
  setDragPreview(id: EntityId | null, pos?: PointData): void {
    this.drag = id && pos ? { id, pos: { x: pos.x, y: pos.y } } : null;
    if (this.world) {
      // Re-place everything so a previously dragged entity returns to its world slot.
      for (const e of Object.values(this.world.entities)) this.place(this.world, e);
      this.applyTilts();
    }
    this.applyDrag();
  }

  private applyDrag(): void {
    if (!this.drag) return;
    const view = this.views.get(this.drag.id);
    if (!view) return;
    if (view.root.parent !== this.entities) this.entities.addChild(view.root);
    view.root.position.set(this.drag.pos.x, this.drag.pos.y);
    view.root.zIndex = 100000;
    view.root.scale.set(1.08);
    for (const layer of view.extraLayers) {
      layer.position.copyFrom(view.root.position);
      layer.zIndex = 100000.5;
    }
    if (view instanceof CharacterView) {
      view.setPose('stand');
      view.setExpression('surprised');
    }
    if (view instanceof PropView) view.setOnFloor(false);
  }

  // --- Geometry queries (world units) ---------------------------------------------

  /** Visual bounds of an entity in world units, including anything it carries. */
  boundsOf(id: EntityId): Rectangle | null {
    const view = this.views.get(id);
    if (!view) return null;
    const b = view.root.getBounds();
    const tl = this.stage.toLocal({ x: b.x, y: b.y });
    const br = this.stage.toLocal({ x: b.x + b.width, y: b.y + b.height });
    return new Rectangle(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
  }

  /**
   * The point a drag starts from, in world units. Characters always use their standing
   * feet point (a seated character's hips are lifted by its leg length), items their base.
   */
  dragOriginOf(id: EntityId): PointData | null {
    const view = this.views.get(id);
    if (!view) return null;
    const p = this.stage.toLocal(view.root.getGlobalPosition());
    if (view instanceof CharacterView && view.currentPose === 'sit') {
      const g = view.geometry;
      return { x: p.x, y: p.y + (g.height - g.hipY) };
    }
    return p;
  }

  /** Where a character's hand or head currently is, in world units. */
  anchorOf(id: EntityId, which: 'hand' | 'head'): PointData | null {
    const view = this.views.get(id);
    if (!(view instanceof CharacterView)) return null;
    const slot = which === 'hand' ? view.handSlot : view.headSlot;
    return this.stage.toLocal(slot.getGlobalPosition());
  }

  // --- Animation --------------------------------------------------------------------

  private tick(dt: number): void {
    this.elapsed += dt;
    const world = this.world;
    if (!world) return;

    const target = world.scene === 'sea' ? 1 : 0;
    const step = this.reducedMotion ? 1 : dt / FADE_MS;
    const a = this.seaLayer.alpha;
    this.seaLayer.alpha = a < target ? Math.min(target, a + step) : Math.max(target, a - step);
    if (this.seaSpeed) this.water.tilePosition.x -= (this.seaSpeed * dt) / 1000;

    // Ease the camera toward its framing (e.g. zooming out a little when a toy is put near the edge).
    // Hold still while a toy is under the finger, so it doesn't slide away from it.
    const cam = this.camera;
    const goal = this.cameraTarget;
    if (cam && goal && cam !== goal && !this.drag) {
      const close = Math.abs(cam.scale - goal.scale) < 1e-4 && Math.abs(cam.x - goal.x) < 0.5 && Math.abs(cam.y - goal.y) < 0.5;
      this.camera = close ? goal : ease(cam, goal, 1 - Math.exp(-dt / CAMERA_EASE_MS));
      this.applyCamera();
    }

    for (const view of this.views.values()) {
      if (!(view instanceof CharacterView)) continue;
      const r = this.reactions.get(view.id);
      const dragged = this.drag?.id === view.id;
      if (!dragged) {
        if (r && r.until > this.elapsed) view.setExpression(r.expression);
        else {
          this.reactions.delete(view.id);
          view.setExpression('neutral');
        }
      }
      // A gentle breath keeps the family feeling alive without moving anything the child placed.
      if (!this.reducedMotion) {
        const phase = this.elapsed / 900 + view.id.length;
        view.body.scale.y = 1 + Math.sin(phase) * 0.008;
      }
    }
  }
}

/** Solid colour above and below the horizon, so letterbox margins continue the scene. */
function fill(top: string, bottom: string): Graphics {
  const g = new Graphics();
  g.rect(-4000, -4000, 9600, 4000 + HORIZON_Y).fill(top);
  g.rect(-4000, HORIZON_Y, 9600, 4000).fill(bottom);
  return g;
}
