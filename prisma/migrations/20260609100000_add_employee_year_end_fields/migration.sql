-- Migration: champs fin d'année sur Employee
-- Ajoute le type d'emploi (T4 = employee, T4A = contractor) et le NAS optionnel.
-- Additif, aucun risque de perte de données.

CREATE TYPE "EmploymentType" AS ENUM ('employee', 'contractor');

ALTER TABLE "Employee"
  ADD COLUMN "employmentType" "EmploymentType" NOT NULL DEFAULT 'employee',
  ADD COLUMN "sinNumero"      TEXT;
