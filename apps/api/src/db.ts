import { PrismaClient } from '@prisma/client';

export async function ensureDatabase(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS Receipt (
      id TEXT PRIMARY KEY,
      receiptHash TEXT NOT NULL,
      inputsCommitment TEXT NOT NULL,
      policyProfile TEXT NOT NULL,
      decision TEXT NOT NULL,
      reasons TEXT NOT NULL,
      riskScore INTEGER NOT NULL,
      checks TEXT NOT NULL,
      rawInputs TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      anchorStatus TEXT NOT NULL DEFAULT 'PENDING',
      anchorTxHash TEXT,
      anchorChainId TEXT,
      anchorId TEXT
    );
  `);
}
