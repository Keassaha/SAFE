import { prisma } from "@/lib/db";
import { getTrustBalance } from "@/lib/services/fideicommis/trust-balance-service";

export interface ClosureBlockers {
  /** Au moins un élément mérite une alerte avant de fermer le dossier. */
  hasBlockers: boolean;
  /** Au moins un élément EMPÊCHE la fermeture (solde fidéicommis négatif). */
  hasHardBlock: boolean;
  factures: { count: number; montant: number };
  debours: { count: number; montant: number };
  trust: { balance: number; isNegative: boolean; isPositive: boolean };
}

const EPS = 0.005;

/**
 * Détecte ce qui devrait alerter (ou bloquer) avant la fermeture d'un dossier :
 *  - factures impayées (balanceDue > 0, hors brouillon) ;
 *  - débours non recouvrés (statut NON_FACTURE ou FACTURE) ;
 *  - solde fidéicommis : négatif = blocage dur (conformité Barreau),
 *    positif = fonds à restituer au client (alerte acquittable).
 *
 * Réutilise les services et agrégats existants (getTrustBalance, Prisma).
 * Le dossier doit déjà être validé comme appartenant au cabinet par l'appelant.
 */
export async function getDossierClosureBlockers(params: {
  cabinetId: string;
  dossierId: string;
  clientId: string;
}): Promise<ClosureBlockers> {
  const { cabinetId, dossierId, clientId } = params;

  const [invAgg, debAgg, trustBalance] = await Promise.all([
    prisma.invoice.aggregate({
      where: {
        cabinetId,
        dossierId,
        balanceDue: { gt: EPS },
        statut: { not: "brouillon" },
      },
      _count: true,
      _sum: { balanceDue: true },
    }),
    prisma.deboursDossier.aggregate({
      where: { cabinetId, dossierId, statutDebours: { in: ["NON_FACTURE", "FACTURE"] } },
      _count: true,
      _sum: { montant: true },
    }),
    getTrustBalance({ cabinetId, clientId, dossierId }),
  ]);

  const factures = { count: invAgg._count, montant: invAgg._sum.balanceDue ?? 0 };
  const debours = { count: debAgg._count, montant: debAgg._sum.montant ?? 0 };
  const trust = {
    balance: trustBalance,
    isNegative: trustBalance < -EPS,
    isPositive: trustBalance > EPS,
  };

  const hasHardBlock = trust.isNegative;
  const hasBlockers =
    factures.count > 0 || debours.count > 0 || trust.isNegative || trust.isPositive;

  return { hasBlockers, hasHardBlock, factures, debours, trust };
}
