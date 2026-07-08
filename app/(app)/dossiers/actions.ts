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
import { sanitizeInput } from "@/lib/utils/sanitize";
import { getDossierClosureBlockers, type ClosureBlockers } from "@/lib/services/dossiers/closure-blockers";
import { computeRetentionUntil } from "@/lib/dossiers/retention";
import { generateCartable } from "@/lib/dossiers/cartable-service";
import { loadDossierPreparationSnapshot } from "@/lib/dossiers/preparation-loader";
import { getDossierPreparationStatus } from "@/lib/dossiers/preparation-status";
import { detectAndEmitIfReady } from "@/lib/services/ready-for-review-service";
import { getCabinetBillingMode } from "@/lib/services/cabinet-interface";
import { getCabinetDossierTaxonomyById } from "@/lib/dossiers/cabinet-dossier-taxonomy";
import { getSubjectByCode, subjectCodeToDossierType } from "@/lib/dossiers/taxonomy";
import { buildNumeroDossier, maxSequenceAnyPrefix } from "@/lib/dossiers/numero";
import { parsePartiesDrafts } from "@/lib/dossiers/parties";
import { syncDossierParties, reconcilePrincipalParty } from "@/lib/dossiers/parties-sync";
import type { DossierStatut, DossierType, ModeFacturationDossier, UserRole } from "@prisma/client";
import { canManageDossiers } from "@/lib/auth/permissions";

export async function createDossier(formData: FormData) {
  const { cabinetId, userId } = await requireCabinetAndUser();

  // Taxonomie de dossiers (Sujets → préfixes), optionnelle et par cabinet.
  // Quand elle est active, le Sujet EST le « type de pratique » choisi par
  // l'utilisateur (le champ enum `type` n'est plus saisi à la main) ; on en
  // dérive une valeur d'enum cohérente. Si absente, on conserve la
  // numérotation legacy `AAAA-NNN` et le champ `type` classique (zéro régression).
  const taxonomy = await getCabinetDossierTaxonomyById(cabinetId);
  const subjectCode = (formData.get("subject") as string) || null;
  const submatterLabel = ((formData.get("submatter") as string) || "").trim() || null;
  const subject = taxonomy ? getSubjectByCode(taxonomy, subjectCode) : null;
  const usingTaxonomy = Boolean(taxonomy && subject);
  const derivedType = usingTaxonomy ? subjectCodeToDossierType(subject!.code) : null;

  const raw = {
    clientId: formData.get("clientId") as string,
    avocatResponsableId: (formData.get("avocatResponsableId") as string) || undefined,
    assistantJuridiqueId: (formData.get("assistantJuridiqueId") as string) || undefined,
    reference: (formData.get("reference") as string) || undefined,
    intitule: formData.get("intitule") as string,
    statut: formData.get("statut") as string,
    type: usingTaxonomy ? derivedType : ((formData.get("type") as string) || null),
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

  // Cabinets configurés en facturation forfaitaire : la facturation horaire
  // ne doit pas pouvoir être enregistrée sur un dossier, même si le client
  // envoie horaire/tauxHoraire (formulaire bypassé, ancien tab ouvert).
  const cabinetBillingMode = await getCabinetBillingMode(cabinetId);
  if (cabinetBillingMode === "forfait") {
    parsed.data.modeFacturation = "forfait";
    parsed.data.tauxHoraire = null;
  }

  const intitule = sanitizeInput(parsed.data.intitule?.trim() || "Dossier");
  const year = new Date().getFullYear();

  const maxAttempts = 10;
  let dossier: Awaited<ReturnType<typeof prisma.dossier.create>> | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let numeroDossier: string;
    if (usingTaxonomy && subject && taxonomy) {
      const seqWidth = taxonomy.numbering.seqWidth;
      if (taxonomy.numbering.scope === "year") {
        // Compteur unique par année, toutes matières confondues.
        const existing = await prisma.dossier.findMany({
          where: { cabinetId, numeroDossier: { startsWith: `${year}-` } },
          select: { numeroDossier: true },
        });
        const next = maxSequenceAnyPrefix(existing.map((e) => e.numeroDossier), year) + 1;
        numeroDossier = `${year}-${subject.prefix}-${String(next).padStart(seqWidth, "0")}`;
      } else {
        // Compteur par préfixe (défaut, décision Q2).
        const existing = await prisma.dossier.findMany({
          where: { cabinetId, numeroDossier: { startsWith: `${year}-${subject.prefix}-` } },
          select: { numeroDossier: true },
        });
        numeroDossier = buildNumeroDossier({
          year,
          existingNumeros: existing.map((e) => e.numeroDossier),
          prefix: subject.prefix,
          seqWidth,
        });
      }
    } else {
      // Legacy : `AAAA-NNN` basé sur le compte de l'année.
      const count = await prisma.dossier.count({
        where: { cabinetId, numeroDossier: { startsWith: `${year}-` } },
      });
      numeroDossier = `${year}-${String(count + 1).padStart(3, "0")}`;
    }
    try {
      dossier = await prisma.dossier.create({
        data: {
          cabinetId,
          clientId: parsed.data.clientId,
          avocatResponsableId: parsed.data.avocatResponsableId ?? null,
          assistantJuridiqueId: parsed.data.assistantJuridiqueId ?? null,
          reference: parsed.data.reference ? sanitizeInput(parsed.data.reference) : null,
          numeroDossier,
          intitule,
          statut: parsed.data.statut as DossierStatut,
          type: (parsed.data.type as DossierType | null) ?? null,
          descriptionConfidentielle: parsed.data.descriptionConfidentielle ? sanitizeInput(parsed.data.descriptionConfidentielle) : null,
          resumeDossier: parsed.data.resumeDossier ? sanitizeInput(parsed.data.resumeDossier) : null,
          notesStrategieJuridique: parsed.data.notesStrategieJuridique ? sanitizeInput(parsed.data.notesStrategieJuridique) : null,
          tribunalNom: parsed.data.tribunalNom ? sanitizeInput(parsed.data.tribunalNom) : null,
          districtJudiciaire: parsed.data.districtJudiciaire ? sanitizeInput(parsed.data.districtJudiciaire) : null,
          numeroDossierTribunal: parsed.data.numeroDossierTribunal ? sanitizeInput(parsed.data.numeroDossierTribunal) : null,
          nomJuge: parsed.data.nomJuge ? sanitizeInput(parsed.data.nomJuge) : null,
          modeFacturation: (parsed.data.modeFacturation as ModeFacturationDossier | null) ?? null,
          tauxHoraire: parsed.data.tauxHoraire ?? null,
          retentionJusqua: parsed.data.retentionJusqua ?? null,
          // Taxonomie cabinet : code du Sujet + sous-matière sélectionnée.
          matterCode: subject?.code ?? null,
          ...(usingTaxonomy ? { sousType: submatterLabel } : {}),
          // Immobilier fields (D2)
          ...(parsed.data.type === "immobilier" ? {
            sousType: usingTaxonomy ? submatterLabel : ((formData.get("sousType") as string) || null),
            closingDate: formData.get("closingDate") ? new Date(formData.get("closingDate") as string) : null,
            propertyAddress: formData.get("propertyAddress") ? sanitizeInput(formData.get("propertyAddress") as string) : null,
            fintracVerified: formData.get("fintracVerified") === "on",
            fintracVerifiedAt: formData.get("fintracVerified") === "on" ? new Date() : null,
            fintracVerifiedById: formData.get("fintracVerified") === "on" ? userId : null,
            fintracDocuments: formData.get("fintracDocuments") ? (formData.get("fintracDocuments") as string) : null,
            condoPINParking: formData.get("condoPINParking") ? sanitizeInput(formData.get("condoPINParking") as string) : null,
            condoPINLocker: formData.get("condoPINLocker") ? sanitizeInput(formData.get("condoPINLocker") as string) : null,
          } : {}),
          // Immigration fields (D3)
          ...(parsed.data.type === "immigration" ? {
            sousType: usingTaxonomy ? submatterLabel : ((formData.get("sousType") as string) || null),
            irccStatut: "consultation",
          } : {}),
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
  await generateCartable(dossier.id, cabinetId, dossier.type, dossier.sousType);

  // Personnes du dossier : crée le mandant principal + co-clients + parties externes.
  // Toujours exécuté (même flag off), pour garantir l'invariant « 1 principal par dossier ».
  await syncDossierParties({
    cabinetId,
    userId,
    dossierId: dossier.id,
    principalClientId: parsed.data.clientId,
    drafts: parsePartiesDrafts(formData.get("partiesJson") as string | null),
  });

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

  // Taxonomie cabinet (édition) : si configurée et un Sujet est choisi, le
  // Sujet pilote `matterCode` + le type dérivé ; la sous-matière pilote
  // `sousType`. Sinon, comportement legacy inchangé.
  const taxonomy = await getCabinetDossierTaxonomyById(cabinetId);
  const subjectCode = (formData.get("subject") as string) || null;
  const submatterLabel = ((formData.get("submatter") as string) || "").trim() || null;
  const subject = taxonomy ? getSubjectByCode(taxonomy, subjectCode) : null;
  const usingTaxonomy = Boolean(taxonomy && subject);
  const derivedType = usingTaxonomy ? subjectCodeToDossierType(subject!.code) : null;

  const raw = {
    clientId: formData.get("clientId") as string,
    avocatResponsableId: (formData.get("avocatResponsableId") as string) || undefined,
    assistantJuridiqueId: (formData.get("assistantJuridiqueId") as string) || undefined,
    reference: (formData.get("reference") as string) || undefined,
    numeroDossier: (formData.get("numeroDossier") as string) || undefined,
    intitule: formData.get("intitule") as string,
    statut: formData.get("statut") as string,
    type: usingTaxonomy ? derivedType : ((formData.get("type") as string) || null),
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

  // Cabinets configurés en facturation forfaitaire : on neutralise toute
  // tentative d'enregistrer un mode horaire (cf. createDossier).
  const cabinetBillingMode = await getCabinetBillingMode(cabinetId);
  if (cabinetBillingMode === "forfait") {
    parsed.data.modeFacturation = "forfait";
    parsed.data.tauxHoraire = null;
  }

  const current = await prisma.dossier.findFirst({
    where: { id, cabinetId },
    select: { descriptionConfidentielle: true, notesStrategieJuridique: true, intitule: true, statut: true },
  });

  // Garde-fou : la fermeture (statut "cloture") doit passer par l'onglet
  // Fermeture (closeDossier) pour vérifier les bloquants et produire une trace.
  // On bloque toute transition silencieuse vers "cloture" via le formulaire générique.
  if (parsed.data.statut === "cloture" && current?.statut !== "cloture") {
    redirect(`/dossiers/${id}?error=use_closure_tab`);
  }
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

  // Capture l'état AVANT l'update pour détecter une transition vers `pret_pour_revue`.
  // Doctrine: docs/product/READY_FOR_REVIEW_SIGNAL.md
  const beforeSnap = await loadDossierPreparationSnapshot(
    cabinetId,
    id,
    { callerUserId: userId },
  );
  const beforeState = beforeSnap ? getDossierPreparationStatus(beforeSnap).state : null;

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
      // Taxonomie cabinet : code du Sujet + sous-matière sélectionnée.
      ...(usingTaxonomy ? { matterCode: subject?.code ?? null, sousType: submatterLabel } : {}),
      // Immobilier fields (D2)
      ...(parsed.data.type === "immobilier" ? {
        sousType: usingTaxonomy ? submatterLabel : ((formData.get("sousType") as string) || null),
        closingDate: formData.get("closingDate") ? new Date(formData.get("closingDate") as string) : null,
        propertyAddress: formData.get("propertyAddress") ? sanitizeInput(formData.get("propertyAddress") as string) : null,
        fintracVerified: formData.get("fintracVerified") === "on",
        fintracVerifiedAt: formData.get("fintracVerified") === "on" ? new Date() : null,
        fintracVerifiedById: formData.get("fintracVerified") === "on" ? userId : null,
        fintracDocuments: formData.get("fintracDocuments") ? (formData.get("fintracDocuments") as string) : null,
        condoPINParking: formData.get("condoPINParking") ? sanitizeInput(formData.get("condoPINParking") as string) : null,
        condoPINLocker: formData.get("condoPINLocker") ? sanitizeInput(formData.get("condoPINLocker") as string) : null,
      } : {}),
    },
  });
  // Personnes du dossier. Si le formulaire embarque l'éditeur (champ partiesJson
  // présent), on synchronise l'ensemble ; sinon on se contente d'aligner le
  // principal sur clientId, sans jamais effacer des parties existantes.
  if (formData.has("partiesJson")) {
    await syncDossierParties({
      cabinetId,
      userId,
      dossierId: id,
      principalClientId: parsed.data.clientId,
      drafts: parsePartiesDrafts(formData.get("partiesJson") as string | null),
    });
  } else {
    await reconcilePrincipalParty({ cabinetId, dossierId: id, principalClientId: parsed.data.clientId });
  }

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Dossier",
    entityId: id,
    action: "update",
    metadata: { reference: parsed.data.reference ?? undefined, intitule },
  });

  // Émet le signal "prêt pour revue" si la transition est observée après l'update.
  // No-op si pas de transition ou si un signal pending existe déjà.
  await detectAndEmitIfReady(cabinetId, id, {
    beforeState,
    callerUserId: userId,
  });

  revalidatePath("/dossiers");
  revalidatePath(`/dossiers/${id}`);
  revalidatePath("/tableau-de-bord");
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

/**
 * Actions en lot sur une sélection de dossiers (Lot A — gestion de portefeuille).
 *
 * Garde-fous :
 * - `canManageDossiers` requis (admin_cabinet + assistante ; tous deux vue cabinet).
 * - `updateMany` toujours borné à `cabinetId` (isolation tenant ; un id étranger
 *   est ignoré, jamais d'erreur qui fuite l'existence).
 * - `cloture` INTERDIT ici : la fermeture passe par `closeDossier` et ses
 *   bloqueurs de conformité (solde fiducie négatif, factures impayées). L'archivage
 *   reste une action douce distincte.
 * - Plafond de 200 dossiers par lot.
 * - Un audit log par dossier touché (traçabilité Barreau).
 */
export async function bulkUpdateDossiers(input: {
  ids: string[];
  action: "setStatut" | "assignLawyer" | "archive";
  statut?: "ouvert" | "actif" | "en_attente";
  avocatResponsableId?: string;
}): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canManageDossiers(role as UserRole)) {
    return { ok: false, error: "forbidden" };
  }

  const ids = Array.from(new Set((input.ids ?? []).filter((v) => typeof v === "string" && v.trim())));
  if (ids.length === 0) {
    return { ok: false, error: "empty" };
  }
  if (ids.length > 200) {
    return { ok: false, error: "too_many" };
  }

  let data: { statut: DossierStatut } | { avocatResponsableId: string };
  let auditMeta: Record<string, unknown>;

  if (input.action === "setStatut") {
    const allowed: DossierStatut[] = ["ouvert", "actif", "en_attente"];
    if (!input.statut || !allowed.includes(input.statut)) {
      return { ok: false, error: "invalid_statut" };
    }
    data = { statut: input.statut };
    auditMeta = { bulk: true, action: "setStatut", statut: input.statut };
  } else if (input.action === "assignLawyer") {
    const lawyerId = input.avocatResponsableId?.trim();
    if (!lawyerId) {
      return { ok: false, error: "invalid_lawyer" };
    }
    // L'avocat doit appartenir au cabinet et pouvoir être responsable.
    const lawyer = await prisma.user.findFirst({
      where: { id: lawyerId, cabinetId, role: { in: ["admin_cabinet", "avocat"] } },
      select: { id: true },
    });
    if (!lawyer) {
      return { ok: false, error: "invalid_lawyer" };
    }
    data = { avocatResponsableId: lawyerId };
    auditMeta = { bulk: true, action: "assignLawyer", avocatResponsableId: lawyerId };
  } else if (input.action === "archive") {
    data = { statut: "archive" as DossierStatut };
    auditMeta = { bulk: true, action: "archive", statut: "archive" };
  } else {
    return { ok: false, error: "invalid_action" };
  }

  const result = await prisma.dossier.updateMany({
    where: { id: { in: ids }, cabinetId },
    data,
  });

  // Audit : on ne trace que les dossiers réellement présents dans le cabinet.
  const touched = await prisma.dossier.findMany({
    where: { id: { in: ids }, cabinetId },
    select: { id: true },
  });
  await Promise.all(
    touched.map((d) =>
      createAuditLog({
        cabinetId,
        userId,
        entityType: "Dossier",
        entityId: d.id,
        action: "update",
        metadata: auditMeta,
      }),
    ),
  );

  revalidatePath("/dossiers");
  return { ok: true, count: result.count };
}

/**
 * Ferme officiellement un dossier (statut "cloture").
 *
 * - Solde fidéicommis négatif : blocage dur (conformité), jamais acquittable.
 * - Autres éléments en attente (facture impayée, débours non recouvré, fonds à
 *   restituer) : ALERTE acquittable — le dossier se ferme après confirmation
 *   explicite (opts.acknowledge), conforme au calendrier (« marqué fermé ET alerté »).
 * - Produit une TRACE : DossierClosure (qui/quand) + AuditLog + dateCloture +
 *   retentionJusqua calculée (même source que la lettre de fermeture).
 *
 * Appelée depuis l'onglet Fermeture (client) ; retourne un résultat (pas de redirect).
 */
export async function closeDossier(
  dossierId: string,
  opts: { acknowledge?: boolean } = {},
): Promise<
  | { ok: true; closedAt: string; retentionJusqua: string }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "already_closed" }
  | { ok: false; reason: "hard_block"; blockers: ClosureBlockers }
  | { ok: false; reason: "needs_ack"; blockers: ClosureBlockers }
> {
  const { cabinetId, userId } = await requireCabinetAndUser();

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    select: { id: true, clientId: true, type: true, statut: true },
  });
  if (!dossier) return { ok: false as const, reason: "not_found" };
  if (dossier.statut === "cloture") return { ok: false as const, reason: "already_closed" };

  const blockers = await getDossierClosureBlockers({
    cabinetId,
    dossierId,
    clientId: dossier.clientId,
  });

  // Solde fidéicommis négatif : blocage dur, non acquittable.
  if (blockers.hasHardBlock) {
    return { ok: false as const, reason: "hard_block", blockers };
  }
  // Autres éléments en attente : confirmation explicite requise.
  if (blockers.hasBlockers && !opts.acknowledge) {
    return { ok: false as const, reason: "needs_ack", blockers };
  }

  const closedAt = new Date();
  const retentionJusqua = await computeRetentionUntil(cabinetId, dossier.type, closedAt);
  const checklist = {
    blockersAcknowledged: blockers.hasBlockers,
    snapshot: {
      facturesImpayees: blockers.factures,
      deboursNonRecouvres: blockers.debours,
      soldeFiducie: blockers.trust.balance,
    },
  };

  await prisma.$transaction([
    prisma.dossier.update({
      where: { id: dossierId, cabinetId },
      data: { statut: "cloture" as DossierStatut, dateCloture: closedAt, retentionJusqua },
    }),
    prisma.dossierClosure.upsert({
      where: { dossierId },
      create: {
        dossierId,
        closedById: userId,
        closedAt,
        destructionDate: retentionJusqua,
        checklist,
      },
      update: {
        closedById: userId,
        closedAt,
        destructionDate: retentionJusqua,
        checklist,
      },
    }),
  ]);

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Dossier",
    entityId: dossierId,
    action: "update",
    metadata: {
      statut: "cloture",
      blockersAcknowledged: blockers.hasBlockers,
      facturesImpayees: blockers.factures.count,
      montantImpaye: blockers.factures.montant,
      deboursNonRecouvres: blockers.debours.count,
      soldeFiducie: blockers.trust.balance,
    },
  });

  revalidatePath("/dossiers");
  revalidatePath(`/dossiers/${dossierId}`);
  revalidatePath("/tableau-de-bord");

  return {
    ok: true as const,
    closedAt: closedAt.toISOString(),
    retentionJusqua: retentionJusqua.toISOString(),
  };
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
      titre: sanitizeInput(parsed.data.titre),
      description: parsed.data.description ? sanitizeInput(parsed.data.description) : null,
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
  const { cabinetId, userId } = await requireCabinetAndUser();
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

  // Doctrine: docs/product/READY_FOR_REVIEW_SIGNAL.md §8.
  // Une tâche complétée peut indirectement faire passer un dossier à
  // `pret_pour_revue` (par ex. en levant un manquant `event_deadline`).
  // On limite la capture de l'état d'avant aux transitions de complétion
  // pour ne pas charger le snapshot inutilement.
  const willComplete =
    tache.statut !== "terminee" && parsed.data.statut === "terminee";
  const beforeSnap = willComplete
    ? await loadDossierPreparationSnapshot(cabinetId, tache.dossierId, {
        callerUserId: userId,
      })
    : null;
  const beforeState = beforeSnap ? getDossierPreparationStatus(beforeSnap).state : null;

  await prisma.dossierTache.update({
    where: { id },
    data: {
      titre: sanitizeInput(parsed.data.titre),
      description: parsed.data.description ? sanitizeInput(parsed.data.description) : null,
      assigneeId: parsed.data.assigneeId ?? null,
      priorite: parsed.data.priorite as "low" | "medium" | "high" | "urgent",
      statut: parsed.data.statut as "a_faire" | "en_cours" | "terminee" | "annulee",
      dateEcheance: parsed.data.dateEcheance ?? null,
    },
  });

  if (willComplete) {
    await detectAndEmitIfReady(cabinetId, tache.dossierId, {
      beforeState,
      callerUserId: userId,
    });
  }

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
      content: sanitizeInput(parsed.data.content),
      createdById: userId,
    },
  });
  revalidatePath(`/dossiers/${dossierId}`);
  redirect(`/dossiers/${dossierId}`);
}
