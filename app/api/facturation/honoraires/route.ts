import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import { facturationHonorairesQuerySchema } from "@/lib/validations/facturation";
import { applyTaxes } from "@/lib/billing/taxes";
import { getCabinetTaxConfigById } from "@/lib/billing/cabinet-tax-config";
import {
  buildUnsentBillableTimeEntryWhere,
  buildHonorairesRegistreTacheWhere,
} from "@/lib/billing/queries";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import type { UserRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const NOT_SENT_INVOICE_STATUSES = ["DRAFT", "READY_TO_ISSUE"] as const;

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    if (!cabinetId) return null;
    return { cabinetId, role };
  });
}

/** Filtre : fiches de temps non envoyées (libres ou déjà dans une facture brouillon/validation).
 *  Inclut les entrées liées au client soit par clientId, soit par dossier (dossier.clientId). */
function buildHonorairesWhere(cabinetId: string, filters: {
  clientId?: string;
  dossierId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  q?: string;
}) {
  const and: Prisma.TimeEntryWhereInput[] = [];

  if (filters.clientId) {
    and.push({
      OR: [
        { clientId: filters.clientId },
        { dossier: { clientId: filters.clientId } },
      ],
    });
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { description: { contains: q, mode: "insensitive" } },
        { client: { raisonSociale: { contains: q, mode: "insensitive" } } },
        { dossier: { client: { raisonSociale: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }

  if (filters.dossierId) and.push({ dossierId: filters.dossierId });
  if (filters.userId) and.push({ userId: filters.userId });
  if (filters.dateFrom || filters.dateTo) {
    and.push({
      date: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    });
  }

  return buildUnsentBillableTimeEntryWhere(cabinetId, and);
}

// La construction du filtre RegistreTache vit dans `lib/billing/queries.ts`
// (`buildHonorairesRegistreTacheWhere`) pour qu'elle soit réutilisable et testable
// hors de la couche route Next.js.

/** Filtre : débours non envoyés */
function buildExpensesWhere(cabinetId: string, filters: {
  clientId?: string;
  matterId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const where: Prisma.ExpenseWhereInput = {
    cabinetId,
    OR: [
      {
        invoiceId: null,
        billingStatus: { in: ["NON_BILLED", "READY_TO_BILL"] },
      },
      {
        billingStatus: "IN_DRAFT_INVOICE",
        invoice: { invoiceStatus: { in: [...NOT_SENT_INVOICE_STATUSES] } },
      },
    ],
  };
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.matterId) where.matterId = filters.matterId;
  if (filters.dateFrom || filters.dateTo) {
    where.expenseDate = {};
    if (filters.dateFrom) where.expenseDate.gte = filters.dateFrom;
    if (filters.dateTo) where.expenseDate.lte = filters.dateTo;
  }
  return where;
}

export async function GET(request: Request) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, role } = data;
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const raw = {
    clientId: searchParams.get("clientId") ?? undefined,
    dossierId: searchParams.get("dossierId") ?? undefined,
    userId: searchParams.get("userId") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  };
  const parsed = facturationHonorairesQuerySchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : {};

  const where = buildHonorairesWhere(cabinetId, filters);
  const expenseWhere = buildExpensesWhere(cabinetId, {
    clientId: filters.clientId,
    matterId: filters.dossierId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
  const registreTachesWhere = buildHonorairesRegistreTacheWhere(cabinetId, filters);

  const [entries, expenses, registreTaches] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        client: { select: { id: true, raisonSociale: true, prenom: true, nom: true } },
        dossier: {
          select: {
            id: true,
            intitule: true,
            numeroDossier: true,
            clientId: true,
            client: { select: { id: true, raisonSociale: true, prenom: true, nom: true } },
          },
        },
        user: { select: { id: true, nom: true } },
        invoice: { select: { id: true, numero: true, invoiceStatus: true } },
      },
    }),
    prisma.expense.findMany({
      where: expenseWhere,
      orderBy: { expenseDate: "desc" },
      include: {
        client: { select: { id: true, raisonSociale: true, prenom: true, nom: true } },
        invoice: { select: { id: true, numero: true, invoiceStatus: true } },
      },
    }),
    prisma.registreTache.findMany({
      where: registreTachesWhere,
      orderBy: { date: "desc" },
      include: {
        dossier: {
          select: {
            id: true,
            intitule: true,
            numeroDossier: true,
            client: { select: { id: true, raisonSociale: true, prenom: true, nom: true } },
          },
        },
        invoiceLine: {
          select: {
            invoice: { select: { id: true, numero: true, invoiceStatus: true } },
          },
        },
      },
    }),
  ]);

  // Détail par client : entrées + débours
  if (filters.clientId) {
    // Personnes physiques : `raisonSociale` est null → on retombe sur prénom+nom
    // via `clientDisplayName`, sinon le détail s'afficherait sans nom de client.
    const clientSource =
      entries[0]?.client ??
      entries[0]?.dossier?.client ??
      expenses[0]?.client ??
      registreTaches[0]?.dossier?.client ??
      null;
    const clientName = clientSource ? clientDisplayName(clientSource) : null;
    // Régime de taxes du cabinet (Derisier ON -> TVH, cabinets QC -> TPS/TVQ),
    // transmis au client pour calculer l'estimation côté UI sans taux codé en dur.
    const detailTaxConfig = await getCabinetTaxConfigById(cabinetId);
    return NextResponse.json({
      clientId: filters.clientId,
      clientName,
      taxConfig: {
        province: detailTaxConfig.province,
        mode: detailTaxConfig.mode,
        rates: detailTaxConfig.rates,
      },
      entries: entries.map((e) => ({
        id: e.id,
        kind: "time" as const,
        date: e.date,
        description: e.description,
        dureeMinutes: e.dureeMinutes,
        tauxHoraire: e.tauxHoraire,
        montant: e.feeAmount ?? e.montant,
        userId: e.userId,
        userNom: e.user.nom,
        dossierId: e.dossierId,
        dossierIntitule: e.dossier?.intitule ?? null,
        taxable: e.taxable ?? true,
        invoiceId: e.invoiceId,
        invoiceNumero: e.invoice?.numero ?? null,
        isDrafted: e.invoice?.invoiceStatus === "DRAFT" || e.invoice?.invoiceStatus === "READY_TO_ISSUE",
      })),
      expenses: expenses.map((exp) => ({
        id: exp.id,
        kind: "expense" as const,
        date: exp.expenseDate,
        description: exp.description,
        vendorName: exp.vendorName,
        amount: exp.amount,
        taxable: exp.taxable,
        dossierId: exp.matterId,
        invoiceId: exp.invoiceId,
        invoiceNumero: exp.invoice?.numero ?? null,
        isDrafted: exp.invoice?.invoiceStatus === "DRAFT" || exp.invoice?.invoiceStatus === "READY_TO_ISSUE",
      })),
      registreTaches: registreTaches.map((tache) => ({
        id: tache.id,
        kind: "registre_tache" as const,
        date: tache.date,
        description: tache.description,
        montantBase: tache.montantBase,
        ajustement: tache.ajustement,
        rabais: tache.rabais,
        rabaisRaison: tache.rabaisRaison,
        amount: tache.montantFinal,
        taxable: tache.taxable,
        dossierId: tache.dossierId,
        dossierIntitule: tache.dossier.intitule,
        invoiceId: tache.invoiceLine?.invoice?.id ?? null,
        invoiceNumero: tache.invoiceLine?.invoice?.numero ?? null,
        isDrafted:
          tache.invoiceLine?.invoice?.invoiceStatus === "DRAFT" ||
          tache.invoiceLine?.invoice?.invoiceStatus === "READY_TO_ISSUE",
      })),
    });
  }

  // Agrégation par client (time entries + expenses)
  const byClient = new Map<
    string,
    {
      clientId: string;
      clientName: string;
      count: number;
      totalHeures: number;
      totalHonoraires: number;
      totalDebours: number;
      totalForfaits: number;
      totalTaxable: number;
      lastDate: Date;
      timeEntryIds: string[];
      expenseIds: string[];
      registreTacheIds: string[];
      draftInvoiceIds: string[];
    }
  >();

  for (const e of entries) {
    // Client dérivé de la fiche ou du dossier pour que toutes les heures soient dans "honoraires à facturer"
    const effectiveClientId = e.clientId ?? e.dossier?.clientId ?? undefined;
    // Personnes physiques : `raisonSociale` est null. On compose le libellé via
    // `clientDisplayName` (prénom+nom en repli) — sans quoi l'entrée serait sautée
    // et n'apparaîtrait jamais dans "Honoraires à facturer".
    const clientSource = e.client ?? e.dossier?.client ?? null;
    const effectiveClientName = clientSource ? clientDisplayName(clientSource) : undefined;
    if (!effectiveClientId || !effectiveClientName) continue;
    const existing = byClient.get(effectiveClientId);
    const totalHeures = e.dureeMinutes / 60;
    const totalHonoraires = e.feeAmount ?? e.montant;
    const taxableAmount = (e.taxable ?? true) ? totalHonoraires : 0;
    if (!existing) {
      byClient.set(effectiveClientId, {
        clientId: effectiveClientId,
        clientName: effectiveClientName,
        count: 1,
        totalHeures,
        totalHonoraires,
        totalDebours: 0,
        totalForfaits: 0,
        totalTaxable: taxableAmount,
        lastDate: e.date,
        timeEntryIds: e.invoiceId ? [] : [e.id],
        expenseIds: [],
        registreTacheIds: [],
        draftInvoiceIds: e.invoiceId ? [e.invoiceId] : [],
      });
    } else {
      existing.count += 1;
      existing.totalHeures += totalHeures;
      existing.totalHonoraires += totalHonoraires;
      existing.totalTaxable += taxableAmount;
      if (e.invoiceId) existing.draftInvoiceIds.push(e.invoiceId);
      else existing.timeEntryIds.push(e.id);
      if (e.date > existing.lastDate) existing.lastDate = e.date;
    }
  }

  for (const exp of expenses) {
    const existing = byClient.get(exp.clientId);
    if (!existing) {
      byClient.set(exp.clientId, {
        clientId: exp.clientId,
        clientName: clientDisplayName(exp.client),
        count: 1,
        totalHeures: 0,
        totalHonoraires: 0,
        totalDebours: exp.amount,
        totalForfaits: 0,
        totalTaxable: exp.taxable ? exp.amount : 0,
        lastDate: exp.expenseDate,
        timeEntryIds: [],
        expenseIds: exp.invoiceId ? [] : [exp.id],
        registreTacheIds: [],
        draftInvoiceIds: exp.invoiceId ? [exp.invoiceId] : [],
      });
    } else {
      existing.totalDebours += exp.amount;
      existing.count += 1;
      if (exp.taxable) existing.totalTaxable += exp.amount;
      if (exp.invoiceId) existing.draftInvoiceIds.push(exp.invoiceId);
      else existing.expenseIds.push(exp.id);
      if (exp.expenseDate > existing.lastDate) existing.lastDate = exp.expenseDate;
    }
  }

  for (const tache of registreTaches) {
    const effectiveClientId = tache.clientId ?? tache.dossier.client?.id ?? undefined;
    const effectiveClientName = tache.dossier.client
      ? clientDisplayName(tache.dossier.client)
      : undefined;
    if (!effectiveClientId || !effectiveClientName) continue;
    const existing = byClient.get(effectiveClientId);
    if (!existing) {
      byClient.set(effectiveClientId, {
        clientId: effectiveClientId,
        clientName: effectiveClientName,
        count: 1,
        totalHeures: 0,
        totalHonoraires: 0,
        totalDebours: 0,
        totalForfaits: tache.montantFinal,
        totalTaxable: tache.taxable ? tache.montantFinal : 0,
        lastDate: tache.date,
        timeEntryIds: [],
        expenseIds: [],
        registreTacheIds: tache.invoiceLine?.invoice?.id ? [] : [tache.id],
        draftInvoiceIds: tache.invoiceLine?.invoice?.id ? [tache.invoiceLine.invoice.id] : [],
      });
    } else {
      existing.totalForfaits += tache.montantFinal;
      existing.count += 1;
      if (tache.taxable) existing.totalTaxable += tache.montantFinal;
      if (tache.invoiceLine?.invoice?.id) existing.draftInvoiceIds.push(tache.invoiceLine.invoice.id);
      else existing.registreTacheIds.push(tache.id);
      if (tache.date > existing.lastDate) existing.lastDate = tache.date;
    }
  }

  // Taxes estimées province-aware : régime du cabinet (Derisier ON -> TVH 13 %,
  // cabinets QC -> TPS + TVQ). Source de vérité = config du cabinet (modules).
  const taxConfig = await getCabinetTaxConfigById(cabinetId);
  const rows = Array.from(byClient.values()).map((row) => {
    const subtotal = row.totalHonoraires + row.totalDebours + row.totalForfaits;
    const taxesEstimees = applyTaxes(row.totalTaxable, true, taxConfig).taxesTotal;
    const totalAFacturer = subtotal + taxesEstimees;
    return {
      ...row,
      count: row.count,
      draftInvoiceIds: Array.from(new Set(row.draftInvoiceIds)),
      taxesEstimees,
      totalAFacturer: Math.round(totalAFacturer * 100) / 100,
    };
  });

  return NextResponse.json({ rows });
}
