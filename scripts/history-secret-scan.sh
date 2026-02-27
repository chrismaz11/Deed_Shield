#!/usr/bin/env bash
set -euo pipefail

PATTERN='(^| )(.env.local|attestations.sqlite|packages/core/registry/registry.private.jwk)$'

echo "[history-scan] searching full git object history for blocked paths..."
HITS="$(git rev-list --all --objects | rg "$PATTERN" || true)"
if [[ -z "$HITS" ]]; then
  echo "[history-scan] PASS: no blocked paths found in history objects."
  exit 0
fi

echo "[history-scan] FAIL: blocked paths found in history objects:"
printf '%s\n' "$HITS"
exit 1
