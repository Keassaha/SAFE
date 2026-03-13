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

### 4. Erreur P3005 : « The database schema is not empty » (baseline)

Si la base de production (ex. Supabase) a déjà été créée avec des tables (SQL manuel, ancien schéma, autre outil) et que le build Vercel échoue avec :

```text
Error: P3005
The database schema is not empty. Read more about how to baseline an existing production database
```

il faut **baseliner** la base une seule fois : indiquer à Prisma que la migration initiale est déjà appliquée, sans réexécuter le SQL.

**À faire une seule fois**, en local, avec les variables pointant vers la **base de production** (Supabase) :

```bash
# Avec .env contenant DATABASE_URL et DIRECT_URL de la prod, ou en ligne :
export DATABASE_URL="postgresql://..."   # URL de la base Supabase (directe ou pooler)
export DIRECT_URL="postgresql://..."     # Connexion directe (port 5432) recommandée
npx prisma migrate resolve --applied "20250309180000_init"
```

Ou avec le script npm (après avoir configuré `DATABASE_URL` et `DIRECT_URL` pour la prod) :

```bash
npm run db:baseline
```

Ensuite, relancez le déploiement Vercel : `prisma migrate deploy` ignorera la migration déjà marquée comme appliquée et le build passera.

**Si la commande échoue** avec une erreur du type « relation _prisma_migrations does not exist » : la base n’a jamais utilisé Prisma Migrate. Créez la table une fois (ex. dans l’éditeur SQL Supabase), puis relancez `db:baseline` :

```sql
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" VARCHAR(36) PRIMARY KEY NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);
```

Référence : [Baselining a database (Prisma)](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining).

### 5. « La base de données ne répond pas » sur Vercel

Si l’app affiche ce message après déploiement, la connexion à la base échoue au **runtime**. Vérifiez dans l’ordre :

1. **Variables bien définies**  
   Vercel → projet → Settings → Environment Variables : `DATABASE_URL` (ou `POSTGRES_URL` / `POSTGRES_PRISMA_URL`) doit être défini pour **Production** (et Preview si vous testez une preview). Pas seulement au build.

2. **Redéploiement après ajout/modification**  
   Toute modification de variable d’environnement nécessite un **nouveau déploiement** (redeploy) pour être prise en compte à l’exécution.

3. **Supabase : URL pooler pour le runtime**  
   Pour l’exécution sur Vercel (serverless), utilisez l’URL **Connection pooling** (port **6543**), pas l’URL directe (5432). Dans Supabase : Settings → Database → Connection string → **URI** (mode Transaction ou Session). `DIRECT_URL` reste utile pour le build (migrations) avec l’URL directe (5432).

4. **Supabase : projet actif**  
   Les projets gratuits peuvent être **mis en pause**. Dans le dashboard Supabase, reprenez le projet si nécessaire.

5. **Mot de passe et caractères spéciaux**  
   Si le mot de passe contient des caractères spéciaux, il doit être **encodé** dans l’URL (ex. `%40` pour `@`). Ou régénérez un mot de passe sans caractères spéciaux dans Supabase.

6. **Code d’erreur Prisma**  
   L’API `/api/auth/db-check` peut renvoyer un champ `code` (ex. `P1001`, `P1002`). P1001 = serveur injoignable (URL, firewall, projet en pause). P1002 = timeout. Consulter la [référence des erreurs Prisma](https://www.prisma.io/docs/orm/reference/error-reference) si besoin.

---

## En local

Utilisez la même `DATABASE_URL` (PostgreSQL) dans votre `.env`. Si votre fournisseur (Neon, Supabase, etc.) ne fournit qu’une seule URL, définissez **`DIRECT_URL`** avec la même valeur que `DATABASE_URL` pour que `prisma generate` et les migrations fonctionnent. Puis :

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Vous pouvez utiliser une base Neon gratuite ou Docker pour le développement local.
