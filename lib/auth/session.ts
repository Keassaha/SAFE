import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Pour les API routes : retourne la session + cabinetId ou une NextResponse 401/403 à retourner. */
export async function getSessionOrRespond(): Promise<
  | { session: Session; cabinetId: string }
  | NextResponse
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  if (!cabinetId) {
    return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });
  }
  return { session, cabinetId };
}

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Non authentifié");
  }
  return session;
}

export async function requireCabinetId(): Promise<string> {
  const session = await requireSession();
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  if (!cabinetId) throw new Error("Cabinet non trouvé");
  return cabinetId;
}

export async function requireUserId(): Promise<string> {
  const session = await requireSession();
  const id = (session.user as { id?: string }).id;
  if (!id) throw new Error("Utilisateur non trouvé");
  return id;
}

/** Retourne cabinetId et userId pour les vérifications de permission (ex. champs sensibles, avocat responsable). */
export async function requireCabinetAndUser(): Promise<{ cabinetId: string; userId: string; role: string }> {
  const session = await requireSession();
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const userId = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role ?? "avocat";
  if (!cabinetId || !userId) throw new Error("Session incomplète");
  return { cabinetId, userId, role };
}
