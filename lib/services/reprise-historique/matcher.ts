import { cleCroisement } from "@/lib/clients/croisement-conflits";
import type { PastInvoiceExtraction } from "@/lib/ai/extract-past-invoice";

/**
 * Rapprochement d'une facture passée extraite avec les clients/dossiers déjà
 * connus du cabinet. Module PUR (aucun Prisma) : les candidats sont chargés à
 * part, comme `loadPaymentMatchCandidates` pour le paiement. Voir le plan
 * « reprise des factures passées » (priorité 2, chantier entrée client).
 */

export interface DossierCandidat {
  id: string;
  intitule: string;
}

export interface ClientCandidat {
  id: string;
  nom: string;
  dossiers: DossierCandidat[];
}

export interface MatchClient {
  statut: "existant" | "nouveau";
  clientId: string | null;
  /** Nom à afficher/créer : celui du client existant si trouvé, sinon celui lu. */
  clientNom: string;
}

export interface MatchDossier {
  statut: "existant" | "nouveau";
  dossierId: string | null;
  /** Intitulé à afficher/créer. */
  dossierIntitule: string;
}

export interface MatchFacturePassee {
  client: MatchClient;
  dossier: MatchDossier;
}

/**
 * Normalise un intitulé de dossier pour une comparaison insensible à la casse
 * et aux espaces superflus. Contrairement à `cleCroisement`, on ne trie pas les
 * mots : l'ordre d'un intitulé de mandat est significatif (« Séparation de
 * corps » ≠ « Corps de séparation »).
 */
export function normaliseIntitule(intitule: string): string {
  return intitule
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Un intitulé "recoupe" l'autre si l'un contient l'autre (dans un sens ou l'autre). */
function intitulesSeRecoupent(a: string, b: string): boolean {
  const na = normaliseIntitule(a);
  const nb = normaliseIntitule(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

const DOSSIER_INTITULE_PAR_DEFAUT = "Dossier";

function matchClientCandidat(
  clientNomLu: string | null,
  clients: ClientCandidat[],
): { candidat: ClientCandidat | null; nomAffiche: string } {
  const nomAffiche = clientNomLu?.trim() || "Client sans nom lu";
  if (!clientNomLu) return { candidat: null, nomAffiche };

  const cle = cleCroisement(clientNomLu);
  if (!cle) return { candidat: null, nomAffiche };

  const candidat = clients.find((c) => cleCroisement(c.nom) === cle) ?? null;
  return { candidat, nomAffiche: candidat?.nom ?? nomAffiche };
}

function matchDossierCandidat(
  dossierIntituleLu: string | null,
  dossiers: DossierCandidat[],
): { candidat: DossierCandidat | null; intituleAffiche: string } {
  const intituleAffiche = dossierIntituleLu?.trim() || DOSSIER_INTITULE_PAR_DEFAUT;
  if (!dossierIntituleLu) return { candidat: null, intituleAffiche };

  const candidat =
    dossiers.find((d) => intitulesSeRecoupent(d.intitule, dossierIntituleLu)) ?? null;
  return { candidat, intituleAffiche: candidat?.intitule ?? intituleAffiche };
}

/**
 * Rapproche une extraction de facture passée avec les clients du cabinet.
 *
 * - Client : `cleCroisement` (même clé que le croisement de conflits) comparée
 *   aux clients existants. Aucune correspondance => `nouveau`, le client sera
 *   créé au moment de verser la reprise.
 * - Dossier : cherché seulement parmi les dossiers DU client trouvé. Un client
 *   nouveau a nécessairement un dossier nouveau (il n'a encore aucun dossier).
 */
export function matchFacturePassee(
  extraction: Pick<PastInvoiceExtraction, "clientNom" | "dossierIntitule">,
  clients: ClientCandidat[],
): MatchFacturePassee {
  const { candidat: clientCandidat, nomAffiche } = matchClientCandidat(
    extraction.clientNom,
    clients,
  );

  const client: MatchClient = clientCandidat
    ? { statut: "existant", clientId: clientCandidat.id, clientNom: nomAffiche }
    : { statut: "nouveau", clientId: null, clientNom: nomAffiche };

  const dossiersDuClient = clientCandidat?.dossiers ?? [];
  const { candidat: dossierCandidat, intituleAffiche } = matchDossierCandidat(
    extraction.dossierIntitule,
    dossiersDuClient,
  );

  const dossier: MatchDossier = dossierCandidat
    ? { statut: "existant", dossierId: dossierCandidat.id, dossierIntitule: intituleAffiche }
    : { statut: "nouveau", dossierId: null, dossierIntitule: intituleAffiche };

  return { client, dossier };
}
