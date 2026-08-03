/**
 * Soldes débiteurs en fidéicommis, et intérêts.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI, `now` injecté.
 *
 * Sources lues intégralement le 2026-07-30 :
 *   RLRQ c. B-1, r. 5, art. 50, 59, 60, 62 (LegisQuébec, à jour au 2026-04-01)
 *   LSO By-Law 9, s. 9(3), 14 (PDF officiel, version du 2017-04-27)
 *
 * Un solde débiteur sur une carte-client n'est pas un problème comptable : c'est
 * l'utilisation des fonds d'un autre client. Les deux régimes le disent autrement,
 * mais avec la même sévérité :
 *
 *   art. 60 QC : « L'avocat doit combler SANS DÉLAI tout solde débiteur en
 *                 fidéicommis dans un dossier, QUELLE QU'EN SOIT LA RAISON. »
 *   s. 14 ON   : « a licensee shall AT ALL TIMES maintain sufficient balances on
 *                 deposit in his or her trust accounts to meet all his or her
 *                 obligations with respect to money held in trust for clients. »
 *
 * ⚠️ AUCUN DES DEUX NE CHIFFRE DE DÉLAI. Ce module mesure donc l'ancienneté d'un
 * découvert et la signale, mais ne déclare jamais un cabinet « en infraction depuis
 * N jours » : ce serait convertir « sans délai » en un seuil que le texte ne pose pas.
 */

import type { CabinetProvince } from "./rules";

/* ════════════════════════════════════════════════════════════════
   DÉTECTION
   ════════════════════════════════════════════════════════════════ */

export interface LedgerBalance {
  clientId: string;
  clientName?: string | null;
  dossierId: string | null;
  dossierRef?: string | null;
  balance: number;
  /** Date de la dernière écriture, qui date le découvert au plus tôt. */
  lastEntryDate?: Date | null;
}

export interface ShortfallLine extends LedgerBalance {
  /** Montant à combler, toujours positif. */
  shortfallAmount: number;
}

const EPSILON = 0.005;

/**
 * Cartes-clients en découvert.
 *
 * Le contrôle porte sur CHAQUE carte-client, jamais sur l'agrégat : un compte à
 * −200 $ compensé par un autre à +200 $ donne un total sain et masque exactement ce
 * que l'art. 60 vise.
 */
export function findShortfalls(balances: LedgerBalance[]): ShortfallLine[] {
  return balances
    .filter((b) => b.balance < -EPSILON)
    .map((b) => ({ ...b, shortfallAmount: Math.round(Math.abs(b.balance) * 100) / 100 }))
    .sort((a, b) => b.shortfallAmount - a.shortfallAmount);
}

/** Total à combler, tous découverts confondus. */
export function totalShortfall(lines: ShortfallLine[]): number {
  return Math.round(lines.reduce((s, l) => s + l.shortfallAmount, 0) * 100) / 100;
}

/* ════════════════════════════════════════════════════════════════
   QUALIFICATION — sans inventer de délai
   ════════════════════════════════════════════════════════════════ */

export interface ShortfallAssessment {
  /** Jours écoulés depuis la détection. Mesure, pas verdict. */
  daysOpen: number | null;
  reference: string;
  messageFr: string;
  /** Ce que le cabinet doit faire, exprimé dans les termes du texte. */
  remedyFr: string;
  /**
   * Le texte fixe-t-il un nombre de jours ? Toujours `false` : ni l'art. 60 ni la
   * s. 14 n'en posent. Ce champ existe pour que personne n'ajoute un seuil sans se
   * demander d'où il viendrait.
   */
  statutoryDeadlineExists: false;
}

/**
 * Qualifie un découvert.
 *
 * L'ancienneté est MESURÉE et affichée, parce qu'un découvert de trois mois n'a pas
 * la même signification qu'un découvert d'une heure. Mais elle n'est jamais convertie
 * en verdict : « sans délai » et « at all times » veulent dire immédiatement, pas
 * « dans les N jours ». Un système qui afficherait « conforme jusqu'au jour 5 »
 * inventerait une tolérance que le règlement ne donne pas.
 */
export function assessShortfall(params: {
  province: CabinetProvince;
  detectedAt: Date;
  now: Date;
  amount: number;
}): ShortfallAssessment {
  const daysOpen = Math.floor((params.now.getTime() - params.detectedAt.getTime()) / 86_400_000);
  const qc = params.province === "QC";

  return {
    daysOpen,
    reference: qc ? "B-1 r.5, art. 59, 60" : "By-Law 9, s. 9(3), 14",
    messageFr: qc
      ? `Solde débiteur de ${params.amount.toFixed(2)} $ : les fonds d'un autre client sont utilisés pour ce dossier.`
      : `Debit balance of $${params.amount.toFixed(2)}: another client's funds are being used for this matter.`,
    remedyFr: qc
      ? "L'art. 60 impose de combler ce solde SANS DÉLAI, quelle qu'en soit la raison. Déposez les fonds manquants depuis le compte d'administration du cabinet."
      : "La s. 14 impose de maintenir en tout temps des soldes suffisants. Déposez les fonds manquants depuis le compte d'administration du cabinet.",
    statutoryDeadlineExists: false,
  };
}

/* ════════════════════════════════════════════════════════════════
   RENFLOUEMENT
   ════════════════════════════════════════════════════════════════ */

export type RemediationSource =
  /** Fonds du cabinet, depuis le compte d'administration. C'est le cas normal. */
  | "CABINET_OPERATING"
  /** Le client verse la somme manquante. */
  | "CLIENT_DEPOSIT"
  /** Erreur d'imputation : l'argent était sur une autre carte-client. */
  | "LEDGER_CORRECTION";

export interface RemediationOption {
  source: RemediationSource;
  labelFr: string;
  reference: string;
  noteFr: string;
}

/**
 * Façons admises de combler un découvert.
 *
 * L'art. 52 limite ce qui peut être déposé au compte général : « l'argent reçu en
 * fidéicommis et celui requis pour couvrir les frais d'administration de ce compte ».
 * Un renflouement par le cabinet n'entre littéralement dans aucune des deux
 * catégories — mais l'art. 60 l'impose. Les deux articles se lisent ensemble :
 * l'obligation de combler prime, et le dépôt de renflouement est légitime.
 *
 * Ce raisonnement est écrit ici plutôt que sous-entendu, parce qu'un inspecteur
 * pourrait poser la question.
 */
export function getRemediationOptions(province: CabinetProvince): RemediationOption[] {
  const qc = province === "QC";
  return [
    {
      source: "CABINET_OPERATING",
      labelFr: "Dépôt du cabinet depuis son compte d'administration",
      reference: qc ? "B-1 r.5, art. 60" : "By-Law 9, s. 14",
      noteFr:
        "Cas normal. L'obligation de combler prime sur la limitation de l'art. 52 : c'est le seul moyen de rétablir le solde immédiatement.",
    },
    {
      source: "CLIENT_DEPOSIT",
      labelFr: "Dépôt du client",
      reference: qc ? "B-1 r.5, art. 60" : "By-Law 9, s. 14",
      noteFr:
        "Recevable, mais ne dispense pas de combler sans délai : si le client tarde, le cabinet avance les fonds.",
    },
    {
      source: "LEDGER_CORRECTION",
      labelFr: "Correction d'imputation entre cartes-clients",
      reference: qc ? "B-1 r.5, art. 56(3)" : "By-Law 9, s. 18(4)",
      noteFr:
        "Quand le découvert vient d'une écriture rattachée au mauvais dossier. Le transfert doit porter son objet.",
    },
  ];
}

/* ════════════════════════════════════════════════════════════════
   VISIBILITÉ APRÈS RÉSOLUTION
   ════════════════════════════════════════════════════════════════ */

/**
 * Un incident résolu reste-t-il visible au rapport mensuel ?
 *
 * Oui, et c'est délibéré. Un découvert survenu le 3 et comblé le 4 n'apparaîtrait
 * nulle part si l'on ne regardait que les soldes de fin de mois. Or c'est exactement
 * ce qu'un inspecteur cherche : non pas l'état à une date, mais **ce qui s'est passé**.
 *
 * Aucun article n'impose de conserver l'incident. Mais l'art. 38 impose un journal
 * chronologique complet, et masquer un découvert résolu reviendrait à présenter une
 * comptabilité plus propre qu'elle ne l'a été.
 */
export const SHORTFALL_REMAINS_VISIBLE_AFTER_RESOLUTION = true;

export interface ShortfallReportLine {
  clientName: string;
  dossierRef: string | null;
  amount: number;
  detectedAt: Date;
  resolvedAt: Date | null;
  daysToResolve: number | null;
  source: RemediationSource | null;
}

/** Met en forme un incident pour le rapport mensuel. */
export function toReportLine(params: {
  clientName: string;
  dossierRef: string | null;
  amount: number;
  detectedAt: Date;
  resolvedAt: Date | null;
  source: RemediationSource | null;
}): ShortfallReportLine {
  return {
    ...params,
    daysToResolve: params.resolvedAt
      ? Math.floor((params.resolvedAt.getTime() - params.detectedAt.getTime()) / 86_400_000)
      : null,
  };
}

/* ════════════════════════════════════════════════════════════════
   INTÉRÊTS — art. 50, 62 QC / s. 57 Law Society Act
   ════════════════════════════════════════════════════════════════ */

export type InterestBeneficiary = "FONDS_ETUDES_JURIDIQUES" | "LAW_FOUNDATION_ONTARIO" | "CLIENT";

export interface InterestRule {
  beneficiary: InterestBeneficiary;
  beneficiaryLabelFr: string;
  reference: string;
  /** Le corpus lu permet-il de modéliser la mécanique de versement ? */
  mechanicsKnown: boolean;
  noteFr: string;
}

/**
 * À qui reviennent les intérêts d'un compte en fidéicommis.
 *
 * **Compte général** : l'art. 50 impose que l'institution ait conclu une entente avec
 * le Barreau au sens du Règlement sur le fonds d'études juridiques (B-1, r. 10). Les
 * intérêts vont donc au Fonds. En Ontario, ils vont à la Law Foundation of Ontario en
 * vertu de la s. 57 de la Law Society Act.
 *
 * **Compte particulier** : au client. C'est sa raison d'être — l'art. 62 impose d'en
 * ouvrir un « lorsque le client exige que les revenus de son dépôt en fidéicommis lui
 * soient remis ».
 *
 * ⚠️ INCERTITUDE DÉCLARÉE. **Ni B-1 r.10 ni la s. 57 de la Law Society Act n'ont été
 * lus.** Le bénéficiaire est certain — il découle des articles lus — mais la
 * MÉCANIQUE ne l'est pas : taux, fréquence de versement, qui calcule, qui verse, quel
 * formulaire. Ce module ne modélise donc que le SUIVI d'un versement (période,
 * montant, preuve), et jamais son calcul. Inventer un taux ou une échéance serait
 * fabriquer une règle.
 */
export function getInterestRule(params: {
  province: CabinetProvince;
  accountType: "GENERAL" | "PARTICULIER";
}): InterestRule {
  if (params.accountType === "PARTICULIER") {
    return {
      beneficiary: "CLIENT",
      beneficiaryLabelFr: "Le client",
      reference: "B-1 r.5, art. 62",
      mechanicsKnown: true,
      noteFr:
        "Le compte particulier existe précisément pour que les revenus du dépôt reviennent au client.",
    };
  }

  if (params.province === "QC") {
    return {
      beneficiary: "FONDS_ETUDES_JURIDIQUES",
      beneficiaryLabelFr: "Fonds d'études juridiques du Barreau du Québec",
      reference: "B-1 r.5, art. 50 (renvoyant à B-1, r. 10)",
      mechanicsKnown: false,
      noteFr:
        "Le bénéficiaire est certain. La mécanique de versement — taux, fréquence, formulaire — relève du Règlement sur le fonds d'études juridiques (B-1, r. 10), qui n'a pas été lu. SAFE assure le SUIVI du versement, pas son calcul.",
    };
  }

  return {
    beneficiary: "LAW_FOUNDATION_ONTARIO",
    beneficiaryLabelFr: "Law Foundation of Ontario",
    reference: "Law Society Act, s. 57",
    mechanicsKnown: false,
    noteFr:
      "Le bénéficiaire est certain. La mécanique relève de la s. 57 de la Law Society Act, qui n'a pas été lue. SAFE assure le SUIVI du versement, pas son calcul.",
  };
}

export interface InterestRemittanceStatus {
  periode: string;
  beneficiary: InterestBeneficiary;
  amount: number;
  remittedAt: Date | null;
  hasProof: boolean;
  /** Le versement est-il consigné comme fait ? */
  complete: boolean;
  /** Ce qui manque, nommé. « Incomplet » sans dire quoi ne fait pas agir. */
  missingFr: string[];
  reference: string;
}

/**
 * État d'un versement d'intérêts.
 *
 * `complete` exige la date ET la preuve. Une date sans pièce n'est qu'une
 * affirmation, et c'est la pièce que l'inspecteur demande — l'art. 32 impose de
 * conserver « toutes les pièces justificatives ou de contrôle ».
 */
export function assessInterestRemittance(params: {
  periode: string;
  beneficiary: InterestBeneficiary;
  amount: number;
  remittedAt: Date | null;
  hasProof: boolean;
  province: CabinetProvince;
}): InterestRemittanceStatus {
  return {
    periode: params.periode,
    beneficiary: params.beneficiary,
    amount: params.amount,
    remittedAt: params.remittedAt,
    hasProof: params.hasProof,
    complete: Boolean(params.remittedAt) && params.hasProof,
    missingFr: [
      ...(params.remittedAt ? [] : ["la date du versement"]),
      ...(params.hasProof ? [] : ["la pièce justificative du versement"]),
    ],
    // Deux articles, deux objets : l'un désigne le bénéficiaire, l'autre impose de
    // conserver la pièce. Les fondre en « art. 50, 32 » les rendrait illisibles.
    reference:
      params.province === "QC"
        ? "B-1 r.5, art. 50 (bénéficiaire) et art. 32 (conservation de la pièce)"
        : "Law Society Act, s. 57 (bénéficiaire) — By-Law 9, s. 18(10) (conservation)",
  };
}
