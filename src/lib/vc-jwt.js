const crypto = require('crypto');

function base64urlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecodeToBuffer(input) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const withPad = padded + '='.repeat(padLen);
  return Buffer.from(withPad, 'base64');
}

function decodeJwtPayloadUnverified(jwt) {
  const parts = String(jwt || '').split('.');
  if (parts.length !== 3) throw new Error('invalid_jwt');
  const payload = JSON.parse(base64urlDecodeToBuffer(parts[1]).toString('utf8'));
  return payload;
}

function randomJti() {
  return crypto.randomBytes(16).toString('hex');
}

function isValidIsoDateString(value) {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function validateCredentialSubject(cs) {
  if (!cs) return 'missing_subject_required_fields';
  const hasReceipt =
    cs.documentHash && cs.receiptHash && cs.result;
  if (hasReceipt) {
    if (cs.flags && !Array.isArray(cs.flags)) return 'invalid_flags';
    return null;
  }
  const hasLegacy = cs.instrumentNo && cs.parcelId && cs.recordedAt;
  if (hasLegacy) {
    if (!isValidIsoDateString(cs.recordedAt)) {
      return 'invalid_recordedAt';
    }
    return null;
  }
  return 'missing_subject_required_fields';
}

function toDerInteger(buf) {
  // buf is 32-byte unsigned big-endian integer
  let i = 0;
  while (i < buf.length && buf[i] === 0x00) i++;
  let v = buf.slice(i);
  if (v.length === 0) v = Buffer.from([0]);
  if (v[0] & 0x80) v = Buffer.concat([Buffer.from([0x00]), v]);
  if (v.length > 127) throw new Error('int_too_long');
  return Buffer.concat([Buffer.from([0x02, v.length]), v]);
}

function es256JoseToDer(sig) {
  if (!Buffer.isBuffer(sig)) throw new Error('sig must be a buffer');
  if (sig.length !== 64) throw new Error('invalid_ES256_sig_len');
  const r = sig.slice(0, 32);
  const s = sig.slice(32);
  const rDer = toDerInteger(r);
  const sDer = toDerInteger(s);
  const seqLen = rDer.length + sDer.length;
  return Buffer.concat([Buffer.from([0x30, seqLen]), rDer, sDer]);
}

function derToJose(der) {
  let i = 0;
  if (der[i++] !== 0x30) throw new Error('bad_der');
  let len = der[i++];
  if (len & 0x80) {
    const n = len & 0x7f;
    len = 0;
    for (let k = 0; k < n; k++) len = (len << 8) | der[i++];
  }
  if (der[i++] !== 0x02) throw new Error('bad_der');
  let rLen = der[i++];
  let r = der.slice(i, i + rLen);
  i += rLen;
  if (der[i++] !== 0x02) throw new Error('bad_der');
  let sLen = der[i++];
  let s = der.slice(i, i + sLen);
  const normalize = (x) => {
    while (x.length > 1 && x[0] === 0x00) x = x.slice(1);
    if (x.length > 32) x = x.slice(x.length - 32);
    if (x.length < 32) x = Buffer.concat([Buffer.alloc(32 - x.length, 0), x]);
    return x;
  };
  r = normalize(r);
  s = normalize(s);
  return Buffer.concat([r, s]);
}

async function issueVcJwt({
  issuer,
  subject,
  privateJwkJson,
  now = new Date(),
  expiresInSeconds = 60 * 60,
}) {
  if (!issuer) throw new Error('issuer is required');
  if (!privateJwkJson) throw new Error('privateJwkJson is required');
  if (!subject) throw new Error('subject is required');

  const subjectError = validateCredentialSubject(subject);
  if (subjectError) throw new Error(subjectError);

  const jti = randomJti();
  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + expiresInSeconds;

  const payload = {
    iss: issuer,
    sub: subject.parcelId || subject.documentHash || 'subject',
    jti,
    iat,
    exp,
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'RecordEventAttestation'],
      credentialSubject: subject,
    },
  };

  const header = { alg: 'ES256', typ: 'JWT' };
  const signingInput = `${base64urlEncode(JSON.stringify(header))}.${base64urlEncode(
    JSON.stringify(payload)
  )}`;

  const jwk = typeof privateJwkJson === 'string' ? JSON.parse(privateJwkJson) : privateJwkJson;
  const key = crypto.createPrivateKey({ key: jwk, format: 'jwk' });
  const derSig = crypto.sign('sha256', Buffer.from(signingInput), key);
  const joseSig = derToJose(derSig);
  const jwt = `${signingInput}.${base64urlEncode(joseSig)}`;

  return { jwt, jti, payload };
}

async function verifyVcJwt({ jwt, publicJwkJson, expectedIssuer }) {
  if (!jwt) throw new Error('jwt is required');
  if (!publicJwkJson) throw new Error('publicJwkJson is required');

  let jwk;
  try {
    jwk = typeof publicJwkJson === 'string' ? JSON.parse(publicJwkJson) : publicJwkJson;
  } catch {
    return { verified: false, error: 'bad_issuer_key' };
  }

  const parts = String(jwt).split('.');
  if (parts.length !== 3) return { verified: false, error: 'bad_encoding' };
  let header;
  try {
    header = JSON.parse(base64urlDecodeToBuffer(parts[0]).toString('utf8'));
  } catch {
    return { verified: false, error: 'bad_encoding' };
  }
  if (header.alg !== 'ES256') return { verified: false, error: 'unsupported_alg' };

  const signingInput = `${parts[0]}.${parts[1]}`;
  const sigJose = base64urlDecodeToBuffer(parts[2]);
  if (sigJose.length !== 64) return { verified: false, error: 'bad_signature' };
  const sigDer = es256JoseToDer(sigJose);

  let valid = false;
  try {
    const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    valid = crypto.verify('sha256', Buffer.from(signingInput), key, sigDer);
  } catch {
    return { verified: false, error: 'bad_issuer_key' };
  }
  if (!valid) return { verified: false, error: 'bad_signature' };

  let payload;
  try {
    payload = JSON.parse(base64urlDecodeToBuffer(parts[1]).toString('utf8'));
  } catch {
    return { verified: false, error: 'bad_encoding' };
  }

  if (expectedIssuer && payload.iss !== expectedIssuer) {
    return { verified: false, error: 'invalid_claim' };
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.nbf === 'number' && nowSec < payload.nbf) {
    return { verified: false, error: 'not_active' };
  }
  if (typeof payload.exp === 'number' && nowSec >= payload.exp) {
    return { verified: false, error: 'expired' };
  }
  if (typeof payload.iat === 'number' && nowSec < payload.iat) {
    return { verified: false, error: 'iat_in_future' };
  }

  const types = payload?.vc?.type;
  if (!Array.isArray(types) || !types.includes('RecordEventAttestation')) {
    return { verified: false, error: 'missing_type' };
  }
  const subjectError = validateCredentialSubject(payload?.vc?.credentialSubject);
  if (subjectError) {
    return { verified: false, error: subjectError };
  }

  return { verified: true, payload };
}

module.exports = {
  issueVcJwt,
  verifyVcJwt,
  decodeJwtPayloadUnverified,
};
