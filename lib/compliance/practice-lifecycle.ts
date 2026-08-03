/**
 * Cycle de vie du cabinet : prescription, classement, originaux du client, cessation.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI, `now` injecté.
 *
 * Sources lues intégralement le 2026-07-30 :
 *   RLRQ c. B-1, r. 5, art. 7, 8, 9, 15, 19, 74 à 82 (LegisQuébec, à jour au 2026-04-01)
 *
 * Ces articles ne parlent pas de fidéicommis. Ils décrivent ce qu'un cabinet doit tenir
 * pour être un cabinet : un système de rappel des délais, un classement reconstituable,
 * le respect de ce qui appartient au client, et ce qui se passe quand l'avocat s'arrête.
 * Un inspecteur les vérifie au même titre que la comptabilité.
 *
 * ⚠️ CÔTÉ ONTARIEN, CE MODULE EST PRESQUE MUET, ET C'EST DÉLIBÉRÉ. By-Law 9 porte sur
 * les transactions financières et les registres ; il ne traite ni la prescription, ni
 * les originaux du client, ni la cession de pratique. Ces obligations existent
 * probablement en Ontario, mais dans des instruments qui n'ont PAS été lus (Rules of
 * Professional Conduct, Practice Management Guidelines). Les inventer par symétrie
 * serait la pire façon de servir un cabinet ontarien.
 */

import type { CabinetProvince } from "./rules";

/* ════════════════════════════════════════════════════════════════
   ART. 7 — LE SYSTÈME DE RAPPEL DES DÉLAIS
   ════════════════════════════════════════════════════════════════ */

/**
 * Nature d'une échéance.
 *
 * La distinction n'est pas cosmétique : un délai de prescription éteint le droit du
 * client. Le manquer n'est pas un retard, c'est une faute qui se répare en indemnisant.
 * Les autres échéances se rattrapent.
 */
export type DeadlineKind =
  /** Prescription : passé la date, le recours est éteint. */
  | "PRESCRIPTION"
  /** Délai de procédure : sanction possible, mais généralement relevable. */
  | "PROCEDURE"
  /** Échéance contractuelle ou conventionnelle. */
  | "CONTRACTUAL"
  /** Rappel interne, sans effet juridique. */
  | "INTERNAL";

export interface DeadlineRule {
  kind: DeadlineKind;
  labelFr: string;
  /** Une échéance de cette nature éteint-elle un droit ? */
  extinguishesRight: boolean;
  /** Jours avant échéance où l'alerte devient impérative. */
  alertDaysBefore: number[];
  reference: string;
  noteFr: string;
}

/**
 * Ce que l'art. 7 impose, et ce qu'il n'impose pas.
 *
 * > art. 7 : l'avocat doit tenir « un système à jour de rappel des dates de
 * > prescription et de tout délai influant sur les recours ».
 *
 * ⚠️ LE RÈGLEMENT NE FIXE AUCUN PRÉAVIS. « À jour » ne dit pas 90 jours, ni 30, ni 7.
 * Les seuils ci-dessous sont des CHOIX de produit, déclarés comme tels : ils existent
 * pour que l'alerte arrive assez tôt pour agir, pas parce qu'un article les prescrit.
 * Un cabinet peut les changer sans cesser d'être conforme.
 */
export function getDeadlineRule(params: {
  kind: DeadlineKind;
  province: CabinetProvince;
}): DeadlineRule {
  const reference =
    params.province === "QC"
      ? "B-1 r.5, art. 7"
      : "Aucun article de By-Law 9 — obligation non vérifiée en Ontario";

  switch (params.kind) {
    case "PRESCRIPTION":
      return {
        kind: params.kind,
        labelFr: "Délai de prescription",
        extinguishesRight: true,
        // Trois paliers : le temps de préparer, le temps de réagir, l'urgence.
        alertDaysBefore: [180, 90, 30, 7],
        reference,
        noteFr:
          "Passé cette date, le recours du client est éteint. Le manquer n'est pas un retard : c'est une faute qui se répare en indemnisant. Les préavis ne sont pas prescrits par l'art. 7, ce sont des choix de produit.",
      };
    case "PROCEDURE":
      return {
        kind: params.kind,
        labelFr: "Délai de procédure",
        extinguishesRight: false,
        alertDaysBefore: [30, 7, 1],
        reference,
        noteFr:
          "Sanction possible, généralement relevable. L'art. 7 vise « tout délai influant sur les recours », ce qui les couvre.",
      };
    case "CONTRACTUAL":
      return {
        kind: params.kind,
        labelFr: "Échéance contractuelle",
        extinguishesRight: false,
        alertDaysBefore: [30, 7],
        reference,
        noteFr: "Hors du périmètre littéral de l'art. 7, suivie par prudence.",
      };
    default:
      return {
        kind: "INTERNAL",
        labelFr: "Rappel interne",
        extinguishesRight: false,
        alertDaysBefore: [7],
        reference: "Aucun — rappel de confort",
        noteFr: "Sans effet juridique. Ne compte pas dans l'obligation de l'art. 7.",
      };
  }
}

export interface DeadlineAlert {
  daysRemaining: number;
  /** Palier franchi, ou `null` si aucun. */
  triggeredAt: number | null;
  overdue: boolean;
  severity: "CRITICAL" | "WARNING" | "INFO" | "NONE";
  messageFr: string;
  reference: string;
}

/**
 * Évalue une échéance.
 *
 * Une prescription DÉPASSÉE reste signalée, en permanence. Elle ne disparaît pas de
 * l'écran le lendemain : c'est précisément le moment où le cabinet doit agir — aviser
 * le client, aviser l'assureur. Un système qui la ferait disparaître aiderait à
 * l'oublier.
 */
export function evaluateDeadline(params: {
  kind: DeadlineKind;
  dueAt: Date;
  now: Date;
  province: CabinetProvince;
}): DeadlineAlert {
  const rule = getDeadlineRule({ kind: params.kind, province: params.province });
  const daysRemaining = Math.ceil(
    (params.dueAt.getTime() - params.now.getTime()) / 86_400_000,
  );
  const overdue = daysRemaining < 0;

  if (overdue) {
    return {
      daysRemaining,
      triggeredAt: null,
      overdue: true,
      severity: rule.extinguishesRight ? "CRITICAL" : "WARNING",
      messageFr: rule.extinguishesRight
        ? `Délai de prescription dépassé depuis ${Math.abs(daysRemaining)} jour(s). Le recours du client peut être éteint. Avisez le client et votre assureur.`
        : `Échéance dépassée depuis ${Math.abs(daysRemaining)} jour(s).`,
      reference: rule.reference,
    };
  }

  const triggeredAt =
    rule.alertDaysBefore.filter((d) => daysRemaining <= d).sort((a, b) => a - b)[0] ?? null;

  if (triggeredAt === null) {
    return {
      daysRemaining,
      triggeredAt: null,
      overdue: false,
      severity: "NONE",
      messageFr: `Échéance dans ${daysRemaining} jour(s).`,
      reference: rule.reference,
    };
  }

  return {
    daysRemaining,
    triggeredAt,
    overdue: false,
    severity: rule.extinguishesRight && triggeredAt <= 30 ? "CRITICAL" : "WARNING",
    messageFr: `${rule.labelFr} dans ${daysRemaining} jour(s).`,
    reference: rule.reference,
  };
}

/* ════════════════════════════════════════════════════════════════
   ART. 9 — LES DOSSIERS FERMÉS
   ════════════════════════════════════════════════════════════════ */

/**
 * Étendue de la liste des dossiers fermés.
 *
 * > art. 9 : liste à jour des dossiers actifs et des dossiers fermés « au cours des
 * > sept dernières années ».
 *
 * Sept ans, comme la conservation de l'art. 31 — mais ce n'est PAS la même obligation.
 * L'art. 31 dit combien de temps garder les livres ; l'art. 9 dit ce que le cabinet doit
 * pouvoir PRÉSENTER à tout moment. Un cabinet peut avoir gardé les dossiers sans pouvoir
 * en produire la liste, et c'est exactement ce qu'un inspecteur constate.
 */
export const CLOSED_MATTERS_LIST_YEARS = 7;

export function closedMattersListSince(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear() - CLOSED_MATTERS_LIST_YEARS, now.getUTCMonth(), now.getUTCDate()),
  );
}

/* ════════════════════════════════════════════════════════════════
   ART. 15 — LE REGISTRE DES CODES
   ════════════════════════════════════════════════════════════════ */

export interface CodeRegisterDuty {
  required: boolean;
  reference: string;
  dutyFr: string;
}

/**
 * Le registre des codes n'est exigé que SI la codification est utilisée.
 *
 * > art. 15 : système de classement ordonné ; lorsque les dossiers sont identifiés par
 * > un code, l'avocat tient un registre permettant de rattacher chaque code à son
 * > dossier.
 *
 * Imposer le registre à un cabinet qui nomme ses dossiers en clair ajouterait à
 * l'obligation. Le conditionnel de l'article est repris tel quel.
 */
export function getCodeRegisterDuty(params: {
  province: CabinetProvince;
  usesCodedIdentification: boolean;
}): CodeRegisterDuty {
  if (params.province !== "QC") {
    return {
      required: false,
      reference: "Aucun article de By-Law 9 — obligation non vérifiée en Ontario",
      dutyFr:
        "By-Law 9 ne traite pas le classement des dossiers. L'obligation existe peut-être ailleurs en Ontario, dans un texte qui n'a pas été lu.",
    };
  }
  if (!params.usesCodedIdentification) {
    return {
      required: false,
      reference: "B-1 r.5, art. 15",
      dutyFr:
        "Le registre des codes n'est exigé que si les dossiers sont identifiés par un code. Ce cabinet les nomme en clair.",
    };
  }
  return {
    required: true,
    reference: "B-1 r.5, art. 15",
    dutyFr:
      "Les dossiers étant identifiés par un code, un registre doit permettre de rattacher chaque code à son dossier.",
  };
}

/* ════════════════════════════════════════════════════════════════
   ART. 19 — LES ORIGINAUX DU CLIENT
   ════════════════════════════════════════════════════════════════ */

export interface OriginalDocumentVerdict {
  allowed: boolean;
  reference: string;
  reasonFr: string;
  remedyFr: string;
}

/**
 * Peut-on détruire ce document ?
 *
 * > art. 19 : l'avocat ne peut détruire un document ORIGINAL APPARTENANT AU CLIENT sans
 * > son autorisation, ou sans lui avoir donné la possibilité de le reprendre.
 *
 * Deux portes de sortie, pas une : l'autorisation OU l'offre de reprise. Un système qui
 * n'admettrait que l'autorisation bloquerait un cabinet dont le client ne répond plus,
 * et le pousserait à détruire sans rien consigner — ce qui est pire.
 *
 * ⚠️ LE DÉLAI DE L'OFFRE N'EST PAS DANS LE TEXTE. L'art. 19 ne dit pas combien de temps
 * attendre après avoir offert la reprise. La fonction exige donc qu'une offre ait été
 * faite et datée, mais ne déclare jamais un délai « écoulé » : ce serait fabriquer une
 * règle. C'est à l'avocat de juger, et la date est là pour qu'il puisse se justifier.
 */
export function canDestroyDocument(params: {
  province: CabinetProvince;
  isClientOriginal: boolean;
  clientAuthorizedAt?: Date | null;
  returnOfferedAt?: Date | null;
}): OriginalDocumentVerdict {
  const reference =
    params.province === "QC"
      ? "B-1 r.5, art. 19"
      : "Aucun article de By-Law 9 — obligation non vérifiée en Ontario";

  if (!params.isClientOriginal) {
    return {
      allowed: true,
      reference,
      reasonFr: "Ce document n'est pas un original appartenant au client.",
      remedyFr: "",
    };
  }

  if (params.clientAuthorizedAt) {
    return {
      allowed: true,
      reference,
      reasonFr: `Le client a autorisé la destruction le ${params.clientAuthorizedAt.toISOString().slice(0, 10)}.`,
      remedyFr: "",
    };
  }

  if (params.returnOfferedAt) {
    return {
      allowed: true,
      reference,
      reasonFr: `La possibilité de reprendre le document a été offerte au client le ${params.returnOfferedAt.toISOString().slice(0, 10)}.`,
      remedyFr:
        "L'art. 19 ne fixe aucun délai après l'offre. Le moment de détruire relève du jugement de l'avocat, et la date de l'offre est conservée pour le justifier.",
    };
  }

  return {
    allowed: false,
    reference,
    reasonFr:
      "Ce document est un original appartenant au client. Ni son autorisation ni une offre de reprise n'ont été consignées.",
    remedyFr:
      "Obtenez l'autorisation du client, OU consignez la date à laquelle vous lui avez offert de reprendre le document. L'art. 19 admet les deux.",
  };
}

/* ════════════════════════════════════════════════════════════════
   ART. 74 À 82 — LA CESSATION D'EXERCICE
   ════════════════════════════════════════════════════════════════ */

export type CessationCause = "RETRAIT" | "RADIATION" | "DECES" | "INAPTITUDE" | "AUTRE";

export interface CessationDuty {
  id: string;
  labelFr: string;
  reference: string;
  /** Obligation permanente, à tenir AVANT que la cause ne survienne. */
  anticipatory: boolean;
  detailFr: string;
}

/**
 * Ce qu'un cabinet doit avoir prévu, et ce qu'il doit faire le jour venu.
 *
 * L'obligation la plus facile à manquer est la première : l'art. 78 impose de PRÉVOIR
 * un cessionnaire. Elle se tient à froid, des années avant qu'elle ne serve, et rien ne
 * la rappelle. C'est pour cela qu'elle est marquée `anticipatory` : elle appartient au
 * tableau de conformité courant, pas à une procédure de fin de vie.
 */
export function getCessationDuties(params: {
  province: CabinetProvince;
  cause?: CessationCause | null;
}): CessationDuty[] {
  if (params.province !== "QC") {
    // ⚠️ Le LSO impose un plan de succession (obligation relevée en recherche web,
    // non lue dans un texte officiel). Elle n'est donc pas modélisée ici, et rien ne
    // prétend le contraire.
    return [];
  }

  const duties: CessationDuty[] = [
    {
      id: "CESS-78-CESSIONNAIRE",
      labelFr: "Désigner un cessionnaire",
      reference: "B-1 r.5, art. 78",
      anticipatory: true,
      detailFr:
        "Un avocat doit prévoir à qui ses dossiers, livres et registres seront cédés en cas de décès ou d'inaptitude. Cette obligation se tient à froid, souvent des années avant qu'elle ne serve.",
    },
    {
      id: "CESS-75-CESSION",
      labelFr: "Céder les dossiers, livres et registres à un avocat en exercice",
      reference: "B-1 r.5, art. 75",
      anticipatory: false,
      detailFr:
        "La cession se fait à un avocat en exercice. Les dossiers d'un cabinet qui s'arrête ne peuvent pas rester sans titulaire.",
    },
    {
      id: "CESS-76-AVIS",
      labelFr: "Aviser par écrit le syndic ET les clients",
      reference: "B-1 r.5, art. 76",
      anticipatory: false,
      detailFr:
        "Deux avis distincts, tous deux écrits. Aviser le syndic sans aviser les clients laisse ces derniers sans interlocuteur ; l'inverse prive l'ordre de sa surveillance.",
    },
    {
      id: "CESS-82-CONSERVATION",
      labelFr: "Conserver 7 ans les dossiers non repris",
      reference: "B-1 r.5, art. 82",
      anticipatory: false,
      detailFr:
        "Les dossiers qu'aucun client ne reprend restent conservés sept ans. La cessation d'exercice n'éteint pas l'obligation de conservation.",
    },
  ];

  return params.cause ? duties : duties.filter((d) => d.anticipatory);
}

/**
 * Le cabinet a-t-il prévu ce qu'il doit prévoir ?
 *
 * Une seule question aujourd'hui — le cessionnaire de l'art. 78 — mais elle est posée
 * en permanence, pas au moment où il est trop tard pour y répondre.
 */
export function findMissingAnticipatoryDuties(params: {
  province: CabinetProvince;
  hasDesignatedSuccessor: boolean;
}): CessationDuty[] {
  if (params.hasDesignatedSuccessor) return [];
  return getCessationDuties({ province: params.province }).filter((d) => d.anticipatory);
}
