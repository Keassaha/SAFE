/**
 * SAFE — Chargement du snapshot de préparation d'un dossier.
 *
 * Server-side. Encapsule les requêtes Prisma nécessaires au calcul.
 * Les helpers de calcul restent purs (`preparation-status.ts`).
 *
 * Doctrine: docs/product/ACTIVE_ASSISTANT_LAYER.md
 */

import type { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  ChecklistItemSnapshot,
  DossierPreparationSnapshot,
} from "./preparation-status";

interface LoadOptions {
  /** Date "now" pour les calculs de fenêtre temporelle (par défaut : maintenant). */
  now?: Date;
  /**
   * Utilisateur courant (pour les agrégats personnels comme "mes tâches admin en retard").
   * Si null, ces compteurs valent 0.
   */
  callerUserId?: string | null;
  /** Horizon des événements "upcoming" (en jours). Default 14. */
  upcomingDaysHorizon?: number;
}

/**
 * Type minimal pour le client Prisma (compatible $transaction client).
 */
type DBClient = PrismaClient | Prisma.TransactionClient;

const DEFAULT_HORIZON_DAYS = 14;

/* ───────── Loader principal ───────── */

/**
 * Charge le snapshot complet pour un dossier donné.
 * Renvoie `null` si le dossier n'existe pas (ou n'appartient pas au cabinet appelant).
 */
export async function loadDossierPreparationSnapshot(
  cabinetId: string,
  dossierId: string,
  options: LoadOptions = {},
  client: DBClient = prisma,
): Promise<DossierPreparationSnapshot | null> {
  const now = options.now ?? new Date();
  const horizon = options.upcomingDaysHorizon ?? DEFAULT_HORIZON_DAYS;
  const horizonEnd = new Date(now.getTime() + horizon * 24 * 60 * 60 * 1000);

  const dossier = await client.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    include: {
      mandate: { select: { checklist: true } },
      client: {
        select: {
          identityVerified: true,
          consentementCollecteAt: true,
          identityVerifications: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      },
      conflictChecks: {
        select: { resolution: true, resolvedAt: true },
      },
    },
  });

  if (!dossier) return null;

  // Charges parallèles indépendantes de la fiche dossier elle-même.
  const [
    requiredDeboursTemplatesCount,
    actualDeboursCount,
    emptyMandatorySectionsCount,
    upcomingEvents,
    upcomingTasks,
    myAdminTasksOverdue,
    completeRegistreTacheCount,
    readyToBillTimeEntryCount,
  ] = await Promise.all([
    // Débours requis pour ce type de dossier (dossierType est typiquement le `type` Dossier).
    dossier.type
      ? client.deboursTemplate.count({
          where: { cabinetId, dossierType: dossier.type, isRequired: true },
        })
      : Promise.resolve(0),
    client.deboursDossier.count({
      where: { cabinetId, dossierId },
    }),
    // Sections cartable obligatoires vides (mandat/formulaires sans documents ni richDocuments).
    countEmptyMandatorySections(client, dossierId),
    client.dossierEvenement.findMany({
      where: { dossierId, date: { gte: now, lte: horizonEnd } },
      orderBy: { date: "asc" },
      select: { id: true, type: true, titre: true, date: true },
    }),
    // On va estimer "tâche associée à un événement proche" : il existe au moins 1 tâche
    // non terminée dont la date d'échéance ∈ [now, horizonEnd].
    client.dossierTache.findMany({
      where: {
        dossierId,
        statut: { in: ["a_faire", "en_cours"] },
        dateEcheance: { gte: now, lte: horizonEnd },
      },
      select: { id: true, dateEcheance: true },
    }),
    options.callerUserId
      ? client.dossierTache.count({
          where: {
            assigneeId: options.callerUserId,
            statut: { in: ["a_faire", "en_cours"] },
            dateEcheance: { lt: now },
          },
        })
      : Promise.resolve(0),
    client.registreTache.count({
      where: { dossierId, statut: "complete" },
    }),
    client.timeEntry.count({
      where: {
        dossierId,
        billingStatus: "READY_TO_BILL",
        invoiceId: null,
      },
    }),
  ]);

  const checklist: ChecklistItemSnapshot[] = parseChecklist(dossier.mandate?.checklist ?? null);

  // ConflictCheck non résolu = au moins un check sans `resolution`.
  const unresolvedConflict = dossier.conflictChecks.some(
    (c) => !c.resolution || !c.resolvedAt,
  );

  // Manquants débours = max(0, requis - réels).
  const missingRequiredDebours = Math.max(0, requiredDeboursTemplatesCount - actualDeboursCount);

  // Heuristique simple: un événement à <14j est "associé à une tâche" si au moins une tâche
  // a son échéance dans la même fenêtre. Approximation suffisante pour la V1.
  const eventsWithAssociation = upcomingEvents.map((evt) => ({
    id: evt.id,
    type: evt.type,
    title: evt.titre,
    date: evt.date,
    hasAssociatedTask: upcomingTasks.length > 0,
  }));

  const lastIdentityVerificationStartedAt = dossier.client.identityVerifications[0]?.createdAt ?? null;

  return {
    dossierId: dossier.id,
    cabinetId: dossier.cabinetId,
    clientId: dossier.clientId,
    type: dossier.type,
    statut: dossier.statut,
    dateOuverture: dossier.dateOuverture,
    assistantJuridiqueId: dossier.assistantJuridiqueId,
    avocatResponsableId: dossier.avocatResponsableId,
    modeFacturation: dossier.modeFacturation,
    mandate: {
      exists: dossier.mandate !== null,
      checklist,
    },
    client: {
      identityVerified: dossier.client.identityVerified,
      consentementCollecteAt: dossier.client.consentementCollecteAt,
      lastIdentityVerificationStartedAt,
    },
    unresolvedConflict,
    emptyMandatorySections: emptyMandatorySectionsCount,
    missingRequiredDebours,
    upcomingEvents: eventsWithAssociation,
    myAdminTasksOverdueCount: myAdminTasksOverdue,
    hasReadyToBillWork: completeRegistreTacheCount > 0 || readyToBillTimeEntryCount > 0,
  };
}

/* ───────── Helpers internes ───────── */

/**
 * Parse le champ `mandate.checklist` (JSON `[{label, obligatoire, checked}]`)
 * en tolérant les variations de format historiques.
 */
function parseChecklist(raw: unknown): ChecklistItemSnapshot[] {
  if (!raw) return [];
  let arr: unknown = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((it): it is Record<string, unknown> => typeof it === "object" && it !== null)
    .map((it) => ({
      label: typeof it.label === "string" ? it.label : "",
      obligatoire: it.obligatoire === true,
      checked: it.checked === true,
    }))
    .filter((it) => it.label.length > 0);
}

/**
 * Compte les sections cartable obligatoires (clés `mandat`, `formulaires`) qui n'ont
 * aucun document ni rich document associé. La complétude est estimée prudemment.
 */
async function countEmptyMandatorySections(
  client: DBClient,
  dossierId: string,
): Promise<number> {
  const mandatoryKeys = ["mandat", "formulaires"];
  const sections = await client.dossierSection.findMany({
    where: { dossierId, sectionKey: { in: mandatoryKeys } },
    select: { id: true, sectionKey: true },
  });
  if (sections.length === 0) return 0;

  // Pour chaque section, vérifier s'il existe au moins un Document ou RichDocument.
  // La V1 utilise une heuristique: un dossier qui a au moins 1 document de l'une des
  // catégories `mandat`/`formulaires` est considéré comme ayant cette section non-vide.
  // Sinon, la section est marquée vide.
  const [docCount, richCount] = await Promise.all([
    client.document.count({
      where: {
        dossierId,
        OR: [
          { documentType: { contains: "mandat" } },
          { documentType: { contains: "formulaire" } },
        ],
      },
    }),
    client.richDocument.count({
      where: {
        dossierId,
        OR: [{ type: "mandat" }, { type: "lettre" }, { type: "procedure" }],
      },
    }).catch(() => 0),
  ]);

  // Si on a 0 doc obligatoire, on considère toutes les sections obligatoires comme vides.
  if (docCount === 0 && richCount === 0) return sections.length;
  return 0;
}
