import type { EmployeeRole, UserRole } from "@prisma/client";
import { employeeRoleToUserRole } from "./rbac";
import {
  canCreateClients,
  canEditBillingTrust,
  canEditClients,
  canManageDocuments,
  canManageExpenseJournal,
  canManageInvoices,
  canManageTimeEntries,
  canManageUsers,
  canRecordPayments,
  canValidateTimeEntry,
  canViewAuditLog,
  canViewBilling,
  canViewBillingTrust,
  canViewClients,
  canViewComptabilite,
  canViewDocuments,
  canViewDossiers,
  canViewEmployees,
  canViewReports,
} from "./permissions";

/**
 * Accès RÉELLEMENT appliqué, dérivé des fonctions de garde elles-mêmes.
 *
 * ────────────────────────────────────────────────────────────────
 * LE DÉFAUT QUE CE MODULE CORRIGE
 * ────────────────────────────────────────────────────────────────
 *
 * L'onglet « Accès et rôle » d'un employé affichait une grille de permissions par
 * module, tirée de `ROLE_MODULE_PERMISSIONS` dans `rbac.ts`. Cette matrice ne gardait
 * RIEN : sa fonction `can()` n'est appelée nulle part dans l'application. Elle était
 * uniquement affichée.
 *
 * Deux conséquences, toutes deux vérifiables :
 *
 *   1. Les rôles RH `INTERN` et `READ_ONLY` n'ont AUCUN rôle de portail
 *      (`employeeRoleToUserRole` renvoie `null`) : ces personnes ne peuvent pas se
 *      connecter du tout. La grille leur affichait pourtant des permissions.
 *
 *   2. `LEAD_LAWYER` et `LAWYER` deviennent tous deux `avocat`. Leur accès réel est
 *      IDENTIQUE, alors que la grille en montrait deux différents.
 *
 * Un administrateur qui règle le rôle d'un employé et lit cette grille croit avoir
 * restreint quelque chose. Ce n'est pas une faille — rien n'est contourné, la garde
 * reste unique et cohérente — mais c'est un écran qui affirme ce qui n'est pas.
 *
 * ────────────────────────────────────────────────────────────────
 * COMMENT CE MODULE ÉVITE DE MENTIR À SON TOUR
 * ────────────────────────────────────────────────────────────────
 *
 * Il ne recopie aucune règle. Il APPELLE les fonctions de `permissions.ts`, celles-là
 * mêmes que les pages et les actions utilisent pour bloquer. La grille affichée est
 * donc le résultat de la garde, pas une description parallèle qui pourrait diverger.
 *
 * Si quelqu'un durcit `canEditBillingTrust`, cet écran change le jour même, sans que
 * personne ait à y penser. C'est la propriété qui manquait.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI.
 */

export type AccessModule =
  | "clients"
  | "dossiers"
  | "temps"
  | "facturation"
  | "paiements"
  | "comptabilite"
  | "fideicommis"
  | "documents"
  | "rapports"
  | "employes"
  | "parametres"
  | "audit";

export interface ModuleAccess {
  module: AccessModule;
  labelFr: string;
  /** Peut consulter. */
  view: boolean;
  /** Peut créer ou modifier. */
  edit: boolean;
  /**
   * Précision quand « voir » et « modifier » ne racontent pas toute l'histoire.
   * Absente quand il n'y a rien à ajouter — une note vide vaut mieux qu'un
   * remplissage.
   */
  noteFr?: string;
}

/**
 * Ce qu'un rôle de portail peut réellement faire.
 *
 * Chaque ligne appelle la garde. Aucune valeur n'est écrite à la main.
 */
export function getEffectiveAccess(role: UserRole): ModuleAccess[] {
  return [
    {
      module: "clients",
      labelFr: "Clients",
      view: canViewClients(role),
      edit: canEditClients(role) || canCreateClients(role),
    },
    {
      module: "dossiers",
      labelFr: "Dossiers",
      view: canViewDossiers(role),
      edit: canEditClients(role),
    },
    {
      module: "temps",
      labelFr: "Feuilles de temps",
      view: canViewDossiers(role),
      edit: canManageTimeEntries(role),
      noteFr: canValidateTimeEntry(role) ? "Peut valider les heures." : undefined,
    },
    {
      module: "facturation",
      labelFr: "Facturation",
      view: canViewBilling(role),
      edit: canManageInvoices(role),
    },
    {
      module: "paiements",
      labelFr: "Paiements",
      view: canViewBilling(role),
      edit: canRecordPayments(role),
    },
    {
      module: "comptabilite",
      labelFr: "Comptabilité",
      view: canViewComptabilite(role),
      edit: canManageExpenseJournal(role),
    },
    {
      module: "fideicommis",
      labelFr: "Fidéicommis",
      view: canViewBillingTrust(role),
      edit: canEditBillingTrust(role),
      noteFr: canEditBillingTrust(role)
        ? "Peut saisir des mouvements sur l'argent des clients."
        : undefined,
    },
    {
      module: "documents",
      labelFr: "Documents",
      view: canViewDocuments(role),
      edit: canManageDocuments(role),
    },
    {
      module: "rapports",
      labelFr: "Rapports",
      view: canViewReports(role),
      edit: false,
    },
    {
      module: "employes",
      labelFr: "Employés",
      view: canViewEmployees(role),
      edit: canManageUsers(role),
    },
    {
      module: "parametres",
      labelFr: "Paramètres du cabinet",
      view: canManageUsers(role),
      edit: canManageUsers(role),
    },
    {
      module: "audit",
      labelFr: "Piste d'audit",
      view: canViewAuditLog(role),
      edit: false,
    },
  ];
}

/* ════════════════════════════════════════════════════════════════
   CE QUE LE RÔLE RH DONNE VRAIMENT
   ════════════════════════════════════════════════════════════════ */

export interface EmployeeAccessSummary {
  /** Rôle de portail obtenu, ou `null` si la personne ne peut pas se connecter. */
  portalRole: UserRole | null;
  canSignIn: boolean;
  /** Autres rôles RH qui donnent EXACTEMENT le même accès. */
  sameAccessAs: EmployeeRole[];
  modules: ModuleAccess[];
  /** Ce qu'il faut dire à l'administrateur, en clair. */
  messageFr: string;
}

const TOUS_LES_ROLES_RH: EmployeeRole[] = [
  "ADMIN_ACCOUNTANT",
  "LEAD_LAWYER",
  "LAWYER",
  "LEGAL_ASSISTANT",
  "ACCOUNTING_TECHNICIAN",
  "INTERN",
  "READ_ONLY",
] as EmployeeRole[];

/**
 * Résume l'accès réel d'un rôle RH.
 *
 * Nomme explicitement les rôles qui donnent le même accès : c'est l'information qui
 * manquait le plus. Un administrateur qui hésite entre « Avocat responsable » et
 * « Avocat » doit savoir que le choix ne change rien aux droits.
 */
export function getEmployeeAccessSummary(role: EmployeeRole): EmployeeAccessSummary {
  const portalRole = employeeRoleToUserRole(role);

  if (!portalRole) {
    return {
      portalRole: null,
      canSignIn: false,
      sameAccessAs: [],
      modules: [],
      messageFr:
        "Ce rôle ne donne aucun accès à SAFE. La personne figure au dossier du cabinet, mais elle ne peut pas se connecter. Aucune permission ne s'applique.",
    };
  }

  const sameAccessAs = TOUS_LES_ROLES_RH.filter(
    (r) => r !== role && employeeRoleToUserRole(r) === portalRole,
  );

  const message =
    sameAccessAs.length > 0
      ? `Accès identique à celui du rôle « ${sameAccessAs.join(" », « ")} » : ces rôles se distinguent au dossier du cabinet, pas dans les droits.`
      : "Ce rôle donne son propre niveau d'accès.";

  return {
    portalRole,
    canSignIn: true,
    sameAccessAs,
    modules: getEffectiveAccess(portalRole),
    messageFr: message,
  };
}
