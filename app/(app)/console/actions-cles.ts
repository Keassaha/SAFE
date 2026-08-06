"use server";

import { revalidatePath } from "next/cache";
import type { TypeTaskCrm, CrmPriorite } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireConsoleAccess, getSafeIncWorkspace } from "@/lib/safe-inc";
import { recomputeLeadScore } from "@/lib/services/crm/scoring";

/**
 * Actions de la tour de contrôle : fermer, reporter, ou imposer sa propre
 * prochaine action clé.
 *
 * Trois règles de conception :
 *  - « C'est fait » écrit une trace réelle (Activity), pas seulement un état
 *    d'écran. Sans trace, l'action déduite reviendrait à la seconde suivante.
 *  - « Reporter » crée une vraie Task datée. Un report est une décision, elle
 *    mérite d'exister en base et de revenir d'elle-même le jour dit.
 *  - Un billet de support ne se ferme pas d'ici : il faut avoir répondu. On
 *    n'offre donc pas de bouton qui permettrait de faire disparaître un client
 *    qui attend.
 */

const DAY_MS = 1000 * 60 * 60 * 24;

export type ActionCleResult = { ok: true } | { ok: false; error: string };

const VALID_TYPES: TypeTaskCrm[] = [
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

function finDeJournee(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function revalider(leadId?: string | null) {
  revalidatePath("/console");
  revalidatePath("/console/pipeline");
  revalidatePath("/console/leads");
  if (leadId) revalidatePath(`/console/clients/${leadId}`);
}

/** Décompose une clé d'action ("task:xxx" | "lead:xxx:SOURCE" | "ticket:xxx"). */
function parseCle(cle: string): { kind: string; id: string } | null {
  const [kind, id] = cle.split(":");
  if (!kind || !id) return null;
  if (!["task", "lead", "ticket"].includes(kind)) return null;
  return { kind, id };
}

/**
 * Marque l'action clé comme faite.
 *
 * Tâche explicite  : passe en TERMINEE et logge l'activité correspondante.
 * Action déduite   : logge l'activité, ce qui rafraîchit `dateDerniereActivite`
 *                    et fait naturellement taire la déduction.
 */
export async function terminerActionCle(
  cle: string,
  note?: string,
): Promise<ActionCleResult> {
  try {
    const { userId } = await requireConsoleAccess();
    const parsed = parseCle(cle);
    if (!parsed) return { ok: false, error: "Action inconnue" };

    if (parsed.kind === "ticket") {
      return {
        ok: false,
        error: "Un billet de support se ferme depuis le billet, après réponse.",
      };
    }

    let leadId: string | null = null;
    let sujet = "Action clé";

    if (parsed.kind === "task") {
      const task = await prisma.task.findUnique({
        where: { id: parsed.id },
        select: { id: true, leadId: true, titre: true, statut: true },
      });
      if (!task) return { ok: false, error: "Tâche introuvable" };
      leadId = task.leadId;
      sujet = task.titre;
      await prisma.task.update({
        where: { id: task.id },
        data: { statut: "TERMINEE", dateClosed: new Date() },
      });
    } else {
      const lead = await prisma.lead.findUnique({
        where: { id: parsed.id },
        select: { id: true },
      });
      if (!lead) return { ok: false, error: "Lead introuvable" };
      leadId = lead.id;
      sujet = note?.trim() || "Action clé traitée";
    }

    if (leadId) {
      await prisma.activity.create({
        data: {
          leadId,
          type: "NOTE",
          direction: "OUTBOUND",
          sujet,
          contenu: note?.trim() || null,
          createdBy: userId,
        },
      });
      await prisma.lead.update({
        where: { id: leadId },
        data: { dateDerniereActivite: new Date() },
      });
      await recomputeLeadScore(leadId);
    }

    revalider(leadId);
    return { ok: true };
  } catch (err) {
    console.error("terminerActionCle error", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

/**
 * Reporte l'action clé de N jours. Le report crée (ou déplace) une Task datée :
 * l'action revient d'elle-même à l'échéance, et le lead reste silencieux
 * jusque-là.
 */
export async function reporterActionCle(
  cle: string,
  jours: number,
  titreSecours?: string,
): Promise<ActionCleResult> {
  try {
    await requireConsoleAccess();
    const parsed = parseCle(cle);
    if (!parsed) return { ok: false, error: "Action inconnue" };
    if (parsed.kind === "ticket") {
      return { ok: false, error: "Un billet de support ne se reporte pas." };
    }
    if (!Number.isInteger(jours) || jours < 1 || jours > 90) {
      return { ok: false, error: "Report invalide (1 à 90 jours)" };
    }

    const echeance = finDeJournee(new Date(Date.now() + jours * DAY_MS));

    if (parsed.kind === "task") {
      const task = await prisma.task.findUnique({
        where: { id: parsed.id },
        select: { id: true, leadId: true },
      });
      if (!task) return { ok: false, error: "Tâche introuvable" };
      await prisma.task.update({
        where: { id: task.id },
        data: { dateEcheance: echeance, statut: "A_FAIRE" },
      });
      revalider(task.leadId);
      return { ok: true };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: parsed.id },
      select: { id: true, raisonSociale: true },
    });
    if (!lead) return { ok: false, error: "Lead introuvable" };

    await prisma.task.create({
      data: {
        leadId: lead.id,
        type: "RELANCER",
        titre: titreSecours?.trim() || `Reprendre ${lead.raisonSociale}`,
        priorite: "NORMALE",
        statut: "A_FAIRE",
        dateEcheance: echeance,
        trigger: "MANUAL",
      },
    });

    revalider(lead.id);
    return { ok: true };
  } catch (err) {
    console.error("reporterActionCle error", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

/**
 * Impose une prochaine action clé décidée à la main. Elle bat toute déduction
 * du moteur : votre décision passe avant l'heuristique.
 */
export async function planifierActionCle(formData: FormData): Promise<ActionCleResult> {
  try {
    await requireConsoleAccess();
    const workspace = await getSafeIncWorkspace();

    const leadId = String(formData.get("leadId") || "").trim();
    const titre = String(formData.get("titre") || "").trim();
    const type = String(formData.get("type") || "RELANCER") as TypeTaskCrm;
    const priorite = String(formData.get("priorite") || "HAUTE") as CrmPriorite;
    const dateStr = String(formData.get("dateEcheance") || "").trim();

    if (titre.length < 3) return { ok: false, error: "Décrivez l'action (min. 3 caractères)." };
    if (!VALID_TYPES.includes(type)) return { ok: false, error: "Type d'action invalide" };
    if (!["HAUTE", "NORMALE", "BASSE"].includes(priorite)) {
      return { ok: false, error: "Priorité invalide" };
    }

    if (leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, workspaceId: workspace.id },
        select: { id: true },
      });
      if (!lead) return { ok: false, error: "Lead introuvable" };
    }

    // Pas de date fournie = pour aujourd'hui. Une action clé sans échéance
    // n'existe pas : elle redeviendrait invisible.
    const echeance = dateStr ? finDeJournee(new Date(`${dateStr}T12:00:00`)) : finDeJournee(new Date());
    if (Number.isNaN(echeance.getTime())) return { ok: false, error: "Date invalide" };

    await prisma.task.create({
      data: {
        leadId: leadId || null,
        type,
        titre,
        priorite,
        statut: "A_FAIRE",
        dateEcheance: echeance,
        trigger: "MANUAL",
      },
    });

    revalider(leadId || null);
    return { ok: true };
  } catch (err) {
    console.error("planifierActionCle error", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}
