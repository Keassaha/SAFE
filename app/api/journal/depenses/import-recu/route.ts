import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageExpenseJournal } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { extractExpenseReceipt } from "@/lib/ai/extract-expense-receipt";
import { normalizeSupplier } from "@/lib/expense-journal/normalize-supplier";
import { suggestCategoryFromRules } from "@/lib/expense-journal/categorization-rules";
import { hashProofFile, findDuplicateExpense } from "@/lib/services/finance/proof-dedup";
import type { UserRole } from "@prisma/client";

const MAX_BYTES = 10 * 1024 * 1024; // 10 Mo
const ACCEPTED = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    if (!cabinetId) return null;
    return { cabinetId, role };
  });
}

/**
 * Extrait un reçu de dépense (image/PDF), le normalise et suggère une catégorie.
 * NE PERSISTE RIEN : renvoie l'extraction + la suggestion + le hash (anti-doublon).
 * La création de la dépense se fait ensuite après confirmation humaine (R4).
 *
 * Spec : docs/product/SPEC_IMPORT_RECU_DEPENSE.md (lot R2).
 */
export async function POST(request: Request) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!canManageExpenseJournal(data.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }
  if (!ACCEPTED.has(file.type)) {
    return NextResponse.json(
      { error: "Type de fichier non supporté (image ou PDF attendu)" },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = hashProofFile(buffer);

  // Anti-doublon dès l'upload : même reçu (hash) déjà enregistré en dépense.
  const duplicate = await findDuplicateExpense(data.cabinetId, { hash });
  if (duplicate) {
    return NextResponse.json({ alreadyImported: true, duplicate });
  }

  const extraction = await extractExpenseReceipt({ buffer, mimeType: file.type });
  if (!extraction) {
    return NextResponse.json(
      { error: "Extraction impossible (reçu illisible ou service IA indisponible)" },
      { status: 422 },
    );
  }

  // Catégorisation : mêmes briques que l'import bancaire (normalisation + règles apprises).
  const rawDescription = extraction.fournisseur ?? "";
  const normalizedSupplier = rawDescription ? normalizeSupplier(rawDescription) : "";
  const suggestion = normalizedSupplier
    ? await suggestCategoryFromRules(prisma, data.cabinetId, rawDescription, normalizedSupplier)
    : null;

  return NextResponse.json({ extraction, suggestion, normalizedSupplier, hash });
}
