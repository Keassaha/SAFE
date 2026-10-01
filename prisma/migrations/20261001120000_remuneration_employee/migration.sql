-- CreateEnum
CREATE TYPE "PayslipLineKind" AS ENUM ('salaire_fixe', 'compensation_dossier', 'heures_aide_juridique');

-- AlterEnum
ALTER TYPE "PayrollFrequency" ADD VALUE 'monthly';

-- CreateTable
CREATE TABLE "PayslipLine" (
    "id" TEXT NOT NULL,
    "payslipId" TEXT NOT NULL,
    "kind" "PayslipLineKind" NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayslipLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeCompensationPlan" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "monthlySalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "legalAidHourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "legalAidSubjectCode" TEXT NOT NULL DEFAULT 'LAO',
    "grid" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeCompensationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeCompensationClaim" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "EmployeeHoursStatus" NOT NULL DEFAULT 'submitted',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "payslipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeCompensationClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PayslipLine_payslipId_idx" ON "PayslipLine"("payslipId");

-- CreateIndex
CREATE INDEX "EmployeeCompensationPlan_cabinetId_employeeId_effectiveFrom_idx" ON "EmployeeCompensationPlan"("cabinetId", "employeeId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "EmployeeCompensationClaim_cabinetId_employeeId_status_idx" ON "EmployeeCompensationClaim"("cabinetId", "employeeId", "status");

-- CreateIndex
CREATE INDEX "EmployeeCompensationClaim_dossierId_idx" ON "EmployeeCompensationClaim"("dossierId");

-- CreateIndex
CREATE INDEX "EmployeeCompensationClaim_payslipId_idx" ON "EmployeeCompensationClaim"("payslipId");

-- AddForeignKey
ALTER TABLE "PayslipLine" ADD CONSTRAINT "PayslipLine_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCompensationPlan" ADD CONSTRAINT "EmployeeCompensationPlan_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCompensationPlan" ADD CONSTRAINT "EmployeeCompensationPlan_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCompensationPlan" ADD CONSTRAINT "EmployeeCompensationPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCompensationClaim" ADD CONSTRAINT "EmployeeCompensationClaim_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCompensationClaim" ADD CONSTRAINT "EmployeeCompensationClaim_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCompensationClaim" ADD CONSTRAINT "EmployeeCompensationClaim_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCompensationClaim" ADD CONSTRAINT "EmployeeCompensationClaim_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCompensationClaim" ADD CONSTRAINT "EmployeeCompensationClaim_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

