import { spawn } from 'child_process';
import { once } from 'events';
import path from 'path';
import { setTimeout as delay } from 'timers/promises';

import { Wallet } from 'ethers';
import type { FastifyInstance } from 'fastify';

import { generateSyntheticBundles, deriveNotaryWallet } from '../packages/core/src/synthetic.ts';
import { TrustRegistry } from '../packages/core/src/types.ts';
import { loadRegistry } from '../apps/api/src/registryLoader.ts';

const rootDir = path.resolve(new URL('.', import.meta.url).pathname, '..');
const contractsDir = path.join(rootDir, 'packages/contracts');

async function runCommand(command: string, args: string[], cwd: string) {
  const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (data) => {
    stdout += data.toString();
  });
  child.stderr.on('data', (data) => {
    stderr += data.toString();
  });
  const [code] = (await once(child, 'close')) as [number];
  if (code !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}\n${stderr}`);
  }
  return stdout.trim();
}

async function startHardhatNode() {
  const child = spawn('npx', ['hardhat', 'node', '--hostname', '127.0.0.1', '--port', '8545'], {
    cwd: contractsDir,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const ready = new Promise<void>((resolve, reject) => {
    child.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('Started HTTP and WebSocket JSON-RPC server')) {
        resolve();
      }
    });
    child.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('Error')) {
        reject(new Error(text));
      }
    });
  });

  await ready;
  return child;
}

async function deployContract() {
  const output = await runCommand('npx', ['hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost'], contractsDir);
  const match = output.match(/AnchorRegistry deployed to: (0x[a-fA-F0-9]{40})/);
  if (!match) {
    throw new Error('Failed to parse contract address');
  }
  return match[1];
}

async function main() {
  console.log('Starting demo run...');
  let hardhatNode: ReturnType<typeof spawn> | null = null;
  let server: FastifyInstance | null = null;

  try {
    hardhatNode = await startHardhatNode();
    const mnemonic = 'test test test test test test test test test test test junk';
    const wallet = Wallet.fromPhrase(mnemonic);
    process.env.LOCAL_PRIVATE_KEY = wallet.privateKey;
    process.env.LOCAL_CHAIN_URL = 'http://127.0.0.1:8545';

    const contractAddress = await deployContract();
    process.env.ANCHOR_REGISTRY_ADDRESS = contractAddress;

    await runCommand('npx', ['prisma', 'generate'], path.join(rootDir, 'apps/api'));

    const { buildServer } = await import('../apps/api/src/server.ts');
    server = await buildServer();
    await server.ready();

    const registry = (await loadRegistry()) as TrustRegistry;
    const notaryWallets: Record<string, Wallet> = {};
    registry.notaries.forEach((notary) => {
      notaryWallets[notary.id] = deriveNotaryWallet(notary.id);
    });

    const bundles = await generateSyntheticBundles(registry, notaryWallets, 50, 0.3);

    const decisions: Record<string, number> = { ALLOW: 0, FLAG: 0, BLOCK: 0 };
    const receiptIds: string[] = [];

    for (const bundle of bundles) {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/verify',
        payload: bundle
      });
      const data = response.json();
      decisions[data.decision] = (decisions[data.decision] || 0) + 1;
      receiptIds.push(data.receiptId);
    }

    const anchorTargets = receiptIds.slice(0, 5);
    const anchors: string[] = [];
    for (const receiptId of anchorTargets) {
      const response = await server.inject({
        method: 'POST',
        url: `/api/v1/anchor/${receiptId}`
      });
      const data = response.json();
      anchors.push(data.txHash || 'missing');
    }

    let integrityOk = 0;
    for (const receiptId of receiptIds.slice(0, 10)) {
      const response = await server.inject({
        method: 'POST',
        url: `/api/v1/receipt/${receiptId}/verify`
      });
      const data = response.json();
      if (data.verified) integrityOk += 1;
    }

    console.log('Demo results');
    console.log(`Decisions: ${JSON.stringify(decisions)}`);
    console.log(`Anchors: ${anchors.length} confirmed`);
    console.log(`Integrity checks passed: ${integrityOk}/10`);
  } finally {
    if (server) {
      await server.close();
    }
    if (hardhatNode) {
      hardhatNode.kill('SIGINT');
      await delay(500);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
