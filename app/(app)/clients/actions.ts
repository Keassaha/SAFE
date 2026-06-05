"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { clientSchema } from "@/lib/validations/client";
import { createAuditLog } from "@/lib/services/audit";
import { sanitizeInput } from "@/lib/utils/sanitize";
import { findClientDuplicate, formatClientDisplayName } from "@/lib/clients/detect-duplicate";

function buildConflictNotes(params: {
  userNotes?: string;
  status: string;
  query: string;
  checkedAt: string;
  acknowledged: boolean;
  matches: Array<{ kind?: string; label?: string; reason?: string; risk?: string }>;
}): string | undefined {
  const lines: string[] = [];
  if (params.checkedAt) {
    const when = (() => {
      try {
        return new Date(params.checkedAt).toISOString();
      } catch {
        return params.checkedAt;
      }
    })();
    lines.push(`[Contrôle automatique de conflit — ${when}]`);
  } else {
    lines.push(`[Contrôle automatique de conflit]`);
  }
  lines.push(`Statut: ${params.status}${params.acknowledged ? " (risque acquitté)" : ""}`);
  if (params.query) lines.push(`Requête: ${params.query}`);
  if (params.matches.length > 0) {
    lines.push(`Correspondances (${params.matches.length}):`);
    for (const m of params.matches.slice(0, 20)) {
      const parts = [m.kind, m.risk, m.reason, m.label].filter(Boolean);
      lines.push(`  - ${parts.join(" | ")}`);
    }
  } else {
    lines.push("Aucune correspondance.");
  }
  if (params.userNotes && params.userNotes.trim()) {
    lines.push("");
    lines.push("Notes:");
    lines.push(params.userNotes.trim());
  }
  return lines.join("\n");
}

export async function createClient(formData: FormData) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const raw: Record<string, unknown> = {
    raisonSociale: (formData.get("raisonSociale") as string) || undefined,
    typeClient: (formData.get("typeClient") as string) || undefined,
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
    conflictNotes: (formData.get("conflictNotes") as string) || undefined,
  };

  // Trace du contrôle de conflit automatique exécuté côté wizard.
  const conflictStatus = (formData.get("conflictCheckStatus") as string) || "pending";
  const conflictCheckedAtRaw = (formData.get("conflictCheckedAt") as string) || "";
  const conflictAcknowledged = formData.get("conflictAcknowledged") === "true";
  const conflictMatchesRaw = (formData.get("conflictCheckMatches") as string) || "[]";
  const conflictQuery = (formData.get("conflictCheckQuery") as string) || "";

  let conflictMatches: Array<{ kind: string; label: string; reason: string; risk: string }> = [];
  try {
    const parsed = JSON.parse(conflictMatchesRaw);
    if (Array.isArray(parsed)) conflictMatches = parsed;
  } catch {
    conflictMatches = [];
  }

  const conflictResolved =
    conflictStatus === "clear" ||
    ((conflictStatus === "possible_match" || conflictStatus === "high_risk") && conflictAcknowledged);

  const conflictCheckDate = conflictCheckedAtRaw ? new Date(conflictCheckedAtRaw) : undefined;

  raw.conflictChecked = conflictResolved;
  raw.conflictCheckDate = conflictCheckDate;
  raw.conflictNotes = buildConflictNotes({
    userNotes: typeof raw.conflictNotes === "string" ? raw.conflictNotes : undefined,
    status: conflictStatus,
    query: conflictQuery,
    checkedAt: conflictCheckedAtRaw,
    acknowledged: conflictAcknowledged,
    matches: conflictMatches,
  });

  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/clients/nouveau?error=invalid");
  }
  if (conflictStatus === "high_risk" && !conflictAcknowledged) {
    redirect("/clients/nouveau?error=conflict_unresolved");
  }

  const duplicate = await findClientDuplicate({
    cabinetId,
    typeClient: parsed.data.typeClient,
    raisonSociale: parsed.data.raisonSociale,
    prenom: parsed.data.prenom,
    nom: parsed.data.nom,
  });
  if (duplicate) {
    redirect(`/clients/nouveau?error=duplicate&existingId=${duplicate.id}`);
  }

  const s = (v: string | undefined | null) => v ? sanitizeInput(v) : v;
  const data = {
    ...parsed.data,
    raisonSociale: s(parsed.data.raisonSociale),
    prenom: s(parsed.data.prenom),
    nom: s(parsed.data.nom),
    contact: s(parsed.data.contact),
    notesConfidentielles: s(parsed.data.notesConfidentielles),
    conflictNotes: s(parsed.data.conflictNotes),
    billingContactName: s(parsed.data.billingContactName),
    typeClient: parsed.data.typeClient ?? "personne_morale",
    email: parsed.data.email || null,
    consentementCollecteAt: parsed.data.consentementCollecteAt ?? undefined,
    finalitesConsentement: s(parsed.data.finalitesConsentement) ?? undefined,
    retentionJusqua: parsed.data.retentionJusqua ?? undefined,
  };
  const client = await prisma.client.create({
    data: {
      cabinetId,
      raisonSociale: data.raisonSociale ?? null,
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

/**
 * Crée un client avec le minimum (raison sociale + type) et retourne l'id sans redirection (pour saisie rapide / modals).
 *
 * Doctrine i18n : retourne des codes d'erreur (clés du namespace `errors.*`) au lieu de
 * messages localisés. Le client (composant React) traduit avec `useTranslations("errors")`.
 */
export async function createClientQuick(
  data: { raisonSociale: string; typeClient?: "personne_physique" | "personne_morale" },
): Promise<
  | { id: string; raisonSociale: string }
  | { error: string; errorParams?: Record<string, string> }
> {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const trimmed = data.raisonSociale?.trim();
  if (!trimmed) {
    return { error: "client.nameRequired" };
  }
  const typeClient = data.typeClient ?? "personne_morale";

  let payload: { raisonSociale?: string; prenom?: string; nom?: string; typeClient: typeof typeClient };
  if (typeClient === "personne_physique") {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    const nom = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    const prenom = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
    if (!nom) return { error: "client.nameRequired" };
    payload = { typeClient, prenom: prenom || nom, nom };
  } else {
    payload = { typeClient, raisonSociale: trimmed };
  }

  const parsed = clientSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "client.invalidData" };
  }

  const duplicate = await findClientDuplicate({
    cabinetId,
    typeClient: parsed.data.typeClient,
    raisonSociale: parsed.data.raisonSociale,
    prenom: parsed.data.prenom,
    nom: parsed.data.nom,
  });
  if (duplicate) {
    return {
      error: "client.duplicate",
      errorParams: { name: formatClientDisplayName(duplicate) },
    };
  }

  const client = await prisma.client.create({
    data: {
      cabinetId,
      typeClient: parsed.data.typeClient as "personne_physique" | "personne_morale",
      raisonSociale: parsed.data.raisonSociale ? sanitizeInput(parsed.data.raisonSociale) : null,
      prenom: parsed.data.prenom ? sanitizeInput(parsed.data.prenom) : null,
      nom: parsed.data.nom ? sanitizeInput(parsed.data.nom) : null,
    },
  });

  const displayName = client.raisonSociale ?? [client.prenom, client.nom].filter(Boolean).join(" ").trim();
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Client",
    entityId: client.id,
    action: "create",
    metadata: { raisonSociale: displayName },
  });
  revalidatePath("/clients");
  revalidatePath("/temps");
  return { id: client.id, raisonSociale: displayName } as { id: string; raisonSociale: string };
}

export async function updateClient(id: string, formData: FormData) {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const raw = {
    raisonSociale: (formData.get("raisonSociale") as string) || undefined,
    typeClient: (formData.get("typeClient") as string) || undefined,
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

  const duplicate = await findClientDuplicate({
    cabinetId,
    typeClient: parsed.data.typeClient,
    raisonSociale: parsed.data.raisonSociale,
    prenom: parsed.data.prenom,
    nom: parsed.data.nom,
    excludeId: id,
  });
  if (duplicate) {
    redirect(`/clients/${id}?error=duplicate&existingId=${duplicate.id}`);
  }

  const su = (v: string | undefined | null) => v ? sanitizeInput(v) : v;
  const data = {
    ...parsed.data,
    typeClient: parsed.data.typeClient ?? "personne_morale",
    email: parsed.data.email || null,
  };
  const isPhysique = data.typeClient === "personne_physique";
  await prisma.client.updateMany({
    where: { id, cabinetId },
    data: {
      typeClient: data.typeClient,
      // Clear the wrong-type name field so a type switch doesn't leave a stale
      // value behind: morale → null prenom/nom ; physique → null raisonSociale.
      raisonSociale: isPhysique ? null : (su(data.raisonSociale) ?? null),
      prenom: isPhysique ? (su(data.prenom) ?? null) : null,
      nom: isPhysique ? (su(data.nom) ?? null) : null,
      contact: su(data.contact) ?? null,
      email: data.email,
      telephone: data.telephone ?? null,
      adresse: su(data.adresse) ?? null,
      consentementCollecteAt: parsed.data.consentementCollecteAt ?? undefined,
      finalitesConsentement: su(parsed.data.finalitesConsentement) ?? undefined,
      retentionJusqua: parsed.data.retentionJusqua ?? undefined,
      notesConfidentielles: su(parsed.data.notesConfidentielles) ?? undefined,
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
  redirect(`/clients/${id}`);
}

export async function updateClientForm(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await updateClient(id, formData);
}

/**
 * Conformité Barreau (B-1 r.5) : un client n'est JAMAIS détruit (ses registres
 * factures/fidéicommis/documents doivent être conservés). Toute demande de
 * suppression est redirigée vers l'archivage (soft delete). Filet de sécurité
 * supplémentaire au niveau base : FK clientId en ON DELETE RESTRICT.
 */
export async function deleteClient(id: string) {
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
    metadata: { status: "archive", reason: "delete_request_redirected_to_archive" },
  });
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect("/clients?success=archived");
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
