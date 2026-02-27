#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <staging-base-url> [output-markdown-path]" >&2
  echo "Example: $0 https://staging-api.example.com docs/evidence/staging/staging-$(date -u +%Y%m%dT%H%M%SZ).md" >&2
  exit 1
fi

BASE_URL="$1"
OUTFILE="${2:-docs/evidence/staging/staging-$(date -u +%Y%m%dT%H%M%SZ).md}"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

mkdir -p "$(dirname "$OUTFILE")"

http_probe() {
  local path="$1"
  local url="$BASE_URL$path"
  local body
  local code

  body="$(mktemp)"
  code="$(curl -sS -o "$body" -w '%{http_code}' "$url" || true)"

  echo "### GET $path"
  echo "- URL: $url"
  echo "- HTTP status: $code"
  echo "- Response excerpt:"
  echo '```'
  head -c 1200 "$body" || true
  echo
  echo '```'

  rm -f "$body"
}

tls_probe() {
  local host
  host="$(echo "$BASE_URL" | sed -E 's#^https?://([^/]+).*$#\1#')"
  echo "### TLS probe"
  echo "- Host: $host"
  echo "- Command: openssl s_client -connect ${host}:443 -servername ${host}"
  echo "- Output excerpt:"
  echo '```'
  (echo | openssl s_client -connect "${host}:443" -servername "$host" 2>/dev/null | openssl x509 -noout -subject -issuer -dates) || true
  echo '```'
}

{
  echo "# Staging Evidence Capture"
  echo
  echo "- Captured at (UTC): $TS"
  echo "- Base URL: $BASE_URL"
  echo
  echo "## API Health and Observability"
  http_probe "/api/v1/health"
  http_probe "/api/v1/status"
  http_probe "/api/v1/metrics"
  echo
  echo "## Transport Security"
  tls_probe
  echo
  echo "## Manual Attachments Required"
  echo "- DB encrypted-at-rest evidence (provider screenshot/API output)"
  echo "- DB TLS enforcement evidence (connection policy/parameter group/config)"
  echo "- Ingress forwarding evidence (x-forwarded-proto=https)"
  echo "- TLS policy evidence (version/cipher policy at LB or edge)"
} > "$OUTFILE"

echo "Wrote evidence artifact: $OUTFILE"
