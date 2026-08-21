/**
 * Désactive ou réactive un compte utilisateur.
 *
 * POURQUOI CE SCRIPT EXISTE
 *
 * Le seul levier de révocation lisait `Employee.status`. Or l'acceptation d'une
 * invitation créait un `User` SANS fiche employé : neuf comptes sur dix en
 * production n'étaient révocables par aucun moyen, y compris les deux adjointes
 * du seul cabinet client. Une adjointe qui part gardait l'accès aux dossiers.
 *
 * `User.desactiveLe` couvre tous les comptes. L'invitation crée désormais aussi
 * la fiche employé, donc les futurs membres se gèrent depuis l'écran Équipe ;
 * ce script reste la porte pour les comptes déjà créés sans fiche.
 *
 * DÉSACTIVER N'EST PAS SUPPRIMER
 *
 * Aucune donnée n'est touchée. Le compte ne peut plus se connecter, ses sessions
 * ouvertes sont révoquées à la prochaine revalidation sans attendre les trente
 * jours du jeton, et `--reactiver` remet tout en état.
 *
 * SÉCURITÉ
 *
 *   - Aucun compte n'est touché sans être nommé. Pas de joker.
 *   - Simulation par défaut. Rien n'est écrit sans --apply.
 *   - Le motif est OBLIGATOIRE.
 *   - Refuse de retirer le DERNIER administrateur d'un cabinet : personne ne
 *     doit pouvoir rendre un cabinet ingérable par mégarde.
 *
 * USAGE
 *
 *   node scripts/desactiver-compte.mjs --list
 *   node scripts/desactiver-compte.mjs --compte=adjointe@cabinet.ca --motif="Départ le 21 août"
 *   node scripts/desactiver-compte.mjs --compte=... --motif="..." --apply
 *   node scripts/desactiver-compte.mjs --compte=... --reactiver --apply
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const LIST = args.includes("--list");
const REACTIVER = args.includes("--reactiver");
const CIBLE = readFlag("--compte");
const MOTIF = readFlag("--motif");

function readFlag(nom) {
  const a = args.find((x) => x.startsWith(`${nom}=`));
  return a ? a.slice(nom.length + 1).trim() : null;
}

const masque = (e) => (e ? e.replace(/^(.).*(@.*)$/, "$1***$2") : "(aucun)");
const jour = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

async function main() {
  if (LIST) {
    const tous = await prisma.user.findMany({
      select: {
        id: true, email: true, nom: true, role: true, desactiveLe: true, desactiveMotif: true,
        cabinet: { select: { nom: true } },
        employee: { select: { status: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    console.log("\nComptes :\n");
    for (const u of tous) {
      const etat = u.desactiveLe ? `DÉSACTIVÉ le ${jour(u.desactiveLe)}` : "actif";
      const fiche = u.employee ? `fiche ${u.employee.status}` : "sans fiche employé";
      console.log(`  ${masque(u.email).padEnd(30)} ${(u.cabinet?.nom ?? "?").padEnd(30)} ${u.role.padEnd(14)} ${etat.padEnd(26)} ${fiche}`);
      if (u.desactiveMotif) console.log(`  ${" ".repeat(30)} motif : ${u.desactiveMotif}`);
    }
    console.log("");
    return;
  }

  if (!CIBLE) {
    console.log("\nIndiquez un compte : --compte=<courriel|id>");
    console.log("Ou listez l'existant : --list\n");
    return;
  }
  if (!REACTIVER && !MOTIF) {
    console.log('\n✗ Le motif est obligatoire : --motif="..."');
    console.log("  Un retrait d'accès anonyme est un retrait que personne n'assume.\n");
    return;
  }

  const u = await prisma.user.findFirst({
    where: { OR: [{ id: CIBLE }, { email: CIBLE.toLowerCase() }] },
    select: {
      id: true, email: true, nom: true, role: true, cabinetId: true, desactiveLe: true,
      cabinet: { select: { nom: true } },
    },
  });
  if (!u) {
    console.log(`\n✗ Aucun compte ne correspond à « ${CIBLE} ». Utilisez --list.\n`);
    return;
  }

  // Garde-fou : ne jamais rendre un cabinet ingérable.
  if (!REACTIVER && u.role === "admin_cabinet") {
    const autresAdmins = await prisma.user.count({
      where: { cabinetId: u.cabinetId, role: "admin_cabinet", desactiveLe: null, id: { not: u.id } },
    });
    if (autresAdmins === 0) {
      console.log(`\n✗ ${u.nom} est le DERNIER administrateur actif de ${u.cabinet?.nom}.`);
      console.log("  Le désactiver rendrait ce cabinet ingérable : personne ne pourrait");
      console.log("  plus inviter, facturer, ni rouvrir l'accès.");
      console.log("  Nommez d'abord un autre administrateur.\n");
      return;
    }
  }

  console.log(`\nCompte : ${u.nom} (${masque(u.email)}) — ${u.cabinet?.nom}`);
  console.log(`  avant : ${u.desactiveLe ? `DÉSACTIVÉ le ${jour(u.desactiveLe)}` : "actif"}`);
  console.log(`  après : ${REACTIVER ? "actif" : `DÉSACTIVÉ le ${jour(new Date())}`}`);
  if (!REACTIVER) {
    console.log("\n  CONSERVÉ : le compte, son historique et tout ce qu'il a créé.");
    console.log("  La connexion s'arrête, les sessions ouvertes sont révoquées.");
  }

  if (!APPLY) {
    console.log("\n(simulation — relancez avec --apply pour écrire)\n");
    return;
  }

  await prisma.user.update({
    where: { id: u.id },
    data: REACTIVER
      ? { desactiveLe: null, desactiveMotif: null }
      : // `sessionsValidFrom` coupe aussi les jetons déjà émis, sans attendre
        // la revalidation périodique.
        { desactiveLe: new Date(), desactiveMotif: MOTIF, sessionsValidFrom: new Date() },
  });
  console.log(REACTIVER ? "\n✓ compte réactivé\n" : "\n✓ compte désactivé\n");
}

main()
  .catch((e) => {
    console.error("\n✗ Échec :", e.message, "\n");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
