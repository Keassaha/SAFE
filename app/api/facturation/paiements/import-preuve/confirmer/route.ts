import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import { createPayment } from "@/lib/services/billing/payment-allocation-service";
import { createPayerRule } from "@/lib/services/finance/payer-rules";
import { hashProofFile, findDuplicateProofPayment } from "@/lib/services/finance/proof-dedup";
import { writeDocumentObject, createDocumentRecord } from "@/lib/services/document";
import type { UserRole } from "@prisma/client";

const MAX_BYTES = 10 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    const userId = (session.user as { id?: string }).id;
    if (!cabinetId) return null;
    return { cabinetId, role, userId };
  });
}

/**
 * Confirme un paiement importé depuis une preuve : conserve l'image/PDF puis crée
 * le paiement avec la référence Interac (anti-doublon) et la source des fonds.
 *
 * Spec : docs/product/SPEC_IMPORT_PREUVE_PAIEMENT.md (lot L4).
 */
export async function POST(request: Request) {
  const data = await getSessionData();
  if (!data) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canManageInvoices(data.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const clientId = String(form.get("clientId") ?? "");
  const paymentDate = String(form.get("paymentDate") ?? "");
  const amount = Number(form.get("amount"));
  const invoiceId = (form.get("invoiceId") as string) || null;
  const allocatedAmountRaw = form.get("allocatedAmount");
  const referenceNumber = (form.get("referenceNumber") as string) || null;
  const note = (form.get("note") as string) || null;
  const interacReference = (form.get("interacReference") as string) || null;
  const payerName = (form.get("payerName") as string) || null;
  const payerEmail = (form.get("payerEmail") as string) || null;
  const rememberPayer = form.get("rememberPayer") === "true";

  if (!clientId || !paymentDate || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  // Lecture du fichier + empreinte (avant tout, pour l'anti-doublon par contenu).
  let preuveStorageKey: string | null = null;
  let preuveMime: string | null = null;
  let preuveSize = 0;
  let preuveHash: string | null = null;
  let proofBuffer: Buffer | null = null;
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    if (!EXT[file.type]) {
      return NextResponse.json({ error: "Type de preuve non supporté" }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Preuve trop volumineuse (max 10 Mo)" }, { status: 413 });
    }
    proofBuffer = Buffer.from(await file.arrayBuffer());
    preuveHash = hashProofFile(proofBuffer);
    preuveMime = file.type;
    preuveSize = file.size;
  }

  // Anti-doublon (pré-check convivial ; les contraintes uniques font foi in fine) :
  // même fichier (hash) OU même virement Interac (référence).
  const duplicate = await findDuplicateProofPayment(data.cabinetId, {
    hash: preuveHash,
    providerRef: interacReference,
  });
  if (duplicate) {
    return NextResponse.json(
      {
        error:
          duplicate.matchedBy === "hash"
            ? "Cette preuve a déjà été importée (fichier identique)."
            : "Ce virement a déjà été enregistré (doublon détecté).",
        duplicate,
      },
      { status: 409 },
    );
  }

  // Conservation de la preuve (best effort : un échec de stockage ne bloque pas
  // l'enregistrement du paiement, qui est le fait comptable important).
  if (proofBuffer && preuveMime) {
    const key = `payment-proofs/${data.cabinetId}/${new Date().getFullYear()}/${randomUUID()}.${EXT[preuveMime]}`;
    try {
      await writeDocumentObject(key, proofBuffer, preuveMime);
      preuveStorageKey = key;
    } catch (err) {
      console.error("Conservation de la preuve échouée (paiement enregistré quand même):", err);
    }
  }

  try {
    const { paymentId, warnings } = await createPayment({
      cabinetId: data.cabinetId,
      clientId,
      paymentDate: new Date(paymentDate),
      amount,
      paymentMethod: "e_transfer",
      referenceNumber,
      note,
      receivedById: data.userId ?? undefined,
      invoiceId: invoiceId ?? undefined,
      allocatedAmount:
        allocatedAmountRaw != null && allocatedAmountRaw !== ""
          ? Number(allocatedAmountRaw)
          : undefined,
      provider: "interac",
      providerRef: interacReference,
      payerName,
      payerEmail,
      preuveStorageKey,
      preuveExtractedAt: new Date(),
      preuveHash,
    });

    // Conservation dans le dossier du client : la preuve devient un Document rattaché
    // au client (et au dossier de la facture, le cas échéant). Elle apparaît ainsi dans
    // le dossier du client, avec la rétention Barreau du module documents.
    let proofFiled = false;
    if (preuveStorageKey && preuveMime && data.userId) {
      try {
        let dossierId: string | null = null;
        if (invoiceId) {
          const inv = await prisma.invoice.findFirst({
            where: { id: invoiceId, cabinetId: data.cabinetId },
            select: { dossierId: true },
          });
          dossierId = inv?.dossierId ?? null;
        }
        await createDocumentRecord({
          cabinetId: data.cabinetId,
          userId: data.userId,
          clientId,
          dossierId,
          nom: `Preuve de paiement Interac${interacReference ? ` — ${interacReference}` : ""} (${paymentDate})`,
          mimeType: preuveMime,
          sizeBytes: preuveSize,
          storageKey: preuveStorageKey,
          documentType: "preuve_paiement",
          aiAssisted: true,
        });
        proofFiled = true;
      } catch (err) {
        console.error("Classement de la preuve dans le dossier client échoué (paiement enregistré):", err);
      }
    }

    // Apprentissage dans le flux : mémoriser ce payeur tiers → ce client, pour
    // que le prochain virement du même payeur soit reconnu automatiquement.
    let ruleLearned = false;
    if (rememberPayer && (payerEmail || payerName)) {
      try {
        await createPayerRule({
          cabinetId: data.cabinetId,
          payerEmail,
          payerName,
          clientId,
          scope: "CLIENT_UNIQUE",
          source: "appris",
          createdById: data.userId ?? undefined,
        });
        ruleLearned = true;
      } catch (err) {
        console.error("Création de la règle de payeur échouée (paiement enregistré):", err);
      }
    }

    return NextResponse.json({ paymentId, warnings, proofStored: Boolean(preuveStorageKey), proofFiled, ruleLearned });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de la création du paiement";
    // Doublon rattrapé par la contrainte unique en cas de course.
    const status = message.includes("doublon") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
