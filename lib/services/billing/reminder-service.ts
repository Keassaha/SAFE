/**
 * Service relances : création et envoi de relances pour factures en retard.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";

export type ReminderType = "reminder_1" | "reminder_2" | "final_notice" | "interest_notice";
export type ReminderChannel = "email" | "manual" | "printed";

/** Crée une relance pour une facture */
export async function createReminder(params: {
  invoiceId: string;
  reminderType: ReminderType;
  channel?: ReminderChannel;
  note?: string | null;
  scheduledAt?: Date;
}): Promise<{ reminderId: string }> {
  const {
    invoiceId,
    reminderType,
    channel = "manual",
    note,
    scheduledAt = new Date(),
  } = params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) throw new Error("Facture introuvable");

  const reminder = await prisma.invoiceReminder.create({
    data: {
      invoiceId,
      reminderType,
      channel: channel as "email" | "manual" | "printed",
      scheduledAt,
      sentAt: channel === "manual" ? new Date() : undefined,
      status: channel === "manual" ? "sent" : "scheduled",
      note: note ?? undefined,
      reminderDay: undefined,
    },
  });

  await createAuditLog({
    cabinetId: invoice.cabinetId,
    entityType: "Invoice",
    entityId: invoiceId,
    action: "update",
    metadata: { reminderId: reminder.id, reminderType, channel },
    performedAt: new Date(),
  });

  return { reminderId: reminder.id };
}

/** Liste les factures en retard (échéance dépassée, solde > 0) */
export async function listOverdueInvoices(cabinetId: string, filters?: {
  clientId?: string;
  limit?: number;
}) {
  const now = new Date();
  const list = await prisma.invoice.findMany({
    where: {
      cabinetId,
      dateEcheance: { lt: now },
      invoiceStatus: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
      ...(filters?.clientId ? { clientId: filters.clientId } : {}),
    },
    orderBy: { dateEcheance: "asc" },
    take: filters?.limit ?? 100,
    include: {
      client: { select: { id: true, raisonSociale: true } },
      dossier: { select: { id: true, intitule: true } },
    },
  });
  return list.filter(
    (inv) => (inv.balanceDue ?? inv.montantTotal - inv.montantPaye) > 0
  );
}
