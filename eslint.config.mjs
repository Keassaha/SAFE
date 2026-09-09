import { dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * Garde-fou design : SAFE_PREMIUM_DESIGN_STANDARD §3.1, règles PS-001, PS-002, PS-005.
 *
 * La règle refuse les valeurs brutes dans les fichiers d'interface :
 *   - hexadécimales écrites en dur,
 *   - familles de couleur Tailwind génériques, hors jetons SAFE,
 *   - ombres portées Tailwind, qui ne doivent exister que sur ce qui flotte.
 *
 * `.eslint-design-baseline.json` liste les fichiers déjà en écart au 30 juillet 2026.
 * Ils sont exemptés le temps de la reprise, ce qui rend la règle applicable tout de
 * suite sur les fichiers neufs et sur les 280 fichiers déjà conformes, sans bloquer
 * le dépôt. Régénérer avec `npm run design:baseline` après chaque lot : la liste
 * doit uniquement rétrécir.
 */
const designBaseline = JSON.parse(
  readFileSync(new URL("./.eslint-design-baseline.json", import.meta.url), "utf8"),
);

const FORBIDDEN_FAMILIES =
  "emerald|green|teal|slate|gray|zinc|neutral|stone|blue|indigo|violet|purple|pink|orange|cyan|sky|lime";

const HEX = String.raw`#[0-9A-Fa-f]{6}`;
const TW_COLOR = `(?:bg|text|border|ring|from|to|via|fill|stroke|divide)-(?:${FORBIDDEN_FAMILIES})-[0-9]{2,3}`;
const TW_SHADOW = "shadow-(?:sm|md|lg|xl|2xl)";

/* PS-025, versant lint : le seul piège que le texte d'une classe permet de
   reconnaître sans ambiguïté.
   
   `h-11` valait 41,25 px et non 44, parce que la racine du produit est à 15 px
   et qu'une hauteur en rem suit la typographie. Personne n'a jamais écrit
   `h-11` en visant 41 px : le chiffre voulait dire 44. C'est donc toujours une
   erreur, et elle se corrige par `h-tap`, `min-h-tap` ou `h-rang`.
   
   `h-8`, `h-9`, `h-10` restent permis : ce sont des tailles légitimes pour une
   barre de squelette, une pastille d'icône, un jeton décoratif, c'est-à-dire
   pour tout ce qui ne se clique pas. Les distinguer d'un contrôle demande de
   connaître la balise, ce qu'une expression sur la classe ne peut pas faire.
   C'est `scripts/audit-cibles-tactiles.mjs` qui tient ce versant-là, parce
   qu'il lit l'élément. Voir lib/ds/tokens.ts et §2.7. */
const TW_HAUTEUR_REM = String.raw`\b(?:min-)?h-11\b`;

const messages = {
  hex: "PS-001 : hexadécimale en dur. Passez par un jeton, var(--si-*) ou une classe adossée aux jetons. Voir docs/design/SAFE_PREMIUM_DESIGN_STANDARD.md §2.1.",
  color:
    "PS-002 : famille de couleur Tailwind générique. La palette SAFE se limite au neutre, à l'accent forêt et aux trois statuts. Voir §2.1.",
  shadow:
    "PS-005 : ombre portée. Seul ce qui flotte réellement, menu, modale, palette, info-bulle, porte une ombre. Le reste se sépare par un filet. Voir §2.5.",
  hauteur:
    "PS-025 : `h-11` fait 41,25 px sur une racine à 15 px, et non 44. Employez le jeton de densité : `h-tap`, `min-h-tap` ou `h-rang`. Voir §2.7 et lib/ds/tokens.ts.",
};

const designGuard = {
  name: "safe/design-tokens",
  files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
  ignores: [
    ...designBaseline,
    // Hors périmètre intérieur : surfaces publiques, imprimées et de marque.
    "components/landing/**",
    "components/marketing/**",
    "components/public-site/**",
    "components/pdf/**",
    "components/audit-report/**",
    "components/brand/**",
    "components/branding/**",
    // Page de contrôle de la marque : elle doit citer les encres littérales
    // pour prouver qu'elles tiennent. Voir docs/brand/IDENTITE_SAFE.md §4.
    "app/marque/**",
    "**/*.test.{ts,tsx}",
    "**/__tests__/**",
  ],
  rules: {
    "no-restricted-syntax": [
      "error",
      { selector: `Literal[value=/${HEX}/]`, message: messages.hex },
      { selector: `TemplateElement[value.raw=/${HEX}/]`, message: messages.hex },
      { selector: `Literal[value=/${TW_COLOR}/]`, message: messages.color },
      { selector: `TemplateElement[value.raw=/${TW_COLOR}/]`, message: messages.color },
      { selector: `Literal[value=/${TW_SHADOW}/]`, message: messages.shadow },
      { selector: `TemplateElement[value.raw=/${TW_SHADOW}/]`, message: messages.shadow },
      { selector: `Literal[value=/${TW_HAUTEUR_REM}/]`, message: messages.hauteur },
      { selector: `TemplateElement[value.raw=/${TW_HAUTEUR_REM}/]`, message: messages.hauteur },
    ],
  },
};

const eslintConfig = [...compat.extends("next/core-web-vitals"), designGuard];

export default eslintConfig;
