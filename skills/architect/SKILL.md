---
name: architect
description: Use when starting a new project, or when an existing project needs a big technical decision such as payments, file uploads or a new integration. Turns the idea and the client's discovery notes into docs/ARCHITECTURE.md with options, trade-offs and the user's choices.
---
<!-- architect v0.2 -->

# Architect

Turn what the client said into technical decisions. The user makes the decisions; you lay out the options and recommend one. Everything is written down with the reasons. No code.

## When to use
- A new project, before any setup or specs.
- An existing project needs a new technical piece. Add to the existing file; don't rewrite it.

Not for: feature behaviour (that's spec-writer) or look and feel (that's app-ui).

## Inputs
- The idea
- Discovery notes: what the client or users said, in their words
- Constraints: budget, where it runs, devices, deadlines
- What the user already knows (languages, frameworks, cloud)

If there are no discovery notes, ask for them once. If the user has none, carry on and write "No discovery notes; decisions based on the idea only." at the top of the file.

## Steps

1. **Read** CLAUDE.md, docs/ARCHITECTURE.md and specs/ROADMAP.md if they exist. If ARCHITECTURE.md already exists, only work on the new decisions.

2. **Find what drives the tech.** From the idea and the notes, list:
   - where it runs: only on the user's own machine or local network, or online. Ask if it's not clear. Don't assume online.
   - who uses it, and on what devices
   - accounts, or no accounts
   - which data is private, shared within a group, or public
   - anything that must update live on several screens
   - files or photos
   - outside systems or APIs
   - rough number of users
   - budget

   Show this list to the user and fix anything you misread before deciding anything.

3. **List the decisions needed.** Use this set and skip any that don't apply: frontend; backend and database; identity and logins; data access rules; live updates; file storage; outside integrations; hosting and deployment; tests and CI; secrets.

4. **Offer options.** For each decision:
   - 2 options, 3 at most
   - the trade-offs in plain words
   - your recommendation, with the reason tied to a requirement or constraint from step 2

   Prefer what the user already knows, managed services over self-built for a small team when it runs online, free tiers when there's no budget, and the fewest moving parts.

   Ask with AskUserQuestion, at most 4 decisions per round, with the recommended option first. If AskUserQuestion isn't available (subagent or headless), choose the recommendation and mark the row [A] as an assumption.

5. **Risks.** Ask: what must a user never see, change or do? Walk through:
   - data one user must never see (other users' data, answers or results before they're meant to be shown, admin pages)
   - values the client device must never be trusted to send (scores, prices, roles, who did something, times)
   - actions that need limits (sign-ups, joins, uploads, messages)
   - files: allowed types, maximum size, and file names that give away information
   - secrets and where they live
   - what happens when an outside service is down

   Write each risk with the decision that handles it. Then add the 3 things most likely to go wrong when running or deploying it.

6. **Swap points.** List every outside service (database, file storage, live updates, auth, outside APIs). Each one sits behind its own module, so it can be swapped later without touching the rest of the app.

7. **Write docs/ARCHITECTURE.md** in the format below.

8. **Self-check:**
   - Every decision has a Why tied to a requirement.
   - Every rejected option has a reason.
   - Every risk says how it's handled.
   - Every outside service is listed under Swap points.
   - There's no feature behaviour (that belongs in specs) and no code.
   - There are no secret values.

9. **Hand over.** For a new project, say "Architecture written. Next: /project-setup". For an existing project, say "Next: /spec-writer". Then STOP.

## Format

```markdown
# Architecture
<!-- written by architect v0.2 -->

## What drives the tech
- ...

## Decisions
| Decision | Choice | Why | Rejected (and why) |
|---|---|---|---|

## Risks
| Risk | How it's handled |
|---|---|

## Swap points
| Module | Now | Could swap to |
|---|---|---|

## Running and deployment
- Where it runs, how to start it, the env var names it needs (names only, never values)
- Most likely problems: ...

## Changes
- YYYY-MM-DD: <decision added or changed, and why>
```

## Rules
- The user decides. You recommend.
- Local first is a valid choice. Don't add online services the user didn't ask for.
- Never put secret values in the file.
- Keep it to about one page.
- When a decision changes later, update its row and add a Changes line. Don't delete history.
- Don't hand-build security mechanisms (logins, lockouts, rate limits, sessions) when something simpler fits: restrict by network (for example, admin only reachable from the machine itself), a well-known library, or a managed login provider. Hand-built ones go in Risks as high risk.

## Red flags
- Choosing tech the user didn't approve
- Assuming it runs online without asking
- More than 3 options for one decision
- "Industry standard" as the only reason
- Adding services "for later"
- A risk with no "how it's handled"