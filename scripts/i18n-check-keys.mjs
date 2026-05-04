#!/usr/bin/env node
// SAFE — Verify FR/EN translation key parity.
//
// Walks both messages/fr.json and messages/en.json, flattens each key tree,
// and reports any divergence. Empty-string leaves are also flagged.
//
// Exit codes: 0 if perfect parity, 1 if any divergence or empty leaf.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

function flatten(obj, prefix = "", out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out.set(key, v);
    }
  }
  return out;
}

function load(name) {
  const path = join(ROOT, "messages", `${name}.json`);
  const raw = readFileSync(path, "utf8");
  return flatten(JSON.parse(raw));
}

const fr = load("fr");
const en = load("en");

const missingInEn = [];
const missingInFr = [];
const emptyInFr = [];
const emptyInEn = [];

for (const k of fr.keys()) {
  if (!en.has(k)) missingInEn.push(k);
}
for (const k of en.keys()) {
  if (!fr.has(k)) missingInFr.push(k);
}
for (const [k, v] of fr) {
  if (typeof v === "string" && v.trim() === "") emptyInFr.push(k);
}
for (const [k, v] of en) {
  if (typeof v === "string" && v.trim() === "") emptyInEn.push(k);
}

const totalIssues =
  missingInEn.length + missingInFr.length + emptyInFr.length + emptyInEn.length;

process.stdout.write(`\ni18n key parity — fr.json: ${fr.size} keys, en.json: ${en.size} keys\n`);
process.stdout.write("─".repeat(64) + "\n");

function report(label, list) {
  if (list.length === 0) return;
  process.stdout.write(`\n${label} (${list.length}):\n`);
  for (const k of list.slice(0, 20)) process.stdout.write(`  ${k}\n`);
  if (list.length > 20) process.stdout.write(`  … ${list.length - 20} more\n`);
}

report("Missing in en.json", missingInEn);
report("Missing in fr.json", missingInFr);
report("Empty value in fr.json", emptyInFr);
report("Empty value in en.json", emptyInEn);

if (totalIssues === 0) {
  process.stdout.write("\n✓ Perfect parity — no missing or empty keys.\n");
  process.exit(0);
}
process.stderr.write(`\n✗ ${totalIssues} issue(s). Fix before merging.\n`);
process.exit(1);
