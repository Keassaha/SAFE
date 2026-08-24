/**
 * SAFE — Enregistre un virement Interac reçu d'un cabinet abonné.
 *
 * SAFE Inc. encaisse ses abonnements par virement, qui n'a pas d'API. Le
 * paiement existe donc dans un compte bancaire et nulle part ailleurs. Ce
 * script est le geste qui le fait entrer dans les livres :
 *
 *   1. émet la facture d'abonnement (numérotation Barreau, journal, audit) ;
 *   2. enregistre le paiement reçu et l'impute sur cette facture ;
 *   3. la prolongation d'accès suit d'elle-même, depuis l'encaissement.
 *
 * SIMULATION PAR DÉFAUT. Rien ne s'écrit sans `--apply`.
 *
 *   npx tsx scripts/enregistrer-paiement-abonnement.mts --list
 *   npx tsx scripts/enregistrer-paiement-abonnement.mts --cabinet=... --date=2026-07-01 --mois=1
 *   npx tsx scripts/enregistrer-paiement-abonnement.mts --cabinet=... --date=2026-07-01 --mois=1 --apply
 */

import { prisma } from "../lib/db";
import {
  emettreFactureAbonnement,
  preparerFactureAbonnement,
  validerMoisCouverts,
} from "../lib/services/abonnement/facture-abonnement";
import { createPayment } from "../lib/services/billing/payment-allocation-service";
import { deriveCabinetSubscriptionState } from "../lib/services/subscription-state";
import { deciderProlongation } from "../lib/services/abonnement/acces-paye";

const arg = (nom: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${nom}=`))?.split("=").slice(1).join("=");
const flag = (nom: string): boolean => process.argv.includes(`--${nom}`);
const argent = (n: number) => `${n.toFixed(2)} $`;
const jour = (d: Date | null | undefined) => d?.toISOString().slice(0, 10) ?? "—";

async function lister() {
  const abonnes = await prisma.cabinet.findMany({
    where: { ficheAbonne: { isNot: null } },
    select: {
      id: true, nom: true, plan: true, abonnementMontantMensuel: true,
      accesPayeJusquau: true, stripeSubscriptionStatus: true,
      stripeTrialEnd: true, stripeCurrentPeriodEnd: true, fermeLe: true,
    },
    orderBy: { nom: "asc" },
  });
  console.log("\nCABINETS ABONNÉS FACTURABLES\n");
  for (const c of abonnes) {
    const etat = deriveCabinetSubscriptionState(c);
    console.log(
      `  ${c.nom}`,
      `\n    identifiant  : ${c.id}`,
      `\n    mensualité   : ${c.abonnementMontantMensuel != null ? argent(Number(c.abonnementMontantMensuel)) : "non provisionnée"}`,
      `\n    accès payé   : ${jour(c.accesPayeJusquau)}`,
      `\n    état         : ${etat.active ? "accès ouvert" : `refusé (${etat.reason})`}`,
      c.fermeLe ? "\n    ⚠️  cabinet fermé" : "",
      "\n",
    );
  }
}

async function main() {
  if (flag("list")) {
    await lister();
    return;
  }

  const cabinetAbonneId = arg("cabinet");
  const dateTexte = arg("date");
  const moisTexte = arg("mois");
  const reference = arg("reference") ?? null;
  const appliquer = flag("apply");

  if (!cabinetAbonneId || !dateTexte || !moisTexte) {
    console.error(
      "\nUsage : --cabinet=<identifiant> --date=AAAA-MM-JJ --mois=<1..12> [--reference=<n° Interac>] [--apply]" +
        "\n        --list pour voir les cabinets facturables.\n",
    );
    process.exitCode = 1;
    return;
  }

  const mois = validerMoisCouverts(moisTexte);
  // Date à midi UTC : posée à minuit, un décalage de fuseau la ferait basculer
  // sur la veille et l'accès expirerait un jour trop tôt.
  const datePaiement = new Date(`${dateTexte}T12:00:00.000Z`);
  if (Number.isNaN(datePaiement.getTime())) {
    console.error(`Date illisible : « ${dateTexte} ». Format attendu : AAAA-MM-JJ.`);
    process.exitCode = 1;
    return;
  }

  const abonne = await prisma.cabinet.findUnique({
    where: { id: cabinetAbonneId },
    select: {
      id: true, nom: true, plan: true, abonnementMontantMensuel: true,
      accesPayeJusquau: true, stripeSubscriptionStatus: true,
      stripeTrialEnd: true, stripeCurrentPeriodEnd: true,
      ficheAbonne: { select: { id: true, raisonSociale: true, cabinetId: true } },
    },
  });
  if (!abonne?.ficheAbonne || abonne.abonnementMontantMensuel == null) {
    console.error(
      `\nCabinet « ${cabinetAbonneId} » introuvable, sans fiche abonné, ou sans montant mensuel.` +
        `\nUtilisez --list pour voir les cabinets facturables.\n`,
    );
    process.exitCode = 1;
    return;
  }

  const prepare = preparerFactureAbonnement({
    nomCabinet: abonne.nom,
    montantMensuel: Number(abonne.abonnementMontantMensuel),
    mois,
    dateEmission: datePaiement,
  });

  /* L'aperçu doit interroger la règle, pas la réimplémenter.
     Première version : l'aperçu partait de la date du virement et annonçait le
     1er août ; le service, lui, part du jour de l'enregistrement et a posé le
     24 septembre. Un aperçu qu'on relit pour approuver une écriture comptable
     ne peut pas raconter autre chose que ce qui sera écrit. */
  const decision = deciderProlongation({
    cabinetAbonneId: abonne.id,
    balanceDue: 0,
    dejaProlongeJusquau: null,
    accesActuel: abonne.accesPayeJusquau,
    moisCouverts: mois,
    maintenant: new Date(),
  });
  const nouvelleEcheance = decision.prolonger ? decision.nouvelleEcheance : null;
  const avant = deriveCabinetSubscriptionState(abonne);

  console.log(`\n${appliquer ? "ENREGISTREMENT" : "SIMULATION (rien n'est écrit)"}\n`);
  console.log(`  cabinet        : ${abonne.nom}`);
  console.log(`  fiche client   : ${abonne.ficheAbonne.raisonSociale ?? abonne.ficheAbonne.id}`);
  console.log(`  facture        : ${prepare.description}`);
  console.log(`  montant        : ${argent(prepare.montant)}  (${argent(Number(abonne.abonnementMontantMensuel))} × ${mois})`);
  console.log(`  taxes          : aucune (SAFE Inc. non inscrite TPS/TVQ)`);
  console.log(`  date           : ${jour(datePaiement)}`);
  console.log(`  référence      : ${reference ?? "—"}`);
  console.log(`  accès  avant   : ${avant.active ? "ouvert" : `refusé (${avant.reason})`}, échéance ${jour(abonne.accesPayeJusquau)}`);
  console.log(`  accès  après   : ouvert jusqu'au ${jour(nouvelleEcheance)}`);
  /* Un virement enregistré en retard ne rétro-date pas l'accès : le mois court
     depuis aujourd'hui. La facture, elle, garde la date du virement. Les deux
     dates divergent donc, et il vaut mieux le lire avant d'approuver. */
  if (datePaiement.toISOString().slice(0, 10) !== new Date().toISOString().slice(0, 10)) {
    console.log(
      `  ⚠️  virement daté du ${jour(datePaiement)}, enregistré aujourd'hui :` +
        `\n      la facture porte la date du virement, l'accès court depuis ce jour-ci.`,
    );
  }
  console.log("");

  if (!appliquer) {
    console.log("  Relancez avec --apply pour écrire.\n");
    return;
  }

  const facture = await emettreFactureAbonnement({
    cabinetAbonneId: abonne.id,
    mois,
    dateEmission: datePaiement,
  });
  console.log(`  ✓ facture émise (${facture.invoiceId})`);

  /* L'émission a consommé un numéro de la séquence officielle. Si
     l'encaissement échoue maintenant, la facture reste émise et impayée : elle
     ne se supprime pas, elle s'annule par note de crédit (doctrine
     d'annulation). Le message doit donc nommer la facture concernée, sinon
     personne ne saura laquelle rattraper. */

  let paiement: { paymentId: string; warnings: unknown[] };
  try {
    paiement = await createPayment({
      cabinetId: abonne.ficheAbonne.cabinetId,
      clientId: abonne.ficheAbonne.id,
      paymentDate: datePaiement,
      amount: facture.montant,
      // « interac » n'existe pas dans PaymentMethodBilling : le virement Interac
      // s'y appelle `e_transfer`. Une valeur libre passerait le typage du
      // paramètre (string) et se briserait à l'écriture, APRÈS que la facture a
      // pris son numéro dans la séquence Barreau.
      paymentMethod: "e_transfer",
      referenceNumber: reference,
      invoiceId: facture.invoiceId,
      allocatedAmount: facture.montant,
      note: `Virement Interac — abonnement ${abonne.nom}`,
    });
  } catch (e) {
    console.error(
      `\n  ✗ L'encaissement a échoué APRÈS l'émission.` +
        `\n    La facture ${facture.invoiceId} est émise et impayée : elle porte un` +
        `\n    numéro officiel et ne se supprime pas. Annulez-la par note de crédit,` +
        `\n    puis relancez.\n`,
    );
    throw e;
  }
  console.log(`  ✓ paiement enregistré (${paiement.paymentId})`);
  for (const a of paiement.warnings) console.log(`  ⚠️  ${JSON.stringify(a)}`);

  const apres = await prisma.cabinet.findUnique({
    where: { id: abonne.id },
    select: { accesPayeJusquau: true },
  });
  console.log(`  ✓ accès prolongé jusqu'au ${jour(apres?.accesPayeJusquau)}\n`);
}

main()
  .catch((e) => {
    console.error("\nÉCHEC :", e instanceof Error ? e.message : e, "\n");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
