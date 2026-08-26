/**
 * Relevé de repli : les montants du cabinet, pris dans la base.
 *
 * Voir docs/design/PROCEDURE_EXTRAITS_VITRINE.md.
 *
 * L'étape 1 de la procédure demande une session pour capturer l'écran. Quand
 * cette session n'est pas disponible, ce script produit un relevé équivalent
 * POUR LES CHIFFRES, en interrogeant la base directement.
 *
 * Ce n'est pas la même preuve, et le fichier le dit : « source: base ». Un
 * relevé d'écran prouve que l'application AFFICHE ces montants. Celui-ci prouve
 * seulement qu'ils EXISTENT. La différence compte : elle a déjà mordu une fois,
 * quand le total du fidéicommis calculé en « dépôts moins retraits » donnait
 * 95 125 $ alors que l'application affiche 89 275 $, parce que les retraits
 * sont stockés en négatif et se trouvaient comptés deux fois.
 *
 * Les calculs reproduits ici sont donc ceux de l'application, pas les nôtres :
 * le solde de fidéicommis est une somme de « amount », comme
 * getGlobalTrustBalance() dans lib/services/fideicommis/trust-balance-service.ts.
 *
 *   node scripts/relever-depuis-la-base.mjs
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const CABINET = process.env.SAFE_CAPTURE_CABINET ?? "Cabinet Demo";
const SORTIE = path.join(process.cwd(), "docs", "design", "references-app");

const argent = (n) =>
  new Intl.NumberFormat("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(n)
    .replace(/ /g, " ") + " $";

async function main() {
  const prisma = new PrismaClient();
  const cabinet = await prisma.cabinet.findFirst({ where: { nom: CABINET }, select: { id: true, nom: true } });
  if (!cabinet) {
    console.error(`Cabinet « ${CABINET} » introuvable dans la base.`);
    process.exit(1);
  }
  const cabinetId = cabinet.id;

  const montants = [];
  const ajouter = (valeur, pres) => montants.push({ valeur: argent(valeur), pres });

  /* Fidéicommis. Somme de « amount », exactement getGlobalTrustBalance(). */
  const soldes = await prisma.trustTransaction.groupBy({
    by: ["clientId"],
    where: { cabinetId },
    _sum: { amount: true },
  });
  let total = 0;
  for (const s of soldes) {
    const v = s._sum.amount ?? 0;
    total += v;
    if (v !== 0) ajouter(v, `fidéicommis · client ${s.clientId}`);
  }
  ajouter(total, "fidéicommis · solde total");

  const mois = new Date();
  const debut = new Date(mois.getFullYear(), mois.getMonth(), 1);
  const fin = new Date(mois.getFullYear(), mois.getMonth() + 1, 0, 23, 59, 59, 999);
  for (const type of ["deposit", "withdrawal"]) {
    const agg = await prisma.trustTransaction.aggregate({
      where: { cabinetId, type, date: { gte: debut, lte: fin } },
      _sum: { amount: true },
    });
    ajouter(Math.abs(agg._sum.amount ?? 0), `fidéicommis · ${type} du mois`);
  }

  /* Factures. Tous les montants qu'un écran de facture peut afficher. */
  const factures = await prisma.invoice.findMany({
    where: { cabinetId, statut: { not: "brouillon" } },
    select: {
      numero: true,
      montantTotal: true,
      montantPaye: true,
      balanceDue: true,
      subtotalFees: true,
      subtotalExpenses: true,
    },
  });
  for (const f of factures) {
    ajouter(f.montantTotal, `facture ${f.numero} · total`);
    ajouter(f.montantPaye, `facture ${f.numero} · payé`);
    ajouter(f.balanceDue, `facture ${f.numero} · solde`);
    ajouter(f.subtotalFees, `facture ${f.numero} · honoraires`);
    ajouter(f.subtotalExpenses, `facture ${f.numero} · débours`);
    /* Les taxes ne sont pas une colonne : c'est ce qui reste. Une vitrine qui
       les affiche prend cette différence, elle ne la recalcule pas. */
    ajouter(f.montantTotal - f.subtotalFees - f.subtotalExpenses, `facture ${f.numero} · taxes`);
  }

  /* Les agregats que la vitrine affiche, repris des requetes de l'application.
     Ils sont en SQL brut et non en Prisma parce que les filtres vivent dans du
     TypeScript (lib/billing/queries.ts) qu'un script .mjs ne peut pas importer.
     Chaque filtre est donc recopie, et son origine notee en regard. */
  const brut = async (sql) => (await prisma.$queryRawUnsafe(sql, cabinetId))[0]?.v ?? 0;

  /* Creances : ce qui reste du, toutes factures emises. */
  ajouter(
    Number(await brut(`select coalesce(sum("balanceDue"),0) as v from "Invoice" where "cabinetId"=$1 and statut<>'brouillon'`)),
    "facturation · reste a recevoir",
  );
  /* Encaisse du mois courant. */
  ajouter(
    Number(await brut(
      `select coalesce(sum(montant),0) as v from "Payment" where "cabinetId"=$1` +
        ` and "datePaiement" >= date_trunc('month', current_date)` +
        ` and "datePaiement" < date_trunc('month', current_date) + interval '1 month'`,
    )),
    "facturation · encaisse ce mois",
  );
  /* Heures non facturees. Le filtre est celui de buildBillableTimeEntryWhere :
     facturable, sans facture, sans ligne, non radiee. Une somme naive de
     TimeEntry donne 133 600 $ au lieu de 118 881,25 $ : la difference est
     faite des entrees non facturables et radiees. */
  ajouter(
    Number(await brut(
      `select coalesce(sum(montant),0) as v from "TimeEntry" where "cabinetId"=$1` +
        ` and "invoiceId" is null and "invoiceLineId" is null and facturable=true and "isWrittenOff"=false`,
    )),
    "temps · non facture",
  );

  const [actifs, tousDossiers, clients] = await Promise.all([
    prisma.dossier.count({ where: { cabinetId, statut: "actif" } }),
    prisma.dossier.count({ where: { cabinetId } }),
    prisma.client.count({ where: { cabinetId } }),
  ]);

  await prisma.$disconnect();
  fs.mkdirSync(SORTIE, { recursive: true });

  const releve = {
    source: "base",
    avertissement:
      "Relevé de repli. Il prouve que ces montants EXISTENT, pas que l'application les affiche. " +
      "Pour la preuve d'affichage, lancez scripts/capturer-ecran-reel.mjs avec une session.",
    capture: { cabinet: cabinet.nom, cabinetId },
    ecrans: {
      base: { ecran: "base", montants, compteurs: { dossiersActifs: actifs, dossiers: tousDossiers, clients } },
    },
  };
  fs.writeFileSync(path.join(SORTIE, "releve.json"), JSON.stringify(releve, null, 2));
  console.log(
    `Relevé écrit : ${montants.length} montants, ` +
      `${actifs} dossiers actifs sur ${tousDossiers}, ${clients} clients.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
