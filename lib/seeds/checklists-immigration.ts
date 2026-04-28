/**
 * Seed checklists immigration pour un cabinet.
 * Run: npx tsx lib/seeds/checklists-immigration.ts derisier
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CHECKLISTS = {
  immigration_ee: [
    "Consultation + retainer signed",
    "CRS score assessment",
    "ITA received (60-day deadline starts)",
    "EE profile created + NOC/TEER validated",
    "Background declaration signed (PIPEDA)",
    "Documents gathered (passport, language tests, education, employment)",
    "Medical exam completed (valid 12 months)",
    "Police certificates obtained (no gaps in residence)",
    "IRCC application submitted (within 60 days of ITA)",
    "Biometrics completed (within 30 days of request)",
    "PFL received / interview scheduled",
    "COPR issued",
    "Landing completed",
  ],
  immigration_parrainage: [
    "Consultation + retainer signed",
    "Conflict check (applicant ≠ sponsor relationship verified)",
    "Background declaration signed (PIPEDA)",
    "Family documents gathered (marriage cert, birth certs)",
    "IMM forms completed + submitted (Stage 1)",
    "AIP (Approval in Principle) received",
    "Stage 2 PR application submitted",
    "Biometrics + medical exam completed",
    "COPR issued",
    "Landing completed",
  ],
  immigration_travail: [
    "Consultation + retainer signed",
    "LMIA required? → confirmed with employer",
    "Job offer letter obtained",
    "IRCC work permit application submitted",
    "Biometrics completed (within 30 days)",
    "Work permit issued",
    "Entry / arrival confirmed",
  ],
  immigration_etudiant: [
    "Consultation + retainer signed",
    "Letter of Acceptance from DLI obtained",
    "Study permit application submitted",
    "Biometrics completed",
    "Study permit issued",
    "Entry confirmed",
  ],
};

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx lib/seeds/checklists-immigration.ts <cabinet-slug>");
    process.exit(1);
  }

  const cabinet = await prisma.cabinet.findFirst({ where: { nom: { contains: slug, mode: "insensitive" } } });
  if (!cabinet) {
    console.error(`Cabinet not found for slug: ${slug}`);
    process.exit(1);
  }

  const iface = await prisma.cabinetInterface.findUnique({ where: { cabinetId: cabinet.id } });
  if (!iface) {
    console.error(`CabinetInterface not found for cabinet: ${cabinet.nom}`);
    process.exit(1);
  }

  const existing = iface.checklistsParType ? JSON.parse(iface.checklistsParType as string) : {};
  const merged = { ...existing, ...CHECKLISTS };

  await prisma.cabinetInterface.update({
    where: { cabinetId: cabinet.id },
    data: { checklistsParType: JSON.stringify(merged) },
  });

  console.log(`✓ Checklists immigration appliquées pour: ${cabinet.nom}`);
  for (const [type, items] of Object.entries(CHECKLISTS)) {
    console.log(`  ${type}: ${items.length} étapes`);
  }
}

main().finally(() => prisma.$disconnect());
