/**
 * Seed checklists immobilier Ontario pour un cabinet.
 * Run: npx tsx lib/seeds/checklists-immobilier-on.ts derisier
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CHECKLISTS = {
  immobilier_achat: [
    "Retainer signed",
    "Conflict check",
    "FINTRAC — 2 IDs (primary + secondary)",
    "Title search ordered",
    "Requisitions reviewed",
    "Statement of Adjustments (SOA) prepared",
    "Title insurance obtained",
    "Closing funds received in trust",
    "Documents signed by client",
    "Title registration (LRO)",
    "Post-closing: docs delivered + file updated",
  ],
  immobilier_condo: [
    "Retainer signed",
    "Conflict check",
    "Parking + Locker PINs confirmed",
    "Status certificate reviewed (10-day window)",
    "APS vs condo plan verified",
    "POTL (Parcel of Tied Land) confirmed",
    "FINTRAC ID (primary + secondary)",
    "Title insurance obtained",
    "Documents signed by client",
    "Closing funds received in trust",
    "Title registration (LRO)",
    "Post-closing: status cert + docs filed",
  ],
  immobilier_vente: [
    "Retainer signed",
    "Conflict check",
    "FINTRAC — 2 IDs",
    "Discharge of mortgage confirmed",
    "Statement of Adjustments (SOA) prepared",
    "Documents signed by client",
    "Proceeds disbursed from trust",
    "Title transfer registered (LRO)",
    "Post-closing: file updated",
  ],
};

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx lib/seeds/checklists-immobilier-on.ts <cabinet-slug>");
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

  console.log(`✓ Checklists immobilier Ontario appliquées pour: ${cabinet.nom}`);
  for (const [type, items] of Object.entries(CHECKLISTS)) {
    console.log(`  ${type}: ${items.length} étapes`);
  }
}

main().finally(() => prisma.$disconnect());
