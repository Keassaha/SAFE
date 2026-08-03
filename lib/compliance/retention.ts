/**
 * Durées de conservation des livres, registres et pièces.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI, `now` injecté.
 *
 * Sources lues intégralement le 2026-07-30 :
 *   RLRQ c. B-1, r. 5, art. 30, 31, 32, 33 (LegisQuébec, à jour au 2026-04-01)
 *   LSO By-Law 9, s. 23(1), 23(2), 23(3) (PDF officiel, version du 2017-04-27)
 *
 * DEUX RÉGIMES QUI NE SE RESSEMBLENT PAS.
 *
 * Au Québec, la durée est la même — sept ans — mais **le point de départ change selon
 * la pièce** :
 *   art. 31 : les livres et registres, sept ans **à compter de la fermeture du dossier** ;
 *   art. 32 : les rapports mensuels, les copies de chèques reçus en fidéicommis et
 *             toutes les pièces justificatives, sept ans **après la fin de l'exercice**.
 *
 * En Ontario, le point de départ est unique — la fin du dernier exercice — mais
 * **la durée change selon le paragraphe** :
 *   s. 23(1) : six ans ;
 *   s. 23(2) : **dix ans** pour les par. 18(1)(2)(3)(8)(9)(10)(11) ;
 *   s. 23(3) : dix ans pour les dossiers d'identification de la s. 20.
 *
 * Aplatir l'un ou l'autre régime détruirait des pièces encore exigibles. Une purge à
 * six ans en Ontario effacerait le journal du fidéicommis, qui en vaut dix. Une purge
 * ancrée sur l'exercice au Québec effacerait les registres d'un dossier fermé l'an
 * dernier, dont les sept ans commencent à peine.
 */

import type { CabinetProvince } from "./rules";

/* ════════════════════════════════════════════════════════════════
   LES CATÉGORIES DE PIÈCES
   ════════════════════════════════════════════════════════════════ */

export type RetainedRecordKind =
  // ── Livres et registres ───────────────────────────────────────
  | "TRUST_CASH_JOURNAL"
  | "ADMIN_CASH_JOURNAL"
  | "CLIENT_LEDGERS"
  | "PARTICULAR_ACCOUNT_LEDGERS"
  | "CHEQUE_REGISTER"
  | "TRUST_PROPERTY_REGISTER"
  | "FEES_BOOK"
  | "MATTER_LISTS"
  // ── Rapports ──────────────────────────────────────────────────
  | "MONTHLY_REPORT"
  | "ANNUAL_REPORT"
  // ── Pièces ────────────────────────────────────────────────────
  | "SUPPORTING_DOCUMENT"
  | "TRUST_CHEQUE_COPY"
  | "BANK_STATEMENT"
  | "ELECTRONIC_TRANSFER_CONFIRMATION"
  | "CASH_RECEIPT"
  // ── Identification du client ──────────────────────────────────
  | "CLIENT_IDENTIFICATION";

/**
 * Ce à quoi la durée est accrochée.
 *
 * `FILE_CLOSURE` : la pièce appartient à un dossier, et le compte à rebours ne
 * démarre qu'à sa fermeture. Un dossier ouvert n'est donc **jamais** purgeable, quel
 * que soit l'âge des écritures.
 */
export type RetentionAnchor = "FILE_CLOSURE" | "FISCAL_YEAR_END";

export interface RetentionRule {
  kind: RetainedRecordKind;
  years: number;
  anchor: RetentionAnchor;
  reference: string;
  labelFr: string;
  noteFr?: string;
}

/* ── Ontario : les paragraphes qui valent dix ans ─────────────────
 *
 * s. 23(2) vise les par. 18(1), (2), (3), (8), (9), (10) et (11). Les autres
 * paragraphes de la s. 18 retombent sous la s. 23(1) et ses six ans. La liste est
 * écrite telle quelle plutôt que résumée : « les registres importants » n'est pas une
 * catégorie du texte, et quelqu'un finirait par y ranger la mauvaise pièce.
 */
const ON_TEN_YEAR_KINDS: RetainedRecordKind[] = [
  "TRUST_CASH_JOURNAL", // par. 18(1)
  "ADMIN_CASH_JOURNAL", // par. 18(2)
  "CLIENT_LEDGERS", // par. 18(3)
  "MONTHLY_REPORT", // par. 18(8)
  "TRUST_PROPERTY_REGISTER", // par. 18(9)
  "SUPPORTING_DOCUMENT", // par. 18(10)
  "ELECTRONIC_TRANSFER_CONFIRMATION", // par. 18(11)
];

/* ── Québec : les pièces ancrées sur la fin d'exercice (art. 32) ──
 *
 * L'art. 32 nomme les rapports mensuels, les copies de chèques reçus en fidéicommis
 * et « toutes les pièces justificatives ou de contrôle ». Tout le reste relève de
 * l'art. 31 et de la fermeture du dossier.
 */
const QC_FISCAL_ANCHORED: RetainedRecordKind[] = [
  "MONTHLY_REPORT",
  "ANNUAL_REPORT",
  "SUPPORTING_DOCUMENT",
  "TRUST_CHEQUE_COPY",
  "BANK_STATEMENT",
  "ELECTRONIC_TRANSFER_CONFIRMATION",
  "CASH_RECEIPT",
];

const LABELS: Record<RetainedRecordKind, string> = {
  TRUST_CASH_JOURNAL: "Journal des recettes et déboursés en fidéicommis",
  ADMIN_CASH_JOURNAL: "Journal des recettes et déboursés d'administration",
  CLIENT_LEDGERS: "Cartes-clients (grand livre du fidéicommis)",
  PARTICULAR_ACCOUNT_LEDGERS: "Cartes des comptes particuliers",
  CHEQUE_REGISTER: "Registre des chèques",
  TRUST_PROPERTY_REGISTER: "Registre des autres biens en fidéicommis",
  FEES_BOOK: "Livre des honoraires et déboursés",
  MATTER_LISTS: "Listes des dossiers actifs et fermés",
  MONTHLY_REPORT: "Rapports comptables mensuels",
  ANNUAL_REPORT: "Rapport comptable annuel",
  SUPPORTING_DOCUMENT: "Pièces justificatives et de contrôle",
  TRUST_CHEQUE_COPY: "Copies des chèques reçus en fidéicommis",
  BANK_STATEMENT: "Relevés bancaires",
  ELECTRONIC_TRANSFER_CONFIRMATION: "Confirmations de virements électroniques",
  CASH_RECEIPT: "Reçus d'espèces",
  CLIENT_IDENTIFICATION: "Dossiers d'identification et de vérification du client",
};

/**
 * Règle de conservation d'une catégorie de pièces, pour une province.
 *
 * Chaque règle porte son article. Une durée sans source ne peut pas être défendue
 * devant un inspecteur, et surtout personne ne peut la corriger plus tard sans savoir
 * d'où elle venait (PR-4).
 */
export function getRetentionRule(params: {
  kind: RetainedRecordKind;
  province: CabinetProvince;
}): RetentionRule {
  const { kind, province } = params;
  const labelFr = LABELS[kind];

  if (province === "ON") {
    // s. 23(3) traite l'identification à part, avec ses dix ans.
    if (kind === "CLIENT_IDENTIFICATION") {
      return {
        kind,
        years: 10,
        anchor: "FISCAL_YEAR_END",
        reference: "By-Law 9, s. 23(3)",
        labelFr,
        noteFr:
          "Dix ans, comme les registres de la s. 23(2), mais en vertu d'une disposition distincte visant les dossiers de la s. 20.",
      };
    }

    const tenYears = ON_TEN_YEAR_KINDS.includes(kind);
    return {
      kind,
      years: tenYears ? 10 : 6,
      anchor: "FISCAL_YEAR_END",
      reference: tenYears ? "By-Law 9, s. 23(2)" : "By-Law 9, s. 23(1)",
      labelFr,
      noteFr: tenYears
        ? "Dix ans : la s. 23(2) vise nommément les par. 18(1)(2)(3)(8)(9)(10)(11). Purger à six ans détruirait un registre encore exigible."
        : "Six ans, régime général de la s. 23(1). Ce paragraphe n'est pas visé par la liste de la s. 23(2).",
    };
  }

  // ── Québec ──────────────────────────────────────────────────────
  if (kind === "CLIENT_IDENTIFICATION") {
    return {
      kind,
      years: 7,
      anchor: "FILE_CLOSURE",
      reference: "B-1 r.5, art. 31",
      labelFr,
      noteFr:
        "Le dossier d'identification suit le dossier client : sept ans à compter de sa fermeture.",
    };
  }

  if (QC_FISCAL_ANCHORED.includes(kind)) {
    return {
      kind,
      years: 7,
      anchor: "FISCAL_YEAR_END",
      reference: "B-1 r.5, art. 32",
      labelFr,
      noteFr:
        "Sept ans après la fin de l'exercice financier, et non après la fermeture du dossier : l'art. 32 a son propre point de départ.",
    };
  }

  return {
    kind,
    years: 7,
    anchor: "FILE_CLOSURE",
    reference: "B-1 r.5, art. 31",
    labelFr,
    noteFr:
      "Sept ans à compter de la fermeture du dossier. Un dossier encore ouvert n'a pas commencé à courir.",
  };
}

/** Toutes les règles applicables à une province, pour l'écran de paramètres. */
export function getAllRetentionRules(province: CabinetProvince): RetentionRule[] {
  return (Object.keys(LABELS) as RetainedRecordKind[])
    .map((kind) => getRetentionRule({ kind, province }))
    .sort((a, b) => b.years - a.years || a.labelFr.localeCompare(b.labelFr));
}

/* ════════════════════════════════════════════════════════════════
   CALCUL DE L'ÉCHÉANCE
   ════════════════════════════════════════════════════════════════ */

export interface PurgeEligibility {
  /** La pièce peut-elle être détruite ? */
  purgeable: boolean;
  /** Date à laquelle elle le devient. `null` quand le compte à rebours n'a pas démarré. */
  purgeableFrom: Date | null;
  rule: RetentionRule;
  /** Pourquoi elle ne l'est pas encore, en clair. */
  blockedReasonFr: string | null;
}

/**
 * Fin de l'exercice financier applicable à une date.
 *
 * `fiscalYearEndMonth` et `fiscalYearEndDay` viennent du cabinet (`Cabinet.fiscalYearEnd`,
 * posé au CH-00). Sans eux, aucune rétention ancrée sur l'exercice n'est calculable —
 * et c'est pour cela que le service refuse de purger tant qu'ils ne sont pas réglés,
 * plutôt que de supposer le 31 décembre.
 */
export function fiscalYearEndOnOrAfter(params: {
  date: Date;
  fiscalYearEndMonth: number; // 1-12
  fiscalYearEndDay: number; // 1-31
}): Date {
  const y = params.date.getUTCFullYear();
  const candidate = new Date(
    Date.UTC(y, params.fiscalYearEndMonth - 1, params.fiscalYearEndDay, 23, 59, 59, 999),
  );
  if (candidate.getTime() >= params.date.getTime()) return candidate;
  return new Date(
    Date.UTC(y + 1, params.fiscalYearEndMonth - 1, params.fiscalYearEndDay, 23, 59, 59, 999),
  );
}

function addYears(d: Date, years: number): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear() + years,
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds(),
    ),
  );
}

/**
 * Une pièce est-elle purgeable ?
 *
 * ⚠️ LA RÉPONSE PAR DÉFAUT EST NON. Un dossier dont on ignore la date de fermeture,
 * un cabinet dont l'exercice n'est pas réglé, une date manquante : dans tous ces cas
 * la fonction refuse. Se tromper en conservant coûte du stockage ; se tromper en
 * détruisant est irréversible et constitue le manquement lui-même.
 */
export function assessPurgeEligibility(params: {
  kind: RetainedRecordKind;
  province: CabinetProvince;
  now: Date;
  /** Date de la pièce ou de l'écriture. */
  recordDate: Date;
  /** Fermeture du dossier rattaché. `null` = dossier ouvert ou inconnu. */
  fileClosedAt?: Date | null;
  fiscalYearEndMonth?: number | null;
  fiscalYearEndDay?: number | null;
}): PurgeEligibility {
  const rule = getRetentionRule({ kind: params.kind, province: params.province });

  if (rule.anchor === "FILE_CLOSURE") {
    if (!params.fileClosedAt) {
      return {
        purgeable: false,
        purgeableFrom: null,
        rule,
        blockedReasonFr:
          "Le dossier n'est pas fermé, ou sa date de fermeture est inconnue. Les sept ans de l'art. 31 n'ont pas commencé à courir.",
      };
    }
    const from = addYears(params.fileClosedAt, rule.years);
    return {
      purgeable: params.now.getTime() >= from.getTime(),
      purgeableFrom: from,
      rule,
      blockedReasonFr:
        params.now.getTime() >= from.getTime()
          ? null
          : `Conservation obligatoire jusqu'au ${from.toISOString().slice(0, 10)} (${rule.reference}).`,
    };
  }

  if (!params.fiscalYearEndMonth || !params.fiscalYearEndDay) {
    return {
      purgeable: false,
      purgeableFrom: null,
      rule,
      blockedReasonFr:
        "La fin de l'exercice financier du cabinet n'est pas réglée. Sans elle, l'échéance ne peut pas être calculée, et la supposer au 31 décembre détruirait des pièces encore exigibles.",
    };
  }

  const yearEnd = fiscalYearEndOnOrAfter({
    date: params.recordDate,
    fiscalYearEndMonth: params.fiscalYearEndMonth,
    fiscalYearEndDay: params.fiscalYearEndDay,
  });
  const from = addYears(yearEnd, rule.years);

  return {
    purgeable: params.now.getTime() >= from.getTime(),
    purgeableFrom: from,
    rule,
    blockedReasonFr:
      params.now.getTime() >= from.getTime()
        ? null
        : `Conservation obligatoire jusqu'au ${from.toISOString().slice(0, 10)} (${rule.reference}).`,
  };
}

/* ════════════════════════════════════════════════════════════════
   FORME DE LA CONSERVATION — art. 29
   ════════════════════════════════════════════════════════════════ */

export interface RetentionFormDuty {
  reference: string;
  dutyFr: string;
}

/**
 * Comment les livres doivent être tenus, indépendamment de leur durée.
 *
 * L'art. 30 QC et le par. 21(2) ON visent la **forme** : un registre tenu sur support
 * électronique doit pouvoir être imprimé immédiatement. C'est ce qui rend le moteur
 * d'impression du CH-04 réglementaire et non décoratif.
 *
 * À ne pas confondre avec l'art. 29, qui porte sur la confidentialité, la sécurité et
 * l'accès des personnes autorisées — traité par `inspection-access.ts`.
 */
export function getRetentionFormDuties(province: CabinetProvince): RetentionFormDuty[] {
  if (province === "ON") {
    return [
      {
        reference: "By-Law 9, par. 21(2)",
        dutyFr:
          "Les registres tenus sous forme électronique doivent pouvoir être imprimés immédiatement sur demande.",
      },
    ];
  }
  return [
    {
      reference: "B-1 r.5, art. 30",
      dutyFr:
        "L'avocat doit pouvoir produire immédiatement une copie papier de tout livre ou registre tenu sur support électronique.",
    },
    {
      reference: "B-1 r.5, art. 33",
      dutyFr:
        "En cas de perte ou de destruction, l'avocat doit reconstituer ses livres et registres, à ses frais.",
    },
  ];
}

/**
 * L'art. 33 est la raison d'être de la trousse d'inspection.
 *
 * Une reconstitution se fait « aux frais de l'avocat ». Un cabinet qui peut réexporter
 * une période complète, horodatée et empreintée, n'a pas à reconstituer : il produit.
 */
export const RECONSTITUTION_IS_AT_LAWYERS_EXPENSE = true;
