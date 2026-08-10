#!/usr/bin/env node
/**
 * Régénère `.eslint-design-baseline.json`, la liste des fichiers d'interface
 * déjà en écart, exemptés du garde-fou ESLint le temps de la reprise.
 *
 * Voir eslint.config.mjs et docs/design/SAFE_PREMIUM_DESIGN_STANDARD.md §7.2.
 *
 * À relancer après chaque lot de correction. La liste doit uniquement rétrécir :
 * le script refuse de l'agrandir, sauf avec --force.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, ".eslint-design-baseline.json");
const FORCE = process.argv.includes("--force");

const PATTERNS = [
  /#[0-9A-Fa-f]{6}\b/,
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide)-(?:emerald|green|teal|slate|gray|zinc|neutral|stone|blue|indigo|violet|purple|pink|orange|cyan|sky|lime)-\d{2,3}\b/,
  /\bshadow-(?:sm|md|lg|xl|2xl)\b/,
];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.tsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const files = [...walk(path.join(ROOT, "app/(app)")), ...walk(path.join(ROOT, "components"))];
const offenders = files
  .filter((f) => {
    const src = fs.readFileSync(f, "utf8");
    return PATTERNS.some((re) => re.test(src));
  })
  .map((f) => path.relative(ROOT, f))
  .sort();

const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : [];

if (previous.length && offenders.length > previous.length && !FORCE) {
  console.error(
    `\nRefus : la liste passerait de ${previous.length} à ${offenders.length} fichiers.\n` +
      "Elle ne doit que rétrécir. Corrigez les nouveaux fichiers, ou relancez avec --force\n" +
      "si l'augmentation est justifiée (fichiers déplacés, périmètre élargi).\n",
  );
  process.exit(1);
}

fs.writeFileSync(OUT, JSON.stringify(offenders, null, 2) + "\n");

const delta = previous.length ? offenders.length - previous.length : 0;
console.log(`fichiers d'interface analysés : ${files.length}`);
console.log(`fichiers en écart, exemptés   : ${offenders.length}${delta ? ` (${delta > 0 ? "+" : ""}${delta})` : ""}`);
console.log(`fichiers protégés par la règle : ${files.length - offenders.length}`);
