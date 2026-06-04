/**
 * Onboarding script for Kouame Avocat (kouame-avocat-qc-2026)
 * Run: npx tsx lib/seeds/onboard-kouame.ts
 *
 * Steps:
 * 1. Find or create Cabinet
 * 2. Apply CabinetInterface config (QC, mixte, fiducie Barreau du Quebec, Loi 25)
 * 3. Seed DeboursTypes (frais judiciaires QC + recherches RDPRM/REQ)
 * 4. Seed DeboursTemplates
 * 5. Summary
 *
 * L'interface produit reste celle de Derisier. Seule la configuration cliente
 * change. Source: docs/configuration/RUTH_KOUAME_ACTIVATION_BRIEF.md
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CABINET_INTERFACE_CONFIG = {
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
  ]),
  modules: JSON.stringify({
    facturation: {
      principal: "mixte",
      periodeFact: "monthly",
      joursRelance: 30,
      tauxInterets: 1.5,
      taxes: { mode: "tps_tvq", tps: 5, tvq: 9.975 },
      methodesAcceptees: ["cheque", "virement", "interac", "carte"],
    },
    fideicommis: {
      regle: "barreau-qc",
      interets: "CDQ",
      reconciliation: "mensuelle",
      alerteRetard: 15,
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
    // Cabinet solo — la file assistante alimente l'avocate elle-meme.
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
};

// Frais judiciaires generiques + recherches QC
const DEBOURS_TYPES = [
  { nom: "Timbre judiciaire — Cour du Quebec", categorie: "Frais judiciaires", coutDefaut: 217, gouvernementRef: "MJQ" },
  { nom: "Timbre judiciaire — Cour superieure", categorie: "Frais judiciaires", coutDefaut: 364, gouvernementRef: "MJQ" },
  { nom: "Frais d'huissier — Signification", categorie: "Frais judiciaires", coutDefaut: 90, gouvernementRef: null },
  { nom: "Frais de greffe — Copie certifiee", categorie: "Frais judiciaires", coutDefaut: 35, gouvernementRef: "MJQ" },
  { nom: "Recherche RDPRM", categorie: "Recherche", coutDefaut: 12, gouvernementRef: "RDPRM" },
  { nom: "Recherche REQ — Etat de renseignements", categorie: "Recherche", coutDefaut: 22, gouvernementRef: "REQ" },
  { nom: "Notarisation / Commissaire a l'assermentation", categorie: "Frais professionnels", coutDefaut: 35, gouvernementRef: null },
  { nom: "Frais postaux et messagerie", categorie: "Administratif", coutDefaut: 25, gouvernementRef: null },
];

const DEBOURS_TEMPLATES = [
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

async function main() {
  console.log("=== Onboarding: Kouame Avocat ===\n");

  // 1. Find cabinet — par defaut le plus recent (utile en environnement de dev).
  // En production, cibler explicitement l'id "kouame-avocat-qc-2026".
  const cabinet =
    (await prisma.cabinet.findUnique({ where: { id: "kouame-avocat-qc-2026" } })) ??
    (await prisma.cabinet.findFirst({ orderBy: { createdAt: "desc" } }));

  if (!cabinet) {
    console.error("No cabinet found. Run create-kouame-cabinet.ts first.");
    process.exit(1);
  }

  const cabinetId = cabinet.id;
  console.log(`Cabinet: ${cabinet.nom} (${cabinetId})\n`);

  // 2. Apply CabinetInterface
  console.log("Step 1: Applying CabinetInterface config...");
  await prisma.cabinetInterface.upsert({
    where: { cabinetId },
    create: { cabinetId, ...CABINET_INTERFACE_CONFIG },
    update: CABINET_INTERFACE_CONFIG,
  });
  console.log("  ✓ CabinetInterface applied (QC, mixte, fiducie Barreau QC, Loi 25)\n");

  // 3. Seed DeboursTypes
  console.log("Step 2: Seeding DeboursTypes...");
  const typeIds: Record<string, string> = {};

  for (const dt of DEBOURS_TYPES) {
    const existing = await prisma.deboursType.findFirst({
      where: { cabinetId, nom: dt.nom },
    });

    if (existing) {
      await prisma.deboursType.update({
        where: { id: existing.id },
        data: {
          isGovernment: !!dt.gouvernementRef,
          gouvernementRef: dt.gouvernementRef,
          taxable: false,
          coutDefaut: dt.coutDefaut,
        },
      });
      typeIds[dt.nom] = existing.id;
      console.log(`  ↻ Updated: ${dt.nom}`);
    } else {
      const created = await prisma.deboursType.create({
        data: {
          cabinetId,
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
      console.log(`  + Created: ${dt.nom} ($${dt.coutDefaut})`);
    }
  }
  console.log(`  ✓ ${Object.keys(typeIds).length} debours types ready\n`);

  // 4. Seed DeboursTemplates
  console.log("Step 3: Seeding DeboursTemplates...");
  let templatesCreated = 0;

  for (const tmpl of DEBOURS_TEMPLATES) {
    const typeId = typeIds[tmpl.nom];
    if (!typeId) {
      console.log(`  ✗ Skipped: ${tmpl.nom} (type not found)`);
      continue;
    }

    await prisma.deboursTemplate.upsert({
      where: {
        cabinetId_dossierType_deboursTypeId: {
          cabinetId,
          dossierType: tmpl.dossierType,
          deboursTypeId: typeId,
        },
      },
      create: {
        cabinetId,
        dossierType: tmpl.dossierType,
        deboursTypeId: typeId,
        isRequired: tmpl.isRequired,
      },
      update: { isRequired: tmpl.isRequired },
    });
    templatesCreated++;
  }
  console.log(`  ✓ ${templatesCreated} debours templates ready\n`);

  // 5. Summary
  const userCount = await prisma.user.count({ where: { cabinetId } });
  const dossierCount = await prisma.dossier.count({ where: { cabinetId } });

  console.log("=== Onboarding Complete ===");
  console.log(`  Cabinet: ${cabinet.nom}`);
  console.log(`  Users: ${userCount}`);
  console.log(`  Dossiers: ${dossierCount}`);
  console.log(`  DeboursTypes: ${Object.keys(typeIds).length}`);
  console.log(`  DeboursTemplates: ${templatesCreated}`);
  console.log(`  Interface: FR, mixte, Barreau QC fiducie, Loi 25`);
  console.log(`\n  Next: invitations utilisateurs + execution sur l'environnement cible.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
