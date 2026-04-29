-- Idempotence structurelle du journal général.
--
-- Doctrine: docs/accounting/SAFE_ACCOUNTING_DOCTRINE.md §4
--
-- Garantit qu'aucune écriture ne peut exister deux fois pour un même
-- (cabinetId, sourceModule, sourceId) lorsque sourceId est défini.
--
-- L'index est PARTIEL: il ne s'applique qu'aux lignes ayant sourceId NOT NULL.
-- Les lignes sans sourceId (ajustements manuels libres, corrections
-- ad-hoc) restent autorisées à coexister sans contrainte.
--
-- Prisma 6.x ne sait pas déclarer un @@unique partiel; l'index est donc
-- maintenu hors-Prisma. Le schema porte un commentaire qui rappelle son
-- existence afin d'éviter toute évolution qui le casserait silencieusement.
--
-- Tout INSERT qui violerait cette contrainte lèvera une erreur Prisma
-- P2002. Les helpers `lib/services/journal/cabinet-expense-journal.ts`
-- et `lib/services/journal/debours-dossier-journal.ts` la transforment
-- en réponse `{ created: false, reason: "already_journalized" }`.

CREATE UNIQUE INDEX "JournalGeneralEntry_idempotency_key"
  ON "journal_general" ("cabinetId", "sourceModule", "sourceId")
  WHERE "sourceId" IS NOT NULL;
