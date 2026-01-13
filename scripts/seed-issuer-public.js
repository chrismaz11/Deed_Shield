const { execFileSync } = require('child_process');
const { loadEnvLocal, getDbPath, getIssuerDid, getIssuerPublicJwkPath } = require('../src/lib/env');
const fs = require('fs');

function main() {
  loadEnvLocal();
  const dbPath = getDbPath();
  const did = getIssuerDid();
  const pubPath = getIssuerPublicJwkPath();
  const publicJwkJson = fs.readFileSync(pubPath, 'utf8');

  const sql = `INSERT OR REPLACE INTO issuers(did, public_jwk_json) VALUES ('${did.replace(/'/g, "''")}', '${publicJwkJson.replace(/'/g, "''")}');`;
  execFileSync('sqlite3', ['-batch', dbPath, sql], { stdio: ['ignore', 'ignore', 'inherit'] });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ did, dbPath, inserted: true }));
}

if (require.main === module) {
  try {
    main();
  } catch {
    // eslint-disable-next-line no-console
    console.error('error');
    process.exit(1);
  }
}
