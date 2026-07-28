-- Protection des dossiers clients contre la suppression en cascade.
--
-- Contexte : audit de sécurité 2026-07-28 (docs/security/AUDIT_SECURITE_2026-07-28.md, §C2).
-- Les pièces, les heures et les documents rédigés étaient rattachés à `User` en
-- ON DELETE CASCADE. Supprimer un compte détruisait donc, en une requête et sans
-- trace, des pièces soumises à la rétention Barreau de 10 ans (B-1 r.5) et des
-- heures facturables non facturées. La cascade Postgres contournait entièrement le
-- garde-fou applicatif `DocumentRetentionError` (lib/services/document.ts) et
-- laissait les objets Vercel Blob orphelins.
--
-- Correctif : RESTRICT. Postgres refuse désormais la suppression tant que des
-- enregistrements existent. Le retrait d'un employé passe par la désactivation
-- (`Employee.status = 'inactive'`), déjà vérifiée à l'authentification.
--
-- Purement additive : aucune donnée lue, écrite ni supprimée. Seules les règles
-- de contrainte changent. Réversible en rejouant les CASCADE d'origine.

-- Document : pièces du dossier client (rétention 10 ans)
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_uploadedById_fkey";
ALTER TABLE "Document"
  ADD CONSTRAINT "Document_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_dossierId_fkey";
ALTER TABLE "Document"
  ADD CONSTRAINT "Document_dossierId_fkey"
  FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- TimeEntry : heures facturables
ALTER TABLE "TimeEntry" DROP CONSTRAINT IF EXISTS "TimeEntry_userId_fkey";
ALTER TABLE "TimeEntry"
  ADD CONSTRAINT "TimeEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RichDocument + versions : documents rédigés dans l'éditeur
ALTER TABLE "RichDocument" DROP CONSTRAINT IF EXISTS "RichDocument_createdById_fkey";
ALTER TABLE "RichDocument"
  ADD CONSTRAINT "RichDocument_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RichDocumentVersion" DROP CONSTRAINT IF EXISTS "RichDocumentVersion_createdById_fkey";
ALTER TABLE "RichDocumentVersion"
  ADD CONSTRAINT "RichDocumentVersion_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DossierNavetteMessage : historique de la navette avocat / adjointe
ALTER TABLE "DossierNavetteMessage" DROP CONSTRAINT IF EXISTS "DossierNavetteMessage_authorId_fkey";
ALTER TABLE "DossierNavetteMessage"
  ADD CONSTRAINT "DossierNavetteMessage_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DossierActe : actes assignés (échéancier LexTrack)
ALTER TABLE "DossierActe" DROP CONSTRAINT IF EXISTS "DossierActe_assigneeId_fkey";
ALTER TABLE "DossierActe"
  ADD CONSTRAINT "DossierActe_assigneeId_fkey"
  FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- WorkSession : sessions de travail chronométrées
ALTER TABLE "WorkSession" DROP CONSTRAINT IF EXISTS "WorkSession_userId_fkey";
ALTER TABLE "WorkSession"
  ADD CONSTRAINT "WorkSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
