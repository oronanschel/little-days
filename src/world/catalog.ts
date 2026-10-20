import type { SceneId, Vec2 } from './types';

/** Affordances of an entity type. Content, not code: add types here. */
export interface TypeDef {
  character?: true;
  /** Can be picked up and carried in a character's hand. */
  carriable?: true;
  /** Can be worn on a character's head. */
  wearable?: true;
  /** Seat slots, as offsets from the furniture's position. */
  seats?: Vec2[];
  /** Items can rest on it (e.g. a snack on the sofa) and travel with it. */
  surface?: true;
  /** Where a held item sits relative to the character. */
  handOffset?: Vec2;
  /** Where a worn item sits relative to the character. */
  headOffset?: Vec2;
}

// Positions are the feet/base anchor (bottom-centre) of each entity; depth = y.
// Offsets are shared with the renderer, which reads them instead of hardcoding.
export const CATALOG: Record<string, TypeDef> = {
  'character-grown': { character: true, handOffset: { x: 50, y: -230 }, headOffset: { x: 0, y: -330 } },
  'character-kid': { character: true, handOffset: { x: 40, y: -150 }, headOffset: { x: 0, y: -230 } },
  sofa: {
    seats: [
      { x: -160, y: -90 },
      { x: 0, y: -90 },
      { x: 160, y: -90 },
    ],
    surface: true,
  },
  'side-table': { surface: true },
  snack: { carriable: true },
  'captain-hat': { carriable: true, wearable: true },
};

export interface TransformationDef {
  id: string;
  /** Entity type that can carry this transformation. */
  anchorType: string;
  /** Imagined role of the anchor while transformed. */
  role: string;
  scene: SceneId;
  /** Actions only available while transformed. */
  actions: string[];
}

export const TRANSFORMATIONS: Record<string, TransformationDef> = {
  'sofa-boat': {
    id: 'sofa-boat',
    anchorType: 'sofa',
    role: 'boat',
    scene: 'sea',
    // rock: momentary sway; sail: toggles raised sail (kept in anchor state);
    // fish: cast a line; wave: occupants wave at a passing creature.
    actions: ['rock', 'sail', 'fish', 'wave'],
  },
};

export function typeDef(type: string): TypeDef {
  return CATALOG[type] ?? {};
}
