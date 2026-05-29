/**
 * Ajouts de configuration Derisier Law (demande Aaliyah Regimbald, 2026-05).
 *
 * LOT 1 (sûr, idempotent, additif) :
 *   - N° GST/HST sur le cabinet (apparaît automatiquement sur la facture)
 *   - 5 catégories comptables (ExpenseCategory)
 *
 * Dry-run par défaut :
 *   node scripts/configure-derisier-aaliyah-2026-05.mjs
 * Application :
 *   APPLY_DERISIER_CONFIG=YES node scripts/configure-derisier-aaliyah-2026-05.mjs --apply
 *
 * NON inclus ici (nécessitent une spec + build — Lot 3) :
 *   - Préfixes de n° dossier (format 2026-IMM-00000)
 *   - Sujets / sous-matières sélectionnables
 *   - Gestion des templates de documents
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CABINET_ID = "derisier-law-on-2026";
const HST_NUMBER = "748964277RT0001";

const EXPENSE_CATEGORIES = [
  { name: "Débours / Frais", code: "DEBOURS", sortOrder: 0 },
  { name: "Fournitures et souscriptions", code: "FOURNITURES", sortOrder: 1 },
  { name: "Paie des employés", code: "PAIE", sortOrder: 2 },
  { name: "Honoraires professionnels (Professional Fees)", code: "HONORAIRES", sortOrder: 3 },
  { name: "Remises de taxes (Tax Remittances)", code: "REMISES_TAXES", sortOrder: 4 },
];

const APPLY = process.argv.includes("--apply") && process.env.APPLY_DERISIER_CONFIG === "YES";

async function main() {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: CABINET_ID },
    select: { nom: true, config: true },
  });
  if (!cabinet) throw new Error(`Cabinet ${CABINET_ID} introuvable`);

  console.log(`Cabinet ciblé: ${cabinet.nom} (${CABINET_ID})`);
  console.log(`Mode: ${APPLY ? "APPLICATION" : "simulation seulement"}\n`);

  // 1) Fusion du n° GST/HST dans Cabinet.config (sans écraser le reste)
  let config = {};
  try {
    config = cabinet.config ? JSON.parse(cabinet.config) : {};
  } catch {
    config = {};
  }
  const before = config.taxNumbers?.hstNumber ?? "(aucun)";
  config.taxNumbers = { ...(config.taxNumbers || {}), hstNumber: HST_NUMBER };
  console.log(`N° GST/HST: ${before} -> ${HST_NUMBER}`);

  // 2) Catégories comptables
  console.log("\nCatégories comptables (ExpenseCategory):");
  for (const cat of EXPENSE_CATEGORIES) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { cabinetId: CABINET_ID, name: cat.name },
      select: { id: true },
    });
    console.log(`  ${existing ? "≈ existe" : "+ nouveau"}  ${cat.name}`);
  }

  if (!APPLY) {
    console.log("\nSimulation terminée. Pour appliquer:");
    console.log("  APPLY_DERISIER_CONFIG=YES node scripts/configure-derisier-aaliyah-2026-05.mjs --apply");
    return;
  }

  // ---- APPLICATION ----
  await prisma.cabinet.update({
    where: { id: CABINET_ID },
    data: { config: JSON.stringify(config) },
  });
  console.log("\n✓ N° GST/HST appliqué sur le cabinet.");

  for (const cat of EXPENSE_CATEGORIES) {
    await prisma.expenseCategory.upsert({
      where: { cabinetId_name: { cabinetId: CABINET_ID, name: cat.name } },
      create: {
        cabinetId: CABINET_ID,
        name: cat.name,
        code: cat.code,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
      update: { code: cat.code, sortOrder: cat.sortOrder, isActive: true },
    });
    console.log(`✓ Catégorie: ${cat.name}`);
  }

  // ---- VÉRIFICATION ----
  const updated = await prisma.cabinet.findUnique({
    where: { id: CABINET_ID },
    select: { config: true },
  });
  const total = await prisma.expenseCategory.count({ where: { cabinetId: CABINET_ID } });
  console.log("\n=== Vérification ===");
  console.log(`N° HST en base: ${JSON.parse(updated.config).taxNumbers?.hstNumber}`);
  console.log(`Catégories comptables: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
