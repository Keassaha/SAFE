/**
 * SAFE — Rattachement d'une soumission d'audit au CRM.
 *
 * Un prospect qui remplit l'audit gratuit doit apparaître dans le pipeline de la
 * Console tout de suite, sans import manuel. Ce module porte le mapping
 * audit -> Lead partagé par les deux voies d'entrée :
 *   - POST /api/audit-gratuit  (voie automatique, publique, non authentifiée)
 *   - console/clients/nouveau  (intake manuel, Mode A/B)
 *
 * Contrat : jamais bloquant pour la soumission. L'appelant public enveloppe
 * l'appel et absorbe l'échec ; la soumission et les courriels priment sur le CRM.
 *
 * Spec : docs/product/CRM_SPEC_v1.md (Lead.auditSubmissionId, ADR-006)
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSafeIncWorkspace } from "@/lib/safe-inc";
import { recomputeLeadScore } from "@/lib/services/crm/scoring";

export type Answers = Record<string, unknown>;

// ── Helpers de mapping audit → Lead ──────────────────────────────────
// Partagés avec l'intake manuel de la Console : une seule définition, pour que
// les deux voies ne divergent pas au fil des modifications.

export function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Nettoie une valeur radio-with-other ("other:Foo" → "Foo"). */
export function cleanOther(v: unknown): string {
  const s = str(v);
  return s.startsWith("other:") ? s.slice(6).trim() : s;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uniqueSlug(base: string): Promise<string> {
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

export function mapProvince(
  v: unknown,
): "QC" | "ON" | "NB" | "MB" | "BC" | "AB" | "AUTRE" {
  const s = str(v).toUpperCase();
  return (PROVINCE_LEAD.has(s) ? s : "AUTRE") as
    | "QC" | "ON" | "NB" | "MB" | "BC" | "AB" | "AUTRE";
}

export function mapLangue(v: unknown): "FR" | "EN" | "BILINGUE" {
  const arr = Array.isArray(v) ? v.map((x) => str(x)) : [];
  const fr = arr.includes("fr");
  const en = arr.includes("en");
  if (fr && en) return "BILINGUE";
  if (en && !fr) return "EN";
  return "FR";
}

export function mapTaille(v: unknown): "SOLO" | "DEUX_CINQ" | "SIX_DIX" {
  const s = cleanOther(v);
  if (s === "1") return "SOLO";
  return "DEUX_CINQ";
}

export function mapMode(v: unknown): "HORAIRE" | "FORFAIT" | "MIXTE" | undefined {
  const s = str(v);
  if (s === "horaire") return "HORAIRE";
  if (s === "forfait") return "FORFAIT";
  if (s === "mixte") return "MIXTE";
  return undefined; // "commission" ou vide → non renseigné
}

export function splitName(full: string): { prenom: string; nom: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { prenom: "", nom: "" };
  if (parts.length === 1) return { prenom: parts[0], nom: "" };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

export function validUrl(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  try {
    const normalized = s.startsWith("http") ? s : `https://${s}`;
    new URL(normalized); // valide l'URL, la valeur retournée est la forme normalisée
    return normalized;
  } catch {
    return null;
  }
}

/** Nombre d'utilisateurs déclaré, quand il est exploitable comme entier. */
function parseNbUtilisateurs(v: unknown): number | null {
  const n = Number.parseInt(cleanOther(v), 10);
  return Number.isFinite(n) && n > 0 && n < 1000 ? n : null;
}

// ── Lecture d'une soumission ─────────────────────────────────────────

/** Extrait les réponses d'une AuditSubmission.reponses, quel que soit le format. */
export function parseAnswers(reponses: string | null): Answers {
  if (!reponses) return {};
  try {
    const parsed = JSON.parse(reponses) as { answers?: Answers };
    return parsed.answers ?? (parsed as Answers);
  } catch {
    return {};
  }
}

/** Résumé chiffré du rapport, pour le fil d'activité. Best-effort. */
function summarizeRapport(rapport: string | null): string | null {
  if (!rapport) return null;
  try {
    const r = JSON.parse(rapport) as {
      safeOffer?: { name?: string; monthly?: number };
      roi?: { annualValue?: number; hoursPerWeek?: number };
      urgencyLevel?: string;
      riskScore?: { total?: number; verdict?: string };
    };
    const bits: string[] = [];
    if (r.safeOffer?.name) {
      bits.push(
        `Offre recommandée : ${r.safeOffer.name}` +
          (typeof r.safeOffer.monthly === "number"
            ? ` (${r.safeOffer.monthly} $ / mois)`
            : ""),
      );
    }
    if (typeof r.roi?.annualValue === "number") {
      bits.push(
        `ROI estimé : ${r.roi.annualValue.toLocaleString("fr-CA")} $ / an` +
          (typeof r.roi.hoursPerWeek === "number"
            ? `, ${r.roi.hoursPerWeek} h / semaine`
            : ""),
      );
    }
    if (typeof r.riskScore?.total === "number") {
      bits.push(
        `Score de risque : ${r.riskScore.total}` +
          (r.riskScore.verdict ? ` (${r.riskScore.verdict})` : ""),
      );
    }
    if (r.urgencyLevel) bits.push(`Urgence déclarée : ${r.urgencyLevel}`);
    return bits.length ? bits.join("\n") : null;
  } catch {
    return null;
  }
}

/**
 * Un prospect qui déclare l'urgence mérite une conversation, pas du nurturing
 * passif. Le reste entre en engagement léger : il a rempli l'audit au complet.
 */
function mapPriorite(
  answers: Answers,
): "OBSERVATION" | "ENGAGEMENT_LEGER" | "CONVERSATION_PROFONDE" {
  const urgence = str(answers.urgence);
  return urgence === "urgent" || urgence === "immediat"
    ? "CONVERSATION_PROFONDE"
    : "ENGAGEMENT_LEGER";
}

/** Notes privées : on préserve le texte libre qui n'a pas de colonne dédiée. */
export function buildNotesPrivees(answers: Answers, origine: string): string {
  const parts: string[] = [];
  const domaines = str(answers.domaines_pratique);
  if (domaines) parts.push(`Domaines de pratique : ${domaines}`);
  const reve = str(answers.automatisation_reve);
  if (reve) parts.push(`À automatiser en priorité : ${reve}`);
  const frustrations = Array.isArray(answers.frustrations)
    ? answers.frustrations.map((f) => str(f)).filter(Boolean)
    : [];
  if (frustrations.length) parts.push(`Frustrations : ${frustrations.join(", ")}`);
  parts.push(origine);
  return parts.join("\n");
}

// ── Rattachement ─────────────────────────────────────────────────────

export type AttachOutcome =
  | { ok: true; leadId: string; created: boolean; note: string }
  | { ok: false; error: string };

/**
 * Fait apparaître une soumission d'audit dans le CRM.
 *
 * Idempotent et sans doublon :
 *  - soumission déjà rattachée      → ne touche à rien ;
 *  - courriel déjà connu d'un Lead  → rattache l'audit à ce Lead s'il n'en a
 *    pas, et journalise l'activité dans tous les cas ;
 *  - sinon                          → crée Lead + contact principal + activité.
 *
 * Ne throw pas : toute erreur ressort en `{ ok: false }`, à charge de l'appelant
 * de la journaliser sans casser le flux de soumission.
 */
export async function attachAuditSubmissionToCrm(
  submissionId: string,
): Promise<AttachOutcome> {
  try {
    const submission = await prisma.auditSubmission.findUnique({
      where: { id: submissionId },
      include: { lead: { select: { id: true } } },
    });

    if (!submission) {
      return { ok: false, error: `Soumission ${submissionId} introuvable.` };
    }
    if (submission.lead) {
      return {
        ok: true,
        leadId: submission.lead.id,
        created: false,
        note: "Soumission déjà rattachée à un lead.",
      };
    }

    const answers = parseAnswers(submission.reponses);
    const workspace = await getSafeIncWorkspace();

    const identite =
      (answers.identite as { nom_complet?: string; titre?: string }) ?? {};
    const contact =
      (answers.contact as { email?: string; telephone?: string }) ?? {};
    const loc =
      (answers.localisation as { ville?: string; province?: string }) ?? {};

    const email = (submission.prospectEmail || str(contact.email)).toLowerCase();
    const nomComplet = submission.prospectNom || str(identite.nom_complet);
    const raisonSociale =
      submission.prospectCabinet ||
      str(answers.raison_sociale) ||
      nomComplet ||
      "Cabinet sans nom";

    const resumeRapport = summarizeRapport(submission.rapport);
    const activiteContenu = [
      `Audit gratuit rempli par ${nomComplet || "un prospect"}${
        email ? ` (${email})` : ""
      }.`,
      resumeRapport,
      `Rapport : /audit/${submission.id}`,
    ]
      .filter(Boolean)
      .join("\n");

    // ── Déduplication : un cabinet qui refait l'audit ne doit pas créer un
    // second lead dans le pipeline. On reconnaît par le courriel du contact.
    const existing = email
      ? await prisma.lead.findFirst({
          where: {
            workspaceId: workspace.id,
            contacts: { some: { email: { equals: email, mode: "insensitive" } } },
          },
          select: { id: true, auditSubmissionId: true },
        })
      : null;

    if (existing) {
      // Rattacher l'audit si le lead n'en porte pas encore un (relation 1-1).
      if (!existing.auditSubmissionId) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: {
            auditSubmission: { connect: { id: submission.id } },
            stageLead: "AUDIT_COMPLETED",
            statutLead: "QUALIFIED_AUDIT",
            prioriteNurturing: mapPriorite(answers),
            dateDerniereActivite: new Date(),
          },
        });
      } else {
        await prisma.lead.update({
          where: { id: existing.id },
          data: { dateDerniereActivite: new Date() },
        });
      }

      await prisma.activity.create({
        data: {
          leadId: existing.id,
          type: "AUDIT_SOUMIS",
          direction: "INBOUND",
          sujet: `Nouvel audit gratuit — ${raisonSociale}`,
          contenu:
            activiteContenu +
            (existing.auditSubmissionId
              ? `\n\nCe lead portait déjà un audit ; celui-ci reste consultable par sa référence ${submission.id}.`
              : ""),
          urlSource: `/audit/${submission.id}`,
        },
      });

      await recomputeLeadScore(existing.id);

      return {
        ok: true,
        leadId: existing.id,
        created: false,
        note: `Audit rattaché au lead existant (${email}).`,
      };
    }

    // ── Création du lead ──
    const slug = await uniqueSlug(slugify(raisonSociale));
    const leadData: Prisma.LeadCreateInput = {
      raisonSociale,
      slug,
      province: mapProvince(loc.province),
      ville: str(loc.ville) || null,
      langue: mapLangue(answers.langues),
      siteWeb: validUrl(answers.site_web),
      tailleCabinet: mapTaille(answers.nb_utilisateurs),
      domainesPratique: [], // texte libre non normalisé : conservé en notes
      modeFacturation: mapMode(answers.mode_facturation) ?? null,
      aTrustAccounting: ["actif", "peu"].includes(str(answers.fideicommis_usage)),
      logicielActuel: cleanOther(answers.logiciel_actuel) || null,
      nbAvocatsEstime: parseNbUtilisateurs(answers.nb_utilisateurs),
      sourceLead: "AUDIT_GRATUIT",
      stageLead: "AUDIT_COMPLETED",
      statutLead: "QUALIFIED_AUDIT",
      prioriteNurturing: mapPriorite(answers),
      notesPrivees: buildNotesPrivees(
        answers,
        "Créé automatiquement à la soumission de l'audit gratuit.",
      ),
      dateDerniereActivite: new Date(),
      workspace: { connect: { id: workspace.id } },
      auditSubmission: { connect: { id: submission.id } },
    };

    const lead = await prisma.lead.create({ data: leadData });

    if (nomComplet) {
      const { prenom, nom } = splitName(nomComplet);
      await prisma.leadContact.create({
        data: {
          leadId: lead.id,
          prenom: prenom || nomComplet,
          nom: nom || "—",
          titre: str(identite.titre) || null,
          email: email || null,
          telephone: submission.prospectTelephone || str(contact.telephone) || null,
          languePref: mapLangue(answers.langues) === "EN" ? "EN" : "FR",
          roleCrm: "AVOCAT_PROPRIETAIRE",
          estDecideur: true,
        },
      });
    }

    await prisma.activity.create({
      data: {
        leadId: lead.id,
        type: "AUDIT_SOUMIS",
        direction: "INBOUND",
        sujet: `Audit gratuit rempli — ${raisonSociale}`,
        contenu: activiteContenu,
        urlSource: `/audit/${submission.id}`,
      },
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
