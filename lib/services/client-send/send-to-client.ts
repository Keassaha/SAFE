import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildPdfDocument } from "@/lib/edition/pdf-builder";

/**
 * Envoi de documents au client (E2).
 * Doctrine : docs/product/SPEC_envoi_documents_client.md.
 *
 * Moteur d'envoi PARTAGÉ : rend des RichDocuments en PDF et les transmet au
 * client par courriel (1..N pièces), avec un corps de message éditable. Chaque
 * envoi laisse une trace immuable dans `NotificationLog` (preuve de
 * communication — exigence Barreau). La facture réutilise le même principe.
 */

export interface SendDocumentsInput {
  cabinetId: string;
  dossierId: string;
  clientId?: string | null;
  sentById?: string | null;
  recipientEmail: string;
  subject: string;
  /** Corps en TEXTE (édité par l'utilisateur) — enveloppé en HTML ici. */
  body: string;
  /** RichDocuments à rendre + joindre. Doivent appartenir au même dossier/cabinet. */
  richDocumentIds: string[];
}

export interface SendDocumentsResult {
  sent: boolean;
  logId: string | null;
  attachmentCount: number;
  failures: string[];
}

function escapeHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const FOREST = "#1F3A2E";
const BODY = "#3F3F46";
const BORDER = "#E4E4E7";

/** Enveloppe un corps texte (paragraphes séparés par \n\n) dans un shell HTML SAFE. */
function wrapBodyHtml(body: string, cabinetNom: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;color:${BODY};font-size:14px;line-height:1.5;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;background:#FAFAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">
        <tr><td style="background:${FOREST};padding:16px 24px;color:#FFFFFF;font-size:15px;font-weight:700;">${escapeHtml(cabinetNom)}</td></tr>
        <tr><td style="padding:22px 24px;">${paragraphs}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Rend une liste de RichDocuments (du même dossier/cabinet) en pièces jointes PDF.
 * Réutilisé par l'envoi de documents ET par l'envoi de facture multi-pièces.
 * Les documents introuvables / en échec de rendu sont signalés dans `failures`.
 */
export async function renderRichDocumentsToPdf(
  cabinetId: string,
  dossierId: string,
  richDocumentIds: string[],
): Promise<{ attachments: { filename: string; content: Buffer }[]; failures: string[] }> {
  const failures: string[] = [];
  const attachments: { filename: string; content: Buffer }[] = [];
  if (richDocumentIds.length === 0) return { attachments, failures };

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { nom: true, adresse: true, telephone: true, email: true, barreauNumero: true },
  });
  if (!cabinet) throw new Error("Cabinet introuvable.");

  for (const docId of richDocumentIds) {
    const doc = await prisma.richDocument.findFirst({
      where: { id: docId, cabinetId, dossierId, isArchived: false },
      include: {
        dossier: { select: { intitule: true } },
        client: { select: { raisonSociale: true } },
      },
    });
    if (!doc) {
      failures.push(docId);
      continue;
    }
    try {
      const pdfDoc = buildPdfDocument(
        doc.titre,
        doc.content,
        doc.type,
        cabinet,
        doc.client.raisonSociale ?? "Client",
        doc.dossier.intitule,
        doc.createdAt,
      );
      const buffer = await renderToBuffer(pdfDoc);
      const filename = `${doc.titre.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "document"}.pdf`;
      attachments.push({ filename, content: buffer });
    } catch {
      failures.push(docId);
    }
  }
  return { attachments, failures };
}

/**
 * Rend les RichDocuments demandés en PDF et les envoie au client.
 * Les documents introuvables / hors dossier / en échec de rendu sont signalés
 * dans `failures` sans bloquer l'envoi des autres. Si AUCUNE pièce n'est
 * disponible, aucun courriel n'est envoyé.
 */
export async function sendDocumentsToClient(input: SendDocumentsInput): Promise<SendDocumentsResult> {
  const { cabinetId, dossierId, clientId, sentById, recipientEmail, subject, body, richDocumentIds } = input;

  if (!recipientEmail || !recipientEmail.includes("@")) {
    throw new Error("Adresse courriel du destinataire manquante ou invalide.");
  }
  if (richDocumentIds.length === 0) {
    throw new Error("Aucun document à envoyer.");
  }

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { nom: true },
  });
  if (!cabinet) throw new Error("Cabinet introuvable.");

  const { attachments, failures } = await renderRichDocumentsToPdf(cabinetId, dossierId, richDocumentIds);

  if (attachments.length === 0) {
    throw new Error("Aucune pièce n'a pu être préparée pour l'envoi.");
  }

  const html = wrapBodyHtml(body, cabinet.nom);

  let status = "sent";
  try {
    await sendEmail({ to: recipientEmail, subject, html, cabinetNom: cabinet.nom, attachments });
  } catch {
    status = "failed";
  }

  const log = await prisma.notificationLog.create({
    data: {
      cabinetId,
      dossierId,
      clientId: clientId ?? null,
      type: "document_send",
      channel: "email",
      sentTo: recipientEmail,
      subject,
      status,
      metadata: JSON.stringify({
        richDocumentIds,
        attachmentCount: attachments.length,
        failures,
        sentById: sentById ?? null,
      }),
    },
  });

  return {
    sent: status === "sent",
    logId: log.id,
    attachmentCount: attachments.length,
    failures,
  };
}
