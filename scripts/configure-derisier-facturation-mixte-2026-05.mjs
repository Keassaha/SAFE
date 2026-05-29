/**
 * Active la facturation MIXTE (forfait + horaire) pour Derisier Law.
 * Demande Me Derisier (2026-05) : pouvoir facturer à la fois au forfait ET à
 * l'heure, avec un taux horaire par défaut modifiable manuellement.
 *
 * Ce que fait ce script (sûr, idempotent, additif) :
 *   1. CabinetInterface.modules.facturation.principal : "forfait" -> "mixte"
 *      (lève le verrou de app/(app)/dossiers/actions.ts qui force le forfait ;
 *       voir lib/services/cabinet-interface.ts ligne 40 : "mixte" -> "mixed")
 *   2. CabinetInterface.modeFacturation.principal : "forfait" -> "mixte" (cohérence)
 *   3. User.hourlyRate = 350 sur Me Derisier (taux par défaut, modifiable
 *      ensuite dossier par dossier via Dossier.tauxHoraire et par entrée de temps).
 *
 * Tout le reste de la config (taxes hst 13%, fideicommis, fintrac, pipeda,
 * onglets, checklists, disciplines, forfaits, débours) est PRÉSERVÉ.
 *
 * Dry-run par défaut :
 *   node scripts/configure-derisier-facturation-mixte-2026-05.mjs
 * Application :
 *   APPLY_DERISIER_CONFIG=YES node scripts/configure-derisier-facturation-mixte-2026-05.mjs --apply
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CABINET_ID = "derisier-law-on-2026";
const AVOCATE_USER_ID = "derisier-user-avocate";
const DEFAULT_HOURLY_RATE = 350; // CAD/h, avant taxes — modifiable manuellement

const APPLY = process.argv.includes("--apply") && process.env.APPLY_DERISIER_CONFIG === "YES";

function setPrincipalMixte(rawJson) {
  let obj = {};
  try {
    obj = rawJson ? JSON.parse(rawJson) : {};
  } catch {
    obj = {};
  }
  return obj;
}

async function main() {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: CABINET_ID },
    select: { nom: true },
  });
  if (!cabinet) throw new Error(`Cabinet ${CABINET_ID} introuvable`);

  const iface = await prisma.cabinetInterface.findUnique({
    where: { cabinetId: CABINET_ID },
    select: { modules: true, modeFacturation: true },
  });
  if (!iface) throw new Error(`CabinetInterface ${CABINET_ID} introuvable`);

  const avocate = await prisma.user.findUnique({
    where: { id: AVOCATE_USER_ID },
    select: { nom: true, defaultHourlyRate: true },
  });
  if (!avocate) throw new Error(`User ${AVOCATE_USER_ID} introuvable`);

  console.log(`Cabinet ciblé: ${cabinet.nom} (${CABINET_ID})`);
  console.log(`Mode: ${APPLY ? "APPLICATION" : "simulation seulement"}\n`);

  // 1) modules.facturation.principal
  const modules = setPrincipalMixte(iface.modules);
  const beforeModules = modules?.facturation?.principal ?? "(aucun)";
  modules.facturation = { ...(modules.facturation || {}), principal: "mixte" };

  // 2) modeFacturation.principal
  const modeFact = setPrincipalMixte(iface.modeFacturation);
  const beforeModeFact = modeFact?.principal ?? "(aucun)";
  modeFact.principal = "mixte";

  // 3) taux horaire par défaut
  const beforeRate = avocate.defaultHourlyRate ?? "(aucun)";

  console.log("Changements prévus :");
  console.log(`  modules.facturation.principal : ${beforeModules} -> mixte`);
  console.log(`  modeFacturation.principal     : ${beforeModeFact} -> mixte`);
  console.log(`  ${avocate.nom} — taux horaire : ${beforeRate} -> ${DEFAULT_HOURLY_RATE} $/h`);
  console.log("\nPréservé : taxes (hst 13%), fideicommis, fintrac, pipeda, onglets, checklists, disciplines, forfaits, débours.");

  if (!APPLY) {
    console.log("\nSimulation terminée. Pour appliquer :");
    console.log("  APPLY_DERISIER_CONFIG=YES node scripts/configure-derisier-facturation-mixte-2026-05.mjs --apply");
    return;
  }

  // ---- APPLICATION ----
  await prisma.cabinetInterface.update({
    where: { cabinetId: CABINET_ID },
    data: {
      modules: JSON.stringify(modules),
      modeFacturation: JSON.stringify(modeFact),
    },
  });
  console.log("\n✓ CabinetInterface : facturation mixte activée.");

  await prisma.user.update({
    where: { id: AVOCATE_USER_ID },
    data: { defaultHourlyRate: DEFAULT_HOURLY_RATE },
  });
  console.log(`✓ ${avocate.nom} : taux horaire par défaut = ${DEFAULT_HOURLY_RATE} $/h.`);

  // ---- VÉRIFICATION ----
  const checkIface = await prisma.cabinetInterface.findUnique({
    where: { cabinetId: CABINET_ID },
    select: { modules: true },
  });
  const checkUser = await prisma.user.findUnique({
    where: { id: AVOCATE_USER_ID },
    select: { defaultHourlyRate: true },
  });
  console.log("\n=== Vérification ===");
  console.log(`principal en base : ${JSON.parse(checkIface.modules)?.facturation?.principal}`);
  console.log(`taux horaire en base : ${checkUser.defaultHourlyRate} $/h`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
