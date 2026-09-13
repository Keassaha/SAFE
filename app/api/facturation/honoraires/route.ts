import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import { facturationHonorairesQuerySchema } from "@/lib/validations/facturation";
import { getCabinetTaxConfigById } from "@/lib/billing/cabinet-tax-config";
import {
  buildUnsentBillableTimeEntryWhere,
  buildHonorairesRegistreTacheWhere,
} from "@/lib/billing/queries";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import { regrouperHonorairesParDossier } from "@/lib/billing/honoraires-par-dossier";
import { getSeuilFacturationById } from "@/lib/services/billing/seuil-facturation";
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

  const [entries, expenses, registreTaches, deboursDossiers, seuil] = await Promise.all([
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
            clientId: true,
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
    /* LES VRAIS DÉBOURS. `Expense` n'est rempli par rien dans le produit ; les
       débours saisis sur un dossier vivent dans `DeboursDossier`. Sans eux, la
       colonne « Débours » de la section restait à zéro quoi qu'on saisisse. */
    prisma.deboursDossier.findMany({
      where: {
        cabinetId,
        refacturable: true,
        ...(filters.dossierId ? { dossierId: filters.dossierId } : {}),
        ...(filters.clientId ? { clientId: filters.clientId } : {}),
        ...(filters.dateFrom || filters.dateTo
          ? {
              date: {
                ...(filters.dateFrom && { gte: filters.dateFrom }),
                ...(filters.dateTo && { lte: filters.dateTo }),
              },
            }
          : {}),
        OR: [
          { statutDebours: "NON_FACTURE", factureId: null },
          { facture: { invoiceStatus: { in: [...NOT_SENT_INVOICE_STATUSES] } } },
        ],
      },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        montant: true,
        taxable: true,
        clientId: true,
        dossierId: true,
        dossier: {
          select: {
            id: true,
            intitule: true,
            numeroDossier: true,
            clientId: true,
            client: { select: { id: true, raisonSociale: true, prenom: true, nom: true } },
          },
        },
        facture: { select: { id: true, invoiceStatus: true } },
      },
    }),
    getSeuilFacturationById(cabinetId),
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
      seuil,
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

  // Une ligne par dossier. Le regroupement vit dans un module pur, testé :
  // `lib/billing/honoraires-par-dossier.ts`. Ici on ne fait que traduire les
  // formes Prisma vers les siennes.
  const taxConfig = await getCabinetTaxConfigById(cabinetId);
  const rows = regrouperHonorairesParDossier(
    {
      fiches: entries.map((e) => ({
        id: e.id,
        date: e.date,
        dureeMinutes: e.dureeMinutes,
        montant: e.montant,
        feeAmount: e.feeAmount,
        taxable: e.taxable,
        clientId: e.clientId,
        client: e.client,
        dossierId: e.dossierId,
        dossier: e.dossier,
        userNom: e.user?.nom ?? null,
        invoiceId: e.invoiceId,
        invoiceStatus: e.invoice?.invoiceStatus ?? null,
      })),
      expenses: expenses.map((x) => ({
        id: x.id,
        date: x.expenseDate,
        amount: x.amount,
        taxable: x.taxable,
        clientId: x.clientId,
        client: x.client,
        // `Expense.matterId` n'est pas chargé avec son dossier : ces débours
        // tombent sous le client, en ligne « sans dossier ».
        dossierId: null,
        dossier: null,
        invoiceId: x.invoiceId,
        invoiceStatus: x.invoice?.invoiceStatus ?? null,
      })),
      debours: deboursDossiers.map((d) => ({
        id: d.id,
        date: d.date,
        montant: d.montant,
        taxable: d.taxable,
        clientId: d.clientId,
        dossierId: d.dossierId,
        dossier: d.dossier,
        invoiceId: d.facture?.id ?? null,
        invoiceStatus: d.facture?.invoiceStatus ?? null,
      })),
      taches: registreTaches.map((t) => ({
        id: t.id,
        date: t.date,
        montantFinal: t.montantFinal,
        taxable: t.taxable,
        clientId: t.clientId,
        dossierId: t.dossierId,
        dossier: t.dossier,
        invoiceId: t.invoiceLine?.invoice?.id ?? null,
        invoiceStatus: t.invoiceLine?.invoice?.invoiceStatus ?? null,
      })),
    },
    taxConfig,
    seuil,
  );

  return NextResponse.json({ rows, seuil });
}
