-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "receiptHash" TEXT NOT NULL,
    "inputsCommitment" TEXT NOT NULL,
    "policyProfile" TEXT NOT NULL,
    "parcelId" TEXT,
    "decision" TEXT NOT NULL,
    "reasons" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "checks" TEXT NOT NULL,
    "rawInputs" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anchorStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "anchorTxHash" TEXT,
    "anchorChainId" TEXT,
    "anchorId" TEXT,
    "fraudRisk" TEXT,
    "zkpAttestation" TEXT,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "organizationId" TEXT,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revocation" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedBy" TEXT NOT NULL,

    CONSTRAINT "Revocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationEvent" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endpoint" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "receiptId" TEXT,
    "organizationId" TEXT,

    CONSTRAINT "VerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "parcelId" TEXT NOT NULL,
    "currentOwner" TEXT NOT NULL,
    "lastSaleDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("parcelId")
);

-- CreateTable
CREATE TABLE "CountyRecord" (
    "parcelId" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CountyRecord_pkey" PRIMARY KEY ("parcelId")
);

-- CreateTable
CREATE TABLE "Notary" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commissionState" TEXT NOT NULL,

    CONSTRAINT "Notary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestLog" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,
    "receiptId" TEXT,
    "status" INTEGER NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "RequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiKeySecondary" TEXT,
    "rateLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionDays" INTEGER,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_apiKey_key" ON "Organization"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_apiKeySecondary_key" ON "Organization"("apiKeySecondary");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revocation" ADD CONSTRAINT "Revocation_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revocation" ADD CONSTRAINT "Revocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationEvent" ADD CONSTRAINT "VerificationEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestLog" ADD CONSTRAINT "RequestLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

