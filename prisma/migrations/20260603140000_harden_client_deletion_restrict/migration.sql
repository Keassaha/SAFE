-- Conformité Barreau (B-1 r.5) : empêcher la destruction en cascade des
-- registres d'un client (factures, fidéicommis, documents, dossiers...).
-- Les relations Client -> entités enfants passent de ON DELETE CASCADE à
-- ON DELETE RESTRICT : la base refuse désormais de supprimer un client qui
-- possède des enregistrements. La suppression applicative archive déjà le
-- client (soft delete) ; cette migration est le filet de sécurité au niveau DB.
--
-- Migration CHIRURGICALE : ne touche QUE les clés étrangères clientId.
-- N'inclut volontairement aucune autre modification (la base présente une
-- dérive non liée — table DossierNavetteMessage, index — à traiter séparément).
--
-- Application recommandée : exécuter ce SQL dans l'éditeur SQL Supabase, ou
-- via `psql "$DIRECT_URL" -f migration.sql`. Vérifier d'abord en transaction.

BEGIN;

-- Dossier
ALTER TABLE "Dossier" DROP CONSTRAINT "Dossier_clientId_fkey";
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Invoice
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_clientId_fkey";
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- InvoiceSendLog
ALTER TABLE "InvoiceSendLog" DROP CONSTRAINT "InvoiceSendLog_clientId_fkey";
ALTER TABLE "InvoiceSendLog" ADD CONSTRAINT "InvoiceSendLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- TrustAccount
ALTER TABLE "TrustAccount" DROP CONSTRAINT "TrustAccount_clientId_fkey";
ALTER TABLE "TrustAccount" ADD CONSTRAINT "TrustAccount_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- TrustTransaction
ALTER TABLE "TrustTransaction" DROP CONSTRAINT "TrustTransaction_clientId_fkey";
ALTER TABLE "TrustTransaction" ADD CONSTRAINT "TrustTransaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreditNote
ALTER TABLE "CreditNote" DROP CONSTRAINT "CreditNote_clientId_fkey";
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- BillingRun
ALTER TABLE "BillingRun" DROP CONSTRAINT "BillingRun_clientId_fkey";
ALTER TABLE "BillingRun" ADD CONSTRAINT "BillingRun_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ClientIdentityVerification
ALTER TABLE "ClientIdentityVerification" DROP CONSTRAINT "ClientIdentityVerification_clientId_fkey";
ALTER TABLE "ClientIdentityVerification" ADD CONSTRAINT "ClientIdentityVerification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Document
ALTER TABLE "Document" DROP CONSTRAINT "Document_clientId_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Expense
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_clientId_fkey";
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DeboursDossier
ALTER TABLE "DeboursDossier" DROP CONSTRAINT "DeboursDossier_clientId_fkey";
ALTER TABLE "DeboursDossier" ADD CONSTRAINT "DeboursDossier_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ConsentLog
ALTER TABLE "ConsentLog" DROP CONSTRAINT "ConsentLog_clientId_fkey";
ALTER TABLE "ConsentLog" ADD CONSTRAINT "ConsentLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DossierReadyForReviewSignal
ALTER TABLE "DossierReadyForReviewSignal" DROP CONSTRAINT "DossierReadyForReviewSignal_clientId_fkey";
ALTER TABLE "DossierReadyForReviewSignal" ADD CONSTRAINT "DossierReadyForReviewSignal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DossierDocketEntry
ALTER TABLE "DossierDocketEntry" DROP CONSTRAINT "DossierDocketEntry_clientId_fkey";
ALTER TABLE "DossierDocketEntry" ADD CONSTRAINT "DossierDocketEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RichDocument
ALTER TABLE "RichDocument" DROP CONSTRAINT "RichDocument_clientId_fkey";
ALTER TABLE "RichDocument" ADD CONSTRAINT "RichDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- WorkSession
ALTER TABLE "WorkSession" DROP CONSTRAINT "WorkSession_clientId_fkey";
ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
