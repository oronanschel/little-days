# Touch integration checks

Run `npm test` for the world and interaction unit tests, and `npm run build` for
TypeScript and production compilation.

`npm run test:input` runs the full Pixi scene in headless Chromium at landscape
(1280×800) and portrait (768×1024) tablet viewports. Install the Playwright Chromium
browser first with `npx playwright install chromium`, or use an installed Chrome:

```sh
PLAYWRIGHT_CHANNEL=chrome npm run test:input
```

The script creates a local Vite server on an available port and a fresh browser
for each viewport, then closes both before exiting. It records results and scene
screenshots under the ignored `diagnostics/input/` directory. It uses the same
`--single-process` launch option as the PWA checks for this development environment.

The checks exercise actual browser pointer input, including native touch events:

- Free placement preserves the grab offset.
- A child can be seated and then retrieved by dragging its torso.
- Held and worn props follow a preview while the saved world remains unchanged.
- Blur, native touch cancellation, lost pointer capture and resize restore the
  uncommitted scene; a later drag still works.
- A second finger cannot finish the first finger's drag or move the other person.
- Neither tablet layout produces uncaught browser errors during these checks.

Native cancellation matters: Pixi's event boundary does not map `pointercancel`
into the scene graph in the installed version. The controller therefore listens
on the canvas too. The sofa's front layer is visual only and ignores input, so
its transparent middle cannot hide a seated child's hit area.

These are browser regression checks, not evidence of a child playtest or physical
tablet compatibility. Real tablet touch feel, Safari, assistive input, and the
final boat controls still need separate checks. The PWA suite owns offline and
save-recovery verification.

## Sofa and carrying regressions

The suite includes head, torso and foot grabs for both characters, released on the
sofa back and cushions at both tablet sizes. These are pointer destinations a child
can see, rather than exact calculated hip positions. A release over the sofa body
selects the nearest free seat; the original hip/feet checks remain a fallback.

For props, the renderer supplies the whole visible character bounds as the hand
catchment. This gives a snack dropped on a seated person's tummy to that person,
ahead of the furniture underneath. A hat dropped near the head still uses the head
target, and occupied hands remain protected.

Matched screenshots for the owner-reported failures are in
[`assets/seating-fix/`](assets/seating-fix/): ordinary sofa-back releases before and
after the fix, at both layouts, and a tummy drop before and after carrying is fixed.
These images keep the same art and layout to isolate the interaction change.
