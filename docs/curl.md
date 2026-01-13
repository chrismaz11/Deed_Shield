# Curl examples

Start server:

```sh
npm run start:verify
```

Verify a JWT:

```sh
curl -i -sS -X POST http://localhost:3000/api/verify \
  -H 'content-type: application/json' \
  -d '{"jwt":"PASTE_JWT_HERE"}'
```

Expected success shape:

```json
{"verified":true,"payload":{}}
```

Revoke a JWT by jti:

```sh
curl -i -sS -X POST http://localhost:3000/api/revoke \
  -H 'content-type: application/json' \
  -d '{"jti":"PASTE_JTI_HERE"}'
```

Expected revoke success shape:

```json
{"ok":true,"revoked":true,"jti":"PASTE_JTI_HERE"}
```

Revoke a JWT by jwt:

```sh
curl -i -sS -X POST http://localhost:3000/api/revoke \
  -H 'content-type: application/json' \
  -d '{"jwt":"PASTE_JWT_HERE"}'
```

Verify a revoked JWT (expect 409):

```sh
curl -i -sS -X POST http://localhost:3000/api/verify \
  -H 'content-type: application/json' \
  -d '{"jwt":"PASTE_JWT_HERE"}'
```

Expected revoked response:

```json
{"verified":false,"error":"Revoked"}
```
