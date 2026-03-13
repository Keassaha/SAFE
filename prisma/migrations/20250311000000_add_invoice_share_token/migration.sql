-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "shareToken" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "shareTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_shareToken_key" ON "Invoice"("shareToken");
