/**
 * Seed data for IRCC government fees and disbursement templates.
 * Run this as part of onboarding or manually for Derisier Law.
 *
 * DeboursType entries for government fees (non-taxable)
 * DeboursTemplate entries linking expected disbursements to dossier types
 */

import { prisma } from "@/lib/db";

export async function seedDeboursTemplates(cabinetId: string) {
  // 1. Create government fee DeboursTypes (B5 — IRCC separation)
  const govFees = [
    {
      nom: "IRCC Application Fee — Permanent Residence",
      categorie: "Government Fee",
      coutDefaut: 1365,
      gouvernementRef: "IRCC",
    },
    {
      nom: "IRCC Biometrics Fee",
      categorie: "Government Fee",
      coutDefaut: 85,
      gouvernementRef: "IRCC",
    },
    {
      nom: "IRCC Sponsorship Fee",
      categorie: "Government Fee",
      coutDefaut: 1080,
      gouvernementRef: "IRCC",
    },
    {
      nom: "IRCC Work Permit Fee",
      categorie: "Government Fee",
      coutDefaut: 155,
      gouvernementRef: "IRCC",
    },
    {
      nom: "IRCC Right of Permanent Residence Fee",
      categorie: "Government Fee",
      coutDefaut: 515,
      gouvernementRef: "IRCC",
    },
  ];

  const immobilierFees = [
    {
      nom: "Title Search",
      categorie: "Real Estate Disbursement",
      coutDefaut: 250,
      gouvernementRef: null,
    },
    {
      nom: "Title Insurance",
      categorie: "Real Estate Disbursement",
      coutDefaut: 300,
      gouvernementRef: null,
    },
    {
      nom: "Registration Fee",
      categorie: "Real Estate Disbursement",
      coutDefaut: 75,
      gouvernementRef: "LRO", // Land Registry Office
    },
    {
      nom: "Courier / Process Fees",
      categorie: "Real Estate Disbursement",
      coutDefaut: 50,
      gouvernementRef: null,
    },
  ];

  const createdTypes: Record<string, string> = {};

  for (const fee of [...govFees, ...immobilierFees]) {
    const existing = await prisma.deboursType.findFirst({
      where: { cabinetId, nom: fee.nom },
    });
    if (existing) {
      createdTypes[fee.nom] = existing.id;
      // Update to ensure flags are set
      await prisma.deboursType.update({
        where: { id: existing.id },
        data: {
          isGovernment: !!fee.gouvernementRef,
          gouvernementRef: fee.gouvernementRef,
          taxable: false, // Government/disbursement fees are not taxable
          coutDefaut: fee.coutDefaut,
        },
      });
    } else {
      const created = await prisma.deboursType.create({
        data: {
          cabinetId,
          nom: fee.nom,
          categorie: fee.categorie,
          description: fee.gouvernementRef
            ? `${fee.gouvernementRef} fee — non-taxable (no HST)`
            : "Disbursement — non-taxable",
          taxable: false,
          isGovernment: !!fee.gouvernementRef,
          gouvernementRef: fee.gouvernementRef,
          coutDefaut: fee.coutDefaut,
          actif: true,
        },
      });
      createdTypes[fee.nom] = created.id;
    }
  }

  // 2. Create DeboursTemplates (B6 — expected disbursements by dossier type)
  const templates: { dossierType: string; nom: string; isRequired: boolean }[] = [
    // Immigration — Express Entry
    { dossierType: "immigration_ee", nom: "IRCC Application Fee — Permanent Residence", isRequired: true },
    { dossierType: "immigration_ee", nom: "IRCC Biometrics Fee", isRequired: true },
    { dossierType: "immigration_ee", nom: "IRCC Right of Permanent Residence Fee", isRequired: false },
    // Immigration — Sponsorship
    { dossierType: "immigration_parrainage", nom: "IRCC Sponsorship Fee", isRequired: true },
    { dossierType: "immigration_parrainage", nom: "IRCC Biometrics Fee", isRequired: true },
    // Immigration — Work permit
    { dossierType: "immigration_travail", nom: "IRCC Work Permit Fee", isRequired: true },
    { dossierType: "immigration_travail", nom: "IRCC Biometrics Fee", isRequired: false },
    // Immobilier — Purchase
    { dossierType: "immobilier_achat", nom: "Title Search", isRequired: true },
    { dossierType: "immobilier_achat", nom: "Title Insurance", isRequired: true },
    { dossierType: "immobilier_achat", nom: "Registration Fee", isRequired: true },
    { dossierType: "immobilier_achat", nom: "Courier / Process Fees", isRequired: false },
    // Immobilier — Condo
    { dossierType: "immobilier_condo", nom: "Title Search", isRequired: true },
    { dossierType: "immobilier_condo", nom: "Title Insurance", isRequired: true },
    { dossierType: "immobilier_condo", nom: "Registration Fee", isRequired: true },
    { dossierType: "immobilier_condo", nom: "Courier / Process Fees", isRequired: false },
  ];

  for (const tmpl of templates) {
    const typeId = createdTypes[tmpl.nom];
    if (!typeId) continue;

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
      update: {
        isRequired: tmpl.isRequired,
      },
    });
  }

  return { typesCreated: Object.keys(createdTypes).length, templatesCreated: templates.length };
}
