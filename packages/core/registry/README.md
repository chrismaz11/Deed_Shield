# Registry Key Material

`registry.private.jwk` is intentionally untracked and must not be committed.

Use this directory for local development fixtures only:
- keep `registry.public.jwk`, `registry.json`, and `registry.sig` as non-secret artifacts
- generate or obtain a private JWK out-of-band for local signing workflows

Security rules:
- never commit private key material
- rotate any private key that was previously committed
- store production keys in managed secret storage (KMS/HSM-backed)
