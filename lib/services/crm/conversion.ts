import crypto from "crypto";
import type { Prisma, TypeTaskCrm } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Conversion d'un Lead en Cabinet client.
 *
 * C'était le trou central du CRM : `Lead.cabinetId` était lu partout et écrit
 * nulle part, ce qui rendait décoratives les étapes SIGNED, ACTIVATION et LIVE,
 * et laissait `/console/clients` vide indéfiniment.
 *
 * Trois règles de conception :
 *
 *  - **Tout ou rien.** Une conversion interrompue au milieu laisserait un cabinet
 *    sans lead rattaché, ou un lead marqué converti sans cabinet. Tout passe donc
 *    par une transaction unique.
 *  - **Rien ne se perd.** L'historique de prospection reste rattaché au lead, et
 *    le lead reste rattaché au cabinet. On peut lire toute la relation depuis
 *    n'importe quel bout, pour toujours.
 *  - **Aucune communication automatique.** Le compte n'est pas créé et aucun
 *    courriel ne part. La conversion produit une invitation en attente ; l'envoi
 *    est un geste séparé, après vérification de la configuration.
 */

const DAY_MS = 1000 * 60 * 60 * 24;
const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

export type ConversionInput = {
  leadId: string;
  /** Nom légal du cabinet. Prérempli depuis le lead, corrigeable. */
  cabinetNom: string;
  cabinetEmail: string | null;
  cabinetTelephone: string | null;
  cabinetAdresse: string | null;
  /** Adresse de la personne qui recevra l'invitation d'administrateur. */
  adminEmail: string;
  plan: string;
  /** Format "MM-JJ". Sans lui, aucune durée de conservation n'est calculable. */
  fiscalYearEnd: string | null;
};

export type ConversionResult =
  | { ok: true; cabinetId: string; invitationId: string }
  | { ok: false; error: string };

/** Tâches d'intégration créées à la conversion. Ordre = ordre d'exécution. */
function tachesIntegration(opts: { aTrustAccounting: boolean }): {
  titre: string;
  type: TypeTaskCrm;
  jours: number;
  description: string;
}[] {
  const base = [
    {
      titre: "Tenir la rencontre de démarrage",
      type: "MEETING" as TypeTaskCrm,
      jours: 2,
      description: "Présenter le plan d'implantation et confirmer les accès.",
    },
    {
      titre: "Configurer le profil comptable du cabinet",
      type: "ACTIVATION_STEP" as TypeTaskCrm,
      jours: 3,
      description: "Province, taxes, fréquence de déclaration, logiciel externe.",
    },
    {
      titre: "Configurer le gabarit de facture",
      type: "ACTIVATION_STEP" as TypeTaskCrm,
      jours: 3,
      description: "En-tête, numérotation, conditions de paiement.",
    },
    {
      titre: "Importer les clients et dossiers existants",
      type: "ACTIVATION_STEP" as TypeTaskCrm,
      jours: 7,
      description: "Reprise des données. Valider les doublons avec le cabinet.",
    },
    {
      titre: "Former l'adjointe",
      type: "MEETING" as TypeTaskCrm,
      jours: 10,
      description: "Séance de prise en main. C'est elle qui fait vivre l'outil au quotidien.",
    },
    {
      titre: "Vérifier le parcours complet avant remise des accès",
      type: "ACTIVATION_STEP" as TypeTaskCrm,
      jours: 12,
      description: "Un dossier de bout en bout : client, temps, facture, paiement.",
    },
    {
      titre: "Suivi une semaine après le go-live",
      type: "RELANCER" as TypeTaskCrm,
      jours: 21,
      description: "Ce qui bloque, ce qui manque, ce qui surprend.",
    },
    {
      titre: "Suivi un mois après le go-live",
      type: "RELANCER" as TypeTaskCrm,
      jours: 45,
      description: "Usage réel, satisfaction, et première occasion de demander une référence.",
    },
  ];

  if (opts.aTrustAccounting) {
    base.splice(3, 0, {
      titre: "Configurer et vérifier le fidéicommis",
      type: "ACTIVATION_STEP" as TypeTaskCrm,
      jours: 5,
      description:
        "Comptes, soldes d'ouverture, premier rapprochement. À faire avant tout mouvement réel.",
    });
  }

  return base;
}

function finDeJournee(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * Convertit un lead signé en cabinet client, en une seule transaction.
 *
 * `userId` est l'auteur de la conversion, pour la piste d'audit. L'appelant a
 * déjà passé la garde Console.
 */
export async function convertirLeadEnCabinet(
  input: ConversionInput,
  userId: string,
): Promise<ConversionResult> {
  const nom = input.cabinetNom.trim();
  const adminEmail = input.adminEmail.trim().toLowerCase();

  if (nom.length < 2) return { ok: false, error: "Le nom du cabinet est requis." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminEmail)) {
    return { ok: false, error: "Adresse courriel de l'administrateur invalide." };
  }
  if (input.fiscalYearEnd && !/^\d{2}-\d{2}$/.test(input.fiscalYearEnd)) {
    return { ok: false, error: "Fin d'exercice attendue au format MM-JJ." };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    select: {
      id: true,
      raisonSociale: true,
      stageLead: true,
      cabinetId: true,
      aTrustAccounting: true,
    },
  });
  if (!lead) return { ok: false, error: "Cabinet introuvable." };
  if (lead.cabinetId) {
    return { ok: false, error: "Ce cabinet est déjà converti en client." };
  }
  if (lead.stageLead !== "SIGNED") {
    return {
      ok: false,
      error: "La conversion n'est possible qu'à l'étape « Signé ». Faites d'abord passer l'étape.",
    };
  }

  // Une adresse déjà utilisée ailleurs empêcherait l'acceptation de l'invitation.
  const dejaUtilisee = await prisma.user.findFirst({
    where: { email: adminEmail },
    select: { id: true },
  });
  if (dejaUtilisee) {
    return {
      ok: false,
      error: "Un compte existe déjà avec cette adresse. Utilisez une autre adresse.",
    };
  }

  const maintenant = new Date();
  const taches = tachesIntegration({ aTrustAccounting: lead.aTrustAccounting });

  try {
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const cabinet = await tx.cabinet.create({
          data: {
            nom,
            email: input.cabinetEmail?.trim() || null,
            telephone: input.cabinetTelephone?.trim() || null,
            adresse: input.cabinetAdresse?.trim() || null,
            fiscalYearEnd: input.fiscalYearEnd || null,
            plan: input.plan,
          },
          select: { id: true },
        });

        // Invitation en attente. Aucun compte créé, aucun courriel envoyé ici :
        // l'envoi est une action séparée, après vérification de la configuration.
        const invitation = await tx.invitation.create({
          data: {
            cabinetId: cabinet.id,
            createdById: userId,
            email: adminEmail,
            role: "admin_cabinet",
            token: crypto.randomBytes(32).toString("hex"),
            expiresAt: new Date(maintenant.getTime() + INVITATION_TTL_MS),
          },
          select: { id: true },
        });

        await tx.lead.update({
          where: { id: lead.id },
          data: {
            cabinetId: cabinet.id,
            convertedAt: maintenant,
            statutLead: "ACTIVE_CUSTOMER",
            stageLead: "ACTIVATION_IN_PROGRESS",
            dateDerniereActivite: maintenant,
          },
        });

        // `leadId` est unique : un second passage mettrait à jour au lieu de dupliquer.
        await tx.activationChecklist.upsert({
          where: { leadId: lead.id },
          create: { leadId: lead.id },
          update: {},
        });

        // Les tâches de prospection encore ouvertes n'ont plus d'objet. On les
        // annule avec un motif plutôt que de les supprimer : la trace reste.
        await tx.task.updateMany({
          where: { leadId: lead.id, statut: { in: ["A_FAIRE", "EN_COURS"] } },
          data: { statut: "ANNULEE", dateClosed: maintenant },
        });

        await tx.task.createMany({
          data: taches.map((t) => ({
            leadId: lead.id,
            type: t.type,
            titre: t.titre,
            description: t.description,
            priorite: "NORMALE" as const,
            statut: "A_FAIRE" as const,
            dateEcheance: finDeJournee(new Date(maintenant.getTime() + t.jours * DAY_MS)),
            trigger: "STAGE_CHANGE" as const,
          })),
        });

        await tx.activity.create({
          data: {
            leadId: lead.id,
            type: "CONTRAT_SIGNE",
            direction: "INTERNAL",
            sujet: "Conversion en cabinet client",
            contenu:
              `Cabinet « ${nom} » créé. Invitation d'administrateur en attente pour ${adminEmail}. ` +
              `${taches.length} tâches d'intégration créées.`,
            createdBy: userId,
          },
        });

        await tx.auditLog.create({
          data: {
            cabinetId: cabinet.id,
            userId,
            entityType: "Cabinet",
            entityId: cabinet.id,
            action: "create",
            newValues: JSON.stringify({
              origine: "conversion_lead",
              leadId: lead.id,
              raisonSociale: lead.raisonSociale,
              adminEmail,
              plan: input.plan,
            }),
            performedBy: userId,
            performedAt: maintenant,
          },
        });

        return { cabinetId: cabinet.id, invitationId: invitation.id };
      },
      { timeout: 15000 },
    );

    return { ok: true, ...result };
  } catch (err) {
    console.error("convertirLeadEnCabinet error", err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? `La conversion a échoué et rien n'a été créé. ${err.message}`
          : "La conversion a échoué et rien n'a été créé.",
    };
  }
}
