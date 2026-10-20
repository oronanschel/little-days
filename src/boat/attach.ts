// Connects BoatPlay to the real scene (#4): layers, ticking, taps and the
// BoatHost hooks, using only the renderer's public API.

import type { Application, FederatedPointerEvent, PointData } from 'pixi.js';
import { getEntity, worldPosition, type EntityId, type World } from '../world';
import type { PlayController } from '../render/PlayController';
import type { SceneRenderer } from '../render/SceneRenderer';
import { CharacterView, SofaView } from '../render/views';
import { BoatPlay, type BoatHost } from './BoatPlay';

const EXPRESSION_MS = 900;
/** zIndex the renderer gives a dragged entity; leave those under the finger alone. */
const DRAGGED_Z = 100000;

export interface BoatAttachment {
  boat: BoatPlay;
  /** Offer a tap on an entity to the boat first. True if the boat used it. */
  tapEntity(id: EntityId): boolean;
}

export function attachBoat(app: Application, renderer: SceneRenderer, play: PlayController): BoatAttachment {
  const anchorId = (w: World) => w.transformation?.anchor ?? 'sofa';
  const sofaView = () => {
    const v = renderer.viewOf(anchorId(play.current));
    return v instanceof SofaView ? v : undefined;
  };

  let tilted = new Set<EntityId>();
  const waving = new Set<EntityId>();

  const host: BoatHost = {
    world: () => play.current,
    apply: (op) => void play.commit(op(play.current)),

    // Rotate the sofa-boat and everything sitting or resting on it around the hull base.
    setBoatTilt(rad) {
      const w = play.current;
      const id = anchorId(w);
      const sofa = sofaView();
      if (rad === 0 && tilted.size === 0 && (!sofa || sofa.root.rotation === 0)) return;
      const a = worldPosition(w, id);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      if (sofa) {
        sofa.root.rotation = rad;
        sofa.front.rotation = rad;
      }
      const now = new Set<EntityId>();
      for (const e of Object.values(w.entities)) {
        const at = e.attachment;
        if (!at || (at.kind !== 'seated' && at.kind !== 'resting') || at.on !== id) continue;
        const view = renderer.viewOf(e.id);
        if (!view || view.root.zIndex >= DRAGGED_Z) continue;
        const p = worldPosition(w, e.id);
        const dx = p.x - a.x;
        const dy = p.y - a.y;
        const x = a.x + dx * cos - dy * sin;
        const y = a.y + dx * sin + dy * cos;
        for (const c of [view.root, ...view.extraLayers]) {
          c.position.set(x, y);
          c.rotation = rad;
        }
        now.add(e.id);
      }
      // Anyone who left the boat mid-rock stands up straight again.
      for (const gone of tilted) {
        if (now.has(gone)) continue;
        const view = renderer.viewOf(gone);
        if (view) for (const c of [view.root, ...view.extraLayers]) c.rotation = 0;
      }
      tilted = rad === 0 ? new Set() : now;
    },

    setSail: (p) => sofaView()?.setSailAmount(p),

    setWave(id, amount) {
      const view = renderer.viewOf(id);
      if (!(view instanceof CharacterView)) return;
      if (amount > 0.25 && !waving.has(id)) {
        waving.add(id);
        view.setArmPose('wave');
      } else if (amount <= 0.25 && waving.has(id)) {
        waving.delete(id);
        const holding = Object.values(play.current.entities).some(
          (o) => o.attachment?.kind === 'held' && o.attachment.by === id,
        );
        view.setArmPose(holding ? 'carry' : 'down');
      }
    },

    setExpression: (id, e) => renderer.showExpression(id, e, EXPRESSION_MS),
  };

  const boat = new BoatPlay(host);
  renderer.backdrop.addChild(boat.behind); // whale on the horizon, behind everything on deck
  renderer.fx.addChild(boat);
  app.ticker.add((t) => boat.update(t.deltaMS / 1000));

  // Where the current touch started, in world units. Captured before Pixi's own
  // listeners so entity taps (which only report an id) can be placed precisely.
  let lastDown: PointData | null = null;
  let usedThisTouch = false;
  window.addEventListener(
    'pointerdown',
    (e) => {
      const r = app.canvas.getBoundingClientRect();
      lastDown = renderer.toWorld({ x: e.clientX - r.left, y: e.clientY - r.top });
      usedThisTouch = false;
    },
    { capture: true },
  );

  const tapAt = (p: PointData | null) => {
    if (!p || usedThisTouch) return false;
    usedThisTouch = boat.tap({ x: p.x, y: p.y });
    return usedThisTouch;
  };

  // Taps on open space (sea, sky, whale, rod, sparkle, home) or on the hull layer.
  app.stage.on('pointertap', (e: FederatedPointerEvent) => {
    const sofa = sofaView();
    if (e.target !== app.stage && e.target !== sofa?.front) return;
    tapAt(renderer.toWorld(e.global));
  });

  return {
    boat,
    // Entity taps arrive here: the sofa (sparkle, mast, hull) and props that happen
    // to sit over a boat target (the side table and snack sit under the rod).
    // Characters keep their own tap reaction (a wave).
    tapEntity(id) {
      const e = getEntity(play.current, id);
      if (!e || renderer.viewOf(id) instanceof CharacterView) return false;
      return tapAt(lastDown);
    },
  };
}
