/**
 * Script one-shot : attribue un numéro de dossier au format AAAA-NNN (ex. 2026-001)
 * aux dossiers qui ont un numéro invalide (hhh, testref, test, etc.) ou null.
 * Garantit l'unicité par cabinet.
 *
 * À lancer avec : npx tsx scripts/fix-dossier-numero-format.ts
 */
import { PrismaClient } from "@prisma/client";

const FORMAT_VALIDE = /^\d{4}-\d{3}$/;

function estNumeroValide(numero: string | null): boolean {
  return Boolean(numero?.trim() && FORMAT_VALIDE.test(numero.trim()));
}

async function main() {
  const prisma = new PrismaClient();
  const year = new Date().getFullYear();

  const dossiers = await prisma.dossier.findMany({
    select: { id: true, cabinetId: true, numeroDossier: true, dateOuverture: true, intitule: true },
    orderBy: { dateOuverture: "asc" },
  });

  const invalides = dossiers.filter((d) => !estNumeroValide(d.numeroDossier));
  if (invalides.length === 0) {
    console.log("Aucun dossier avec numéro invalide ou manquant.");
    await prisma.$disconnect();
    return;
  }

  console.log(`${invalides.length} dossier(s) à corriger.`);

  // Grouper par cabinet
  const parCabinet = new Map<string, typeof invalides>();
  for (const d of invalides) {
    const list = parCabinet.get(d.cabinetId) ?? [];
    list.push(d);
    parCabinet.set(d.cabinetId, list);
  }

  for (const [cabinetId, list] of parCabinet) {
    // Numéros déjà utilisés pour cette année dans ce cabinet
    const existants = await prisma.dossier.findMany({
      where: {
        cabinetId,
        numeroDossier: { startsWith: `${year}-` },
      },
      select: { numeroDossier: true },
    });

    const numerosUtilises = new Set(
      existants
        .map((d) => d.numeroDossier)
        .filter((n): n is string => Boolean(n))
        .map((n) => {
          const part = n.split("-")[1];
          return part ? parseInt(part, 10) : 0;
        })
    );

    let prochain = 1;
    while (numerosUtilises.has(prochain)) prochain++;

    for (const d of list) {
      const nouveauNumero = `${year}-${String(prochain).padStart(3, "0")}`;
      await prisma.dossier.update({
        where: { id: d.id },
        data: { numeroDossier: nouveauNumero },
      });
      console.log(`  ${d.numeroDossier ?? "(vide)"} → ${nouveauNumero}  (${d.intitule})`);
      numerosUtilises.add(prochain);
      prochain++;
    }
  }

  console.log("Correction terminée.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
