/**
 * Seed débours templates Ontario (IRCC + Real Estate) pour un cabinet.
 * Run: npx tsx lib/seeds/debours-templates-on.ts derisier
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GOV_FEES = [
  { nom: "IRCC Application Fee — Permanent Residence", categorie: "Government Fee", coutDefaut: 1365, gouvernementRef: "IRCC" },
  { nom: "IRCC Biometrics Fee", categorie: "Government Fee", coutDefaut: 85, gouvernementRef: "IRCC" },
  { nom: "IRCC Sponsorship Fee", categorie: "Government Fee", coutDefaut: 1080, gouvernementRef: "IRCC" },
  { nom: "IRCC Work Permit Fee", categorie: "Government Fee", coutDefaut: 155, gouvernementRef: "IRCC" },
  { nom: "IRCC Study Permit Fee", categorie: "Government Fee", coutDefaut: 150, gouvernementRef: "IRCC" },
  { nom: "IRCC Right of Permanent Residence Fee", categorie: "Government Fee", coutDefaut: 515, gouvernementRef: "IRCC" },
  { nom: "IRCC Open Work Permit Holder Fee", categorie: "Government Fee", coutDefaut: 100, gouvernementRef: "IRCC" },
];

const REAL_ESTATE_FEES = [
  { nom: "Title Search", categorie: "Real Estate Disbursement", coutDefaut: 250, gouvernementRef: null },
  { nom: "Title Insurance", categorie: "Real Estate Disbursement", coutDefaut: 300, gouvernementRef: null },
  { nom: "Registration Fee (LRO)", categorie: "Real Estate Disbursement", coutDefaut: 75, gouvernementRef: "LRO" },
  { nom: "Courier / Process Fees", categorie: "Real Estate Disbursement", coutDefaut: 50, gouvernementRef: null },
  { nom: "Land Transfer Tax (Ontario)", categorie: "Government Fee", coutDefaut: 0, gouvernementRef: "Ontario" },
  { nom: "Municipal Land Transfer Tax (Toronto)", categorie: "Government Fee", coutDefaut: 0, gouvernementRef: "City of Toronto" },
  { nom: "Status Certificate Fee", categorie: "Real Estate Disbursement", coutDefaut: 100, gouvernementRef: null },
];

const TEMPLATES: { dossierType: string; nom: string; isRequired: boolean }[] = [
  // Express Entry
  { dossierType: "immigration_ee", nom: "IRCC Application Fee — Permanent Residence", isRequired: true },
  { dossierType: "immigration_ee", nom: "IRCC Biometrics Fee", isRequired: true },
  { dossierType: "immigration_ee", nom: "IRCC Right of Permanent Residence Fee", isRequired: false },
  // Parrainage
  { dossierType: "immigration_parrainage", nom: "IRCC Sponsorship Fee", isRequired: true },
  { dossierType: "immigration_parrainage", nom: "IRCC Biometrics Fee", isRequired: true },
  // Travail
  { dossierType: "immigration_travail", nom: "IRCC Work Permit Fee", isRequired: true },
  { dossierType: "immigration_travail", nom: "IRCC Biometrics Fee", isRequired: false },
  { dossierType: "immigration_travail", nom: "IRCC Open Work Permit Holder Fee", isRequired: false },
  // Étudiant
  { dossierType: "immigration_etudiant", nom: "IRCC Study Permit Fee", isRequired: true },
  { dossierType: "immigration_etudiant", nom: "IRCC Biometrics Fee", isRequired: false },
  // Immobilier achat
  { dossierType: "immobilier_achat", nom: "Title Search", isRequired: true },
  { dossierType: "immobilier_achat", nom: "Title Insurance", isRequired: true },
  { dossierType: "immobilier_achat", nom: "Registration Fee (LRO)", isRequired: true },
  { dossierType: "immobilier_achat", nom: "Courier / Process Fees", isRequired: false },
  { dossierType: "immobilier_achat", nom: "Land Transfer Tax (Ontario)", isRequired: true },
  // Immobilier condo
  { dossierType: "immobilier_condo", nom: "Title Search", isRequired: true },
  { dossierType: "immobilier_condo", nom: "Title Insurance", isRequired: true },
  { dossierType: "immobilier_condo", nom: "Registration Fee (LRO)", isRequired: true },
  { dossierType: "immobilier_condo", nom: "Courier / Process Fees", isRequired: false },
  { dossierType: "immobilier_condo", nom: "Land Transfer Tax (Ontario)", isRequired: true },
  { dossierType: "immobilier_condo", nom: "Status Certificate Fee", isRequired: true },
  { dossierType: "immobilier_condo", nom: "Municipal Land Transfer Tax (Toronto)", isRequired: false },
];

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx lib/seeds/debours-templates-on.ts <cabinet-slug>");
    process.exit(1);
  }

  const cabinet = await prisma.cabinet.findFirst({ where: { nom: { contains: slug, mode: "insensitive" } } });
  if (!cabinet) {
    console.error(`Cabinet not found for slug: ${slug}`);
    process.exit(1);
  }

  const allFees = [...GOV_FEES, ...REAL_ESTATE_FEES];
  const typeIds: Record<string, string> = {};

  for (const fee of allFees) {
    const existing = await prisma.deboursType.findFirst({ where: { cabinetId: cabinet.id, nom: fee.nom } });
    if (existing) {
      await prisma.deboursType.update({
        where: { id: existing.id },
        data: { isGovernment: !!fee.gouvernementRef, gouvernementRef: fee.gouvernementRef, taxable: false, coutDefaut: fee.coutDefaut },
      });
      typeIds[fee.nom] = existing.id;
    } else {
      const created = await prisma.deboursType.create({
        data: {
          cabinetId: cabinet.id,
          nom: fee.nom,
          categorie: fee.categorie,
          description: fee.gouvernementRef ? `${fee.gouvernementRef} — non-taxable (no HST)` : "Disbursement — non-taxable",
          taxable: false,
          isGovernment: !!fee.gouvernementRef,
          gouvernementRef: fee.gouvernementRef,
          coutDefaut: fee.coutDefaut,
          actif: true,
        },
      });
      typeIds[fee.nom] = created.id;
    }
  }

  let templatesCount = 0;
  for (const tmpl of TEMPLATES) {
    const typeId = typeIds[tmpl.nom];
    if (!typeId) continue;
    await prisma.deboursTemplate.upsert({
      where: { cabinetId_dossierType_deboursTypeId: { cabinetId: cabinet.id, dossierType: tmpl.dossierType, deboursTypeId: typeId } },
      create: { cabinetId: cabinet.id, dossierType: tmpl.dossierType, deboursTypeId: typeId, isRequired: tmpl.isRequired },
      update: { isRequired: tmpl.isRequired },
    });
    templatesCount++;
  }

  console.log(`✓ Débours templates Ontario appliqués pour: ${cabinet.nom}`);
  console.log(`  DeboursTypes: ${allFees.length} (upserted)`);
  console.log(`  DeboursTemplates: ${templatesCount} (upserted)`);
}

main().finally(() => prisma.$disconnect());
