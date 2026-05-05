/**
 * Reset Derisier Law operational data while preserving delivery configuration.
 *
 * Default mode is a dry run:
 *   node scripts/reset-derisier-operational-data.mjs
 *
 * Destructive mode requires both:
 *   RESET_DERISIER_DATA=YES node scripts/reset-derisier-operational-data.mjs --apply
 *
 * Preserved:
 * - Cabinet row and Cabinet.config
 * - CabinetInterface
 * - Users and credentials
 * - ForfaitService, DeboursType, DeboursTemplate, retention policies
 *
 * Deleted:
 * - Clients, dossiers, invoices, payments, documents, tasks, events, trust ledgers,
 *   billing artifacts, journal entries, operational audit/import logs for Derisier.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DERISIER_CABINET_ID = "derisier-law-on-2026";
const DERISIER_EMAIL = "info@derisierlaw.com";
const APPLY = process.argv.includes("--apply");
const CONFIRMED = process.env.RESET_DERISIER_DATA === "YES";

function formatCount(count) {
  return String(count).padStart(4, " ");
}

async function count(modelName, where) {
  const delegate = prisma[modelName];
  if (!delegate?.count) {
    return null;
  }
  try {
    return await delegate.count({ where });
  } catch (error) {
    if (error?.code === "P2021" || error?.code === "P2022") {
      return null;
    }
    throw error;
  }
}

async function deleteRows(modelName, where) {
  const delegate = prisma[modelName];
  if (!delegate?.deleteMany) {
    return { count: 0 };
  }
  try {
    return await delegate.deleteMany({ where });
  } catch (error) {
    if (error?.code === "P2021" || error?.code === "P2022") {
      return { count: 0 };
    }
    throw error;
  }
}

function inIds(ids) {
  return ids.length > 0 ? { in: ids } : { in: ["__safe_no_match__"] };
}

async function collectState(cabinetId) {
  const [
    clients,
    dossiers,
    invoices,
    payments,
    documents,
    richDocuments,
    trustTransactions,
    trustAccounts,
    registreTaches,
  ] = await Promise.all([
    prisma.client.findMany({ where: { cabinetId }, select: { id: true } }),
    prisma.dossier.findMany({ where: { cabinetId }, select: { id: true } }),
    prisma.invoice.findMany({ where: { cabinetId }, select: { id: true } }),
    prisma.payment.findMany({ where: { cabinetId }, select: { id: true } }),
    prisma.document.findMany({ where: { cabinetId }, select: { id: true } }),
    prisma.richDocument.findMany({ where: { cabinetId }, select: { id: true } }),
    prisma.trustTransaction.findMany({ where: { cabinetId }, select: { id: true } }),
    prisma.trustAccount.findMany({ where: { cabinetId }, select: { id: true } }),
    prisma.registreTache.findMany({ where: { cabinetId }, select: { id: true } }),
  ]);

  return {
    clientIds: clients.map((row) => row.id),
    dossierIds: dossiers.map((row) => row.id),
    invoiceIds: invoices.map((row) => row.id),
    paymentIds: payments.map((row) => row.id),
    documentIds: documents.map((row) => row.id),
    richDocumentIds: richDocuments.map((row) => row.id),
    trustTransactionIds: trustTransactions.map((row) => row.id),
    trustAccountIds: trustAccounts.map((row) => row.id),
    registreTacheIds: registreTaches.map((row) => row.id),
  };
}

function buildTargets(cabinetId, state) {
  const clientId = inIds(state.clientIds);
  const dossierId = inIds(state.dossierIds);
  const invoiceId = inIds(state.invoiceIds);
  const paymentId = inIds(state.paymentIds);
  const documentId = inIds(state.documentIds);
  const richDocumentId = inIds(state.richDocumentIds);
  const trustTransactionId = inIds(state.trustTransactionIds);

  return [
    ["readyForReviewSignal", "Signaux prêt pour revue", { cabinetId }],
    ["dossierDocketEntry", "Cahiers / entrées de cartable", { cabinetId }],
    ["richDocumentVersion", "Versions de documents riches", { cabinetId }],
    ["workSession", "Sessions de travail", { cabinetId }],
    ["richDocument", "Documents riches", { cabinetId }],
    ["clientIdentityVerification", "Vérifications d'identité", { clientId }],
    ["consentLog", "Consentements client", { clientId }],
    ["notificationLog", "Notifications dossier/client", { cabinetId }],
    ["calendarEvent", "Événements calendrier", { cabinetId }],
    ["conflictCheck", "Contrôles de conflits", { cabinetId }],
    ["immigrationDocument", "Documents immigration", { dossierId }],
    ["immigrationBackground", "Antécédents immigration", { dossierId }],
    ["dossierBillingStage", "Étapes de facturation dossier", { dossierId }],
    ["dossierClientInfo", "Infos client dossier", { dossierId }],
    ["dossierMandate", "Mandats dossier", { dossierId }],
    ["dossierPiece", "Pièces dossier", { dossierId }],
    ["dossierProcedure", "Procédures dossier", { dossierId }],
    ["dossierJudgment", "Jugements dossier", { dossierId }],
    ["dossierCorrespondence", "Correspondance dossier", { dossierId }],
    ["dossierTrustMovement", "Mouvements fidéicommis dossier", { cabinetId }],
    ["dossierClosure", "Clôtures dossier", { dossierId }],
    ["dossierReminder", "Rappels dossier", { cabinetId }],
    ["dossierSection", "Sections de cartable", { cabinetId }],
    ["dossierNote", "Notes dossier", { dossierId }],
    ["dossierTache", "Tâches dossier", { dossierId }],
    ["dossierEvenement", "Événements dossier", { dossierId }],
    ["dossierActe", "Actes LexTrack", { dossierId }],
    ["registreTache", "Tâches forfaitaires", { cabinetId }],
    ["deboursDossier", "Débours dossier", { cabinetId }],
    ["expense", "Dépenses refacturables", { cabinetId }],
    ["timeEntry", "Temps / entrées WIP", { cabinetId }],
    ["creditNoteApplication", "Applications notes de crédit", { invoiceId }],
    ["creditNote", "Notes de crédit", { cabinetId }],
    ["interestCharge", "Intérêts facture", { invoiceId }],
    ["invoiceReminder", "Relances facture", { invoiceId }],
    ["invoiceSendLog", "Historique d'envoi facture", { cabinetId }],
    ["paymentAllocation", "Allocations de paiements", { OR: [{ invoiceId }, { paymentId }] }],
    ["payment", "Paiements", { cabinetId }],
    ["invoiceItem", "Items facture", { invoiceId }],
    ["invoiceLine", "Lignes facture", { invoiceId }],
    ["invoice", "Factures", { cabinetId }],
    ["billingRun", "Runs de facturation", { cabinetId }],
    ["trustTransaction", "Transactions fidéicommis", { cabinetId }],
    ["trustAccount", "Ledgers fidéicommis client/dossier", { cabinetId }],
    ["journalGeneralEntry", "Journal général Derisier", { cabinetId }],
    ["bankImportTransaction", "Transactions d'import bancaire", { cabinetId }],
    ["bankImportSession", "Sessions d'import bancaire", { cabinetId }],
    ["cabinetExpense", "Dépenses cabinet importées", { cabinetId }],
    ["importHistory", "Historiques d'import", { cabinetId }],
    ["document", "Documents fichiers", { cabinetId }],
    ["auditLog", "Audit logs opérationnels", { cabinetId }],
    ["dossier", "Dossiers", { cabinetId }],
    ["client", "Clients", { cabinetId }],
  ];
}

async function summarizeTargets(targets) {
  const rows = [];
  for (const [modelName, label, where] of targets) {
    const rowCount = await count(modelName, where);
    if (rowCount == null) {
      rows.push({ modelName, label, count: 0, skipped: true });
    } else {
      rows.push({ modelName, label, count: rowCount, skipped: false });
    }
  }
  return rows;
}

async function printPreserved(cabinetId) {
  const [users, forfaits, deboursTypes, deboursTemplates, retentionPolicies, interfaceConfig] =
    await Promise.all([
      prisma.user.count({ where: { cabinetId } }),
      prisma.forfaitService.count({ where: { cabinetId } }),
      prisma.deboursType.count({ where: { cabinetId } }),
      prisma.deboursTemplate.count({ where: { cabinetId } }),
      prisma.documentRetentionPolicy.count({ where: { cabinetId } }),
      prisma.cabinetInterface.count({ where: { cabinetId } }),
    ]);

  console.log("\nPréservé:");
  console.log(`  ${formatCount(users)}  Utilisateurs / accès`);
  console.log(`  ${formatCount(forfaits)}  Forfaits`);
  console.log(`  ${formatCount(deboursTypes)}  Types de débours`);
  console.log(`  ${formatCount(deboursTemplates)}  Templates de débours`);
  console.log(`  ${formatCount(retentionPolicies)}  Politiques de conservation`);
  console.log(`  ${formatCount(interfaceConfig)}  Configuration d'interface`);
}

async function main() {
  const cabinet = await prisma.cabinet.findFirst({
    where: {
      OR: [
        { id: DERISIER_CABINET_ID },
        { email: { equals: DERISIER_EMAIL, mode: "insensitive" } },
        { nom: { contains: "Derisier", mode: "insensitive" } },
      ],
    },
    select: { id: true, nom: true, email: true },
  });

  if (!cabinet) {
    throw new Error("Cabinet Derisier introuvable. Aucune action effectuée.");
  }

  const state = await collectState(cabinet.id);
  const targets = buildTargets(cabinet.id, state);
  const summary = await summarizeTargets(targets);
  const total = summary.reduce((sum, row) => sum + row.count, 0);

  console.log(`Cabinet ciblé: ${cabinet.nom} (${cabinet.id})`);
  console.log(`Mode: ${APPLY ? "SUPPRESSION RÉELLE" : "simulation seulement"}`);
  console.log("\nÀ supprimer:");
  for (const row of summary) {
    if (row.count === 0) continue;
    console.log(`  ${formatCount(row.count)}  ${row.label}`);
  }
  console.log(`\nTotal lignes visées: ${total}`);
  await printPreserved(cabinet.id);

  if (!APPLY) {
    console.log(
      "\nSimulation terminée. Pour appliquer: RESET_DERISIER_DATA=YES node scripts/reset-derisier-operational-data.mjs --apply"
    );
    return;
  }

  if (!CONFIRMED) {
    throw new Error("Protection active: ajoute RESET_DERISIER_DATA=YES pour confirmer la suppression réelle.");
  }

  for (const [modelName, label, where] of targets) {
    const result = await deleteRows(modelName, where);
    if (result.count > 0) {
      console.log(`Supprimé ${formatCount(result.count)}  ${label}`);
    }
  }

  const afterState = await collectState(cabinet.id);
  const afterTargets = buildTargets(cabinet.id, afterState);
  const afterSummary = await summarizeTargets(afterTargets);
  const remaining = afterSummary.reduce((sum, row) => sum + row.count, 0);

  console.log(`\nRemise à zéro terminée. Lignes opérationnelles restantes: ${remaining}`);
  await printPreserved(cabinet.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
