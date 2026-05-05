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
run("npx", ["next", "build"]);
