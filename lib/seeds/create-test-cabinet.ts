/**
 * Creates a test cabinet + admin user.
 *
 * Run:
 *   npx tsx lib/seeds/create-test-cabinet.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const cabinetId = "cabinet-test-safe";
  const cabinetNom = "SAFE Cabinet test";

  const adminUserId = "user-admin-test-safe";
  const adminEmail = "cabinet.test@safe.local";
  const adminNom = "Admin test";
  const adminPassword = "SafeTest2026!";

  console.log("=== Creating Test Cabinet ===\n");
  console.log(`Cabinet: ${cabinetNom} (${cabinetId})`);
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const cabinet = await prisma.cabinet.upsert({
    where: { id: cabinetId },
    create: {
      id: cabinetId,
      nom: cabinetNom,
      adresse: "Montréal, QC, Canada",
      email: adminEmail,
      plan: "essentiel",
    },
    update: {
      nom: cabinetNom,
      email: adminEmail,
    },
  });

  await prisma.user.upsert({
    where: { id: adminUserId },
    create: {
      id: adminUserId,
      cabinetId: cabinet.id,
      email: adminEmail.toLowerCase(),
      passwordHash,
      nom: adminNom,
      role: "admin_cabinet",
      isBillable: true,
    },
    update: {
      cabinetId: cabinet.id,
      email: adminEmail.toLowerCase(),
      passwordHash,
      nom: adminNom,
      role: "admin_cabinet",
    },
  });

  await prisma.cabinetInterface.upsert({
    where: { cabinetId: cabinet.id },
    create: {
      cabinetId: cabinet.id,
      ongletsActifs: JSON.stringify([
        "tableau-de-bord",
        "clients",
        "dossiers",
        "facturation",
        "documents",
        "conformite",
        "parametres",
      ]),
      ongletsMasques: JSON.stringify([]),
      modules: JSON.stringify({}),
      disciplines: JSON.stringify(["famille"]),
      modeFacturation: JSON.stringify({ principal: "horaire" }),
      conformite: JSON.stringify({ verif_conflits: true, loi25: true }),
    },
    update: {},
  });

  console.log("\n=== Test Cabinet Ready ===");
  console.log("Login (page /connexion):");
  console.log(`  Nom du cabinet: ${cabinetNom}`);
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Mot de passe: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

