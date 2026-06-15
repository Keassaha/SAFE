/**
 * Service fidéicommis : compte fidéicommis et application au solde facture.
 */

import { prisma } from "@/lib/db";

/** Récupère ou crée le compte fidéicommis pour un client (et optionnellement un dossier) */
export async function getOrCreateTrustAccount(params: {
  cabinetId: string;
  clientId: string;
  matterId?: string | null;
}): Promise<{ id: string; currentBalance: number }> {
  const { cabinetId, clientId, matterId } = params;
  let account = await prisma.trustAccount.findFirst({
    where: {
      cabinetId,
      clientId,
      matterId: matterId ?? null,
    },
  });
  if (!account) {
    account = await prisma.trustAccount.create({
      data: {
        cabinetId,
        clientId,
        matterId: matterId ?? null,
        currentBalance: 0,
        currency: "CAD",
      },
    });
  }
  return { id: account.id, currentBalance: account.currentBalance };
}

/** Applique un montant du fidéicommis au solde d'une facture */
export async function applyTrustToInvoice(params: {
  trustAccountId: string;
  invoiceId: string;
  amount: number;
  note?: string | null;
  createdById?: string | null;
  cabinetId?: string;
}): Promise<void> {
  void params;
  throw new Error(
    "applyTrustToInvoice est désactivé : utilisez createTrustWithdrawal, qui applique le verrou fidéicommis, " +
      "journalise l'opération et recalcule la facture de manière atomique.",
  );
}
