---
name: app-ui
description: Design the structure and look of app UI — product screens, tools, lists, forms, settings, dashboards — so it is task-first and deliberately designed, not AI-generated. Use whenever you build, redesign, restyle or review the interface of an app, including when implementing a spec that adds or changes screens. Not for landing pages or marketing sites.
argument-hint: [build | redesign | restyle | review] [what]
---

<!-- app-ui v0.3 -->

# App UI

Models build the average of every interface they have seen. The average is
not only a look (Inter, indigo, rounded cards) — it is a **structure**: a
form on top, a list below, the same buttons on every row. Restyling a default
structure gives you a nicely painted default. Your job is to decide the
structure first, then the look, and then **look at what you built**.

This skill is for app screens (the user is completing a task). Quality shows
as a task-first structure, clear hierarchy and restraint — not decoration.

**Priority order when things conflict:**
1. The spec (if you are building one) — behaviour and anything it states
2. `design/SYSTEM.md` — this project's design decisions
3. This skill's conventions and bans
4. Your habits — never

## Modes

| Mode | Changes | Keeps |
|---|---|---|
| **restyle** | The look only | Structure, behaviour, content |
| **redesign** | Structure and look | Behaviour, content, everything the spec says |
| **build** (implementing a spec) | Structure and look of new or changed screens | Existing screens' structure, unless the spec changes them |
| **review** | Nothing — report only | Everything |

Pick the mode from the request and state it in one line. If the request is
unclear ("make it look better", "improve the UI"), ask once: restyle or
redesign?

## Step 1: Read what exists

- `CLAUDE.md`, the spec you are building (if any), and `design/SYSTEM.md`.
- The existing screens, CSS, tokens and components.

If `design/SYSTEM.md` does not exist, do Step 2. Otherwise its direction is
decided — skip to Step 3 (or Step 4 in restyle mode).

## Step 2: Set the direction (only when there is no SYSTEM.md)

1. **Intent.** Who the person is and the moment they open this (not
   "users"); the one verb they are here to do; what it should feel like in
   words that mean something. "Clean and modern" does not count.
2. **Explore the product's world** before any visual choice:
   - **Domain:** 5+ concepts and words from this product's world
   - **Colour world:** 5+ colours that actually exist in that world
   - **Signature:** one element only this product would have — it must be able
     to shape the **structure**, not just the decoration
   - **Rejected defaults:** 3 obvious choices for this kind of app → what you
     will do instead
3. **Ask the user** in one round with AskUserQuestion (up to 3 questions,
   recommended option first): which of 2–3 concrete directions; light, dark or
   both; any colour, font or brand to keep.
4. **Write `design/SYSTEM.md`** from `templates/SYSTEM.md` in this skill's
   folder. Fill every value. Name tokens after the product's world.
5. **Show a short summary** and get approval before going on.

## Step 3: Design the structure (build and redesign modes)

Do this before writing any markup or styles. In restyle mode, skip it and say so.

For each screen involved:

1. **Tasks by frequency.** List everything the user does on this screen and
   how often: every visit / sometimes / rarely. The most frequent task leads.
   Rare tasks move out of the way — later in the page, smaller, or behind a
   reveal — but stay reachable.
2. **Content inventory.** Every element the spec or existing screen needs.
   Nothing dropped, nothing added.
3. **Name the default.** Write down the layout an AI would produce for this
   kind of screen (e.g. "form at the top, list below, Edit/Delete buttons on
   every row"). You will not pick it unless you can say why it is genuinely
   best here.
4. **Sketch 3 structurally different layouts** as text wireframes at phone
   width. They must differ in what leads, where actions live and how things
   group — not in colour or spacing. At least one must be built on the
   signature.
5. **Let the user choose.** Ask with AskUserQuestion: one option per
   wireframe, the wireframe as the option's preview, your recommendation first
   with a two-sentence reason (task frequency + signature). The current layout
   and the default you named do not count towards the 3. Skip asking only when
   the change is a small addition that follows an existing entry in "Screen
   structures".
6. **Record it** under "Screen structures" in SYSTEM.md, so future builds
   follow it instead of re-deciding.

**Structure rules**
- Structure follows task frequency, not the order things were built in.
- Actions live next to what they act on. Secondary and destructive actions
  are quieter or revealed on demand — but still reachable by keyboard and touch.
- One primary action per screen.
- Grey-box test: with all styling removed, would this look like every other
  app of its type? If yes, rethink before styling.

## Step 4: Build the look

Before each screen, state in one line: **the focal element and how it wins**.

### Tokens are locked
Every colour, font, size, space, radius, shadow and duration comes from a CSS
custom property. No raw values in components. Need a new value? Add a token to
SYSTEM.md first.

### Hierarchy
- One focal point per screen — normally the most frequent task.
- Weight and colour do more than size. Text has 3–4 levels (primary,
  secondary, tertiary, muted) from colour + weight.
- Type scale is a ratio (1.2–1.25) from a 15–16px body. Body line-height ~1.5;
  headings tighter with slightly negative tracking on large type.

### Space
4px base unit. Tight within a group, clearly larger between groups (2×+).

### Colour
Mostly neutral, ~10% accent — only on the most frequent task and its result
(e.g. a ticked item) and on selection. A rare action, even a "primary-looking"
one like Add, never gets the accent fill. Colour means something. Tinted
neutrals, never pure #000 or #fff. Dark mode: shift lightness, keep hue,
borders over shadows.

### Depth
The ONE strategy in SYSTEM.md. Shadows only on floating layers.

### Type
The SYSTEM.md typeface(s), at most two families. Changing numbers use
`font-variant-numeric: tabular-nums`.

### Use what exists
Native HTML first (`<button>`, `<input>`, `<label>`, checkbox, `<dialog>`,
`<details>`), then the project's own components. Never a `<div onClick>`.

### States — none are optional
- Every interactive element: default, hover, focus-visible, active, disabled.
- Every list or screen: empty (teaches the next action), loading (if async),
  error (what happened and what to do).
- Content edges: very long names, many items, one item, zero items.

### Interaction conventions (defaults unless SYSTEM.md or the spec says otherwise)
- Enter submits the field being typed in. Escape cancels an edit and restores
  the original value.
- A message appears next to the control it is about and clears on the next
  attempt, on success, or on cancel.
- Destructive confirmations appear in place, with buttons named for what they
  do — never the browser's `confirm()`.
- Only one item in edit or confirm mode at a time.
- While editing, the item's other information stays visible and unrelated
  controls stay usable.
- Focus moves into the field when editing starts and back to the trigger when
  it ends.
- Numbers that change without a page change are announced
  (`aria-live="polite"`).
- Silent success: no toast for a change the user can already see.

### Accessibility floor
Contrast 4.5:1 for text, 3:1 for large text and UI boundaries. Hit areas
44×44px, never overlapping and at least 8px from other tappable elements.
Visible labels (placeholders are not labels). Focus ring always visible, 3:1,
never removed or animated. Never colour alone. Headings in order. Respect
`prefers-reduced-motion`.

Accessibility fixes are allowed in every mode, including restyle, as long as
behaviour does not change. List each one in your report.

### Motion — cut before you add
Only to explain a change. 100–250ms, `cubic-bezier(0.23, 1, 0.32, 1)`,
`transform` and `opacity` only, named properties (never `transition: all`).
Press feedback `scale(0.97)`. Reduced motion: keep opacity, drop movement.

### Copy
Labels name the object and action. Errors say what happened and what to do.
No subheading that repeats the heading. No marketing copy in the app.

### New decisions
A reusable UI decision SYSTEM.md does not cover: make it once, use it
consistently, add it to SYSTEM.md, list it in the report for approval.

### Behaviour stays the same
In restyle and redesign modes, behaviour does not change — including small
things like what a click or tap hits or what Enter does. The only exception is
an accessibility fix (list it in the report). If you think a behaviour should
change, propose it in the report instead of doing it.

### Tests
Never weaken a test to make a design pass. If a test fails only because of
structure (e.g. it relies on element order) and behaviour is unchanged, stop
and ask before changing the test.

## Banned patterns — and what to do instead

| Never | Instead |
|---|---|
| The default structure for this screen type, unexamined | The Step 3 structure |
| Gradients (backgrounds, buttons, text) | Flat colour from tokens |
| Purple / indigo / violet, or cyan-on-dark, as the default accent | The SYSTEM.md accent, from the product's world |
| Glows, neon, glass / backdrop blur | Solid surfaces separated by a tone step |
| Shadows on things at rest | Tone step or quiet border; shadows only on floating layers |
| Pure #000 / #fff | Tinted near-black and off-white tokens |
| Inter / Roboto / Arial / system-ui by default | The SYSTEM.md typeface |
| Monospace outside code | The text face with tabular numbers |
| Tiny uppercase letter-spaced labels, eyebrows above headings | Sentence case at a readable size |
| Identical card grids, cards around everything, cards inside cards | Rows, lists and sections grouped by space |
| The same large radius on everything | The radius scale |
| Thick one-sided coloured borders | Colour only for status or action |
| Icon above every heading, emoji as icons, decorative sparklines | No icon, or one consistent set where it helps scanning |
| Every button looks primary; rare actions as loud as frequent ones | Accent on the frequent task; rare actions quieter |
| Pulsing "Live" / "New" badges, decorative chips | Plain text, only when true and useful |
| Everything centred | Left-aligned; centre at most one moment |
| Bounce / elastic easing, `transition: all` | Ease-out on named properties |
| Landing-page pieces in an app | Go straight to the task |
| Modals for things that fit inline | Inline editing and confirmation |

Allowed only if SYSTEM.md lists it under "Allowed exceptions" with a reason.

## Step 5: Look and fix

If a problem is visible in a screenshot, it is real, whatever the code says.

**Setup (first time in a project):**
1. If `playwright` is not in devDependencies, ask before installing:
   `npm install -D playwright` then `npx playwright install chromium`.
2. Copy `scripts/screenshot.mjs` from this skill's folder to the project's
   `scripts/screenshot.mjs`.
3. Add `.screenshots/` to `.gitignore`.

**Seeds (static screens):** if the app keeps data in localStorage, write
`.screenshots/seeds/empty.json`, `typical.json` (4–6 realistic items) and
`stress.json` (very long and unbroken names, many items, edge values) in the
app's real saved-data format: `{ "localStorage": { "<key>": <value> } }`.

**States (required):** seeds only show static screens. Write a project-local
Playwright script, `scripts/screenshot-states.mjs`, that drives the real UI
and screenshots each interactive state at phone width: every error message,
edit mode, confirm mode, a keyboard focus ring, and hover on the main
controls. Reuse and extend it on later runs.

**Each round:**
1. Check the port is free first (`netstat -ano | findstr :5199` on Windows,
   `lsof -i :5199` on macOS/Linux). If an old dev server is still running,
   stop it. Then start the dev server in the background (e.g.
   `npm run dev -- --port 5199 --strictPort`).
2. Run the seed screenshots (`node scripts/screenshot.mjs http://localhost:5199
   --seed .screenshots/seeds/typical.json --name typical`, plus
   `--schemes light,dark` if supported) and the states script.
3. Open every PNG with the Read tool.
4. Critique only what you see — focal point, hierarchy, spacing rhythm,
   anything broken (overflow, overlap, cut-off or badly wrapped text), match
   with SYSTEM.md — and count visible banned patterns (each once).
5. Fix the top 3 problems in one batch, then screenshot again.
6. Stop the dev server when done, and confirm the port is free again.

Maximum 3 rounds. Target tell count 0–1. 4+ means the direction is wrong —
say so and stop.

**Checks before finishing:**
- **Task-first test:** on the phone screenshot, is the control for the most
  frequent task the most prominent thing — and do the accent colour and the
  loudest element on screen belong to that task? A rare action must never be
  the loudest thing. (In restyle mode, if the structure is the problem, report
  it as a suggestion.)
- **Signature test:** point to 3+ specific places the signature appears. "The
  overall feel" does not count.
- **Grey-box test:** described as plain boxes, does the structure differ from
  the default you named in Step 3 — or do you have a stated reason it doesn't?
- **Swap test:** swap the typeface for Inter and the structure for the default
  — would anything be lost?
- **Token test:** do the CSS variable names belong to this product?
- All tests, lint and build pass.

Never claim a visual check you did not do.

## Step 6: Report

- The mode, and what you built or changed
- The structure you chose and why (and the alternatives, one line each)
- Decisions added to SYSTEM.md (for approval)
- Accessibility fixes made
- Behaviour changes you'd suggest (not made)
- Screenshots checked (paths) and rounds run
- Final tell count, and the results of the five checks
- Anything you could not verify