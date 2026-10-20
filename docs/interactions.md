# Touch interaction contract

`src/interactions` is independent of Pixi and world persistence. Positions use the
same logical scene coordinates as the renderer; an entity's position is its
feet/base anchor. Transform browser or Pixi coordinates before calling it.

## Gesture lifecycle

Create one `DragGesture` per scene, with a threshold expressed in logical scene
units. For an eight-screen-pixel threshold, divide eight by the renderer's scene
scale. On pointer down call `begin(pointerId, scenePoint, entityId, entityPosition)`.
A `false` return means another pointer already owns the gesture.

`move` returns a visual preview, preserving the original grab offset. It does not
change world state. Below the threshold it returns the original position, so
finger jitter does not move a toy. Ignore null results from unrelated pointers.

On pointer up, `end` samples the release coordinate too and returns `tap` or
`drop`. Apply a world command only for a drop; use a tap for authored reactions.
For `pointercancel`, lost pointer capture, blur, resize, scene replacement or
teardown, call `cancel` and render its original position. Cancelling without a
pointer ID also handles lifecycle events that have no pointer. Keep pointer
capture until release so leaving the canvas cannot strand an active gesture.

## Drop resolution

Build targets from the current world state for the entity being dragged:

- Characters accept available seats, including their own current seat.
- Carryable objects accept compatible hands or containers.
- Disable occupied/incompatible targets and exclude the dragged entity itself.

Pass the preview position to `resolveDrop(position, targets, floorBounds)`.
Each target has a stable `id`, a `kind`, and a scene-space rectangular `bounds`.
`padding` adds a rounded tolerance region outside the visible bounds (24 world
units by default). Set the padding from scene scale when a fixed screen size is
needed. The nearest visible target wins; overlapping targets use descending
`priority`, then stable ID. A hand can take priority over a container when both
cover the anchor. The result identifies a target or provides a floor position
clamped to legal anchor bounds. The world command must revalidate the selected
relationship before committing it.

The floor bounds describe allowed anchor positions, so account for sprite size
when defining them. Free placement, seat, carry and container operations should
all preserve entity identity. Save only after the successful world operation.

## Living room and boat adapter

`buildDropTargets(world, draggedId, options?)` builds compatible seat, hand, head
and furniture-surface targets from the world catalog. It excludes other people's
occupied seats/hands/heads while preserving the dragged entity's own attachment
as a valid target. Surfaces can hold several props. Containers are reserved for
future content; the current world core has furniture surfaces instead.

`applyDrop(world, draggedId, previewPosition, options?)` rebuilds those targets at
release and applies one world operation. It returns the world's `OpResult`:
replace the current world and save only when `ok` is true. On refusal, redraw the
unchanged world. The renderer can call the builder during a drag to highlight the
same target that release will choose.

Seat, hand and head positions follow the catalog and current attachment chain.
The adapter exports provisional `DEFAULT_SURFACES` and `DEFAULT_FLOOR` matching
the slice's 1600×1000 layout. `options.surfaceBounds` overrides local rectangles
by furniture type; `options.floor` overrides legal free anchor bounds, and
`options.padding` tunes touch tolerance. Set the surface rectangles to match the
art. A tolerance drop is clamped onto the actual surface before attaching a prop,
so it does not float off the edge. The same data and rules apply at sea.

`toScenePoint` supports a browser client rectangle and the corresponding logical
scene rectangle. Pass the actual rendered scene rectangle, excluding letterbox
bars, or use the Pixi container's inverse world transform. Never convert a point
that is already in scene space a second time.
