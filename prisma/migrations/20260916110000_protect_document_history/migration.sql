-- Conservation : aucune suppression de données, seulement des contraintes plus strictes.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE "RichDocument" DROP CONSTRAINT "RichDocument_cabinetId_fkey";
ALTER TABLE "RichDocument" ADD CONSTRAINT "RichDocument_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RichDocument" DROP CONSTRAINT "RichDocument_dossierId_fkey";
ALTER TABLE "RichDocument" ADD CONSTRAINT "RichDocument_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RichDocumentVersion" DROP CONSTRAINT "RichDocumentVersion_richDocumentId_fkey";
ALTER TABLE "RichDocumentVersion" ADD CONSTRAINT "RichDocumentVersion_richDocumentId_fkey" FOREIGN KEY ("richDocumentId") REFERENCES "RichDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkSession" DROP CONSTRAINT "WorkSession_cabinetId_fkey";
ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkSession" DROP CONSTRAINT "WorkSession_dossierId_fkey";
ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Document" DROP CONSTRAINT "Document_cabinetId_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;
