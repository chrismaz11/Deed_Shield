# 2026-01-10 — Attestations Records — R&D Log

## Goal
- Align receipt issuance with binding modes and flags (attested/text_match/none) and surface results consistently in verify/demo.
- Add anchor status surface without breaking existing verification/revocation semantics.
- Smoke test PASS/FLAG and revoke flows end-to-end.

## Context
- Working in /Users/christopher/CascadeProjects/windsurf-project on Deed Shield receipt/verify/demo flow.
- Added policy-based receipt issuance, binding evidence, and demo UI changes; verified against local SQLite + issuer keys.
- Anchor RPC status introduced for network-agnostic anchoring readiness (Sepolia default).

## Hypotheses / Assumptions
- Binding confirmation should gate PASS; missing confirmations/metadata should FLAG.
- text_match mode may fail on non-PDF/text-light files; failure should FLAG, not crash.
- Anchoring RPC may be unreachable; should return clear 502 error without impacting verify/revoke.

## Work performed
- Files changed:
  - src/api/receipt.js — add binding modes, operator confirmation, policy v0.3 fields, text_match guard, flags.
  - src/lib/policy.js — policy evaluation for missing fields/binding modes.
  - src/api/verify.js — return result/flags/contentBindingMode, add receipt status + anchor status endpoints, demo UI updates.
  - src/lib/vc-jwt.js — allow flagged receipt subjects while keeping core hash checks.
  - package.json — add pdf-parse (lazy), ethers; deps install.
  - docs/demo.md — scripted PASS/FLAG/revoke scenarios and binding mode notes.
  - .gitignore, scripts/ingest-csv.js — minor env/key path alignment.
- Key actions:
  - Re-init DB, regenerate keys, seed issuer, start server on PORT=3001.
  - Issued receipts in attested mode with checkbox unchecked (FLAG) and checked (PASS); verified JWTs.
  - Revoked PASS JWT and confirmed verify -> 409.
  - Tried text_match against README (non-PDF text) → FLAG text_extraction_failed; verify returns FLAG.
  - Queried anchor status; returns 502 anchor_rpc_unreachable_or_incompatible (no reachable RPC set).

## Decisions
- Decision: Require operator confirmation for attested binding; treat missing confirmation as FLAG.
  - Rationale: Prevent silent PASS when operator hasn’t attested to metadata accuracy.
  - Alternatives considered: Auto-PASS on attested regardless of confirmation (rejected), hard-fail 400 (too strict vs FLAG).
- Decision: text_match uses optional pdf-parse, flagging on failure instead of throwing.
  - Rationale: Keep core flow resilient without mandatory heavy deps; degrade to FLAG.
  - Alternatives considered: Disallow text_match if parser missing (rejected for usability).

## Evidence / Results
- Tests/commands run:
  - npm run init:db
  - node scripts/gen-issuer-keys.js
  - node scripts/seed-issuer-public.js
  - PORT=3001 node src/api/verify.js
  - curl -X POST /api/receipt (attested, operatorConfirmed=false) → FLAG unconfirmed_metadata
  - curl -X POST /api/receipt (attested, operatorConfirmed=true) → PASS
  - curl -X POST /api/verify with FLAG JWT → verified:true, result:FLAG, flags:[unconfirmed_metadata]
  - curl -X POST /api/verify with PASS JWT → verified:true, result:PASS
  - curl /api/revoke on PASS jti → 200 revoked, re-verify → 409 revoked
  - curl -X POST /api/receipt (contentBindingMode=text_match) → FLAG text_extraction_failed; verify → FLAG
  - curl /api/anchor/status → 502 anchor_rpc_unreachable_or_incompatible
- Outputs / observations:
  - Receipts now include bindingEvidence, contentBindingMode, result/flags, policyVersion mvp-0.3.
  - Verify echoes result/flags; FLAG does not block verified:true.
  - Anchor status fails fast with clear 502 when RPC unreachable.
- Failures / errors (if any):
  - Anchor status 502 due to default RPC unreachable in current environment.

## Environment / Tooling notes
- Working dir and repo root: /Users/christopher/CascadeProjects/windsurf-project.
- Server run on PORT=3001 to avoid conflicts.
- pdf-parse logs “Indexing all PDF objects” when invoked on README; non-fatal.

## Risks / Open questions
- text_match usefulness limited on scanned/non-text PDFs; may need OCR later (out of scope).
- Anchor RPC defaults to Sepolia; production RPC must be configured to avoid 502.
- Additional deps (ethers/pdf-parse) increase surface; ensure production install covers them.

## Next steps
- [ ] Point ANCHOR_RPC_URL to a reachable EVM RPC and confirm chainId via /api/anchor/status.
- [ ] Smoke-test /demo in browser with real PDFs for attested/text_match flows.
- [ ] Capture last anchor tx hash once anchoring is wired.
- [ ] Consider friendlier messaging/flags for text_match misses on scanned docs.

## Links
- Branch: master
- Related commits/PRs (if any): n/a (local changes)
- Relevant docs/ADRs: docs/demo.md

---

# 2026-01-10 — Attestations Records — R&D Log

## Goal
- Capture current repo state and user request for testing a new attestation receipt JSON before implementation.
- Plan next evaluation steps to compare the proposed receipt payload against existing flows.

## Context
- Working in /Users/christopher/CascadeProjects/windsurf-project with numerous pre-existing local changes and untracked files.
- User supplied an attestation receipt JSON (status PASS) and asked to test/evaluate before implementing changes.
- Existing 2026-01-10 notebook entry already covers recent attestation flow work; this adds a follow-up record.

## Hypotheses / Assumptions
- The provided receipt structure may differ from current receipt/verify schema; testing should surface fit/gaps.
- Implementation should be deferred until evaluation confirms it improves current approach.
- Unknown: alignment of new fields with current policy/versioning and API contract.

## Work performed
- Files changed:
  - .gitignore — pre-existing local edits (purpose not reviewed this session).
  - .windsurf/workflows/notebook.md — workflow instructions already modified.
  - attestations.sqlite — local DB change present before this session.
  - docs/curl.md — pre-existing doc tweaks.
  - package.json — pre-existing dependency/script edits.
  - scripts/ingest-csv.js — pre-existing script adjustments.
  - src/api/verify.js — pre-existing verification logic changes.
  - src/lib/vc-jwt.js — pre-existing JWT handling edits.
- Key actions:
  - Logged repo root and working directory.
  - Captured git status/diff summaries scoped to project root.
  - Noted user-provided attestation receipt JSON and decision to hold off implementation pending tests.
  - Checked existing lab notebook entries for today to append a new section cleanly.

## Decisions
- Decision: Defer implementation of the provided attestation receipt JSON until testing/evaluation.
  - Rationale: User explicitly requested evaluation first to confirm benefits over current approach.
  - Alternatives considered: Implement immediately without testing.

## Evidence / Results
- Tests/commands run:
  - date +%F → 2026-01-10
  - git rev-parse --show-toplevel → /Users/christopher/CascadeProjects/windsurf-project
  - pwd → /Users/christopher/CascadeProjects/windsurf-project
  - git status --porcelain=v1 --untracked-files=normal -- . → many modified/untracked files (see Work performed).
  - git diff --name-only -- . → .gitignore, .windsurf/workflows/notebook.md, attestations.sqlite, docs/curl.md, package.json, scripts/ingest-csv.js, src/api/verify.js, src/lib/vc-jwt.js.
  - git diff --stat -- . → 8 files changed, 687 insertions, 163 deletions; includes binary change to attestations.sqlite.
  - ls docs/lab-notebook → existing entries for 2026-01-07 through 2026-01-10.
  - git branch --show-current → master
- Outputs / observations:
  - Repository root matches working directory; scope is correct.
  - Numerous pre-existing modified and untracked files; no new edits made this session.
  - Notebook file for 2026-01-10 already existed; appended new entry with separator.
- Failures / errors (if any):
  - None.

## Environment / Tooling notes
- Working dir and git root: /Users/christopher/CascadeProjects/windsurf-project.
- Many untracked directories/files (apps/, packages/, scripts/*.ts/js, docs/forms, etc.) already present; left untouched.

## Risks / Open questions
- Potential mismatch between provided receipt JSON and current receipt/verify schema; needs mapping.
- Pre-existing local changes could complicate testing comparisons if not isolated.
- Unknowns around how new receipt format aligns with current policy versioning and verification flags.

## Next steps
1. [ ] Compare provided receipt JSON against existing receipt/verify implementation to identify gaps/differences.
2. [ ] Design and run targeted tests (receipt issuance/verify flows) using the proposed payload to assess compatibility.
3. [ ] Decide whether to adopt or adapt the new format; document required changes or rationale for rejection.
4. [ ] Triage existing modified/untracked files to reduce noise before implementing any changes.

## Links
- Branch: master
- Related commits/PRs (if any): n/a (local changes)
- Relevant docs/ADRs: docs/demo.md, docs/curl.md

---

# 2026-01-10 — Attestations Records — R&D Log

## Goal
- Run notebook workflow per request and capture current repo state/status.
- Reconfirm pending evaluation of proposed attestation receipt JSON (PASS) before implementation.

## Context
- Working in /Users/christopher/CascadeProjects/windsurf-project; repo root matches working dir.
- Many pre-existing modified and untracked files; no new code changes made in this session.
- User requested to “do it,” i.e., execute the notebook capture without implementing payload changes.

## Hypotheses / Assumptions
- Repository state unchanged since prior capture; focus is documentation, not code changes.
- Attestation receipt JSON still awaiting comparison against current schema.
- Unknowns remain around schema alignment and policy/version impacts.

## Work performed
- Files changed:
  - .gitignore — pre-existing local edits.
  - .windsurf/workflows/notebook.md — pre-existing workflow edits.
  - attestations.sqlite — pre-existing DB change.
  - docs/curl.md — pre-existing doc edits.
  - package.json — pre-existing dependency/script edits.
  - scripts/ingest-csv.js — pre-existing script edits.
  - src/api/verify.js — pre-existing verification logic edits.
  - src/lib/vc-jwt.js — pre-existing JWT logic edits.
- Key actions:
  - Gathered repo root and pwd.
  - Captured git status/diff name-only/stat scoped to project root.
  - Confirmed no additional edits were made; documentation-only update.

## Decisions
- Decision: Keep implementation pending; only log state and request.
  - Rationale: User asked for documentation run (“do it”) without implementing receipt changes yet.
  - Alternatives considered: Start implementing payload changes immediately.

## Evidence / Results
- Tests/commands run:
  - date +%F → 2026-01-10
  - git rev-parse --show-toplevel → /Users/christopher/CascadeProjects/windsurf-project
  - pwd → /Users/christopher/CascadeProjects/windsurf-project
  - git status --porcelain=v1 --untracked-files=normal -- . → many modified/untracked files (see Work performed).
  - git diff --name-only -- . → .gitignore, .windsurf/workflows/notebook.md, attestations.sqlite, docs/curl.md, package.json, scripts/ingest-csv.js, src/api/verify.js, src/lib/vc-jwt.js.
  - git diff --stat -- . → 8 files changed, 687 insertions, 163 deletions; includes binary change to attestations.sqlite.
  - ls docs/lab-notebook → entries for 2026-01-07 through 2026-01-10.
- Outputs / observations:
  - Scope is correct (repo root == working dir).
  - No new code edits; only notebook updated.
- Failures / errors (if any):
  - None.

## Environment / Tooling notes
- Working dir and git root: /Users/christopher/CascadeProjects/windsurf-project.
- Large set of untracked files/directories remains; left untouched.

## Risks / Open questions
- Receipt JSON/schema alignment still unknown until evaluated.
- Existing modified/untracked files could obscure diffs when implementation proceeds.

## Next steps
1. [ ] Map provided receipt JSON to current receipt/verify schema and policy fields.
2. [ ] Design and run compatibility tests for receipt issuance/verify using proposed payload.
3. [ ] Decide on adopt/adapt/reject and document rationale.
4. [ ] Triage existing modified/untracked files to reduce noise before code changes.

## Links
- Branch: master
- Related commits/PRs (if any): n/a (local changes)
- Relevant docs/ADRs: docs/demo.md, docs/curl.md
