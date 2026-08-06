"use server";

import { revalidatePath } from "next/cache";
import type { TypeTaskCrm, CrmPriorite } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireConsoleAccess } from "@/lib/safe-inc";
import {
  proposerActionsCrm,
  type AnalyseProspection,
  type PropositionAction,
} from "@/lib/ai/proposer-actions-crm";

/**
 * Assistant de prospection : lit l'état d'un lead, propose des tâches.
 *
 * Rien n'est écrit tant que vous n'acceptez pas une proposition. L'analyse est
 * déclenchée à la demande et non en arrière-plan : on ne dépense pas d'appel
 * modèle sur des dossiers que personne ne regarde, et surtout on ne remplit pas
 * la tour de contrôle de tâches que vous n'avez pas décidées.
 */

const DAY_MS = 1000 * 60 * 60 * 24;

const TYPES_VALIDES: TypeTaskCrm[] = [
  "FOLLOW_UP_EMAIL",
  "APPEL",
  "LINKEDIN_DM",
  "ENVOYER_RESSOURCE",
  "RELANCER",
  "MEETING",
  "PREPARER_AUDIT",
  "REVISION_BUNDLE",
  "ACTIVATION_STEP",
];

function joursDepuis(d: Date | null): number | null {
  if (!d) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / DAY_MS));
}

function finDeJournee(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export type AnalyseResult =
  | { ok: true; analyse: AnalyseProspection }
  | { ok: false; error: string };

export async function analyserProspection(leadId: string): Promise<AnalyseResult> {
  try {
    await requireConsoleAccess();

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        raisonSociale: true,
        ville: true,
        province: true,
        tailleCabinet: true,
        domainesPratique: true,
        logicielActuel: true,
        aTrustAccounting: true,
        stageLead: true,
        statutLead: true,
        score: true,
        sourceLead: true,
        notesPrivees: true,
        dateDerniereActivite: true,
        contacts: {
          select: {
            prenom: true,
            nom: true,
            titre: true,
            roleCrm: true,
            estDecideur: true,
            estChampionInterne: true,
            email: true,
            doNotContact: true,
          },
        },
        activities: {
          select: { type: true, direction: true, sujet: true, date: true },
          orderBy: { date: "desc" },
          take: 15,
        },
        tasks: {
          where: { statut: { in: ["A_FAIRE", "EN_COURS"] } },
          select: { titre: true, dateEcheance: true },
        },
      },
    });
    if (!lead) return { ok: false, error: "Cabinet introuvable." };

    const analyse = await proposerActionsCrm({
      raisonSociale: lead.raisonSociale,
      ville: lead.ville,
      province: lead.province,
      tailleCabinet: lead.tailleCabinet,
      domainesPratique: lead.domainesPratique,
      logicielActuel: lead.logicielActuel,
      aTrustAccounting: lead.aTrustAccounting,
      stageLead: lead.stageLead,
      statutLead: lead.statutLead,
      score: lead.score,
      sourceLead: lead.sourceLead,
      joursDepuisDerniereActivite: joursDepuis(lead.dateDerniereActivite),
      notesPrivees: lead.notesPrivees,
      contacts: lead.contacts.map((c) => ({
        prenom: c.prenom,
        nom: c.nom,
        titre: c.titre,
        role: c.roleCrm,
        estDecideur: c.estDecideur,
        estChampionInterne: c.estChampionInterne,
        aEmail: !!c.email,
        desabonne: c.doNotContact,
      })),
      activites: lead.activities.map((a) => ({
        type: a.type,
        direction: a.direction,
        sujet: a.sujet,
        ilYaJours: joursDepuis(a.date) ?? 0,
      })),
      tachesOuvertes: lead.tasks.map((t) => ({
        titre: t.titre,
        echeance: t.dateEcheance ? t.dateEcheance.toISOString().slice(0, 10) : null,
      })),
    });

    if (!analyse) {
      return {
        ok: false,
        error:
          "L'assistant n'est pas disponible (clé ANTHROPIC_API_KEY absente ou appel en échec).",
      };
    }

    return { ok: true, analyse };
  } catch (err) {
    console.error("analyserProspection error", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

/**
 * Transforme une proposition en tâche réelle. C'est le seul point où l'assistant
 * écrit quelque chose, et il faut un clic humain pour y arriver.
 */
export async function accepterProposition(
  leadId: string,
  proposition: PropositionAction,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireConsoleAccess();

    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
    if (!lead) return { ok: false, error: "Cabinet introuvable." };

    const type: TypeTaskCrm = TYPES_VALIDES.includes(proposition.type as TypeTaskCrm)
      ? (proposition.type as TypeTaskCrm)
      : "RELANCER";
    const priorite: CrmPriorite =
      proposition.priorite === "HAUTE" || proposition.priorite === "BASSE"
        ? proposition.priorite
        : "NORMALE";
    const titre = proposition.titre?.trim().slice(0, 140);
    if (!titre || titre.length < 3) return { ok: false, error: "Proposition vide." };

    const dansJours = Math.min(30, Math.max(0, Math.round(proposition.dansJours ?? 2)));

    await prisma.task.create({
      data: {
        leadId: lead.id,
        type,
        titre,
        description: proposition.motif?.trim() || null,
        priorite,
        statut: "A_FAIRE",
        dateEcheance: finDeJournee(new Date(Date.now() + dansJours * DAY_MS)),
        trigger: "MANUAL",
      },
    });

    revalidatePath("/console");
    revalidatePath(`/console/clients/${leadId}`);
    return { ok: true };
  } catch (err) {
    console.error("accepterProposition error", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}
