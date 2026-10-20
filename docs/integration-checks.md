# Shared slice verification

`codex/integration-slice` combines the proposed world, input, renderer, touch,
boat and PWA changes for testing. It is a working branch; it does not indicate
human acceptance, deployment, device testing, or a merge to `main`.

## Repeatable local checks

```sh
npm ci
npm test
npm run build
PLAYWRIGHT_CHANNEL=chrome npx playwright test
PLAYWRIGHT_CHANNEL=chrome npm run test:input
PLAYWRIGHT_CHANNEL=chrome npm run test:offline-scene
```

Omit `PLAYWRIGHT_CHANNEL=chrome` when using Playwright's downloaded Chromium.
Each browser script owns and closes its local server. The offline-scene script
serves the production build, seeds the family arrangement through the development
bridge, then uses real pointer taps for the sparkle, sail, rocking hull, fishing
rod, whale and home bubble while networking is disabled. It checks exact saved
world equality on reload and recovery from a malformed primary save. Screenshots
go to the ignored `diagnostics/offline-scene/` directory.
It also reloads at 1920×1080 and checks that the boat hull and visible grown-up
parts contain actual pixels. A visible scene-graph node alone did not catch the
earlier blank SVG texture bug at fractional rasterization scales.

Seeding isolates offline behavior; it does not validate natural family dragging.
The input suite and independent exploratory play cover that separately. A green
script is evidence for its explicit cases, not a substitute for owner play or
testing with children on real tablets.

## Current bug-fix gates

- Drag a character from several natural grab points onto the visible sofa. It
  should occupy a free seat, including when the finger lands on the sofa back.
- Retrieve either seated character; cancel a drag and verify the arrangement is
  unchanged. Held and worn props must follow during previews and after drops.
- Check landscape and portrait framing, reachability of the boat controls, and
  recovery after rotating during a drag.
- Leave people and props off the boat before entering the adventure. Their
  presentation should remain intentional and reachable.
- Compare before/after screenshots for each proposed visual or interaction fix.
- Repeat the offline sequence on the latest combined fixes before requesting
  human review. iPad/Safari and Android device checks remain separate.

The first combined production build needed two integration resolutions: retain
both unit and PWA scripts in `package.json`, and keep only the newer boom-pivot
`SofaView.setSailAmount` implementation when combining the renderer and boat.
