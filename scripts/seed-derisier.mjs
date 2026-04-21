/**
 * Seed Derisier Law cabinet + users + interface config
 *
 * Usage:
 *   node scripts/seed-derisier.mjs
 *
 * Creates:
 * - Cabinet "Derisier Law" (ON) with LSO barreau #56246k
 * - CabinetInterface v3 (Real Estate + Immigration, flat fee bimonthly, HST 13%)
 * - User 1: Me M-A Derisier (admin_cabinet) — info@derisierlaw.com
 * - User 2: Assistant Placeholder (assistante) — assistant@derisierlaw.com
 *
 * Idempotent: re-running updates passwords and config, doesn't duplicate.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---- Configuration ---------------------------------------------------------

const CABINET_CONFIG = {
  nom: "Derisier Law",
  email: "info@derisierlaw.com",
  telephone: null, // to be confirmed
  adresse: null,   // to be confirmed
  barreauNumero: "56246k", // LSO Ontario
  plan: "essentiel",
  config: JSON.stringify({
    devise: "CAD",
    tauxInteret: 0, // no interest on late invoices
    formatFacture: "YYYY-NNNN",
    taxes: { mode: "hst", taux: 13 },
    province: "ON",
  }),
};

const USERS = [
  {
    email: "info@derisierlaw.com",
    password: "DerisierLaw2026!",
    nom: "Me M.-A. Derisier",
    role: "admin_cabinet",
  },
  {
    email: "assistant@derisierlaw.com",
    password: "Assistant2026!",
    nom: "Assistant Derisier",
    role: "assistante",
  },
];

const INTERFACE_CONFIG = {
  // IDs must match NAV_ITEMS in components/layout/SidebarNav.tsx
  ongletsActifs: JSON.stringify([
    "dashboard",
    "clients",
    "dossiers",
    "facturation",
    "comptabilite",
    "comptes",
    "documents",
    "conformite",
    "parametres",
  ]),
  ongletsMasques: JSON.stringify([
    "temps",
    "fiches-de-temps",
    "employees",
    "rapports",
  ]),
  disciplines: JSON.stringify(["immobilier", "immigration"]),
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
    email: {
      provider: "resend",
      fromAddress: "info@derisierlaw.com",
      fromName: "Derisier Law",
      domainVerified: false,
    },
    payments: {
      stripe: { enabled: false, modeTest: true },
    },
    signatures: {
      provider: "docusign",
      enabled: false,
    },
    documents: {
      exportPdfEnabled: true,
      templates: {
        "engagement-letter": { enabled: true, autoGenerate: true, signatureRequired: true },
        invoice: { enabled: true, autoSend: true },
        receipt: { enabled: true, autoSend: true },
        "closure-letter": { enabled: true, autoGenerate: false },
        "fintrac-declaration": { enabled: true, autoGenerate: true, signatureRequired: true },
        "statement-of-adjustments": { enabled: true, autoGenerate: false },
        "imm-5476": { enabled: true, autoGenerate: true, signatureManuscriteRequired: true },
      },
    },
  }),
  widgets: JSON.stringify([
    "trust-reconciliation-alert",
    "lso-compliance-score",
    "active-files",
    "pending-billing",
    "upcoming-deadlines",
    "recent-documents",
    "email-activity",
    "quick-actions",
  ]),
  checklistsParType: JSON.stringify({
    immobilier_achat: [
      "Mandate signed",
      "Conflict of interest check",
      "FINTRAC — client identity (2 IDs)",
      "Title search ordered",
      "Title requisitions",
      "Statement of Adjustments",
      "Title insurance ordered",
      "Closing funds (trust)",
      "Client documents signed",
      "Title registration",
      "Post-closing confirmation",
    ],
    immobilier_condo: [
      "Mandate signed",
      "Conflict of interest check",
      "Parking PIN verified",
      "Locker PIN verified",
      "Status Certificate received",
      "APS vs condo plan consistency",
      "POTL verification",
      "FINTRAC identity",
      "Title insurance",
      "Closing funds (trust)",
      "Title registration",
    ],
    immigration_ee: [
      "Initial consultation + mandate signed",
      "CRS eligibility assessment",
      "ITA received (J0 — 60d max)",
      "EE profile + CNP validated",
      "Antecedents declaration (refusals/overstay/arrests)",
      "Documents gathered",
      "Medical exam (valid 12 months)",
      "Police certificates (no coverage gap)",
      "Application submitted IRCC (≤60d post-ITA)",
      "Biometrics (30d max post-IRCC letter)",
      "PFL/Interview if requested",
      "COPR received",
      "Landing + closure",
    ],
    immigration_parrainage: [
      "Consultation + mandate signed",
      "Conflict check (applicant ≠ sponsor in dispute)",
      "Antecedents declaration (applicant + sponsor)",
      "Family documents",
      "IMM forms submitted",
      "AIP received",
      "Stage 2 permanence application",
      "Biometrics + medical",
      "COPR",
      "Landing",
    ],
  }),
  champsParType: JSON.stringify({
    immobilier: ["propertyAddress", "closingDate", "purchasePrice", "mortgageLender", "fintracVerified"],
    immigration: ["nationalite", "typeApplication", "cnpCode", "itaDeadline", "medicalExpiry", "biometricsExpiry"],
  }),
  modeFacturation: JSON.stringify({
    principal: "forfait",
    grille: false,
    rabais: false,
  }),
  conformite: JSON.stringify({
    verif_conflits: true,
    lso_ontario: true,
    fintrac: true,
    pipeda: true,
  }),
};

// ---- Execution -------------------------------------------------------------

async function main() {
  console.log("🏛️  Seeding Derisier Law cabinet...\n");

  // 1. Cabinet (find existing by name or create)
  let cabinet = await prisma.cabinet.findFirst({
    where: { nom: CABINET_CONFIG.nom },
  });

  if (cabinet) {
    console.log(`✅ Cabinet exists: ${cabinet.nom} (id: ${cabinet.id})`);
    console.log(`   Updating cabinet fields...`);
    cabinet = await prisma.cabinet.update({
      where: { id: cabinet.id },
      data: CABINET_CONFIG,
    });
  } else {
    cabinet = await prisma.cabinet.create({ data: CABINET_CONFIG });
    console.log(`✅ Cabinet created: ${cabinet.nom} (id: ${cabinet.id})`);
  }

  // 2. CabinetInterface
  const existingInterface = await prisma.cabinetInterface.findUnique({
    where: { cabinetId: cabinet.id },
  });

  if (existingInterface) {
    await prisma.cabinetInterface.update({
      where: { cabinetId: cabinet.id },
      data: INTERFACE_CONFIG,
    });
    console.log(`✅ CabinetInterface updated`);
  } else {
    await prisma.cabinetInterface.create({
      data: {
        cabinetId: cabinet.id,
        ...INTERFACE_CONFIG,
      },
    });
    console.log(`✅ CabinetInterface created`);
  }

  // 3. Users
  console.log(`\n👥 Seeding users...`);
  for (const userConfig of USERS) {
    const passwordHash = await bcrypt.hash(userConfig.password, 10);
    const existing = await prisma.user.findFirst({
      where: {
        email: userConfig.email.toLowerCase(),
        cabinetId: cabinet.id,
      },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          nom: userConfig.nom,
          role: userConfig.role,
        },
      });
      console.log(`   ✅ Updated: ${userConfig.email} (${userConfig.role})`);
    } else {
      await prisma.user.create({
        data: {
          cabinetId: cabinet.id,
          email: userConfig.email.toLowerCase(),
          passwordHash,
          nom: userConfig.nom,
          role: userConfig.role,
        },
      });
      console.log(`   ✅ Created: ${userConfig.email} (${userConfig.role})`);
    }
  }

  // ---- Summary -----------------------------------------------------------
  console.log("\n" + "=".repeat(60));
  console.log("🎉 Derisier Law cabinet ready!");
  console.log("=".repeat(60));
  console.log(`\n🌐 URL: http://localhost:3001`);
  console.log(`\n🔑 Credentials:\n`);
  console.log(`   Admin (Me Derisier)`);
  console.log(`     Email:    ${USERS[0].email}`);
  console.log(`     Password: ${USERS[0].password}`);
  console.log(`\n   Assistant`);
  console.log(`     Email:    ${USERS[1].email}`);
  console.log(`     Password: ${USERS[1].password}`);
  console.log(`\n📋 Cabinet config:`);
  console.log(`     Province:      Ontario (LSO #${CABINET_CONFIG.barreauNumero})`);
  console.log(`     Practice:      Real Estate + Immigration`);
  console.log(`     Billing:       Flat fee, bimonthly, HST 13%`);
  console.log(`     Hidden tabs:   Time / Timesheets / Employees`);
  console.log(`     Integrations:  Resend (ready), Stripe (disabled), DocuSign (disabled)`);
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
