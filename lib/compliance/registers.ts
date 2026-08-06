/**
 * Définition des registres réglementaires.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI.
 *
 * L'obligation qui commande ce chantier n'est pas de « tenir » les registres — SAFE
 * les tient déjà en base — mais de pouvoir en **produire une copie sur demande** :
 *
 *   art. 30 B-1 r.5 : « Les livres et registres doivent être tenus lisiblement, de
 *   façon permanente, sur support papier ou faisant appel aux technologies de
 *   l'information POURVU QUE DES COPIES PUISSENT EN ÊTRE TIRÉES IMMÉDIATEMENT, EN
 *   TOUT TEMPS. »
 *
 *   s. 21(2) By-Law 9 : « If a financial record is entered and posted by mechanical
 *   or electronic means, a licensee shall ensure that A PAPER COPY of the record may
 *   be PRODUCED PROMPTLY on the Society's request. »
 *
 * Une base de données n'est pas un registre tant qu'on ne peut pas l'imprimer. C'est
 * ce que ce module rend possible : chaque registre déclare ses colonnes et l'article
 * qui les exige, et le moteur de rendu s'en sert pour produire une sortie identique
 * à l'écran, en CSV et à l'impression.
 *
 * Sources lues intégralement le 2026-07-30 :
 *   RLRQ c. B-1, r. 5, art. 9, 30, 34, 38, 39, 61, 66 (LegisQuébec, 2026-04-01)
 *   LSO By-Law 9, s. 18(1)(2)(3)(5)(6)(7), 21 (PDF officiel, 2017-04-27)
 */

import type { CabinetProvince } from "./rules";

export type RegisterId =
  | "TRUST_CASH_JOURNAL"
  | "CLIENT_LEDGERS"
  | "PARTICULAR_ACCOUNT_LEDGERS"
  | "CHEQUE_REGISTER"
  | "TRUST_PROPERTY_REGISTER"
  | "ADMIN_CASH_JOURNAL"
  | "FEES_BOOK"
  | "ACTIVE_MATTERS"
  | "CLOSED_MATTERS";

export type ColumnAlign = "left" | "right" | "center";

export interface RegisterColumn {
  key: string;
  labelFr: string;
  labelEn: string;
  align: ColumnAlign;
  /** Article qui exige cette colonne. `null` = colonne de confort, pas réglementaire. */
  reference: string | null;
  /** Colonne monétaire : totalisée en pied de registre. */
  money?: boolean;
}

export interface RegisterDefinition {
  id: RegisterId;
  titleFr: string;
  titleEn: string;
  /** Article qui impose la tenue du registre lui-même. */
  reference: string;
  columns: RegisterColumn[];
  /** Le registre s'applique-t-il dans cette province ? */
  appliesTo: CabinetProvince[];
  /** Note affichée en tête, quand le texte mérite une précision. */
  noteFr?: string;
}

const QC_ONLY: CabinetProvince[] = ["QC"];
const BOTH: CabinetProvince[] = ["QC", "ON"];

/* ════════════════════════════════════════════════════════════════
   LES REGISTRES
   ════════════════════════════════════════════════════════════════ */

function trustCashJournal(province: CabinetProvince): RegisterDefinition {
  const qc = province === "QC";
  return {
    id: "TRUST_CASH_JOURNAL",
    titleFr: "Journal de caisse recettes-déboursés en fidéicommis",
    titleEn: "Trust receipts and disbursements journal",
    reference: qc ? "B-1 r.5, art. 38" : "By-Law 9, s. 18(1), (2)",
    appliesTo: BOTH,
    noteFr: qc
      ? "Inscriptions par ordre chronologique, avec le solde du compte après chaque inscription (art. 38(1)h et (2)i)."
      : "Chronological entries for all trust receipts and disbursements.",
    columns: [
      {
        key: "date",
        labelFr: "Date",
        labelEn: "Date",
        align: "left",
        reference: qc ? "art. 38(1)a, (2)a" : "s. 18(1), (2)",
      },
      {
        key: "payerOrPayee",
        labelFr: "De qui reçue / Bénéficiaire",
        labelEn: "Received from / Paid to",
        align: "left",
        reference: qc ? "art. 38(1)c, (2)c" : "s. 18(1), (2)",
      },
      {
        key: "clientName",
        labelFr: "Client",
        labelEn: "Client",
        align: "left",
        reference: qc ? "art. 38(1)d, (2)d" : "s. 18(1), (2)",
      },
      {
        key: "dossierRef",
        labelFr: "Dossier",
        labelEn: "Matter",
        align: "left",
        reference: qc ? "art. 38(1)e, (2)e" : "s. 18(1), (2)",
      },
      {
        key: "purpose",
        labelFr: "Objet",
        labelEn: "Purpose",
        align: "left",
        reference: qc ? "art. 38(1)f, (2)f" : "s. 18(1), (2)",
      },
      {
        key: "method",
        labelFr: "Mode",
        labelEn: "Method",
        align: "left",
        reference: qc ? "art. 38(2)g" : "s. 18(1), (2)",
      },
      {
        key: "chequeNumber",
        labelFr: "N° chèque",
        labelEn: "Cheque no.",
        align: "right",
        reference: qc ? "art. 38(2)h" : "s. 18(2)",
      },
      {
        key: "cash",
        labelFr: "Espèces",
        labelEn: "Cash",
        align: "center",
        // Art. 38(1)g isole l'indicateur ; la s. 18(1) le couvre via « the method ».
        reference: qc ? "art. 38(1)g" : "s. 18(1)",
      },
      {
        key: "receipt",
        labelFr: "Recette",
        labelEn: "Receipt",
        align: "right",
        reference: qc ? "art. 38(1)b" : "s. 18(1)",
        money: true,
      },
      {
        key: "disbursement",
        labelFr: "Déboursé",
        labelEn: "Disbursement",
        align: "right",
        reference: qc ? "art. 38(2)b" : "s. 18(2)",
        money: true,
      },
      {
        key: "balance",
        labelFr: "Solde",
        labelEn: "Balance",
        align: "right",
        // Le solde après chaque inscription est explicite au Québec ; il découle du
        // grand livre en Ontario.
        reference: qc ? "art. 38(1)h, (2)i" : null,
        money: true,
      },
    ],
  };
}

function clientLedgers(province: CabinetProvince): RegisterDefinition {
  const qc = province === "QC";
  return {
    id: "CLIENT_LEDGERS",
    titleFr: "Registre de cartes-clients",
    titleEn: "Clients' trust ledger",
    reference: qc ? "B-1 r.5, art. 39" : "By-Law 9, s. 18(3)",
    appliesTo: BOTH,
    noteFr: qc
      ? "Séparément pour chaque client et, le cas échéant, pour chaque dossier d'un même client (art. 39 al. 3)."
      : "Separately for each client for whom money is received in trust.",
    columns: [
      { key: "clientName", labelFr: "Client", labelEn: "Client", align: "left", reference: qc ? "art. 39" : "s. 18(3)" },
      { key: "dossierRef", labelFr: "Dossier", labelEn: "Matter", align: "left", reference: qc ? "art. 39 al. 3" : null },
      { key: "date", labelFr: "Date", labelEn: "Date", align: "left", reference: qc ? "art. 39(1)a, (2)a" : "s. 18(3)" },
      {
        key: "counterparty",
        labelFr: "De qui reçue / Bénéficiaire",
        labelEn: "Received from / Paid to",
        align: "left",
        reference: qc ? "art. 39(1)c, (2)c" : "s. 18(3)",
      },
      { key: "purpose", labelFr: "Objet", labelEn: "Purpose", align: "left", reference: qc ? "art. 39(1)d, (2)d" : null },
      { key: "receipt", labelFr: "Recette", labelEn: "Receipt", align: "right", reference: qc ? "art. 39(1)b" : "s. 18(3)", money: true },
      { key: "disbursement", labelFr: "Déboursé", labelEn: "Disbursement", align: "right", reference: qc ? "art. 39(2)b" : "s. 18(3)", money: true },
      {
        key: "balance",
        labelFr: "Nouveau solde",
        labelEn: "Unexpended balance",
        align: "right",
        reference: qc ? "art. 39(1)f, (2)g" : "s. 18(3)",
        money: true,
      },
    ],
  };
}

function particularAccountLedgers(): RegisterDefinition {
  return {
    id: "PARTICULAR_ACCOUNT_LEDGERS",
    titleFr: "Registre de cartes-clients — comptes particuliers",
    titleEn: "Client ledgers — specific trust accounts",
    // Registre propre au régime québécois : By-Law 9 ne connaît pas le compte
    // particulier. L'exiger en Ontario inventerait une obligation.
    reference: "B-1 r.5, art. 66",
    appliesTo: QC_ONLY,
    noteFr:
      "Séparément pour chaque compte particulier : transferts depuis et vers le compte général, revenus des placements, frais inhérents, solde après chaque inscription (art. 66).",
    columns: [
      { key: "accountLabel", labelFr: "Compte particulier", labelEn: "Account", align: "left", reference: "art. 66" },
      { key: "clientName", labelFr: "Client", labelEn: "Client", align: "left", reference: "art. 63 al. 2" },
      { key: "date", labelFr: "Date", labelEn: "Date", align: "left", reference: "art. 66(1), (2)" },
      { key: "nature", labelFr: "Nature", labelEn: "Nature", align: "left", reference: "art. 66(1), (2)" },
      { key: "inflow", labelFr: "Entrée", labelEn: "In", align: "right", reference: "art. 66(1)", money: true },
      { key: "outflow", labelFr: "Sortie", labelEn: "Out", align: "right", reference: "art. 66(2)", money: true },
      { key: "balance", labelFr: "Solde", labelEn: "Balance", align: "right", reference: "art. 66(1), (2)", money: true },
    ],
  };
}

function chequeRegister(province: CabinetProvince): RegisterDefinition {
  const qc = province === "QC";
  return {
    id: "CHEQUE_REGISTER",
    titleFr: "Registre des chèques en fidéicommis",
    titleEn: "Trust cheque register",
    reference: qc ? "B-1 r.5, art. 61" : "By-Law 9, s. 18(2)",
    appliesTo: BOTH,
    noteFr: qc
      ? "Les chèques doivent être numérotés consécutivement (art. 61). Un chèque annulé est conservé : il compte dans la séquence."
      : "Cheques identified by number, as the document used to disburse money.",
    columns: [
      { key: "chequeNumber", labelFr: "N°", labelEn: "No.", align: "right", reference: qc ? "art. 61" : "s. 18(2)" },
      { key: "issueDate", labelFr: "Date d'émission", labelEn: "Issue date", align: "left", reference: qc ? "art. 41(2)" : "s. 18(2)" },
      { key: "payeeName", labelFr: "Bénéficiaire", labelEn: "Payee", align: "left", reference: qc ? "art. 57 al. 2" : "s. 11(a)" },
      { key: "clientName", labelFr: "Client", labelEn: "Client", align: "left", reference: qc ? "art. 41(2)" : null },
      { key: "dossierRef", labelFr: "Dossier", labelEn: "Matter", align: "left", reference: qc ? "art. 41(2)" : null },
      { key: "status", labelFr: "État", labelEn: "Status", align: "center", reference: null },
      { key: "amount", labelFr: "Montant", labelEn: "Amount", align: "right", reference: qc ? "art. 41(2)" : "s. 18(2)", money: true },
    ],
  };
}

/**
 * Registre des autres biens en fidéicommis.
 *
 * Art. 43 QC / s. 18(9) ON. Les colonnes diffèrent réellement entre les deux
 * régimes : l'Ontario exige la valeur et le détenteur précédent, le Québec le lieu
 * de garde et l'affectation. On ne sert donc pas les mêmes colonnes des deux côtés.
 */
function trustPropertyRegister(province: CabinetProvince): RegisterDefinition {
  const qc = province === "QC";
  const reference = qc ? "art. 43" : "s. 18(9)";

  const columns: RegisterColumn[] = [
    { key: "description", labelFr: "Description du bien", labelEn: "Description", align: "left", reference },
    { key: "identificationNumber", labelFr: "N° d'identification", labelEn: "Identification no.", align: "left", reference },
    { key: "clientName", labelFr: "Client", labelEn: "Client", align: "left", reference },
    { key: "dossierRef", labelFr: "Dossier", labelEn: "Matter", align: "left", reference: null },
    { key: "receivedAt", labelFr: "Prise de possession", labelEn: "Possession taken", align: "left", reference },
  ];

  if (qc) {
    columns.push(
      { key: "storageLocation", labelFr: "Lieu de garde", labelEn: "Location", align: "left", reference: "art. 45" },
      { key: "purpose", labelFr: "Affectation", labelEn: "Purpose", align: "left", reference: "art. 46" },
    );
  } else {
    columns.push(
      { key: "receivedFromName", labelFr: "Détenteur précédent", labelEn: "Previous possessor", align: "left", reference: "s. 18(9)" },
      { key: "estimatedValue", labelFr: "Valeur", labelEn: "Value", align: "right", reference: "s. 18(9)", money: true },
    );
  }

  columns.push(
    { key: "releasedAt", labelFr: "Remise", labelEn: "Given away", align: "left", reference },
    { key: "releasedToName", labelFr: "Remis à", labelEn: "Given to", align: "left", reference },
  );

  return {
    id: "TRUST_PROPERTY_REGISTER",
    titleFr: "Registre des autres biens en fidéicommis",
    titleEn: "Valuable property record",
    reference: qc ? "B-1 r.5, art. 43" : "By-Law 9, s. 18(9)",
    appliesTo: BOTH,
    noteFr: qc
      ? "Inscription dès réception ou remise (art. 43). Le client doit être avisé du lieu de garde et de tout changement d'emplacement (art. 45)."
      : "Property other than money held in trust for clients, with its value and previous possessor.",
    columns,
  };
}

function adminCashJournal(province: CabinetProvince): RegisterDefinition {
  const qc = province === "QC";
  return {
    id: "ADMIN_CASH_JOURNAL",
    titleFr: "Journal de caisse recettes-déboursés d'administration",
    titleEn: "General receipts and disbursements journal",
    reference: qc ? "B-1 r.5, art. 34" : "By-Law 9, s. 18(5), (6)",
    appliesTo: BOTH,
    columns: [
      { key: "date", labelFr: "Date", labelEn: "Date", align: "left", reference: qc ? "art. 34(1)a, (2)a" : "s. 18(5), (6)" },
      {
        key: "payerOrPayee",
        labelFr: "De qui reçue / Bénéficiaire",
        labelEn: "Received from / Paid to",
        align: "left",
        reference: qc ? "art. 34(1)c, (2)c" : "s. 18(5), (6)",
      },
      { key: "clientName", labelFr: "Client", labelEn: "Client", align: "left", reference: qc ? "art. 34(1)d, (2)d" : null },
      { key: "dossierRef", labelFr: "Dossier", labelEn: "Matter", align: "left", reference: qc ? "art. 34(1)e, (2)e" : null },
      { key: "purpose", labelFr: "Objet", labelEn: "Purpose", align: "left", reference: qc ? "art. 34(1)f" : null },
      {
        key: "documentIdentifier",
        labelFr: "Pièce",
        labelEn: "Document",
        align: "left",
        // s. 18(6) exige l'identifiant du document utilisé ; l'art. 34 ne l'exige pas.
        reference: qc ? null : "s. 18(6)",
      },
      { key: "cash", labelFr: "Espèces", labelEn: "Cash", align: "center", reference: qc ? "art. 34(1)g" : "s. 18(5)" },
      { key: "receipt", labelFr: "Recette", labelEn: "Receipt", align: "right", reference: qc ? "art. 34(1)b" : "s. 18(5)", money: true },
      { key: "disbursement", labelFr: "Déboursé", labelEn: "Disbursement", align: "right", reference: qc ? "art. 34(2)b" : "s. 18(6)", money: true },
    ],
  };
}

function feesBook(province: CabinetProvince): RegisterDefinition {
  const qc = province === "QC";
  return {
    id: "FEES_BOOK",
    titleFr: "Livre des honoraires",
    titleEn: "Fees book",
    // Le livre des honoraires est une exigence EXPLICITE en Ontario (s. 18(7)).
    // Au Québec, il découle de la tenue des livres de l'art. 28, sans article dédié.
    reference: qc ? "B-1 r.5, art. 28" : "By-Law 9, s. 18(7)",
    appliesTo: BOTH,
    noteFr: qc
      ? "Le règlement québécois n'impose pas de livre des honoraires distinct : il découle de l'obligation générale de tenir les livres à jour (art. 28)."
      : "A fees book or chronological file of copies of billings (s. 18(7)).",
    columns: [
      { key: "numero", labelFr: "N° de facture", labelEn: "Invoice no.", align: "left", reference: qc ? null : "s. 18(7)" },
      { key: "date", labelFr: "Date", labelEn: "Date", align: "left", reference: qc ? null : "s. 18(7)" },
      { key: "clientName", labelFr: "Client", labelEn: "Client", align: "left", reference: qc ? null : "s. 18(7)" },
      { key: "dossierRef", labelFr: "Dossier", labelEn: "Matter", align: "left", reference: null },
      { key: "fees", labelFr: "Honoraires", labelEn: "Fees", align: "right", reference: qc ? null : "s. 18(7)", money: true },
      { key: "disbursements", labelFr: "Débours", labelEn: "Disbursements", align: "right", reference: null, money: true },
      { key: "taxes", labelFr: "Taxes", labelEn: "Taxes", align: "right", reference: null, money: true },
      { key: "total", labelFr: "Total", labelEn: "Total", align: "right", reference: qc ? null : "s. 18(7)", money: true },
    ],
  };
}

function matterList(id: "ACTIVE_MATTERS" | "CLOSED_MATTERS"): RegisterDefinition {
  const active = id === "ACTIVE_MATTERS";
  return {
    id,
    titleFr: active ? "Liste des dossiers actifs" : "Liste des dossiers fermés (7 dernières années)",
    titleEn: active ? "List of active matters" : "List of matters closed in the last 7 years",
    // Art. 9 : « L'avocat doit tenir à jour une liste de ses dossiers actifs et de ses
    // dossiers fermés au cours des 7 dernières années. » Aucun équivalent dans
    // By-Law 9, qui ne traite que des registres financiers.
    reference: "B-1 r.5, art. 9",
    appliesTo: QC_ONLY,
    columns: [
      { key: "numeroDossier", labelFr: "N° de dossier", labelEn: "Matter no.", align: "left", reference: "art. 9" },
      { key: "intitule", labelFr: "Intitulé", labelEn: "Title", align: "left", reference: "art. 9" },
      { key: "clientName", labelFr: "Client", labelEn: "Client", align: "left", reference: "art. 9" },
      { key: "openedAt", labelFr: "Ouverture", labelEn: "Opened", align: "left", reference: null },
      ...(active
        ? []
        : [
            {
              key: "closedAt",
              labelFr: "Fermeture",
              labelEn: "Closed",
              align: "left" as ColumnAlign,
              reference: "art. 9",
            },
            {
              key: "retentionUntil",
              labelFr: "Conservation jusqu'au",
              labelEn: "Retained until",
              align: "left" as ColumnAlign,
              // Art. 18 al. 3 : conservation d'au moins 7 ans à compter de la fermeture.
              reference: "art. 18 al. 3",
            },
          ]),
    ],
  };
}

/** Tous les registres applicables à une province. */
export function getRegisters(province: CabinetProvince): RegisterDefinition[] {
  const all = [
    trustCashJournal(province),
    clientLedgers(province),
    particularAccountLedgers(),
    chequeRegister(province),
    trustPropertyRegister(province),
    adminCashJournal(province),
    feesBook(province),
    matterList("ACTIVE_MATTERS"),
    matterList("CLOSED_MATTERS"),
  ];
  return all.filter((r) => r.appliesTo.includes(province));
}

/** Un registre par identifiant, ou `undefined` s'il ne s'applique pas à la province. */
export function getRegister(
  id: RegisterId,
  province: CabinetProvince,
): RegisterDefinition | undefined {
  return getRegisters(province).find((r) => r.id === id);
}

/** Colonnes réellement exigées par un article, à l'exclusion des colonnes de confort. */
export function getRegulatoryColumns(def: RegisterDefinition): RegisterColumn[] {
  return def.columns.filter((c) => c.reference !== null);
}
