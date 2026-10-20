// World-state types. Pure data: no PixiJS, no DOM. Everything here must survive
// JSON round-trips because it is what we save.
//
// Coordinates are room units: x 0..1600 left→right, y 0..1000 top→bottom, with
// the floor roughly y 600..1000. The presentation layer scales them to the screen.

export type EntityId = string;

export interface Vec2 {
  x: number;
  y: number;
}

/** How an entity is attached to another one. `null` means free on the floor. */
export type Attachment =
  | { kind: 'seated'; on: EntityId; slot: number }
  | { kind: 'held'; by: EntityId }
  | { kind: 'worn'; by: EntityId }
  | { kind: 'resting'; on: EntityId; offset: Vec2 };

export interface Entity {
  id: EntityId;
  /** Key into the catalog (`CATALOG`). */
  type: string;
  /** Free position, or the last free position while attached. */
  pos: Vec2;
  attachment: Attachment | null;
  /** Small per-entity state, e.g. `{ sail: true }` for the boat role. */
  state: Record<string, string | number | boolean>;
}

/** Scene the room is currently imagined as. */
export type SceneId = 'living-room' | 'sea';

export interface ActiveTransformation {
  /** Transformation definition id, e.g. 'sofa-boat'. */
  def: string;
  /** Entity that carries the transformation (the sofa). */
  anchor: EntityId;
}

export interface World {
  version: number;
  scene: SceneId;
  transformation: ActiveTransformation | null;
  /** Insertion order is the stable id order; lookups go through `getEntity`. */
  entities: Record<EntityId, Entity>;
}

/** Refusals are reasons, not errors: the UI can bounce the item back gently. */
export type OpResult =
  | { ok: true; world: World; events: WorldEvent[] }
  | { ok: false; reason: RefusalReason };

export type RefusalReason =
  | 'unknown-entity'
  | 'not-a-character'
  | 'not-carriable'
  | 'not-wearable'
  | 'not-a-seat'
  | 'seat-full'
  | 'no-surface'
  | 'would-cycle'
  | 'no-transformation'
  | 'already-transformed'
  | 'action-unavailable';

/** Things that happened, for the presentation layer to animate or sound. */
export type WorldEvent =
  | { type: 'moved'; id: EntityId }
  | { type: 'sat'; id: EntityId; on: EntityId }
  | { type: 'stood'; id: EntityId }
  | { type: 'picked-up'; id: EntityId; by: EntityId }
  | { type: 'dropped'; id: EntityId }
  | { type: 'wore'; id: EntityId; by: EntityId }
  | { type: 'placed'; id: EntityId; on: EntityId }
  | { type: 'transformed'; def: string; anchor: EntityId }
  | { type: 'reverted'; def: string; anchor: EntityId }
  | { type: 'action'; action: string; anchor: EntityId };
