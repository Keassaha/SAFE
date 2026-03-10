# Déploiement sur Vercel

Le projet utilise **PostgreSQL** (schéma Prisma et migration fournis). Sur Vercel, il suffit de créer une base Postgres et de configurer les variables d’environnement.

---

## Étapes

### 1. Créer une base PostgreSQL

- **Vercel Postgres** : Dashboard Vercel → Storage → Create Database → Postgres. Lier le projet pour que `DATABASE_URL` (ou `POSTGRES_URL`) soit ajoutée automatiquement. Si besoin, renommer/copier en `DATABASE_URL`.
- **Neon** : [neon.tech](https://neon.tech) → créer un projet → copier l’URL (format `postgresql://...?sslmode=require`).
- **Supabase** : [supabase.com](https://supabase.com) → projet → Settings → Database → Connection string (URI).

### 2. Variables d’environnement sur Vercel

Dans le projet Vercel → Settings → Environment Variables :

| Variable          | Description                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| `DATABASE_URL`    | URL de connexion PostgreSQL (ex. `postgresql://user:pass@host:5432/dbname?sslmode=require`) |
| `NEXTAUTH_SECRET` | Secret pour les sessions (ex. `openssl rand -base64 32`)                    |
| `NEXTAUTH_URL`    | URL publique de l’app (ex. `https://safe-wheat-seven.vercel.app`)           |

Sans `NEXTAUTH_URL` correcte, les callbacks NextAuth peuvent échouer.

### 3. Build et déploiement

Le script `vercel-build` dans `package.json` exécute déjà :

- `prisma generate`
- `prisma migrate deploy` (crée les tables sur la base Postgres)
- `next build`

Déployez par push sur la branche liée ou `vercel --prod`. Après le déploiement, la création de compte et la connexion fonctionnent.

---

## En local

Utilisez la même `DATABASE_URL` (PostgreSQL) dans votre `.env`. Puis :

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Vous pouvez utiliser une base Neon gratuite ou Docker pour le développement local.
