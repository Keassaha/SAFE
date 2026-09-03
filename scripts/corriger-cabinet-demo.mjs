/**
 * Remise d'aplomb du cabinet de démonstration.
 *
 * Trois corrections, toutes constatées en capturant les écrans réels le
 * 2026-08-27 (voir docs/design/references-app/).
 *
 *   1. La province manque dans `Cabinet.config`. getTrustRegulatorCopy() bascule
 *      sur l'Ontario dès que la province n'est pas exactement "QC" : l'écran du
 *      fidéicommis affichait « Reconciliation » et « Compliance Reports » en
 *      anglais, dans un cabinet qui facture la TVQ et tourne en français.
 *
 *   2. Les factures ne portent que l'ancien couple de colonnes
 *      (`montantTotal` / `montantPaye`). Le nouveau couple
 *      (`totalInvoiceAmount` / `totalPaidAmount`) est à zéro. Or le KPI « taux
 *      d'encaissement » de app/(app)/facturation/page.tsx divise la colonne
 *      VIDE par la colonne REMPLIE : il affichait 0 % alors que 49 055,00 $ sur
 *      87 115,20 $ sont encaissés. On rattrape les lignes du cabinet démo.
 *
 *   3. Une fiche client porte l'identité réelle du fondateur. Elle apparaîtrait
 *      dans toute capture de la liste des dossiers publiée sur le site.
 *
 * Ce que ce script NE fait PAS, volontairement : il n'écrit aucun mouvement de
 * fidéicommis. `TrustTransaction.balanceAfter` forme une chaîne de soldes, et
 * l'insérer en direct contournerait les contrôles du module. « Dépôts du mois
 * 0,00 $ » est une donnée honnête, pas un défaut.
 *
 * Simulation par défaut, comme scripts/accorder-abonnement-gratuit.mjs :
 *
 *   node scripts/corriger-cabinet-demo.mjs           → montre, n'écrit rien
 *   node scripts/corriger-cabinet-demo.mjs --appliquer
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLIQUER = process.argv.includes("--appliquer");
const CABINET_NOM = "Cabinet Demo";

/* La fiche de remplacement reste dans le registre du fixture : un nom
   québécois plausible, une adresse en example.com, aucune personne réelle. */
const REMPLACEMENT = {
  prenom: "Étienne",
  nom: "Nadeau",
  email: "etienne.nadeau@example.com",
};

const argent = (n) =>
  new Intl.NumberFormat("fr-CA", { minimumFractionDigits: 2 }).format(n ?? 0) + " $";

async function main() {
  const mode = APPLIQUER ? "ÉCRITURE" : "simulation";
  console.log(`\n  Correction du cabinet de démonstration  ·  ${mode}\n${"─".repeat(62)}`);

  const cabinet = await prisma.cabinet.findFirst({ where: { nom: CABINET_NOM } });
  if (!cabinet) throw new Error(`Cabinet « ${CABINET_NOM} » introuvable.`);

  /* ── 1 · la province ───────────────────────────────────────────────────── */
  const config = JSON.parse(cabinet.config ?? "{}");
  if (config.province === "QC") {
    console.log("  1. Province   déjà « QC », rien à faire.");
  } else {
    console.log(`  1. Province   ${config.province ?? "(absente)"}  →  QC`);
    console.log("                l'écran du fidéicommis repassera en français,");
    console.log("                et citera le Barreau du Québec au lieu du LSO.");
    if (APPLIQUER) {
      await prisma.cabinet.update({
        where: { id: cabinet.id },
        data: { config: JSON.stringify({ ...config, province: "QC" }) },
      });
    }
  }

  /* ── 2 · les deux colonnes de montant ──────────────────────────────────── */
  const aRattraper = await prisma.invoice.findMany({
    where: { cabinetId: cabinet.id },
    select: {
      id: true, numero: true,
      montantTotal: true, montantPaye: true,
      totalInvoiceAmount: true, totalPaidAmount: true,
    },
  });
  const decalees = aRattraper.filter(
    (i) =>
      (i.totalInvoiceAmount ?? 0) !== (i.montantTotal ?? 0) ||
      (i.totalPaidAmount ?? 0) !== (i.montantPaye ?? 0),
  );

  const emis = aRattraper.reduce((s, i) => s + (i.montantTotal ?? 0), 0);
  const encaisseAvant = aRattraper.reduce((s, i) => s + (i.totalPaidAmount ?? 0), 0);
  const encaisseApres = aRattraper.reduce((s, i) => s + (i.montantPaye ?? 0), 0);
  const taux = (p) => (emis > 0 ? Math.round((p / emis) * 100) : 0);

  console.log(`\n  2. Factures   ${decalees.length} ligne(s) décalée(s) sur ${aRattraper.length}`);
  console.log(`                émis           ${argent(emis)}`);
  console.log(`                encaissé lu    ${argent(encaisseAvant)}   → taux ${taux(encaisseAvant)} %`);
  console.log(`                encaissé réel  ${argent(encaisseApres)}   → taux ${taux(encaisseApres)} %`);

  if (APPLIQUER) {
    for (const i of decalees) {
      await prisma.invoice.update({
        where: { id: i.id },
        data: {
          totalInvoiceAmount: i.montantTotal ?? 0,
          totalPaidAmount: i.montantPaye ?? 0,
        },
      });
    }
  }

  /* ── 3 · l'identité réelle du fondateur ────────────────────────────────
     Deux problèmes distincts, et il ne faut pas les confondre.

     a) UNE fiche porte le nom du fondateur. Elle change de nom.
     b) VINGT-SIX fiches portent son adresse Gmail réelle, en adressage plus
        (ptiahou+c03@gmail.com). Celles-là gardent leur nom : ce sont des
        clients distincts du fixture, les écraser d'un seul nom détruirait le
        registre. Seule l'adresse change.

     Un courriel de démonstration qui part vraiment atterrit sinon dans la
     boîte du fondateur, et l'adresse se lit sur toute capture publiée. */

  const suspectes = await prisma.client.findMany({
    where: {
      cabinetId: cabinet.id,
      OR: [
        { nom: { contains: "Tiahou", mode: "insensitive" } },
        { prenom: { contains: "Keassaha", mode: "insensitive" } },
        /* Les trois adresses sont interrogées, pas seulement `email` : une
           première passe n'avait nettoyé que celle-là, et l'adresse réelle
           survivait dans `billingEmail`, c'est-à-dire là où part une facture. */
        { email: { contains: "ptiahou", mode: "insensitive" } },
        { emailSecondaire: { contains: "ptiahou", mode: "insensitive" } },
        { billingEmail: { contains: "ptiahou", mode: "insensitive" } },
      ],
    },
    select: {
      id: true, typeClient: true, prenom: true, nom: true, raisonSociale: true,
      /* `Client` porte TROIS adresses, pas une. `billingEmail` est celle où
         part une facture : la manquer laisse la démonstration capable
         d'écrire au fondateur. Constaté après une première passe qui n'avait
         corrigé que `email`. */
      email: true, emailSecondaire: true, billingEmail: true,
    },
  });

  const autresAdresses = (c, nouvelle) => ({
    ...(c.emailSecondaire ? { emailSecondaire: null } : {}),
    ...(c.billingEmail ? { billingEmail: nouvelle } : {}),
  });

  /* Une adresse lisible, dérivée du nom déjà présent sur la fiche. */
  const pris = new Set();
  const slug = (s) =>
    (s ?? "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  function adressePour(c, rang) {
    const base =
      c.typeClient === "personne_morale"
        ? slug(c.raisonSociale)
        : [slug(c.prenom), slug(c.nom)].filter(Boolean).join(".");
    let local = base || `client-${String(rang + 1).padStart(2, "0")}`;
    if (local.length > 40) local = local.slice(0, 40).replace(/[-.]$/, "");
    let candidat = `${local}@example.com`;
    let n = 2;
    while (pris.has(candidat)) candidat = `${local}-${n++}@example.com`;
    pris.add(candidat);
    return candidat;
  }

  const porteLeNom = (c) =>
    /tiahou/i.test(c.nom ?? "") || /keassaha/i.test(c.prenom ?? "");

  const aRenommer = suspectes.filter(porteLeNom);
  const aReadresser = suspectes.filter((c) => !porteLeNom(c));

  console.log(`\n  3. Identité   ${suspectes.length} fiche(s) touchée(s)`);
  console.log(`                ${aRenommer.length} au nom du fondateur, ${aReadresser.length} à son adresse`);

  for (const c of aRenommer) {
    const avant = `${c.prenom ?? ""} ${c.nom ?? ""}`.trim();
    console.log(`\n                nom   « ${avant} »  →  « ${REMPLACEMENT.prenom} ${REMPLACEMENT.nom} »`);
    console.log(`                      ${c.email ?? "sans courriel"}  →  ${REMPLACEMENT.email}`);
    if (c.billingEmail) console.log(`                      facturation : ${c.billingEmail}  →  ${REMPLACEMENT.email}`);
    if (c.emailSecondaire) console.log(`                      secondaire  : ${c.emailSecondaire}  →  (vidée)`);
    pris.add(REMPLACEMENT.email);
    if (APPLIQUER) {
      await prisma.client.update({
        where: { id: c.id },
        data: { ...REMPLACEMENT, ...autresAdresses(c, REMPLACEMENT.email) },
      });
    }
  }

  console.log("\n                adresses seules, les noms sont conservés :");
  for (const [rang, c] of aReadresser.entries()) {
    const nouvelle = adressePour(c, rang);
    const qui = c.raisonSociale || `${c.prenom ?? ""} ${c.nom ?? ""}`.trim() || "(fiche sans nom)";
    console.log(`                  ${qui.padEnd(36).slice(0, 36)}  ${c.email}  →  ${nouvelle}`);
    if (APPLIQUER) {
      await prisma.client.update({
        where: { id: c.id },
        data: { email: nouvelle, ...autresAdresses(c, nouvelle) },
      });
    }
  }

  console.log(`\n${"─".repeat(62)}`);
  console.log(
    APPLIQUER
      ? "  Écrit. Recapturez les écrans : node scripts/capturer-ecran-reel.mjs\n"
      : "  Rien n'a été écrit. Relancez avec --appliquer.\n",
  );
}

main()
  .catch((e) => {
    console.error("\n  Échec :", e.message, "\n");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
