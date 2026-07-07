# 2026-07-07 — Garde-fou dérive schéma Prisma <-> migrations

## Contexte
Le 2026-07-06, un P0 a cassé le login de tous les cabinets en prod : le commit
`5fefd57` avait ajouté des colonnes à `prisma/schema.prisma`
(`Cabinet.stripeConnectAccountId`, `stripeConnectChargesEnabled`) sans générer de
migration. `migrate deploy` n'a donc rien appliqué, la base prod n'a jamais reçu
les colonnes, et `prisma.user.findFirst({ include: { cabinet: true } })` plantait.

## Buildé
Commit `f6ef099` (branche `claude/eager-cerf-bf4456`, non poussé).

1. **`scripts/vercel-build.mjs`** — après `prisma migrate deploy` et avant
   `next build`, diff base réelle <-> schéma via
   `prisma migrate diff --from-url $DIRECT_URL --to-schema-datamodel prisma/schema.prisma --exit-code`.
   Exit 2 (dérive) ou échec de la vérif => build cassé. Utilise `--from-url` (pas
   `--from-migrations`, qui exigerait un shadow DB absent du build Vercel).
2. **`package.json`** — `db:check` (dev, sans shadow DB, contre `$DIRECT_URL`) et
   `db:check:strict` (`--from-migrations` + `$SHADOW_DATABASE_URL`, pour CI).
3. **`.github/workflows/prisma-schema-guard.yml`** — sur toute PR touchant
   `prisma/**`, rejoue les migrations dans un Postgres 16 jetable et lance
   `db:check:strict`. Bloque la dérive avant même Vercel.

## Vérifié
- Contre `safe_local` : aligné => exit 0 ; colonne fantôme sans migration => exit 2.
- `node --check scripts/vercel-build.mjs` OK ; `schema.prisma` inchangé après tests.

## Décisions
- Objectif « migrate deploy dans le pipeline » : déjà en place (ligne 73 d'origine).
- Fail-closed : base injoignable au moment de la vérif => build cassé (post-incident).

## Reste / à décider
- Pousser la branche + ouvrir la PR (déclenchement laissé au CEO).
- Aucun `.github/workflows` n'existait avant : ce workflow est le premier CI du repo.
