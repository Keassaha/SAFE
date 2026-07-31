/**
 * Règles d'ouverture et de tenue d'un compte bancaire en fidéicommis.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI, `now` injecté. La province
 * est passée en argument (PR-4, PR-7).
 *
 * Sources lues intégralement le 2026-07-30 :
 *   RLRQ c. B-1, r. 5, art. 36, 50 à 68 (LegisQuébec, à jour au 2026-04-01)
 *   LSO By-Law 9, art. 7 à 14, 18 (PDF officiel, version du 2017-04-27)
 */

import type { CabinetProvince } from "./rules";

export type TrustBankAccountType = "GENERAL" | "PARTICULIER";

/* ════════════════════════════════════════════════════════════════
   LIBELLÉ DU COMPTE
   ════════════════════════════════════════════════════════════════ */

/**
 * Mentions admises dans le libellé du compte.
 *
 * Art. 50 al. 2 QC : « Ce compte général en fidéicommis doit être identifié au nom
 * de l'avocat ou de la société au sein de laquelle il exerce, suivi de la mention
 * "en fidéicommis" ou "in trust". » Art. 63 al. 2 : même exigence pour le compte
 * particulier, plus le nom du client.
 *
 * s. 7(1) ON : le compte doit être « designated as a trust account ».
 */
const TRUST_LABEL_MARKERS = ["en fidéicommis", "en fideicommis", "in trust", "trust account"];

/** Le libellé porte-t-il la mention réglementaire ? Comparaison insensible aux accents et à la casse. */
export function labelHasTrustMarker(label: string): boolean {
  const normalized = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return TRUST_LABEL_MARKERS.some((marker) =>
    normalized.includes(marker.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()),
  );
}

/** Référence de l'exigence de libellé, selon la province et le type de compte. */
export function labelRequirementReference(
  province: CabinetProvince,
  type: TrustBankAccountType,
): string {
  if (province === "QC") {
    return type === "PARTICULIER" ? "B-1 r.5, art. 63 al. 2" : "B-1 r.5, art. 50 al. 2";
  }
  return "By-Law 9, s. 7(1)";
}

/* ════════════════════════════════════════════════════════════════
   VALIDATION D'OUVERTURE
   ════════════════════════════════════════════════════════════════ */

export interface TrustBankAccountDraft {
  type: TrustBankAccountType;
  accountLabel: string;
  institutionName: string;
  branchProvince?: string | null;
  accountNumber: string;
  barreauAgreementConfirmed?: boolean;
  clientId?: string | null;
  openedAt: Date;
}

export interface TrustBankAccountViolation {
  field: string;
  code: string;
  messageFr: string;
  messageEn: string;
  reference: string;
  /** Bloquant, ou simple avertissement à lever plus tard ? */
  blocking: boolean;
}

/**
 * Valide un projet d'ouverture de compte.
 *
 * Renvoie la liste des manquements plutôt que de lever à la première erreur : un
 * utilisateur qui ouvre un compte veut voir tout ce qui cloche d'un coup, pas
 * corriger un champ à la fois.
 *
 * Deux natures de manquement :
 *  - `blocking`  : le compte ne peut pas être ouvert (libellé non conforme, client
 *                  absent sur un compte particulier).
 *  - non bloquant : le compte est ouvrable mais incomplet au regard du règlement
 *                  (entente B-1 r.10 non confirmée, formulaire non transmis). Ce
 *                  sont des démarches qui prennent des jours ; les rendre bloquantes
 *                  empêcherait de saisir un compte qui existe déjà à la banque.
 */
export function validateTrustBankAccount(
  province: CabinetProvince,
  draft: TrustBankAccountDraft,
): TrustBankAccountViolation[] {
  const v: TrustBankAccountViolation[] = [];

  // ── Libellé ────────────────────────────────────────────────────────────────
  if (!labelHasTrustMarker(draft.accountLabel)) {
    v.push({
      field: "accountLabel",
      code: "LABEL_MISSING_TRUST_MARKER",
      messageFr:
        "Le libellé du compte doit porter la mention « en fidéicommis » ou « in trust ».",
      messageEn: 'The account must be designated with "en fidéicommis" or "in trust".',
      reference: labelRequirementReference(province, draft.type),
      blocking: true,
    });
  }

  if (!draft.institutionName.trim()) {
    v.push({
      field: "institutionName",
      code: "INSTITUTION_REQUIRED",
      messageFr: "L'institution financière dépositaire doit être identifiée.",
      messageEn: "The depository financial institution must be identified.",
      reference: province === "QC" ? "B-1 r.5, art. 50" : "By-Law 9, s. 7(1)",
      blocking: true,
    });
  }

  if (!draft.accountNumber.trim()) {
    v.push({
      field: "accountNumber",
      code: "ACCOUNT_NUMBER_REQUIRED",
      messageFr:
        "Le numéro de compte est exigé par les rapports comptables mensuel et annuel.",
      messageEn: "The account number is required by the monthly and annual accounting reports.",
      reference: province === "QC" ? "B-1 r.5, art. 41(6), 42(6)" : "By-Law 9, s. 18(8)",
      blocking: true,
    });
  }

  // ── Compte particulier ─────────────────────────────────────────────────────
  // Art. 62 : le compte particulier est ouvert POUR un client déterminé, dont le nom
  // figure au libellé (art. 63 al. 2). Un compte particulier sans client n'a pas de sens.
  if (draft.type === "PARTICULIER" && !draft.clientId) {
    v.push({
      field: "clientId",
      code: "PARTICULAR_ACCOUNT_REQUIRES_CLIENT",
      messageFr: "Un compte particulier en fidéicommis est ouvert pour un client déterminé.",
      messageEn: "A specific trust account is opened for a designated client.",
      reference: "B-1 r.5, art. 62, 63 al. 2",
      blocking: true,
    });
  }

  // Le compte particulier n'existe que dans le régime québécois. En Ontario, la
  // s. 7(5) permet plusieurs comptes en fiducie mais ne connaît pas cette catégorie.
  if (draft.type === "PARTICULIER" && province !== "QC") {
    v.push({
      field: "type",
      code: "PARTICULAR_ACCOUNT_QC_ONLY",
      messageFr:
        "Le compte particulier en fidéicommis est propre au régime québécois. En Ontario, ouvrez un compte en fiducie distinct.",
      messageEn:
        "The « compte particulier » is specific to Quebec. In Ontario, open a separate trust account.",
      reference: "B-1 r.5, art. 62 à 68 — s. 7(5) By-Law 9",
      blocking: false,
    });
  }

  // ── Succursale québécoise ──────────────────────────────────────────────────
  // Art. 50 et 63 : le compte doit être ouvert « dans une succursale québécoise »
  // d'une institution dont les dépôts sont assurés. Non bloquant : l'information
  // peut être complétée après coup, mais elle doit finir par être là.
  if (province === "QC" && draft.branchProvince && draft.branchProvince.toUpperCase() !== "QC") {
    v.push({
      field: "branchProvince",
      code: "BRANCH_MUST_BE_IN_QUEBEC",
      messageFr:
        "Le compte doit être ouvert dans une succursale québécoise d'une institution dont les dépôts sont assurés.",
      messageEn: "The account must be held at a Quebec branch of an insured institution.",
      reference: draft.type === "PARTICULIER" ? "B-1 r.5, art. 63" : "B-1 r.5, art. 50",
      blocking: false,
    });
  }

  // ── Entente avec le Barreau (compte général québécois seulement) ───────────
  // Art. 50 : l'institution doit avoir conclu une entente au sens du Règlement sur
  // le fonds d'études juridiques (B-1, r. 10). L'art. 63, pour le compte particulier,
  // n'impose PAS cette condition : ses revenus vont au client, pas au Fonds.
  if (province === "QC" && draft.type === "GENERAL" && !draft.barreauAgreementConfirmed) {
    v.push({
      field: "barreauAgreementConfirmed",
      code: "BARREAU_AGREEMENT_UNCONFIRMED",
      messageFr:
        "À confirmer : l'institution a-t-elle conclu une entente avec le Barreau au sens de B-1, r. 10 ?",
      messageEn: "To confirm: has the institution entered into an agreement with the Barreau (B-1, r. 10)?",
      reference: "B-1 r.5, art. 50",
      blocking: false,
    });
  }

  return v;
}

/** Ne garde que les manquements qui empêchent l'ouverture. */
export function blockingViolations(
  violations: TrustBankAccountViolation[],
): TrustBankAccountViolation[] {
  return violations.filter((x) => x.blocking);
}

/* ════════════════════════════════════════════════════════════════
   OBLIGATIONS POST-OUVERTURE
   ════════════════════════════════════════════════════════════════ */

export interface PostOpeningDuty {
  code: string;
  labelFr: string;
  labelEn: string;
  reference: string;
  done: boolean;
}

/**
 * Démarches à accomplir « sans délai » après l'ouverture.
 *
 * Art. 51 QC (compte général) : formulaire prescrit transmis sans délai au Barreau
 * ET à l'institution, l'avocat en conserve un exemplaire.
 * Art. 64 QC (compte particulier) : formulaire rempli par l'avocat ET le client,
 * transmis au Barreau et à l'institution, copie conservée, copie remise au client.
 *
 * By-Law 9 n'impose pas de déclaration équivalente à l'ouverture : la liste est
 * donc vide en Ontario, plutôt que remplie d'obligations inventées.
 */
export function getPostOpeningDuties(
  province: CabinetProvince,
  type: TrustBankAccountType,
  state: { regulatorNotifiedAt?: Date | null; clientCopySentAt?: Date | null },
): PostOpeningDuty[] {
  if (province !== "QC") return [];

  const duties: PostOpeningDuty[] = [
    {
      code: "REGULATOR_FORM_SENT",
      labelFr:
        "Transmettre sans délai au Barreau et à l'institution le formulaire prescrit, et en conserver un exemplaire",
      labelEn: "Send the prescribed form to the Barreau and the institution without delay, and keep a copy",
      reference: type === "PARTICULIER" ? "B-1 r.5, art. 64" : "B-1 r.5, art. 51",
      done: Boolean(state.regulatorNotifiedAt),
    },
  ];

  if (type === "PARTICULIER") {
    duties.push({
      code: "CLIENT_COPY_SENT",
      labelFr: "Remettre un exemplaire du formulaire au client",
      labelEn: "Provide a copy of the form to the client",
      reference: "B-1 r.5, art. 64",
      done: Boolean(state.clientCopySentAt),
    });
  }

  return duties;
}

/**
 * Bénéficiaire des intérêts, déduit du type de compte et de la province.
 *
 * Compte général : les intérêts vont au Fonds d'études juridiques du Barreau au
 * Québec (art. 50, renvoyant à B-1 r. 10), à la Law Foundation of Ontario en
 * Ontario (s. 57 Law Society Act).
 * Compte particulier : au client, c'est sa raison d'être (art. 62).
 */
export function defaultInterestBeneficiary(
  province: CabinetProvince,
  type: TrustBankAccountType,
): "FONDS_ETUDES_JURIDIQUES" | "LAW_FOUNDATION_ONTARIO" | "CLIENT" {
  if (type === "PARTICULIER") return "CLIENT";
  return province === "QC" ? "FONDS_ETUDES_JURIDIQUES" : "LAW_FOUNDATION_ONTARIO";
}

/** Quatre derniers caractères significatifs du numéro de compte, pour l'affichage. */
export function accountNumberLast4(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, "");
  if (digits.length >= 4) return digits.slice(-4);
  return (accountNumber.trim().slice(-4) || "0000").padStart(4, "0");
}
