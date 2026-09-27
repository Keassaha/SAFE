# Revue des migrations en attente — septembre 2026

> Établie le 2026-09-27, avant la mise en ligne de la branche
> `feat/refonte-vitrine-et-dossier` (35 commits d'avance sur `main`).
> Document opposable : aucune migration ne part sans que sa ligne de contrôle
> soit cochée.

---

## 0. Portée réelle

**Cinq migrations**, pas sept. Les deux du 14 septembre
(`entree_client_declarations`, `remise_en_coherence_derive`) sont **déjà sur
`main`** et donc déjà parties.

| # | Migration | Nature | Risque |
|---|---|---|---|
| 1 | `20260904115900_source_lead_site_web` | valeur d'enum | **faible** |
| 2 | `20260904120000_demande_site` | table neuve | **faible** |
| 3 | `20260916090000_reprise_historique_factures` | 3 colonnes | **faible** |
| 4 | `20260916110000_protect_document_history` | 6 contraintes Cascade → Restrict | **ÉLEVÉ** |
| 5 | `20260916160000_empreinte_unique_facture_reprise` | index unique partiel | **MOYEN** |

Ordre imposé par les horodatages, et il est correct : la valeur d'enum (1)
précède la table qui s'en sert (2).

---

## 1. `source_lead_site_web` — faible

```sql
ALTER TYPE "SourceLead" ADD VALUE IF NOT EXISTS 'SITE_WEB';
```

Seule dans sa migration exprès. Postgres refuse d'**employer** une valeur
d'enum ajoutée dans la même transaction ; la garder à part met la table
`DemandeSite`, qui suit, hors de portée du piège.

`ADD VALUE` à l'intérieur d'une transaction demande **Postgres 12 ou plus**.
Local : 16.14. À confirmer côté production (contrôle P1 ci-dessous).

**Retour arrière** : aucun. Une valeur d'enum ne se retire pas en Postgres.
C'est sans conséquence : une valeur inutilisée ne coûte rien.

---

## 2. `demande_site` — faible

Deux types neufs, une table neuve, cinq index, une clé étrangère vers `Lead`
en `ON DELETE SET NULL`. **Aucune colonne existante touchée, aucune donnée
réécrite.**

**Retour arrière** :
```sql
DROP TABLE "DemandeSite";
DROP TYPE "DemandeSiteType";
DROP TYPE "DemandeSiteStatut";
```

---

## 3. `reprise_historique_factures` — faible

```sql
ALTER TABLE "Invoice"  ADD COLUMN "estReprise"   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Payment"  ADD COLUMN "estReprise"   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Document" ADD COLUMN "dateDocument" TIMESTAMP(3);
```

Depuis Postgres 11, `ADD COLUMN ... DEFAULT` ne réécrit pas la table : c'est
une opération de métadonnées, instantanée quelle que soit la taille.

**Retour arrière** : `ALTER TABLE ... DROP COLUMN ...` sur les trois. Perd les
marques de reprise, rien d'autre.

---

## 4. `protect_document_history` — ÉLEVÉ

Six clés étrangères passent de `CASCADE` à `RESTRICT` :

| Table | Colonne | Effet nouveau |
|---|---|---|
| `RichDocument` | `cabinetId` | un cabinet ne part plus en emportant ses documents |
| `RichDocument` | `dossierId` | un dossier non plus |
| `RichDocumentVersion` | `richDocumentId` | une version ne disparaît plus avec son document |
| `WorkSession` | `cabinetId` | |
| `WorkSession` | `dossierId` | |
| `Document` | `cabinetId` | |

### Pourquoi c'est le risque principal

**Ce n'est pas une migration de schéma, c'est un changement de comportement.**
Après elle, toute suppression d'un `Cabinet`, d'un `Dossier` ou d'un
`RichDocument` qui porte encore des enfants **échoue** au lieu de les emporter.
C'est exactement l'effet voulu — on ne veut plus qu'un dossier parte en
silence avec ses pièces — mais tout code qui supprimait dans le mauvais ordre
cesse de fonctionner.

### Ce qui casse, vérifié

`scripts/reset-derisier-cabinet.ts` supprime dans cet ordre :

| Ligne | Opération | Après la migration |
|---|---|---|
| 101 | `dossier.deleteMany` | **échoue** : `RichDocument` (129) et `WorkSession` (189) référencent encore ces dossiers |
| 117 | `client.deleteMany` | **échoue** : mêmes tables, plus `Document` (121) |

À noter : ce script était **déjà** fragile avant cette migration, car
`Document.dossierId` est en `RESTRICT` depuis le 2026-07-28. Il n'a
probablement jamais été rejoué sur un cabinet portant des documents.

**Correctif** : remonter `document`, `richDocumentVersion`, `richDocument` et
`workSession` AVANT `dossier` et `client`. Quatre lignes à déplacer, aucune
logique à changer. **À faire avant de déployer**, sinon le prochain reset du
cabinet de démonstration échoue à mi-parcours et laisse le cabinet à moitié
vidé.

### Deux défauts de forme de la migration elle-même

1. **`DROP CONSTRAINT` sans `IF EXISTS`.** Si une contrainte porte un autre nom
   en production (dérive), la migration échoue et annule tout. C'est le bon
   comportement — un échec bruyant vaut mieux qu'un silence — mais ça veut dire
   qu'il faut avoir vérifié les six noms AVANT (contrôle P2).
2. **`ADD CONSTRAINT ... FOREIGN KEY` valide les lignes existantes** et prend un
   verrou exclusif sur les six tables. `SET LOCAL lock_timeout = '5s'` est déjà
   là, c'est bien. À notre volume, l'opération est instantanée ; sur une grosse
   table il faudrait le patron `NOT VALID` puis `VALIDATE CONSTRAINT`.

**Retour arrière** : rejouer les six `DROP` / `ADD` avec `ON DELETE CASCADE`.
Le fichier donne la forme exacte, il suffit de changer le mot.

---

## 5. `empreinte_unique_facture_reprise` — MOYEN

```sql
CREATE UNIQUE INDEX IF NOT EXISTS "Document_reprise_empreinte_unique"
  ON "Document" ("cabinetId", "hash")
  WHERE "documentType" = 'facture_passee_source' AND "hash" IS NOT NULL;
```

### Le risque : elle échoue si des doublons existent déjà

C'est arrivé en local le 2026-09-16 : la création de l'index a **révélé** sept
paires de doublons. C'est sa vertu, mais en production ça se traduit par un
déploiement qui s'arrête. Le type `facture_passee_source` n'ayant jamais été
déployé, la table devrait être vide de ces lignes — **à vérifier, pas à
supposer** (contrôle P3).

### Le piège à retenir

**Prisma ne sait pas exprimer un index partiel.** Cet index vit en SQL brut, et
`prisma migrate diff` voudra le supprimer à chaque fois qu'il comparera le
schéma à la base. Ne jamais accepter ce `DROP INDEX` dans une migration
générée. Voir `project_derive_migrations_prisma`.

`CREATE UNIQUE INDEX` sans `CONCURRENTLY` bloque les écritures sur `Document`
le temps de la construction : négligeable à notre volume, à revoir au-delà de
quelques centaines de milliers de lignes.

**Retour arrière** : `DROP INDEX "Document_reprise_empreinte_unique";`

---

## 6. Contrôles à passer sur la PRODUCTION, avant

À exécuter en lecture seule sur la base de production. Aucun ne modifie quoi
que ce soit.

**P1 — la version de Postgres permet `ALTER TYPE` en transaction**
```sql
SHOW server_version;   -- doit être >= 12
```

**P2 — les six contraintes portent bien les noms que la migration va déposer**
```sql
SELECT conrelid::regclass AS "table", conname, confdeltype
FROM pg_constraint
WHERE conname IN (
  'RichDocument_cabinetId_fkey', 'RichDocument_dossierId_fkey',
  'RichDocumentVersion_richDocumentId_fkey',
  'WorkSession_cabinetId_fkey', 'WorkSession_dossierId_fkey',
  'Document_cabinetId_fkey'
);
-- six lignes attendues. confdeltype = 'c' (cascade) aujourd'hui, 'r' après.
-- MOINS de six lignes = dérive : arrêter, la migration échouera.
```

**P3 — aucun doublon ne bloquera l'index unique**
```sql
SELECT "cabinetId", "hash", COUNT(*)
FROM "Document"
WHERE "documentType" = 'facture_passee_source' AND "hash" IS NOT NULL
GROUP BY 1, 2 HAVING COUNT(*) > 1;
-- zéro ligne attendue.
```

**P4 — l'historique des migrations de la production correspond au dépôt**
```bash
npx prisma migrate status --schema prisma/schema.prisma
# avec DATABASE_URL pointant sur la production.
# Attendu : les 5 migrations en « pending », aucune « failed », aucune inconnue.
```

**P5 — le vrai écart entre le dépôt et la production**
```bash
npx prisma migrate diff \
  --from-url "$DATABASE_URL_PROD" \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```
> `--from-migrations` compare le dépôt avec lui-même et ne voit rien de la
> production. **Seul `--from-url` lit la vraie base.** Piège documenté dans
> `project_derive_migrations_prisma`.

---

## 7. Ordre de mise en ligne

Les migrations sont la **quatrième** marche, pas la première.

1. **Rotation du mot de passe de base.** Il a été retiré des journaux, ce qui
   n'est pas une rotation : il reste dans l'historique Git.
2. **Sauvegarde indépendante, vérifiée.** Pas « la sauvegarde automatique
   existe » : un fichier qu'on a téléchargé et dont on a vu la taille.
3. **Essai de restauration.** Sur une base jetable. Une sauvegarde jamais
   restaurée n'est pas une sauvegarde.
4. **Correctif du script de reset** (§4), qui casse sinon.
5. **Contrôles P1 à P5.**
6. **`prisma migrate deploy`**, jamais `migrate dev`.
7. **Vérification après** : les six contraintes en `confdeltype = 'r'`, l'index
   partiel présent, un dépôt de facture passée qui fonctionne bout en bout.

---

## 8. Ce que cette revue ne couvre pas

- **Je n'ai pas interrogé la production.** Tout ce qui précède est établi
  depuis le dépôt et la base locale. Les contrôles P1 à P5 sont écrits pour
  être passés par vous, sur la vraie base, et peuvent contredire ce document.
- **L'écran de correction des exercices précédents** n'a jamais été ouvert dans
  un navigateur.
- **L'extraction n'a jamais vu de pièce difficile** : scan de travers, photo au
  téléphone, note manuscrite.
