const { getDb } = require('../src/lib/db');

function main() {
  const { db, dbPath } = getDb();
  db.close();
  // eslint-disable-next-line no-console
  console.log(dbPath);
}

if (require.main === module) {
  main();
}
