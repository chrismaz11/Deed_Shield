import { readFile, writeFile } from 'fs/promises';

import { generateRegistryKeypair, signRegistry } from '../src/registry.js';
import { TrustRegistry } from '../src/types.js';

const registryDir = new URL('../registry/', import.meta.url);

async function writeJson(file: string, value: unknown) {
  await writeFile(new URL(file, registryDir), JSON.stringify(value, null, 2));
}

async function readJson<T>(file: string): Promise<T> {
  const content = await readFile(new URL(file, registryDir), 'utf-8');
  return JSON.parse(content) as T;
}

async function generateKeys() {
  const { publicJwk, privateJwk } = await generateRegistryKeypair();
  await writeJson('registry.public.jwk', publicJwk);
  await writeJson('registry.private.jwk', privateJwk);
  console.log('Generated registry keypair');
}

async function sign() {
  const registry = await readJson<TrustRegistry>('registry.json');
  const privateJwk = await readJson('registry.private.jwk');
  const signature = await signRegistry(registry, privateJwk, registry.signingKeyId);
  await writeFile(new URL('registry.sig', registryDir), signature);
  console.log('Signed registry.json');
}

async function rotate() {
  await generateKeys();
  await sign();
  console.log('Rotated registry keys and signature');
}

async function main() {
  const command = process.argv[2];
  if (command === 'generate') {
    await generateKeys();
    return;
  }
  if (command === 'sign') {
    await sign();
    return;
  }
  if (command === 'rotate') {
    await rotate();
    return;
  }
  console.log('Usage: tsx registry.ts <generate|sign|rotate>');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
