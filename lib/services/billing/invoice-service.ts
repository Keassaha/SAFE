/**
 * Service facturation : brouillon, émission, annulation, recalcul des totaux.
 * Règles métier : une fiche de temps/débours → une seule facture active ; pas de modification silencieuse après émission.
 */

import { prisma } from "@/lib/db";
import { getNextInvoiceNumero } from "@/lib/facturation/numero-facture";
import {
  computeBillingTotals,
  TPS_RATE,
  TVQ_RATE,
  MIN_AMOUNT_TO_BILL,
} from "@/lib/invoice-calculations";
import type { BillingLineRow } from "@/lib/invoice-calculations";
import { createAuditLog } from "@/lib/services/audit";
import type { Prisma } from "@prisma/client";

const NON_ISSUED_STATUSES = ["DRAFT", "READY_TO_ISSUE"] as const;
const ISSUED_STATUSES = ["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"] as const;

/** Vérifie qu'une facture n'est pas émise (modifiable) */
export function canModifyInvoice(status: string | null): boolean {
  return status != null && NON_ISSUED_STATUSES.includes(status as (typeof NON_ISSUED_STATUSES)[number]);
}

/** Crée un brouillon à partir de fiches de temps et débours sélectionnés */
export async function createDraftFromBillableItems(params: {
  cabinetId: string;
  clientId: string;
  dossierId?: string | null;
  timeEntryIds: string[];
  expenseIds?: string[];
  createdById?: string | null;
}): Promise<{ invoiceId: string }> {
  const { cabinetId, clientId, dossierId, timeEntryIds, expenseIds = [], createdById } = params;

  if (timeEntryIds.length === 0 && expenseIds.length === 0) {
    throw new Error("Sélectionnez au moins une fiche de temps ou un débours");
  }

  const timeEntries =
    timeEntryIds.length > 0
      ? await prisma.timeEntry.findMany({
          where: {
            id: { in: timeEntryIds },
            cabinetId,
            clientId,
            ...(dossierId != null ? { dossierId } : {}),
            facturable: true,
            invoiceId: null,
            AND: [
              {
                OR: [
                  { billingStatus: { in: ["NON_BILLED", "READY_TO_BILL"] } },
                  { billingStatus: null },
                ],
              },
            ],
          },
          include: { user: { select: { id: true, nom: true } } },
        })
      : [];

  if (timeEntryIds.length > 0 && timeEntries.length !== timeEntryIds.length) {
    throw new Error("Certaines fiches de temps sont introuvables ou déjà facturées");
  }

  let expenses: Awaited<ReturnType<typeof prisma.expense.findMany>> = [];
  if (expenseIds.length > 0) {
    expenses = await prisma.expense.findMany({
      where: {
        id: { in: expenseIds },
        cabinetId,
        clientId,
        billingStatus: { in: ["NON_BILLED", "READY_TO_BILL"] },
        invoiceId: null,
      },
    });
    if (expenses.length !== expenseIds.length) {
      throw new Error("Certains débours sont introuvables ou déjà facturés");
    }
  }

  const subtotalHonoraires = timeEntries.reduce(
    (s, te) => s + (te.feeAmount ?? te.montant),
    0
  );
  const subtotalDebours = expenses.reduce((s, e) => s + e.amount, 0);
  const subtotalTaxable = subtotalHonoraires + subtotalDebours;
  const totalTTC =
    subtotalTaxable +
    Math.round(subtotalTaxable * TPS_RATE * 100) / 100 +
    Math.round(subtotalTaxable * TVQ_RATE * 100) / 100;
  if (totalTTC < MIN_AMOUNT_TO_BILL) {
    throw new Error(
      `Le total doit être supérieur ou égal à ${MIN_AMOUNT_TO_BILL} $ pour facturer le client.`
    );
  }

  const numero = await getNextInvoiceNumero(cabinetId);
  const now = new Date();
  // Dû à la réception : même date que l'émission
  const dueDate = new Date(now);

  const invoice = await prisma.invoice.create({
    data: {
      cabinetId,
      clientId,
      dossierId: dossierId ?? null,
      numero,
      dateEmission: now,
      dateEcheance: dueDate,
      statut: "brouillon",
      invoiceStatus: "DRAFT",
      paymentStatus: "UNPAID",
      issueMethod: "generated_from_billing",
      createdById: createdById ?? null,
    },
  });

  let sortOrder = 0;
  for (const te of timeEntries) {
    const lineSubtotal = te.feeAmount ?? te.montant;
    const taxable = te.taxable ?? true;
    const gst = Math.round(lineSubtotal * TPS_RATE * 100) / 100;
    const qst = Math.round(lineSubtotal * TVQ_RATE * 100) / 100;
    const lineTotal = lineSubtotal + gst + qst;
    const line = await prisma.invoiceLine.create({
      data: {
        invoiceId: invoice.id,
        timeEntryId: te.id,
        lineType: "fee",
        sourceType: "time_entry",
        sourceId: te.id,
        matterId: te.dossierId,
        serviceDate: te.date,
        description: te.description ?? "Honoraires",
        quantite: te.durationHours ?? te.dureeMinutes / 60,
        tauxUnitaire: te.hourlyRate ?? te.tauxHoraire,
        lineSubtotal,
        taxable,
        gstAmount: gst,
        qstAmount: qst,
        lineTotal,
        sortOrder: sortOrder++,
        montant: lineSubtotal,
      },
    });
    await prisma.timeEntry.update({
      where: { id: te.id },
      data: {
        billingStatus: "IN_DRAFT_INVOICE",
        invoiceId: invoice.id,
        invoiceLineId: line.id,
      },
    });
  }

  for (const exp of expenses) {
    const lineSubtotal = exp.amount;
    const taxable = exp.taxable;
    const gst = taxable ? Math.round(lineSubtotal * TPS_RATE * 100) / 100 : 0;
    const qst = taxable ? Math.round(lineSubtotal * TVQ_RATE * 100) / 100 : 0;
    const lineTotal = lineSubtotal + gst + qst;
    const line = await prisma.invoiceLine.create({
      data: {
        invoiceId: invoice.id,
        lineType: "expense",
        sourceType: "expense",
        sourceId: exp.id,
        matterId: exp.matterId,
        serviceDate: exp.expenseDate,
        description: exp.description,
        quantite: 1,
        tauxUnitaire: exp.amount,
        lineSubtotal,
        taxable,
        gstAmount: gst,
        qstAmount: qst,
        lineTotal,
        sortOrder: sortOrder++,
        montant: lineSubtotal,
      },
    });
    await prisma.expense.update({
      where: { id: exp.id },
      data: {
        billingStatus: "IN_DRAFT_INVOICE",
        invoiceId: invoice.id,
        invoiceLineId: line.id,
      },
    });
  }

  await recalculateInvoiceTotals(invoice.id);
  await createAuditLog({
    cabinetId,
    userId: createdById ?? undefined,
    entityType: "Invoice",
    entityId: invoice.id,
    action: "create",
    newValues: { numero, clientId, dossierId, timeEntryIds, expenseIds },
    performedBy: createdById ?? undefined,
    performedAt: new Date(),
  });

  return { invoiceId: invoice.id };
}

/** Recalcule et persiste les totaux d'une facture à partir de ses lignes, items manuels et allocations */
export async function recalculateInvoiceTotals(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      invoiceLines: true,
      invoiceItems: true,
      paymentAllocations: true,
    },
  });
  if (!invoice) return;

  const lines: BillingLineRow[] = [
    ...invoice.invoiceLines.map((l) => ({
      lineType: (l.lineType ?? "fee") as BillingLineRow["lineType"],
      lineSubtotal: l.lineSubtotal ?? l.montant,
      taxable: l.taxable ?? true,
      gstAmount: l.gstAmount,
      qstAmount: l.qstAmount,
    })),
    ...invoice.invoiceItems
      .filter((i) => i.type !== "rabais")
      .map((i) => {
        const amount = i.amount;
        if (i.type === "frais_rappel") {
          return {
            lineType: "fee_after_tax" as const,
            lineSubtotal: amount,
            taxable: false,
            gstAmount: 0,
            qstAmount: 0,
          };
        }
        if (i.type === "debours_non_taxable") {
          return {
            lineType: "non_taxable" as const,
            lineSubtotal: amount,
            taxable: false,
            gstAmount: 0,
            qstAmount: 0,
          };
        }
        if (i.type === "debours_taxable") {
          return {
            lineType: "expense" as const,
            lineSubtotal: amount,
            taxable: true,
            gstAmount: Math.round(amount * TPS_RATE * 100) / 100,
            qstAmount: Math.round(amount * TVQ_RATE * 100) / 100,
          };
        }
        if (i.type === "interets") {
          return {
            lineType: "interest" as const,
            lineSubtotal: amount,
            taxable: true,
            gstAmount: Math.round(amount * TPS_RATE * 100) / 100,
            qstAmount: Math.round(amount * TVQ_RATE * 100) / 100,
          };
        }
        return {
          lineType: "fee" as const,
          lineSubtotal: amount,
          taxable: true,
          gstAmount: Math.round(amount * TPS_RATE * 100) / 100,
          qstAmount: Math.round(amount * TVQ_RATE * 100) / 100,
        };
      }),
    ...invoice.invoiceItems
      .filter((i) => i.type === "rabais")
      .map((i) => ({
        lineType: "adjustment" as const,
        lineSubtotal: -Math.abs(i.amount),
        taxable: true,
        gstAmount: 0,
        qstAmount: 0,
      })),
  ];

  const totalPaidAmount = invoice.paymentAllocations.reduce(
    (s, a) => s + a.allocatedAmount,
    0
  );
  const trustApplied = invoice.trustAppliedAmount ?? invoice.trustApplied ?? 0;
  const creditApplied = invoice.creditAppliedAmount ?? 0;

  const totals = computeBillingTotals(
    lines,
    totalPaidAmount,
    trustApplied,
    creditApplied
  );

  const paymentStatus =
    totals.balanceDue <= 0
      ? "PAID"
      : totalPaidAmount > 0
        ? "PARTIAL"
        : "UNPAID";

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      subtotalFees: totals.subtotalFees,
      subtotalExpenses: totals.subtotalExpenses,
      subtotalAdjustments: totals.subtotalAdjustments,
      subtotalInterest: totals.subtotalInterest,
      subtotalBeforeTax: totals.subtotalBeforeTax,
      taxGst: totals.taxGst,
      taxQst: totals.taxQst,
      taxTotal: totals.taxTotal,
      totalInvoiceAmount: totals.totalInvoiceAmount,
      totalPaidAmount: totals.totalPaidAmount,
      balanceDue: totals.balanceDue,
      montantTotal: totals.totalInvoiceAmount,
      montantPaye: totals.totalPaidAmount,
      subtotalTaxable: totals.subtotalBeforeTax,
      tps: totals.taxGst,
      tvq: totals.taxQst,
      paymentStatus,
    },
  });
}

/** Approuve une facture (validation avocat) sans l'émettre : DRAFT → READY_TO_ISSUE */
export async function approveInvoice(params: {
  invoiceId: string;
  approvedById: string;
  cabinetId?: string;
}): Promise<void> {
  const { invoiceId, approvedById, cabinetId: enforcedCabinetId } = params;
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, ...(enforcedCabinetId ? { cabinetId: enforcedCabinetId } : {}) },
  });
  if (!invoice) throw new Error("Facture introuvable");
  if (invoice.invoiceStatus !== "DRAFT") {
    throw new Error("Seule une facture brouillon peut être approuvée");
  }

  const now = new Date();
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      invoiceStatus: "READY_TO_ISSUE",
      validatedAt: now,
      validatedById: approvedById,
      approvedAt: now,
      approvedById,
    },
  });

  await createAuditLog({
    cabinetId: invoice.cabinetId,
    userId: approvedById,
    entityType: "Invoice",
    entityId: invoiceId,
    action: "update",
    newValues: { invoiceStatus: "READY_TO_ISSUE", validatedAt: now },
    performedBy: approvedById,
    performedAt: now,
  });
}

/** Émet une facture (DRAFT ou READY_TO_ISSUE → ISSUED) et met à jour les lignes source */
export async function issueInvoice(params: {
  invoiceId: string;
  approvedById?: string | null;
  cabinetId?: string;
}): Promise<void> {
  const { invoiceId, approvedById, cabinetId: enforcedCabinetId } = params;
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, ...(enforcedCabinetId ? { cabinetId: enforcedCabinetId } : {}) },
    include: { invoiceLines: true },
  });
  if (!invoice) throw new Error("Facture introuvable");
  if (invoice.invoiceStatus !== "DRAFT" && invoice.invoiceStatus !== "READY_TO_ISSUE") {
    throw new Error("Seule une facture brouillon ou approuvée peut être émise");
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    for (const line of invoice.invoiceLines) {
      if (line.sourceType === "time_entry" && line.sourceId) {
        await tx.timeEntry.updateMany({
          where: { id: line.sourceId },
          data: { billingStatus: "BILLED" },
        });
      }
      if (line.sourceType === "expense" && line.sourceId) {
        await tx.expense.updateMany({
          where: { id: line.sourceId },
          data: { billingStatus: "BILLED" },
        });
      }
    }
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        invoiceStatus: "ISSUED",
        statut: "envoyee",
        sentAt: now,
        approvedAt: now,
        approvedById: approvedById ?? undefined,
        validatedAt: now,
        validatedById: approvedById ?? undefined,
      },
    });
  });

  await createAuditLog({
    cabinetId: invoice.cabinetId,
    userId: approvedById ?? undefined,
    entityType: "Invoice",
    entityId: invoiceId,
    action: "update",
    newValues: { invoiceStatus: "ISSUED", sentAt: now },
    performedBy: approvedById ?? undefined,
    performedAt: now,
  });
}

/** Annule un brouillon et remet les lignes source en état facturable */
export async function cancelDraft(params: {
  invoiceId: string;
  cancelReason?: string | null;
  performedById?: string | null;
  cabinetId?: string;
}): Promise<void> {
  const { invoiceId, cancelReason, performedById, cabinetId: enforcedCabinetId } = params;
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, ...(enforcedCabinetId ? { cabinetId: enforcedCabinetId } : {}) },
    include: { invoiceLines: true },
  });
  if (!invoice) throw new Error("Facture introuvable");
  if (!canModifyInvoice(invoice.invoiceStatus)) {
    throw new Error("Seul un brouillon peut être annulé");
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    // Remettre chaque ligne source (fiches de temps, débours) en « honoraires à facturer »
    for (const line of invoice.invoiceLines) {
      if (line.sourceType === "time_entry" && line.sourceId) {
        await tx.timeEntry.updateMany({
          where: { id: line.sourceId },
          data: {
            billingStatus: "READY_TO_BILL",
            invoiceId: null,
            invoiceLineId: null,
          },
        });
      }
      if (line.sourceType === "expense" && line.sourceId) {
        await tx.expense.updateMany({
          where: { id: line.sourceId },
          data: {
            billingStatus: "READY_TO_BILL",
            invoiceId: null,
            invoiceLineId: null,
          },
        });
      }
    }
    // Supprimer les lignes de facture du brouillon annulé
    await tx.invoiceLine.deleteMany({ where: { invoiceId } });
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        invoiceStatus: "CANCELLED",
        statut: "brouillon",
        cancelledAt: now,
        cancelReason: cancelReason ?? undefined,
      },
    });
  });

  await createAuditLog({
    cabinetId: invoice.cabinetId,
    userId: performedById ?? undefined,
    entityType: "Invoice",
    entityId: invoiceId,
    action: "update",
    newValues: { invoiceStatus: "CANCELLED", cancelReason },
    performedBy: performedById ?? undefined,
    performedAt: now,
  });
}
