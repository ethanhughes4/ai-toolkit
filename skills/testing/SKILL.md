---
name: testing
description: How tests are written and judged in this toolkit (test-first, end-to-end tests, mutation testing, and the signs of a test written just to pass). Used by the builder when it writes tests and by the review's tests lane when it checks them.
---
<!-- testing v0.1 -->

# Testing

## Test first (every acceptance criterion)
1. **Red.** Write the test. Start its name with the criterion number
   (`1.3 refuses a duplicate name in the same section`). Write the expected
   result out from the spec's own values; never work it out with the code
   being tested. Run it and see it fail because the feature is missing, not a
   typo. Trace: `- 1.3 red: <why it failed>`.
2. **Green.** Write the least code that passes. Run it. Trace: `- 1.3 green`.
3. **Tidy.** Clean up, re-run the tests for the files you touched.

Behaviour that doesn't come from a criterion but protects security or data
(size limits, security headers, validation, rolling back a failed change)
also gets a test, named after its source: `security: …`, `data safety: …`.

## End-to-end tests (one file per spec: `e2e/NNN-slug.spec.ts`)
- Written from the spec's "End-to-end check" **before** the screens, and
  seen to fail first.
- Act as a person would: open pages, type, click, read what is on screen.
  Find elements by visible label or role, not internal ids.
- Name tests after the behaviour, with criterion numbers:
  `1.3, 2.8: admin adds a duplicate question and it is refused`.
- Setup (passwords, seed data, test files) may use commands or helpers,
  done in Node, not drawn in the browser.
- Phone-sized screen for anything a player does on a phone.
- A step that truly needs a real device or a human eye is listed as a
  manual check instead.
- Every earlier spec's end-to-end tests run every time, so they catch
  anything a new build breaks.

## Where logic goes
Rules, calculations and checks live in plain modules, never in screen files
or entry points (the file that starts the server or app). Those are covered
by end-to-end tests and left out of mutation testing.

## Mutation testing
- Run on the logic files changed since the base:
  `npm run test:mutation -- --mutate "<file1>,<file2>"`
  (`npm run test:mutation:child` for files that run as a separate process,
  if CLAUDE.md says so).
- In the foreground, one file at a time; nothing else heavy at the same time.
  Too big for the time limit → split into line ranges (`server/api.ts:1-60`).
- **Score = killed mutants only.** Timeouts are listed separately.
- **80% or more** on every file. Below that, strengthen the tests to catch the
  survivors.
- A survivor that can't change any behaviour (equivalent mutant) may stay,
  with a one-line reason in the trace.
- The config may leave out only entry points and screen files, each with a
  written reason.
- Hundreds of mutants that keep falling short usually means hand-written code
  a library could replace.

## Signs of a test written just to pass
- The expected value is computed by the code being tested.
- It mocks or stubs the thing it claims to test.
- It asserts nothing real: only "doesn't throw", "is defined", a value against
  itself, or a snapshot standing in for a logic rule.
- It would still pass if the feature were deleted.
- It checks how the code works inside, so a correct rewrite would break it.
- An end-to-end test reaches into the app's internals.

## Changing existing tests
Only when the spec changed what they check, or when the approach was replaced
and these tests checked the old code's internals (tests of behaviour stay).
Record each one and why. Never weaken, skip or delete a test, raise a timeout
to hide slowness, or exclude a file from mutation testing to make a check pass.