/**
 * Export comptable par période (doctrine §1/§2 — export externe). Charge les
 * écritures du journal sur la période, les transforme en double-entrée balancée
 * (mappage de comptes) et sérialise pour le logiciel cible. L'export est horodaté
 * et marque si la période est verrouillée (snapshot final reproductible).
 */

import { prisma } from "@/lib/db";
import { isPeriodLocked } from "@/lib/services/journal/period-lock";
import {
  buildAccountingExportLines,
  exportTotals,
  type ExportableEntry,
} from "@/lib/accounting/export/build-export";
import {
  serializeAccountingExport,
  type AccountingExportFormat,
} from "@/lib/accounting/export/serialize";
import type { AccountChart } from "@/lib/accounting/export/account-mapping";

export interface PeriodExportResult {
  csv: string;
  meta: {
    cabinetId: string;
    periode: string;
    from: Date;
    to: Date;
    format: AccountingExportFormat;
    generatedAt: Date;
    locked: boolean;
    lineCount: number;
    totalDebit: number;
    totalCredit: number;
    balanced: boolean;
  };
}

function monthRange(periode: string): { from: Date; to: Date } {
  const [y, m] = periode.split("-").map(Number);
  const from = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const to = new Date(y, m, 0, 23, 59, 59, 999); // dernier jour du mois
  return { from, to };
}

export async function buildPeriodAccountingExport(params: {
  cabinetId: string;
  periode: string; // "YYYY-MM"
  format?: AccountingExportFormat;
  chartOverride?: Partial<AccountChart> | null;
}): Promise<PeriodExportResult> {
  const { cabinetId, periode, format = "generic", chartOverride } = params;
  if (!/^\d{4}-\d{2}$/.test(periode)) {
    throw new Error("La période doit être au format YYYY-MM");
  }
  const { from, to } = monthRange(periode);

  const [rows, locked] = await Promise.all([
    prisma.journalGeneralEntry.findMany({
      where: { cabinetId, dateTransaction: { gte: from, lte: to } },
      orderBy: [{ dateTransaction: "asc" }, { createdAt: "asc" }],
      include: {
        client: { select: { raisonSociale: true } },
        dossier: { select: { intitule: true, numeroDossier: true } },
      },
    }),
    isPeriodLocked(cabinetId, periode),
  ]);

  const entries: ExportableEntry[] = rows.map((e) => ({
    id: e.id,
    dateTransaction: e.dateTransaction,
    typeTransaction: e.typeTransaction,
    sourceModule: e.sourceModule,
    montantEntree: e.montantEntree,
    montantSortie: e.montantSortie,
    reference: e.reference,
    description: e.description,
    clientName: e.client?.raisonSociale ?? null,
    dossierLabel: e.dossier
      ? `${e.dossier.numeroDossier ?? ""} ${e.dossier.intitule}`.trim()
      : null,
  }));

  const lines = buildAccountingExportLines(entries, chartOverride);
  const totals = exportTotals(lines);
  const csv = serializeAccountingExport(lines, format);

  return {
    csv,
    meta: {
      cabinetId,
      periode,
      from,
      to,
      format,
      generatedAt: new Date(),
      locked,
      lineCount: lines.length,
      totalDebit: totals.totalDebit,
      totalCredit: totals.totalCredit,
      balanced: totals.balanced,
    },
  };
}
