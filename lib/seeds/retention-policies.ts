/**
 * Seed politiques de rétention documentaire pour un cabinet.
 * Run: npx tsx lib/seeds/retention-policies.ts derisier
 *
 * Ontario: PIPEDA + LSO By-Law 9
 * - Immobilier: 10 ans (FINTRAC PCMLTFA obligation)
 * - Immigration: 7 ans (IRCC + PIPEDA)
 * - Général: 7 ans
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const POLICIES = [
  { documentType: "dossier_immobilier", retentionYears: 10, legalBasis: "FINTRAC PCMLTFA s.6 + LSO By-Law 9" },
  { documentType: "dossier_immigration", retentionYears: 7, legalBasis: "PIPEDA + IRCC guidelines" },
  { documentType: "fintrac_declaration", retentionYears: 7, legalBasis: "FINTRAC PCMLTFA s.6 — 7-year mandatory retention" },
  { documentType: "engagement_letter", retentionYears: 7, legalBasis: "LSO Rules of Professional Conduct" },
  { documentType: "facture", retentionYears: 7, legalBasis: "CRA — 7-year tax record retention" },
  { documentType: "trust_reconciliation", retentionYears: 10, legalBasis: "LSO By-Law 9 s.18 — trust records" },
  { documentType: "correspondence", retentionYears: 7, legalBasis: "LSO Rules of Professional Conduct" },
  { documentType: "closure_letter", retentionYears: 7, legalBasis: "LSO Rules of Professional Conduct" },
  { documentType: "background_declaration", retentionYears: 7, legalBasis: "PIPEDA — immigration client data" },
];

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx lib/seeds/retention-policies.ts <cabinet-slug>");
    process.exit(1);
  }

  const cabinet = await prisma.cabinet.findFirst({ where: { nom: { contains: slug, mode: "insensitive" } } });
  if (!cabinet) {
    console.error(`Cabinet not found for slug: ${slug}`);
    process.exit(1);
  }

  for (const policy of POLICIES) {
    await prisma.documentRetentionPolicy.upsert({
      where: { cabinetId_documentType: { cabinetId: cabinet.id, documentType: policy.documentType } },
      create: { cabinetId: cabinet.id, ...policy },
      update: { retentionYears: policy.retentionYears, legalBasis: policy.legalBasis },
    });
  }

  console.log(`✓ Politiques de rétention appliquées pour: ${cabinet.nom}`);
  for (const p of POLICIES) {
    console.log(`  ${p.documentType}: ${p.retentionYears} ans — ${p.legalBasis}`);
  }
}

main().finally(() => prisma.$disconnect());
