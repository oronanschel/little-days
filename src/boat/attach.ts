// Connects BoatPlay to the real scene (#4): layers, ticking, taps and the
// BoatHost hooks, using the renderer's public API (including its boat motion hooks).

import type { Application, FederatedPointerEvent, PointData } from 'pixi.js';
import { getEntity, type EntityId, type World } from '../world';
import type { PlayController } from '../render/PlayController';
import type { SceneRenderer } from '../render/SceneRenderer';
import { CharacterView } from '../render/views';
import { BoatPlay, type BoatHost } from './BoatPlay';

const EXPRESSION_MS = 900;

export interface BoatAttachment {
  boat: BoatPlay;
  /** Offer a tap on an entity to the boat first. True if the boat used it. */
  tapEntity(id: EntityId): boolean;
}

export function attachBoat(app: Application, renderer: SceneRenderer, play: PlayController): BoatAttachment {
  const anchorId = (w: World) => w.transformation?.anchor ?? 'sofa';

  let lastTilt = 0;
  const waving = new Set<EntityId>();

  const host: BoatHost = {
    world: () => play.current,
    apply: (op) => void play.commit(op(play.current)),
    setBoatTilt(rad) {
      if (rad === 0 && lastTilt === 0) return; // re-placing every frame at rest is wasted work
      lastTilt = rad;
      renderer.setAnchorTilt(anchorId(play.current), rad);
    },
    setSail: (p) => renderer.setSailAmount(anchorId(play.current), p),
    setSeaSpeed: (v) => renderer.setSeaSpeed(v),
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
  app.ticker.add((t) => {
    boat.setScreenFrame(renderer.visibleWorldRect(), renderer.stage.scale.x);
    boat.update(t.deltaMS / 1000);
  });

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

  // Taps on open space: sea, sky, whale, rod, sparkle, home. Taps on the sofa
  // (including its hull) and props arrive through tapEntity instead.
  app.stage.on('pointertap', (e: FederatedPointerEvent) => {
    if (e.target === app.stage) tapAt(renderer.toWorld(e.global));
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
