# Architecture and Risk Boundaries

## System Components
- API layer (`apps/api`): verification, receipt lifecycle, tenant controls, policy enforcement
- Web layer (`apps/web`): operator workflows and pilot-facing UX
- Core layer (`packages/core`): hashing, canonicalization, verification logic, service connectors
- Contracts layer (`packages/contracts`): anchoring contract artifacts and related tests

## Data Handling Boundaries
- Raw document processing should remain ephemeral unless explicitly required and approved.
- Receipts and verification metadata are retained as audit artifacts.
- Sensitive payloads and personal data must not be logged or anchored on-chain.

## Trust and Dependency Boundaries
- External providers (e.g., data services, RPC endpoints) are dependencies with explicit failure-handling requirements.
- Registry and credential checks are trust anchors and must have validation controls.
- Environment and key management controls are mandatory for production operation.

## Integration Boundary for ICE/Encompass
TrustSignal must present a stable integration contract with:
- authenticated requests
- idempotent behavior for retriable operations
- versioned schemas and error semantics
- operational transparency through health/status and support procedures
