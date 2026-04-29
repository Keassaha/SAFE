/**
 * SAFE — File de travail de l'assistante.
 *
 * Doctrine: docs/product/ACTIVE_ASSISTANT_LAYER.md §9
 *
 * Agrège plusieurs requêtes en buckets exploitables côté UI. Chaque bucket
 * reste sobre: titre du dossier, client, prochaine action ou résumé.
 */

import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { loadDossierPreparationSnapshot } from "./preparation-loader";
import { getDossierPreparationStatus, type PreparationState } from "./preparation-status";

type DBClient = PrismaClient | Prisma.TransactionClient;

export interface AssistantQueueItem {
  dossierId: string;
  dossierIntitule: string;
  numeroDossier: string | null;
  /** Identifiant client — pour construire les deep links (vérification identité, etc.). */
  clientId: string;
  clientName: string;
  /** Prochaine action recommandée (peut être null si aucune). */
  nextAction: string | null;
  /** Premier manquant identifié (utile pour router vers la bonne action). */
  topMissingKind: import("./preparation-status").MissingItemKind | null;
  /** Compte de manquants critiques (pour priorisation visuelle). */
  criticalMissingCount: number;
  /** État canonique. */
  state: PreparationState;
  /** Date d'ouverture pour tri. */
  dateOuverture: Date;
}

export interface AssistantTaskItem {
  taskId: string;
  dossierId: string;
  dossierIntitule: string;
  titre: string;
  priorite: string;
  dateEcheance: Date | null;
  daysOverdue: number | null;
}

export interface AssistantEventItem {
  eventId: string;
  dossierId: string;
  dossierIntitule: string;
  type: string;
  titre: string;
  date: Date;
  daysUntil: number;
}

export interface AssistantQueue {
  /** Dossiers avec manquants critiques (incomplet). */
  incomplete: AssistantQueueItem[];
  /** Dossiers actifs sans assistante assignée. */
  unassigned: AssistantQueueItem[];
  /** Dossiers en attente client. */
  awaitingClient: AssistantQueueItem[];
  /** Dossiers prêts pour revue avocat. */
  readyForReview: AssistantQueueItem[];
  /** Tâches admin assignées au caller, non terminées. */
  myAdminTasks: AssistantTaskItem[];
  /** Événements à venir (≤14j). */
  upcomingDeadlines: AssistantEventItem[];
}

interface GetAssistantQueueOptions {
  /** Limite par bucket (défaut 25). */
  bucketLimit?: number;
  /** Horizon des échéances en jours (défaut 14). */
  upcomingDaysHorizon?: number;
  /** Date "now" pour les calculs (test). */
  now?: Date;
  /** Limite de dossiers évalués pour le calcul des buckets `incomplete/awaitingClient/readyForReview`. */
  dossierEvaluationLimit?: number;
  /**
   * Restreint la file aux dossiers où `assistantJuridiqueId === scopeAssistantId`.
   * Si null/undefined, aucune restriction (toute la file du cabinet).
   * Le bucket `unassigned` est exclu quand un scope est appliqué (logique : on ne peut
   * pas filtrer "mes dossiers" et lister les non-assignés dans le même geste).
   */
  scopeAssistantId?: string | null;
}

/**
 * Construit la file assistante pour un cabinet et un utilisateur donné.
 *
 * Stratégie V1 : on charge la liste des dossiers actifs/ouverts, puis on
 * calcule l'état de préparation pour chacun en parallèle. Pour les gros
 * cabinets, `dossierEvaluationLimit` plafonne le nombre de calculs (les
 * dossiers les plus récemment touchés sont prioritaires).
 */
export async function getAssistantQueue(
  cabinetId: string,
  callerUserId: string,
  options: GetAssistantQueueOptions = {},
  client: DBClient = prisma,
): Promise<AssistantQueue> {
  const now = options.now ?? new Date();
  const bucketLimit = options.bucketLimit ?? 25;
  const horizon = options.upcomingDaysHorizon ?? 14;
  const evaluationLimit = options.dossierEvaluationLimit ?? 100;
  const horizonEnd = new Date(now.getTime() + horizon * 24 * 60 * 60 * 1000);
  const scopeAssistantId = options.scopeAssistantId ?? null;

  // 1) Sources de données indépendantes
  const [activeDossiers, myTasksRaw, upcomingEventsRaw] = await Promise.all([
    client.dossier.findMany({
      where: {
        cabinetId,
        statut: { in: ["actif", "ouvert", "en_attente"] },
        ...(scopeAssistantId ? { assistantJuridiqueId: scopeAssistantId } : {}),
      },
      select: {
        id: true,
        intitule: true,
        numeroDossier: true,
        clientId: true,
        assistantJuridiqueId: true,
        dateOuverture: true,
        updatedAt: true,
        client: { select: { raisonSociale: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: evaluationLimit,
    }),
    client.dossierTache.findMany({
      where: {
        assigneeId: callerUserId,
        statut: { in: ["a_faire", "en_cours"] },
        dossier: { cabinetId },
      },
      include: {
        dossier: { select: { id: true, intitule: true } },
      },
      orderBy: [{ dateEcheance: "asc" }, { priorite: "desc" }],
      take: bucketLimit,
    }),
    client.dossierEvenement.findMany({
      where: {
        dossier: { cabinetId },
        date: { gte: now, lte: horizonEnd },
      },
      include: {
        dossier: { select: { id: true, intitule: true } },
      },
      orderBy: { date: "asc" },
      take: bucketLimit,
    }),
  ]);

  // 2) Bucket "unassigned" — détecté directement, pas besoin de calculer l'état.
  // Quand un scope "mes dossiers" est appliqué, ce bucket est vide par construction.
  const unassigned: AssistantQueueItem[] = scopeAssistantId
    ? []
    : activeDossiers
        .filter((d) => !d.assistantJuridiqueId)
        .slice(0, bucketLimit)
        .map((d) => toQueueItem(d, "incomplet", null, null, 0));

  // 3) Calcul de l'état de préparation pour les dossiers avec assistante
  const assigned = activeDossiers.filter((d) => d.assistantJuridiqueId !== null);
  const statusByDossierId = new Map<
    string,
    { state: PreparationState; nextAction: string | null; topMissingKind: import("./preparation-status").MissingItemKind | null; criticalCount: number }
  >();

  await Promise.all(
    assigned.map(async (d) => {
      const snap = await loadDossierPreparationSnapshot(
        cabinetId,
        d.id,
        { now, callerUserId },
        client,
      );
      if (!snap) return;
      const status = getDossierPreparationStatus(snap, now);
      const criticalCount = status.missingItems.filter(
        (m) => m.severity === "blocking" || m.severity === "critical",
      ).length;
      statusByDossierId.set(d.id, {
        state: status.state,
        nextAction: status.nextAction,
        topMissingKind: status.missingItems[0]?.kind ?? null,
        criticalCount,
      });
    }),
  );

  const buildBucket = (filter: (state: PreparationState) => boolean): AssistantQueueItem[] => {
    return assigned
      .map((d) => {
        const status = statusByDossierId.get(d.id);
        if (!status || !filter(status.state)) return null;
        return toQueueItem(d, status.state, status.nextAction, status.topMissingKind, status.criticalCount);
      })
      .filter((x): x is AssistantQueueItem => x !== null);
  };

  // 4) Composition des buckets
  const incomplete = buildBucket((s) => s === "incomplet" || s === "bloque")
    .sort((a, b) => b.criticalMissingCount - a.criticalMissingCount)
    .slice(0, bucketLimit);

  const awaitingClient = buildBucket((s) => s === "en_attente_client")
    .slice(0, bucketLimit);

  const readyForReview = buildBucket((s) => s === "pret_pour_revue")
    .sort((a, b) => a.dateOuverture.getTime() - b.dateOuverture.getTime())
    .slice(0, bucketLimit);

  const myAdminTasks: AssistantTaskItem[] = myTasksRaw.map((t) => ({
    taskId: t.id,
    dossierId: t.dossier.id,
    dossierIntitule: t.dossier.intitule,
    titre: t.titre,
    priorite: t.priorite,
    dateEcheance: t.dateEcheance,
    daysOverdue: t.dateEcheance && t.dateEcheance < now
      ? Math.floor((now.getTime() - t.dateEcheance.getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }));

  const upcomingDeadlines: AssistantEventItem[] = upcomingEventsRaw.map((e) => ({
    eventId: e.id,
    dossierId: e.dossier.id,
    dossierIntitule: e.dossier.intitule,
    type: e.type,
    titre: e.titre,
    date: e.date,
    daysUntil: Math.ceil((e.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  }));

  return {
    incomplete,
    unassigned,
    awaitingClient,
    readyForReview,
    myAdminTasks,
    upcomingDeadlines,
  };
}

/* ───────── Helper interne ───────── */

interface DossierRow {
  id: string;
  intitule: string;
  numeroDossier: string | null;
  clientId: string;
  dateOuverture: Date;
  client: { raisonSociale: string | null };
}

function toQueueItem(
  d: DossierRow,
  state: PreparationState,
  nextAction: string | null,
  topMissingKind: import("./preparation-status").MissingItemKind | null,
  criticalCount: number,
): AssistantQueueItem {
  return {
    dossierId: d.id,
    dossierIntitule: d.intitule,
    numeroDossier: d.numeroDossier,
    clientId: d.clientId,
    clientName: d.client.raisonSociale ?? "Sans client",
    nextAction,
    topMissingKind,
    criticalMissingCount: criticalCount,
    state,
    dateOuverture: d.dateOuverture,
  };
}
