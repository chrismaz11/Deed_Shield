const { execFileSync } = require('child_process');
const { loadEnvLocal, getDbPath, getIssuerDid, getIssuerPublicJwk } = require('../src/lib/env');

function main() {
  loadEnvLocal();
  const dbPath = getDbPath();
  const issuerDid = getIssuerDid();
  const publicJwk = getIssuerPublicJwk();

  const sql = `INSERT OR REPLACE INTO issuers (did, public_jwk_json) VALUES ('${issuerDid.replace(
    /'/g,
    "''"
  )}', '${JSON.stringify(publicJwk).replace(/'/g, "''")}');`;

  execFileSync('sqlite3', ['-batch', dbPath, sql], { stdio: ['ignore', 'ignore', 'inherit'] });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ did: issuerDid, dbPath, inserted: true }));
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err.message || 'seed_failed');
    process.exit(1);
  }
}
