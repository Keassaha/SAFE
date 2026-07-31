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
export async function getGlobalTrustBalance(
  cabinetId: string,
  /**
   * Compte bancaire (CH-01). Fourni, le solde est borné à CE compte — c'est ce
   * qu'exigent l'art. 36 B-1 r.5 (livres distincts par compte général) et la
   * s. 18(8)ii By-Law 9 (rapprochement détaillé de chaque compte). Omis, on
   * additionne tous les comptes, ce qui reste utile pour un tableau de bord mais
   * ne constitue JAMAIS un rapprochement réglementaire.
   */
  trustBankAccountId?: string | null,
): Promise<number> {
  const result = await prisma.trustTransaction.aggregate({
    where: { cabinetId, ...(trustBankAccountId ? { trustBankAccountId } : {}) },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/**
 * Soldes fidéicommis agrégés par (client, dossier), calculés depuis le registre
 * append-only. Utilisé par la vue conformité pour montrer le détail « solde par
 * dossier ». Exclut les lignes dont le solde net est ~0 (epsilon anti-bruit).
 */
export async function getTrustBalancesByDossier(
  cabinetId: string,
  /** Compte bancaire (CH-01). Fourni, ne renvoie que les cartes-clients de CE compte. */
  trustBankAccountId?: string | null,
): Promise<Array<{ clientId: string; dossierId: string | null; balance: number }>> {
  const groups = await prisma.trustTransaction.groupBy({
    by: ["clientId", "dossierId"],
    where: { cabinetId, ...(trustBankAccountId ? { trustBankAccountId } : {}) },
    _sum: { amount: true },
  });
  return groups
    .map((g) => ({
      clientId: g.clientId,
      dossierId: g.dossierId,
      balance: g._sum.amount ?? 0,
    }))
    .filter((g) => Math.abs(g.balance) > 0.005)
    .sort((a, b) => b.balance - a.balance);
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
