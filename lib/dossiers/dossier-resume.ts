/**
 * SAFE — T1 : Bloc « Où j'en étais ? » (context-resume par dossier).
 *
 * Différenciateur produit (aucun concurrent ne l'a) + cœur du design TDAH :
 * externalise la mémoire de travail. Répond en ≤ 15 s à « où j'en étais ? ».
 *
 * DOCTRINE :
 *   - 100 % DÉRIVÉ des données existantes → AUCUNE migration Prisma.
 *     Sources : preparation-status (état/manquants/nextAction), AuditLog
 *     (dernière action), DossierTache (retards), DossierEvenement (échéances).
 *   - Le constructeur de résumé (`buildResumeSummary`) et les libellés sont
 *     PURS et testables ; le service `getDossierResume` fait les I/O.
 *   - Bilingue FR + EN, rendu dans la locale de l'utilisateur (EN par défaut
 *     pour Derisier — l'adjointe travaille surtout en anglais).
 *
 * Réconciliation : `DossierTache` n'a pas de statut `bloquee`. Le compteur
 * « bloqués » vient donc de l'ÉTAT de préparation (`bloque` / severity
 * `blocking`), pas des tâches. (Voir docs/product/SPEC_T1_ou_jen_etais.md.)
 */

import { prisma } from "@/lib/db";
import { DossierTacheStatut, type DossierEvenementType } from "@prisma/client";
import { loadDossierPreparationSnapshot } from "./preparation-loader";
import {
  getDossierPreparationStatus,
  type PreparationState,
  type MissingItemKind,
} from "./preparation-status";

export type ResumeLocale = "fr" | "en";
export type ResumeActorType = "human" | "system" | "ia";

export interface ResumeLastActivity {
  label: string;
  actorName: string | null;
  actorType: ResumeActorType;
  at: Date;
}

export interface ResumeDeadline {
  label: string;
  date: Date;
  daysLeft: number;
}

export interface DossierResume {
  /** Résumé narratif déterministe (1 à 3 phrases), dans la locale demandée. */
  summary: string;
  lastActivity: ResumeLastActivity | null;
  nextAction: string | null;
  nextActionDueDate: Date | null;
  state: PreparationState;
  counts: {
    overdueTasks: number;
    blockingIssues: number;
    criticalMissing: number;
  };
  nearestDeadline: ResumeDeadline | null;
}

/* ───────── Helpers PURS (testables, sans I/O) ───────── */

const DAY_MS = 86_400_000;

/** Différence en jours calendaires (UTC), bornée à 0. */
export function daysLeftUntil(date: Date, now: Date): number {
  const a = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const b = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.round((a - b) / DAY_MS));
}

function fmtShortDate(date: Date, locale: ResumeLocale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

/** Libellés d'action d'audit au niveau dossier (bilingue) + repli humanisé. */
const DOSSIER_ACTION_LABELS: Record<string, { en: string; fr: string }> = {
  create: { en: "Matter opened", fr: "Dossier ouvert" },
  update: { en: "Matter updated", fr: "Dossier mis à jour" },
  status_change: { en: "Status changed", fr: "Statut modifié" },
  assign: { en: "Assignment changed", fr: "Assignation modifiée" },
  ready_for_review: { en: "Marked ready for review", fr: "Marqué prêt pour revue" },
  close: { en: "Matter closed", fr: "Dossier fermé" },
  reopen: { en: "Matter reopened", fr: "Dossier rouvert" },
};

export function dossierAuditLabel(action: string, locale: ResumeLocale): string {
  const entry = DOSSIER_ACTION_LABELS[action];
  if (entry) return entry[locale];
  const human = action.replace(/[_-]+/g, " ").trim();
  return human ? human.charAt(0).toUpperCase() + human.slice(1) : action;
}

/** Libellé d'un type d'événement (bilingue). */
const EVENT_TYPE_LABELS: Record<DossierEvenementType, { en: string; fr: string }> = {
  audience: { en: "Hearing", fr: "Audience" },
  reunion_client: { en: "Client meeting", fr: "Rendez-vous client" },
  echeance: { en: "Deadline", fr: "Échéance" },
  depot: { en: "Filing", fr: "Dépôt" },
  relance_facture: { en: "Invoice reminder", fr: "Relance de facture" },
};

export function eventTypeLabel(type: DossierEvenementType, locale: ResumeLocale): string {
  return EVENT_TYPE_LABELS[type]?.[locale] ?? type;
}

/**
 * Prochaine action localisée, dérivée du `kind` du manquant (enum stable) —
 * et NON du texte FR de `preparation-status.ts`. Garantit que le résumé est
 * intégralement dans la langue de l'app (anglais juridique propre en EN).
 */
const NEXT_ACTION_BY_KIND: Record<MissingItemKind, { en: string; fr: string }> = {
  conflict: { en: "Resolve the conflict check", fr: "Résoudre la vérification de conflits" },
  assistant: {
    en: "Assign a legal assistant to the matter",
    fr: "Assigner une assistante au dossier",
  },
  mandate: { en: "Create the engagement mandate", fr: "Créer le mandat du dossier" },
  identity: { en: "Verify the client's identity", fr: "Vérifier l'identité du client" },
  billing_mode: {
    en: "Set the billing mode (hourly or flat fee)",
    fr: "Définir le mode de facturation (horaire ou forfait)",
  },
  checklist: {
    en: "Complete a required checklist item",
    fr: "Compléter un élément requis de la liste de vérification",
  },
  debours: { en: "Record the expected disbursements", fr: "Saisir les débours attendus" },
  cartable_section: {
    en: "Complete a required matter-file section",
    fr: "Compléter une section obligatoire du cartable",
  },
  event_deadline: {
    en: "Create a task for an upcoming deadline",
    fr: "Créer une tâche pour une échéance à venir",
  },
  admin_task: {
    en: "Handle an overdue administrative task",
    fr: "Traiter une tâche administrative en retard",
  },
};

export function nextActionByKind(kind: MissingItemKind, locale: ResumeLocale): string {
  return NEXT_ACTION_BY_KIND[kind][locale];
}

export interface ResumeSummaryParts {
  lastActivity: ResumeLastActivity | null;
  nextAction: string | null;
  nearestDeadline: ResumeDeadline | null;
  state: PreparationState;
}

/**
 * Construit le résumé narratif (PUR). 1 à 3 fragments concaténés :
 *  1) dernière action (ou ouverture) ;
 *  2) tension temporelle si une échéance est à ≤ 7 jours ;
 *  3) cap : prochaine action, ou « tout est prêt » si pret_pour_revue.
 */
export function buildResumeSummary(parts: ResumeSummaryParts, locale: ResumeLocale): string {
  const en = locale === "en";
  const frags: string[] = [];

  // 1) Ouverture
  if (parts.lastActivity) {
    const who = parts.lastActivity.actorName;
    const when = fmtShortDate(parts.lastActivity.at, locale);
    if (en) {
      frags.push(
        `Last action: ${parts.lastActivity.label}${who ? ` by ${who}` : ""} (${when}).`,
      );
    } else {
      frags.push(
        `Dernière action : ${parts.lastActivity.label}${who ? ` par ${who}` : ""} (${when}).`,
      );
    }
  } else {
    frags.push(
      en
        ? "Matter recently opened — no recorded activity yet."
        : "Dossier ouvert récemment — aucune action enregistrée pour l'instant.",
    );
  }

  // 2) Tension temporelle
  const d = parts.nearestDeadline;
  if (d && d.daysLeft <= 7) {
    if (d.daysLeft === 0) {
      frags.push(en ? `${d.label} is due today.` : `${d.label} : c'est aujourd'hui.`);
    } else {
      frags.push(
        en
          ? `${d.label} in ${d.daysLeft} day${d.daysLeft > 1 ? "s" : ""}.`
          : `${d.label} dans ${d.daysLeft} jour${d.daysLeft > 1 ? "s" : ""}.`,
      );
    }
  }

  // 3) Cap
  if (parts.nextAction) {
    frags.push(en ? `Next: ${parts.nextAction}.` : `Prochaine action : ${parts.nextAction}.`);
  } else if (parts.state === "pret_pour_revue") {
    frags.push(
      en
        ? "Everything is ready — awaiting lawyer review."
        : "Tout est prêt — en attente de revue par l'avocat·e.",
    );
  }

  return frags.join(" ");
}

/* ───────── Service (I/O) ───────── */

/**
 * Compose le bloc de reprise d'un dossier. Renvoie `null` si le dossier
 * n'existe pas / n'appartient pas au cabinet (le caller n'affiche rien).
 * Toutes les lectures sont scopées par `cabinetId`.
 */
export async function getDossierResume(
  cabinetId: string,
  dossierId: string,
  locale: ResumeLocale = "en",
  now: Date = new Date(),
): Promise<DossierResume | null> {
  const snapshot = await loadDossierPreparationSnapshot(cabinetId, dossierId, {
    now,
    callerUserId: null,
  });
  if (!snapshot) return null;

  const status = getDossierPreparationStatus(snapshot);

  const [lastAudit, overdueTasks, nextEvent] = await Promise.all([
    prisma.auditLog.findFirst({
      where: { cabinetId, entityType: "Dossier", entityId: dossierId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { nom: true, email: true } } },
    }),
    prisma.dossierTache.findMany({
      where: {
        dossierId,
        statut: { in: [DossierTacheStatut.a_faire, DossierTacheStatut.en_cours] },
        dateEcheance: { lt: now },
      },
      orderBy: { dateEcheance: "asc" },
      select: { dateEcheance: true },
    }),
    prisma.dossierEvenement.findFirst({
      where: { dossierId, date: { gte: now } },
      orderBy: { date: "asc" },
      select: { type: true, titre: true, date: true },
    }),
  ]);

  const lastActivity: ResumeLastActivity | null = lastAudit
    ? {
        label: dossierAuditLabel(lastAudit.action, locale),
        actorName: lastAudit.user?.nom ?? lastAudit.user?.email ?? null,
        actorType: lastAudit.userId ? "human" : "system",
        at: lastAudit.performedAt ?? lastAudit.createdAt,
      }
    : null;

  const nearestDeadline: ResumeDeadline | null = nextEvent
    ? {
        label: nextEvent.titre?.trim() || eventTypeLabel(nextEvent.type, locale),
        date: nextEvent.date,
        daysLeft: daysLeftUntil(nextEvent.date, now),
      }
    : null;

  const counts = {
    overdueTasks: overdueTasks.length,
    blockingIssues: status.missingItems.filter((m) => m.severity === "blocking").length,
    criticalMissing: status.missingItems.filter((m) => m.severity === "critical").length,
  };

  // Prochaine action LOCALISÉE (par `kind`, jamais le texte FR de preparation-status).
  const firstMissing = status.missingItems[0] ?? null;
  const nextAction = firstMissing ? nextActionByKind(firstMissing.kind, locale) : null;

  const summary = buildResumeSummary(
    { lastActivity, nextAction, nearestDeadline, state: status.state },
    locale,
  );

  return {
    summary,
    lastActivity,
    nextAction,
    nextActionDueDate: overdueTasks[0]?.dateEcheance ?? null,
    state: status.state,
    counts,
    nearestDeadline,
  };
}
