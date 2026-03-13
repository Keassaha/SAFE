import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import {
  parseCabinetConfig,
  getEnvoiFactureClientConfig,
} from "@/lib/cabinet-config";
import type { UserRole } from "@prisma/client";
import { randomBytes } from "crypto";

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    if (!cabinetId) return null;
    return { cabinetId, role };
  });
}

function getBaseUrl(request: Request): string {
  const envUrl = process.env.NEXTAUTH_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  try {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

/**
 * POST: génère ou retourne le lien unique d'envoi au client pour cette facture.
 * Réservé aux factures déjà envoyées (non brouillon, non annulées).
 * Respecte la config cabinet (activer, expiration).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, role } = data;
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, cabinetId },
    select: {
      id: true,
      statut: true,
      cancelledAt: true,
      shareToken: true,
      shareTokenExpiresAt: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }
  if (invoice.statut === "brouillon") {
    return NextResponse.json(
      { error: "Générez le lien après avoir envoyé la facture au client." },
      { status: 400 }
    );
  }
  if (invoice.cancelledAt) {
    return NextResponse.json(
      { error: "Impossible de générer un lien pour une facture annulée." },
      { status: 400 }
    );
  }

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { config: true },
  });
  const config = parseCabinetConfig(cabinet?.config ?? null);
  const envoiConfig = getEnvoiFactureClientConfig(config);
  if (!envoiConfig.activer) {
    return NextResponse.json(
      {
        error:
          "L'envoi de facture au client par lien est désactivé. Activez-le dans Paramètres.",
      },
      { status: 400 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + (envoiConfig.lienExpirationJours ?? 30));

  let token = invoice.shareToken;
  let expiry = invoice.shareTokenExpiresAt;

  const baseUrl = getBaseUrl(request);
  if (token && expiry && expiry > now) {
    return NextResponse.json({
      url: `${baseUrl}/facture/${token}`,
      expiresAt: expiry.toISOString(),
      alreadyGenerated: true,
    });
  }

  token = randomBytes(32).toString("hex");
  await prisma.invoice.update({
    where: { id },
    data: {
      shareToken: token,
      shareTokenExpiresAt: expiresAt,
    },
  });

  return NextResponse.json({
    url: `${baseUrl}/facture/${token}`,
    expiresAt: expiresAt.toISOString(),
    alreadyGenerated: false,
  });
}
