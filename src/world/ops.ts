// Pure world operations. Each takes a world and returns a new one (the input is
// never mutated) or a refusal reason the UI can answer with a gentle bounce.

import { TRANSFORMATIONS, typeDef } from './catalog';
import type { Entity, EntityId, OpResult, RefusalReason, Vec2, World, WorldEvent } from './types';

const ok = (world: World, ...events: WorldEvent[]): OpResult => ({ ok: true, world, events });
const no = (reason: RefusalReason): OpResult => ({ ok: false, reason });

export function getEntity(world: World, id: EntityId): Entity | undefined {
  return Object.prototype.hasOwnProperty.call(world.entities, id) ? world.entities[id] : undefined;
}

export function parentOf(e: Entity): EntityId | null {
  const a = e.attachment;
  if (!a) return null;
  return a.kind === 'held' || a.kind === 'worn' ? a.by : a.on;
}

/** Entities directly attached to `id` (occupants, held/worn items, resting items). */
export function childrenOf(world: World, id: EntityId): Entity[] {
  return Object.values(world.entities).filter((e) => parentOf(e) === id);
}

/** Position on screen-space room units, following the attachment chain. */
export function worldPosition(world: World, id: EntityId): Vec2 {
  const seen = new Set<EntityId>();
  let e = getEntity(world, id);
  let x = 0;
  let y = 0;
  while (e) {
    if (seen.has(e.id)) break; // corrupt cycle: validate() reports it
    seen.add(e.id);
    const a = e.attachment;
    const parent = a ? getEntity(world, parentOf(e)!) : undefined;
    if (!a || !parent) {
      x += e.pos.x;
      y += e.pos.y;
      break;
    }
    const def = typeDef(parent.type);
    const off =
      a.kind === 'seated'
        ? def.seats?.[a.slot]
        : a.kind === 'held'
          ? def.handOffset
          : a.kind === 'worn'
            ? def.headOffset
            : a.offset;
    x += off?.x ?? 0;
    y += off?.y ?? 0;
    e = parent;
  }
  return { x, y };
}

/** True if `ancestor` is `id` or anywhere up `id`'s attachment chain. */
function isWithin(world: World, id: EntityId, ancestor: EntityId): boolean {
  const seen = new Set<EntityId>();
  let cur: EntityId | null = id;
  while (cur && !seen.has(cur)) {
    if (cur === ancestor) return true;
    seen.add(cur);
    const e = getEntity(world, cur);
    cur = e ? parentOf(e) : null;
  }
  return false;
}

function edit(world: World, fn: (w: World) => void): World {
  const next = structuredClone(world);
  fn(next);
  return next;
}

function detachTo(w: World, id: EntityId, pos: Vec2) {
  const e = w.entities[id];
  e.attachment = null;
  e.pos = { x: pos.x, y: pos.y };
}

/** Move anything to a free floor position. Seated characters stand up; held items drop. */
export function moveTo(world: World, id: EntityId, pos: Vec2): OpResult {
  if (!getEntity(world, id)) return no('unknown-entity');
  return ok(
    edit(world, (w) => detachTo(w, id, pos)),
    { type: 'moved', id },
  );
}

/** Seat a character on furniture, in the free slot nearest `near` (or the first free one). */
export function sit(world: World, charId: EntityId, seatId: EntityId, near?: Vec2): OpResult {
  const c = getEntity(world, charId);
  const seat = getEntity(world, seatId);
  if (!c || !seat) return no('unknown-entity');
  if (!typeDef(c.type).character) return no('not-a-character');
  const slots = typeDef(seat.type).seats;
  if (!slots?.length) return no('not-a-seat');
  if (isWithin(world, seatId, charId)) return no('would-cycle');

  const taken = new Set(
    childrenOf(world, seatId)
      .filter((o) => o.id !== charId && o.attachment?.kind === 'seated')
      .map((o) => (o.attachment as { slot: number }).slot),
  );
  const base = worldPosition(world, seatId);
  let best = -1;
  let bestDist = Infinity;
  slots.forEach((s, i) => {
    if (taken.has(i)) return;
    const d = near ? Math.hypot(base.x + s.x - near.x, base.y + s.y - near.y) : i;
    if (d < bestDist) {
      best = i;
      bestDist = d;
    }
  });
  if (best < 0) return no('seat-full');

  return ok(
    edit(world, (w) => {
      w.entities[charId].attachment = { kind: 'seated', on: seatId, slot: best };
    }),
    { type: 'sat', id: charId, on: seatId },
  );
}

/** Stand a character up where they are (or at `pos`). Held and worn items stay with them. */
export function standUp(world: World, charId: EntityId, pos?: Vec2): OpResult {
  const c = getEntity(world, charId);
  if (!c) return no('unknown-entity');
  if (c.attachment?.kind !== 'seated') return ok(world);
  const at = pos ?? worldPosition(world, charId);
  return ok(
    edit(world, (w) => detachTo(w, charId, at)),
    { type: 'stood', id: charId },
  );
}

/** Put an item in a character's hand. A previously held item is set down at their feet. */
export function pickUp(world: World, charId: EntityId, itemId: EntityId): OpResult {
  const c = getEntity(world, charId);
  const item = getEntity(world, itemId);
  if (!c || !item) return no('unknown-entity');
  if (!typeDef(c.type).character) return no('not-a-character');
  if (!typeDef(item.type).carriable) return no('not-carriable');
  if (isWithin(world, charId, itemId)) return no('would-cycle');

  const events: WorldEvent[] = [];
  const next = edit(world, (w) => {
    for (const other of childrenOf(w, charId)) {
      if (other.id !== itemId && other.attachment?.kind === 'held') {
        detachTo(w, other.id, feet(w, charId));
        events.push({ type: 'dropped', id: other.id });
      }
    }
    w.entities[itemId].attachment = { kind: 'held', by: charId };
  });
  events.push({ type: 'picked-up', id: itemId, by: charId });
  return ok(next, ...events);
}

/** Put a wearable on a character. A previously worn item is set down at their feet. */
export function wear(world: World, itemId: EntityId, charId: EntityId): OpResult {
  const c = getEntity(world, charId);
  const item = getEntity(world, itemId);
  if (!c || !item) return no('unknown-entity');
  if (!typeDef(c.type).character) return no('not-a-character');
  if (!typeDef(item.type).wearable) return no('not-wearable');

  const events: WorldEvent[] = [];
  const next = edit(world, (w) => {
    for (const other of childrenOf(w, charId)) {
      if (other.id !== itemId && other.attachment?.kind === 'worn') {
        detachTo(w, other.id, feet(w, charId));
        events.push({ type: 'dropped', id: other.id });
      }
    }
    w.entities[itemId].attachment = { kind: 'worn', by: charId };
  });
  events.push({ type: 'wore', id: itemId, by: charId });
  return ok(next, ...events);
}

/** Rest a carriable item on a surface (e.g. a snack on the sofa) at a world position. */
export function placeOn(world: World, itemId: EntityId, surfaceId: EntityId, at: Vec2): OpResult {
  const item = getEntity(world, itemId);
  const surface = getEntity(world, surfaceId);
  if (!item || !surface) return no('unknown-entity');
  if (!typeDef(item.type).carriable) return no('not-carriable');
  if (!typeDef(surface.type).surface) return no('no-surface');
  if (isWithin(world, surfaceId, itemId)) return no('would-cycle');
  const base = worldPosition(world, surfaceId);
  const offset = { x: at.x - base.x, y: at.y - base.y };
  return ok(
    edit(world, (w) => {
      w.entities[itemId].attachment = { kind: 'resting', on: surfaceId, offset };
    }),
    { type: 'placed', id: itemId, on: surfaceId },
  );
}

function feet(w: World, charId: EntityId): Vec2 {
  const p = worldPosition(w, charId);
  return { x: p.x + 40, y: p.y };
}

// --- Transformation -------------------------------------------------------

/**
 * Imagine an anchor (by default the first matching entity) as something else.
 * Only the scene and the active transformation change: every entity, position
 * and attachment is left exactly as the child arranged it.
 */
export function transform(world: World, defId: string, anchorId?: EntityId): OpResult {
  const def = TRANSFORMATIONS[defId];
  if (!def) return no('no-transformation');
  if (world.transformation) return no('already-transformed');
  const anchor = anchorId
    ? getEntity(world, anchorId)
    : Object.values(world.entities).find((e) => e.type === def.anchorType);
  if (!anchor || anchor.type !== def.anchorType) return no('no-transformation');
  return ok(
    edit(world, (w) => {
      w.transformation = { def: def.id, anchor: anchor.id };
      w.scene = def.scene;
    }),
    { type: 'transformed', def: def.id, anchor: anchor.id },
  );
}

/** Return to the everyday scene. Role state (e.g. the raised sail) is remembered for next time. */
export function revert(world: World): OpResult {
  const t = world.transformation;
  if (!t) return no('no-transformation');
  return ok(
    edit(world, (w) => {
      w.transformation = null;
      w.scene = 'living-room';
    }),
    { type: 'reverted', def: t.def, anchor: t.anchor },
  );
}

/** Actions the transformed anchor offers right now (empty in the everyday scene). */
export function availableActions(world: World): string[] {
  const t = world.transformation;
  return t ? [...(TRANSFORMATIONS[t.def]?.actions ?? [])] : [];
}

/** Role state key on the anchor, namespaced by role so roles never clash. */
export function roleKey(world: World, key: string): string {
  const t = world.transformation;
  return `${t ? TRANSFORMATIONS[t.def].role : 'none'}.${key}`;
}

export function applyAction(world: World, action: string): OpResult {
  const t = world.transformation;
  if (!t || !availableActions(world).includes(action)) return no('action-unavailable');
  const event: WorldEvent = { type: 'action', action, anchor: t.anchor };
  if (action === 'sail') {
    const key = roleKey(world, 'sail');
    return ok(
      edit(world, (w) => {
        const s = w.entities[t.anchor].state;
        s[key] = !s[key];
      }),
      event,
    );
  }
  // rock / fish / wave are momentary: the presentation layer animates the event.
  return ok(world, event);
}
