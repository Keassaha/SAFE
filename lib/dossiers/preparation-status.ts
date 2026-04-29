/**
 * SAFE — Calcul de l'état de préparation d'un dossier.
 *
 * Doctrine: docs/product/ACTIVE_ASSISTANT_LAYER.md
 *
 * Tout est PURE. Aucun accès Prisma. Le snapshot d'entrée est construit
 * par `lib/dossiers/preparation-loader.ts` et est testable sans base.
 *
 * Règle d'or: l'état est DÉRIVÉ, jamais stocké. Si une donnée manque, on
 * l'ajoute dans `missingItems` plutôt que de crasher.
 */

/* ───────── Types canoniques ───────── */

export type PreparationState =
  | "bloque"
  | "incomplet"
  | "en_attente_client"
  | "en_preparation"
  | "pret_pour_revue";

export type MissingItemSeverity = "blocking" | "critical" | "warning" | "info";

export type MissingItemKind =
  | "conflict"
  | "assistant"
  | "mandate"
  | "identity"
  | "billing_mode"
  | "checklist"
  | "debours"
  | "cartable_section"
  | "event_deadline"
  | "admin_task";

export interface MissingItem {
  kind: MissingItemKind;
  severity: MissingItemSeverity;
  label: string;
  /** Phrase courte, impérative ("Vérifier l'identité du client"). */
  nextAction: string;
}

export interface PreparationStatus {
  state: PreparationState;
  missingItems: MissingItem[];
  /** Action recommandée la plus prioritaire (1er manquant trié par sévérité). */
  nextAction: string | null;
  /** Vrai si le dossier a du travail facturable prêt à émettre. Drapeau additif. */
  readyToBill: boolean;
}

/* ───────── Snapshot (input pour le calcul) ───────── */

export interface ChecklistItemSnapshot {
  label: string;
  obligatoire: boolean;
  checked: boolean;
}

export interface DossierPreparationSnapshot {
  dossierId: string;
  cabinetId: string;
  /** Identifiant du client. Sert à construire des liens (verification identité, etc.). */
  clientId: string;
  /** Type du dossier (immobilier, immigration, ...) — peut être null si non saisi. */
  type: string | null;
  /** Statut courant du dossier (actif, ouvert, cloture, ...). */
  statut: string;
  /** Date d'ouverture, sert pour la priorisation dans la file. */
  dateOuverture: Date;
  assistantJuridiqueId: string | null;
  avocatResponsableId: string | null;
  modeFacturation: string | null;

  /** Mandat: présent ou absent. Si présent, sa checklist est exposée. */
  mandate: {
    exists: boolean;
    checklist: ChecklistItemSnapshot[];
  };

  /** Identité du client. */
  client: {
    identityVerified: boolean;
    consentementCollecteAt: Date | null;
    /** Date de la dernière session de vérification d'identité ouverte par l'assistante (utilisé pour départager `en_attente_client` vs `incomplet`). */
    lastIdentityVerificationStartedAt: Date | null;
  };

  /** ConflictCheck non résolu — le dossier est bloqué tant que c'est vrai. */
  unresolvedConflict: boolean;

  /** Sections cartable obligatoires (mandat + formulaires) qui ont 0 documents/items. */
  emptyMandatorySections: number;

  /** Débours requis (template `isRequired`) qui n'ont pas de DeboursDossier correspondant. */
  missingRequiredDebours: number;

  /** Événements à moins de 14 jours. */
  upcomingEvents: Array<{
    id: string;
    type: string;
    title: string;
    date: Date;
    /** Y a-t-il au moins une `DossierTache` non terminée associée à un horizon proche ? */
    hasAssociatedTask: boolean;
  }>;

  /** Tâches admin en retard assignées au caller (l'assistante connectée). */
  myAdminTasksOverdueCount: number;

  /** Travail facturable prêt: au moins un `RegistreTache complete` non facturé OU TimeEntry `READY_TO_BILL`. */
  hasReadyToBillWork: boolean;
}

/* ───────── Détection des manquants ───────── */

const SEVERITY_RANK: Record<MissingItemSeverity, number> = {
  blocking: 0,
  critical: 1,
  warning: 2,
  info: 3,
};

/**
 * Heuristique: un item de checklist mandat dont le label mentionne
 * explicitement le client est en attente client (ex: "Pièce d'identité du client",
 * "Signature du client").
 */
function looksLikeClientWaiting(label: string): boolean {
  return /\bclient\b/i.test(label);
}

const FOURTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * Calcule la liste des manquants d'un dossier selon la doctrine.
 *
 * @param now Date de référence (injection pour test).
 */
export function getDossierMissingItems(
  snap: DossierPreparationSnapshot,
  now: Date = new Date(),
): MissingItem[] {
  const items: MissingItem[] = [];

  // 1) Conflit non résolu — blocking
  if (snap.unresolvedConflict) {
    items.push({
      kind: "conflict",
      severity: "blocking",
      label: "Conflit non résolu",
      nextAction: "Résoudre la vérification de conflits",
    });
  }

  // 2) Assistant non assigné — critical
  if (!snap.assistantJuridiqueId) {
    items.push({
      kind: "assistant",
      severity: "critical",
      label: "Aucune assistante juridique assignée",
      nextAction: "Assigner une assistante au dossier",
    });
  }

  // 3) Mandat absent — critical
  if (!snap.mandate.exists) {
    items.push({
      kind: "mandate",
      severity: "critical",
      label: "Mandat absent",
      nextAction: "Créer le mandat du dossier",
    });
  }

  // 4) Identité client non vérifiée — critical
  if (!snap.client.identityVerified) {
    items.push({
      kind: "identity",
      severity: "critical",
      label: "Identité du client non vérifiée",
      nextAction: "Vérifier l'identité du client",
    });
  }

  // 5) Mode de facturation non défini — critical
  if (!snap.modeFacturation) {
    items.push({
      kind: "billing_mode",
      severity: "critical",
      label: "Mode de facturation non défini",
      nextAction: "Définir le mode de facturation (horaire ou forfait)",
    });
  }

  // 6) Items obligatoires de la checklist mandat non cochés — warning
  // Le mandat doit exister pour qu'on regarde sa checklist.
  if (snap.mandate.exists) {
    const unchecked = snap.mandate.checklist.filter((c) => c.obligatoire && !c.checked);
    for (const item of unchecked) {
      items.push({
        kind: "checklist",
        severity: "warning",
        label: `Checklist mandat: "${item.label}" non coché`,
        nextAction: `Compléter ou faire signer: ${item.label}`,
      });
    }
  }

  // 7) Débours requis non saisis — warning
  if (snap.missingRequiredDebours > 0) {
    items.push({
      kind: "debours",
      severity: "warning",
      label: `${snap.missingRequiredDebours} débours requis non saisi(s)`,
      nextAction: "Saisir les débours attendus pour ce type de dossier",
    });
  }

  // 8) Sections cartable obligatoires vides — warning
  if (snap.emptyMandatorySections > 0) {
    items.push({
      kind: "cartable_section",
      severity: "warning",
      label: `${snap.emptyMandatorySections} section(s) cartable obligatoire(s) vide(s)`,
      nextAction: "Compléter les sections cartable (mandat, formulaires)",
    });
  }

  // 9) Événement proche sans tâche associée — warning
  for (const evt of snap.upcomingEvents) {
    const daysUntil = Math.ceil((evt.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7 && daysUntil >= 0 && !evt.hasAssociatedTask) {
      items.push({
        kind: "event_deadline",
        severity: "warning",
        label: `${evt.title} dans ${daysUntil} jour(s) sans préparation`,
        nextAction: `Préparer ${evt.title}`,
      });
    }
  }

  // 10) Tâches admin en retard de l'utilisateur courant — info
  if (snap.myAdminTasksOverdueCount > 0) {
    items.push({
      kind: "admin_task",
      severity: "info",
      label: `${snap.myAdminTasksOverdueCount} tâche(s) admin en retard`,
      nextAction: "Traiter les tâches en retard",
    });
  }

  return items.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

/* ───────── Détection de l'attente client ───────── */

/**
 * Une attente client correspond à une situation où l'action attendue n'est
 * pas du cabinet. V1 reconnaît deux cas :
 *   - identité non vérifiée + une session a été ouverte côté assistante depuis ≥48h.
 *   - un item de checklist obligatoire libellé "client" non coché.
 */
function detectAwaitingClient(snap: DossierPreparationSnapshot, now: Date): boolean {
  const identityWaitingClient =
    !snap.client.identityVerified &&
    snap.client.lastIdentityVerificationStartedAt !== null &&
    now.getTime() - snap.client.lastIdentityVerificationStartedAt.getTime() >= FOURTY_EIGHT_HOURS_MS;

  const checklistWaitingClient = snap.mandate.exists &&
    snap.mandate.checklist.some((c) => c.obligatoire && !c.checked && looksLikeClientWaiting(c.label));

  return identityWaitingClient || checklistWaitingClient;
}

/* ───────── Calcul de l'état canonique ───────── */

/**
 * Détermine l'état canonique du dossier en suivant la priorité doctrine :
 *   bloque → incomplet → en_attente_client → en_preparation → pret_pour_revue.
 *
 * `pret_a_facturer` est exposé séparément via `readyToBill` (drapeau additif).
 */
export function getDossierPreparationStatus(
  snap: DossierPreparationSnapshot,
  now: Date = new Date(),
): PreparationStatus {
  const missingItems = getDossierMissingItems(snap, now);

  const hasBlocking = missingItems.some((m) => m.severity === "blocking");
  const hasCritical = missingItems.some((m) => m.severity === "critical");
  const hasWarning = missingItems.some((m) => m.severity === "warning");

  let state: PreparationState;
  if (hasBlocking) {
    state = "bloque";
  } else if (hasCritical) {
    // Une critical peut basculer en "en_attente_client" si la situation
    // attend explicitement le client.
    state = detectAwaitingClient(snap, now) ? "en_attente_client" : "incomplet";
  } else if (hasWarning) {
    state = "en_preparation";
  } else {
    // Aucun manquant `blocking/critical/warning`. Pour être prêt pour revue,
    // on demande un minimum de substance: mandat existe ET identité vérifiée.
    state = snap.mandate.exists && snap.client.identityVerified
      ? "pret_pour_revue"
      : "en_preparation";
  }

  // Action recommandée: 1er manquant trié par sévérité.
  const topAction = missingItems[0]?.nextAction ?? null;

  return {
    state,
    missingItems,
    nextAction: topAction,
    readyToBill: snap.hasReadyToBillWork,
  };
}

/* ───────── Helpers d'affichage ───────── */

export const PREPARATION_STATE_LABELS: Record<PreparationState, string> = {
  bloque: "Bloqué",
  incomplet: "Incomplet",
  en_attente_client: "En attente du client",
  en_preparation: "En préparation",
  pret_pour_revue: "Prêt pour revue avocat",
};

export const SEVERITY_LABELS: Record<MissingItemSeverity, string> = {
  blocking: "Bloquant",
  critical: "Critique",
  warning: "À compléter",
  info: "Information",
};
