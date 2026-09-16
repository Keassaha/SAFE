import { cleCroisement } from "@/lib/clients/croisement-conflits";
import { normaliseIntitule } from "@/lib/services/reprise-historique/matcher";
import type { FactureRepriseSaisie } from "@/lib/services/reprise-historique/construire-lot";

/**
 * La mémoire d'un même dépôt.
 *
 * Le rapprochement d'une facture ne regarde que la base, et rien n'est écrit
 * avant le bouton : deux factures du même client encore inconnu ressortent donc
 * toutes les deux en « nouveau client ». Versées telles quelles, elles
 * créeraient deux fiches pour la même personne. Or c'est précisément le cas
 * d'usage : un cabinet qui vide une année de facturation a plusieurs factures
 * par client.
 *
 * Cette mémoire dure le temps d'un dépôt. Dès qu'un client (ou un dossier) est
 * créé pour une facture, les suivantes du même lot le retrouvent au lieu d'en
 * fabriquer un second.
 */
export class MemoireDuLot {
  private readonly clients = new Map<string, string>();
  private readonly dossiers = new Map<string, string>();

  private static cleDossier(clientId: string, intitule: string): string {
    return `${clientId}::${normaliseIntitule(intitule)}`;
  }

  /** Réécrit le rapprochement d'une facture avec ce que ce lot a déjà créé. */
  appliquer(facture: FactureRepriseSaisie): FactureRepriseSaisie {
    const { client, dossier } = facture.match;

    const clientId =
      client.clientId ?? this.clients.get(cleCroisement(client.clientNom)) ?? null;
    if (!clientId) return facture;

    const dossierId =
      dossier.dossierId ??
      this.dossiers.get(MemoireDuLot.cleDossier(clientId, dossier.dossierIntitule)) ??
      null;

    return {
      ...facture,
      match: {
        client: { ...client, statut: "existant", clientId },
        dossier: dossierId
          ? { ...dossier, statut: "existant", dossierId }
          : dossier,
      },
    };
  }

  /** Retient ce qui vient d'être écrit, pour les factures suivantes du lot. */
  retenir(
    facture: FactureRepriseSaisie,
    ecrit: { clientId: string; dossierId: string },
  ): void {
    this.clients.set(cleCroisement(facture.match.client.clientNom), ecrit.clientId);
    this.dossiers.set(
      MemoireDuLot.cleDossier(ecrit.clientId, facture.match.dossier.dossierIntitule),
      ecrit.dossierId,
    );
  }
}
