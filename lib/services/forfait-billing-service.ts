/**
 * Service de facturation forfaitaire.
 * Gère la grille de forfaits, le registre de tâches, et la génération de factures.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getNextInvoiceNumero } from "@/lib/facturation/numero-facture";
import { buildBillableTimeEntryWhere } from "@/lib/billing/queries";
import { recalculateInvoiceTotals } from "@/lib/services/billing/invoice-service";
import { TPS_RATE, TVQ_RATE } from "@/lib/invoice-calculations";

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function computeLineTaxes(amount: number, taxable: boolean) {
  if (!taxable) return { gstAmount: 0, qstAmount: 0 };
  return {
    gstAmount: roundMoney(amount * TPS_RATE),
    qstAmount: roundMoney(amount * TVQ_RATE),
  };
}

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
      invoiceLine: {
        select: {
          invoice: {
            select: {
              sentAt: true,
            },
          },
        },
      },
      dossier: {
        select: {
          intitule: true,
          numeroDossier: true,
          client: { select: { typeClient: true, raisonSociale: true, prenom: true, nom: true } },
        },
      },
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

  // Get dossier + client info (lecture hors transaction — métadonnées immuables)
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    select: { clientId: true, intitule: true, numeroDossier: true },
  });
  if (!dossier) throw new Error("Dossier not found");

  const now = new Date();
  const echeance = new Date(now);
  echeance.setDate(echeance.getDate() + 60); // 60-day payment terms

  // Atomicité : revalidation des sources libres + génération du numéro
  // (sous advisory lock) + invoice + lignes + updates RegistreTache/
  // DeboursDossier + recalcul dans une seule transaction. Si un autre
  // processus a déjà rattaché une de nos sources entre-temps, on rejette
  // explicitement plutôt que de produire une facture vide ou doublonnée.
  const result = await prisma.$transaction(async (tx) => {
    // Revalidation sous tx : ne lire QUE les sources réellement libres.
    // Garantit qu'un double-clic ou deux requêtes concurrentes ne facturent
    // pas la même tâche/débours deux fois (la deuxième tx verra ces sources
    // déjà rattachées par la première).
    const taches = await tx.registreTache.findMany({
      where: {
        dossierId,
        cabinetId,
        statut: "complete",
        invoiceLineId: null,
      },
      orderBy: { date: "asc" },
    });

    const debours = await tx.deboursDossier.findMany({
      where: { dossierId, cabinetId, factureId: null },
      include: { deboursType: true },
      orderBy: { date: "asc" },
    });

    if (taches.length === 0 && debours.length === 0 && lignesManuelles.length === 0) {
      throw new Error(
        "No unbilled tasks, disbursements, or manual lines to invoice — sources may have been billed concurrently",
      );
    }

    let totalRabais = 0;
    for (const t of taches) totalRabais += t.rabais;
    void totalRabais;

    // Numéro de facture canonique sous advisory lock — évite la collision
    // avec une autre transaction concurrente qui crée pour le même cabinet.
    const numero = await getNextInvoiceNumero(cabinetId, tx);

    const invoice = await tx.invoice.create({
      data: {
        cabinetId,
        clientId: dossier.clientId,
        dossierId,
        numero,
        dateEmission: now,
        dateEcheance: echeance,
        statut: "brouillon",
        invoiceStatus: "DRAFT",
        paymentStatus: "UNPAID",
        balanceDue: 0,
        montantTotal: 0,
        totalInvoiceAmount: 0,
        createdById: userId,
      },
    });

    let sortOrder = 0;

    // Lignes depuis les tâches forfaitaires : brut + rabais séparé pour les rapports.
    for (const t of taches) {
      const grossAmount = t.montantBase + t.ajustement;
      const { gstAmount, qstAmount } = computeLineTaxes(grossAmount, t.taxable);
      const line = await tx.invoiceLine.create({
        data: {
          invoiceId: invoice.id,
          lineType: "fee",
          // Certaines bases déployées n'ont pas encore la valeur enum `registre_tache`.
          // Le lien métier canonique reste RegistreTache.invoiceLineId ci-dessous.
          sourceType: "manual",
          sourceId: t.id,
          description: t.description,
          quantite: 1,
          tauxUnitaire: grossAmount,
          montant: grossAmount,
          taxable: t.taxable,
          lineSubtotal: grossAmount,
          gstAmount,
          qstAmount,
          lineTotal: grossAmount + gstAmount + qstAmount,
          sortOrder: sortOrder++,
        },
      });

      await tx.registreTache.update({
        where: { id: t.id },
        data: { invoiceLineId: line.id },
      });

      if (t.rabais > 0) {
        const rabaisAmount = -Math.abs(t.rabais);
        const { gstAmount: rabaisGstAmount, qstAmount: rabaisQstAmount } = computeLineTaxes(
          rabaisAmount,
          t.taxable,
        );
        await tx.invoiceLine.create({
          data: {
            invoiceId: invoice.id,
            lineType: "adjustment",
            sourceType: "manual",
            parentLineId: line.id,
            discountReason: t.rabaisRaison ?? null,
            description: t.rabaisRaison ? `Rabais — ${t.rabaisRaison}` : `Rabais — ${t.description}`,
            quantite: 1,
            tauxUnitaire: rabaisAmount,
            montant: rabaisAmount,
            taxable: t.taxable,
            lineSubtotal: rabaisAmount,
            gstAmount: rabaisGstAmount,
            qstAmount: rabaisQstAmount,
            lineTotal: rabaisAmount + rabaisGstAmount + rabaisQstAmount,
            sortOrder: sortOrder++,
          },
        });
      }
    }

    // Lignes depuis les débours dossier
    for (const d of debours) {
      const gstAmount = d.taxable ? Math.round(d.montant * TPS_RATE * 100) / 100 : 0;
      const qstAmount = d.taxable ? Math.round(d.montant * TVQ_RATE * 100) / 100 : 0;
      await tx.invoiceLine.create({
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
          gstAmount,
          qstAmount,
          lineTotal: d.montant + gstAmount + qstAmount,
          sortOrder: sortOrder++,
        },
      });

      await tx.deboursDossier.update({
        where: { id: d.id },
        data: { factureId: invoice.id },
      });
    }

    // Lignes manuelles
    for (const l of lignesManuelles) {
      const gstAmount = l.taxable ? Math.round(l.montant * TPS_RATE * 100) / 100 : 0;
      const qstAmount = l.taxable ? Math.round(l.montant * TVQ_RATE * 100) / 100 : 0;
      await tx.invoiceLine.create({
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
          gstAmount,
          qstAmount,
          lineTotal: l.montant + gstAmount + qstAmount,
          sortOrder: sortOrder++,
        },
      });
    }

    await recalculateInvoiceTotals(invoice.id, tx);
    return {
      invoiceId: invoice.id,
      nbLines: sortOrder,
      numero,
      nbTaches: taches.length,
      nbDebours: debours.length,
    };
  });

  // Re-charger la facture totalisée pour préserver le contrat de retour existant.
  const finalInvoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: result.invoiceId },
  });

  // Audit en best-effort hors transaction (informatif, non comptable)
  await createAuditLog({
    cabinetId, userId, entityType: "Invoice", entityId: finalInvoice.id,
    action: "create",
    metadata: {
      type: "forfait_invoice",
      numero: result.numero, dossierId,
      nbTaches: result.nbTaches,
      nbDebours: result.nbDebours,
      nbManuelles: lignesManuelles.length,
      montantTotal: finalInvoice.montantTotal,
    },
    performedBy: userId, performedAt: now,
  });

  return { invoice: finalInvoice, nbLines: result.nbLines };
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

  const now = new Date();
  const echeance = new Date(now);
  echeance.setDate(echeance.getDate() + 60);

  // Atomicité : génération du numéro (sous advisory lock) + invoice + lignes
  // + recalcul des totaux dans une transaction.
  const result = await prisma.$transaction(async (tx) => {
    const numero = await getNextInvoiceNumero(cabinetId, tx);
    const invoice = await tx.invoice.create({
      data: {
        cabinetId,
        clientId,
        numero,
        dateEmission: now,
        dateEcheance: echeance,
        statut: "brouillon",
        invoiceStatus: "DRAFT",
        paymentStatus: "UNPAID",
        balanceDue: 0,
        montantTotal: 0,
        totalInvoiceAmount: 0,
        createdById: userId,
      },
    });

    let sortOrder = 0;
    for (const l of lignes) {
      const gstAmount = l.taxable ? Math.round(l.montant * TPS_RATE * 100) / 100 : 0;
      const qstAmount = l.taxable ? Math.round(l.montant * TVQ_RATE * 100) / 100 : 0;
      await tx.invoiceLine.create({
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
          gstAmount,
          qstAmount,
          lineTotal: l.montant + gstAmount + qstAmount,
          sortOrder: sortOrder++,
        },
      });
    }

    await recalculateInvoiceTotals(invoice.id, tx);
    return { invoiceId: invoice.id, nbLines: sortOrder };
  });

  void userId;
  const finalInvoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: result.invoiceId },
  });

  return { invoice: finalInvoice, nbLines: result.nbLines };
}

/** Create an invoice from all selected client billables, with optional manual lines. */
export async function createInvoiceFromClientBillables(params: {
  cabinetId: string;
  clientId: string;
  userId: string;
  dateEmission?: Date;
  dateEcheance?: Date;
  currency?: string;
  clientNote?: string | null;
  timeEntryIds?: string[];
  expenseIds?: string[];
  registreTacheIds?: string[];
  lignesManuelles?: { description: string; montant: number; taxable: boolean }[];
}) {
  const {
    cabinetId,
    clientId,
    userId,
    dateEmission,
    dateEcheance,
    currency = "CAD",
    clientNote,
    timeEntryIds = [],
    expenseIds = [],
    registreTacheIds = [],
    lignesManuelles = [],
  } = params;

  if (
    timeEntryIds.length === 0 &&
    expenseIds.length === 0 &&
    registreTacheIds.length === 0 &&
    lignesManuelles.length === 0
  ) {
    throw new Error("Aucune ligne à facturer");
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId },
    select: { id: true },
  });
  if (!client) throw new Error("Client introuvable");

  const [timeEntries, expenses, taches] = await Promise.all([
    timeEntryIds.length
      ? prisma.timeEntry.findMany({
          where: {
            ...buildBillableTimeEntryWhere(cabinetId, [
              { OR: [{ clientId }, { dossier: { clientId } }] },
            ]),
            id: { in: timeEntryIds },
          },
        })
      : Promise.resolve([]),
    expenseIds.length
      ? prisma.expense.findMany({
          where: {
            id: { in: expenseIds },
            cabinetId,
            clientId,
            invoiceId: null,
            billingStatus: { in: ["NON_BILLED", "READY_TO_BILL"] },
          },
        })
      : Promise.resolve([]),
    registreTacheIds.length
      ? prisma.registreTache.findMany({
          where: {
            id: { in: registreTacheIds },
            cabinetId,
            clientId,
            statut: "complete",
            invoiceLineId: null,
          },
        })
      : Promise.resolve([]),
  ]);

  if (timeEntries.length !== timeEntryIds.length) {
    throw new Error("Certaines fiches de temps sont introuvables ou déjà facturées");
  }
  if (expenses.length !== expenseIds.length) {
    throw new Error("Certains débours sont introuvables ou déjà facturés");
  }
  if (taches.length !== registreTacheIds.length) {
    throw new Error("Certaines tâches sont introuvables ou déjà facturées");
  }

  let subtotalTaxable = 0;
  let subtotalNonTaxable = 0;
  const addSubtotal = (amount: number, taxable: boolean) => {
    if (taxable) subtotalTaxable += amount;
    else subtotalNonTaxable += amount;
  };

  for (const te of timeEntries) addSubtotal(te.feeAmount ?? te.montant, te.taxable ?? true);
  for (const exp of expenses) addSubtotal(exp.amount, exp.taxable);
  for (const t of taches) addSubtotal(t.montantFinal, t.taxable);
  for (const l of lignesManuelles) addSubtotal(l.montant, l.taxable);

  const tpsAmount = Math.round(subtotalTaxable * TPS_RATE * 100) / 100;
  const tvqAmount = Math.round(subtotalTaxable * TVQ_RATE * 100) / 100;
  const taxAmount = tpsAmount + tvqAmount;
  const montantTotal = subtotalTaxable + taxAmount + subtotalNonTaxable;
  const now = new Date();
  const invoiceDate = dateEmission ?? now;
  const dueDate = dateEcheance ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const invoice = await prisma.$transaction(async (tx) => {
    // Génération du numéro sous advisory lock dans la même transaction —
    // sérialise les concurrents et garantit l'unicité avec @@unique en filet.
    const numero = await getNextInvoiceNumero(cabinetId, tx);
    const created = await tx.invoice.create({
      data: {
        cabinetId,
        clientId,
        dossierId: taches[0]?.dossierId ?? timeEntries[0]?.dossierId ?? expenses[0]?.matterId ?? null,
        numero,
        dateEmission: invoiceDate,
        dateEcheance: dueDate,
        statut: "brouillon",
        invoiceStatus: "DRAFT",
        paymentStatus: "UNPAID",
        issueMethod: "generated_from_billing",
        subtotalTaxable,
        tps: tpsAmount,
        tvq: tvqAmount,
        deboursNonTaxableTotal: subtotalNonTaxable,
        montantTotal,
        balanceDue: montantTotal,
        currency,
        subtotalFees: subtotalTaxable,
        subtotalExpenses: subtotalNonTaxable,
        subtotalBeforeTax: subtotalTaxable + subtotalNonTaxable,
        taxGst: tpsAmount,
        taxQst: tvqAmount,
        taxTotal: taxAmount,
        totalInvoiceAmount: montantTotal,
        clientNote: clientNote || null,
        createdById: userId,
      },
    });

    let sortOrder = 0;

    for (const te of timeEntries) {
      const lineSubtotal = te.feeAmount ?? te.montant;
      const taxable = te.taxable ?? true;
      const gstAmount = taxable ? Math.round(lineSubtotal * TPS_RATE * 100) / 100 : 0;
      const qstAmount = taxable ? Math.round(lineSubtotal * TVQ_RATE * 100) / 100 : 0;
      const line = await tx.invoiceLine.create({
        data: {
          invoiceId: created.id,
          timeEntryId: te.id,
          lineType: "fee",
          sourceType: "time_entry",
          sourceId: te.id,
          matterId: te.dossierId,
          serviceDate: te.date,
          description: te.description ?? "Honoraires",
          quantite: te.durationHours ?? te.dureeMinutes / 60,
          tauxUnitaire: te.hourlyRate ?? te.tauxHoraire,
          montant: lineSubtotal,
          taxable,
          lineSubtotal,
          gstAmount,
          qstAmount,
          lineTotal: lineSubtotal + gstAmount + qstAmount,
          sortOrder: sortOrder++,
        },
      });
      await tx.timeEntry.update({
        where: { id: te.id },
        data: { billingStatus: "IN_DRAFT_INVOICE", invoiceId: created.id, invoiceLineId: line.id },
      });
    }

    for (const exp of expenses) {
      const gstAmount = exp.taxable ? Math.round(exp.amount * TPS_RATE * 100) / 100 : 0;
      const qstAmount = exp.taxable ? Math.round(exp.amount * TVQ_RATE * 100) / 100 : 0;
      const line = await tx.invoiceLine.create({
        data: {
          invoiceId: created.id,
          lineType: "expense",
          sourceType: "expense",
          sourceId: exp.id,
          matterId: exp.matterId,
          serviceDate: exp.expenseDate,
          description: exp.description,
          quantite: 1,
          tauxUnitaire: exp.amount,
          montant: exp.amount,
          taxable: exp.taxable,
          lineSubtotal: exp.amount,
          gstAmount,
          qstAmount,
          lineTotal: exp.amount + gstAmount + qstAmount,
          sortOrder: sortOrder++,
        },
      });
      await tx.expense.update({
        where: { id: exp.id },
        data: { billingStatus: "IN_DRAFT_INVOICE", invoiceId: created.id, invoiceLineId: line.id },
      });
    }

    for (const t of taches) {
      const grossAmount = t.montantBase + t.ajustement;
      const { gstAmount, qstAmount } = computeLineTaxes(grossAmount, t.taxable);
      const line = await tx.invoiceLine.create({
        data: {
          invoiceId: created.id,
          lineType: "fee",
          // Certaines bases déployées n'ont pas encore la valeur enum `registre_tache`.
          // Le lien métier canonique reste RegistreTache.invoiceLineId ci-dessous.
          sourceType: "manual",
          sourceId: t.id,
          matterId: t.dossierId,
          serviceDate: t.date,
          description: t.description,
          quantite: 1,
          tauxUnitaire: grossAmount,
          montant: grossAmount,
          taxable: t.taxable,
          lineSubtotal: grossAmount,
          gstAmount,
          qstAmount,
          lineTotal: grossAmount + gstAmount + qstAmount,
          sortOrder: sortOrder++,
        },
      });
      if (t.rabais > 0) {
        const rabaisAmount = -Math.abs(t.rabais);
        const { gstAmount: rabaisGstAmount, qstAmount: rabaisQstAmount } = computeLineTaxes(
          rabaisAmount,
          t.taxable,
        );
        await tx.invoiceLine.create({
          data: {
            invoiceId: created.id,
            lineType: "adjustment",
            sourceType: "manual",
            sourceId: t.id,
            matterId: t.dossierId,
            serviceDate: t.date,
            parentLineId: line.id,
            discountReason: t.rabaisRaison ?? null,
            description: t.rabaisRaison ? `Rabais — ${t.rabaisRaison}` : `Rabais — ${t.description}`,
            quantite: 1,
            tauxUnitaire: rabaisAmount,
            montant: rabaisAmount,
            taxable: t.taxable,
            lineSubtotal: rabaisAmount,
            gstAmount: rabaisGstAmount,
            qstAmount: rabaisQstAmount,
            lineTotal: rabaisAmount + rabaisGstAmount + rabaisQstAmount,
            sortOrder: sortOrder++,
          },
        });
      }
      await tx.registreTache.update({
        where: { id: t.id },
        data: { invoiceLineId: line.id },
      });
    }

    for (const l of lignesManuelles) {
      const gstAmount = l.taxable ? Math.round(l.montant * TPS_RATE * 100) / 100 : 0;
      const qstAmount = l.taxable ? Math.round(l.montant * TVQ_RATE * 100) / 100 : 0;
      await tx.invoiceLine.create({
        data: {
          invoiceId: created.id,
          lineType: "fee",
          sourceType: "manual",
          description: l.description,
          quantite: 1,
          tauxUnitaire: l.montant,
          montant: l.montant,
          taxable: l.taxable,
          lineSubtotal: l.montant,
          gstAmount,
          qstAmount,
          lineTotal: l.montant + gstAmount + qstAmount,
          sortOrder: sortOrder++,
        },
      });
    }

    return created;
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Invoice",
    entityId: invoice.id,
    action: "create",
    metadata: {
      type: "client_billables_invoice",
      numero: invoice.numero,
      clientId,
      nbTimeEntries: timeEntries.length,
      nbExpenses: expenses.length,
      nbTaches: taches.length,
      nbManuelles: lignesManuelles.length,
      montantTotal,
    },
    performedBy: userId,
    performedAt: now,
  });

  return { invoice };
}
