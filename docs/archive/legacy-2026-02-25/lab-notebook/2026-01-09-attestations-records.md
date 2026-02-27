# 2026-01-09 — Attestations Records — R&D Log

## Goal
- Complete Milestone A/B end-to-end flow locally (issue receipt -> verify -> revoke -> verify 409).
- Unblock `/api/receipt` PDF upload by fixing multipart parsing.

## Context
- Working inside `/Users/christopher/CascadeProjects/windsurf-project` on the Record Attestation MVP.
- Added `/api/receipt` and `/demo` alongside existing `/api/verify` behavior.
- Local smoke test was started to validate the flow against a fresh SQLite DB.

## Hypotheses / Assumptions
- Manual multipart parsing was brittle and may fail with `curl -F` boundary/layout differences.
- Using a small focused parser (`busboy`) will reliably surface the uploaded file stream.
- Issuer public key seeding into SQLite is sufficient for verification; private key remains on disk only.

## Work performed
- Files changed:
  - `package.json` — switched root `type` to `commonjs`, added helper scripts (`init:db`, `gen:keys`, `seed:issuer`, `start:verify`), added `busboy` dependency.
  - `src/api/receipt.js` — replaced custom multipart parsing with `busboy`-based parsing (WIP verification).
  - `docs/demo.md` — clarified defaults for env vars/paths and server port.
  - (previous edits in this workstream also touched) `src/api/verify.js`, `src/lib/vc-jwt.js`, `src/lib/env.js`, `scripts/gen-issuer-keys.js`, `scripts/seed-issuer-public.js`.
- Key actions:
  - Initialized a fresh local DB.
  - Generated issuer P-256 keys to `keys/` and seeded the issuer public JWK into SQLite.
  - Started the verify server.
  - Attempted to call `POST /api/receipt` via `curl -F file=@...` and observed failures.
  - Switched to `busboy` as the multipart parser to address file detection failures.

## Decisions
- Decision: Use `busboy` for multipart/form-data parsing in `/api/receipt`.
  - Rationale: The custom boundary-based parser failed to detect the `file` part under `curl -F` (returned `missing_file` despite correct request headers).
  - Alternatives considered:
    - Keep the custom parser and harden boundary scanning further.
    - Use `multer` (heavier but common).

## Evidence / Results
- Tests/commands run:
  - `npm run init:db`
  - `node scripts/gen-issuer-keys.js`
  - `node scripts/seed-issuer-public.js`
  - `node src/api/verify.js`
  - `curl -i -sS -X POST http://localhost:3000/api/receipt -F file=@README.md -F jurisdiction=CA-LA -F docType=DEED -F notaryId=NOTARY-1`
  - `curl -v -X POST http://localhost:3000/api/receipt -F file=@README.md -F jurisdiction=CA-LA -F docType=DEED -F notaryId=NOTARY-1`
- Outputs / observations:
  - DB init succeeded (schema applied).
  - Keygen printed DID + file paths + public fingerprint (no private key material printed).
  - Seeding succeeded: `{ inserted: true }`.
  - Server started: `verify server listening on http://localhost:3000`.
- Failures / errors (if any):
  - `POST /api/receipt` returned `HTTP 400 {"error":"missing_file"}` even when curl clearly sent `Content-Type: multipart/form-data; boundary=...` and a file payload.

## Environment / Tooling notes
- Repo root confirmed: `/Users/christopher/CascadeProjects/windsurf-project`.
- Server was started as a background process during testing.
- `attestations.sqlite` shows as modified due to init/seed actions.

## Risks / Open questions
- Changing root `package.json` `type` to `commonjs` could impact other root-level Node entrypoints depending on ESM.
- New dependency `busboy` adds surface area; need to ensure install is done and bundling/runtime remains compatible.
- Need to confirm `/api/receipt` works with an actual PDF and not just a text file.

## Next steps
1. [ ] Install deps (`npm install`) if needed for `busboy`.
2. [ ] Re-run `POST /api/receipt` and confirm response includes `{ receipt, attestation_jwt }`.
3. [ ] Verify the JWT via `POST /api/verify` and confirm `{ verified: true }`.
4. [ ] Revoke the JWT via `POST /api/revoke` and confirm a subsequent verify returns HTTP 409 `{ error: "revoked" }`.
5. [ ] Smoke test `GET /demo` with a PDF upload and pasted JWT.

## Links
- Branch: master
- Related commits/PRs (if any): none
- Relevant docs/ADRs:

---

### Update — 2026-01-10 follow-through
- Ran `npm install` (busboy already present) and reran the flow on `PORT=3001` (3000 was in use).
- `POST /api/receipt` with `-F file=@README.md` now returns 200 with `{receipt, attestation_jwt}` (file detected).
- `POST /api/verify` with that JWT → 200 `{"verified":true}`.
- `POST /api/revoke` with extracted `jti` → 200 `{"revoked":true}`; re-verify → 409 `{"verified":false,"error":"revoked"}`.
- `GET /demo` served HTML (curl check 200); manual browser smoke pending with a real PDF.
