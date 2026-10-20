# Offline play and installation

Little Days caches its production app and bundled assets after the first successful
online visit. Development mode (`npm run dev`) does not install a service worker.
The current game prototype is still a work in progress; offline support does not
implement scene persistence, which belongs to the world-state layer.

## Build and host

```sh
npm ci
npm run build
npm run preview
```

Host the **whole `dist/` folder** over HTTPS (localhost works for development),
including `sw.js`, `manifest.webmanifest`, icons, and every asset. The relative
Vite base lets the same output work at `/` or a subfolder such as `/little-days/`.
Use a trailing slash for the app directory; redirect `/little-days` to
`/little-days/` on the host. No deployment is included in this change.

Configure the host to revalidate `sw.js` and `index.html` (for example,
`Cache-Control: no-cache`). Hashed `assets/` files can have a long immutable cache
lifetime. Serve JavaScript and manifest files with their correct content types.
Do not rewrite missing static assets to the HTML app shell.

After the first page finishes loading, the worker downloads all production files.
Offline readiness requires that download to succeed; closing the page or losing
the network before installation finishes may leave it unavailable offline. There
is no install prompt or reading requirement in child-facing play. Installation
uses the browser's own install or Add to Home Screen controls. The manifest has
192px and 512px PNGs, a scalable maskable icon, and an Apple touch icon. Actual
installation and storage retention still need testing on target iPads and Android
tablets; browser storage can be cleared or evicted by the device.

## Updates and recovery

Each build gets a content-derived cache version covering all production files and
the worker logic. An update is installed completely before becoming eligible to
activate. It waits while **any game tab/window is open**. Close all game windows
and reopen to use the update; reloading one tab while another remains open keeps
the previous release. The app never forces a reload during play.

A failed update leaves the previous release available offline. Activation removes
only old Little Days caches for this installation scope. The worker caches bundled
files only; it does not collect gameplay, send analytics, or cache external URLs.
Clearing the site's stored data removes the offline files and may also remove game
saves; this is a browser maintenance action, not a child-facing game control.

## Browser checks

The browser test tools require Node.js 20 or later.

```sh
npx playwright install chromium
npm run test:pwa
```

To use an already installed Chrome instead, set `PLAYWRIGHT_CHANNEL=chrome`.
The tests run local HTTP servers in the test process and check:

- Fresh production load and offline reload at root and subfolder URLs, including icons.
- A waiting update across two open game tabs, activation after both close, and removal of the old cache.
- A missing asset during update, followed by a working offline reload of the previous release.
- Development mode leaving service-worker registration untouched.

On a target tablet, open the hosted app online, allow installation to finish, close
and reopen it in airplane mode, and try the same from its home-screen icon. Also
check a new release with two game windows open before closing both. These device
checks are still required; Chromium automation does not prove iPad behavior.

The SVG icon is original project artwork. Regenerate the checked-in PNGs after
editing it with `node scripts/generate-icons.mjs` (or prepend
`PLAYWRIGHT_CHANNEL=chrome` for an installed Chrome).
