"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { isSafeIncCabinet } from "@/lib/safe-inc";
import { recomputeLeadScore } from "@/lib/services/crm/scoring";
import type { RoleCrm, EmailStatut, CrmLangue } from "@prisma/client";

const VALID_ROLES: RoleCrm[] = [
  "AVOCAT_PROPRIETAIRE",
  "AVOCAT_ASSOCIE",
  "ADJOINT_JURIDIQUE",
  "COMPTABLE_INTERNE",
  "MANAGER_CABINET",
  "PARTENAIRE_STRATEGIQUE",
];
const VALID_EMAIL_STATUTS: EmailStatut[] = [
  "NON_VERIFIE",
  "VALIDE",
  "INVALIDE",
  "BOUNCE",
];

export type CreateContactResult = { ok: true } | { ok: false; error: string };

/**
 * Ajoute un contact (personne) à un cabinet prospect et recalcule le score.
 *
 * Si le contact est marqué champion interne, le Lead est mis à jour
 * (championInterneId + modeleAdoption BOTTOM_UP) — thèse copilote-du-copilote.
 */
export async function createContact(
  formData: FormData,
): Promise<CreateContactResult> {
  try {
    const { cabinetId } = await requireCabinetAndUser();
    if (!(await isSafeIncCabinet(cabinetId))) {
      return { ok: false, error: "Accès réservé à SAFE Inc." };
    }

    const leadId = String(formData.get("leadId") || "");
    const prenom = String(formData.get("prenom") || "").trim();
    const nom = String(formData.get("nom") || "").trim();
    const titre = String(formData.get("titre") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const emailStatut = String(formData.get("emailStatut") || "NON_VERIFIE") as EmailStatut;
    const linkedinUrl = String(formData.get("linkedinUrl") || "").trim();
    const telephone = String(formData.get("telephone") || "").trim();
    const roleCrm = String(formData.get("roleCrm") || "") as RoleCrm;
    const languePref = String(formData.get("languePref") || "FR") as CrmLangue;
    const estDecideur = formData.get("estDecideur") === "on";
    const estChampionInterne = formData.get("estChampionInterne") === "on";

    if (!leadId) return { ok: false, error: "Lead manquant" };
    if (!prenom || !nom) return { ok: false, error: "Prénom et nom requis" };
    if (!VALID_ROLES.includes(roleCrm)) return { ok: false, error: "Rôle invalide" };
    if (!VALID_EMAIL_STATUTS.includes(emailStatut)) {
      return { ok: false, error: "Statut email invalide" };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true },
    });
    if (!lead) return { ok: false, error: "Lead introuvable" };

    const contact = await prisma.leadContact.create({
      data: {
        leadId,
        prenom,
        nom,
        titre: titre || null,
        email: email || null,
        emailStatut,
        linkedinUrl: linkedinUrl || null,
        telephone: telephone || null,
        roleCrm,
        languePref,
        estDecideur,
        estChampionInterne,
      },
    });

    // Si champion interne : adoption bottom-up (thèse copilote-du-copilote)
    if (estChampionInterne) {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          championInterneId: contact.id,
          modeleAdoption: "BOTTOM_UP",
        },
      });
    }

    await recomputeLeadScore(leadId);

    revalidatePath(`/console/leads/${leadId}`);
    revalidatePath("/console/leads");
    revalidatePath("/console/pipeline");

    return { ok: true };
  } catch (err) {
    console.error("createContact error", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}
