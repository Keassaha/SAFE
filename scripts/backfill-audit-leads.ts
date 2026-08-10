/**
 * Rattrapage : fait entrer dans le CRM les audits soumis avant que le
 * rattachement automatique existe (`lib/crm/lead-from-audit.ts`).
 *
 * Réutilise exactement la même fonction que la route publique, donc un audit
 * rattrapé est indistinguable d'un audit arrivé après la bascule.
 * Idempotent : relancer le script ne crée pas de doublon.
 *
 * Run (dev)  : npx tsx --env-file=.env scripts/backfill-audit-leads.ts
 * Run (prod) : npx tsx --env-file=.env.production.local scripts/backfill-audit-leads.ts
 *
 * Options :
 *   --dry-run          liste ce qui serait fait, n'écrit rien
 *   --all              traite toutes les soumissions orphelines
 *   --ids a,b,c        ne traite que ces soumissions (défaut : rien sans --all)
 */
import { prisma } from "@/lib/db";
import { attachAuditSubmissionToCrm, parseAnswers } from "@/lib/crm/lead-from-audit";

function arg(name: string): string | null {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.slice(name.length + 3);
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? (process.argv[idx + 1] ?? "") : null;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const all = process.argv.includes("--all");
  const idsRaw = arg("ids");
  const ids = idsRaw
    ? idsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  if (!all && ids.length === 0) {
    console.error(
      "Rien à faire. Passez --all pour tout traiter, ou --ids <id,id> pour cibler.",
    );
    process.exitCode = 1;
    return;
  }

  const orphelines = await prisma.auditSubmission.findMany({
    where: {
      lead: { is: null },
      ...(ids.length ? { id: { in: ids } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      prospectNom: true,
      prospectEmail: true,
      prospectCabinet: true,
      reponses: true,
    },
  });

  if (orphelines.length === 0) {
    console.log("Aucune soumission orpheline. Le CRM est à jour.");
    return;
  }

  console.log(`${orphelines.length} soumission(s) hors CRM :\n`);

  let crees = 0;
  let rattaches = 0;
  let echecs = 0;

  for (const s of orphelines) {
    const answers = parseAnswers(s.reponses);
    const cabinet =
      s.prospectCabinet || String(answers.raison_sociale ?? "") || "(sans nom)";
    const date = s.createdAt.toISOString().slice(0, 10);
    const entete = `  ${date}  ${cabinet.trim()}  <${s.prospectEmail ?? "sans courriel"}>`;

    if (dryRun) {
      console.log(`${entete}\n      → serait rattaché (dry-run), audit ${s.id}`);
      continue;
    }

    const res = await attachAuditSubmissionToCrm(s.id);
    if (!res.ok) {
      echecs += 1;
      console.log(`${entete}\n      ✗ ÉCHEC : ${res.error}`);
      continue;
    }
    if (res.created) crees += 1;
    else rattaches += 1;
    console.log(`${entete}\n      ✓ ${res.note} (lead ${res.leadId})`);
  }

  if (dryRun) {
    console.log("\nDry-run : rien n'a été écrit.");
    return;
  }

  console.log(
    `\nTerminé. ${crees} lead(s) créé(s), ${rattaches} rattachement(s) à un lead existant, ${echecs} échec(s).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
