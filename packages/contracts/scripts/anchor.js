const { ethers } = require('hardhat');

async function main() {
  const receiptHash = process.env.RECEIPT_HASH;
  const registryAddress = process.env.ANCHOR_REGISTRY_ADDRESS;

  if (!receiptHash || !registryAddress) {
    throw new Error('Missing RECEIPT_HASH or ANCHOR_REGISTRY_ADDRESS');
  }

  const registry = await ethers.getContractAt('AnchorRegistry', registryAddress);
  const tx = await registry.anchor(receiptHash);
  const receipt = await tx.wait();
  console.log(`Anchored ${receiptHash} in tx ${receipt?.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
