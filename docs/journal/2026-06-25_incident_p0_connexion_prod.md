# 2026-06-25 — Incident P0 : diagnostic de la connexion prod (env Supabase désaligné)

Tentative de lever le P0 « connexion prod cassée ». Le diagnostic a révélé un problème
plus profond et plus urgent que « mot de passe oublié ». Aucune écriture effectuée.

## Faits vérifiés (read-only)
- Site live : `safecabinet.ca` → 307 vers `www.safecabinet.ca` (apex→www, normal). `/connexion` répond **200**.
- `GET https://www.safecabinet.ca/api/auth/db-check` → **`{"ok":true}`** (exécute un vrai `SELECT 1`).
  Donc la **prod live parle bien à une base qui fonctionne**.
- Tous les `.env` locaux (`.env`, `.env.local`, `.env.production.local`) → projet Supabase
  **`rsblxmmqlnywcjxztebu`**, user au bon format (`postgres.<ref>`), mais **auth échoue**
  (`P1000 credentials not valid`) → **mot de passe périmé localement**.
- `vercel env pull` (production) : `DATABASE_URL` **vide** ; la connexion vient du repli
  `lib/db.ts` → `POSTGRES_PRISMA_URL`. Ce `POSTGRES_PRISMA_URL` pointe vers le projet
  **`nhiorvnljwmdyiedkkdd`**, qui renvoie **`tenant/user not found`** et **ne résout pas en DNS**
  (`https://nhiorvnljwmdyiedkkdd.supabase.co` → HTTP 000). **Ce projet n'existe plus.**
- `https://rsblxmmqlnywcjxztebu.supabase.co/rest/v1/` → **401** (existe, vivant, juste pas le bon mdp local).

## Diagnostic
**Le déploiement live tourne sur d'anciennes variables (connexion DB figée qui marche).
Les variables ACTUELLES dans Vercel pointent vers un projet Supabase supprimé/inexistant
(`nhiorvnljwmdyiedkkdd`). Conséquence : tout redéploiement connectera la prod à une base
morte et la fera tomber.** C'est un piège sous le prochain deploy (export compta, nettoyage data, etc.).

Le seul projet réellement existant est `rsblxmmqlnywcjxztebu` (celui des `.env` locaux),
mais son mot de passe a été tourné et les fichiers n'ont pas suivi.

## Reclassement P0
- **P0#0 (NOUVEAU, le plus urgent)** : réaligner l'env Vercel sur le projet Supabase vivant
  avant tout redéploiement. Sinon prod down au prochain deploy.
- **P0#1 (login)** : confirmé « compte/mot de passe », PAS infra côté live. Non réparable
  tant qu'on n'a pas un mot de passe DB valide (les deux disponibles sont morts/périmés).
- **P0#2 / P0#3** : bloqués par l'absence d'identifiants valides en local.

## Action requise (dashboards, ~15-20 min, côté CEO)
1. Supabase : confirmer que `rsblxmmqlnywcjxztebu` contient bien les vraies données de prod.
2. Supabase : reset du mot de passe DB de ce projet (rejoint B5 rotation des secrets).
3. Vercel : repointer `DATABASE_URL` / `POSTGRES_*` / `DIRECT_URL` vers `rsblxmmqlnywcjxztebu`
   + nouveau mdp ; retirer toute référence à `nhiorvnljwmdyiedkkdd`.
4. Mettre à jour les `.env` locaux (ou `vercel env pull` après correction).
5. Redéployer une fois ; vérifier `db-check` + un login.

Ensuite (minutes) : `seed-admin.mjs` (reset login propriétaire), `delete-test-client.mjs`
(aperçu puis suppression du client `ptiahou@gmail.com`), `prisma migrate status`.

## Sécurité
`vercel env pull` a écrit `.env.vercel.pull` (non gitignoré) avec des secrets → **fichier supprimé** en fin de session.
Recommandation : ajouter `.env.vercel.pull` (ou `.env.vercel*`) au `.gitignore`.
