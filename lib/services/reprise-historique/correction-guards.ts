import type { JournalCorrectionMotive } from "@prisma/client";
import { MOTIF_TEXTE_MIN } from "@/lib/services/journal/annulation";

/**
 * Garde-fous PURS de la correction d'une facture reprise.
 *
 * L'espace de correction des exercices précédents ouvre une porte que SAFE
 * ferme partout ailleurs : corriger une écriture issue d'un module métier.
 * Ce qui rend l'exception tenable devant une inspection tient en deux règles,
 * toutes les deux écrites ici, toutes les deux testées :
 *
 *   1. seule une écriture MARQUÉE REPRISE est corrigeable de cette façon.
 *      Une facture née du fonctionnement normal de SAFE garde son chemin
 *      habituel (note de crédit, annulation depuis son module) ;
 *   2. la correction ne réécrit jamais l'écriture d'origine. Elle neutralise
 *      son effet net par une contrepassation motivée, puis rejoue la version
 *      corrigée. L'original reste lisible au registre des corrections.
 */

export type RefusCorrection =
  | "introuvable"
  | "pas_une_reprise"
  | "facture_annulee"
  | "aucun_changement";

export interface VerdictCorrection {
  ok: boolean;
  refus?: RefusCorrection;
  message?: string;
}

export interface FactureCorrigible {
  estReprise: boolean;
  cancelledAt: Date | null;
}

/** Décide si cette facture accepte une correction d'exercice précédent. */
export function assertFactureCorrigible(facture: FactureCorrigible | null): VerdictCorrection {
  if (!facture) {
    return { ok: false, refus: "introuvable", message: "Facture introuvable dans ce cabinet." };
  }
  if (!facture.estReprise) {
    return {
      ok: false,
      refus: "pas_une_reprise",
      message:
        "Cette facture n'a pas été reprise d'un exercice précédent : elle a été émise par SAFE. " +
        "Corrigez-la depuis Facturation, par note de crédit ou annulation.",
    };
  }
  if (facture.cancelledAt) {
    return {
      ok: false,
      refus: "facture_annulee",
      message: "Cette facture est déjà annulée. Une annulation ne se corrige pas.",
    };
  }
  return { ok: true };
}

/** Montants portés par les écritures déjà passées pour une même pièce. */
export interface EcriturePassee {
  montantEntree: number;
  montantSortie: number;
  sourceId: string | null;
}

/**
 * Effet net à neutraliser. Convention identique à `append-only-corrections` :
 * positif = sortie nette à annuler, négatif = entrée nette à annuler.
 */
export function calculerEffetNet(entries: EcriturePassee[]): number {
  let net = 0;
  for (const e of entries) net += (e.montantSortie ?? 0) - (e.montantEntree ?? 0);
  return Math.round(net * 100) / 100;
}

/** Plus grande version `#vN` déjà écrite pour cette pièce. 1 si seule l'initiale existe. */
export function versionLaPlusHaute(entries: EcriturePassee[]): number {
  let max = 1;
  for (const e of entries) {
    const trouve = e.sourceId?.match(/#v(\d+)$/);
    if (!trouve) continue;
    const v = Number.parseInt(trouve[1]!, 10);
    if (v > max) max = v;
  }
  return max;
}

export type StatutPaiementCorrige = "payee" | "partielle" | "impayee";

export interface EtatFacture {
  montantTotal: number;
  dateEmission: string;
  statutPaiement: StatutPaiementCorrige;
  montantPaye: number;
  datePaiement: string | null;
}

export interface ChangementsMateriels {
  material: boolean;
  raisons: string[];
}

/**
 * Ce qui a matériellement changé, en toutes lettres : les raisons partent
 * telles quelles dans la description de l'écriture de correction, pour qu'un
 * lecteur du registre voie ce qui a bougé sans ouvrir la facture.
 */
export function changementsMateriels(avant: EtatFacture, apres: EtatFacture): ChangementsMateriels {
  const raisons: string[] = [];
  if (Math.abs(avant.montantTotal - apres.montantTotal) >= 0.01) {
    raisons.push(`montant total ${avant.montantTotal} → ${apres.montantTotal}`);
  }
  if (avant.dateEmission !== apres.dateEmission) {
    raisons.push(`date d'émission ${avant.dateEmission} → ${apres.dateEmission}`);
  }
  if (avant.statutPaiement !== apres.statutPaiement) {
    raisons.push(`statut ${avant.statutPaiement} → ${apres.statutPaiement}`);
  }
  if (Math.abs(avant.montantPaye - apres.montantPaye) >= 0.01) {
    raisons.push(`montant payé ${avant.montantPaye} → ${apres.montantPaye}`);
  }
  if ((avant.datePaiement ?? "") !== (apres.datePaiement ?? "")) {
    raisons.push(`date de paiement ${avant.datePaiement ?? "aucune"} → ${apres.datePaiement ?? "aucune"}`);
  }
  return { material: raisons.length > 0, raisons };
}

export interface MotifCorrection {
  code: JournalCorrectionMotive;
  texte?: string | null;
}

/**
 * Le motif est obligatoire à chaque correction. `AUTRE` exige une précision
 * d'au moins `MOTIF_TEXTE_MIN` caractères, comme partout ailleurs dans le
 * module comptable : sans motif, le bouton ne part pas (doctrine §2).
 */
export function validerMotifCorrection(motif: MotifCorrection): VerdictCorrection & { texte?: string | null } {
  const texte = motif.texte?.trim() || null;
  if (motif.code === "AUTRE" && (!texte || texte.length < MOTIF_TEXTE_MIN)) {
    return {
      ok: false,
      message: `Le motif « Autre » demande une précision d'au moins ${MOTIF_TEXTE_MIN} caractères.`,
    };
  }
  return { ok: true, texte };
}
