/**
 * Creates Derisier Law cabinet + users.
 * Run: npx tsx lib/seeds/create-derisier-cabinet.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Creating Derisier Law Cabinet ===\n");

  // 1. Create Cabinet
  const cabinet = await prisma.cabinet.upsert({
    where: { id: "derisier-law-on-2026" },
    create: {
      id: "derisier-law-on-2026",
      nom: "Derisier Law",
      adresse: "Ontario, Canada",
      telephone: "(416) 555-0199",
      email: "info@derisierlaw.com",
      barreauNumero: "56246k",
      plan: "professionnel",
    },
    update: {
      nom: "Derisier Law",
      adresse: "Ontario, Canada",
      telephone: "(416) 555-0199",
      email: "info@derisierlaw.com",
      barreauNumero: "56246k",
    },
  });
  console.log(`Cabinet: ${cabinet.nom} (${cabinet.id})`);

  // 2. Create Me Derisier (avocate principale)
  const passwordHash = await bcrypt.hash("Derisier2026", 12);

  const avocate = await prisma.user.upsert({
    where: {
      id: "derisier-user-avocate",
    },
    create: {
      id: "derisier-user-avocate",
      cabinetId: cabinet.id,
      email: "info@derisierlaw.com",
      passwordHash,
      nom: "Me Marjorie-Alexandra Derisier",
      role: "admin_cabinet",
      isBillable: true,
    },
    update: {
      email: "info@derisierlaw.com",
      passwordHash,
      nom: "Me Marjorie-Alexandra Derisier",
      role: "admin_cabinet",
    },
  });
  console.log(`User: ${avocate.nom} (${avocate.email}) — role: ${avocate.role}`);

  // 3. Create Natalya (assistante)
  const assistantHash = await bcrypt.hash("Aalyiah2026", 12);

  const assistante = await prisma.user.upsert({
    where: {
      id: "derisier-user-assistante",
    },
    create: {
      id: "derisier-user-assistante",
      cabinetId: cabinet.id,
      email: "aalyiah@derisierlaw.com",
      passwordHash: assistantHash,
      nom: "Aalyiah",
      role: "assistante",
      isBillable: false,
    },
    update: {
      email: "aalyiah@derisierlaw.com",
      passwordHash: assistantHash,
      nom: "Aalyiah",
      role: "assistante",
    },
  });
  console.log(`User: ${assistante.nom} (${assistante.email}) — role: ${assistante.role}`);

  // 4. Apply CabinetInterface
  await prisma.cabinetInterface.upsert({
    where: { cabinetId: cabinet.id },
    create: {
      cabinetId: cabinet.id,
      ongletsActifs: JSON.stringify(["tableau-de-bord", "clients", "dossiers", "facturation", "comptes", "documents", "conformite", "parametres"]),
      ongletsMasques: JSON.stringify(["temps", "fiches-de-temps", "employees", "rapports-comptables"]),
      modules: JSON.stringify({
        facturation: { principal: "forfait", periodeFact: "bimonthly", joursRelance: 60, tauxInterets: 0, taxes: { mode: "hst", taux: 13 }, methodesAcceptees: ["cheque", "wire", "bank_draft", "carte", "interac", "cash"] },
        fideicommis: { regle: "bylaw9-lso", interets: "LFO", reconciliation: "mensuelle", alerteRetard: 20, protectionCroisee: true },
        fintrac: { actif: true, typesDossiers: ["immobilier"] },
        pipeda: { actif: true, retention: { immobilier: 10, immigration: 7 } },
      }),
      disciplines: JSON.stringify(["immobilier", "immigration"]),
      checklistsParType: JSON.stringify({
        immobilier_achat: ["Retainer signed", "Conflict check", "FINTRAC — 2 IDs", "Title search", "Requisitions", "SOA", "Title insurance", "Closing funds (trust)", "Docs signed", "Title registration", "Post-closing"],
        immobilier_condo: ["Retainer signed", "Conflict check", "Parking + Locker PINs", "Status certificate", "APS vs condo plan", "POTL", "FINTRAC ID", "Title insurance", "Docs signed", "Closing funds", "Registration"],
        immigration_ee: ["Consultation + retainer", "CRS assessment", "ITA received (60-day deadline)", "EE profile + CNP validated", "Background declaration", "Documents gathered", "Medical exam (12mo)", "Police certs (no gaps)", "IRCC submission (≤60d)", "Biometrics (30d)", "PFL/Interview", "COPR", "Landing"],
        immigration_parrainage: ["Consultation + retainer", "Conflict check (applicant ≠ sponsor)", "Background declaration", "Family docs", "IMM forms submitted", "AIP received", "Stage 2 PR", "Biometrics + medical", "COPR", "Landing"],
      }),
      modeFacturation: JSON.stringify({ principal: "forfait" }),
      conformite: JSON.stringify({ verif_conflits: true, lso_ontario: true, fintrac: true, pipeda: true }),
    },
    update: {},
  });
  console.log("CabinetInterface applied");

  // 5. Seed DeboursTypes
  const deboursTypes = [
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

  const typeIds: Record<string, string> = {};
  for (const dt of deboursTypes) {
    const existing = await prisma.deboursType.findFirst({ where: { cabinetId: cabinet.id, nom: dt.nom } });
    if (existing) {
      typeIds[dt.nom] = existing.id;
    } else {
      const created = await prisma.deboursType.create({
        data: {
          cabinetId: cabinet.id, nom: dt.nom, categorie: dt.categorie,
          description: dt.gouvernementRef ? `${dt.gouvernementRef} — no HST` : "Disbursement",
          taxable: false, isGovernment: !!dt.gouvernementRef, gouvernementRef: dt.gouvernementRef, coutDefaut: dt.coutDefaut, actif: true,
        },
      });
      typeIds[dt.nom] = created.id;
    }
  }
  console.log(`DeboursTypes: ${Object.keys(typeIds).length} ready`);

  // 6. Seed DeboursTemplates
  const templates = [
    { dossierType: "immigration_ee", nom: "IRCC Application Fee — Permanent Residence", isRequired: true },
    { dossierType: "immigration_ee", nom: "IRCC Biometrics Fee", isRequired: true },
    { dossierType: "immigration_parrainage", nom: "IRCC Sponsorship Fee", isRequired: true },
    { dossierType: "immigration_parrainage", nom: "IRCC Biometrics Fee", isRequired: true },
    { dossierType: "immigration_travail", nom: "IRCC Work Permit Fee", isRequired: true },
    { dossierType: "immobilier_achat", nom: "Title Search", isRequired: true },
    { dossierType: "immobilier_achat", nom: "Title Insurance", isRequired: true },
    { dossierType: "immobilier_achat", nom: "Registration Fee", isRequired: true },
    { dossierType: "immobilier_condo", nom: "Title Search", isRequired: true },
    { dossierType: "immobilier_condo", nom: "Title Insurance", isRequired: true },
    { dossierType: "immobilier_condo", nom: "Registration Fee", isRequired: true },
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

  // 7. Seed ForfaitServices (fee schedule)
  console.log("\nStep 5: Seeding ForfaitServices (fee schedule)...");
  const forfaitServices = [
    { code: "IMMO-ACHAT", nom: "Real estate purchase", montant: 1500, categorie: "immobilier", sousType: "achat" },
    { code: "IMMO-VENTE", nom: "Real estate sale", montant: 1200, categorie: "immobilier", sousType: "vente" },
    { code: "IMMO-CONDO", nom: "Condo transaction", montant: 1800, categorie: "immobilier", sousType: "condo" },
    { code: "IMMO-REFI", nom: "Mortgage refinance", montant: 900, categorie: "immobilier", sousType: "hypotheque" },
    { code: "IMMO-TRANSF", nom: "Title transfer", montant: 800, categorie: "immobilier", sousType: null },
    { code: "IMM-EE", nom: "Express Entry (Permanent Residence)", montant: 2500, categorie: "immigration", sousType: "ee" },
    { code: "IMM-PARR", nom: "Family sponsorship", montant: 2000, categorie: "immigration", sousType: "parrainage" },
    { code: "IMM-TRAV", nom: "Work permit", montant: 1800, categorie: "immigration", sousType: "travail" },
    { code: "IMM-CONSULT", nom: "Initial consultation", montant: 250, categorie: "immigration", sousType: null },
    { code: "IMM-APPEL", nom: "Appeal / Judicial review", montant: 3500, categorie: "immigration", sousType: "appel" },
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

  console.log("\n=== Derisier Law Ready ===");
  console.log("Login credentials:");
  console.log("  Cabinet: Derisier Law");
  console.log("  Avocate: info@derisierlaw.com / Derisier2026");
  console.log("  Assistante: natalya@derisierlaw.com / Natalya2026");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
