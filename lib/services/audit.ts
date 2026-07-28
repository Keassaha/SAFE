/**
 * Module SERVEUR (bibliothèque interne), pas un fichier d'actions.
 *
 * La directive "use server" a été retirée (audit sécurité 2026-07-28, §E4) : elle
 * transformait chaque fonction exportée en point d'entrée RPC adressable depuis le
 * navigateur. Or ces fonctions reçoivent `cabinetId` en PARAMÈTRE au lieu de le
 * dériver de la session : un appelant qui obtenait l'identifiant d'action pouvait
 * passer le cabinetId d'un autre cabinet et lire, écrire ou supprimer hors du sien.
 *
 * Ce module est importé par des routes API et des actions serveur qui portent déjà
 * leur propre garde de session. Ne PAS remettre "use server" ici.
 */

import { prisma } from "@/lib/db";

export type AuditEntityType =
  | "Cabinet"
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
  | "TrustTransaction"
  | "DossierNavetteMessage"
  | "EmployeeHoursEntry"
  // P4 — actions RH / paie (entityType est une colonne String : aucune migration).
  | "Employee"
  | "User"
  | "Invitation"
  | "Payslip";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "view"
  | "view_sensitive"
  | "download"
  // P3 — intention de remboursement d'un surpaiement (action est une colonne String : aucune migration).
  | "refund_requested";

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
