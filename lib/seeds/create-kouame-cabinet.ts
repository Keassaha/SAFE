/**
 * Creates Kouame Avocat cabinet + users.
 * Run: npx tsx lib/seeds/create-kouame-cabinet.ts
 *
 * Profil cabinet: avocate solo au Quebec.
 * Source d'activation: docs/configuration/RUTH_KOUAME_ACTIVATION_BRIEF.md
 *
 * Priorites de configuration (rapport d'audit):
 *   1. Fideicommis et conciliation mensuelle (12/100, critique)
 *   2. Conformite Loi 25 (20/100, critique)
 *   3. Centre de commandement cabinet (operations 30/100, critique)
 *   4. File assistante / assistant SAFE (feature SAFE, pas d'humain — solo)
 *   5. Planificateur juridique
 *   6. Facturation et recouvrement (56/100)
 *   7. Gestion structuree des dossiers (48/100)
 *   8. Bibliotheque documentaire et retention
 *
 * L'interface produit reste IDENTIQUE a celle de Derisier (meme sidebar, meme
 * dashboard, memes composants). Seule la configuration cliente change.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Creating Kouame Avocat Cabinet ===\n");

  // Offre commerciale presentee dans /parametres/abonnement.
  // 99 $/mois, gratuite a l'activation pendant 3 mois.
  const cabinetConfig = JSON.stringify({
    devise: "CAD",
    pendingOffer: {
      label: "Offre d'activation Kouame Avocat",
      monthlyPriceCents: 9900,
      currency: "CAD",
      trialMonths: 3,
      note: "Offre personnalisee SAFE pour le lancement du cabinet. L'essai gratuit demarre a la confirmation de l'abonnement.",
    },
  });

  // 1. Create Cabinet
  const cabinet = await prisma.cabinet.upsert({
    where: { id: "kouame-avocat-qc-2026" },
    create: {
      id: "kouame-avocat-qc-2026",
      nom: "Kouame Avocat",
      adresse: "Quebec, Canada",
      telephone: "(514) 555-0142",
      email: "info@kouameavocat.ca",
      barreauNumero: "QC-RK-2026",
      plan: "professionnel",
      config: cabinetConfig,
    },
    update: {
      nom: "Kouame Avocat",
      adresse: "Quebec, Canada",
      telephone: "(514) 555-0142",
      email: "info@kouameavocat.ca",
      barreauNumero: "QC-RK-2026",
      config: cabinetConfig,
    },
  });
  console.log(`Cabinet: ${cabinet.nom} (${cabinet.id})`);

  // 2. Create Me Ruth-Esther Kouame (avocate principale, solo)
  const passwordHash = await bcrypt.hash("Kouame2026", 12);

  const avocate = await prisma.user.upsert({
    where: {
      id: "kouame-user-avocate",
    },
    create: {
      id: "kouame-user-avocate",
      cabinetId: cabinet.id,
      email: "info@kouameavocat.ca",
      passwordHash,
      nom: "Me Ruth-Esther Kouame",
      role: "admin_cabinet",
      isBillable: true,
    },
    update: {
      email: "info@kouameavocat.ca",
      passwordHash,
      nom: "Me Ruth-Esther Kouame",
      role: "admin_cabinet",
    },
  });
  console.log(`User: ${avocate.nom} (${avocate.email}) — role: ${avocate.role}`);
  console.log("(Cabinet solo — aucun utilisateur assistante humain.)");

  // 3. Apply CabinetInterface
  // Meme structure de navigation que Derisier; seule la configuration metier
  // change (Quebec, Loi 25, Barreau du Quebec, fiducie CDQ, taxes TPS/TVQ).
  await prisma.cabinetInterface.upsert({
    where: { cabinetId: cabinet.id },
    create: {
      cabinetId: cabinet.id,
      ongletsActifs: JSON.stringify([
        "tableau-de-bord",
        "clients",
        "dossiers",
        "facturation",
        "comptes",
        "documents",
        "conformite",
        "parametres",
      ]),
      ongletsMasques: JSON.stringify([
        "temps",
        "fiches-de-temps",
        "employees",
        "rapports-comptables",
      ]),
      modules: JSON.stringify({
        facturation: {
          principal: "mixte",
          periodeFact: "monthly",
          joursRelance: 30,
          tauxInterets: 1.5, // 18 % annuel — usage Quebec
          taxes: { mode: "tps_tvq", tps: 5, tvq: 9.975 },
          methodesAcceptees: ["cheque", "virement", "interac", "carte"],
        },
        fideicommis: {
          regle: "barreau-qc",
          interets: "CDQ",
          reconciliation: "mensuelle",
          alerteRetard: 15, // critique a l'audit (12/100) — surveillance serree
          protectionCroisee: true,
        },
        loi25: {
          actif: true,
          responsablePrp: "Me Ruth-Esther Kouame",
          registreIncidents: true,
          retention: { defaut: 7 },
        },
        commandCenter: {
          actif: true,
          executiveDashboard: true,
          riskRadar: true,
          dailyBrief: true,
        },
        calendar: {
          actif: true,
          legalDeadlines: true,
          weeklyPlanning: true,
          clientFollowups: true,
          reminders: true,
        },
        // Feature SAFE de file assistante virtuelle — la cabinet est solo, sans
        // assistante humaine. La file alimente l'avocate elle-meme.
        operations: { assistantQueue: true, alerts: true, soloMode: true },
        documents: { bibliotheque: true, retention: true, fermetureDossier: true },
        dossiers: { ouvertureControlee: true, preparationStatus: true },
      }),
      widgets: JSON.stringify([
        "firm-health",
        "priority-matters",
        "ready-for-review",
        "billing-follow-up",
        "compliance-risk",
        "tasks-and-appointments",
        "deadline-calendar",
        "weekly-plan",
      ]),
      disciplines: JSON.stringify(["droit_famille", "litige_civil", "autre"]),
      checklistsParType: JSON.stringify({
        droit_famille: [
          "Convention de mandat signee",
          "Verification des conflits",
          "Verification d'identite client",
          "Mandat clarifie (representation, conseil, mediation)",
          "Documents personnels rassembles",
          "Procedures introduites",
          "Conferences de gestion et echeances",
          "Audience / mediation",
          "Jugement / entente",
          "Fermeture et conservation",
        ],
        litige_civil: [
          "Convention de mandat signee",
          "Verification des conflits",
          "Verification d'identite client",
          "Mise en demeure",
          "Demande introductive",
          "Defense et conferences de gestion",
          "Interrogatoires et expertises",
          "Audition au fond",
          "Jugement et execution",
          "Fermeture et conservation",
        ],
        autre: [
          "Convention de mandat signee",
          "Verification des conflits",
          "Verification d'identite client",
          "Mandat documente",
          "Echeances inscrites",
          "Suivi client",
          "Fermeture et conservation",
        ],
      }),
      modeFacturation: JSON.stringify({ principal: "mixte" }),
      conformite: JSON.stringify({
        verif_conflits: true,
        barreau_qc: true,
        loi25: true,
        fideicommis_qc: true,
      }),
    },
    update: {},
  });
  console.log("CabinetInterface applied (QC, mixte, fiducie Barreau QC, Loi 25, solo)");

  // 4. Seed DeboursTypes (Quebec — frais judiciaires generiques)
  const deboursTypes = [
    { nom: "Timbre judiciaire — Cour du Quebec", categorie: "Frais judiciaires", coutDefaut: 217, gouvernementRef: "MJQ" },
    { nom: "Timbre judiciaire — Cour superieure", categorie: "Frais judiciaires", coutDefaut: 364, gouvernementRef: "MJQ" },
    { nom: "Frais d'huissier — Signification", categorie: "Frais judiciaires", coutDefaut: 90, gouvernementRef: null },
    { nom: "Frais de greffe — Copie certifiee", categorie: "Frais judiciaires", coutDefaut: 35, gouvernementRef: "MJQ" },
    { nom: "Recherche RDPRM", categorie: "Recherche", coutDefaut: 12, gouvernementRef: "RDPRM" },
    { nom: "Recherche REQ — Etat de renseignements", categorie: "Recherche", coutDefaut: 22, gouvernementRef: "REQ" },
    { nom: "Notarisation / Commissaire a l'assermentation", categorie: "Frais professionnels", coutDefaut: 35, gouvernementRef: null },
    { nom: "Frais postaux et messagerie", categorie: "Administratif", coutDefaut: 25, gouvernementRef: null },
  ];

  const typeIds: Record<string, string> = {};
  for (const dt of deboursTypes) {
    const existing = await prisma.deboursType.findFirst({ where: { cabinetId: cabinet.id, nom: dt.nom } });
    if (existing) {
      typeIds[dt.nom] = existing.id;
    } else {
      const created = await prisma.deboursType.create({
        data: {
          cabinetId: cabinet.id,
          nom: dt.nom,
          categorie: dt.categorie,
          description: dt.gouvernementRef
            ? `${dt.gouvernementRef} — non taxable`
            : "Debours — verifier statut taxable",
          taxable: false,
          isGovernment: !!dt.gouvernementRef,
          gouvernementRef: dt.gouvernementRef,
          coutDefaut: dt.coutDefaut,
          actif: true,
        },
      });
      typeIds[dt.nom] = created.id;
    }
  }
  console.log(`DeboursTypes: ${Object.keys(typeIds).length} ready`);

  // 5. Seed DeboursTemplates (rattachement par type de dossier)
  const templates = [
    { dossierType: "droit_famille", nom: "Timbre judiciaire — Cour superieure", isRequired: true },
    { dossierType: "droit_famille", nom: "Frais d'huissier — Signification", isRequired: true },
    { dossierType: "droit_famille", nom: "Frais de greffe — Copie certifiee", isRequired: false },
    { dossierType: "litige_civil", nom: "Timbre judiciaire — Cour du Quebec", isRequired: true },
    { dossierType: "litige_civil", nom: "Timbre judiciaire — Cour superieure", isRequired: false },
    { dossierType: "litige_civil", nom: "Frais d'huissier — Signification", isRequired: true },
    { dossierType: "litige_civil", nom: "Recherche RDPRM", isRequired: false },
    { dossierType: "autre", nom: "Notarisation / Commissaire a l'assermentation", isRequired: false },
    { dossierType: "autre", nom: "Frais postaux et messagerie", isRequired: false },
  ];

  for (const t of templates) {
    const typeId = typeIds[t.nom];
    if (!typeId) continue;
    await prisma.deboursTemplate.upsert({
      where: { cabinetId_dossierType_deboursTypeId: { cabinetId: cabinet.id, dossierType: t.dossierType, deboursTypeId: typeId } },
      create: { cabinetId: cabinet.id, dossierType: t.dossierType, deboursTypeId: typeId, isRequired: t.isRequired },
      update: {},
    });
  }
  console.log(`DeboursTemplates: ${templates.length} ready`);

  // 6. Seed ForfaitServices (Quebec, mixte horaire/forfait)
  console.log("\nStep 6: Seeding ForfaitServices (fee schedule)...");
  const forfaitServices = [
    { code: "CONSULT-INI", nom: "Consultation initiale (1 h)", montant: 250, categorie: "autre", sousType: null },
    { code: "OUVERTURE", nom: "Ouverture de dossier", montant: 350, categorie: "autre", sousType: null },
    { code: "MED-FAM", nom: "Mediation familiale (forfait de base)", montant: 1800, categorie: "droit_famille", sousType: "mediation" },
    { code: "DIV-CONS", nom: "Divorce sur projet d'accord", montant: 2200, categorie: "droit_famille", sousType: "divorce" },
    { code: "DIV-CONT", nom: "Divorce conteste — phase 1", montant: 4500, categorie: "droit_famille", sousType: "divorce" },
    { code: "GARDE", nom: "Demande de garde / pension", montant: 2500, categorie: "droit_famille", sousType: "garde" },
    { code: "MED-DEM", nom: "Mise en demeure", montant: 450, categorie: "litige_civil", sousType: "mise_en_demeure" },
    { code: "DEM-INTRO", nom: "Demande introductive (Petites creances ou Cour du Quebec)", montant: 1500, categorie: "litige_civil", sousType: "demande" },
    { code: "REPRES-AUD", nom: "Representation a l'audience (1/2 journee)", montant: 1200, categorie: "litige_civil", sousType: "audience" },
    { code: "OPINION", nom: "Opinion juridique ecrite", montant: 950, categorie: "autre", sousType: "opinion" },
  ];

  let forfaitCount = 0;
  for (const fs of forfaitServices) {
    await prisma.forfaitService.upsert({
      where: { cabinetId_code: { cabinetId: cabinet.id, code: fs.code } },
      create: {
        cabinetId: cabinet.id,
        code: fs.code,
        nom: fs.nom,
        montant: fs.montant,
        categorie: fs.categorie as never,
        sousType: fs.sousType,
        taxable: true,
        sortOrder: forfaitCount,
      },
      update: { nom: fs.nom, montant: fs.montant },
    });
    forfaitCount++;
    console.log(`  + ${fs.code}: ${fs.nom} ($${fs.montant})`);
  }
  console.log(`  ✓ ${forfaitCount} forfait services ready`);

  console.log("\n=== Kouame Avocat Ready ===");
  console.log("Login credentials:");
  console.log("  Cabinet: Kouame Avocat (solo)");
  console.log("  Avocate: info@kouameavocat.ca / Kouame2026");
  console.log("\nPriorites d'activation (audit 43/100, perte estimee 5 875 $/mois):");
  console.log("  1. Fideicommis et conciliation mensuelle (critique)");
  console.log("  2. Conformite Loi 25 (critique)");
  console.log("  3. Centre de commandement cabinet (critique)");
  console.log("  4. File assistante / assistant SAFE (feature, pas d'humain)");
  console.log("  5. Planificateur juridique");
  console.log("  6. Facturation et recouvrement");
  console.log("  7. Gestion structuree des dossiers");
  console.log("  8. Bibliotheque documentaire et retention");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
