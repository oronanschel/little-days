import { Application } from 'pixi.js';
import { createLivingRoom, load, save } from './world';
import { PlayController } from './render/PlayController';
import { SceneRenderer } from './render/SceneRenderer';
import { CharacterView } from './render/views';

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

  // Save after every change the child makes, so the family is where they left it.
  play.onChange = (w) => {
    if (store) save(store, w);
  };

  // A tap on a character gets a friendly wave: feedback without changing the scene.
  play.onTap = (id) => {
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
  (window as unknown as { littleDays: unknown }).littleDays = { app, renderer, play };
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

main();
