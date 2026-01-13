const fs = require('fs');

const { loadEnvLocal, getIssuerDid, getIssuerPrivateJwk } = require('../src/lib/env');
const { getDb } = require('../src/lib/db');
const { issueVcJwt } = require('../src/lib/vc-jwt');

function parseCsvLine(line) {
  // Minimal CSV parser: supports commas, no quotes/escapes.
  return line.split(',').map((s) => s.trim());
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    // eslint-disable-next-line no-console
    console.error('usage: node scripts/ingest-csv.js <file.csv>');
    process.exit(2);
  }

  loadEnvLocal();
  const issuer = getIssuerDid();
  const privateJwk = getIssuerPrivateJwk();

  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    // eslint-disable-next-line no-console
    console.error('csv must include header + at least 1 row');
    process.exit(2);
  }

  const header = parseCsvLine(lines[0]);
  const idx = (name) => header.indexOf(name);

  const requiredCols = ['instrumentNo', 'parcelId', 'recordedAt', 'docType'];
  for (const c of requiredCols) {
    if (idx(c) === -1) {
      // eslint-disable-next-line no-console
      console.error(`missing column: ${c}`);
      process.exit(2);
    }
  }

  const { db } = getDb();
  const insertCredential = db.prepare(
    'INSERT OR REPLACE INTO credentials (jti, jwt, issued_at) VALUES (?, ?, ?)'
  );

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const subject = {
      instrumentNo: row[idx('instrumentNo')],
      parcelId: row[idx('parcelId')],
      recordedAt: row[idx('recordedAt')],
      docType: row[idx('docType')],
    };

    const { jwt, jti } = await issueVcJwt({ issuer, subject, privateJwk });
    insertCredential.run(jti, jwt, new Date().toISOString());
    // eslint-disable-next-line no-console
    console.log(jwt);
  }

  db.close();
}

if (require.main === module) {
  main();
}
