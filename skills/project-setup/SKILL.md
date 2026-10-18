---
name: project-setup
description: Use after docs/ARCHITECTURE.md is approved, to scaffold a new project, add CI, and write CLAUDE.md and the run log.
---
<!-- project-setup v0.2 -->

# Project setup

Turn an approved docs/ARCHITECTURE.md into a working, empty project: scaffold, tests, CI, CLAUDE.md and a run log. No features.

## Steps

1. **Check.** If docs/ARCHITECTURE.md doesn't exist, say "Run /architect first." and STOP. If the folder already has an app (package.json or similar), don't scaffold again; only add what's missing.

2. **Scaffold** in the current folder with the official generator for the chosen stack, in non-interactive mode. Keep docs/ as it is. Install only the packages the architecture names.

3. **Swap points.** Create one module for each row under Swap points in ARCHITECTURE.md (for example a database module and a file storage module). For now each one is just an interface and an empty stub. The rest of the app must only use these modules, never the service directly.

4. **Tests.** Add the test runner from the architecture and one passing smoke test, so the test command works from day one. Make sure these scripts exist: dev, build, test.

5. **Env.**
   - Create .env.example with the variable names from ARCHITECTURE.md, with empty values.
   - Check that the real env file (.env or .env.local) is in .gitignore.
   - Never write real secret values anywhere.

6. **Database** (if the architecture has one). Set up the migrations folder for the chosen tool. Don't add Docker, a local database server or any other tool unless the architecture names it.

7. **CI.** Add .github/workflows/ci.yml that installs, tests and builds on every push and pull request. Use the same runtime version as the local project.

8. **CLAUDE.md.** Keep it short. Point to the docs instead of repeating them:

```markdown
   # <Project name>
   <one line: what it is>

   ## Read first
   - specs/ROADMAP.md: who it's for, the problem, what's planned
   - docs/ARCHITECTURE.md: stack, decisions, risks, swap points

   ## Commands
   - <dev command>: start locally
   - <test command>: run tests
   - <build command>: production build
   - <migration command, if any>: apply database changes

   ## Rules
   - Specs live in specs/. The spec wins over anything else.
   - Outside services are only used through their swap-point modules.
   - <one rule for each risk in ARCHITECTURE.md that code must follow>
   - Secrets live in <env file>. Never commit them.
   - Run the tests and the build before saying a task is done.
   - Log every toolkit problem in notes/runs.md.
```

9. **Run log.** Create notes/runs.md containing:

```markdown
   # Run log

   | Date | Step (skill/agent) | What went wrong | What I did |
   |---|---|---|---|
```

10. **Verify.** Run the tests and the build. Fix them until both pass.

11. **Commit.** Run git init if needed, then commit everything with the message "Project setup".

12. **Hand over.** Split what's left into two lists:
    - **Now:** only what's needed before the first spec can be built and tested locally.
    - **Later:** things like deployment and online accounts, each tagged with when it's needed (e.g. "when you first share a link").

    For each step, first check whether a command-line tool the user is logged in to can do it (gh, supabase, wrangler, az and so on). If it can, run it yourself, or say "log in with <command> and I'll do the rest". Only list dashboard clicks for what no command can do. Aim for 5 or fewer "Now" steps. End with: "Next: /spec-writer". Then STOP.

## Rules
- Don't build features. Don't write specs.
- Don't click through or change online dashboards. List those steps for the user.
- CLAUDE.md gets one line about the product, no more. The product lives in the roadmap.

## Red flags
- Rules in CLAUDE.md that repeat the architecture instead of pointing to it
- A test script that fails or doesn't exist
- Secret values in any file that gets committed
- Tools or installs the architecture doesn't name (Docker, extra services)
- App code that talks to a service directly instead of through its swap-point module