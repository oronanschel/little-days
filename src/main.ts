import { Application } from 'pixi.js';
import { createLivingRoom, load, save } from './world';
import { PlayController } from './render/PlayController';
import { SceneRenderer } from './render/SceneRenderer';
import { CharacterView } from './render/views';
import { attachBoat } from './boat/attach';
import { DragHint } from './onboarding/DragHint';

async function main() {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: '#fdf6ec',
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
  });
  document.body.appendChild(app.canvas);

  const renderer = await SceneRenderer.create(app);
  const store = safeStorage();
  const world = store ? load(store) : createLivingRoom();
  const play = new PlayController(renderer, world);

  // A first-time, wordless hint: a see-through hand shows dragging someone onto the sofa.
  let ghost: string | null = null;
  const hint = new DragHint(
    play.current,
    store,
    matchMedia('(prefers-reduced-motion: reduce)').matches,
    // The demonstrated character floats along see-through, then goes back where it was.
    (id, feet) => {
      const view = renderer.viewOf(id ?? ghost ?? '');
      ghost = id;
      renderer.setDragPreview(id, feet);
      if (view) view.root.alpha = id ? 0.55 : 1;
    },
  );
  renderer.fx.addChild(hint);
  app.ticker.add((t) => hint.update(t.deltaMS));
  // Any touch hides it, including on toys (whose Pixi events stop propagating).
  app.canvas.addEventListener('pointerdown', () => hint.touched(), { capture: true });

  // Save after every change the child makes, so the family is where they left it.
  play.onChange = (w, events) => {
    if (store) save(store, w);
    hint.changed(w, events);
  };

  // Boat adventure (#8): the invitation sparkle, the way home and the boat interactions.
  const boat = attachBoat(app, renderer, play);

  // A tap on a character gets a friendly wave: feedback without changing the scene.
  play.onTap = (id) => {
    if (boat.tapEntity(id)) return;
    const view = renderer.viewOf(id);
    if (!(view instanceof CharacterView)) return;
    const before = view.currentArmPose;
    view.setArmPose('wave');
    renderer.showExpression(id, 'happy');
    setTimeout(() => {
      if (view.currentArmPose === 'wave') view.setArmPose(before === 'wave' ? 'down' : before);
    }, 900);
  };

  // Handy for development and browser checks; not part of the child-facing UI.
  (window as unknown as { littleDays: unknown }).littleDays = { app, renderer, play, boat: boat.boat };
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

main();
