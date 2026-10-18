# agent-toolkit

Standalone Claude Code skills and agents, each built and tested on its own using
spec-driven development.

## What's in here

```
agent-toolkit/
├── install.ps1 / install.cmd   copy skills + agents into ~/.claude (run "install")
├── skills/
│   ├── spec-writer/            interviews you, writes specs/NNN-slug/spec.md
│   │   ├── SKILL.md
│   │   └── templates/ (spec-template.md, bugfix-template.md)
│   ├── app-ui/                 designs structure + look, keeps design/SYSTEM.md,
│   │   ├── SKILL.md            screenshots and fixes
│   │   ├── templates/SYSTEM.md
│   │   └── scripts/screenshot.mjs
│   └── review/                 verifies a build against spec + SYSTEM.md
│       └── SKILL.md
├── agents/
│   └── reviewer.md             fresh-context agent that runs the review skill
└── templates/                  starter files to copy into new projects
    ├── CLAUDE.md
    └── runs.md
```

## Build order

1. **spec-writer skill** ✅ v0.4
2. Build with plain Claude Code ✅ (baseline)
3. **app-ui skill** ✅ v0.3
4. **review skill + reviewer agent** ← current
5. **builder agent** (fresh context, follows spec, uses app-ui)
6. **/ship orchestrator** (main session: spec → structure → builder → reviewer → fix loop)
7. Hooks (e.g. a slop-detector hook) — when a real problem calls for them

Rule: add **one** new piece at a time. Everything else stays a known quantity.

## Versions

Bump the version comment at the top of a SKILL.md when you change it, and
mention it in the commit message (e.g. `app-ui v0.3: accent belongs to the
frequent task`). Note versions in `runs.md` so you know which version caused
which result.

## Workflow per feature (until /ship exists)

1. `/spec-writer <one-liner>` → answer → approve the spec
2. `/clear`, then build:
```
   Implement @specs/NNN-slug/spec.md. Use the app-ui skill for all UI.
   Do not guess at any behaviour the spec does not cover. When you finish,
   list every assumption you had to make in two groups: "Behaviour
   assumptions" (anything a user could see or do differently) and
   "Technical assumptions" (files, data format, libraries, naming).
   If a group is empty, write "none".
```
3. Review: `Use the reviewer agent to review specs/NNN-slug/spec.md`
4. Accept or change the behaviour assumptions, then ask Claude to add the
   accepted ones to the spec as numbered EARS criteria (no code changes).
   The spec must always match what was built.
5. Log the run in `notes/runs.md`.

## Scoring

- **Spec-writer:** number of *behaviour* assumptions the builder lists. Target 0.
- **Conventions:** interaction assumptions (Enter, messages, confirmations) are
  gaps in SYSTEM.md / app-ui, not the spec.
- **app-ui:** tell count 0–1, and the five checks (task-first, signature,
  grey-box, swap, token) pass.
- **Reviewer:** planted-bugs eval (below) — bugs caught, false alarms.

## Test cases for spec-writer

| # | Type into Claude Code | Expected |
|---|---|---|
| T1 | `/spec-writer a habit tracker where I can add habits and tick them off each day` | Feature. Capability split if needed. No tech-stack words. |
| T2 | `/spec-writer change the app title to "Daily Habits"` | Tiny. Says no spec needed. Writes nothing. |
| T3 | `/spec-writer show how many habits I've done today, like 3/5` | Small. ≤ 4 questions. Short spec. Lists existing behaviour that must not change. |
| T4 | `/spec-writer show a streak for each habit — days in a row — and my best streak` | Feature on top of existing code. Fills "must not change" from earlier specs. |
| T5 | Describe a real bug you find | Bug. Bugfix template with "must not change" section. |

## Eval for the reviewer: planted bugs

1. `git checkout -b review-test`
2. New session — plant 4 bugs (a criterion-breaking logic bug, a raw hex colour,
   a weakened test, a removed focus ring) and record them in
   `.review-test/answers.md` (gitignored). Commit as "wip".
3. New session — `Use the reviewer agent to review specs/NNN-slug/spec.md`
4. Compare the review with `answers.md`: caught / false alarms / real extras.
   Target: 4/4, no false alarms.
5. `git checkout main` then `git branch -D review-test`

Rerun this every time the review skill changes.