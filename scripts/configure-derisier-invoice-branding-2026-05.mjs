/**
 * LOT 3D — Image de marque de la facture « Derisier Law » (2026-05).
 *
 * Deux ajouts à la facture du cabinet `derisier-law-on-2026` :
 *
 *  1) LOGO (haut à gauche) — `Cabinet.logoUrl` reçoit le logo encodé en
 *     data-URI base64 (`data:image/png;base64,...`). Avantage : aucun
 *     hébergement externe requis ; l'image fonctionne à l'identique dans
 *     l'aperçu navigateur (`pdf().toBlob()`) ET le PDF serveur (`renderToBuffer`).
 *     Source : `scripts/assets/derisier-logo.png` (emblème + mot-symbole
 *     « DERISIER LAW OFFICE », extrait des échantillons fournis).
 *
 *  2) SIGNATURE reproduite — `Cabinet.config.invoice.signature` :
 *       { name, title:{fr,en} }
 *     Aucun fac-similé manuscrit n'existe dans les fichiers fournis : la
 *     « signature » des mandats est le nom dactylographié sur la ligne de
 *     signature (« Marjorie-Alexandra Derisier »). On le reproduit donc en
 *     police italique (rendu PDF) lorsqu'une facture coche l'option
 *     « Ajouter ma signature ». JAMAIS de n° de Barreau / LSO (règle CEO).
 *
 * Idempotent, additif (fusionne dans config sans écraser le reste).
 *
 * Dry-run par défaut :
 *   node scripts/configure-derisier-invoice-branding-2026-05.mjs
 * Application :
 *   APPLY_DERISIER_BRANDING=YES node scripts/configure-derisier-invoice-branding-2026-05.mjs --apply
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const prisma = new PrismaClient();
const CABINET_ID = "derisier-law-on-2026";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = join(__dirname, "assets", "derisier-logo.png");

const SIGNATURE = {
  name: "Marjorie-Alexandra Derisier",
  title: { fr: "Avocate", en: "Lawyer" },
};

const APPLY =
  process.argv.includes("--apply") && process.env.APPLY_DERISIER_BRANDING === "YES";

function buildLogoDataUri() {
  const bytes = readFileSync(LOGO_PATH);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

async function main() {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: CABINET_ID },
    select: { nom: true, config: true, logoUrl: true },
  });
  if (!cabinet) throw new Error(`Cabinet ${CABINET_ID} introuvable`);

  console.log(`Cabinet ciblé: ${cabinet.nom} (${CABINET_ID})`);
  console.log(`Mode: ${APPLY ? "APPLICATION" : "simulation seulement"}\n`);

  const logoDataUri = buildLogoDataUri();
  const logoKb = (logoDataUri.length / 1024).toFixed(1);
  console.log(`Logo: ${LOGO_PATH}`);
  console.log(`  → data-URI ${logoKb} Ko (${logoDataUri.slice(0, 32)}…)`);
  console.log(`  logoUrl existant: ${cabinet.logoUrl ? "oui (sera remplacé)" : "(aucun)"}`);

  let config = {};
  try {
    config = cabinet.config ? JSON.parse(cabinet.config) : {};
  } catch {
    config = {};
  }
  config.invoice = config.invoice ?? {};
  const hadSig = Boolean(config.invoice.signature);
  config.invoice.signature = SIGNATURE;

  console.log(`\nSignature: ${hadSig ? "existante (remplacée)" : "(ajoutée)"}`);
  console.log(`  name : « ${SIGNATURE.name} »`);
  console.log(`  title: fr=« ${SIGNATURE.title.fr} » · en=« ${SIGNATURE.title.en} »`);

  if (!APPLY) {
    console.log("\nSimulation terminée. Pour appliquer:");
    console.log(
      "  APPLY_DERISIER_BRANDING=YES node scripts/configure-derisier-invoice-branding-2026-05.mjs --apply",
    );
    return;
  }

  // ---- APPLICATION ----
  await prisma.cabinet.update({
    where: { id: CABINET_ID },
    data: { logoUrl: logoDataUri, config: JSON.stringify(config) },
  });
  console.log("\n✓ logoUrl + config.invoice.signature appliqués.");

  // ---- VÉRIFICATION ----
  const updated = await prisma.cabinet.findUnique({
    where: { id: CABINET_ID },
    select: { config: true, logoUrl: true },
  });
  const sig = JSON.parse(updated.config).invoice?.signature;
  console.log("\n=== Vérification ===");
  console.log(`logoUrl en base: ${updated.logoUrl ? `${(updated.logoUrl.length / 1024).toFixed(1)} Ko` : "(vide)"}`);
  console.log(`signature.name en base: ${sig?.name ?? "(vide)"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
