import type { EmployeeHoursStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Mon temps & ma paye — soumission d'heures employé (N8).
 * Doctrine : docs/product/SPEC_aaliyah_home_navette.md §7bis.
 *
 * DISTINCT du temps facturable client (`TimeEntry`). Ici une employée soumet
 * SES heures travaillées pour être payée ; l'avocate/admin approuve ; les
 * heures approuvées s'agrègent ensuite dans un `Payslip` (paie existante).
 */

type DBClient = Prisma.TransactionClient | typeof prisma;

// ——— Helpers purs (testables sans DB) ———

/** Une soumission ne peut être retirée par l'employée que tant qu'elle est `submitted`. */
export function canWithdrawHours(
  status: EmployeeHoursStatus,
  entryEmployeeId: string,
  currentEmployeeId: string,
): boolean {
  return status === "submitted" && entryEmployeeId === currentEmployeeId;
}

/** On ne peut approuver/rejeter qu'une soumission encore `submitted`. */
export function canReviewHours(status: EmployeeHoursStatus): boolean {
  return status === "submitted";
}

/** Heures valides : nombre fini, strictement positif, plafonné à 24h/jour. */
export function isValidHours(hours: number): boolean {
  return Number.isFinite(hours) && hours > 0 && hours <= 24;
}

export interface HoursSummary {
  submittedHours: number;
  approvedHours: number;
  paidHours: number;
  rejectedCount: number;
  /** Paye attendue sur les heures déjà approuvées (non encore payées). */
  expectedPay: number;
  /** Paye déjà versée (heures `paid`). */
  paidPay: number;
}

/** Agrège une liste d'entrées en totaux par statut + paye attendue. */
export function summarizeHours(
  entries: Array<{ hours: number; status: EmployeeHoursStatus }>,
  hourlyRate: number,
): HoursSummary {
  let submittedHours = 0;
  let approvedHours = 0;
  let paidHours = 0;
  let rejectedCount = 0;
  for (const e of entries) {
    switch (e.status) {
      case "submitted":
        submittedHours += e.hours;
        break;
      case "approved":
        approvedHours += e.hours;
        break;
      case "paid":
        paidHours += e.hours;
        break;
      case "rejected":
        rejectedCount += 1;
        break;
    }
  }
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    submittedHours: round2(submittedHours),
    approvedHours: round2(approvedHours),
    paidHours: round2(paidHours),
    rejectedCount,
    expectedPay: round2(approvedHours * hourlyRate),
    paidPay: round2(paidHours * hourlyRate),
  };
}

// ——— Lecture ———

/** Récupère la fiche employée liée à un compte utilisateur (scope cabinet). */
export async function getCurrentEmployee(cabinetId: string, userId: string) {
  return prisma.employee.findFirst({
    where: { cabinetId, userId },
    select: { id: true, fullName: true, hourlyRate: true, status: true },
  });
}

export interface MyHoursView {
  employee: { id: string; fullName: string; hourlyRate: number };
  entries: Array<{
    id: string;
    date: Date;
    hours: number;
    status: EmployeeHoursStatus;
    note: string | null;
    dossierId: string | null;
    dossierLabel: string | null;
    rejectionReason: string | null;
    submittedAt: Date;
  }>;
  summary: HoursSummary;
}

/** Vue Aaliyah : ses soumissions récentes + totaux + paye attendue. */
export async function getMyHours(
  cabinetId: string,
  employeeId: string,
  limit = 60,
): Promise<MyHoursView | null> {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, cabinetId },
    select: { id: true, fullName: true, hourlyRate: true },
  });
  if (!employee) return null;

  const rows = await prisma.employeeHoursEntry.findMany({
    where: { cabinetId, employeeId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      dossier: { select: { numeroDossier: true, intitule: true } },
    },
  });

  const entries = rows.map((r) => ({
    id: r.id,
    date: r.date,
    hours: r.hours,
    status: r.status,
    note: r.note,
    dossierId: r.dossierId,
    dossierLabel: r.dossier ? r.dossier.numeroDossier?.trim() || r.dossier.intitule : null,
    rejectionReason: r.rejectionReason,
    submittedAt: r.submittedAt,
  }));

  return {
    employee,
    entries,
    summary: summarizeHours(entries, employee.hourlyRate),
  };
}

/** Vue admin : soumissions `submitted` à approuver pour une employée. */
export async function getPendingHoursForEmployee(cabinetId: string, employeeId: string) {
  const rows = await prisma.employeeHoursEntry.findMany({
    where: { cabinetId, employeeId, status: "submitted" },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: { dossier: { select: { numeroDossier: true, intitule: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    hours: r.hours,
    note: r.note,
    dossierId: r.dossierId,
    dossierLabel: r.dossier ? r.dossier.numeroDossier?.trim() || r.dossier.intitule : null,
    submittedAt: r.submittedAt,
  }));
}

/** Heures approuvées non encore rattachées à une paie (pour roll-into-payslip). */
export async function getApprovedUnbilledHours(cabinetId: string, employeeId: string) {
  return prisma.employeeHoursEntry.findMany({
    where: { cabinetId, employeeId, status: "approved", payslipId: null },
    orderBy: { date: "asc" },
    select: { id: true, date: true, hours: true },
  });
}

/** Nombre total de soumissions en attente d'approbation (badge admin). */
export async function countPendingHours(cabinetId: string): Promise<number> {
  return prisma.employeeHoursEntry.count({
    where: { cabinetId, status: "submitted" },
  });
}

// ——— Écriture ———

export interface SubmitHoursInput {
  cabinetId: string;
  employeeId: string;
  date: Date;
  hours: number;
  dossierId?: string | null;
  note?: string | null;
}

export async function submitEmployeeHours(input: SubmitHoursInput) {
  if (!isValidHours(input.hours)) {
    throw new Error("Nombre d'heures invalide (doit être entre 0 et 24).");
  }
  return prisma.employeeHoursEntry.create({
    data: {
      cabinetId: input.cabinetId,
      employeeId: input.employeeId,
      date: input.date,
      hours: input.hours,
      dossierId: input.dossierId || null,
      note: input.note?.trim() || null,
      status: "submitted",
    },
  });
}

/** Retire une soumission (uniquement par l'employée et tant que `submitted`). */
export async function withdrawEmployeeHours(
  cabinetId: string,
  employeeId: string,
  entryId: string,
) {
  const entry = await prisma.employeeHoursEntry.findFirst({
    where: { id: entryId, cabinetId },
    select: { id: true, status: true, employeeId: true },
  });
  if (!entry) throw new Error("Soumission introuvable.");
  if (!canWithdrawHours(entry.status, entry.employeeId, employeeId)) {
    throw new Error("Cette soumission ne peut plus être retirée.");
  }
  await prisma.employeeHoursEntry.delete({ where: { id: entry.id } });
}

export async function approveEmployeeHours(
  cabinetId: string,
  reviewerUserId: string,
  entryId: string,
) {
  const entry = await prisma.employeeHoursEntry.findFirst({
    where: { id: entryId, cabinetId },
    select: { id: true, status: true, employeeId: true },
  });
  if (!entry) throw new Error("Soumission introuvable.");
  if (!canReviewHours(entry.status)) {
    throw new Error("Seule une soumission en attente peut être approuvée.");
  }
  await prisma.employeeHoursEntry.update({
    where: { id: entry.id },
    data: { status: "approved", reviewedById: reviewerUserId, reviewedAt: new Date(), rejectionReason: null },
  });
  return entry.employeeId;
}

export async function rejectEmployeeHours(
  cabinetId: string,
  reviewerUserId: string,
  entryId: string,
  reason: string,
) {
  const entry = await prisma.employeeHoursEntry.findFirst({
    where: { id: entryId, cabinetId },
    select: { id: true, status: true, employeeId: true },
  });
  if (!entry) throw new Error("Soumission introuvable.");
  if (!canReviewHours(entry.status)) {
    throw new Error("Seule une soumission en attente peut être rejetée.");
  }
  await prisma.employeeHoursEntry.update({
    where: { id: entry.id },
    data: {
      status: "rejected",
      reviewedById: reviewerUserId,
      reviewedAt: new Date(),
      rejectionReason: reason.trim() || null,
    },
  });
  return entry.employeeId;
}

/**
 * Agrège les heures APPROUVÉES d'une employée sur une période dans un `Payslip`
 * (crée la période si besoin). Rattache les entrées au payslip. La paie
 * existante (statuts draft/generated/paid) prend ensuite le relais.
 */
export async function rollHoursIntoPayslip(
  cabinetId: string,
  employeeId: string,
  periodStart: Date,
  periodEnd: Date,
) {
  const start = new Date(periodStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(periodEnd);
  end.setHours(23, 59, 59, 999);

  return prisma.$transaction(async (tx: DBClient) => {
    const employee = await tx.employee.findFirst({
      where: { id: employeeId, cabinetId },
      select: { id: true, hourlyRate: true },
    });
    if (!employee) throw new Error("Employé introuvable.");

    const entries = await tx.employeeHoursEntry.findMany({
      where: {
        cabinetId,
        employeeId,
        status: "approved",
        payslipId: null,
        date: { gte: start, lte: end },
      },
      select: { id: true, hours: true },
    });
    if (entries.length === 0) {
      throw new Error("Aucune heure approuvée à inclure pour cette période.");
    }

    const totalHours = Math.round(entries.reduce((s, e) => s + e.hours, 0) * 100) / 100;
    const rate = employee.hourlyRate;
    const grossPay = Math.round(totalHours * rate * 100) / 100;

    // Réutilise la période si elle existe déjà.
    let period = await tx.payrollPeriod.findFirst({
      where: { cabinetId, periodStart: start, periodEnd: end },
    });
    period ??= await tx.payrollPeriod.create({
      data: { cabinetId, periodStart: start, periodEnd: end, frequency: "weekly", status: "draft" },
    });

    // Réutilise / crée le bulletin de l'employée pour la période.
    const existing = await tx.payslip.findFirst({
      where: { employeeId, payrollPeriodId: period.id },
    });

    const payslip = existing
      ? await tx.payslip.update({
          where: { id: existing.id },
          data: {
            hoursWorked: totalHours,
            hourlyRate: rate,
            grossPay,
            netPay: grossPay - existing.deductions,
            status: "generated",
          },
        })
      : await tx.payslip.create({
          data: {
            employeeId,
            payrollPeriodId: period.id,
            hoursWorked: totalHours,
            hourlyRate: rate,
            grossPay,
            deductions: 0,
            netPay: grossPay,
            status: "generated",
          },
        });

    await tx.employeeHoursEntry.updateMany({
      where: { id: { in: entries.map((e) => e.id) } },
      data: { payslipId: payslip.id },
    });

    return { payslipId: payslip.id, totalHours, grossPay, entryCount: entries.length };
  });
}
