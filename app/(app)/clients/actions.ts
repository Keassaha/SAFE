"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { clientSchema } from "@/lib/validations/client";
import { createAuditLog } from "@/lib/services/audit";

export async function createClient(formData: FormData) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const raw: Record<string, unknown> = {
    raisonSociale: formData.get("raisonSociale") as string,
    typeClient: formData.get("typeClient") as string | undefined,
    prenom: (formData.get("prenom") as string) || undefined,
    nom: (formData.get("nom") as string) || undefined,
    dateNaissance: formData.get("dateNaissance") ? (formData.get("dateNaissance") as string) : undefined,
    numeroRegistreEntreprise: (formData.get("numeroRegistreEntreprise") as string) || undefined,
    contact: (formData.get("contact") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    emailSecondaire: (formData.get("emailSecondaire") as string) || undefined,
    telephone: (formData.get("telephone") as string) || undefined,
    telephoneSecondaire: (formData.get("telephoneSecondaire") as string) || undefined,
    adresse: (formData.get("adresse") as string) || undefined,
    addressLine1: (formData.get("addressLine1") as string) || undefined,
    addressLine2: (formData.get("addressLine2") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    province: (formData.get("province") as string) || undefined,
    postalCode: (formData.get("postalCode") as string) || undefined,
    country: (formData.get("country") as string) || undefined,
    preferredContactMethod: (formData.get("preferredContactMethod") as string) || undefined,
    langue: (formData.get("langue") as string) || undefined,
    consentementCollecteAt: formData.get("consentementCollecteAt")
      ? new Date(formData.get("consentementCollecteAt") as string)
      : undefined,
    finalitesConsentement: (formData.get("finalitesConsentement") as string) || undefined,
    retentionJusqua: formData.get("retentionJusqua")
      ? new Date(formData.get("retentionJusqua") as string)
      : undefined,
    notesConfidentielles: (formData.get("notesConfidentielles") as string) || undefined,
    assignedLawyerId: (formData.get("assignedLawyerId") as string) || undefined,
    representationType: (formData.get("representationType") as string) || undefined,
    retainerSigned: formData.get("retainerSigned") === "true" || formData.get("retainerSigned") === "on",
    retainerDate: formData.get("retainerDate") ? new Date(formData.get("retainerDate") as string) : undefined,
    billingContactName: (formData.get("billingContactName") as string) || undefined,
    billingEmail: (formData.get("billingEmail") as string) || undefined,
    billingAddress: (formData.get("billingAddress") as string) || undefined,
    paymentTerms: (formData.get("paymentTerms") as string) || undefined,
    preferredPaymentMethod: (formData.get("preferredPaymentMethod") as string) || undefined,
    conflictChecked: formData.get("conflictChecked") === "true" || formData.get("conflictChecked") === "on",
    conflictCheckDate: formData.get("conflictCheckDate") ? new Date(formData.get("conflictCheckDate") as string) : undefined,
    conflictNotes: (formData.get("conflictNotes") as string) || undefined,
  };
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/clients/nouveau?error=invalid");
  }
  const data = {
    ...parsed.data,
    typeClient: parsed.data.typeClient ?? "personne_morale",
    email: parsed.data.email || null,
    consentementCollecteAt: parsed.data.consentementCollecteAt ?? undefined,
    finalitesConsentement: parsed.data.finalitesConsentement ?? undefined,
    retentionJusqua: parsed.data.retentionJusqua ?? undefined,
    notesConfidentielles: parsed.data.notesConfidentielles ?? undefined,
  };
  const client = await prisma.client.create({
    data: {
      cabinetId,
      raisonSociale: data.raisonSociale,
      typeClient: data.typeClient,
      prenom: data.prenom ?? null,
      nom: data.nom ?? null,
      dateNaissance: data.dateNaissance ?? null,
      numeroRegistreEntreprise: data.numeroRegistreEntreprise ?? null,
      contact: data.contact ?? null,
      email: data.email,
      emailSecondaire: data.emailSecondaire || null,
      telephone: data.telephone ?? null,
      telephoneSecondaire: data.telephoneSecondaire ?? null,
      adresse: data.adresse ?? null,
      addressLine1: data.addressLine1 ?? null,
      addressLine2: data.addressLine2 ?? null,
      city: data.city ?? null,
      province: data.province ?? null,
      postalCode: data.postalCode ?? null,
      country: data.country ?? null,
      preferredContactMethod: data.preferredContactMethod ?? null,
      langue: data.langue ?? null,
      consentementCollecteAt: data.consentementCollecteAt ?? null,
      finalitesConsentement: data.finalitesConsentement ?? null,
      retentionJusqua: data.retentionJusqua ?? null,
      notesConfidentielles: data.notesConfidentielles ?? null,
      assignedLawyerId: data.assignedLawyerId || null,
      representationType: data.representationType ?? null,
      retainerSigned: data.retainerSigned ?? false,
      retainerDate: data.retainerDate ?? null,
      billingContactName: data.billingContactName ?? null,
      billingEmail: data.billingEmail ?? null,
      billingAddress: data.billingAddress ?? null,
      paymentTerms: data.paymentTerms ?? null,
      preferredPaymentMethod: data.preferredPaymentMethod ?? null,
      conflictChecked: data.conflictChecked ?? false,
      conflictCheckDate: data.conflictCheckDate ?? null,
      conflictNotes: data.conflictNotes ?? null,
    },
  });
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Client",
    entityId: client.id,
    action: "create",
    metadata: { raisonSociale: client.raisonSociale },
  });
  revalidatePath("/clients");
  redirect("/clients?success=created");
}

/** Crée un client avec le minimum (raison sociale + type) et retourne l'id sans redirection (pour saisie rapide / modals). */
export async function createClientQuick(data: { raisonSociale: string; typeClient?: "personne_physique" | "personne_morale" }): Promise<{ id: string; raisonSociale: string } | { error: string }> {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const raisonSociale = data.raisonSociale?.trim();
  if (!raisonSociale) {
    return { error: "Raison sociale requise" };
  }
  const typeClient = data.typeClient ?? "personne_morale";
  const parsed = clientSchema.safeParse({
    raisonSociale,
    typeClient,
  });
  if (!parsed.success) {
    return { error: "Données invalides" };
  }
  const client = await prisma.client.create({
    data: {
      cabinetId,
      raisonSociale: parsed.data.raisonSociale,
      typeClient: parsed.data.typeClient as "personne_physique" | "personne_morale",
    },
  });
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Client",
    entityId: client.id,
    action: "create",
    metadata: { raisonSociale: client.raisonSociale },
  });
  revalidatePath("/clients");
  revalidatePath("/temps");
  return { id: client.id, raisonSociale: client.raisonSociale };
}

export async function updateClient(id: string, formData: FormData) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const raw = {
    raisonSociale: formData.get("raisonSociale") as string,
    typeClient: formData.get("typeClient") as string | undefined,
    prenom: (formData.get("prenom") as string) || undefined,
    nom: (formData.get("nom") as string) || undefined,
    contact: (formData.get("contact") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    telephone: (formData.get("telephone") as string) || undefined,
    adresse: (formData.get("adresse") as string) || undefined,
    consentementCollecteAt: formData.get("consentementCollecteAt")
      ? new Date(formData.get("consentementCollecteAt") as string)
      : undefined,
    finalitesConsentement: (formData.get("finalitesConsentement") as string) || undefined,
    retentionJusqua: formData.get("retentionJusqua")
      ? new Date(formData.get("retentionJusqua") as string)
      : undefined,
    notesConfidentielles: (formData.get("notesConfidentielles") as string) || undefined,
  };
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/clients/${id}?error=invalid`);
  }
  const data = {
    ...parsed.data,
    typeClient: parsed.data.typeClient ?? "personne_morale",
    email: parsed.data.email || null,
  };
  await prisma.client.updateMany({
    where: { id, cabinetId },
    data: {
      raisonSociale: data.raisonSociale,
      typeClient: data.typeClient,
      prenom: data.prenom ?? null,
      nom: data.nom ?? null,
      contact: data.contact ?? null,
      email: data.email,
      telephone: data.telephone ?? null,
      adresse: data.adresse ?? null,
      consentementCollecteAt: parsed.data.consentementCollecteAt ?? undefined,
      finalitesConsentement: parsed.data.finalitesConsentement ?? undefined,
      retentionJusqua: parsed.data.retentionJusqua ?? undefined,
      notesConfidentielles: parsed.data.notesConfidentielles ?? undefined,
    },
  });
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Client",
    entityId: id,
    action: "update",
    metadata: { raisonSociale: data.raisonSociale },
  });
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect("/clients");
}

export async function updateClientForm(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await updateClient(id, formData);
}

export async function deleteClient(id: string) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  await prisma.client.deleteMany({ where: { id, cabinetId } });
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Client",
    entityId: id,
    action: "delete",
  });
  revalidatePath("/clients");
  redirect("/clients");
}

export async function archiveClient(id: string) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  await prisma.client.updateMany({
    where: { id, cabinetId },
    data: { status: "archive" },
  });
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Client",
    entityId: id,
    action: "update",
    metadata: { status: "archive" },
  });
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect("/clients?success=archived");
}

export async function archiveClientsBulk(ids: string[]) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  if (!ids.length) return;
  await prisma.client.updateMany({
    where: { id: { in: ids }, cabinetId },
    data: { status: "archive" },
  });
  for (const id of ids) {
    await createAuditLog({
      cabinetId,
      userId,
      entityType: "Client",
      entityId: id,
      action: "update",
      metadata: { status: "archive", bulk: true },
    });
  }
  revalidatePath("/clients");
  redirect("/clients?success=archived");
}

export async function createIdentityVerification(formData: FormData) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const clientId = formData.get("clientId") as string;
  const date = formData.get("date") ? new Date(formData.get("date") as string) : new Date();
  const methode = (formData.get("methode") as string) || "Pièce d'identité";
  const statut = (formData.get("statut") as "en_attente" | "verifie" | "refuse") || "verifie";
  const notes = (formData.get("notes") as string) || undefined;
  if (!clientId) {
    redirect("/clients?error=invalid");
  }
  const { createIdentityVerification: createVerification } = await import("@/lib/services/identity-verification");
  await createVerification({
    clientId,
    cabinetId,
    userId,
    date,
    methode,
    statut,
    notes,
  });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/verification-identite`);
  redirect(`/clients/${clientId}/verification-identite`);
}
