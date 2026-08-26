/**
 * Étape 4 du processus d'extrait de vitrine : vérifier la réplique.
 *
 * Voir docs/design/PROCEDURE_EXTRAITS_VITRINE.md.
 *
 * Une réplique est conforme quand elle tient les cinq critères de la landing.
 * Ce script les mesure sur la page rendue, il ne les juge pas à l'œil :
 *
 *   1. LE CADRE      une fenêtre à bord marqué, sur un parent qui porte l'ombre
 *                    longue. Le masque de fondu rogne les ombres, donc l'ombre
 *                    ne peut pas vivre sur l'élément masqué.
 *   2. LE FONDU      un masque en dégradé sur la fenêtre.
 *   3. UNE SEULE PAGE la barre d'application est figée et retirée aux lecteurs
 *                    d'écran : l'extrait ne parle que de l'écran présenté.
 *   4. LA NAVIGATION des onglets qui changent de vue, dans le cadre.
 *   5. LE ZOOM       toute surface sélectionnable se soulève. Zéro aplat gris.
 *
 * Et un sixième, qui n'est pas de la mise en forme mais de l'honnêteté :
 *
 *   6. LES CHIFFRES  chaque montant de la réplique doit exister dans le relevé
 *                    de l'écran réel. Un chiffre qui n'y est pas est un chiffre
 *                    inventé.
 *
 *   node scripts/verifier-extrait-vitrine.mjs [url]
 *
 * Sans argument : http://localhost:3040/
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const URL = process.argv[2] ?? "http://localhost:3040/";
const RELEVE = path.join(process.cwd(), "docs", "design", "references-app", "releve.json");

const SONDE = `(function () {
  function tous(sel) { return [].slice.call(document.querySelectorAll(sel)); }
  var extraits = tous(".extrait-nav, .fenetre-fondante");

  var apalts = tous("*").filter(function (e) {
    if (!e.className || typeof e.className !== "string") return false;
    return /hover:bg-(si-ink|black|gray|slate|neutral)/.test(e.className);
  }).length;

  return {
    extraits: extraits.length,
    ombreSurParent: tous(".fenetre-fondante").filter(function (e) {
      return getComputedStyle(e).filter.indexOf("drop-shadow") !== -1;
    }).length,
    fenetres: tous(".fenetre-produit").length,
    fondus: tous(".fenetre-produit").filter(function (e) {
      var c = getComputedStyle(e);
      return (c.maskImage || c.webkitMaskImage || "none").indexOf("gradient") !== -1;
    }).length,
    barresFigees: tous(".barre-app").filter(function (e) {
      return e.getAttribute("aria-hidden") === "true";
    }).length,
    barres: tous(".barre-app").length,
    onglets: tous("[data-fiche-onglet]").length,
    vues: tous("[data-fiche-vue]").length,
    aplatsDeSurvol: apalts,
    montants: tous("*").filter(function (e) {
      return !e.children.length && /^-?[\\d\\s\\u00a0]+[,.]\\d{2}\\s*\\$$/.test((e.textContent || "").trim());
    }).map(function (e) { return (e.textContent || "").trim(); }),
  };
})()`;

function normaliser(m) {
  return m.replace(/[\s ]/g, "").replace(/\$$/, "");
}

async function main() {
  const navigateur = await chromium.launch({ channel: "chrome" });
  const page = await navigateur.newPage({ viewport: { width: 1440, height: 1000 } });
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(String(e).slice(0, 120)));

  await page.goto(URL, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(2500);
  /* Les extraits ne paraissent qu'au défilement : sans ce parcours, la sonde
     trouve une page vide et déclare tout conforme. */
  const H = await page.evaluate("document.body.scrollHeight");
  for (let y = 0; y <= H; y += 450) {
    await page.evaluate(`window.scrollTo(0, ${y})`);
    await page.waitForTimeout(35);
  }

  const r = await page.evaluate(SONDE);
  await navigateur.close();

  const verdicts = [];
  const dire = (ok, nom, detail) => verdicts.push({ ok, nom, detail });

  dire(r.fenetres > 0, "1 · le cadre", `${r.fenetres} fenêtre(s) produit`);
  dire(
    r.ombreSurParent === r.fenetres,
    "1 · l'ombre est sur le parent",
    `${r.ombreSurParent}/${r.fenetres} — le masque rogne l'ombre portée sur l'élément masqué`,
  );
  dire(r.fondus === r.fenetres, "2 · le fondu", `${r.fondus}/${r.fenetres} fenêtres masquées`);
  dire(
    r.barres > 0 && r.barresFigees === r.barres,
    "3 · une seule page",
    `${r.barresFigees}/${r.barres} barres d'application figées et aria-hidden`,
  );
  dire(
    r.onglets > 0 && r.vues >= r.onglets,
    "4 · la navigation",
    `${r.onglets} onglets pour ${r.vues} vues`,
  );
  dire(r.aplatsDeSurvol === 0, "5 · le zoom", `${r.aplatsDeSurvol} aplat(s) gris de survol`);

  if (fs.existsSync(RELEVE)) {
    const releve = JSON.parse(fs.readFileSync(RELEVE, "utf8"));
    const vrais = new Set();
    for (const e of Object.values(releve.ecrans ?? {})) {
      for (const m of e.montants ?? []) vrais.add(normaliser(m.valeur));
    }
    const inventes = r.montants.filter((m) => !vrais.has(normaliser(m)));
    dire(
      inventes.length === 0,
      "6 · les chiffres",
      inventes.length
        ? `absents du relevé : ${[...new Set(inventes)].slice(0, 8).join(", ")}`
        : `${r.montants.length} montants, tous présents dans l'écran réel`,
    );
  } else {
    dire(false, "6 · les chiffres", `pas de relevé. Lancez d'abord capturer-ecran-reel.mjs`);
  }

  console.log(`\n  ${URL}\n`);
  for (const v of verdicts) {
    console.log(`  ${v.ok ? "ok  " : "NON "} ${v.nom.padEnd(30)} ${v.detail}`);
  }
  console.log(erreurs.length ? `\n  Erreurs de page : ${erreurs.join(" | ")}` : "\n  Aucune erreur de page.");

  const echecs = verdicts.filter((v) => !v.ok).length;
  console.log(echecs ? `\n  ${echecs} critère(s) non tenu(s).\n` : "\n  Les six critères sont tenus.\n");
  process.exit(echecs ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
