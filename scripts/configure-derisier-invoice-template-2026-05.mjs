/**
 * LOT 3C — Modèle de facture « Derisier Law » (échantillon fourni par le cabinet, 2026-05).
 *
 * Écrit `Cabinet.config.invoice` (JSON) :
 *   - `template: "derisier"` → la facture (aperçu + PDF) utilise la variante
 *     `lib/invoice-template/DerisierInvoiceDocument.tsx` qui imite l'échantillon.
 *   - `notice.fr` / `notice.en` → bloc N.B. (mentions + instructions fiducie).
 *     La première ligne est mise en évidence (assujetti à la TVH).
 *
 * Source d'autorité : échantillons « INVOICE TEMPLATE FRANÇAIS.pdf » +
 * « Invoice Template 2024.pdf » (Derisier Law, Ottawa ON).
 *
 * Idempotent, additif (fusionne dans config sans écraser le reste).
 * AUCUN n° de Barreau / LSO (règle dure CEO 2026-05-12).
 *
 * Dry-run par défaut :
 *   node scripts/configure-derisier-invoice-template-2026-05.mjs
 * Application :
 *   APPLY_DERISIER_INVOICE=YES node scripts/configure-derisier-invoice-template-2026-05.mjs --apply
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CABINET_ID = "derisier-law-on-2026";

const INVOICE_CONFIG = {
  template: "derisier",
  notice: {
    fr: [
      "TOUS LES SERVICES SONT ASSUJETTIS À LA TVH",
      "Tous les paiements doivent être effectués par virement bancaire direct sur le compte en fiducie, par virement électronique sur le compte en fiducie ou par chèque déposé sur le compte en fiducie.",
      "Si le client paie 50 % au début, il doit émettre un chèque postdaté. Le chèque pour le solde doit être daté de 45 jours après le dépôt initial, le solde incluant la TPS complète.",
      "Tous les chèques doivent être libellés à l'ordre d'Alexandra Derisier en fiducie.",
    ],
    en: [
      "ALL SERVICES ARE SUBJECT TO HST",
      "All payments must be made through direct deposit into Trust account, e-transfer into Trust account or Cheque Deposited into Trust account.",
      "If paying 50% at outset, client must issue a post-dated cheque. A Cheque for the balance must be dated 45 days after the initial deposit, the balance including full GST.",
      "All cheques must be made out to Alexandra Derisier in Trust.",
    ],
  },
};

const APPLY = process.argv.includes("--apply") && process.env.APPLY_DERISIER_INVOICE === "YES";

async function main() {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: CABINET_ID },
    select: { nom: true, config: true },
  });
  if (!cabinet) throw new Error(`Cabinet ${CABINET_ID} introuvable`);

  console.log(`Cabinet ciblé: ${cabinet.nom} (${CABINET_ID})`);
  console.log(`Mode: ${APPLY ? "APPLICATION" : "simulation seulement"}\n`);

  let config = {};
  try {
    config = cabinet.config ? JSON.parse(cabinet.config) : {};
  } catch {
    config = {};
  }

  const had = Boolean(config.invoice);
  console.log(`config.invoice existant: ${had ? "oui (sera remplacé)" : "(aucun)"}`);
  console.log(`template: ${INVOICE_CONFIG.template}`);
  console.log(`Bloc N.B. FR: ${INVOICE_CONFIG.notice.fr.length} paragraphes`);
  console.log(`Bloc N.B. EN: ${INVOICE_CONFIG.notice.en.length} paragraphes`);
  console.log(`  1re ligne FR: « ${INVOICE_CONFIG.notice.fr[0]} »`);

  // Fusion additive : on ne touche qu'à `invoice`.
  config.invoice = INVOICE_CONFIG;

  if (!APPLY) {
    console.log("\nSimulation terminée. Pour appliquer:");
    console.log(
      "  APPLY_DERISIER_INVOICE=YES node scripts/configure-derisier-invoice-template-2026-05.mjs --apply",
    );
    return;
  }

  // ---- APPLICATION ----
  await prisma.cabinet.update({
    where: { id: CABINET_ID },
    data: { config: JSON.stringify(config) },
  });
  console.log("\n✓ config.invoice appliqué sur le cabinet.");

  // ---- VÉRIFICATION ----
  const updated = await prisma.cabinet.findUnique({
    where: { id: CABINET_ID },
    select: { config: true },
  });
  const inv = JSON.parse(updated.config).invoice;
  console.log("\n=== Vérification ===");
  console.log(`template en base: ${inv?.template}`);
  console.log(`notice.fr: ${inv?.notice?.fr?.length ?? 0} · notice.en: ${inv?.notice?.en?.length ?? 0}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
