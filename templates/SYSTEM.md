# Design system

Mode: Operate (app UI) · Written by: app-ui v0.1 · Approved: [YYYY-MM-DD]

## Intent
- **Who:** [the specific person and the moment they open the app]
- **Task:** [the one verb they are here to do]
- **Feel:** [3–4 words that mean something]

## Direction
- **Domain:** [5+ concepts from the product's world]
- **Colour world:** [5+ colours that exist in that world]
- **Signature:** [one element only this product has]
- **Rejected defaults:**
  - [default] → [instead]
  - [default] → [instead]
  - [default] → [instead]

## Colour tokens
Rename tokens to fit the product's world; keep the roles.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--paper` | | | Page background |
| `--paper-raised` | | | Surfaces one step up |
| `--ink` | | | Primary text |
| `--ink-soft` | | | Secondary text |
| `--ink-faint` | | | Metadata, placeholders, disabled |
| `--line` | | | Quiet borders and dividers |
| `--accent` | | | Primary action, selection |
| `--accent-ink` | | | Text on accent |
| `--success` | | | Status only |
| `--danger` | | | Errors and destructive actions only |
| `--focus` | | | Focus ring (≥ 3:1 contrast) |

## Type
- **Families:** [one or two] — loaded via [Google Fonts link / @fontsource]
- **Scale** (ratio [1.2 / 1.25], base [15 / 16]px): caption [ ] · body [ ] · label [ ] · h3 [ ] · h2 [ ] · h1 [ ]
- **Weights:** [ ]
- **Numbers:** tabular-nums for anything that changes
- **Line height:** body 1.5 · headings [1.15–1.25] · tracking on ≥ 24px: [−0.01 to −0.02em]

## Space and density
- **Base unit:** 4px
- **Density:** [compact / comfortable]
- **Values:** control padding [ ] · gap inside a group [ ] · gap between groups [ ] · page margin [ ]

## Shape and depth
- **Radius:** controls [ ]px · containers [ ]px · pills only for [ ]
- **Depth strategy (one only):** [tone steps + quiet borders / borders only / subtle shadows]
- **Shadows:** only on floating layers (menus, dialogs, popovers)

## Motion
- **Durations:** press [100–150]ms · small changes [150–200]ms · panels [200–250]ms
- **Easing:** cubic-bezier(0.23, 1, 0.32, 1)
- **Reduced motion:** keep opacity, drop movement

## Interaction conventions
Uses the app-ui defaults, except:
- [any project-specific change, or "none"]

## Component patterns
Add a pattern once it is used twice. Record real values.
- [e.g. Button primary — 40px high · 8px 16px padding · 6px radius · 15px/600]

## Allowed exceptions
Banned patterns this project uses on purpose, and why.
- [none]