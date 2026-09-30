import { NextResponse } from "next/server";
import { refusSiRoleInsuffisant } from "@/lib/auth/api-guard";
import { canCreateClients } from "@/lib/auth/permissions";
import { getSessionOrRespond } from "@/lib/auth/session";

/**
 * Même porte que la reprise en lot : il faut pouvoir créer des clients.
 * Rend soit l'identité de l'appelant, soit la réponse de refus toute prête.
 */
export async function accesRepriseUnClient(): Promise<
  { cabinetId: string; userId: string } | NextResponse
> {
  const sessionOuRefus = await getSessionOrRespond();
  if (sessionOuRefus instanceof NextResponse) return sessionOuRefus;
  const utilisateur = sessionOuRefus.session.user as { id?: string; role?: string };
  const refus = refusSiRoleInsuffisant(utilisateur.role, canCreateClients);
  if (refus) return refus;
  if (!utilisateur.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return { cabinetId: sessionOuRefus.cabinetId, userId: utilisateur.id };
}
