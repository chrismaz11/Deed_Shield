# Deed Shield Production Governance Tracker

Last updated: 2026-02-22
Owner: Orchestration/Governance Agent
Scope: Repository-wide (`deedshield-app-clean`) with implementation focus in `Deed_Shield/`

## Status Legend
- `NOT STARTED`
- `IN PROGRESS`
- `IMPLEMENTED`
- `VERIFIED IN TEST`
- `VERIFIED IN STAGING`

## Production Gate
- Current gate: `BLOCKED`
- Reason:
  - Secrets are present in tracked files (`.env.local`, `packages/core/registry/registry.private.jwk`).
  - PostgreSQL migration is complete in test, but staging/prod evidence for encrypted PostgreSQL + TLS connection policy is still missing (AWS session currently fails with `InvalidClientTokenId`).
  - TLS 1.3/HTTPS enforcement is implemented in code, but staging/prod ingress evidence is still missing (`x-forwarded-proto=https` forwarding + certificate policy proof).
  - Monitoring/alerts/status-page controls are not implemented.

## Critical Week 1 Roadmap
| Item | Status | Evidence | Blocker |
|---|---|---|---|
| Remove `.env` secrets from git history | `NOT STARTED` | `.env.local` tracked at repo root; historical `.env.local` exists in `Deed_Shield` history | Must rewrite history, rotate all exposed credentials, and document rotation |
| JSON/Zod validation on all API endpoints | `VERIFIED IN TEST` | Route schema hardening in `Deed_Shield/apps/api/src/server.ts`; validation tests in `Deed_Shield/apps/api/src/request-validation.test.ts` | Staging verification + OpenAPI parity still pending in Workstream #9 |
| Per-API-key rate limiting | `VERIFIED IN TEST` | `Deed_Shield/apps/api/src/server.ts`, `Deed_Shield/apps/api/test/rate-limit.test.ts` | Needs staging verification under load |
| PostgreSQL + TLS DB path | `VERIFIED IN TEST` | Datasource set to `postgresql` in `Deed_Shield/apps/api/prisma/schema.prisma`; baseline migration in `Deed_Shield/apps/api/prisma/migrations/20260222141500_postgresql_baseline/migration.sql`; `prisma migrate deploy` + API tests pass against local PostgreSQL; evidence automation added in `Deed_Shield/scripts/capture-db-security-evidence.mjs` and runbook `Deed_Shield/docs/ops/db-security-evidence.md` | Need staging/prod attestation for encrypted storage + TLS enforcement at DB layer |
| TLS certificates / HTTPS in production | `VERIFIED IN TEST` | HTTPS runtime guard in `Deed_Shield/apps/api/src/server.ts`; test coverage in `Deed_Shield/apps/api/src/https-enforcement.test.ts` | Need staging/prod ingress attestations (TLS cert chain, TLS1.3 policy, `x-forwarded-proto` forwarding) |

## 13 Workstream Checklist
| # | Workstream | Status | Evidence | Remaining Gate |
|---|---|---|---|---|
| 1 | Rate limiting per `Organization.apiKey` + 429 logging | `VERIFIED IN TEST` | `Deed_Shield/apps/api/src/server.ts`, `Deed_Shield/apps/api/test/rate-limit.test.ts` | Staging soak + abuse test |
| 2 | HTTPS/TLS 1.3 everywhere | `IN PROGRESS` | Runtime HTTPS rejection in `Deed_Shield/apps/api/src/server.ts`; tests in `Deed_Shield/apps/api/src/https-enforcement.test.ts`; TLS guidance in `Deed_Shield/docs/IT_INSTALLATION_MANUAL.md` | Need staging/prod evidence for edge TLS1.3 policy + cert lifecycle + forwarded proto configuration |
| 3 | PostgreSQL + encryption-at-rest + TLS DB | `IN PROGRESS` | Production DB guard in `Deed_Shield/apps/api/src/server.ts`; datasource/migration path is PostgreSQL (`Deed_Shield/apps/api/prisma/schema.prisma`, `Deed_Shield/apps/api/prisma/migrations/20260222141500_postgresql_baseline/migration.sql`); evidence bundle generator in `Deed_Shield/scripts/capture-db-security-evidence.mjs`; local dry-run artifact at `Deed_Shield/docs/evidence/db-security/staging-local-20260222T150912Z.md` | Need staging evidence of encrypted-at-rest PostgreSQL and `sslmode=require` (or stronger) in deployed DB connection, plus valid cloud credentials for RDS metadata pull |
| 4 | Vault-backed secret management + rotation | `IN PROGRESS` | AWS Secrets Manager helper in `Deed_Shield/apps/api/src/config/secrets.ts` | Not full secret inventory, no rotation automation evidence |
| 5 | Trust registry detached signature verification | `VERIFIED IN TEST` | `Deed_Shield/apps/api/src/registryLoader.ts`, `Deed_Shield/apps/api/src/registryLoader.test.ts` | Staging key-rotation drill |
| 6 | ATTOM/OpenAI circuit breakers + safe degradation | `IN PROGRESS` | ATTOM breaker in `Deed_Shield/apps/api/src/services/attomClient.ts`; OpenAI timeout/fallback in `Deed_Shield/apps/api/src/services/compliance.ts` | No unified breaker/backoff policy on all outbound paths |
| 7 | Multi-provider RPC failover + health checks | `IN PROGRESS` | Portability stubs in `Deed_Shield/packages/core/src/anchor/portable.ts` | No production failover path in `Deed_Shield/apps/api/src/anchor.ts` |
| 8 | Monitoring + alerting (Prometheus/Grafana + SLO alerts) | `NOT STARTED` | No metrics/alerts/status API artifacts found | Implement metrics, dashboards, alert routes, and runbook linkage |
| 9 | Strict JSON/Zod on every public endpoint + OpenAPI parity | `IN PROGRESS` | Route schema + no-body enforcement in `Deed_Shield/apps/api/src/server.ts`; tests in `Deed_Shield/apps/api/src/request-validation.test.ts` | OpenAPI parity and conformance tests remain incomplete |
| 10 | Multi-organization isolation (no cross-tenant access) | `VERIFIED IN TEST` | Ownership checks in `Deed_Shield/apps/api/src/server.ts`; tests in `Deed_Shield/apps/api/src/v2-integration.test.ts` | Staging adversarial test suite |
| 11 | Smart contract governance (audit readiness, multisig, pause) | `VERIFIED IN TEST` | `Deed_Shield/packages/contracts/contracts/AnchorRegistry.sol`, tests in `Deed_Shield/packages/contracts/test/AnchorRegistry.test.js` | Third-party audit completion + deployment governance evidence |
| 12 | Retention, DPIA hooks, user rights (`access/erasure/portability`) | `IN PROGRESS` | Retention fields exist in `Deed_Shield/apps/api/prisma/schema.prisma`; revoke endpoint present | No 90-day job, export/erasure endpoints, or DPIA workflow evidence |
| 13 | Incident runbooks + real `status.deedshield.io` | `IN PROGRESS` | Runbook exists at `Deed_Shield/docs/ops/incident-response.md` | Runbook is outdated; no live status-page implementation evidence |

## Hard Security Blocks (Non-Negotiable)
1. `BLOCK`: Secrets in git or history.
2. `BLOCK`: Any cross-tenant read/write path.
3. `BLOCK`: Production DB path without encrypted PostgreSQL + TLS.
4. `BLOCK`: Public endpoint without strict request validation.
5. `BLOCK`: On-chain write path that could carry PII.

## Deliverable Contract for Implementation Agents
Each workstream submission must include:
1. Design doc: threat model delta + failure mode behavior + rollback.
2. Code diff: minimal, testable, no secret material.
3. Tests: unit + integration for happy path and abuse/failure path.
4. Ops docs: runbook + config matrix + alerting impact.
5. Evidence bundle: exact commands/output proving acceptance criteria.

Any missing element returns status `REJECTED` with required changes.
