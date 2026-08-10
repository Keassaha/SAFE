/**
 * Rend les fichiers image de la marque à partir de la source unique.
 *
 * Certaines surfaces ne savent pas lire du JSX : les données structurées
 * JSON-LD, les aperçus de réseaux sociaux, un jour un dossier de presse.
 * Elles ont besoin d'un PNG. Ce script le fabrique en LISANT les chemins
 * dans `components/brand/safe-mark.ts`, jamais en les recopiant : si la
 * marque change là-bas, il suffit de relancer.
 *
 *   npm run brand:assets
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const RACINE = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(RACINE, "components/brand/safe-mark.ts");

/** Extrait une constante de chemin SVG de la source de la marque. */
function lireChemin(texte, nom) {
  const bloc = new RegExp(`export const ${nom} =([\\s\\S]*?);\\n`).exec(texte);
  if (!bloc) throw new Error(`Constante ${nom} introuvable dans ${SOURCE}`);
  const morceaux = [...bloc[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  if (!morceaux.length) throw new Error(`Constante ${nom} sans littéral de chemin`);
  return morceaux.join("");
}

const source = await readFile(SOURCE, "utf8");
const pieceA = lireChemin(source, "ASSEMBLY_PIECE_A_PATH");
const pieceB = lireChemin(source, "ASSEMBLY_PIECE_B_PATH");

const FOREST = "#1F3A2E";
const EMERAUDE = "#2E7D5B";
const CASSE = "#FAFAF8";

/**
 * Le joint est évidé dans le produit. Sur un PNG destiné à des surfaces qu'on
 * ne contrôle pas (fil LinkedIn, encart Google), on le pose en blanc cassé
 * plutôt que de laisser passer un fond inconnu.
 */
function marque({ cote, marge = 0, fond = CASSE }) {
  const utile = cote - marge * 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cote}" height="${cote}" viewBox="0 0 ${cote} ${cote}">` +
      `<rect width="${cote}" height="${cote}" fill="${fond}"/>` +
      `<g transform="translate(${marge} ${marge}) scale(${utile / 24})">` +
      `<path d="${pieceA}" fill="${FOREST}"/>` +
      `<path d="${pieceB}" fill="${EMERAUDE}"/>` +
      `</g></svg>`,
  );
}

const sorties = [
  { fichier: "public/safe-logo.png", cote: 512, marge: 56 },
  { fichier: "public/safe-logo-512.png", cote: 512, marge: 0 },
  { fichier: "public/apple-touch-icon.png", cote: 180, marge: 0, fond: CASSE },
];

for (const { fichier, cote, marge, fond } of sorties) {
  const cible = path.join(RACINE, fichier);
  await sharp(marque({ cote, marge, fond })).png().toFile(cible);
  console.log(`écrit ${fichier} (${cote}×${cote})`);
}
