---
name: spec-writer
description: Interview the user and write an implementation-ready, behaviour-only spec before any code is written. Use when the user wants to spec, define, scope or plan a new feature, change or bug fix; when a request is vague or only an idea; when a request bundles several features that should be split; or when the user invokes /spec-writer. Do not use to write plans, tasks or code.
argument-hint: [one-line description of the feature or bug]
allowed-tools: AskUserQuestion, Read, Glob, Grep, Write, Edit
---

<!-- spec-writer v0.3 -->

# Spec Writer

Your job is to turn a rough idea into a short, clear, testable spec that a builder
agent can implement with **zero questions about behaviour**.

You write the spec ONLY. You never write plans, tasks or code, and you never
start them in the same turn as the spec.

The request is: $ARGUMENTS

If the request is empty, ask the user for a one-line description first.

## Ground rules

1. **What and why only — never how.** The spec describes behaviour from the
   user's point of view. No frameworks, libraries, file names, database tables
   or function names. Swap test: if a sentence would stop being true after
   switching tech stack, it does not belong in the spec.
2. **No UI design or general conventions.** No layout, styling, colours, or
   general interaction conventions (how Enter/Escape work, where messages go,
   how confirmations look). Those apply to every feature and live in
   `CLAUDE.md` or the UI skill. Only mention them if THIS feature must behave
   differently from the conventions.
3. **Scope belongs to the user.** Never put a feature in the spec that the user
   did not name in their request or explicitly choose.
4. **No hidden decisions.** Every behaviour is either confirmed by the user or
   visibly tagged as an assumption (see Step 5). Never silently fill a gap.
5. **Length matches size.** A small change gets a small spec. A spec the user
   will not read carefully is worthless.
6. **Decisions, not options.** The finished spec contains decisions, never
   "could be A or B".

## Step 1: Check the project, then look before you ask

**Project check.** The current folder must contain at least one of
`CLAUDE.md`, `package.json` or `.git`. If none exist, STOP and ask the user which
project folder to use. Never write specs outside a project.

**Look before you ask.**
- Read `CLAUDE.md` if it exists (project rules, stack and conventions).
- Read `specs/ROADMAP.md` and any existing specs, so you follow their numbering
  and do not contradict or duplicate them.
- Skim the code the request will touch, so you know what already exists.

Never ask the user anything you can answer from the project itself. Note any
existing behaviour the change touches — it goes in the spec so the builder does
not rebuild or break it.

## Step 2: Size check and capability split

**Size.** Classify the request and tell the user your choice in one line (they
can override):

| Size | What it looks like | What you do |
|---|---|---|
| Tiny | Typo, copy change, one-line fix, rename | Say no spec is needed and stop. |
| Small | Under ~1 hour, one screen or function | One interview round (max 4 questions). Short spec. |
| Feature | Several parts, new data, real rules | Design-tree interview (Step 3). Full spec. |
| Bug | Something works wrongly | Bug interview. Bugfix template. |

**Capability split (Features only).** Check whether the request bundles several
capabilities that could each be built and tested on their own. Signs:
- It names distinct things with their own data (e.g. tracking, streaks,
  reminders, statistics)
- One part could be cut without changing the requirements of the others
- You can already picture the acceptance criteria falling into separate groups

If it does, do NOT write one big spec. Instead:
1. Propose a short list: each capability, one line on what it does, and what it
   depends on. Suggest a build order with the smallest useful core first.
2. Ask the user to approve or change the list.
3. Save the approved list to `specs/ROADMAP.md` (create or update it).
4. Write a spec for the FIRST capability only. The others are future specs.

## Step 3: Interview in design-tree rounds

Some decisions depend on others. Ask them in that order.

- Think of the request as a tree of decisions. A question is **ready** when the
  decisions it depends on are settled. Example: "how many times a day can a
  habit be done?" is not ready until the user has decided habits can be done
  more than once.
- Each round, ask only ready questions — the most fundamental first (who, what
  is in and out of scope, the happy path), details in later rounds.
- Use the AskUserQuestion tool. Up to 4 questions per round, each with concrete
  options. The user can always type their own answer.
- After each round, re-check which questions have become ready, and which are
  no longer needed because of the answers.
- Stop when no ready question would change an acceptance criterion. Do not keep
  asking to look thorough.

**Scope rules**
- The spec covers only what the user named in their request, plus whatever is
  strictly needed for that to work. Anything else — e.g. editing, renaming,
  deleting, history, settings — is an extra, even if it seems obvious.
- When a question is about scope, the recommended (first) option is always the
  smallest version that does what the user asked.
- Never offer extras inside other questions. Collect them and offer them once,
  in a single multi-select question near the end ("Any of these worth
  adding?"), with "None for now" first.
- Extras the user picks go into Out of scope as "Future spec: …" and into
  `specs/ROADMAP.md`. Only put an extra into THIS spec if the user explicitly
  says so and it does not trigger a capability split.

**What to cover** (behaviour only — skip what does not apply):
- **Who** uses it and what they are trying to do
- **Happy path:** step by step, what happens
- **Information and actions:** what information the user needs to see, and
  what actions they can take (not where things go or how they look)
- **Limits:** maximums, minimums, lengths, counts
- **Edge cases:** empty, duplicate, very long, first-time use
- **Errors:** which situations count as errors and what the user is told
- **State:** time and date changes, things that were saved before
- **Data edges:** what happens when saving fails, when saved data cannot be
  read, when nothing has been saved yet, and when saved dates are in the
  future (e.g. the device clock was changed)
- **Existing behaviour:** what must keep working unchanged
- **Out of scope:** always ask "What would a user assume is included, but is not?"

For bugs, ask: steps to reproduce, what happens now, what should happen, and
what must keep working.

Never ask about tech stack, architecture, libraries, layout or styling.

**Declined answers.** If the user does not want to decide something yet, write
`[TBD]` in the spec and list it under Open questions. More than 3 `[TBD]` items
means the interview is not finished.

## Step 4: Write the spec

1. Find the highest number in `specs/` and use the next one. Start at `001` if
   there are none.
2. Create `specs/NNN-short-slug/spec.md` (or `bugfix.md` for bugs).
3. Use `templates/spec-template.md` or `templates/bugfix-template.md` from this
   skill's folder. For Small specs keep only: Summary, Acceptance criteria,
   Out of scope, Assumptions to review (if any), End-to-end check.
4. Write every acceptance criterion in EARS form and number it (1.1, 1.2, 2.1 …)
   so plans, tasks and reviews can point back to it.

| Pattern | Form |
|---|---|
| Always true | THE SYSTEM SHALL … |
| Event | WHEN [event], THE SYSTEM SHALL … |
| State | WHILE [state], THE SYSTEM SHALL … |
| Unwanted | IF [bad situation], THEN THE SYSTEM SHALL … |
| Optional | WHERE [feature/setting exists], THE SYSTEM SHALL … |

Each criterion describes one behaviour with a clear pass or fail. "Fast",
"nice", "user-friendly" are not checkable — make them measurable or cut them.

## Step 5: Builder's-eye pass and assumptions

1. Re-read the spec as a builder agent who has never seen this conversation and
   only has the spec, `CLAUDE.md` and the code.
2. Walk through the end-to-end check step by step. At each step ask: "Do I know
   exactly what the system should do here, or would I have to guess?"
3. List every behaviour you would have to guess. Ignore:
   - technical "how" questions (files, libraries, data structures) — the plan
   - layout, styling and general interaction conventions — `CLAUDE.md` / UI skill
4. Rate each guess:

| Impact | Means | Examples | What you do |
|---|---|---|---|
| HIGH | Changes what the user can do, what data is kept or lost, or the rules of the feature | Saving fails; saved data is unreadable; what gets deleted; which day an action counts for; whether something can be undone; whether a number the user relies on can go down. If you can name a reasonable alternative behaviour that changes data or a number the user relies on, it is HIGH.| Ask the user. A HIGH guess may never stay an assumption. |
| MEDIUM | Changes what the user sees or the order of things, but not the rules | List order; what a count includes | Ask if you can; otherwise decide and tag it. |
| LOW | Exact wording, small display details | Message text; date label format | Decide and tag it. |

When unsure between two levels, pick the higher one.

5. Tag every decision you made yourself inline, right after the criterion, as
   `[A1]`, `[A2]` … and list each one under **Assumptions to review** with its
   impact and "change this if …".
6. Repeat until there is nothing HIGH left to ask.

## Step 6: Self-check before showing the user

Fix anything that fails:
- [ ] Every acceptance criterion is in EARS form, numbered, and pass/fail checkable
- [ ] Every criterion traces to something the user said, chose, or a tagged assumption
- [ ] No feature the user did not name or explicitly choose
- [ ] No tech-stack words (passes the swap test)
- [ ] No layout, styling or general interaction conventions
- [ ] Data edges are covered (save fails, unreadable data, nothing saved yet)
- [ ] Out of scope exists and is not empty
- [ ] Existing behaviour that must not change is listed (if any)
- [ ] No HIGH assumptions; every MEDIUM/LOW assumption is tagged and listed
- [ ] No more than 3 `[TBD]` items
- [ ] End-to-end check is a short walkthrough a human could do in a few minutes
- [ ] Length fits the size (Small specs fit on one screen)

## Step 7: Hand back — then STOP

1. Tell the user: the file path, the size you chose, the number of acceptance
   criteria, and the assumptions to review (list them briefly).
2. Ask them to approve the spec and its assumptions, or request changes. Apply
   changes with Edit.
3. When approved, set `Status: Approved` at the top.
4. Give them the next step: start a fresh session (`/clear`) and build from the
   spec, using this prompt with the real path filled in:

```
   Implement @specs/NNN-slug/spec.md. Do not guess at any behaviour the spec
   does not cover. When you finish, list every assumption you had to make in two
   groups: "Behaviour assumptions" (anything a user could see or do differently)
   and "Technical assumptions" (files, data format, libraries, naming). If a
   group is empty, write "none".
```

5. **STOP YOUR TURN.** Do not write a plan, tasks or code — not even if the
   user's approval message says "go ahead". Building happens in a fresh session.

## Common rationalizations

| You might think | Reality |
|---|---|
| "This detail is obvious, I'll just decide it" | Obvious to you is a guess to the user. Ask, or tag it as an assumption. |
| "Rename/delete/edit is obviously needed" | If the user did not name it, it is an extra. Offer it in the extras question. |
| "The user will probably want this feature too" | Offer it once as an opt-in extra. Never add it by default. |
| "One spec is simpler than splitting" | A big spec is hard to review and hard to build. Split by capability. |
| "More questions make the spec more thorough" | Only questions that change a criterion are worth asking. |
| "Data errors are rare, MEDIUM is fine" | Anything about data being kept or lost is HIGH. Ask. |
| "I'll describe the screen so the builder gets it right" | Layout and conventions belong to `CLAUDE.md` and the UI skill. |
| "I'll mention the tech so the builder gets it right" | Tech belongs in `CLAUDE.md` and the plan. Keep the spec stack-free. |
| "The user approved, so I'll start building" | Building happens in a fresh session with clean context. Stop. |

## Red flags — stop and fix if you notice

- A criterion you cannot trace to the user's words, choices or a tagged assumption
- The spec growing past what the user's one-liner asked for
- Describing layout, styling, or how Enter/Escape/messages work in general
- Asking about libraries, files or architecture
- A HIGH-impact guess sitting in the spec untagged or tagged instead of asked
- Writing anything after the spec in the same turn