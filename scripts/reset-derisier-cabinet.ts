/**
 * Réinitialise les données transactionnelles du cabinet Derisier Law.
 * Conserve : cabinet, users, cabinetInterface, deboursTypes, deboursTemplates, forfaitServices.
 * Efface : clients, dossiers, factures, paiements, documents, notes, tâches, activités, etc.
 *
 * Run: npx tsx scripts/reset-derisier-cabinet.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CABINET_ID = "derisier-law-on-2026";

async function main() {
  console.log(`\n=== Reset Derisier Law (${CABINET_ID}) ===\n`);

  // ── 1. Suppression dans l'ordre enfant → parent ──────────────────────────

  // Factures et paiements
  const invoices = await prisma.invoice.findMany({ where: { cabinetId: CABINET_ID }, select: { id: true } });
  const invoiceIds = invoices.map((i) => i.id);

  let n = 0;

  n = await prisma.invoiceLine.deleteMany({ where: { invoiceId: { in: invoiceIds } } }).then((r) => r.count);
  console.log(`InvoiceLine: ${n} supprimées`);

  n = await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } }).then((r) => r.count);
  console.log(`InvoiceItem: ${n} supprimés`);

  n = await prisma.invoiceReminder.deleteMany({ where: { invoiceId: { in: invoiceIds } } }).then((r) => r.count);
  console.log(`InvoiceReminder: ${n} supprimés`);

  n = await prisma.invoiceSendLog.deleteMany({ where: { invoiceId: { in: invoiceIds } } }).then((r) => r.count);
  console.log(`InvoiceSendLog: ${n} supprimés`);

  const payments = await prisma.payment.findMany({ where: { cabinetId: CABINET_ID }, select: { id: true } });
  const paymentIds = payments.map((p) => p.id);

  n = await prisma.paymentAllocation.deleteMany({ where: { paymentId: { in: paymentIds } } }).then((r) => r.count);
  console.log(`PaymentAllocation: ${n} supprimées`);

  n = await prisma.payment.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`Payment: ${n} supprimés`);

  n = await prisma.creditNoteApplication.deleteMany({ where: { creditNote: { cabinetId: CABINET_ID } } }).then((r) => r.count);
  console.log(`CreditNoteApplication: ${n} supprimées`);

  n = await prisma.creditNote.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`CreditNote: ${n} supprimées`);

  n = await prisma.interestCharge.deleteMany({ where: { invoice: { cabinetId: CABINET_ID } } }).then((r) => r.count);
  console.log(`InterestCharge: ${n} supprimées`);

  n = await prisma.invoice.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`Invoice: ${n} supprimées`);

  n = await prisma.billingRun.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`BillingRun: ${n} supprimés`);

  // Dossiers et tout leur contenu
  const dossiers = await prisma.dossier.findMany({ where: { cabinetId: CABINET_ID }, select: { id: true } });
  const dossierIds = dossiers.map((d) => d.id);

  const tables: Array<[string, object]> = [
    ["dossierNote", { dossierId: { in: dossierIds } }],
    ["dossierTache", { dossierId: { in: dossierIds } }],
    ["dossierEvenement", { dossierId: { in: dossierIds } }],
    ["dossierSection", { dossierId: { in: dossierIds } }],
    ["dossierPiece", { dossierId: { in: dossierIds } }],
    ["dossierActe", { dossierId: { in: dossierIds } }],
    ["dossierMandate", { dossierId: { in: dossierIds } }],
    ["dossierCorrespondence", { dossierId: { in: dossierIds } }],
    ["dossierDocketEntry", { dossierId: { in: dossierIds } }],
    ["dossierProcedure", { dossierId: { in: dossierIds } }],
    ["dossierJudgment", { dossierId: { in: dossierIds } }],
    ["dossierBillingStage", { dossierId: { in: dossierIds } }],
    ["dossierClientInfo", { dossierId: { in: dossierIds } }],
    ["dossierClosure", { dossierId: { in: dossierIds } }],
    ["dossierReminder", { dossierId: { in: dossierIds } }],
    ["dossierNavetteMessage", { dossierId: { in: dossierIds } }],
    ["dossierReadyForReviewSignal", { dossierId: { in: dossierIds } }],
    ["dossierTrustMovement", { dossierId: { in: dossierIds } }],
    ["deboursDossier", { dossierId: { in: dossierIds } }],
    ["timeEntry", { dossierId: { in: dossierIds } }],
    ["immigrationBackground", { dossierId: { in: dossierIds } }],
    ["immigrationDocument", { dossierId: { in: dossierIds } }],
  ];

  for (const [modelName, where] of tables) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = (prisma as any)[modelName];
    if (!model?.deleteMany) {
      console.log(`  ⚠️  ${modelName} — modèle introuvable, ignoré`);
      continue;
    }
    n = await model.deleteMany({ where }).then((r: { count: number }) => r.count);
    if (n > 0) console.log(`${modelName}: ${n} supprimés`);
  }

  n = await prisma.dossier.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`Dossier: ${n} supprimés`);

  // Clients et identités
  const clients = await prisma.client.findMany({ where: { cabinetId: CABINET_ID }, select: { id: true } });
  const clientIds = clients.map((c) => c.id);

  n = await prisma.clientIdentityVerification.deleteMany({ where: { clientId: { in: clientIds } } }).then((r) => r.count);
  console.log(`ClientIdentityVerification: ${n} supprimées`);

  n = await prisma.conflictCheck.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`ConflictCheck: ${n} supprimés`);

  n = await prisma.consentLog.deleteMany({ where: { client: { cabinetId: CABINET_ID } } }).then((r) => r.count);
  console.log(`ConsentLog: ${n} supprimés`);

  n = await prisma.client.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`Client: ${n} supprimés`);

  // Documents
  n = await prisma.document.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`Document: ${n} supprimés`);

  // Rich documents
  const richDocs = await prisma.richDocument.findMany({ where: { cabinetId: CABINET_ID }, select: { id: true } });
  const richDocIds = richDocs.map((d) => d.id);
  n = await prisma.richDocumentVersion.deleteMany({ where: { richDocumentId: { in: richDocIds } } }).then((r) => r.count);
  console.log(`RichDocumentVersion: ${n} supprimées`);
  n = await prisma.richDocument.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`RichDocument: ${n} supprimés`);

  // Trust
  const trustAccounts = await prisma.trustAccount.findMany({ where: { cabinetId: CABINET_ID }, select: { id: true } });
  const trustIds = trustAccounts.map((t) => t.id);
  n = await prisma.trustTransaction.deleteMany({ where: { trustAccountId: { in: trustIds } } }).then((r) => r.count);
  console.log(`TrustTransaction: ${n} supprimées`);
  n = await prisma.trustReconciliation.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`TrustReconciliation: ${n} supprimées`);
  n = await prisma.trustComplianceReport.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`TrustComplianceReport: ${n} supprimés`);
  n = await prisma.trustAccount.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`TrustAccount: ${n} supprimés`);

  // Comptabilité
  n = await prisma.journalGeneralEntry.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`JournalGeneralEntry: ${n} supprimées`);

  n = await prisma.expense.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`Expense: ${n} supprimées`);

  n = await prisma.cabinetExpense.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`CabinetExpense: ${n} supprimées`);

  // Bank import
  const bankSessions = await prisma.bankImportSession.findMany({ where: { cabinetId: CABINET_ID }, select: { id: true } });
  const bankSessionIds = bankSessions.map((s) => s.id);
  n = await prisma.bankImportTransaction.deleteMany({ where: { sessionId: { in: bankSessionIds } } }).then((r) => r.count);
  console.log(`BankImportTransaction: ${n} supprimées`);
  n = await prisma.bankImportSession.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`BankImportSession: ${n} supprimées`);

  n = await prisma.importHistory.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`ImportHistory: ${n} supprimés`);

  // Employés / paie
  const employees = await prisma.employee.findMany({ where: { cabinetId: CABINET_ID }, select: { id: true } });
  const employeeIds = employees.map((e) => e.id);

  const payslips = await prisma.payslip.findMany({ where: { employeeId: { in: employeeIds } }, select: { id: true } });
  const payslipIds = payslips.map((p) => p.id);
  n = await prisma.payslipAdjustment.deleteMany({ where: { payslipId: { in: payslipIds } } }).then((r) => r.count);
  console.log(`PayslipAdjustment: ${n} supprimées`);
  n = await prisma.payslip.deleteMany({ where: { employeeId: { in: employeeIds } } }).then((r) => r.count);
  console.log(`Payslip: ${n} supprimées`);
  n = await prisma.employeeHoursEntry.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`EmployeeHoursEntry: ${n} supprimées`);
  n = await prisma.payrollPeriod.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`PayrollPeriod: ${n} supprimés`);
  n = await prisma.employee.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`Employee: ${n} supprimés`);

  // Tâches cabinet, calendrier
  n = await prisma.registreTache.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`RegistreTache: ${n} supprimées`);

  n = await prisma.calendarEvent.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`CalendarEvent: ${n} supprimés`);

  n = await prisma.workSession.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`WorkSession: ${n} supprimées`);

  // Audit logs
  n = await prisma.auditLog.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`AuditLog: ${n} supprimés`);

  // Notifications
  n = await prisma.notificationLog.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`NotificationLog: ${n} supprimés`);

  // Invitations
  n = await prisma.invitation.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`Invitation: ${n} supprimées`);

  // Impersonation sessions
  n = await prisma.impersonationSession.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`ImpersonationSession: ${n} supprimées`);

  // Support tickets (cabinet comme client SAFE)
  n = await prisma.ticketReply.deleteMany({ where: { ticket: { cabinetId: CABINET_ID } } }).then((r) => r.count);
  console.log(`TicketReply: ${n} supprimées`);
  n = await prisma.supportTicket.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`SupportTicket: ${n} supprimés`);

  // Retention policies
  n = await prisma.documentRetentionPolicy.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`DocumentRetentionPolicy: ${n} supprimées`);

  // Stripe webhook events (si liés)
  n = await prisma.stripeWebhookEvent.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`StripeWebhookEvent: ${n} supprimés`);

  console.log("\n=== Reset terminé ===");
  console.log("Configuration conservée :");
  console.log("  Cabinet, Users, CabinetInterface, DeboursTypes, DeboursTemplates, ForfaitServices");
  console.log("\nCredentials inchangés :");
  console.log("  Avocate : info@derisierlaw.com / Derisier2026");
  console.log("  Assistante : natalya@derisierlaw.com / Natalya2026");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
