import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageInvoices } from "@/lib/auth/permissions";
import { extractPaymentProof } from "@/lib/ai/extract-payment-proof";
import { matchPaymentProof } from "@/lib/services/finance/match-payment";
import { loadPaymentMatchCandidates } from "@/lib/services/finance/payment-match-candidates";
import { hashProofFile, findDuplicateProofPayment } from "@/lib/services/finance/proof-dedup";
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
 * Extrait une preuve de paiement (image/PDF) et la rapproche d'un client/facture.
 * NE PERSISTE RIEN : renvoie seulement l'extraction + la suggestion de rapprochement.
 * L'écriture se fait ensuite via POST /api/facturation/paiements après confirmation humaine.
 *
 * Spec : docs/product/SPEC_IMPORT_PREUVE_PAIEMENT.md (lot L3).
 */
export async function POST(request: Request) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!canManageInvoices(data.role)) {
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

  const extraction = await extractPaymentProof({ buffer, mimeType: file.type });
  if (!extraction) {
    return NextResponse.json(
      { error: "Extraction impossible (preuve illisible ou service IA indisponible)" },
      { status: 422 },
    );
  }

  // Anti-doublon dès l'upload : même fichier (hash) ou même virement (référence Interac).
  const duplicate = await findDuplicateProofPayment(data.cabinetId, {
    hash,
    providerRef: extraction.referenceInterac,
  });
  if (duplicate) {
    return NextResponse.json({ alreadyImported: true, duplicate, extraction });
  }

  const candidates = await loadPaymentMatchCandidates(data.cabinetId);
  const match = matchPaymentProof(extraction, candidates);

  return NextResponse.json({ extraction, match, hash });
}
