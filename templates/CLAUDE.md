# Project rules

<!-- Copy this file into the root of a test project and fill in the brackets.
     Keep it short: rules that apply to EVERY change. Feature details go in specs/. -->

## What this project is
[One or two sentences.]

## Stack
- [e.g. Vite + React + TypeScript]
- [e.g. Vitest for tests]
- [e.g. localStorage for data — no backend]

## Commands
- Run dev server: `[npm run dev]`
- Run tests: `[npm test]`
- Type check / lint: `[npm run lint]`

## Conventions
- [e.g. Components in src/components/, one per file]
- [e.g. Pure logic in src/lib/ with a test file next to it]

## Rules
- Specs live in `specs/NNN-slug/`. Build only what the approved spec asks for.
- Anything in a spec's "Out of scope" section must not be built.
- Do not add new dependencies without asking.
- Every acceptance criterion should be covered by a test where practical.