#!/usr/bin/env node
/**
 * Inventaire des composants orphelins, c'est à dire atteints par aucun point
 * d'entrée de l'application.
 *
 * Voir docs/design/SAFE_PREMIUM_DESIGN_STANDARD.md §3.10, règle PS-090.
 *
 * Prudence délibérée : le script préfère déclarer un fichier vivant à tort plutôt
 * que de proposer la suppression d'un fichier encore utilisé. Concrètement,
 *   - tous les points d'entrée de app/ comptent, pas seulement les pages,
 *   - les fichiers de test comptent comme points d'entrée, pour ne pas casser
 *     une suite en supprimant un composant qu'elle seule monte,
 *   - `next/dynamic` et `import()` sont suivis,
 *   - un composant dont le nom de fichier apparaît en chaîne de caractères
 *     quelque part dans le dépôt est signalé « cité », donc non proposé.
 *
 *   node scripts/design-orphans.mjs           rapport
 *   node scripts/design-orphans.mjs --list    chemins seuls, un par ligne
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIST_ONLY = process.argv.includes("--list");

const ENTRY =
  /\/(page|layout|template|default|error|global-error|loading|not-found|route|sitemap|robots|icon|apple-icon|opengraph-image|twitter-image)\.tsx?$/;
const IS_TEST = /(\.test\.tsx?$|\/__tests__\/)/;
const IMPORT = /import\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+["']([^"']+)["']/g;
const DYNAMIC = /import\(\s*["']([^"']+)["']\s*\)/g;
const REEXPORT = /export\s+(?:\*|\{[\s\S]*?\})\s+from\s+["']([^"']+)["']/g;

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.tsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}

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

function reachable(entries) {
  const seen = new Set();
  const queue = [...entries];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    let src;
    try {
      src = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const re of [IMPORT, DYNAMIC, REEXPORT]) {
      for (const m of src.matchAll(re)) {
        const r = resolve(m[1], file);
        if (r && !seen.has(r)) queue.push(r);
      }
    }
  }
  return seen;
}

const all = [
  ...walk(path.join(ROOT, "app")),
  ...walk(path.join(ROOT, "components")),
  ...walk(path.join(ROOT, "lib")),
  ...walk(path.join(ROOT, "scripts")),
  ...walk(path.join(ROOT, "electron")),
  ...walk(path.join(ROOT, "types")),
];

const entries = [
  ...all.filter((f) => f.startsWith(path.join(ROOT, "app")) && ENTRY.test(f)),
  ...all.filter((f) => IS_TEST.test(f)),
  ...all.filter((f) => f.startsWith(path.join(ROOT, "scripts"))),
  ...all.filter((f) => f.startsWith(path.join(ROOT, "electron"))),
  ...["middleware.ts", "instrumentation.ts", "next.config.ts"]
    .map((f) => path.join(ROOT, f))
    .filter((f) => fs.existsSync(f)),
];

const live = reachable(entries);
const components = walk(path.join(ROOT, "components")).filter((f) => f.endsWith(".tsx"));
const unreached = components.filter((f) => !live.has(f)).map((f) => path.relative(ROOT, f));

/** Dernier filet : un nom de fichier cité en chaîne quelque part (registre, catalogue). */
function citedByName(rel) {
  const base = path.basename(rel, ".tsx");
  try {
    const out = execSync(
      `grep -rl --include='*.ts' --include='*.tsx' --include='*.json' --include='*.md' -F ${JSON.stringify(base)} app components lib scripts prisma 2>/dev/null || true`,
      { cwd: ROOT, encoding: "utf8" },
    );
    return out
      .split("\n")
      .filter(Boolean)
      .filter((f) => path.resolve(ROOT, f) !== path.resolve(ROOT, rel));
  } catch {
    return [];
  }
}

const cited = [];
const orphans = [];
for (const rel of unreached) {
  const refs = citedByName(rel);
  (refs.length ? cited : orphans).push({ rel, refs });
}

if (LIST_ONLY) {
  for (const o of orphans) console.log(o.rel);
} else {
  const byFamily = {};
  for (const o of orphans) {
    const fam = o.rel.split("/")[1];
    byFamily[fam] = (byFamily[fam] || 0) + 1;
  }
  console.log("\nComposants orphelins, PS-090");
  console.log("=".repeat(58));
  console.log(`composants inventoriés     : ${components.length}`);
  console.log(`atteints par un point d'entrée : ${components.length - unreached.length}`);
  console.log(`non atteints               : ${unreached.length}`);
  console.log(`  dont cités par leur nom ailleurs, conservés par prudence : ${cited.length}`);
  console.log(`  SUPPRIMABLES                                            : ${orphans.length}\n`);
  console.log("Par famille");
  for (const [k, v] of Object.entries(byFamily).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(20)} ${String(v).padStart(4)}`);
  }
  if (cited.length) {
    console.log("\nConservés malgré tout, car cités quelque part");
    for (const c of cited.slice(0, 12)) {
      console.log(`  ${c.rel}\n      → ${c.refs.slice(0, 2).join(", ")}`);
    }
    if (cited.length > 12) console.log(`  … et ${cited.length - 12} autres`);
  }
  console.log("");
}
