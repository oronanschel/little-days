import { Application, Graphics } from 'pixi.js';

// Placeholder living room: one draggable toy to prove touch drag-and-drop works.
async function main() {
  const app = new Application();
  await app.init({ resizeTo: window, background: '#fdf6ec', antialias: true });
  document.body.appendChild(app.canvas);

  const floor = new Graphics().rect(0, 0, 1, 1).fill('#e8c9a0');
  app.stage.addChild(floor);

  const toy = new Graphics().circle(0, 0, 48).fill('#f2785c');
  toy.eventMode = 'static';
  toy.cursor = 'grab';
  app.stage.addChild(toy);

  function layout() {
    const { width, height } = app.screen;
    floor.position.set(0, height * 0.65);
    floor.scale.set(width, height * 0.35);
    toy.position.set(width / 2, height * 0.75);
  }
  layout();
  window.addEventListener('resize', layout);

  let dragging = false;
  toy.on('pointerdown', () => {
    dragging = true;
    toy.scale.set(1.1);
  });
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointermove', (e) => {
    if (dragging) toy.position.copyFrom(e.global);
  });
  app.stage.on('pointerup', () => {
    dragging = false;
    toy.scale.set(1);
  });
  app.stage.on('pointerupoutside', () => {
    dragging = false;
    toy.scale.set(1);
  });
}

main();
