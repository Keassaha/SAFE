import { prisma } from "@/lib/db";
import type { MatchCandidates } from "@/lib/services/finance/match-payment";

/**
 * Charge les candidats de rapprochement (clients, factures ouvertes, dossiers, règles de payeur)
 * pour un cabinet, à fournir au matcher pur `matchPaymentProof`.
 *
 * Spec : docs/product/SPEC_IMPORT_PREUVE_PAIEMENT.md (lot L3).
 */
export async function loadPaymentMatchCandidates(cabinetId: string): Promise<MatchCandidates> {
  const [clients, openInvoices, dossiers, payerRules] = await Promise.all([
    prisma.client.findMany({
      where: { cabinetId },
      select: {
        id: true,
        email: true,
        emailSecondaire: true,
        billingEmail: true,
        raisonSociale: true,
        prenom: true,
        nom: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        cabinetId,
        invoiceStatus: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
        balanceDue: { gt: 0 },
      },
      select: { id: true, numero: true, clientId: true, dossierId: true, balanceDue: true },
      take: 1000,
    }),
    prisma.dossier.findMany({
      where: { cabinetId, numeroDossier: { not: null } },
      select: { id: true, numeroDossier: true, clientId: true },
      take: 2000,
    }),
    prisma.payerRule.findMany({
      where: { cabinetId, active: true },
      select: {
        id: true,
        payerEmail: true,
        payerName: true,
        clientId: true,
        dossierId: true,
        scope: true,
        note: true,
        active: true,
      },
      take: 2000,
    }),
  ]);

  return { clients, openInvoices, dossiers, payerRules };
}
