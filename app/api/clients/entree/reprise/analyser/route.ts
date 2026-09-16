import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canCreateClients } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { extractPastInvoice } from "@/lib/ai/extract-past-invoice";
import { hashProofFile } from "@/lib/services/finance/proof-dedup";
import { matchFacturePassee } from "@/lib/services/reprise-historique/matcher";
import { loadClientsCandidatsReprise } from "@/lib/services/reprise-historique/candidats";
import type { UserRole } from "@prisma/client";

const MAX_BYTES = 15 * 1024 * 1024; // 15 Mo
const ACCEPTED = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"]);

/** Même documentType que le Document conservé à la confirmation : anti-doublon cohérent. */
export const FACTURE_PASSEE_DOCUMENT_TYPE = "facture_passee_source";

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
 * Analyse une facture passée (image/PDF) : hash anti-doublon → extraction vision →
 * rapprochement client/dossier. NE PERSISTE RIEN — c'est `verser/route.ts`, après
 * confirmation humaine du statut de paiement, qui écrit.
 *
 * Priorité 2 du chantier « un cabinet arrive avec sa clientèle ». Patron calqué sur
 * `app/api/facturation/paiements/import-preuve/route.ts`.
 */
export async function POST(request: Request) {
  const data = await getSessionData();
  if (!data) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canCreateClients(data.role)) {
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
    return NextResponse.json({ error: "Fichier trop volumineux (max 15 Mo)" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = hashProofFile(buffer);

  // Anti-doublon AVANT l'appel IA (patron analyzeStatementPdf).
  const dejaImporte = await prisma.document.findFirst({
    where: { cabinetId: data.cabinetId, documentType: FACTURE_PASSEE_DOCUMENT_TYPE, hash },
    select: { createdAt: true, id: true },
  });
  if (dejaImporte) {
    return NextResponse.json(
      {
        alreadyImported: true,
        duplicate: { importeLe: dejaImporte.createdAt.toISOString().slice(0, 10) },
      },
      { status: 200 },
    );
  }

  const extraction = await extractPastInvoice({ buffer, mimeType: file.type });
  if (!extraction) {
    return NextResponse.json(
      { error: "Extraction impossible (fichier illisible ou service indisponible)." },
      { status: 422 },
    );
  }

  const clients = await loadClientsCandidatsReprise(data.cabinetId);
  const match = matchFacturePassee(extraction, clients);

  return NextResponse.json({
    fichierNom: file.name,
    hash,
    mimeType: file.type,
    extraction,
    match,
  });
}
