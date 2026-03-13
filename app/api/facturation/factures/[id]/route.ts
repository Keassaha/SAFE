import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import { patchFactureSchema } from "@/lib/validations/facturation";
import {
  computeInvoiceTotals,
  toInvoiceTotalsFields,
} from "@/lib/invoice-calculations";
import type { UserRole } from "@prisma/client";

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    if (!cabinetId) return null;
    return { cabinetId, role };
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, role } = data;
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, cabinetId },
    include: {
      cabinet: { select: { id: true, nom: true, adresse: true } },
      client: { select: { id: true, raisonSociale: true, billingAddress: true, billingCity: true, billingProvince: true, billingPostalCode: true, billingCountry: true } },
      dossier: { select: { id: true, intitule: true, numeroDossier: true } },
      invoiceItems: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, nom: true } } },
      },
      invoiceLines: {
        orderBy: { sortOrder: "asc" },
        include: { timeEntry: { include: { user: { select: { nom: true } } } } },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  const lineItems = invoice.invoiceLines.map((line) => ({
    id: line.id,
    type:
      line.lineType === "fee"
        ? "honoraires"
        : line.lineType === "expense"
          ? "debours_taxable"
          : "honoraires",
    description: line.description,
    date: line.serviceDate ?? line.createdAt,
    hours: line.quantite ?? null,
    rate: line.tauxUnitaire ?? null,
    amount: line.lineSubtotal ?? line.montant,
    userId: line.timeEntry?.userId ?? null,
    userNom: line.timeEntry?.user?.nom ?? null,
    timeEntryId: line.timeEntryId,
    parentItemId: null as string | null,
    parentLineId: null as string | null,
    source: "line" as const,
    validationComment: line.validationComment ?? null,
  }));
  const itemItems = invoice.invoiceItems.map((item) => ({
    id: item.id,
    type: item.type,
    description: item.description,
    date: item.date,
    hours: item.hours,
    rate: item.rate,
    amount: item.amount,
    userId: item.userId,
    userNom: item.professionalDisplayName ?? item.user?.nom ?? null,
    timeEntryId: item.timeEntryId,
    parentItemId: item.parentItemId ?? null,
    parentLineId: item.parentLineId ?? null,
    source: "item" as const,
    validationComment: item.validationComment ?? null,
  }));
  const items = [...lineItems, ...itemItems];

  return NextResponse.json({
    id: invoice.id,
    numero: invoice.numero,
    statut: invoice.statut,
    dateEmission: invoice.dateEmission,
    dateEcheance: invoice.dateEcheance,
    clientId: invoice.clientId,
    cabinet: invoice.cabinet,
    client: invoice.client,
    dossierId: invoice.dossierId,
    dossier: invoice.dossier,
    items,
    subtotalTaxable: invoice.subtotalTaxable,
    tps: invoice.tps,
    tvq: invoice.tvq,
    deboursNonTaxableTotal: invoice.deboursNonTaxableTotal,
    montantTotal: invoice.montantTotal,
    montantPaye: invoice.montantPaye,
    balanceDue: invoice.balanceDue,
    trustApplied: invoice.trustApplied,
    tauxInteret: invoice.tauxInteret,
    dateLimiteInterets: invoice.dateLimiteInterets,
    clientNote: invoice.clientNote,
    invoiceStatus: invoice.invoiceStatus,
    validatedAt: invoice.validatedAt,
    sentAt: invoice.sentAt,
    cancelledAt: invoice.cancelledAt,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, role } = data;
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.invoice.findFirst({
    where: { id, cabinetId },
    include: {
      invoiceItems: true,
      invoiceLines: true,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }
  if (existing.statut !== "brouillon") {
    return NextResponse.json(
      { error: "Seules les factures brouillon peuvent être modifiées" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }
  const parsed = patchFactureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  if (input.dateEmission != null || input.dateEcheance != null) {
    await prisma.invoice.update({
      where: { id },
      data: {
        ...(input.dateEmission != null && { dateEmission: input.dateEmission }),
        ...(input.dateEcheance != null && { dateEcheance: input.dateEcheance }),
        ...(input.tauxInteret !== undefined && { tauxInteret: input.tauxInteret }),
        ...(input.dateLimiteInterets !== undefined && {
          dateLimiteInterets: input.dateLimiteInterets,
        }),
      },
    });
  }

  if (input.items != null && input.items.length > 0) {
    const lineIds = new Set(existing.invoiceLines.map((l) => l.id));
    const lineById = new Map(existing.invoiceLines.map((l) => [l.id, l]));
    const itemIds = new Set(existing.invoiceItems.map((i) => i.id));
    const { TPS_RATE, TVQ_RATE } = await import("@/lib/invoice-calculations");

    for (const item of input.items) {
      if (item.id && lineIds.has(item.id)) {
        const amount = item.amount;
        const gst = Math.round(amount * TPS_RATE * 100) / 100;
        const qst = Math.round(amount * TVQ_RATE * 100) / 100;
        const line = lineById.get(item.id);
        const isFromTimeEntry =
          line?.sourceType === "time_entry" && line?.sourceId != null;

        await prisma.invoiceLine.update({
          where: { id: item.id },
          data: {
            description: item.description,
            serviceDate: item.date,
            quantite: item.hours ?? 0,
            tauxUnitaire: item.rate ?? 0,
            montant: amount,
            lineSubtotal: amount,
            gstAmount: gst,
            qstAmount: qst,
            lineTotal: amount + gst + qst,
            ...(item.validationComment !== undefined && { validationComment: item.validationComment }),
          },
        });

        // Synchroniser la fiche de temps liée pour garder description, date, heures, taux et montant alignés
        if (isFromTimeEntry && line.sourceId) {
          const serviceDate =
            typeof item.date === "string"
              ? new Date(item.date)
              : item.date instanceof Date
                ? item.date
                : new Date();
          const hours = item.hours ?? 0;
          const dureeMinutes = Math.round(hours * 60);
          await prisma.timeEntry.update({
            where: { id: line.sourceId },
            data: {
              description: item.description,
              date: serviceDate,
              dureeMinutes,
              durationHours: hours,
              tauxHoraire: item.rate ?? 0,
              hourlyRate: item.rate ?? null,
              montant: amount,
              feeAmount: amount,
            },
          });
        }

        // Synchroniser la fiche de frais (Expense) liée si la ligne vient d'un débours
        const isFromExpense =
          line?.sourceType === "expense" && line?.sourceId != null;
        if (isFromExpense && line.sourceId) {
          const expenseDate =
            typeof item.date === "string"
              ? new Date(item.date)
              : item.date instanceof Date
                ? item.date
                : new Date();
          await prisma.expense.update({
            where: { id: line.sourceId },
            data: {
              description: item.description,
              expenseDate,
              amount,
            },
          });
        }
      } else if (item.id && itemIds.has(item.id)) {
        await prisma.invoiceItem.update({
          where: { id: item.id },
          data: {
            description: item.description,
            date: item.date,
            hours: item.hours ?? null,
            rate: item.rate ?? null,
            amount: item.amount,
            type: item.type,
            professionalDisplayName: item.professionalDisplayName ?? undefined,
            parentItemId: item.parentItemId ?? undefined,
            parentLineId: item.parentLineId ?? undefined,
            ...(item.validationComment !== undefined && { validationComment: item.validationComment }),
          },
        });
      } else if (!item.id || (!lineIds.has(item.id) && !itemIds.has(item.id))) {
        await prisma.invoiceItem.create({
          data: {
            invoiceId: id,
            type: item.type,
            description: item.description,
            date: item.date,
            hours: item.hours ?? null,
            rate: item.rate ?? null,
            amount: item.amount,
            userId: item.userId ?? null,
            professionalDisplayName: item.professionalDisplayName ?? undefined,
            timeEntryId: null,
            parentItemId: item.parentItemId ?? undefined,
            parentLineId: item.parentLineId ?? undefined,
            validationComment: item.validationComment ?? undefined,
          },
        });
      }
    }
    const { recalculateInvoiceTotals } = await import("@/lib/services/billing/invoice-service");
    await recalculateInvoiceTotals(id);
  }

  const updated = await prisma.invoice.findFirst({
    where: { id, cabinetId },
    include: {
      client: { select: { id: true, raisonSociale: true } },
      dossier: { select: { id: true, intitule: true, numeroDossier: true } },
      invoiceItems: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, nom: true } } },
      },
    },
  });

  return NextResponse.json(updated);
}
