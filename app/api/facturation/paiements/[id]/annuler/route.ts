import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { canManageInvoices } from "@/lib/auth/permissions";
import { annulerPaiement } from "@/lib/services/billing/payment-reversal";
import type { UserRole } from "@prisma/client";

/**
 * Annulation d'un encaissement (doctrine §1.1).
 *
 * POST, jamais DELETE : rien n'est supprimé. Le paiement reste en base, marqué
 * REVERSED avec son motif, et sa contrepassation est ajoutée au journal. Le verbe
 * HTTP dit la vérité sur ce qui se passe.
 */

const bodySchema = z.object({
  motifCode: z.enum([
    "ERREUR_SAISIE",
    "MAUVAIS_TYPE",
    "DOUBLON",
    "MONTANT_ERRONE",
    "TRANSACTION_ANNULEE",
    "MAUVAIS_DOSSIER",
    "AUTRE",
  ]),
  motifTexte: z.string().trim().max(500).optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const role = (session.user as { role?: string }).role as UserRole;
  const userId = (session.user as { id?: string }).id;
  if (!cabinetId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Motif d'annulation manquant ou invalide" },
      { status: 400 },
    );
  }

  try {
    const result = await annulerPaiement({
      paymentId: id,
      cabinetId,
      motifCode: parsed.data.motifCode,
      motifTexte: parsed.data.motifTexte ?? null,
      performedById: userId ?? null,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de l'annulation du paiement";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
