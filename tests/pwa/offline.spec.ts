import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';

const contentTypes: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png',
};

async function builtFiles(directory = path.resolve('dist'), prefix = ''): Promise<Map<string, Buffer>> {
  const result = new Map<string, Buffer>();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const key = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      for (const [name, data] of await builtFiles(path.join(directory, entry.name), `${key}/`)) result.set(name, data);
    } else result.set(key, await readFile(path.join(directory, entry.name)));
  }
  return result;
}

async function serve(base: string) {
  const files = await builtFiles();
  const requests: string[] = [];
  const server = createServer((request, response) => {
    const pathname = new URL(request.url!, 'http://localhost').pathname;
    requests.push(pathname);
    const key = pathname.startsWith(base) ? decodeURIComponent(pathname.slice(base.length)) || 'index.html' : '';
    const body = files.get(key);
    response.writeHead(body ? 200 : 404, {
      'Content-Type': contentTypes[path.extname(key)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(body || 'Missing');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test server address');
  return { files, requests, server, url: `http://127.0.0.1:${address.port}${base}` };
}

async function close(server: Server) {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

function changeRelease(files: Map<string, Buffer>, missingAsset = false) {
  const worker = files.get('sw.js')!.toString()
    .replace(/const VERSION = "([a-f0-9]+)";/, 'const VERSION = "$1-next";')
    .replace('const FILES = [', `const FILES = [${missingAsset ? '"missing-asset.js",' : ''}`);
  files.set('sw.js', Buffer.from(worker));
  files.set('index.html', Buffer.from(files.get('index.html')!.toString().replace('<title>Little Days</title>', '<title>Little Days next</title>')));
}

for (const base of ['/', '/little-days/']) {
  test(`production reloads offline under ${base}`, async ({ page, context }) => {
    const host = await serve(base);
    try {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(host.url);
      await expect(page.locator('canvas')).toBeVisible();
      await page.evaluate(() => navigator.serviceWorker.ready);
      await context.setOffline(true);
      await page.reload();
      await expect(page.locator('canvas')).toBeVisible();
      expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
      const manifest = await page.evaluate(async () => (await fetch('manifest.webmanifest')).json());
      expect(manifest.display).toBe('standalone');
      for (const icon of manifest.icons) {
        expect(await page.evaluate(async (url) => (await fetch(url)).ok, icon.src)).toBe(true);
      }
      expect(errors).toEqual([]);
    } finally {
      await context.setOffline(false);
      await close(host.server);
    }
  });
}

test('a new release waits for every game tab to close', async ({ page, context }) => {
  const host = await serve('/');
  try {
    await page.goto(host.url);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    const otherTab = await context.newPage();
    await otherTab.goto(host.url);
    changeRelease(host.files);
    await page.evaluate(async () => (await navigator.serviceWorker.ready).update());
    await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.ready).waiting?.state)).toBe('installed');
    await page.reload();
    await expect(page).toHaveTitle('Little Days');
    await page.close();
    await otherTab.reload();
    await expect(otherTab).toHaveTitle('Little Days');
    await otherTab.close();
    const next = await context.newPage();
    await next.goto(host.url);
    await next.evaluate(() => navigator.serviceWorker.ready);
    await expect(next).toHaveTitle('Little Days next');
    await expect.poll(() => next.evaluate(async () => (await caches.keys()).filter((name) => name.startsWith('little-days:')).length)).toBe(1);
    await context.setOffline(true);
    await next.reload();
    await expect(next).toHaveTitle('Little Days next');
    await expect(next.locator('canvas')).toBeVisible();
  } finally {
    await context.setOffline(false);
    await close(host.server);
  }
});

test('a failed update keeps the previous release playable offline', async ({ page, context }) => {
  const host = await serve('/');
  try {
    await page.goto(host.url);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    changeRelease(host.files, true);
    await page.evaluate(async () => (await navigator.serviceWorker.ready).update());
    // Precache requests belong to the worker, not to the page's network events.
    await expect.poll(() => host.requests.includes('/missing-asset.js')).toBe(true);
    await expect.poll(() => page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return !registration.installing && !registration.waiting;
    })).toBe(true);
    expect(await page.evaluate(async () => (await caches.keys()).filter((name) => name.startsWith('little-days:')).length)).toBe(1);
    await context.setOffline(true);
    await page.reload();
    await expect(page).toHaveTitle('Little Days');
    await expect(page.locator('canvas')).toBeVisible();
  } finally {
    await context.setOffline(false);
    await close(host.server);
  }
});

test('development mode never registers a worker', async ({ page }) => {
  const server = await createViteServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' });
  await server.listen();
  try {
    await page.goto(server.resolvedUrls!.local[0]);
    await expect(page.locator('canvas')).toBeVisible();
    expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((items) => items.length))).toBe(0);
  } finally {
    await server.close();
  }
});
