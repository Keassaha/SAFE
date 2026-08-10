#!/usr/bin/env node
/**
 * Compteur d'écarts au SAFE Premium Design Standard.
 *
 * Voir docs/design/SAFE_PREMIUM_DESIGN_STANDARD.md §6, procédure d'audit.
 *
 * Principe : ne compter que le code réellement monté. Le compteur part des points
 * d'entrée de app/(app) (page, layout, template, loading, error), suit le graphe
 * d'imports, et ne suit un import que si le symbole est employé dans le corps du
 * fichier. Compter sur du code mort donne des chiffres faux et fait corriger des
 * fichiers que personne n'affiche.
 *
 *   node scripts/design-audit.mjs            rapport lisible
 *   node scripts/design-audit.mjs --json      sortie machine
 *
 * Critère de sortie d'un lot : le total doit avoir baissé. S'il n'a pas bougé,
 * le lot n'est pas terminé, quelle que soit l'impression visuelle.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INTERIOR = path.join(ROOT, "app/(app)");
const JSON_OUT = process.argv.includes("--json");

const RULES = [
  ["PS-001", "Hexadécimale en dur", /#[0-9A-Fa-f]{6}\b/g],
  [
    "PS-002",
    "Palette Tailwind hors jeton",
    /\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide)-(?:emerald|green|teal|slate|gray|zinc|neutral|stone|blue|indigo|violet|purple|pink|orange|cyan|sky|lime)-\d{2,3}\b/g,
  ],
  ["PS-005", "Ombre portée", /\bshadow-(?:sm|md|lg|xl|2xl|\[)/g],
  ["PS-004", "Rayon large ou plein", /\brounded-(?:xl|2xl|3xl|full)\b/g],
  ["PS-006", "Dégradé", /\b(?:bg-gradient-to-|bg-\[linear-gradient)/g],
  ["PS-006b", "Flou, verre dépoli", /\b(?:backdrop-blur|blur-\[|blur-(?:sm|md|lg|xl|2xl|3xl))\b/g],
  ["PS-042", "Mouvement continu", /\banimate-(?:pulse|bounce|ping|spin)\b/g],
  ["PS-043", "Déplacement au survol", /\bhover:(?:-?translate|scale)/g],
  ["PS-082", "Emoji", /[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}]/gu],
];

const ENTRY = /\/(page|layout|template|default|error|loading|not-found)\.tsx$/;
const IMPORT = /import\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+["']([^"']+)["']/g;
const DYNAMIC = /import\(\s*["']([^"']+)["']\s*\)/g;

function resolve(spec, from) {
  let base;
  if (spec.startsWith("@/")) base = path.join(ROOT, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const ext of [".tsx", ".ts", "/index.tsx", "/index.ts"]) {
    const p = base + ext;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return fs.existsSync(base) && fs.statSync(base).isFile() ? base : null;
}

/** Un import n'est suivi que si le symbole importé apparaît dans le corps du fichier. */
function isMounted(src, spec) {
  const escaped = spec.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = src.match(new RegExp(`import\\s+(?:type\\s+)?([\\s\\S]*?)\\s+from\\s+["']${escaped}["']`));
  if (!m) return true;
  if (/^\s*type\b/.test(m[1])) return false;
  const names = [...m[1].matchAll(/[A-Za-z_$][\w$]*/g)]
    .map((x) => x[0])
    .filter((n) => !["type", "as", "default"].includes(n));
  if (!names.length) return true;
  const body = src.replace(/^import[\s\S]*?from\s+["'][^"']+["'];?/gm, "");
  return names.some((n) => new RegExp(`\\b${n}\\b`).test(body));
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.tsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function reachable(entries, maxDepth = 6) {
  const seen = new Set();
  const queue = entries.map((e) => [e, 0]);
  while (queue.length) {
    const [file, d] = queue.shift();
    if (seen.has(file) || d > maxDepth) continue;
    seen.add(file);
    let src;
    try {
      src = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const m of src.matchAll(IMPORT)) {
      const r = resolve(m[1], file);
      if (r && !seen.has(r) && isMounted(src, m[1])) queue.push([r, d + 1]);
    }
    // next/dynamic et import() : toujours suivis, le symbole n'apparaît pas tel quel.
    for (const m of src.matchAll(DYNAMIC)) {
      const r = resolve(m[1], file);
      if (r && !seen.has(r)) queue.push([r, d + 1]);
    }
  }
  return seen;
}

const inScope = (f) => f.endsWith(".tsx") && (f.startsWith(path.join(ROOT, "components")) || f.startsWith(INTERIOR));

const pages = walk(INTERIOR).filter((f) => f.endsWith("page.tsx"));
const live = [...reachable(walk(INTERIOR).filter((f) => ENTRY.test(f)))].filter(inScope);

const totals = {};
const perFile = [];
for (const f of live) {
  const src = fs.readFileSync(f, "utf8");
  const counts = {};
  let total = 0;
  for (const [id, , re] of RULES) {
    const n = (src.match(re) || []).length;
    if (n) {
      counts[id] = n;
      total += n;
      totals[id] = (totals[id] || 0) + n;
    }
  }
  if (total) perFile.push({ file: path.relative(ROOT, f), total, counts, lines: src.split("\n").length });
}
perFile.sort((a, b) => b.total - a.total);

const perRoute = pages
  .map((p) => {
    const files = [...reachable([p])].filter(inScope);
    let total = 0;
    for (const f of files) {
      const src = fs.readFileSync(f, "utf8");
      for (const [, , re] of RULES) total += (src.match(re) || []).length;
    }
    return { route: "/" + path.relative(INTERIOR, path.dirname(p)), files: files.length, total };
  })
  .sort((a, b) => b.total - a.total);

const grand = Object.values(totals).reduce((s, n) => s + n, 0);

if (JSON_OUT) {
  console.log(JSON.stringify({ grand, totals, perFile, perRoute, liveFiles: live.length }, null, 2));
} else {
  console.log("\nÉcarts au standard, sur l'intérieur réellement monté");
  console.log("=".repeat(58));
  console.log(`fichiers montés analysés : ${live.length}`);
  console.log(`fichiers en écart        : ${perFile.length}`);
  console.log(`TOTAL DES ÉCARTS         : ${grand}\n`);

  console.log("Par règle");
  for (const [id, label] of RULES) {
    const n = totals[id] || 0;
    if (n) console.log(`  ${id.padEnd(8)} ${label.padEnd(30)} ${String(n).padStart(5)}`);
  }

  console.log("\n15 fichiers qui portent la dette");
  for (const r of perFile.slice(0, 15)) {
    console.log(`  ${String(r.total).padStart(4)}  ${r.file}  (${r.lines} lignes)`);
  }

  console.log("\n10 routes les plus chargées");
  for (const r of perRoute.slice(0, 10)) {
    console.log(`  ${String(r.total).padStart(4)}  ${r.route}`);
  }
  console.log("");
}
