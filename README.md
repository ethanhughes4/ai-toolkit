# agent-toolkit

Standalone Claude Code skills and agents, each built and tested on its own using
spec-driven development.

## What's in here

```
agent-toolkit/
├── install.ps1                 copies skills/agents into ~/.claude
├── skills/
│   └── spec-writer/            interviews you, 
│   └── app-ui/                 designs/builds app UI, keeps design/SYSTEM.md, screenshots + fixes
│       ├── SKILL.md
│       ├── templates/SYSTEM.md
│       └── scripts/screenshot.mjswrites specs/NNN-slug/spec.md
│       ├── SKILL.md
│       └── templates/
│           ├── spec-template.md
│           └── bugfix-template.md
├── agents/                     (empty for now — reviewer, then builder)
└── templates/
    ├── CLAUDE.md               starter project rules for a test project
    └── runs.md                 run log: what went wrong after each build
```

## Build order

1. **spec-writer skill** ✅ v0.4
2. Build with plain Claude Code ✅ (baseline)
3. **app-ui skill** ← current
4. **reviewer agent**
5. **builder agent** (only if the reviewer shows plain Claude Code falling short)
6. planner agent, hooks (e.g. a slop-detector hook) — when a real problem calls for them

Rule: add **one** new piece at a time. Everything else stays a known quantity.

## Versions

Bump the version in the commit message when you change a skill, e.g.
`spec-writer v0.2: stop asking about tech stack`. Note the version in `runs.md`
so you can tell which version caused which result.

## Test cases for spec-writer

Run these in the test project, in order. Each one checks a different part of the
skill. Expected behaviour is what "working" looks like.

| # | Type into Claude Code | Expected |
|---|---|---|
| T1 | `/spec-writer a habit tracker where I can add habits and tick them off each day` | Size = Feature. Full interview. Creates `specs/001-...`. No tech-stack words. |
| T2 | `/spec-writer change the app title to "Daily Habits"` | Size = Tiny. Says no spec needed. Writes nothing. |
| T3 | `/spec-writer let me delete a habit` | Size = Small. ≤ 4 questions. Short spec. Asks about confirm-before-delete and what happens to past ticks. |
| T4 | `/spec-writer show a streak for each habit — days in a row — and my best streak` | Size = Feature. Asks about missed days / today not yet ticked. Lists existing behaviour that must not change. |
| T5 | Describe a real bug you find while building T1–T4 | Size = Bug. Uses bugfix template with "must not change" section. |

Build each spec (fresh session) before writing the next, so later specs have
real code to look at. Use this build prompt every time:

```
Implement @specs/NNN-slug/spec.md. Do not guess at any behaviour the spec
does not cover. When you finish, list every assumption you had to make under
the heading "Assumptions". If you made none, write "Assumptions: none".
```

**Main measure of the spec-writer:** the number of behaviour assumptions the
builder lists. Each one is a gap the spec-writer should have asked about. The
target is zero. Technical assumptions (file names, libraries) don't count —
those belong to the plan, not the spec.

When a test case fails, fix `SKILL.md`, re-run `install.ps1`, and run the same
test case again. These test cases become the first evals later.