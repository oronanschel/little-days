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

`toScenePoint` supports a browser client rectangle and the corresponding logical
scene rectangle. Pass the actual rendered scene rectangle, excluding letterbox
bars, or use the Pixi container's inverse world transform. Never convert a point
that is already in scene space a second time.
