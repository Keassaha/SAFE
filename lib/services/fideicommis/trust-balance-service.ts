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
