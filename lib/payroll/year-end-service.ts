import { prisma } from "@/lib/db";
import type { EmploymentType } from "@prisma/client";

/**
 * Service feuillets de fin d'année (T4 / T4A).
 *
 * Logique fiscale canadienne :
 *  - T4  : employé au sens légal (retenues CPP/AE/impôt à la source).
 *  - T4A : contractuel / travailleur indépendant (case 48 — honoraires).
 *
 * SAFE produit un **récapitulatif interne** (PDF) que l'avocate remet
 * à son comptable ou entre dans son logiciel de paie. SAFE ne calcule
 * PAS les retenues CPP/AE/impôt et ne transmet PAS à l'ARC.
 *
 * Critère d'inclusion : Payslip.paymentDate dans l'année civile ET
 * Payslip.status = 'paid'. Les brouillons/impayés sont exclus.
 */

export interface YearEndPayslipRow {
  payslipId: string;
  periodLabel: string; // ex. « 1 jan 2026 – 15 jan 2026 »
  paymentDate: Date;
  hoursWorked: number;
  hourlyRate: number;
  grossPay: number;
  deductions: number;
  netPay: number;
}

export interface YearEndEmployeeSummary {
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  employmentType: EmploymentType;
  /** NAS masqué pour affichage (***-***-XXX). Null si non renseigné. */
  sinMasked: string | null;
  /** NAS brut pour le PDF comptable. Null si non renseigné. */
  sinFull: string | null;
  payslips: YearEndPayslipRow[];
  // Totaux annuels
  totalHours: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  payslipCount: number;
}

export interface YearEndSummary {
  cabinetId: string;
  cabinetNom: string;
  year: number;
  employees: YearEndEmployeeSummary[];
  generatedAt: Date;
}

/** Masque un NAS : « 123-456-789 » → « ***-***-789 ». */
function maskSin(sin: string | null): string | null {
  if (!sin) return null;
  const digits = sin.replace(/\D/g, "");
  if (digits.length !== 9) return "***-***-***";
  return `***-***-${digits.slice(6)}`;
}

/** Formate les dates d'une période PayrollPeriod. */
function formatPeriodLabel(start: Date, end: Date, locale = "fr-CA"): string {
  const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

/**
 * Agrège les Payslip payés d'une année civile pour tous les employés du cabinet.
 *
 * @param cabinetId  ID du cabinet
 * @param year       Année civile (ex. 2026)
 */
export async function getYearEndSummary(
  cabinetId: string,
  year: number,
): Promise<YearEndSummary> {
  const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
  const yearEnd = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { nom: true },
  });
  if (!cabinet) throw new Error("Cabinet introuvable.");

  // Charger tous les employés actifs + archivés du cabinet
  const employees = await prisma.employee.findMany({
    where: { cabinetId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      email: true,
      employmentType: true,
      sinNumero: true,
      payslips: {
        where: {
          status: "paid",
          paymentDate: { gte: yearStart, lt: yearEnd },
        },
        include: {
          period: {
            select: { periodStart: true, periodEnd: true },
          },
        },
        orderBy: { paymentDate: "asc" },
      },
    },
    orderBy: { lastName: "asc" },
  });

  const summaries: YearEndEmployeeSummary[] = employees
    .filter((emp) => emp.payslips.length > 0) // exclure employés sans paye cette année
    .map((emp) => {
      const rows: YearEndPayslipRow[] = emp.payslips.map((ps) => ({
        payslipId: ps.id,
        periodLabel: formatPeriodLabel(ps.period.periodStart, ps.period.periodEnd),
        paymentDate: ps.paymentDate!,
        hoursWorked: ps.hoursWorked,
        hourlyRate: ps.hourlyRate,
        grossPay: ps.grossPay,
        deductions: ps.deductions,
        netPay: ps.netPay,
      }));

      const totalGross = rows.reduce((s, r) => s + r.grossPay, 0);
      const totalDeductions = rows.reduce((s, r) => s + r.deductions, 0);
      const totalNet = rows.reduce((s, r) => s + r.netPay, 0);
      const totalHours = rows.reduce((s, r) => s + r.hoursWorked, 0);

      return {
        employeeId: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: emp.fullName,
        email: emp.email,
        employmentType: emp.employmentType,
        sinMasked: maskSin(emp.sinNumero),
        sinFull: emp.sinNumero ?? null,
        payslips: rows,
        totalHours,
        totalGross,
        totalDeductions,
        totalNet,
        payslipCount: rows.length,
      };
    });

  return {
    cabinetId,
    cabinetNom: cabinet.nom,
    year,
    employees: summaries,
    generatedAt: new Date(),
  };
}

/**
 * Retourne les années pour lesquelles au moins un Payslip payé existe
 * dans le cabinet (pour peupler le sélecteur d'année).
 */
export async function getAvailableYearEndYears(cabinetId: string): Promise<number[]> {
  const result = await prisma.$queryRaw<{ yr: number }[]>`
    SELECT DISTINCT EXTRACT(YEAR FROM ps."paymentDate")::int AS yr
    FROM "Payslip" ps
    JOIN "Employee" e ON e.id = ps."employeeId"
    WHERE e."cabinetId" = ${cabinetId}
      AND ps.status = 'paid'
      AND ps."paymentDate" IS NOT NULL
    ORDER BY yr DESC
  `;
  return result.map((r) => r.yr);
}
