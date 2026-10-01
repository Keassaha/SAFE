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

export interface RessemblanceClient {
  clientId: string;
  nom: string;
}

export interface MatchClient {
  statut: "existant" | "nouveau";
  clientId: string | null;
  /** Nom à afficher/créer : celui du client existant si trouvé, sinon celui lu. */
  clientNom: string;
  /**
   * Clients du cabinet dont le nom ressemble à celui qui a été lu, quand aucun
   * ne correspond exactement. Jamais rattaché d'office : proposé à l'écran.
   */
  ressemblances?: RessemblanceClient[];
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

/** Un intitulé assez parlant pour qu'on ose l'employer comme preuve d'identité. */
const LONGUEUR_PARLANTE = 10;

/**
 * Deux intitulés désignent-ils le même dossier ?
 *
 * Un client a souvent PLUSIEURS dossiers, et chaque cabinet nomme les siens à
 * sa façon : « 2026-050 — Bail commercial », « Tremblay c. Untel »,
 * « Divorce », « Divorce 2 ». La règle doit donc se tromper du bon côté.
 *
 * Se tromper en RATTACHANT range une facture sur le mauvais dossier du client :
 * les heures, les débours et l'argent partent ailleurs, et personne ne le voit.
 * Se tromper en SÉPARANT crée un dossier de trop, qui se voit à l'écran et se
 * corrige. On rattache donc seulement sur :
 *
 *   - une égalité franche, une fois la casse et les accents mis de côté ;
 *   - ou une inclusion dont la partie commune est assez parlante pour valoir
 *     preuve : au moins deux mots et dix caractères. « Bail commercial »
 *     retrouve « 2026-050 — Bail commercial », mais « Divorce » ne se colle pas
 *     à « Divorce 2 », et « Dossier 1 » ne se colle pas à « Dossier 12 ».
 */
export function intitulesSeRecoupent(a: string, b: string): boolean {
  const na = normaliseIntitule(a);
  const nb = normaliseIntitule(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const [court, long] = na.length <= nb.length ? [na, nb] : [nb, na];
  if (!long.includes(court)) return false;

  const assezParlant =
    court.length >= LONGUEUR_PARLANTE && court.split(" ").filter(Boolean).length >= 2;
  if (!assezParlant) return false;

  // L'inclusion doit tomber sur des mots entiers : « bail commercial » ne doit
  // pas se reconnaître dans « contre-bail commercialisation ».
  return new RegExp(`(^|\\s)${court.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(long);
}

const DOSSIER_INTITULE_PAR_DEFAUT = "Dossier";

/**
 * Distance de Levenshtein : le nombre de lettres à ajouter, retirer ou changer
 * pour passer d'un nom à l'autre. Sert à repérer une coquille, jamais à
 * décider : « Trembley » et « Tremblay » sont à une lettre l'un de l'autre,
 * « Tremblay » et « Bombardier » ne le sont pas.
 *
 * Les accents ne jouent aucun rôle ici : `normalizeClientName` les a déjà
 * retirés en amont, « Kaboré » et « Kabore » se retrouvent donc tout seuls.
 */
export function distanceLettres(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let precedente = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const courante = [i];
    for (let j = 1; j <= b.length; j++) {
      const coutSubstitution = a[i - 1] === b[j - 1] ? 0 : 1;
      courante[j] = Math.min(
        courante[j - 1]! + 1, // insertion
        precedente[j]! + 1, // suppression
        precedente[j - 1]! + coutSubstitution,
      );
    }
    precedente = courante;
  }
  return precedente[b.length]!;
}

/**
 * Combien de lettres peuvent différer avant qu'on cesse d'y voir une coquille.
 * Proportionnel à la longueur : une lettre sur un nom court, davantage sur une
 * raison sociale entière, sans jamais laisser passer deux noms étrangers.
 */
function toleranceCoquille(longueur: number): number {
  if (longueur < 5) return 0;
  return Math.max(1, Math.floor(longueur / 7));
}

/**
 * Les clients dont le nom ressemble à celui qui a été lu, du plus proche au
 * plus lointain. Trois au plus : au-delà, ce n'est plus une suggestion, c'est
 * une liste à parcourir.
 */
export function ressemblancesClient(
  nomLu: string | null,
  clients: ClientCandidat[],
): RessemblanceClient[] {
  const cle = cleCroisement(nomLu);
  if (!cle) return [];

  return clients
    .map((c) => ({ client: c, distance: distanceLettres(cle, cleCroisement(c.nom)) }))
    .filter(({ distance }) => distance > 0 && distance <= toleranceCoquille(cle.length))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(({ client }) => ({ clientId: client.id, nom: client.nom }));
}

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
    : {
        statut: "nouveau",
        clientId: null,
        clientNom: nomAffiche,
        // Aucun client ne correspond : peut-être une coquille. On propose,
        // on ne rattache pas. Se tromper en rattachant est invisible.
        ressemblances: ressemblancesClient(extraction.clientNom, clients),
      };

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
