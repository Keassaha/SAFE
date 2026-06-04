"use server";

import { revalidatePath } from "next/cache";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManagePayroll } from "@/lib/auth/permissions";
import { routes } from "@/lib/routes";
import { sanitizeInput } from "@/lib/utils/sanitize";
import { createAuditLog } from "@/lib/services/audit";
import {
  getCurrentEmployee,
  submitEmployeeHours,
  withdrawEmployeeHours,
  approveEmployeeHours,
  rejectEmployeeHours,
  rollHoursIntoPayslip,
} from "@/lib/payroll/employee-hours-service";

type Role = Parameters<typeof canManagePayroll>[0];

// ——— Employée (Aaliyah) ———

export interface SubmitMyHoursInput {
  date: string; // yyyy-mm-dd
  hours: number;
  dossierId?: string | null;
  note?: string | null;
}

export async function submitMyHoursAction(input: SubmitMyHoursInput) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const employee = await getCurrentEmployee(cabinetId, userId);
  if (!employee) {
    throw new Error("Aucune fiche employé liée à votre compte. Contactez votre administrateur.");
  }
  if (employee.status !== "active") {
    throw new Error("Votre fiche employé est inactive.");
  }

  const parsedDate = new Date(`${input.date}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Date invalide.");
  }

  const entry = await submitEmployeeHours({
    cabinetId,
    employeeId: employee.id,
    date: parsedDate,
    hours: Number(input.hours),
    dossierId: input.dossierId || null,
    note: input.note ? sanitizeInput(input.note) : null,
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "EmployeeHoursEntry",
    entityId: entry.id,
    action: "create",
    metadata: { hours: entry.hours, status: "submitted" },
  });

  revalidatePath(routes.mesHeures);
}

export async function withdrawMyHoursAction(entryId: string) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const employee = await getCurrentEmployee(cabinetId, userId);
  if (!employee) throw new Error("Aucune fiche employé liée à votre compte.");

  await withdrawEmployeeHours(cabinetId, employee.id, entryId);

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "EmployeeHoursEntry",
    entityId: entryId,
    action: "delete",
    metadata: { reason: "withdrawn_by_employee" },
  });

  revalidatePath(routes.mesHeures);
}

// ——— Admin / avocate ———

export async function approveHoursAction(entryId: string) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canManagePayroll(role as Role)) throw new Error("Non autorisé à approuver des heures.");

  const employeeId = await approveEmployeeHours(cabinetId, userId, entryId);

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "EmployeeHoursEntry",
    entityId: entryId,
    action: "update",
    metadata: { status: "approved" },
  });

  revalidatePath(routes.employee(employeeId));
  revalidatePath(routes.mesHeures);
}

export async function rejectHoursAction(entryId: string, reason: string) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canManagePayroll(role as Role)) throw new Error("Non autorisé à rejeter des heures.");

  const cleanReason = sanitizeInput(reason ?? "").trim();
  const employeeId = await rejectEmployeeHours(cabinetId, userId, entryId, cleanReason);

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "EmployeeHoursEntry",
    entityId: entryId,
    action: "update",
    metadata: { status: "rejected" },
  });

  revalidatePath(routes.employee(employeeId));
  revalidatePath(routes.mesHeures);
}

export async function rollHoursIntoPayslipAction(
  employeeId: string,
  periodStart: string,
  periodEnd: string,
) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canManagePayroll(role as Role)) throw new Error("Non autorisé à générer une paie.");

  const result = await rollHoursIntoPayslip(
    cabinetId,
    employeeId,
    new Date(`${periodStart}T00:00:00`),
    new Date(`${periodEnd}T23:59:59`),
  );

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "EmployeeHoursEntry",
    entityId: result.payslipId,
    action: "update",
    metadata: { rolledInto: "payslip", entryCount: result.entryCount, totalHours: result.totalHours },
  });

  revalidatePath(routes.employee(employeeId));
  return result;
}
