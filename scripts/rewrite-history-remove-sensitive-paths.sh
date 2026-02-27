#!/usr/bin/env bash
set -euo pipefail

# Run this ONLY in a clean mirror clone (recommended), not in an active dirty worktree.
# Example:
#   git clone --mirror <repo-url> trustsignal-sanitized.git
#   cd trustsignal-sanitized.git
#   ../scripts/rewrite-history-remove-sensitive-paths.sh

if [[ "$(git rev-parse --is-bare-repository)" != "true" ]]; then
  echo "ERROR: this script must run in a bare/mirror clone." >&2
  exit 1
fi

git filter-branch --force \
  --index-filter "git rm --cached --ignore-unmatch .env.local attestations.sqlite packages/core/registry/registry.private.jwk" \
  --prune-empty --tag-name-filter cat -- --all

rm -rf refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "History rewrite completed. Validate with:"
echo "  git rev-list --all --objects | rg '(^| )(.env.local|attestations.sqlite|packages/core/registry/registry.private.jwk)$'"
