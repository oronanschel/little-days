# Art kit and scene conventions

The vertical slice's art lives in `src/art/` as TypeScript modules that build SVG strings.
SVG stays the editable source of truth (plan §6); the renderer rasterises each piece once,
at a resolution matched to the screen, and draws it with PixiJS.

## Coordinates

- The stage is **1600 × 1000 world units**, origin top-left, y down. The renderer
  letterboxes it to the screen; `SceneRenderer.toWorld()` converts screen points.
- The wall meets the floor at **y = 560**. Backdrops are 2400 wide (world x −400…2000)
  so wide phones see more room instead of bars.
- One SVG unit is one world unit at scale 1.

## Anchors

Every `ArtPiece` declares an anchor: the point placed on the entity's world position.

| Kind | Anchor | Notes |
| --- | --- | --- |
| Furniture, props | bottom-centre (where it touches the floor) | Depth = world y. |
| Standing character | feet (bottom-centre) | |
| Seated character | hips | The world puts a seated character at the seat point. |
| Backdrops | world (0, 0) | |

## Layering

- Entities sort by world y (`zIndex`).
- Furniture you can sit *in* has a **back** layer (backrest, seat) and a **front** layer
  (armrests, or the boat hull). Things seated or resting on it sort between the two.
- Held and worn items are drawn inside their holder at the hand and head points, so they
  move with the character during drags and poses.

## Characters

A character is a set of parts sharing one viewBox anchored at the feet, so a pose is just a
choice of part variants: back arm, legs (`stand`/`sit`), torso, head, face
(`neutral`/`happy`/`surprised`), front arm (`down`/`carry`/`wave`). A new character is a
new `Spec` (proportions, colours, hair style) in `src/art/characters.ts`.

## Transformations

The transformed object stays recognisable: the boat is the *same sofa*, with a mast and sail
behind it and a hull wrapped around its base. Boat-only layers are separate containers on
`SofaView` (`boatBack`, `boatFront`) so animations can move them without redrawing the sofa.
At sea, floor shadows become water ripples.

## Adding art

1. Draw it as an SVG string with `piece(key, width, height, body, anchorX, anchorY)`.
2. Use the shared `OUTLINE` stroke and the palette already in use; avoid text.
3. Export it from a module in `src/art/`; `SceneRenderer` preloads everything exported
   from `props.ts`, both backdrops and all character parts.
