import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageInvoices } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { sendEmail, invoiceAccompanyingEmailHtml } from "@/lib/email";
import {
  presentInvoice,
  presentClientDisplayName,
} from "@/lib/services/billing/invoice-presenter";
import {
  generateInvoicePdf,
  invoicePdfFilename,
} from "@/lib/services/billing/invoice-pdf";
import type { UserRole } from "@prisma/client";

/**
 * Envoi officiel d'une facture par courriel (phase 1 de la refonte).
 *
 * Pipeline canonique :
 *   1. presenter(invoice) → modèle de présentation unique.
 *   2. generateInvoicePdf(presented) → Buffer PDF officiel.
 *   3. invoiceAccompanyingEmailHtml(...) → lettre d'accompagnement courte
 *      (PAS le contenu de la facture en HTML).
 *   4. sendEmail({ to, subject, html, attachments: [pdf] }).
 *   5. prisma.invoiceSendLog.create(...) → trace consultable dans la fiche client.
 *   6. Si l'email a réussi ET la facture est encore DRAFT/READY_TO_ISSUE,
 *      on l'escalade à ISSUED via `issueInvoice` pour aligner le statut.
 *
 * Garanties phase 1 :
 *   - Le courriel ne ment plus : si la pièce jointe ne peut pas être générée,
 *     le texte indique clairement la situation (lien sécurisé ou message).
 *   - Échec d'envoi → InvoiceSendLog.status = "failed" + facture NON marquée
 *     comme envoyée. L'utilisateur peut relancer.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role as UserRole;
  if (!role || !canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await context.params;
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const userId = (session.user as { id?: string }).id ?? null;
  if (!cabinetId) {
    return NextResponse.json({ error: "Cabinet manquant" }, { status: 401 });
  }

  // 1. Charger la facture complète pour le presenter.
  const invoice = await prisma.invoice.findFirst({
    where: { id, cabinetId },
    include: {
      cabinet: {
        select: { id: true, nom: true, adresse: true, telephone: true, email: true, barreauNumero: true },
      },
      client: {
        select: {
          id: true,
          raisonSociale: true,
          prenom: true,
          nom: true,
          typeClient: true,
          email: true,
          billingAddress: true,
          billingCity: true,
          billingProvince: true,
          billingPostalCode: true,
          billingCountry: true,
        },
      },
      dossier: { select: { id: true, intitule: true, numeroDossier: true, modeFacturation: true } },
      invoiceLines: {
        orderBy: { sortOrder: "asc" },
        include: { timeEntry: { include: { user: { select: { nom: true } } } } },
      },
      invoiceItems: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { nom: true } } },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });
  }

  const recipientEmail = invoice.client?.email?.trim();
  if (!recipientEmail) {
    return NextResponse.json(
      { error: "Le client n'a pas d'adresse courriel" },
      { status: 400 }
    );
  }

  const presented = presentInvoice(invoice);
  const clientName = presentClientDisplayName(presented.client);
  const cabinetName = presented.cabinet?.nom ?? "Cabinet";
  const dueDate = presented.dateEcheance
    ? new Date(presented.dateEcheance).toLocaleDateString("fr-CA")
    : undefined;
  const shareUrl = invoice.shareToken
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/facture/${invoice.shareToken}`
    : undefined;

  // 2. Tenter de générer le PDF officiel (best-effort en phase 1).
  let pdfBuffer: Buffer | null = null;
  let pdfError: string | null = null;
  try {
    pdfBuffer = await generateInvoicePdf(presented);
  } catch (err) {
    pdfError = err instanceof Error ? err.message : "Erreur génération PDF";
    console.error("[invoice-send] PDF generation failed:", err);
  }

  const hasAttachment = pdfBuffer != null && pdfBuffer.length > 0;

  // 3. Construire la lettre d'accompagnement honnête (le texte reflète la réalité).
  const { subject, html } = invoiceAccompanyingEmailHtml({
    clientName,
    invoiceNumber: presented.numero,
    cabinetName,
    dueDate,
    shareUrl: hasAttachment ? undefined : shareUrl,
    hasAttachment,
  });

  const attachments = hasAttachment
    ? [{ filename: invoicePdfFilename(presented), content: pdfBuffer as Buffer }]
    : undefined;

  // 4. Envoyer + tracer (succès ou échec).
  let sendError: string | null = null;
  try {
    await sendEmail({
      to: recipientEmail,
      subject,
      html,
      cabinetNom: cabinetName,
      attachments,
    });
  } catch (err) {
    sendError = err instanceof Error ? err.message : "Erreur envoi courriel";
    console.error("[invoice-send] Email send failed:", err);
  }

  await prisma.invoiceSendLog.create({
    data: {
      invoiceId: invoice.id,
      cabinetId: invoice.cabinetId,
      clientId: invoice.clientId,
      dossierId: invoice.dossierId ?? null,
      sentById: userId,
      recipientEmail,
      subject,
      body: html,
      status: sendError ? "failed" : "sent",
      errorMessage: sendError ?? pdfError ?? null,
      attachmentName: hasAttachment ? invoicePdfFilename(presented) : null,
      attachmentSize: hasAttachment ? pdfBuffer!.length : null,
      sentAt: sendError ? null : new Date(),
    },
  });

  if (sendError) {
    return NextResponse.json(
      { error: `Envoi échoué : ${sendError}`, pdfWasAttached: false },
      { status: 502 }
    );
  }

  // 5. Escalader le statut si la facture est encore en brouillon.
  //    (Lock anti-modification silencieuse — cf. canModifyInvoice.)
  if (invoice.invoiceStatus === "DRAFT" || invoice.invoiceStatus === "READY_TO_ISSUE") {
    try {
      const { issueInvoice } = await import("@/lib/services/billing");
      await issueInvoice({
        invoiceId: invoice.id,
        approvedById: userId,
        cabinetId: invoice.cabinetId,
      });
    } catch (err) {
      // L'email est déjà parti et tracé. On ne rejette pas la requête : on logue et
      // on retourne 207 partial pour signaler que l'escalade de statut a échoué.
      console.error("[invoice-send] issueInvoice after email send failed:", err);
      return NextResponse.json(
        {
          success: true,
          pdfWasAttached: hasAttachment,
          warning: "Email envoyé mais escalade de statut échouée. Vérifier le statut.",
        },
        { status: 207 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    pdfWasAttached: hasAttachment,
    pdfError: pdfError ?? undefined,
    message: "Facture envoyée par email",
  });
}
