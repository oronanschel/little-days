import {
  childrenOf, getEntity, moveTo, pickUp, placeOn, sit, typeDef, wear, worldPosition,
  type OpResult, type World,
} from '../world';
import { resolveDrop, type DropTarget } from './drop';
import { clampPoint, type Point, type Rect } from './geometry';

export interface WorldDropTarget extends DropTarget {
  kind: 'seat' | 'hand' | 'head' | 'surface';
  entityId: string;
  slot?: number;
}

export interface WorldDropOptions {
  /** Legal feet/base anchor positions for free placement. */
  floor?: Rect;
  padding?: number;
  /** Local bounds relative to each furniture type's feet/base anchor. */
  surfaceBounds?: Readonly<Record<string, Rect>>;
  /** Renderer pose anchors in world units, especially for seated characters. */
  anchorOf?: (entityId: string, anchor: 'hand' | 'head') => Point | undefined;
}

export const DEFAULT_FLOOR: Readonly<Rect> = { x: 60, y: 600, width: 1480, height: 350 };
export const DEFAULT_SURFACES: Readonly<Record<string, Rect>> = {
  sofa: { x: -248, y: -140, width: 496, height: 40 },
  'side-table': { x: -88, y: -150, width: 176, height: 30 },
};

const centered = (point: Point, width: number, height: number): Rect => ({
  x: point.x - width / 2, y: point.y - height / 2, width, height,
});

/** Build only compatible targets, using current attachment positions in both scenes. */
export function buildDropTargets(world: World, draggedId: string, options: WorldDropOptions = {}): WorldDropTarget[] {
  const dragged = getEntity(world, draggedId);
  if (!dragged) return [];
  const source = typeDef(dragged.type);
  const targets: WorldDropTarget[] = [];
  for (const entity of Object.values(world.entities)) {
    if (entity.id === draggedId) continue;
    const def = typeDef(entity.type);
    const base = worldPosition(world, entity.id);
    const children = childrenOf(world, entity.id).filter(child => child.id !== draggedId);
    const add = (kind: WorldDropTarget['kind'], bounds: Rect, priority = 0, slot?: number) => {
      targets.push({
        id: `${entity.id}:${kind}${slot === undefined ? '' : `:${slot}`}`,
        entityId: entity.id, kind, bounds, priority, slot, padding: options.padding ?? 24,
      });
    };
    if (source.character) {
      def.seats?.forEach((offset, slot) => {
        if (children.some(child => child.attachment?.kind === 'seated' && child.attachment.slot === slot)) return;
        add('seat', centered({ x: base.x + offset.x, y: base.y + offset.y }, 120, 100), 0, slot);
      });
    }
    if (source.carriable && def.character && def.handOffset
      && !children.some(child => child.attachment?.kind === 'held')) {
      const anchor = options.anchorOf?.(entity.id, 'hand')
        ?? { x: base.x + def.handOffset.x, y: base.y + def.handOffset.y };
      add('hand', centered(anchor, 100, 100), 2);
    }
    if (source.wearable && def.character && def.headOffset
      && !children.some(child => child.attachment?.kind === 'worn')) {
      const anchor = options.anchorOf?.(entity.id, 'head')
        ?? { x: base.x + def.headOffset.x, y: base.y + def.headOffset.y };
      add('head', centered(anchor, 120, 90), 3);
    }
    if (source.carriable && def.surface) {
      const local = options.surfaceBounds?.[entity.type] ?? DEFAULT_SURFACES[entity.type];
      if (local) add('surface', { ...local, x: base.x + local.x, y: base.y + local.y });
    }
  }
  return targets;
}

/** Rebuild targets at release, then commit exactly one validated world operation. */
export function applyDrop(world: World, draggedId: string, position: Point, options: WorldDropOptions = {}): OpResult {
  const result = resolveDrop(position, buildDropTargets(world, draggedId, options), options.floor ?? DEFAULT_FLOOR);
  if (result.kind === 'place') return moveTo(world, draggedId, result.position);
  const target = result.target;
  switch (target.kind) {
    case 'seat': {
      // Use the selected slot's centre; a tolerance hit must not snap to another slot.
      const near = { x: target.bounds.x + target.bounds.width / 2, y: target.bounds.y + target.bounds.height / 2 };
      return sit(world, draggedId, target.entityId, near);
    }
    case 'hand': return pickUp(world, target.entityId, draggedId);
    case 'head': return wear(world, draggedId, target.entityId);
    case 'surface': return placeOn(world, draggedId, target.entityId, clampPoint(position, target.bounds));
  }
}
