/**
 * Règles sur les sommes reçues en espèces.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI, `now` injecté.
 *
 * Sources lues intégralement le 2026-07-30 :
 *   RLRQ c. B-1, r. 5, art. 69 à 73 (LegisQuébec, à jour au 2026-04-01)
 *   LSO By-Law 9, s. 3 à 6, 19 (PDF officiel, version du 2017-04-27)
 *
 * L'audit relevait ici trois défauts SIMULTANÉS, dont deux opposés :
 *
 *   1. SUR-BLOCAGE — le code refusait toute somme de 7 500 $ ou plus en espèces,
 *      alors que l'art. 69 prévoit six exceptions et la s. 6 en prévoit cinq. La
 *      plus courante, l'avance d'honoraires, était bloquée. Un garde-fou qui refuse
 *      une opération licite pousse au contournement : l'utilisateur saisit
 *      « AUTRE » comme mode de paiement, et l'indication « espèces » de
 *      l'art. 38(1)g disparaît des registres.
 *
 *   2. SOUS-BLOCAGE — la s. 4(1) ontarienne vise un montant **agrégé** par dossier
 *      client. Trois versements de 3 000 $ franchissent le seuil et passaient tous
 *      les trois.
 *
 *   3. ABSENCE — art. 70 (reçu pour TOUTE somme en espèces, signé des deux parties),
 *      71 (déclaration au directeur dans les 30 jours), 72 (remboursement
 *      obligatoirement en espèces), 73 (conversion au taux de midi de la Banque du
 *      Canada), s. 19(1) ON (carnet de reçus en double).
 */

import type { CabinetProvince } from "./rules";

/** Seuil commun aux deux régimes : 7 500 $ CAD. */
export const CASH_THRESHOLD_CAD = 7500;

/* ════════════════════════════════════════════════════════════════
   PÉRIMÈTRE DE LA RÈGLE — deux régimes qui ne visent pas la même chose
   ════════════════════════════════════════════════════════════════ */

/**
 * Ce que la règle du seuil vise, selon la province.
 *
 * Art. 69 QC : « L'avocat ne peut **recevoir en fidéicommis** […] une somme en
 * espèces de 7 500 $ ou plus. » La règle vise la réception EN FIDÉICOMMIS.
 *
 * s. 4(1) ON : « A licensee shall not **receive or accept** from a person, in respect
 * of any one client file, cash in an aggregate amount of 7,500 or more Canadian
 * dollars. » La règle vise TOUTE réception rattachée à un dossier client, en fiducie
 * ou non — la s. 5 précisant les activités concernées.
 *
 * La distinction est réelle : au Québec, des espèces reçues directement en paiement
 * d'une facture ne tombent pas sous l'art. 69 ; en Ontario, elles tombent sous la
 * s. 4(1). Aplatir les deux régimes produirait soit un blocage illégitime, soit un
 * trou de conformité.
 */
export function cashRuleScope(province: CabinetProvince): {
  scope: "TRUST_ONLY" | "ANY_CLIENT_FILE";
  reference: string;
  noteFr: string;
} {
  if (province === "QC") {
    return {
      scope: "TRUST_ONLY",
      reference: "B-1 r.5, art. 69",
      noteFr:
        "Au Québec, le seuil vise la réception EN FIDÉICOMMIS. Des espèces reçues directement en paiement d'une facture n'y tombent pas, mais le reçu de l'art. 70 reste exigé.",
    };
  }
  return {
    scope: "ANY_CLIENT_FILE",
    reference: "By-Law 9, s. 4(1), 5",
    noteFr:
      "En Ontario, le seuil vise toute somme reçue ou acceptée relativement à un dossier client, en fiducie ou non.",
  };
}

/* ════════════════════════════════════════════════════════════════
   EXCEPTIONS
   ════════════════════════════════════════════════════════════════ */

export type CashExemption =
  // ── Communes aux deux régimes ──────────────────────────────────
  | "INSTITUTION_FINANCIERE"
  | "ORGANISME_PUBLIC"
  | "ORDONNANCE_TRIBUNAL"
  | "AMENDE_OU_SANCTION"
  | "AGENT_DE_LA_PAIX"
  // ── Québec seulement ───────────────────────────────────────────
  | "DEPOT_MISE_EN_LIBERTE"
  | "AVANCE_HONORAIRES_OU_DEBOURS"
  // ── Ontario seulement ──────────────────────────────────────────
  | "HONORAIRES_DEBOURS_OU_CAUTIONNEMENT";

export interface CashExemptionDefinition {
  code: CashExemption;
  labelFr: string;
  labelEn: string;
  reference: string;
  /** Le remboursement de cette somme doit-il obligatoirement se faire en espèces ? */
  refundMustBeCash: boolean;
  noteFr?: string;
}

const QC_EXEMPTIONS: CashExemptionDefinition[] = [
  {
    code: "INSTITUTION_FINANCIERE",
    labelFr: "Somme remise par une institution financière",
    labelEn: "Cash from a financial institution",
    reference: "B-1 r.5, art. 69(1)",
    refundMustBeCash: false,
  },
  {
    code: "ORGANISME_PUBLIC",
    labelFr: "Somme remise par un organisme public",
    labelEn: "Cash from a public body",
    reference: "B-1 r.5, art. 69(2)",
    refundMustBeCash: false,
  },
  {
    code: "ORDONNANCE_TRIBUNAL",
    labelFr: "Somme remise conformément à une ordonnance de la Cour",
    labelEn: "Cash received pursuant to a court order",
    reference: "B-1 r.5, art. 69(3)",
    refundMustBeCash: false,
  },
  {
    code: "AMENDE_OU_SANCTION",
    labelFr: "Somme remise pour payer une amende ou une sanction",
    labelEn: "Cash to pay a fine or penalty",
    reference: "B-1 r.5, art. 69(3)",
    refundMustBeCash: false,
  },
  {
    code: "AGENT_DE_LA_PAIX",
    labelFr:
      "Somme remise par un agent de la paix, un organisme d'application de la loi ou un mandataire de l'État",
    labelEn: "Cash from a peace officer, law enforcement agency or Crown agent",
    reference: "B-1 r.5, art. 69(4)",
    refundMustBeCash: false,
  },
  {
    code: "DEPOT_MISE_EN_LIBERTE",
    labelFr: "Somme destinée à un dépôt à la Cour pour la mise en liberté d'une personne détenue",
    labelEn: "Cash for deposit with the court to obtain a detainee's release",
    reference: "B-1 r.5, art. 69(5)",
    refundMustBeCash: false,
  },
  {
    code: "AVANCE_HONORAIRES_OU_DEBOURS",
    labelFr: "Somme remise à titre d'avance d'honoraires ou de débours",
    labelEn: "Cash received as an advance on fees or disbursements",
    reference: "B-1 r.5, art. 69(6)",
    // L'art. 69(6) ne conditionne PAS l'exception à un remboursement en espèces.
    // C'est l'art. 72 qui impose ce remboursement, et seulement pour les sommes de
    // 7 500 $ ou plus effectivement reçues en espèces.
    refundMustBeCash: false,
    noteFr:
      "C'est l'exception la plus courante. Elle était bloquée par le contrôle brut antérieur.",
  },
];

const ON_EXEMPTIONS: CashExemptionDefinition[] = [
  {
    code: "INSTITUTION_FINANCIERE",
    labelFr: "Somme reçue d'une institution financière ou d'une caisse",
    labelEn: "Cash from a bank, credit union, caisse populaire or trust company",
    reference: "By-Law 9, s. 6(a)",
    refundMustBeCash: false,
  },
  {
    code: "ORGANISME_PUBLIC",
    labelFr: "Somme reçue d'un organisme public",
    labelEn: "Cash from a public body",
    reference: "By-Law 9, s. 6(a)",
    refundMustBeCash: false,
  },
  {
    code: "AGENT_DE_LA_PAIX",
    labelFr:
      "Somme reçue d'un agent de la paix, d'un organisme d'application de la loi ou d'un mandataire de la Couronne",
    labelEn: "Cash from a peace officer, law enforcement agency or Crown agent",
    reference: "By-Law 9, s. 6(b)",
    refundMustBeCash: false,
  },
  {
    code: "ORDONNANCE_TRIBUNAL",
    labelFr: "Somme reçue conformément à une ordonnance d'un tribunal",
    labelEn: "Cash received pursuant to an order of a tribunal",
    reference: "By-Law 9, s. 6(c)",
    refundMustBeCash: false,
  },
  {
    code: "AMENDE_OU_SANCTION",
    labelFr: "Somme reçue pour payer une amende ou une sanction",
    labelEn: "Cash to pay a fine or penalty",
    reference: "By-Law 9, s. 6(d)",
    refundMustBeCash: false,
  },
  {
    code: "HONORAIRES_DEBOURS_OU_CAUTIONNEMENT",
    labelFr:
      "Somme reçue pour honoraires, débours, dépenses ou cautionnement — tout remboursement devra se faire EN ESPÈCES",
    labelEn:
      "Cash for fees, disbursements, expenses or bail — any refund out of such receipts must also be made in cash",
    reference: "By-Law 9, s. 6(e)",
    // La s. 6(e) conditionne EXPRESSÉMENT l'exception : « provided that any refund
    // out of such receipts is also made in cash ». Invoquer l'exception engage donc
    // le cabinet pour la suite.
    refundMustBeCash: true,
    noteFr:
      "L'exception n'est acquise QUE si tout remboursement issu de cette somme se fait lui aussi en espèces (s. 6(e)).",
  },
];

/** Exceptions applicables dans la province. */
export function getCashExemptions(province: CabinetProvince): CashExemptionDefinition[] {
  return province === "QC" ? QC_EXEMPTIONS : ON_EXEMPTIONS;
}

/** Définition d'une exception, ou `undefined` si elle n'existe pas dans ce régime. */
export function getCashExemption(
  province: CabinetProvince,
  code: string,
): CashExemptionDefinition | undefined {
  return getCashExemptions(province).find((e) => e.code === code);
}

/* ════════════════════════════════════════════════════════════════
   CONTRÔLE DU SEUIL — agrégé par dossier
   ════════════════════════════════════════════════════════════════ */

export interface CashAcceptanceInput {
  /** Montant présenté, converti en dollars canadiens (art. 73 / s. 4(2)). */
  amountCad: number;
  /** Cumul déjà reçu en espèces pour CE dossier, en dollars canadiens. */
  alreadyReceivedCad: number;
  /** Exception invoquée, le cas échéant. */
  exemption?: string | null;
  /** La somme est-elle reçue en fidéicommis ? Décisif au Québec (art. 69). */
  intoTrust: boolean;
}

export type CashAcceptanceVerdict =
  | { status: "OK"; reason: "below_threshold" | "exempt" | "out_of_scope"; reference: string }
  | {
      status: "REFUSED";
      code: "CASH_THRESHOLD_EXCEEDED" | "EXEMPTION_NOT_AVAILABLE_IN_PROVINCE";
      reference: string;
      aggregateCad: number;
      messageFr: string;
      remedyFr: string;
    };

/**
 * La somme en espèces peut-elle être acceptée ?
 *
 * Le seuil s'apprécie sur le CUMUL du dossier, pas sur le versement isolé. C'est
 * explicite en Ontario (« in an aggregate amount ») et c'est la lecture naturelle du
 * québécois « pour un même mandat ou contrat de service » : trois versements de
 * 3 000 $ pour le même mandat font 9 000 $ reçus pour ce mandat.
 */
export function evaluateCashAcceptance(
  province: CabinetProvince,
  input: CashAcceptanceInput,
): CashAcceptanceVerdict {
  const scope = cashRuleScope(province);

  // Québec : l'art. 69 ne vise que la réception EN FIDÉICOMMIS. Des espèces reçues
  // en paiement direct d'une facture n'y tombent pas — le reçu de l'art. 70 reste
  // exigé, mais pas le seuil.
  if (province === "QC" && !input.intoTrust) {
    return { status: "OK", reason: "out_of_scope", reference: scope.reference };
  }

  const aggregateCad = Math.round((input.alreadyReceivedCad + input.amountCad) * 100) / 100;
  if (aggregateCad < CASH_THRESHOLD_CAD) {
    return { status: "OK", reason: "below_threshold", reference: scope.reference };
  }

  if (input.exemption) {
    const def = getCashExemption(province, input.exemption);
    if (!def) {
      // Accorder une exception qui n'existe pas dans le régime applicable serait
      // pire que l'absence de contrôle : le système validerait l'illicite.
      return {
        status: "REFUSED",
        code: "EXEMPTION_NOT_AVAILABLE_IN_PROVINCE",
        reference: scope.reference,
        aggregateCad,
        messageFr: `L'exception « ${input.exemption} » n'existe pas dans le régime applicable à ce cabinet.`,
        remedyFr: `Exceptions admises : ${getCashExemptions(province)
          .map((e) => e.labelFr)
          .join(" · ")}.`,
      };
    }
    return { status: "OK", reason: "exempt", reference: def.reference };
  }

  return {
    status: "REFUSED",
    code: "CASH_THRESHOLD_EXCEEDED",
    reference: scope.reference,
    aggregateCad,
    messageFr: `Le cumul des espèces reçues pour ce dossier atteindrait ${aggregateCad.toFixed(2)} $, soit le seuil de ${CASH_THRESHOLD_CAD} $ ou plus.`,
    remedyFr:
      "Demandez un autre mode de paiement, ou invoquez l'exception applicable en la justifiant.",
  };
}

/* ════════════════════════════════════════════════════════════════
   REÇU — art. 70 QC / s. 19(1) ON
   ════════════════════════════════════════════════════════════════ */

export interface CashReceiptField {
  key: string;
  labelFr: string;
  reference: string;
  required: boolean;
}

/**
 * Champs du reçu d'espèces.
 *
 * **Aucun seuil.** L'art. 70 vise « une somme en espèces », sans montant minimal, et
 * la s. 19(1) vise « every licensee who receives cash ». Un reçu est donc exigé pour
 * 50 $ comme pour 50 000 $.
 *
 * La signature du payeur est exigée par les deux textes, mais la s. 19(2) ontarienne
 * prévoit qu'elle peut manquer si le titulaire a fait des efforts raisonnables pour
 * l'obtenir. B-1 r.5 ne prévoit pas cette souplesse.
 */
export function getCashReceiptFields(province: CabinetProvince): CashReceiptField[] {
  const qc = province === "QC";
  return [
    { key: "date", labelFr: "Date de réception de la somme", reference: qc ? "art. 70(1)" : "s. 19(1)", required: true },
    { key: "payerName", labelFr: "Nom de la personne de qui la somme provient", reference: qc ? "art. 70(2)" : "s. 19(1)", required: true },
    { key: "amount", labelFr: "Somme reçue", reference: qc ? "art. 70(3)" : "s. 19(1)", required: true },
    { key: "clientName", labelFr: "Nom du client pour qui la somme est reçue", reference: qc ? "art. 70(4)" : "s. 19(1)", required: true },
    { key: "dossierRef", labelFr: "Numéro ou désignation du dossier", reference: qc ? "art. 70(5)" : "s. 19(1)", required: true },
    {
      key: "purpose",
      labelFr: "Objet pour lequel la somme est reçue",
      // La s. 19(1) ontarienne n'exige PAS l'objet sur le reçu, contrairement à
      // l'art. 70(6). L'exiger en Ontario ajouterait au règlement.
      reference: qc ? "art. 70(6)" : "—",
      required: qc,
    },
    { key: "licenseeSignature", labelFr: "Signature de l'avocat ou de la personne autorisée", reference: qc ? "art. 70 al. 2" : "s. 19(1)", required: true },
    { key: "payerSignature", labelFr: "Signature de la personne de qui provient la somme", reference: qc ? "art. 70 al. 2" : "s. 19(1)", required: true },
  ];
}

/** La signature du payeur peut-elle manquer si des efforts raisonnables ont été faits ? */
export function payerSignatureMayBeWaived(province: CabinetProvince): {
  allowed: boolean;
  reference: string;
  noteFr: string;
} {
  if (province === "ON") {
    return {
      allowed: true,
      reference: "By-Law 9, s. 19(2)",
      noteFr:
        "Le titulaire ne contrevient pas à la s. 19(1) si la signature du payeur manque, pourvu qu'il ait fait des efforts raisonnables pour l'obtenir. L'effort doit être documenté.",
    };
  }
  return {
    allowed: false,
    reference: "B-1 r.5, art. 70 al. 2",
    noteFr:
      "B-1 r.5 ne prévoit aucune dispense de signature. Le reçu doit être signé par l'avocat ET par la personne de qui provient la somme.",
  };
}

/* ════════════════════════════════════════════════════════════════
   DÉCLARATION — art. 71 QC, sans équivalent ontarien
   ════════════════════════════════════════════════════════════════ */

export const QC_DECLARATION_DEADLINE_DAYS = 30;

export interface CashDeclarationDuty {
  required: boolean;
  dueAt: Date | null;
  reference: string;
  recipientFr: string | null;
  contentsFr: string[];
  noteFr: string;
}

/**
 * Déclaration au directeur de l'inspection professionnelle.
 *
 * Art. 71 QC : l'avocat qui reçoit une somme en espèces de 7 500 $ ou plus doit, dans
 * les 30 jours de sa réception, transmettre au directeur de l'inspection
 * professionnelle **une copie du reçu** et **une déclaration signée** indiquant la
 * somme reçue avec, dans chaque cas, une mention du fondement : honoraires gagnés,
 * débours engagés, ou le cas de l'art. 69 invoqué.
 *
 * **By-Law 9 ne comporte aucune obligation équivalente.** En Ontario, la règle est
 * l'interdiction pure de la s. 4(1) assortie des exceptions de la s. 6 : rien à
 * déclarer. Créer une déclaration ontarienne inventerait une obligation.
 */
export function getCashDeclarationDuty(params: {
  province: CabinetProvince;
  amountCad: number;
  receivedAt: Date;
}): CashDeclarationDuty {
  if (params.province !== "QC") {
    return {
      required: false,
      dueAt: null,
      reference: "By-Law 9, s. 4 à 6",
      recipientFr: null,
      contentsFr: [],
      noteFr:
        "By-Law 9 n'impose aucune déclaration des sommes reçues en espèces. La règle ontarienne est l'interdiction assortie d'exceptions, pas la déclaration.",
    };
  }

  if (params.amountCad < CASH_THRESHOLD_CAD) {
    return {
      required: false,
      dueAt: null,
      reference: "B-1 r.5, art. 71",
      recipientFr: null,
      contentsFr: [],
      noteFr:
        "La déclaration de l'art. 71 ne vise que les sommes de 7 500 $ ou plus. Le reçu de l'art. 70 reste exigé quel que soit le montant.",
    };
  }

  return {
    required: true,
    dueAt: new Date(params.receivedAt.getTime() + QC_DECLARATION_DEADLINE_DAYS * 86_400_000),
    reference: "B-1 r.5, art. 71",
    recipientFr: "Directeur de l'inspection professionnelle du Barreau du Québec",
    contentsFr: [
      "une copie du reçu remis à la personne de qui la somme provient",
      "une déclaration signée par l'avocat indiquant la somme reçue",
      "la mention du fondement : honoraires gagnés, débours engagés, ou le cas de l'art. 69 invoqué",
    ],
    noteFr: "À transmettre dans les 30 jours de la réception de la somme.",
  };
}

/* ════════════════════════════════════════════════════════════════
   REMBOURSEMENT — art. 72 QC / s. 6(e) ON
   ════════════════════════════════════════════════════════════════ */

export interface CashRefundRule {
  mustBeCash: boolean;
  reference: string;
  receiptFieldsFr: string[];
  noteFr: string;
}

/**
 * Comment rembourser une somme reçue en espèces.
 *
 * Art. 72 QC : « Malgré l'article 57, l'avocat qui est tenu de rembourser, en tout ou
 * en partie, une somme de 7 500 $ ou plus qu'il a reçue en espèces, doit effectuer ce
 * remboursement EN ESPÈCES. » Le reçu obtenu du bénéficiaire porte cinq mentions.
 *
 * s. 6(e) ON : l'exception « honoraires, débours, dépenses ou cautionnement » n'est
 * acquise QUE si tout remboursement issu de ces sommes se fait lui aussi en espèces.
 * La condition tient donc à l'EXCEPTION INVOQUÉE, pas au montant.
 *
 * C'est le seul cas où le règlement impose une sortie en espèces, alors que l'art. 57
 * l'interdit par ailleurs. Le flux doit donc être distinct et explicite.
 */
export function getCashRefundRule(params: {
  province: CabinetProvince;
  originalAmountCad: number;
  exemptionInvoked?: string | null;
}): CashRefundRule {
  if (params.province === "QC") {
    const mustBeCash = params.originalAmountCad >= CASH_THRESHOLD_CAD;
    return {
      mustBeCash,
      reference: "B-1 r.5, art. 72",
      receiptFieldsFr: [
        "nom du client",
        "nom de la personne qui reçoit la somme",
        "somme remboursée",
        "date du remboursement",
        "numéro ou désignation du dossier",
      ],
      noteFr: mustBeCash
        ? "Le remboursement doit se faire EN ESPÈCES, par exception à l'art. 57, contre un reçu signé par le bénéficiaire."
        : "Sous 7 500 $, l'art. 72 ne s'applique pas : le remboursement suit les règles ordinaires de l'art. 57.",
    };
  }

  const def = params.exemptionInvoked
    ? getCashExemption("ON", params.exemptionInvoked)
    : undefined;
  const mustBeCash = def?.refundMustBeCash ?? false;
  return {
    mustBeCash,
    reference: "By-Law 9, s. 6(e)",
    receiptFieldsFr: [],
    noteFr: mustBeCash
      ? "L'exception de la s. 6(e) n'est acquise que si tout remboursement issu de cette somme se fait lui aussi en espèces."
      : "Aucune obligation de rembourser en espèces pour cette réception.",
  };
}

/* ════════════════════════════════════════════════════════════════
   CONVERSION — art. 73 QC / s. 4(2) ON
   ════════════════════════════════════════════════════════════════ */

export interface CashConversionRule {
  reference: string;
  /** Date dont le taux doit être retenu. */
  rateDate: Date;
  usedPrecedingBusinessDay: boolean;
  noteFr: string;
}

/**
 * Date du taux de conversion à retenir pour des espèces en devise étrangère.
 *
 * Art. 73 QC : « une somme en espèces étrangères est réputée avoir été reçue à sa
 * valeur en dollars canadiens, au taux de conversion officiel publié au bulletin
 * quotidien des taux de change de la Banque du Canada. Le taux utilisé est celui en
 * vigueur À MIDI le jour de la réception de la somme ou, s'il s'agit d'un jour férié,
 * celui du JOUR OUVRABLE PRÉCÉDENT. »
 *
 * s. 4(2) ON : même mécanique, « the official conversion rate of the Bank of Canada
 * […] in effect at the time the licensee receives or accepts the cash » ou, si jour
 * férié, « the most recent business day preceding ».
 *
 * `isHoliday` est injecté : le calendrier des jours fériés est une donnée, pas une
 * règle de ce module. La s. 1(1) By-Law 9 en donne la liste ontarienne.
 */
export function resolveConversionRateDate(params: {
  province: CabinetProvince;
  receivedAt: Date;
  isHoliday: (d: Date) => boolean;
}): CashConversionRule {
  const reference = params.province === "QC" ? "B-1 r.5, art. 73" : "By-Law 9, s. 4(2)";
  let rateDate = new Date(params.receivedAt);
  let usedPreceding = false;

  // Recul jour par jour jusqu'au dernier jour ouvrable. Borné à 10 itérations : une
  // fermeture de dix jours consécutifs n'existe pas, et une boucle non bornée sur une
  // fonction injectée est un risque inutile.
  let guard = 0;
  while (params.isHoliday(rateDate) && guard < 10) {
    rateDate = new Date(rateDate.getTime() - 86_400_000);
    usedPreceding = true;
    guard += 1;
  }

  return {
    reference,
    rateDate,
    usedPrecedingBusinessDay: usedPreceding,
    noteFr: usedPreceding
      ? "Jour férié à la réception : le taux retenu est celui du jour ouvrable précédent."
      : "Taux de midi de la Banque du Canada en vigueur le jour de la réception.",
  };
}

/** Convertit en dollars canadiens et arrondit au cent. */
export function toCad(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}
