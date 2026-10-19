---
name: project-setup
description: Use after docs/ARCHITECTURE.md is approved, to scaffold a new project with its feedback loops (type check and lint on every edit, unit tests, end-to-end tests with a smoke test, mutation testing, CI), CLAUDE.md and the run log. Also use on an existing project to add whichever of these is missing.
---
<!-- project-setup v0.6 -->

# Project setup

Turn an approved docs/ARCHITECTURE.md into a working, empty project with every feedback loop in place, so an agent always knows when it has broken something. No features.

The loops, fastest first:
1. Type check and lint after every file edit (a hook, seconds)
2. Unit tests (seconds)
3. End-to-end tests in a real browser, including a smoke test (a minute or two)
4. Mutation testing, which checks the tests themselves (minutes, changed files only)
5. CI on every push

## Steps

1. **Check.** If docs/ARCHITECTURE.md doesn't exist, say "Run /architect first." and STOP. If the folder already has an app (package.json or similar), don't scaffold again; go through the steps below and only add or fix what's missing, saying what you changed.

2. **Scaffold** in the current folder with the official generator for the chosen stack, in non-interactive mode. Keep docs/ as it is. Install only the packages the architecture names.

3. **Swap points.** Create one module for each row under Swap points in ARCHITECTURE.md (for example a database module and a file storage module). For now each one is just an interface and an empty stub. The rest of the app must only use these modules, never the service directly.

4. **Type check and lint.** Make sure these scripts exist and pass: `typecheck` (for TypeScript, the compiler with no output, covering every part of the project, client and server) and `lint`.

5. **Check after every edit (hook).** Write `scripts/fast-check.mjs`. It:
   - reads the hook's JSON from standard input and takes `tool_input.file_path`;
   - does nothing (exit 0) unless the file is source code (.ts, .tsx, .js, .jsx, .mjs);
   - runs lint on that one file, then the type check;
   - on any error, prints the errors to standard error (at most the first 40 lines) and exits with code 2, so Claude sees them straight away;
   - otherwise exits 0, and finishes within about 20 seconds.

   Then create `.claude/settings.json` in the project (merge into it if it exists):

```json
   {
     "hooks": {
       "PostToolUse": [
         {
           "matcher": "Edit|Write|MultiEdit",
           "hooks": [
             { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/scripts/fast-check.mjs\"" }
           ]
         }
       ]
     }
   }
```

   Test it: make a deliberate type error in a scratch source file, confirm the hook reports it, then delete the file.

6. **Unit tests.** Add the test runner from the architecture and one passing test, so the test command works from day one. Make sure these scripts exist: dev, build, test. The unit test runner must only pick up unit tests, never the end-to-end tests in e2e/.

7. **End-to-end tests.** These drive the real app in a browser the way a person would, and every spec adds one.
   - Install `@playwright/test` as a dev dependency and its Chromium browser (`npx playwright install chromium`).
   - Add `playwright.config.ts`: tests in `e2e/`, Chromium only, and a `webServer` entry that starts the app's dev command on a fixed test port and waits for it to answer.
   - The test run must never touch real data. If the app saves data or files, it must read where they go from an environment variable, and the `webServer` entry points it at a fresh temporary folder.
   - Add the script `test:e2e` (`playwright test`).
   - Add `test-results/` and `playwright-report/` to .gitignore.

8. **Smoke test.** If the app has a server, add a `/health` route that returns `{ "ok": true, "startedAt": <time the server started> }`. Then write `e2e/000-smoke.spec.ts` that:
   - opens the home page and checks the main heading is visible and there are no errors in the browser console;
   - reads `/health`, waits 15 seconds, reads it again, and checks `startedAt` hasn't changed (the server didn't restart by itself);
   - opens the home page again and checks it still loads.

   For an app with no server, check the page still loads after 15 seconds instead.

9. **Mutation testing.** This checks that the tests would catch real bugs: it makes small deliberate changes to the code and checks that some test fails each time.
   - For JavaScript or TypeScript: install `@stryker-mutator/core` and the runner for the project's test runner (`@stryker-mutator/vitest-runner` for Vitest, `@stryker-mutator/jest-runner` for Jest).
   - Write the config as `stryker.config.mjs`, not JSON, so it can hold real comments. It sets: the test runner; reporters `clear-text`, `progress` and `json`; `incremental: true`; thresholds high 80, low 60.
   - **What gets mutated: logic files only.** `mutate` covers the app's source folders but leaves out test files, e2e/, config files, **entry points** (the file that starts the server, the client's main file) and **screen files** (.tsx, .vue, .svelte and the like). Put a comment above each exclusion saying why: end-to-end tests cover entry points and screens, and logic belongs in plain modules.
   - **Files that only run as a separate process** (command-line tools such as a set-password command): mutation testing can't trace coverage into them. If the project has any, add `stryker.child.config.mjs` that extends the main config with coverage analysis off, related-test detection off, at most 3 runs at once and a 60-second timeout, and add the script `test:mutation:child` that runs it on just those files. The tests for those files must pass Stryker's active mutant on to the child process.
   - Add the script `test:mutation` (`stryker run`), so a build can run it on chosen files with `npm run test:mutation -- --mutate "<file1>,<file2>"`.
   - Add `reports/` and `.stryker-tmp/` to .gitignore.
   - Scores are reported as **killed mutants only**; timeouts are listed separately.
   - Other languages: use the standard tool (mutmut for Python, Stryker.NET for .NET) the same way. If none fits, say so in the hand-over.

10. **Env.**
    - Create .env.example with the variable names from ARCHITECTURE.md, with empty values.
    - Check that the real env file (.env or .env.local) is in .gitignore.
    - Never write real secret values anywhere.

11. **Database** (if the architecture has one). Set up the migrations folder for the chosen tool. Don't add Docker, a local database server or any other tool unless the architecture names it.

12. **CI.** Add .github/workflows/ci.yml that, on every push and pull request: installs, runs the type check, lint and unit tests, builds, installs the Playwright Chromium browser (`npx playwright install --with-deps chromium`) and runs `npm run test:e2e`. Use the same runtime version as the local project. Mutation testing stays local, because it is slow.

13. **CLAUDE.md.** Keep it short. Point to the docs instead of repeating them:

```markdown
    # <Project name>
    <one line: what it is>

    ## Read first
    - specs/ROADMAP.md: who it's for, the problem, what's planned
    - docs/ARCHITECTURE.md: stack, decisions, risks, swap points

    ## Commands
    - <dev command>: start locally (say how to choose the port)
    - npm run typecheck / npm run lint: also run automatically after every edit
    - <test command>: unit tests
    - npm run test:e2e: end-to-end tests in a real browser, including the smoke test
    - npm run test:mutation -- --mutate "<files>": checks the tests catch real bugs (logic files)
    - npm run test:mutation:child: the same for <files that run as a separate process>, if any
    - <build command>: production build
    - <migration command, if any>: apply database changes

    ## Rules
    - Specs live in specs/. The spec wins over anything else.
    - Write the failing test first, then the code.
    - Keep logic out of screen files and entry points. Put rules and calculations in plain modules, which get unit and mutation tests.
    - A task is done when the type check, lint, unit tests, build and end-to-end tests pass.
    - Every bug fixed gets a test that would have caught it.
    - Outside services are only used through their swap-point modules.
    - <one rule for each risk in ARCHITECTURE.md that code must follow>
    - Secrets live in <env file>. Never commit them.
    - Log every toolkit problem in notes/runs.md.

    ## Gotchas
    - <things about this project's tools that would trip up a newcomer; add to this as they are found>
```

14. **Run log.** If notes/runs.md doesn't exist, create it containing:

```markdown
    # Run log

    | Date | Step (skill/agent) | What went wrong | What I did |
    |---|---|---|---|
```

15. **Verify.** Run the type check, lint, unit tests, build and `npm run test:e2e`, and run mutation testing once on one logic file to prove it works. Fix until all of them pass. If the smoke test fails, the app isn't working yet: find the real cause and fix it.

16. **Commit.** Run git init if needed, then commit everything with the message "Project setup" (or "Add feedback loops" on an existing project).

17. **Hand over.** Split what's left into two lists:
    - **Now:** only what's needed before the first spec can be built and tested locally.
    - **Later:** things like deployment and online accounts, each tagged with when it's needed (e.g. "when you first share a link").

    For each step, first check whether a command-line tool the user is logged in to can do it (gh, supabase, wrangler, az and so on). If it can, run it yourself, or say "log in with <command> and I'll do the rest". Only list dashboard clicks for what no command can do. Aim for 5 or fewer "Now" steps. Write the Later list to notes/later.md as well, so specs and builds can see it. Tell the user to restart Claude Code so the new hook loads. End with: "Next: /app-ui to set the design direction (if the app has screens), then /spec-writer". Then STOP.

## Rules
- Don't build features. Don't write specs.
- Don't click through or change online dashboards. List those steps for the user.
- CLAUDE.md gets one line about the product, no more. The product lives in the roadmap.

## Red flags
- Rules in CLAUDE.md that repeat the architecture instead of pointing to it
- A check script that fails or doesn't exist
- An end-to-end run that uses real data
- A hook that takes longer than about 20 seconds, or that blocks on files that aren't code
- A logic file left out of mutation testing
- A config option that prints a warning on every run
- Secret values in any file that gets committed
- Tools or installs the architecture doesn't name (Docker, extra services). The feedback-loop tools in this skill are the exception.
- App code that talks to a service directly instead of through its swap-point module