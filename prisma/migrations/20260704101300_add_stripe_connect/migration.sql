-- AlterTable: Stripe Connect fields for online invoice payment (ADR-012, lot 1, commit 5fefd57)
ALTER TABLE "Cabinet" ADD COLUMN     "stripeConnectAccountId" TEXT,
ADD COLUMN     "stripeConnectChargesEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Cabinet_stripeConnectAccountId_key" ON "Cabinet"("stripeConnectAccountId");
