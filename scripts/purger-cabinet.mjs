/**
 * Purge DÉFINITIVEMENT un cabinet et toutes ses données.
 *
 * ⚠️ CE SCRIPT DÉTRUIT. Il n'a pas d'annulation. C'est le seul du dépôt dans ce
 * cas : `fermer-cabinet` et `desactiver-compte` conservent tout, exprès.
 *
 * POURQUOI IL EXISTE
 *
 * `REGLE_DE_BUILD.md` §3 mesure la production pour décider quoi construire, et
 * §8 tranche que « Me Cayard n'est pas cliente ». Un cabinet de démonstration
 * dont les clients, dossiers, factures et écritures de fidéicommis sont
 * fabriqués fausse cette mesure : le tableau qui gouverne les décisions compte
 * des chiffres qui n'ont jamais existé. La règle CEO du 2026-08-14 interdit
 * d'ailleurs tout client inventé dans un cabinet de démonstration.
 *
 * CE QU'IL EXIGE AVANT D'ÉCRIRE
 *
 *   - une SAUVEGARDE existante, dont le chemin est passé en argument. Le script
 *     refuse de démarrer sans elle et vérifie qu'elle porte bien ce cabinet ;
 *   - le nom exact du cabinet, retapé à la main. Un identifiant se copie-colle
 *     par erreur, un nom se retape par décision ;
 *   - `--apply`. Sans lui, il n'imprime que ce qu'il détruirait.
 *
 * USAGE
 *
 *   node scripts/purger-cabinet.mjs --cabinet=<id> \
 *     --sauvegarde=uploads/sauvegardes/x.json --confirmer="Nom exact du cabinet"
 *   ... puis la même commande avec --apply
 */

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const readFlag = (n) => {
  const a = args.find((x) => x.startsWith(`${n}=`));
  return a ? a.slice(n.length + 1).trim() : null;
};
const CIBLE = readFlag("--cabinet");
const SAUVEGARDE = readFlag("--sauvegarde");
const CONFIRMER = readFlag("--confirmer");

/**
 * Lignes qui EMPÊCHENT la suppression, et qu'il faut retirer d'abord.
 *
 * Deux relations du schéma portent `onDelete: SetNull` sur une colonne NON NULL
 * (`ConflictCheck.checkedById`, `TrustComplianceReport.generatedById`). Quand le
 * `User` du cabinet part en cascade, Postgres tente d'y écrire NULL et refuse.
 * Conséquence générale, hors purge : un utilisateur qui a fait une vérification
 * de conflits ou produit un rapport de conformité ne peut PAS être supprimé.
 * `prisma validate` l'annonce depuis toujours, en avertissement.
 *
 * Deux tables portent par ailleurs un `cabinetId` SANS clé étrangère vers
 * Cabinet (`ConflictCheck`, `DeboursTemplate`) : rien ne les emporterait en
 * cascade, elles resteraient orphelines.
 */
async function purgerBloqueurs(tx, cabinetId) {
  const compte = {};
  compte.ConflictCheck = (await tx.conflictCheck.deleteMany({ where: { cabinetId } })).count;
  compte.TrustComplianceReport = (
    await tx.trustComplianceReport.deleteMany({ where: { cabinetId } })
  ).count;
  compte.DeboursTemplate = (await tx.deboursTemplate.deleteMany({ where: { cabinetId } })).count;
  return compte;
}

/** Tables portant une clé étrangère vers Cabinet, et la colonne concernée. */
async function tablesLiees() {
  return prisma.$queryRawUnsafe(`
    select c.relname as table, a.attname as col
    from pg_constraint k
    join pg_class c on c.oid = k.conrelid
    join pg_attribute a on a.attrelid = k.conrelid and a.attnum = any(k.conkey)
    where k.contype = 'f' and k.confrelid = '"Cabinet"'::regclass
    order by 1`);
}

async function main() {
  if (!CIBLE || !SAUVEGARDE) {
    console.log("\n✗ --cabinet et --sauvegarde sont obligatoires.\n");
    return;
  }

  // 1. La sauvegarde doit exister ET porter ce cabinet.
  if (!fs.existsSync(SAUVEGARDE)) {
    console.log(`\n✗ Sauvegarde introuvable : ${SAUVEGARDE}`);
    console.log("  Aucune purge sans copie récupérable.\n");
    return;
  }
  let dump;
  try {
    dump = JSON.parse(fs.readFileSync(SAUVEGARDE, "utf8"));
  } catch {
    console.log("\n✗ Sauvegarde illisible.\n");
    return;
  }
  if (dump.cabinetId !== CIBLE) {
    console.log(`\n✗ La sauvegarde porte le cabinet « ${dump.cabinetId} », pas « ${CIBLE} ».\n`);
    return;
  }

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: CIBLE },
    select: { id: true, nom: true, fermeLe: true },
  });
  if (!cabinet) {
    console.log(`\n✗ Cabinet « ${CIBLE} » introuvable. Déjà purgé ?\n`);
    return;
  }

  console.log(`\nCabinet : ${cabinet.nom} (${cabinet.id})`);
  console.log(`  état    : ${cabinet.fermeLe ? "fermé" : "OUVERT"}`);
  console.log(`  sauvegarde : ${SAUVEGARDE} (${Object.keys(dump.tables).length} tables, ` +
              `${Object.values(dump.tables).reduce((a, v) => a + v.length, 0)} lignes)`);

  // 2. Inventaire de ce qui part.
  const liees = await tablesLiees();
  const detruites = [];
  let total = 0;
  for (const { table, col } of liees) {
    const r = await prisma.$queryRawUnsafe(
      `select count(*)::int n from "${table}" where "${col}" = $1`, CIBLE);
    if (r[0].n > 0) { detruites.push([table, r[0].n]); total += r[0].n; }
  }
  console.log("\n  DÉTRUIT, sans retour :");
  detruites.sort((a, b) => b[1] - a[1]).forEach(([t, n]) =>
    console.log(`    ${String(n).padStart(4)} ${t}`));
  console.log(`    ${String(total).padStart(4)} lignes directes, plus leurs enfants en cascade`);

  // 3. Le nom retapé.
  if (CONFIRMER !== cabinet.nom) {
    console.log(`\n✗ Retapez le nom EXACT pour confirmer :`);
    console.log(`    --confirmer="${cabinet.nom}"`);
    console.log("  Un identifiant se copie-colle par erreur, un nom se retape par décision.\n");
    return;
  }

  if (!APPLY) {
    console.log("\n(simulation — relancez avec --apply pour détruire)\n");
    return;
  }

  // 4. La destruction. `CabinetInterface` bloque la suppression du cabinet
  //    (clé étrangère sans cascade) : elle part en premier.
  await prisma.$transaction(async (tx) => {
    const bloqueurs = await purgerBloqueurs(tx, CIBLE);
    for (const [t, n] of Object.entries(bloqueurs)) {
      if (n > 0) console.log(`    ${String(n).padStart(4)} ${t} (retiré avant la cascade)`);
    }
    // `CabinetInterface` a une clé étrangère sans cascade : elle part aussi avant.
    await tx.cabinetInterface.deleteMany({ where: { cabinetId: CIBLE } });
    await tx.cabinet.delete({ where: { id: CIBLE } });
  });
  console.log(`\n✓ purgé — ${cabinet.nom} n'existe plus\n`);
}

main()
  .catch((e) => { console.error("\n✗ Échec :", e.message, "\n"); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
