-- Unicité du numéro de facture par cabinet.
--
-- Doctrine: docs/accounting/SAFE_ACCOUNTING_DOCTRINE.md
--
-- Garantit qu'un même cabinet ne peut pas émettre deux factures avec le
-- même `numero`, même sous concurrence forte. Combiné avec l'advisory lock
-- `pg_advisory_xact_lock(hashtext('invoice-numero:<cabinetId>:<year>'))`
-- dans `lib/facturation/numero-facture.ts`, cela élimine la fenêtre de
-- collision où deux transactions concurrentes pouvaient lire le même
-- `count()` et insérer le même numéro.
--
-- Tout INSERT qui violerait cette contrainte lèvera une erreur Prisma
-- P2002 (cabinetId, numero). À l'usage normal — toutes les créations
-- passent par `getNextInvoiceNumero(cabinetId, tx)` — la contrainte ne
-- sera jamais déclenchée. Elle reste un filet de sécurité contre tout
-- chemin futur qui contournerait le helper.

CREATE UNIQUE INDEX "Invoice_cabinetId_numero_key"
  ON "Invoice" ("cabinetId", "numero");
