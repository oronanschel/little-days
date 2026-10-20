// Local-first save/load. The last good snapshot is kept as a backup so a
// corrupt or half-written save never costs the child their room.

import { WORLD_VERSION, createLivingRoom } from './scene';
import { validate } from './validate';
import type { World } from './types';

/** Minimal storage surface; `window.localStorage` satisfies it, tests pass a Map-backed fake. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const SAVE_KEY = 'little-days/world';
export const BACKUP_KEY = 'little-days/world.backup';

/**
 * Migrations from version N to N+1, keyed by N. Add one whenever WORLD_VERSION
 * goes up; never edit an old migration once a build has shipped.
 */
export const MIGRATIONS: Record<number, (data: any) => any> = {};

export function serialize(world: World): string {
  return JSON.stringify(world);
}

/** Parse and migrate a save. Returns null if it is unreadable or breaks invariants. */
export function deserialize(text: string): World | null {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object' || typeof data.version !== 'number') return null;
  while (data.version < WORLD_VERSION) {
    const step = MIGRATIONS[data.version];
    if (!step) return null;
    data = { ...step(data), version: data.version + 1 };
  }
  if (data.version !== WORLD_VERSION || typeof data.entities !== 'object' || !data.entities) return null;
  const world = data as World;
  return validate(world).length === 0 ? world : null;
}

/** Save; the previous good save becomes the backup. Invalid worlds are never written. */
export function save(store: KeyValueStore, world: World): boolean {
  if (validate(world).length) return false;
  try {
    const prev = store.getItem(SAVE_KEY);
    if (prev && deserialize(prev)) store.setItem(BACKUP_KEY, prev);
    store.setItem(SAVE_KEY, serialize(world));
    return true;
  } catch {
    return false; // quota or private mode: play continues unsaved
  }
}

/** Load the save, else the backup, else a fresh living room. */
export function load(store: KeyValueStore): World {
  for (const key of [SAVE_KEY, BACKUP_KEY]) {
    let text: string | null = null;
    try {
      text = store.getItem(key);
    } catch {
      text = null;
    }
    const world = text ? deserialize(text) : null;
    if (world) return world;
  }
  return createLivingRoom();
}
