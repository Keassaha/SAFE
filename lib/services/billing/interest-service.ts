/**
 * Service intérêts : calcul et historisation des intérêts de retard.
 */

import { prisma } from "@/lib/db";
import { computeInterestAmount } from "@/lib/invoice-calculations";
import { createAuditLog } from "@/lib/services/audit";

/** Calcule le nombre de jours de retard à une date donnée */
export function getDaysOverdue(dueDate: Date, asOf: Date = new Date()): number {
  if (asOf <= dueDate) return 0;
  return Math.floor((asOf.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
}

/** Crée ou met à jour un enregistrement d'intérêt pour une facture */
export async function createOrUpdateInterestCharge(params: {
  invoiceId: string;
  annualRate: number;
  asOfDate?: Date;
  createdById?: string | null;
}): Promise<{ interestChargeId: string; interestAmount: number }> {
  const { invoiceId, annualRate, asOfDate = new Date(), createdById } = params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) throw new Error("Facture introuvable");
  if (invoice.invoiceStatus !== "ISSUED" && invoice.invoiceStatus !== "PARTIALLY_PAID" && invoice.invoiceStatus !== "OVERDUE") {
    throw new Error("La facture doit être émise pour calculer les intérêts");
  }

  const dueDate = invoice.dateEcheance;
  const daysOverdue = getDaysOverdue(dueDate, asOfDate);
  if (daysOverdue <= 0) {
    throw new Error("La facture n'est pas en retard");
  }

  const baseAmount = invoice.balanceDue ?? invoice.totalInvoiceAmount ?? invoice.montantTotal ?? 0;
  if (baseAmount <= 0) throw new Error("Aucun solde à facturer d'intérêts");

  const interestAmount = computeInterestAmount(baseAmount, annualRate, daysOverdue);
  if (interestAmount <= 0) return { interestChargeId: "", interestAmount: 0 };

  const charge = await prisma.interestCharge.create({
    data: {
      invoiceId,
      calculationDate: asOfDate,
      annualRate,
      daysOverdue,
      baseAmount,
      interestAmount,
      status: "calculated",
    },
  });

  await createAuditLog({
    cabinetId: invoice.cabinetId,
    userId: createdById ?? undefined,
    entityType: "Invoice",
    entityId: invoiceId,
    action: "update",
    metadata: { interestCharge: charge.id, interestAmount },
    performedBy: createdById ?? undefined,
    performedAt: asOfDate,
  });

  return { interestChargeId: charge.id, interestAmount };
}
