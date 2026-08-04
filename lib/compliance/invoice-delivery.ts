/**
 * Transmission de la facture au client.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI, `now` injecté.
 *
 * Sources lues intégralement le 2026-07-30 :
 *   RLRQ c. B-1, r. 5, art. 56(2) (LegisQuébec, à jour au 2026-04-01)
 *   LSO By-Law 9, s. 9(1)3 (PDF officiel, version du 2017-04-27)
 *
 * ────────────────────────────────────────────────────────────────
 * LE MOT QUI COMPTE
 * ────────────────────────────────────────────────────────────────
 *
 *   art. 56(2) QC : le retrait est permis pour les honoraires et débours
 *                   « pour lesquels la facturation a été ENVOYÉE ».
 *   s. 9(1)3 ON   : fees « for which a billing has been DELIVERED ».
 *
 * Envoyée, pas préparée. Délivrée, pas émise. C'est la transmission au client qui
 * ouvre le droit de retirer, pas la production du document.
 *
 * ────────────────────────────────────────────────────────────────
 * LE DÉFAUT QUE CE MODULE CORRIGE
 * ────────────────────────────────────────────────────────────────
 *
 * Jusqu'au 2026-08-03, `issueInvoice` posait `sentAt: now` AU MOMENT DE L'ÉMISSION,
 * sans qu'aucun envoi n'ait eu lieu. Le garde-fou du retrait vérifiait donc une date
 * qui ne prouvait rien : toute facture émise passait.
 *
 * Ce n'était pas une régression : c'est un défaut préexistant que le garde-fou du
 * CH-00 a rendu visible, en s'appuyant dessus.
 *
 * ────────────────────────────────────────────────────────────────
 * POURQUOI IL Y A PLUSIEURS CANAUX
 * ────────────────────────────────────────────────────────────────
 *
 * ⚠️ N'ACCEPTER QUE L'ENVOI COURRIEL DE SAFE SERAIT DU SUR-BLOCAGE. Un cabinet qui
 * poste ses factures, les remet en main propre ou les envoie depuis son propre client
 * courriel a bel et bien « envoyé la facturation » au sens du règlement. Lui refuser
 * le retrait le pousserait à contourner — et le contournement produit exactement la
 * perte de traçabilité qu'on voulait éviter.
 *
 * Le module distingue donc ce qui est PROUVÉ de ce qui est DÉCLARÉ, et laisse passer
 * les deux en le disant. C'est l'inspecteur qui juge la valeur d'une déclaration ;
 * le rôle du logiciel est de la dater, de l'attribuer et de ne pas la maquiller en
 * preuve.
 */

import type { CabinetProvince } from "./rules";

/* ════════════════════════════════════════════════════════════════
   LES CANAUX
   ════════════════════════════════════════════════════════════════ */

export type DeliveryChannel =
  /** Envoi courriel effectué par SAFE. Le seul canal dont SAFE détient la preuve. */
  | "EMAIL_SAFE"
  /** Courriel envoyé depuis le poste du cabinet, hors SAFE. */
  | "AUTRE_COURRIEL"
  | "POSTE"
  | "MAIN_PROPRE"
  | "PORTAIL_CLIENT"
  /**
   * Facture antérieure au 2026-08-03, dont `sentAt` avait été posé à l'émission.
   * La transmission est PRÉSUMÉE, jamais prouvée. Voir la section « héritage ».
   */
  | "LEGACY_PRESUME";

export interface DeliveryChannelInfo {
  channel: DeliveryChannel;
  labelFr: string;
  /** SAFE détient-il la preuve de la transmission, ou seulement une déclaration ? */
  proven: boolean;
  /** Le canal peut-il être choisi par l'utilisateur ? */
  selectable: boolean;
  noteFr: string;
}

const CHANNELS: DeliveryChannelInfo[] = [
  {
    channel: "EMAIL_SAFE",
    labelFr: "Courriel envoyé depuis SAFE",
    proven: true,
    selectable: false, // posé automatiquement par la route d'envoi, jamais à la main
    noteFr:
      "SAFE conserve le journal d'envoi : destinataire, objet, pièce jointe, horodatage. C'est le seul canal dont la preuve est dans le système.",
  },
  {
    channel: "AUTRE_COURRIEL",
    labelFr: "Courriel envoyé hors SAFE",
    proven: false,
    selectable: true,
    noteFr: "Conservez le courriel envoyé : c'est lui qui fait preuve, pas cette déclaration.",
  },
  {
    channel: "POSTE",
    labelFr: "Postée au client",
    proven: false,
    selectable: true,
    noteFr: "Conservez la preuve de dépôt si vous en avez une.",
  },
  {
    channel: "MAIN_PROPRE",
    labelFr: "Remise en main propre",
    proven: false,
    selectable: true,
    noteFr: "Notez la date exacte de la remise.",
  },
  {
    channel: "PORTAIL_CLIENT",
    labelFr: "Déposée sur un portail client",
    proven: false,
    selectable: true,
    noteFr: "La mise à disposition vaut transmission si le client y a accès.",
  },
  {
    channel: "LEGACY_PRESUME",
    labelFr: "Transmission présumée (facture antérieure au 2026-08-03)",
    proven: false,
    selectable: false,
    noteFr:
      "Cette facture a été émise avant que SAFE ne distingue l'émission de la transmission. La date reprise est celle de l'émission : elle ne prouve pas l'envoi.",
  },
];

export function getDeliveryChannels(): DeliveryChannelInfo[] {
  return CHANNELS;
}

/** Canaux qu'un utilisateur peut déclarer lui-même. */
export function getSelectableDeliveryChannels(): DeliveryChannelInfo[] {
  return CHANNELS.filter((c) => c.selectable);
}

export function getChannelInfo(channel: string | null | undefined): DeliveryChannelInfo | null {
  return CHANNELS.find((c) => c.channel === channel) ?? null;
}

/**
 * Date de bascule du découplage émission / transmission.
 *
 * Toute facture dont la transmission a été reprise depuis l'ancien `sentAt` porte le
 * canal `LEGACY_PRESUME`. La date est écrite ici plutôt que déduite, pour qu'on puisse
 * la citer dans un rapport et la retrouver dans six mois.
 */
export const DELIVERY_DECOUPLING_DATE = "2026-08-03";

/* ════════════════════════════════════════════════════════════════
   LE VERDICT
   ════════════════════════════════════════════════════════════════ */

export interface DeliveryVerdict {
  /** La facture peut-elle appuyer un retrait ? */
  allowed: boolean;
  /** SAFE détient-il la preuve, ou seulement une déclaration ? */
  proven: boolean;
  reference: string;
  reasonFr: string;
  /** Ce que l'utilisateur doit faire quand ce n'est pas permis. */
  remedyFr: string;
  /** Signalement à porter au rapport, même quand c'est permis. */
  flagFr: string | null;
}

/**
 * La facture a-t-elle été transmise au sens de l'art. 56(2) / s. 9(1)3 ?
 *
 * Trois issues, pas deux :
 *   - refusée   : rien ne dit qu'elle a été transmise ;
 *   - permise et prouvée   : SAFE l'a envoyée et en garde le journal ;
 *   - permise et déclarée  : le cabinet affirme l'avoir transmise. C'est recevable,
 *                            et c'est signalé comme déclaration, pas comme preuve.
 *
 * La troisième issue est ce qui empêche ce garde-fou d'être un mur.
 */
export function evaluateDelivery(params: {
  province: CabinetProvince;
  deliveredAt: Date | null;
  deliveryChannel: string | null;
}): DeliveryVerdict {
  const qc = params.province === "QC";
  const reference = qc ? "B-1 r.5, art. 56(2)" : "By-Law 9, s. 9(1)3";
  const citation = qc
    ? "« pour lesquels la facturation a été envoyée »"
    : "« for which a billing has been delivered »";

  if (!params.deliveredAt) {
    return {
      allowed: false,
      proven: false,
      reference,
      reasonFr: `Cette facture n'a pas été transmise au client. Le règlement dit ${citation} : l'émettre ne suffit pas.`,
      remedyFr:
        "Envoyez-la depuis SAFE, ou déclarez la transmission si vous l'avez postée, remise en main propre ou envoyée autrement. La déclaration est datée et vous est attribuée.",
      flagFr: null,
    };
  }

  const info = getChannelInfo(params.deliveryChannel);

  if (!info) {
    // Une date sans canal : on ne sait pas d'où elle vient. Refuser plutôt que
    // supposer, sinon n'importe quelle date écrite en base ouvrirait le retrait.
    return {
      allowed: false,
      proven: false,
      reference,
      reasonFr:
        "Une date de transmission existe mais son canal est inconnu. SAFE ne peut pas dire comment cette facture a été transmise.",
      remedyFr: "Déclarez à nouveau la transmission en précisant le canal.",
      flagFr: null,
    };
  }

  if (info.proven) {
    return {
      allowed: true,
      proven: true,
      reference,
      reasonFr: `Transmise le ${params.deliveredAt.toISOString().slice(0, 10)} : ${info.labelFr.toLowerCase()}.`,
      remedyFr: "",
      flagFr: null,
    };
  }

  if (info.channel === "LEGACY_PRESUME") {
    return {
      allowed: true,
      proven: false,
      reference,
      reasonFr: `Transmission présumée au ${params.deliveredAt.toISOString().slice(0, 10)}, reprise de l'ancienne date d'émission.`,
      remedyFr: "",
      // Signalé, pas bloqué. Bloquer rétroactivement empêcherait un cabinet de
      // retirer sur des factures réellement transmises, sur la seule base d'un
      // défaut logiciel qui n'est pas le sien.
      flagFr: `Retrait appuyé sur une transmission PRÉSUMÉE (facture antérieure au ${DELIVERY_DECOUPLING_DATE}). Aucune preuve d'envoi n'est conservée dans SAFE.`,
    };
  }

  return {
    allowed: true,
    proven: false,
    reference,
    reasonFr: `Transmission déclarée le ${params.deliveredAt.toISOString().slice(0, 10)} : ${info.labelFr.toLowerCase()}.`,
    remedyFr: "",
    flagFr: `Transmission DÉCLARÉE par le cabinet (${info.labelFr.toLowerCase()}), non prouvée par SAFE. ${info.noteFr}`,
  };
}

/* ════════════════════════════════════════════════════════════════
   DÉCLARATION MANUELLE
   ════════════════════════════════════════════════════════════════ */

export interface DeclarationRequirement {
  field: "deliveredAt" | "deliveryChannel";
  labelFr: string;
  whyFr: string;
}

/**
 * Ce qu'une déclaration de transmission doit porter.
 *
 * La date et le canal, rien de plus. Exiger une pièce jointe transformerait la porte
 * de sortie en second mur, et un cabinet qui a posté une facture n'a souvent que sa
 * parole — ce que le règlement n'interdit pas.
 */
export function getDeclarationRequirements(): DeclarationRequirement[] {
  return [
    {
      field: "deliveredAt",
      labelFr: "Date de la transmission",
      whyFr:
        "C'est elle qui ouvre le droit de retirer, et elle doit être antérieure au retrait.",
    },
    {
      field: "deliveryChannel",
      labelFr: "Comment la facture a été transmise",
      whyFr:
        "Le canal détermine si SAFE détient la preuve ou seulement votre déclaration. Les deux sont recevables, la différence est écrite au dossier.",
    },
  ];
}

export function findMissingDeclarationFields(params: {
  deliveredAt?: Date | null;
  deliveryChannel?: string | null;
}): DeclarationRequirement["field"][] {
  const missing: DeclarationRequirement["field"][] = [];
  if (!params.deliveredAt) missing.push("deliveredAt");

  const info = getChannelInfo(params.deliveryChannel);
  // Un canal non déclarable (EMAIL_SAFE, LEGACY_PRESUME) ne peut pas être choisi à la
  // main : sinon n'importe qui pourrait s'attribuer la preuve d'un envoi SAFE.
  if (!info || !info.selectable) missing.push("deliveryChannel");

  return missing;
}

/**
 * Une transmission ne peut pas être postérieure au retrait qu'elle justifie.
 *
 * Sans ce contrôle, un cabinet pourrait retirer aujourd'hui et déclarer demain avoir
 * transmis la semaine dernière. La chronologie est ce qui rend la déclaration
 * vérifiable.
 */
export function isDeliveryBeforeWithdrawal(params: {
  deliveredAt: Date;
  withdrawalDate: Date;
}): boolean {
  return params.deliveredAt.getTime() <= params.withdrawalDate.getTime();
}
