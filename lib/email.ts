import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY not set — emails will be logged to console");
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || "SAFE <noreply@safecabinet.ca>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!resend) {
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    return { id: "mock", success: true };
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
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
