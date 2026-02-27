# Secret Rotation and History Remediation Runbook

## Objective
Close the remaining secret-hygiene blocker by rotating exposed credentials and remediating git history.

## Scope
Applies to all credentials historically exposed in tracked files, including local env and private key artifacts.

## Required Actions
1. Inventory exposed credentials and owners.
2. Rotate each credential at the provider.
3. Update runtime secret stores and deployment environments.
4. Validate service behavior with rotated credentials.
5. Remediate git history where required by policy.
6. Capture evidence and approvals.

## Minimum Evidence Package
- rotation timestamp and operator
- old credential revoked/disabled confirmation
- new credential deployed confirmation
- service health verification after rotation
- PR/commit references for config updates
- formal signoff from engineering + security owner

## Credential Classes to Include
- ATTOM API key
- OpenAI API key
- blockchain private keys
- database credentials
- any local `.env` values that were committed historically

## Completion Criteria
This workstream is complete only when:
- all exposed credentials are rotated
- history remediation is complete or formally accepted with compensating controls
- evidence is attached in governance tracking

## Implementation Notes (2026-02-25)
- Repository scripts added:
  - `scripts/history-secret-scan.sh` (fails if blocked paths exist in git history objects)
  - `scripts/rewrite-history-remove-sensitive-paths.sh` (mirror-clone history rewrite)
- Mirror-clone rewrite validation completed in `/tmp` with before/after scan:
  - before: blocked paths found (`.env.local`, `attestations.sqlite`, `packages/core/registry/registry.private.jwk`)
  - after: no blocked paths found
- Canonical remote heads/tags were rewritten and force-pushed on 2026-02-25.
- Remaining action: obtain GitHub-side cleanup confirmation for hidden `refs/pull/*` retention and cached object purge.
