import type { FederatedPointerEvent } from 'pixi.js';
import {
  applyDrop,
  buildDropTargets,
  DragGesture,
  resolveDrop,
  seatAtPointer,
  type Point,
  type WorldDropOptions,
} from '../interactions';
import { getEntity, sit, typeDef, type EntityId, type OpResult, type World, type WorldEvent } from '../world';
import type { SceneRenderer } from './SceneRenderer';
import { CharacterView } from './views';

/** Screen pixels a finger may wobble before a touch becomes a drag. */
const DRAG_THRESHOLD_PX = 10;

/**
 * Connects touch input to the world: drag previews go to the renderer only, and a drop
 * commits exactly one world operation. Refused drops simply redraw the unchanged world,
 * which returns the toy to where it was.
 */
export class PlayController {
  private gesture: DragGesture;
  private world: World;
  private capturedPointerId: number | null = null;
  /** Called after every committed change, e.g. to save. */
  onChange?: (world: World, events: WorldEvent[]) => void;
  /** Called on a tap (no drag), for authored reactions. */
  onTap?: (id: EntityId) => void;

  constructor(
    private readonly renderer: SceneRenderer,
    world: World,
  ) {
    this.world = world;
    this.gesture = new DragGesture(DRAG_THRESHOLD_PX / renderer.stage.scale.x);
    renderer.sync(world);
    renderer.onEntityPointerDown = (id, e) => this.down(id, e);

    const stage = renderer.app.stage;
    stage.eventMode = 'static';
    stage.hitArea = renderer.app.screen;
    stage.on('globalpointermove', (e) => this.move(e));
    stage.on('pointerup', (e) => this.up(e));
    stage.on('pointerupoutside', (e) => this.up(e));
    stage.on('pointercancel', (e) => this.cancel(e.pointerId));
    // Pixi's event boundary does not map native pointercancel. Listen on the
    // canvas too, so OS gestures cannot strand a lifted toy or its active pointer.
    renderer.app.canvas.addEventListener('pointercancel', (e) => this.cancel(e.pointerId));
    renderer.app.canvas.addEventListener('lostpointercapture', (e) => this.cancel(e.pointerId));
    window.addEventListener('blur', () => this.cancel());
    renderer.app.renderer.on('resize', () => {
      this.cancel();
      this.gesture = new DragGesture(DRAG_THRESHOLD_PX / renderer.stage.scale.x);
    });
  }

  get current(): World {
    return this.world;
  }

  /** Apply a world operation from elsewhere (e.g. a transformation affordance). */
  commit(result: OpResult): boolean {
    if (!result.ok) {
      this.renderer.sync(this.world);
      return false;
    }
    this.world = result.world;
    this.renderer.sync(this.world, result.events);
    this.onChange?.(this.world, result.events);
    return true;
  }

  private options(): WorldDropOptions {
    return {
      anchorOf: (id, which) => this.renderer.anchorOf(id, which) ?? undefined,
      characterBounds: (id) => this.renderer.boundsOf(id) ?? undefined,
    };
  }

  /**
   * Gesture positions for characters are always the *standing* feet point, so a seated
   * character lifted off the sofa doesn't jump. Items use their visual base anchor.
   */
  private originOf(id: EntityId): Point {
    return this.renderer.dragOriginOf(id) ?? { x: 0, y: 0 };
  }

  private down(id: EntityId, e: FederatedPointerEvent): void {
    if (this.gesture.entityId !== null) return;
    const entity = getEntity(this.world, id);
    if (!entity) return;
    const def = typeDef(entity.type);
    // Furniture stays put in the slice; a touch on it is still a tap for reactions.
    const draggable = def.character || def.carriable;
    const p = this.renderer.toWorld(e.global);
    if (!draggable) {
      this.onTap?.(id);
      return;
    }
    if (this.gesture.begin(e.pointerId, p, id, this.originOf(id))
      && typeof PointerEvent !== 'undefined' && e.nativeEvent instanceof PointerEvent) {
      this.renderer.app.canvas.setPointerCapture(e.pointerId);
      this.capturedPointerId = e.pointerId;
    }
  }

  private move(e: FederatedPointerEvent): void {
    const preview = this.gesture.move(e.pointerId, this.renderer.toWorld(e.global));
    if (preview?.dragging) this.renderer.setDragPreview(preview.entityId, preview.position);
  }

  private up(e: FederatedPointerEvent): void {
    const pointer = this.renderer.toWorld(e.global);
    const end = this.gesture.end(e.pointerId, pointer);
    if (!end) return;
    this.releasePointer();
    this.renderer.setDragPreview(null);
    if (end.kind === 'tap') {
      this.onTap?.(end.entityId);
      return;
    }
    this.commit(this.drop(end.entityId, end.position, pointer));
  }

  private drop(id: EntityId, feet: Point, pointer: Point): OpResult {
    const view = this.renderer.viewOf(id);
    if (view instanceof CharacterView) {
      const seat = seatAtPointer(this.world, id, pointer, this.options());
      if (seat) {
        const b = seat.bounds;
        return sit(this.world, id, seat.entityId, { x: b.x + b.width / 2, y: b.y + b.height / 2 });
      }
      // Seats are matched at the hips: where the child sees the character's bottom land.
      const g = view.geometry;
      const hips = { x: feet.x, y: feet.y - (g.height - g.hipY) };
      const seats = buildDropTargets(this.world, id, this.options()).filter((t) => t.kind === 'seat');
      const hit = resolveDrop(hips, seats, { x: hips.x, y: hips.y, width: 0, height: 0 });
      if (hit.kind === 'target') {
        const b = hit.target.bounds;
        return sit(this.world, id, hit.target.entityId, { x: b.x + b.width / 2, y: b.y + b.height / 2 });
      }
    }
    return applyDrop(this.world, id, feet, this.options());
  }

  private cancel(pointerId?: number): void {
    if (this.gesture.cancel(pointerId)) {
      this.releasePointer();
      this.renderer.setDragPreview(null);
    }
  }

  private releasePointer(): void {
    const id = this.capturedPointerId;
    this.capturedPointerId = null;
    const canvas = this.renderer.app.canvas;
    if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  }
}
