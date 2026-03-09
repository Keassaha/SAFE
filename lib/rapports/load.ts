/**
 * Chargement des données pour la page Rapports.
 */

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { getGlobalTrustBalance } from "@/lib/services/fideicommis";
import type {
  RapportsPayload,
  RapportFacturationRow,
  ComptesRecevoirAging,
  PerformanceAvocatRow,
  RentabiliteDossierRow,
  RapportFideicommisSummary,
  RapportTaxesSummary,
  RapportDeboursRow,
} from "./types";

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Fév", "03": "Mar", "04": "Avr", "05": "Mai", "06": "Juin",
  "07": "Juil", "08": "Août", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Déc",
};

function getStatutLabel(statut: string): string {
  const map: Record<string, string> = {
    brouillon: "Brouillon",
    envoyee: "Envoyée",
    partiellement_payee: "Partiellement payée",
    payee: "Payée",
    en_retard: "En retard",
    DRAFT: "Brouillon",
    READY_TO_ISSUE: "Prête",
    ISSUED: "Émise",
    PARTIALLY_PAID: "Partiellement payée",
    PAID: "Payée",
    OVERDUE: "En retard",
    CANCELLED: "Annulée",
    CREDITED: "Créditée",
  };
  return map[statut] ?? statut;
}

interface LoadFilters {
  dateDebut: Date;
  dateFin: Date;
  clientId: string | null;
  userId: string | null;
  statut: string | null;
}

export async function loadRapportsPayload(
  cabinetId: string,
  filters: LoadFilters
): Promise<RapportsPayload> {
  const { dateDebut, dateFin, clientId, userId, statut } = filters;

  const invoiceWhere: Prisma.InvoiceWhereInput = {
    cabinetId,
    dateEmission: { gte: dateDebut, lte: dateFin },
    ...(clientId ? { clientId } : {}),
    ...(userId ? { dossier: { avocatResponsableId: userId } } : {}),
    ...(statut
      ? { statut: statut as "brouillon" | "envoyee" | "partiellement_payee" | "payee" | "en_retard" }
      : { statut: { not: "brouillon" as const } }),
  };

  const [
    invoices,
    paymentsInPeriod,
    outstandingAggregate,
    timeEntries,
    trustBalance,
    deboursList,
    clients,
    users,
    dossiers,
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: invoiceWhere,
      include: {
        client: { select: { raisonSociale: true } },
        dossier: { select: { intitule: true, avocatResponsableId: true } },
      },
      orderBy: { dateEmission: "desc" },
    }),
    prisma.payment.findMany({
      where: {
        cabinetId,
        datePaiement: { gte: dateDebut, lte: dateFin },
        ...(clientId ? { clientId } : {}),
      },
      select: { montant: true },
    }),
    prisma.invoice.aggregate({
      where: {
        cabinetId,
        statut: { in: ["envoyee", "partiellement_payee", "en_retard"] },
        ...(clientId ? { clientId } : {}),
      },
      _sum: { balanceDue: true },
    }),
    prisma.timeEntry.findMany({
      where: {
        cabinetId,
        date: { gte: dateDebut, lte: dateFin },
        ...(userId ? { userId } : {}),
      },
      include: { user: { select: { nom: true } } },
    }),
    getGlobalTrustBalance(cabinetId),
    prisma.deboursDossier.findMany({
      where: {
        cabinetId,
        date: { gte: dateDebut, lte: dateFin },
        ...(clientId ? { clientId } : {}),
      },
      include: {
        client: { select: { raisonSociale: true } },
        dossier: { select: { intitule: true } },
        facture: { select: { numero: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.client.findMany({
      where: { cabinetId },
      select: { id: true, raisonSociale: true },
      orderBy: { raisonSociale: "asc" },
    }),
    prisma.user.findMany({
      where: { cabinetId },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    prisma.dossier.findMany({
      where: {
        cabinetId,
        ...(clientId ? { clientId } : {}),
      },
      include: {
        client: { select: { raisonSociale: true } },
        avocatResponsable: { select: { nom: true } },
      },
    }),
  ]);

  const totalInvoiced = invoices.reduce((s, i) => s + (i.totalInvoiceAmount ?? i.montantTotal ?? 0), 0);
  const totalPaid = paymentsInPeriod.reduce((s, p) => s + p.montant, 0);
  const facturesImpayees = outstandingAggregate._sum.balanceDue ?? 0;
  const outstandingInvoicesForAging = await prisma.invoice.findMany({
    where: {
      cabinetId,
      statut: { in: ["envoyee", "partiellement_payee", "en_retard"] },
      ...(clientId ? { clientId } : {}),
    },
    select: { id: true, dateEcheance: true, balanceDue: true, montantTotal: true, montantPaye: true },
  });

  const unbilledTime = timeEntries.filter((t) => t.statut !== "facture" && t.facturable);
  const heuresFacturablesMinutes = unbilledTime.reduce((s, t) => s + (t.dureeMinutes ?? 0), 0);
  const billedMinutes = timeEntries.filter((t) => t.statut === "facture").reduce((s, t) => s + (t.dureeMinutes ?? 0), 0);
  const totalWorkedMinutes = timeEntries.reduce((s, t) => s + (t.dureeMinutes ?? 0), 0);
  const tauxRealisation =
    totalWorkedMinutes > 0
      ? Math.round((billedMinutes / totalWorkedMinutes) * 100)
      : 0;

  const byMonth: Record<string, number> = {};
  for (const i of invoices) {
    const d = new Date(i.dateEmission);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + (i.totalInvoiceAmount ?? i.montantTotal ?? 0);
  }
  const months: { monthKey: string; label: string; value: number }[] = [];
  const start = new Date(dateDebut);
  const end = new Date(dateFin);
  for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      monthKey: key,
      label: MONTH_LABELS[String(d.getMonth() + 1).padStart(2, "0")] ?? key,
      value: byMonth[key] ?? 0,
    });
  }
  months.reverse();

  const facturationRows: RapportFacturationRow[] = invoices.map((inv) => {
    const ht = inv.subtotalBeforeTax ?? inv.subtotalTaxable ?? inv.montantTotal - (inv.tps ?? 0) - (inv.tvq ?? 0);
    const taxes = (inv.taxTotal ?? (inv.tps ?? 0) + (inv.tvq ?? 0));
    const total = inv.totalInvoiceAmount ?? inv.montantTotal ?? 0;
    const paid = inv.totalPaidAmount ?? inv.montantPaye ?? 0;
    const solde = inv.balanceDue ?? total - paid;
    const avocatName = inv.dossier?.avocatResponsableId
      ? users.find((u) => u.id === inv.dossier?.avocatResponsableId)?.nom ?? null
      : null;
    return {
      id: inv.id,
      numero: inv.numero,
      client: inv.client.raisonSociale,
      dossier: inv.dossier?.intitule ?? null,
      avocat: avocatName,
      date: inv.dateEmission.toISOString().slice(0, 10),
      montantHT: ht,
      taxes,
      total,
      paiementRecu: paid,
      solde,
      statut: getStatutLabel(inv.statut),
    };
  });

  const now = new Date();
  const agingBuckets: ComptesRecevoirAging[] = [
    { range: "0-30", label: "0-30 jours", montant: 0, count: 0 },
    { range: "30-60", label: "31-60 jours", montant: 0, count: 0 },
    { range: "60-90", label: "61-90 jours", montant: 0, count: 0 },
    { range: "90+", label: "90+ jours", montant: 0, count: 0 },
  ];
  for (const inv of outstandingInvoicesForAging) {
    const due = new Date(inv.dateEcheance);
    const days = Math.floor((now.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
    const amount = inv.balanceDue ?? (inv.montantTotal - inv.montantPaye);
    if (days <= 30) {
      agingBuckets[0].montant += amount;
      agingBuckets[0].count += 1;
    } else if (days <= 60) {
      agingBuckets[1].montant += amount;
      agingBuckets[1].count += 1;
    } else if (days <= 90) {
      agingBuckets[2].montant += amount;
      agingBuckets[2].count += 1;
    } else {
      agingBuckets[3].montant += amount;
      agingBuckets[3].count += 1;
    }
  }

  const byUser = new Map<
    string,
    { nom: string; minutesWorked: number; minutesBilled: number; revenus: number }
  >();
  for (const te of timeEntries) {
    const cur = byUser.get(te.userId) ?? { nom: te.user.nom, minutesWorked: 0, minutesBilled: 0, revenus: 0 };
    cur.minutesWorked += te.dureeMinutes ?? 0;
    if (te.statut === "facture") {
      cur.minutesBilled += te.dureeMinutes ?? 0;
      cur.revenus += te.montant ?? 0;
    }
    byUser.set(te.userId, cur);
  }
  const performanceAvocats: PerformanceAvocatRow[] = Array.from(byUser.entries()).map(([uid, data]) => ({
    userId: uid,
    nom: data.nom,
    heuresTravaillees: Math.round((data.minutesWorked / 60) * 100) / 100,
    heuresFacturees: Math.round((data.minutesBilled / 60) * 100) / 100,
    revenusGeneres: data.revenus,
    tauxHoraireMoyen: data.minutesBilled > 0 ? data.revenus / (data.minutesBilled / 60) : 0,
    tauxRealisation: data.minutesWorked > 0 ? Math.round((data.minutesBilled / data.minutesWorked) * 100) : 0,
  }));

  const paymentsByDossier = new Map<string, number>();
  const invoicedByDossier = new Map<string, number>();
  const hoursByDossier = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.dossierId) {
      invoicedByDossier.set(inv.dossierId, (invoicedByDossier.get(inv.dossierId) ?? 0) + (inv.totalInvoiceAmount ?? inv.montantTotal ?? 0));
    }
  }
  const paymentAllocs = await prisma.paymentAllocation.findMany({
    where: {
      payment: { cabinetId, datePaiement: { gte: dateDebut, lte: dateFin } },
    },
    include: { invoice: { select: { dossierId: true } } },
  });
  for (const a of paymentAllocs) {
    if (a.invoice.dossierId) {
      paymentsByDossier.set(a.invoice.dossierId, (paymentsByDossier.get(a.invoice.dossierId) ?? 0) + a.allocatedAmount);
    }
  }
  for (const te of timeEntries) {
    if (te.dossierId) {
      hoursByDossier.set(te.dossierId, (hoursByDossier.get(te.dossierId) ?? 0) + (te.dureeMinutes ?? 0) / 60);
    }
  }
  const rentabiliteDossiers: RentabiliteDossierRow[] = dossiers.map((d) => {
    const revenus = invoicedByDossier.get(d.id) ?? 0;
    const heures = hoursByDossier.get(d.id) ?? 0;
    const paiements = paymentsByDossier.get(d.id) ?? 0;
    return {
      dossierId: d.id,
      intitule: d.intitule,
      client: d.client.raisonSociale,
      revenus,
      heures: Math.round(heures * 100) / 100,
      paiements,
      profitEstime: paiements,
    };
  }).filter((r) => r.revenus > 0 || r.heures > 0);

  const trustTxInPeriod = await prisma.trustTransaction.findMany({
    where: { cabinetId, date: { gte: dateDebut, lte: dateFin } },
    select: { amount: true, type: true },
  });
  let depots = 0;
  let utilisations = 0;
  for (const tx of trustTxInPeriod) {
    if (tx.type === "deposit") depots += tx.amount;
    else if (tx.type === "withdrawal") utilisations += Math.abs(tx.amount);
  }
  const fideicommis: RapportFideicommisSummary = {
    depots,
    utilisations,
    solde: trustBalance,
    transactionsCount: trustTxInPeriod.length,
  };

  const totalTPS = invoices.reduce((s, i) => s + (i.taxGst ?? i.tps ?? 0), 0);
  const totalTVQ = invoices.reduce((s, i) => s + (i.taxQst ?? i.tvq ?? 0), 0);
  const taxes: RapportTaxesSummary = {
    tpsCollectee: totalTPS,
    tvqCollectee: totalTVQ,
    total: totalTPS + totalTVQ,
  };

  const deboursRows: RapportDeboursRow[] = deboursList.map((d) => ({
    id: d.id,
    date: d.date.toISOString().slice(0, 10),
    client: d.client.raisonSociale,
    dossier: d.dossier?.intitule ?? null,
    description: d.description,
    montant: d.montant,
    factureNumero: d.facture?.numero ?? null,
  }));

  return {
    filters: {
      dateDebut: dateDebut.toISOString().slice(0, 10),
      dateFin: dateFin.toISOString().slice(0, 10),
      clientId,
      userId,
      statut,
    },
    kpis: {
      revenusFactures: totalInvoiced,
      paiementsRecus: totalPaid,
      facturesImpayees: facturesImpayees,
      soldeFideicommis: trustBalance,
      heuresFacturables: Math.round((heuresFacturablesMinutes / 60) * 100) / 100,
      tauxRealisation,
    },
    revenueByMonth: months,
    facturationRows,
    comptesRecevoir: agingBuckets,
    performanceAvocats,
    rentabiliteDossiers,
    fideicommis,
    taxes,
    deboursRows,
    annuelImpots: {
      totalRevenus: totalInvoiced,
      totalTPS,
      totalTVQ,
      totalPaiements: totalPaid,
    },
    clients: clients.map((c) => ({ id: c.id, label: c.raisonSociale })),
    avocats: users.map((u) => ({ id: u.id, label: u.nom })),
  };
}
