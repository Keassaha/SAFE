/**
 * Exigences de tenue du journal de caisse en fidéicommis.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI, `now` injecté.
 *
 * Sources lues intégralement le 2026-07-30 :
 *   RLRQ c. B-1, r. 5, art. 32, 34, 38, 39, 41, 50, 57, 61 (LegisQuébec, 2026-04-01)
 *   LSO By-Law 9, s. 7(1), 11, 18(1)(2)(10), 22 (PDF officiel, 2017-04-27)
 */

import type { CabinetProvince } from "./rules";

/* ════════════════════════════════════════════════════════════════
   CHAMPS EXIGÉS SUR CHAQUE LIGNE DU JOURNAL
   ════════════════════════════════════════════════════════════════ */

export type TrustEntryDirection = "RECEIPT" | "DISBURSEMENT";

export interface TrustEntryFieldRequirement {
  field: string;
  labelFr: string;
  labelEn: string;
  reference: string;
  /** Le champ est-il exigé par le texte, ou seulement utile ? */
  required: boolean;
}

/**
 * Champs exigés selon le sens de l'écriture.
 *
 * Art. 38(1) — recettes : date, somme, **nom de la personne de qui la somme est
 * reçue**, nom du client, numéro de dossier, **objet**, **indication « espèces »**,
 * **solde après chaque inscription**.
 *
 * Art. 38(2) — débours : date, montant, **nom du bénéficiaire**, nom du client,
 * numéro de dossier, **objet**, **mode de retrait**, **numéro de chèque le cas
 * échéant**, solde après chaque inscription.
 *
 * s. 18(1) ON reprend recettes ; s. 18(2) ON ajoute « the number or a similar
 * identifier of any document used to disburse money ».
 *
 * Les champs déjà portés par SAFE depuis l'origine (date, montant, client, dossier,
 * solde) ne sont pas répétés ici : cette liste sert à détecter ce qui MANQUE.
 */
export function getRequiredEntryFields(
  direction: TrustEntryDirection,
  province: CabinetProvince,
): TrustEntryFieldRequirement[] {
  const qc = province === "QC";

  if (direction === "RECEIPT") {
    return [
      {
        field: "payerName",
        labelFr: "Nom de la personne de qui la somme est reçue",
        labelEn: "Name of the person from whom money is received",
        reference: qc ? "B-1 r.5, art. 38(1)c" : "By-Law 9, s. 18(1)",
        required: true,
      },
      {
        field: "purposeCode",
        labelFr: "Objet pour lequel la somme est reçue",
        labelEn: "Purpose for which money is received",
        reference: qc ? "B-1 r.5, art. 38(1)f" : "By-Law 9, s. 18(1)",
        required: true,
      },
      {
        field: "isCash",
        labelFr: "Indication que la somme a été reçue en espèces",
        labelEn: "Indication that money was received in cash",
        // s. 18(1) ON exige « the method by which money is received », dont les
        // espèces sont un cas. L'art. 38(1)g QC l'isole explicitement.
        reference: qc ? "B-1 r.5, art. 38(1)g" : "By-Law 9, s. 18(1)",
        required: true,
      },
    ];
  }

  return [
    {
      field: "payeeName",
      labelFr: "Nom du bénéficiaire du débours",
      labelEn: "Name of the person to whom money is disbursed",
      reference: qc ? "B-1 r.5, art. 38(2)c" : "By-Law 9, s. 18(2)",
      required: true,
    },
    {
      field: "purposeCode",
      labelFr: "Objet pour lequel le débours est effectué",
      labelEn: "Purpose for which money is disbursed",
      reference: qc ? "B-1 r.5, art. 38(2)f" : "By-Law 9, s. 18(2)",
      required: true,
    },
    {
      field: "modePaiement",
      labelFr: "Mode de retrait",
      labelEn: "Method by which money is disbursed",
      reference: qc ? "B-1 r.5, art. 38(2)g" : "By-Law 9, s. 18(2)",
      required: true,
    },
    {
      field: "chequeNumber",
      labelFr: "Numéro de chèque, le cas échéant",
      labelEn: "Number or similar identifier of the document used",
      reference: qc ? "B-1 r.5, art. 38(2)h" : "By-Law 9, s. 18(2)",
      // « le cas échéant » : exigé seulement quand le débours se fait par chèque.
      required: false,
    },
  ];
}

export interface TrustEntrySnapshot {
  direction: TrustEntryDirection;
  payerName?: string | null;
  payeeName?: string | null;
  purposeCode?: string | null;
  modePaiement?: string | null;
  chequeNumber?: number | null;
  isCash?: boolean;
}

/**
 * Champs réglementaires manquants sur une écriture.
 *
 * PR-8 : ce diagnostic SIGNALE, il ne bloque pas. Une écriture incomplète reste
 * enregistrée — refuser un dépôt parce que le payeur n'est pas saisi pousserait
 * l'utilisateur à écrire « client » dans la case, ce qui est pire qu'un champ vide
 * clairement signalé. Le manquement remonte au rapport mensuel, où il devient visible.
 */
export function findMissingEntryFields(
  entry: TrustEntrySnapshot,
  province: CabinetProvince,
): TrustEntryFieldRequirement[] {
  const required = getRequiredEntryFields(entry.direction, province);
  return required.filter((r) => {
    if (!r.required) {
      // Le numéro de chèque n'est exigé QUE si le débours se fait par chèque.
      if (r.field === "chequeNumber") {
        return entry.modePaiement === "CHEQUE" && entry.chequeNumber == null;
      }
      return false;
    }
    switch (r.field) {
      case "payerName":
        return !entry.payerName?.trim();
      case "payeeName":
        return !entry.payeeName?.trim();
      case "purposeCode":
        return !entry.purposeCode;
      case "modePaiement":
        return !entry.modePaiement;
      // `isCash` est un booléen : il est toujours renseigné. Il figure dans la liste
      // des exigences pour documenter l'article, pas pour être détecté manquant.
      case "isCash":
        return false;
      default:
        return false;
    }
  });
}

/* ════════════════════════════════════════════════════════════════
   BÉNÉFICIAIRE D'UN CHÈQUE — art. 57 al. 2 QC / s. 11(a) ON
   ════════════════════════════════════════════════════════════════ */

/**
 * Bénéficiaires interdits.
 *
 * Art. 57 al. 2 : les chèques « ne peuvent être payables au porteur, à l'ordre de
 * "caisse", de "cash" ou être faits en blanc ».
 * s. 11(a) : « shall not be made payable either to cash or to bearer ».
 */
const FORBIDDEN_PAYEES = ["cash", "caisse", "bearer", "porteur", "au porteur", "comptant"];

export interface PayeeCheckResult {
  valid: boolean;
  code?: "PAYEE_BLANK" | "PAYEE_TO_CASH_OR_BEARER";
  reference: string;
  messageFr?: string;
  messageEn?: string;
}

/** Le bénéficiaire d'un chèque est-il admissible ? */
export function checkChequePayee(
  payeeName: string | null | undefined,
  province: CabinetProvince,
): PayeeCheckResult {
  const reference = province === "QC" ? "B-1 r.5, art. 57 al. 2" : "By-Law 9, s. 11(a)";
  const raw = (payeeName ?? "").trim();

  if (!raw) {
    return {
      valid: false,
      code: "PAYEE_BLANK",
      reference,
      messageFr: "Un chèque en fidéicommis ne peut pas être fait en blanc.",
      messageEn: "A trust cheque cannot be left blank.",
    };
  }

  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim();

  if (FORBIDDEN_PAYEES.includes(normalized)) {
    return {
      valid: false,
      code: "PAYEE_TO_CASH_OR_BEARER",
      reference,
      messageFr:
        "Un chèque en fidéicommis ne peut pas être payable au porteur ni à l'ordre de « caisse » ou « cash ».",
      messageEn: "A trust cheque cannot be made payable to cash or to bearer.",
    };
  }

  return { valid: true, reference };
}

/* ════════════════════════════════════════════════════════════════
   SÉQUENCE DES CHÈQUES — art. 61 QC
   ════════════════════════════════════════════════════════════════ */

/**
 * Trous dans la numérotation des chèques.
 *
 * Art. 61 : les chèques « doivent être numérotés consécutivement ». Un trou n'est pas
 * nécessairement une faute — un chèque peut être détruit à l'impression — mais c'est
 * exactement ce qu'un inspecteur cherche, et le cabinet doit pouvoir l'expliquer. Un
 * chèque ANNULÉ compte dans la séquence : c'est pour cela qu'on le conserve.
 *
 * Fonction pure : reçoit les numéros connus, renvoie les manquants.
 */
export function findChequeSequenceGaps(numbers: number[]): number[] {
  if (numbers.length < 2) return [];
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    for (let n = sorted[i - 1]! + 1; n < sorted[i]!; n++) gaps.push(n);
  }
  return gaps;
}

/**
 * Un chèque en circulation depuis plus de six mois est signalé.
 *
 * Aucun des deux règlements ne fixe ce seuil : il vient de la pratique bancaire
 * canadienne, où un chèque devient généralement périmé après six mois. Le signaler
 * sert l'art. 41(2) (liste des chèques en circulation) et alerte sur des fonds
 * possiblement non réclamés. **Ce n'est pas une règle du Barreau**, et c'est dit ici
 * pour que personne ne la cite comme telle.
 */
export const STALE_CHEQUE_DAYS = 180;

export function isChequeStale(issueDate: Date, now: Date): boolean {
  return (now.getTime() - issueDate.getTime()) / 86_400_000 > STALE_CHEQUE_DAYS;
}

/* ════════════════════════════════════════════════════════════════
   PIÈCES JUSTIFICATIVES ATTENDUES — art. 32 QC / s. 18(10) ON
   ════════════════════════════════════════════════════════════════ */

export type SupportingDocumentRole =
  | "CHEQUE_RECU"
  | "BORDEREAU_DEPOT"
  | "CHEQUE_COMPENSE"
  | "CONFIRMATION_VIREMENT"
  | "RECU_ESPECES"
  | "RELEVE_BANCAIRE"
  | "AUTRE";

export interface ExpectedDocument {
  role: SupportingDocumentRole;
  labelFr: string;
  labelEn: string;
  reference: string;
}

/**
 * Pièces attendues selon le sens de l'écriture et le mode de paiement.
 *
 * Art. 32 énumère nommément : les copies de reçus émis, les relevés d'institutions
 * financières, les copies de chèques compensés, les bordereaux de dépôt détaillés,
 * les documents confirmant les virements électroniques, et « une copie de tout chèque
 * ou autre ordre de paiement reçu en fidéicommis ».
 *
 * s. 18(10) : « Bank statements or pass books, cashed cheques and detailed duplicate
 * deposit slips for all trust and general accounts. »
 */
export function getExpectedDocuments(
  direction: TrustEntryDirection,
  modePaiement: string | null | undefined,
  province: CabinetProvince,
): ExpectedDocument[] {
  const qc = province === "QC";
  const out: ExpectedDocument[] = [];

  if (direction === "RECEIPT") {
    if (modePaiement === "CHEQUE") {
      out.push({
        role: "CHEQUE_RECU",
        labelFr: "Copie du chèque reçu en fidéicommis",
        labelEn: "Copy of the cheque received in trust",
        // L'art. 32(2) est explicite et n'a pas d'équivalent aussi net en Ontario.
        reference: qc ? "B-1 r.5, art. 32(2)" : "By-Law 9, s. 18(10)",
      });
      out.push({
        role: "BORDEREAU_DEPOT",
        labelFr: "Bordereau de dépôt détaillé",
        labelEn: "Detailed duplicate deposit slip",
        reference: qc ? "B-1 r.5, art. 32(3)" : "By-Law 9, s. 18(10)",
      });
    }
    if (modePaiement === "VIREMENT" || modePaiement === "INTERAC") {
      out.push({
        role: "CONFIRMATION_VIREMENT",
        labelFr: "Document confirmant l'opération par virement électronique",
        labelEn: "Document confirming the electronic transfer",
        reference: qc ? "B-1 r.5, art. 32(3)" : "By-Law 9, s. 18(11)",
      });
    }
    if (modePaiement === "ESPECES") {
      out.push({
        role: "RECU_ESPECES",
        labelFr: "Reçu d'espèces signé par les deux parties",
        labelEn: "Duplicate cash receipt signed by both parties",
        // Art. 70 QC : reçu exigé pour TOUTE somme en espèces, sans seuil.
        reference: qc ? "B-1 r.5, art. 70" : "By-Law 9, s. 19(1)",
      });
    }
    return out;
  }

  if (modePaiement === "CHEQUE") {
    out.push({
      role: "CHEQUE_COMPENSE",
      labelFr: "Copie du chèque compensé",
      labelEn: "Cashed cheque",
      reference: qc ? "B-1 r.5, art. 32(3)" : "By-Law 9, s. 18(10)",
    });
  }
  if (modePaiement === "VIREMENT" || modePaiement === "INTERAC") {
    out.push({
      role: "CONFIRMATION_VIREMENT",
      labelFr: "Confirmation du virement électronique",
      labelEn: "Confirmation of the electronic transfer",
      reference: qc ? "B-1 r.5, art. 32(3)" : "By-Law 9, s. 18(11)",
    });
  }
  return out;
}

/** Pièces attendues et non fournies. Signale, ne bloque pas (PR-8). */
export function findMissingDocuments(
  expected: ExpectedDocument[],
  attachedRoles: SupportingDocumentRole[],
): ExpectedDocument[] {
  const present = new Set(attachedRoles);
  return expected.filter((e) => !present.has(e.role));
}

/* ════════════════════════════════════════════════════════════════
   DÉLAI DE DÉPÔT — art. 50 QC / s. 7(1) ON
   ════════════════════════════════════════════════════════════════ */

export interface DepositDelayVerdict {
  /** Nombre de jours entiers entre la réception et le dépôt. */
  days: number | null;
  late: boolean;
  reference: string;
  /** Explication, jamais un seuil inventé. */
  noteFr: string;
  noteEn: string;
}

/**
 * Le dépôt a-t-il eu lieu dans les délais ?
 *
 * Art. 50 QC : « sans délai après réception d'argent en fidéicommis ».
 * s. 7(1) ON : « shall IMMEDIATELY pay the money into » un compte en fiducie.
 *
 * **Aucun des deux textes ne chiffre un nombre de jours.** On ne peut donc pas
 * déclarer un dépôt « non conforme » à J+2 : ce serait inventer une règle. Ce qui est
 * fait ici : mesurer l'écart, et le signaler dès qu'il dépasse un jour ouvrable, en
 * disant explicitement que le seuil est un repère et non un délai réglementaire.
 *
 * La présomption de la s. 1(3) By-Law 9 (fonds réputés en fiducie s'ils sont déposés
 * au plus tard le jour bancaire suivant) ne vaut QUE pour les s. 9(1)(2)(3) et 14.
 * Elle ne crée pas un délai de dépôt général, contrairement à ce que le registre
 * interne affirmait avant correction.
 */
export function evaluateDepositDelay(params: {
  receivedAt: Date | null | undefined;
  depositedAt: Date | null | undefined;
  province: CabinetProvince;
}): DepositDelayVerdict {
  const qc = params.province === "QC";
  const reference = qc ? "B-1 r.5, art. 50" : "By-Law 9, s. 7(1)";
  const noteFr = qc
    ? "Le règlement exige un dépôt « sans délai », sans chiffrer de nombre de jours. Ce repère signale un écart à vérifier, il ne constate pas une infraction."
    : "Le règlement exige un dépôt « immediately », sans chiffrer de nombre de jours. Ce repère signale un écart à vérifier.";
  const noteEn = qc
    ? 'The regulation requires deposit "without delay" and sets no number of days. This marker flags a gap to review; it does not establish a breach.'
    : 'The by-law requires deposit "immediately" and sets no number of days. This marker flags a gap to review.';

  if (!params.receivedAt || !params.depositedAt) {
    return { days: null, late: false, reference, noteFr, noteEn };
  }

  const days = Math.floor(
    (params.depositedAt.getTime() - params.receivedAt.getTime()) / 86_400_000,
  );
  return { days, late: days > 1, reference, noteFr, noteEn };
}
