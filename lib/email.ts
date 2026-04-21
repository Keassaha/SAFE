import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY not set — emails will be logged to console");
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || "SAFE <noreply@safecabinet.ca>";

interface SendEmailAttachment {
  filename: string;
  content: Buffer;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: SendEmailAttachment[];
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailOptions) {
  if (!resend) {
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}${attachments?.length ? ` | ${attachments.length} attachment(s)` : ""}`);
    return { id: "mock", success: true };
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  });

  if (error) {
    console.error("Email error:", error);
    throw new Error(error.message);
  }

  return { id: data?.id, success: true };
}

// --- Templates ---

export function invoiceEmailHtml(
  clientName: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string
) {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a;">Nouvelle facture</h2>
      <p>Bonjour ${clientName},</p>
      <p>Veuillez trouver ci-joint votre facture <strong>${invoiceNumber}</strong>.</p>
      <table style="width: 100%; margin: 24px 0; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Montant</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${amount} $</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Date d'échéance</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${dueDate}</td>
        </tr>
      </table>
      <p>Merci de votre confiance.</p>
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        Cet email a été envoyé par SAFE — safecabinet.ca
      </p>
    </div>
  `;
}

export function reminderEmailHtml(
  clientName: string,
  invoiceNumber: string,
  amount: string,
  daysOverdue: number
) {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a;">Rappel de paiement</h2>
      <p>Bonjour ${clientName},</p>
      <p>Nous vous rappelons que la facture <strong>${invoiceNumber}</strong> d'un montant de <strong>${amount} $</strong> est en retard de <strong>${daysOverdue} jour${daysOverdue > 1 ? "s" : ""}</strong>.</p>
      <p>Nous vous prions de bien vouloir procéder au règlement dans les meilleurs délais.</p>
      <p>Merci de votre collaboration.</p>
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        Cet email a été envoyé par SAFE — safecabinet.ca
      </p>
    </div>
  `;
}

export function documentEmailHtml(
  clientName: string,
  documentLabel: string,
  cabinetName: string,
  dossierId: string,
  language: "fr" | "en" = "fr"
) {
  const isFr = language === "fr";
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff;">
      <div style="background: #003087; padding: 16px 24px; border-radius: 6px 6px 0 0;">
        <p style="margin: 0; color: #b3c6e8; font-size: 12px; font-weight: 600; letter-spacing: 0.05em;">
          ${cabinetName.toUpperCase()}
        </p>
        <h2 style="margin: 4px 0 0; color: #ffffff; font-size: 18px;">
          ${isFr ? "Document joint" : "Attached document"}
        </h2>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 6px 6px; padding: 24px;">
        <p style="color: #374151; margin-top: 0;">
          ${isFr ? `Bonjour ${clientName},` : `Dear ${clientName},`}
        </p>
        <p style="color: #374151;">
          ${isFr
            ? `Veuillez trouver ci-joint le document suivant relatif à votre dossier&nbsp;:<br/><strong style="color: #003087;">${documentLabel}</strong>`
            : `Please find attached the following document regarding your file&nbsp;:<br/><strong style="color: #003087;">${documentLabel}</strong>`}
        </p>
        <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 4px; padding: 12px 16px; margin: 24px 0;">
          <p style="margin: 0; font-size: 13px; color: #1e3a8a;">
            ${isFr
              ? "Ce document est confidentiel et destiné exclusivement à son destinataire. Si vous avez des questions, contactez directement votre avocat."
              : "This document is confidential and intended solely for the addressee. If you have any questions, contact your lawyer directly."}
          </p>
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-bottom: 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          ${cabinetName} — ${isFr ? "Envoyé via" : "Sent via"} SAFE &mdash; safecabinet.ca
        </p>
      </div>
    </div>
  `;
}

export function passwordResetEmailHtml(resetUrl: string) {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a;">Réinitialisation de mot de passe</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe SAFE.</p>
      <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background: #1a3a5c; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Réinitialiser mon mot de passe
        </a>
      </div>
      <p style="color: #666; font-size: 13px;">Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        SAFE — safecabinet.ca
      </p>
    </div>
  `;
}
