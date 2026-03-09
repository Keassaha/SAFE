"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { dossierSchema } from "@/lib/validations/dossier";
import { dossierTacheSchema } from "@/lib/validations/dossierTache";
import { dossierEvenementSchema } from "@/lib/validations/dossierEvenement";
import { dossierNoteSchema } from "@/lib/validations/dossierNote";
import { createAuditLog } from "@/lib/services/audit";
import type { DossierStatut, DossierType, ModeFacturationDossier } from "@prisma/client";

export async function createDossier(formData: FormData) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const raw = {
    clientId: formData.get("clientId") as string,
    avocatResponsableId: (formData.get("avocatResponsableId") as string) || undefined,
    assistantJuridiqueId: (formData.get("assistantJuridiqueId") as string) || undefined,
    reference: (formData.get("reference") as string) || undefined,
    intitule: formData.get("intitule") as string,
    statut: formData.get("statut") as string,
    type: (formData.get("type") as string) || null,
    descriptionConfidentielle: (formData.get("descriptionConfidentielle") as string) || undefined,
    resumeDossier: (formData.get("resumeDossier") as string) || undefined,
    notesStrategieJuridique: (formData.get("notesStrategieJuridique") as string) || undefined,
    tribunalNom: (formData.get("tribunalNom") as string) || undefined,
    districtJudiciaire: (formData.get("districtJudiciaire") as string) || undefined,
    numeroDossierTribunal: (formData.get("numeroDossierTribunal") as string) || undefined,
    nomJuge: (formData.get("nomJuge") as string) || undefined,
    modeFacturation: (formData.get("modeFacturation") as string) || null,
    tauxHoraire: formData.get("tauxHoraire")
      ? Number(formData.get("tauxHoraire") as string)
      : null,
    retentionJusqua: formData.get("retentionJusqua")
      ? new Date(formData.get("retentionJusqua") as string)
      : undefined,
  };
  const parsed = dossierSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "invalid" };
  }
  if (!parsed.data.type) {
    return { ok: false as const, error: "invalid" };
  }
  const intitule = parsed.data.intitule?.trim() || "Dossier";
  const year = new Date().getFullYear();
  const maxAttempts = 10;
  let dossier: Awaited<ReturnType<typeof prisma.dossier.create>> | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const count = await prisma.dossier.count({
      where: { cabinetId, numeroDossier: { startsWith: `${year}-` } },
    });
    const numeroDossier = `${year}-${String(count + 1).padStart(3, "0")}`;
    try {
      dossier = await prisma.dossier.create({
        data: {
          cabinetId,
          clientId: parsed.data.clientId,
          avocatResponsableId: parsed.data.avocatResponsableId ?? null,
          assistantJuridiqueId: parsed.data.assistantJuridiqueId ?? null,
          reference: parsed.data.reference ?? null,
          numeroDossier,
          intitule,
          statut: parsed.data.statut as DossierStatut,
          type: (parsed.data.type as DossierType | null) ?? null,
          descriptionConfidentielle: parsed.data.descriptionConfidentielle ?? null,
          resumeDossier: parsed.data.resumeDossier ?? null,
          notesStrategieJuridique: parsed.data.notesStrategieJuridique ?? null,
          tribunalNom: parsed.data.tribunalNom ?? null,
          districtJudiciaire: parsed.data.districtJudiciaire ?? null,
          numeroDossierTribunal: parsed.data.numeroDossierTribunal ?? null,
          nomJuge: parsed.data.nomJuge ?? null,
          modeFacturation: (parsed.data.modeFacturation as ModeFacturationDossier | null) ?? null,
          tauxHoraire: parsed.data.tauxHoraire ?? null,
          retentionJusqua: parsed.data.retentionJusqua ?? null,
        },
      });
      break;
    } catch (err: unknown) {
      const isUniqueViolation =
        err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002";
      if (isUniqueViolation && attempt < maxAttempts - 1) continue;
      throw err;
    }
  }
  if (!dossier) {
    return { ok: false as const, error: "invalid" };
  }
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Dossier",
    entityId: dossier.id,
    action: "create",
    metadata: { reference: dossier.reference ?? undefined, intitule: dossier.intitule },
  });
  revalidatePath("/dossiers");
  redirect("/dossiers");
}

export async function updateDossier(id: string, formData: FormData) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const raw = {
    clientId: formData.get("clientId") as string,
    avocatResponsableId: (formData.get("avocatResponsableId") as string) || undefined,
    assistantJuridiqueId: (formData.get("assistantJuridiqueId") as string) || undefined,
    reference: (formData.get("reference") as string) || undefined,
    numeroDossier: (formData.get("numeroDossier") as string) || undefined,
    intitule: formData.get("intitule") as string,
    statut: formData.get("statut") as string,
    type: (formData.get("type") as string) || null,
    descriptionConfidentielle: (formData.get("descriptionConfidentielle") as string) || undefined,
    resumeDossier: (formData.get("resumeDossier") as string) || undefined,
    notesStrategieJuridique: (formData.get("notesStrategieJuridique") as string) || undefined,
    tribunalNom: (formData.get("tribunalNom") as string) || undefined,
    districtJudiciaire: (formData.get("districtJudiciaire") as string) || undefined,
    numeroDossierTribunal: (formData.get("numeroDossierTribunal") as string) || undefined,
    nomJuge: (formData.get("nomJuge") as string) || undefined,
    modeFacturation: (formData.get("modeFacturation") as string) || null,
    tauxHoraire: formData.get("tauxHoraire")
      ? Number(formData.get("tauxHoraire") as string)
      : null,
    dateCloture: formData.get("dateCloture")
      ? new Date(formData.get("dateCloture") as string)
      : null,
    retentionJusqua: formData.get("retentionJusqua")
      ? new Date(formData.get("retentionJusqua") as string)
      : undefined,
  };
  const parsed = dossierSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/dossiers/${id}?error=invalid`);
  }
  const current = await prisma.dossier.findFirst({
    where: { id, cabinetId },
    select: { descriptionConfidentielle: true, notesStrategieJuridique: true, intitule: true },
  });
  const numeroDossierValue = parsed.data.numeroDossier?.trim() || null;
  if (numeroDossierValue) {
    const existing = await prisma.dossier.findFirst({
      where: {
        cabinetId,
        numeroDossier: numeroDossierValue,
        id: { not: id },
      },
      select: { id: true },
    });
    if (existing) {
      redirect(`/dossiers/${id}?error=numero_dossier_duplique`);
    }
  }
  const intitule = parsed.data.intitule?.trim() || current?.intitule || "Dossier";
  await prisma.dossier.updateMany({
    where: { id, cabinetId },
    data: {
      clientId: parsed.data.clientId,
      avocatResponsableId: parsed.data.avocatResponsableId ?? null,
      assistantJuridiqueId: parsed.data.assistantJuridiqueId ?? null,
      reference: parsed.data.reference ?? null,
      numeroDossier: numeroDossierValue,
      intitule,
      statut: parsed.data.statut as DossierStatut,
      type: (parsed.data.type as DossierType | null) ?? null,
      descriptionConfidentielle:
        parsed.data.descriptionConfidentielle ?? current?.descriptionConfidentielle ?? null,
      resumeDossier: parsed.data.resumeDossier ?? null,
      notesStrategieJuridique:
        parsed.data.notesStrategieJuridique ?? current?.notesStrategieJuridique ?? null,
      tribunalNom: parsed.data.tribunalNom ?? null,
      districtJudiciaire: parsed.data.districtJudiciaire ?? null,
      numeroDossierTribunal: parsed.data.numeroDossierTribunal ?? null,
      nomJuge: parsed.data.nomJuge ?? null,
      modeFacturation: (parsed.data.modeFacturation as ModeFacturationDossier | null) ?? null,
      tauxHoraire: parsed.data.tauxHoraire ?? null,
      dateCloture: parsed.data.dateCloture ?? undefined,
      retentionJusqua: parsed.data.retentionJusqua ?? null,
    },
  });
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Dossier",
    entityId: id,
    action: "update",
    metadata: { reference: parsed.data.reference ?? undefined, intitule },
  });
  revalidatePath("/dossiers");
  revalidatePath(`/dossiers/${id}`);
  redirect("/dossiers");
}

export async function updateDossierForm(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await updateDossier(id, formData);
}

export async function archiveDossier(id: string) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const updated = await prisma.dossier.updateMany({
    where: { id, cabinetId },
    data: { statut: "archive" as DossierStatut },
  });
  if (updated.count === 0) {
    redirect("/dossiers");
  }
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Dossier",
    entityId: id,
    action: "update",
    metadata: { statut: "archive" },
  });
  revalidatePath("/dossiers");
  revalidatePath(`/dossiers/${id}`);
  redirect("/dossiers");
}

async function getDossierCabinetId(dossierId: string): Promise<string | null> {
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId },
    select: { cabinetId: true },
  });
  return dossier?.cabinetId ?? null;
}

export async function createDossierTache(formData: FormData) {
  const { cabinetId } = await requireCabinetAndUser();
  const dossierId = formData.get("dossierId") as string;
  if ((await getDossierCabinetId(dossierId)) !== cabinetId) {
    redirect("/dossiers");
  }
  const raw = {
    dossierId,
    titre: formData.get("titre") as string,
    description: (formData.get("description") as string) || null,
    assigneeId: (formData.get("assigneeId") as string) || null,
    priorite: (formData.get("priorite") as string) || "medium",
    statut: (formData.get("statut") as string) || "a_faire",
    dateEcheance: formData.get("dateEcheance")
      ? new Date(formData.get("dateEcheance") as string)
      : null,
  };
  const parsed = dossierTacheSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/dossiers/${dossierId}?error=tache_invalid`);
  }
  await prisma.dossierTache.create({
    data: {
      dossierId: parsed.data.dossierId,
      titre: parsed.data.titre,
      description: parsed.data.description ?? null,
      assigneeId: parsed.data.assigneeId ?? null,
      priorite: parsed.data.priorite as "low" | "medium" | "high" | "urgent",
      statut: parsed.data.statut as "a_faire" | "en_cours" | "terminee" | "annulee",
      dateEcheance: parsed.data.dateEcheance ?? null,
    },
  });
  revalidatePath(`/dossiers/${dossierId}`);
  redirect(`/dossiers/${dossierId}`);
}

export async function updateDossierTache(id: string, formData: FormData) {
  const { cabinetId } = await requireCabinetAndUser();
  const tache = await prisma.dossierTache.findFirst({
    where: { id },
    include: { dossier: true },
  });
  if (!tache || tache.dossier.cabinetId !== cabinetId) {
    redirect("/dossiers");
  }
  const raw = {
    dossierId: tache.dossierId,
    titre: formData.get("titre") as string,
    description: (formData.get("description") as string) || null,
    assigneeId: (formData.get("assigneeId") as string) || null,
    priorite: (formData.get("priorite") as string) || "medium",
    statut: (formData.get("statut") as string) || "a_faire",
    dateEcheance: formData.get("dateEcheance")
      ? new Date(formData.get("dateEcheance") as string)
      : null,
  };
  const parsed = dossierTacheSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/dossiers/${tache.dossierId}?error=tache_invalid`);
  }
  await prisma.dossierTache.update({
    where: { id },
    data: {
      titre: parsed.data.titre,
      description: parsed.data.description ?? null,
      assigneeId: parsed.data.assigneeId ?? null,
      priorite: parsed.data.priorite as "low" | "medium" | "high" | "urgent",
      statut: parsed.data.statut as "a_faire" | "en_cours" | "terminee" | "annulee",
      dateEcheance: parsed.data.dateEcheance ?? null,
    },
  });
  revalidatePath(`/dossiers/${tache.dossierId}`);
  redirect(`/dossiers/${tache.dossierId}`);
}

export async function deleteDossierTache(id: string) {
  const { cabinetId } = await requireCabinetAndUser();
  const tache = await prisma.dossierTache.findFirst({
    where: { id },
    include: { dossier: true },
  });
  if (!tache || tache.dossier.cabinetId !== cabinetId) {
    redirect("/dossiers");
  }
  await prisma.dossierTache.delete({ where: { id } });
  revalidatePath(`/dossiers/${tache.dossierId}`);
  redirect(`/dossiers/${tache.dossierId}`);
}

export async function createDossierEvenement(formData: FormData) {
  const { cabinetId } = await requireCabinetAndUser();
  const dossierId = formData.get("dossierId") as string;
  if ((await getDossierCabinetId(dossierId)) !== cabinetId) {
    redirect("/dossiers");
  }
  const raw = {
    dossierId,
    type: formData.get("type") as string,
    titre: formData.get("titre") as string,
    date: formData.get("date") ? new Date(formData.get("date") as string) : undefined,
    lieu: (formData.get("lieu") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };
  const parsed = dossierEvenementSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/dossiers/${dossierId}?error=evenement_invalid`);
  }
  await prisma.dossierEvenement.create({
    data: {
      dossierId: parsed.data.dossierId,
      type: parsed.data.type as "audience" | "reunion_client" | "echeance" | "depot",
      titre: parsed.data.titre,
      date: parsed.data.date,
      lieu: parsed.data.lieu ?? null,
      notes: parsed.data.notes ?? null,
    },
  });
  revalidatePath(`/dossiers/${dossierId}`);
  redirect(`/dossiers/${dossierId}`);
}

export async function updateDossierEvenement(id: string, formData: FormData) {
  const { cabinetId } = await requireCabinetAndUser();
  const evenement = await prisma.dossierEvenement.findFirst({
    where: { id },
    include: { dossier: true },
  });
  if (!evenement || evenement.dossier.cabinetId !== cabinetId) {
    redirect("/dossiers");
  }
  const raw = {
    dossierId: evenement.dossierId,
    type: formData.get("type") as string,
    titre: formData.get("titre") as string,
    date: formData.get("date") ? new Date(formData.get("date") as string) : undefined,
    lieu: (formData.get("lieu") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };
  const parsed = dossierEvenementSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/dossiers/${evenement.dossierId}?error=evenement_invalid`);
  }
  await prisma.dossierEvenement.update({
    where: { id },
    data: {
      type: parsed.data.type as "audience" | "reunion_client" | "echeance" | "depot",
      titre: parsed.data.titre,
      date: parsed.data.date,
      lieu: parsed.data.lieu ?? null,
      notes: parsed.data.notes ?? null,
    },
  });
  revalidatePath(`/dossiers/${evenement.dossierId}`);
  redirect(`/dossiers/${evenement.dossierId}`);
}

export async function deleteDossierEvenement(id: string) {
  const { cabinetId } = await requireCabinetAndUser();
  const evenement = await prisma.dossierEvenement.findFirst({
    where: { id },
    include: { dossier: true },
  });
  if (!evenement || evenement.dossier.cabinetId !== cabinetId) {
    redirect("/dossiers");
  }
  await prisma.dossierEvenement.delete({ where: { id } });
  revalidatePath(`/dossiers/${evenement.dossierId}`);
  redirect(`/dossiers/${evenement.dossierId}`);
}

export async function createDossierNote(formData: FormData) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const dossierId = formData.get("dossierId") as string;
  if ((await getDossierCabinetId(dossierId)) !== cabinetId) {
    redirect("/dossiers");
  }
  const raw = {
    dossierId,
    content: (formData.get("content") as string)?.trim() ?? "",
  };
  const parsed = dossierNoteSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/dossiers/${dossierId}?error=note_invalid`);
  }
  await prisma.dossierNote.create({
    data: {
      dossierId: parsed.data.dossierId,
      content: parsed.data.content,
      createdById: userId,
    },
  });
  revalidatePath(`/dossiers/${dossierId}`);
  redirect(`/dossiers/${dossierId}`);
}
