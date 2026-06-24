-- Phase 5 : connexion des modules à la navette.
-- Migration strictement ADDITIVE (nouvelles valeurs d'enum + colonne nullable),
-- rétro-compatible, à déployer AVANT le code qui émet ces nouveaux signaux.

ALTER TYPE "NavetteMessageType" ADD VALUE IF NOT EXISTS 'document_ready';
ALTER TYPE "NavetteMessageType" ADD VALUE IF NOT EXISTS 'invoice_ready';
ALTER TYPE "NavetteMessageType" ADD VALUE IF NOT EXISTS 'acte_urgent';

ALTER TABLE "DossierNavetteMessage" ADD COLUMN IF NOT EXISTS "sourceRef" TEXT;
