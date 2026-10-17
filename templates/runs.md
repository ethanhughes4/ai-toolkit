# Run log

<!-- Copy into a test project as notes/runs.md.
     After every spec + build, add an entry at the top.
     Every "What went wrong" line is a future eval case. -->

## Run 001 — [YYYY-MM-DD] — specs/001-[slug]

**Pieces used:** spec-writer v[0.1] · builder: [plain Claude Code | builder agent v0.x] · reviewer: [none | reviewer v0.x]

**Request (as typed):** "[the one-liner you gave the spec-writer]"

**Spec-writer**
- Size it chose: [Tiny | Small | Feature | Bug] — correct? [yes / no, should have been ...]
- Questions asked: [number] — any useless ones? [...]
- Any padded/invented criteria? [...]
- Any tech-stack words leaked in? [...]
- Edits I had to make by hand: [...]

**Build**
- Assumptions the builder listed: [number] — each one is a spec gap:
  - [assumption] → [should the spec-writer have asked about this? yes / no]
- Criteria met: [x / y]
- Built things that were out of scope? [...]
- Ignored criteria: [...]

**What went wrong → which piece → what I changed**
- [problem] → [spec-writer | builder | reviewer | my CLAUDE.md | me] → [fix, e.g. "added rule X to SKILL.md step 3"]

---