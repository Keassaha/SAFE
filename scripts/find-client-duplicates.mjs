/**
 * Audit read-only des doublons clients.
 *
 * Usage:
 *   node scripts/find-client-duplicates.mjs              # tous les cabinets
 *   node scripts/find-client-duplicates.mjs --cabinet=ID # un seul cabinet
 *
 * Pour chaque groupe de doublons, affiche :
 *  - les ids
 *  - le nom affichable
 *  - le nombre de dossiers, factures, paiements associés
 *  - la date de création
 *
 * Read-only : ne modifie rien. Pour fusionner, utiliser ensuite
 * scripts/merge-client-duplicates.mjs.
 */
import { PrismaClient } from "@prisma/client";
import { clientDedupeKey, displayClientName } from "./_lib/normalize-name.mjs";

const prisma = new PrismaClient();

function arg(name) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split("=").slice(1).join("=") : null;
}

const displayName = displayClientName;

async function main() {
  const cabinetFilter = arg("cabinet");
  console.log(
    `Audit des doublons clients${cabinetFilter ? ` (cabinet ${cabinetFilter})` : " (tous cabinets)"}...\n`
  );

  const clients = await prisma.client.findMany({
    where: {
      ...(cabinetFilter ? { cabinetId: cabinetFilter } : {}),
      status: { not: "archive" },
    },
    select: {
      id: true,
      cabinetId: true,
      raisonSociale: true,
      prenom: true,
      nom: true,
      typeClient: true,
      email: true,
      telephone: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by (cabinetId + dedupeKey).
  const groups = new Map();
  for (const c of clients) {
    const key = clientDedupeKey({
      typeClient: c.typeClient,
      raisonSociale: c.raisonSociale,
      prenom: c.prenom,
      nom: c.nom,
    });
    if (!key) continue; // can't compare on empty key
    const groupKey = `${c.cabinetId}::${key}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(c);
  }

  const duplicateGroups = Array.from(groups.entries()).filter(([, members]) => members.length > 1);

  if (duplicateGroups.length === 0) {
    console.log("Aucun doublon détecté.");
    return;
  }

  console.log(`${duplicateGroups.length} groupe(s) de doublons détecté(s) :\n`);

  for (const [groupKey, members] of duplicateGroups) {
    const [cabinetId, key] = groupKey.split("::");
    console.log(`---`);
    console.log(`Cabinet ${cabinetId} | clé "${key}" | ${members.length} clients :`);
    for (const m of members) {
      const [dossiers, invoices, payments, timeEntries, registreTaches, documents] = await Promise.all([
        prisma.dossier.count({ where: { clientId: m.id } }),
        prisma.invoice.count({ where: { clientId: m.id } }),
        prisma.payment.count({ where: { clientId: m.id } }),
        prisma.timeEntry.count({ where: { clientId: m.id } }),
        prisma.registreTache.count({ where: { clientId: m.id } }),
        prisma.document.count({ where: { clientId: m.id } }),
      ]);
      const total = dossiers + invoices + payments + timeEntries + registreTaches + documents;
      console.log(
        `  - id=${m.id}  "${displayName(m)}"  type=${m.typeClient}  email=${m.email ?? "—"}  ` +
          `dossiers=${dossiers} factures=${invoices} paiements=${payments} ` +
          `temps=${timeEntries} taches=${registreTaches} docs=${documents}  total=${total}  ` +
          `created=${m.createdAt.toISOString().slice(0, 10)}`
      );
    }
    console.log("");
    console.log(
      `  Pour fusionner :  node scripts/merge-client-duplicates.mjs --keep=<id> --remove=<id> --dry-run`
    );
    console.log("");
  }
}

main()
  .catch((err) => {
    console.error("Audit failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
