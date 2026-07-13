/**
 * Service de calcul du solde fidéicommis (source de vérité à partir des transactions).
 * Append-only : le solde est la somme des montants des transactions (dépôt +, retrait -, correction ±).
 */

import { prisma } from "@/lib/db";

/**
 * Calcule le solde fidéicommis pour un client et un dossier (ou compte client global si dossierId null).
 * Solde = somme des montants des transactions (deposit → +, withdrawal → -, correction → ±).
 */
export async function getTrustBalance(params: {
  cabinetId: string;
  clientId: string;
  dossierId?: string | null;
}): Promise<number> {
  const { cabinetId, clientId, dossierId } = params;
  const where = {
    cabinetId,
    clientId,
    dossierId: dossierId ?? null,
  };
  const result = await prisma.trustTransaction.aggregate({
    where,
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/**
 * Solde total fidéicommis du cabinet (tous clients et dossiers).
 */
export async function getGlobalTrustBalance(cabinetId: string): Promise<number> {
  const result = await prisma.trustTransaction.aggregate({
    where: { cabinetId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/**
 * Nombre de clients détenant réellement des sommes en fidéicommis (solde > 0),
 * calculé depuis le registre append-only TrustTransaction (source de vérité).
 * Utilisé par le tableau de bord (« Clients avec fonds en fiducie ») plutôt que
 * de compter la table TrustAccount, qui n'est pas toujours peuplée.
 */
export async function countClientsWithTrustFunds(cabinetId: string): Promise<number> {
  const groups = await prisma.trustTransaction.groupBy({
    by: ["clientId"],
    where: { cabinetId },
    _sum: { amount: true },
  });
  return groups.filter((g) => (g._sum.amount ?? 0) > 0).length;
}
