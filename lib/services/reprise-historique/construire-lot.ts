import { cleCroisement } from "@/lib/clients/croisement-conflits";
import type { PastInvoiceExtraction } from "@/lib/ai/extract-past-invoice";
import type { MatchFacturePassee } from "@/lib/services/reprise-historique/matcher";

/**
 * Assemble le « lot » de factures passées à l'écran : rangement chronologique
 * par date d'émission (jamais par ordre de dépôt), détection des mois sans
 * dépôt entre le premier et le dernier, et les totaux du bandeau de synthèse.
 * Module PUR (aucun Prisma). Voir le plan « reprise des factures passées ».
 */

export type StatutPaiementReprise = "payee" | "partielle" | "impayee";

/**
 * Champs que l'humain a repris à la main par-dessus la lecture. Conservés à
 * part de l'extraction : devant une inspection, il faut pouvoir distinguer ce
 * que la machine a lu de ce qu'un humain a déclaré.
 */
export type ChampsCorriges = string[];

export interface FactureRepriseSaisie {
  /** Identifiant côté écran (nom de fichier ou clé temporaire), pas un id Prisma. */
  id: string;
  fichierNom: string;
  extraction: PastInvoiceExtraction;
  match: MatchFacturePassee;
  /** `null` tant que l'utilisateur n'a pas choisi — jamais deviné. */
  statutPaiement: StatutPaiementReprise | null;
  /** Date de paiement/réception, requise pour "payee" et "partielle". */
  datePaiement: string | null;
  /** Champs saisis ou rectifiés à la main par-dessus la lecture. */
  champsCorriges?: ChampsCorriges;
  /** Vrai quand la facture est tapée sans aucune pièce jointe. */
  sansPiece?: boolean;
}

export interface GroupeMois {
  /** Clé "AAAA-MM". */
  cle: string;
  libelle: string;
  factures: FactureRepriseSaisie[];
}

export interface SyntheseLot {
  periodeDebut: string | null;
  periodeFin: string | null;
  nombreClients: number;
  nombreClientsACreer: number;
  /** Somme des heures lisibles sur les lignes des factures du lot. */
  heuresReprises: number;
  totalFacture: number;
  resteDu: number;
}

export interface LotReprise {
  groupes: GroupeMois[];
  /** Factures dont la date d'émission n'a pas pu être lue — hors chronologie, à traiter à part. */
  dateInconnue: FactureRepriseSaisie[];
  synthese: SyntheseLot;
}

const MOIS_LIBELLES = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function cleMois(dateIso: string): string {
  return dateIso.slice(0, 7); // "AAAA-MM"
}

function libelleMois(cle: string): string {
  const [annee, mois] = cle.split("-");
  const index = Number.parseInt(mois, 10) - 1;
  return `${MOIS_LIBELLES[index] ?? mois} ${annee}`;
}

function moisSuivant(cle: string): string {
  const [annee, mois] = cle.split("-").map(Number);
  const suivant = mois === 12 ? 1 : mois + 1;
  const anneeSuivante = mois === 12 ? annee + 1 : annee;
  return `${anneeSuivante}-${String(suivant).padStart(2, "0")}`;
}

/** Construit la liste des clés de mois entre `debut` et `fin`, inclusivement. */
function toutesLesClesMois(debut: string, fin: string): string[] {
  const cles: string[] = [];
  let courant = debut;
  // Borne de sécurité : une reprise ne couvre jamais plus de quelques décennies.
  for (let i = 0; i < 1200 && courant <= fin; i++) {
    cles.push(courant);
    courant = moisSuivant(courant);
  }
  return cles;
}

export function construireLotReprise(factures: FactureRepriseSaisie[]): LotReprise {
  const avecDate = factures.filter((f) => f.extraction.dateEmission !== null);
  const dateInconnue = factures.filter((f) => f.extraction.dateEmission === null);

  const trieesParDate = [...avecDate].sort((a, b) =>
    (a.extraction.dateEmission as string).localeCompare(b.extraction.dateEmission as string),
  );

  const groupesParCle = new Map<string, FactureRepriseSaisie[]>();
  for (const facture of trieesParDate) {
    const cle = cleMois(facture.extraction.dateEmission as string);
    const liste = groupesParCle.get(cle) ?? [];
    liste.push(facture);
    groupesParCle.set(cle, liste);
  }

  let groupes: GroupeMois[] = [];
  if (trieesParDate.length > 0) {
    const premiereCle = cleMois(trieesParDate[0].extraction.dateEmission as string);
    const derniereCle = cleMois(
      trieesParDate[trieesParDate.length - 1].extraction.dateEmission as string,
    );
    groupes = toutesLesClesMois(premiereCle, derniereCle).map((cle) => ({
      cle,
      libelle: libelleMois(cle),
      factures: groupesParCle.get(cle) ?? [],
    }));
  }

  const nomsClientsVus = new Set<string>();
  const nomsClientsACreer = new Set<string>();
  let heuresReprises = 0;
  let totalFacture = 0;
  let resteDu = 0;

  for (const facture of factures) {
    // Même clé que celle qui décide à l'écriture (`MemoireDuLot`) : sans quoi
    // le bandeau annoncerait deux clients à créer là où le versement n'en
    // créera qu'un, « Ouellet Nadine » et « Nadine Ouellet » étant la même
    // personne.
    const cleClient =
      facture.match.client.clientId ?? `nouveau:${cleCroisement(facture.match.client.clientNom)}`;
    nomsClientsVus.add(cleClient);
    if (facture.match.client.statut === "nouveau") {
      nomsClientsACreer.add(cleClient);
    }

    for (const ligne of facture.extraction.lignes) {
      if (ligne.heures !== null) heuresReprises += ligne.heures;
    }

    const montant = facture.extraction.montantTotal ?? 0;
    totalFacture += montant;

    if (facture.statutPaiement === "impayee") {
      resteDu += montant;
    }
    // "partielle" : le reste dû exact dépend du montant payé saisi par l'utilisateur
    // à l'écran, pas de l'extraction — calculé par le caller au moment de la saisie
    // (ce module ne connaît pas le montant payé partiel, seulement le total facturé).
  }

  // Additionner des sous en virgule flottante laisse du bruit : huit factures
  // donnaient « 17550.809999999998 ». L'écran le masque en formatant, mais un
  // chiffre d'argent ne doit jamais circuler ainsi — il finit par être comparé.
  const auSou = (montant: number) => Math.round(montant * 100) / 100;

  const synthese: SyntheseLot = {
    periodeDebut: groupes[0]?.cle ?? null,
    periodeFin: groupes[groupes.length - 1]?.cle ?? null,
    nombreClients: nomsClientsVus.size,
    nombreClientsACreer: nomsClientsACreer.size,
    heuresReprises: Math.round(heuresReprises * 100) / 100,
    totalFacture: auSou(totalFacture),
    resteDu: auSou(resteDu),
  };

  return { groupes, dateInconnue, synthese };
}
