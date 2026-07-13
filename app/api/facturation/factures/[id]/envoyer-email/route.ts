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
import { getCabinetTaxConfigById } from "@/lib/billing/cabinet-tax-config";
import { renderRichDocumentsToPdf } from "@/lib/services/client-send/send-to-client";
import {
  parseCabinetConfig,
  getEmailFactureConfig,
  applyInvoiceEmailVariables,
} from "@/lib/cabinet-config";
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
/** Nom d'affichage du client à partir des champs bruts. */
function clientDisplayName(client: {
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
} | null): string {
  if (!client) return "Madame, Monsieur";
  if (client.raisonSociale?.trim()) return client.raisonSociale.trim();
  const full = [client.prenom, client.nom].filter(Boolean).join(" ").trim();
  return full || "Madame, Monsieur";
}

/** Message d'accompagnement par défaut (texte brut, éditable par l'utilisateur). */
function defaultMessage(opts: {
  clientName: string;
  invoiceNumber: string;
  dueDate?: string;
  cabinetName: string;
}): string {
  const lines = [
    `Bonjour ${opts.clientName},`,
    "",
    `Veuillez trouver en pièce jointe notre facture n° ${opts.invoiceNumber}.`,
  ];
  if (opts.dueDate) lines.push(`Échéance : ${opts.dueDate}.`);
  lines.push(
    "",
    "N'hésitez pas à communiquer avec nous pour toute question.",
    "",
    "Cordialement,",
    opts.cabinetName,
  );
  return lines.join("\n");
}

/** Instructions de paiement par défaut (préqualifiées, à ajuster). */
function defaultPaymentInstructions(opts: {
  invoiceNumber: string;
  cabinetName: string;
  cabinetEmail?: string | null;
}): string {
  const interac = opts.cabinetEmail?.trim()
    ? `• Virement Interac à : ${opts.cabinetEmail.trim()}`
    : "• Virement Interac à : [votre courriel]";
  return [
    "Modes de paiement acceptés :",
    interac,
    `• Chèque à l'ordre de ${opts.cabinetName}`,
    "",
    `Merci d'indiquer le numéro de facture ${opts.invoiceNumber} en référence pour un traitement rapide et sans erreur.`,
  ].join("\n");
}

/** GET — RichDocuments joignables + valeurs par défaut du message d'envoi. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const role = (session.user as { role?: string }).role as UserRole;
  if (!role || !canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  const { id } = await context.params;
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  if (!cabinetId) return NextResponse.json({ error: "Cabinet manquant" }, { status: 401 });

  const invoice = await prisma.invoice.findFirst({
    where: { id, cabinetId },
    select: {
      dossierId: true,
      numero: true,
      dateEcheance: true,
      client: { select: { raisonSociale: true, prenom: true, nom: true } },
      cabinet: { select: { nom: true, email: true, config: true } },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });

  const documents = invoice.dossierId
    ? await prisma.richDocument.findMany({
        where: { cabinetId, dossierId: invoice.dossierId, isArchived: false },
        select: { id: true, titre: true, type: true, statut: true },
        orderBy: { updatedAt: "desc" },
        take: 50,
      })
    : [];

  const clientName = clientDisplayName(invoice.client);
  const cabinetName = invoice.cabinet?.nom ?? "Cabinet";
  const invoiceNumber = invoice.numero ?? "";
  const dueDate = invoice.dateEcheance
    ? new Date(invoice.dateEcheance).toLocaleDateString("fr-CA")
    : undefined;

  // Gabarit sauvegardé au niveau du cabinet (paramètres → envoi de facture).
  // S'il existe, il pré-remplit la modale APRÈS substitution des variables ;
  // sinon on retombe sur les valeurs générées par défaut.
  const savedEmail = getEmailFactureConfig(parseCabinetConfig(invoice.cabinet?.config ?? null));
  const emailVars = { client: clientName, numeroFacture: invoiceNumber, cabinet: cabinetName, echeance: dueDate ?? "" };

  const defaults = {
    subject: savedEmail.objet?.trim()
      ? applyInvoiceEmailVariables(savedEmail.objet, emailVars)
      : `Facture ${invoiceNumber} — ${cabinetName}`,
    message: savedEmail.message?.trim()
      ? applyInvoiceEmailVariables(savedEmail.message, emailVars)
      : defaultMessage({ clientName, invoiceNumber, dueDate, cabinetName }),
    paymentInstructions: savedEmail.instructionsPaiement?.trim()
      ? applyInvoiceEmailVariables(savedEmail.instructionsPaiement, emailVars)
      : defaultPaymentInstructions({
          invoiceNumber,
          cabinetName,
          cabinetEmail: invoice.cabinet?.email,
        }),
  };

  return NextResponse.json({ documents, defaults });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Pièces additionnelles optionnelles : RichDocuments du dossier à joindre
  // (ex. lettre explicative). Best-effort : un body absent/invalide = aucune pièce.
  let attachRichDocumentIds: string[] = [];
  let customSubject: string | undefined;
  let customMessage: string | undefined;
  let paymentInstructions: string | undefined;
  try {
    const body = (await request.json()) as {
      attachRichDocumentIds?: unknown;
      subject?: unknown;
      message?: unknown;
      paymentInstructions?: unknown;
    };
    if (Array.isArray(body?.attachRichDocumentIds)) {
      attachRichDocumentIds = body.attachRichDocumentIds.filter((x): x is string => typeof x === "string");
    }
    if (typeof body?.subject === "string" && body.subject.trim()) customSubject = body.subject.trim();
    if (typeof body?.message === "string" && body.message.trim()) customMessage = body.message;
    if (typeof body?.paymentInstructions === "string" && body.paymentInstructions.trim()) {
      paymentInstructions = body.paymentInstructions;
    }
  } catch {
    attachRichDocumentIds = [];
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

  const taxConfig = await getCabinetTaxConfigById(
    cabinetId,
    prisma,
    invoice.client?.billingProvince ?? null,
  );
  const presented = presentInvoice(invoice, taxConfig);
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
  const built = invoiceAccompanyingEmailHtml({
    clientName,
    invoiceNumber: presented.numero,
    cabinetName,
    dueDate,
    shareUrl: hasAttachment ? undefined : shareUrl,
    hasAttachment,
    customMessage,
    paymentInstructions,
  });
  const subject = customSubject ?? built.subject;
  const html = built.html;

  const attachmentList: { filename: string; content: Buffer }[] = hasAttachment
    ? [{ filename: invoicePdfFilename(presented), content: pdfBuffer as Buffer }]
    : [];

  // Pièces additionnelles (RichDocuments du dossier) — best-effort, n'empêchent
  // jamais l'envoi de la facture.
  if (attachRichDocumentIds.length > 0 && invoice.dossier?.id) {
    try {
      const { attachments: extra } = await renderRichDocumentsToPdf(
        cabinetId,
        invoice.dossier.id,
        attachRichDocumentIds,
      );
      attachmentList.push(...extra);
    } catch (err) {
      console.error("[invoice-send] pièces additionnelles:", err);
    }
  }

  const attachments = attachmentList.length > 0 ? attachmentList : undefined;

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
