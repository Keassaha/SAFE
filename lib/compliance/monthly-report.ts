/**
 * Règles du rapport comptable mensuel.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI, `now` injecté.
 *
 * Sources lues intégralement le 2026-07-30 :
 *   RLRQ c. B-1, r. 5, art. 40, 41, 42 (LegisQuébec, à jour au 2026-04-01)
 *   LSO By-Law 9, s. 18(8), 21(2), 22 (PDF officiel, version du 2017-04-27)
 */

import type { CabinetProvince } from "./rules";

/* ════════════════════════════════════════════════════════════════
   LES SEPT BLOCS DE L'ART. 41
   ════════════════════════════════════════════════════════════════ */

export type ReportBlockId =
  | "CLIENT_LEDGER_BALANCES"
  | "OUTSTANDING_CHEQUES"
  | "DEPOSITS_IN_TRANSIT"
  | "PERIOD_TOTALS"
  | "BANK_COMPARISON"
  | "PARTICULAR_ACCOUNTS"
  | "BANK_STATEMENT";

export interface ReportBlock {
  id: ReportBlockId;
  titleFr: string;
  titleEn: string;
  reference: string;
  /** Champs que le texte énumère explicitement pour ce bloc. */
  requiredFieldsFr: string[];
}

/**
 * Les sept blocs, dans l'ordre du texte.
 *
 * Quatre d'entre eux sont des LISTES ligne par ligne, pas des totaux. C'est la
 * distinction que SAFE ratait : `chequesEnCirculation` était un nombre unique, alors
 * que l'art. 41(2) exige « la liste des chèques en circulation […] en indiquant pour
 * chacun le montant, la date d'émission, le numéro du chèque, le nom du client et le
 * numéro ou la désignation du dossier ».
 */
export function getReportBlocks(province: CabinetProvince): ReportBlock[] {
  const qc = province === "QC";

  const blocks: ReportBlock[] = [
    {
      id: "CLIENT_LEDGER_BALANCES",
      titleFr: "Soldes inscrits aux cartes-clients à la fin du mois",
      titleEn: "Client trust balances at month end",
      reference: qc ? "B-1 r.5, art. 41(1)" : "By-Law 9, s. 18(8)i",
      requiredFieldsFr: [
        "nom du client",
        "numéro ou désignation du dossier",
        "date de la dernière inscription",
        "solde",
      ],
    },
    {
      id: "OUTSTANDING_CHEQUES",
      titleFr: "Chèques en circulation à la fin du mois",
      titleEn: "Outstanding cheques at month end",
      reference: qc ? "B-1 r.5, art. 41(2)" : "By-Law 9, s. 18(8)ii",
      requiredFieldsFr: [
        "montant",
        "date d'émission",
        "numéro du chèque",
        "nom du client",
        "numéro ou désignation du dossier",
      ],
    },
    {
      id: "DEPOSITS_IN_TRANSIT",
      titleFr: "Recettes en circulation à la fin du mois",
      titleEn: "Deposits in transit at month end",
      reference: qc ? "B-1 r.5, art. 41(3)" : "By-Law 9, s. 18(8)ii",
      requiredFieldsFr: [
        "montant",
        "date de réception",
        "nom du client",
        "numéro ou désignation du dossier",
      ],
    },
    {
      id: "PERIOD_TOTALS",
      titleFr: "Total des recettes et des débours du mois",
      titleEn: "Total receipts and disbursements for the month",
      reference: qc ? "B-1 r.5, art. 41(4)" : "By-Law 9, s. 18(8)",
      requiredFieldsFr: ["total des recettes", "total des débours"],
    },
    {
      id: "BANK_COMPARISON",
      titleFr: "État comparatif entre le journal de caisse et le relevé bancaire",
      titleEn: "Comparison of the cash journal and the bank statement",
      reference: qc ? "B-1 r.5, art. 41(5)" : "By-Law 9, s. 18(8)",
      requiredFieldsFr: [
        "solde au journal de caisse",
        "solde au relevé de l'institution",
        "motifs des écarts",
      ],
    },
  ];

  // Art. 41(6) — la liste des comptes particuliers est propre au régime québécois :
  // By-Law 9 ne connaît pas cette catégorie. L'ajouter en Ontario inventerait une
  // exigence.
  if (qc) {
    blocks.push({
      id: "PARTICULAR_ACCOUNTS",
      titleFr: "Comptes particuliers en fidéicommis à la fin du mois",
      titleEn: "Specific trust accounts at month end",
      reference: "B-1 r.5, art. 41(6)",
      requiredFieldsFr: [
        "nom du client",
        "numéro ou désignation du dossier",
        "nom de l'institution dépositaire",
        "numéro du compte",
        "date d'ouverture",
        "montant initial déposé",
      ],
    });
  }

  blocks.push({
    id: "BANK_STATEMENT",
    titleFr: "Copie du relevé de l'institution financière pour le mois visé",
    titleEn: "Copy of the financial institution statement for the month",
    reference: qc ? "B-1 r.5, art. 41(7)" : "By-Law 9, s. 18(10)",
    requiredFieldsFr: ["relevé bancaire du mois"],
  });

  return blocks;
}

/* ════════════════════════════════════════════════════════════════
   CONDITIONS DE CERTIFICATION
   ════════════════════════════════════════════════════════════════ */

export interface ReportCertificationInput {
  bankStatementAttached: boolean;
  ecartBanque: number;
  ecartCartesClients: number;
  /** Écarts non nuls couverts par un motif consigné ? */
  bankDiscrepancyExplained: boolean;
  ledgerDiscrepancyExplained: boolean;
  negativeClientBalances: number;
  ledgerLineCount: number;
  alreadyCertified: boolean;
}

export interface CertificationBlocker {
  code:
    | "ALREADY_CERTIFIED"
    | "BANK_STATEMENT_MISSING"
    | "BANK_DISCREPANCY_UNEXPLAINED"
    | "LEDGER_DISCREPANCY_UNEXPLAINED"
    | "NEGATIVE_CLIENT_BALANCE"
    | "EMPTY_LEDGER_LISTING";
  messageFr: string;
  messageEn: string;
  reference: string;
  remedyFr: string;
}

const EPSILON = 0.005;

/**
 * Ce qui empêche de certifier un rapport mensuel.
 *
 * Note sur les écarts : le texte n'interdit PAS un écart. L'art. 41(5) exige un
 * « état comparatif », et la s. 18(8) exige la comparaison « together with the
 * reasons for any differences ». Un écart motivé est donc conforme ; un écart
 * silencieux ne l'est pas. On bloque l'absence de motif, pas l'écart lui-même.
 *
 * C'est une correction par rapport au rapprochement de CH-00, qui exigeait un écart
 * strictement nul. Exiger zéro est plus strict que le règlement, et le sur-blocage
 * pousse au contournement : l'utilisateur ajuste un chiffre pour « faire tomber »
 * l'écart, ce qui détruit précisément l'information que l'inspecteur cherche.
 */
export function findCertificationBlockers(
  input: ReportCertificationInput,
  province: CabinetProvince,
): CertificationBlocker[] {
  const qc = province === "QC";
  const out: CertificationBlocker[] = [];

  if (input.alreadyCertified) {
    out.push({
      code: "ALREADY_CERTIFIED",
      messageFr: "Ce rapport est déjà certifié.",
      messageEn: "This report has already been certified.",
      reference: qc ? "B-1 r.5, art. 40" : "By-Law 9, s. 18(8)",
      remedyFr:
        "Un rapport signé est immuable. Portez toute correction dans la période ouverte courante.",
    });
    return out;
  }

  if (!input.bankStatementAttached) {
    out.push({
      code: "BANK_STATEMENT_MISSING",
      messageFr: "Le relevé de l'institution financière du mois n'est pas joint.",
      messageEn: "The financial institution statement for the month is not attached.",
      reference: qc ? "B-1 r.5, art. 41(7)" : "By-Law 9, s. 18(10)",
      remedyFr:
        "Joignez le relevé du mois. Sans lui, l'état comparatif ne compare rien de vérifiable.",
    });
  }

  if (Math.abs(input.ecartBanque) > EPSILON && !input.bankDiscrepancyExplained) {
    out.push({
      code: "BANK_DISCREPANCY_UNEXPLAINED",
      messageFr: `Écart de ${input.ecartBanque.toFixed(2)} $ entre le solde rapproché et le journal, sans motif consigné.`,
      messageEn: `Discrepancy of $${input.ecartBanque.toFixed(2)} between the reconciled balance and the journal, with no reason recorded.`,
      reference: qc ? "B-1 r.5, art. 41(5)" : "By-Law 9, s. 18(8)",
      remedyFr:
        "Consignez le motif de l'écart, ou corrigez l'écriture en cause. Un écart expliqué est conforme ; un écart silencieux ne l'est pas.",
    });
  }

  if (Math.abs(input.ecartCartesClients) > EPSILON && !input.ledgerDiscrepancyExplained) {
    out.push({
      code: "LEDGER_DISCREPANCY_UNEXPLAINED",
      messageFr: `Écart de ${input.ecartCartesClients.toFixed(2)} $ entre la somme des cartes-clients et le journal, sans motif consigné.`,
      messageEn: `Discrepancy of $${input.ecartCartesClients.toFixed(2)} between the sum of client ledgers and the journal, with no reason recorded.`,
      reference: qc ? "B-1 r.5, art. 41(1)" : "By-Law 9, s. 18(8)i",
      remedyFr:
        "Une divergence ici signale une écriture rattachée au mauvais dossier. Vérifiez avant de consigner un motif.",
    });
  }

  // Aucun solde de carte-client ne peut être débiteur. Contrairement aux écarts, ce
  // n'est pas une différence à expliquer : c'est l'utilisation des fonds d'un autre
  // client, et l'art. 60 impose de la combler « sans délai ».
  if (input.negativeClientBalances > 0) {
    out.push({
      code: "NEGATIVE_CLIENT_BALANCE",
      messageFr: `${input.negativeClientBalances} carte(s)-client(s) présentent un solde débiteur.`,
      messageEn: `${input.negativeClientBalances} client ledger(s) show a debit balance.`,
      reference: qc ? "B-1 r.5, art. 59, 60" : "By-Law 9, s. 9(3), 14",
      remedyFr:
        "Comblez le solde débiteur avant de certifier. Certifier par-dessus masquerait l'utilisation des fonds d'un autre client.",
    });
  }

  // Un rapport dont la liste de l'art. 41(1) est vide alors que le journal porte un
  // solde ne peut pas être exact : le bloc central manquerait.
  if (input.ledgerLineCount === 0 && Math.abs(input.ecartCartesClients) > EPSILON) {
    out.push({
      code: "EMPTY_LEDGER_LISTING",
      messageFr: "La liste des soldes de cartes-clients est vide alors que le journal porte un solde.",
      messageEn: "The client ledger listing is empty while the journal shows a balance.",
      reference: qc ? "B-1 r.5, art. 41(1)" : "By-Law 9, s. 18(8)i",
      remedyFr: "Régénérez le rapport : la liste détaillée est le bloc central de l'art. 41.",
    });
  }

  return out;
}

/* ════════════════════════════════════════════════════════════════
   ÉCHÉANCE — s. 22(2) ON, rien de chiffré au Québec
   ════════════════════════════════════════════════════════════════ */

/** By-Law 9, s. 22(2) : « within twenty-five days after the last day of the month ». */
export const ONTARIO_REPORT_DEADLINE_DAYS = 25;

export interface ReportDeadline {
  /** Date limite, ou `null` au Québec où aucun délai n'est chiffré. */
  dueAt: Date | null;
  daysRemaining: number | null;
  overdue: boolean;
  reference: string;
  noteFr: string;
}

/**
 * Échéance du rapport mensuel.
 *
 * Ontario : la s. 22(2) fixe 25 jours après la fin du mois. Le dépassement est un
 * manquement chiffrable.
 *
 * Québec : l'art. 40 impose un registre « à jour » des rapports mensuels, SANS délai
 * en jours. On ne peut donc pas déclarer un rapport québécois « en retard » à J+26 :
 * ce serait appliquer une règle ontarienne à un cabinet québécois. On renvoie un
 * rappel sans date limite. C'est la même discipline que `computeReconciliationSeverity`.
 */
export function computeReportDeadline(params: {
  periode: string; // "YYYY-MM"
  province: CabinetProvince;
  now: Date;
}): ReportDeadline {
  const [year, month] = params.periode.split("-").map(Number);
  const monthEnd = new Date(Date.UTC(year!, month!, 0, 23, 59, 59, 999));

  if (params.province !== "ON") {
    return {
      dueAt: null,
      daysRemaining: null,
      overdue: false,
      reference: "B-1 r.5, art. 40",
      noteFr:
        "Le règlement québécois impose un registre des rapports mensuels tenu à jour, sans fixer de nombre de jours. Le délai de 25 jours est propre à l'Ontario.",
    };
  }

  const dueAt = new Date(monthEnd.getTime() + ONTARIO_REPORT_DEADLINE_DAYS * 86_400_000);
  const daysRemaining = Math.ceil((dueAt.getTime() - params.now.getTime()) / 86_400_000);

  return {
    dueAt,
    daysRemaining,
    overdue: params.now.getTime() > dueAt.getTime(),
    reference: "By-Law 9, s. 22(2)",
    noteFr:
      "By-Law 9 exige que la comparaison mensuelle soit créée dans les 25 jours suivant le dernier jour du mois.",
  };
}

/* ════════════════════════════════════════════════════════════════
   ATTESTATION — PR-3
   ════════════════════════════════════════════════════════════════ */

export interface ExecutedReportControl {
  id: string;
  labelFr: string;
  reference: string;
  passed: boolean;
  evidence: string | null;
}

/**
 * Texte de l'attestation, généré à partir des contrôles RÉELLEMENT exécutés.
 *
 * On n'affirme jamais une conformité générale au règlement : le système vérifie des
 * points précis, l'attestation les énumère, et rien d'autre. Une attestation étroite
 * et vraie protège mieux l'avocate qu'une attestation large et invérifiable.
 */
export function buildReportDeclaration(params: {
  controls: ExecutedReportControl[];
  periode: string;
  accountLabel: string;
  province: CabinetProvince;
}): string {
  const qc = params.province === "QC";
  const intro = qc
    ? `Je certifie avoir établi le rapport comptable mensuel du compte « ${params.accountLabel} » pour la période ${params.periode}, et avoir constaté ce qui suit :`
    : `I certify that I have prepared the monthly trust comparison for account "${params.accountLabel}" for the period ${params.periode}, and have verified the following:`;
  const items = params.controls
    .filter((c) => c.passed)
    .map((c) => `— ${c.labelFr} (${c.reference}).`)
    .join("\n");
  const outro = qc
    ? "Cette attestation porte sur les seuls éléments énumérés ci-dessus."
    : "This certification covers only the items listed above.";
  return [intro, items, outro].join("\n");
}
