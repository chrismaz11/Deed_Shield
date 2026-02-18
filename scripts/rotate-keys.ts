
import { generateKeyPairSync } from 'node:crypto';

// Generate EC P-256 key pair
const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

console.log('--- PUBLIC KEY ---');
console.log(publicKey);
console.log('\n--- PRIVATE KEY ---');
console.log(privateKey);
console.log('\n-------------------');
console.log('INSTRUCTIONS:');
console.log('1. Copy the contents of PRIVATE KEY above into a new secret in AWS Secrets Manager.');
console.log('   Secret Name: deedshield/jwt-keys');
console.log('   Key: PRIVATE_KEY_PEM');
console.log('   Value: <paste private key pem here>');
console.log('2. Add PUBLIC_KEY_PEM as another key/value pair in the same secret.');
