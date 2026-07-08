# Incident P0 — Login prod cassé pour tous les cabinets (drift Stripe Connect)

**Date** : 2026-07-06
**Sévérité** : P0 (production, tous les cabinets bloqués, dont le vrai client Derisier Law)
**Statut** : RÉSOLU

## Symptôme

Connexion impossible sur safecabinet.ca. L'écran affiche « Nom du cabinet, courriel ou mot de passe incorrect. » même avec des identifiants corrects (cabinet test `keassahatd+test@gmail.com` / `CabinetTest2026!`).

## Diagnostic (confirmé sur la prod en direct)

- Identifiants **corrects** : vérifié contre la vraie base prod (`rsblxmmqlnywcjxztebu`). Le cabinet « Cabinet Test » existe, le courriel existe, `bcrypt.compare("CabinetTest2026!")` = `true`, nom du cabinet correspond.
- Rejeu de la connexion sur l'endpoint prod : avec le bon **comme** avec un mauvais mot de passe, le serveur renvoie la même erreur Prisma :
  `The column Cabinet.stripeConnectAccountId does not exist in the current database.`
- Le login fait `prisma.user.findFirst({ include: { cabinet: true } })` dans `lib/auth.ts`. La requête plante **avant** la vérification du mot de passe → message générique affiché.

## Cause racine

Commit `5fefd57` (« feat(paiement): fondation paiement facture en ligne — Connect + garde-fous (ADR-012, lot 1) », 2026-07-04) a ajouté deux colonnes au modèle `Cabinet` dans `schema.prisma` :
- `stripeConnectAccountId String? @unique`
- `stripeConnectChargesEnabled Boolean @default(false)`

**Aucune migration Prisma n'a été générée** pour ce changement. La branche a été déployée en prod, mais la base prod n'a jamais reçu les colonnes → tout `include: { cabinet: true }` plante. La prod utilise `prisma migrate deploy` (25 migrations trackées) : sans fichier de migration, les colonnes ne pouvaient pas arriver.

## Correctif appliqué

1. **Hotfix prod (additif, réversible)** :
   ```sql
   ALTER TABLE "Cabinet" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" TEXT;
   ALTER TABLE "Cabinet" ADD COLUMN IF NOT EXISTS "stripeConnectChargesEnabled" BOOLEAN NOT NULL DEFAULT false;
   CREATE UNIQUE INDEX IF NOT EXISTS "Cabinet_stripeConnectAccountId_key" ON "Cabinet"("stripeConnectAccountId");
   ```
2. **Vérification e2e** : POST sur `/api/auth/callback/credentials` en prod → bons identifiants = `302 → /` + `__Secure-next-auth.session-token` posé. Mauvais mot de passe = `CredentialsSignin` propre. Login rétabli pour les 6 cabinets.
3. **Anti-récidive** : création du fichier de migration manquant `prisma/migrations/20260704101300_add_stripe_connect/migration.sql` + `prisma migrate resolve --applied` sur la prod (colonnes déjà présentes, on marque seulement l'historique).

## Reste à traiter (hors périmètre incident, non bloquant login)

- `20260706140000_add_expense_receipt` **en attente** en prod : la table ExpenseReceipt n'existe pas encore en prod, la feature d'import de reçu de dépense planterait. À déployer via `migrate deploy`.
- Doublon cosmétique `20250309180000_init` dans `_prisma_migrations` prod (quirk d'historique legacy).
- Le fichier de migration `20260704101300_add_stripe_connect/` est **non commité** (branche `release/2026-06-11-compta-admin-derisier`). À committer pour protéger dev + futurs déploiements.

## Leçon

Un changement de `schema.prisma` sans `prisma migrate dev` génère une divergence invisible qui casse la prod au prochain déploiement. Garde-fou à envisager : bloquer le déploiement si `migrate status` signale une divergence schéma/migrations.

## Suite — 2026-07-07 : le garde-fou attrape une 2e dérive

Le garde-fou de déploiement (branche `claude/eager-cerf-bf4456`, commit f6ef099 : `migrate diff --from-url <db> --to-schema-datamodel --exit-code` dans `scripts/vercel-build.mjs` + workflow `.github/workflows/prisma-schema-guard.yml`) a **fait son travail** au premier build : il a bloqué le déploiement en détectant une 2e dérive schéma sans migration :
- `Payment.provider` / `Payment.providerRef` + index unique `(cabinetId, providerRef)` (import Interac L4/L5, commit 30daac9) absents en prod.
- `DossierDocketEntry.updatedAt` avec un `default now()` parasite (dérive mineure pré-existante).

Effet de bord positif : ce même build a appliqué la migration en attente `20260706140000_add_expense_receipt` en prod.

Correctif : migration `20260707100000_add_payment_provider_ref_and_docket_default` créée à partir du diff exact (prod → schéma), appliquée + vérifiée en prod (`migrate diff --exit-code` = 0). Les 2 fichiers de migration (`add_stripe_connect` + reconciliation) commités (release `c941b1a`, cherry-pick eager-cerf `57846ae`), poussés. Rebuild `safe-a33t48l1e` = **Ready**, log « Garde-fou schéma : base et prisma/schema.prisma alignés. »

Bilan : le garde-fou transforme une classe de bug « invisible jusqu'au crash prod » en « build rouge avant déploiement ». Il fonctionne.
