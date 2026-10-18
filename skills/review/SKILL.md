---
name: review
description: Independent review of a finished build against its spec, design/SYSTEM.md, app-ui and secure-build — split into three lanes (code, ui, security) that the reviewer agent runs in parallel and merges into one verdict with numbered, evidence-backed findings. Never fixes anything.
argument-hint: [spec path] [Base commit: <sha>] [Round: <n>]
---

<!-- review v0.4 -->

# Review

This skill is used two ways:
- **The reviewer agent** (the orchestrator) follows "Orchestrator" at the end.
- **Each lane** (a subagent) follows "Shared rules", then ONLY its own lane,
  and returns its result in the "Lane output" format.

Inputs: the spec path, the base commit (what the build started from; if none,
use `HEAD` and say so), and the round number (1 unless given).

## Shared rules (every lane)

1. **The spec is the source of truth.** You check the build against the spec,
   never the spec against the build. When code and spec disagree, the code
   fails. Never recommend changing the spec to match the code. Doubts about
   the spec go under SPEC CONCERNS, which never affect the verdict.
2. **Verify, don't trust.** Build reports, commit messages, comments and names
   are claims, not evidence. Judge only what the code does, the tests and the
   running app.
3. **Evidence for every finding:** a test name, file and line, command output,
   or screenshot path. No evidence → it goes under UNVERIFIED, not FINDINGS.
4. **Every rule break is a numbered finding** — never a note.
5. **Written rules only.** Your taste is not a rule (→ OBSERVATIONS). Never ask
   for layout or styling in a spec — that belongs in `design/SYSTEM.md`.
6. **Reproduce before you fail something.**
7. **Change nothing.** No edits to code, tests, specs or config. Lanes may only
   write review scripts and screenshots inside `.screenshots/review/`. No git
   commands that change anything.
8. **Dev server:** use only the port you were given. Check it is free first
   (`netstat -ano | findstr :<port>` on Windows, `lsof -i :<port>` elsewhere),
   start `npm run dev -- --port <port> --strictPort` in the background, stop it
   when done and confirm the port is free.
9. **Stay in your lane.** Ignore what other lanes cover.

Read first (every lane): the spec, `CLAUDE.md`, and what changed —
`git diff --stat <base>` and `git diff <base>`. In round 2, also read the
previous review and check each earlier finding in your lane: fixed, still
open, or disputed (judge disputes on evidence).

## Lane: code

Does the build do what the spec says, without breaking what came before?

1. Read every earlier spec's "Existing behaviour that must not change" and
   `specs/ROADMAP.md`.
2. Run and record: `npm test`, `npm run lint`, `npm run build`.
3. Run check-rules from the project root:
   `npm run check -- --base <base>` if the project has a `check` script,
   otherwise `node <this skill's folder>/scripts/check-rules.mjs --base <base>`
   (this skill's folder is the base directory shown when the skill loaded,
   normally `~/.claude/skills/review`). Turn results into findings:

   | check-rules result | Finding |
   |---|---|
   | FAIL test-weakened, test-loosened, test-deleted, skipped-test | Critical — quote before/after from `git diff <base>` |
   | FAIL secret, eval | Critical |
   | FAIL focus-removed, raw-colour, raw-font-size | Major |
   | WARN test-changed | Read the diff: looser → Critical; justified by the spec → no finding |
   | WARN unsafe-html, raw-colour-in-code | Judge from the code |

   A `check-rules-ignore` mark without a real reason is a finding.
4. Make a table of every acceptance criterion, every "must not change" item
   (this spec and earlier ones) and every "Out of scope" item. Verify each:
   - a test that genuinely asserts it, including its exact condition; or
   - driving the real app with Playwright (scripts in `.screenshots/review/`);
     for logic rules, also run the logic with the criterion's own examples; or
   - reading the code (weakest — say so).
   Verdict per row: PASS / FAIL (reproduced) / UNVERIFIED. For "Out of scope",
   PASS means it was NOT built. A FAIL is a Critical finding against the code.
5. A criterion with no real test is a Minor finding.

Ignore visual design and security.

## Lane: ui

Does the UI follow `design/SYSTEM.md` and the app-ui rules?

1. Read `design/SYSTEM.md` and the app-ui skill
   (`~/.claude/skills/app-ui/SKILL.md`): banned patterns, interaction
   conventions, accessibility floor.
2. Run the project's screenshot scripts if they exist
   (`scripts/screenshot.mjs` with the seeds, `scripts/screenshot-states.mjs`),
   writing output to `.screenshots/review/`, and add your own for anything
   they miss — including tabbing through every control to see each focus
   ring. Open every PNG with the Read tool.
3. Check, with evidence:
   - **Structure** matches the SYSTEM.md "Screen structures" entry
   - **Task-first:** the most frequent task is the most prominent thing; the
     accent and loudest element belong to it
   - **Banned patterns** visible (each once; SYSTEM.md "Allowed exceptions"
     don't count)
   - **States:** default, hover, focus-visible, active, disabled; empty,
     error, loading if async; long names, many items
   - **Interaction conventions:** Enter, Escape, message placement and
     clearing, in-place confirmation, one edit at a time, focus movement
   - **Accessibility floor:** visible labels, focus ring on every control,
     hit areas (44×44px, not overlapping, 8px apart), contrast from token
     values, `prefers-reduced-motion`
4. Severity: a visible rule break or accessibility failure is Major; small
   polish issues are Minor.

Ignore spec logic and security.

## Lane: security

Could someone abuse this?

1. Load the `secure-build` skill (or read
   `~/.claude/skills/secure-build/SKILL.md`). Its nine sections are your
   checklist: 1 data access · 2 secrets · 3 input · 4 authorisation ·
   5 dependencies · 6 client trust · 7 errors and logs · 8 abuse limits ·
   9 other.
2. Read every changed file in full, plus existing code it relies on for
   security (auth helpers, middleware, database policies, API clients,
   storage helpers). Something that should exist but is missing — an
   authorisation check, a policy, server-side validation — is a finding.
3. For every new or changed dependency: `npm view <name> time.modified
   deprecated repository.url` and `npm audit --omit=dev`. If a lookup isn't
   possible, say so.
4. For each section that does not apply to this app, list it under NOT
   APPLICABLE with a one-line reason.
5. **A finding must cite a concrete exploit path** (the input, and what the
   attacker gets) **or a concrete fix** (the file, and what to add or change).
   A missing requirement counts when you can name the file where it belongs.
   Anything you cannot back that way goes under OBSERVATIONS.
6. Severity: data exposure, authorisation bypass, a leaked secret, injection
   or a vulnerable dependency → Critical. Missing hardening with no direct
   exploit (e.g. no rate limit) → Major.

Ignore style, spec fit and code quality.

## Lane output

Return exactly this — nothing else:

```
LANE: code | ui | security
SUMMARY:
- [the lane's score lines, e.g. criteria 8/8 PASS; tests 51/51; check-rules all clear;
  banned patterns 0; or security: 2 blockers, 6 sections not applicable]
FINDINGS:
1. [Critical|Major|Minor] [what is wrong, one sentence]
   Rule: [criterion, SYSTEM.md / app-ui / secure-build section, CLAUDE.md]
   Evidence: [test, file:line, command output, screenshot]
   Exploit: [security lane only: input → what the attacker gets, or "n/a"]
   Fix: [one line — change the code, never the spec]
EARLIER FINDINGS (round 2): [number — fixed / open / disputed: upheld or withdrawn]
CRITERIA TABLE (code lane): [# | criterion | verdict | evidence]
NOT APPLICABLE (security lane): [section — reason]
UNVERIFIED: [item — why]
SPEC CONCERNS: [ ]
OBSERVATIONS: [ ]
```

## Orchestrator (the reviewer agent only)

### O1. Decide the lanes
- **code** — always.
- **security** — always.
- **ui** — if the diff since the base touches styles, components, markup or
  `design/`, or the spec adds or changes anything on screen. Otherwise skip it
  and say why.

### O2. Run the lanes in parallel
Start one `general-purpose` subagent per lane, all at once, each with this
prompt (fill in the blanks; give each lane its own port: code 5199, ui 5198,
security 5197):

```
You are the <LANE> lane of an independent review. Load the `review` skill with
the Skill tool and follow ONLY "Shared rules" and "Lane: <LANE>".
Spec: <spec path>. Base commit: <sha>. Round: <n>. Port: <port>.
Previous review (round 2 only): <path or "none">.
Do not edit any project file. Return only the "Lane output" block.
```

Give the lanes nothing else — no build summary, no opinions.

If you cannot start subagents, run the lanes yourself one after another, and
say so in the report.

### O3. Merge
1. Collect every lane's FINDINGS. Anything without evidence → UNVERIFIED.
2. Remove duplicates (same file and problem): keep one, at the higher
   severity, and name both lanes.
3. Number all findings 1, 2, 3… in order of severity, tagged with their lane.

### O4. Verdict and report
- **PASS** — no Critical or Major findings in any lane
- **PASS WITH NOTES** — Minor findings only
- **FAIL** — any Critical or Major finding

Write `reviews/NNN-slug-review.md` (round 2: `-2`):

```markdown
# Review: specs/NNN-slug — [PASS | PASS WITH NOTES | FAIL]

Reviewed: [date] · review v0.4 · Base: [sha] · Round: [n]
Lanes: code ✔ · ui [✔ / skipped — why] · security ✔

## Score
- Code: [summary lines]
- UI: [summary lines]
- Security: [summary lines]

## Findings
1. **[Critical/Major/Minor]** ([lane]) [what is wrong]
   - Rule: … · Evidence: … · Exploit: … · Fix: …

## Earlier findings (round 2 only)
## Criteria table
## Security: not applicable
## Unverified
## Spec concerns (do not affect the verdict)
## Observations (not findings)
```

Return a short summary to whoever called you: the verdict, the score lines,
and the findings (one line each). Do not offer to fix anything.