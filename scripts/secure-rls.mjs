/**
 * secure-rls.mjs
 *
 * Active Row-Level Security (RLS) sur toutes les tables du schéma `public`.
 *
 * Pourquoi : Supabase expose le schéma `public` via son API REST publique
 * (clé publiable livrée dans le frontend). Sans RLS, n'importe qui avec l'URL
 * du projet peut lire/modifier/supprimer les données. RLS activé sans policy =
 * accès API refusé pour tout le monde sauf le propriétaire des tables.
 *
 * Sans danger pour l'app : Prisma se connecte en rôle propriétaire (`postgres`),
 * qui contourne RLS. Le client Supabase ne sert qu'au Realtime broadcast, qui ne
 * touche aucune table. Voir docs/journal/2026-07-21_rls_active_prod_supabase.md.
 *
 * Idempotent : ne touche que les tables où RLS est absent. Rejoué à chaque
 * déploiement Vercel après `prisma migrate deploy` (voir scripts/vercel-build.mjs)
 * pour couvrir toute nouvelle table.
 *
 * Usage : `npm run secure:rls`
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Garde-fou : n'accepte que des identifiants de table sûrs (défense en profondeur,
// même si les noms proviennent du catalogue Postgres de confiance).
const SAFE_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

try {
  const tables = await prisma.$queryRaw`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND NOT rowsecurity
    ORDER BY tablename
  `;

  if (tables.length === 0) {
    console.log("secure-rls: toutes les tables publiques ont déjà RLS activé. Rien à faire.");
    process.exit(0);
  }

  const secured = [];
  const skipped = [];

  for (const { tablename } of tables) {
    if (!SAFE_IDENT.test(tablename)) {
      skipped.push(tablename);
      console.warn(`secure-rls: nom de table ignoré (non conforme) : ${tablename}`);
      continue;
    }
    await prisma.$executeRawUnsafe(
      `ALTER TABLE public."${tablename}" ENABLE ROW LEVEL SECURITY;`,
    );
    secured.push(tablename);
  }

  console.log(`secure-rls: RLS activé sur ${secured.length} table(s) : ${secured.join(", ")}`);
  if (skipped.length > 0) {
    console.warn(
      `secure-rls: ATTENTION, ${skipped.length} table(s) non sécurisée(s) : ${skipped.join(", ")}`,
    );
  }
} catch (error) {
  console.error("secure-rls: échec de l'activation RLS.", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
