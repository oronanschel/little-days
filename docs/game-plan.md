# Little Days --- Game Design & Development Plan

**Working title:** Little Days / Make-Believe House\
**Version:** 0.1 --- Concept and strategic development plan\
**Audience:** Ages 4--6\
**Format:** Tablet-first, SVG-driven, 2.5D open-ended sandbox\
**Status:** Concept; assumptions and targets require playtesting

------------------------------------------------------------------------

## 1. Executive vision

**Play families. Make believe. Watch your world join in.**

Little Days is a child-directed, open-ended dollhouse game. Children
create and play with families, move characters and objects, explore
domestic spaces, and invent stories. Its defining innovation is
**reversible make-believe transformation**: an everyday scene becomes an
imaginative adventure *without abandoning the scene the child built*.

A sofa becomes a boat; a blanket fort becomes a castle; a cardboard box
becomes a spaceship. The same characters, outfits, objects, and
arrangements carry into the new context. The transformed setting adds
new affordances and reactions---not simply a different background.

### Product principles

1.  **Play first:** no mandatory missions, timers, scores, or failure.
2.  **Child authorship:** the child decides what happens; characters
    support rather than direct.
3.  **Continuity:** the child's world remembers its people, belongings,
    and changes.
4.  **Intuitive interaction:** tap, drag, and drop; no reading
    necessary.
5.  **Wonder from ordinary things:** imaginative play grows out of
    everyday family routines.
6.  **Depth over volume:** fewer spaces with rich combinations beat a
    huge inert catalog.
7.  **Safety by design:** offline-first, no ads in child-facing play, no
    social feed.

## 2. Differentiation

The reference category is open-ended dollhouse play, not a template to
copy. Preserve its most valuable affordances---free character
manipulation, rich objects, room exploration, storytelling---and create
a separate identity through:

-   **Transformable continuity:** objects change imaginative roles while
    retaining identity and state.
-   **Role-aware behavior:** a sofa-as-boat supports sailing
    interactions; a fort-as-castle supports pretend royal play.
-   **Social sparks:** expressive family members react to situations,
    but do not issue demands.
-   **Modular SVG toy theatre:** distinctive handcrafted 2.5D art with
    readable silhouettes and composable parts.
-   **Ages 4--6 focus:** forgiving hit targets, uncluttered scenes,
    reversible experimentation, minimal interface.

**Anti-goals:** educational worksheets disguised as play, daily streaks,
currency grinding, character need meters, generative chat with children,
manipulative unlock loops, and a vast content world before the core
mechanic is proven.

## 3. Player experience

### Core loop

1.  Enter a familiar place.
2.  Choose or position family characters.
3.  Explore and manipulate everyday objects.
4.  Discover combinations and character reactions.
5.  Optionally introduce a make-believe prop or setting.
6.  Continue the same story in a transformed environment.
7.  Return, rearrange, or start another story---with continuity
    preserved.

There is no required completion state. The transformation must remain an
*invitation*, not an objective.

### First-time experience

-   Open directly into a welcoming room with visible people and objects.
-   One gentle visual cue demonstrates drag-and-drop without text.
-   Immediate feedback on the first interaction.
-   A discoverable but optional imaginative prop is present.
-   The child can play normally without ever activating transformation.

### Example: sofa-to-boat

-   A child gathers family members on a sofa, places snacks nearby, and
    picks up a captain's hat.
-   An optional, obvious affordance invites a boat transformation.
-   The room visually becomes a sea adventure; the sofa retains
    occupants and items.
-   New actions become available: rock the boat, raise a sail, fish,
    wave to a passing creature.
-   The child can continue ordinary interactions such as eating or
    changing seats.
-   Reverting restores the room without discarding state.

### Example: fort-to-castle

A child builds a fort, brings toys inside, then transforms it into a
castle. Occupants and props persist; new playful actions include opening
gates and decorating banners.

### Example: box-to-spaceship

A box and household props become a spaceship. The same crew and packed
objects remain aboard; stars, planets, and zero-gravity reactions add
new possibilities.

## 4. World and content strategy

### Vertical slice

**One living room → one boat adventure.** Two characters and a carefully
selected set of objects must demonstrate both normal dollhouse play and
meaningful transformed play.

### First release: proposed targets

-   One connected family home with **three substantial rooms**.
-   **Three authored transformations** with different interaction
    affordances.
-   **Six family characters** representing varied ages and appearances.
-   Approximately **60--80 manipulable objects**.
-   Core everyday actions: carry, place, open, close, sit, sleep, eat,
    dress, and simple combinations.
-   Persistent room arrangement, outfits, object states, and character
    positions.
-   Optional audio and visual reactions, no reading dependency.

These are *scope hypotheses*, not commitments. Adjust after child
testing.

### Expansion candidates

-   Playground, small market, garden, grandparents' home.
-   New transformations anchored in familiar props and spaces.
-   More family configurations, outfits, furnishings, and pretend roles.
-   Seasonal visual sets that do not create time pressure.
-   Optional visual story starters, always dismissible.

## 5. Gameplay systems

### 5.1 Character system

-   Pick up, drag, position, seat, and move characters between rooms.
-   Expressive facial states and simple gestures.
-   Clothing and accessories as interchangeable parts.
-   Carrying and holding objects.
-   Contextual reactions to surroundings and other characters.
-   Characters never autonomously destroy arrangements or demand
    maintenance.

### 5.2 Object system

-   Universal object identity, position, layer/depth, ownership/holder,
    container relationship, and persistent state.
-   Affordance tags and compatible targets: food, wearable, container,
    seat, openable, blendable, etc.
-   Rule-driven combinations, with graceful behavior for unsupported
    pairs.
-   Forgiving placement and snapping; no physics accuracy requirement.
-   Clear feedback for a successful action and easy recovery from
    mistakes.

### 5.3 Transformation system --- product's core

-   Authored transformation definitions mapping everyday objects and
    scene elements to imagined roles.
-   **Stable identity:** transformation is a state/view/behavior change,
    not a replacement that loses object history.
-   Continuity of character positions, occupants, held items, and
    container contents.
-   Transformation-specific actions, soundscapes, animations, and
    character responses.
-   Reversible, repeatable transitions; robust handling of partially
    arranged scenes.
-   Defined fallback rules for unexpected object combinations.

### 5.4 Social and narrative system

-   Situation-based reactions: delight, surprise, laughter, curiosity,
    mild frustration.
-   Lightweight interactions between characters.
-   No scripted narrative that steals control from the player.
-   Optional visual prompts rather than spoken orders.
-   No unrestricted AI dialogue in the MVP.

### 5.5 Persistence and recovery

-   Automatic local save at meaningful state changes.
-   Save format versioning and migration strategy.
-   Crash-safe snapshots or transaction-style updates.
-   Reset individual scenes and restore defaults through
    parent-accessible controls.
-   No account required for core play.

### 5.6 Accessibility and age fit

-   Large touch targets and tolerant drag/drop zones.
-   Avoid reliance on long press, precise gestures, or text.
-   Distinct silhouettes and contrast; do not encode meaning in color
    alone.
-   Audio feedback with independent volume controls.
-   Predictable transitions, limited visual overload, optional reduced
    motion.
-   Test separately with four-, five-, and six-year-olds.

## 6. Art direction and SVG production

### Visual thesis

A **warm, playful illustrated toy theatre**: layered, open-front
interiors; gently rounded shapes; expressive, approachable family
characters; cheerful but controlled color. The 2.5D effect comes from
floor planes, occlusion, layering, contact shadows, and animation---not
camera rotation.

### Production rules

-   SVG is the **editable source of truth** for characters, props, and
    environments.
-   Separate movable/animatable pieces: face, hair, hands, clothing,
    doors, drawers, contents, etc.
-   Use a consistent coordinate system, anchor conventions, viewBoxes,
    and naming.
-   Limit SVG features to a tested renderer-compatible subset.
-   Bake or rasterize costly static artwork where performance warrants
    it.
-   Keep important interactions visually prominent even in crowded
    scenes.
-   Transformed objects must remain visually recognizable as their
    everyday counterparts.

### Concept image guidance

The generated boards from this conversation are **mood references**, not
approved production assets or a final visual specification. Validate the
exact visual direction against the original reference image and
prototype readability on actual tablets.

### Asset families

-   Modular human character base and customization parts.
-   Household furniture and room structures.
-   Food, clothing, toys, containers, appliances.
-   Transformation overlays, alternate silhouettes, interactive
    elements.
-   Expressions, reaction effects, particles, and UI icons.

## 7. Technical architecture

### Proposed stack

-   **Client:** TypeScript.
-   **Rendering:** PixiJS for 2D scene composition, depth ordering,
    animation, and SVG-derived assets.
-   **Assets:** modular SVG source, preprocessed into
    runtime-appropriate SVG or textures.
-   **Content:** versioned data definitions for scenes, objects,
    characters, rules, and transformations.
-   **Persistence:** local-first, with a stable serialized world-state
    schema.
-   **Delivery:** tablet-focused web/PWA prototype; evaluate native
    packaging after device testing.
-   **Backend:** none required for the first playable release.

### Architectural boundaries

1.  **Simulation/world state** --- authoritative identities, positions,
    relationships, and object state.
2.  **Interaction resolver** --- input interpretation and rule
    evaluation.
3.  **Transformation engine** --- mapped roles, reversible states,
    context-specific behaviors.
4.  **Presentation layer** --- visuals, animations, sound,
    camera/viewport, depth.
5.  **Content pipeline** --- definitions, validation, asset packaging,
    editor workflows.
6.  **Persistence layer** --- save/load, schema evolution, safe reset
    and recovery.

### Engineering challenges worth solving early

-   Reliable z-ordering in crowded scenes.
-   Drag targets that remain forgiving on small tablets.
-   Object identity and state across reversible transformations.
-   State integrity when objects are nested, held, or moving.
-   Smooth SVG-heavy animation and predictable memory usage.
-   A content workflow that allows designers to author new interactions
    without touching core code.

### Deliberate omissions

No multiplayer, cloud accounts, runtime LLM, procedural world
generation, complex 3D physics, or creator marketplace in the MVP.

## 8. Development roadmap and gates

**Milestones are outcome-based.** Time estimates should be made after
the first technical spike, not treated as guarantees.

  -----------------------------------------------------------------------
  Phase                   Focus                   Exit gate
  ----------------------- ----------------------- -----------------------
  0\. Product discovery   Observe target-age      Clear evidence children
                          play, test concept      understand and enjoy
                          language, assess        the proposed twist
                          competing experiences   

  1\. Core interaction    One room, two           Children can manipulate
  prototype               characters, drag/drop,  the world independently
                          seats, containers       

  2\. Transformation      Sofa-to-boat,           Nothing important is
  proof                   continuity, reversal,   lost and transformed
                          transformed actions     play is genuinely
                                                  different

  3\. SVG asset pipeline  Character kit, layered  A second
                          scenes, conventions,    character/scene can be
                          automated validation    produced repeatably

  4\. Everyday systems    Food, clothing,         Multiple content items
                          furniture, expressions, reuse shared behavior
                          combinations            rules

  5\. Transformation      Generalize authored     A second transformation
  platform                transformations and     uses the same engine
                          fallback cases          

  6\. Vertical slice      Polished living room +  Independent playtesting
                          boat, sound,            validates clarity and
                          persistence, onboarding delight

  7\. Content expansion   Three rooms, three      Full content target is
                          transformations, family playable without
                          set, object library     special-case
                                                  instability

  8\. Quality and release Accessibility, tablet   Release candidate meets
                          performance, offline    quality and
                          operation, privacy,     child-safety gates
                          testing                 
  -----------------------------------------------------------------------

### Workstreams that run throughout

-   Child playtesting and observation.
-   UX/accessibility.
-   Art pipeline and animation quality.
-   Automated state integrity and regression testing.
-   Performance profiling on low- and mid-range target tablets.
-   Privacy, store-policy, and parent-controls review.

## 9. Test plan and success criteria

### Core research questions

-   Can children begin playing without reading or adult instruction?
-   Do they discover and understand transformations?
-   Do they perceive transformed objects as the *same* objects?
-   Is transformed play fun beyond the initial visual surprise?
-   Can they recover from accidental actions?
-   Do they invent their own stories, rather than wait for tasks?

### Proposed early targets

-   First meaningful interaction within **10 seconds**.
-   **80%+** of tested children start playing without adult explanation.
-   **90%+** successful intentional drag/drop attempts after brief
    familiarization.
-   Majority of children choose to continue or replay voluntarily.
-   No reproducible lost-state or duplicated-object defects in
    transformation regression tests.

These are **internal hypotheses**, not externally validated benchmarks.
Use qualitative observation alongside event counts, with appropriate
parent consent and minimal collection.

### Testing approach

-   Short observed sessions with children aged 4, 5, and 6 separately.
-   Observe hands and behavior, not just verbal answers.
-   Record confusion points, repeated play patterns, delight moments,
    and adult interventions.
-   Test with both first-time and returning players.
-   Use explicit consent and avoid collecting unnecessary personal data.

## 10. Safety, privacy, and commercial principles

-   Child-facing experience should be offline-capable and ad-free.
-   No public chat, messaging, uploads, or user-generated social feed.
-   External links, purchases, settings, and support behind a parent
    area.
-   No manipulative scarcity, streaks, or reward schedules.
-   Minimal analytics and no unnecessary identifiers; parent consent
    where required.
-   Assess applicable children's privacy laws and platform policies
    before distribution.
-   Business model, pricing, and distribution strategy are **open
    decisions**; do not let them compromise play design.

## 11. Risks and mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Transformation is only a visual     Require new interactions and
  novelty                             repeat-play evidence for each
                                      transformed world

  Scene state becomes fragile         Stable entity IDs, explicit
                                      relationship rules, automated
                                      round-trip transformation tests

  SVG rendering becomes expensive     Profile early, restrict costly
                                      effects, cache/rasterize static
                                      layers

  Art production dominates schedule   Modular character kits,
                                      standardized assets, reuse-first
                                      content

  Interface becomes too complex for   Child tests from phase one, no
  age four                            required precision or reading

  Scope expands into a large town too One polished room and
  early                               transformation as a non-negotiable
                                      gate

  Character autonomy becomes          Reactions are bounded,
  intrusive                           non-destructive, and subordinate to
                                      child actions

  Product feels too close to an       Distinct mechanic, original
  existing franchise                  characters, original art,
                                      independent naming and IP review
  -----------------------------------------------------------------------

## 12. Team and ownership

Suggested small-team capabilities (roles may overlap): - **Game/product
design:** core play, transformations, observation sessions, scope. -
**Gameplay engineering:** interactions, state, rules, rendering,
persistence. - **Technical art / SVG pipeline:** modular asset
standards, animation, performance. - **Visual design and illustration:**
world, characters, environments, effects. - **Audio and child UX:**
sound cues, accessibility, feedback. - **QA and research:** child
testing, regression, device coverage.

A high-quality vertical slice is a better investment than splitting
effort across many locations.

## 13. Decisions to resolve

1.  Final name and brand positioning.
2.  Art treatment: flat vector vs subtly shaded vector; character
    proportions.
3.  Exact camera and room layout conventions.
4.  Whether transformations are triggered by props, a universal
    imagination control, or both.
5.  How much characters can react autonomously.
6.  Device baseline and web-versus-packaged-app distribution.
7.  First-release content quantity after testing.
8.  Business model and parental controls.
9.  Whether a small content editor is needed before launch.
10. Definition of quality bar for animation, sound, and transitions.

## 14. Immediate next steps

1.  Select and document one coherent art direction from the concept
    references.
2.  Build an SVG-based living-room mockup with movable objects.
3.  Implement two characters, seating, object carrying, and scene
    persistence.
4.  Create the sofa-to-boat transformation with three genuinely new
    interactions.
5.  Test with children aged 4--6 and observe whether they understand the
    mechanic.
6.  Revise the design before committing to the remaining rooms and
    transformations.

------------------------------------------------------------------------

## North-star acceptance test

*A four-year-old independently moves a family onto a sofa, packs a
snack, transforms the sofa into a boat, plays an imaginative adventure,
returns to the living room, and finds the family and snack where they
expect them.*

If that experience is intuitive, expressive, reliable, and fun to
repeat, the game has a foundation worth scaling.

**End of planning document --- v0.1**
