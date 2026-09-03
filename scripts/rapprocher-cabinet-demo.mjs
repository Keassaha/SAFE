/**
 * Exécute un VRAI rapprochement de fidéicommis dans le cabinet de démonstration,
 * par les écrans du produit et non par une écriture directe en base.
 *
 * Pourquoi passer par l'interface. `TrustReconciliation` n'est pas une simple
 * ligne : le service compare trois voies, en dérive un écart, et refuse la
 * certification tant qu'il n'est pas nul. Écrire la ligne à la main
 * contournerait ce contrôle et produirait un rapprochement qui n'a jamais eu
 * lieu. C'est exactement ce que le produit existe pour empêcher.
 *
 * Les trois voies, telles que lib/services/fideicommis/reconciliation-service.ts
 * les calcule :
 *
 *   1. la banque      soldeBancaire − chèques en circulation + dépôts en transit
 *   2. le registre    solde global du journal append-only
 *   3. les dossiers   somme des cartes-clients
 *
 *   écart              = voie 1 − voie 2
 *   écartCartesClients = voie 3 − voie 2
 *
 * Une seule de ces valeurs est saisie par l'humain : le solde bancaire. Les
 * deux autres sortent du registre. Le solde bancaire passé ici est donc la
 * seule donnée que l'opérateur affirme, et il doit correspondre à un relevé.
 *
 *   SAFE_RAPPRO_SOLDE=89275 \
 *   SAFE_RAPPRO_PERIODE=2026-07 \
 *   node scripts/rapprocher-cabinet-demo.mjs
 *
 * Sans --certifier, le script s'arrête après le calcul et rapporte l'écart.
 * La certification est un geste distinct, qui engage l'avocate.
 */
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const BASE = process.env.SAFE_RAPPRO_BASE ?? "http://localhost:3045";
const CABINET = process.env.SAFE_RAPPRO_CABINET ?? "Cabinet Demo";
const EMAIL = process.env.SAFE_RAPPRO_EMAIL ?? "camille.demo@safecabinet.ca";
const MOTDEPASSE = process.env.SAFE_RAPPRO_MOTDEPASSE ?? "DemoSafe-2026!";
const PERIODE = process.env.SAFE_RAPPRO_PERIODE ?? "2026-07";
const SOLDE = process.env.SAFE_RAPPRO_SOLDE ?? "89275";
const CERTIFIER = process.argv.includes("--certifier");
const SORTIE = path.join(process.cwd(), "docs", "design", "references-app");

const nav = await chromium.launch({ channel: "chrome" });
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const erreurs = [];
page.on("pageerror", (e) => erreurs.push(String(e).slice(0, 200)));

await page.goto(`${BASE}/connexion`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.fill("#cabinetName", CABINET);
await page.fill("#email", EMAIL);
await page.fill("#password", MOTDEPASSE);
await page.click('button[type="submit"]');
await page.waitForURL("**/tableau-de-bord", { timeout: 90000 }).catch(() => {});
if (page.url().includes("/connexion")) {
  console.error("\n  Connexion refusée. Vérifiez le nom exact du cabinet.\n");
  await nav.close();
  process.exit(1);
}
console.log(`Connecté comme ${EMAIL}.`);

await page.goto(`${BASE}/comptes/rapprochement`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);

/* Le formulaire porte une période et un solde bancaire. On les repère par leur
   type plutôt que par un identifiant, que le composant ne pose pas. */
const champs = await page.evaluate(() => {
  return [...document.querySelectorAll("input, select")].map((e, i) => ({
    i, tag: e.tagName, type: e.type, id: e.id, name: e.name,
    placeholder: e.placeholder,
    libelle: (e.closest("label")?.innerText
      || document.querySelector(`label[for="${e.id}"]`)?.innerText
      || e.getAttribute("aria-label") || "").trim().slice(0, 46),
    valeur: e.value,
  }));
});
console.log("\nChamps du formulaire :");
for (const c of champs) console.log(`  [${c.i}] ${c.type.padEnd(8)} ${c.libelle || c.placeholder || c.id}`);

const iPeriode = champs.find((c) => /p[ée]riode|month/i.test(c.libelle + c.placeholder + c.id + c.type))?.i;
const iSolde = champs.find((c) => c.type === "number")?.i;
if (iPeriode === undefined || iSolde === undefined) {
  console.error("\n  Champs introuvables, le formulaire a changé. Rien n'a été soumis.\n");
  await nav.close();
  process.exit(1);
}

const entrees = await page.$$("input, select");
await entrees[iPeriode].fill(PERIODE);
await entrees[iSolde].fill(String(SOLDE));
console.log(`\nSaisi : période ${PERIODE}, solde bancaire ${SOLDE} $.`);

await page.click('form button[type="submit"]');
await page.waitForTimeout(4000);

const resultat = await page.evaluate(() => {
  const bloc = document.querySelector('[aria-labelledby="reconciliation-result-title"]');
  return {
    url: location.href,
    resultat: bloc ? bloc.innerText.replace(/\n{2,}/g, "\n").slice(0, 1400) : "(aucun bloc de résultat)",
    peutCertifier: !!document.querySelector("button:not([disabled])") &&
      [...document.querySelectorAll("button")].some((b) => /certifier/i.test(b.innerText) && !b.disabled),
  };
});
console.log("\n── Ce que le produit répond ──\n" + resultat.resultat);
console.log("\nBouton de certification actif : " + (resultat.peutCertifier ? "oui" : "non"));

if (CERTIFIER && resultat.peutCertifier) {
  const b = [...(await page.$$("button"))];
  for (const btn of b) {
    if (/certifier/i.test((await btn.innerText()) || "") && (await btn.isEnabled())) {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(4000);
  const apres = await page.evaluate(() => {
    const bloc = document.querySelector('[aria-labelledby="reconciliation-result-title"]');
    return bloc ? bloc.innerText.replace(/\n{2,}/g, "\n").slice(0, 900) : "";
  });
  console.log("\n── Après certification ──\n" + apres);
}

fs.mkdirSync(SORTIE, { recursive: true });
await page.screenshot({ path: path.join(SORTIE, "rapprochement.png") });
console.log(`\nCapture écrite dans ${path.relative(process.cwd(), SORTIE)}/rapprochement.png`);
if (erreurs.length) console.log("\nErreurs de page :\n  " + erreurs.join("\n  "));

await nav.close();
