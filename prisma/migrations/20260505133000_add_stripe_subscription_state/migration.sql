ALTER TABLE "Cabinet"
  ADD COLUMN "stripeSubscriptionStatus" TEXT,
  ADD COLUMN "stripeCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "stripeTrialEnd" TIMESTAMP(3);
