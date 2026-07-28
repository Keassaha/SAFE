import { spawnSync } from "node:child_process";

process.env.PRISMA_HIDE_UPDATE_MESSAGE = "1";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || "";
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || "";
}

if (!process.env.DATABASE_URL) {
  delete process.env.DATABASE_URL;
}

if (!process.env.DIRECT_URL) {
  delete process.env.DIRECT_URL;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: options.quiet ? "pipe" : "inherit",
    env: process.env,
  });

  if (result.status !== 0 && !options.allowFailure) {
    process.exit(result.status ?? 1);
  }

  return result;
}

run("npx", ["prisma", "generate"]);

/**
 * GARDE-FOU DONNÉES CLIENTS (audit 2026-07-28, §C1).
 *
 * `DATABASE_URL` porte aujourd'hui la MÊME valeur sur Production, Preview et
 * Development. Sans ce garde-fou, chaque push sur n'importe quelle branche
 * déclenchait un build Preview qui appliquait ses migrations à la base de
 * production, et réécrivait l'historique `_prisma_migrations`. Silencieusement :
 * le build Preview réussissait, personne ne regardait.
 *
 * Seul un déploiement de PRODUCTION a le droit de migrer. Les Preview se
 * contentent de compiler. Quand une base Preview distincte sera provisionnée,
 * ce garde-fou pourra être élargi à `VERCEL_ENV !== "development"`.
 *
 * En local (VERCEL_ENV absent) on ne migre pas non plus : les migrations locales
 * passent par `npm run db:migrate`, jamais par le script de build.
 */
const vercelEnv = process.env.VERCEL_ENV ?? null;
const shouldMigrate = vercelEnv === "production";

if (!shouldMigrate) {
  console.log(
    `[vercel-build] VERCEL_ENV=${vercelEnv ?? "(absent)"} : migrations ignorées. ` +
      "Seul un déploiement de production applique les migrations Prisma.",
  );
} else {
  for (const migration of [
    "20250309180000_init",
    "20250311000000_add_invoice_share_token",
    "20250312000000_add_dossier_mandate",
    "20260426000000_add_dossier_sections",
  ]) {
    run("npx", ["prisma", "migrate", "resolve", "--rolled-back", migration], {
      allowFailure: true,
      quiet: true,
    });
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const rows = await prisma.$queryRaw`
      SELECT count(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name <> '_prisma_migrations'
    `;
    const tableCount = Number(rows[0]?.count ?? 0);

    if (tableCount > 0) {
      run("npx", ["prisma", "migrate", "resolve", "--applied", "20260427000000_derisier_baseline"], {
        allowFailure: true,
        quiet: true,
      });
    } else {
      console.log("Fresh database detected: leaving Derisier baseline pending for prisma migrate deploy.");
    }
  } finally {
    await prisma.$disconnect();
  }

  run("npx", ["prisma", "migrate", "deploy"]);

  // Réactive RLS sur toute nouvelle table créée par les migrations.
  // Ferme la faille "table publiquement accessible" de l'API Supabase.
  // allowFailure : ne bloque pas un déploiement sur un souci transitoire,
  // mais loggue clairement toute table restée non sécurisée.
  run("node", ["scripts/secure-rls.mjs"], { allowFailure: true });
}

run("npx", ["next", "build"]);
