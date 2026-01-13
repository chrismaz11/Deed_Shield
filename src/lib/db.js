const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const { loadEnvLocal, getDbPath } = require('./env');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (dir && dir !== '.' && dir !== path.parse(dir).root) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getDb() {
  loadEnvLocal();
  const dbPath = process.env.ATTESTATION_DB_PATH || getDbPath();
  ensureDir(dbPath);

  const db = new Database(dbPath);
  const schemaPath = path.join(process.cwd(), 'schema.sqlite.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  return { db, dbPath };
}

module.exports = {
  getDb,
};
