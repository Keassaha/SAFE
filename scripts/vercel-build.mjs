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

// Garde-fou anti-P0 (incident 2026-07-06, commit 5fefd57).
// Des colonnes avaient été ajoutées à prisma/schema.prisma (Cabinet.stripeConnect*)
// SANS fichier de migration. `migrate deploy` n'avait donc rien appliqué, la base prod
// n'a jamais reçu les colonnes, et prisma.user.findFirst({ include: { cabinet: true } })
// plantait pour tous les cabinets.
//
// Ici, une fois les migrations en attente appliquées, on compare la base RÉELLE au
// schéma. Si le schéma décrit encore des colonnes/tables qu'aucune migration n'a créées,
// la diff est non vide (exit 2) et on casse le build AVANT de livrer du code qui planterait.
// On utilise --from-url (pas --from-migrations, qui exigerait un shadow database absent
// de l'environnement de build Vercel).
const schemaGuardUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!schemaGuardUrl) {
  console.error(
    "Garde-fou schéma : aucune DIRECT_URL/DATABASE_URL disponible, dérive schéma↔base non vérifiable. Build interrompu."
  );
  process.exit(1);
}

const drift = run(
  "npx",
  [
    "prisma",
    "migrate",
    "diff",
    "--from-url",
    schemaGuardUrl,
    "--to-schema-datamodel",
    "prisma/schema.prisma",
    "--exit-code",
  ],
  { allowFailure: true }
);

if (drift.status === 2) {
  console.error(
    "\nGarde-fou schéma : ÉCHEC. La base déployée ne correspond pas à prisma/schema.prisma.\n" +
      "Une modification du schéma n'a pas de migration correspondante (cf. incident P0 du 2026-07-06).\n" +
      "Générez la migration manquante (`prisma migrate dev --name <nom>`), committez-la, puis redéployez.\n"
  );
  process.exit(1);
}

if (drift.status !== 0) {
  console.error(
    `\nGarde-fou schéma : la vérification de dérive a échoué (code ${drift.status}). Build interrompu par précaution.\n`
  );
  process.exit(1);
}

console.log("Garde-fou schéma : base et prisma/schema.prisma alignés.");

run("npx", ["next", "build"]);
