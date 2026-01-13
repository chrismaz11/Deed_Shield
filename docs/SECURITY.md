# Security and Secrets

## Secret handling
- Do not commit secrets, credentials, or tokens to this repository.
- Use local `.env` files for development secrets.
- If a secret is committed, rotate it immediately and remove it from git history.

## Blocked files
The pre-commit hook rejects:
- Home directory artifacts (Pictures/, Music/, Movies/, Library/, Documents/, Desktop/, .ssh/, .gnupg/, Google Drive/)
- Secret-like files (`*.pem`, `*.key`, `credentials*.json`, `*token*`, `*.env`)

## Reporting
If you discover a secret leak, notify the repo owner and rotate the credential.
