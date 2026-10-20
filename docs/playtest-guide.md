# Vertical-slice playtest guide

Use this guide when the living room, boat transformation and save/load work in a
single build. It tests the [game plan's north-star experience](game-plan.md#north-star-acceptance-test):
can a child arrange a family and belongings, imagine an adventure, and return to
the same story? This is a proposed protocol; no child testing results are recorded
here.

## Before a child plays

- Ask a parent or guardian to agree to the session and the notes you will take.
  Explain that the prototype is being tested, and the child can stop at any time.
  Ask the child if they want to play; stop if they decline or become uncomfortable.
- Keep a familiar adult nearby. Agree that they will let the child try first and
  help when the child asks. Comfort and the child's wishes take priority over the
  session.
- Use the intended tablet in a comfortable orientation. Record its model, browser,
  orientation and build commit. Check that all interactive parts fit on screen.
- Do a separate adult check: seat both characters, carry a snack, wear the hat,
  transform, try three boat actions, return, reload, and check the arrangement.
  Check offline reload after the first full load. Fix blockers before inviting a
  child; do not ask a child to diagnose a broken build.
- Prepare a fresh scene in a separate test browser profile or use a parent reset
  control if available. Preserve any existing child's scene. Keep a second saved
  scene for the adult continuity check.
- Use the [observation sheet](playtest-observation.md). Record age band (4, 5 or 6),
  observations and assistance, without names or contact details. Notes are enough;
  do not take photos, audio or video without separate parent agreement.

## 1. First encounter: observe before explaining

Open directly into the room. Say: **“You can play here however you like.”**
Let the child explore at their own pace. End when they want to stop; a short
session is enough. If they ask what to do, say: **“What would you like to try?”**
Do not point at the sofa, hat or transformation control during this part.

Record the first meaningful interaction, any assistance, and what the child tries:
count a deliberate move, placement or visible authored reaction as meaningful.

- Can they find and move people and props without reading?
- Do intended drops land where they expect? Can they recover from a missed drop?
- Do they notice seating, hands, the hat or packing a snack?
- Do they discover make-believe play? Can they find a way home?
- Do they keep inventing play, repeat something, ask for help or choose to stop?

If timing is useful, the adult may note elapsed time privately. Never show the
child a timer or ask them to hurry. Mark intent as unknown when you cannot tell
what a gesture was meant to do; do not count it as a failed drop.

## 2. Optional invitations: separate prompted from independent play

Only after the first encounter, and only if the child still wants to play, offer
one invitation at a time. Skip anything they have already explored. These are
research prompts, not in-game tasks or conditions for finishing.

| What remains unclear | Neutral invitation |
| --- | --- |
| Everyday arrangement | “Where might the family like to sit?” |
| Carrying or packing | “Would they like to bring anything?” |
| Make-believe discovery | “Could this room become somewhere else?” |
| Boat interactions | “What could happen here?” |
| Returning home | “What if they wanted to go home?” |

Do not demonstrate the correct gesture before recording the child's attempt. If
they request help, help them and mark that step **assisted**. A feature found after
an invitation is **prompted**, even when the gesture itself needs no help. If the
child does not want the invitation, move on or end the session.

## 3. Continuity check: compare with the child's expectation

Before transforming, note who is seated where, who holds or wears each prop, and
where the snack rests. Let the child change their arrangement during the boat
adventure. Compare the return with the **latest** arrangement, not the original
one. Ask: **“Is everything where you thought it would be?”** Do not suggest that
something must be missing.

If the child agrees, the adult can close and reopen the game, then ask the same
question. Record any missing, duplicated or unexpectedly moved entity. Do not
close the game unexpectedly during active play. Check broken-save recovery and
interrupted gestures in adult QA, not by disrupting the child's session.

## 4. Decide what to change

Keep observations for four-, five- and six-year-olds separate. For each feature,
report independent, prompted, assisted and not observed counts with the number of
sessions. “Not observed” includes a feature the child did not choose to try; it is
not evidence that they could not use it.

The game plan proposes first interaction within 10 seconds, 80% independent starts
and 90% successful intentional drops. Treat these as hypotheses. Report actual
counts, exclude uncertain gesture intent, and do not call a small pilot a validated
age-wide success. A pleasant adult walkthrough does not pass the child playtest
gate.

Prioritize a reproducible lost/duplicated-state defect, then barriers that require
adult help, then confusing affordances or touch targets. Link implementation bugs
to the build and exact reproduction steps using an adult-created scene. Keep child
notes and any consent records out of public GitHub issues. Retest the revised
interaction with a willing first-time player as well as a returning player.
