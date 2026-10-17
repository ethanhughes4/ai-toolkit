---
name: app-ui
description: Design, build, restyle or review app UI — product screens, tools, lists, forms, settings, dashboards — so it looks deliberately designed, not AI-generated. Use whenever you build or change the interface of an app, including when implementing a spec that adds or changes screens. Not for landing pages or marketing sites.
argument-hint: [what to build, restyle or review]
---

<!-- app-ui v0.1 -->

# App UI

Models build the average of every interface they have seen: Inter, an indigo
accent, rounded cards with soft shadows, everything the same size and spacing.
Nothing in it is wrong and nothing in it was decided. Your job is to replace
every default with a decision, and then **look at what you built**.

This skill is for app screens (the user is completing a task). Here, quality
shows as precision, clear hierarchy and restraint — not as decoration.
Familiar patterns are fine when they help the task.

**Priority order when things conflict:**
1. The spec (if you are building one) — behaviour and anything it states
2. `design/SYSTEM.md` — this project's design decisions
3. This skill's conventions and bans
4. Your habits — never

## Step 1: Read what exists

- `CLAUDE.md`, the spec you are building (if any), and `design/SYSTEM.md`.
- The existing CSS, tokens and components. Reuse them before creating new ones.

If `design/SYSTEM.md` exists, its decisions are made — follow them and go to
Step 3. If it does not exist, do Step 2 first.

## Step 2: Set the direction (only when there is no SYSTEM.md)

1. **Intent.** Write down: who the person is and the moment they open this
   (not "users"); the one verb they are here to do; what it should feel like in
   words that mean something. "Clean and modern" does not count.
2. **Explore the product's world** before any visual choice:
   - **Domain:** 5+ concepts and words from this product's world
   - **Colour world:** 5+ colours that actually exist in that world
   - **Signature:** one element only this product would have
   - **Rejected defaults:** 3 obvious choices for this kind of app → what you
     will do instead
3. **Ask the user** in one round with AskUserQuestion (up to 3 questions,
   recommended option first):
   - Which of 2–3 concrete directions from your exploration feels right
   - Light, dark, or both
   - Any colour, font or existing brand to keep
4. **Write `design/SYSTEM.md`** from `templates/SYSTEM.md` in this skill's
   folder. Fill every value — no placeholders. Name tokens after the product's
   world where it fits (`--ink`, `--paper`), never `--gray-700`.
5. **Show a short summary** (direction, palette with hex values, typeface,
   depth strategy, density) and get approval before building.

## Step 3: Build

Before each screen, state in one line: **the focal element and how it wins**
(size, weight, contrast or space).

### Tokens are locked
Every colour, font, size, space, radius, shadow and duration comes from a CSS
custom property. No raw hex, px font sizes or ad-hoc values in components. If
you need a value that does not exist, add a token to SYSTEM.md first.

### Hierarchy
- One focal point per screen. Make it win; demote everything else on purpose.
- Weight and colour do more than size. Text has 3–4 levels (primary,
  secondary, tertiary, muted) built from colour + weight, not just size.
- Type scale is a ratio (1.2–1.25) from a 15–16px body — visibly distinct
  steps, not 15/16/17 mush. Body line-height ~1.5; headings tighter, with
  slightly negative tracking on large type.
- Squint test: blur your eyes — you should still see what leads.

### Space
- 4px base unit, multiples only. Density is chosen in SYSTEM.md.
- Tight within a group, clearly larger between groups (at least 2×). One
  spacing value everywhere is the sound of no one deciding.

### Colour
- Mostly neutral surface, a secondary tone, ~10% accent. The accent marks the
  primary action and selection — nothing decorative.
- Colour means something (action, status, selection). Status colours are only
  for status.
- Neutrals are tinted, never pure #000 or #fff.
- Dark mode: shift lightness, keep the hue, lean on borders over shadows.

### Depth
Use the ONE depth strategy in SYSTEM.md. Never mix strategies. Shadows only on
things that float (menus, dialogs, popovers).

### Type
- The typeface(s) in SYSTEM.md — at most two families. Never fall back to
  Inter, Roboto, Arial or system-ui unless SYSTEM.md chose it on purpose.
- Changing numbers use `font-variant-numeric: tabular-nums`.

### Use what exists
Native HTML first: `<button>`, `<input>`, `<label>`, checkbox, `<dialog>`,
`<details>`. Never a `<div onClick>`. Then the project's own components. Hand-
roll only when nothing exists — and then include full keyboard, focus and ARIA
behaviour.

### States — none are optional
- Every interactive element: default, hover, focus-visible, active, disabled.
- Every list or screen: empty (teaches the next action), loading (if
  anything is async), error (says what happened and what to do).
- Real content edges: very long names, many items, one item, zero items.

### Interaction conventions (defaults unless SYSTEM.md or the spec says otherwise)
- Enter submits the field being typed in. Escape cancels an edit and restores
  the original value.
- A message appears next to the control it is about. An error clears on the
  next attempt, on success, or on cancel.
- Destructive confirmations appear in place, with buttons named for what they
  do — never the browser's `confirm()`.
- Only one item is in edit or confirm mode at a time; starting another cancels
  the first.
- While an item is being edited, its other information stays visible, and
  controls unrelated to it stay usable.
- Focus moves predictably: into the field when editing starts, back to the
  trigger when it ends.
- Numbers that change without a page change are announced to screen readers
  (`aria-live="polite"`).
- Silent success: no toast for a change the user can already see.

### Accessibility floor
- Contrast: text 4.5:1, large text and UI boundaries 3:1.
- Hit areas at least 44×44px (extend small controls with padding).
- Every input has a visible label — placeholders are not labels.
- Focus ring always visible on `:focus-visible`, at least 3:1 contrast, never
  removed, never animated.
- Never rely on colour alone. Headings in order. Respect
  `prefers-reduced-motion`.

### Motion — cut before you add
- Only animate to explain a change. Actions repeated many times a day get
  almost none.
- 100–250ms, ease-out `cubic-bezier(0.23, 1, 0.32, 1)`, `transform` and
  `opacity` only, name exact properties (never `transition: all`).
- Press feedback: `scale(0.97)` on `:active`. Never animate from `scale(0)`.
- Reduced motion: keep opacity, drop movement.

### Copy
- Labels name the object and the action ("Add habit", not "Submit").
- Errors say what happened and what to do — never "Something went wrong".
- No subheading that repeats the heading. No marketing copy inside the app.

### New decisions
If you need a UI decision SYSTEM.md does not cover and it will be reused (a
component pattern, a convention), make it once, use it consistently, add it to
SYSTEM.md, and list it in your report for approval. Do not decide it
differently on each screen.

## Banned patterns — and what to do instead

| Never | Instead |
|---|---|
| Gradients (backgrounds, buttons, text) | Flat colour from tokens |
| Purple / indigo / violet, or cyan-on-dark, as the default accent | The accent from SYSTEM.md, taken from the product's world |
| Glows, neon, glass / backdrop blur | Solid surfaces separated by a small tone step |
| Shadows on things at rest | Tone step or a quiet border; shadows only on floating layers |
| Pure #000 / #fff | Tinted near-black and off-white tokens |
| Inter / Roboto / Arial / system-ui by default | The SYSTEM.md typeface |
| Monospace outside code | The text face with tabular numbers |
| Tiny uppercase letter-spaced labels, eyebrows above headings | Sentence case at a readable size; put the information in the heading |
| Identical card grids, cards around everything, cards inside cards | Rows, lists and sections grouped by space, not boxes |
| The same large radius on everything | The radius scale: small controls, medium containers |
| Thick one-sided coloured borders | Colour only where it means status or action |
| Icon above every heading, emoji as icons, decorative sparklines | No icon, or one consistent icon set where it helps scanning |
| Every button looks primary | One primary action per screen; the rest quieter |
| Pulsing "Live" / "New" badges, decorative chips | Plain text, only when true and useful |
| Everything centred | Left-aligned; centre at most one moment (e.g. an empty state) |
| Bounce / elastic easing, `transition: all` | Ease-out on named properties |
| Landing-page pieces in an app (hero, "Get started", taglines) | Go straight to the task |
| Modals for things that fit inline | Inline editing and confirmation |

A banned pattern is allowed only if SYSTEM.md lists it under "Allowed
exceptions" with a reason.

## Step 4: Look and fix

You must look at what you built. If a problem is visible in a screenshot, it
is real, whatever the code says.

**Setup (first time in a project):**
1. If `playwright` is not in devDependencies, ask the user before installing:
   `npm install -D playwright` then `npx playwright install chromium`.
2. Copy `scripts/screenshot.mjs` from this skill's folder to the project's
   `scripts/screenshot.mjs`.
3. Add `.screenshots/` to `.gitignore`.

**Seeds:** if the app keeps data in localStorage, write seed files in
`.screenshots/seeds/` using the app's real saved-data format:
`empty.json`, `typical.json` (4–6 realistic items) and `stress.json` (very
long names, many items, edge values). Format:
`{ "localStorage": { "<key>": <value> } }`.

**Each round:**
1. Start the dev server in the background (e.g.
   `npm run dev -- --port 5199 --strictPort`).
2. For each seed:
   `node scripts/screenshot.mjs http://localhost:5199 --seed .screenshots/seeds/typical.json --name typical`
   Add `--schemes light,dark` if SYSTEM.md supports dark mode.
3. Open every PNG with the Read tool and look at it.
4. Critique only what you see: Is the focal point obvious? Does the squint test
   pass? Is spacing tight within groups and looser between them? Anything
   broken — overflow, overlap, cut-off or badly wrapped text? Does it match
   SYSTEM.md? **Count the banned patterns you can see** (each counts once).
5. Write down the top 3 problems, fix them in one batch, then take the next
   round of screenshots.
6. Stop the dev server when done.

Maximum 3 rounds. Target: tell count 0–1. 2–3 means keep fixing. 4+ means the
direction is wrong — say so and stop.

**Checks before finishing:**
- **Swap test:** if you swapped the typeface for Inter and the layout for a
  standard template, would anything be lost? Where nothing would be lost, you
  defaulted.
- **Token test:** read the CSS variables aloud — do they belong to this product?
- All existing tests still pass (`npm test`), plus lint and build.

If screenshots cannot be taken, say so plainly. Never claim a visual check you
did not do.

## Step 5: Report

Tell the user, briefly:
- What you built or changed
- Any decisions added to SYSTEM.md (for approval)
- The screenshots you checked (file paths) and how many rounds you ran
- Final tell count, and any remaining tell with the reason it stays
- Anything you could not verify