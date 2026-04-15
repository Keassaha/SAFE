/**
 * Service de notifications client (COM1, COM2).
 * Erreur #1 LAWPRO en immobilier = défaillance communication.
 * Plainte #1 LSO en immigration = manque de communication.
 */

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export interface SendNotificationParams {
  cabinetId: string;
  dossierId?: string;
  clientId: string;
  type: "status_change" | "closing_reminder" | "ircc_update" | "document_expiry";
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logs a notification (email send is deferred to email service integration).
 * For now, records the intent + generates the content.
 * When email service (Resend/SendGrid) is configured, this will send.
 */
export async function sendClientNotification(params: SendNotificationParams) {
  const { cabinetId, dossierId, clientId, type, subject, body, metadata } = params;

  // Get client email
  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId },
    select: { email: true, raisonSociale: true, prenom: true, nom: true },
  });

  if (!client?.email) {
    return { sent: false, reason: "no_email" };
  }

  // Check opt-out (future: add notificationOptOut field to Client)
  // For now, all clients receive notifications

  // Send the email via Resend
  let emailStatus = "sent";
  try {
    await sendEmail({ to: client.email, subject, html: body });
  } catch {
    emailStatus = "failed";
  }

  // Log the notification
  const log = await prisma.notificationLog.create({
    data: {
      cabinetId,
      dossierId,
      clientId,
      type,
      channel: "email",
      sentTo: client.email,
      subject,
      status: emailStatus,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  return { sent: emailStatus === "sent", notificationId: log.id, sentTo: client.email };
}

/** Generate notification content for a status change */
export function generateStatusChangeContent(params: {
  clientName: string;
  dossierNumber: string;
  dossierTitle: string;
  oldStatus: string;
  newStatus: string;
  cabinetName: string;
}) {
  const { clientName, dossierNumber, dossierTitle, oldStatus, newStatus, cabinetName } = params;

  const subject = `[${dossierNumber}] Status Update: ${formatStatus(newStatus)}`;
  const body = `
Dear ${clientName},

This is to inform you that the status of your file has been updated:

File: ${dossierNumber} — ${dossierTitle}
Previous Status: ${formatStatus(oldStatus)}
New Status: ${formatStatus(newStatus)}

If you have any questions, please do not hesitate to contact our office.

Best regards,
${cabinetName}
  `.trim();

  return { subject, body };
}

/** Generate notification content for a closing reminder (COM2) */
export function generateClosingReminderContent(params: {
  clientName: string;
  dossierNumber: string;
  propertyAddress: string;
  closingDate: string;
  daysUntilClosing: number;
  cabinetName: string;
}) {
  const { clientName, dossierNumber, propertyAddress, closingDate, daysUntilClosing, cabinetName } = params;

  const subject = `[${dossierNumber}] Closing Reminder — ${daysUntilClosing} days`;
  const body = `
Dear ${clientName},

This is a reminder that the closing date for your real estate transaction is approaching:

File: ${dossierNumber}
Property: ${propertyAddress}
Closing Date: ${closingDate}
Days Remaining: ${daysUntilClosing}

Please ensure that all required documents are prepared and that closing funds are available.

If you have any questions or need to discuss any aspect of the closing, please contact our office at your earliest convenience.

Best regards,
${cabinetName}
  `.trim();

  return { subject, body };
}

/** Generate IRCC update notification */
export function generateIrccUpdateContent(params: {
  clientName: string;
  dossierNumber: string;
  irccStatus: string;
  cabinetName: string;
}) {
  const { clientName, dossierNumber, irccStatus, cabinetName } = params;

  const subject = `[${dossierNumber}] Immigration Update: ${formatStatus(irccStatus)}`;
  const body = `
Dear ${clientName},

Your immigration file has been updated:

File: ${dossierNumber}
Current Stage: ${formatStatus(irccStatus)}

We will continue to monitor your application and notify you of any developments.

Best regards,
${cabinetName}
  `.trim();

  return { subject, body };
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Get notification history for a dossier */
export async function getNotificationHistory(dossierId: string) {
  return prisma.notificationLog.findMany({
    where: { dossierId },
    orderBy: { sentAt: "desc" },
    take: 50,
  });
}

/** Get all notifications for a cabinet */
export async function getCabinetNotifications(cabinetId: string, limit = 20) {
  return prisma.notificationLog.findMany({
    where: { cabinetId },
    orderBy: { sentAt: "desc" },
    take: limit,
  });
}
