import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canCreateClients } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import { chargerFactureReprise } from "@/lib/services/reprise-historique/facture-reprise-detail";
import {
  corrigerFactureReprise,
  CorrigerRepriseError,
} from "@/lib/services/reprise-historique/corriger-reprise";
import type { JournalCorrectionMotive, UserRole } from "@prisma/client";

/**
 * L'espace de correction des exercices précédents.
 *
 * GET  — UNE facture reprise (`?invoiceId=`), son historique et sa pièce.
 * POST — corrige l'une d'elles par contrepassation motivée puis re-jeu.
 */

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    const userId = (session.user as { id?: string }).id;
    if (!cabinetId || !userId) return null;
    return { cabinetId, role, userId };
  });
}

export async function GET(request: Request) {
  const data = await getSessionData();
  if (!data) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canCreateClients(data.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const invoiceId = new URL(request.url).searchParams.get("invoiceId");
  if (!invoiceId) return NextResponse.json({ error: "Facture requise" }, { status: 400 });

  const facture = await chargerFactureReprise(data.cabinetId, invoiceId);
  if (!facture) return NextResponse.json({ error: "Facture reprise introuvable" }, { status: 404 });
  return NextResponse.json({ facture });
}

export async function POST(request: Request) {
  const data = await getSessionData();
  if (!data) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canCreateClients(data.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  let body: {
    invoiceId?: string;
    motifCode?: JournalCorrectionMotive;
    motifTexte?: string | null;
    corrections?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!body.invoiceId || !body.motifCode) {
    return NextResponse.json({ error: "Facture et motif requis" }, { status: 400 });
  }

  try {
    const resultat = await corrigerFactureReprise({
      cabinetId: data.cabinetId,
      userId: data.userId,
      invoiceId: body.invoiceId,
      motifCode: body.motifCode,
      motifTexte: body.motifTexte ?? null,
      corrections: (body.corrections ?? {}) as never,
    });

    revalidatePath("/comptabilite");
    revalidatePath("/journal/general");
    revalidatePath("/facturation");
    revalidatePath(`/facturation/factures/${body.invoiceId}`);

    return NextResponse.json(resultat);
  } catch (err) {
    if (err instanceof CorrigerRepriseError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Correction d'exercice précédent échouée:", err);
    return NextResponse.json({ error: "La correction n'a pas pu être enregistrée." }, { status: 500 });
  }
}
