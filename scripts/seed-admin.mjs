import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "keassahatd@gmail.com";
  const password = "SafeAdmin2026!";
  const cabinetName = "SAFE";
  const userName = "Admin SAFE";

  const existing = await prisma.user.findFirst({
    where: { email: email.toLowerCase() },
    include: { cabinet: true },
  });

  if (existing) {
    console.log(`✅ User exists: ${existing.email} (cabinet: ${existing.cabinet.nom})`);
    console.log(`   Updating password...`);
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, role: "admin_cabinet" },
    });
    console.log(`✅ Password updated.`);
    console.log(`\n🔑 Credentials:`);
    console.log(`   Cabinet: ${existing.cabinet.nom}`);
    console.log(`   Email:   ${email}`);
    console.log(`   Password: ${password}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const cabinet = await prisma.cabinet.create({
    data: { nom: cabinetName, plan: "essentiel" },
  });
  const user = await prisma.user.create({
    data: {
      cabinetId: cabinet.id,
      email: email.toLowerCase(),
      passwordHash,
      nom: userName,
      role: "admin_cabinet",
    },
  });
  console.log(`✅ Cabinet created: ${cabinet.nom} (id: ${cabinet.id})`);
  console.log(`✅ User created: ${user.email} (id: ${user.id})`);
  console.log(`\n🔑 Credentials:`);
  console.log(`   Cabinet: ${cabinetName}`);
  console.log(`   Email:   ${email}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
