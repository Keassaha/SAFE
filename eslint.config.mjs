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

const messages = {
  hex: "PS-001 : hexadécimale en dur. Passez par un jeton, var(--si-*) ou une classe adossée aux jetons. Voir docs/design/SAFE_PREMIUM_DESIGN_STANDARD.md §2.1.",
  color:
    "PS-002 : famille de couleur Tailwind générique. La palette SAFE se limite au neutre, à l'accent forêt et aux trois statuts. Voir §2.1.",
  shadow:
    "PS-005 : ombre portée. Seul ce qui flotte réellement, menu, modale, palette, info-bulle, porte une ombre. Le reste se sépare par un filet. Voir §2.5.",
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
    ],
  },
};

const eslintConfig = [...compat.extends("next/core-web-vitals"), designGuard];

export default eslintConfig;
