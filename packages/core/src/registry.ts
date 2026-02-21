import {
  CompactSign,
  compactVerify,
  generateKeyPair,
  importJWK,
  exportJWK,
  JWK,
} from "jose";

import { canonicalizeJson } from "./canonicalize.js";
import { TrustRegistry } from "./types.js";

export type RegistrySignatureBundle = {
  registry: TrustRegistry;
  signature: string;
};

export async function generateRegistryKeypair() {
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const publicJwk = await exportJWK(publicKey);
  const privateJwk = await exportJWK(privateKey);
  return { publicJwk, privateJwk };
}

export async function signRegistry(
  registry: TrustRegistry,
  privateJwk: JWK,
  keyId: string,
): Promise<string> {
  const canonical = canonicalizeJson(registry);
  const encoder = new TextEncoder();
  const key = await importJWK(privateJwk, "ES256");
  return new CompactSign(encoder.encode(canonical))
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "registry+jws" })
    .sign(key);
}

export async function verifyRegistrySignature(
  registry: TrustRegistry,
  signature: string,
  publicJwk: JWK,
): Promise<boolean> {
  const canonical = canonicalizeJson(registry);
  const encoder = new TextEncoder();
  const key = await importJWK(publicJwk, "ES256");
  const { payload } = await compactVerify(signature, key);
  const payloadString = new TextDecoder().decode(payload);
  return payloadString === canonical && encoder.encode(canonical).length > 0;
}

export function findNotary(registry: TrustRegistry, notaryId: string) {
  return registry.notaries.find((notary) => notary.id === notaryId) || null;
}

export function findRonProvider(registry: TrustRegistry, providerId: string) {
  return (
    registry.ronProviders.find((provider) => provider.id === providerId) || null
  );
}
