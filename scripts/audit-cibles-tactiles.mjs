#!/usr/bin/env node
/**
 * SAFE — Audit des cibles tactiles (PS-025, référentiel §2.7).
 *
 * Cherche les éléments RÉELLEMENT cliquables dont la hauteur écrite tombe
 * sous 44 px, et seulement ceux-là.
 *
 * Pourquoi statique et non au navigateur : la quasi-totalité des écrans du
 * produit est derrière une session. Un audit qui n'inspecte que les pages
 * publiques prétendrait couvrir le produit en en voyant un dixième.
 *
 * Ce que l'audit ne prétend pas faire : il lit la hauteur ANNONCÉE dans la
 * classe. Un contrôle dont la hauteur vient d'un parent, d'une grille ou
 * d'une classe composée lui échappe. Il attrape le cas dominant, celui du
 * bouton écrit à la main avec `px-3 py-1.5`.
 *
 * Usage : node scripts/audit-cibles-tactiles.mjs [--json]
 */

import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const RACINE_PX = 15; // app/globals.css : html { font-size: 15px }
const SEUIL = 44;

/* Une pastille de statut, une puce, une étiquette ne sont pas des cibles.
   On ne regarde que ce qui se clique ou se saisit. */
const INTERACTIF = /^(button|a|input|textarea|select|summary|Link|Button|NavLink)$/;

const NOMBRE = /^-?\d+(\.\d+)?$/;

/** Hauteur en px d'une valeur d'échelle Tailwind (1 = 0,25 rem). */
const echelle = (v) => (NOMBRE.test(v) ? Number(v) * 0.25 * RACINE_PX : null);

function hauteurAnnoncee(cls) {
  // Jetons de densité : conformes par construction.
  if (/\b(min-)?h-(tap|rang|rang-tactile)\b/.test(cls)) return SEUIL;
  if (/\bh-(full|screen|auto)\b/.test(cls)) return SEUIL; // portée par le parent

  const explicite = cls.match(/\b(?:min-)?h-\[(\d+(?:\.\d+)?)px\]/);
  if (explicite) return Number(explicite[1]);

  const hRem = cls.match(/\b(?:min-)?h-(\d+(?:\.\d+)?)\b/);
  if (hRem) return echelle(hRem[1]);

  // Sinon la hauteur vient du rembourrage vertical plus la ligne de texte.
  const py = cls.match(/\bpy-(\d+(?:\.\d+)?)\b/);
  const pt = cls.match(/\bpt-(\d+(?:\.\d+)?)\b/);
  const pb = cls.match(/\bpb-(\d+(?:\.\d+)?)\b/);
  if (!py && !pt && !pb) {
    /* Aucune hauteur annoncée. Deux cas très différents.
     *
     * Si l'élément établit sa propre boîte (`flex`, `inline-flex`), sa hauteur
     * est celle de son contenu : une ligne de texte, donc environ 20 px. Il est
     * sous le seuil, et c'est vérifiable. C'est le cas du lien du logo, que la
     * mesure au navigateur a trouvé à 20 px alors que l'audit se taisait.
     *
     * Sinon la hauteur vient d'un parent, d'une cellule ou d'une grille, et
     * l'affirmer depuis le source serait deviner. On se tait. */
    const boitePropre = /\b(inline-flex|flex)\b/.test(cls);
    const etiree = /\b(h-full|self-stretch|items-stretch|absolute|inset-0)\b/.test(cls);
    return boitePropre && !etiree ? 20 : null;
  }

  const haut = py ? echelle(py[1]) : pt ? echelle(pt[1]) : 0;
  const bas = py ? echelle(py[1]) : pb ? echelle(pb[1]) : 0;

  // Hauteur de ligne, au plus favorable pour éviter les faux positifs.
  let ligne = 1.5 * RACINE_PX;
  if (/\btext-xs\b/.test(cls)) ligne = 16;
  else if (/\btext-\[11px\]\b/.test(cls)) ligne = 16;
  else if (/\btext-sm\b/.test(cls)) ligne = 20;
  else if (/\btext-base\b/.test(cls)) ligne = 24;

  return haut + bas + ligne;
}

const fichiers = execSync(
  "grep -rl --include=*.tsx -E '<(button|a|input|textarea|select|summary|Link|Button)\\b' app components",
  { encoding: "utf8" },
).trim().split("\n");

const IGNORE = [
  /^components\/(landing|marketing|public-site|pdf|audit-report|brand|branding)\//,
  /^app\/ds-preview\//,
  /^app\/marque\//,
  /\.test\.tsx$/,
];

/* Base de référence.
 *
 * Quarante-quatre liens « icône plus texte » posés DANS des lignes denses
 * (cellule de registre, en-tête de carte). Les porter à 44 px de haut ne se
 * fait pas par une hauteur : cela dilaterait la ligne qui les contient. Il
 * faut leur donner une zone de clic sans changer leur empreinte, au cas par
 * cas, en regardant l'écran.
 *
 * Même règle que `.eslint-design-baseline.json` : la liste ne fait que
 * rétrécir. Régénérer sciemment, jamais pour faire taire l'audit. */
const BASELINE = new Set(
  existsSync(new URL("../.audit-cibles-baseline.json", import.meta.url))
    ? JSON.parse(readFileSync(new URL("../.audit-cibles-baseline.json", import.meta.url), "utf8"))
    : [],
);

const trouvailles = [];

for (const f of fichiers) {
  if (IGNORE.some((r) => r.test(f))) continue;
  const src = readFileSync(f, "utf8");
  const lignes = src.split("\n");

  /* On part de chaque `className`, pas de la balise.
   *
   * Lire la balise d'abord semblait naturel, et c'était le piège : une
   * expression `[^>]*?` s'arrête sur le premier `>` rencontré, donc sur la
   * flèche d'un `onClick={() => …}`. Tout bouton portant une fonction en ligne
   * AVANT sa classe devenait invisible pour l'audit, et l'audit annonçait zéro.
   * On remonte donc au nom de balise depuis la classe. */
  const reCls = /className=(?:"([^"]*)"|\{`([^`]*)`\})/g;
  let m;
  while ((m = reCls.exec(src)) !== null) {
    const cls = m[1] ?? m[2];
    if (!cls) continue;

    // Nom de la balise ouvrante la plus proche en amont.
    const amont = src.slice(0, m.index);
    const ouvrante = amont.lastIndexOf("<");
    if (ouvrante === -1) continue;
    const nom = (src.slice(ouvrante + 1).match(/^([A-Za-z][\w.]*)/) || [])[1];
    if (!nom || !INTERACTIF.test(nom)) continue;

    // La balise doit encore être ouverte : pas de `>` entre elle et la classe.
    if (/>/.test(src.slice(ouvrante, m.index).replace(/=>/g, ""))) continue;

    if (nom === "Button" && !/\b(min-)?h-/.test(cls) && !/\bpy-/.test(cls)) continue;

    const h = hauteurAnnoncee(cls);
    if (h === null || h >= SEUIL) continue;

    /* Un lien en pleine phrase n'est pas une cible tactile : WCAG 2.5.8
       l'exempte nommément, et lui donner 44 px de haut casserait le flux du
       texte. On le reconnaît à l'absence de toute mise en boîte. */
    const enBoite = /\b(inline-flex|flex|inline-block|block|grid|rounded|border|bg-|w-full)/.test(cls);
    if (!enBoite && /^(a|Link)$/.test(nom)) continue;

    const ligne = src.slice(0, m.index).split("\n").length;
    if (BASELINE.has(`${f}:${ligne}`)) continue;
    trouvailles.push({
      fichier: f,
      ligne,
      element: nom,
      hauteur: Math.round(h * 100) / 100,
      classe: cls,
      extrait: lignes[ligne - 1].trim().slice(0, 90),
    });
  }
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(trouvailles, null, 2));
} else {
  const parFichier = new Map();
  for (const t of trouvailles) {
    if (!parFichier.has(t.fichier)) parFichier.set(t.fichier, []);
    parFichier.get(t.fichier).push(t);
  }
  for (const [f, ts] of [...parFichier].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n${f}  (${ts.length})`);
    for (const t of ts) console.log(`  ${t.ligne}: <${t.element}> ~${t.hauteur}px`);
  }
  console.log(`\n${trouvailles.length} cibles sous ${SEUIL}px, dans ${parFichier.size} fichiers.`);
}

process.exit(trouvailles.length > 0 ? 1 : 0);
