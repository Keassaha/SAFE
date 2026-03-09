import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
