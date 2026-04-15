/**
 * Onboarding script for Derisier Law (derisier-law-on-2026)
 * Run: npx tsx lib/seeds/onboard-derisier.ts
 *
 * Steps:
 * 1. Find or create Cabinet
 * 2. Apply CabinetInterface config
 * 3. Seed DeboursTypes (IRCC government fees + immobilier disbursements)
 * 4. Seed DeboursTemplates (expected disbursements per dossier type)
 * 5. Summary
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
      principal: "forfait",
      periodeFact: "bimonthly",
      joursRelance: 60,
      tauxInterets: 0,
      taxes: { mode: "hst", taux: 13 },
      methodesAcceptees: ["cheque", "wire", "bank_draft", "carte", "interac", "cash"],
    },
    fideicommis: {
      regle: "bylaw9-lso",
      interets: "LFO",
      reconciliation: "mensuelle",
      alerteRetard: 20,
      protectionCroisee: true,
    },
    fintrac: { actif: true, typesDossiers: ["immobilier"] },
    pipeda: {
      actif: true,
      retention: { immobilier: 10, immigration: 7 },
    },
  }),
  disciplines: JSON.stringify(["immobilier", "immigration"]),
  checklistsParType: JSON.stringify({
    immobilier_achat: [
      "Retainer signed",
      "Conflict check completed",
      "FINTRAC — ID verified (2 pieces)",
      "Title search ordered",
      "Requisitions on title",
      "Statement of Adjustments",
      "Title insurance ordered",
      "Closing funds received (trust)",
      "Client documents signed",
      "Title registration",
      "Post-closing confirmation",
    ],
    immobilier_condo: [
      "Retainer signed",
      "Conflict check completed",
      "Parking PIN + Locker PIN verified",
      "Status certificate received",
      "APS vs condo plan coherence",
      "POTL verification",
      "FINTRAC ID verified",
      "Title insurance",
      "Documents signed",
      "Closing funds (trust)",
      "Title registration",
    ],
    immigration_ee: [
      "Initial consultation + retainer signed",
      "CRS eligibility assessment",
      "ITA received (Day 0 — 60-day deadline)",
      "EE profile completed + CNP validated",
      "Background declaration completed",
      "Documents gathered (reference letters, diplomas)",
      "Medical exam ordered (valid 12 months)",
      "Police certificates obtained (no coverage gaps)",
      "Application submitted to IRCC (within 60 days of ITA)",
      "Biometrics (30 days post-IRCC letter)",
      "PFL / Interview if required",
      "COPR received",
      "Landing & file closure",
    ],
    immigration_parrainage: [
      "Consultation + retainer signed",
      "Conflict check (applicant ≠ sponsor in litigation)",
      "Background declaration (sponsored + sponsor)",
      "Family documents gathered",
      "IMM forms submitted",
      "AIP received",
      "Stage 2 permanent residence",
      "Biometrics + medical",
      "COPR",
      "Landing",
    ],
  }),
  modeFacturation: JSON.stringify({ principal: "forfait" }),
  conformite: JSON.stringify({
    verif_conflits: true,
    lso_ontario: true,
    fintrac: true,
    pipeda: true,
  }),
};

// Government fees (IRCC) + immobilier disbursements
const DEBOURS_TYPES = [
  { nom: "IRCC Application Fee — Permanent Residence", categorie: "Government Fee", coutDefaut: 1365, gouvernementRef: "IRCC" },
  { nom: "IRCC Biometrics Fee", categorie: "Government Fee", coutDefaut: 85, gouvernementRef: "IRCC" },
  { nom: "IRCC Sponsorship Fee", categorie: "Government Fee", coutDefaut: 1080, gouvernementRef: "IRCC" },
  { nom: "IRCC Work Permit Fee", categorie: "Government Fee", coutDefaut: 155, gouvernementRef: "IRCC" },
  { nom: "IRCC Right of Permanent Residence Fee", categorie: "Government Fee", coutDefaut: 515, gouvernementRef: "IRCC" },
  { nom: "Title Search", categorie: "Real Estate Disbursement", coutDefaut: 250, gouvernementRef: null },
  { nom: "Title Insurance", categorie: "Real Estate Disbursement", coutDefaut: 300, gouvernementRef: null },
  { nom: "Registration Fee", categorie: "Real Estate Disbursement", coutDefaut: 75, gouvernementRef: "LRO" },
  { nom: "Courier / Process Fees", categorie: "Real Estate Disbursement", coutDefaut: 50, gouvernementRef: null },
];

const DEBOURS_TEMPLATES = [
  { dossierType: "immigration_ee", nom: "IRCC Application Fee — Permanent Residence", isRequired: true },
  { dossierType: "immigration_ee", nom: "IRCC Biometrics Fee", isRequired: true },
  { dossierType: "immigration_ee", nom: "IRCC Right of Permanent Residence Fee", isRequired: false },
  { dossierType: "immigration_parrainage", nom: "IRCC Sponsorship Fee", isRequired: true },
  { dossierType: "immigration_parrainage", nom: "IRCC Biometrics Fee", isRequired: true },
  { dossierType: "immigration_travail", nom: "IRCC Work Permit Fee", isRequired: true },
  { dossierType: "immigration_travail", nom: "IRCC Biometrics Fee", isRequired: false },
  { dossierType: "immobilier_achat", nom: "Title Search", isRequired: true },
  { dossierType: "immobilier_achat", nom: "Title Insurance", isRequired: true },
  { dossierType: "immobilier_achat", nom: "Registration Fee", isRequired: true },
  { dossierType: "immobilier_achat", nom: "Courier / Process Fees", isRequired: false },
  { dossierType: "immobilier_condo", nom: "Title Search", isRequired: true },
  { dossierType: "immobilier_condo", nom: "Title Insurance", isRequired: true },
  { dossierType: "immobilier_condo", nom: "Registration Fee", isRequired: true },
  { dossierType: "immobilier_condo", nom: "Courier / Process Fees", isRequired: false },
];

async function main() {
  console.log("=== Onboarding: Derisier Law ===\n");

  // 1. Find cabinet
  const cabinet = await prisma.cabinet.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!cabinet) {
    console.error("No cabinet found. Create a cabinet first via the app.");
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
  console.log("  ✓ CabinetInterface applied (EN, forfait, By-Law 9, FINTRAC, PIPEDA)\n");

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
            ? `${dt.gouvernementRef} fee — non-taxable (no HST)`
            : "Disbursement — non-taxable",
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
  console.log(`  Interface: EN, forfait, By-Law 9 LSO, FINTRAC, PIPEDA`);
  console.log(`\n  Next: Create users via /inscription or admin panel.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
