---
name: secure-build
description: Security rules to follow while building any app — data access, secrets, input validation, authorisation, dependencies, client trust, errors and logs, rate limits, injection. Use whenever you write or change code, especially anything touching users, data, servers, APIs, auth, files or packages.
---

<!-- secure-build v0.1 -->

# Secure build

Build every feature as if someone will try to abuse it. Security is decided
while you build, not added after. Each section says when it applies — skip
sections the app does not have, and say so in your report.

Assume the user can change anything in their browser: requests, local
storage, hidden fields, the JavaScript itself.

## 1. Data access (applies when there is a database or stored user data)
- Every table holding user or tenant data has row-level security on, with a
  policy for each operation used (select, insert, update, delete).
- Policies tie rows to the signed-in user or their organisation
  (e.g. `auth.uid() = user_id`) — never `USING (true)`.
- Insert and update policies have `WITH CHECK`, so nobody can write rows
  owned by someone else.
- Every new table or migration ships with its policies in the same change.
- No row-level security available? Then every server query filters by the
  current user's id or organisation.

## 2. Secrets (always)
- No keys, tokens, passwords or connection strings in code, config, tests,
  fixtures or logs. They live in environment variables.
- Public env variables (`VITE_*`, `NEXT_PUBLIC_*`, `PUBLIC_*`, `REACT_APP_*`,
  `EXPO_PUBLIC_*`) only hold values anyone may see.
- Privileged keys (service-role, payment, AI provider) are used only in server
  code. Third-party calls that need them go through the backend.
- `.env` files are in `.gitignore`; `.env.example` has no real values.

## 3. Input (always)
- Every server entry point (route, action, webhook, form handler, job,
  upload) validates input against a schema on the server (zod, valibot,
  pydantic): types, required fields, lengths, ranges, formats, allowed values.
  Client-side validation is for convenience only.
- Unknown fields are stripped or rejected, so users cannot set `role`,
  `owner_id` or `price` by adding them to a request.
- Database access uses parameterised queries or the query builder — never
  string-built SQL.
- User content is escaped when shown. Raw HTML (`dangerouslySetInnerHTML`,
  `v-html`, `innerHTML`) only through a sanitiser.
- Data read back from local storage, files or other systems is parsed safely
  and checked before use — never trusted to have the right shape.
- File uploads check type, size and name, and are stored privately.
- Webhooks verify the sender's signature.

## 4. Authorisation (applies when there are accounts, roles or shared data)
- Every server route and action that reads or changes data checks, on the
  server, that the current user may act on **that specific record**. Being
  signed in is not enough — changing an id must not reach someone else's data.
- Roles and permissions come from the server or database, never from
  something the client sends or stores.
- Protected pages are protected by their data calls, not just by hiding
  buttons or redirecting in the browser.
- Use a proven auth library or provider — never hand-rolled login, password
  hashing or session handling. Tokens in httpOnly, secure cookies where
  possible; sessions expire; sign-out ends the session.

## 5. Dependencies (applies whenever you add or change a package)
Before adding a package:
- It is the real, widely used package — check the exact name (typosquatting).
- It is maintained: `npm view <name> time.modified deprecated repository.url`
  shows a release in the last 12 months and no deprecation.
- It is needed — don't add a large package for something small. Ask the user
  first if `CLAUDE.md` says so.
- After adding: `npm audit --omit=dev` shows no high or critical issues. The
  lock file is committed.
Record every new package and why in your report.

## 6. Client trust (applies when the client affects anything that matters)
- Prices, totals, quantities, balances, scores, limits and deadlines are
  calculated or checked on the server.
- Status changes (paid, approved, booked, completed) only happen through
  server logic that checks the current state and the user's right.
- Feature flags, plan limits and access tiers are enforced on the server.
- Repeating a request cannot double-apply an action (idempotency keys or
  state checks).

## 7. Errors and logs (always)
- Users see plain, generic error messages — no stack traces, SQL errors, file
  paths, internal ids or versions.
- Sign-in, sign-up and reset never reveal whether an account exists.
- Logs never contain passwords, tokens, keys, card or ID numbers, or other
  personal data.
- Unexpected errors fail closed — an error never grants access.

## 8. Abuse limits (applies when there is a server)
- Rate limits on sign-in, sign-up, password reset, codes, contact and invite
  forms, anything that sends email or SMS, search, uploads, and anything that
  calls a paid API (including AI models).
- Keyed on user id, account, or IP from a trusted proxy — never a header the
  client can set.
- Size and time limits on expensive work (page sizes, upload sizes, timeouts).

## 9. Other (always)
- No `eval`, `new Function`, or unsafe deserialisation.
- No shell commands, file paths or redirects built from user input without
  strict allow-lists.
- Outbound requests only to known hosts (no user-controlled URLs → SSRF).

## Report
List which sections applied, which did not (and why), and every security
decision you made — so the review's security lane can check them.