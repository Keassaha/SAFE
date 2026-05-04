#!/usr/bin/env node
// SAFE — Detect hardcoded user-facing strings (FR or EN) outside next-intl.
//
// Usage:
//   node scripts/i18n-audit.mjs                  # Print violations + compare to baseline
//   node scripts/i18n-audit.mjs --update-baseline # Save current count as new baseline
//   node scripts/i18n-audit.mjs --json           # Machine-readable output
//
// Exit codes:
//   0 — count <= baseline (ratchet held)
//   1 — count > baseline (regression)
//   2 — script error
//
// Suppression: append `// i18n-ignore` on the same line.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BASELINE_PATH = join(ROOT, "scripts", "i18n-baseline.json");

const SCAN_DIRS = [
  "app",
  "components",
  "lib/email-templates",
  "lib/email.ts",
];

const SCAN_EXTS = new Set([".tsx", ".ts"]);

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "__tests__",
  "__snapshots__",
]);

// Files we deliberately don't scan (translation systems themselves, types, tests,
// legal pages whose copy is drafted separately per locale, internal style guide).
const SKIP_FILE_PATTERNS = [
  /\.test\.tsx?$/,
  /\.spec\.tsx?$/,
  /\bonboarding\/translations\.ts$/, // Parallel i18n system — handled by PR5.
  /\bdashboard\/types\.ts$/,
  /\bapp\/conditions\//, // Legal copy — drafted by counsel, not engineering.
  /\bapp\/confidentialite\//, // Same as above.
  /\bapp\/style-guide\//, // Internal design surface, not user-facing.
];

// Regex toolkit ---------------------------------------------------------------

// JSX text node containing letters with at least one accent OR starting with capital + 4+ letters.
// Examples caught: >Bonjour<, >Détails<, >New invoice<.
// Examples NOT caught: >{value}<, >123<, >Yes/No< (too short).
const JSX_TEXT_RE = /(?<=>)([^<{}\n]*[A-Za-zÀ-ÿ][a-zà-ÿ]{3,}[^<{}\n]*)(?=<)/g;

// User-visible attributes whose literal string values must be translated.
const ATTR_RE = /\b(placeholder|aria-label|title|alt)\s*=\s*"([^"\n]{3,})"/g;

// Toast first-arg literals.
const TOAST_RE = /\btoast\.(success|error|info|warning|loading)\s*\(\s*"([^"\n]{3,})"/g;

// Thrown error messages with accents (clearly French) — surface to user via catch handlers.
const THROW_RE = /\bthrow\s+new\s+(?:Error|TypeError|RangeError)\s*\(\s*"([^"\n]*[À-ÿ][^"\n]*)"/g;

// Heuristic: drop a literal that's only digits/punctuation/short.
function isLikelyText(s) {
  const trimmed = s.trim();
  if (trimmed.length < 4) return false;
  if (!/[A-Za-zÀ-ÿ]/.test(trimmed)) return false;
  // Skip pure code-like tokens (e.g. "URL", "API", "kg/m²").
  const letters = trimmed.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (letters.length < 3) return false;
  return true;
}

// Skip lines that are clearly non-UI: imports, type annotations, console, comments.
function isCodeLine(line) {
  const t = line.trim();
  if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return true;
  if (t.startsWith("import ") || t.startsWith("export ") && t.includes("from ")) return true;
  if (t.startsWith("const t =") || t.startsWith("const tc =")) return true; // useTranslations destructure
  if (/console\.(log|warn|error|info|debug)/.test(t)) return true;
  return false;
}

// Skip strings that are clearly identifiers, paths, or class lists.
function looksLikeIdentifier(s) {
  const t = s.trim();
  // Tailwind class lists: contain spaces + hyphens + colons.
  if (/^[a-z0-9:\/\s\-\[\]_.]+$/i.test(t) && /\s/.test(t) && !/[A-ZÀ-ÿ]/.test(t)) return true;
  // URLs / paths.
  if (/^https?:\/\//.test(t)) return true;
  if (/^\/[a-z0-9\-_/]+$/.test(t)) return true;
  // Class-name-only attribute values (e.g. "h-4 w-4 text-foreground").
  if (/^[a-z0-9\-_:\/\s\[\]]+$/.test(t) && /\s/.test(t)) return true;
  return false;
}

// File walk -------------------------------------------------------------------

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (SCAN_EXTS.has(extname(name))) {
      if (SKIP_FILE_PATTERNS.some((re) => re.test(full))) continue;
      out.push(full);
    }
  }
  return out;
}

function collectFiles() {
  const all = [];
  for (const target of SCAN_DIRS) {
    const full = join(ROOT, target);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isFile()) {
      if (SCAN_EXTS.has(extname(full)) && !SKIP_FILE_PATTERNS.some((re) => re.test(full))) {
        all.push(full);
      }
    } else if (st.isDirectory()) {
      walk(full, all);
    }
  }
  return all;
}

// Scan one file ---------------------------------------------------------------

function scanFile(file) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("// i18n-ignore")) continue;
    if (isCodeLine(line)) continue;

    // 1) JSX text
    for (const m of line.matchAll(JSX_TEXT_RE)) {
      const text = m[1];
      if (!isLikelyText(text)) continue;
      if (looksLikeIdentifier(text)) continue;
      violations.push({ file, line: i + 1, kind: "jsx-text", value: text.trim() });
    }

    // 2) attributes
    for (const m of line.matchAll(ATTR_RE)) {
      const value = m[2];
      if (!isLikelyText(value)) continue;
      if (looksLikeIdentifier(value)) continue;
      violations.push({ file, line: i + 1, kind: `attr:${m[1]}`, value });
    }

    // 3) toasts
    for (const m of line.matchAll(TOAST_RE)) {
      violations.push({ file, line: i + 1, kind: `toast:${m[1]}`, value: m[2] });
    }

    // 4) throw new Error with accents
    for (const m of line.matchAll(THROW_RE)) {
      violations.push({ file, line: i + 1, kind: "throw", value: m[1] });
    }
  }

  return violations;
}

// Main ------------------------------------------------------------------------

function loadBaseline() {
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
  } catch {
    return { count: null, generatedAt: null };
  }
}

function saveBaseline(count) {
  const data = { count, generatedAt: new Date().toISOString() };
  writeFileSync(BASELINE_PATH, JSON.stringify(data, null, 2) + "\n");
}

function main() {
  const args = new Set(process.argv.slice(2));
  const updateBaseline = args.has("--update-baseline");
  const outputJson = args.has("--json");

  const files = collectFiles();
  const all = [];
  for (const f of files) all.push(...scanFile(f));

  if (outputJson) {
    process.stdout.write(JSON.stringify({ count: all.length, violations: all }, null, 2));
    return 0;
  }

  // Group by file for readability.
  const byFile = new Map();
  for (const v of all) {
    const rel = relative(ROOT, v.file);
    if (!byFile.has(rel)) byFile.set(rel, []);
    byFile.get(rel).push(v);
  }

  if (updateBaseline) {
    saveBaseline(all.length);
    process.stdout.write(`Baseline updated: ${all.length} violations.\n`);
    return 0;
  }

  // Top files (helpful summary).
  const sorted = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);
  process.stdout.write(`\ni18n audit — ${all.length} hardcoded strings across ${byFile.size} files\n`);
  process.stdout.write("─".repeat(64) + "\n");
  for (const [file, vs] of sorted.slice(0, 15)) {
    process.stdout.write(`  ${vs.length.toString().padStart(4)}  ${file}\n`);
  }
  if (sorted.length > 15) {
    const remaining = sorted.slice(15).reduce((s, [, vs]) => s + vs.length, 0);
    process.stdout.write(`  …  ${sorted.length - 15} more files (${remaining} violations)\n`);
  }

  const baseline = loadBaseline();
  process.stdout.write("\n");
  if (baseline.count == null) {
    process.stdout.write(`No baseline yet. Run with --update-baseline to save current count.\n`);
    return 0;
  }
  if (all.length > baseline.count) {
    process.stderr.write(
      `\n✗ i18n regression: ${all.length} violations, baseline is ${baseline.count}.\n` +
        `  Either fix the new hardcoded strings or update the baseline once you've justified the increase.\n`,
    );
    return 1;
  }
  if (all.length < baseline.count) {
    process.stdout.write(
      `✓ i18n progress: ${all.length} violations, down from baseline ${baseline.count}.\n` +
        `  Run \`npm run i18n:audit:update-baseline\` to lock in the new floor.\n`,
    );
    return 0;
  }
  process.stdout.write(`✓ i18n stable at baseline (${all.length} violations).\n`);
  return 0;
}

process.exit(main());
