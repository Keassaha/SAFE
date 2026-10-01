"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManagePayroll } from "@/lib/auth/permissions";
import { routes } from "@/lib/routes";
import { sanitizeInput } from "@/lib/utils/sanitize";
import { createAuditLog } from "@/lib/services/audit";
import { getCurrentEmployee } from "@/lib/payroll/employee-hours-service";
import {
  approveEmployeeHours,
  rejectEmployeeHours,
  withdrawEmployeeHours,
} from "@/lib/payroll/employee-hours-service";
import {
  reviewClaim,
  savePlan,
  submitClaims,
  submitLegalAidHours,
  validateMonthlyPay,
  withdrawClaim,
} from "@/lib/payroll/remuneration-service";

/**
 * Rémunération à trois sources. Doctrine : docs/product/SPEC_REMUNERATION_AALIYAH.md
 *
 * Deux portes vers l'espace de l'employée : son propre compte, ou le compte de
 * l'avocate (Me Derisier n'ouvre pas SAFE, son adjointe passe par son compte).
 * Le journal d'audit note par quelle porte chaque déclaration est entrée.
 */

type Role = Parameters<typeof canManagePayroll>[0];

async function actorFor(employeeId: string) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  const own = await getCurrentEmployee(cabinetId, userId);
  if (own?.id === employeeId) {
    if (own.status !== "active") throw new Error("Cette fiche employée est inactive.");
    return { cabinetId, userId, via: "compte_employee" as const };
  }
  if (!canManagePayroll(role as Role)) throw new Error("Non autorisé.");
  const employee = await prisma.employee.findFirst({ where: { id: employeeId, cabinetId }, select: { id: true } });
  if (!employee) throw new Error("Employée introuvable.");
  return { cabinetId, userId, via: "compte_avocate" as const };
}

async function reviewer() {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canManagePayroll(role as Role)) throw new Error("Non autorisé à approuver la paie.");
  return { cabinetId, userId };
}

function refresh(employeeId: string) {
  revalidatePath(routes.mesHeures);
  revalidatePath(routes.employee(employeeId));
  revalidatePath(routes.employeeEspace(employeeId));
}

// ——— Côté employée ———

export async function submitClaimsAction(employeeId: string, dossierIds: string[]) {
  const a = await actorFor(employeeId);
  const created = await submitClaims(a.cabinetId, employeeId, dossierIds);
  for (const c of created) {
    await createAuditLog({
      cabinetId: a.cabinetId,
      userId: a.userId,
      entityType: "EmployeeCompensationClaim",
      entityId: c.id,
      action: "create",
      metadata: { amount: c.amount, subjectCode: c.subjectCode, via: a.via },
    });
  }
  refresh(employeeId);
}

export async function withdrawClaimAction(employeeId: string, claimId: string) {
  const a = await actorFor(employeeId);
  await withdrawClaim(a.cabinetId, employeeId, claimId);
  await createAuditLog({
    cabinetId: a.cabinetId,
    userId: a.userId,
    entityType: "EmployeeCompensationClaim",
    entityId: claimId,
    action: "delete",
    metadata: { reason: "withdrawn_before_review", via: a.via },
  });
  refresh(employeeId);
}

export async function submitLegalAidHoursAction(
  employeeId: string,
  input: { date: string; hours: number; dossierId: string; note?: string | null },
) {
  const a = await actorFor(employeeId);
  const date = new Date(`${input.date}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Date invalide.");
  const entry = await submitLegalAidHours({
    cabinetId: a.cabinetId,
    employeeId,
    dossierId: input.dossierId,
    date,
    hours: Number(input.hours),
    note: input.note ? sanitizeInput(input.note) : null,
  });
  await createAuditLog({
    cabinetId: a.cabinetId,
    userId: a.userId,
    entityType: "EmployeeHoursEntry",
    entityId: entry.id,
    action: "create",
    metadata: { hours: entry.hours, kind: "aide_juridique", via: a.via },
  });
  refresh(employeeId);
}

export async function withdrawLegalAidHoursAction(employeeId: string, entryId: string) {
  const a = await actorFor(employeeId);
  await withdrawEmployeeHours(a.cabinetId, employeeId, entryId);
  await createAuditLog({
    cabinetId: a.cabinetId,
    userId: a.userId,
    entityType: "EmployeeHoursEntry",
    entityId: entryId,
    action: "delete",
    metadata: { reason: "withdrawn_before_review", via: a.via },
  });
  refresh(employeeId);
}

// ——— Côté avocate ———

export async function reviewClaimAction(claimId: string, decision: "approve" | "reject", reason?: string) {
  const r = await reviewer();
  const clean = reason ? sanitizeInput(reason).trim() : undefined;
  const employeeId = await reviewClaim(r.cabinetId, r.userId, claimId, decision, clean);
  await createAuditLog({
    cabinetId: r.cabinetId,
    userId: r.userId,
    entityType: "EmployeeCompensationClaim",
    entityId: claimId,
    action: "update",
    metadata: { status: decision === "approve" ? "approved" : "rejected" },
  });
  refresh(employeeId);
}

export async function reviewLegalAidHoursAction(entryId: string, decision: "approve" | "reject", reason?: string) {
  const r = await reviewer();
  const clean = reason ? sanitizeInput(reason).trim() : "";
  if (decision === "reject" && !clean) throw new Error("Indiquez le motif du rejet.");
  const employeeId =
    decision === "approve"
      ? await approveEmployeeHours(r.cabinetId, r.userId, entryId)
      : await rejectEmployeeHours(r.cabinetId, r.userId, entryId, clean);
  await createAuditLog({
    cabinetId: r.cabinetId,
    userId: r.userId,
    entityType: "EmployeeHoursEntry",
    entityId: entryId,
    action: "update",
    metadata: { status: decision === "approve" ? "approved" : "rejected", kind: "aide_juridique" },
  });
  refresh(employeeId);
}

export async function validateMonthlyPayAction(employeeId: string, year: number, month: number) {
  const r = await reviewer();
  const result = await validateMonthlyPay(r.cabinetId, employeeId, year, month);
  await createAuditLog({
    cabinetId: r.cabinetId,
    userId: r.userId,
    entityType: "Payslip",
    entityId: result.payslipId,
    action: "create",
    metadata: { frequency: "monthly", year, month, gross: result.gross },
  });
  refresh(employeeId);
  return result;
}

export async function savePlanAction(
  employeeId: string,
  input: { monthlySalary: number; legalAidHourlyRate: number; grid: Record<string, number> },
) {
  const r = await reviewer();
  const plan = await savePlan({ cabinetId: r.cabinetId, employeeId, userId: r.userId, ...input });
  await createAuditLog({
    cabinetId: r.cabinetId,
    userId: r.userId,
    entityType: "EmployeeCompensationPlan",
    entityId: plan.id,
    action: "create",
    metadata: { monthlySalary: plan.monthlySalary, legalAidHourlyRate: plan.legalAidHourlyRate, grid: plan.grid },
  });
  refresh(employeeId);
}
