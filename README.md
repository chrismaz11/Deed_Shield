# Deed Shield

Impeccable MVP for a pre-recording verification simulator that ingests synthetic notarized bundles, verifies a simulated RON seal and notary authority, emits immutable-style receipts, and anchors receipt hashes on EVM.

## Quickstart

```bash
npm install
npm -w apps/api run db:generate
npm -w apps/api run db:push
npm -w apps/api run dev
```

In another terminal:

```bash
npm -w apps/web run dev
```

API defaults to `http://localhost:3001`, web runs on `http://localhost:3000`.

## Local Demo

Runs 50 synthetic verifications, anchors 5 receipts, and verifies receipt integrity.

```bash
npm run demo
```

## Anchoring Modes

- **Local mode (default)**
  - Requires a local EVM RPC at `LOCAL_CHAIN_URL` (defaults to `http://127.0.0.1:8545`).
  - Requires `LOCAL_PRIVATE_KEY` (demo sets it automatically).
- **Sepolia mode**
  - Set `SEPOLIA_RPC_URL` and `PRIVATE_KEY`.
  - Provide `ANCHOR_REGISTRY_ADDRESS` (deployed contract address).

If Sepolia env vars are missing, the API uses local mode.

## API Examples

```bash
curl -s http://localhost:3001/api/v1/health
```

```bash
curl -s http://localhost:3001/api/v1/synthetic | \
  curl -s -X POST http://localhost:3001/api/v1/verify \
  -H 'content-type: application/json' \
  -d @-
```

```bash
curl -s http://localhost:3001/api/v1/receipt/<receiptId>
```

```bash
curl -s -X POST http://localhost:3001/api/v1/anchor/<receiptId>
```

OpenAPI spec: `apps/api/openapi.json`.

## Threat Model Notes

- Synthetic-only: no real PII is ingested or persisted.
- Receipts are immutable-style: integrity is derived from canonical JSON hashing.
- Anchoring stores only hashes; no document contents are posted on-chain.
- Trust registry validation rejects unsigned or tampered registries.

## Repo Layout

- `apps/api`: Fastify API + Prisma (SQLite)
- `apps/web`: Next.js portal UI
- `packages/core`: canonicalization, hashing, registry, verification engine
- `packages/contracts`: Solidity AnchorRegistry + deploy scripts
- `scripts/demo.ts`: end-to-end demo run
