import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageInvoices } from "@/lib/auth/permissions";
import { envoyerRelanceFacture } from "@/lib/services/billing/reminder-service";
import { reponseHttpPourRelance } from "@/lib/services/billing/relance-http";
import type { UserRole } from "@prisma/client";

/**
 * Relance manuelle d'une facture en retard, par courriel.
 *
 * Comme pour l'envoi de facture, le pipeline vit dans le service et cette route
 * ne fait que trois choses : vérifier les droits, appeler, traduire en HTTP.
 *
 * MANUELLE seulement (décision CEO du 2026-08-27). Rien ne relance tout seul :
 * un courriel qui part vers le client d'un avocat sans que personne l'ait relu
 * est un autre niveau d'engagement, et il n'a pas été demandé.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.cabinetId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!canManageInvoices(session.user.role as UserRole)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const resultat = await envoyerRelanceFacture({
    invoiceId: id,
    cabinetId: session.user.cabinetId,
  });
  const { status, body } = reponseHttpPourRelance(resultat);
  return NextResponse.json(body, { status });
}
