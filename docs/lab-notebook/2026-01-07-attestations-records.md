# 2026-01-07 — Attestations Records — R&D Log

## Goal
- Reach Milestone 1: `/api/verify` returns `{ "verified": true }` for a valid JWT signature.
- If JWT `jti` is revoked in DB, `/api/verify` returns HTTP `409`.

## Context
- Implemented a minimal Record Event Attestation MVP in a new small Node project.
- Required verification rules: issuer public JWK fetched from SQLite by `iss`, validate `exp/nbf/iat`, and enforce revocation by `jti`.
- Constraints: no private keys in DB; issuer private JWK sourced from `.env.local`; no secrets printed.

## Hypotheses / Assumptions
- Public-key verification can be implemented using Node core `crypto` + JWK without adding dependencies.
- SQLite CLI (`sqlite3`) is available locally and can serve as the MVP DB access path without npm deps.
- Revocation check only needs `jti` presence in a `revocations` table.
- Unknowns:
  - Whether shell quoting would safely support `.env.local` with embedded JSON values across runs.

## Work performed
- Files changed:
  - `schema.sqlite.sql` — SQLite schema for issuers + revocations.
  - `src/lib/vc-jwt.js` — ES256 JWT verification using public JWK; validates `exp/nbf/iat`; enforces payload invariants (`RecordEventAttestation` + required `credentialSubject` fields).
  - `src/api/verify.js` — `/api/verify` endpoint: decode → lookup issuer public JWK by `iss` → verify → check `revocations` by `jti` (409 if revoked).
  - `src/api/revoke.js` — `/api/revoke` endpoint: insert `jti` into `revocations`.
  - `docs/curl.md` — curl examples for verify + revoke.
  - `package.json` — minimal scripts (`start:verify`, `ingest:csv`).
  - `scripts/ingest-csv.js` — MVP CSV ingest script (used earlier for HS256; retained but not part of Milestone 1 verification).
  - `.windsurf/workflows/notebook.md` — updated notebook workflow instructions to keep git evidence scoped to this repo.
- Key actions:
  - Implemented issuer lookup in SQLite by `did` (payload `iss`) and verified ES256 signatures against stored public JWK.
  - Implemented revocation status check by `jti` returning HTTP `409`.
  - Iterated on local commands to safely generate `.env.local` and avoid printing secrets.

## Decisions
- Decision: Use `sqlite3` CLI from Node (via `child_process.execFileSync`) instead of adding a sqlite npm dependency.
  - Rationale: keep MVP dependency-free and align with “no new deps unless necessary”.
  - Alternatives considered:
    - Add `better-sqlite3` or `sqlite3` npm dependency.
    - Store revocations in-memory only (rejected because rules require DB check).

## Evidence / Results
- Tests/commands run:
  - DB init:
    - `rm -f attestations.sqlite`
    - `sqlite3 attestations.sqlite < schema.sqlite.sql`
  - Env validation (no secrets):
    - `node -e 'console.log(JSON.stringify({did:..., privLen:..., pubLen:...}))'`
  - Insert issuer public JWK:
    - `sqlite3 attestations.sqlite "INSERT OR REPLACE INTO issuers(did, public_jwk_json) VALUES (...)"`
  - Start server:
    - `npm run start:verify`
  - Verify happy-path:
    - `curl -i -sS -X POST http://localhost:3000/api/verify -H 'content-type: application/json' -d '{"jwt":"..."}'`
  - Revoke + verify:
    - `curl -i -sS -X POST http://localhost:3000/api/revoke -H 'content-type: application/json' -d '{"jti":"..."}'`
    - `curl -i -sS -X POST http://localhost:3000/api/verify ...`
- Outputs / observations:
  - `/api/verify` returned `HTTP/1.1 200 OK` with body `{"verified":true}` for a valid ES256 JWT.
  - After revocation, `/api/verify` returned `HTTP/1.1 409 Conflict` with body `{"verified":false,"error":"revoked"}`.
- Failures / errors (if any):
  - `curl: (7) Failed to connect ...` when server wasn’t running.
  - `SyntaxError: Unexpected token ','` due to shell backtick/template-literal quoting issues while generating `.env.local`.
  - `SyntaxError: Unexpected end of JSON input` when `ISSUER_PRIVATE_JWK_JSON` was not loaded into the environment.
  - `Error: listen EADDRINUSE ... :3000` when port 3000 was already in use.

## Environment / Tooling notes
- Shell completion noise observed:
  - `complete:13: command not found: compdef`
- Some commands were accidentally concatenated (missing newlines), causing confusing parse errors.
- Confirmed repo root scoping with:
  - `git rev-parse --show-toplevel` → `/Users/christopher/CascadeProjects/windsurf-project`

## Risks / Open questions
- Reliance on `sqlite3` CLI being available on every dev machine.
- Shell quoting for `.env.local` with embedded JSON is fragile; needs a robust approach for team usage.

## Next steps
1. [ ] (Optional) Make the JWT minting helper a small script under this repo to reduce copy/paste errors (ensure it never prints keys).
2. [ ] (Optional) Add a minimal `DB_PATH` env convention to docs and ensure all commands reference it consistently.
3. [ ] Proceed to Milestone 2+ only if defined (ingest → normalize → issue path), keeping the same constraints.

## Links
- Branch:
- Related commits/PRs (if any):
- Relevant docs/ADRs:.
