/**
 * Chargement des registres réglementaires.
 *
 * Alimente chaque registre depuis le registre append-only (PR-1) et le rend au
 * format commun. Aucune donnée n'est recalculée différemment ici : le journal, les
 * cartes-clients et le rapport mensuel lisent tous la même source, sinon un
 * inspecteur qui les recoupe trouverait trois vérités.
 *
 * Réf. art. 30 B-1 r.5 (copies immédiates) · s. 21(2) By-Law 9 (paper copy promptly).
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import { getRegister, type RegisterId } from "@/lib/compliance/registers";
import { renderRegister, type RegisterRow, type RenderedRegister } from "./register-render";
import { periodBounds } from "./monthly-report-service";

export interface LoadRegisterParams {
  cabinetId: string;
  registerId: RegisterId;
  /** Période "YYYY-MM". Omise, le registre couvre tout l'historique. */
  periode?: string | null;
  trustBankAccountId?: string | null;
  generatedBy: string;
  regulatoryColumnsOnly?: boolean;
}

/**
 * Charge et rend un registre.
 *
 * La production d'un registre est JOURNALISÉE. Un inspecteur qui reçoit une copie
 * doit pouvoir vérifier quand elle a été produite et par qui ; et le cabinet doit
 * pouvoir montrer qu'il a bien produit ce qui lui a été demandé.
 */
export async function loadRegister(params: LoadRegisterParams): Promise<RenderedRegister> {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));
  const definition = getRegister(params.registerId, province);
  if (!definition) {
    throw new Error(
      `Le registre ${params.registerId} ne s'applique pas au régime ${province}. ` +
        "Le produire reviendrait à inventer une obligation.",
    );
  }

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: params.cabinetId },
    select: { nom: true },
  });

  const account = params.trustBankAccountId
    ? await prisma.trustBankAccount.findFirst({
        where: { id: params.trustBankAccountId, cabinetId: params.cabinetId },
        select: { accountLabel: true, accountNumberLast4: true },
      })
    : null;

  const bounds = params.periode ? periodBounds(params.periode) : null;
  const periodLabel = params.periode
    ? `Période ${params.periode}`
    : "Historique complet";

  const rows = await loadRows({
    cabinetId: params.cabinetId,
    registerId: params.registerId,
    trustBankAccountId: params.trustBankAccountId ?? null,
    bounds,
    province,
  });

  const rendered = renderRegister({
    definition,
    province,
    rows,
    cabinetName: cabinet?.nom ?? "Cabinet",
    accountLabel: account
      ? `${account.accountLabel} (•••• ${account.accountNumberLast4})`
      : null,
    periodLabel,
    generatedBy: params.generatedBy,
    regulatoryColumnsOnly: params.regulatoryColumnsOnly,
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.generatedBy,
    entityType: "TrustAccount",
    entityId: params.registerId,
    action: "download",
    metadata: { register: params.registerId, periode: params.periode ?? null },
    newValues: { rowCount: rendered.rowCount, fingerprint: rendered.fingerprint },
    performedBy: params.generatedBy,
    performedAt: new Date(),
  });

  return rendered;
}

/* ════════════════════════════════════════════════════════════════
   CHARGEURS PAR REGISTRE
   ════════════════════════════════════════════════════════════════ */

async function loadRows(params: {
  cabinetId: string;
  registerId: RegisterId;
  trustBankAccountId: string | null;
  bounds: { start: Date; end: Date } | null;
  province: CabinetProvince;
}): Promise<RegisterRow[]> {
  switch (params.registerId) {
    case "TRUST_CASH_JOURNAL":
      return loadTrustCashJournal(params);
    case "CLIENT_LEDGERS":
      return loadClientLedgers(params);
    case "PARTICULAR_ACCOUNT_LEDGERS":
      return loadParticularLedgers(params);
    case "CHEQUE_REGISTER":
      return loadChequeRegister(params);
    case "ADMIN_CASH_JOURNAL":
      return loadAdminCashJournal(params);
    case "FEES_BOOK":
      return loadFeesBook(params);
    case "ACTIVE_MATTERS":
      return loadMatters(params, true);
    case "CLOSED_MATTERS":
      return loadMatters(params, false);
  }
}

const dateFilter = (bounds: { start: Date; end: Date } | null) =>
  bounds ? { gte: bounds.start, lte: bounds.end } : undefined;

/** Art. 38 QC / s. 18(1)(2) ON — chronologique, avec solde courant. */
async function loadTrustCashJournal(params: {
  cabinetId: string;
  trustBankAccountId: string | null;
  bounds: { start: Date; end: Date } | null;
}): Promise<RegisterRow[]> {
  // Solde d'ouverture : toutes les écritures antérieures à la période. Sans lui, la
  // colonne « solde après chaque inscription » (art. 38(1)h) serait fausse dès la
  // première ligne d'un registre filtré sur un mois.
  let running = 0;
  if (params.bounds) {
    const before = await prisma.trustTransaction.aggregate({
      where: {
        cabinetId: params.cabinetId,
        ...(params.trustBankAccountId ? { trustBankAccountId: params.trustBankAccountId } : {}),
        date: { lt: params.bounds.start },
      },
      _sum: { amount: true },
    });
    running = before._sum.amount ?? 0;
  }

  const tx = await prisma.trustTransaction.findMany({
    where: {
      cabinetId: params.cabinetId,
      ...(params.trustBankAccountId ? { trustBankAccountId: params.trustBankAccountId } : {}),
      ...(params.bounds ? { date: dateFilter(params.bounds) } : {}),
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: {
      client: { select: { raisonSociale: true, prenom: true, nom: true } },
      dossier: { select: { numeroDossier: true, intitule: true } },
    },
  });

  return tx.map((t) => {
    running = Math.round((running + t.amount) * 100) / 100;
    return {
      date: t.date,
      payerOrPayee: t.amount >= 0 ? t.payerName : t.payeeName,
      clientName: t.client ? clientDisplayName(t.client, "") : null,
      dossierRef: dossierRef(t.dossier),
      purpose: t.purposeText ?? t.purposeCode ?? t.description,
      method: t.modePaiement,
      chequeNumber: t.chequeNumber,
      cash: t.isCash,
      receipt: t.amount > 0 ? t.amount : null,
      disbursement: t.amount < 0 ? Math.abs(t.amount) : null,
      balance: running,
    };
  });
}

/**
 * Art. 39 QC / s. 18(3) ON — séparément pour chaque client et chaque dossier.
 *
 * Le solde court PAR CARTE, pas globalement : c'est « le nouveau solde après chaque
 * inscription » de l'art. 39(1)f, propre à la carte-client concernée.
 */
async function loadClientLedgers(params: {
  cabinetId: string;
  trustBankAccountId: string | null;
  bounds: { start: Date; end: Date } | null;
}): Promise<RegisterRow[]> {
  const tx = await prisma.trustTransaction.findMany({
    where: {
      cabinetId: params.cabinetId,
      ...(params.trustBankAccountId ? { trustBankAccountId: params.trustBankAccountId } : {}),
      ...(params.bounds ? { date: dateFilter(params.bounds) } : {}),
    },
    orderBy: [{ clientId: "asc" }, { dossierId: "asc" }, { date: "asc" }, { createdAt: "asc" }],
    include: {
      client: { select: { raisonSociale: true, prenom: true, nom: true } },
      dossier: { select: { numeroDossier: true, intitule: true } },
    },
  });

  const balances = new Map<string, number>();
  return tx.map((t) => {
    const key = `${t.clientId}::${t.dossierId ?? ""}`;
    const next = Math.round(((balances.get(key) ?? 0) + t.amount) * 100) / 100;
    balances.set(key, next);
    return {
      clientName: t.client ? clientDisplayName(t.client, "") : t.clientId,
      dossierRef: dossierRef(t.dossier),
      date: t.date,
      counterparty: t.amount >= 0 ? t.payerName : t.payeeName,
      purpose: t.purposeText ?? t.purposeCode ?? t.description,
      receipt: t.amount > 0 ? t.amount : null,
      disbursement: t.amount < 0 ? Math.abs(t.amount) : null,
      balance: next,
    };
  });
}

/** Art. 66 QC — cartes-clients des comptes particuliers. Québec seulement. */
async function loadParticularLedgers(params: {
  cabinetId: string;
  bounds: { start: Date; end: Date } | null;
}): Promise<RegisterRow[]> {
  const accounts = await prisma.trustBankAccount.findMany({
    where: { cabinetId: params.cabinetId, type: "PARTICULIER" },
    include: { client: { select: { raisonSociale: true, prenom: true, nom: true } } },
  });
  if (accounts.length === 0) return [];

  const tx = await prisma.trustTransaction.findMany({
    where: {
      cabinetId: params.cabinetId,
      trustBankAccountId: { in: accounts.map((a) => a.id) },
      ...(params.bounds ? { date: dateFilter(params.bounds) } : {}),
    },
    orderBy: [{ trustBankAccountId: "asc" }, { date: "asc" }],
  });

  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const balances = new Map<string, number>();

  return tx.map((t) => {
    const acc = t.trustBankAccountId ? accountById.get(t.trustBankAccountId) : null;
    const key = t.trustBankAccountId ?? "";
    const next = Math.round(((balances.get(key) ?? 0) + t.amount) * 100) / 100;
    balances.set(key, next);
    return {
      accountLabel: acc?.accountLabel ?? null,
      clientName: acc?.client ? clientDisplayName(acc.client, "") : null,
      date: t.date,
      nature: t.purposeText ?? t.purposeCode ?? t.description,
      inflow: t.amount > 0 ? t.amount : null,
      outflow: t.amount < 0 ? Math.abs(t.amount) : null,
      balance: next,
    };
  });
}

/** Art. 61 QC / s. 18(2) ON — registre des chèques, ordonné par numéro. */
async function loadChequeRegister(params: {
  cabinetId: string;
  trustBankAccountId: string | null;
  bounds: { start: Date; end: Date } | null;
}): Promise<RegisterRow[]> {
  const cheques = await prisma.trustCheque.findMany({
    where: {
      cabinetId: params.cabinetId,
      ...(params.trustBankAccountId ? { trustBankAccountId: params.trustBankAccountId } : {}),
      ...(params.bounds ? { issueDate: dateFilter(params.bounds) } : {}),
    },
    orderBy: { chequeNumber: "asc" },
  });

  const clientIds = [...new Set(cheques.map((c) => c.clientId).filter(Boolean) as string[])];
  const dossierIds = [...new Set(cheques.map((c) => c.dossierId).filter(Boolean) as string[])];
  const [clients, dossiers] = await Promise.all([
    clientIds.length
      ? prisma.client.findMany({
          where: { id: { in: clientIds } },
          select: { id: true, raisonSociale: true, prenom: true, nom: true },
        })
      : Promise.resolve([]),
    dossierIds.length
      ? prisma.dossier.findMany({
          where: { id: { in: dossierIds } },
          select: { id: true, numeroDossier: true, intitule: true },
        })
      : Promise.resolve([]),
  ]);
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const dossierById = new Map(dossiers.map((d) => [d.id, d]));

  return cheques.map((c) => ({
    chequeNumber: c.chequeNumber,
    issueDate: c.issueDate,
    payeeName: c.payeeName,
    clientName: c.clientId ? clientDisplayName(clientById.get(c.clientId)!, "") : null,
    dossierRef: c.dossierId ? dossierRef(dossierById.get(c.dossierId)) : null,
    status: c.status,
    amount: c.amount,
  }));
}

/** Art. 34 QC / s. 18(5)(6) ON — journal de caisse d'administration. */
async function loadAdminCashJournal(params: {
  cabinetId: string;
  bounds: { start: Date; end: Date } | null;
}): Promise<RegisterRow[]> {
  const entries = await prisma.journalGeneralEntry.findMany({
    where: {
      cabinetId: params.cabinetId,
      // Le journal d'administration exclut les flux fidéicommis : ce sont deux
      // comptabilités distinctes (art. 34 vs art. 38), et les mélanger serait
      // exactement le commingling que le règlement interdit.
      sourceModule: { not: "FIDEICOMMIS" },
      ...(params.bounds ? { dateTransaction: dateFilter(params.bounds) } : {}),
    },
    orderBy: [{ dateTransaction: "asc" }, { createdAt: "asc" }],
    include: {
      client: { select: { raisonSociale: true, prenom: true, nom: true } },
      dossier: { select: { numeroDossier: true, intitule: true } },
    },
  });

  return entries.map((e) => ({
    date: e.dateTransaction,
    payerOrPayee: e.montantEntree > 0 ? e.payerName : e.payeeName,
    clientName: e.client ? clientDisplayName(e.client, "") : null,
    dossierRef: dossierRef(e.dossier),
    purpose: e.purposeText ?? e.description,
    documentIdentifier: e.documentIdentifier ?? e.reference,
    cash: e.isCash,
    receipt: e.montantEntree > 0 ? e.montantEntree : null,
    disbursement: e.montantSortie > 0 ? e.montantSortie : null,
  }));
}

/** s. 18(7) ON — livre des honoraires. Au Québec, découle de l'art. 28. */
async function loadFeesBook(params: {
  cabinetId: string;
  bounds: { start: Date; end: Date } | null;
}): Promise<RegisterRow[]> {
  const invoices = await prisma.invoice.findMany({
    where: {
      cabinetId: params.cabinetId,
      // Un brouillon n'est pas une facture : le livre des honoraires recense « all
      // fees charged and other billings MADE to clients ».
      invoiceStatus: { in: ["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"] },
      ...(params.bounds ? { dateEmission: dateFilter(params.bounds) } : {}),
    },
    orderBy: [{ dateEmission: "asc" }, { numero: "asc" }],
    include: {
      client: { select: { raisonSociale: true, prenom: true, nom: true } },
      dossier: { select: { numeroDossier: true, intitule: true } },
    },
  });

  return invoices.map((i) => ({
    numero: i.numero,
    date: i.dateEmission,
    clientName: i.client ? clientDisplayName(i.client, "") : null,
    dossierRef: dossierRef(i.dossier),
    fees: i.subtotalFees,
    disbursements: i.subtotalExpenses + i.deboursNonTaxableTotal,
    taxes: i.taxTotal,
    total: i.totalInvoiceAmount || i.montantTotal,
  }));
}

/** Art. 9 QC — liste des dossiers actifs et des dossiers fermés sur 7 ans. */
async function loadMatters(
  params: { cabinetId: string },
  active: boolean,
): Promise<RegisterRow[]> {
  // « au cours des 7 dernières années » : la liste des dossiers fermés ne remonte
  // pas au-delà. Un dossier fermé il y a huit ans n'a pas à y figurer.
  const sevenYearsAgo = new Date();
  sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

  const dossiers = await prisma.dossier.findMany({
    where: {
      cabinetId: params.cabinetId,
      ...(active
        ? { statut: { not: "archive" } }
        : { statut: "archive", updatedAt: { gte: sevenYearsAgo } }),
    },
    orderBy: [{ numeroDossier: "asc" }],
    include: { client: { select: { raisonSociale: true, prenom: true, nom: true } } },
  });

  return dossiers.map((d) => ({
    numeroDossier: d.numeroDossier,
    intitule: d.intitule,
    clientName: d.client ? clientDisplayName(d.client, "") : null,
    openedAt: d.createdAt,
    ...(active ? {} : { closedAt: d.updatedAt, retentionUntil: null }),
  }));
}

function dossierRef(
  d: { numeroDossier: string | null; intitule: string } | null | undefined,
): string | null {
  if (!d) return null;
  return `${d.numeroDossier ?? ""} ${d.intitule}`.trim() || null;
}
