# 2026-07-21 — RLS activé sur toute la prod Supabase (alerte sécurité fermée)

## Contexte
Courriel d'alerte sécurité Supabase (advisors) sur le projet **SAFE - CA
`rsblxmmqlnywcjxztebu`** : `rls_disabled_in_public` + `sensitive_columns_exposed`.
Cause : le schéma `public` est exposé via l'API REST auto de Supabase, accessible
avec la clé publique livrée dans le frontend. Sans RLS = lecture/écriture/suppression
possibles par n'importe qui avec l'URL du projet.

## Vérifications avant correctif
- Accès aux données = **100 % Prisma** (`DATABASE_URL`, rôle `postgres` propriétaire,
  qui contourne RLS). **Zéro appel `.from()`** via le client Supabase dans le code.
- Client Supabase = **uniquement Realtime broadcast** (support widget,
  `lib/support/realtime-browser.ts`). Ne touche aucune table -> RLS sans impact.
- Conclusion : activer RLS sur toutes les tables ferme la faille sans rien casser.

## Piège rencontré
- `.env.local` pointe vers la base **locale** (`safe_local`), pas la prod. Normal.
- `.vercel/.env.production.local` (daté 3 avril) était **périmé** : référençait
  `wraehwnveopiyumwurzy` et `nhiorvnljwmdyiedkkdd`. Ne pas s'y fier.
- La vraie config prod (pull Vercel frais) confirme `DATABASE_URL`/`DIRECT_URL`/
  `POSTGRES_URL` -> `rsblxmmqlnywcjxztebu`. Cohérent avec le réalignement de juillet.

## Correctif appliqué
Via `DIRECT_URL` prod (pooler port 5432, rôle postgres) :
```sql
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public'
  LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP; END $$;
```
Résultat : 95 tables sans RLS -> **0**. 95 tables avec RLS. Aucune policy ajoutée
(RLS sans policy = accès API refusé, comportement voulu ici).

## À surveiller
1. **Nouvelles tables Prisma** : RÉGLÉ. Script `scripts/secure-rls.mjs`
   (`npm run secure:rls`, idempotent) créé et câblé dans `scripts/vercel-build.mjs`
   juste après `prisma migrate deploy` (allowFailure, loggue les tables non
   sécurisées). Chaque déploiement Vercel réactive donc RLS sur toute nouvelle
   table. Testé local : 98 tables sécurisées puis « rien à faire » au 2e run.
2. **Incohérence `SUPABASE_URL`** : prod pointe encore vers `nhiorvnljwmdyiedkkdd`
   alors que Prisma/DB = `rsblxmmqlnywcjxztebu`. Le client Realtime tape donc un
   AUTRE projet Supabase que la base. À investiguer séparément (hors périmètre du
   correctif RLS).
