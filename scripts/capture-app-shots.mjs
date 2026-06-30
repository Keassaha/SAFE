/**
 * Capture des écrans réels de l'app SAFE pour la vitrine.
 * Prérequis : serveur dev sur http://localhost:3011 pointé sur la base démo locale.
 *
 *   DATABASE_URL=... node scripts/capture-app-shots.mjs
 */
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3011";
const OUT = path.join(process.cwd(), "public", "images", "app");
const CABINET = "Cabinet Démo SAFE";
const EMAIL = "camille.demo@safecabinet.ca";
const PASSWORD = "DemoSafe-2026!";

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // Récupère un id de facture émise pour la page détail.
  const prisma = new PrismaClient();
  const invoice = await prisma.invoice.findFirst({
    where: { cabinet: { nom: CABINET } },
    orderBy: { totalInvoiceAmount: "desc" },
    select: { id: true, numero: true },
  });
  await prisma.$disconnect();
  console.log("Facture pour détail :", invoice?.numero, invoice?.id);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  // --- Connexion ---
  await page.goto(`${BASE}/connexion`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.fill("#cabinetName", CABINET);
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/tableau-de-bord", { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  console.log("Connecté, URL :", page.url());

  const shots = [
    { name: "dashboard", url: `${BASE}/tableau-de-bord` },
    { name: "facturation", url: `${BASE}/facturation` },
    { name: "comptabilite", url: `${BASE}/comptabilite` },
    { name: "fideicommis", url: `${BASE}/comptes` },
  ];
  if (invoice?.id) shots.push({ name: "facture", url: `${BASE}/facturation/factures/${invoice.id}` });

  for (const s of shots) {
    try {
      await page.goto(s.url, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(2000); // laisse les graphiques/animations se poser
      // Retire le bandeau d'alerte (en anglais, hors sujet pour la vitrine)
      await page.evaluate(() => {
        const link = document.querySelector('a[href="/comptes/rapprochement"]');
        const banner = link && link.closest("div.bg-red-50");
        if (banner) banner.remove();
        // Retire l'indicateur dev Next.js (badge « N »)
        document.querySelectorAll("nextjs-portal").forEach((e) => e.remove());
        // Retire les alertes de conformité en anglais (chaînes non traduites)
        document.querySelectorAll("p, div").forEach((el) => {
          const t = el.textContent || "";
          if (t.length < 220 && /Trust reconciliation overdue|never reconciled|By-Law 9 requires|requires monthly 3-way/.test(t)) {
            const card = el.closest('div[class*="border"]') || el.parentElement;
            if (card) card.remove();
          }
        });
      });
      await page.waitForTimeout(300);
      const file = path.join(OUT, `${s.name}.png`);
      await page.screenshot({ path: file });
      const kb = Math.round(fs.statSync(file).size / 1024);
      console.log(`✅ ${s.name} → ${file} (${kb} Ko) [${page.url()}]`);
    } catch (e) {
      console.error(`❌ ${s.name} : ${e.message}`);
    }
  }

  await browser.close();
  console.log("Terminé.");
}

main().catch((e) => { console.error(e); process.exit(1); });
