/**
 * Suppression COMPLÈTE d'un client de test et de TOUTES ses données liées.
 *
 * ⚠️ IRRÉVERSIBLE. Conçu pour retirer des DONNÉES DE TEST d'une base.
 * ⚠️ AVANT DE LANCER EN PROD : prenez un snapshot Supabase (Database → Backups).
 *
 * Sécurités intégrées :
 *  - APERÇU par défaut : compte tout ce qui serait supprimé, ne supprime RIEN.
 *  - Suppression seulement si CONFIRM_DELETE="SUPPRIMER".
 *  - Tout se fait dans UNE transaction : en cas d'erreur (relation oubliée, FK),
 *    rien n'est supprimé (rollback total) et l'erreur indique le modèle bloquant.
 *  - Refuse d'agir si plusieurs clients partagent le courriel (exiger CABINET_ID).
 *
 * Usage APERÇU (ne touche à rien) :
 *   DATABASE_URL="<prod>" CLIENT_EMAIL="ptiahou@gmail.com" node scripts/delete-test-client.mjs
 *
 * Usage SUPPRESSION (après avoir vérifié l'aperçu + snapshot) :
 *   DATABASE_URL="<prod>" CLIENT_EMAIL="ptiahou@gmail.com" CONFIRM_DELETE="SUPPRIMER" \
 *     node scripts/delete-test-client.mjs
 *
 * Option : CABINET_ID="<id>" pour lever l'ambiguïté si le courriel existe dans
 * plusieurs cabinets.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL = (process.env.CLIENT_EMAIL || "ptiahou@gmail.com").trim().toLowerCase();
const CABINET_ID = process.env.CABINET_ID || null;
const DO_DELETE = process.env.CONFIRM_DELETE === "SUPPRIMER";

function line() { console.log("─".repeat(64)); }

async function main() {
  console.log("\n🧹 Suppression client de test");
  line();
  console.log(`Courriel cible : ${EMAIL}`);
  console.log(`Mode           : ${DO_DELETE ? "⚠️  SUPPRESSION RÉELLE" : "APERÇU (aucune suppression)"}`);
  line();

  // 1. Trouver le(s) client(s) par courriel (insensible à la casse).
  const clients = await prisma.client.findMany({
    where: {
      email: { equals: EMAIL, mode: "insensitive" },
      ...(CABINET_ID ? { cabinetId: CABINET_ID } : {}),
    },
    select: { id: true, cabinetId: true, email: true, raisonSociale: true, prenom: true, nom: true },
  });

  if (clients.length === 0) {
    console.log("✅ Aucun client avec ce courriel. Rien à faire.");
    return;
  }
  if (clients.length > 1) {
    console.error(`❌ ${clients.length} clients partagent ce courriel. Précisez CABINET_ID :`);
    for (const c of clients) console.error(`   - ${c.id} (cabinet ${c.cabinetId})`);
    process.exit(1);
  }

  const client = clients[0];
  const label = client.raisonSociale || [client.prenom, client.nom].filter(Boolean).join(" ") || "(sans nom)";
  console.log(`Client trouvé  : ${label} — ${client.email}`);
  console.log(`  id           : ${client.id}`);
  console.log(`  cabinet      : ${client.cabinetId}`);
  const clientId = client.id;

  // 2. Rassembler les ids des entités intermédiaires (dossiers, factures, etc.).
  const [dossiers, invoices, payments, creditNotes, trustAccounts, richDocs] = await Promise.all([
    prisma.dossier.findMany({ where: { clientId }, select: { id: true } }),
    prisma.invoice.findMany({ where: { clientId }, select: { id: true } }),
    prisma.payment.findMany({ where: { clientId }, select: { id: true } }),
    prisma.creditNote.findMany({ where: { clientId }, select: { id: true } }),
    prisma.trustAccount.findMany({ where: { clientId }, select: { id: true } }),
    prisma.richDocument.findMany({ where: { clientId }, select: { id: true } }),
  ]);
  const dossierIds = dossiers.map((d) => d.id);
  const invoiceIds = invoices.map((i) => i.id);
  const paymentIds = payments.map((p) => p.id);
  const creditNoteIds = creditNotes.map((c) => c.id);
  const trustAccountIds = trustAccounts.map((t) => t.id);
  const richDocIds = richDocs.map((r) => r.id);

  const inDossier = dossierIds.length ? { dossierId: { in: dossierIds } } : null;
  const inInvoice = invoiceIds.length ? { invoiceId: { in: invoiceIds } } : null;
  const byClient = { clientId };

  // 3. Plan de suppression, du plus profond (petits-enfants) vers le client.
  //    Chaque entrée : { model, where }. Les `where` en OR couvrent les rattachements
  //    multiples (client direct, via dossier, via facture).
  const orClientDossierInvoice = {
    OR: [byClient, ...(inDossier ? [inDossier] : []), ...(inInvoice ? [inInvoice] : [])],
  };
  const orClientDossier = { OR: [byClient, ...(inDossier ? [inDossier] : [])] };

  const plan = [
    // Petits-enfants (factures / paiements / avoirs / documents riches)
    ["paymentAllocation", { OR: [
      ...(paymentIds.length ? [{ paymentId: { in: paymentIds } }] : []),
      ...(inInvoice ? [inInvoice] : []),
    ] }],
    ["creditNoteApplication", { OR: [
      ...(creditNoteIds.length ? [{ creditNoteId: { in: creditNoteIds } }] : []),
      ...(inInvoice ? [inInvoice] : []),
    ] }],
    ["invoiceItem", inInvoice],
    ["invoiceLine", inInvoice],
    ["invoiceReminder", inInvoice],
    ["interestCharge", inInvoice],
    ["richDocumentVersion", richDocIds.length ? { richDocumentId: { in: richDocIds } } : null],
    ["workSession", { OR: [byClient, ...(inDossier ? [inDossier] : []), ...(richDocIds.length ? [{ richDocumentId: { in: richDocIds } }] : [])] }],
    ["trustTransaction", { OR: [byClient, ...(inDossier ? [inDossier] : []), ...(inInvoice ? [inInvoice] : []), ...(trustAccountIds.length ? [{ trustAccountId: { in: trustAccountIds } }] : [])] }],

    // Enfants de dossier
    ["dossierClientInfo", inDossier],
    ["dossierMandate", inDossier],
    ["dossierPiece", inDossier],
    ["dossierProcedure", inDossier],
    ["dossierJudgment", inDossier],
    ["dossierCorrespondence", inDossier],
    ["dossierTrustMovement", inDossier],
    ["dossierClosure", inDossier],
    ["dossierReminder", inDossier],
    ["dossierSection", inDossier],
    ["dossierNote", inDossier],
    ["dossierTache", inDossier],
    ["dossierEvenement", inDossier],
    ["dossierActe", inDossier],
    ["immigrationBackground", inDossier],
    ["immigrationDocument", inDossier],
    ["conflictCheck", inDossier],
    ["dossierNavetteMessage", inDossier],
    ["dossierBillingStage", inDossier],
    ["employeeHoursEntry", inDossier],

    // Enfants directs du client (ou rattachés via dossier/facture)
    ["dossierReadyForReviewSignal", orClientDossier],
    ["dossierDocketEntry", orClientDossier],
    ["timeEntry", orClientDossierInvoice],
    ["expense", orClientDossierInvoice],
    ["deboursDossier", orClientDossierInvoice],
    ["document", orClientDossier],
    ["invoiceSendLog", orClientDossierInvoice],
    ["clientIdentityVerification", byClient],
    ["consentLog", byClient],
    ["journalGeneralEntry", orClientDossierInvoice],
    ["calendarEvent", orClientDossier],
    ["registreTache", orClientDossier],
    ["notificationLog", orClientDossier],
    ["billingRun", byClient],
    ["richDocument", orClientDossier],
    ["creditNote", { OR: [byClient, ...(inInvoice ? [inInvoice] : [])] }],
    ["payment", { OR: [byClient, ...(inInvoice ? [inInvoice] : [])] }],
    ["invoice", orClientDossier],
    ["trustAccount", byClient],
    ["dossier", byClient],
    ["client", { id: clientId }],
  ];

  // 4. Aperçu : compter chaque modèle.
  console.log("\nÉléments rattachés :");
  let total = 0;
  for (const [model, where] of plan) {
    if (!where) continue;
    const delegate = prisma[model];
    if (!delegate || typeof delegate.count !== "function") {
      console.log(`   ⚠️  modèle inconnu ignoré : ${model}`);
      continue;
    }
    const n = await delegate.count({ where });
    if (n > 0) {
      console.log(`   ${String(n).padStart(5)}  ${model}`);
      total += n;
    }
  }
  console.log(`   ${"".padStart(5)}  ─────`);
  console.log(`   ${String(total).padStart(5)}  enregistrements au total (client inclus)`);

  if (!DO_DELETE) {
    line();
    console.log("APERÇU terminé. Rien n'a été supprimé.");
    console.log("Pour supprimer : relancez avec CONFIRM_DELETE=\"SUPPRIMER\" (après un snapshot).");
    return;
  }

  // 5. Suppression atomique.
  line();
  console.log("⚠️  Suppression en cours (transaction)...");
  await prisma.$transaction(async (tx) => {
    for (const [model, where] of plan) {
      if (!where) continue;
      const delegate = tx[model];
      if (!delegate || typeof delegate.deleteMany !== "function") continue;
      const res = await delegate.deleteMany({ where });
      if (res.count > 0) console.log(`   supprimé ${String(res.count).padStart(5)}  ${model}`);
    }
  });
  line();
  console.log("✅ Client de test et données liées supprimés.");
}

main()
  .catch((err) => {
    console.error("\n❌ Erreur (aucune suppression effectuée si dans la transaction) :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
