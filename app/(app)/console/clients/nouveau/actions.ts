"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireConsoleAccess, getSafeIncWorkspace } from "@/lib/safe-inc";
import { isConsoleIntakeEnabled } from "@/lib/flags";
import { computeFirmographicScore } from "@/lib/validations/crm-lead";
import { buildRecommendation } from "@/lib/audit-gratuit/recommendation";
import {
  type Answers as SharedAnswers,
  cleanOther,
  mapLangue,
  mapMode,
  mapProvince,
  mapTaille,
  slugify,
  splitName,
  str,
  uniqueSlug,
  validUrl,
} from "@/lib/crm/lead-from-audit";
import type { Prisma } from "@prisma/client";

/**
 * Intake client Console — crée un Lead à partir des réponses d'audit.
 *
 * Réutilise le questionnaire d'audit (`lib/audit-gratuit/questions.ts`) : les
 * réponses arrivent clés par id de question. On mappe les champs firmographiques
 * vers le Lead, on garde la totalité des réponses dans une AuditSubmission liée.
 * Doctrine + spec : docs/product/SPEC_INTAKE_CLIENT_CONSOLE.md
 */

// Les helpers de mapping audit → Lead vivent dans `lib/crm/lead-from-audit.ts`,
// partagés avec le rattachement automatique de `POST /api/audit-gratuit`. Une
// seule définition : l'intake manuel et la voie automatique ne peuvent pas
// diverger sur la façon de lire une réponse d'audit.
type Answers = SharedAnswers;

export type ImportableAudit = {
  id: string;
  label: string;
  sub: string;
  answers: Answers;
};

/**
 * Audits gratuits soumis, pas encore rattachés à un client (Lead), donc
 * importables dans l'intake pour préremplir le formulaire (Mode A).
 */
export async function listImportableAudits(): Promise<ImportableAudit[]> {
  const subs = await prisma.auditSubmission.findMany({
    where: { lead: { is: null }, type: "cabinet" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      prospectNom: true,
      prospectCabinet: true,
      prospectEmail: true,
      createdAt: true,
      reponses: true,
    },
  });

  const out: ImportableAudit[] = [];
  for (const s of subs) {
    let answers: Answers = {};
    if (s.reponses) {
      try {
        const parsed = JSON.parse(s.reponses) as { answers?: Answers };
        answers = parsed.answers ?? (parsed as Answers);
      } catch {
        answers = {};
      }
    }
    const cabinet = s.prospectCabinet || str(answers.raison_sociale) || "Cabinet sans nom";
    const date = new Intl.DateTimeFormat("fr-CA", { day: "2-digit", month: "short", year: "numeric" }).format(s.createdAt);
    out.push({
      id: s.id,
      label: cabinet,
      sub: [s.prospectNom, s.prospectEmail, date].filter(Boolean).join(" · "),
      answers,
    });
  }
  return out;
}

export type IntakeResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

export async function createClientFromIntake(input: {
  answers: Answers;
  sourceLead: string;
  /** Mode A : réutiliser une AuditSubmission existante au lieu d'en créer une. */
  importedAuditId?: string | null;
}): Promise<IntakeResult> {
  try {
    if (!isConsoleIntakeEnabled()) {
      return { ok: false, error: "Fonctionnalité désactivée." };
    }
    await requireConsoleAccess();
    const workspace = await getSafeIncWorkspace();
    const a = input.answers ?? {};

    // ── Champs identité / contact ──
    const raisonSociale = str(a.raison_sociale);
    if (raisonSociale.length < 2) {
      return { ok: false, error: "Le nom du cabinet est requis (min. 2 caractères)." };
    }
    const loc = (a.localisation as { ville?: string; province?: string }) ?? {};
    const identite = (a.identite as { nom_complet?: string; titre?: string }) ?? {};
    const contact = (a.contact as { email?: string; telephone?: string }) ?? {};

    const province = mapProvince(loc.province);
    const tailleCabinet = mapTaille(a.nb_utilisateurs);
    const aTrustAccounting = ["actif", "peu"].includes(str(a.fideicommis_usage));
    const domainesPratique: string[] = []; // D3 : texte brut gardé en notes

    // ── Score firmographique (réutilise la fonction CRM) ──
    const scoreFirmographique = computeFirmographicScore({
      province,
      tailleCabinet,
      aTrustAccounting,
      domainesPratique,
    });

    // ── Recommandation d'audit (proxy de score global), best-effort ──
    let scoreGlobal: number | null = null;
    let scoresJson: string | null = null;
    try {
      const reco = buildRecommendation(a);
      scoreGlobal = Math.round(reco.roi.annualValue);
      scoresJson = JSON.stringify({
        hoursPerWeek: reco.roi.hoursPerWeek,
        annualValue: reco.roi.annualValue,
        offer: reco.safeOffer?.name ?? null,
      });
    } catch (e) {
      console.error("[intake] buildRecommendation failed:", e);
    }

    // ── Notes : on préserve le texte libre non mappé ──
    const notesParts: string[] = [];
    const domainesTexte = str(a.domaines_pratique);
    if (domainesTexte) notesParts.push(`Domaines de pratique : ${domainesTexte}`);
    const reve = str(a.automatisation_reve);
    if (reve) notesParts.push(`À automatiser en priorité : ${reve}`);
    notesParts.push("Créé via l'intake manuel de la Console.");
    const notesPrivees = notesParts.join("\n");

    // ── AuditSubmission liée (garde TOUTES les réponses) ──
    // Mode A : réutilise l'audit importé. Mode B : en crée un.
    const reponses = JSON.stringify({ lang: "fr", answers: a });
    let submissionId: string;
    if (input.importedAuditId) {
      const existing = await prisma.auditSubmission.findUnique({
        where: { id: input.importedAuditId },
        select: { id: true, lead: { select: { id: true } } },
      });
      if (!existing) {
        return { ok: false, error: "Audit importé introuvable." };
      }
      if (existing.lead) {
        return { ok: false, error: "Cet audit est déjà rattaché à un client." };
      }
      await prisma.auditSubmission.update({
        where: { id: existing.id },
        data: {
          status: "termine",
          reponses,
          scoreGlobal,
          scores: scoresJson,
          prospectCabinet: raisonSociale,
        },
      });
      submissionId = existing.id;
    } else {
      const created = await prisma.auditSubmission.create({
        data: {
          type: "cabinet",
          source: "onboarding",
          status: "termine",
          prospectNom: str(identite.nom_complet) || raisonSociale,
          prospectEmail: str(contact.email) || null,
          prospectTelephone: str(contact.telephone) || null,
          prospectCabinet: raisonSociale,
          reponses,
          scoreGlobal,
          scores: scoresJson,
        },
      });
      submissionId = created.id;
    }

    // ── Lead ──
    const slug = await uniqueSlug(slugify(raisonSociale));
    const leadData: Prisma.LeadCreateInput = {
      raisonSociale,
      slug,
      province,
      ville: str(loc.ville) || null,
      langue: mapLangue(a.langues),
      siteWeb: validUrl(a.site_web),
      tailleCabinet,
      domainesPratique,
      modeFacturation: mapMode(a.mode_facturation) ?? null,
      aTrustAccounting,
      logicielActuel: cleanOther(a.logiciel_actuel) || null,
      sourceLead: (input.sourceLead as Prisma.LeadCreateInput["sourceLead"]) ?? "OFFLINE",
      notesPrivees,
      score: scoreFirmographique,
      scoreFirmographique,
      dateDerniereActivite: new Date(),
      workspace: { connect: { id: workspace.id } },
      auditSubmission: { connect: { id: submissionId } },
    };
    const lead = await prisma.lead.create({ data: leadData });

    // ── Contact principal (personne-ressource) ──
    const nomComplet = str(identite.nom_complet);
    if (nomComplet) {
      const { prenom, nom } = splitName(nomComplet);
      await prisma.leadContact.create({
        data: {
          leadId: lead.id,
          prenom: prenom || nomComplet,
          nom: nom || "—",
          titre: str(identite.titre) || null,
          email: str(contact.email) || null,
          telephone: str(contact.telephone) || null,
          roleCrm: "AVOCAT_PROPRIETAIRE",
          estDecideur: true,
        },
      });
    }

    revalidatePath("/console/clients");
    revalidatePath("/console/leads");
    revalidatePath("/console/pipeline");
    return { ok: true, leadId: lead.id };
  } catch (err) {
    console.error("createClientFromIntake error", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}
