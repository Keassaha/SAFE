/**
 * Étape 1 du processus d'extrait de vitrine : capturer l'écran RÉEL.
 *
 * Voir docs/design/PROCEDURE_EXTRAITS_VITRINE.md pour le processus complet.
 *
 * Ce script ne fabrique rien. Il ouvre l'application avec les données du
 * cabinet de Me Camille Roy et rapporte deux choses :
 *
 *   1. une image de référence (PNG 2x) de l'écran demandé,
 *   2. un relevé JSON de ce que l'écran DIT : ses titres, ses libellés, ses
 *      montants, ses onglets.
 *
 * Le relevé est la pièce importante. Une réplique se construit à partir de
 * lui, pas à partir de l'image : on ne recopie pas des chiffres lus à l'œil
 * sur une capture, on les prend là où l'application les a écrits. C'est ce qui
 * a déjà produit une erreur une fois, quand une chaîne de facturation de la
 * page d'accueil reliait des heures à une facture qui n'était pas la leur.
 *
 * ── Les identifiants ────────────────────────────────────────────────────────
 * Ils viennent de l'ENVIRONNEMENT, jamais du fichier. L'ancien script de
 * capture (scripts/capture-app-shots.mjs) porte un mot de passe en clair, et
 * ce mot de passe est dans l'historique git depuis le commit 15b17a3. On ne
 * refait pas ça.
 *
 *   SAFE_CAPTURE_CABINET="Cabinet Demo" \
 *   SAFE_CAPTURE_EMAIL="camille.demo@safecabinet.ca" \
 *   SAFE_CAPTURE_MOTDEPASSE="..." \
 *   node scripts/capturer-ecran-reel.mjs comptes
 *
 * Sans argument, il capture tous les écrans connus.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.SAFE_CAPTURE_BASE ?? "http://localhost:3040";
const SORTIE = path.join(process.cwd(), "docs", "design", "references-app");

/* Les écrans dont la vitrine parle. Le nom sert de nom de fichier et de clé
   dans le relevé : il doit rester stable, une réplique s'y réfère. */
const ECRANS = {
  "tableau-de-bord": { url: "/tableau-de-bord", titre: "Tableau de bord" },
  clients: { url: "/clients", titre: "Clients" },
  dossiers: { url: "/dossiers", titre: "Dossiers" },
  comptes: { url: "/comptes", titre: "Comptes en fidéicommis" },
  facturation: { url: "/facturation", titre: "Facturation" },
  comptabilite: { url: "/comptabilite", titre: "Comptabilité" },
  temps: { url: "/temps", titre: "Temps" },
};

function exigerEnv(nom) {
  const v = process.env[nom];
  if (!v) {
    console.error(
      `\n  Il manque ${nom}.\n\n  Les identifiants ne vivent pas dans ce fichier. Relancez ainsi :\n\n` +
        `    SAFE_CAPTURE_CABINET="Cabinet Demo" \\\n` +
        `    SAFE_CAPTURE_EMAIL="camille.demo@safecabinet.ca" \\\n` +
        `    SAFE_CAPTURE_MOTDEPASSE="votre mot de passe" \\\n` +
        `    node scripts/capturer-ecran-reel.mjs\n`,
    );
    process.exit(1);
  }
  return v;
}

/* Ce qu'on relève sur un écran. Volontairement descriptif et non structuré :
   le but n'est pas de reconstruire le modèle de données, c'est de savoir ce
   que l'écran MONTRE, pour qu'une réplique ne s'en écarte pas. */
const RELEVE = `(function () {
  function txt(e) { return (e.textContent || "").replace(/\\s+/g, " ").trim(); }
  function tous(sel) { return [].slice.call(document.querySelectorAll(sel)); }

  var montants = tous("*")
    .filter(function (e) {
      if (e.children.length) return false;
      return /^-?[\\d\\s\\u00a0]+[,.]\\d{2}\\s*\\$$/.test(txt(e));
    })
    .map(function (e) { return { valeur: txt(e), pres: txt(e.parentElement).slice(0, 90) }; });

  return {
    url: location.pathname,
    titre: txt(document.querySelector("h1")) || null,
    onglets: tous('[role="tab"], .onglets button, nav[aria-label] a').map(txt).filter(Boolean).slice(0, 14),
    entetesTableau: tous("th").map(txt).filter(Boolean).slice(0, 24),
    montants: montants.slice(0, 40),
    lignes: tous("tbody tr").slice(0, 12).map(function (tr) {
      return [].slice.call(tr.querySelectorAll("td")).map(txt);
    }),
    hauteur: document.body.scrollHeight,
  };
})()`;

async function main() {
  const cabinet = exigerEnv("SAFE_CAPTURE_CABINET");
  const email = exigerEnv("SAFE_CAPTURE_EMAIL");
  const motDePasse = exigerEnv("SAFE_CAPTURE_MOTDEPASSE");

  const demandes = process.argv.slice(2);
  const aFaire = demandes.length ? demandes : Object.keys(ECRANS);
  for (const nom of aFaire) {
    if (!ECRANS[nom]) {
      console.error(`Écran inconnu : ${nom}. Connus : ${Object.keys(ECRANS).join(", ")}`);
      process.exit(1);
    }
  }

  fs.mkdirSync(SORTIE, { recursive: true });

  const navigateur = await chromium.launch({ channel: "chrome" });
  const contexte = await navigateur.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await contexte.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(String(e).slice(0, 160)));

  await page.goto(`${BASE}/connexion`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.fill("#cabinetName", cabinet);
  await page.fill("#email", email);
  await page.fill("#password", motDePasse);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/tableau-de-bord", { timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(2500);

  if (page.url().includes("/connexion")) {
    console.error(
      `\n  La connexion a échoué, on est resté sur ${page.url()}.\n` +
        `  Vérifiez le nom exact du cabinet : la base locale contient « Cabinet Demo ».\n`,
    );
    await navigateur.close();
    process.exit(1);
  }
  console.log(`Connecté comme ${email}.`);

  const releves = {};
  for (const nom of aFaire) {
    const ecran = ECRANS[nom];
    await page.goto(`${BASE}${ecran.url}`, { waitUntil: "networkidle", timeout: 90000 });
    /* Les graphiques et les révélations au défilement ont besoin de se poser,
       sinon la référence montre un écran à moitié arrivé. */
    await page.waitForTimeout(2200);

    const releve = JSON.parse(JSON.stringify(await page.evaluate(RELEVE)));
    releve.ecran = nom;
    releve.attendu = ecran.titre;
    releves[nom] = releve;

    await page.screenshot({ path: path.join(SORTIE, `${nom}.png`), fullPage: true });
    console.log(
      `  ${nom.padEnd(18)} ${String(releve.hauteur).padStart(5)}px  ` +
        `${releve.montants.length} montants, ${releve.onglets.length} onglets`,
    );
  }

  fs.writeFileSync(
    path.join(SORTIE, "releve.json"),
    JSON.stringify({ capture: { base: BASE, cabinet }, ecrans: releves }, null, 2),
  );

  console.log(`\nRéférences écrites dans ${path.relative(process.cwd(), SORTIE)}/`);
  console.log(erreurs.length ? `Erreurs de page : ${erreurs.join(" | ")}` : "Aucune erreur de page.");
  await navigateur.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
