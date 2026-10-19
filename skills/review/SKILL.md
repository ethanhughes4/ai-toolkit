---
name: review
description: Independent review of a finished build against its spec, design/SYSTEM.md, app-ui, secure-build and testing. Four lanes (code, tests, ui, security) that the reviewer agent runs and merges into one verdict, with evidence-backed findings grouped by root cause. Never fixes anything.
argument-hint: [spec path] [Base commit: <sha>] [Round: <n>]
---

<!-- review v1.0 -->

# Review

- **The reviewer agent** follows "Orchestrator" at the end.
- **Each lane** follows "Shared rules", then only its own lane, and returns
  the "Lane output" block.

Inputs: spec path, base commit (none → `HEAD`, say so), round (default 1),
and possibly "approach changed this round".

## Shared rules
1. **The spec is the truth.** Code that disagrees with it fails. Never suggest
   changing the spec; doubts go under SPEC CONCERNS (no effect on the verdict).
2. **Verify, don't trust.** Reports, comments and names are claims. Judge only
   the code, the tests and the running app.
3. **Evidence, reproduced.** Every finding has evidence (test, file:line,
   command output, surviving mutant, screenshot) and was reproduced. No
   evidence → UNVERIFIED.
4. **Only what matters.** A finding affects correctness, security, or
   something the spec, SYSTEM.md, CLAUDE.md or a skill requires. Taste, extra
   hardening the spec doesn't ask for, and cases that can't happen in this app
   → OBSERVATIONS.
5. **Known limits** in the spec are accepted. Raise one only if the change
   makes it worse or its revisit condition is met.
6. **Root cause.** Say *why* each finding happened, in one sentence. Findings
   with the same cause use the same sentence, and the fix addresses the cause.
   In round 2+, mark a finding **REPEAT AREA** if an earlier round flagged the
   same file or behaviour.
7. **Change nothing.** Lanes write only scripts and screenshots in
   `.screenshots/review/` and mutation reports. No git commands that change
   anything.
8. **The app:** only your port; check it's free first; start the dev command
   on it (`-- --port <port> --strictPort`, or `PORT`; CLAUDE.md says which);
   stop everything you started and confirm the port is free.
9. **Stay in your lane.**

**Read first:** the spec, `CLAUDE.md`, `docs/ARCHITECTURE.md` (where the app
runs, who can reach it), and `git diff <base>`. Round 2+: the previous
reviews; mark each earlier finding in your lane fixed, open or disputed. If
the approach changed, judge the new approach on its own.

## Lane: code
Does it do what the spec says, without breaking earlier specs?
1. Run: type check, lint, `npm test`, `npm run build`, `npm run test:e2e`.
   A failing end-to-end test is **Critical**, even if the cause is outside the
   diff. A test that fails only sometimes: re-run it alone and say whether the
   code or the test is unreliable.
2. Table every acceptance criterion, every "must not change" item (all specs)
   and every "Out of scope" item: PASS / FAIL / UNVERIFIED, with the evidence
   (a real test, driving the app with Playwright, or reading the code, which
   is weakest). Out of scope PASS = not built. A FAIL is **Critical**.

## Lane: tests
Would these tests catch a bug? Load the `testing` skill; it is your rulebook.
1. **check-rules** (`npm run check -- --base <base>`, or this skill's
   `scripts/check-rules.mjs --base <base>`): test-weakened, loosened, deleted
   or skipped → **Critical** (unless a `check-rules-ignore: test-change`
   reason says the approach was replaced and the behaviour tests remain);
   secret or eval → **Critical**; focus-removed or raw-colour/font → **Major**;
   test-changed → read the diff and judge. An ignore mark without a real
   reason is a finding.
2. **Mutation testing** as the `testing` skill says. Below 80% → **Major**.
   A survivor in code a criterion depends on → **Critical** if the criterion
   could break with every test still passing, otherwise Major. Wrong
   equivalent-mutant reasons, files excluded that aren't entry points or
   screens, and logic sitting in excluded files → **Major**.
3. **Every new or changed test** against the skill's "signs of a test written
   just to pass" → **Major** each (**Critical** if it hides a broken criterion).
4. **Coverage:** a criterion, or security/data behaviour, with no real test →
   Major. An End-to-end check step that could be automated but isn't →
   Major. An earlier spec's end-to-end test weakened or deleted → Critical.
5. **Test first:** a missing red → green record in the trace → Minor.

## Lane: ui
Does it follow `design/SYSTEM.md` and `app-ui`?
1. Read both. Run the project's screenshot scripts into `.screenshots/review/`
   and add your own for anything missed, including tabbing through every
   control. Open every PNG.
2. Check the structure against SYSTEM.md "Screen structures", and the
   task-first rule, banned patterns, states, interaction conventions and
   accessibility floor exactly as `app-ui` defines them.
3. A visible rule break or accessibility failure → **Major**; polish →
   Minor. A spacing or tap problem seen only in an emulator → at most Major,
   "check on a real device".

## Lane: security
Could someone abuse this? Load `secure-build`; its nine sections are your
checklist.
1. Read every changed file in full, plus the security code it relies on.
   Something missing that should exist (an authorisation check, server-side
   validation) is a finding.
2. New or changed dependency: `npm view <name> time.modified deprecated
   repository.url` and `npm audit --omit=dev`.
3. Each finding needs a concrete **exploit** (input → what the attacker gets)
   or a concrete **fix** (file → what to change). Otherwise → OBSERVATIONS.
4. Judge abuse limits by the outcome the spec states, not the method used.
5. **Hand-built security code** (logins, sessions, passwords, rate limits,
   reading or cleaning uploads, crypto) that has a finding: name the library
   in the fix and recommend REPLACE.
6. **Rate by real exposure** from ARCHITECTURE.md, and say which you assumed.
   Critical = usable by someone who can reach the app (data exposure,
   authorisation bypass, leaked secret, injection, vulnerable dependency).
   Major = missing hardening with no direct exploit, or a Critical-type issue
   the architecture says no attacker can reach.
7. List sections that don't apply under NOT APPLICABLE, with a reason.

## Lane output
```
LANE: code | tests | ui | security
SUMMARY: [score lines, e.g. criteria 8/8 · e2e 4/4 · mutation api.ts 86% · exposure: home network]
FINDINGS:
1. [Critical|Major|Minor] [what is wrong] [REPEAT AREA]
   Root cause: … · Rule: … · Evidence: … · Exploit (security only): … · Fix: …
EARLIER FINDINGS (round 2+): [n: fixed / open / disputed]
CRITERIA TABLE (code): [# | criterion | verdict | evidence]
NOT APPLICABLE (security): [section: reason]
UNVERIFIED · SPEC CONCERNS · OBSERVATIONS: [ ]
```

## Orchestrator (reviewer agent only)

**O1. Lanes.** Round 1: code, tests, security, plus ui if the diff touches
screens, styles or `design/`, or the spec changes anything on screen.
Round 2+: code and tests, plus lanes with Critical/Major last round, plus any
lane covering a replaced area. Say which you skipped and why.

**O2. Run.** Start code, ui and security together as `general-purpose`
subagents with **model: opus** (ports 5199, 5198, 5197). When all have
returned, start **tests** alone (port 5196), so mutation runs never compete
with end-to-end runs for memory. Prompt:

```
You are the <LANE> lane of an independent review. Load the `review` skill and
follow ONLY "Shared rules" and "Lane: <LANE>".
Spec: <path>. Base commit: <sha>. Round: <n>. Port: <port>.
Previous reviews: <paths or "none">. Approach changed this round: <what or "no">.
Edit no project file. Return only the "Lane output" block.
```

Nothing else: no build summary, no opinions. Wait for every lane. Can't start
subagents → run the lanes yourself in turn and say so.

**O3. Merge.** Evidence-less → UNVERIFIED. Merge duplicates at the higher
severity. Number by severity, tagged by lane. **Group by root cause**, and for
each recommend **PATCH** (local, small) or **REPLACE** (the approach is the
cause: a REPEAT AREA, hand-built code a library does, or 3+ Critical/Major
findings sharing it), naming the replacement.

**O4. Verdict.** PASS = no Critical/Major · PASS WITH NOTES = Minor only ·
FAIL = any Critical/Major. Write `reviews/NNN-slug-review.md` (round 2+:
`-<round>`):

```markdown
# Review: specs/NNN-slug — [PASS | PASS WITH NOTES | FAIL]
Reviewed: [date] · review v1.0 · Base: [sha] · Round: [n] · Approach changed: [what / no]
Lanes: code · tests · ui · security [✔ or skipped: why] · Critical+Major: [n]

## Root causes
1. [cause] — findings [n, n] — **PATCH | REPLACE**: [what to do] [REPEAT AREA]

## Score
## Findings
## Earlier findings (round 2+)
## Criteria table
## Security: not applicable
## Unverified · Spec concerns · Observations
```

Return to the caller: the verdict, the root causes with PATCH/REPLACE, and one
line per finding. Don't offer to fix anything.