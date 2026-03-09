"use server";

import { revalidatePath } from "next/cache";
import { requireCabinetId } from "@/lib/auth/session";
import {
  getJournalEntries,
  calculateJournalBalance,
  exportJournalCsv,
} from "@/lib/services/journal";
import type { JournalListParams, JournalKpiData } from "@/types/journal";
import type { JournalEntryRow } from "@/types/journal";

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
): Promise<{ entries: JournalEntryRow[]; totalCount: number; soldeGlobal: number }> {
  const cabinetId = await requireCabinetId();
  const normalized = normalizeListParams(params);
  const result = await getJournalEntries({ ...normalized, cabinetId });
  return {
    entries: result.entries,
    totalCount: result.totalCount,
    soldeGlobal: result.soldeGlobal,
  };
}

export async function getJournalKpisAction(): Promise<JournalKpiData> {
  const cabinetId = await requireCabinetId();
  return calculateJournalBalance(cabinetId);
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
