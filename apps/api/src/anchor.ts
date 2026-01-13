import { Contract, Interface, JsonRpcProvider, Log, Wallet } from 'ethers';

const ABI = [
  'event Anchored(bytes32 receiptHash, bytes32 anchorId, address sender, uint256 timestamp)',
  'function anchor(bytes32 receiptHash) external returns (bytes32 anchorId)',
  'function isAnchored(bytes32 receiptHash) external view returns (bool)'
];

export type AnchorResult = {
  status: 'ANCHORED' | 'ALREADY_ANCHORED';
  txHash?: string;
  chainId?: string;
  anchorId?: string;
};

export async function anchorReceipt(receiptHash: string): Promise<AnchorResult> {
  const registryAddress = process.env.ANCHOR_REGISTRY_ADDRESS;
  if (!registryAddress) {
    throw new Error('ANCHOR_REGISTRY_ADDRESS is required');
  }

  const rpcUrl =
    process.env.SEPOLIA_RPC_URL && process.env.PRIVATE_KEY
      ? process.env.SEPOLIA_RPC_URL
      : process.env.LOCAL_CHAIN_URL || 'http://127.0.0.1:8545';

  const privateKey = process.env.PRIVATE_KEY || process.env.LOCAL_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Missing PRIVATE_KEY or LOCAL_PRIVATE_KEY');
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  const chainId = network.chainId.toString();
  const wallet = new Wallet(privateKey, provider);
  const registry = new Contract(registryAddress, ABI, wallet);

  const alreadyAnchored = await registry.isAnchored(receiptHash);
  if (alreadyAnchored) {
    return { status: 'ALREADY_ANCHORED', chainId };
  }

  const tx = await registry.anchor(receiptHash);
  const receipt = await tx.wait();
  const iface = new Interface(ABI);
  const parsedLog = (receipt?.logs as Log[] | undefined)
    ?.map((log) => {
      try {
        return iface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((entry) => entry?.name === 'Anchored');
  const anchorId = parsedLog?.args?.anchorId ?? undefined;

  return {
    status: 'ANCHORED',
    txHash: receipt?.hash,
    chainId,
    anchorId
  };
}
