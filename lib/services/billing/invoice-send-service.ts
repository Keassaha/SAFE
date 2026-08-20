/**
 * SAFE — Envoi officiel d'une facture par courriel.
 *
 * Extrait de `app/api/facturation/factures/[id]/envoyer-email/route.ts`, dont il
 * reprend le pipeline à l'identique. La route commençait par `getServerSession`,
 * ce qui rendait l'envoi inatteignable pour une tâche planifiée : un cron n'a pas
 * de session. Le pipeline vit donc ici, et la route n'est plus qu'une garde
 * d'accès plus une traduction en codes HTTP.
 *
 * Pipeline canonique, inchangé :
 *   1. presenter(invoice)            → modèle de présentation unique
 *   2. generateInvoicePdf(presented) → PDF officiel (best-effort)
 *   3. invoiceAccompanyingEmailHtml  → lettre d'accompagnement courte
 *   4. sendEmail(...)                → envoi réel
 *   5. deliveredAt + EMAIL_SAFE      → uniquement si l'envoi a réussi (CH-13)
 *   6. InvoiceSendLog                → trace, succès comme échec
 *   7. issueInvoice                  → escalade de statut si encore brouillon
 *
 * Garantie conservée : un échec d'envoi ne transmet rien. La facture reste non
 * transmise, donc aucun retrait de fidéicommis ne peut s'y adosser (art. 56(2)
 * B-1 r.5 / s. 9(1)3 By-Law 9).
 */

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

/**
 * Issue de l'envoi. Union discriminée plutôt qu'un booléen : la route doit
 * distinguer cinq cas qui n'ont ni le même code HTTP ni la même conduite à
 * tenir, et le cron doit pouvoir les journaliser séparément.
 */
export type ResultatEnvoiFacture =
  | { statut: "facture_introuvable" }
  | { statut: "client_sans_courriel" }
  /** L'envoi a échoué. Rien n'est transmis, la trace porte l'erreur. */
  | { statut: "envoi_echoue"; message: string }
  /** Envoyé, mais la facture est restée en brouillon : statut à vérifier. */
  | { statut: "envoye_statut_non_escalade"; pdfJoint: boolean }
  | { statut: "envoye"; pdfJoint: boolean; pdfError: string | null };

export interface EnvoiFactureParams {
  invoiceId: string;
  /** Cabinet propriétaire. Borne la lecture : jamais la facture d'un autre. */
  cabinetId: string;
  /**
   * Auteur de l'envoi. `null` quand l'envoi vient d'une tâche planifiée : la
   * trace dira alors « envoyé sans utilisateur », ce qui est la vérité.
   */
  sentById?: string | null;
  /** RichDocuments du dossier à joindre. Best-effort, n'empêchent jamais l'envoi. */
  attachRichDocumentIds?: string[];
  subject?: string;
  message?: string;
  paymentInstructions?: string;
}

export async function sendInvoiceByEmail(
  params: EnvoiFactureParams,
): Promise<ResultatEnvoiFacture> {
  const {
    invoiceId,
    cabinetId,
    sentById = null,
    attachRichDocumentIds = [],
    subject: customSubject,
    message: customMessage,
    paymentInstructions,
  } = params;

  // 1. Charger la facture complète pour le presenter.
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, cabinetId },
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

  if (!invoice) return { statut: "facture_introuvable" };

  const recipientEmail = invoice.client?.email?.trim();
  if (!recipientEmail) return { statut: "client_sans_courriel" };

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

  // 2. Tenter de générer le PDF officiel (best-effort).
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

  // CH-13 — l'envoi RÉEL est le seul canal dont SAFE détient la preuve. C'est ici,
  // et nulle part ailleurs, que `deliveredAt` prend le canal EMAIL_SAFE.
  // Un échec d'envoi ne transmet rien : la facture reste non transmise.
  if (!sendError) {
    const deliveredNow = new Date();
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        sentAt: deliveredNow,
        deliveredAt: deliveredNow,
        deliveryChannel: "EMAIL_SAFE",
        deliveryDeclaredById: sentById,
      },
    });
  }

  await prisma.invoiceSendLog.create({
    data: {
      invoiceId: invoice.id,
      cabinetId: invoice.cabinetId,
      clientId: invoice.clientId,
      dossierId: invoice.dossierId ?? null,
      sentById,
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

  if (sendError) return { statut: "envoi_echoue", message: sendError };

  // 5. Escalader le statut si la facture est encore en brouillon.
  if (invoice.invoiceStatus === "DRAFT" || invoice.invoiceStatus === "READY_TO_ISSUE") {
    try {
      const { issueInvoice } = await import("@/lib/services/billing");
      await issueInvoice({
        invoiceId: invoice.id,
        approvedById: sentById,
        cabinetId: invoice.cabinetId,
      });
    } catch (err) {
      // Le courriel est déjà parti et tracé. On ne présente pas ça comme un échec :
      // l'envoi a réussi, seule l'escalade de statut est à vérifier.
      console.error("[invoice-send] issueInvoice after email send failed:", err);
      return { statut: "envoye_statut_non_escalade", pdfJoint: hasAttachment };
    }
  }

  return { statut: "envoye", pdfJoint: hasAttachment, pdfError };
}
