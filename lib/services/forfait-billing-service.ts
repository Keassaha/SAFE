/**
 * Service de facturation forfaitaire.
 * Gère la grille de forfaits, le registre de tâches, et la génération de factures.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";

// ─── FORFAIT SERVICES (CATALOGUE) ───

export async function getForfaitServices(cabinetId: string, categorie?: string) {
  return prisma.forfaitService.findMany({
    where: {
      cabinetId,
      actif: true,
      ...(categorie ? { categorie: categorie as never } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { nom: "asc" }],
  });
}

export async function createForfaitService(params: {
  cabinetId: string;
  code: string;
  nom: string;
  description?: string;
  montant: number;
  categorie?: string;
  sousType?: string;
  taxable?: boolean;
  userId: string;
}) {
  const { cabinetId, code, nom, description, montant, categorie, sousType, taxable = true, userId } = params;

  const service = await prisma.forfaitService.create({
    data: {
      cabinetId,
      code: code.toUpperCase(),
      nom,
      description,
      montant,
      categorie: categorie as never ?? null,
      sousType: sousType ?? null,
      taxable,
    },
  });

  await createAuditLog({
    cabinetId, userId, entityType: "Invoice", entityId: service.id,
    action: "create", metadata: { type: "forfait_service", code, nom, montant },
    performedBy: userId, performedAt: new Date(),
  });

  return service;
}

export async function updateForfaitService(params: {
  id: string;
  cabinetId: string;
  data: { nom?: string; montant?: number; description?: string; taxable?: boolean; actif?: boolean };
  userId: string;
}) {
  const { id, cabinetId, data, userId } = params;

  const updated = await prisma.forfaitService.updateMany({
    where: { id, cabinetId },
    data,
  });

  await createAuditLog({
    cabinetId, userId, entityType: "Invoice", entityId: id,
    action: "update", metadata: { type: "forfait_service_update", ...data },
    performedBy: userId, performedAt: new Date(),
  });

  return updated;
}

// ─── REGISTRE DE TÂCHES ───

export async function getRegistreTaches(params: {
  cabinetId: string;
  dossierId?: string;
  statut?: string;
  clientId?: string;
}) {
  const { cabinetId, dossierId, statut, clientId } = params;

  return prisma.registreTache.findMany({
    where: {
      cabinetId,
      ...(dossierId ? { dossierId } : {}),
      ...(statut ? { statut } : {}),
      ...(clientId ? { clientId } : {}),
    },
    orderBy: { date: "desc" },
    include: {
      forfaitService: { select: { code: true, nom: true } },
      dossier: { select: { intitule: true, numeroDossier: true } },
    },
  });
}

export async function ajouterTache(params: {
  cabinetId: string;
  dossierId: string;
  clientId?: string;
  forfaitServiceId?: string;
  description?: string;
  montantOverride?: number;
  ajustement?: number;
  rabais?: number;
  rabaisRaison?: string;
  taxable?: boolean;
  date?: Date;
  userId: string;
}) {
  const {
    cabinetId, dossierId, clientId, forfaitServiceId,
    description: descOverride, montantOverride, ajustement = 0,
    rabais = 0, rabaisRaison, taxable: taxableOverride, date, userId,
  } = params;

  // If linking to a forfait service, pre-fill from catalogue
  let description = descOverride ?? "";
  let montantBase = montantOverride ?? 0;
  let taxable = taxableOverride ?? true;

  if (forfaitServiceId) {
    const service = await prisma.forfaitService.findFirst({
      where: { id: forfaitServiceId, cabinetId },
    });
    if (!service) throw new Error("Forfait service not found");
    description = descOverride || service.nom;
    montantBase = montantOverride ?? service.montant;
    taxable = taxableOverride ?? service.taxable;
  }

  if (!description) throw new Error("Description is required");

  // Get clientId from dossier if not provided
  let resolvedClientId = clientId;
  if (!resolvedClientId) {
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, cabinetId },
      select: { clientId: true },
    });
    resolvedClientId = dossier?.clientId ?? undefined;
  }

  const montantFinal = montantBase + ajustement - rabais;

  const tache = await prisma.registreTache.create({
    data: {
      cabinetId,
      dossierId,
      clientId: resolvedClientId,
      forfaitServiceId,
      description,
      montantBase,
      ajustement,
      rabais,
      rabaisRaison,
      montantFinal,
      taxable,
      date: date ?? new Date(),
      statut: "complete",
      createdById: userId,
    },
  });

  await createAuditLog({
    cabinetId, userId, entityType: "Dossier", entityId: dossierId,
    action: "create", metadata: { type: "registre_tache", description, montantFinal, rabais },
    performedBy: userId, performedAt: new Date(),
  });

  return tache;
}

export async function updateTache(params: {
  id: string;
  cabinetId: string;
  data: {
    description?: string;
    ajustement?: number;
    rabais?: number;
    rabaisRaison?: string;
    montantBase?: number;
    statut?: string;
  };
  userId: string;
}) {
  const { id, cabinetId, data, userId } = params;

  const existing = await prisma.registreTache.findFirst({ where: { id, cabinetId } });
  if (!existing) throw new Error("Task not found");
  if (existing.statut === "facture") throw new Error("Cannot modify an invoiced task");

  const montantBase = data.montantBase ?? existing.montantBase;
  const ajustement = data.ajustement ?? existing.ajustement;
  const rabais = data.rabais ?? existing.rabais;
  const montantFinal = montantBase + ajustement - rabais;

  return prisma.registreTache.update({
    where: { id },
    data: { ...data, montantFinal },
  });
}

export async function deleteTache(id: string, cabinetId: string) {
  const existing = await prisma.registreTache.findFirst({ where: { id, cabinetId } });
  if (!existing) throw new Error("Task not found");
  if (existing.statut === "facture") throw new Error("Cannot delete an invoiced task");

  return prisma.registreTache.delete({ where: { id } });
}

// ─── GÉNÉRATION DE FACTURE DEPUIS REGISTRE ───

export async function createInvoiceFromDossier(params: {
  dossierId: string;
  cabinetId: string;
  userId: string;
  lignesManuelles?: { description: string; montant: number; taxable: boolean }[];
}) {
  const { dossierId, cabinetId, userId, lignesManuelles = [] } = params;

  // Fetch unbilled tasks
  const taches = await prisma.registreTache.findMany({
    where: { dossierId, cabinetId, statut: "complete" },
    orderBy: { date: "asc" },
  });

  // Fetch unbilled debours
  const debours = await prisma.deboursDossier.findMany({
    where: { dossierId, cabinetId, factureId: null },
    include: { deboursType: true },
    orderBy: { date: "asc" },
  });

  if (taches.length === 0 && debours.length === 0 && lignesManuelles.length === 0) {
    throw new Error("No unbilled tasks, disbursements, or manual lines to invoice");
  }

  // Get dossier + client info
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    select: { clientId: true, intitule: true, numeroDossier: true },
  });
  if (!dossier) throw new Error("Dossier not found");

  // Generate invoice number
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { cabinetId, numero: { startsWith: `${year}-` } },
  });
  const numero = `${year}-${String(count + 1).padStart(3, "0")}`;

  // Calculate totals
  let subtotalTaxable = 0;
  let subtotalNonTaxable = 0;
  let totalRabais = 0;

  // Taches
  for (const t of taches) {
    if (t.taxable) subtotalTaxable += t.montantFinal;
    else subtotalNonTaxable += t.montantFinal;
    totalRabais += t.rabais;
  }

  // Debours (non-taxable by default for government fees)
  for (const d of debours) {
    if (d.taxable) subtotalTaxable += d.montant;
    else subtotalNonTaxable += d.montant;
  }

  // Manual lines
  for (const l of lignesManuelles) {
    if (l.taxable) subtotalTaxable += l.montant;
    else subtotalNonTaxable += l.montant;
  }

  // HST 13% (Ontario) on taxable items only
  const hstRate = 0.13;
  const hstAmount = Math.round(subtotalTaxable * hstRate * 100) / 100;
  const montantTotal = subtotalTaxable + hstAmount + subtotalNonTaxable;

  const now = new Date();
  const echeance = new Date(now);
  echeance.setDate(echeance.getDate() + 60); // 60-day payment terms for Derisier

  // Create invoice
  const invoice = await prisma.invoice.create({
    data: {
      cabinetId,
      clientId: dossier.clientId,
      dossierId,
      numero,
      dateEmission: now,
      dateEcheance: echeance,
      statut: "brouillon",
      invoiceStatus: "DRAFT",
      subtotalTaxable,
      tps: hstAmount, // Using TPS field for HST (single combined tax)
      tvq: 0,
      deboursNonTaxableTotal: subtotalNonTaxable,
      montantTotal,
      balanceDue: montantTotal,
      subtotalFees: subtotalTaxable,
      subtotalExpenses: subtotalNonTaxable,
      subtotalBeforeTax: subtotalTaxable + subtotalNonTaxable,
      taxGst: hstAmount,
      taxTotal: hstAmount,
      totalInvoiceAmount: montantTotal,
      createdById: userId,
    },
  });

  let sortOrder = 0;

  // Create invoice lines from tasks
  for (const t of taches) {
    const line = await prisma.invoiceLine.create({
      data: {
        invoiceId: invoice.id,
        lineType: "fee",
        sourceType: "registre_tache",
        sourceId: t.id,
        description: t.description,
        quantite: 1,
        tauxUnitaire: t.montantBase + t.ajustement,
        montant: t.montantFinal,
        taxable: t.taxable,
        lineSubtotal: t.montantFinal,
        lineTotal: t.taxable ? t.montantFinal * (1 + hstRate) : t.montantFinal,
        sortOrder: sortOrder++,
      },
    });

    // Link task to invoice line
    await prisma.registreTache.update({
      where: { id: t.id },
      data: { statut: "facture", invoiceLineId: line.id },
    });

    // If there's a discount, add a separate rabais line
    if (t.rabais > 0) {
      await prisma.invoiceLine.create({
        data: {
          invoiceId: invoice.id,
          lineType: "adjustment",
          sourceType: "manual",
          description: t.rabaisRaison ? `Discount: ${t.rabaisRaison}` : `Discount on ${t.description}`,
          quantite: 1,
          tauxUnitaire: -t.rabais,
          montant: -t.rabais,
          taxable: t.taxable,
          lineSubtotal: -t.rabais,
          lineTotal: t.taxable ? -t.rabais * (1 + hstRate) : -t.rabais,
          sortOrder: sortOrder++,
        },
      });
    }
  }

  // Create invoice lines from debours
  for (const d of debours) {
    await prisma.invoiceLine.create({
      data: {
        invoiceId: invoice.id,
        lineType: "expense",
        sourceType: "debours_dossier",
        sourceId: d.id,
        description: d.description,
        quantite: d.quantite,
        tauxUnitaire: d.montant / d.quantite,
        montant: d.montant,
        taxable: d.taxable,
        lineSubtotal: d.montant,
        lineTotal: d.taxable ? d.montant * (1 + hstRate) : d.montant,
        sortOrder: sortOrder++,
      },
    });

    // Link debours to invoice
    await prisma.deboursDossier.update({
      where: { id: d.id },
      data: { factureId: invoice.id },
    });
  }

  // Create invoice lines from manual entries
  for (const l of lignesManuelles) {
    await prisma.invoiceLine.create({
      data: {
        invoiceId: invoice.id,
        lineType: "fee",
        sourceType: "manual",
        description: l.description,
        quantite: 1,
        tauxUnitaire: l.montant,
        montant: l.montant,
        taxable: l.taxable,
        lineSubtotal: l.montant,
        lineTotal: l.taxable ? l.montant * (1 + hstRate) : l.montant,
        sortOrder: sortOrder++,
      },
    });
  }

  await createAuditLog({
    cabinetId, userId, entityType: "Invoice", entityId: invoice.id,
    action: "create",
    metadata: {
      type: "forfait_invoice",
      numero, dossierId,
      nbTaches: taches.length,
      nbDebours: debours.length,
      nbManuelles: lignesManuelles.length,
      montantTotal, totalRabais,
    },
    performedBy: userId, performedAt: now,
  });

  return { invoice, nbLines: sortOrder };
}

/** Create a free-form invoice (saisie libre) without a dossier. */
export async function createFreeformInvoice(params: {
  cabinetId: string;
  clientId: string;
  userId: string;
  lignes: { description: string; montant: number; taxable: boolean }[];
}) {
  const { cabinetId, clientId, userId, lignes } = params;

  if (lignes.length === 0) throw new Error("At least one line is required");

  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { cabinetId, numero: { startsWith: `${year}-` } },
  });
  const numero = `${year}-${String(count + 1).padStart(3, "0")}`;

  let subtotalTaxable = 0;
  let subtotalNonTaxable = 0;
  for (const l of lignes) {
    if (l.taxable) subtotalTaxable += l.montant;
    else subtotalNonTaxable += l.montant;
  }

  const hstRate = 0.13;
  const hstAmount = Math.round(subtotalTaxable * hstRate * 100) / 100;
  const montantTotal = subtotalTaxable + hstAmount + subtotalNonTaxable;

  const now = new Date();
  const echeance = new Date(now);
  echeance.setDate(echeance.getDate() + 60);

  const invoice = await prisma.invoice.create({
    data: {
      cabinetId,
      clientId,
      numero,
      dateEmission: now,
      dateEcheance: echeance,
      statut: "brouillon",
      invoiceStatus: "DRAFT",
      subtotalTaxable,
      tps: hstAmount,
      tvq: 0,
      deboursNonTaxableTotal: subtotalNonTaxable,
      montantTotal,
      balanceDue: montantTotal,
      subtotalFees: subtotalTaxable,
      subtotalExpenses: subtotalNonTaxable,
      subtotalBeforeTax: subtotalTaxable + subtotalNonTaxable,
      taxGst: hstAmount,
      taxTotal: hstAmount,
      totalInvoiceAmount: montantTotal,
      createdById: userId,
    },
  });

  let sortOrder = 0;
  for (const l of lignes) {
    await prisma.invoiceLine.create({
      data: {
        invoiceId: invoice.id,
        lineType: "fee",
        sourceType: "manual",
        description: l.description,
        quantite: 1,
        tauxUnitaire: l.montant,
        montant: l.montant,
        taxable: l.taxable,
        lineSubtotal: l.montant,
        lineTotal: l.taxable ? l.montant * (1 + hstRate) : l.montant,
        sortOrder: sortOrder++,
      },
    });
  }

  return { invoice, nbLines: sortOrder };
}
