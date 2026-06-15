"use server";

import { prisma } from "@/lib/db";
import { requireCabinetAndUser, requireCabinetId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { normalizeRows } from "@/lib/import/pipeline";
import type {
  DocumentType,
  ColumnMapping,
  RawRow,
  NormalizedClient,
  NormalizedTimeEntry,
  NormalizedBankTransaction,
  NormalizedAccountingEntry,
  ImportResult,
  NormalizedRow,
  AccountingPreviewBreakdown,
} from "@/lib/import/types";
import { normalizeSupplier } from "@/lib/expense-journal/normalize-supplier";
import { suggestCategoryFromRules, isExpenseTransaction } from "@/lib/expense-journal/categorization-rules";
import { ensureExpenseCategories } from "@/app/(app)/journal/depenses/actions";
import { createJournalEntry } from "@/lib/services/journal/journal-service";
import {
  computeSourceLine,
  buildAccountingIdempotencyQuery,
} from "@/lib/import/normalizers/accounting-ledger";
import { isJournalIdempotencyConflict } from "@/lib/services/journal/idempotency";
import type { JournalTransactionType, JournalSourceModule } from "@prisma/client";

type DossierStatut = "ouvert" | "actif" | "en_attente" | "cloture" | "archive";

function mapDossierStatut(raw?: string): DossierStatut {
  if (!raw) return "actif";
  const lower = raw.toLowerCase();
  if (["inactif", "fermé", "ferme", "cloturé", "cloture", "closed"].includes(lower)) return "cloture";
  if (["archivé", "archive", "archived"].includes(lower)) return "archive";
  if (["en attente", "en_attente", "pending"].includes(lower)) return "en_attente";
  if (["ouvert", "open"].includes(lower)) return "ouvert";
  return "actif";
}

async function findOrCreateClient(
  cabinetId: string,
  raisonSociale: string,
  extra: Partial<NormalizedClient>,
): Promise<string> {
  const existing = await prisma.client.findFirst({
    where: { cabinetId, raisonSociale },
    select: { id: true },
  });
  if (existing) return existing.id;

  const client = await prisma.client.create({
    data: {
      cabinetId,
      raisonSociale,
      typeClient: extra.typeClient ?? "personne_morale",
      prenom: extra.prenom,
      nom: extra.nom,
      email: extra.email,
      telephone: extra.telephone,
      adresse: extra.adresse,
      langue: extra.langue,
      status: extra.statut === "inactif" ? "inactif" : extra.statut === "archive" ? "archive" : "actif",
    },
  });
  return client.id;
}

async function findOrCreateDossier(
  cabinetId: string,
  clientId: string,
  numeroDossier: string | undefined,
  intitule: string,
  extra: Partial<NormalizedClient>,
): Promise<string> {
  let dossierId: string;
  if (numeroDossier) {
    const existing = await prisma.dossier.findFirst({
      where: { cabinetId, numeroDossier },
      select: { id: true },
    });
    if (existing) {
      dossierId = existing.id;
    } else {
      const dossier = await prisma.dossier.create({
        data: {
          cabinetId,
          clientId,
          numeroDossier,
          intitule,
          statut: mapDossierStatut(extra.statut),
          dateOuverture: extra.dateOuverture ? new Date(extra.dateOuverture) : new Date(),
        },
      });
      dossierId = dossier.id;
    }
  } else {
    const dossier = await prisma.dossier.create({
      data: {
        cabinetId,
        clientId,
        numeroDossier,
        intitule,
        statut: mapDossierStatut(extra.statut),
        dateOuverture: extra.dateOuverture ? new Date(extra.dateOuverture) : new Date(),
      },
    });
    dossierId = dossier.id;
  }

  // Remplir le mandat du dossier à partir des données d'import
  const dateOuverture = extra.dateOuverture ? new Date(extra.dateOuverture) : undefined;
  await prisma.dossierMandate.upsert({
    where: { dossierId },
    create: {
      dossierId,
      numeroDossier: numeroDossier ?? undefined,
      dateOuverture: dateOuverture ?? new Date(),
      districtJudiciaire: extra.districtJudiciaire ?? undefined,
      tribunal: extra.tribunal ?? undefined,
      typeCause: extra.typeCause ?? undefined,
      statutDossier: extra.statut ?? undefined,
    },
    update: {
      numeroDossier: numeroDossier ?? undefined,
      dateOuverture: dateOuverture ?? undefined,
      districtJudiciaire: extra.districtJudiciaire ?? undefined,
      tribunal: extra.tribunal ?? undefined,
      typeCause: extra.typeCause ?? undefined,
      statutDossier: extra.statut ?? undefined,
    },
  });

  return dossierId;
}

async function findUserByName(cabinetId: string, name: string): Promise<string | null> {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  const users = await prisma.user.findMany({
    where: { cabinetId },
    select: { id: true, nom: true },
  });
  const match = users.find((u) => u.nom.toLowerCase().includes(lower) || lower.includes(u.nom.toLowerCase()));
  return match?.id ?? null;
}

export async function executeImport(
  rows: RawRow[],
  type: DocumentType,
  mapping: ColumnMapping,
  fileName: string,
): Promise<ImportResult> {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const startTime = Date.now();

  const normalized = normalizeRows(rows, type, mapping);
  const result: ImportResult = {
    fileName,
    documentType: type,
    totalRows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  let accountingDecisions: AccountingDecisionLog | null = null;

  try {
    if (type === "registre_clients") {
      await importClients(cabinetId, normalized as NormalizedRow<NormalizedClient>[], result);
    } else if (type === "fiches_temps") {
      await importTimeEntries(cabinetId, userId, normalized as NormalizedRow<NormalizedTimeEntry>[], result);
    } else if (type === "releve_bancaire") {
      await importBankStatements(cabinetId, userId, normalized as NormalizedRow<NormalizedBankTransaction>[], result, fileName);
    } else if (type === "migration_comptable") {
      accountingDecisions = await importAccountingLedger(
        cabinetId,
        userId,
        normalized as NormalizedRow<NormalizedAccountingEntry>[],
        result,
        fileName,
      );
    }
  } catch (err) {
    result.errors.push({ row: 0, message: err instanceof Error ? err.message : "Erreur critique" });
  }

  const durationMs = Date.now() - startTime;
  const status = result.errors.length === 0
    ? "success"
    : result.created > 0
      ? "partial"
      : "failed";

  // Pour la migration comptable on enrichit le journal d'erreurs avec le détail
  // décisionnel: warnings, summary, doublons, exclus. C'est ce qui permet à l'opérateur
  // de comprendre ce qui a été écrit, ce qui a été ignoré et pourquoi.
  const errorsPayload = type === "migration_comptable" && accountingDecisions
    ? JSON.stringify(accountingDecisions)
    : result.errors.length > 0
      ? JSON.stringify(result.errors.slice(0, 50))
      : null;

  const importHistory = await prisma.importHistory.create({
    data: {
      cabinetId,
      userId,
      source: "safe_import",
      documentType: type,
      fileName,
      status,
      totalRows: result.totalRows,
      createdCount: result.created,
      updatedCount: result.updated,
      skippedCount: result.skipped,
      errorCount: result.errors.length,
      errors: errorsPayload,
      durationMs,
    },
    select: { id: true },
  });

  if (type === "migration_comptable" && accountingDecisions) {
    result.accountingBreakdown = {
      ...accountingDecisions.breakdown,
      importHistoryId: importHistory.id,
    };
  }

  revalidatePath("/clients");
  revalidatePath("/dossiers");
  revalidatePath("/temps");
  revalidatePath("/journal/depenses");
  revalidatePath("/journal/general");
  revalidatePath("/import");

  return result;
}

async function importClients(
  cabinetId: string,
  rows: NormalizedRow<NormalizedClient>[],
  result: ImportResult,
) {
  for (const row of rows) {
    if (row.errors.length > 0) {
      result.errors.push({ row: row.index + 1, message: row.errors.map((e) => e.message).join("; ") });
      result.skipped++;
      continue;
    }
    try {
      const data = row.data;
      const clientId = await findOrCreateClient(cabinetId, data.raisonSociale, data);

      if (data.numeroDossier) {
        const intitule = [data.categorieDossier, data.typeDossier].filter(Boolean).join(" — ") || data.raisonSociale;
        await findOrCreateDossier(cabinetId, clientId, data.numeroDossier, intitule, data);
      }
      result.created++;
    } catch (err) {
      result.errors.push({ row: row.index + 1, message: err instanceof Error ? err.message : "Erreur inconnue" });
      result.skipped++;
    }
  }
}

async function importTimeEntries(
  cabinetId: string,
  fallbackUserId: string,
  rows: NormalizedRow<NormalizedTimeEntry>[],
  result: ImportResult,
) {
  const userCache = new Map<string, string | null>();

  for (const row of rows) {
    if (row.errors.length > 0) {
      result.errors.push({ row: row.index + 1, message: row.errors.map((e) => e.message).join("; ") });
      result.skipped++;
      continue;
    }
    try {
      const data = row.data;

      let userId: string | null = null;
      if (data.avocatName) {
        if (!userCache.has(data.avocatName)) {
          userCache.set(data.avocatName, await findUserByName(cabinetId, data.avocatName));
        }
        userId = userCache.get(data.avocatName) ?? null;
      }
      if (!userId) userId = fallbackUserId;

      let clientId: string | undefined;
      if (data.clientName) {
        clientId = await findOrCreateClient(cabinetId, data.clientName, {});
      }

      let dossierId: string | undefined;
      if (data.numeroDossier && clientId) {
        dossierId = await findOrCreateDossier(cabinetId, clientId, data.numeroDossier, data.clientName || "Import", {});
      }

      const dureeMinutes = Math.round(data.dureeHeures * 60);
      const tauxHoraire = data.tauxHoraire || 0;
      const montant = data.montant || dureeMinutes / 60 * tauxHoraire;

      await prisma.timeEntry.create({
        data: {
          cabinetId,
          dossierId: dossierId ?? null,
          clientId: clientId ?? null,
          userId,
          date: new Date(data.date),
          dureeMinutes,
          description: data.description,
          facturable: true,
          statut: (data.statut as "brouillon" | "valide" | "facture") ?? "brouillon",
          tauxHoraire,
          montant,
        },
      });
      result.created++;
    } catch (err) {
      result.errors.push({ row: row.index + 1, message: err instanceof Error ? err.message : "Erreur inconnue" });
      result.skipped++;
    }
  }
}

async function importBankStatements(
  cabinetId: string,
  userId: string,
  rows: NormalizedRow<NormalizedBankTransaction>[],
  result: ImportResult,
  fileName: string,
) {
  await ensureExpenseCategories(cabinetId);

  const expenseRows = rows.filter(
    (r) => r.errors.length === 0 && isExpenseTransaction(r.data.amount, r.data.rawType),
  );

  const session = await prisma.bankImportSession.create({
    data: {
      cabinetId,
      fileName,
      importedById: userId,
      nbLignes: rows.length,
      nbDepensesDetectees: expenseRows.length,
      status: "processed",
    },
  });

  let toValidate = 0;
  for (const row of expenseRows) {
    try {
      const data = row.data;
      const normalizedSupplier = normalizeSupplier(data.description);
      const suggestion = await suggestCategoryFromRules(prisma, cabinetId, data.description, normalizedSupplier);
      const status = suggestion.confidence >= 0.9 ? "categorized" : suggestion.categoryName ? "to_validate" : "new";
      if (status !== "categorized") toValidate++;

      await prisma.bankImportTransaction.create({
        data: {
          sessionId: session.id,
          cabinetId,
          date: new Date(data.date),
          rawDescription: data.description,
          rawAmount: data.amount,
          rawType: data.rawType,
          rawBalance: data.balance,
          reference: data.reference,
          normalizedSupplier,
          suggestedCategoryName: suggestion.categoryName ?? undefined,
          suggestedCategoryId: suggestion.categoryId ?? undefined,
          suggestedRefacturable: suggestion.refacturable,
          suggestedDossierId: suggestion.dossierId ?? undefined,
          confidence: suggestion.confidence,
          status,
        },
      });
      result.created++;
    } catch (err) {
      result.errors.push({ row: row.index + 1, message: err instanceof Error ? err.message : "Erreur inconnue" });
      result.skipped++;
    }
  }

  await prisma.bankImportSession.update({
    where: { id: session.id },
    data: { nbAValider: toValidate },
  });
}

/* ───────────────────── Migration comptable ───────────────────── */

type AccountingDecisionLog = {
  kind: "migration_comptable";
  fileName: string;
  breakdown: AccountingPreviewBreakdown;
  /** Lignes vraiment écrites au journal (id source + référence). */
  written: Array<{ row: number; ref: string; journalId: string; direction: "IN" | "OUT"; amount: number }>;
  /** Lignes refusées avec la raison principale. */
  rejected: Array<{ row: number; reason: string; severity: "blocked" | "warning" | "summary" | "duplicate" }>;
};

const TYPE_TRANSACTION_MAP: Record<string, JournalTransactionType> = {
  FACTURE: "FACTURE",
  INVOICE: "FACTURE",
  PAIEMENT: "PAIEMENT",
  PAYMENT: "PAIEMENT",
  ENCAISSEMENT: "PAIEMENT",
  RECEIPT: "PAIEMENT",
  DEPOT_FIDEICOMMIS: "DEPOT_FIDEICOMMIS",
  TRUST_DEPOSIT: "DEPOT_FIDEICOMMIS",
  RETRAIT_FIDEICOMMIS: "RETRAIT_FIDEICOMMIS",
  TRUST_WITHDRAWAL: "RETRAIT_FIDEICOMMIS",
  DEBOURS: "DEBOURS",
  DISBURSEMENT: "DEBOURS",
  DEPENSE: "DEPENSE",
  EXPENSE: "DEPENSE",
  AJUSTEMENT: "AJUSTEMENT",
  ADJUSTMENT: "AJUSTEMENT",
  CORRECTION: "CORRECTION",
};

const SOURCE_MODULE_MAP: Record<string, JournalSourceModule> = {
  FACTURATION: "FACTURATION",
  BILLING: "FACTURATION",
  PAIEMENTS: "PAIEMENTS",
  PAYMENTS: "PAIEMENTS",
  FIDEICOMMIS: "FIDEICOMMIS",
  TRUST: "FIDEICOMMIS",
  DEPENSES: "DEPENSES",
  EXPENSES: "DEPENSES",
  DEBOURS: "DEBOURS",
  DISBURSEMENT: "DEBOURS",
  IMPORT_BANCAIRE: "IMPORT_BANCAIRE",
  BANK_IMPORT: "IMPORT_BANCAIRE",
  AJUSTEMENT_MANUEL: "AJUSTEMENT_MANUEL",
  CORRECTION_SYSTEME: "CORRECTION_SYSTEME",
};

function resolveTypeTransaction(raw: string | undefined): JournalTransactionType {
  if (!raw) return "AJUSTEMENT";
  const key = raw.trim().toUpperCase().replace(/\s+/g, "_");
  return TYPE_TRANSACTION_MAP[key] ?? "AJUSTEMENT";
}

function resolveSourceModule(raw: string | undefined): JournalSourceModule {
  if (!raw) return "AJUSTEMENT_MANUEL";
  const key = raw.trim().toUpperCase().replace(/\s+/g, "_");
  return SOURCE_MODULE_MAP[key] ?? "AJUSTEMENT_MANUEL";
}

/**
 * Import prudent vers `JournalGeneralEntry`:
 *   - n'écrit que les lignes "ok" (pas d'erreur, pas summary, direction connue, montant>0, date présente)
 *   - applique une idempotence stable via `JournalGeneralEntry.sourceId`,
 *     qui contient le fingerprint de la ligne source. La `reference` reste
 *     la référence métier source telle qu'elle est dans le fichier (jamais bricolée).
 *   - tout le reste (warnings, summary, doublons internes, blocages) est consigné
 *     dans `ImportHistory.errors` sous une structure JSON exploitable par l'UI
 *
 * On reste compatible avec l'existant: aucune migration Prisma ajoutée.
 */
async function importAccountingLedger(
  cabinetId: string,
  userId: string,
  rows: NormalizedRow<NormalizedAccountingEntry>[],
  result: ImportResult,
  fileName: string,
): Promise<AccountingDecisionLog> {
  const log: AccountingDecisionLog = {
    kind: "migration_comptable",
    fileName,
    breakdown: {
      cleanCount: 0,
      warningCount: 0,
      blockedCount: 0,
      summaryCount: 0,
      duplicateCount: 0,
      willImportCount: 0,
      willSkipCount: 0,
    },
    written: [],
    rejected: [],
  };

  // Premier passage: détection des doublons internes au lot.
  const fpCounts = new Map<string, number>();
  for (const r of rows) {
    if (r.rowFingerprint) fpCounts.set(r.rowFingerprint, (fpCounts.get(r.rowFingerprint) ?? 0) + 1);
  }
  const seenInBatch = new Set<string>();

  for (const row of rows) {
    const data = row.data;
    const sourceLine = computeSourceLine(row);

    // Décompte des compteurs.
    if (row.errors.length > 0) log.breakdown.blockedCount++;
    else if (row.warnings.length > 0 || row.isSummaryRow) log.breakdown.warningCount++;
    else log.breakdown.cleanCount++;

    if (row.isSummaryRow) log.breakdown.summaryCount++;
    if (data.rowFingerprint && (fpCounts.get(data.rowFingerprint) ?? 0) > 1) {
      log.breakdown.duplicateCount++;
    }

    // Décision d'écriture.
    if (row.errors.length > 0) {
      log.rejected.push({
        row: sourceLine,
        reason: row.errors.map((e) => e.message).join("; "),
        severity: "blocked",
      });
      result.skipped++;
      continue;
    }
    if (row.isSummaryRow) {
      log.rejected.push({
        row: sourceLine,
        reason: data.sourceRowKind === "opening_balance" ? "Solde d'ouverture (informatif)" : "Ligne de total/sous-total/report",
        severity: "summary",
      });
      result.skipped++;
      continue;
    }
    if (data.direction === "UNKNOWN" || data.amount <= 0 || !data.date) {
      log.rejected.push({
        row: sourceLine,
        reason: !data.date ? "Date absente" : data.amount <= 0 ? "Montant nul" : "Direction indéterminée",
        severity: "warning",
      });
      result.skipped++;
      continue;
    }
    // Doublon interne au lot: on garde la 1ère, on rejette les autres.
    if (data.rowFingerprint) {
      if (seenInBatch.has(data.rowFingerprint)) {
        log.rejected.push({
          row: sourceLine,
          reason: "Doublon dans le lot (1ère occurrence conservée)",
          severity: "duplicate",
        });
        result.skipped++;
        continue;
      }
      seenInBatch.add(data.rowFingerprint);
    }

    // Idempotence inter-lots: on cherche une écriture existante par `sourceId`
    // (alimenté avec le fingerprint à la création). C'est insensible au contenu
    // de la `reference`, donc fiable même si la ligne source porte une référence métier.
    const idempotencyQuery = buildAccountingIdempotencyQuery(cabinetId, data.rowFingerprint);
    if (idempotencyQuery) {
      const existing = await prisma.journalGeneralEntry.findFirst({
        where: idempotencyQuery,
        select: { id: true },
      });
      if (existing) {
        log.rejected.push({
          row: sourceLine,
          reason: "Déjà importé dans un lot précédent (même fingerprint)",
          severity: "duplicate",
        });
        result.skipped++;
        continue;
      }
    }

    try {
      const typeTransaction = resolveTypeTransaction(data.typeTransaction);
      const sourceModule = resolveSourceModule(data.sourceModule);
      if (typeTransaction === "DEPOT_FIDEICOMMIS" || typeTransaction === "RETRAIT_FIDEICOMMIS" || sourceModule === "FIDEICOMMIS") {
        log.rejected.push({
          row: sourceLine,
          reason:
            "Import fidéicommis refusé : les mouvements fidéicommis doivent passer par le module dédié pour mettre à jour la carte-client et le solde TrustAccount.",
          severity: "blocked",
        });
        result.skipped++;
        continue;
      }
      // La référence stockée reste la référence métier brute du fichier.
      // Le fingerprint vit dans `sourceId` (clé d'idempotence).
      const reference = data.reference ?? null;

      const created = await createJournalEntry({
        cabinetId,
        dateTransaction: new Date(data.date),
        typeTransaction,
        reference,
        clientId: null, // Résolution client/dossier laissée à une étape ultérieure (custom backlog).
        dossierId: null,
        description: data.description || data.rawRowText?.slice(0, 200) || "(import comptable)",
        categorie: data.categorie ?? data.compte ?? null,
        montantEntree: data.direction === "IN" ? data.amount : 0,
        montantSortie: data.direction === "OUT" ? data.amount : 0,
        sourceModule,
        sourceId: data.rowFingerprint ?? null,
        utilisateurId: userId,
      });

      log.written.push({
        row: sourceLine,
        ref: reference ?? "",
        journalId: created.id,
        direction: data.direction === "IN" ? "IN" : "OUT",
        amount: data.amount,
      });
      result.created++;
    } catch (err) {
      // Course concurrente sur l'index unique partiel `JournalGeneralEntry_idempotency_key`:
      // un autre lot a écrit la même ligne (même fingerprint) entre notre findFirst
      // et notre create. On la traite comme un duplicate, pas comme une erreur.
      if (isJournalIdempotencyConflict(err)) {
        log.rejected.push({
          row: sourceLine,
          reason: "Déjà importé (course concurrente détectée par contrainte unique)",
          severity: "duplicate",
        });
        result.skipped++;
        continue;
      }
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      log.rejected.push({ row: sourceLine, reason: `Échec écriture: ${msg}`, severity: "blocked" });
      result.errors.push({ row: sourceLine, message: msg });
      result.skipped++;
    }
  }

  log.breakdown.willImportCount = log.written.length;
  log.breakdown.willSkipCount = rows.length - log.written.length;
  return log;
}

export type ImportHistoryEntry = {
  id: string;
  source: string;
  documentType: string;
  fileName: string;
  status: string;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  durationMs: number | null;
  createdAt: string;
  userName: string | null;
};

export async function getImportHistory(options?: {
  limit?: number;
  offset?: number;
  status?: string;
  documentType?: string;
}): Promise<{ entries: ImportHistoryEntry[]; total: number }> {
  const cabinetId = await requireCabinetId();
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const where: Record<string, unknown> = { cabinetId };
  if (options?.status) where.status = options.status;
  if (options?.documentType) where.documentType = options.documentType;

  const [entries, total] = await Promise.all([
    prisma.importHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: { user: { select: { nom: true } } },
    }),
    prisma.importHistory.count({ where }),
  ]);

  return {
    entries: entries.map((e) => ({
      id: e.id,
      source: e.source,
      documentType: e.documentType,
      fileName: e.fileName,
      status: e.status,
      totalRows: e.totalRows,
      createdCount: e.createdCount,
      updatedCount: e.updatedCount,
      skippedCount: e.skippedCount,
      errorCount: e.errorCount,
      durationMs: e.durationMs,
      createdAt: e.createdAt.toISOString(),
      userName: e.user?.nom ?? null,
    })),
    total,
  };
}

export async function getImportHistoryErrors(historyId: string): Promise<Array<{ row: number; message: string }>> {
  const cabinetId = await requireCabinetId();
  const entry = await prisma.importHistory.findFirst({
    where: { id: historyId, cabinetId },
    select: { errors: true },
  });
  if (!entry?.errors) return [];
  try {
    return JSON.parse(entry.errors) as Array<{ row: number; message: string }>;
  } catch {
    return [];
  }
}
