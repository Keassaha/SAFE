/**
 * SAFE — Pont comptable facturation -> journal général.
 *
 * Règles:
 *   - facture émise  -> JGE FACTURE / entrée (revenu facturé)
 *   - paiement reçu  -> JGE PAIEMENT / entrée (encaissement)
 *   - idempotence sur (cabinetId, sourceModule, sourceId)
 *
 * Les écritures restent append-only. Une correction future passe par une ligne
 * CORRECTION, jamais par modification de l'écriture originale.
 */

import type { Invoice, Payment, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createJournalEntry } from "./journal-service";
import { isJournalIdempotencyConflict } from "./idempotency";

type JournalPrismaClient = PrismaClient | Prisma.TransactionClient;

export const INVOICE_JOURNAL_SOURCE_MODULE = "FACTURATION" as const;
export const PAYMENT_JOURNAL_SOURCE_MODULE = "PAIEMENTS" as const;

export type BillingJournalResult =
  | { created: true; journalId: string; reason?: undefined }
  | {
      created: false;
      journalId?: string;
      reason: "already_journalized" | "amount_zero";
    };

type InvoiceJournalInput = Pick<
  Invoice,
  | "id"
  | "cabinetId"
  | "clientId"
  | "dossierId"
  | "numero"
  | "dateEmission"
  | "sentAt"
  | "totalInvoiceAmount"
  | "montantTotal"
> & {
  client?: { raisonSociale?: string | null; prenom?: string | null; nom?: string | null } | null;
};

type PaymentJournalInput = Pick<
  Payment,
  | "id"
  | "cabinetId"
  | "clientId"
  | "invoiceId"
  | "datePaiement"
  | "montant"
  | "paymentMethod"
  | "referenceNumber"
  | "reference"
  | "receivedById"
> & {
  client?: { raisonSociale?: string | null; prenom?: string | null; nom?: string | null } | null;
  invoice?: { numero?: string | null; dossierId?: string | null } | null;
};

export async function writeJournalForIssuedInvoice(
  invoice: InvoiceJournalInput,
  opts: { client?: JournalPrismaClient; utilisateurId?: string | null } = {},
): Promise<BillingJournalResult> {
  const amount = roundMoney(invoice.totalInvoiceAmount || invoice.montantTotal || 0);
  if (amount <= 0) return { created: false, reason: "amount_zero" };

  const client = opts.client ?? prisma;
  const existing = await findExistingEntry(client, {
    cabinetId: invoice.cabinetId,
    sourceModule: INVOICE_JOURNAL_SOURCE_MODULE,
    sourceId: invoice.id,
  });
  if (existing) return { created: false, journalId: existing.id, reason: "already_journalized" };

  try {
    const created = await createJournalEntry(
      {
        cabinetId: invoice.cabinetId,
        dateTransaction: invoice.sentAt ?? invoice.dateEmission,
        typeTransaction: "FACTURE",
        reference: invoice.numero,
        clientId: invoice.clientId,
        dossierId: invoice.dossierId,
        description: invoiceDescription(invoice),
        categorie: "Facturation client",
        montantEntree: amount,
        montantSortie: 0,
        sourceModule: INVOICE_JOURNAL_SOURCE_MODULE,
        sourceId: invoice.id,
        utilisateurId: opts.utilisateurId ?? null,
      },
      client,
    );
    return { created: true, journalId: created.id };
  } catch (e) {
    if (!isJournalIdempotencyConflict(e)) throw e;
    const winner = await findExistingEntry(client, {
      cabinetId: invoice.cabinetId,
      sourceModule: INVOICE_JOURNAL_SOURCE_MODULE,
      sourceId: invoice.id,
    });
    return { created: false, journalId: winner?.id, reason: "already_journalized" };
  }
}

export async function writeJournalForPayment(
  payment: PaymentJournalInput,
  opts: { client?: JournalPrismaClient; utilisateurId?: string | null } = {},
): Promise<BillingJournalResult> {
  const amount = roundMoney(payment.montant || 0);
  if (amount <= 0) return { created: false, reason: "amount_zero" };

  const client = opts.client ?? prisma;
  const existing = await findExistingEntry(client, {
    cabinetId: payment.cabinetId,
    sourceModule: PAYMENT_JOURNAL_SOURCE_MODULE,
    sourceId: payment.id,
  });
  if (existing) return { created: false, journalId: existing.id, reason: "already_journalized" };

  try {
    const created = await createJournalEntry(
      {
        cabinetId: payment.cabinetId,
        dateTransaction: payment.datePaiement,
        typeTransaction: "PAIEMENT",
        reference: payment.referenceNumber ?? payment.reference ?? null,
        clientId: payment.clientId,
        dossierId: payment.invoice?.dossierId ?? null,
        description: paymentDescription(payment),
        categorie: payment.paymentMethod ? `Paiement ${payment.paymentMethod}` : "Paiement client",
        montantEntree: amount,
        montantSortie: 0,
        sourceModule: PAYMENT_JOURNAL_SOURCE_MODULE,
        sourceId: payment.id,
        utilisateurId: opts.utilisateurId ?? payment.receivedById ?? null,
      },
      client,
    );
    return { created: true, journalId: created.id };
  } catch (e) {
    if (!isJournalIdempotencyConflict(e)) throw e;
    const winner = await findExistingEntry(client, {
      cabinetId: payment.cabinetId,
      sourceModule: PAYMENT_JOURNAL_SOURCE_MODULE,
      sourceId: payment.id,
    });
    return { created: false, journalId: winner?.id, reason: "already_journalized" };
  }
}

function findExistingEntry(
  client: JournalPrismaClient,
  where: { cabinetId: string; sourceModule: "FACTURATION" | "PAIEMENTS"; sourceId: string },
) {
  return client.journalGeneralEntry.findFirst({
    where,
    select: { id: true },
  });
}

function invoiceDescription(invoice: InvoiceJournalInput): string {
  const clientName = displayClient(invoice.client);
  return clientName
    ? `Facture ${invoice.numero} — ${clientName}`.slice(0, 500)
    : `Facture ${invoice.numero}`.slice(0, 500);
}

function paymentDescription(payment: PaymentJournalInput): string {
  const clientName = displayClient(payment.client);
  const invoiceNumber = payment.invoice?.numero;
  const parts = ["Paiement reçu"];
  if (invoiceNumber) parts.push(`facture ${invoiceNumber}`);
  if (clientName) parts.push(clientName);
  return parts.join(" — ").slice(0, 500);
}

function displayClient(
  client?: { raisonSociale?: string | null; prenom?: string | null; nom?: string | null } | null,
): string | null {
  if (!client) return null;
  const company = (client.raisonSociale ?? "").trim();
  if (company) return company;
  const person = `${client.prenom ?? ""} ${client.nom ?? ""}`.trim();
  return person || null;
}

function roundMoney(value: number): number {
  return Math.round(Math.abs(value) * 100) / 100;
}
