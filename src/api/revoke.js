const { getDb } = require('../lib/db');

const { db } = getDb();

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('body_too_large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

async function handleRevoke(req, res) {
  try {
    const body = await readJson(req);
    const jti = body.jti;
    if (!jti) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ revoked: false, error: 'missing_jti' }));
      return;
    }

    const revokedAt = new Date().toISOString();
    db
      .prepare('INSERT OR REPLACE INTO revocations(jti, revoked_at) VALUES (?, ?)')
      .run(jti, revokedAt);

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ revoked: true }));
  } catch (e) {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ revoked: false, error: 'bad_request' }));
  }
}

module.exports = {
  handleRevoke,
};
