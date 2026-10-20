import { describe, expect, it } from 'vitest';
import {
  BACKUP_KEY,
  SAVE_KEY,
  applyAction,
  availableActions,
  createLivingRoom,
  deserialize,
  load,
  moveTo,
  pickUp,
  placeOn,
  revert,
  save,
  serialize,
  sit,
  standUp,
  transform,
  validate,
  wear,
  worldPosition,
  type KeyValueStore,
  type OpResult,
  type World,
} from './index';

/** Unwrap a successful op and check invariants after every step. */
function must(r: OpResult): World {
  if (!r.ok) throw new Error(`refused: ${r.reason}`);
  expect(validate(r.world)).toEqual([]);
  return r.world;
}

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

/** Everything the child arranged: ids, attachments and where things are (not scene/role state). */
function arrangement(w: World) {
  return Object.values(w.entities).map((e) => ({ id: e.id, attachment: e.attachment, at: worldPosition(w, e.id) }));
}

describe('living room', () => {
  it('starts valid with two characters, a sofa, a table with a snack and a hat', () => {
    const w = createLivingRoom();
    expect(validate(w)).toEqual([]);
    expect(Object.keys(w.entities).sort()).toEqual(['captain-hat', 'grown-up', 'kid', 'side-table', 'snack', 'sofa']);
  });

  it('seats characters in the nearest free slot and refuses a fourth sitter', () => {
    let w = createLivingRoom();
    const sofa = worldPosition(w, 'sofa');
    w = must(sit(w, 'kid', 'sofa', { x: sofa.x + 200, y: sofa.y }));
    expect(w.entities.kid.attachment).toEqual({ kind: 'seated', on: 'sofa', slot: 2 });
    w = must(sit(w, 'grown-up', 'sofa', { x: sofa.x + 200, y: sofa.y }));
    expect(w.entities['grown-up'].attachment).toEqual({ kind: 'seated', on: 'sofa', slot: 1 });
    // Add two more kids: one takes slot 0, then the sofa is full.
    w = structuredClone(w);
    w.entities.kid2 = { ...structuredClone(w.entities.kid), id: 'kid2', attachment: null };
    w.entities.kid3 = { ...structuredClone(w.entities.kid), id: 'kid3', attachment: null };
    w = must(sit(w, 'kid2', 'sofa'));
    expect(w.entities.kid2.attachment).toEqual({ kind: 'seated', on: 'sofa', slot: 0 });
    expect(sit(w, 'kid3', 'sofa')).toEqual({ ok: false, reason: 'seat-full' });
    expect(sit(w, 'kid', 'sofa').ok).toBe(true); // re-seating yourself is fine
  });

  it('carries items with the character and swaps when hands are full', () => {
    let w = createLivingRoom();
    w = must(pickUp(w, 'kid', 'snack'));
    w = must(moveTo(w, 'kid', { x: 600, y: 900 }));
    const hand = worldPosition(w, 'snack');
    expect(hand.x).toBeGreaterThan(600);
    w = must(pickUp(w, 'kid', 'captain-hat'));
    expect(w.entities.snack.attachment).toBeNull();
    expect(w.entities['captain-hat'].attachment).toEqual({ kind: 'held', by: 'kid' });
  });

  it('refuses nonsense gently', () => {
    const w = createLivingRoom();
    expect(pickUp(w, 'kid', 'sofa')).toEqual({ ok: false, reason: 'not-carriable' });
    expect(pickUp(w, 'snack', 'captain-hat')).toEqual({ ok: false, reason: 'not-a-character' });
    expect(wear(w, 'snack', 'kid')).toEqual({ ok: false, reason: 'not-wearable' });
    expect(sit(w, 'kid', 'snack')).toEqual({ ok: false, reason: 'not-a-seat' });
    expect(placeOn(w, 'snack', 'kid', { x: 0, y: 0 })).toEqual({ ok: false, reason: 'no-surface' });
    expect(moveTo(w, 'ghost', { x: 0, y: 0 })).toEqual({ ok: false, reason: 'unknown-entity' });
  });

  it('never mutates the input world', () => {
    const w = createLivingRoom();
    const before = serialize(w);
    must(sit(w, 'kid', 'sofa'));
    must(transform(w, 'sofa-boat'));
    expect(serialize(w)).toBe(before);
  });

  it('moving the sofa takes its occupants and snack along', () => {
    let w = createLivingRoom();
    w = must(sit(w, 'kid', 'sofa'));
    w = must(placeOn(w, 'snack', 'sofa', { x: 820, y: 700 }));
    const kid0 = worldPosition(w, 'kid');
    const snack0 = worldPosition(w, 'snack');
    w = must(moveTo(w, 'sofa', { x: 900, y: 700 }));
    expect(worldPosition(w, 'kid')).toEqual({ x: kid0.x + 100, y: kid0.y });
    expect(worldPosition(w, 'snack')).toEqual({ x: snack0.x + 100, y: snack0.y });
  });
});

describe('sofa ↔ boat', () => {
  it('north-star round trip keeps every entity and relationship', () => {
    let w = createLivingRoom();
    w = must(sit(w, 'grown-up', 'sofa'));
    w = must(sit(w, 'kid', 'sofa'));
    w = must(placeOn(w, 'snack', 'sofa', { x: 800, y: 700 }));
    w = must(wear(w, 'captain-hat', 'kid'));
    const before = arrangement(w);

    expect(availableActions(w)).toEqual([]);
    w = must(transform(w, 'sofa-boat'));
    expect(w.scene).toBe('sea');
    expect(arrangement(w)).toEqual(before);
    expect(availableActions(w)).toEqual(['rock', 'sail', 'fish', 'wave']);

    for (const a of ['rock', 'sail', 'fish', 'wave']) w = must(applyAction(w, a));
    expect(w.entities.sofa.state['boat.sail']).toBe(true);
    // Ordinary play continues at sea: change seats, eat the snack.
    w = must(standUp(w, 'kid'));
    w = must(sit(w, 'kid', 'sofa'));
    w = must(pickUp(w, 'kid', 'snack'));
    w = must(placeOn(w, 'snack', 'sofa', { x: 800, y: 700 }));

    w = must(revert(w));
    expect(w.scene).toBe('living-room');
    expect(arrangement(w)).toEqual(before);
    expect(applyAction(w, 'rock')).toEqual({ ok: false, reason: 'action-unavailable' });

    // Sail is remembered for the next voyage.
    w = must(transform(w, 'sofa-boat'));
    expect(w.entities.sofa.state['boat.sail']).toBe(true);
  });

  it('is repeatable and refuses double transforms', () => {
    let w = createLivingRoom();
    const before = serialize(w);
    for (let i = 0; i < 5; i++) {
      w = must(transform(w, 'sofa-boat'));
      expect(transform(w, 'sofa-boat')).toEqual({ ok: false, reason: 'already-transformed' });
      w = must(revert(w));
    }
    expect(serialize(w)).toBe(before);
    expect(revert(w)).toEqual({ ok: false, reason: 'no-transformation' });
  });
});

describe('persistence', () => {
  it('round-trips through storage, including while transformed', () => {
    const store = memoryStore();
    let w = must(sit(createLivingRoom(), 'kid', 'sofa'));
    w = must(transform(w, 'sofa-boat'));
    expect(save(store, w)).toBe(true);
    expect(load(store)).toEqual(w);
  });

  it('falls back to the backup, then to a fresh room', () => {
    const store = memoryStore();
    const first = must(sit(createLivingRoom(), 'kid', 'sofa'));
    save(store, first);
    save(store, must(pickUp(first, 'grown-up', 'snack')));
    store.data.set(SAVE_KEY, '{"version":1,"entities":'); // torn write
    expect(load(store)).toEqual(first);
    store.data.set(BACKUP_KEY, 'garbage');
    expect(load(store)).toEqual(createLivingRoom());
  });

  it('rejects saves that break invariants or come from the future', () => {
    const w = createLivingRoom();
    const bad = structuredClone(w);
    bad.entities.snack.attachment = { kind: 'held', by: 'nobody' };
    expect(deserialize(serialize(bad))).toBeNull();
    expect(save(memoryStore(), bad)).toBe(false);
    expect(deserialize(JSON.stringify({ ...w, version: 99 }))).toBeNull();
  });
});

describe('validate', () => {
  it('detects cycles and double-booked seats', () => {
    const w = createLivingRoom();
    w.entities.kid.attachment = { kind: 'held', by: 'grown-up' };
    w.entities['grown-up'].attachment = { kind: 'held', by: 'kid' };
    expect(validate(w).some((e) => e.includes('cycle'))).toBe(true);

    const s = createLivingRoom();
    s.entities.kid.attachment = { kind: 'seated', on: 'sofa', slot: 1 };
    s.entities['grown-up'].attachment = { kind: 'seated', on: 'sofa', slot: 1 };
    expect(validate(s).some((e) => e.includes('double-booked'))).toBe(true);
  });
});
