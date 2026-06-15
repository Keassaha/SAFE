"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCabinetAndUser, requireCabinetId } from "@/lib/auth/session";
import { canManageExpenseJournal, canManageInvoices } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import {
  createJournalEntry,
  getJournalEntries,
  calculateJournalBalance,
  exportJournalCsv,
} from "@/lib/services/journal";
import { isManualEntryTypeAllowed } from "@/lib/services/journal/manual-entry-policy";
import { buildPeriodAccountingExport } from "@/lib/services/accounting-export";
import type { AccountingExportFormat } from "@/lib/accounting/export/serialize";
import type { JournalListParams, JournalKpiData } from "@/types/journal";
import type { JournalEntryRow } from "@/types/journal";
import type { JournalSourceModule, JournalTransactionType, UserRole } from "@prisma/client";

const manualJournalEntrySchema = z
  .object({
    dateTransaction: z.coerce.date(),
    typeTransaction: z.enum([
      "FACTURE",
      "PAIEMENT",
      "DEPOT_FIDEICOMMIS",
      "RETRAIT_FIDEICOMMIS",
      "DEBOURS",
      "DEPENSE",
      "AJUSTEMENT",
      "CORRECTION",
    ]),
    reference: z.string().trim().max(120).optional().nullable(),
    clientId: z.string().trim().optional().nullable(),
    dossierId: z.string().trim().optional().nullable(),
    description: z.string().trim().min(1).max(500),
    categorie: z.string().trim().max(160).optional().nullable(),
    montantEntree: z.number().min(0).default(0),
    montantSortie: z.number().min(0).default(0),
  })
  .refine(
    (data) => (data.montantEntree > 0 && data.montantSortie === 0) || (data.montantSortie > 0 && data.montantEntree === 0),
    { message: "Inscrivez soit une entrée, soit une sortie, mais pas les deux." },
  );

export type ManualJournalContext = {
  clients: Array<{ id: string; label: string }>;
  dossiers: Array<{ id: string; label: string; clientId: string }>;
};

type ManualJournalEntryActionInput = {
  dateTransaction: Date | string;
  typeTransaction: JournalTransactionType;
  reference?: string | null;
  clientId?: string | null;
  dossierId?: string | null;
  description: string;
  categorie?: string | null;
  montantEntree: number;
  montantSortie: number;
};

/** Normalise les paramètres reçus du client (dates sérialisées en string). */
function normalizeListParams(
  params: Omit<JournalListParams, "cabinetId"> & {
    dateFrom?: Date | string | null;
    dateTo?: Date | string | null;
  }
): Omit<JournalListParams, "cabinetId"> {
  const out: Omit<JournalListParams, "cabinetId"> = { ...params };
  if (typeof params.dateFrom === "string") {
    out.dateFrom = new Date(params.dateFrom);
  }
  if (typeof params.dateTo === "string") {
    out.dateTo = new Date(params.dateTo);
  }
  return out;
}

export async function getJournalEntriesAction(
  params: Omit<JournalListParams, "cabinetId"> & {
    dateFrom?: Date | string | null;
    dateTo?: Date | string | null;
  }
): Promise<{ entries: JournalEntryRow[]; totalCount: number }> {
  const cabinetId = await requireCabinetId();
  const normalized = normalizeListParams(params);
  const result = await getJournalEntries({ ...normalized, cabinetId });
  return {
    entries: result.entries,
    totalCount: result.totalCount,
  };
}

export async function getJournalKpisAction(): Promise<JournalKpiData> {
  const cabinetId = await requireCabinetId();
  return calculateJournalBalance(cabinetId);
}

export async function getManualJournalContextAction(): Promise<ManualJournalContext> {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canUseManualJournal(role as UserRole)) {
    throw new Error("Droits insuffisants");
  }

  const [clients, dossiers] = await Promise.all([
    prisma.client.findMany({
      where: { cabinetId },
      orderBy: [{ raisonSociale: "asc" }, { nom: "asc" }],
      take: 300,
      select: { id: true, raisonSociale: true, prenom: true, nom: true },
    }),
    prisma.dossier.findMany({
      where: { cabinetId },
      orderBy: [{ numeroDossier: "asc" }, { intitule: "asc" }],
      take: 500,
      select: { id: true, clientId: true, numeroDossier: true, intitule: true },
    }),
  ]);

  return {
    clients: clients.map((client) => ({
      id: client.id,
      label: client.raisonSociale?.trim() || `${client.prenom ?? ""} ${client.nom ?? ""}`.trim() || "Client sans nom",
    })),
    dossiers: dossiers.map((dossier) => ({
      id: dossier.id,
      clientId: dossier.clientId,
      label: `${dossier.numeroDossier ?? ""} ${dossier.intitule}`.trim() || dossier.intitule,
    })),
  };
}

export async function createManualJournalEntryAction(
  input: ManualJournalEntryActionInput,
): Promise<{ id: string }> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canUseManualJournal(role as UserRole)) {
    throw new Error("Droits insuffisants");
  }

  const parsed = manualJournalEntrySchema.parse(input);

  // Saisie manuelle réservée aux AJUSTEMENTS / CORRECTIONS documentés (politique pure
  // testée dans manual-entry-policy). Les factures, paiements, dépenses, débours et
  // mouvements de fidéicommis DOIVENT passer par leur module métier.
  if (!isManualEntryTypeAllowed(parsed.typeTransaction)) {
    throw new Error(
      "La saisie manuelle du journal est réservée aux ajustements et corrections. " +
        "Pour une facture, un paiement, une dépense, un débours ou un mouvement de " +
        "fidéicommis, utilisez le module dédié.",
    );
  }

  if (parsed.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: parsed.clientId, cabinetId },
      select: { id: true },
    });
    if (!client) throw new Error("Client introuvable");
  }
  if (parsed.dossierId) {
    const dossier = await prisma.dossier.findFirst({
      where: {
        id: parsed.dossierId,
        cabinetId,
        ...(parsed.clientId ? { clientId: parsed.clientId } : {}),
      },
      select: { id: true },
    });
    if (!dossier) throw new Error("Dossier introuvable pour ce client");
  }

  const sourceModule = sourceModuleForManualEntry(parsed.typeTransaction);
  const sourceId = sourceIdForManualEntry(parsed.typeTransaction, parsed.reference);
  if (sourceId) {
    const existing = await prisma.journalGeneralEntry.findFirst({
      where: { cabinetId, sourceModule, sourceId },
      select: { id: true },
    });
    if (existing) {
      throw new Error("Cette facture manuelle est déjà inscrite au journal.");
    }
  }

  const created = await createJournalEntry({
    cabinetId,
    dateTransaction: parsed.dateTransaction,
    typeTransaction: parsed.typeTransaction,
    reference: parsed.reference || null,
    clientId: parsed.clientId || null,
    dossierId: parsed.dossierId || null,
    description: parsed.description,
    categorie: parsed.categorie || null,
    montantEntree: roundMoney(parsed.montantEntree),
    montantSortie: roundMoney(parsed.montantSortie),
    sourceModule,
    sourceId,
    utilisateurId: userId,
  });

  revalidatePath("/journal/general");
  revalidatePath("/comptabilite");
  return created;
}

export async function exportJournalAction(
  params: Omit<JournalListParams, "cabinetId"> & {
    dateFrom?: Date | string | null;
    dateTo?: Date | string | null;
  },
  format: "csv"
): Promise<{ blob: string; filename: string }> {
  const cabinetId = await requireCabinetId();
  const normalized = normalizeListParams(params);
  const csv = await exportJournalCsv({ ...normalized, cabinetId });
  const filename = `journal-general-${new Date().toISOString().slice(0, 10)}.csv`;
  const blob = Buffer.from(csv, "utf-8").toString("base64");
  return { blob, filename };
}

/**
 * Export comptable mappable par période (Lot 5) : double-entrée balancée pour
 * QuickBooks / Xero / Sage. Retourne le CSV (base64) + les métadonnées de contrôle
 * (totaux débit/crédit, période verrouillée ou non).
 */
export async function exportAccountingPeriodAction(
  periode: string,
  format: AccountingExportFormat = "generic"
): Promise<{ blob: string; filename: string; meta: { locked: boolean; balanced: boolean; totalDebit: number; totalCredit: number; lineCount: number } }> {
  const cabinetId = await requireCabinetId();
  const { csv, meta } = await buildPeriodAccountingExport({ cabinetId, periode, format });
  const filename = `export-comptable-${format}-${periode}.csv`;
  const blob = Buffer.from(csv, "utf-8").toString("base64");
  return {
    blob,
    filename,
    meta: {
      locked: meta.locked,
      balanced: meta.balanced,
      totalDebit: meta.totalDebit,
      totalCredit: meta.totalCredit,
      lineCount: meta.lineCount,
    },
  };
}

function canUseManualJournal(role: UserRole): boolean {
  return canManageInvoices(role) || canManageExpenseJournal(role);
}

function sourceModuleForManualEntry(type: JournalTransactionType): JournalSourceModule {
  switch (type) {
    case "FACTURE":
      return "FACTURATION";
    case "PAIEMENT":
      return "PAIEMENTS";
    case "DEPOT_FIDEICOMMIS":
    case "RETRAIT_FIDEICOMMIS":
      return "FIDEICOMMIS";
    case "DEPENSE":
      return "DEPENSES";
    case "DEBOURS":
      return "DEBOURS";
    case "AJUSTEMENT":
    case "CORRECTION":
      return "AJUSTEMENT_MANUEL";
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function sourceIdForManualEntry(
  type: JournalTransactionType,
  reference?: string | null,
): string | null {
  if (type !== "FACTURE") return null;
  const normalizedReference = reference?.trim().toLowerCase();
  if (!normalizedReference) return null;
  return `manual-invoice:${normalizedReference}`;
}
