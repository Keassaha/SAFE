/**
 * Provisionne un cabinet abonné chez SAFE Inc. (dog food, ADR-006).
 *
 * POURQUOI CE SCRIPT EXISTE
 *
 * SAFE Inc. facture ses abonnés avec son propre module de facturation. Pour
 * qu'un encaissement Interac puisse prolonger l'accès d'un cabinet, il faut une
 * fiche client chez SAFE Inc. reliée à ce cabinet par `Client.cabinetAbonneId`.
 * Aucun écran ne pose ce lien : il n'a pas à être exposé à un cabinet d'avocats,
 * et il ne sert qu'une dizaine de fois.
 *
 * CE QU'IL FAIT, EXACTEMENT
 *
 *   1. vérifie que le cabinet facturier n'appliquera AUCUNE taxe (SAFE Inc.
 *      n'est pas inscrite, décision CEO 2026-08-20) ;
 *   2. crée ou réutilise la fiche client représentant l'abonné ;
 *   3. pose `cabinetAbonneId`, le montant mensuel et le jour de facturation.
 *
 * Il n'accorde AUCUN accès et n'émet AUCUNE facture. L'accès viendra d'un
 * paiement encaissé (`lib/services/abonnement/acces-paye.ts`).
 *
 * SÉCURITÉ
 *
 *   - Aucun cabinet n'est touché sans être nommé. Pas de joker, pas de « tous ».
 *   - Simulation par défaut. Rien n'est écrit sans --apply.
 *   - L'état avant et après est imprimé.
 *   - Refuse de provisionner tant que le facturier taxerait.
 *
 * USAGE
 *
 *   node scripts/provisionner-abonne.mjs --list
 *   node scripts/provisionner-abonne.mjs --configurer-taxes            (simulation)
 *   node scripts/provisionner-abonne.mjs --configurer-taxes --apply
 *   node scripts/provisionner-abonne.mjs --cabinet=derisier-law-on-2026 --montant=75 --jour=1
 *   node scripts/provisionner-abonne.mjs --cabinet=... --montant=75 --jour=1 --apply
 *
 * Un cabinet se désigne par son id, son courriel, ou un fragment de son nom.
 */

import { PrismaClient } from "@prisma/client";
import {
  validerJourFacturation,
  validerMontantMensuel,
  verifierAucuneTaxe,
} from "../lib/services/abonnement/provisionnement.mjs";

const prisma = new PrismaClient();
const NOM_FACTURIER = "SAFE";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const LIST = args.includes("--list");
const CONFIGURER_TAXES = args.includes("--configurer-taxes");
const CIBLE = readFlag("--cabinet");
const MONTANT = readFlag("--montant");
const JOUR = readFlag("--jour");

function readFlag(nom) {
  const a = args.find((x) => x.startsWith(`${nom}=`));
  return a ? a.slice(nom.length + 1).trim() : null;
}

const money = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "aucune");

/** Config taxes du facturier, telle que la lit `getCabinetTaxConfigById`. */
async function lireModeTaxes(cabinetId) {
  const iface = await prisma.cabinetInterface.findUnique({
    where: { cabinetId },
    select: { modules: true },
  });
  if (!iface?.modules) return null;
  try {
    const m = JSON.parse(iface.modules);
    return m?.facturation?.taxes?.mode ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const facturier = await prisma.cabinet.findFirst({
    where: { nom: NOM_FACTURIER },
    select: { id: true, nom: true, email: true },
  });
  if (!facturier) {
    console.log(`\n✗ Cabinet facturier « ${NOM_FACTURIER} » introuvable. Rien à faire.\n`);
    return;
  }
  console.log(`\nFacturier : ${facturier.nom} (${facturier.id})`);

  const mode = await lireModeTaxes(facturier.id);
  const taxes = verifierAucuneTaxe(mode);
  console.log(`Mode taxes : ${mode ?? "(absent, donc QC par défaut)"}\n`);

  if (CONFIGURER_TAXES) {
    await configurerTaxes(facturier.id, mode);
    return;
  }

  if (LIST) {
    await lister(facturier.id);
    return;
  }

  if (!taxes.ok) {
    console.log(`✗ ${taxes.message}\n`);
    return;
  }
  if (!CIBLE) {
    console.log("Indiquez un cabinet : --cabinet=<id|courriel|fragment de nom>");
    console.log("Ou listez l'existant : --list\n");
    return;
  }

  const montant = validerMontantMensuel(MONTANT);
  if (!montant.ok) return console.log(`✗ ${montant.message}\n`);
  const jour = validerJourFacturation(JOUR);
  if (!jour.ok) return console.log(`✗ ${jour.message}\n`);

  await provisionner(facturier.id, montant.montant, jour.jour);
}

async function configurerTaxes(facturierId, modeActuel) {
  if (modeActuel === "none") {
    console.log("✓ Le mode « aucune taxe » est déjà posé. Rien à faire.\n");
    return;
  }
  const iface = await prisma.cabinetInterface.findUnique({
    where: { cabinetId: facturierId },
    select: { modules: true },
  });
  let modules = {};
  try {
    modules = iface?.modules ? JSON.parse(iface.modules) : {};
  } catch {
    modules = {};
  }
  modules.facturation = {
    ...(modules.facturation ?? {}),
    // `rates: {}` est requis : le format canonique de `getCabinetTaxConfig`
    // exige un objet `rates`, sinon il retombe sur le défaut de la province.
    taxes: { province: "QC", mode: "none", rates: {} },
  };

  console.log(`  avant : mode=${modeActuel ?? "(absent → QC par défaut)"}`);
  console.log("  après : mode=none  (aucune taxe sur les factures d'abonnement)");
  if (!APPLY) return console.log("\n(simulation — relancez avec --apply pour écrire)\n");

  await prisma.cabinetInterface.upsert({
    where: { cabinetId: facturierId },
    create: { cabinetId: facturierId, modules: JSON.stringify(modules) },
    update: { modules: JSON.stringify(modules) },
  });
  console.log("\n✓ écrit\n");
}

async function lister(facturierId) {
  const fiches = await prisma.client.findMany({
    where: { cabinetId: facturierId, cabinetAbonneId: { not: null } },
    select: {
      id: true, raisonSociale: true, billingEmail: true, email: true,
      cabinetAbonne: {
        select: {
          id: true, nom: true, accesPayeJusquau: true,
          abonnementMontantMensuel: true, abonnementJourFacturation: true,
        },
      },
    },
  });
  if (fiches.length === 0) {
    console.log("Aucun abonné provisionné pour l'instant.\n");
  } else {
    console.log(`${fiches.length} abonné(s) provisionné(s) :\n`);
    for (const f of fiches) {
      const c = f.cabinetAbonne;
      console.log(`  ${c.nom}  (${c.id})`);
      console.log(`     fiche client : ${f.raisonSociale} — ${f.billingEmail ?? f.email ?? "(aucun courriel)"}`);
      console.log(`     ${c.abonnementMontantMensuel ?? "?"} $/mois, le ${c.abonnementJourFacturation ?? "?"} du mois`);
      console.log(`     accès payé jusqu'au : ${money(c.accesPayeJusquau)}\n`);
    }
  }

  const libres = await prisma.cabinet.findMany({
    where: { nom: { not: NOM_FACTURIER }, ficheAbonne: null },
    select: { id: true, nom: true, email: true },
    orderBy: { createdAt: "asc" },
  });
  console.log("Cabinets non encore provisionnés :");
  for (const c of libres) console.log(`  - ${c.id.padEnd(30)} ${c.nom}`);
  console.log("");
}

async function provisionner(facturierId, montant, jour) {
  const abonne = await prisma.cabinet.findFirst({
    where: {
      nom: { not: NOM_FACTURIER },
      OR: [{ id: CIBLE }, { email: CIBLE }, { nom: { contains: CIBLE, mode: "insensitive" } }],
    },
    select: {
      id: true, nom: true, email: true, accesPayeJusquau: true,
      abonnementMontantMensuel: true, abonnementJourFacturation: true,
      ficheAbonne: { select: { id: true, raisonSociale: true } },
    },
  });
  if (!abonne) {
    console.log(`✗ Aucun cabinet ne correspond à « ${CIBLE} ». Utilisez --list.\n`);
    return;
  }

  console.log(`Abonné : ${abonne.nom} (${abonne.id})`);
  console.log(`  avant : ${abonne.abonnementMontantMensuel ?? "aucun"} $/mois, ` +
              `jour ${abonne.abonnementJourFacturation ?? "aucun"}, ` +
              `fiche ${abonne.ficheAbonne ? `« ${abonne.ficheAbonne.raisonSociale} »` : "aucune"}`);
  console.log(`  après : ${montant} $/mois, jour ${jour}, fiche « ${abonne.nom} »`);
  console.log("\n  Aucun accès n'est accordé ici. L'accès viendra du premier virement encaissé.");

  if (!APPLY) return console.log("\n(simulation — relancez avec --apply pour écrire)\n");

  await prisma.$transaction(async (tx) => {
    let ficheId = abonne.ficheAbonne?.id ?? null;
    if (!ficheId) {
      const fiche = await tx.client.create({
        data: {
          cabinetId: facturierId,
          typeClient: "personne_morale",
          raisonSociale: abonne.nom,
          email: abonne.email ?? undefined,
          billingEmail: abonne.email ?? undefined,
          cabinetAbonneId: abonne.id,
        },
        select: { id: true },
      });
      ficheId = fiche.id;
    }
    await tx.cabinet.update({
      where: { id: abonne.id },
      data: { abonnementMontantMensuel: montant, abonnementJourFacturation: jour },
    });
    console.log(`\n✓ écrit — fiche client ${ficheId}\n`);
  });
}

main()
  .catch((e) => {
    console.error("\n✗ Échec :", e.message, "\n");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
