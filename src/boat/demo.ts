// Dev-only harness for the boat layer (open /boat-demo.html with `npm run dev`).
// Placeholder shapes stand in for the real sofa, characters and sea from #4.
// `?sea` starts at sea; `?t=SECONDS` fast-forwards animations for screenshots.

import { Application, Container, Graphics } from 'pixi.js';
import { createLivingRoom, sit, transform, wear, worldPosition, type OpResult, type World } from '../world';
import { BoatPlay } from './BoatPlay';
import { creaturePose } from './timelines';

const STAGE = { w: 1600, h: 1000 };

async function main() {
  const app = new Application();
  await app.init({ resizeTo: window, background: '#fdf6ec', antialias: true });
  document.body.appendChild(app.canvas);

  let world: World = createLivingRoom();
  const step = (r: OpResult) => {
    if (r.ok) world = r.world;
  };
  step(sit(world, 'grown-up', 'sofa'));
  step(sit(world, 'kid', 'sofa'));
  step(wear(world, 'captain-hat', 'kid'));
  const params = new URLSearchParams(location.search);
  if (params.has('sea')) step(transform(world, 'sofa-boat'));

  const root = new Container();
  app.stage.addChild(root);
  const backdrop = new Graphics();
  const boat = new Container();
  const sofa = new Graphics();
  const sail = new Graphics();
  const people = new Map<string, Graphics>();
  boat.addChild(sail, sofa);
  root.addChild(backdrop);

  let tilt = 0;
  let sailUp = 0;
  const host = {
    world: () => world,
    apply: (op: (w: World) => OpResult) => step(op(world)),
    setBoatTilt: (r: number) => (tilt = r),
    setSail: (p: number) => (sailUp = p),
    setWave: (id: string, a: number) => people.get(id)?.scale.set(1, 1 + 0.15 * a),
  };
  const play = new BoatPlay(host);
  root.addChild(play.behind, boat, play);

  for (const id of ['grown-up', 'kid']) {
    const g = new Graphics()
      .roundRect(-35, id === 'kid' ? -150 : -220, 70, id === 'kid' ? 150 : 220, 30)
      .fill(id === 'kid' ? '#f2785c' : '#7cc6c2');
    people.set(id, g);
    boat.addChild(g);
  }

  function draw() {
    const a = worldPosition(world, 'sofa');
    const sea = world.scene === 'sea';
    backdrop.clear().rect(0, 0, STAGE.w, STAGE.h).fill(sea ? '#bfe3ff' : '#f6e3c8');
    backdrop.rect(0, sea ? 470 : 560, STAGE.w, 1000).fill(sea ? '#4f8fcf' : '#e8c9a0');
    boat.position.set(a.x, a.y);
    boat.rotation = tilt;
    sofa.clear().roundRect(-260, -140, 520, 140, 40).fill(sea ? '#c96f4a' : '#b5654a');
    sail.clear();
    if (sea) {
      sail.rect(-6, -460, 12, 330).fill('#8a5a3b');
      if (sailUp > 0.02) sail.poly([6, -450, 6, -450 + 300 * sailUp, 6 + 200 * sailUp, -150 - 0 * sailUp]).fill('#fdf6ec');
    }
    for (const [id, g] of people) {
      const p = worldPosition(world, id);
      g.position.set(p.x - a.x, p.y - a.y);
    }
  }

  function layout() {
    const s = Math.min(app.screen.width / STAGE.w, app.screen.height / STAGE.h);
    root.scale.set(s);
    root.position.set((app.screen.width - STAGE.w * s) / 2, (app.screen.height - STAGE.h * s) / 2);
  }
  layout();
  window.addEventListener('resize', layout);

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointertap', (e) => play.tap(root.toLocal(e.global)));

  // `pre` seconds of play before the taps in `do`, then `t` seconds after them.
  const advance = (secs: number) => {
    for (let t = 0; t < secs; t += 1 / 60) play.update(1 / 60);
  };
  const pre = Number(params.get('pre') ?? 0);
  advance(pre);
  for (const a of (params.get('do') ?? '').split(',').filter(Boolean)) {
    const at = worldPosition(world, 'sofa');
    const pts: Record<string, { x: number; y: number }> = {
      rock: { x: at.x, y: at.y - 60 },
      sail: { x: at.x, y: at.y - 330 },
      fish: { x: at.x + 350, y: at.y - 190 },
      sparkle: { x: at.x + 250, y: at.y - 250 },
      wave: creaturePose(pre),
      home: { x: 110, y: 110 },
    };
    if (pts[a]) play.tap(pts[a]);
  }
  advance(Number(params.get('t') ?? 0));
  draw();
  const frozen = params.has('freeze'); // hold the frame for screenshots
  app.ticker.add((tk) => {
    if (!frozen) play.update(tk.deltaMS / 1000);
    draw();
  });
}

main();
