/**
 * Corrige les doublons de numéro de dossier : un des dossiers en double
 * reçoit 2026-002 (ou le prochain numéro libre si 2026-002 est déjà pris).
 * Exécuter avec : npx tsx scripts/fix-dossier-numero-doublons.ts
 */
import { PrismaClient } from "@prisma/client";

async function getNextNumeroDisponible(
  prisma: PrismaClient,
  cabinetId: string,
  year: number
): Promise<string> {
  const prefix = `${year}-`;
  const dossiers = await prisma.dossier.findMany({
    where: { cabinetId, numeroDossier: { startsWith: prefix } },
    select: { numeroDossier: true },
  });
  const numerosUtilises = new Set(
    dossiers
      .map((d) => d.numeroDossier)
      .filter((n): n is string => n != null && /^\d{4}-\d+$/.test(n))
      .map((n) => parseInt(n.split("-")[1]!, 10))
  );
  let n = 1;
  while (numerosUtilises.has(n)) n++;
  return `${year}-${String(n).padStart(3, "0")}`;
}

async function main() {
  const prisma = new PrismaClient();

  const dossiers = await prisma.dossier.findMany({
    where: { numeroDossier: { not: null } },
    select: { id: true, cabinetId: true, numeroDossier: true, intitule: true, dateOuverture: true },
    orderBy: { dateOuverture: "asc" },
  });

  const parCle = new Map<string, typeof dossiers>();
  for (const d of dossiers) {
    const key = `${d.cabinetId}:${d.numeroDossier}`;
    if (!parCle.has(key)) parCle.set(key, []);
    parCle.get(key)!.push(d);
  }

  const doublons = [...parCle.entries()].filter(([, list]) => list.length > 1);
  if (doublons.length === 0) {
    console.log("Aucun doublon de numéro de dossier trouvé.");
    await prisma.$disconnect();
    return;
  }

  const year = new Date().getFullYear();
  let corriges = 0;

  for (const [cle, list] of doublons) {
    const [, numero] = cle.split(":");
    const [garder, ...aReassigner] = list;
    const cabinetId = garder!.cabinetId;

    for (const dossier of aReassigner) {
      const nouveauNumero = await getNextNumeroDisponible(prisma, cabinetId, year);
      await prisma.dossier.update({
        where: { id: dossier.id },
        data: { numeroDossier: nouveauNumero },
      });
      console.log(
        `  ${dossier.intitule} (${dossier.id}) : ${numero} → ${nouveauNumero}`
      );
      corriges++;
    }
  }

  console.log(`\n${corriges} dossier(s) corrigé(s).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
