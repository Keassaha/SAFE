import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import {
  parseCabinetConfig,
  getEnvoiFactureClientConfig,
} from "@/lib/cabinet-config";
import { issueInvoice } from "@/lib/services/billing";
import type { UserRole } from "@prisma/client";
import { randomBytes } from "crypto";
import { Resend } from "resend";

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const userId = (session.user as { id?: string }).id;
    const role = (session.user as { role?: string }).role as UserRole;
    if (!cabinetId || !userId) return null;
    return { cabinetId, userId, role };
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
 * POST: envoie la facture par email au client (lien unique dans le corps du mail).
 * Si la facture est encore brouillon mais prête à être émise (READY_TO_ISSUE),
 * elle est d'abord marquée comme envoyée puis l'email part.
 * Nécessite RESEND_API_KEY (et optionnellement RESEND_FROM).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, userId, role } = data;
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "L'envoi par email n'est pas configuré (RESEND_API_KEY manquant)." },
      { status: 503 }
    );
  }

  const resend = new Resend(apiKey);
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, cabinetId },
    include: {
      client: {
        select: {
          raisonSociale: true,
          email: true,
          emailSecondaire: true,
          billingEmail: true,
        },
      },
      cabinet: { select: { config: true, nom: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }
  if (invoice.cancelledAt) {
    return NextResponse.json(
      { error: "Impossible d'envoyer une facture annulée." },
      { status: 400 }
    );
  }

  const isDraft = invoice.statut === "brouillon";
  const readyToIssue =
    invoice.invoiceStatus === "DRAFT" || invoice.invoiceStatus === "READY_TO_ISSUE";

  if (isDraft && readyToIssue) {
    try {
      await issueInvoice({
        invoiceId: id,
        approvedById: userId,
        cabinetId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'émission";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } else if (isDraft) {
    return NextResponse.json(
      {
        error:
          "Approuvez d'abord la facture (Vérification), puis marquez-la comme envoyée avant d'envoyer au client.",
      },
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
          "L'envoi de facture au client est désactivé. Activez-le dans Paramètres.",
      },
      { status: 400 }
    );
  }

  const client = invoice.client;
  const toEmail =
    client?.billingEmail ?? client?.email ?? client?.emailSecondaire ?? null;
  if (!toEmail || !toEmail.trim()) {
    return NextResponse.json(
      {
        error:
          "Aucune adresse email pour ce client. Ajoutez un email (ou email de facturation) sur la fiche client.",
      },
      { status: 400 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + (envoiConfig.lienExpirationJours ?? 30));

  let invoiceUpdated = await prisma.invoice.findFirst({
    where: { id, cabinetId },
    select: { shareToken: true, shareTokenExpiresAt: true },
  });
  let token = invoiceUpdated?.shareToken ?? null;
  let expiry = invoiceUpdated?.shareTokenExpiresAt ?? null;

  if (!token || !expiry || expiry <= now) {
    token = randomBytes(32).toString("hex");
    await prisma.invoice.update({
      where: { id },
      data: {
        shareToken: token,
        shareTokenExpiresAt: expiresAt,
      },
    });
    expiry = expiresAt;
  }

  const baseUrl = getBaseUrl(request);
  const invoiceUrl = `${baseUrl}/facture/${token}`;
  const fromEmail = process.env.RESEND_FROM ?? "factures@onboarding.resend.dev";
  const cabinetName = invoice.cabinet?.nom ?? "Cabinet";

  const subject = `Votre facture ${invoice.numero} — ${cabinetName}`;
  const html = `
    <p>Bonjour,</p>
    <p>Veuillez trouver ci-dessous le lien pour consulter votre facture <strong>${invoice.numero}</strong>.</p>
    <p><a href="${invoiceUrl}" style="color: #0d9488; text-decoration: underline;">Voir la facture</a></p>
    <p>Ce lien est valide jusqu'au ${expiry.toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}.</p>
    <p>Cordialement,<br/>${cabinetName}</p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail.trim()],
      subject,
      html,
    });
    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Échec d'envoi de l'email." },
        { status: 502 }
      );
    }
    return NextResponse.json({
      success: true,
      sentTo: toEmail.trim(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec d'envoi de l'email.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
