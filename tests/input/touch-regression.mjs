import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('diagnostics/input', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
let browser;
const results = [];
try {
  await server.listen();
  const address = server.httpServer.address();
  const url = `http://127.0.0.1:${address.port}`;
  for (const viewport of [{width:1280,height:800}, {width:768,height:1024}]) {
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined, headless:true, args:['--single-process'] });
    const page = await browser.newPage({ viewport, hasTouch:true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.waitForFunction(() => window.littleDays);
    const cdp = await page.context().newCDPSession(page);
    const reset = () => page.evaluate(async () => {
      const {createLivingRoom} = await import('/src/world/index.ts');
      const {play} = window.littleDays;
      window.dispatchEvent(new Event('blur'));
      play.commit({ok:true,world:createLivingRoom(),events:[]});
    });
    const geometry = (id, feet) => page.evaluate(({id,feet}) => {
      const {renderer,play} = window.littleDays;
      const view = renderer.viewOf(id);
      const g = view.geometry;
      const local = g ? {x:0,y:-g.height*.45 + view.body.y} : {x:0,y:-20};
      const start = view.root.toGlobal(local);
      const origin = renderer.dragOriginOf(id);
      const to = renderer.stage.toGlobal({x:feet.x + renderer.toWorld(start).x-origin.x,y:feet.y + renderer.toWorld(start).y-origin.y});
      return {start:{x:start.x,y:start.y},end:{x:to.x,y:to.y}};
    }, {id,feet});
    const drag = async (id, feet) => {
      const {start,end} = await geometry(id,feet);
      await page.mouse.move(start.x,start.y);
      await page.mouse.down();
      await page.mouse.move(end.x,end.y,{steps:8});
      await page.mouse.up();
    };
    const check = async (name, run) => {
      try {await reset();await run();results.push({viewport,name,pass:true});}
      catch(error) {results.push({viewport,name,pass:false,error:error.message});}
    };
    await check('offset-preserving free drag',async()=>{
      await drag('kid',{x:1000,y:850});
      const e = await page.evaluate(()=>window.littleDays.play.current.entities.kid);
      assert.equal(e.attachment,null);assert.ok(Math.abs(e.pos.x-1000)<2);assert.ok(Math.abs(e.pos.y-850)<2);
    });
    await check('seat then retrieve child by torso',async()=>{
      const feet = await page.evaluate(()=>{const g=window.littleDays.renderer.viewOf('kid').geometry;return {x:640,y:610+g.height-g.hipY};});
      await drag('kid',feet);
      assert.equal(await page.evaluate(()=>window.littleDays.play.current.entities.kid.attachment?.kind),'seated');
      await drag('kid',{x:1000,y:850});
      const e = await page.evaluate(()=>window.littleDays.play.current.entities.kid);
      assert.equal(e.attachment,null);assert.ok(Math.abs(e.pos.x-1000)<2);
    });
    await check('carried and worn props follow drag preview without changing save',async()=>{
      await page.evaluate(async()=>{
        const {pickUp,wear}=await import('/src/world/index.ts');const {play}=window.littleDays;
        play.commit(pickUp(play.current,'kid','snack'));play.commit(wear(play.current,'captain-hat','kid'));
      });
      const before=await page.evaluate(()=>JSON.stringify(window.littleDays.play.current));
      const {start,end}=await geometry('kid',{x:1000,y:900});
      await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:8});
      const preview=await page.evaluate(()=>{
        const {renderer,play}=window.littleDays;
        const snack=renderer.viewOf('snack').root.getGlobalPosition();const hand=renderer.stage.toGlobal(renderer.anchorOf('kid','hand'));
        return {same:JSON.stringify(play.current),distance:Math.hypot(snack.x-hand.x,snack.y-hand.y),x:renderer.dragOriginOf('kid').x};
      });
      assert.equal(preview.same,before);assert.ok(preview.distance<1);assert.ok(preview.x>900);
      await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.mouse.up();
      assert.equal(await page.evaluate(()=>JSON.stringify(window.littleDays.play.current)),before);
    });
    await check('native touch cancellation restores preview and permits next drag',async()=>{
      const before=await page.evaluate(()=>JSON.stringify(window.littleDays.play.current));
      const {start,end}=await geometry('kid',{x:1000,y:900});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...start}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,...end}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
      assert.equal(await page.evaluate(()=>JSON.stringify(window.littleDays.play.current)),before);
      assert.equal(await page.evaluate(()=>window.littleDays.renderer.drag),null);
      await drag('kid',{x:1000,y:850});
      assert.ok(Math.abs(await page.evaluate(()=>window.littleDays.play.current.entities.kid.pos.x)-1000)<2);
    });
    await check('secondary finger cannot end active character drag',async()=>{
      const {start,end}=await geometry('kid',{x:1000,y:900});
      const other=await geometry('grown-up',{x:420,y:860});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...start}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...start},{id:2,...other.start}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{id:2,...other.start}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,...end}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      const world=await page.evaluate(()=>window.littleDays.play.current);
      assert.ok(Math.abs(world.entities.kid.pos.x-1000)<2);assert.equal(world.entities['grown-up'].pos.x,420);
    });
    for (const id of ['grown-up', 'kid']) {
      for (const grab of [0.8, 0.45, 0.08]) {
        for (const releaseY of [480, 600]) {
          await check(`${id}: grab at ${grab}, release on sofa at y=${releaseY}`, async () => {
            const points = await page.evaluate(({ id, grab, releaseY }) => {
              const { renderer } = window.littleDays;
              const view = renderer.viewOf(id);
              const start = view.root.toGlobal({ x: 0, y: -view.geometry.height * grab });
              const end = renderer.stage.toGlobal({ x: id === 'grown-up' ? 640 : 960, y: releaseY });
              return { start: { x: start.x, y: start.y }, end: { x: end.x, y: end.y } };
            }, { id, grab, releaseY });
            await page.mouse.move(points.start.x, points.start.y);
            await page.mouse.down();
            await page.mouse.move(points.end.x, points.end.y, { steps: 8 });
            await page.mouse.up();
            const attachment = await page.evaluate(id => window.littleDays.play.current.entities[id].attachment, id);
            assert.equal(attachment?.kind, 'seated');
            assert.equal(attachment?.on, 'sofa');
          });
        }
      }
    }
    await check('a snack dropped on a seated tummy is carried, not left on the sofa', async () => {
      const feet = await page.evaluate(() => {
        const g = window.littleDays.renderer.viewOf('grown-up').geometry;
        return { x: 800, y: 610 + g.height - g.hipY };
      });
      await drag('grown-up', feet);
      const tummy = await page.evaluate(() => {
        const {renderer} = window.littleDays;
        const view = renderer.viewOf('grown-up');
        return renderer.toWorld(view.root.toGlobal({x:0, y:-view.geometry.height * 0.45 + view.body.y}));
      });
      await drag('snack', tummy);
      const attachment = await page.evaluate(() => window.littleDays.play.current.entities.snack.attachment);
      assert.equal(attachment?.kind, 'held');
      assert.equal(attachment?.by, 'grown-up');
      await drag('grown-up', {x:1100, y:900});
      assert.equal(await page.evaluate(() => window.littleDays.play.current.entities.snack.attachment?.by), 'grown-up');
    });
    await check('a wallpaper release leaves the child reachable in front of the sofa', async () => {
      const points = await page.evaluate(() => {
        const {renderer} = window.littleDays;
        const view = renderer.viewOf('kid');
        const start = view.root.toGlobal({x:0, y:-view.geometry.height * 0.45});
        const end = renderer.stage.toGlobal({x:800, y:300});
        return {start:{x:start.x,y:start.y},end:{x:end.x,y:end.y}};
      });
      await page.mouse.move(points.start.x, points.start.y);
      await page.mouse.down();
      await page.mouse.move(points.end.x, points.end.y, {steps:8});
      await page.mouse.up();
      const child = await page.evaluate(() => window.littleDays.play.current.entities.kid);
      assert.equal(child.attachment, null);
      assert.ok(child.pos.y > 700, 'Free placement must be in front of sofa depth');
      await drag('kid', {x:1100,y:900});
      assert.ok(Math.abs(await page.evaluate(() => window.littleDays.play.current.entities.kid.pos.x) - 1100) < 2);
    });
    await check('lost pointer capture restores the uncommitted scene', async () => {
      const before = await page.evaluate(() => JSON.stringify(window.littleDays.play.current));
      const {start, end} = await geometry('kid', {x:1000, y:900});
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(end.x, end.y, {steps:8});
      await page.evaluate(() => {
        const {app, play} = window.littleDays;
        app.canvas.releasePointerCapture(play.capturedPointerId);
      });
      await page.mouse.move(end.x + 1, end.y);
      await page.mouse.up();
      assert.equal(await page.evaluate(() => JSON.stringify(window.littleDays.play.current)), before);
      assert.equal(await page.evaluate(() => window.littleDays.renderer.drag), null);
    });
    await check('resize cancels an active preview without committing',async()=>{
      const before=await page.evaluate(()=>JSON.stringify(window.littleDays.play.current));
      const {start,end}=await geometry('kid',{x:1000,y:900});
      await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:8});
      await page.setViewportSize({width:viewport.width-20,height:viewport.height});
      await page.waitForTimeout(150);await page.mouse.up();
      assert.equal(await page.evaluate(()=>JSON.stringify(window.littleDays.play.current)),before);
      assert.equal(await page.evaluate(()=>window.littleDays.renderer.drag),null);
      await page.setViewportSize(viewport);await page.waitForTimeout(150);
    });
    await page.screenshot({path:`diagnostics/input/touch-${viewport.width}x${viewport.height}.png`});
    results.push({viewport,name:'no uncaught browser errors',pass:errors.length===0,errors});
    await browser.close();browser=null;
  }
  await writeFile('diagnostics/input/results.json', JSON.stringify(results, null, 2));
  console.log(`${results.filter(result => result.pass).length}/${results.length} browser checks passed.`);
  for (const result of results.filter(result => !result.pass)) console.error(JSON.stringify(result));
  if(results.some(r=>!r.pass)) process.exitCode=1;
} finally {if(browser)await browser.close();await server.close();}
