import { prisma } from "@/lib/db";

/** Factures dont la taxe est perçue (revenu reconnu). Exclut DRAFT, CANCELLED, CREDITED. */
const TAX_COLLECTED_STATUSES = ["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"] as const;
const CREDIT_NOTE_STATUSES = ["ISSUED", "PARTIALLY_APPLIED", "FULLY_APPLIED"] as const;

export interface TaxLine {
  percue: number;
  creditsIntrants: number;
  notesCredit: number;
  aRemettre: number;
}

export interface TaxRemittanceReport {
  periode: { from: string; to: string };
  tps: TaxLine;
  tvq: TaxLine;
  totalARemettre: number;
}

/**
 * Préparation TPS/TVQ à remettre (déterministe, ESTIMATION à faire valider par
 * le comptable).
 *
 * À remettre = taxe perçue sur ventes − notes de crédit émises − crédits de
 * taxe sur intrants (dépenses validées). Sur la période [from, to].
 */
export async function getTaxRemittance(
  cabinetId: string,
  period: { from: Date; to: Date },
): Promise<TaxRemittanceReport> {
  const { from, to } = period;

  const [sales, credits, expenses] = await Promise.all([
    prisma.invoice.aggregate({
      where: { cabinetId, invoiceStatus: { in: [...TAX_COLLECTED_STATUSES] }, dateEmission: { gte: from, lte: to } },
      _sum: { taxGst: true, taxQst: true },
    }),
    prisma.creditNote.aggregate({
      where: { cabinetId, status: { in: [...CREDIT_NOTE_STATUSES] }, creditDate: { gte: from, lte: to } },
      _sum: { gstCredit: true, qstCredit: true },
    }),
    prisma.cabinetExpense.aggregate({
      where: { cabinetId, statutValidation: "VALIDE", typeTransaction: "DEPENSE", date: { gte: from, lte: to } },
      _sum: { tps: true, tvq: true },
    }),
  ]);

  const round2 = (n: number) => Math.round(n * 100) / 100;

  const buildLine = (percue: number, notesCredit: number, creditsIntrants: number): TaxLine => ({
    percue: round2(percue),
    notesCredit: round2(notesCredit),
    creditsIntrants: round2(creditsIntrants),
    aRemettre: round2(percue - notesCredit - creditsIntrants),
  });

  const tps = buildLine(sales._sum.taxGst ?? 0, credits._sum.gstCredit ?? 0, expenses._sum.tps ?? 0);
  const tvq = buildLine(sales._sum.taxQst ?? 0, credits._sum.qstCredit ?? 0, expenses._sum.tvq ?? 0);

  return {
    periode: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
    tps,
    tvq,
    totalARemettre: round2(tps.aRemettre + tvq.aRemettre),
  };
}

/** Trimestre civil contenant `now` (par défaut), borné [début, fin]. */
export function currentQuarter(now: Date = new Date()): { from: Date; to: Date } {
  const year = now.getFullYear();
  const q = Math.floor(now.getMonth() / 3); // 0..3
  const from = new Date(year, q * 3, 1);
  const to = new Date(year, q * 3 + 3, 0, 23, 59, 59, 999);
  return { from, to };
}
