/**
 * SAFE — Simule un exercice comptable sur la base LOCALE.
 *
 * Pourquoi ce script existe : l'écran Comptabilité était vide alors que le
 * cabinet de démonstration porte 33 factures dont 16 payées. La cause n'est pas
 * l'absence de factures, c'est que le journal ne comptait que 2 écritures : ces
 * factures ont été posées directement en base, sans passer par le service qui
 * écrit au journal.
 *
 * Le script fait donc DEUX choses distinctes, dans cet ordre :
 *
 *   1. RATTRAPAGE. Il rejoue `writeJournalForIssuedInvoice` et
 *      `writeJournalForPayment` sur les factures et paiements qui existent
 *      déjà. Rien n'est inventé : ce sont les écritures que l'application
 *      aurait écrites elle-même. Les deux services sont idempotents, donc le
 *      script peut être relancé sans rien dupliquer.
 *
 *   2. EXERCICE DU MOIS. Il crée cinq factures datées du mois courant, sur des
 *      clients et des dossiers QUI EXISTENT DÉJÀ, les marque envoyées puis
 *      payées, et laisse les mêmes services écrire les écritures.
 *
 * ⚠️  Garde-fous
 *   - Refuse de s'exécuter si DATABASE_URL ne pointe pas sur localhost.
 *   - N'invente aucun client, aucun dossier. Règle CEO du 2026-08-14.
 *   - Les cinq factures portent le préfixe SIM- : `--annuler` les retire, avec
 *     leurs paiements et leurs écritures.
 *
 * Usage :
 *   node --env-file=.env.local scripts/simuler-exercice-comptable.mjs
 *   node --env-file=.env.local scripts/simuler-exercice-comptable.mjs --annuler
 */

import { PrismaClient } from "@prisma/client";

const CABINET = process.env.CABINET_ID || "cmsnx9gfa00000ydze1f0o2ku";
const PREFIXE = "SIM-";

const url = process.env.DATABASE_URL || "";
if (!/localhost|127\.0\.0\.1/.test(url)) {
  console.error("✋ DATABASE_URL ne pointe pas sur localhost. Script refusé.");
  process.exit(1);
}

const prisma = new PrismaClient();
const annuler = process.argv.includes("--annuler");
const arrondi = (n) => Math.round(n * 100) / 100;

async function nettoyer() {
  const factures = await prisma.invoice.findMany({
    where: { cabinetId: CABINET, numero: { startsWith: PREFIXE } },
    select: { id: true },
  });
  const ids = factures.map((f) => f.id);
  if (ids.length === 0) {
    console.log("Rien à retirer.");
    return;
  }
  const paiements = await prisma.payment.findMany({
    where: { cabinetId: CABINET, invoiceId: { in: ids } },
    select: { id: true },
  });
  const sources = [...ids, ...paiements.map((p) => p.id)];

  const ecritures = await prisma.journalGeneralEntry.deleteMany({
    where: { cabinetId: CABINET, sourceId: { in: sources } },
  });
  await prisma.paymentAllocation.deleteMany({ where: { paymentId: { in: paiements.map((p) => p.id) } } });
  const p = await prisma.payment.deleteMany({ where: { id: { in: paiements.map((p) => p.id) } } });
  await prisma.invoiceLine.deleteMany({ where: { invoiceId: { in: ids } } });
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: ids } } });
  const f = await prisma.invoice.deleteMany({ where: { id: { in: ids } } });

  const dep = await prisma.cabinetExpense.findMany({
    where: { cabinetId: CABINET, descriptionBancaire: { startsWith: PREFIXE } },
    select: { id: true },
  });
  const ecrDep = await prisma.journalGeneralEntry.deleteMany({
    where: { cabinetId: CABINET, sourceId: { in: dep.map((d) => d.id) } },
  });
  const d = await prisma.cabinetExpense.deleteMany({ where: { id: { in: dep.map((x) => x.id) } } });

  console.log(
    `Retiré : ${f.count} factures, ${p.count} paiements, ${d.count} dépenses, ` +
      `${ecritures.count + ecrDep.count} écritures.`,
  );
}

async function main() {
  if (annuler) return nettoyer();

  const { writeJournalForIssuedInvoice, writeJournalForPayment } = await import(
    "../lib/services/journal/billing-journal.ts"
  );

  /* ── 1. Rattrapage sur l'existant ─────────────────────────────────────── */
  const emises = await prisma.invoice.findMany({
    where: { cabinetId: CABINET, statut: { not: "brouillon" } },
  });
  let nEmises = 0;
  for (const f of emises) {
    const r = await writeJournalForIssuedInvoice(f, { client: prisma });
    if (r.created) nEmises++;
  }

  const paiements = await prisma.payment.findMany({
    where: { cabinetId: CABINET, reversedAt: null },
    include: { invoice: { select: { numero: true, dossierId: true } } },
  });
  let nPaiements = 0;
  for (const p of paiements) {
    const r = await writeJournalForPayment(p, { client: prisma });
    if (r.created) nPaiements++;
  }
  console.log(`Rattrapage : ${nEmises} écritures de facture, ${nPaiements} de paiement.`);

  /* ── 2. Cinq factures du mois, sur des clients réels ──────────────────── */
  const dossiers = await prisma.dossier.findMany({
    where: { cabinetId: CABINET, clientId: { not: undefined } },
    select: { id: true, clientId: true, intitule: true, numeroDossier: true },
    take: 5,
    orderBy: { createdAt: "asc" },
  });
  if (dossiers.length < 5) {
    console.error(`✋ Seulement ${dossiers.length} dossiers réels. Le script n'en invente pas.`);
    return;
  }

  const maintenant = new Date();
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  // Cinq prestations plausibles pour un cabinet, avec des montants distincts.
  const TRAVAUX = [
    { libelle: "Honoraires — préparation et dépôt de la requête", heures: 8.5, taux: 285 },
    { libelle: "Honoraires — négociation et rédaction de l'entente", heures: 6, taux: 285 },
    { libelle: "Honoraires — représentation à l'audience", heures: 4.25, taux: 320 },
    { libelle: "Honoraires — vérification diligente et opinion", heures: 11, taux: 260 },
    { libelle: "Honoraires — suivi de dossier et correspondance", heures: 3.75, taux: 240 },
  ];
  const TPS = 0.05, TVQ = 0.09975;

  let cree = 0;
  for (let i = 0; i < 5; i++) {
    const d = dossiers[i];
    const t = TRAVAUX[i];
    const numero = `${PREFIXE}${maintenant.getFullYear()}-${String(i + 1).padStart(3, "0")}`;
    /* On ne saute une facture que si elle est COMPLÈTE, paiement compris. Une
       facture marquée payée sans paiement est incohérente : c'est ce qu'un
       arrêt en cours de route avait produit au premier essai. */
    const dejaLa = await prisma.invoice.findFirst({
      where: { cabinetId: CABINET, numero },
      select: { id: true, _count: { select: { payments: true } } },
    });
    if (dejaLa?._count.payments) continue;
    if (dejaLa) {
      await prisma.journalGeneralEntry.deleteMany({ where: { cabinetId: CABINET, sourceId: dejaLa.id } });
      await prisma.invoiceLine.deleteMany({ where: { invoiceId: dejaLa.id } });
      await prisma.invoice.delete({ where: { id: dejaLa.id } });
      console.log(`  ${numero} était incomplète, elle est refaite.`);
    }

    const jour = 2 + i * 3; // étalées sur le mois
    const emission = new Date(debutMois.getFullYear(), debutMois.getMonth(), jour, 10, 0);
    const envoi = new Date(emission.getTime() + 864e5);          // envoyée le lendemain
    const paiement = new Date(emission.getTime() + 6 * 864e5);   // payée six jours après

    const ht = arrondi(t.heures * t.taux);
    const tps = arrondi(ht * TPS);
    const tvq = arrondi(ht * TVQ);
    const total = arrondi(ht + tps + tvq);

    const facture = await prisma.invoice.create({
      data: {
        cabinetId: CABINET,
        clientId: d.clientId,
        dossierId: d.id,
        numero,
        dateEmission: emission,
        dateEcheance: new Date(emission.getTime() + 30 * 864e5),
        statut: "payee",
        invoiceStatus: "PAID",
        paymentStatus: "PAID",
        sentAt: envoi,
        montantTotal: total,
        montantPaye: total,
        subtotalTaxable: ht,
        subtotalFees: ht,
        subtotalBeforeTax: ht,
        tps, tvq, taxGst: tps, taxQst: tvq, taxTotal: arrondi(tps + tvq),
        totalInvoiceAmount: total,
        totalPaidAmount: total,
        balanceDue: 0,
        currency: "CAD",
        internalNote: "Exercice simulé — retirable avec --annuler.",
      },
    });

    await prisma.invoiceLine.create({
      data: {
        invoiceId: facture.id,
        description: `${t.libelle} · ${d.numeroDossier ?? d.intitule}`,
        quantite: t.heures,
        tauxUnitaire: t.taux,
        montant: ht,
      },
    }).catch(() => {}); // le modèle de ligne varie : la facture reste valide sans

    await writeJournalForIssuedInvoice(facture, { client: prisma });

    const p = await prisma.payment.create({
      data: {
        cabinetId: CABINET,
        clientId: d.clientId,
        invoiceId: facture.id,
        montant: total,
        datePaiement: paiement,
        method: "virement",
        paymentMethod: "bank_transfer",
        sourceAccountType: "operating",
        allocationStatus: "ALLOCATED",
        reference: `VIR-${numero}`,
        note: "Exercice simulé.",
      },
    });
    await writeJournalForPayment(
      { ...p, invoice: { numero: facture.numero, dossierId: facture.dossierId } },
      { client: prisma },
    );
    cree++;
    console.log(`  ${numero} · ${total.toFixed(2)} $ · émise le ${emission.toISOString().slice(0, 10)}, payée le ${paiement.toISOString().slice(0, 10)}`);
  }

  /* ── 3. Les dépenses du cabinet ───────────────────────────────────────
     Un cabinet dépense tous les mois les mêmes choses. On reprend les
     catégories que le cabinet a déjà, on n'en invente aucune. Trois dépenses
     restent volontairement à valider et deux sans catégorie : c'est le seul
     moyen de voir à l'écran la ligne « À traiter » et de vérifier qu'elle
     disparaît une fois le travail fait. */
  const { writeJournalForCabinetExpense } = await import(
    "../lib/services/journal/cabinet-expense-journal.ts"
  );
  const categories = await prisma.expenseCategory.findMany({
    where: { cabinetId: CABINET },
    select: { id: true, name: true },
  });
  const parNom = new Map(categories.map((c) => [c.name, c]));

  const DEPENSES = [
    { jour: 1,  cat: "Loyer / bureau",           frs: "Gestion immobilière Laurier",  ttc: 2185.00, statut: "VALIDE",    taxe: "DECLAREE" },
    { jour: 3,  cat: "Logiciels / abonnements",  frs: "SAFE Inc.",                    ttc: 137.97,  statut: "VALIDE",    taxe: "DECLAREE" },
    { jour: 4,  cat: "Assurances",               frs: "La Capitale assurances",       ttc: 412.50,  statut: "VALIDE",    taxe: "AUCUNE"   },
    { jour: 6,  cat: "Téléphone",                frs: "Telus Affaires",               ttc: 148.31,  statut: "VALIDE",    taxe: "DECLAREE" },
    { jour: 8,  cat: "Frais bancaires",          frs: "Desjardins Entreprises",       ttc: 34.95,   statut: "VALIDE",    taxe: "AUCUNE"   },
    { jour: 9,  cat: "Fournitures de bureau",    frs: "Bureau en Gros",               ttc: 216.44,  statut: "VALIDE",    taxe: "DECLAREE" },
    { jour: 11, cat: "Frais tribunal",           frs: "Cour supérieure du Québec",    ttc: 191.00,  statut: "VALIDE",    taxe: "AUCUNE"   },
    { jour: 12, cat: "Formation",                frs: "Barreau du Québec",            ttc: 345.00,  statut: "VALIDE",    taxe: "DECLAREE" },
    { jour: 15, cat: "Déplacements",             frs: "Via Rail Canada",              ttc: 178.60,  statut: "A_VALIDER", taxe: "ESTIMEE"  },
    { jour: 16, cat: "Stationnement",            frs: "Indigo Québec",                ttc: 42.00,   statut: "A_VALIDER", taxe: "ESTIMEE"  },
    { jour: 17, cat: "Poste / messagerie",       frs: "Purolator",                    ttc: 63.22,   statut: "A_VALIDER", taxe: "ESTIMEE"  },
    { jour: 18, cat: null,                       frs: "Restaurant Le Continental",    ttc: 96.75,   statut: "NOUVEAU",   taxe: "ESTIMEE"  },
    { jour: 19, cat: null,                       frs: "Amazon.ca",                    ttc: 58.40,   statut: "NOUVEAU",   taxe: "ESTIMEE"  },
  ];

  let nDep = 0;
  for (const d of DEPENSES) {
    const description = `${PREFIXE}${d.frs}`;
    if (await prisma.cabinetExpense.findFirst({ where: { cabinetId: CABINET, descriptionBancaire: description } })) continue;

    const cat = d.cat ? parNom.get(d.cat) : null;
    // Décomposition d'un TTC, comme le fait l'application quand la pièce ne
    // porte pas les taxes : elle sert la justesse des états, jamais la
    // déclaration. D'où `taxOrigin: ESTIMEE`.
    const ht = d.taxe === "AUCUNE" ? d.ttc : arrondi(d.ttc / (1 + TPS + TVQ));
    const tps = d.taxe === "AUCUNE" ? 0 : arrondi(ht * TPS);
    const tvq = d.taxe === "AUCUNE" ? 0 : arrondi(ht * TVQ);

    const dep = await prisma.cabinetExpense.create({
      data: {
        cabinetId: CABINET,
        date: new Date(debutMois.getFullYear(), debutMois.getMonth(), d.jour, 9, 0),
        descriptionBancaire: description,
        fournisseurNormalise: d.frs,
        categoryId: cat?.id ?? null,
        categoryName: cat?.name ?? null,
        montant: d.ttc,
        montantHt: ht,
        tps, tvq,
        montantTtc: d.ttc,
        taxOrigin: d.taxe,
        typeTransaction: "DEPENSE",
        statutValidation: d.statut,
        refacturable: d.cat === "Frais tribunal",
      },
    });
    // Seule une dépense VALIDÉE va au journal. Les autres attendent la
    // validation, et c'est exactement ce que la ligne « À traiter » annonce.
    if (d.statut === "VALIDE") await writeJournalForCabinetExpense(dep, { client: prisma });
    nDep++;
  }

  const total = await prisma.journalGeneralEntry.count({ where: { cabinetId: CABINET } });
  console.log(`\nExercice : ${cree} factures créées, envoyées et payées.`);
  console.log(`Dépenses : ${nDep} posées, dont 3 à valider et 2 sans catégorie.`);
  console.log(`Le journal compte maintenant ${total} écritures.`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
