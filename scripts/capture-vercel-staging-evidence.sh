#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <vercel-deployment-url> [output-markdown-path]" >&2
  exit 1
fi

DEPLOY_URL="$1"
OUTFILE="${2:-docs/evidence/staging/vercel-staging-$(date -u +%Y%m%dT%H%M%SZ).md}"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

mkdir -p "$(dirname "$OUTFILE")"

probe() {
  local path="$1"
  local tmp
  tmp="$(mktemp)"
  vercel curl "$path" --deployment "$DEPLOY_URL" -- --include --silent > "$tmp"

  local status
  status="$(awk '/^HTTP\// {print $2; exit}' "$tmp")"

  echo "### GET $path"
  echo "- Deployment: $DEPLOY_URL"
  echo "- HTTP status: ${status:-unknown}"
  echo "- Response excerpt:"
  echo '```'
  head -c 1400 "$tmp"
  echo
  echo '```'

  rm -f "$tmp"
}

tls_probe() {
  local host
  host="$(echo "$DEPLOY_URL" | sed -E 's#^https?://([^/]+).*$#\1#')"
  echo "### TLS probe"
  echo "- Host: $host"
  echo "- Output excerpt:"
  echo '```'
  (echo | openssl s_client -connect "${host}:443" -servername "$host" 2>/dev/null | openssl x509 -noout -subject -issuer -dates) || true
  echo '```'
}

{
  echo "# Vercel Staging Evidence Capture"
  echo
  echo "- Captured at (UTC): $TS"
  echo "- Deployment URL: $DEPLOY_URL"
  echo
  echo "## API Health and Observability"
  probe "/api/v1/health"
  probe "/api/v1/status"
  probe "/api/v1/metrics"
  echo
  echo "## Transport Security"
  tls_probe
  echo
  echo "## Manual Attachments Required"
  echo "- DB encrypted-at-rest evidence (Supabase project settings)"
  echo "- DB TLS enforcement evidence (connection settings)"
  echo "- Ingress forwarding evidence (x-forwarded-proto=https)"
  echo "- Alert rules and dashboard screenshots"
} > "$OUTFILE"

echo "Wrote evidence artifact: $OUTFILE"
