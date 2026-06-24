import { prisma } from "@/lib/db";

const EPS = 0.005;

export interface ClientCreditBalance {
  clientId: string;
  label: string;
  /** Montant payé au-delà du dû (toujours > 0). */
  creditBalance: number;
  /** Un remboursement a déjà été demandé (intention enregistrée). */
  refundRequested: boolean;
  refundRequestedAt: string | null;
}

/**
 * Crédit d'un client = total négatif de ses soldes de factures.
 *
 * On s'appuie sur `Invoice.balanceDue`, qui nette DÉJÀ montantTotal − paiements −
 * notes de crédit appliquées − fidéicommis appliqué. Un total négatif signifie donc
 * que le client a réglé plus que dû (trop-payé). Le fidéicommis détenu sans facture
 * n'a pas de balanceDue : il n'est pas compté ici (il relève du module fiducie).
 * Les paiements reçus mais non alloués à une facture sont, eux, signalés à part
 * (bannière « paiements non alloués »). Aucun double comptage.
 */
export function creditFromBalanceDue(sumBalanceDue: number): number {
  return sumBalanceDue < -EPS ? -sumBalanceDue : 0;
}

function clientLabel(c: {
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
}): string {
  const company = c.raisonSociale?.trim();
  if (company) return company;
  const person = [c.prenom, c.nom].filter(Boolean).join(" ").trim();
  return person || "Client";
}

/**
 * Clients en surpaiement (solde créditeur > 0), pour un cabinet.
 * Multi-tenant : toutes les requêtes sont scopées par cabinetId.
 */
export async function getClientCreditBalances(
  cabinetId: string,
): Promise<ClientCreditBalance[]> {
  // Solde net par client sur les factures émises (hors brouillon / annulées).
  const invoices = await prisma.invoice.groupBy({
    by: ["clientId"],
    where: { cabinetId, statut: { not: "brouillon" } },
    _sum: { balanceDue: true },
  });

  const credits: { clientId: string; creditBalance: number }[] = [];
  for (const inv of invoices) {
    const credit = creditFromBalanceDue(inv._sum?.balanceDue ?? 0);
    if (credit > 0) credits.push({ clientId: inv.clientId, creditBalance: credit });
  }
  if (credits.length === 0) return [];

  const clientIds = credits.map((c) => c.clientId);
  const [clients, refundAudits] = await Promise.all([
    prisma.client.findMany({
      where: { id: { in: clientIds }, cabinetId },
      select: { id: true, raisonSociale: true, prenom: true, nom: true },
    }),
    prisma.auditLog.findMany({
      where: {
        cabinetId,
        entityType: "Client",
        action: "refund_requested",
        entityId: { in: clientIds },
      },
      orderBy: { createdAt: "desc" },
      select: { entityId: true, createdAt: true },
    }),
  ]);

  const labelById = new Map(clients.map((c) => [c.id, clientLabel(c)]));
  const refundByClient = new Map<string, Date>();
  for (const a of refundAudits) {
    if (!refundByClient.has(a.entityId)) refundByClient.set(a.entityId, a.createdAt);
  }

  return credits
    .filter((c) => labelById.has(c.clientId)) // garde le scope cabinet
    .map((c) => ({
      clientId: c.clientId,
      label: labelById.get(c.clientId) ?? "Client",
      creditBalance: c.creditBalance,
      refundRequested: refundByClient.has(c.clientId),
      refundRequestedAt: refundByClient.get(c.clientId)?.toISOString() ?? null,
    }))
    .sort((a, b) => b.creditBalance - a.creditBalance);
}
