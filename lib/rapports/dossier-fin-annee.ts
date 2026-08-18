/**
 * SAFE — Dossier de fin d'année.
 *
 * Spec : docs/accounting/SPEC_DEPENSES_ET_PREPARATION_FISCALE.md §3 (lot 4).
 *
 * CE QU'IL REMPLACE
 *
 * Le « Rapport annuel d'impôts » affichait quatre lignes, toutes du côté revenus :
 * facturé, TPS collectée, TVQ collectée, paiements reçus. Aucune déduction.
 *
 * Un onglet nommé « rapport annuel d'impôts » qui ne porte aucune déduction est PIRE
 * qu'un onglet absent : il donne au cabinet le sentiment d'être prêt. C'est un défaut
 * de promesse avant d'être un défaut technique.
 *
 * LA RÈGLE QUI GOUVERNE CE MODULE
 *
 * Un dossier qui affiche ses propres zones d'ombre est un dossier qu'un comptable
 * peut utiliser. Un dossier qui prétend être complet oblige le comptable à tout
 * revérifier, et le cabinet paie ces heures.
 *
 * D'où le bloc « incertitudes », qui n'est pas décoratif : c'est lui qui rend les
 * sept autres crédibles. Le module préfère DÉCLARER qu'il ne sait pas plutôt que de
 * produire un chiffre plausible et faux.
 */

import { taxeReclamable, type TaxOrigin } from "@/lib/expense-journal/tax-decomposition";
import { deductibiliteFor } from "@/lib/expense-journal/deductibilite";
import { deductionRepresentation, type DeductionRepresentation } from "@/lib/expense-journal/plafond-representation";

const R2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/* ── Entrées ──────────────────────────────────────────────────────────────── */

export interface DepenseFinAnnee {
  id: string;
  categoryCode: string | null;
  categoryName: string | null;
  montant: number;
  montantHt: number | null;
  tps: number | null;
  tvq: number | null;
  taxOrigin: TaxOrigin | null;
  /** Une pièce justificative est-elle attachée ? */
  piecePresente: boolean;
}

export interface EntreesDossier {
  annee: number;
  revenus: { factureHt: number; encaisse: number };
  taxesCollectees: number;
  deboursRefactures: number;
  depenses: ReadonlyArray<DepenseFinAnnee>;
  /** Part d'usage d'affaires du véhicule, déclarée par le cabinet. */
  prorataVehicule?: number | null;
  /** Mois de l'exercice dont la période comptable n'est pas verrouillée. */
  moisNonVerrouilles?: ReadonlyArray<string>;
  /** Province du cabinet : décide si le plafond québécois s'applique. */
  province?: string | null;
}

/* ── Sorties ──────────────────────────────────────────────────────────────── */

export interface LigneCategorie {
  code: string | null;
  nom: string;
  nombre: number;
  montantHt: number;
  taxePayee: number;
  taxeReclamable: number;
  /** Part déductible au revenu. `null` quand elle dépend d'une valeur manquante. */
  tauxDeductible: number | null;
  /** Un plafond de fin d'exercice s'ajoute et n'est pas calculé ici. */
  plafondApplicable: boolean;
}

export type CodeIncertitude =
  | "TAXES_ESTIMEES"
  | "CATEGORIE_AUTRES"
  | "PERIODE_NON_VERROUILLEE"
  | "PRORATA_VEHICULE_ABSENT"
  | "PLAFOND_QC_EXCEPTIONS_CULTURELLES"
  | "PIECES_MANQUANTES";

export interface Incertitude {
  code: CodeIncertitude;
  /** Ce que le comptable doit savoir, en une phrase. */
  message: string;
  /** Nombre de lignes concernées, quand ça a un sens. */
  nombre?: number;
  /** Montant en jeu, quand ça a un sens. */
  montant?: number;
}

export interface DossierFinAnnee {
  annee: number;
  revenus: { factureHt: number; encaisse: number; ecart: number };
  depensesParCategorie: LigneCategorie[];
  totaux: { montantHt: number; taxePayee: number; taxeReclamable: number };
  taxes: { collectee: number; payeeReclamable: number; netARemettre: number };
  deboursRefactures: number;
  /**
   * Frais de représentation : le plafond s'applique au CUMUL de l'exercice, donc
   * il est calculé ici et nulle part ailleurs. Absent quand le cabinet n'a aucun
   * frais de cette nature.
   */
  representation: DeductionRepresentation | null;
  sansPiece: { nombre: number; montant: number; ids: string[] };
  incertitudes: Incertitude[];
}

/* ── Calcul ───────────────────────────────────────────────────────────────── */

/**
 * Construit le dossier. Fonction PURE : aucune lecture de base, aucune date
 * implicite. Tout ce qu'elle sait lui est donné, ce qui la rend testable sur des
 * cas limites qu'une base ne produirait qu'une fois par an.
 */
export function construireDossierFinAnnee(e: EntreesDossier): DossierFinAnnee {
  const prorata = e.prorataVehicule ?? null;

  // ── Dépenses, regroupées par catégorie ──────────────────────────────────
  const parCode = new Map<string, LigneCategorie>();
  const sansPieceIds: string[] = [];
  let sansPieceMontant = 0;

  for (const d of e.depenses) {
    const cle = d.categoryCode ?? "__SANS__";
    const regle = deductibiliteFor(d.categoryCode);
    const { reclamable } = taxeReclamable(
      [
        {
          tps: d.tps ?? 0,
          tvq: d.tvq ?? 0,
          origine: d.taxOrigin ?? "ESTIMEE",
          categoryCode: d.categoryCode,
        },
      ],
      prorata,
    );

    const ligne = parCode.get(cle) ?? {
      code: d.categoryCode,
      nom: d.categoryName ?? "Sans catégorie",
      nombre: 0,
      montantHt: 0,
      taxePayee: 0,
      taxeReclamable: 0,
      tauxDeductible: regle.prorataCabinet ? prorata : regle.tauxRevenu,
      plafondApplicable: regle.plafond != null,
    };

    ligne.nombre += 1;
    // À défaut de ventilation, le montant entier compte comme HT : c'est le cas
    // des dépenses jamais reprises, et le total doit rester juste.
    ligne.montantHt += d.montantHt ?? d.montant;
    ligne.taxePayee += (d.tps ?? 0) + (d.tvq ?? 0);
    ligne.taxeReclamable += reclamable;
    parCode.set(cle, ligne);

    if (!d.piecePresente) {
      sansPieceIds.push(d.id);
      sansPieceMontant += d.montant;
    }
  }

  const depensesParCategorie = [...parCode.values()]
    .map((l) => ({
      ...l,
      montantHt: R2(l.montantHt),
      taxePayee: R2(l.taxePayee),
      taxeReclamable: R2(l.taxeReclamable),
    }))
    .sort((a, b) => b.montantHt - a.montantHt);

  const totaux = {
    montantHt: R2(depensesParCategorie.reduce((s, l) => s + l.montantHt, 0)),
    taxePayee: R2(depensesParCategorie.reduce((s, l) => s + l.taxePayee, 0)),
    taxeReclamable: R2(depensesParCategorie.reduce((s, l) => s + l.taxeReclamable, 0)),
  };

  // ── Net à remettre ──────────────────────────────────────────────────────
  // Le chiffre que le cabinet ne voyait nulle part. Remettre la taxe collectée
  // sans déduire la taxe payée, c'est remettre trop, tous les trimestres.
  const taxes = {
    collectee: R2(e.taxesCollectees),
    payeeReclamable: totaux.taxeReclamable,
    netARemettre: R2(e.taxesCollectees - totaux.taxeReclamable),
  };

  // Le plafond québécois, au cumul. Le chiffre d'affaires retenu est le facturé
  // hors taxes de l'exercice : c'est la mesure du volume d'affaires dont dispose
  // SAFE, et celle qui correspond au « chiffre d'affaires annuel » du barème.
  const ligneRepresentation = depensesParCategorie.find((l) => l.code === "REPAS_REPRESENTATION");
  const representation = ligneRepresentation
    ? deductionRepresentation({
        fraisEngages: ligneRepresentation.montantHt,
        chiffreAffairesAnnuel: e.revenus.factureHt,
        province: e.province,
      })
    : null;

  return {
    annee: e.annee,
    revenus: {
      factureHt: R2(e.revenus.factureHt),
      encaisse: R2(e.revenus.encaisse),
      ecart: R2(e.revenus.factureHt - e.revenus.encaisse),
    },
    depensesParCategorie,
    totaux,
    taxes,
    deboursRefactures: R2(e.deboursRefactures),
    representation,
    sansPiece: {
      nombre: sansPieceIds.length,
      montant: R2(sansPieceMontant),
      ids: sansPieceIds,
    },
    incertitudes: releverIncertitudes(
      e,
      depensesParCategorie,
      sansPieceIds.length,
      sansPieceMontant,
      representation,
    ),
  };
}

/**
 * Les zones d'ombre du dossier, nommées.
 *
 * Chaque entrée dit ce qui manque ET ce que ça change. « Taxes estimées » sans
 * montant n'aide personne ; « 340 $ de taxe estimée, non réclamable en l'état »
 * se traite.
 */
function releverIncertitudes(
  e: EntreesDossier,
  lignes: ReadonlyArray<LigneCategorie>,
  sansPieceNombre: number,
  sansPieceMontant: number,
  representation: DeductionRepresentation | null,
): Incertitude[] {
  const out: Incertitude[] = [];

  const estimees = e.depenses.filter((d) => (d.taxOrigin ?? "ESTIMEE") === "ESTIMEE");
  const montantEstime = R2(estimees.reduce((s, d) => s + (d.tps ?? 0) + (d.tvq ?? 0), 0));
  if (estimees.length > 0) {
    out.push({
      code: "TAXES_ESTIMEES",
      nombre: estimees.length,
      montant: montantEstime,
      message:
        "Cette taxe a été calculée à partir du montant payé, pas lue sur un reçu. Elle n'est pas réclamable tant qu'elle n'est pas confirmée.",
    });
  }

  const autres = lignes.find((l) => l.code === "AUTRES");
  if (autres && autres.montantHt > 0) {
    out.push({
      code: "CATEGORIE_AUTRES",
      nombre: autres.nombre,
      montant: autres.montantHt,
      message:
        "Ces dépenses sont classées dans « Autres ». Tant qu'elles y restent, leur déductibilité ne peut pas être établie.",
    });
  }

  const vehicule = lignes.find((l) => l.code === "VEHICULE");
  if (vehicule && (e.prorataVehicule ?? null) === null) {
    out.push({
      code: "PRORATA_VEHICULE_ABSENT",
      nombre: vehicule.nombre,
      montant: vehicule.montantHt,
      message:
        "La part d'usage d'affaires du véhicule n'est pas renseignée. Ces dépenses sont donc exclues du dossier plutôt que déduites au hasard.",
    });
  }

  // Le plafond québécois est désormais CALCULÉ (paliers confirmés le 2026-08-18).
  // L'incertitude qui subsiste est plus étroite, et honnête : SAFE ne sait pas
  // reconnaître les billets de spectacle et abonnements culturels que la loi
  // soustrait à la limite ET au plafond. Un cabinet qui en a déduit trop peu.
  const repas = lignes.find((l) => l.plafondApplicable && l.montantHt > 0);
  if (repas && representation?.plafondApplique) {
    out.push({
      code: "PLAFOND_QC_EXCEPTIONS_CULTURELLES",
      nombre: repas.nombre,
      montant: representation.plafond ?? undefined,
      message:
        "Le plafond québécois a réduit la déduction de vos frais de représentation. Certains billets de spectacle et abonnements culturels tenus au Québec y échappent, et SAFE ne sait pas les distinguer : signalez-les à votre comptable.",
    });
  }

  if (sansPieceNombre > 0) {
    out.push({
      code: "PIECES_MANQUANTES",
      nombre: sansPieceNombre,
      montant: R2(sansPieceMontant),
      message:
        "Ces dépenses n'ont aucune pièce justificative attachée. C'est la seule liste de ce dossier sur laquelle vous pouvez agir dès maintenant.",
    });
  }

  const nonVerrouilles = e.moisNonVerrouilles ?? [];
  if (nonVerrouilles.length > 0) {
    out.push({
      code: "PERIODE_NON_VERROUILLEE",
      nombre: nonVerrouilles.length,
      message: `Les périodes suivantes ne sont pas verrouillées et peuvent encore changer : ${nonVerrouilles.join(", ")}.`,
    });
  }

  return out;
}
