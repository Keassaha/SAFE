/**
 * Identification et vérification du client — les deux régimes, côte à côte.
 *
 * ⚠️ Point de vigilance réglementaire : au Québec, l'identification du client est
 * dans le MÊME règlement que la comptabilité (B-1 r.5, art. 13-14 et 20-27). En
 * Ontario, elle n'est PAS dans By-Law 9 (qui ne traite que des opérations et
 * registres financiers) mais dans **By-Law 7.1, Partie III**. Confondre les deux
 * conduit à chercher des obligations là où elles ne sont pas.
 *
 * Sources lues intégralement le 2026-07-30 :
 *   - RLRQ c. B-1, r. 5, art. 13, 14, 20 à 27 (LegisQuébec, à jour au 2026-04-01)
 *   - LSO By-Law 7.1, Partie III, art. 20 à 24 (lso.ca, version du 2024-04-25,
 *     en vigueur le 2025-01-01)
 *
 * Les deux régimes se ressemblent mais divergent sur des points qui changent le
 * comportement du logiciel. Les divergences sont documentées à chaque endroit où
 * elles se manifestent, jamais aplaties dans une règle « moyenne ».
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI. La province est passée en
 * argument. Doctrine ADR-011 et PR-4/PR-7 du programme Inspection Ready.
 */

import type { CabinetProvince } from "./rules";

/* ════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════ */

/** Nature du client, au sens des deux règlements. */
export type IdentitySubjectKind = "INDIVIDUAL" | "ORGANIZATION";

/**
 * Activité qui déclenche l'obligation.
 *
 * QC art. 20 : « lorsque, pour le compte de son client et **autrement que par un
 * transfert électronique de fonds**, il reçoit, débourse ou vire des fonds, ou donne
 * des directives à l'égard de ces activités ».
 *
 * ON s. 22(1) : distingue deux moments — (a) au moment où le titulaire est
 * **mandaté** (identification simple, toujours), et (b) quand il **reçoit, paie ou
 * transfère des fonds** (identification renforcée + vérification).
 */
export type IdentityTrigger = "RETAINER" | "FUNDS_MOVEMENT";

/** Niveau d'obligation déclenché. */
export type IdentityObligation =
  /** Recueillir les renseignements d'identification (nom, adresse, occupation…). */
  | "IDENTIFY"
  /** Vérifier l'identité au moyen de documents de source fiable et indépendante. */
  | "VERIFY"
  /** Aucune obligation (exemption applicable). */
  | "NONE";

/* ════════════════════════════════════════════════════════════════
   EXEMPTIONS
   ════════════════════════════════════════════════════════════════ */

/**
 * Exemptions québécoises — B-1 r.5 art. 21. Sept catégories.
 * Le règlement les rédige comme des cas où « l'avocat n'est pas tenu de vérifier
 * l'identité ». Elles portent donc sur la VÉRIFICATION, pas sur l'identification.
 */
export const QC_EXEMPTIONS = {
  CLIENT_INSTITUTION_FINANCIERE: "art. 21(1)",
  CLIENT_ORGANISME_PUBLIC: "art. 21(1)",
  CLIENT_EMETTEUR_ASSUJETTI: "art. 21(1)",
  AGIT_POUR_EMPLOYEUR: "art. 21(2)",
  DEMANDE_AUTRE_AVOCAT_DEJA_VERIFIE: "art. 21(3)",
  AVOCAT_DE_SERVICE_OSBL: "art. 21(4)",
  FONDS_REGLEMENT_PROCEDURE: "art. 21(5)a",
  FONDS_ORDONNANCE_OU_AMENDE: "art. 21(5)b",
  FONDS_DEPOT_MISE_EN_LIBERTE: "art. 21(5)c",
  FONDS_HONORAIRES_OU_DEBOURS: "art. 21(5)d",
  FONDS_INSTITUTION_OU_ORGANISME_PUBLIC: "art. 21(6)",
  FONDS_FIDEICOMMIS_AVOCAT_OU_NOTAIRE: "art. 21(7)a",
  FONDS_AGENT_DE_LA_PAIX: "art. 21(7)b",
} as const;

/**
 * Exemptions ontariennes — By-Law 7.1 s. 22(2), (3) et (4).
 *
 * Divergence notable : la s. 22(3)(f) exempte les fonds **transférés par virement
 * électronique**. C'est l'équivalent fonctionnel du « autrement que par un transfert
 * électronique de fonds » de l'art. 20 QC, mais rédigé comme une exemption plutôt
 * que comme une condition du déclencheur.
 */
export const ON_EXEMPTIONS = {
  AGIT_POUR_EMPLOYEUR: "s. 22(2)(a)",
  AGENT_AUTRE_TITULAIRE_DEJA_CONFORME: "s. 22(2)(b)",
  CLIENT_REFERE_PAR_TITULAIRE_CONFORME: "s. 22(2)(c)",
  AVOCAT_DE_SERVICE_AIDE_JURIDIQUE: "s. 22(2)(d)",
  FONDS_INSTITUTION_ORGANISME_EMETTEUR: "s. 22(3)(a)",
  FONDS_FIDEICOMMIS_AUTRE_TITULAIRE: "s. 22(3)(b)",
  FONDS_AGENT_DE_LA_PAIX: "s. 22(3)(c)",
  FONDS_AMENDE_PENALITE_CAUTION: "s. 22(3)(d)",
  FONDS_HONORAIRES_DEBOURS_DEPENSES: "s. 22(3)(e)",
  FONDS_VIREMENT_ELECTRONIQUE: "s. 22(3)(f)",
  CLIENT_INSTITUTION_FINANCIERE: "s. 22(4)(1)",
  CLIENT_ORGANISME_PUBLIC: "s. 22(4)(2)",
  CLIENT_EMETTEUR_ASSUJETTI: "s. 22(4)(3)",
} as const;

export type QcExemption = keyof typeof QC_EXEMPTIONS;
export type OnExemption = keyof typeof ON_EXEMPTIONS;
export type IdentityExemption = QcExemption | OnExemption;

/** Exemptions applicables dans la province, avec leur référence d'article. */
export function getExemptions(province: CabinetProvince): Record<string, string> {
  return province === "QC" ? { ...QC_EXEMPTIONS } : { ...ON_EXEMPTIONS };
}

/** Une exemption est-elle valide dans cette province ? */
export function isExemptionValid(province: CabinetProvince, exemption: string): boolean {
  return Object.prototype.hasOwnProperty.call(getExemptions(province), exemption);
}

/** Référence d'article d'une exemption, ou null si elle n'existe pas dans la province. */
export function exemptionReference(province: CabinetProvince, exemption: string): string | null {
  return getExemptions(province)[exemption] ?? null;
}

/* ════════════════════════════════════════════════════════════════
   RENSEIGNEMENTS À OBTENIR
   ════════════════════════════════════════════════════════════════ */

export interface RequiredField {
  /** Clé technique, alignée sur le modèle de données. */
  key: string;
  labelFr: string;
  labelEn: string;
  reference: string;
}

/**
 * Renseignements d'identification exigés.
 *
 * Divergences réelles entre les deux régimes :
 *
 *  - **Source des fonds** : exigée en Ontario dès qu'il y a mouvement de fonds
 *    (s. 23(2)). **Aucune obligation équivalente au Québec** — B-1 r.5 n'en parle
 *    nulle part. On ne l'impose donc pas à un cabinet québécois.
 *  - **Occupation des administrateurs** : le Québec exige « le nom et l'occupation
 *    des administrateurs » (art. 23(2)1). L'Ontario n'exige que « the name of each
 *    director » (s. 23(2.1)(a)). Le Québec est ici plus exigeant.
 *  - **Efforts raisonnables** : l'Ontario qualifie l'obtention des détenteurs de
 *    25 % et plus de « reasonable efforts » (s. 23(2.1)(b)) et prévoit une
 *    procédure de repli (s. 23(2.2)). Le Québec l'exige sans réserve (art. 23(2)2).
 */
export function getRequiredIdentificationFields(
  province: CabinetProvince,
  kind: IdentitySubjectKind,
  trigger: IdentityTrigger,
): RequiredField[] {
  const isQC = province === "QC";
  const fields: RequiredField[] = [];

  if (kind === "INDIVIDUAL") {
    fields.push(
      f("nom", "Nom", "Full name", isQC ? "art. 14(1)a" : "s. 23(1)1"),
      f("adresse", "Adresse personnelle ou d'affaires", "Home or business address", isQC ? "art. 14(1)b" : "s. 23(1)2-3"),
      f("telephone", "Numéro de téléphone", "Telephone number", isQC ? "art. 14(1)c" : "s. 23(1)2-3"),
      f("occupation", "Occupation", "Occupation", isQC ? "art. 14(1)d" : "s. 23(1)5"),
    );
  } else {
    fields.push(
      f("nom", "Nom de la société ou de l'organisme", "Organization name", isQC ? "art. 14(2)a" : "s. 23(1)1"),
      f("adresse", "Adresse", "Address", isQC ? "art. 14(2)b" : "s. 23(1)2"),
      f("telephone", "Numéro de téléphone", "Telephone number", isQC ? "art. 14(2)c" : "s. 23(1)2"),
      f(
        "numeroRegistreEntreprise",
        "Numéro de constitution ou d'identification, et lieu de délivrance",
        "Incorporation or business identification number and place of issue",
        isQC ? "art. 14(2)d" : "s. 23(1)4",
      ),
      f(
        "natureActivites",
        "Nature générale des activités",
        "General nature of the business or activities",
        isQC ? "art. 14(2)d" : "s. 23(1)6",
      ),
      f(
        "personnesAutorisees",
        "Nom, poste, adresse et téléphone des personnes autorisées à donner des directives",
        "Name, position and contact information of each individual authorized to give instructions",
        isQC ? "art. 14(2)e" : "s. 23(1)7",
      ),
    );
  }

  // Tiers représenté — les deux régimes l'exigent, dans les mêmes termes.
  fields.push(
    f(
      "tiersRepresente",
      "Renseignements sur le tiers pour qui le client agit",
      "Information about the third party the client acts for",
      isQC ? "art. 14 al. 3" : "s. 23(1)8",
    ),
  );

  if (trigger === "FUNDS_MOVEMENT") {
    // ── Divergence : source des fonds, Ontario seulement ──────────────────
    if (!isQC) {
      fields.push(
        f(
          "sourceDesFonds",
          "Source des fonds reçus, payés ou virés",
          "Source of the funds being received, paid or transferred",
          "s. 23(2)",
        ),
      );
    }

    if (kind === "ORGANIZATION") {
      fields.push(
        f(
          "administrateurs",
          isQC ? "Nom et occupation des administrateurs" : "Nom de chaque administrateur",
          isQC ? "Name and occupation of directors" : "Name of each director",
          isQC ? "art. 23(2)1" : "s. 23(2.1)(a)",
        ),
        f(
          "detenteurs25",
          "Nom et adresse des personnes détenant 25 % ou plus",
          "Names and addresses of persons owning 25% or more",
          isQC ? "art. 23(2)2" : "s. 23(2.1)(b)(i)",
        ),
      );
      if (!isQC) {
        // Le Québec n'a pas d'équivalent explicite pour les fiducies ni pour la
        // structure de propriété : on ne les impose donc pas à un cabinet québécois.
        fields.push(
          f(
            "fiducieBeneficiaires",
            "Nom et adresse des fiduciaires, bénéficiaires connus et constituants",
            "Names and addresses of trustees, known beneficiaries and settlors",
            "s. 23(2.1)(b)(ii)",
          ),
          f(
            "structurePropriete",
            "Renseignements établissant la propriété, le contrôle et la structure",
            "Information establishing ownership, control and structure",
            "s. 23(2.1)(b)(iii)",
          ),
        );
      }
    }
  }

  return fields;
}

function f(key: string, labelFr: string, labelEn: string, reference: string): RequiredField {
  return { key, labelFr, labelEn, reference };
}

/* ════════════════════════════════════════════════════════════════
   DÉLAIS DE VÉRIFICATION
   ════════════════════════════════════════════════════════════════ */

export interface VerificationDeadline {
  /** Nombre de jours après le premier mouvement de fonds. 0 = immédiat. */
  days: number;
  reference: string;
  /** Vrai si l'obligation doit être satisfaite AVANT le mouvement, pas après. */
  blocksImmediately: boolean;
}

/**
 * Délai de vérification, par province et par nature de client.
 *
 * **C'est la divergence la plus opérationnelle des deux régimes.**
 *
 *  Québec, art. 26 :
 *    - personne physique : « au plus tard **au moment où il reçoit des fonds** ».
 *      L'obligation est donc BLOQUANTE : on ne peut pas recevoir sans avoir vérifié.
 *    - société ou organisme : « au plus tard dans les **60 jours** ».
 *
 *  Ontario, By-Law 7.1 :
 *    - personne physique, s. 23(5) : « **immediately after** first engaging in the
 *      activities ». Le texte dit « after » : la vérification suit le mouvement,
 *      elle ne le précède pas. On alerte donc sans bloquer, et on bloque le
 *      mouvement SUIVANT tant qu'elle n'est pas faite.
 *    - organisation, s. 23(6) : « immediately and, in all cases, by not later than
 *      **30 days** ». Moitié moins qu'au Québec.
 *
 * Aplatir ces quatre cas en une règle unique produirait soit un blocage illégitime
 * en Ontario, soit un trou de conformité au Québec.
 */
export function getVerificationDeadline(
  province: CabinetProvince,
  kind: IdentitySubjectKind,
): VerificationDeadline {
  if (province === "QC") {
    return kind === "INDIVIDUAL"
      ? { days: 0, reference: "B-1 r.5, art. 26(1)", blocksImmediately: true }
      : { days: 60, reference: "B-1 r.5, art. 26(2)", blocksImmediately: false };
  }
  return kind === "INDIVIDUAL"
    ? { days: 0, reference: "By-Law 7.1, s. 23(5)", blocksImmediately: false }
    : { days: 30, reference: "By-Law 7.1, s. 23(6)", blocksImmediately: false };
}

/** Date limite de vérification à partir du premier mouvement de fonds. */
export function computeVerificationDueDate(
  province: CabinetProvince,
  kind: IdentitySubjectKind,
  firstFundsMovementAt: Date,
): Date {
  const { days } = getVerificationDeadline(province, kind);
  const due = new Date(firstFundsMovementAt);
  due.setDate(due.getDate() + days);
  return due;
}

/* ════════════════════════════════════════════════════════════════
   MÉTHODES DE VÉRIFICATION ACCEPTÉES
   ════════════════════════════════════════════════════════════════ */

export interface VerificationMethod {
  code: string;
  labelFr: string;
  labelEn: string;
  reference: string;
  appliesTo: IdentitySubjectKind[];
}

/**
 * Méthodes acceptées.
 *
 * Divergence de fond : l'Ontario **énumère limitativement** trois méthodes pour une
 * personne physique (s. 23(7)1) — pièce d'identité gouvernementale avec photo,
 * dossier de crédit canadien d'au moins trois ans, ou double source. Le Québec pose
 * un **standard ouvert** : « documents, données ou informations qu'il peut
 * raisonnablement considérer de source fiable et indépendante » (art. 22), et ajoute
 * le mécanisme du **répondant** ou du **mandataire** quand le client n'est pas
 * rencontré (art. 24-25), qui n'a pas d'équivalent ontarien sous cette forme.
 *
 * On ne propose donc jamais à un cabinet ontarien une méthode qui n'est pas dans sa
 * liste limitative, ni à un cabinet québécois une méthode ontarienne présentée comme
 * obligatoire.
 */
export function getVerificationMethods(province: CabinetProvince): VerificationMethod[] {
  if (province === "QC") {
    return [
      m("PIECE_IDENTITE", "Document de source fiable et indépendante faisant preuve de l'identité", "Reliable and independent source document proving identity", "B-1 r.5, art. 22, 23 al. 1", ["INDIVIDUAL"]),
      m("REGISTRE_AUTORITE_COMPETENTE", "Document d'une autorité compétente confirmant l'existence, le nom et l'adresse", "Record from a competent authority confirming existence, name and address", "B-1 r.5, art. 23 al. 2", ["ORGANIZATION"]),
      m("MANDATAIRE_ENTENTE_ECRITE", "Mandataire lié par une entente écrite (client non rencontré)", "Agent under written agreement (client not met in person)", "B-1 r.5, art. 24(1), 25", ["INDIVIDUAL"]),
      m("ATTESTATION_REPONDANT", "Attestation d'un répondant au Canada (juge, commissaire, professionnel)", "Attestation by a guarantor in Canada (judge, commissioner, professional)", "B-1 r.5, art. 24(2)", ["INDIVIDUAL"]),
    ];
  }
  return [
    m("GOVERNMENT_PHOTO_ID", "Pièce d'identité gouvernementale avec photo (hors municipale)", "Government-issued photo identification (excluding municipal)", "By-Law 7.1, s. 23(7)1i", ["INDIVIDUAL"]),
    m("CREDIT_FILE", "Dossier de crédit canadien existant depuis au moins trois ans", "Canadian credit file in existence for at least three years", "By-Law 7.1, s. 23(7)1ii", ["INDIVIDUAL"]),
    m("DUAL_PROCESS", "Double source indépendante (nom+adresse, nom+date de naissance, nom+compte)", "Dual process: two pieces from different independent sources", "By-Law 7.1, s. 23(7)1iii", ["INDIVIDUAL"]),
    m("GOVERNMENT_REGISTRY", "Confirmation écrite d'un registre gouvernemental (existence, nom, adresse, administrateurs)", "Written confirmation from a government registry", "By-Law 7.1, s. 23(7)2", ["ORGANIZATION"]),
    m("CONSTATING_DOCUMENTS", "Documents constitutifs (fiducie, société de personnes)", "Constating documents (trust, partnership)", "By-Law 7.1, s. 23(7)3", ["ORGANIZATION"]),
    m("AGENT_WRITTEN_AGREEMENT", "Mandataire lié par une entente écrite", "Agent under written agreement", "By-Law 7.1, s. 23(11)(b)", ["INDIVIDUAL", "ORGANIZATION"]),
  ];
}

function m(
  code: string,
  labelFr: string,
  labelEn: string,
  reference: string,
  appliesTo: IdentitySubjectKind[],
): VerificationMethod {
  return { code, labelFr, labelEn, reference, appliesTo };
}

/** Une méthode est-elle acceptée dans cette province pour ce type de client ? */
export function isVerificationMethodAccepted(
  province: CabinetProvince,
  kind: IdentitySubjectKind,
  code: string,
): boolean {
  return getVerificationMethods(province).some(
    (v) => v.code === code && v.appliesTo.includes(kind),
  );
}

/* ════════════════════════════════════════════════════════════════
   ÉVALUATION
   ════════════════════════════════════════════════════════════════ */

export interface IdentityState {
  kind: IdentitySubjectKind;
  /** Vérification valide déjà consignée. */
  verified: boolean;
  /** Date de la vérification, si elle existe. */
  verifiedAt: Date | null;
  /** Exemption invoquée et justifiée, le cas échéant. */
  exemption: string | null;
  /** Premier mouvement de fonds sur ce client, s'il a déjà eu lieu. */
  firstFundsMovementAt: Date | null;
}

export type IdentityVerdict =
  | { status: "OK"; reason: "verified" | "exempt"; reference: string | null }
  | { status: "DUE"; dueAt: Date; daysRemaining: number; reference: string }
  | { status: "OVERDUE"; dueAt: Date; daysOverdue: number; reference: string }
  | { status: "BLOCKING"; reference: string };

/**
 * Évalue l'état d'identité d'un client au regard d'un mouvement de fonds envisagé.
 *
 * Fonction PURE : `now` est injecté, aucun accès à l'horloge globale.
 *
 * Trois issues possibles, et une seule bloque :
 *  - `OK`       : vérifié, ou exempté au titre d'un article existant dans la province.
 *  - `BLOCKING` : le règlement exige la vérification AVANT le mouvement. Ne se produit
 *                 qu'au Québec, pour une personne physique (art. 26(1)).
 *  - `DUE` / `OVERDUE` : un délai court. `OVERDUE` bloque le mouvement SUIVANT, pas
 *                 celui qui a déclenché le délai — sinon on interdirait rétroactivement
 *                 une opération qui était licite au moment où elle a eu lieu.
 */
export function evaluateIdentityForFundsMovement(
  province: CabinetProvince,
  state: IdentityState,
  now: Date,
): IdentityVerdict {
  if (state.exemption) {
    const ref = exemptionReference(province, state.exemption);
    // Une exemption inconnue dans la province ne protège pas : on la traite comme
    // absente plutôt que d'accorder une dispense qui n'existe pas ici (PR-7).
    if (ref) return { status: "OK", reason: "exempt", reference: ref };
  }

  if (state.verified) {
    return { status: "OK", reason: "verified", reference: null };
  }

  const deadline = getVerificationDeadline(province, state.kind);

  if (deadline.blocksImmediately) {
    return { status: "BLOCKING", reference: deadline.reference };
  }

  // Aucun mouvement antérieur : le délai démarre avec celui-ci, rien n'est encore dû.
  if (!state.firstFundsMovementAt) {
    const dueAt = computeVerificationDueDate(province, state.kind, now);
    return { status: "DUE", dueAt, daysRemaining: deadline.days, reference: deadline.reference };
  }

  const dueAt = computeVerificationDueDate(province, state.kind, state.firstFundsMovementAt);
  const diffDays = Math.floor((now.getTime() - dueAt.getTime()) / 86_400_000);

  if (diffDays > 0) {
    return { status: "OVERDUE", dueAt, daysOverdue: diffDays, reference: deadline.reference };
  }
  return { status: "DUE", dueAt, daysRemaining: -diffDays, reference: deadline.reference };
}

/* ════════════════════════════════════════════════════════════════
   OBLIGATIONS PARTICULIÈRES À L'ONTARIO
   ════════════════════════════════════════════════════════════════ */

/**
 * Surveillance continue — By-Law 7.1, s. 23.1.
 *
 * **Sans équivalent au Québec.** Pendant tout mandat comportant des mouvements de
 * fonds, le titulaire ontarien doit périodiquement vérifier que l'activité du client
 * et la source des fonds restent cohérentes avec l'objet du mandat, évaluer le risque
 * d'assistance à une fraude, et **consigner les mesures prises et leur date**.
 *
 * SAFE ne peut pas juger de la cohérence à la place de l'avocat. Ce qu'il doit faire :
 * planifier le rappel, offrir la saisie de la mesure prise, et conserver la trace.
 */
export function requiresOngoingMonitoring(province: CabinetProvince): boolean {
  return province === "ON";
}

/** Référence de l'obligation de surveillance continue, ou null si inapplicable. */
export function ongoingMonitoringReference(province: CabinetProvince): string | null {
  return province === "ON" ? "By-Law 7.1, s. 23.1" : null;
}

/**
 * Conservation des renseignements d'identification.
 *
 * Québec : les renseignements sont consignés au dossier (art. 22 al. 2), donc soumis
 * à la conservation du dossier — **7 ans à compter de la fermeture** (art. 18, 31).
 *
 * Ontario : s. 23(14) impose la **plus longue** de deux durées — la durée de la
 * relation client, ou **6 ans après l'achèvement du mandat**. La règle ontarienne
 * n'est donc pas un simple nombre d'années : c'est un maximum entre deux ancrages.
 */
export interface IdentityRetentionRule {
  minYearsAfterCompletion: number;
  alsoForDurationOfRelationship: boolean;
  reference: string;
}

export function getIdentityRetentionRule(province: CabinetProvince): IdentityRetentionRule {
  return province === "QC"
    ? {
        minYearsAfterCompletion: 7,
        alsoForDurationOfRelationship: false,
        reference: "B-1 r.5, art. 18, 31",
      }
    : {
        minYearsAfterCompletion: 6,
        alsoForDurationOfRelationship: true,
        reference: "By-Law 7.1, s. 23(14)",
      };
}

/**
 * Procédure de repli ontarienne — s. 23(2.2).
 *
 * Quand le titulaire ne parvient pas à obtenir les renseignements sur la propriété
 * effective, il ne peut pas simplement passer outre : il doit identifier le dirigeant
 * le plus haut placé, statuer sur la cohérence des instructions, évaluer le risque de
 * fraude, et **consigner les deux avec leur date**. Le Québec n'a pas de procédure de
 * repli écrite : l'obligation de l'art. 23(2) y est inconditionnelle.
 */
export function getFallbackProcedure(province: CabinetProvince): {
  available: boolean;
  steps: string[];
  reference: string | null;
} {
  if (province !== "ON") {
    return {
      available: false,
      steps: [],
      reference: null,
    };
  }
  return {
    available: true,
    steps: [
      "Identifier le dirigeant le plus haut placé de l'organisation",
      "Statuer sur la cohérence de l'activité, de la source des fonds et des instructions avec l'objet du mandat, et consigner la conclusion et sa date",
      "Évaluer le risque d'assistance à une fraude ou à une conduite illégale, et consigner l'évaluation et sa date",
    ],
    reference: "By-Law 7.1, s. 23(2.2)",
  };
}
