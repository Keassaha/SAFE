/**
 * Lecture des trois journaux d'envoi d'un dossier (lot 0).
 *
 * Séparé de `chronologie.ts` exprès : ce fichier importe Prisma, l'autre non.
 * Les décisions vivent dans le module pur, qui se teste sans base ; ici on ne
 * fait que lire, et on ne décide de rien.
 *
 * Le cloisonnement des cabinets est porté par l'appelant, qui vérifie d'abord
 * que le dossier appartient bien au cabinet de la session. `DossierCorrespondence`
 * ne porte pas de `cabinetId` : c'est cette vérification préalable, et elle
 * seule, qui empêche de lire le cartable d'un autre cabinet.
 */

import { prisma } from "@/lib/db";
import { fusionnerChronologie, type EntreeCorrespondance } from "./chronologie";

/** Plafond par source. Un dossier ancien peut porter des centaines de lignes,
 *  et la chronologie du lot 0 n'a pas encore de pagination. On coupe haut et
 *  on le dit à l'écran plutôt que de charger sans limite. */
export const PLAFOND_PAR_SOURCE = 200;

export interface ChronologieChargee {
  entrees: EntreeCorrespondance[];
  /** Vrai si une source a atteint le plafond : l'écran doit alors avertir que
   *  la liste est partielle. Une troncature silencieuse se lit comme
   *  « il n'y a rien d'autre », ce qui est faux. */
  tronquee: boolean;
}

export async function chargerChronologie(
  cabinetId: string,
  dossierId: string,
): Promise<ChronologieChargee> {
  const [facturesEnvoyees, notifications, saisies] = await Promise.all([
    prisma.invoiceSendLog.findMany({
      where: { cabinetId, dossierId },
      orderBy: { createdAt: "desc" },
      take: PLAFOND_PAR_SOURCE,
      select: {
        id: true,
        subject: true,
        recipientEmail: true,
        status: true,
        errorMessage: true,
        attachmentName: true,
        sentAt: true,
        createdAt: true,
        invoice: { select: { numero: true } },
        sentBy: { select: { nom: true } },
      },
    }),
    prisma.notificationLog.findMany({
      where: { cabinetId, dossierId },
      orderBy: { sentAt: "desc" },
      take: PLAFOND_PAR_SOURCE,
      select: {
        id: true,
        type: true,
        subject: true,
        sentTo: true,
        status: true,
        sentAt: true,
        metadata: true,
      },
    }),
    prisma.dossierCorrespondence.findMany({
      where: { dossierId },
      orderBy: { createdAt: "desc" },
      take: PLAFOND_PAR_SOURCE,
      select: {
        id: true,
        typeCommunication: true,
        titre: true,
        expediteur: true,
        destinataire: true,
        dateCommunication: true,
        createdAt: true,
      },
    }),
  ]);

  const tronquee =
    facturesEnvoyees.length >= PLAFOND_PAR_SOURCE ||
    notifications.length >= PLAFOND_PAR_SOURCE ||
    saisies.length >= PLAFOND_PAR_SOURCE;

  return {
    entrees: fusionnerChronologie({ facturesEnvoyees, notifications, saisies }),
    tronquee,
  };
}

/** Plafond de la vue cabinet. Elle n'a pas de pagination non plus. */
export const PLAFOND_CABINET = 150;

const DOSSIER_LIE = { select: { id: true, intitule: true, numeroDossier: true } } as const;

/**
 * Toute la correspondance du cabinet, tous dossiers confondus.
 *
 * Ce n'est PAS une boîte de réception : rien n'y entre, on n'y répond pas, et
 * elle ne montre que ce qui est déjà rattaché à un dossier. C'est la même
 * chronologie que celle du cartable, vue de plus haut, pour répondre à une
 * question qu'aucun écran ne savait traiter : « qu'est-ce qui est parti du
 * cabinet cette semaine, et est-ce que tout est bien parti ».
 *
 * Les notifications sans dossier sont écartées : elles ne concernent pas un
 * mandat, donc elles n'ont rien à faire dans une vue de correspondance.
 */
export async function chargerChronologieCabinet(cabinetId: string): Promise<ChronologieChargee> {
  const [facturesEnvoyees, notifications, saisies] = await Promise.all([
    prisma.invoiceSendLog.findMany({
      where: { cabinetId },
      orderBy: { createdAt: "desc" },
      take: PLAFOND_CABINET,
      select: {
        id: true,
        subject: true,
        recipientEmail: true,
        status: true,
        errorMessage: true,
        attachmentName: true,
        sentAt: true,
        createdAt: true,
        invoice: { select: { numero: true } },
        sentBy: { select: { nom: true } },
        dossier: DOSSIER_LIE,
      },
    }),
    prisma.notificationLog.findMany({
      where: { cabinetId, dossierId: { not: null } },
      orderBy: { sentAt: "desc" },
      take: PLAFOND_CABINET,
      select: {
        id: true,
        type: true,
        subject: true,
        sentTo: true,
        status: true,
        sentAt: true,
        metadata: true,
        dossier: DOSSIER_LIE,
      },
    }),
    // `DossierCorrespondence` ne porte pas de `cabinetId` : le cloisonnement
    // passe par la relation. Ne jamais retirer ce `where`.
    prisma.dossierCorrespondence.findMany({
      where: { dossier: { cabinetId } },
      orderBy: { createdAt: "desc" },
      take: PLAFOND_CABINET,
      select: {
        id: true,
        typeCommunication: true,
        titre: true,
        expediteur: true,
        destinataire: true,
        dateCommunication: true,
        createdAt: true,
        dossier: DOSSIER_LIE,
      },
    }),
  ]);

  const tronquee =
    facturesEnvoyees.length >= PLAFOND_CABINET ||
    notifications.length >= PLAFOND_CABINET ||
    saisies.length >= PLAFOND_CABINET;

  return {
    entrees: fusionnerChronologie({ facturesEnvoyees, notifications, saisies }),
    tronquee,
  };
}
