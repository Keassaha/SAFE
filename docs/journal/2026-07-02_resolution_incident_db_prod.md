# 2026-07-02 — Résolution incident base de données prod (P0 connexion)

## Contexte
Split-brain de configuration DB découvert le matin (voir `2026-07-02_cabinet_test_local_et_incident_db.md`).
App déployée injoignable : variables Vercel pointant sur un projet Supabase supprimé.

## Tranché par preuve (plus de devinette)
- **Projet canonique = `rsblxmmqlnywcjxztebu`** (aws-1-ca-central-1). Seul projet vivant.
  Contient les vrais cabinets : Derisier Law (info@ / aaliyah@), Kouame, Cayard, SAFE.
  5 cabinets, 7 users, 7 clients, 7 dossiers, 93 tables.
- **Mot de passe = `Jesuisjeremietiahou333`** (celui de `.env.local`, sans `@`). Testé valide
  contre le pooler ports 5432 et 6543. Le mdp « périmé » n'était que dans `.env` (`Jesuisjeremie`).
- Projet `nhiorvnljwmdyiedkkdd` (dans les vars Vercel) = **supprimé**, irrécupérable.
- Portée : toute l'app tourne sur Prisma→Postgres. Seul usage runtime du SDK Supabase =
  stockage de fichiers (`lib/services/document.ts`, bucket `documents`).

## Fait
- Réaligné **7 variables Vercel** sur les 3 environnements (production, preview, development),
  via l'**API REST Vercel** (le CLI 54.6.0 stocke du vide via stdin — bug ; l'API POST est fiable) :
  `DATABASE_URL`, `DIRECT_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`
  (→ pooler rsblx, bon mot de passe), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (→ projet rsblx).
- Redéployé la prod (`vercel redeploy … --scope keassahas-projects`) → `safe-jktx0w3w4`,
  aliasé sur www.safecabinet.ca.
- Corrigé `.env.bak.claude` (mot de passe cloud → `Jesuisjeremietiahou333`) pour que la
  restauration future fonctionne.

## Vérifié
- `GET https://www.safecabinet.ca/api/auth/db-check` → `{"ok":true}` (HTTP 200).
  Cet endpoint exécute un vrai `prisma.$queryRaw SELECT 1`. **Connexion prod confirmée.**
- `/connexion` → HTTP 200.

## Décidé (avec CEO)
- Dev local : on **garde la base Postgres locale** (`safe_local` + cabinet test). `.env`/`.env.local`
  non touchés. Backups `.bak.claude` prêts pour repointer sur le cloud plus tard.

## Reste à faire (non bloquant pour le P0)
- **Stockage documents** : `SUPABASE_URL` + clés `SUPABASE_*` pointent encore sur le projet mort.
  Récupérer dans le dashboard Supabase du projet `rsblxmmqlnywcjxztebu` : `service_role`, `anon`,
  `JWT secret`, `publishable`/`secret`. Puis réaligner `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`
  (+ vérifier que le bucket `documents` existe). Upload de documents dégradé jusque-là.
- `POSTGRES_HOST`/`POSTGRES_PASSWORD`/`POSTGRES_USER`/`POSTGRES_DATABASE` (vars atomiques) pointent
  encore sur le projet mort mais sont **inertes** (aucun code ne les lit). Nettoyage cosmétique.

## Perte de données à noter
Les fichiers uploadés vivaient dans le bucket du projet supprimé `nhiorv…`. S'ils y étaient,
ils sont perdus avec le projet. Rien de récupérable.
