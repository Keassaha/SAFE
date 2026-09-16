import { prisma } from "@/lib/db";
import type { ClientCandidat } from "@/lib/services/reprise-historique/matcher";

/**
 * Charge les clients du cabinet (avec leurs dossiers) pour le rapprochement
 * d'une facture passée. Chargé à part du module pur `matcher.ts`, comme
 * `loadPaymentMatchCandidates` pour le paiement.
 *
 * Limite connue : le rapprochement se fait contre la base, pas contre les
 * autres factures du même lot pas encore versées. Deux factures d'un même
 * nouveau client déposées dans le même lot ressortiront donc chacune comme
 * « nouveau client » tant que le lot n'a pas été versé.
 */
export async function loadClientsCandidatsReprise(cabinetId: string): Promise<ClientCandidat[]> {
  const clients = await prisma.client.findMany({
    where: { cabinetId },
    select: {
      id: true,
      raisonSociale: true,
      prenom: true,
      nom: true,
      dossiers: { select: { id: true, intitule: true } },
    },
  });

  return clients.map((c) => ({
    id: c.id,
    nom: c.raisonSociale || [c.prenom, c.nom].filter(Boolean).join(" ") || "",
    dossiers: c.dossiers,
  }));
}
