/**
 * Cabinet de DÉMO SAFE — données reproductibles pour appels de vente / preview.
 *
 * Couvre la narration cœur de la démo (cf. docs/SAFE_DEMO_SCRIPT.md) :
 *  - un DUO avocat + assistant(e),
 *  - clients + dossiers,
 *  - entrées de temps,
 *  - un document « final »,
 *  - un acte à échéance proche,
 *  - des messages NAVETTE (« l'assistant prépare, l'avocat approuve »).
 *
 * Les données financières (factures, paiements, fidéicommis) sont volontairement
 * laissées à peupler via l'UI en préparation de démo : leurs schémas sont riches
 * et méritent d'être saisis dans le produit (ce qui fait aussi une bonne démo).
 *
 * Usage :
 *   DEMO_PASSWORD=<min 12 car.> node prisma/seeds/demo-cabinet.mjs
 *
 * Idempotent : rejouable. Upsert sur les clés uniques ; les enfants (temps,
 * document, acte, navette) sont gardés par une clé stable (titre / sourceRef).
 *
 * ⚠️ À VALIDER contre une base de données au premier run (non exécuté hors DB).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = process.env.DEMO_PASSWORD || "DemoSafe-2026!";
if (PASSWORD.length < 12) {
  console.error("❌ DEMO_PASSWORD doit faire au moins 12 caractères.");
  process.exit(1);
}

const CABINET_NOM = "Cabinet Démo SAFE";

async function upsertUser(cabinetId, email, nom, role, passwordHash) {
  const existing = await prisma.user.findFirst({ where: { email } });
  const data = { cabinetId, email, nom, role, passwordHash };
  if (existing) {
    return prisma.user.update({ where: { id: existing.id }, data });
  }
  return prisma.user.create({ data });
}

async function upsertClient(cabinetId, where, data) {
  const existing = await prisma.client.findFirst({ where: { cabinetId, ...where } });
  if (existing) return prisma.client.update({ where: { id: existing.id }, data });
  return prisma.client.create({ data: { cabinetId, ...data } });
}

async function upsertDossier(cabinetId, numeroDossier, data) {
  const existing = await prisma.dossier.findFirst({ where: { cabinetId, numeroDossier } });
  if (existing) return prisma.dossier.update({ where: { id: existing.id }, data });
  return prisma.dossier.create({ data: { cabinetId, numeroDossier, ...data } });
}

async function ensureNavette(input) {
  // Idempotence par sourceRef (colonne dédiée aux signaux dérivés/démo).
  const existing = await prisma.dossierNavetteMessage.findFirst({
    where: { cabinetId: input.cabinetId, sourceRef: input.sourceRef },
  });
  if (existing) return existing;
  return prisma.dossierNavetteMessage.create({ data: input });
}

async function main() {
  console.log("\n🎬 Seed cabinet de démo SAFE");
  console.log("─".repeat(60));
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // 1. Cabinet de démo (cabinet d'avocats : modules juridiques actifs)
  let cabinet = await prisma.cabinet.findFirst({ where: { nom: CABINET_NOM } });
  const cabinetData = {
    nom: CABINET_NOM,
    email: "demo@safecabinet.ca",
    plan: "fondateur",
    stripeSubscriptionStatus: "active",
    config: JSON.stringify({
      devise: "CAD",
      tauxTVQ: 9.975,
      tauxTPS: 5.0,
      langueDefaut: "fr",
      formatFacture: "standard",
    }),
  };
  cabinet = cabinet
    ? await prisma.cabinet.update({ where: { id: cabinet.id }, data: cabinetData })
    : await prisma.cabinet.create({ data: cabinetData });
  console.log(`[1] Cabinet : ${cabinet.nom} (${cabinet.id})`);

  // 2. CabinetInterface (modules juridiques actifs)
  const interfaceData = {
    ongletsActifs: JSON.stringify([
      "tableau-de-bord", "aujourdhui", "clients", "dossiers", "facturation",
      "comptabilite", "fideicommis", "documents", "gestion", "temps", "rapports",
    ]),
    ongletsMasques: JSON.stringify([]),
    modules: JSON.stringify({ depenses: true, exports_comptables: true, paiements_stripe: false }),
    widgets: JSON.stringify(["fideicommis", "factures_impayees", "revenus_mois"]),
    disciplines: JSON.stringify(["litige", "immobilier"]),
    modeFacturation: JSON.stringify({ principal: "horaire" }),
    conformite: JSON.stringify({ verif_conflits: true, loi25: true, retention: { duree: 7 } }),
  };
  const existingItf = await prisma.cabinetInterface.findUnique({ where: { cabinetId: cabinet.id } });
  if (existingItf) {
    await prisma.cabinetInterface.update({ where: { cabinetId: cabinet.id }, data: interfaceData });
  } else {
    await prisma.cabinetInterface.create({ data: { cabinetId: cabinet.id, ...interfaceData } });
  }
  console.log("[2] CabinetInterface configuré (modules juridiques)");

  // 3. Duo avocat + assistant(e)
  const avocat = await upsertUser(cabinet.id, "camille.demo@safecabinet.ca", "Me Camille Roy", "avocat", passwordHash);
  const assistante = await upsertUser(cabinet.id, "aaliyah.demo@safecabinet.ca", "Aaliyah Côté", "assistante", passwordHash);
  console.log(`[3] Duo : avocat ${avocat.email} + assistante ${assistante.email}`);

  // 4. Clients
  const clientPP = await upsertClient(
    cabinet.id,
    { email: "marie.tremblay@example.com" },
    { typeClient: "personne_physique", prenom: "Marie", nom: "Tremblay", email: "marie.tremblay@example.com", status: "actif" },
  );
  const clientPM = await upsertClient(
    cabinet.id,
    { raisonSociale: "Constructions Beaulieu inc." },
    { typeClient: "personne_morale", raisonSociale: "Constructions Beaulieu inc.", email: "contact@beaulieu.example.com", status: "actif" },
  );
  console.log("[4] Clients : Marie Tremblay + Constructions Beaulieu inc.");

  // 5. Dossiers (avocat responsable + assistante)
  const dossier1 = await upsertDossier(cabinet.id, "2026-001", {
    clientId: clientPP.id,
    intitule: "Tremblay c. Commission — révision",
    type: "litige",
    statut: "actif",
    avocatResponsableId: avocat.id,
    assistantJuridiqueId: assistante.id,
  });
  const dossier2 = await upsertDossier(cabinet.id, "2026-002", {
    clientId: clientPM.id,
    intitule: "Beaulieu — achat immeuble commercial",
    type: "immobilier",
    statut: "actif",
    avocatResponsableId: avocat.id,
    assistantJuridiqueId: assistante.id,
  });
  console.log("[5] Dossiers : 2026-001 (litige) + 2026-002 (immobilier)");

  // 6. Entrées de temps (sur le dossier 1, par l'avocat)
  const hasTime = await prisma.timeEntry.count({ where: { cabinetId: cabinet.id, dossierId: dossier1.id } });
  if (hasTime === 0) {
    const now = new Date();
    await prisma.timeEntry.create({
      data: {
        cabinetId: cabinet.id, dossierId: dossier1.id, clientId: clientPP.id, userId: avocat.id,
        date: now, workDate: now, dureeMinutes: 90, durationHours: 1.5,
        description: "Analyse du dossier et stratégie", typeActivite: "analyse",
        facturable: true, tauxHoraire: 250, hourlyRate: 250, montant: 375, feeAmount: 375,
        statut: "brouillon", billingStatus: "READY_TO_BILL",
      },
    });
    console.log("[6] Entrée de temps créée (90 min, dossier 2026-001)");
  } else {
    console.log("[6] Entrées de temps déjà présentes (skip)");
  }

  // 7. Document « final » (sur le dossier 1)
  const docTitre = "Projet de requête en révision";
  let doc = await prisma.richDocument.findFirst({ where: { dossierId: dossier1.id, titre: docTitre } });
  if (!doc) {
    doc = await prisma.richDocument.create({
      data: {
        cabinetId: cabinet.id, dossierId: dossier1.id, clientId: clientPP.id,
        createdById: assistante.id, titre: docTitre, statut: "final",
        content: "<h1>Requête en révision</h1><p>Projet préparé par l'assistante, prêt pour revue de l'avocat.</p>",
      },
    });
    console.log("[7] Document « final » créé");
  } else {
    console.log("[7] Document déjà présent (skip)");
  }

  // 8. Acte à échéance proche (assigné à l'assistante)
  const acteTitle = "Déposer la requête au greffe";
  const existingActe = await prisma.dossierActe.findFirst({ where: { dossierId: dossier1.id, title: acteTitle } });
  if (!existingActe) {
    const soon = new Date();
    soon.setDate(soon.getDate() + 2);
    await prisma.dossierActe.create({
      data: {
        dossierId: dossier1.id, assigneeId: assistante.id, phase: "INSTRUCTION",
        type: "echeance", title: acteTitle, deadline: soon,
        status: "todo", priority: "haute",
      },
    });
    console.log("[8] Acte urgent créé (échéance J+2)");
  } else {
    console.log("[8] Acte déjà présent (skip)");
  }

  // 9. Navette : l'assistant prépare, l'avocat approuve
  await ensureNavette({
    cabinetId: cabinet.id, dossierId: dossier1.id, authorId: assistante.id, authorRole: "assistante",
    recipientId: avocat.id, type: "ready_for_review",
    body: "Requête en révision prête à valider", sourceRef: "demo:rfr:2026-001",
  });
  await ensureNavette({
    cabinetId: cabinet.id, dossierId: dossier1.id, authorId: assistante.id, authorRole: "assistante",
    recipientId: avocat.id, type: "document_ready",
    body: docTitre, sourceRef: "demo:doc:2026-001",
  });
  await ensureNavette({
    cabinetId: cabinet.id, dossierId: dossier2.id, authorId: assistante.id, authorRole: "assistante",
    recipientId: avocat.id, type: "question",
    body: "Confirmer la date de signature chez le notaire ?", sourceRef: "demo:q:2026-002",
  });
  console.log("[9] Messages navette créés (prêt pour revue, document prêt, question)");

  console.log("─".repeat(60));
  console.log("✅ Cabinet de démo prêt.");
  console.log(`   Avocat    : ${avocat.email}`);
  console.log(`   Assistante: ${assistante.email}`);
  console.log(`   Mot de passe : ${PASSWORD}`);
  console.log("\n   À compléter via l'UI pour la démo financière : factures, paiements, fidéicommis.\n");
}

main()
  .catch((err) => {
    console.error("\n❌ Erreur seed démo :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
