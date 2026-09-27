/**
 * SAFE — Rattachement d'une demande du site public au CRM.
 *
 * Jumeau de `lead-from-audit.ts`, pour l'autre voie d'entrée : le formulaire
 * de /contact et /demo, et la demande de rendez-vous. Même contrat, mot pour
 * mot, parce que c'est lui qui protège la demande :
 *
 *   la `DemandeSite` est écrite d'abord et prime sur tout le reste ;
 *   ce module ne throw jamais, il retourne `{ ok: false }` ;
 *   l'appelant journalise l'échec et poursuit.
 *
 * Une demande qui n'a pas atteint le CRM reste lisible dans la table et porte
 * la raison de l'échec dans `crmNote`. Rien ne disparaît.
 */

import { prisma } from "@/lib/db";
import { getSafeIncWorkspace } from "@/lib/safe-inc";
import { recomputeLeadScore } from "@/lib/services/crm/scoring";
import { slugify, splitName, uniqueSlug } from "@/lib/crm/lead-from-audit";

export type AttachDemandeOutcome =
  | { ok: true; leadId: string; created: boolean; note: string }
  | { ok: false; error: string };

/**
 * Taille du cabinet : le formulaire public ne la demande pas toujours.
 * Non déclarée, on ne devine pas — SOLO est la valeur la plus basse du
 * scoring firmographique, donc celle qui ne gonfle rien artificiellement.
 */
function mapTailleDeclaree(nbAvocats: string | null): {
  taille: "SOLO" | "DEUX_CINQ" | "SIX_DIX" | "ONZE_VINGT" | "VINGT_UN_CINQUANTE" | "PLUS_CINQUANTE";
  declaree: boolean;
} {
  const n = Number.parseInt((nbAvocats ?? "").replace(/[^0-9]/g, ""), 10);
  if (!Number.isFinite(n) || n <= 0) return { taille: "SOLO", declaree: false };
  if (n === 1) return { taille: "SOLO", declaree: true };
  if (n <= 5) return { taille: "DEUX_CINQ", declaree: true };
  if (n <= 10) return { taille: "SIX_DIX", declaree: true };
  if (n <= 20) return { taille: "ONZE_VINGT", declaree: true };
  if (n <= 50) return { taille: "VINGT_UN_CINQUANTE", declaree: true };
  return { taille: "PLUS_CINQUANTE", declaree: true };
}

export async function attachDemandeSiteToCrm(
  demandeId: string,
): Promise<AttachDemandeOutcome> {
  try {
    const demande = await prisma.demandeSite.findUnique({
      where: { id: demandeId },
    });

    if (!demande) {
      return { ok: false, error: `Demande ${demandeId} introuvable.` };
    }
    if (demande.leadId) {
      return {
        ok: true,
        leadId: demande.leadId,
        created: false,
        note: "Demande déjà rattachée à un lead.",
      };
    }

    const workspace = await getSafeIncWorkspace();
    const email = demande.email.trim().toLowerCase();
    const estRdv = demande.type === "RENDEZ_VOUS";
    const raisonSociale =
      (demande.cabinet ?? "").trim() || demande.nom.trim() || "Cabinet sans nom";

    const sujet = estRdv
      ? `Demande de rendez-vous — ${raisonSociale}`
      : `Demande écrite depuis le site — ${raisonSociale}`;

    const contenu = [
      `${demande.nom} a écrit depuis ${demande.page ?? "le site public"}.`,
      demande.raison ? `Raison : ${demande.raison}` : null,
      demande.momentSouhaite ? `Moments proposés : ${demande.momentSouhaite}` : null,
      demande.telephone ? `Téléphone : ${demande.telephone}` : null,
      `Référence : ${demande.id}`,
    ]
      .filter(Boolean)
      .join("\n");

    // ── Déduplication par courriel : quelqu'un qui écrit deux fois, ou qui a
    // déjà rempli l'audit, ne doit pas créer un second lead dans le pipeline.
    const existing = email
      ? await prisma.lead.findFirst({
          where: {
            workspaceId: workspace.id,
            contacts: { some: { email: { equals: email, mode: "insensitive" } } },
          },
          select: { id: true, raisonSociale: true },
        })
      : null;

    if (existing) {
      await prisma.lead.update({
        where: { id: existing.id },
        data: {
          dateDerniereActivite: new Date(),
          ...(estRdv ? { prioriteNurturing: "CONVERSATION_PROFONDE" as const } : {}),
        },
      });

      await prisma.activity.create({
        data: {
          leadId: existing.id,
          type: "EMAIL_RECU",
          direction: "INBOUND",
          sujet,
          contenu,
        },
      });

      await prisma.demandeSite.update({
        where: { id: demande.id },
        data: { leadId: existing.id },
      });

      await recomputeLeadScore(existing.id);

      return {
        ok: true,
        leadId: existing.id,
        created: false,
        note: `Demande rattachée au lead existant (${email}).`,
      };
    }

    // ── Création du lead ──
    const { taille, declaree } = mapTailleDeclaree(demande.nbAvocats);
    const slug = await uniqueSlug(slugify(raisonSociale));

    const lead = await prisma.lead.create({
      data: {
        raisonSociale,
        slug,
        // Le formulaire public ne demande ni la province ni la ville : on ne
        // les invente pas, quitte à ce que le score firmographique reste bas.
        province: "AUTRE",
        langue: demande.langue === "en" ? "EN" : "FR",
        tailleCabinet: taille,
        domainesPratique: [],
        sourceLead: "SITE_WEB",
        stageLead: "CONTACTED",
        statutLead: "NURTURE_ONLY",
        prioriteNurturing: estRdv ? "CONVERSATION_PROFONDE" : "ENGAGEMENT_LEGER",
        notesPrivees: [
          estRdv
            ? "Créé automatiquement à une demande de rendez-vous depuis le site."
            : "Créé automatiquement à une demande écrite depuis le site.",
          demande.raison ? `Raison déclarée : ${demande.raison}` : null,
          demande.momentSouhaite ? `Moments proposés : ${demande.momentSouhaite}` : null,
          declaree ? null : "Taille du cabinet non déclarée par le formulaire.",
          "Province non déclarée par le formulaire.",
        ]
          .filter(Boolean)
          .join("\n"),
        dateDerniereActivite: new Date(),
        workspace: { connect: { id: workspace.id } },
      },
    });

    const { prenom, nom } = splitName(demande.nom);
    await prisma.leadContact.create({
      data: {
        leadId: lead.id,
        prenom: prenom || demande.nom,
        nom: nom || "—",
        email: email || null,
        telephone: demande.telephone || null,
        languePref: demande.langue === "en" ? "EN" : "FR",
        roleCrm: "AVOCAT_PROPRIETAIRE",
        estDecideur: true,
      },
    });

    await prisma.activity.create({
      data: {
        leadId: lead.id,
        type: "EMAIL_RECU",
        direction: "INBOUND",
        sujet,
        contenu,
      },
    });

    await prisma.demandeSite.update({
      where: { id: demande.id },
      data: { leadId: lead.id },
    });

    await recomputeLeadScore(lead.id);

    return {
      ok: true,
      leadId: lead.id,
      created: true,
      note: `Lead créé pour ${raisonSociale}.`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
