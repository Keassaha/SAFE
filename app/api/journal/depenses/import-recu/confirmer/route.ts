import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageExpenseJournal } from "@/lib/auth/permissions";
import { hashProofFile, findDuplicateExpense } from "@/lib/services/finance/proof-dedup";
import { writeDocumentObject, createDocumentRecord } from "@/lib/services/document";
import { writeJournalForCabinetExpense } from "@/lib/services/journal/cabinet-expense-journal";
import { learnCategorizationRule } from "@/lib/expense-journal/categorization-rules";
import { ExpenseJournalValidationStatus } from "@prisma/client";
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

function numOrNull(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Confirme une dépense importée depuis un reçu : conserve le reçu, crée la
 * CabinetExpense (+ écriture journal append-only), classe le reçu en Document,
 * et apprend la règle de catégorisation si demandé.
 *
 * Spec : docs/product/SPEC_IMPORT_RECU_DEPENSE.md (lot R4).
 */
export async function POST(request: Request) {
  const data = await getSessionData();
  if (!data) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canManageExpenseJournal(data.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  if (!data.userId) {
    return NextResponse.json({ error: "Session incomplète" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const fournisseur = String(form.get("fournisseur") ?? "").trim();
  const normalizedSupplier = String(form.get("normalizedSupplier") ?? "").trim() || fournisseur;
  const dateStr = String(form.get("date") ?? "");
  const montantTtc = numOrNull(form.get("montantTtc"));
  const tps = numOrNull(form.get("tps"));
  const tvq = numOrNull(form.get("tvq"));
  const montantHt = numOrNull(form.get("montantHt"));
  const categoryName = String(form.get("categoryName") ?? "").trim() || "Autres";
  const categoryIdRaw = (form.get("categoryId") as string) || null;
  const dossierId = (form.get("dossierId") as string) || null;
  const refacturable = form.get("refacturable") === "true";
  const numeroRecu = (form.get("numeroRecu") as string) || null;
  const rememberRule = form.get("rememberRule") === "true";

  if (!fournisseur || !dateStr || montantTtc == null || montantTtc <= 0) {
    return NextResponse.json({ error: "Données invalides (fournisseur, date, montant requis)" }, { status: 400 });
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  // Lecture du reçu + empreinte (pour l'anti-doublon par contenu).
  let pieceStorageKey: string | null = null;
  let pieceMime: string | null = null;
  let pieceSize = 0;
  let pieceHash: string | null = null;
  let receiptBuffer: Buffer | null = null;
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    if (!EXT[file.type]) {
      return NextResponse.json({ error: "Type de reçu non supporté" }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Reçu trop volumineux (max 10 Mo)" }, { status: 413 });
    }
    receiptBuffer = Buffer.from(await file.arrayBuffer());
    pieceHash = hashProofFile(receiptBuffer);
    pieceMime = file.type;
    pieceSize = file.size;
  }

  // Anti-doublon (pré-check convivial ; la contrainte unique @@unique([cabinetId, pieceHash]) fait foi).
  const duplicate = await findDuplicateExpense(data.cabinetId, { hash: pieceHash });
  if (duplicate) {
    return NextResponse.json(
      { error: "Ce reçu a déjà été importé (fichier identique).", duplicate },
      { status: 409 },
    );
  }

  // Conservation du reçu (best effort : un échec de stockage ne bloque pas le fait comptable).
  if (receiptBuffer && pieceMime) {
    const key = `expense-receipts/${data.cabinetId}/${date.getFullYear()}/${randomUUID()}.${EXT[pieceMime]}`;
    try {
      await writeDocumentObject(key, receiptBuffer, pieceMime);
      pieceStorageKey = key;
    } catch (err) {
      console.error("Conservation du reçu échouée (dépense enregistrée quand même):", err);
    }
  }

  // Résolution de la catégorie par nom si l'id n'est pas fourni.
  let categoryId = categoryIdRaw;
  if (!categoryId) {
    const cat = await prisma.expenseCategory.findFirst({
      where: { cabinetId: data.cabinetId, name: categoryName },
      select: { id: true },
    });
    categoryId = cat?.id ?? null;
  }

  try {
    // Atomicité : CabinetExpense + écriture journal append-only ensemble (doctrine §4).
    const expense = await prisma.$transaction(async (txClient) => {
      const created = await txClient.cabinetExpense.create({
        data: {
          cabinetId: data.cabinetId,
          date,
          descriptionBancaire: fournisseur,
          fournisseurNormalise: normalizedSupplier,
          categoryId: categoryId ?? undefined,
          categoryName,
          montant: montantTtc,
          montantHt: montantHt ?? undefined,
          tps: tps ?? undefined,
          tvq: tvq ?? undefined,
          montantTtc,
          dossierId: dossierId ?? undefined,
          refacturable,
          statutValidation: ExpenseJournalValidationStatus.VALIDE,
          pieceStorageKey: pieceStorageKey ?? undefined,
          pieceHash: pieceHash ?? undefined,
          createdById: data.userId ?? undefined,
        },
      });
      await writeJournalForCabinetExpense(created, { client: txClient, utilisateurId: data.userId! });
      return created;
    });

    // Classement du reçu en Document (au dossier si refacturable, sinon au cabinet).
    let receiptFiled = false;
    if (pieceStorageKey && pieceMime) {
      try {
        let clientId: string | null = null;
        if (dossierId) {
          const dossier = await prisma.dossier.findFirst({
            where: { id: dossierId, cabinetId: data.cabinetId },
            select: { clientId: true },
          });
          clientId = dossier?.clientId ?? null;
        }
        await createDocumentRecord({
          cabinetId: data.cabinetId,
          userId: data.userId,
          clientId,
          dossierId,
          nom: `Reçu — ${fournisseur}${numeroRecu ? ` (${numeroRecu})` : ""} — ${dateStr}`,
          mimeType: pieceMime,
          sizeBytes: pieceSize,
          storageKey: pieceStorageKey,
          hash: pieceHash,
          documentType: "recu_depense",
          aiAssisted: true,
        });
        receiptFiled = true;
      } catch (err) {
        console.error("Classement du reçu échoué (dépense enregistrée):", err);
      }
    }

    // Apprentissage : mémoriser « ce fournisseur → cette catégorie ».
    let ruleLearned = false;
    if (rememberRule && fournisseur) {
      try {
        await learnCategorizationRule(prisma, data.cabinetId, {
          pattern: fournisseur,
          fournisseurNormalise: normalizedSupplier,
          categoryName,
          categoryId,
          refacturable,
          dossierId,
        });
        ruleLearned = true;
      } catch (err) {
        console.error("Apprentissage de la règle échoué (dépense enregistrée):", err);
      }
    }

    return NextResponse.json({
      expenseId: expense.id,
      receiptStored: Boolean(pieceStorageKey),
      receiptFiled,
      ruleLearned,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de la création de la dépense";
    const status = message.includes("Unique") || message.toLowerCase().includes("doublon") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
