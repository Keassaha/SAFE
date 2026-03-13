import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import {
  parseCabinetConfig,
  mergeCabinetConfig,
  type CabinetConfig,
} from "@/lib/cabinet-config";
import type { UserRole } from "@prisma/client";

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    if (!cabinetId) return null;
    return { cabinetId, role };
  });
}

/** GET: retourne la config du cabinet (au moins la partie envoi facture client). */
export async function GET() {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId } = data;

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { config: true },
  });
  const config = parseCabinetConfig(cabinet?.config ?? null);
  return NextResponse.json({
    envoiFactureClient: config.envoiFactureClient ?? {
      activer: true,
      lienExpirationJours: 30,
    },
  });
}

/** PATCH: met à jour la config du cabinet (fusion avec l'existant). */
export async function PATCH(request: Request) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, role } = data;
  if (!canManageCabinetSettings(role)) {
    return NextResponse.json(
      { error: "Droits insuffisants pour modifier la configuration" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const patch = body as Partial<CabinetConfig>;
  if (
    patch.envoiFactureClient &&
    typeof patch.envoiFactureClient !== "object"
  ) {
    return NextResponse.json(
      { error: "envoiFactureClient doit être un objet" },
      { status: 400 }
    );
  }
  const envoi = patch.envoiFactureClient as
    | { activer?: boolean; lienExpirationJours?: number }
    | undefined;
  if (envoi?.lienExpirationJours != null) {
    const n = Number(envoi.lienExpirationJours);
    if (!Number.isInteger(n) || n < 1 || n > 365) {
      return NextResponse.json(
        { error: "Expiration du lien : entre 1 et 365 jours" },
        { status: 400 }
      );
    }
  }

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { config: true },
  });
  const newConfig = mergeCabinetConfig(cabinet?.config ?? null, patch);
  await prisma.cabinet.update({
    where: { id: cabinetId },
    data: { config: newConfig },
  });

  const updated = parseCabinetConfig(newConfig);
  return NextResponse.json({
    envoiFactureClient: updated.envoiFactureClient ?? {
      activer: true,
      lienExpirationJours: 30,
    },
  });
}
