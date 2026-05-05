import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY not set — emails will be logged to console");
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const SENDING_ADDRESS = "factures@safecabinet.ca";
const DEFAULT_FROM = process.env.EMAIL_FROM || `SAFE <${SENDING_ADDRESS}>`;

function buildFrom(cabinetNom?: string): string {
  if (!cabinetNom) return DEFAULT_FROM;
  // "Derisier Law <factures@safecabinet.ca>"
  const safeName = cabinetNom.replace(/[<>"]/g, "");
  return `${safeName} <${SENDING_ADDRESS}>`;
}

interface SendEmailAttachment {
  filename: string;
  content: Buffer;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  cabinetNom?: string;
  attachments?: SendEmailAttachment[];
}

export async function sendEmail({ to, subject, html, cabinetNom, attachments }: SendEmailOptions) {
  const from = buildFrom(cabinetNom);
  if (!resend) {
    console.log(`[EMAIL MOCK] From: ${from} | To: ${to} | Subject: ${subject}${attachments?.length ? ` | ${attachments.length} attachment(s)` : ""}`);
    return { id: "mock", success: true };
  }

  const { data, error } = await resend.emails.send({
    from,
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

/**
 * Lettre d'accompagnement professionnelle pour l'envoi officiel d'une facture.
 *
 * Doctrine phase 1 : le corps du courriel ne doit JAMAIS prétendre joindre une
 * pièce qui n'existe pas. Si `hasAttachment` est false, le texte indique
 * clairement comment récupérer la facture.
 *
 * Le contenu de la facture (lignes, taxes, totaux) reste dans le PDF officiel —
 * il n'est pas inséré dans le HTML.
 */
export function invoiceAccompanyingEmailHtml(opts: {
  clientName: string;
  invoiceNumber: string;
  cabinetName: string;
  dueDate?: string;
  /** Lien public optionnel pour consulter la facture en ligne. */
  shareUrl?: string;
  /** True si un PDF est réellement joint au courriel. */
  hasAttachment: boolean;
}): { subject: string; html: string } {
  const subject = `Facture ${opts.invoiceNumber} — ${opts.cabinetName}`;
  const greeting = `Bonjour ${opts.clientName},`;
  const intro = opts.hasAttachment
    ? `Veuillez trouver <strong>en pièce jointe</strong> notre facture n° <strong>${opts.invoiceNumber}</strong> relativement à votre dossier.`
    : opts.shareUrl
      ? `Vous trouverez notre facture n° <strong>${opts.invoiceNumber}</strong> à l'adresse sécurisée ci-dessous.`
      : `Notre facture n° <strong>${opts.invoiceNumber}</strong> a été émise. Notre équipe vous transmettra le document officiel sous peu.`;
  const dueLine = opts.dueDate
    ? `<p style="margin: 12px 0;">Échéance : <strong>${opts.dueDate}</strong>.</p>`
    : "";
  const linkBlock =
    !opts.hasAttachment && opts.shareUrl
      ? `<p style="margin: 24px 0;"><a href="${opts.shareUrl}" style="display: inline-block; padding: 10px 18px; background: #0F2A22; color: #FFFFFF; text-decoration: none; border-radius: 4px; font-weight: 600;">Consulter la facture</a></p>`
      : "";
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <p style="margin: 0 0 16px 0;">${greeting}</p>
      <p style="margin: 0 0 12px 0;">${intro}</p>
      ${dueLine}
      ${linkBlock}
      <p style="margin: 16px 0;">N'hésitez pas à communiquer avec nous pour toute question.</p>
      <p style="margin: 16px 0 0 0;">Cordialement,<br/><strong>${opts.cabinetName}</strong></p>
      <hr style="margin: 32px 0 12px 0; border: none; border-top: 1px solid #e5e5e5;" />
      <p style="color: #888; font-size: 11px; margin: 0;">Cet envoi a été émis par SAFE pour le compte de ${opts.cabinetName}.</p>
    </div>
  `;
  return { subject, html };
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

export function invitationEmailHtml({
  cabinetNom,
  inviteUrl,
  role,
}: {
  cabinetNom: string;
  inviteUrl: string;
  role: string;
}) {
  const roleLabel: Record<string, string> = {
    assistante: "Assistante juridique",
    avocat: "Avocate / Avocat",
    comptabilite: "Comptabilité",
    admin_cabinet: "Administrateur·trice",
  };
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">
      <div style="background: #1a1a1a; padding: 28px 32px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; line-height: 1.3;">
          Vous avez été invité·e à rejoindre ${cabinetNom}
        </h1>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 32px;">
        <p style="color: #374151; margin-top: 0; font-size: 15px; line-height: 1.6;">
          Bonjour,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          <strong>${cabinetNom}</strong> vous invite à rejoindre leur espace de travail sur SAFE en tant que
          <strong>${roleLabel[role] ?? role}</strong>.
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          SAFE est la plateforme de gestion utilisée par votre cabinet pour la facturation, les dossiers et la conformité.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteUrl}"
             style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 14px 36px;
                    text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600;
                    letter-spacing: 0.01em;">
            Créer mon compte →
          </a>
        </div>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
            Ce lien est valide <strong>72 heures</strong>. Si vous ne vous attendiez pas à cette invitation,
            vous pouvez ignorer cet email en toute sécurité.
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin: 0; border-top: 1px solid #f3f4f6; padding-top: 20px;">
          ${cabinetNom} · Géré via SAFE &mdash; safecabinet.ca
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
