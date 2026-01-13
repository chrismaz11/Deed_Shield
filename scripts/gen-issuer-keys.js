const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { loadEnvLocal, getIssuerDid } = require('../src/lib/env');

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
  loadEnvLocal();
  const did = getIssuerDid();

  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const privJwk = privateKey.export({ format: 'jwk' });
  const pubJwk = publicKey.export({ format: 'jwk' });

  const privPath = process.env.ISSUER_PRIVATE_JWK_PATH || path.join('keys', 'issuer.private.jwk.json');
  const pubPath = process.env.ISSUER_PUBLIC_JWK_PATH || path.join('keys', 'issuer.public.jwk.json');

  ensureDir(privPath);
  ensureDir(pubPath);

  fs.writeFileSync(privPath, JSON.stringify(privJwk), { mode: 0o600 });
  fs.writeFileSync(pubPath, JSON.stringify(pubJwk), { mode: 0o600 });

  const pubFingerprint = crypto.createHash('sha256').update(JSON.stringify(pubJwk)).digest('hex');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ did, privateKeyPath: privPath, publicKeyPath: pubPath, publicKeyFingerprint: pubFingerprint }));
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('error');
    process.exit(1);
  }
}
