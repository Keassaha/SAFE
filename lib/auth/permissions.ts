import type { EmployeeRole, UserRole } from "@prisma/client";
import { can as rbacCan, getEffectiveRole, type RBACAction, type RBACModule } from "./rbac";

export const ROLES = {
  admin_cabinet: "Administrateur du cabinet",
  avocat: "Avocat",
  assistante: "Assistante juridique",
  comptabilite: "Comptabilité",
} as const;

export function canManageUsers(role: UserRole): boolean {
  return role === "admin_cabinet";
}

export function canManageCabinetSettings(role: UserRole): boolean {
  return role === "admin_cabinet";
}

/**
 * Accès complet au registre client : création, édition, **archivage**.
 *
 * L'avocat n'y est pas ajouté avec la création. Archiver un client touche à la
 * conservation des dossiers, et rien dans la demande ne portait là-dessus.
 * À ouvrir séparément si le besoin se présente.
 */
export function canManageClients(role: UserRole): boolean {
  return ["admin_cabinet", "assistante"].includes(role);
}

/** Voir la liste et les fiches clients. */
export function canViewClients(role: UserRole): boolean {
  return ["admin_cabinet", "avocat", "assistante", "comptabilite"].includes(role);
}

/** Voir la liste et les fiches dossiers. */
export function canViewDossiers(role: UserRole): boolean {
  return ["admin_cabinet", "avocat", "assistante", "comptabilite"].includes(role);
}

/** Éditer les clients (identification, représentation, etc.). Admin + Avocat. */
export function canEditClients(role: UserRole): boolean {
  return ["admin_cabinet", "avocat"].includes(role);
}

/**
 * Créer un nouveau client. Admin + Assistante + Avocat.
 *
 * L'avocat en était exclu, cohérent avec un cabinet où l'adjointe fait
 * l'intake. Intenable pour un praticien seul : il ne pouvait ouvrir aucun
 * dossier client dans son propre cabinet. Décision CEO 2026-08-11.
 */
export function canCreateClients(role: UserRole): boolean {
  return ["admin_cabinet", "assistante", "avocat"].includes(role);
}

/** Éditer uniquement les infos de contact (assistante). */
export function canEditClientContact(role: UserRole): boolean {
  return ["admin_cabinet", "assistante"].includes(role);
}

/** Voir et éditer facturation + compte en fiducie. Comptabilité + Admin. */
export function canViewBillingTrust(role: UserRole): boolean {
  return ["admin_cabinet", "comptabilite", "avocat"].includes(role);
}

export function canEditBillingTrust(role: UserRole): boolean {
  return ["admin_cabinet", "comptabilite"].includes(role);
}

/**
 * Certification (signature) d'un rapport de conformité fidéicommis : réservée à
 * l'avocat responsable et à l'administrateur. La comptabilité prépare le rapport,
 * mais seul l'avocat le signe (conformité Barreau B-1 r.5).
 */
export function canCertifyComplianceReport(role: UserRole): boolean {
  return ["admin_cabinet", "avocat"].includes(role);
}

export function canManageDossiers(role: UserRole): boolean {
  /* L'avocat ouvre ses propres dossiers. L'exclure supposait une adjointe,
     hypothèse fausse pour un praticien seul. Déc. CEO 2026-08-11. */
  return ["admin_cabinet", "assistante", "avocat"].includes(role);
}

/**
 * Accès à la file assistante (`/gestion/assistante`).
 * Doctrine: docs/product/ACTIVE_ASSISTANT_LAYER.md
 */
export function canViewAssistantQueue(role: UserRole): boolean {
  return ["assistante", "admin_cabinet", "avocat"].includes(role);
}

/**
 * Droit de prendre en charge un dossier (assigner `assistantJuridiqueId = self`).
 * Réservé aux assistantes et aux admin de cabinet.
 */
export function canAssignSelfAsAssistant(role: UserRole): boolean {
  return ["assistante", "admin_cabinet"].includes(role);
}

/** Voir la section temps / liste des entrées. */
export function canManageTimeEntries(role: UserRole): boolean {
  return true;
}

/** Créer une entrée de temps. */
export function canCreateTimeEntry(role: UserRole): boolean {
  return ["admin_cabinet", "avocat"].includes(role);
}

/** Éditer une entrée : admin tout ; avocat uniquement ses entrées. */
export function canEditTimeEntry(
  role: UserRole,
  entryUserId: string,
  currentUserId: string
): boolean {
  if (role === "admin_cabinet") return true;
  if (role === "avocat" && entryUserId === currentUserId) return true;
  return false;
}

/** Supprimer une entrée : même règle que edit. */
export function canDeleteTimeEntry(
  role: UserRole,
  entryUserId: string,
  currentUserId: string
): boolean {
  return canEditTimeEntry(role, entryUserId, currentUserId);
}

/** Marquer une entrée comme validée. */
export function canValidateTimeEntry(role: UserRole): boolean {
  return ["admin_cabinet", "avocat"].includes(role);
}

/** Voir toutes les entrées du cabinet (sinon uniquement les siennes). */
export function canViewAllTimeEntries(role: UserRole): boolean {
  return ["admin_cabinet", "comptabilite"].includes(role);
}

export function canManageInvoices(role: UserRole): boolean {
  return ["admin_cabinet", "assistante", "comptabilite"].includes(role);
}

/**
 * LIRE la facturation : suivi post-émission, débours, paiements, factures en
 * vérification, notes de crédit. Distinct de `canManageInvoices`, qui reste le
 * droit d'écrire (émettre, encaisser, rembourser, créer un débours).
 *
 * Le mur d'avant n'en était pas un. L'avocat ouvrait déjà `/facturation`, la
 * liste des factures et les honoraires (aucune garde de rôle), plus l'âge des
 * créances, la rentabilité, les taxes et le temps non facturé
 * (`canViewBillingTrust`, qui l'admet). Cinq pages seulement le rebondissaient,
 * par accident de garde et non par frontière choisie : il voyait la liste des
 * factures mais pas le pipeline qui affiche les mêmes factures.
 *
 * Prolonge la décision CEO du 2026-08-12 sur la comptabilité (voir
 * `canViewComptabilite`) : lire n'est pas tenir. La liste reste explicite, un
 * rôle futur non listé est refusé.
 */
export function canViewBilling(role: UserRole): boolean {
  return ["admin_cabinet", "assistante", "comptabilite", "avocat"].includes(role);
}

/** Valider une facture (brouillon → validée) : admin, comptabilité, ou avocat responsable du dossier. */
export function canValidateInvoice(
  role: UserRole,
  avocatResponsableId: string | null | undefined,
  userId: string
): boolean {
  if (["admin_cabinet", "comptabilite"].includes(role)) return true;
  if (role === "avocat" && avocatResponsableId === userId) return true;
  return false;
}

export function canRecordPayments(role: UserRole): boolean {
  return ["admin_cabinet", "comptabilite"].includes(role);
}

/**
 * Voir les rapports financiers (revenus, rentabilité par avocat et par dossier,
 * taxes, solde fidéicommis). Ouvert aux quatre rôles du cabinet (décision CEO :
 * l'assistante suit la facturation et les créances). Ce n'est PLUS un blanc-seing
 * `return true` : un rôle inconnu ou futur non listé est refusé, et la page le
 * revérifie côté serveur (garde `requirePageAccess`).
 */
export function canViewReports(role: UserRole): boolean {
  return ["admin_cabinet", "avocat", "assistante", "comptabilite"].includes(role);
}

/** Journal des dépenses (import relevé, catégorisation, validation). */
export function canManageExpenseJournal(role: UserRole): boolean {
  /* L'avocat en était exclu. Il ne pouvait donc ni saisir une écriture
     manuelle, ni importer un reçu, ni enregistrer un paiement dans son propre
     cabinet. Tenable avec une adjointe ou un comptable, faux pour un solo.
     Déc. CEO 2026-08-12. */
  return ["admin_cabinet", "comptabilite", "assistante", "avocat"].includes(role);
}

/**
 * Accès au module Comptabilité (journal général, dépenses, paiements).
 *
 * L'avocat y est admis depuis la décision CEO du 2026-08-12. Le lui refuser ne
 * cachait rien : son tableau de bord affiche déjà facturé, encaissé, à recevoir
 * et le solde en fidéicommis. Ça ouvrait seulement une porte de menu qui le
 * renvoyait au tableau de bord. Dans un cabinet solo, c'est d'ailleurs lui qui
 * tient les livres.
 *
 * Les quatre rôles du cabinet passent donc, mais la liste reste explicite : un
 * rôle inconnu ou futur (stagiaire, lecture seule) est refusé, jamais admis par
 * défaut. L'écriture, elle, garde ses propres gardes
 * (`canManageExpenseJournal`, `canManageInvoices`).
 */
export function canViewComptabilite(role: UserRole): boolean {
  return ["admin_cabinet", "comptabilite", "assistante", "avocat"].includes(role);
}

// --- Module A: Documents ---
/** Upload / read / delete documents (accès complet; avocat géré côté service via avocatResponsable) */
export function canManageDocuments(role: UserRole): boolean {
  return ["admin_cabinet", "assistante"].includes(role);
}

/** Lecture des documents (avocat peut voir les dossiers qui lui sont assignés, vérifié en service) */
export function canViewDocuments(role: UserRole): boolean {
  return ["admin_cabinet", "assistante", "avocat"].includes(role);
}

// --- Module A: Vérification d'identité ---
export function canManageIdentityVerification(role: UserRole): boolean {
  return ["admin_cabinet", "assistante"].includes(role);
}

export function canViewIdentityVerification(role: UserRole): boolean {
  return ["admin_cabinet", "avocat", "assistante"].includes(role);
}

// --- Module A: Consentements / ConsentLog ---
export function canManageConsent(role: UserRole): boolean {
  return ["admin_cabinet", "assistante"].includes(role);
}

export function canViewConsentLog(role: UserRole): boolean {
  return ["admin_cabinet", "avocat", "assistante"].includes(role);
}

// --- Module A: Audit log ---
export function canViewAuditLog(role: UserRole): boolean {
  return true; // Tous peuvent voir; le scope (tout / ses actions / limité) est géré en requête
}

export function canViewFullAuditLog(role: UserRole): boolean {
  return ["admin_cabinet", "assistante"].includes(role);
}

// --- Module A: Paramètres rétention / PIA ---
export function canManageRetentionPolicies(role: UserRole): boolean {
  return role === "admin_cabinet";
}

/**
 * Accès aux champs sensibles (notesConfidentielles, descriptionConfidentielle).
 * Admin toujours; avocat seulement si responsable du dossier.
 */
export function canViewSensitiveFields(
  role: UserRole,
  options?: { avocatResponsableId?: string | null; userId?: string }
): boolean {
  if (role === "admin_cabinet") return true;
  if (role === "avocat" && options?.userId && options?.avocatResponsableId === options.userId) return true;
  if (role === "assistante") return true;
  return false;
}

/** L'avocat peut éditer un dossier uniquement s'il en est le responsable (sinon lecture seule). */
export function canEditDossierAsAvocat(
  role: UserRole,
  avocatResponsableId: string | null | undefined,
  userId: string
): boolean {
  if (["admin_cabinet", "assistante"].includes(role)) return true;
  if (role === "avocat" && avocatResponsableId === userId) return true;
  return false;
}

// --- RBAC helpers (employees module & payroll) ---

export function canViewEmployees(role: UserRole, employee?: { role: EmployeeRole } | null): boolean {
  return rbacCan(getEffectiveRole({ role }, employee), "employees", "view");
}

export function canCreateEmployees(role: UserRole, employee?: { role: EmployeeRole } | null): boolean {
  return rbacCan(getEffectiveRole({ role }, employee), "employees", "create");
}

export function canEditEmployees(role: UserRole, employee?: { role: EmployeeRole } | null): boolean {
  return rbacCan(getEffectiveRole({ role }, employee), "employees", "edit");
}

export function canManagePayroll(role: UserRole, employee?: { role: EmployeeRole } | null): boolean {
  return rbacCan(getEffectiveRole({ role }, employee), "employees", "edit");
}

/** Generic RBAC check for use in layout/UI when effective role is known. */
export function canModule(
  effectiveRole: EmployeeRole,
  module: RBACModule,
  action: RBACAction
): boolean {
  return rbacCan(effectiveRole, module, action);
}
