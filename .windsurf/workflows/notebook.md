---
description: notes
---
# notebook
Description: Write an R&D lab-notebook entry for the current session (Attestations Records). Create the file if missing, otherwise append.

1) Determine today’s date in local time and set:
   - DATE = YYYY-MM-DD
   - TOPIC = "attestations-records"

2) Collect “what happened” from the workspace (keep it scoped to THIS project folder):
   - Determine the repo root and current folder:
     - `git rev-parse --show-toplevel`
     - `pwd`
   - Capture change summary **limited to the current folder** (pathspec `.`):
     - `git status --porcelain=v1 --untracked-files=normal -- .`
     - `git diff --name-only -- .`
     - `git diff --stat -- .`
   - If git output includes files outside this project folder (e.g., `Documents/`, `Desktop/`, `Library/`, `Projects/` unrelated):
     - Record it as an environment/config issue in the notebook (likely git repo initialized too high, e.g., at `$HOME`).
     - Do NOT list thousands of unrelated untracked files; summarize the problem and list only the relevant changed files within this folder.
   - Note any commands run (best-effort from terminal history / what user pasted).
   - Capture key decisions and the rationale (why we did it this way).
   - Capture any hypotheses/assumptions being tested (even if informal).
   - Capture evidence/results (tests run, outputs observed, errors encountered).
   - Capture risks/open questions.
   - Capture next concrete steps (small, verifiable actions).

3) Write to a notebook file:
   - Path: docs/lab-notebook/DATE-TOPIC.md
   - If the folder doesn’t exist, create it.
   - If the file exists, append a new entry separated by a horizontal rule.

4) Notebook entry format (must follow exactly):

# DATE — Attestations Records — R&D Log

## Goal
(1–3 bullets)

## Context
(2–6 bullets: what area of the system / why now)

## Hypotheses / Assumptions
(bullets; include “unknowns” explicitly)

## Work performed
- Files changed:
  - (list files + 1-line purpose each)
- Key actions:
  - (bullets)

## Decisions
- Decision:
  - Rationale:
  - Alternatives considered:

## Evidence / Results
- Tests/commands run:
- Outputs / observations:
- Failures / errors (if any):

## Environment / Tooling notes
(bullets; include shell errors, permission warnings, mis-scoped git roots, etc.)

## Risks / Open questions
(bullets)

## Next steps
(ordered checklist)

## Links
- Branch:
- Related commits/PRs (if any):
- Relevant docs/ADRs: