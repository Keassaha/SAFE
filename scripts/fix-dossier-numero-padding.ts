/**
 * One-off script: pad numeroDossier to 3 digits (e.g. 2026-1 -> 2026-001).
 * Run with: npx tsx scripts/fix-dossier-numero-padding.ts
 */
import { PrismaClient } from "@prisma/client";

function toPaddedFormat(numeroDossier: string | null): string | null {
  if (!numeroDossier || !/^\d{4}-\d+$/.test(numeroDossier.trim())) return null;
  const [year, num] = numeroDossier.trim().split("-");
  const n = parseInt(num, 10);
  if (Number.isNaN(n) || n < 1) return null;
  return `${year}-${String(n).padStart(3, "0")}`;
}

async function main() {
  const prisma = new PrismaClient();
  const dossiers = await prisma.dossier.findMany({
    where: { numeroDossier: { not: null } },
    select: { id: true, numeroDossier: true },
  });
  let updated = 0;
  for (const d of dossiers) {
    const padded = toPaddedFormat(d.numeroDossier);
    if (padded && padded !== d.numeroDossier) {
      await prisma.dossier.update({
        where: { id: d.id },
        data: { numeroDossier: padded },
      });
      console.log(`  ${d.numeroDossier} -> ${padded}`);
      updated++;
    }
  }
  console.log("Updated dossier(s) with padded numero:", updated);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
