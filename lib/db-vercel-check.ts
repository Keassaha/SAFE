/**
 * Sur Vercel, vérifie que la base est correctement configurée (PostgreSQL requis).
 */
export function getDatabaseConfigError(): string | null {
  if (process.env.VERCEL !== "1") return null;
  const url = process.env.DATABASE_URL?.trim() || process.env.POSTGRES_PRISMA_URL?.trim() || process.env.POSTGRES_URL?.trim();
  if (!url) {
    return "Base de données non configurée. Sur Vercel : Storage → Create Database (Postgres) puis liez le projet, ou ajoutez DATABASE_URL (ou POSTGRES_URL) dans Settings → Environment Variables.";
  }
  if (url.startsWith("file:")) {
    return "SQLite ne fonctionne pas sur Vercel. Utilisez une base PostgreSQL (Vercel Postgres, Neon, Supabase) et définissez DATABASE_URL avec l’URL de connexion.";
  }
  return null;
}
