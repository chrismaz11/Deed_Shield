# Staging Security Evidence Checklist

## Objective
Produce staging evidence for production gate items currently marked as "verified in test" only.

## Evidence Areas

### 1. Database Encryption and TLS
- confirm managed PostgreSQL encrypted-at-rest setting
- confirm application DB connection enforces TLS (`sslmode=require` or stronger)
- attach provider screenshots or API output with timestamps

### 2. HTTPS Ingress Enforcement
- confirm TLS certificate chain and renewal policy
- confirm TLS 1.3 policy at ingress/load balancer
- confirm `x-forwarded-proto=https` forwarding behavior
- capture API behavior when HTTPS forwarding is absent/present

### 3. Monitoring and Status Surface
- confirm `/api/v1/health`, `/api/v1/status`, `/api/v1/metrics` reachable in staging
- confirm scrape target and dashboard ingestion for request/latency metrics
- define and enable first alert thresholds

## Acceptance Artifacts
- command log snippets
- screenshots/console output from cloud console
- test run IDs and timestamps
- links to dashboard panels and alert definitions

## Signoff
- engineering owner
- security owner
- operations owner
