"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { deboursDossierSchema } from "@/lib/validations/debours";
import { createAuditLog } from "@/lib/services/audit";

async function getDossierCabinetId(dossierId: string): Promise<string | null> {
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId },
    select: { cabinetId: true },
  });
  return dossier?.cabinetId ?? null;
}

export async function createDeboursDossier(formData: FormData) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const dossierId = formData.get("dossierId") as string;
  if ((await getDossierCabinetId(dossierId)) !== cabinetId) {
    redirect("/dossiers");
  }

  const quantite = formData.get("quantite") ? Number(formData.get("quantite") as string) : 1;
  const prixUnitaire = formData.get("prixUnitaire") ? Number(formData.get("prixUnitaire") as string) : null;
  const montantBrut = formData.get("montant") ? Number(formData.get("montant") as string) : null;
  // Si prix unitaire est fourni, le montant total = quantité × prix unitaire ; sinon on utilise le montant brut (formulaire dossier)
  const montant = prixUnitaire != null ? quantite * prixUnitaire : (montantBrut ?? 0);

  const raw = {
    dossierId,
    clientId: formData.get("clientId") as string,
    deboursTypeId: (formData.get("deboursTypeId") as string) || null,
    description: (formData.get("description") as string)?.trim() ?? "",
    quantite,
    montant,
    taxable: formData.get("taxable") === "on" || formData.get("taxable") === "true",
    date: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
    payeParCabinet: formData.get("payeParCabinet") !== "off" && formData.get("payeParCabinet") !== "false",
    refacturable: formData.get("refacturable") !== "off" && formData.get("refacturable") !== "false",
  };

  const parsed = deboursDossierSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "invalid" };
  }

  const dossier = await prisma.dossier.findFirst({
    where: { id: parsed.data.dossierId, cabinetId },
    select: { clientId: true },
  });
  if (!dossier || dossier.clientId !== parsed.data.clientId) {
    return { ok: false as const, error: "invalid" };
  }

  const created = await prisma.deboursDossier.create({
    data: {
      cabinetId,
      dossierId: parsed.data.dossierId,
      clientId: parsed.data.clientId,
      deboursTypeId: parsed.data.deboursTypeId ?? null,
      description: parsed.data.description,
      quantite: parsed.data.quantite,
      montant: parsed.data.montant,
      taxable: parsed.data.taxable,
      date: parsed.data.date,
      payeParCabinet: parsed.data.payeParCabinet,
      refacturable: parsed.data.refacturable,
    },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "DeboursDossier",
    entityId: created.id,
    action: "create",
    metadata: { dossierId: created.dossierId, montant: created.montant, description: created.description },
  });

  revalidatePath(`/dossiers/${dossierId}`);
  revalidatePath("/facturation/frais");
  revalidatePath("/tableau-de-bord");
  return { ok: true as const, id: created.id };
}

export async function updateDeboursDossier(id: string, formData: FormData) {
  const { cabinetId, userId } = await requireCabinetAndUser();

  const existing = await prisma.deboursDossier.findFirst({
    where: { id, cabinetId },
    select: { dossierId: true, factureId: true },
  });
  if (!existing) {
    redirect("/dossiers");
  }
  if (existing.factureId) {
    return { ok: false as const, error: "already_invoiced" };
  }

  const raw = {
    dossierId: existing.dossierId,
    clientId: formData.get("clientId") as string,
    deboursTypeId: (formData.get("deboursTypeId") as string) || null,
    description: (formData.get("description") as string)?.trim() ?? "",
    quantite: formData.get("quantite") ? Number(formData.get("quantite") as string) : 1,
    montant: formData.get("montant") ? Number(formData.get("montant") as string) : 0,
    taxable: formData.get("taxable") === "on" || formData.get("taxable") === "true",
    date: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
    payeParCabinet: formData.get("payeParCabinet") !== "off" && formData.get("payeParCabinet") !== "false",
    refacturable: formData.get("refacturable") !== "off" && formData.get("refacturable") !== "false",
  };

  const parsed = deboursDossierSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "invalid" };
  }

  await prisma.deboursDossier.update({
    where: { id },
    data: {
      deboursTypeId: parsed.data.deboursTypeId ?? null,
      description: parsed.data.description,
      quantite: parsed.data.quantite,
      montant: parsed.data.montant,
      taxable: parsed.data.taxable,
      date: parsed.data.date,
      payeParCabinet: parsed.data.payeParCabinet,
      refacturable: parsed.data.refacturable,
    },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "DeboursDossier",
    entityId: id,
    action: "update",
    metadata: { montant: parsed.data.montant, description: parsed.data.description },
  });

  revalidatePath(`/dossiers/${existing.dossierId}`);
  return { ok: true as const };
}

export async function deleteDeboursDossier(id: string) {
  const { cabinetId, userId } = await requireCabinetAndUser();

  const existing = await prisma.deboursDossier.findFirst({
    where: { id, cabinetId },
    select: { dossierId: true, factureId: true },
  });
  if (!existing) {
    redirect("/dossiers");
  }
  if (existing.factureId) {
    return { ok: false as const, error: "already_invoiced" };
  }

  await prisma.deboursDossier.delete({ where: { id } });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "DeboursDossier",
    entityId: id,
    action: "delete",
  });

  revalidatePath(`/dossiers/${existing.dossierId}`);
  return { ok: true as const };
}

/** Wrapper pour formulaire : supprime le débours dont l'id est dans formData. */
export async function deleteDeboursDossierForm(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await deleteDeboursDossier(id);
}
