/**
 * Virements électroniques depuis un compte en fidéicommis, et pouvoir de signature.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI, `now` injecté.
 *
 * Sources lues intégralement le 2026-07-30 :
 *   LSO By-Law 9, s. 10, 11, 12, 18(4), 18(11), 19.1 (PDF officiel, 2017-04-27)
 *   RLRQ c. B-1, r. 5, art. 56, 57, 58 (LegisQuébec, à jour au 2026-04-01)
 *
 * ⚠️ RÉGIME ASYMÉTRIQUE — le point le plus important de ce module.
 *
 * La s. 12 By-Law 9 impose un appareil complet : double contrôle à deux mots de
 * passe, réquisition signée AVANT toute saisie sur formulaire prescrit (Form 9A),
 * confirmation de l'institution portant six éléments, contresignature datée le jour
 * bancaire suivant, conservation dix ans.
 *
 * **B-1 r.5 n'a AUCUN équivalent.** L'art. 58 permet le retrait d'honoraires « par
 * virement à un compte qui n'est pas un compte en fidéicommis, ouvert au nom de
 * l'avocat », sans réquisition, sans double contrôle, sans formulaire. Imposer le
 * Form 9A à un cabinet québécois inventerait une obligation — faute aussi grave que
 * d'en omettre une. Toutes les fonctions de ce module sont donc province-gated.
 */

import type { CabinetProvince } from "./rules";

/* ════════════════════════════════════════════════════════════════
   APPLICABILITÉ
   ════════════════════════════════════════════════════════════════ */

export interface TransferRegime {
  /** L'appareil de la s. 12 s'applique-t-il ? */
  applies: boolean;
  reference: string;
  noteFr: string;
}

/** Le régime des virements électroniques de la s. 12 s'applique-t-il à ce cabinet ? */
export function electronicTransferRegime(province: CabinetProvince): TransferRegime {
  if (province === "ON") {
    return {
      applies: true,
      reference: "By-Law 9, s. 12",
      noteFr:
        "Tout virement électronique depuis un compte en fiducie exige une réquisition signée sur Form 9A, un double contrôle, une confirmation de l'institution et une contresignature le jour bancaire suivant.",
    };
  }
  return {
    applies: false,
    reference: "B-1 r.5, art. 58",
    noteFr:
      "Le régime québécois ne prévoit ni réquisition, ni double contrôle, ni formulaire prescrit pour les virements. L'art. 58 exige seulement que le virement aille vers un compte non fiduciaire ouvert au nom de l'avocat.",
  };
}

/* ════════════════════════════════════════════════════════════════
   MODES DE RETRAIT ADMIS — s. 10 ON / art. 58 QC
   ════════════════════════════════════════════════════════════════ */

export type WithdrawalMethod = "CHEQUE_TO_LICENSEE" | "TRANSFER_TO_NON_TRUST" | "ELECTRONIC_TRANSFER";

export interface WithdrawalMethodRule {
  methods: WithdrawalMethod[];
  reference: string;
  noteFr: string;
}

/**
 * Modes admis pour un retrait d'honoraires ou de remboursement de débours.
 *
 * s. 10 ON : uniquement (a) chèque à l'ordre du titulaire, (b) virement vers un
 * compte bancaire au nom du titulaire qui n'est pas un compte en fiducie, ou
 * (c) virement électronique.
 *
 * art. 58 QC : « seulement par chèque tiré à l'ordre de l'avocat ou par virement à un
 * compte qui n'est pas un compte en fidéicommis, ouvert au nom de l'avocat ou au nom
 * de la société au sein de laquelle il exerce ».
 *
 * Les deux listes sont limitatives. Elles se recoupent presque, mais l'énumération
 * ontarienne isole le virement électronique comme mode distinct, ce qui déclenche
 * l'appareil de la s. 12.
 */
export function getPermittedWithdrawalMethods(province: CabinetProvince): WithdrawalMethodRule {
  if (province === "ON") {
    return {
      methods: ["CHEQUE_TO_LICENSEE", "TRANSFER_TO_NON_TRUST", "ELECTRONIC_TRANSFER"],
      reference: "By-Law 9, s. 10",
      noteFr:
        "Le virement électronique est un mode distinct, soumis à l'appareil de la s. 12.",
    };
  }
  return {
    methods: ["CHEQUE_TO_LICENSEE", "TRANSFER_TO_NON_TRUST"],
    reference: "B-1 r.5, art. 58",
    noteFr:
      "Le compte destinataire doit être ouvert au nom de l'avocat ou de sa société, et ne doit pas être un compte en fidéicommis.",
  };
}

/* ════════════════════════════════════════════════════════════════
   DOUBLE CONTRÔLE — s. 12(2)1, avec l'exemption de la s. 12(3)
   ════════════════════════════════════════════════════════════════ */

export interface DualControlInput {
  /** Personne ayant saisi les données décrivant le virement. */
  dataEnteredByUserId: string | null;
  /** Personne ayant autorisé l'institution à l'exécuter. */
  authorizedByUserId: string | null;
  /**
   * Le cabinet est-il un praticien VÉRITABLEMENT seul au sens de la s. 12(3) ?
   * Le texte est exigeant : « without another licensee as a partner […] without
   * another licensee practising law […] and WITHOUT ANOTHER LICENSEE OR PERSON AS AN
   * EMPLOYEE ». Un avocat avec une adjointe n'est PAS un praticien seul au sens de
   * cette exemption.
   */
  isSolePractitioner: boolean;
}

export type DualControlVerdict =
  | { status: "OK"; reason: "dual_control" | "sole_practitioner_exemption"; reference: string }
  | {
      status: "REFUSED";
      code: "DUAL_CONTROL_REQUIRED" | "SAME_PERSON_BOTH_STEPS";
      reference: string;
      messageFr: string;
      remedyFr: string;
    };

/**
 * Le double contrôle est-il satisfait ?
 *
 * s. 12(2)1 : le système ne doit pas permettre un virement à moins que (i) une
 * personne, avec un mot de passe, saisisse les données décrivant le virement, et
 * (ii) **une autre personne**, avec **un autre** mot de passe, saisisse les données
 * autorisant l'institution à l'exécuter.
 *
 * s. 12(3) : ce paragraphe ne s'applique pas au praticien seul qui saisit lui-même
 * les deux jeux de données.
 */
export function evaluateDualControl(input: DualControlInput): DualControlVerdict {
  const reference = "By-Law 9, s. 12(2)1";

  if (!input.dataEnteredByUserId || !input.authorizedByUserId) {
    return {
      status: "REFUSED",
      code: "DUAL_CONTROL_REQUIRED",
      reference,
      messageFr: "Le virement doit être saisi puis autorisé, en deux étapes distinctes.",
      remedyFr:
        "Une personne saisit les données du virement, une autre autorise l'institution à l'exécuter.",
    };
  }

  if (input.dataEnteredByUserId === input.authorizedByUserId) {
    if (input.isSolePractitioner) {
      // La s. 12(3) dispense le praticien seul, et lui seul. L'exemption est
      // journalisée comme telle : à l'inspection, elle doit être assumée.
      return { status: "OK", reason: "sole_practitioner_exemption", reference: "By-Law 9, s. 12(3)" };
    }
    return {
      status: "REFUSED",
      code: "SAME_PERSON_BOTH_STEPS",
      reference,
      messageFr: "La même personne a saisi et autorisé le virement.",
      remedyFr:
        "La saisie et l'autorisation doivent être faites par deux personnes distinctes, avec deux mots de passe distincts. Seul le praticien véritablement seul en est dispensé (s. 12(3)).",
    };
  }

  return { status: "OK", reason: "dual_control", reference };
}

/* ════════════════════════════════════════════════════════════════
   CONFIRMATION DE L'INSTITUTION — s. 12(2)2 et 12(2)3
   ════════════════════════════════════════════════════════════════ */

export interface ConfirmationField {
  key: string;
  labelFr: string;
  reference: string;
}

/**
 * Les six éléments que la confirmation doit porter.
 *
 * s. 12(2)3 : (i) numéro du compte en fiducie d'où les fonds sont tirés, (ii) nom,
 * nom de succursale et adresse de l'institution où le compte destinataire est tenu,
 * (iii) nom de la personne ou entité au nom de qui le compte destinataire est tenu,
 * (iv) numéro du compte destinataire, (v) date et heure de réception des données par
 * l'institution, (vi) date et heure d'envoi de la confirmation au titulaire.
 */
export function getConfirmationFields(): ConfirmationField[] {
  return [
    { key: "sourceAccountNumber", labelFr: "Numéro du compte en fiducie d'où les fonds sont tirés", reference: "s. 12(2)3i" },
    { key: "recipientInstitution", labelFr: "Nom, succursale et adresse de l'institution destinataire", reference: "s. 12(2)3ii" },
    { key: "recipientName", labelFr: "Nom du titulaire du compte destinataire", reference: "s. 12(2)3iii" },
    { key: "recipientAccountNumber", labelFr: "Numéro du compte destinataire", reference: "s. 12(2)3iv" },
    { key: "institutionReceivedAt", labelFr: "Date et heure de réception des données par l'institution", reference: "s. 12(2)3v" },
    { key: "confirmationSentAt", labelFr: "Date et heure d'envoi de la confirmation au titulaire", reference: "s. 12(2)3vi" },
  ];
}

/** Éléments manquants sur une confirmation. Signale, ne bloque pas la réception. */
export function findMissingConfirmationFields(
  confirmation: Record<string, unknown>,
): ConfirmationField[] {
  return getConfirmationFields().filter((f) => {
    const v = confirmation[f.key];
    return v === null || v === undefined || (typeof v === "string" && !v.trim());
  });
}

/* ════════════════════════════════════════════════════════════════
   ORDRE CHRONOLOGIQUE — s. 12(2)4
   ════════════════════════════════════════════════════════════════ */

export type RequisitionOrderVerdict =
  | { status: "OK" }
  | {
      status: "REFUSED";
      code: "REQUISITION_NOT_SIGNED" | "REQUISITION_SIGNED_AFTER_ENTRY";
      reference: string;
      messageFr: string;
      remedyFr: string;
    };

/**
 * La réquisition a-t-elle été signée AVANT la saisie ?
 *
 * s. 12(2)4 : « **BEFORE** any data describing the details of the transfer or
 * authorizing the financial institution to carry out the transfer is entered into
 * the electronic trust transfer system, an electronic trust transfer requisition
 * must be signed. »
 *
 * L'ordre est la substance de la règle, pas une formalité : une réquisition signée
 * après coup ne vérifie rien, elle régularise. Vérifier seulement l'existence de la
 * réquisition laisserait passer exactement ce que la s. 12(2)4 veut empêcher.
 */
export function evaluateRequisitionOrder(params: {
  signedAt: Date | null | undefined;
  dataEnteredAt: Date | null | undefined;
}): RequisitionOrderVerdict {
  const reference = "By-Law 9, s. 12(2)4";

  if (!params.signedAt) {
    return {
      status: "REFUSED",
      code: "REQUISITION_NOT_SIGNED",
      reference,
      messageFr: "Aucune réquisition de virement signée.",
      remedyFr:
        "Faites signer la réquisition (Form 9A) par un titulaire avant toute saisie dans le système de virement.",
    };
  }

  if (params.dataEnteredAt && params.signedAt.getTime() > params.dataEnteredAt.getTime()) {
    return {
      status: "REFUSED",
      code: "REQUISITION_SIGNED_AFTER_ENTRY",
      reference,
      messageFr: "La réquisition a été signée APRÈS la saisie du virement.",
      remedyFr:
        "La s. 12(2)4 exige que la réquisition soit signée avant la saisie. Une signature postérieure régularise, elle ne vérifie pas.",
    };
  }

  return { status: "OK" };
}

/* ════════════════════════════════════════════════════════════════
   CONTRESIGNATURE — s. 12(5)
   ════════════════════════════════════════════════════════════════ */

export interface CountersignatureDuty {
  /** Échéance : clôture du jour bancaire suivant l'envoi de la confirmation. */
  dueAt: Date;
  steps: Array<{ key: string; labelFr: string; reference: string }>;
  reference: string;
}

/**
 * Ce qui doit être fait dans le jour bancaire suivant la confirmation.
 *
 * s. 12(5) : au plus tard à la clôture du jour bancaire suivant l'envoi de la
 * confirmation, le titulaire doit (a) en produire une copie imprimée, (b) la
 * comparer à la réquisition signée pour vérifier que les fonds ont été tirés comme
 * spécifié, (c) y indiquer le nom du client, l'objet du dossier et le numéro de
 * dossier, puis (d) la signer et la dater.
 *
 * `isBankingDay` est injecté : le calendrier bancaire est une donnée. La s. 1(1)
 * donne la liste des jours fériés ontariens.
 */
export function getCountersignatureDuty(params: {
  confirmationSentAt: Date;
  isBankingDay?: (d: Date) => boolean;
}): CountersignatureDuty {
  const isBankingDay = params.isBankingDay ?? (() => true);

  // Le jour bancaire SUIVANT : on avance d'au moins un jour, puis on saute les jours
  // non bancaires. Borné, comme partout où une fonction injectée pilote une boucle.
  let dueAt = new Date(params.confirmationSentAt.getTime() + 86_400_000);
  let guard = 0;
  while (!isBankingDay(dueAt) && guard < 10) {
    dueAt = new Date(dueAt.getTime() + 86_400_000);
    guard += 1;
  }

  return {
    dueAt,
    reference: "By-Law 9, s. 12(5)",
    steps: [
      { key: "printed", labelFr: "Produire une copie imprimée de la confirmation", reference: "s. 12(5)(a)" },
      { key: "compared", labelFr: "Comparer la copie à la réquisition signée", reference: "s. 12(5)(b)" },
      { key: "annotated", labelFr: "Y indiquer le client, l'objet du dossier et le numéro de dossier", reference: "s. 12(5)(c)" },
      { key: "countersigned", labelFr: "Signer et dater la copie imprimée", reference: "s. 12(5)(d)" },
    ],
  };
}

/* ════════════════════════════════════════════════════════════════
   POUVOIR DE SIGNATURE ET CAUTIONNEMENT — s. 11(b), 12(2)4ii
   ════════════════════════════════════════════════════════════════ */

export interface SignatoryCheckInput {
  isLicensee: boolean;
  hasSigningAuthority: boolean;
  bondAmount: number | null;
  bondExpiryDate: Date | null;
  /** Solde maximal en dépôt durant l'exercice précédent, tous comptes délégués. */
  maxBalancePreviousFiscalYear: number;
  now: Date;
}

export type SignatoryVerdict =
  | { status: "OK"; reason: "licensee" | "bonded_delegate"; reference: string }
  | {
      status: "REFUSED";
      code: "NO_SIGNING_AUTHORITY" | "BOND_MISSING" | "BOND_INSUFFICIENT" | "BOND_EXPIRED";
      reference: string;
      messageFr: string;
      remedyFr: string;
    };

/**
 * Cette personne peut-elle signer sur le compte en fiducie ?
 *
 * s. 11(b) : un chèque en fiducie ne peut être signé par une personne qui n'est pas
 * titulaire de permis, « except in exceptional circumstances and except when the
 * person has signing authority on the trust account […] **and is bonded in an amount
 * at least equal to the maximum balance on deposit during the immediately preceding
 * fiscal year** of the licensee in all the trust accounts on which signing authority
 * has been delegated to the person ».
 *
 * La s. 12(2)4ii reprend la même condition pour la signature d'une réquisition de
 * virement.
 *
 * Le montant du cautionnement n'est donc pas un chiffre arbitraire : il se calcule
 * sur le solde maximal de l'exercice précédent.
 */
export function evaluateSignatory(input: SignatoryCheckInput): SignatoryVerdict {
  const reference = "By-Law 9, s. 11(b), 12(2)4ii";

  if (input.isLicensee) {
    return { status: "OK", reason: "licensee", reference: "By-Law 9, s. 11(b)" };
  }

  if (!input.hasSigningAuthority) {
    return {
      status: "REFUSED",
      code: "NO_SIGNING_AUTHORITY",
      reference,
      messageFr: "Cette personne n'a pas de pouvoir de signature sur le compte en fiducie.",
      remedyFr: "Faites signer par un titulaire de permis, ou accordez le pouvoir de signature et le cautionnement requis.",
    };
  }

  if (input.bondAmount === null || input.bondAmount <= 0) {
    return {
      status: "REFUSED",
      code: "BOND_MISSING",
      reference,
      messageFr: "Une personne qui n'est pas titulaire de permis doit être cautionnée.",
      remedyFr: `Le cautionnement doit être au moins égal au solde maximal en dépôt de l'exercice précédent, soit ${input.maxBalancePreviousFiscalYear.toFixed(2)} $.`,
    };
  }

  if (input.bondExpiryDate && input.bondExpiryDate.getTime() < input.now.getTime()) {
    return {
      status: "REFUSED",
      code: "BOND_EXPIRED",
      reference,
      messageFr: `Le cautionnement est échu depuis le ${input.bondExpiryDate.toISOString().slice(0, 10)}.`,
      remedyFr: "Renouvelez le cautionnement avant toute nouvelle signature.",
    };
  }

  if (input.bondAmount < input.maxBalancePreviousFiscalYear) {
    return {
      status: "REFUSED",
      code: "BOND_INSUFFICIENT",
      reference,
      messageFr: `Cautionnement de ${input.bondAmount.toFixed(2)} $ inférieur au solde maximal de l'exercice précédent (${input.maxBalancePreviousFiscalYear.toFixed(2)} $).`,
      remedyFr: "Portez le cautionnement au moins au niveau de ce solde maximal.",
    };
  }

  return { status: "OK", reason: "bonded_delegate", reference };
}

/* ════════════════════════════════════════════════════════════════
   TRANSFERTS ENTRE CARTES-CLIENTS — s. 18(4) ON / art. 56(3) QC
   ════════════════════════════════════════════════════════════════ */

export interface LedgerTransferRule {
  permitted: boolean;
  purposeRequired: boolean;
  reference: string;
  noteFr: string;
}

/**
 * Le transfert entre cartes-clients est-il permis, et à quelle condition ?
 *
 * s. 18(4) ON : « A record showing all transfers of money between clients' trust
 * ledger accounts **and explaining the purpose for which each transfer is made**. »
 * Le règlement suppose donc que ces transferts EXISTENT : il en exige le registre.
 *
 * art. 56(3) QC : l'avocat peut retirer du compte général « l'argent qui est
 * transféré directement dans un autre compte en fidéicommis ».
 *
 * SAFE interdisait ces transferts de façon absolue (`validateNoCrossAllocation`).
 * C'est plus strict que les deux règlements, et le sur-blocage a un coût réel : le
 * cabinet contourne par un retrait suivi d'un dépôt, deux opérations qui cassent le
 * lien et rendent le registre de la s. 18(4) impossible à produire. On autorise donc
 * le transfert, en exigeant l'objet que le texte exige.
 */
export function getLedgerTransferRule(province: CabinetProvince): LedgerTransferRule {
  if (province === "ON") {
    return {
      permitted: true,
      purposeRequired: true,
      reference: "By-Law 9, s. 18(4)",
      noteFr:
        "Le registre des transferts entre cartes-clients doit expliquer l'objet de chaque transfert.",
    };
  }
  return {
    permitted: true,
    purposeRequired: true,
    reference: "B-1 r.5, art. 56(3), 39",
    noteFr:
      "Le transfert direct vers un autre compte en fidéicommis est permis. L'objet est exigé aux cartes-clients (art. 39).",
  };
}

/* ════════════════════════════════════════════════════════════════
   STATUT DE PERMIS — s. 2, 2.2, 2.3 ON
   ════════════════════════════════════════════════════════════════ */

export type LicenceStatus = "ACTIVE" | "SUSPENDED" | "BANKRUPT" | "REVOKED" | "RETIRED";

export interface LicenceHandlingVerdict {
  mayHandleTrustFunds: boolean;
  reference: string;
  messageFr: string;
  /** Échéance de retrait des comptes, le cas échéant (s. 2.3(1) : 30 jours). */
  withdrawalDueAt: Date | null;
}

/**
 * Un titulaire failli ou suspendu peut-il manier des fonds en fiducie ?
 *
 * s. 2(1) : le titulaire failli ne peut recevoir de fonds ni autrement manier des
 * fonds détenus en fiducie. s. 2(2) : il peut néanmoins recevoir le paiement de ses
 * honoraires et le remboursement de dépenses.
 * s. 2.2 : mêmes règles pour le titulaire suspendu.
 * s. 2.3(1) : le titulaire suspendu doit, **dans les 30 jours** du début de la
 * suspension, retirer les fonds de tout compte en fiducie tenu à son nom.
 *
 * B-1 r.5 traite la cessation d'exercice aux art. 74 à 82, avec une logique
 * différente : cession des dossiers, livres et registres à un avocat en exercice, et
 * prise de possession par le syndic. Il n'y a pas d'équivalent au délai de 30 jours.
 */
export function evaluateLicenceHandling(params: {
  province: CabinetProvince;
  status: LicenceStatus;
  suspendedFrom?: Date | null;
}): LicenceHandlingVerdict {
  if (params.status === "ACTIVE") {
    return {
      mayHandleTrustFunds: true,
      reference: params.province === "ON" ? "By-Law 9, s. 2, 2.2" : "B-1 r.5, art. 35",
      messageFr: "Permis actif.",
      withdrawalDueAt: null,
    };
  }

  if (params.province !== "ON") {
    return {
      mayHandleTrustFunds: false,
      reference: "B-1 r.5, art. 74 à 82",
      messageFr:
        "Cessation d'exercice : les dossiers, livres et registres doivent être cédés à un avocat en exercice, ou le syndic en prend possession.",
      withdrawalDueAt: null,
    };
  }

  const withdrawalDueAt =
    params.status === "SUSPENDED" && params.suspendedFrom
      ? new Date(params.suspendedFrom.getTime() + 30 * 86_400_000)
      : null;

  return {
    mayHandleTrustFunds: false,
    reference: params.status === "BANKRUPT" ? "By-Law 9, s. 2(1)" : "By-Law 9, s. 2.2, 2.3",
    messageFr:
      params.status === "BANKRUPT"
        ? "Un titulaire failli ne peut pas manier de fonds détenus en fiducie. Il peut néanmoins recevoir le paiement de ses honoraires et le remboursement de dépenses (s. 2(2))."
        : "Un titulaire suspendu ne peut pas manier de fonds détenus en fiducie, et doit retirer les fonds de ses comptes en fiducie dans les 30 jours (s. 2.3(1)).",
    withdrawalDueAt,
  };
}
