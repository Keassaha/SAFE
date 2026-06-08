"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { isSafeIncCabinet, getSafeIncWorkspace } from "@/lib/safe-inc";
import {
  createLeadSchema,
  computeFirmographicScore,
} from "@/lib/validations/crm-lead";

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
  // Boucle jusqu'à trouver un slug libre (borne raisonnable)
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

export type CreateLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

export async function createLead(
  formData: FormData,
): Promise<CreateLeadResult> {
  try {
    const { cabinetId } = await requireCabinetAndUser();
    if (!(await isSafeIncCabinet(cabinetId))) {
      return { ok: false, error: "Accès réservé à SAFE Inc." };
    }

    const workspace = await getSafeIncWorkspace();

    // Parse domaines (checkboxes → array)
    const domainesPratique = formData.getAll("domainesPratique").map(String);

    const parsed = createLeadSchema.safeParse({
      raisonSociale: formData.get("raisonSociale"),
      province: formData.get("province"),
      ville: formData.get("ville") || "",
      langue: formData.get("langue") || "FR",
      siteWeb: formData.get("siteWeb") || "",
      linkedinUrl: formData.get("linkedinUrl") || "",
      tailleCabinet: formData.get("tailleCabinet"),
      domainesPratique,
      modeFacturation: formData.get("modeFacturation") || undefined,
      aTrustAccounting: formData.get("aTrustAccounting") === "on",
      logicielActuel: formData.get("logicielActuel") || "",
      nbAvocatsEstime: formData.get("nbAvocatsEstime") || undefined,
      sourceLead: formData.get("sourceLead"),
      notesPrivees: formData.get("notesPrivees") || "",
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return { ok: false, error: first?.message ?? "Données invalides" };
    }

    const d = parsed.data;
    const slug = await uniqueSlug(slugify(d.raisonSociale));

    const scoreFirmographique = computeFirmographicScore({
      province: d.province,
      tailleCabinet: d.tailleCabinet,
      aTrustAccounting: d.aTrustAccounting,
      domainesPratique: d.domainesPratique,
    });

    const lead = await prisma.lead.create({
      data: {
        raisonSociale: d.raisonSociale,
        slug,
        province: d.province,
        ville: d.ville || null,
        langue: d.langue,
        siteWeb: d.siteWeb || null,
        linkedinUrl: d.linkedinUrl || null,
        tailleCabinet: d.tailleCabinet,
        domainesPratique: d.domainesPratique,
        modeFacturation: d.modeFacturation ?? null,
        aTrustAccounting: d.aTrustAccounting,
        logicielActuel: d.logicielActuel || null,
        nbAvocatsEstime: d.nbAvocatsEstime ?? null,
        sourceLead: d.sourceLead,
        notesPrivees: d.notesPrivees || null,
        workspaceId: workspace.id,
        score: scoreFirmographique,
        scoreFirmographique,
        dateDerniereActivite: new Date(),
      },
    });

    revalidatePath("/console/leads");
    revalidatePath("/console/pipeline");

    return { ok: true, leadId: lead.id };
  } catch (err) {
    console.error("createLead error", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}

/**
 * Variante pour usage avec useActionState (form action directe + redirect).
 */
export async function createLeadAndRedirect(formData: FormData): Promise<void> {
  const result = await createLead(formData);
  if (result.ok) {
    redirect(`/console/leads/${result.leadId}`);
  }
  // En cas d'erreur, on redirige vers le formulaire avec un flag (simple v1)
  redirect(`/console/leads/nouveau?error=${encodeURIComponent(result.error)}`);
}
