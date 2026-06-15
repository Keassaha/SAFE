-- Lot 3 — Verrouillage de période comptable (doctrine §9). Migration additive.

CREATE TABLE "AccountingPeriodLock" (
  "id"         TEXT NOT NULL,
  "cabinetId"  TEXT NOT NULL,
  "periode"    TEXT NOT NULL,
  "lockedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedById" TEXT,
  "reason"     TEXT,
  CONSTRAINT "AccountingPeriodLock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccountingPeriodLock_cabinetId_periode_key"
  ON "AccountingPeriodLock" ("cabinetId", "periode");

CREATE INDEX "AccountingPeriodLock_cabinetId_idx"
  ON "AccountingPeriodLock" ("cabinetId");

ALTER TABLE "AccountingPeriodLock"
  ADD CONSTRAINT "AccountingPeriodLock_cabinetId_fkey"
  FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
