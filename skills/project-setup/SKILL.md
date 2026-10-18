---
name: project-setup
description: Use after docs/ARCHITECTURE.md is approved, to scaffold a new project with unit tests, end-to-end tests, a smoke test, CI, CLAUDE.md and the run log. Also use on an existing project to add whichever of these is missing.
---
<!-- project-setup v0.4 -->

# Project setup

Turn an approved docs/ARCHITECTURE.md into a working, empty project: scaffold, unit tests, end-to-end tests with a smoke test, CI, CLAUDE.md and a run log. No features.

## Steps

1. **Check.** If docs/ARCHITECTURE.md doesn't exist, say "Run /architect first." and STOP. If the folder already has an app (package.json or similar), don't scaffold again; go through the steps below and only add what's missing, saying what you added.

2. **Scaffold** in the current folder with the official generator for the chosen stack, in non-interactive mode. Keep docs/ as it is. Install only the packages the architecture names.

3. **Swap points.** Create one module for each row under Swap points in ARCHITECTURE.md (for example a database module and a file storage module). For now each one is just an interface and an empty stub. The rest of the app must only use these modules, never the service directly.

4. **Unit tests.** Add the test runner from the architecture and one passing test, so the test command works from day one. Make sure these scripts exist: dev, build, test.

5. **End-to-end tests.** These drive the real app in a browser the way a person would, and every spec adds one.
   - Install `@playwright/test` as a dev dependency and its Chromium browser (`npx playwright install chromium`).
   - Add `playwright.config.ts`: tests in `e2e/`, Chromium only, and a `webServer` entry that starts the app's dev command on a fixed test port and waits for it to answer.
   - The test run must never touch real data. If the app saves data or files, it must read where they go from an environment variable, and the `webServer` entry points it at a fresh temporary folder.
   - Add the script `test:e2e` (`playwright test`).
   - Add `test-results/` and `playwright-report/` to .gitignore.

6. **Smoke test.** If the app has a server, add a `/health` route that returns `{ "ok": true, "startedAt": <time the server started> }`. Then write `e2e/000-smoke.spec.ts` that:
   - opens the home page and checks the main heading is visible and there are no errors in the browser console;
   - reads `/health`, waits 15 seconds, reads it again, and checks `startedAt` hasn't changed (the server didn't restart by itself);
   - opens the home page again and checks it still loads.

   For an app with no server, check the page still loads after 15 seconds instead.

7. **Env.**
   - Create .env.example with the variable names from ARCHITECTURE.md, with empty values.
   - Check that the real env file (.env or .env.local) is in .gitignore.
   - Never write real secret values anywhere.

8. **Database** (if the architecture has one). Set up the migrations folder for the chosen tool. Don't add Docker, a local database server or any other tool unless the architecture names it.

9. **CI.** Add .github/workflows/ci.yml that, on every push and pull request: installs, runs the unit tests, builds, installs the Playwright Chromium browser (`npx playwright install --with-deps chromium`) and runs `npm run test:e2e`. Use the same runtime version as the local project.

10. **CLAUDE.md.** Keep it short. Point to the docs instead of repeating them:

```markdown
    # <Project name>
    <one line: what it is>

    ## Read first
    - specs/ROADMAP.md: who it's for, the problem, what's planned
    - docs/ARCHITECTURE.md: stack, decisions, risks, swap points

    ## Commands
    - <dev command>: start locally (say how to choose the port)
    - <test command>: unit tests
    - npm run test:e2e: end-to-end tests in a real browser, including the smoke test
    - <build command>: production build
    - <migration command, if any>: apply database changes

    ## Rules
    - Specs live in specs/. The spec wins over anything else.
    - A task is done when the unit tests, the build and the end-to-end tests pass.
    - Every bug fixed gets a test that would have caught it.
    - Outside services are only used through their swap-point modules.
    - <one rule for each risk in ARCHITECTURE.md that code must follow>
    - Secrets live in <env file>. Never commit them.
    - Log every toolkit problem in notes/runs.md.
```

11. **Run log.** If notes/runs.md doesn't exist, create it containing:

```markdown
    # Run log

    | Date | Step (skill/agent) | What went wrong | What I did |
    |---|---|---|---|
```

12. **Verify.** Run the unit tests, the build and `npm run test:e2e`. Fix them until all three pass. If the smoke test fails, the app isn't working yet: find the real cause and fix it.

13. **Commit.** Run git init if needed, then commit everything with the message "Project setup" (or "Add end-to-end tests" on an existing project).

14. **Hand over.** Split what's left into two lists:
    - **Now:** only what's needed before the first spec can be built and tested locally.
    - **Later:** things like deployment and online accounts, each tagged with when it's needed (e.g. "when you first share a link").

    For each step, first check whether a command-line tool the user is logged in to can do it (gh, supabase, wrangler, az and so on). If it can, run it yourself, or say "log in with <command> and I'll do the rest". Only list dashboard clicks for what no command can do. Aim for 5 or fewer "Now" steps. Write the Later list to notes/later.md as well, so specs and builds can see it. End with: "Next: /app-ui to set the design direction (if the app has screens), then /spec-writer". Then STOP.

## Rules
- Don't build features. Don't write specs.
- Don't click through or change online dashboards. List those steps for the user.
- CLAUDE.md gets one line about the product, no more. The product lives in the roadmap.

## Red flags
- Rules in CLAUDE.md that repeat the architecture instead of pointing to it
- A test script that fails or doesn't exist
- An end-to-end run that uses real data
- Secret values in any file that gets committed
- Tools or installs the architecture doesn't name (Docker, extra services)
- App code that talks to a service directly instead of through its swap-point module