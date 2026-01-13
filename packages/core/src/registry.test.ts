import { describe, expect, it } from 'vitest';

import { generateRegistryKeypair, signRegistry, verifyRegistrySignature } from './registry.js';
import { TrustRegistry } from './types.js';

describe('registry signature', () => {
  it('signs and verifies registry payload', async () => {
    const registry: TrustRegistry = {
      version: '1.0',
      issuedAt: new Date().toISOString(),
      issuer: 'Test Registry',
      signingKeyId: 'test-key',
      ronProviders: [{ id: 'RON-1', name: 'Test', status: 'ACTIVE' }],
      notaries: [
        {
          id: 'NOTARY-1',
          name: 'Test Notary',
          commissionState: 'CA',
          status: 'ACTIVE',
          publicKey: '0x1111111111111111111111111111111111111111',
          validFrom: new Date(Date.now() - 1000).toISOString(),
          validTo: new Date(Date.now() + 1000).toISOString()
        }
      ]
    };

    const { publicJwk, privateJwk } = await generateRegistryKeypair();
    const signature = await signRegistry(registry, privateJwk, registry.signingKeyId);
    const verified = await verifyRegistrySignature(registry, signature, publicJwk);

    expect(verified).toBe(true);
  });
});
