const crypto = require('crypto');

const { loadEnvLocal, getIssuerDid, getIssuerPrivateJwk } = require('../src/lib/env');
const { getDb } = require('../src/lib/db');
const { issueVcJwt } = require('../src/lib/vc-jwt');

async function main() {
  loadEnvLocal();
  const issuer = getIssuerDid();
  const privateJwk = getIssuerPrivateJwk();

  const nowIso = new Date().toISOString();
  const suffix = crypto.randomBytes(4).toString('hex');
  const subject = {
    instrumentNo: `INST-${suffix}`,
    parcelId: `PARCEL-${suffix}`,
    recordedAt: nowIso,
    docType: 'Deed',
  };

  const { jwt, jti } = await issueVcJwt({ issuer, subject, privateJwk });

  const { db } = getDb();
  db.prepare(
    'INSERT OR REPLACE INTO credentials (jti, jwt, issued_at) VALUES (?, ?, ?)'
  ).run(jti, jwt, nowIso);
  db.close();

  // eslint-disable-next-line no-console
  console.log(jwt);
  // eslint-disable-next-line no-console
  console.error(`JTI=${jti}`);
}

if (require.main === module) {
  main();
}
