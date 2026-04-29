/**
 * SAFE — Corrections append-only du journal général.
 *
 * Doctrine: docs/accounting/APPEND_ONLY_CORRECTIONS.md
 *
 * Principe: on ne mute jamais une écriture journalisée. Quand un changement
 * matériel survient sur l'entité métier d'origine, on émet :
 *   1) une ligne CORRECTION qui annule l'effet net cumulé des écritures précédentes
 *   2) optionnellement, une nouvelle écriture métier "rejouée" avec un
 *      sourceId versionné `${entity.id}#v${nextVersion}` pour préserver
 *      l'index unique partiel d'idempotence.
 *
 * Tous les helpers de ce fichier sont :
 *   - purs côté détection (hasMaterial*Change)
 *   - transaction-aware côté écriture (apply*Correction accepte un client tx)
 *   - sans accès au global `prisma` quand un client est fourni
 */

import type {
  Prisma,
  PrismaClient,
  CabinetExpense,
  DeboursDossier,
  DeboursType,
  ExpenseJournalTransactionType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { createJournalEntry } from "./journal-service";

type JournalPrismaClient = PrismaClient | Prisma.TransactionClient;

const SOURCE_MODULE_DEPENSES = "DEPENSES" as const;
const SOURCE_MODULE_DEBOURS = "DEBOURS" as const;

/* ════════════════════════════════════════════════════════════════
   DÉTECTION DES CHANGEMENTS MATÉRIELS
   ════════════════════════════════════════════════════════════════ */

export interface MaterialChangeReport {
  material: boolean;
  /** Liste lisible des champs qui motivent la correction. */
  reasons: string[];
}

/**
 * Détecte si un changement sur une `CabinetExpense` est matériel.
 * Voir docs/accounting/APPEND_ONLY_CORRECTIONS.md §2.1.
 */
export function hasMaterialCabinetExpenseChange(
  before: CabinetExpense,
  after: CabinetExpense,
): MaterialChangeReport {
  const reasons: string[] = [];

  if ((before.montant ?? 0) !== (after.montant ?? 0)) {
    reasons.push(`montant: ${before.montant} → ${after.montant}`);
  }
  if (!sameDate(before.date, after.date)) {
    reasons.push(`date: ${formatDate(before.date)} → ${formatDate(after.date)}`);
  }
  if (before.typeTransaction !== after.typeTransaction) {
    reasons.push(`typeTransaction: ${before.typeTransaction} → ${after.typeTransaction}`);
  }
  if ((before.dossierId ?? null) !== (after.dossierId ?? null)) {
    reasons.push(`dossierId: ${before.dossierId ?? "null"} → ${after.dossierId ?? "null"}`);
  }
  if ((before.categoryName ?? null) !== (after.categoryName ?? null)) {
    reasons.push(`categoryName: ${before.categoryName ?? "null"} → ${after.categoryName ?? "null"}`);
  }

  return { material: reasons.length > 0, reasons };
}

/**
 * Détecte si un changement sur un `DeboursDossier` est matériel.
 * Voir docs/accounting/APPEND_ONLY_CORRECTIONS.md §2.2.
 */
export function hasMaterialDeboursDossierChange(
  before: DeboursDossier,
  after: DeboursDossier,
): MaterialChangeReport {
  const reasons: string[] = [];

  if ((before.montant ?? 0) !== (after.montant ?? 0)) {
    reasons.push(`montant: ${before.montant} → ${after.montant}`);
  }
  if (!sameDate(before.date, after.date)) {
    reasons.push(`date: ${formatDate(before.date)} → ${formatDate(after.date)}`);
  }
  // Seul le passage true → false est matériel après journalisation.
  // false → true est traité par writeJournalForDeboursPaiement (création).
  if (before.payeParCabinet && !after.payeParCabinet) {
    reasons.push("payeParCabinet: true → false (annulation)");
  }
  if (before.clientId !== after.clientId) {
    reasons.push(`clientId: ${before.clientId} → ${after.clientId}`);
  }
  if (before.dossierId !== after.dossierId) {
    reasons.push(`dossierId: ${before.dossierId} → ${after.dossierId}`);
  }

  return { material: reasons.length > 0, reasons };
}

/* ════════════════════════════════════════════════════════════════
   APPLICATION DES CORRECTIONS
   ════════════════════════════════════════════════════════════════ */

export interface ApplyCorrectionOptions {
  client?: JournalPrismaClient;
  utilisateurId?: string | null;
}

export type ApplyCorrectionResult =
  | {
      action: "noop";
      reason: "not_material" | "no_prior_journal_entry" | "no_net_effect";
    }
  | {
      action: "corrected";
      correctionId: string;
      /** Présent si une nouvelle écriture métier a été rejouée. */
      replayId?: string;
      /** Effet net annulé (positif = sortie nette annulée, négatif = entrée nette annulée). */
      netCancelled: number;
      /** Numéro de version utilisé pour le re-jeu (si applicable). */
      replayVersion?: number;
      reasons: string[];
    };

interface PriorJournalEntries {
  entries: Array<{ id: string; sourceId: string | null; montantEntree: number; montantSortie: number }>;
  /** Plus grande version `#vN` détectée (1 si seule l'entrée initiale existe). */
  highestVersion: number;
}

/**
 * Lit toutes les écritures journal liées à une entité (initial + re-jeux).
 * Utilise `startsWith` pour capturer `entityId` et tous les `entityId#vN`.
 */
async function readPriorEntries(
  client: JournalPrismaClient,
  cabinetId: string,
  sourceModule: "DEPENSES" | "DEBOURS",
  entityId: string,
): Promise<PriorJournalEntries> {
  const entries = await client.journalGeneralEntry.findMany({
    where: {
      cabinetId,
      sourceModule,
      OR: [
        { sourceId: entityId },
        { sourceId: { startsWith: `${entityId}#v` } },
      ],
    },
    select: {
      id: true,
      sourceId: true,
      montantEntree: true,
      montantSortie: true,
    },
  });

  let highestVersion = 1;
  for (const e of entries) {
    if (!e.sourceId) continue;
    const match = e.sourceId.match(/#v(\d+)$/);
    if (match) {
      const v = Number.parseInt(match[1]!, 10);
      if (v > highestVersion) highestVersion = v;
    }
  }

  return { entries, highestVersion };
}

function computeNetEffect(prior: PriorJournalEntries): number {
  // Convention: positif = sortie nette à annuler, négatif = entrée nette à annuler.
  let net = 0;
  for (const e of prior.entries) {
    net += (e.montantSortie ?? 0) - (e.montantEntree ?? 0);
  }
  return net;
}

/* ──────────────────────── CabinetExpense ──────────────────────── */

/**
 * Applique la correction append-only suite à une édition de `CabinetExpense`.
 *
 * Comportement :
 *  - Si changement non matériel → noop.
 *  - Si pas d'écriture journal initiale → noop (rien à corriger).
 *  - Sinon : émet la CORRECTION compensatoire et, si l'entité reste
 *    journalisable (type ≠ IGNORE, montant > 0), un re-jeu DEPENSE/AJUSTEMENT
 *    avec sourceId versionné.
 *
 * IMPORTANT : `before` et `after` doivent refléter l'état pré- et post-update
 * de la même `CabinetExpense` (même `id`).
 */
export async function applyCabinetExpenseCorrection(
  before: CabinetExpense,
  after: CabinetExpense,
  opts: ApplyCorrectionOptions = {},
): Promise<ApplyCorrectionResult> {
  const change = hasMaterialCabinetExpenseChange(before, after);
  if (!change.material) {
    return { action: "noop", reason: "not_material" };
  }

  const client = opts.client ?? prisma;
  const cabinetId = after.cabinetId;
  const entityId = after.id;

  const prior = await readPriorEntries(client, cabinetId, SOURCE_MODULE_DEPENSES, entityId);
  if (prior.entries.length === 0) {
    return { action: "noop", reason: "no_prior_journal_entry" };
  }

  const netEffect = computeNetEffect(prior);
  if (netEffect === 0) {
    return { action: "noop", reason: "no_net_effect" };
  }

  // Étape B — écriture de correction. sourceId=null pour ne pas violer
  // l'index unique partiel ; la traçabilité passe par `reference` + `description`.
  const correction = await createJournalEntry(
    {
      cabinetId,
      dateTransaction: new Date(),
      typeTransaction: "CORRECTION",
      reference: `correction:CabinetExpense:${entityId}`,
      clientId: null,
      dossierId: after.dossierId ?? before.dossierId ?? null,
      description:
        `Correction matérielle CabinetExpense ${entityId} — ${change.reasons.join(" ; ")}`.slice(0, 500),
      categorie: "correction_material",
      // Si netEffect > 0, on annule une sortie nette → on inscrit en entrée.
      // Si netEffect < 0, on annule une entrée nette → on inscrit en sortie.
      montantEntree: netEffect > 0 ? netEffect : 0,
      montantSortie: netEffect < 0 ? Math.abs(netEffect) : 0,
      sourceModule: "CORRECTION_SYSTEME",
      sourceId: null,
      utilisateurId: opts.utilisateurId ?? null,
    },
    client,
  );

  // Étape C — re-jeu si l'entité reste journalisable.
  const replay = await maybeReplayCabinetExpense({
    after,
    nextVersion: prior.highestVersion + 1,
    client,
    utilisateurId: opts.utilisateurId ?? null,
    correctionId: correction.id,
  });

  return {
    action: "corrected",
    correctionId: correction.id,
    replayId: replay?.journalId,
    replayVersion: replay?.version,
    netCancelled: netEffect,
    reasons: change.reasons,
  };
}

interface ReplayResult {
  journalId: string;
  version: number;
}

async function maybeReplayCabinetExpense(args: {
  after: CabinetExpense;
  nextVersion: number;
  client: JournalPrismaClient;
  utilisateurId: string | null;
  correctionId: string;
}): Promise<ReplayResult | null> {
  const { after, nextVersion, client, utilisateurId, correctionId } = args;
  const mapping = mapExpenseToJournalForReplay(after);
  if (!mapping) return null;
  if (mapping.amount <= 0) return null;

  const sourceId = `${after.id}#v${nextVersion}`;
  const created = await createJournalEntry(
    {
      cabinetId: after.cabinetId,
      dateTransaction: after.date,
      typeTransaction: mapping.typeTransaction,
      reference: `replay-after:${correctionId}`,
      clientId: null,
      dossierId: after.dossierId ?? null,
      description: `${pickExpenseDescription(after)} (corrigée v${nextVersion})`.slice(0, 500),
      categorie: after.categoryName ?? null,
      montantEntree: mapping.direction === "IN" ? mapping.amount : 0,
      montantSortie: mapping.direction === "OUT" ? mapping.amount : 0,
      sourceModule: SOURCE_MODULE_DEPENSES,
      sourceId,
      utilisateurId,
    },
    client,
  );

  return { journalId: created.id, version: nextVersion };
}

function mapExpenseToJournalForReplay(
  expense: CabinetExpense,
): { typeTransaction: "DEPENSE" | "AJUSTEMENT"; direction: "IN" | "OUT"; amount: number } | null {
  const amount = Math.abs(expense.montant ?? 0);
  // Strictement aligné sur lib/services/journal/cabinet-expense-journal.ts.
  switch (expense.typeTransaction as ExpenseJournalTransactionType) {
    case "DEPENSE":
      return { typeTransaction: "DEPENSE", direction: "OUT", amount };
    case "CREDIT":
      return { typeTransaction: "AJUSTEMENT", direction: "IN", amount };
    case "IGNORE":
    case "TRANSFERT":
    case "AUTRE":
      return null;
  }
}

function pickExpenseDescription(expense: CabinetExpense): string {
  const supplier = (expense.fournisseurNormalise ?? "").trim();
  const raw = (expense.descriptionBancaire ?? "").trim();
  if (supplier && raw && supplier.toLowerCase() !== raw.toLowerCase()) {
    return `${supplier} — ${raw}`;
  }
  return supplier || raw || "Dépense cabinet";
}

/* ──────────────────────── DeboursDossier ──────────────────────── */

/**
 * Applique la correction append-only suite à une édition de `DeboursDossier`.
 *
 * Comportement :
 *  - Si changement non matériel → noop.
 *  - Si pas d'écriture journal initiale → noop (rien à corriger).
 *    Cas typique : la création d'un débours non payé (`payeParCabinet=false`)
 *    n'a jamais journalisé → un update qui passe à `true` doit aller au
 *    helper de **création** (`writeJournalForDeboursPaiement`), pas à ce
 *    helper de correction. Ce helper est strictement réservé aux entités
 *    déjà journalisées.
 *  - Sinon : émet la CORRECTION compensatoire et, si l'entité reste
 *    journalisable (`payeParCabinet=true`, montant > 0), un re-jeu DEBOURS
 *    avec sourceId versionné.
 */
export async function applyDeboursDossierCorrection(
  before: DeboursDossier,
  after: DeboursDossier,
  opts: ApplyCorrectionOptions & {
    deboursType?: Pick<DeboursType, "nom" | "categorie"> | null;
  } = {},
): Promise<ApplyCorrectionResult> {
  const change = hasMaterialDeboursDossierChange(before, after);
  if (!change.material) {
    return { action: "noop", reason: "not_material" };
  }

  const client = opts.client ?? prisma;
  const cabinetId = after.cabinetId;
  const entityId = after.id;

  const prior = await readPriorEntries(client, cabinetId, SOURCE_MODULE_DEBOURS, entityId);
  if (prior.entries.length === 0) {
    return { action: "noop", reason: "no_prior_journal_entry" };
  }

  const netEffect = computeNetEffect(prior);
  if (netEffect === 0) {
    return { action: "noop", reason: "no_net_effect" };
  }

  const correction = await createJournalEntry(
    {
      cabinetId,
      dateTransaction: new Date(),
      typeTransaction: "CORRECTION",
      reference: `correction:DeboursDossier:${entityId}`,
      clientId: after.clientId,
      dossierId: after.dossierId,
      description:
        `Correction matérielle DeboursDossier ${entityId} — ${change.reasons.join(" ; ")}`.slice(0, 500),
      categorie: "correction_material",
      montantEntree: netEffect > 0 ? netEffect : 0,
      montantSortie: netEffect < 0 ? Math.abs(netEffect) : 0,
      sourceModule: "CORRECTION_SYSTEME",
      sourceId: null,
      utilisateurId: opts.utilisateurId ?? null,
    },
    client,
  );

  const replay = await maybeReplayDeboursDossier({
    after,
    nextVersion: prior.highestVersion + 1,
    client,
    utilisateurId: opts.utilisateurId ?? null,
    correctionId: correction.id,
    deboursType: opts.deboursType ?? null,
  });

  return {
    action: "corrected",
    correctionId: correction.id,
    replayId: replay?.journalId,
    replayVersion: replay?.version,
    netCancelled: netEffect,
    reasons: change.reasons,
  };
}

async function maybeReplayDeboursDossier(args: {
  after: DeboursDossier;
  nextVersion: number;
  client: JournalPrismaClient;
  utilisateurId: string | null;
  correctionId: string;
  deboursType: Pick<DeboursType, "nom" | "categorie"> | null;
}): Promise<ReplayResult | null> {
  const { after, nextVersion, client, utilisateurId, correctionId, deboursType } = args;

  if (!after.payeParCabinet) return null;
  const amount = Math.abs(after.montant ?? 0);
  if (amount <= 0) return null;

  const sourceId = `${after.id}#v${nextVersion}`;
  const created = await createJournalEntry(
    {
      cabinetId: after.cabinetId,
      dateTransaction: after.date,
      typeTransaction: "DEBOURS",
      reference: `replay-after:${correctionId}`,
      clientId: after.clientId,
      dossierId: after.dossierId,
      description: `${pickDeboursDescription(after, deboursType)} (corrigée v${nextVersion})`.slice(0, 500),
      categorie: deboursType?.categorie ?? null,
      montantEntree: 0,
      montantSortie: amount,
      sourceModule: SOURCE_MODULE_DEBOURS,
      sourceId,
      utilisateurId,
    },
    client,
  );

  return { journalId: created.id, version: nextVersion };
}

function pickDeboursDescription(
  debours: DeboursDossier,
  deboursType: Pick<DeboursType, "nom"> | null,
): string {
  const description = (debours.description ?? "").trim();
  if (description) return description;
  const typeName = (deboursType?.nom ?? "").trim();
  if (typeName) return typeName;
  return "Débours dossier";
}

/* ────────────── Helpers de date ────────────── */

function sameDate(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.getTime() === b.getTime();
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "null";
  return d.toISOString().slice(0, 10);
}
