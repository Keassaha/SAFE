/**
 * SAFE — Décomposition de la taxe payée sur une dépense du cabinet.
 *
 * Spec      : docs/accounting/SPEC_DEPENSES_ET_PREPARATION_FISCALE.md §2.1, lot 1
 * Régimes   : lib/expense-journal/tax-regime.ts (lot 0 bis)
 *
 * LE DÉFAUT QUE CE MODULE FERME
 *
 * `CabinetExpense` porte `montantHt`, `tps`, `tvq` depuis le début. Trois chemins
 * créent des dépenses et un seul les remplissait : l'import de reçu par IA, qui est
 * le chemin de plus faible volume. L'import bancaire, qui fait le gros du volume,
 * écrivait `montant: rawAmount, montantTtc: rawAmount` et s'arrêtait là.
 *
 * Conséquence : un cabinet remet la taxe collectée sans déduire la taxe payée sur ses
 * achats. Il remet trop, tous les trimestres, sans jamais le voir.
 *
 * TROIS ORIGINES, PAS DEUX
 *
 * La spec parle de « déclarée » et « estimée ». Il en faut une troisième, sinon une
 * dépense sans taxe est indiscernable d'une dépense dont on n'a pas su lire la taxe :
 *
 *   DECLAREE  la pièce le dit. C'est la vérité, on la garde telle quelle.
 *   ESTIMEE   décomposée d'un TTC. Sert à la justesse des états, JAMAIS à la
 *             déclaration : le montant de taxe est exigé sur la pièce dès le premier
 *             dollar pour la TVQ (spec §2.2 c).
 *   AUCUNE    la catégorie ne porte structurellement pas de taxe. Ce n'est pas un
 *             échec de lecture, c'est un fait, et il se dit à l'écran.
 */

import type { AppliedTaxes, CabinetTaxConfig } from "@/lib/billing/types";
import { splitInclusiveTaxes, toInvoiceTaxColumns } from "@/lib/billing/taxes";
import { regimeFor, peutEstimerTaxe, peutSaisirTaxe } from "./tax-regime";
import { tauxTaxeReclamable } from "./deductibilite";

export type TaxOrigin = "DECLAREE" | "ESTIMEE" | "AUCUNE";

export interface ExpenseTaxBreakdown {
  montantHt: number;
  /** Colonne `tps` : porte la TPS, ou la TVH en régime harmonisé. */
  tps: number;
  /** Colonne `tvq` : porte TVQ, PST ou RST. Invariant : tps + tvq === taxe totale. */
  tvq: number;
  montantTtc: number;
  origine: TaxOrigin;
  /**
   * Réclamable sur une déclaration de taxes. Seule une taxe DECLAREE l'est.
   * Une taxe estimée sert à la justesse des états et à la prévision, jamais à la
   * demande de remboursement : sans le montant lu sur la pièce, elle n'est pas
   * justifiable en vérification.
   */
  reclamable: boolean;
  /** Phrase montrable au cabinet quand rien n'a été décomposé. Jamais un code. */
  motif?: string;
}

/** Ce que la pièce ou la saisie affirme, quand elle affirme quelque chose. */
export interface DeclaredTax {
  montantHt?: number | null;
  tps?: number | null;
  tvq?: number | null;
}

const R2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Une déclaration ne compte que si elle porte une taxe réelle. */
function aUneTaxeDeclaree(d: DeclaredTax | null | undefined): boolean {
  if (!d) return false;
  return (d.tps ?? 0) > 0 || (d.tvq ?? 0) > 0;
}

/**
 * Décompose la taxe payée d'une dépense.
 *
 * L'ordre des règles n'est pas indifférent : le régime de la catégorie est consulté
 * AVANT la déclaration, parce qu'une catégorie sans taxe dure doit refuser même une
 * saisie. C'est le piège de l'assurance : la taxe sur les primes existe et n'est pas
 * récupérable ; l'accepter la ferait entrer dans les récupérables.
 */
export function decomposeExpenseTax(input: {
  montantTtc: number;
  categoryCode?: string | null;
  taxConfig: CabinetTaxConfig;
  declared?: DeclaredTax | null;
  /**
   * Le cabinet affirme, pièce en main, que cette dépense ne porte aucune taxe.
   *
   * Nécessaire parce qu'un zéro saisi est indiscernable d'un champ laissé vide :
   * sans ce signal, répondre « aucune taxe » relancerait l'estimation, et la ligne
   * reviendrait indéfiniment dans la liste à confirmer. Une affirmation vaut lecture
   * de pièce, donc `AUCUNE` et non `ESTIMEE`.
   */
  declaredSansTaxe?: boolean;
}): ExpenseTaxBreakdown {
  const { montantTtc, categoryCode, taxConfig, declared, declaredSansTaxe } = input;
  const ttc = R2(montantTtc);
  const regle = regimeFor(categoryCode);

  const sansTaxe = (motif: string): ExpenseTaxBreakdown => ({
    montantHt: ttc,
    tps: 0,
    tvq: 0,
    montantTtc: ttc,
    origine: "AUCUNE",
    reclamable: false,
    motif,
  });

  // Montant nul ou négatif : rien à décomposer, et surtout pas de division.
  if (ttc <= 0) return sansTaxe("Aucun montant à décomposer.");

  // 1. La catégorie refuse-t-elle toute taxe, même saisie ?
  if (!peutSaisirTaxe(categoryCode)) return sansTaxe(regle.motif);

  // 2. Le cabinet affirme-t-il qu'il n'y a rien ? On le croit, et on ne réestime
  //    plus : sinon la ligne reviendrait dans la liste à chaque passage.
  if (declaredSansTaxe) {
    return sansTaxe("Vous avez confirmé que cette dépense ne porte aucune taxe.");
  }

  // 3. La pièce parle-t-elle ? C'est la vérité, on ne recalcule pas.
  if (aUneTaxeDeclaree(declared)) {
    const tps = R2(declared!.tps ?? 0);
    const tvq = R2(declared!.tvq ?? 0);
    // Le HT déclaré prime ; à défaut on le déduit, pour que HT + taxes === TTC
    // au centime près quoi qu'il arrive en aval.
    const ht = declared!.montantHt != null ? R2(declared!.montantHt) : R2(ttc - tps - tvq);
    return {
      montantHt: ht,
      tps,
      tvq,
      montantTtc: ttc,
      origine: "DECLAREE",
      reclamable: true,
    };
  }

  // 4. La catégorie autorise-t-elle une ESTIMATION ? Les frais bancaires et les
  //    droits de greffe passent l'étape 1 mais échouent ici : on ne fabrique pas de
  //    taxe sur une fourniture exonérée, on attend que la pièce la porte.
  if (!peutEstimerTaxe(categoryCode)) return sansTaxe(regle.motif);

  // 5. Régime général : décomposition du TTC selon le régime du cabinet.
  const applied: AppliedTaxes = splitInclusiveTaxes(ttc, taxConfig);
  const cols = toInvoiceTaxColumns(applied, taxConfig.mode);

  if (applied.taxesTotal <= 0) {
    return sansTaxe("Le régime de taxes du cabinet ne prévoit aucune taxe applicable.");
  }

  // Le HT se DÉDUIT du total, il ne se reprend pas de `applied.base`.
  //
  // `splitInclusiveTaxes` arrondit la base, puis recalcule les taxes SUR la base
  // arrondie : les deux arrondis ne se réconcilient pas toujours. Relevé sur
  // 229,95 $ en régime TVH 13 % : base 203,50 + taxe 26,46 = 229,96, un cent qui
  // n'existe pas. Le journal général inscrit `montant`, donc ce cent aurait fait
  // diverger la dépense de son écriture, et l'écart se serait accumulé ligne après
  // ligne jusqu'au dossier de fin d'année.
  //
  // Le montant payé est la seule certitude ici : c'est lui qui arbitre. Le résidu
  // va dans le HT et non dans la taxe, pour ne jamais réclamer un cent de plus que
  // ce que le taux donne.
  return {
    montantHt: R2(ttc - cols.tps - cols.tvq),
    tps: cols.tps,
    tvq: cols.tvq,
    montantTtc: ttc,
    origine: "ESTIMEE",
    reclamable: false,
  };
}

/**
 * Taxe réellement réclamable d'un lot de dépenses.
 *
 * Sert au calcul du net à remettre. Additionner sans filtrer gonflerait la demande
 * de remboursement avec des montants estimés, qui ne sont pas justifiables en
 * vérification.
 */
export function taxeReclamable(
  lignes: ReadonlyArray<{
    tps: number;
    tvq: number;
    origine: TaxOrigin;
    /** Code de catégorie : décide du taux de crédit applicable (lot 2). */
    categoryCode?: string | null;
  }>,
  /** Part d'usage d'affaires déclarée par le cabinet, pour les catégories au prorata. */
  prorataUsage?: number | null,
): { reclamable: number; estimee: number; indetermine: number } {
  let reclamable = 0;
  let estimee = 0;
  let indetermine = 0;

  for (const l of lignes) {
    const paye = (l.tps ?? 0) + (l.tvq ?? 0);
    if (paye === 0) continue;

    // Le taux de crédit vient de la CATÉGORIE, pas de la ligne. Sur un repas, la
    // taxe payée n'est réclamable qu'à moitié : additionner brut réclamerait le
    // double de ce que la loi permet.
    const taux = tauxTaxeReclamable(l.categoryCode, prorataUsage);

    // Taux inconnu (prorata véhicule non renseigné) : ni réclamé, ni ignoré. Mis à
    // part, pour que le dossier de fin d'année le montre comme zone d'incertitude
    // au lieu de le faire disparaître.
    if (taux === null) {
      indetermine += paye;
      continue;
    }

    if (l.origine === "DECLAREE") reclamable += paye * taux;
    else if (l.origine === "ESTIMEE") estimee += paye * taux;
  }

  return { reclamable: R2(reclamable), estimee: R2(estimee), indetermine: R2(indetermine) };
}
