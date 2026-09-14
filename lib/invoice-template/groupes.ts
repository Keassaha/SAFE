/**
 * SAFE — Les deux groupes d'une facture, et ce qu'ils totalisent.
 *
 * Le document rendait toutes les lignes dans UN seul tableau, en distinguant
 * les débours par une pastille. Le client lisait donc une suite indistincte où
 * le travail et les sommes avancées se mêlaient, et il devait descendre au
 * récapitulatif pour savoir combien coûtait chaque chose.
 *
 * Deux groupes, deux sous-totaux, chacun sur son titre. Demande CEO du
 * 2026-09-10, sur les critères d'une facture professionnelle.
 *
 * Fonctions PURES : le document les appelle, les tests aussi. Le rendu PDF
 * n'est vérifiable qu'en fumée (il produit un tampon binaire), donc tout ce qui
 * se calcule vit ici, où il se vérifie vraiment.
 */

import type { PresentedLine } from "@/lib/services/billing/invoice-presenter";

/**
 * Comment la facture a formé ses honoraires.
 *
 * Déduit des LIGNES, jamais du mode du dossier : une facture porte parfois les
 * deux, et un dossier au forfait peut porter une heure. Demande CEO du
 * 2026-09-14.
 */
export type ModeHonoraires = "horaire" | "forfait" | "mixte" | "aucun";

export interface GroupesFacture {
  /** Le travail : ce que le cabinet a fait. Les deux familles réunies. */
  honoraires: PresentedLine[];
  /** Les honoraires au forfait. Vides si la facture n'en porte pas. */
  honorairesForfait: PresentedLine[];
  /** Les honoraires au temps passé. */
  honorairesHoraire: PresentedLine[];
  /** `mixte` quand les deux familles sont présentes. */
  modeHonoraires: ModeHonoraires;
  /** Les sommes avancées à des tiers pour le compte du client. */
  debours: PresentedLine[];
  /** Les rabais, rendus à part : un montant négatif dans un tableau se rate. */
  rabais: PresentedLine[];
  /** Ce qui ne rentre dans aucune des trois familles (intérêts, ajustements). */
  autres: PresentedLine[];
  sousTotaux: {
    honoraires: number;
    deboursTaxables: number;
    deboursNonTaxables: number;
    /** Somme des deux, telle qu'elle s'affiche sur le titre du groupe. */
    debours: number;
    /** Sous-total du forfait, porté par son titre sur une facture mixte. */
    honorairesForfait: number;
    /** Sous-total de l'horaire. */
    honorairesHoraire: number;
    rabais: number;
    /** L'assiette sur laquelle la TPS et la TVQ se calculent. */
    baseTaxable: number;
  };
}

export function grouperLignes(lignes: PresentedLine[]): GroupesFacture {
  const honoraires: PresentedLine[] = [];
  const honorairesForfait: PresentedLine[] = [];
  const honorairesHoraire: PresentedLine[] = [];
  const debours: PresentedLine[] = [];
  const rabais: PresentedLine[] = [];
  const autres: PresentedLine[] = [];

  let sHonoraires = 0;
  let sTaxables = 0;
  let sNonTaxables = 0;
  let sRabais = 0;
  let sForfait = 0;
  let sHoraire = 0;

  for (const l of lignes) {
    switch (l.type) {
      case "honoraires":
        honoraires.push(l);
        sHonoraires += l.amount;
        /* Une ligne sans base déclarée rejoint l'horaire : c'est le cas
           ordinaire, et le forfait se déclare. Mieux vaut ranger une ligne
           ancienne du mauvais côté que la faire disparaître d'un tableau. */
        if (l.basis === "forfait") {
          honorairesForfait.push(l);
          sForfait += l.amount;
        } else {
          honorairesHoraire.push(l);
          sHoraire += l.amount;
        }
        break;
      case "debours_taxable":
        debours.push(l);
        sTaxables += l.amount;
        break;
      case "debours_non_taxable":
        debours.push(l);
        sNonTaxables += l.amount;
        break;
      case "rabais":
        rabais.push(l);
        // Le montant est stocké négatif ; le récapitulatif l'affiche en négatif,
        // le sous-total le porte en valeur absolue pour se lire.
        sRabais += Math.abs(l.amount);
        break;
      default:
        autres.push(l);
    }
  }

  /* L'assiette taxable. Sans elle, un client qui vérifie la TPS ne retombe
     jamais sur le chiffre : les débours non taxables n'en font pas partie, et
     le rabais la réduit. C'est le nombre qui rend la facture vérifiable. */
  const baseTaxable = arrondi(sHonoraires + sTaxables - sRabais);

  const modeHonoraires: ModeHonoraires =
    honorairesForfait.length > 0 && honorairesHoraire.length > 0
      ? "mixte"
      : honorairesForfait.length > 0
        ? "forfait"
        : honorairesHoraire.length > 0
          ? "horaire"
          : "aucun";

  return {
    honoraires,
    honorairesForfait,
    honorairesHoraire,
    modeHonoraires,
    debours,
    rabais,
    autres,
    sousTotaux: {
      honoraires: arrondi(sHonoraires),
      honorairesForfait: arrondi(sForfait),
      honorairesHoraire: arrondi(sHoraire),
      deboursTaxables: arrondi(sTaxables),
      deboursNonTaxables: arrondi(sNonTaxables),
      debours: arrondi(sTaxables + sNonTaxables),
      rabais: arrondi(sRabais),
      baseTaxable,
    },
  };
}

/** Un débours taxable se dit « Oui » sur la facture, l'autre « Non ». */
export function deboursEstTaxable(l: PresentedLine): boolean {
  return l.type === "debours_taxable";
}

function arrondi(n: number): number {
  return Math.round(n * 100) / 100;
}
