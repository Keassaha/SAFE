/**
 * « Reprendre un client » : la facture telle qu'Aaliyah la saisit.
 *
 * Module PUR, testé sans base. Il fait trois choses :
 *
 *   1. calculer ce qui se calcule (montant d'une ligne horaire, sous-total,
 *      taxes par défaut selon le régime du cabinet) ;
 *   2. dire ce qui empêche d'enregistrer, et ce qui mérite un coup d'œil, sous
 *      forme de CODES que l'écran traduit (l'écran est bilingue, ces règles ne
 *      le sont pas) ;
 *   3. traduire la saisie vers la forme qu'attend le moteur de reprise
 *      (`PastInvoiceExtraction`), qui écrit la facture, les heures, les débours,
 *      le paiement et la comptabilité. Aucun code d'écriture n'est dupliqué ici.
 *
 * Spec : docs/product/SPEC_REPRISE_UN_CLIENT_A_LA_FOIS.md
 */

import type { PastInvoiceExtraction, PastInvoiceLigneExtraction } from "@/lib/ai/extract-past-invoice";
import type { TaxMode, TaxRates } from "@/lib/billing/types";

/* ════════════════════════════════════════════════════════════════
   LES TYPES DE LA SAISIE
   ════════════════════════════════════════════════════════════════ */

/**
 * Trois natures, décision CEO du 2026-09-30.
 *
 * Forfait et débours ont tous deux un montant fixe, mais ne vont pas au même
 * endroit : le forfait est un revenu du cabinet, le débours un remboursement de
 * frais avancés, qui rejoint la fiche de débours du mandat.
 */
export type NatureSaisie = "horaire" | "forfait" | "debours";

export interface LigneSaisie {
  id: string;
  date: string; // AAAA-MM-JJ, ou vide
  description: string;
  nature: NatureSaisie;
  /** Saisies en texte : l'utilisateur tape « 1,75 ». Converties ici, jamais à l'écran. */
  heures: string;
  taux: string;
  /** Ignoré pour une ligne horaire : son montant se calcule. */
  montant: string;
}

export type StatutPaiementSaisie = "payee" | "partielle" | "impayee";

export type ModePaiementSaisie =
  | "cheque"
  | "virement"
  | "interac"
  | "comptant"
  | "carte"
  | "fideicommis"
  | "autre";

export const MODES_PAIEMENT: ModePaiementSaisie[] = [
  "cheque",
  "virement",
  "interac",
  "comptant",
  "carte",
  "fideicommis",
  "autre",
];

export interface FactureSaisie {
  numero: string;
  dateEmission: string;
  lignes: LigneSaisie[];
  /**
   * Une valeur par champ de taxe du régime (voir `champsDeTaxe`), dans l'ordre.
   * Vide = « prendre le montant calculé ».
   */
  taxes: string[];
  /** Vide = « prendre le total calculé ». Rempli = c'est le papier qui parle. */
  total: string;
  statutPaiement: StatutPaiementSaisie | null;
  datePaiement: string;
  montantRecu: string;
  modePaiement: ModePaiementSaisie | null;
}

/* ════════════════════════════════════════════════════════════════
   NOMBRES
   ════════════════════════════════════════════════════════════════ */

export function auSou(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * « 1 150,00 », « 1150.5 », « 1 150,00 $ » : tout ce qu'une adjointe peut taper.
 * `null` pour un champ vide ou illisible, jamais zéro : un zéro inventé
 * passerait pour une valeur saisie.
 */
export function lireNombre(saisi: string | null | undefined): number | null {
  if (saisi === null || saisi === undefined) return null;
  const nettoye = String(saisi)
    .replace(/[\s  $]/g, "")
    .replace(",", ".");
  if (nettoye === "" || nettoye === "-" || nettoye === ".") return null;
  const n = Number(nettoye);
  return Number.isFinite(n) ? n : null;
}

/* ════════════════════════════════════════════════════════════════
   LES TAXES, SELON LE RÉGIME DU CABINET
   ════════════════════════════════════════════════════════════════ */

export type CleTaxe = "tps" | "tvq" | "tvh" | "tvp" | "tvd";

export interface ChampTaxe {
  cle: CleTaxe;
  /** Taux en pourcentage (5, 9.975, 13). */
  taux: number;
}

/**
 * Les champs de taxe à afficher, dans l'ordre où la facture les imprime.
 *
 * L'ordre compte : le premier va dans la colonne `tps` de la facture, le second
 * dans `tvq`. C'est l'invariant de `lib/billing/taxes.ts` (« Option A, sans
 * migration ») : en Ontario, la TVH vit dans `tps` et `tvq` vaut zéro. Le
 * présentateur de facture ré-étiquette ensuite « TVH » selon le mode du cabinet.
 */
export function champsDeTaxe(mode: TaxMode, taux: TaxRates): ChampTaxe[] {
  switch (mode) {
    case "hst":
      return [{ cle: "tvh", taux: taux.hst ?? 13 }];
    case "tps_tvq":
      return [
        { cle: "tps", taux: taux.tps ?? 5 },
        { cle: "tvq", taux: taux.tvq ?? 9.975 },
      ];
    case "tps_only":
      return [{ cle: "tps", taux: taux.tps ?? 5 }];
    case "tps_pst":
      return [
        { cle: "tps", taux: taux.tps ?? 5 },
        { cle: "tvp", taux: taux.pst ?? 7 },
      ];
    case "tps_rst":
      return [
        { cle: "tps", taux: taux.tps ?? 5 },
        { cle: "tvd", taux: taux.rst ?? 7 },
      ];
    case "none":
    default:
      return [];
  }
}

/* ════════════════════════════════════════════════════════════════
   CE QUI SE CALCULE
   ════════════════════════════════════════════════════════════════ */

/** Montant d'une ligne. Horaire : heures × taux. Autres : le montant saisi. */
export function montantLigne(ligne: LigneSaisie): number | null {
  if (ligne.nature === "horaire") {
    const h = lireNombre(ligne.heures);
    const t = lireNombre(ligne.taux);
    if (h === null || t === null) return null;
    return auSou(h * t);
  }
  return lireNombre(ligne.montant);
}

export interface Calculs {
  sousTotal: number;
  /** Une valeur par champ de taxe : saisie si l'utilisateur l'a tapée, sinon calculée. */
  taxes: number[];
  taxesCalculees: number[];
  totalCalcule: number;
  /** Le total retenu : celui du papier s'il est saisi, sinon le calculé. */
  total: number | null;
  /** Le total a-t-il été tapé par-dessus le calcul ? */
  totalSaisi: boolean;
  heures: number;
}

export function calculer(facture: FactureSaisie, champs: ChampTaxe[]): Calculs {
  let sousTotal = 0;
  let heures = 0;
  for (const ligne of facture.lignes) {
    sousTotal += montantLigne(ligne) ?? 0;
    if (ligne.nature === "horaire") heures += lireNombre(ligne.heures) ?? 0;
  }
  sousTotal = auSou(sousTotal);

  const taxesCalculees = champs.map((c) => auSou((sousTotal * c.taux) / 100));
  const taxes = champs.map((_, i) => lireNombre(facture.taxes[i]) ?? taxesCalculees[i]);
  const totalCalcule = auSou(sousTotal + taxes.reduce((s, t) => s + t, 0));

  const totalTape = lireNombre(facture.total);
  // Une facture dont aucune ligne ne porte encore rien n'a pas de total : dire
  // « indiquez le total » plutôt que « le total doit dépasser zéro ».
  const total = totalTape ?? (lignesUtiles(facture).length > 0 ? totalCalcule : null);

  return {
    sousTotal,
    taxes,
    taxesCalculees,
    totalCalcule,
    total,
    totalSaisi: totalTape !== null,
    heures: auSou(heures),
  };
}

/** Reste dû après le paiement déclaré. */
export function resteDu(facture: FactureSaisie, total: number | null): number | null {
  if (total === null) return null;
  if (facture.statutPaiement === "payee") return 0;
  if (facture.statutPaiement === "impayee") return total;
  if (facture.statutPaiement === "partielle") {
    const recu = lireNombre(facture.montantRecu);
    return recu === null ? null : auSou(Math.max(0, total - recu));
  }
  return null;
}

/* ════════════════════════════════════════════════════════════════
   CONTRÔLES — des codes, que l'écran traduit
   ════════════════════════════════════════════════════════════════ */

export type CodeBloquant =
  | "DATE_MANQUANTE"
  | "DATE_FUTURE"
  | "DATE_INVRAISEMBLABLE"
  | "TOTAL_MANQUANT"
  | "TOTAL_NUL"
  | "STATUT_MANQUANT"
  | "DATE_PAIEMENT_MANQUANTE"
  | "PAIEMENT_AVANT_EMISSION"
  | "PAIEMENT_FUTUR"
  | "MODE_MANQUANT"
  | "MONTANT_RECU_MANQUANT"
  | "MONTANT_RECU_ATTEINT_TOTAL"
  | "LIGNE_HORAIRE_INCOMPLETE"
  | "LIGNE_SANS_MONTANT";

export type CodeAvertissement =
  | "ECART_DETAIL"
  | "AUCUNE_LIGNE"
  | "NUMERO_MANQUANT"
  | "FIDEICOMMIS";

export interface Signal<C extends string> {
  code: C;
  /** Valeurs à glisser dans la phrase traduite (numéro de ligne, écart...). */
  valeurs?: Record<string, string | number>;
}

export interface ControleSaisie {
  bloquants: Signal<CodeBloquant>[];
  avertissements: Signal<CodeAvertissement>[];
}

/** Même plancher que la reprise en lot : avant, c'est une année mal lue. */
const ANNEE_PLANCHER = 1990;

function aujourdhuiIso(aujourdhui: Date): string {
  return aujourdhui.toISOString().slice(0, 10);
}

export function controler(
  facture: FactureSaisie,
  champs: ChampTaxe[],
  contexte: { aujourdhui?: Date } = {},
): ControleSaisie {
  const bloquants: Signal<CodeBloquant>[] = [];
  const avertissements: Signal<CodeAvertissement>[] = [];
  const jour = aujourdhuiIso(contexte.aujourdhui ?? new Date());
  const c = calculer(facture, champs);

  /* ── La facture ─────────────────────────────────────────────────────── */
  if (!facture.dateEmission) {
    bloquants.push({ code: "DATE_MANQUANTE" });
  } else if (facture.dateEmission > jour) {
    bloquants.push({ code: "DATE_FUTURE" });
  } else if (Number(facture.dateEmission.slice(0, 4)) < ANNEE_PLANCHER) {
    bloquants.push({ code: "DATE_INVRAISEMBLABLE" });
  }
  if (!facture.numero.trim()) avertissements.push({ code: "NUMERO_MANQUANT" });

  /* ── Les lignes ─────────────────────────────────────────────────────── */
  facture.lignes.forEach((ligne, i) => {
    const vide = !ligne.description.trim() && !ligne.heures && !ligne.taux && !ligne.montant;
    if (vide) return; // une ligne ajoutée puis laissée vide ne bloque pas : elle est ignorée
    if (ligne.nature === "horaire") {
      if (lireNombre(ligne.heures) === null || lireNombre(ligne.taux) === null) {
        bloquants.push({ code: "LIGNE_HORAIRE_INCOMPLETE", valeurs: { ligne: i + 1 } });
      }
    } else if (lireNombre(ligne.montant) === null) {
      bloquants.push({ code: "LIGNE_SANS_MONTANT", valeurs: { ligne: i + 1 } });
    }
  });
  if (lignesUtiles(facture).length === 0) avertissements.push({ code: "AUCUNE_LIGNE" });

  /* ── Le total ───────────────────────────────────────────────────────── */
  if (c.total === null) {
    bloquants.push({ code: "TOTAL_MANQUANT" });
  } else if (c.total <= 0) {
    bloquants.push({ code: "TOTAL_NUL" });
  } else if (c.totalSaisi && lignesUtiles(facture).length > 0) {
    // Le papier fait foi, mais un écart de plus d'un sou mérite qu'on relise :
    // c'est souvent un chiffre mal recopié.
    const ecart = auSou(c.total - c.totalCalcule);
    if (Math.abs(ecart) > 0.01) {
      avertissements.push({ code: "ECART_DETAIL", valeurs: { ecart: Math.abs(ecart) } });
    }
  }

  /* ── Le paiement ────────────────────────────────────────────────────── */
  const statut = facture.statutPaiement;
  if (!statut) {
    bloquants.push({ code: "STATUT_MANQUANT" });
  } else if (statut !== "impayee") {
    if (!facture.datePaiement) {
      bloquants.push({ code: "DATE_PAIEMENT_MANQUANTE" });
    } else if (facture.dateEmission && facture.datePaiement < facture.dateEmission) {
      bloquants.push({ code: "PAIEMENT_AVANT_EMISSION" });
    } else if (facture.datePaiement > jour) {
      bloquants.push({ code: "PAIEMENT_FUTUR" });
    }
    if (!facture.modePaiement) bloquants.push({ code: "MODE_MANQUANT" });
    if (facture.modePaiement === "fideicommis") avertissements.push({ code: "FIDEICOMMIS" });

    if (statut === "partielle") {
      const recu = lireNombre(facture.montantRecu);
      if (recu === null || recu <= 0) {
        bloquants.push({ code: "MONTANT_RECU_MANQUANT" });
      } else if (c.total !== null && recu >= c.total) {
        bloquants.push({ code: "MONTANT_RECU_ATTEINT_TOTAL" });
      }
    }
  }

  return { bloquants, avertissements };
}

export function enregistrable(controle: ControleSaisie): boolean {
  return controle.bloquants.length === 0;
}

/** Les lignes qui portent quelque chose. Une ligne vierge est ignorée partout. */
function lignesUtiles(facture: FactureSaisie): LigneSaisie[] {
  return facture.lignes.filter(
    (l) => l.description.trim() || l.heures || l.taux || l.montant,
  );
}

/* ════════════════════════════════════════════════════════════════
   VERS LE MOTEUR DE REPRISE
   ════════════════════════════════════════════════════════════════ */

/**
 * Traduit la saisie vers `PastInvoiceExtraction`, la forme qu'écrit
 * `verserFactureReprise`. On ne réécrit pas le moteur : on lui parle sa langue.
 *
 * - horaire → honoraire avec heures et taux (devient une entrée de temps facturée) ;
 * - forfait → honoraire SANS heures (devient une tâche au registre) ;
 * - débours → débours (rejoint la fiche de débours du mandat).
 *
 * Les taxes suivent l'invariant des colonnes de facture : premier champ dans
 * `tps`, second dans `tvq`. En Ontario, la TVH va donc dans `tps`.
 */
export function versExtraction(
  facture: FactureSaisie,
  champs: ChampTaxe[],
  identite: { clientNom: string; dossierIntitule: string },
): PastInvoiceExtraction {
  const c = calculer(facture, champs);
  const lignes: PastInvoiceLigneExtraction[] = lignesUtiles(facture).map((l) => {
    const montant = montantLigne(l);
    if (l.nature === "horaire") {
      return {
        description: l.description.trim() || "Honoraires",
        date: l.date || null,
        montant,
        heures: lireNombre(l.heures),
        tauxHoraire: lireNombre(l.taux),
        nature: "honoraire",
      };
    }
    return {
      description: l.description.trim() || (l.nature === "debours" ? "Débours" : "Honoraires au forfait"),
      date: l.date || null,
      montant,
      heures: null,
      tauxHoraire: null,
      nature: l.nature === "debours" ? "debours" : "honoraire",
    };
  });

  return {
    numeroFacture: facture.numero.trim() || null,
    clientNom: identite.clientNom,
    dossierIntitule: identite.dossierIntitule,
    dateEmission: facture.dateEmission || null,
    montantTotal: c.total,
    tps: champs.length > 0 ? c.taxes[0] : 0,
    tvq: champs.length > 1 ? c.taxes[1] : 0,
    lignes,
    // Rien n'a été « lu » : chaque chiffre a été vu et confirmé par une personne.
    confianceOcr: "haute",
    champsIllisibles: [],
  };
}

/* ════════════════════════════════════════════════════════════════
   DEPUIS UNE LECTURE DE PDF
   ════════════════════════════════════════════════════════════════ */

/** Toujours deux décimales : « 97,50 », pas « 97,5 ». C'est ainsi que la facture l'imprime. */
function nombreEnTexte(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return auSou(n).toFixed(2).replace(".", ",");
}

/**
 * Pré-remplit le formulaire depuis ce que SAFE a lu sur un PDF.
 *
 * La nature se déduit prudemment : un débours lu reste un débours ; un
 * honoraire qui porte des heures est horaire ; un honoraire sans heures est un
 * forfait. Aaliyah vérifie chaque ligne avant d'enregistrer.
 *
 * Les taxes lues sont replacées selon le RÉGIME DU CABINET, pas selon la case
 * où la lecture les a rangées : une TVH ontarienne lue comme « TVQ » revient
 * dans le champ TVH.
 */
export function depuisExtraction(
  extraction: PastInvoiceExtraction,
  champs: ChampTaxe[],
  tauxMandat: number | null,
  nouvelId: () => string,
): FactureSaisie {
  const lignes: LigneSaisie[] = extraction.lignes.map((l) => {
    const nature: NatureSaisie =
      l.nature === "debours" ? "debours" : l.heures ? "horaire" : "forfait";
    const taux = l.tauxHoraire ?? (nature === "horaire" ? tauxMandat : null);
    return {
      id: nouvelId(),
      date: l.date ?? "",
      description: l.description ?? "",
      nature,
      heures: nature === "horaire" ? nombreEnTexte(l.heures) : "",
      taux: nature === "horaire" ? nombreEnTexte(taux) : "",
      montant: nature === "horaire" ? "" : nombreEnTexte(l.montant),
    };
  });

  const tpsLue = extraction.tps ?? null;
  const tvqLue = extraction.tvq ?? null;
  let taxes: string[];
  if (champs.length === 1) {
    const somme = tpsLue === null && tvqLue === null ? null : (tpsLue ?? 0) + (tvqLue ?? 0);
    taxes = [nombreEnTexte(somme)];
  } else {
    taxes = champs.map((_, i) => nombreEnTexte(i === 0 ? tpsLue : i === 1 ? tvqLue : null));
  }

  return {
    numero: extraction.numeroFacture ?? "",
    dateEmission: extraction.dateEmission ?? "",
    lignes,
    taxes,
    total: nombreEnTexte(extraction.montantTotal),
    statutPaiement: null,
    datePaiement: "",
    montantRecu: "",
    modePaiement: null,
  };
}

/* ════════════════════════════════════════════════════════════════
   LE MODE DE PAIEMENT, VERS LES COLONNES DE `Payment`
   ════════════════════════════════════════════════════════════════ */

export interface ColonnesPaiement {
  method: "carte" | "virement" | "cheque" | "trust" | "autre";
  paymentMethod: "cash" | "cheque" | "e_transfer" | "card" | "bank_transfer" | "trust" | "other";
  sourceAccountType: "operating" | "trust";
}

/**
 * Une facture réglée à même le fidéicommis porte ce fait sur le paiement
 * (`sourceAccountType: trust`), mais la reprise n'invente AUCUN mouvement au
 * registre de fidéicommis : un mouvement reconstitué après coup doit
 * correspondre au relevé de banque réel. Le solde restant se déclare à
 * l'étape du mandat, « Argent détenu ».
 */
export function colonnesPaiement(mode: ModePaiementSaisie | null | undefined): ColonnesPaiement {
  switch (mode) {
    case "cheque":
      return { method: "cheque", paymentMethod: "cheque", sourceAccountType: "operating" };
    case "virement":
      return { method: "virement", paymentMethod: "bank_transfer", sourceAccountType: "operating" };
    case "interac":
      return { method: "virement", paymentMethod: "e_transfer", sourceAccountType: "operating" };
    case "comptant":
      return { method: "autre", paymentMethod: "cash", sourceAccountType: "operating" };
    case "carte":
      return { method: "carte", paymentMethod: "card", sourceAccountType: "operating" };
    case "fideicommis":
      return { method: "trust", paymentMethod: "trust", sourceAccountType: "trust" };
    case "autre":
    default:
      return { method: "autre", paymentMethod: "other", sourceAccountType: "operating" };
  }
}

export function estModePaiement(v: unknown): v is ModePaiementSaisie {
  return typeof v === "string" && (MODES_PAIEMENT as string[]).includes(v);
}
