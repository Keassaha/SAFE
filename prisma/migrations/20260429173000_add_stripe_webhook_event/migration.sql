-- Idempotence for Stripe webhooks. Stripe event IDs are globally unique and
-- should be recorded before mutating subscription state.
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cabinetId" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StripeWebhookEvent_type_idx" ON "StripeWebhookEvent"("type");
CREATE INDEX "StripeWebhookEvent_cabinetId_idx" ON "StripeWebhookEvent"("cabinetId");

ALTER TABLE "StripeWebhookEvent"
ADD CONSTRAINT "StripeWebhookEvent_cabinetId_fkey"
FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
