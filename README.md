# ai-toolkit

Standalone Claude Code skills and agents for spec-driven development. Each
piece works on its own and was added because a real run showed it was needed.

## What's in here

```
ai-toolkit/
├── install.ps1 / install.cmd   copy skills + agents into ~/.claude (run "install")
├── skills/
│   ├── spec-writer/            interviews you, writes specs/NNN-slug/spec.md
│   │   └── templates/          spec-template.md, bugfix-template.md
│   ├── app-ui/                 designs structure + look, keeps design/SYSTEM.md,
│   │   ├── templates/SYSTEM.md screenshots and fixes
│   │   └── scripts/screenshot.mjs
│   ├── secure-build/           security rules the builder follows on every build
│   └── review/                 the review rules: code, ui and security lanes
│       └── scripts/check-rules.mjs   mechanical checks (no AI)
├── agents/
│   ├── builder.md              builds an approved spec: build → check → review → fix
│   └── reviewer.md             runs the code, ui and security lanes in parallel
└── templates/                  starter files for a new project
    ├── CLAUDE.md
    └── runs.md
```

## Use

Everything installs to your personal Claude folder, so it works in any project.

| You want to… | Type in Claude Code |
|---|---|
| Plan a feature | `/spec-writer <idea>` |
| Build an approved spec | `Commit everything, then use the builder agent to build specs/NNN-slug/spec.md` |
| Only design or fix the UI | `/app-ui redesign …` |
| Only review | `Use the reviewer agent: Review specs/NNN-slug/spec.md. Base commit: <sha>. Round: 1.` |

If the builder returns **NEEDS DECISION**, ask Claude to show you the options
from `builds/NNN-slug-structure.md`, pick one, then run the builder again.

After a build: look at the app, read `builds/NNN-slug-build.md`, then commit.

## New project

1. `npm create vite@latest my-app -- --template react-ts` then `npm install`
2. Copy `templates/CLAUDE.md` in and fill in the stack and commands
3. `/spec-writer <your idea>`

app-ui sets up Playwright and its screenshot script the first time it runs.
The builder and reviewer run check-rules from the review skill folder, so
nothing else needs copying.

## How the pieces fit

```
main session:  /spec-writer → you approve          (needs your answers)
               app-ui layout options → you pick    (only for new screens)
builder agent: PREPARE → BUILD (app-ui + secure-build) → CHECK → REVIEW → FIX → REPORT
reviewer agent:          ├─ code lane  (always)
                         ├─ ui lane    (if UI changed)
                         └─ security lane (always)
```

Subagents cannot ask you questions, so specs and layout choices stay in the
main session.

## Status

| Piece | Version | Tested |
|---|---|---|
| spec-writer | v0.5 | ✅ Runs 001–003, 009 |
| app-ui | v0.3 | ✅ Runs 004–006, 009 |
| check-rules | — | ✅ planted-bug cases |
| review + reviewer | v0.4 / v0.2 | ⚠️ 3 lanes not run yet |
| secure-build | v0.1 | ⚠️ no project with a server yet |
| builder | v0.2 | ✅ v0.1 Run 009 (spec 003) |

Not covered yet (add when a real project needs it): backends and databases in
practice, React Native, fully hands-off runs.

## Rules for changing the toolkit

- Add a piece only when a real run shows the need. One new piece at a time.
- Bump the version comment at the top of a file when you change it, and put
  the version in the commit message.
- Log every run in the project's `notes/runs.md`.