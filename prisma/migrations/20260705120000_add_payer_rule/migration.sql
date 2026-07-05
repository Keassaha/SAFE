-- Règles de payeur tiers (import intelligent de preuve de paiement) — lot L5.
-- Additif : nouveau type + nouvelle table, aucune table existante touchée.

-- CreateEnum
CREATE TYPE "PayerRuleScope" AS ENUM ('CLIENT_UNIQUE', 'PAYEUR_CONNU');

-- CreateTable
CREATE TABLE "PayerRule" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "payerEmail" TEXT,
    "payerName" TEXT,
    "clientId" TEXT,
    "dossierId" TEXT,
    "scope" "PayerRuleScope" NOT NULL,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayerRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PayerRule_cabinetId_payerEmail_idx" ON "PayerRule"("cabinetId", "payerEmail");
CREATE INDEX "PayerRule_cabinetId_idx" ON "PayerRule"("cabinetId");

-- AddForeignKey
ALTER TABLE "PayerRule" ADD CONSTRAINT "PayerRule_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PayerRule" ADD CONSTRAINT "PayerRule_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
