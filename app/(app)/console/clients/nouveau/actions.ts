"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { isSafeIncCabinet, getSafeIncWorkspace } from "@/lib/safe-inc";
import { isConsoleIntakeEnabled } from "@/lib/flags";
import { computeFirmographicScore } from "@/lib/validations/crm-lead";
import { buildRecommendation } from "@/lib/audit-gratuit/recommendation";
import type { Prisma } from "@prisma/client";

/**
 * Intake client Console — crée un Lead à partir des réponses d'audit.
 *
 * Réutilise le questionnaire d'audit (`lib/audit-gratuit/questions.ts`) : les
 * réponses arrivent clés par id de question. On mappe les champs firmographiques
 * vers le Lead, on garde la totalité des réponses dans une AuditSubmission liée.
 * Doctrine + spec : docs/product/SPEC_INTAKE_CLIENT_CONSOLE.md
 */

type Answers = Record<string, unknown>;

// ── Helpers de mapping audit → Lead ──────────────────────────────────

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Nettoie une valeur radio-with-other ("other:Foo" → "Foo"). */
function cleanOther(v: unknown): string {
  const s = str(v);
  return s.startsWith("other:") ? s.slice(6).trim() : s;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "cabinet";
  let suffix = 1;
  while (await prisma.lead.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
    if (suffix > 100) {
      slug = `${base}-${Date.now()}`;
      break;
    }
  }
  return slug;
}

const PROVINCE_LEAD = new Set(["QC", "ON", "NB", "MB", "BC", "AB"]);
function mapProvince(v: unknown): "QC" | "ON" | "NB" | "MB" | "BC" | "AB" | "AUTRE" {
  const s = str(v).toUpperCase();
  return (PROVINCE_LEAD.has(s) ? s : "AUTRE") as
    | "QC" | "ON" | "NB" | "MB" | "BC" | "AB" | "AUTRE";
}

function mapLangue(v: unknown): "FR" | "EN" | "BILINGUE" {
  const arr = Array.isArray(v) ? v.map((x) => str(x)) : [];
  const fr = arr.includes("fr");
  const en = arr.includes("en");
  if (fr && en) return "BILINGUE";
  if (en && !fr) return "EN";
  return "FR";
}

function mapTaille(v: unknown): "SOLO" | "DEUX_CINQ" | "SIX_DIX" {
  const s = cleanOther(v);
  if (s === "1") return "SOLO";
  return "DEUX_CINQ";
}

function mapMode(v: unknown): "HORAIRE" | "FORFAIT" | "MIXTE" | undefined {
  const s = str(v);
  if (s === "horaire") return "HORAIRE";
  if (s === "forfait") return "FORFAIT";
  if (s === "mixte") return "MIXTE";
  return undefined; // "commission" ou vide → non renseigné
}

function splitName(full: string): { prenom: string; nom: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { prenom: "", nom: "" };
  if (parts.length === 1) return { prenom: parts[0], nom: "" };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

function validUrl(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  try {
    // eslint-disable-next-line no-new
    new URL(s.startsWith("http") ? s : `https://${s}`);
    return s.startsWith("http") ? s : `https://${s}`;
  } catch {
    return null;
  }
}

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
    const { cabinetId } = await requireCabinetAndUser();
    if (!(await isSafeIncCabinet(cabinetId))) {
      return { ok: false, error: "Accès réservé à SAFE Inc." };
    }
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
