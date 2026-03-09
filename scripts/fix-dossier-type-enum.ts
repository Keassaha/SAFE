/**
 * One-off script: set Dossier.type to NULL for any value not in DossierType enum.
 * Run with: npx tsx scripts/fix-dossier-type-enum.ts
 */
import { PrismaClient } from "@prisma/client";

const VALID_TYPES = [
  "droit_famille",
  "litige_civil",
  "criminel",
  "immigration",
  "corporate",
  "autre",
];

async function main() {
  const prisma = new PrismaClient();
  const result = await prisma.$executeRawUnsafe(
    `UPDATE Dossier SET type = NULL WHERE type IS NOT NULL AND type NOT IN (${VALID_TYPES.map((_) => "?").join(",")})`,
    ...VALID_TYPES
  );
  console.log("Updated dossier(s) with invalid type:", result);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
