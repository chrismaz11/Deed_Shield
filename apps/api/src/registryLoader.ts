import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { TrustRegistry, verifyRegistrySignature } from '@deed-shield/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const registryDir = path.resolve(__dirname, '../../../packages/core/registry');

export async function loadRegistry(): Promise<TrustRegistry> {
  const registryPath = path.join(registryDir, 'registry.json');
  const signaturePath = path.join(registryDir, 'registry.sig');
  const publicKeyPath = path.join(registryDir, 'registry.public.jwk');

  const [registryRaw, signatureRaw] = await Promise.all([
    readFile(registryPath, 'utf-8'),
    readFile(signaturePath, 'utf-8')
  ]);

  let publicJwk;
  if (process.env.TRUST_REGISTRY_PUBLIC_KEY) {
    try {
      publicJwk = JSON.parse(process.env.TRUST_REGISTRY_PUBLIC_KEY);
    } catch (e) {
      throw new Error('Invalid TRUST_REGISTRY_PUBLIC_KEY environment variable: not valid JSON');
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY: TRUST_REGISTRY_PUBLIC_KEY environment variable is required in production.');
    }
    // Fallback for dev/test only
    const publicKeyRaw = await readFile(publicKeyPath, 'utf-8');
    publicJwk = JSON.parse(publicKeyRaw);
  }

  const registry = JSON.parse(registryRaw) as TrustRegistry;
  const signature = signatureRaw.trim();

  const verified = await verifyRegistrySignature(registry, signature, publicJwk);
  if (!verified) {
    throw new Error('Registry signature invalid - Trusted Root verification failed');
  }

  return registry;
}
