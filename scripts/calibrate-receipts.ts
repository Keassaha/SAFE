/**
 * Harnais de calibrage de l'extraction de reçus (lot R1 de SPEC_IMPORT_RECU_DEPENSE).
 *
 * Parcourt le corpus de reçus réels annotés (docs/product/echantillons-recus/), appelle le VRAI
 * extracteur `extractExpenseReceipt`, compare l'extraction au label de vérité-terrain, et sort un
 * tableau par reçu + un taux de réussite par champ. But : passer d'« un vrai reçu » à une MESURE.
 *
 * Run :
 *   npx tsx --env-file=.env.local scripts/calibrate-receipts.ts            # échantillon (8 reçus)
 *   npx tsx --env-file=.env.local scripts/calibrate-receipts.ts --limit 30 # plus de reçus
 *   npx tsx --env-file=.env.local scripts/calibrate-receipts.ts --dir sroie --limit 20
 *
 * Chaque appel consomme l'API Anthropic : commencer petit.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { extractExpenseReceipt } from "../lib/ai/extract-expense-receipt";

const ROOT = join(process.cwd(), "docs/product/echantillons-recus");

interface Truth {
  fournisseur: string | null;
  date: string | null; // AAAA-MM-JJ
  total: number | null; // ⚠ SROIE = total imprimé ; varie-marchands = somme des postes (approx, hors taxe)
  totalIsApprox: boolean;
}

// --- args ---------------------------------------------------------------
const args = process.argv.slice(2);
const getArg = (name: string, def?: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const onlyDir = getArg("dir"); // "sroie" | "varie-marchands" | undefined (les deux)
const limit = Number.parseInt(getArg("limit", "8") as string, 10);

// --- normalisation pour comparaison ------------------------------------
function normStr(s: string | null): string {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function supplierMatch(expected: string | null, got: string | null): boolean {
  const e = normStr(expected);
  const g = normStr(got);
  if (!e || !g) return false;
  return e === g || e.includes(g) || g.includes(e) || e.slice(0, 8) === g.slice(0, 8);
}
/** Ramène une date SROIE (JJ/MM/AAAA, JJ-MM-AA) ou ISO en AAAA-MM-JJ. */
function normDate(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    let y = m[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${mo}-${d}`;
  }
  return s;
}
function numClose(a: number | null, b: number | null, tol = 0.02): boolean {
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
}

// --- lecture des labels (schéma selon la source) -----------------------
function loadTruth(dir: string, jsonName: string): Truth {
  const raw = JSON.parse(readFileSync(join(ROOT, dir, jsonName), "utf8"));
  if (dir === "sroie") {
    return {
      fournisseur: raw.company ?? null,
      date: normDate(raw.date ?? null),
      total: raw.total != null ? Number.parseFloat(String(raw.total)) : null,
      totalIsApprox: false,
    };
  }
  // varie-marchands (docjay131) : pas de total imprimé => somme des postes (hors taxe, indicatif)
  const items = Array.isArray(raw.items) ? raw.items : [];
  const sum = items.reduce((acc: number, it: { totalPrice?: number }) => acc + (Number(it.totalPrice) || 0), 0);
  return {
    fournisseur: raw.merchantName ?? null,
    date: normDate(raw.date ?? null),
    total: items.length ? Math.round(sum * 100) / 100 : null,
    totalIsApprox: true,
  };
}

// --- exécution ----------------------------------------------------------
async function run() {
  const dirs = onlyDir ? [onlyDir] : ["sroie", "varie-marchands"];
  const jobs: { dir: string; base: string }[] = [];
  for (const dir of dirs) {
    const files = readdirSync(join(ROOT, dir))
      .filter((f) => f.endsWith(".jpg"))
      .sort();
    for (const f of files) jobs.push({ dir, base: f.replace(/\.jpg$/, "") });
  }
  const selected = jobs.slice(0, limit);

  console.log(`\nCalibrage extraction reçus — ${selected.length} reçu(s) sur ${jobs.length} dispo\n`);
  const stat = { supplier: 0, date: 0, total: 0, done: 0, nullKey: 0 };

  for (const { dir, base } of selected) {
    const truth = loadTruth(dir, `${base}.json`);
    const buffer = readFileSync(join(ROOT, dir, `${base}.jpg`));
    const ex = await extractExpenseReceipt({ buffer, mimeType: "image/jpeg" });
    if (!ex) {
      stat.nullKey++;
      console.log(`✗ ${dir}/${base}  — extraction null (clé API ? type ?)`);
      continue;
    }
    stat.done++;
    const okS = supplierMatch(truth.fournisseur, ex.fournisseur);
    const okD = truth.date != null && normDate(ex.date) === truth.date;
    const okT = numClose(ex.montantTtc, truth.total);
    if (okS) stat.supplier++;
    if (okD) stat.date++;
    if (okT) stat.total++;

    console.log(`${okS && okD ? "✓" : "•"} ${dir}/${base} [conf ${ex.confianceOcr}]`);
    console.log(`   fourn.  ${okS ? "✓" : "✗"}  attendu="${truth.fournisseur}"  extrait="${ex.fournisseur}"`);
    console.log(`   date    ${okD ? "✓" : "✗"}  attendu="${truth.date}"  extrait="${normDate(ex.date)}"`);
    console.log(
      `   total   ${okT ? "✓" : "✗"}  attendu=${truth.total}${truth.totalIsApprox ? " (approx hors taxe)" : ""}  extrait=${ex.montantTtc}  (tps=${ex.tps} tvq=${ex.tvq})`,
    );
    if (ex.champsIllisibles.length) console.log(`   illisibles: ${ex.champsIllisibles.join(", ")}`);
  }

  const pct = (n: number) => (stat.done ? `${Math.round((100 * n) / stat.done)}%` : "n/a");
  console.log(`\n── Résultat (${stat.done} extraits, ${stat.nullKey} null) ──`);
  console.log(`   fournisseur : ${stat.supplier}/${stat.done}  (${pct(stat.supplier)})`);
  console.log(`   date        : ${stat.date}/${stat.done}  (${pct(stat.date)})`);
  console.log(`   total       : ${stat.total}/${stat.done}  (${pct(stat.total)})  ⚠ total varie-marchands = approx hors taxe`);
  console.log(`\nNote : ce corpus n'a NI TPS NI TVQ (non canadien). Le split taxes se calibre sur de vrais reçus QC.\n`);
}

run().catch((e) => {
  console.error("Erreur harnais :", e);
  process.exit(1);
});
