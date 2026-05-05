/**
 * Fusion contrôlée de deux clients en doublon.
 *
 * Usage :
 *   node scripts/merge-client-duplicates.mjs --keep=<keepId> --remove=<removeId> [--dry-run]
 *
 * Comportement :
 *  1. Vérifie que les deux clients existent dans le même cabinet.
 *  2. Réassigne TOUTES les FK (clientId) de `remove` vers `keep` :
 *     Dossier, TimeEntry, Invoice, Payment, TrustAccount, TrustTransaction,
 *     CreditNote, BillingRun, ClientIdentityVerification, Document, Expense,
 *     DeboursDossier, ConsentLog, JournalGeneralEntry, CalendarEvent,
 *     RegistreTache, NotificationLog, DossierReadyForReviewSignal,
 *     DossierDocketEntry, RichDocument, WorkSession.
 *  3. Cas TrustAccount : si les deux clients ont un ledger pour le même matter,
 *     on additionne les soldes sur `keep`, on déplace les transactions, puis on
 *     supprime le ledger en doublon (collision sur la contrainte unique
 *     [cabinetId, clientId, matterId]).
 *  4. Comble les champs vides de `keep` avec les valeurs non vides de `remove`
 *     (email, telephone, adresse, billing*, etc.). Les valeurs déjà remplies
 *     sur `keep` ne sont jamais écrasées.
 *  5. Supprime le client `remove`.
 *  6. Audit log de la fusion.
 *
 * Tout est exécuté dans une seule transaction. `--dry-run` affiche ce qui serait
 * fait sans rien écrire.
 */
import { PrismaClient } from "@prisma/client";
import { displayClientName } from "./_lib/normalize-name.mjs";

const prisma = new PrismaClient();

function arg(name) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split("=").slice(1).join("=") : null;
}
function flag(name) {
  return process.argv.includes(`--${name}`);
}

const KEEP_ID = arg("keep");
const REMOVE_ID = arg("remove");
const DRY_RUN = flag("dry-run");

if (!KEEP_ID || !REMOVE_ID) {
  console.error("Usage : node scripts/merge-client-duplicates.mjs --keep=<id> --remove=<id> [--dry-run]");
  process.exit(2);
}
if (KEEP_ID === REMOVE_ID) {
  console.error("--keep et --remove doivent être différents.");
  process.exit(2);
}

/**
 * Tables avec une FK clientId à réassigner par simple updateMany.
 * On exclut TrustAccount (collisions possibles, traité à part) et Client (cible).
 */
const SIMPLE_REASSIGN_TABLES = [
  "dossier",
  "timeEntry",
  "invoice",
  "payment",
  "trustTransaction",
  "creditNote",
  "billingRun",
  "clientIdentityVerification",
  "document",
  "expense",
  "deboursDossier",
  "consentLog",
  "journalGeneralEntry",
  "calendarEvent",
  "registreTache",
  "notificationLog",
  "dossierReadyForReviewSignal",
  "dossierDocketEntry",
  "richDocument",
  "workSession",
];

async function main() {
  const [keep, remove] = await Promise.all([
    prisma.client.findUnique({ where: { id: KEEP_ID } }),
    prisma.client.findUnique({ where: { id: REMOVE_ID } }),
  ]);
  if (!keep) {
    console.error(`Client à conserver introuvable : ${KEEP_ID}`);
    process.exit(1);
  }
  if (!remove) {
    console.error(`Client à supprimer introuvable : ${REMOVE_ID}`);
    process.exit(1);
  }
  if (keep.cabinetId !== remove.cabinetId) {
    console.error("Refus : les deux clients ne sont pas dans le même cabinet.");
    process.exit(1);
  }

  console.log("============================================================");
  console.log("Fusion de clients en doublon");
  console.log("============================================================");
  console.log(`Cabinet  : ${keep.cabinetId}`);
  console.log(`Conserve : ${KEEP_ID}  "${displayClientName(keep)}"`);
  console.log(`Supprime : ${REMOVE_ID}  "${displayClientName(remove)}"`);
  console.log(`Mode     : ${DRY_RUN ? "DRY RUN (rien n'est écrit)" : "LIVE"}`);
  console.log("");

  // --- 1. Inventaire des FK à réassigner ----------------------------------
  console.log("Inventaire des données à transférer :");
  const counts = {};
  for (const table of SIMPLE_REASSIGN_TABLES) {
    counts[table] = await prisma[table].count({ where: { clientId: REMOVE_ID } });
    if (counts[table] > 0) console.log(`  - ${table} : ${counts[table]}`);
  }

  // --- 2. Cas spécial TrustAccount (collision possible) -------------------
  const removeTrustAccounts = await prisma.trustAccount.findMany({
    where: { clientId: REMOVE_ID },
    select: { id: true, matterId: true, currentBalance: true },
  });
  const keepTrustAccountsByMatter = new Map(
    (
      await prisma.trustAccount.findMany({
        where: { clientId: KEEP_ID },
        select: { id: true, matterId: true, currentBalance: true },
      })
    ).map((a) => [String(a.matterId), a])
  );

  const trustMoves = []; // { from, to, balance }
  const trustReassigns = []; // simple update from clientId=remove → keep
  for (const acc of removeTrustAccounts) {
    const collision = keepTrustAccountsByMatter.get(String(acc.matterId));
    if (collision) {
      trustMoves.push({ fromId: acc.id, toId: collision.id, balance: acc.currentBalance });
    } else {
      trustReassigns.push(acc.id);
    }
  }
  if (removeTrustAccounts.length > 0) {
    console.log(
      `  - trustAccount : ${removeTrustAccounts.length} ledger(s) (${trustReassigns.length} déplaçables, ${trustMoves.length} à fusionner)`
    );
  }

  // --- 3. Champs à combler sur keep ---------------------------------------
  const fillable = [
    "email",
    "emailSecondaire",
    "telephone",
    "telephoneSecondaire",
    "adresse",
    "addressLine1",
    "addressLine2",
    "city",
    "province",
    "postalCode",
    "country",
    "preferredContactMethod",
    "langue",
    "billingContactName",
    "billingEmail",
    "billingAddress",
    "billingAddressLine1",
    "billingAddressLine2",
    "billingCity",
    "billingProvince",
    "billingPostalCode",
    "billingCountry",
    "preferredPaymentMethod",
    "paymentTerms",
    "creditLimit",
    "clientCode",
    "displayName",
  ];
  const fillData = {};
  for (const f of fillable) {
    if ((keep[f] === null || keep[f] === undefined || keep[f] === "") && remove[f]) {
      fillData[f] = remove[f];
    }
  }
  if (Object.keys(fillData).length > 0) {
    console.log(`\nChamps à combler sur keep (depuis remove) :`);
    for (const k of Object.keys(fillData)) console.log(`  - ${k}`);
  }

  if (DRY_RUN) {
    console.log("\nDRY RUN — aucune modification appliquée.");
    return;
  }

  // --- 4. Exécution dans une transaction ----------------------------------
  await prisma.$transaction(async (tx) => {
    // 4a. Réassignations simples
    for (const table of SIMPLE_REASSIGN_TABLES) {
      if (counts[table] === 0) continue;
      await tx[table].updateMany({
        where: { clientId: REMOVE_ID },
        data: { clientId: KEEP_ID },
      });
    }

    // 4b. TrustAccount sans collision : reassign direct
    if (trustReassigns.length > 0) {
      await tx.trustAccount.updateMany({
        where: { id: { in: trustReassigns } },
        data: { clientId: KEEP_ID },
      });
    }

    // 4c. TrustAccount avec collision : déplace les transactions, additionne les soldes, supprime le ledger orphelin
    for (const move of trustMoves) {
      await tx.trustTransaction.updateMany({
        where: { trustAccountId: move.fromId },
        data: { trustAccountId: move.toId },
      });
      await tx.trustAccount.update({
        where: { id: move.toId },
        data: { currentBalance: { increment: move.balance } },
      });
      await tx.trustAccount.delete({ where: { id: move.fromId } });
    }

    // 4d. Combler les champs vides sur keep
    if (Object.keys(fillData).length > 0) {
      await tx.client.update({ where: { id: KEEP_ID }, data: fillData });
    }

    // 4e. Supprimer le client en doublon
    await tx.client.delete({ where: { id: REMOVE_ID } });

    // 4f. Audit log
    await tx.auditLog.create({
      data: {
        cabinetId: keep.cabinetId,
        userId: null,
        entityType: "Client",
        entityId: KEEP_ID,
        action: "merge",
        metadata: JSON.stringify({
          mergedFrom: REMOVE_ID,
          mergedFromName: displayClientName(remove),
          counts,
          trustMoves: trustMoves.length,
          trustReassigns: trustReassigns.length,
          filledFields: Object.keys(fillData),
          source: "scripts/merge-client-duplicates.mjs",
        }),
      },
    });
  });

  console.log("\nFusion terminée.");
}

main()
  .catch((err) => {
    console.error("Merge failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
