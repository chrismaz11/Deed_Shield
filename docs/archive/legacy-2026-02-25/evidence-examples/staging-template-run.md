# Staging Evidence Capture

- Captured at (UTC): 2026-02-25T16:52:49Z
- Base URL: https://example.com

## API Health and Observability
### GET /api/v1/health
- URL: https://example.com/api/v1/health
- HTTP status: 404
- Response excerpt:
```
<!doctype html><html lang="en"><head><title>Example Domain</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{background:#eee;width:60vw;margin:15vh auto;font-family:system-ui,sans-serif}h1{font-size:1.5em}div{opacity:0.8}a:link,a:visited{color:#348}</style></head><body><div><h1>Example Domain</h1><p>This domain is for use in documentation examples without needing permission. Avoid use in operations.</p><p><a href="https://iana.org/domains/example">Learn more</a></p></div></body></html>

```
### GET /api/v1/status
- URL: https://example.com/api/v1/status
- HTTP status: 404
- Response excerpt:
```
<!doctype html><html lang="en"><head><title>Example Domain</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{background:#eee;width:60vw;margin:15vh auto;font-family:system-ui,sans-serif}h1{font-size:1.5em}div{opacity:0.8}a:link,a:visited{color:#348}</style></head><body><div><h1>Example Domain</h1><p>This domain is for use in documentation examples without needing permission. Avoid use in operations.</p><p><a href="https://iana.org/domains/example">Learn more</a></p></div></body></html>

```
### GET /api/v1/metrics
- URL: https://example.com/api/v1/metrics
- HTTP status: 404
- Response excerpt:
```
<!doctype html><html lang="en"><head><title>Example Domain</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{background:#eee;width:60vw;margin:15vh auto;font-family:system-ui,sans-serif}h1{font-size:1.5em}div{opacity:0.8}a:link,a:visited{color:#348}</style></head><body><div><h1>Example Domain</h1><p>This domain is for use in documentation examples without needing permission. Avoid use in operations.</p><p><a href="https://iana.org/domains/example">Learn more</a></p></div></body></html>

```

## Transport Security
### TLS probe
- Host: example.com
- Command: openssl s_client -connect example.com:443 -servername example.com
- Output excerpt:
```
subject=CN=example.com
issuer=C=US, O=SSL Corporation, CN=Cloudflare TLS Issuing ECC CA 3
notBefore=Feb 13 18:53:48 2026 GMT
notAfter=May 14 18:57:50 2026 GMT
```

## Manual Attachments Required
- DB encrypted-at-rest evidence (provider screenshot/API output)
- DB TLS enforcement evidence (connection policy/parameter group/config)
- Ingress forwarding evidence (x-forwarded-proto=https)
- TLS policy evidence (version/cipher policy at LB or edge)
