"use server";

import { prisma } from "@/lib/db";

export type AuditEntityType =
  | "Client"
  | "Dossier"
  | "Document"
  | "ConsentLog"
  | "ClientIdentityVerification"
  | "TimeEntry"
  | "Invoice"
  | "Payment"
  | "Expense"
  | "DeboursDossier"
  | "CreditNote"
  | "TrustAccount"
  | "TrustTransaction";

export type AuditAction = "create" | "update" | "delete" | "view" | "view_sensitive" | "download";

export interface CreateAuditLogParams {
  cabinetId: string;
  userId?: string | null;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  metadata?: Record<string, unknown> | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  performedBy?: string | null;
  performedAt?: Date | null;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Enregistre une entrée immuable dans la piste d'audit.
 * À appeler après toute action sensible (création, modification, suppression, accès à des champs sensibles).
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  const {
    cabinetId,
    userId,
    entityType,
    entityId,
    action,
    metadata,
    oldValues,
    newValues,
    performedBy,
    performedAt,
    ip,
    userAgent,
  } = params;
  await prisma.auditLog.create({
    data: {
      cabinetId,
      userId: userId ?? performedBy ?? undefined,
      entityType,
      entityId,
      action,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      oldValues: oldValues ? JSON.stringify(oldValues) : undefined,
      newValues: newValues ? JSON.stringify(newValues) : undefined,
      performedBy: performedBy ?? undefined,
      performedAt: performedAt ?? undefined,
      ip: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    },
  });
}
