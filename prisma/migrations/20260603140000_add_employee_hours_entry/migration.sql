-- Mon temps & ma paye — soumission d'heures employé (N8).
--
-- Doctrine: docs/product/SPEC_aaliyah_home_navette.md §7bis
--
-- Migration ADDITIVE : crée l'enum `EmployeeHoursStatus` et la table
-- `EmployeeHoursEntry`. Ne touche à aucune table/donnée existante.
-- DISTINCT du temps facturable client (`TimeEntry`). Les entrées `approved`
-- d'une période s'agrègent ensuite dans un `Payslip` (paie existante).

CREATE TYPE "EmployeeHoursStatus" AS ENUM (
  'submitted',
  'approved',
  'rejected',
  'paid'
);

CREATE TABLE "EmployeeHoursEntry" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "dossierId" TEXT,
    "note" TEXT,
    "status" "EmployeeHoursStatus" NOT NULL DEFAULT 'submitted',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "payslipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeHoursEntry_pkey" PRIMARY KEY ("id")
);

-- Index : inbox employée par statut + inbox admin (à approuver) + jointure paie.
CREATE INDEX "EmployeeHoursEntry_cabinetId_employeeId_status_idx"
  ON "EmployeeHoursEntry" ("cabinetId", "employeeId", "status");

CREATE INDEX "EmployeeHoursEntry_cabinetId_status_idx"
  ON "EmployeeHoursEntry" ("cabinetId", "status");

CREATE INDEX "EmployeeHoursEntry_payslipId_idx"
  ON "EmployeeHoursEntry" ("payslipId");

-- Foreign keys. cabinet/employee en CASCADE ; dossier/reviewer/payslip en
-- SET NULL (références facultatives : traçabilité, audit, rattachement paie).
ALTER TABLE "EmployeeHoursEntry"
  ADD CONSTRAINT "EmployeeHoursEntry_cabinetId_fkey"
  FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeHoursEntry"
  ADD CONSTRAINT "EmployeeHoursEntry_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeHoursEntry"
  ADD CONSTRAINT "EmployeeHoursEntry_dossierId_fkey"
  FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmployeeHoursEntry"
  ADD CONSTRAINT "EmployeeHoursEntry_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmployeeHoursEntry"
  ADD CONSTRAINT "EmployeeHoursEntry_payslipId_fkey"
  FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
