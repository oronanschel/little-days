import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

await mkdir('diagnostics/offline-scene', { recursive: true });
const root = path.resolve('dist');
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    const mime = {'.html':'text/html','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
    response.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'}).end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ channel:process.env.PLAYWRIGHT_CHANNEL || undefined, args:['--single-process'] });
try {
  const context = await browser.newContext({viewport:{width:1280,height:800}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror',error => errors.push(error.message));
  async function ready(){await page.waitForFunction(() => !!window.littleDays);}
  async function clickWorld(x,y){
    const point=await page.evaluate(({x,y}) => {
      const p=window.littleDays.renderer.stage.toGlobal({x,y});
      const b=window.littleDays.app.canvas.getBoundingClientRect();
      return {x:p.x+b.left,y:p.y+b.top};
    },{x,y});
    await page.mouse.click(point.x,point.y);
  }
  async function observe(){await page.evaluate(() => {
    window.testEvents=[];
    const play=window.littleDays.play;
    const save=play.onChange;
    play.onChange=(world,events)=>{save?.(world,events);window.testEvents.push(...events);};
  });}
  await page.goto(url); await ready();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.evaluate(() => {
    const {play}=window.littleDays;
    const world=structuredClone(play.current);
    world.entities['grown-up'].attachment={kind:'seated',on:'sofa',slot:0};
    world.entities.kid.attachment={kind:'seated',on:'sofa',slot:2};
    world.entities.snack.attachment={kind:'held',by:'kid'};
    world.entities['captain-hat'].attachment={kind:'worn',by:'kid'};
    play.commit({ok:true,world,events:[]});
  });
  await context.setOffline(true);
  await clickWorld(1050,450);
  await page.waitForFunction(() => window.littleDays.play.current.scene==='sea');
  const boatBefore=await page.evaluate(() => JSON.stringify(window.littleDays.play.current));
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => JSON.stringify(window.littleDays.play.current)),boatBefore);
  await observe();
  await clickWorld(730,260);
  await page.waitForFunction(() => !!window.littleDays.play.current.entities.sofa.state['boat.sail']);
  await clickWorld(800,700);
  await page.waitForFunction(() => window.testEvents.some(e => e.type==='action'&&e.action==='rock'));
  await page.waitForFunction(() => Math.abs(window.littleDays.renderer.viewOf('sofa').root.rotation)>.005);
  await clickWorld(410,465);
  await page.waitForFunction(() => window.testEvents.some(e => e.type==='action'&&e.action==='fish'));
  const whale=await page.evaluate(() => {const p=window.littleDays.boat.whale.position; return {x:p.x,y:p.y};});
  await clickWorld(whale.x,whale.y);
  await page.waitForFunction(() => window.testEvents.some(e => e.type==='action'&&e.action==='wave'));
  await page.waitForTimeout(900);
  await page.screenshot({path:'diagnostics/offline-scene/boat.png'});
  const afterActions=await page.evaluate(() => JSON.stringify(window.littleDays.play.current));
  const actions=await page.evaluate(() => window.testEvents.filter(e=>e.type==='action').map(e=>e.action));
  assert.deepEqual([...new Set(actions)].sort(),['fish','rock','sail','wave']);
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => JSON.stringify(window.littleDays.play.current)),afterActions);
  await clickWorld(110,110);
  await page.waitForFunction(() => window.littleDays.play.current.scene==='living-room');
  const room=await page.evaluate(() => JSON.stringify(window.littleDays.play.current));
  assert.deepEqual(JSON.parse(room).entities,JSON.parse(afterActions).entities);
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => JSON.stringify(window.littleDays.play.current)),room);
  await page.screenshot({path:'diagnostics/offline-scene/living-room.png'});
  await page.evaluate(expected => {
    localStorage.setItem('little-days/world.backup', expected);
    localStorage.setItem('little-days/world',JSON.stringify({version:1,scene:'living-room',transformation:null,entities:{kid:null}}));
  },room);
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => JSON.stringify(window.littleDays.play.current)),room);
  assert.deepEqual(errors,[]);
  console.log('PASS: offline sparkle entry, boat reload, real sail/rock/fish/whale taps, reload with raised sail, home return and room reload.');
  console.log('PASS: saved entities and attachments survive home return and backup recovery; no uncaught page errors.');
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
