/**
 * Accès d'inspection : lecture seule, durée limitée, tout journalisé.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI, `now` injecté.
 *
 * ────────────────────────────────────────────────────────────────
 * POURQUOI L'INSPECTEUR N'EST PAS UN UTILISATEUR DU CABINET
 * ────────────────────────────────────────────────────────────────
 *
 * La solution évidente serait d'ajouter `inspecteur` à `UserRole` et de le refuser
 * partout où l'on écrit. Elle a été écartée, pour une raison mesurée et non théorique :
 * le dépôt compte plus de 330 endroits qui consultent le rôle, et une partie des
 * écritures ne vérifient que l'authentification, pas le rôle. Un rôle en lecture seule
 * ne serait donc étanche qu'au prix d'un audit exhaustif de ces 330 sites, et le
 * moindre oubli donnerait à un tiers extérieur le droit d'écrire dans la comptabilité
 * d'un cabinet.
 *
 * L'accès d'inspection est donc une **session distincte**, qui ne crée aucun `User`,
 * ne porte aucun rôle et n'emprunte aucun chemin d'écriture. Ce qu'elle ne peut pas
 * atteindre, elle ne peut pas le casser.
 *
 * ────────────────────────────────────────────────────────────────
 * L'ARTICLE QUI FONDE CE MODULE
 * ────────────────────────────────────────────────────────────────
 *
 * L'art. 29 B-1 r.5 impose la confidentialité et la sécurité des livres, ET l'**accès
 * en tout temps** du syndic, de ses enquêteurs, du directeur de l'inspection
 * professionnelle et de ses experts. C'est une obligation, pas une commodité.
 *
 * ⚠️ CE QUE L'ARTICLE N'IMPOSE PAS : la forme du dispositif. Il exige l'accès, pas un
 * « mode inspecteur » logiciel. Une session à durée limitée, journalisée et en lecture
 * seule est donc un MOYEN de le satisfaire, choisi ici — et la durée de 30 jours,
 * notamment, ne vient d'aucun texte.
 *
 * ⚠️ INCERTITUDE DÉCLARÉE CÔTÉ ONTARIEN : aucune disposition de By-Law 9 équivalente
 * à la clause d'accès de l'art. 29 n'a été retenue lors de la lecture du texte. Le
 * module ne prétend donc pas la couvrir, et `getPresentationDuties("ON")` ne cite que
 * ce qui a été vérifié.
 */

import type { CabinetProvince } from "./rules";

/* ════════════════════════════════════════════════════════════════
   CE QUE LA SESSION PEUT ATTEINDRE
   ════════════════════════════════════════════════════════════════ */

export type InspectionResource =
  | "REGISTERS"
  | "MONTHLY_REPORTS"
  | "ANNUAL_REPORTS"
  | "SUPPORTING_DOCUMENTS"
  | "BANK_STATEMENTS"
  | "TRUST_PROPERTY"
  | "CASH_RECEIPTS"
  | "CLIENT_IDENTIFICATION"
  | "SHORTFALLS";

/**
 * Périmètre de lecture, en dur.
 *
 * Écrit comme une liste blanche : une ressource ajoutée plus tard n'est PAS visible
 * par défaut. Une liste noire aurait exposé chaque nouveau modèle sans que personne
 * l'ait décidé.
 */
export const INSPECTION_READABLE: InspectionResource[] = [
  "REGISTERS",
  "MONTHLY_REPORTS",
  "ANNUAL_REPORTS",
  "SUPPORTING_DOCUMENTS",
  "BANK_STATEMENTS",
  "TRUST_PROPERTY",
  "CASH_RECEIPTS",
  "CLIENT_IDENTIFICATION",
  "SHORTFALLS",
];

/** Une session d'inspection n'écrit jamais. Constante, pas paramètre. */
export const INSPECTION_IS_READ_ONLY = true;

export function canInspectionRead(resource: InspectionResource): boolean {
  return INSPECTION_READABLE.includes(resource);
}

/* ════════════════════════════════════════════════════════════════
   DURÉE
   ════════════════════════════════════════════════════════════════ */

/**
 * Durée par défaut d'un accès, en jours.
 *
 * ⚠️ CHIFFRE DE CONFORT, PAS RÉGLEMENTAIRE. Aucun texte ne fixe la durée pendant
 * laquelle un cabinet doit tenir ses livres accessibles à un inspecteur. Trente jours
 * couvrent une inspection ordinaire sans laisser une porte ouverte indéfiniment. Le
 * cabinet peut raccourcir ou prolonger, et chaque prolongation est journalisée.
 */
export const DEFAULT_ACCESS_DAYS = 30;
export const MAX_ACCESS_DAYS = 180;

export type AccessState = "ACTIVE" | "EXPIRED" | "REVOKED";

export interface AccessEvaluation {
  state: AccessState;
  /** Jours restants. Négatif si expirée. */
  daysRemaining: number;
  messageFr: string;
}

export function evaluateAccess(params: {
  expiresAt: Date;
  revokedAt?: Date | null;
  now: Date;
}): AccessEvaluation {
  if (params.revokedAt) {
    return {
      state: "REVOKED",
      daysRemaining: 0,
      messageFr: `Accès révoqué le ${params.revokedAt.toISOString().slice(0, 10)}.`,
    };
  }

  const daysRemaining = Math.ceil(
    (params.expiresAt.getTime() - params.now.getTime()) / 86_400_000,
  );

  if (params.now.getTime() >= params.expiresAt.getTime()) {
    return {
      state: "EXPIRED",
      daysRemaining,
      messageFr: `Accès expiré le ${params.expiresAt.toISOString().slice(0, 10)}.`,
    };
  }

  return {
    state: "ACTIVE",
    daysRemaining,
    messageFr: `Accès actif jusqu'au ${params.expiresAt.toISOString().slice(0, 10)} (${daysRemaining} jour(s)).`,
  };
}

/** Borne la durée demandée. Une session sans fin n'est plus une session. */
export function resolveExpiry(params: { grantedAt: Date; days?: number | null }): Date {
  const raw = params.days ?? DEFAULT_ACCESS_DAYS;
  const days = Math.min(Math.max(Math.floor(raw), 1), MAX_ACCESS_DAYS);
  return new Date(params.grantedAt.getTime() + days * 86_400_000);
}

/* ════════════════════════════════════════════════════════════════
   CE QUI DOIT ÊTRE SAISI POUR OUVRIR UN ACCÈS
   ════════════════════════════════════════════════════════════════ */

export interface GrantRequirement {
  field: "inspectorName" | "inspectorOrganization" | "purpose";
  labelFr: string;
  whyFr: string;
}

/**
 * Un accès ne s'ouvre pas anonymement.
 *
 * Le cabinet reste responsable du secret professionnel : il doit pouvoir dire plus
 * tard **qui** a consulté quoi, et **pourquoi**. Ouvrir un accès sans nom donnerait un
 * journal qui ne prouve rien.
 */
export function getGrantRequirements(province: CabinetProvince): GrantRequirement[] {
  const autorite = province === "QC" ? "le Barreau du Québec" : "la Law Society of Ontario";
  return [
    {
      field: "inspectorName",
      labelFr: "Nom de la personne qui inspecte",
      whyFr: `Le journal d'accès doit pouvoir nommer qui a consulté le dossier comptable, y compris des mois plus tard.`,
    },
    {
      field: "inspectorOrganization",
      labelFr: "Organisme",
      whyFr: `Un accès accordé à ${autorite} ne se justifie pas de la même façon qu'un accès accordé à un comptable externe.`,
    },
    {
      field: "purpose",
      labelFr: "Motif de l'accès",
      whyFr:
        "Le cabinet reste tenu au secret professionnel. Le motif est ce qui justifie l'ouverture, et il est conservé avec la session.",
    },
  ];
}

export function findMissingGrantFields(params: {
  inspectorName?: string | null;
  inspectorOrganization?: string | null;
  purpose?: string | null;
}): GrantRequirement["field"][] {
  const missing: GrantRequirement["field"][] = [];
  if (!params.inspectorName?.trim()) missing.push("inspectorName");
  if (!params.inspectorOrganization?.trim()) missing.push("inspectorOrganization");
  if (!params.purpose?.trim()) missing.push("purpose");
  return missing;
}

/* ════════════════════════════════════════════════════════════════
   OBLIGATION DE PRÉSENTATION
   ════════════════════════════════════════════════════════════════ */

export interface PresentationDuty {
  reference: string;
  dutyFr: string;
}

/**
 * L'obligation réelle, celle qui existe dans le texte.
 *
 * Elle porte sur la PRÉSENTATION des livres, pas sur un dispositif logiciel. C'est
 * elle que la trousse d'inspection sert, et c'est la seule chose citable ici.
 */
export function getPresentationDuties(province: CabinetProvince): PresentationDuty[] {
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
      reference: "B-1 r.5, art. 29",
      dutyFr:
        "Les livres et registres sont accessibles en tout temps au syndic, à ses enquêteurs, au directeur de l'inspection professionnelle et à ses experts, sous réserve de leur confidentialité et de leur sécurité.",
    },
    {
      reference: "B-1 r.5, art. 30",
      dutyFr:
        "L'avocat doit pouvoir produire immédiatement une copie papier de tout livre ou registre.",
    },
    {
      reference: "B-1 r.5, art. 33",
      dutyFr:
        "En cas de perte ou de destruction, la reconstitution se fait aux frais de l'avocat. Un cabinet qui peut réexporter une période complète n'a pas à reconstituer.",
    },
  ];
}
