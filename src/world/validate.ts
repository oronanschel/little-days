import { CATALOG, TRANSFORMATIONS, typeDef } from './catalog';
import { getEntity, parentOf } from './ops';
import type { Entity, World } from './types';

const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isVec = (v: unknown) => isObj(v) && Number.isFinite(v.x) && Number.isFinite(v.y);
const isId = (v: unknown) => typeof v === 'string' && v.length > 0;

/** Checks the runtime shape of untrusted data (e.g. a save) before any invariant is read. */
function shapeErrors(world: unknown): string[] {
  if (!isObj(world)) return ['world is not an object'];
  if (!isObj(world.entities)) return ['entities is not an object'];
  const errors: string[] = [];
  if (world.scene !== 'living-room' && world.scene !== 'sea') errors.push(`bad scene ${world.scene}`);
  const t = world.transformation;
  if (t !== null && !(isObj(t) && isId(t.def) && isId(t.anchor))) errors.push('bad transformation');
  for (const [key, e] of Object.entries(world.entities)) {
    if (!isObj(e) || !isId(e.id) || typeof e.type !== 'string') {
      errors.push(`${key}: bad entity`);
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(CATALOG, e.type)) errors.push(`${key}: unknown type ${e.type}`);
    if (!isVec(e.pos)) errors.push(`${key}: bad position`);
    if (!isObj(e.state) || !Object.values(e.state).every((v) => ['string', 'number', 'boolean'].includes(typeof v)))
      errors.push(`${key}: bad state`);
    const a = e.attachment;
    if (a === null) continue;
    const good =
      isObj(a) &&
      ((a.kind === 'seated' && isId(a.on) && Number.isInteger(a.slot)) ||
        ((a.kind === 'held' || a.kind === 'worn') && isId(a.by)) ||
        (a.kind === 'resting' && isId(a.on) && isVec(a.offset)));
    if (!good) errors.push(`${key}: bad attachment`);
  }
  return errors;
}

/**
 * Lists broken invariants. An empty list means the world is safe to show and save.
 * Never throws, even for malformed input such as a corrupted save.
 */
export function validate(world: World): string[] {
  const shape = shapeErrors(world);
  if (shape.length) return shape;
  const errors: string[] = [];
  const seats = new Set<string>();
  const hands = new Set<string>();
  const heads = new Set<string>();

  for (const [key, e] of Object.entries(world.entities)) {
    if (key !== e.id) errors.push(`${key}: id mismatch (${e.id})`);
    const a = e.attachment;
    if (!a) continue;
    const pid = parentOf(e)!;
    const parent = getEntity(world, pid);
    if (!parent) {
      errors.push(`${e.id}: attached to missing ${pid}`);
      continue;
    }
    const pdef = typeDef(parent.type);
    if (a.kind === 'seated') {
      if (!typeDef(e.type).character) errors.push(`${e.id}: only characters sit`);
      if (!pdef.seats || a.slot < 0 || a.slot >= pdef.seats.length) errors.push(`${e.id}: bad seat slot ${a.slot}`);
      const k = `${pid}#${a.slot}`;
      if (seats.has(k)) errors.push(`${e.id}: seat ${k} double-booked`);
      seats.add(k);
    } else if (a.kind === 'held' || a.kind === 'worn') {
      if (!pdef.character) errors.push(`${e.id}: ${a.kind} by non-character ${pid}`);
      const set = a.kind === 'held' ? hands : heads;
      if (set.has(pid)) errors.push(`${pid}: more than one ${a.kind} item`);
      set.add(pid);
    } else if (!pdef.surface) {
      errors.push(`${e.id}: resting on non-surface ${pid}`);
    }

    // Cycle check: walking up from e must terminate.
    const seen = new Set<string>([e.id]);
    let cur: Entity | undefined = parent;
    while (cur) {
      if (seen.has(cur.id)) {
        errors.push(`${e.id}: attachment cycle`);
        break;
      }
      seen.add(cur.id);
      const up = parentOf(cur);
      cur = up ? getEntity(world, up) : undefined;
    }
  }

  const t = world.transformation;
  if (t) {
    const def = TRANSFORMATIONS[t.def];
    const anchor = getEntity(world, t.anchor);
    if (!def) errors.push(`unknown transformation ${t.def}`);
    else if (!anchor || anchor.type !== def.anchorType) errors.push(`bad transformation anchor ${t.anchor}`);
    else if (world.scene !== def.scene) errors.push(`scene ${world.scene} does not match ${t.def}`);
  } else if (world.scene !== 'living-room') {
    errors.push(`scene ${world.scene} without a transformation`);
  }
  return errors;
}
