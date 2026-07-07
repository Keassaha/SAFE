-- Reconcile schema drift caught by the deploy guardrail (P0 anti-recurrence, 2026-07-07).
-- 1) Payment: provider / providerRef + idempotence unique index (import Interac L4/L5, commit 30daac9)
-- 2) DossierDocketEntry.updatedAt: drop stray now() default (schema uses @updatedAt only)

-- AlterTable
ALTER TABLE "DossierDocketEntry" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_cabinetId_providerRef_key" ON "Payment"("cabinetId", "providerRef");
