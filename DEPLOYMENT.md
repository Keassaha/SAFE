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
| `DATABASE_URL`    | URL de connexion PostgreSQL (runtime). Avec **Supabase**, utilisez l’URL **pooler** (port 6543). |
| `DIRECT_URL`      | *(Recommandé avec Supabase)* URL de connexion **directe** (port 5432). Utilisée au build pour `prisma migrate deploy`. Si absente, le build utilise `DATABASE_URL` (le pooler peut refuser les migrations : dans ce cas, ajoutez `DIRECT_URL` depuis Supabase → Settings → Database → Connection string → **Direct connection**). |
| `NEXTAUTH_SECRET` | Secret pour les sessions (ex. `openssl rand -base64 32`)                    |
| `NEXTAUTH_URL`    | URL publique de l’app (ex. `https://votre-app.vercel.app`) sans slash final. |

Sans `NEXTAUTH_URL` correcte, les callbacks NextAuth peuvent échouer.

### 3. Build et déploiement

Le fichier `vercel.json` impose la commande de build `npm run vercel-build`, qui exécute :

- `prisma generate`
- `prisma migrate deploy` (crée les tables ; utilise `DIRECT_URL` si définie, sinon `DATABASE_URL`)
- `next build`

Déployez par push sur la branche liée ou `vercel --prod`. Si le build échoue sur `prisma migrate deploy` (erreur type « PREPARE » ou « protocol »), définissez **`DIRECT_URL`** avec l’URL de connexion directe Supabase (port 5432). Après le déploiement, la création de compte et la connexion fonctionnent.

---

## En local

Utilisez la même `DATABASE_URL` (PostgreSQL) dans votre `.env`. Puis :

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Vous pouvez utiliser une base Neon gratuite ou Docker pour le développement local.
