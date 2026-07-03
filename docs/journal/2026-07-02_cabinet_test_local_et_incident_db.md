# 2026-07-02 — Cabinet test local + découverte incident base de données

## Demande
Créer un cabinet test au nom du CEO, avec ses identifiants, pour tester l'interface,
avec exactement le même profil de cabinet que Me Dérisier.

## Buildé
- Nouveau script `scripts/seed-test-cabinet.mjs` : clone le **profil de configuration**
  de Dérisier (interface, modules, disciplines, checklists, forfaits, débours, taxonomie,
  conformité LSO/fiducie) dans un cabinet neuf « Cabinet Test », idempotent.
  - Identité NON clonée volontairement : pas de n° de Barreau réel, pas de n° TPS/TVH réels
    (ne doivent pas apparaître sur un cabinet test). Zéro donnée client/dossier réelle.
  - Admin unique = login CEO. `stripeSubscriptionStatus: "active"` en dur pour contourner
    le mur d'abonnement (`lib/services/subscription-state.ts`) et accéder à l'interface.
- Identifiants (page `/connexion`) :
  - Nom du cabinet : `Cabinet Test`
  - Email : `keassahatd+test@gmail.com` (distinct de keassahatd@gmail.com déjà pris par le
    cabinet « SAFE » ; le login résout par email d'abord, donc réutiliser l'email = conflit)
  - Mot de passe : `CabinetTest2026!`

## Décidé
- Base 100 % **locale** (Postgres 16 homebrew, DB `safe_local`) plutôt que le cloud, car
  aucun identifiant cloud valide n'était disponible. `.env` et `.env.local` repointés en local
  (anciennes valeurs conservées en commentaire + backups `.env.bak.claude`, `.env.local.bak.claude`).
- Schéma construit via `prisma db push`. Cabinet seedé. Connexion vérifiée bout en bout
  dans le navigateur : login OK → `/tableau-de-bord` s'affiche.

## Observé (INCIDENT DB — à traiter)
Split-brain de configuration base de données, cause probable de l'« incident P0 connexion » :
- `.env` / `.env.local` (dev) → projet Supabase **`rsblxmmqlnywcjxztebu`** : projet VIVANT
  (le pooler répond) mais **mot de passe périmé**. Détail : `.env` a `Jesuisjeremie`,
  `.env.local` a `Jesuisjeremietiahou333` (ce dernier n'a PAS été testé contre le cloud,
  il est peut-être encore valide).
- Vercel **prod ET dev ET preview** → variables `POSTGRES_*` + `NEXT_PUBLIC_SUPABASE_URL`
  pointent vers projet **`nhiorvnljwmdyiedkkdd`** qui **n'existe plus** (NXDOMAIN,
  « tenant not found »). Donc l'app **déployée ne peut pas joindre sa base**.
- `DATABASE_URL` / `DIRECT_URL` sont **vides** dans l'env Vercel prod.

À trancher avec le CEO : quel projet Supabase est canonique aujourd'hui, puis réaligner
les env vars Vercel (prod/preview/dev) et locales dessus.

## Pour revenir au cloud plus tard
Restaurer : `cp .env.bak.claude .env && cp .env.local.bak.claude .env.local`
(puis mettre le bon mot de passe Supabase). Postgres local : `brew services stop postgresql@16`.
