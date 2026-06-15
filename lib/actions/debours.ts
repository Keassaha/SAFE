"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { deboursDossierSchema } from "@/lib/validations/debours";
import { createAuditLog } from "@/lib/services/audit";
import { writeJournalForDeboursPaiement } from "@/lib/services/journal/debours-dossier-journal";
import { applyDeboursDossierCorrection } from "@/lib/services/journal/append-only-corrections";
import { loadDossierPreparationSnapshot } from "@/lib/dossiers/preparation-loader";
import { getDossierPreparationStatus } from "@/lib/dossiers/preparation-status";
import { detectAndEmitIfReady } from "@/lib/services/ready-for-review-service";
import { warnUnbilledDeboursOnClosedDossier, type GuardWarning } from "@/lib/accounting/anti-erreurs";

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
    select: { clientId: true, statut: true },
  });
  if (!dossier || dossier.clientId !== parsed.data.clientId) {
    return { ok: false as const, error: "invalid" };
  }

  // Doctrine signal: docs/product/READY_FOR_REVIEW_SIGNAL.md §8.
  // Capturer l'état AVANT pour détecter une transition vers `pret_pour_revue`
  // (la saisie d'un débours requis lève le manquant `debours`).
  const beforeSnap = await loadDossierPreparationSnapshot(
    cabinetId,
    parsed.data.dossierId,
    { callerUserId: userId },
  );
  const beforeState = beforeSnap ? getDossierPreparationStatus(beforeSnap).state : null;

  // Atomicité : la création du débours et l'éventuelle écriture journal
  // doivent réussir ensemble. Le helper journal est un no-op silencieux
  // si `payeParCabinet=false`, donc on l'appelle dans tous les cas — il
  // gère la décision lui-même.
  const created = await prisma.$transaction(async (txClient) => {
    const debours = await txClient.deboursDossier.create({
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
      include: { deboursType: true },
    });

    // Doctrine §4 — un débours payé par le cabinet est une vraie sortie de
    // trésorerie. L'helper est idempotent et silencieux si non payé.
    await writeJournalForDeboursPaiement(debours, {
      client: txClient,
      utilisateurId: userId,
      deboursType: debours.deboursType,
    });

    return debours;
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "DeboursDossier",
    entityId: created.id,
    action: "create",
    metadata: { dossierId: created.dossierId, montant: created.montant, description: created.description },
  });

  await detectAndEmitIfReady(cabinetId, created.dossierId, {
    beforeState,
    callerUserId: userId,
  });

  // Anti-erreur (doctrine §8) : signaler un débours refacturable non facturé créé
  // sur un dossier déjà fermé/archivé (risque d'oubli de refacturation).
  const warning: GuardWarning | null = warnUnbilledDeboursOnClosedDossier({
    statutDebours: created.statutDebours,
    dossierStatut: dossier.statut,
    refacturable: created.refacturable,
  });

  revalidatePath(`/dossiers/${dossierId}`);
  revalidatePath("/facturation/frais");
  revalidatePath("/journal/general");
  revalidatePath("/comptabilite");
  revalidatePath("/tableau-de-bord");
  return { ok: true as const, id: created.id, warning };
}

export async function updateDeboursDossier(id: string, formData: FormData) {
  const { cabinetId, userId } = await requireCabinetAndUser();

  // On lit l'état complet pré-update pour pouvoir détecter un changement
  // matériel et déclencher la correction append-only le cas échéant.
  const existing = await prisma.deboursDossier.findFirst({
    where: { id, cabinetId },
    include: { deboursType: true },
  });
  if (!existing) {
    redirect("/dossiers");
  }
  if (existing.factureId) {
    return { ok: false as const, error: "already_invoiced" };
  }

  // Doctrine signal: docs/product/READY_FOR_REVIEW_SIGNAL.md §8.
  // Un update peut renseigner le type/montant d'un débours requis déjà créé
  // et ainsi lever le manquant `debours`.
  const beforeSnap = await loadDossierPreparationSnapshot(cabinetId, existing.dossierId, {
    callerUserId: userId,
  });
  const beforeState = beforeSnap ? getDossierPreparationStatus(beforeSnap).state : null;

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

  // Atomicité : update + (création journal initiale OU correction append-only)
  // dans une seule transaction. La couche choisit le bon chemin selon l'état :
  //
  //   - L'entité n'a JAMAIS été journalisée (pas d'écriture initiale dans le
  //     journal pour ce sourceId) → on appelle `writeJournalForDeboursPaiement`
  //     qui crée l'écriture initiale si applicable. Cas typique : le débours
  //     a été créé avec `payeParCabinet=false`, puis l'opérateur le passe à
  //     `true` lors d'un update.
  //
  //   - L'entité A DÉJÀ été journalisée → tout changement matériel passe par
  //     `applyDeboursDossierCorrection` qui émet une CORRECTION + un re-jeu
  //     versionné si nécessaire. Append-only respecté.
  //     Voir docs/accounting/APPEND_ONLY_CORRECTIONS.md.
  await prisma.$transaction(async (txClient) => {
    const updated = await txClient.deboursDossier.update({
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
      include: { deboursType: true },
    });

    // Cherche l'écriture initiale au journal (sourceId exact).
    const initialEntry = await txClient.journalGeneralEntry.findFirst({
      where: { cabinetId, sourceModule: "DEBOURS", sourceId: id },
      select: { id: true },
    });

    if (!initialEntry) {
      // Jamais journalisé — on tente la création initiale (no-op si
      // payeParCabinet=false ou montant=0).
      await writeJournalForDeboursPaiement(updated, {
        client: txClient,
        utilisateurId: userId,
        deboursType: updated.deboursType,
      });
    } else {
      // Déjà journalisé — toute modification matérielle passe par la correction.
      await applyDeboursDossierCorrection(existing as typeof updated, updated, {
        client: txClient,
        utilisateurId: userId,
        deboursType: updated.deboursType,
      });
    }
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "DeboursDossier",
    entityId: id,
    action: "update",
    metadata: { montant: parsed.data.montant, description: parsed.data.description },
  });

  await detectAndEmitIfReady(cabinetId, existing.dossierId, {
    beforeState,
    callerUserId: userId,
  });

  revalidatePath(`/dossiers/${existing.dossierId}`);
  revalidatePath("/journal/general");
  revalidatePath("/comptabilite");
  revalidatePath("/gestion/assistante");
  return { ok: true as const };
}

export async function deleteDeboursDossier(id: string) {
  const { cabinetId, userId } = await requireCabinetAndUser();

  const existing = await prisma.deboursDossier.findFirst({
    where: { id, cabinetId },
    select: { dossierId: true, factureId: true, statutDebours: true, montant: true },
  });
  if (!existing) {
    redirect("/dossiers");
  }
  if (existing.factureId) {
    return { ok: false as const, error: "already_invoiced" };
  }
  if (existing.statutDebours === "RADIE") {
    return { ok: true as const };
  }

  await prisma.deboursDossier.update({
    where: { id },
    data: { statutDebours: "RADIE" },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "DeboursDossier",
    entityId: id,
    action: "update",
    metadata: {
      statutDebours: "RADIE",
      montant: existing.montant,
      reason: "delete_requested_converted_to_write_off",
    },
  });

  revalidatePath(`/dossiers/${existing.dossierId}`);
  revalidatePath("/facturation/frais");
  revalidatePath("/comptabilite");
  return { ok: true as const };
}

/** Wrapper pour formulaire : supprime le débours dont l'id est dans formData. */
export async function deleteDeboursDossierForm(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await deleteDeboursDossier(id);
}

/**
 * Radie un débours jugé non recouvrable (statut → RADIE). Doctrine §8/§12 :
 * le cash déjà sorti (écriture DEBOURS) n'est PAS repris — le cabinet absorbe le
 * coût. On ne radie pas un débours déjà recouvré. La radiation est tracée à l'audit.
 */
export async function radierDeboursDossier(id: string, motif?: string) {
  const { cabinetId, userId } = await requireCabinetAndUser();

  const existing = await prisma.deboursDossier.findFirst({
    where: { id, cabinetId },
    select: { dossierId: true, statutDebours: true, montant: true },
  });
  if (!existing) {
    return { ok: false as const, error: "not_found" };
  }
  if (existing.statutDebours === "RECOUVRE") {
    return { ok: false as const, error: "already_recovered" };
  }
  if (existing.statutDebours === "RADIE") {
    return { ok: true as const }; // idempotent
  }

  await prisma.deboursDossier.update({
    where: { id },
    data: { statutDebours: "RADIE" },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "DeboursDossier",
    entityId: id,
    action: "update",
    metadata: { statutDebours: "RADIE", montant: existing.montant, motif: motif ?? null },
  });

  revalidatePath(`/dossiers/${existing.dossierId}`);
  revalidatePath("/facturation/frais");
  revalidatePath("/comptabilite");
  return { ok: true as const };
}
