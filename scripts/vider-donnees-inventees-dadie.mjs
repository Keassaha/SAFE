/**
 * Retire les données INVENTÉES de l'espace DADIÉ AVOCAT (dadie-avocat-qc-2026).
 *
 * Le CEO a refusé les clients fabriqués (Diallo, Lemay, 9312-4477 Québec inc.)
 * une fois l'installation vue de plus près : un cabinet de démonstration qui
 * ressemble à un vrai dossier client est trompeur, même en interne.
 *
 * Conserve : Cabinet, User (accès admin), CabinetInterface (config horaire,
 * sans couche assistante), DeboursType/DeboursTemplate (catalogue générique,
 * pas des données client).
 * Efface : Client, Dossier, Invoice/InvoiceLine, TimeEntry, TrustAccount/
 * TrustTransaction/TrustBankAccount, ConflictCheck.
 *
 * Résultat : un cabinet vide, prêt à recevoir les vraies données de Me Dadié.
 *
 * Modèle : scripts/reset-derisier-cabinet.ts (même geste, même prudence).
 *
 * Run: npx tsx scripts/vider-donnees-inventees-dadie.mjs
 */
import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", override: true });
loadEnv({ path: ".env" });

const prisma = new PrismaClient(
  process.env.SEED_DATABASE_URL
    ? { datasources: { db: { url: process.env.SEED_DATABASE_URL } } }
    : undefined,
);

const CABINET_ID = "dadie-avocat-qc-2026";

async function main() {
  console.log(`\n=== Vidage des données inventées — ${CABINET_ID} ===\n`);

  let n = 0;

  // ── Ordre enfant → parent, dicté par les FK réelles du schéma ──────────────

  n = await prisma.timeEntry.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`TimeEntry: ${n} supprimées`);

  const invoices = await prisma.invoice.findMany({ where: { cabinetId: CABINET_ID }, select: { id: true } });
  const invoiceIds = invoices.map((i) => i.id);

  n = await prisma.invoiceLine.deleteMany({ where: { invoiceId: { in: invoiceIds } } }).then((r) => r.count);
  console.log(`InvoiceLine: ${n} supprimées`);

  n = await prisma.invoice.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`Invoice: ${n} supprimées`);

  n = await prisma.trustTransaction.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`TrustTransaction: ${n} supprimées`);

  n = await prisma.trustAccount.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`TrustAccount (carte-client): ${n} supprimés`);

  // TrustBankAccount_trustBankAccountId → ON DELETE RESTRICT : ne se supprime
  // qu'une fois TrustTransaction vidé, ce qui vient d'être fait.
  n = await prisma.trustBankAccount.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`TrustBankAccount: ${n} supprimé(s)`);

  n = await prisma.conflictCheck.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`ConflictCheck: ${n} supprimées`);

  n = await prisma.dossier.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`Dossier: ${n} supprimés`);

  n = await prisma.client.deleteMany({ where: { cabinetId: CABINET_ID } }).then((r) => r.count);
  console.log(`Client: ${n} supprimés`);

  // ── Ce qui reste ─────────────────────────────────────────────────────────
  const [cabinet, users, interfaceRow, debours] = await Promise.all([
    prisma.cabinet.findUnique({ where: { id: CABINET_ID }, select: { nom: true } }),
    prisma.user.count({ where: { cabinetId: CABINET_ID } }),
    prisma.cabinetInterface.count({ where: { cabinetId: CABINET_ID } }),
    prisma.deboursType.count({ where: { cabinetId: CABINET_ID } }),
  ]);

  console.log("\n=== Ce qui reste ===");
  console.log(`Cabinet:          ${cabinet?.nom ?? "INTROUVABLE"} (${CABINET_ID})`);
  console.log(`Utilisateurs:     ${users}`);
  console.log(`CabinetInterface: ${interfaceRow}`);
  console.log(`Types de débours: ${debours}`);
  console.log(`Clients:          0 (vidé)`);
  console.log(`\nCabinet vide, prêt pour les vraies données de Me Dadié.\n`);
}

main()
  .catch((e) => {
    console.error("Échec du vidage:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
