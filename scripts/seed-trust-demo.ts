/**
 * Seed fidéicommis pour VOIR les écrans de conformité avec des données.
 *
 *   npx tsx scripts/seed-trust-demo.ts "Cabinet Test"
 *
 * ⚠️ CABINETS JETABLES SEULEMENT. Le registre fidéicommis est append-only : une
 * écriture de démonstration ne se supprime pas proprement. Injecter des mouvements
 * fictifs dans la comptabilité d'un cabinet réel corromprait un registre légal, et
 * c'est exactement ce que les treize chantiers ont passé leur temps à empêcher.
 *
 * Le script refuse donc tout cabinet dont la configuration ne porte pas
 * `isTestCabinet: true`, sauf `--force` explicite.
 *
 * Tout passe par les VRAIS services : les garde-fous s'exécutent, le journal reste
 * cohérent, et si une règle bloque, on le verra ici plutôt qu'en production.
 */

import { prisma } from "@/lib/db";
import { openTrustBankAccount, listTrustBankAccounts } from "@/lib/services/fideicommis/trust-bank-account-service";
import {
  createTrustDeposit,
  createTrustWithdrawal,
} from "@/lib/services/fideicommis/trust-transaction-service";
import {
  generateMonthlyReport,
  periodBounds,
} from "@/lib/services/fideicommis/monthly-report-service";
import { getTrustBalancesByDossier } from "@/lib/services/fideicommis/trust-balance-service";

const nomCabinet = process.argv[2] ?? "Cabinet Test";
const force = process.argv.includes("--force");

/** Mois écoulé, au format "YYYY-MM". On ne rapproche pas un mois en cours. */
function moisEcoule(now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function jourDuMois(periode: string, jour: number): Date {
  const [y, m] = periode.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, jour, 14, 0, 0));
}

async function main() {
  const cabinet = await prisma.cabinet.findFirst({ where: { nom: nomCabinet } });
  if (!cabinet) throw new Error(`Cabinet « ${nomCabinet} » introuvable.`);

  const config = (() => {
    try {
      return JSON.parse(String(cabinet.config ?? "{}")) as Record<string, unknown>;
    } catch {
      return {};
    }
  })();

  if (config.isTestCabinet !== true && !force) {
    throw new Error(
      `« ${nomCabinet} » n'est pas marqué isTestCabinet. Le registre fidéicommis est ` +
        `append-only : une écriture de démonstration ne se retire pas proprement. ` +
        `Relancez avec --force si c'est vraiment ce que vous voulez.`,
    );
  }

  const user = await prisma.user.findFirst({
    where: { cabinetId: cabinet.id },
    orderBy: { role: "asc" },
  });
  if (!user) throw new Error("Aucun utilisateur dans ce cabinet.");

  const dossiers = await prisma.dossier.findMany({
    where: { cabinetId: cabinet.id },
    select: { id: true, clientId: true, numeroDossier: true, intitule: true },
    take: 3,
  });
  if (dossiers.length === 0) throw new Error("Aucun dossier dans ce cabinet.");

  console.log(`Cabinet : ${cabinet.nom} (${cabinet.id})`);
  console.log(`Dossiers utilisés : ${dossiers.map((d) => d.numeroDossier ?? d.id).join(", ")}`);

  /* ── 1. Le compte bancaire en fidéicommis ────────────────────── */

  const existants = await listTrustBankAccounts(cabinet.id);
  let compteId = existants[0]?.id ?? null;

  if (!compteId) {
    const ouvert = await openTrustBankAccount({
      cabinetId: cabinet.id,
      userId: user.id,
      accountLabel: `${cabinet.nom} — compte général en fidéicommis / in trust`,
      institutionName: "Banque de démonstration",
      institutionBranch: "Succursale principale",
      branchProvince: "ON",
      accountNumber: "000123456789",
      barreauAgreementConfirmed: true,
      openedAt: new Date(Date.UTC(2025, 0, 15)),
    });
    compteId = ouvert.id;
    console.log(`Compte ouvert : ${compteId}`);
    for (const w of ouvert.warnings) console.log(`  avertissement : ${w.code}`);
  } else {
    console.log(`Compte existant réutilisé : ${compteId}`);
  }

  /* ── 2. Les écritures du mois écoulé ─────────────────────────── */

  const periode = moisEcoule(new Date());
  console.log(`Période : ${periode}`);

  const depots = [
    { d: dossiers[0]!, jour: 3, montant: 12500, payeur: "Succession Lavoie", desc: "Provision de clôture" },
    { d: dossiers[0]!, jour: 11, montant: 4800, payeur: "Succession Lavoie", desc: "Complément de provision" },
    { d: dossiers[1] ?? dossiers[0]!, jour: 8, montant: 7250, payeur: "9412-8830 Québec inc.", desc: "Avance de débours" },
    { d: dossiers[2] ?? dossiers[0]!, jour: 17, montant: 3100, payeur: "Marie-Claude Bergeron", desc: "Provision" },
    { d: dossiers[1] ?? dossiers[0]!, jour: 22, montant: 9400, payeur: "9412-8830 Québec inc.", desc: "Fonds de transaction" },
  ];

  for (const dep of depots) {
    await createTrustDeposit({
      cabinetId: cabinet.id,
      trustBankAccountId: compteId,
      clientId: dep.d.clientId,
      dossierId: dep.d.id,
      montant: dep.montant,
      dateTransaction: jourDuMois(periode, dep.jour),
      modePaiement: "VIREMENT",
      payerName: dep.payeur,
      purposeCode: "AVANCE_DEBOURS",
      description: dep.desc,
      createdById: user.id,
    });
    console.log(`  dépôt ${dep.montant} $ — ${dep.desc}`);
  }

  /* ── 3. Deux retraits, sans facture ───────────────────────────── */
  //
  // Motif REMISE_CLIENT_OU_TIERS : c'est le seul qui n'exige pas de facture émise ET
  // transmise. Un retrait d'honoraires demanderait une facture réellement transmise,
  // ce qui est le sujet du CH-13 et n'a pas sa place dans un seed.

  const retraits = [
    { d: dossiers[0]!, jour: 19, montant: 3500, benef: "Officier de la publicité foncière", cheque: 1042 },
    { d: dossiers[1] ?? dossiers[0]!, jour: 26, montant: 2200, benef: "Huissiers Provost", cheque: 1043 },
  ];

  for (const r of retraits) {
    // Le chèque est inscrit au registre par le service lui-même (art. 61 QC /
    // s. 11 ON) dès que `modePaiement: "CHEQUE"` et `chequeNumber` sont fournis.
    // L'inscrire une seconde fois ici déclenchait le contrôle d'unicité — le
    // garde-fou faisait son travail.
    await createTrustWithdrawal({
      cabinetId: cabinet.id,
      trustBankAccountId: compteId,
      clientId: r.d.clientId,
      dossierId: r.d.id,
      montant: r.montant,
      dateTransaction: jourDuMois(periode, r.jour),
      motive: "REMISE_CLIENT_OU_TIERS",
      modePaiement: "CHEQUE",
      payeeName: r.benef,
      chequeNumber: r.cheque,
      description: `Paiement à ${r.benef}`,
      createdById: user.id,
    });

    console.log(`  retrait ${r.montant} $ par chèque nº ${r.cheque} — ${r.benef}`);
  }

  /* ── 4. Le rapport mensuel ───────────────────────────────────── */

  const soldes = await getTrustBalancesByDossier(cabinet.id, compteId);
  const soldeJournal = soldes.reduce((s, l) => s + l.balance, 0);
  const chequesEnCirculation = retraits.reduce((s, r) => s + r.montant, 0);

  // Le relevé bancaire ne connaît pas encore les chèques non compensés : le solde
  // bancaire est donc SUPÉRIEUR au journal du montant de ces chèques. C'est le cas
  // normal, et il donne un écart nul une fois le rapprochement fait.
  const soldeBancaire = Math.round((soldeJournal + chequesEnCirculation) * 100) / 100;

  const { start, end } = periodBounds(periode);
  console.log(
    `Solde journal ${soldeJournal.toFixed(2)} $ · chèques en circulation ` +
      `${chequesEnCirculation.toFixed(2)} $ · relevé ${soldeBancaire.toFixed(2)} $`,
  );
  console.log(`Bornes de période : ${start.toISOString()} → ${end.toISOString()}`);

  const rapport = await generateMonthlyReport({
    cabinetId: cabinet.id,
    trustBankAccountId: compteId,
    periode,
    bankStatementBalance: soldeBancaire,
    userId: user.id,
  });

  console.log(`Rapport produit : ${(rapport as { id?: string }).id ?? "(sans id retourné)"}`);
  console.log("");
  console.log("Ouvrez /comptes/rapport-mensuel puis /comptes/trousse-inspection.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
