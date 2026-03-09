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
  ImportResult,
  NormalizedRow,
} from "@/lib/import/types";
import { normalizeSupplier } from "@/lib/expense-journal/normalize-supplier";
import { suggestCategoryFromRules, isExpenseTransaction } from "@/lib/expense-journal/categorization-rules";
import { ensureExpenseCategories } from "@/app/(app)/journal/depenses/actions";

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
  if (numeroDossier) {
    const existing = await prisma.dossier.findFirst({
      where: { cabinetId, numeroDossier },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

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
  return dossier.id;
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

  try {
    if (type === "registre_clients") {
      await importClients(cabinetId, normalized as NormalizedRow<NormalizedClient>[], result);
    } else if (type === "fiches_temps") {
      await importTimeEntries(cabinetId, userId, normalized as NormalizedRow<NormalizedTimeEntry>[], result);
    } else if (type === "releve_bancaire") {
      await importBankStatements(cabinetId, userId, normalized as NormalizedRow<NormalizedBankTransaction>[], result, fileName);
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

  await prisma.importHistory.create({
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
      errors: result.errors.length > 0 ? JSON.stringify(result.errors.slice(0, 50)) : null,
      durationMs,
    },
  });

  revalidatePath("/clients");
  revalidatePath("/dossiers");
  revalidatePath("/temps");
  revalidatePath("/journal/depenses");
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
