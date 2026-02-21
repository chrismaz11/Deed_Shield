import { writeFile, mkdir } from 'fs/promises';
import { keccak256, toUtf8Bytes, Wallet } from 'ethers';
import { CompactSign, generateKeyPair, exportJWK } from 'jose';
import { canonicalize } from 'json-canonicalize';

const registryDir = new URL('../packages/core/registry/', import.meta.url);
await mkdir(registryDir, { recursive: true });

const notaryIds = ['NOTARY-1', 'NOTARY-2', 'NOTARY-3'];
const notaries = notaryIds.map((id, index) => {
  const privateKey = keccak256(toUtf8Bytes(`notary:${id}`));
  const wallet = new Wallet(privateKey);
  const state = ['CA', 'NY', 'TX'][index % 3];
  return {
    id,
    name: `Synthetic Notary ${index + 1}`,
    commissionState: state,
    status: 'ACTIVE',
    publicKey: wallet.address,
    validFrom: new Date(Date.now() - 86400000).toISOString(),
    validTo: new Date(Date.now() + 86400000 * 365).toISOString()
  };
});

const registry = {
  version: '1.0',
  issuedAt: new Date().toISOString(),
  issuer: 'Synthetic Trust Registry',
  signingKeyId: 'registry-key-1',
  ronProviders: [
    { id: 'RON-1', name: 'Synthetic RON One', status: 'ACTIVE' },
    { id: 'RON-2', name: 'Synthetic RON Two', status: 'SUSPENDED' }
  ],
  notaries
};

const { publicKey, privateKey } = await generateKeyPair('ES256');
const publicJwk = await exportJWK(publicKey);
const privateJwk = await exportJWK(privateKey);

const canonical = canonicalize(registry);
const signature = await new CompactSign(new TextEncoder().encode(canonical))
  .setProtectedHeader({ alg: 'ES256', kid: registry.signingKeyId, typ: 'registry+jws' })
  .sign(privateKey);

await writeFile(new URL('registry.json', registryDir), `${JSON.stringify(registry, null, 2)}\n`);
await writeFile(new URL('registry.sig', registryDir), `${signature}\n`);
await writeFile(new URL('registry.public.jwk', registryDir), `${JSON.stringify(publicJwk, null, 2)}\n`);
await writeFile(new URL('registry.private.jwk', registryDir), `${JSON.stringify(privateJwk, null, 2)}\n`);

console.log('Registry files generated.');
