import { TRANSFORMATIONS, typeDef } from './catalog';
import { getEntity, parentOf } from './ops';
import type { Entity, World } from './types';

/** Lists broken invariants. An empty list means the world is safe to show and save. */
export function validate(world: World): string[] {
  const errors: string[] = [];
  const seats = new Set<string>();
  const hands = new Set<string>();
  const heads = new Set<string>();

  for (const [key, e] of Object.entries(world.entities)) {
    if (key !== e.id) errors.push(`${key}: id mismatch (${e.id})`);
    if (!Number.isFinite(e.pos?.x) || !Number.isFinite(e.pos?.y)) errors.push(`${e.id}: bad position`);
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
