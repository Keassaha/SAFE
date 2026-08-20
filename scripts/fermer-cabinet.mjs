/**
 * Ferme ou rouvre l'espace d'un cabinet.
 *
 * FERMER N'EST PAS SUPPRIMER
 *
 * Aucune donnée n'est touchée. Le cabinet perd l'accès aux écrans, ses dossiers,
 * clients, factures et écritures restent entiers, et `--rouvrir` remet tout en
 * état. Les routes d'export restent accessibles même fermé : un cabinet qui
 * s'en va repart avec ses dossiers.
 *
 * POURQUOI CE SCRIPT EXISTE
 *
 * Depuis que le mur d'abonnement ne bloque plus (voir `isBlocageAbonnementActif`),
 * il n'existait plus aucune façon de couper l'accès d'un cabinet. Et c'est tant
 * mieux : une fermeture doit être un geste posé et attribué, pas la conséquence
 * silencieuse d'une ligne Stripe absente.
 *
 * SÉCURITÉ
 *
 *   - Aucun cabinet n'est touché sans être nommé. Pas de joker, pas de « tous ».
 *   - Simulation par défaut. Rien n'est écrit sans --apply.
 *   - Le motif est OBLIGATOIRE : une fermeture anonyme est une fermeture que
 *     personne n'assume.
 *   - L'inventaire des données conservées est imprimé avant d'écrire.
 *
 * USAGE
 *
 *   node scripts/fermer-cabinet.mjs --list
 *   node scripts/fermer-cabinet.mjs --cabinet=kouame-avocat-qc-2026 --motif="..."
 *   node scripts/fermer-cabinet.mjs --cabinet=... --motif="..." --apply
 *   node scripts/fermer-cabinet.mjs --cabinet=... --rouvrir --apply
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const LIST = args.includes("--list");
const ROUVRIR = args.includes("--rouvrir");
const CIBLE = readFlag("--cabinet");
const MOTIF = readFlag("--motif");

function readFlag(nom) {
  const a = args.find((x) => x.startsWith(`${nom}=`));
  return a ? a.slice(nom.length + 1).trim() : null;
}

const jour = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

/** Ce que la fermeture CONSERVE. Imprimé pour qu'on voie ce qu'on ne détruit pas. */
async function inventaire(cabinetId) {
  const modeles = ["user", "client", "dossier", "invoice", "payment", "trustTransaction", "timeEntry", "document", "expense"];
  const lignes = [];
  for (const m of modeles) {
    const n = await prisma[m].count({ where: { cabinetId } });
    if (n) lignes.push(`${String(n).padStart(4)} ${m}`);
  }
  return lignes;
}

async function main() {
  if (LIST) {
    const tous = await prisma.cabinet.findMany({
      select: { id: true, nom: true, fermeLe: true, fermeMotif: true },
      orderBy: { createdAt: "asc" },
    });
    console.log("\nEspaces cabinets :\n");
    for (const c of tous) {
      const etat = c.fermeLe ? `FERMÉ le ${jour(c.fermeLe)}` : "ouvert";
      console.log(`  ${c.id.padEnd(30)} ${c.nom.padEnd(42)} ${etat}`);
      if (c.fermeMotif) console.log(`  ${" ".repeat(30)} motif : ${c.fermeMotif}`);
    }
    console.log("");
    return;
  }

  if (!CIBLE) {
    console.log("\nIndiquez un cabinet : --cabinet=<id|courriel|fragment de nom>");
    console.log("Ou listez l'existant : --list\n");
    return;
  }
  if (!ROUVRIR && !MOTIF) {
    console.log("\n✗ Le motif est obligatoire : --motif=\"...\"");
    console.log("  Une fermeture anonyme est une fermeture que personne n'assume.\n");
    return;
  }

  const c = await prisma.cabinet.findFirst({
    where: {
      OR: [{ id: CIBLE }, { email: CIBLE }, { nom: { contains: CIBLE, mode: "insensitive" } }],
    },
    select: { id: true, nom: true, fermeLe: true, fermeMotif: true },
  });
  if (!c) {
    console.log(`\n✗ Aucun cabinet ne correspond à « ${CIBLE} ». Utilisez --list.\n`);
    return;
  }

  console.log(`\nCabinet : ${c.nom} (${c.id})`);
  console.log(`  avant : ${c.fermeLe ? `FERMÉ le ${jour(c.fermeLe)}` : "ouvert"}`);
  console.log(`  après : ${ROUVRIR ? "ouvert" : `FERMÉ le ${jour(new Date())}`}`);

  if (!ROUVRIR) {
    const lignes = await inventaire(c.id);
    console.log("\n  CONSERVÉ, rien n'est supprimé :");
    if (lignes.length === 0) console.log("     (aucune donnée)");
    else lignes.forEach((l) => console.log("    ", l));
    console.log("\n  L'export reste accessible au cabinet après la fermeture.");
  }

  if (!APPLY) {
    console.log("\n(simulation — relancez avec --apply pour écrire)\n");
    return;
  }

  await prisma.cabinet.update({
    where: { id: c.id },
    data: ROUVRIR
      ? { fermeLe: null, fermeMotif: null }
      : { fermeLe: new Date(), fermeMotif: MOTIF },
  });
  console.log(ROUVRIR ? "\n✓ espace rouvert\n" : "\n✓ espace fermé\n");
}

main()
  .catch((e) => {
    console.error("\n✗ Échec :", e.message, "\n");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
