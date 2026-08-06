/**
 * Rapport comptable annuel — art. 42 B-1 r.5.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI, `now` injecté.
 *
 * Source lue intégralement le 2026-07-30 :
 *   RLRQ c. B-1, r. 5, art. 42 (LegisQuébec, à jour au 2026-04-01)
 *
 * ⚠️ QUÉBEC SEULEMENT — et c'est une affirmation qu'il faut savoir borner.
 *
 * By-Law 9, lu intégralement, **ne contient aucun rapport comptable annuel**. Ses
 * obligations périodiques s'arrêtent à la comparaison mensuelle de la s. 18(8), à
 * produire dans les 25 jours (s. 22(2)). Rien n'y impose de transmettre quoi que ce
 * soit au Barreau une fois l'an.
 *
 * INCERTITUDE DÉCLARÉE : la Law Society of Ontario impose par ailleurs un « Lawyer
 * Annual Report » aux titulaires. Cette obligation ne figure PAS dans By-Law 9 et
 * n'a pas été lue dans cette session. Elle existe donc probablement, mais hors du
 * corpus vérifié — ce module ne la modélise pas, et ne prétend pas le contraire.
 * Voir docs/compliance/QUESTIONS_BARREAU.md.
 */

import type { CabinetProvince } from "./rules";

/* ════════════════════════════════════════════════════════════════
   APPLICABILITÉ
   ════════════════════════════════════════════════════════════════ */

export interface AnnualReportRegime {
  applies: boolean;
  reference: string;
  noteFr: string;
}

/** Le rapport comptable annuel de l'art. 42 s'applique-t-il à ce cabinet ? */
export function annualReportRegime(province: CabinetProvince): AnnualReportRegime {
  if (province === "QC") {
    return {
      applies: true,
      reference: "B-1 r.5, art. 42",
      noteFr:
        "Au moins une fois par an, et dans les 30 jours suivant la réception d'une demande du directeur de l'inspection professionnelle, sur le formulaire prescrit, pour chaque compte général en fidéicommis.",
    };
  }
  return {
    applies: false,
    reference: "By-Law 9, s. 18(8), 22(2)",
    noteFr:
      "By-Law 9 n'impose aucun rapport comptable annuel : ses obligations périodiques s'arrêtent à la comparaison mensuelle, à produire dans les 25 jours. Le « Lawyer Annual Report » du LSO existe par ailleurs, mais hors de By-Law 9 et hors du corpus vérifié.",
  };
}

/* ════════════════════════════════════════════════════════════════
   LES SEPT BLOCS DE L'ART. 42
   ════════════════════════════════════════════════════════════════ */

export type AnnualBlockId =
  | "CLIENT_LEDGER_BALANCES"
  | "OUTSTANDING_CHEQUES"
  | "DEPOSITS_IN_TRANSIT"
  | "MONTHLY_TOTALS"
  | "PERIOD_COMPARISON"
  | "PARTICULAR_ACCOUNTS"
  | "CLOSED_ACCOUNTS";

export interface AnnualBlock {
  id: AnnualBlockId;
  titleFr: string;
  reference: string;
  requiredFieldsFr: string[];
  /** Ce bloc n'a PAS d'équivalent au rapport mensuel de l'art. 41. */
  newVersusMonthly: boolean;
}

/**
 * Les sept blocs, dans l'ordre du texte.
 *
 * Cinq reprennent le rapport mensuel de l'art. 41, à l'échelle de la période. **Deux
 * sont propres au rapport annuel** :
 *
 *   42(4) le total des recettes et des débours **au cours de CHAQUE MOIS** de la
 *         période — douze couples de totaux, là où l'art. 41(4) n'en demande qu'un ;
 *   42(7) la liste de chacun des comptes généraux ET particuliers **fermés au cours
 *         de la période** — obligation qui n'existe nulle part ailleurs, et qui
 *         explique pourquoi un compte fermé n'est jamais supprimé.
 */
export function getAnnualBlocks(): AnnualBlock[] {
  return [
    {
      id: "CLIENT_LEDGER_BALANCES",
      titleFr: "Soldes inscrits aux cartes-clients à la fin de la période",
      reference: "B-1 r.5, art. 42(1)",
      requiredFieldsFr: [
        "nom du client",
        "numéro ou désignation du dossier",
        "date de la dernière inscription",
        "solde",
      ],
      newVersusMonthly: false,
    },
    {
      id: "OUTSTANDING_CHEQUES",
      titleFr: "Chèques en circulation à la fin de la période",
      reference: "B-1 r.5, art. 42(2)",
      requiredFieldsFr: [
        "montant",
        "date d'émission",
        "numéro du chèque",
        "nom du client",
        "numéro ou désignation du dossier",
      ],
      newVersusMonthly: false,
    },
    {
      id: "DEPOSITS_IN_TRANSIT",
      titleFr: "Recettes en circulation à la fin de la période",
      reference: "B-1 r.5, art. 42(3)",
      requiredFieldsFr: [
        "montant",
        "date de réception",
        "nom du client",
        "numéro ou désignation du dossier",
      ],
      newVersusMonthly: false,
    },
    {
      id: "MONTHLY_TOTALS",
      titleFr: "Total des recettes et des débours au cours de chaque mois de la période",
      reference: "B-1 r.5, art. 42(4)",
      requiredFieldsFr: ["mois", "total des recettes", "total des débours"],
      // Le rapport mensuel n'en demande qu'un couple ; l'annuel en demande douze.
      newVersusMonthly: true,
    },
    {
      id: "PERIOD_COMPARISON",
      titleFr:
        "État comparatif entre le journal de caisse et le relevé de l'institution à la fin de la période",
      reference: "B-1 r.5, art. 42(5)",
      requiredFieldsFr: [
        "solde au journal de caisse",
        "solde au relevé de l'institution",
        "copie du relevé du DERNIER MOIS de la période",
      ],
      newVersusMonthly: false,
    },
    {
      id: "PARTICULAR_ACCOUNTS",
      titleFr: "Comptes particuliers en fidéicommis à la fin de la période",
      reference: "B-1 r.5, art. 42(6)",
      requiredFieldsFr: [
        "nom du client",
        "numéro ou désignation du dossier",
        "nom de l'institution dépositaire",
        "numéro du compte",
        "date d'ouverture",
        "montant initial déposé",
      ],
      newVersusMonthly: false,
    },
    {
      id: "CLOSED_ACCOUNTS",
      titleFr:
        "Comptes généraux et particuliers en fidéicommis fermés au cours de la période",
      reference: "B-1 r.5, art. 42(7)",
      requiredFieldsFr: ["type de compte", "institution", "numéro", "date de fermeture"],
      // Aucune obligation équivalente ailleurs. C'est ce qui explique qu'un compte
      // fermé ne soit jamais supprimé du système.
      newVersusMonthly: true,
    },
  ];
}

/* ════════════════════════════════════════════════════════════════
   DÉLAI — 30 jours depuis la DEMANDE
   ════════════════════════════════════════════════════════════════ */

export const ANNUAL_REPORT_DEADLINE_DAYS = 30;

export interface AnnualReportDeadline {
  dueAt: Date;
  daysRemaining: number;
  overdue: boolean;
  reference: string;
  noteFr: string;
}

/**
 * Échéance du rapport annuel.
 *
 * L'art. 42 fait courir le délai depuis **la réception d'une demande** du directeur
 * de l'inspection professionnelle, pas depuis une date de calendrier : « dans les 30
 * jours suivant la réception d'une demande ». Sans demande, il n'y a pas d'échéance
 * — seulement l'obligation de rendre compte « au moins une fois par an ».
 *
 * Calculer une échéance en l'absence de demande inventerait un délai que le texte ne
 * fixe pas.
 */
export function computeAnnualReportDeadline(params: {
  requestReceivedAt: Date;
  now: Date;
}): AnnualReportDeadline {
  const dueAt = new Date(
    params.requestReceivedAt.getTime() + ANNUAL_REPORT_DEADLINE_DAYS * 86_400_000,
  );
  return {
    dueAt,
    daysRemaining: Math.ceil((dueAt.getTime() - params.now.getTime()) / 86_400_000),
    overdue: params.now.getTime() > dueAt.getTime(),
    reference: "B-1 r.5, art. 42",
    noteFr:
      "Le délai court depuis la réception de la demande du directeur de l'inspection professionnelle, pas depuis une date de calendrier.",
  };
}

/* ════════════════════════════════════════════════════════════════
   PÉRIODE DE DOUZE MOIS
   ════════════════════════════════════════════════════════════════ */

/**
 * Les douze périodes mensuelles couvertes, de la plus ancienne à la plus récente.
 *
 * L'art. 42 vise « la période de 12 mois identifiée dans la demande » : ce n'est donc
 * ni l'année civile, ni nécessairement l'exercice financier. La période est une
 * donnée de la demande, pas une convention.
 */
export function getPeriodMonths(params: { periodStart: string }): string[] {
  if (!/^\d{4}-\d{2}$/.test(params.periodStart)) {
    throw new Error("La période de début doit être au format YYYY-MM");
  }
  const [year, month] = params.periodStart.split("-").map(Number);
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(year!, month! - 1 + i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

/* ════════════════════════════════════════════════════════════════
   CONDITIONS DE CERTIFICATION
   ════════════════════════════════════════════════════════════════ */

export interface AnnualCertificationInput {
  bankStatementAttached: boolean;
  /** Périodes des douze mois dont le rapport mensuel n'est pas certifié. */
  uncertifiedMonths: string[];
  ecartPeriode: number;
  ecartExplained: boolean;
  negativeClientBalances: number;
  alreadyCertified: boolean;
}

export interface AnnualCertificationBlocker {
  code:
    | "ALREADY_CERTIFIED"
    | "BANK_STATEMENT_MISSING"
    | "MONTHLY_REPORTS_INCOMPLETE"
    | "PERIOD_DISCREPANCY_UNEXPLAINED"
    | "NEGATIVE_CLIENT_BALANCE";
  messageFr: string;
  reference: string;
  remedyFr: string;
}

const EPSILON = 0.005;

/**
 * Ce qui empêche de certifier le rapport annuel.
 *
 * Le contrôle le plus structurant est l'exigence des **douze rapports mensuels
 * certifiés**. Il ne vient pas directement de l'art. 42 mais de l'art. 40, qui impose
 * un registre permanent des rapports mensuels : un rapport annuel qui reposerait sur
 * des mois non rapprochés attesterait de chiffres que personne n'a vérifiés.
 *
 * Cette exigence est une DÉDUCTION de la combinaison des art. 40 et 42, et le
 * message le dit — elle n'est pas présentée comme une phrase du règlement.
 */
export function findAnnualCertificationBlockers(
  input: AnnualCertificationInput,
): AnnualCertificationBlocker[] {
  const out: AnnualCertificationBlocker[] = [];

  if (input.alreadyCertified) {
    return [
      {
        code: "ALREADY_CERTIFIED",
        messageFr: "Ce rapport annuel est déjà certifié.",
        reference: "B-1 r.5, art. 42",
        remedyFr:
          "Un rapport transmis au directeur est immuable. Une correction se porte dans la période ouverte courante.",
      },
    ];
  }

  if (!input.bankStatementAttached) {
    out.push({
      code: "BANK_STATEMENT_MISSING",
      messageFr:
        "Le relevé de l'institution financière du DERNIER MOIS de la période n'est pas joint.",
      reference: "B-1 r.5, art. 42(5)",
      remedyFr:
        "Le texte exige expressément que ce relevé soit joint au rapport. Sans lui, l'état comparatif ne compare rien de vérifiable.",
    });
  }

  if (input.uncertifiedMonths.length > 0) {
    out.push({
      code: "MONTHLY_REPORTS_INCOMPLETE",
      messageFr: `${input.uncertifiedMonths.length} mois de la période n'ont pas de rapport mensuel certifié : ${input.uncertifiedMonths.join(", ")}.`,
      reference: "B-1 r.5, art. 40, 42",
      remedyFr:
        "Certifiez d'abord les rapports mensuels manquants. Un rapport annuel bâti sur des mois non rapprochés attesterait de chiffres que personne n'a vérifiés. Cette exigence découle de la combinaison des art. 40 et 42, elle n'est pas une phrase du règlement.",
    });
  }

  if (Math.abs(input.ecartPeriode) > EPSILON && !input.ecartExplained) {
    out.push({
      code: "PERIOD_DISCREPANCY_UNEXPLAINED",
      messageFr: `Écart de ${input.ecartPeriode.toFixed(2)} $ à la fin de la période, sans motif consigné.`,
      reference: "B-1 r.5, art. 42(5)",
      remedyFr:
        "Consignez le motif, ou corrigez l'écriture en cause. Comme au rapport mensuel, c'est l'écart silencieux qui pose problème, pas l'écart.",
    });
  }

  if (input.negativeClientBalances > 0) {
    out.push({
      code: "NEGATIVE_CLIENT_BALANCE",
      messageFr: `${input.negativeClientBalances} carte(s)-client(s) présentent un solde débiteur à la fin de la période.`,
      reference: "B-1 r.5, art. 59, 60",
      remedyFr:
        "Comblez le solde débiteur avant de transmettre le rapport au directeur de l'inspection professionnelle.",
    });
  }

  return out;
}

/* ════════════════════════════════════════════════════════════════
   ATTESTATION
   ════════════════════════════════════════════════════════════════ */

export interface ExecutedAnnualControl {
  id: string;
  labelFr: string;
  reference: string;
  passed: boolean;
  evidence: string | null;
}

/**
 * Attestation du rapport annuel, générée depuis les contrôles exécutés (PR-3).
 *
 * L'art. 42 dit « rendre compte au Barreau de sa comptabilité en fidéicommis ». La
 * formule est large ; l'attestation, elle, ne l'est pas : elle énumère ce qui a été
 * vérifié et borne sa portée.
 */
export function buildAnnualDeclaration(params: {
  controls: ExecutedAnnualControl[];
  periodStart: string;
  periodEnd: string;
  accountLabel: string;
}): string {
  const intro =
    `Je rends compte de la comptabilité en fidéicommis du compte « ${params.accountLabel} » ` +
    `pour la période du ${params.periodStart} au ${params.periodEnd}, et j'ai constaté ce qui suit :`;
  const items = params.controls
    .filter((c) => c.passed)
    .map((c) => `— ${c.labelFr} (${c.reference}).`)
    .join("\n");
  const outro = "Cette attestation porte sur les seuls éléments énumérés ci-dessus.";
  return [intro, items, outro].join("\n");
}
