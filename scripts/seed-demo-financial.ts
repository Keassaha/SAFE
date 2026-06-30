/**
 * Seed FINANCIER pour le cabinet de démo (captures d'écran vitrine).
 * Utilise les VRAIS services de l'app pour que journal + KPI soient cohérents.
 * À lancer sur une base JETABLE uniquement.
 *
 *   DATABASE_URL=... npx tsx scripts/seed-demo-financial.ts
 */
import { prisma } from "@/lib/db";
import {
  createDraftFromBillableItems,
  issueInvoice,
} from "@/lib/services/billing/invoice-service";
import { createPayment } from "@/lib/services/billing/payment-allocation-service";
import { createTrustDeposit, createTrustWithdrawal } from "@/lib/services/fideicommis/trust-transaction-service";
import { getGlobalTrustBalance } from "@/lib/services/fideicommis/trust-balance-service";

const CABINET_NOM = "Cabinet Démo SAFE";

async function makeTimeEntry(opts: {
  cabinetId: string; dossierId: string; clientId: string; userId: string;
  heures: number; taux: number; description: string; typeActivite: string;
}) {
  const minutes = Math.round(opts.heures * 60);
  const montant = Math.round(opts.heures * opts.taux * 100) / 100;
  const now = new Date();
  return prisma.timeEntry.create({
    data: {
      cabinetId: opts.cabinetId, dossierId: opts.dossierId, clientId: opts.clientId, userId: opts.userId,
      date: now, workDate: now, dureeMinutes: minutes, durationHours: opts.heures,
      description: opts.description, typeActivite: opts.typeActivite,
      facturable: true, tauxHoraire: opts.taux, hourlyRate: opts.taux,
      montant, feeAmount: montant, statut: "brouillon", billingStatus: "READY_TO_BILL",
    },
    select: { id: true },
  });
}

async function main() {
  console.log("\n💵 Seed financier démo");
  console.log("─".repeat(60));

  const cabinet = await prisma.cabinet.findFirst({ where: { nom: CABINET_NOM } });
  if (!cabinet) throw new Error("Cabinet démo introuvable — lance d'abord demo-cabinet.mjs");
  const avocat = await prisma.user.findFirst({ where: { cabinetId: cabinet.id, role: "avocat" } });
  if (!avocat) throw new Error("Avocat démo introuvable");
  const tremblay = await prisma.client.findFirst({ where: { cabinetId: cabinet.id, email: "marie.tremblay@example.com" } });
  const beaulieu = await prisma.client.findFirst({ where: { cabinetId: cabinet.id, raisonSociale: "Constructions Beaulieu inc." } });
  if (!tremblay || !beaulieu) throw new Error("Clients démo introuvables");
  const dossier1 = await prisma.dossier.findFirst({ where: { cabinetId: cabinet.id, numeroDossier: "2026-001" } });
  const dossier2 = await prisma.dossier.findFirst({ where: { cabinetId: cabinet.id, numeroDossier: "2026-002" } });
  if (!dossier1 || !dossier2) throw new Error("Dossiers démo introuvables");

  const ctx = { cabinetId: cabinet.id, userId: avocat.id };
  console.log(`Cabinet ${cabinet.id} · avocat ${avocat.email}`);

  // ---- FACTURE A : Tremblay (litige) → PAYÉE ----
  const teA1 = await makeTimeEntry({ ...ctx, dossierId: dossier1.id, clientId: tremblay.id, heures: 2.0, taux: 275, description: "Analyse du dossier et stratégie de révision", typeActivite: "analyse" });
  const teA2 = await makeTimeEntry({ ...ctx, dossierId: dossier1.id, clientId: tremblay.id, heures: 1.5, taux: 275, description: "Rédaction de la requête en révision", typeActivite: "redaction" });
  const draftA = await createDraftFromBillableItems({ cabinetId: cabinet.id, clientId: tremblay.id, dossierId: dossier1.id, timeEntryIds: [teA1.id, teA2.id], createdById: avocat.id });
  await issueInvoice({ invoiceId: draftA.invoiceId, approvedById: avocat.id, cabinetId: cabinet.id });
  const invA = await prisma.invoice.findUnique({ where: { id: draftA.invoiceId }, select: { numero: true, balanceDue: true, totalInvoiceAmount: true } });
  console.log(`[A] Facture ${invA?.numero} émise — total ${invA?.totalInvoiceAmount} (Tremblay)`);
  await createPayment({
    cabinetId: cabinet.id, clientId: tremblay.id, paymentDate: new Date(),
    amount: Number(invA?.balanceDue ?? 0), paymentMethod: "cheque", referenceNumber: "CHQ-1042",
    note: "Paiement complet facture", receivedById: avocat.id, invoiceId: draftA.invoiceId,
  });
  console.log(`[A] Paiement enregistré et alloué → PAYÉE`);

  // ---- FACTURE B : Beaulieu (immobilier) → IMPAYÉE (grosse) ----
  const teB1 = await makeTimeEntry({ ...ctx, dossierId: dossier2.id, clientId: beaulieu.id, heures: 6.0, taux: 300, description: "Vérification diligente et titres — immeuble commercial", typeActivite: "verification" });
  const teB2 = await makeTimeEntry({ ...ctx, dossierId: dossier2.id, clientId: beaulieu.id, heures: 4.5, taux: 300, description: "Négociation et révision de l'acte d'achat", typeActivite: "negociation" });
  const draftB = await createDraftFromBillableItems({ cabinetId: cabinet.id, clientId: beaulieu.id, dossierId: dossier2.id, timeEntryIds: [teB1.id, teB2.id], createdById: avocat.id });
  await issueInvoice({ invoiceId: draftB.invoiceId, approvedById: avocat.id, cabinetId: cabinet.id });
  const invB = await prisma.invoice.findUnique({ where: { id: draftB.invoiceId }, select: { numero: true, balanceDue: true, totalInvoiceAmount: true } });
  console.log(`[B] Facture ${invB?.numero} émise — total ${invB?.totalInvoiceAmount} (Beaulieu, impayée)`);

  // ---- FACTURE C : Tremblay → IMPAYÉE (petite) ----
  const teC1 = await makeTimeEntry({ ...ctx, dossierId: dossier1.id, clientId: tremblay.id, heures: 1.0, taux: 275, description: "Conférence téléphonique et suivi", typeActivite: "communication" });
  const draftC = await createDraftFromBillableItems({ cabinetId: cabinet.id, clientId: tremblay.id, dossierId: dossier1.id, timeEntryIds: [teC1.id], createdById: avocat.id });
  await issueInvoice({ invoiceId: draftC.invoiceId, approvedById: avocat.id, cabinetId: cabinet.id });
  const invC = await prisma.invoice.findUnique({ where: { id: draftC.invoiceId }, select: { numero: true, totalInvoiceAmount: true } });
  console.log(`[C] Facture ${invC?.numero} émise — total ${invC?.totalInvoiceAmount} (Tremblay, impayée)`);

  // ---- FIDÉICOMMIS ----
  await createTrustDeposit({
    cabinetId: cabinet.id, clientId: beaulieu.id, dossierId: dossier2.id, montant: 15000,
    dateTransaction: new Date(), modePaiement: "VIREMENT", reference: "VIR-7781",
    description: "Provision — acompte achat immeuble", createdById: avocat.id,
  });
  console.log(`[F] Dépôt fidéicommis 15 000 $ (Beaulieu)`);
  await createTrustDeposit({
    cabinetId: cabinet.id, clientId: tremblay.id, dossierId: dossier1.id, montant: 3000,
    dateTransaction: new Date(), modePaiement: "CHEQUE", reference: "CHQ-2210",
    description: "Provision sur honoraires", createdById: avocat.id,
  });
  console.log(`[F] Dépôt fidéicommis 3 000 $ (Tremblay)`);
  await createTrustWithdrawal({
    cabinetId: cabinet.id, clientId: beaulieu.id, dossierId: dossier2.id, montant: 2000,
    dateTransaction: new Date(), factureId: draftB.invoiceId,
    description: "Application au solde de la facture", createdById: avocat.id,
  });
  console.log(`[F] Retrait fidéicommis 2 000 $ appliqué à la facture B`);

  const trust = await getGlobalTrustBalance(cabinet.id);
  console.log("─".repeat(60));
  console.log(`✅ Seed financier terminé. Solde fidéicommis global : ${trust} $`);
}

main()
  .catch((err) => { console.error("\n❌ Erreur seed financier :", err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
