#!/usr/bin/env bash
set -euo pipefail

# Fails if sensitive local-only files are tracked by git.
# Intentionally allows public/non-secret examples and schema files.

echo "[hygiene] scanning tracked files for secret-risk artifacts..."

hits="$(git ls-files | rg -n '(^|/)\.env(\..*)?$|\.sqlite$|\.private\.jwk$|\.(pem|key)$|credentials.*\.json|token' || true)"

if [[ -n "$hits" ]]; then
  filtered="$(printf '%s\n' "$hits" | rg -v '(^|:)apps/api/\.env\.example$|(^|:)schema\.sqlite\.sql$' || true)"
  if [[ -n "$filtered" ]]; then
    echo "[hygiene] FAIL: sensitive files are tracked:"
    printf '%s\n' "$filtered"
    exit 1
  fi
fi

echo "[hygiene] PASS: no tracked secret-risk artifacts detected."
