# 2026-01-08 — Attestations Records — R&D Log

## Goal
- Validate MVP quality gates and demo flow.
- Make the dev UI reachable from other machines on the network.

## Context
- Working inside `/Users/christopher/CascadeProjects/windsurf-project` on the Recording Integrity API MVP.
- User reported browser could not reach `localhost` while dev servers were running in another session.
- Need to keep dev ergonomics for remote access without changing API behavior.

## Hypotheses / Assumptions
- Binding Next.js dev/start to `0.0.0.0` will allow access from non-localhost clients.
- API already binds to `0.0.0.0` and does not need changes.
- Lint/test/typecheck/demo runs are already green; changes should not regress.

## Work performed
- Files changed:
  - `apps/web/package.json` — bind Next dev/start to `0.0.0.0` for network access.
- Key actions:
  - Ran `npm test`, `npm run lint`, `npm run typecheck`, `npm run demo` to confirm quality gates.
  - Started dev servers via `npm run dev`, probed `http://localhost:3000` and `http://localhost:3001/api/v1/health` with curl.
  - Stopped dev servers using `pkill` after `concurrently` session ended.

## Decisions
- Decision: Bind Next.js dev/start to `0.0.0.0` in `apps/web/package.json`.
  - Rationale: `localhost` only works on the host machine; binding to all interfaces enables remote access.
  - Alternatives considered: keep `localhost` and require SSH port-forwarding or local-only access.

## Evidence / Results
- Tests/commands run:
  - `npm test`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run demo`
  - `npm run dev`
  - `curl -i http://localhost:3000`
  - `curl -i http://localhost:3001/api/v1/health`
- Outputs / observations:
  - Tests passed; lint produced a warning about TypeScript 5.9.3 being newer than `@typescript-eslint` support.
  - Demo run produced 50 verifications, ALLOW/FLAG/BLOCK distribution, and 5 anchors confirmed.
  - `curl` returned HTTP 200 for the Next.js page and API health when servers were running.
- Failures / errors (if any):
  - `curl` failed to connect before the dev servers were restarted.
  - Concurrent dev session became unreachable from the CLI, requiring `pkill` to stop.

## Environment / Tooling notes
- Next.js dev output indicated it auto-adjusted `tsconfig` settings on first run.
- The workspace shows many untracked files in `apps/` and `packages/` (likely initial project state).

## Risks / Open questions
- Remote browser access still unverified by the user after binding to `0.0.0.0`.
- TypeScript version warning might mask eslint parser incompatibilities.
- Large untracked baseline could complicate diff reviews or future commits.

## Next steps
1. Confirm web UI reachability via `http://<host-ip>:3000` from the user’s browser.
2. Decide whether to pin TypeScript to a supported version for eslint.
3. Review untracked baseline and decide what should be committed.

## Links
- Branch: master
- Related commits/PRs (if any): none
- Relevant docs/ADRs:
