/**
 * CabinetReadinessSnapshot — photo immuable de l'état du cabinet.
 *
 * Assemblée par le loader (lit Prisma + parseCabinetConfig). Le MOTEUR ne connaît
 * que ce snapshot : aucune requête Prisma dans la logique de décision, ce qui rend
 * chaque domaine testable comme une fonction pure `(snapshot) => DomainResult`.
 */

import type { EmployeeRole, EmployeeStatus } from "@prisma/client";
import type { CabinetTaxNumbers } from "@/lib/cabinet-config";
import type { TrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";

export interface RetentionPolicySnapshot {
  documentType: string;
  retentionYears: number;
}

export interface EmployeeSnapshot {
  role: EmployeeRole;
  status: EmployeeStatus;
  /** Compte de connexion lié (null = pas d'accès au portail). */
  userId: string | null;
}

export interface CabinetReadinessSnapshot {
  identity: {
    nom: string | null;
    adresse: string | null;
    email: string | null;
    barreauNumero: string | null;
  };
  /** Province / juridiction du cabinet (ex. "QC", "ON"). */
  province: string | null;
  subscription: {
    plan: string | null;
    stripeSubscriptionStatus: string | null;
    stripeCurrentPeriodEnd: Date | null;
    stripeCancelAtPeriodEnd: boolean | null;
    stripeTrialEnd: Date | null;
  };
  /** Numéros d'inscription aux taxes (selon la province). */
  taxNumbers: CabinetTaxNumbers;
  team: {
    employees: EmployeeSnapshot[];
    /** Nombre de comptes User avec le rôle admin_cabinet. */
    adminUserCount: number;
  };
  audit: {
    /** Date de la dernière écriture au journal d'audit (null = aucune). */
    lastEntryAt: Date | null;
  };
  billing: {
    hasInvoiceConfig: boolean;
    template: string | null;
    hasNotice: boolean;
    hasSignature: boolean;
  };
  /** Statut de rapprochement fidéicommis (null = aucune activité de fidéicommis). */
  trust: TrustReconciliationStatus | null;
  userAccess: {
    totalUsers: number;
    /** Comptes User sans Employee lié. */
    usersWithoutEmployee: number;
  };
  console: {
    /** Cabinet interne SAFE Inc. (garde Console). */
    isSafeInc: boolean;
  };
  retention: {
    policies: RetentionPolicySnapshot[];
  };
}
