import type { Entity, World } from './types';

export const WORLD_VERSION = 1;

function entity(id: string, type: string, x: number, y: number): Entity {
  return { id, type, pos: { x, y }, attachment: null, state: {} };
}

/** The vertical-slice living room: sofa, side table with a snack, two family members, a captain's hat. */
export function createLivingRoom(): World {
  const snack = entity('snack', 'snack', 1180, 570);
  snack.attachment = { kind: 'resting', on: 'side-table', offset: { x: 0, y: -150 } };
  const list = [
    entity('sofa', 'sofa', 800, 700),
    entity('side-table', 'side-table', 1180, 720),
    entity('grown-up', 'character-grown', 420, 860),
    entity('kid', 'character-kid', 560, 880),
    snack,
    entity('captain-hat', 'captain-hat', 1050, 900),
  ];
  return {
    version: WORLD_VERSION,
    scene: 'living-room',
    transformation: null,
    entities: Object.fromEntries(list.map((e) => [e.id, e])),
  };
}
