-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin_cabinet', 'avocat', 'assistante', 'comptabilite');

-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('ADMIN_ACCOUNTANT', 'LEAD_LAWYER', 'LAWYER', 'LEGAL_ASSISTANT', 'ACCOUNTING_TECHNICIAN', 'INTERN', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "PayrollFrequency" AS ENUM ('weekly');

-- CreateEnum
CREATE TYPE "PayrollPeriodStatus" AS ENUM ('draft', 'closed');

-- CreateEnum
CREATE TYPE "PayslipStatus" AS ENUM ('draft', 'generated', 'paid');

-- CreateEnum
CREATE TYPE "PayslipAdjustmentType" AS ENUM ('bonus', 'deduction', 'correction');

-- CreateEnum
CREATE TYPE "TypeClient" AS ENUM ('personne_physique', 'personne_morale');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('actif', 'inactif', 'archive');

-- CreateEnum
CREATE TYPE "PreferredContactMethod" AS ENUM ('email', 'phone', 'mail');

-- CreateEnum
CREATE TYPE "IdType" AS ENUM ('passport', 'driver_license', 'other');

-- CreateEnum
CREATE TYPE "RepresentationType" AS ENUM ('plaintiff', 'defendant', 'advisor');

-- CreateEnum
CREATE TYPE "PreferredPaymentMethod" AS ENUM ('card', 'transfer', 'trust', 'cheque');

-- CreateEnum
CREATE TYPE "DossierStatut" AS ENUM ('ouvert', 'actif', 'en_attente', 'cloture', 'archive');

-- CreateEnum
CREATE TYPE "DossierType" AS ENUM ('droit_famille', 'litige_civil', 'criminel', 'immigration', 'corporate', 'autre');

-- CreateEnum
CREATE TYPE "ModeFacturationDossier" AS ENUM ('horaire', 'forfait', 'retainer', 'contingent');

-- CreateEnum
CREATE TYPE "DossierTachePriorite" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "DossierTacheStatut" AS ENUM ('a_faire', 'en_cours', 'terminee', 'annulee');

-- CreateEnum
CREATE TYPE "DossierEvenementType" AS ENUM ('audience', 'reunion_client', 'echeance', 'depot', 'relance_facture');

-- CreateEnum
CREATE TYPE "LexTrackPhase" AS ENUM ('INSTRUCTION', 'MISE_EN_ETAT', 'PLAIDOIRIES', 'DELIBERE');

-- CreateEnum
CREATE TYPE "LexTrackActeType" AS ENUM ('analyse', 'acte', 'recherche', 'admin', 'audience', 'echeance');

-- CreateEnum
CREATE TYPE "LexTrackActeStatut" AS ENUM ('todo', 'inprogress', 'upcoming', 'done');

-- CreateEnum
CREATE TYPE "LexTrackPriorite" AS ENUM ('basse', 'moyenne', 'haute', 'critique');

-- CreateEnum
CREATE TYPE "TimeEntryStatut" AS ENUM ('brouillon', 'valide', 'facture');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('NON_BILLED', 'READY_TO_BILL', 'IN_DRAFT_INVOICE', 'BILLED', 'NON_BILLABLE', 'WRITTEN_OFF', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatut" AS ENUM ('brouillon', 'envoyee', 'partiellement_payee', 'payee', 'en_retard');

-- CreateEnum
CREATE TYPE "InvoiceStatusBilling" AS ENUM ('DRAFT', 'READY_TO_ISSUE', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'CREDITED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERPAID');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('UNALLOCATED', 'PARTIALLY_ALLOCATED', 'ALLOCATED', 'REVERSED');

-- CreateEnum
CREATE TYPE "IssueMethod" AS ENUM ('manual', 'generated_from_billing', 'recurring', 'trust_transfer');

-- CreateEnum
CREATE TYPE "InvoiceLineType" AS ENUM ('fee', 'expense', 'adjustment', 'interest', 'credit', 'trust_application');

-- CreateEnum
CREATE TYPE "InvoiceLineSourceType" AS ENUM ('time_entry', 'expense', 'debours_dossier', 'manual', 'interest_run', 'credit_note', 'trust');

-- CreateEnum
CREATE TYPE "CreditNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_APPLIED', 'FULLY_APPLIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('reminder_1', 'reminder_2', 'final_notice', 'interest_notice');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('email', 'manual', 'printed');

-- CreateEnum
CREATE TYPE "TrustTransactionTypeBilling" AS ENUM ('deposit', 'withdrawal', 'transfer_to_invoice', 'correction', 'refund');

-- CreateEnum
CREATE TYPE "SourceAccountType" AS ENUM ('operating', 'trust', 'external');

-- CreateEnum
CREATE TYPE "PaymentMethodBilling" AS ENUM ('cash', 'cheque', 'e_transfer', 'card', 'bank_transfer', 'trust', 'other');

-- CreateEnum
CREATE TYPE "BillingRunType" AS ENUM ('preview', 'draft_generation', 'final_generation');

-- CreateEnum
CREATE TYPE "MatterGroupMode" AS ENUM ('by_matter', 'by_client', 'mixed');

-- CreateEnum
CREATE TYPE "InvoiceItemType" AS ENUM ('honoraires', 'debours_taxable', 'debours_non_taxable', 'frais_rappel', 'interets', 'rabais');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('carte', 'virement', 'cheque', 'trust', 'autre');

-- CreateEnum
CREATE TYPE "TrustTransactionType" AS ENUM ('deposit', 'withdrawal', 'correction');

-- CreateEnum
CREATE TYPE "TrustModePaiement" AS ENUM ('CHEQUE', 'VIREMENT', 'INTERAC', 'ESPECES', 'AUTRE');

-- CreateEnum
CREATE TYPE "InvoiceReminderType" AS ENUM ('rappel_only', 'frais', 'frais_et_interets');

-- CreateEnum
CREATE TYPE "IdentityVerificationStatus" AS ENUM ('en_attente', 'verifie', 'refuse');

-- CreateEnum
CREATE TYPE "ExpenseJournalTransactionType" AS ENUM ('DEPENSE', 'CREDIT', 'IGNORE', 'TRANSFERT', 'AUTRE');

-- CreateEnum
CREATE TYPE "ExpenseJournalValidationStatus" AS ENUM ('NOUVEAU', 'PROPOSE', 'A_VALIDER', 'VALIDE', 'CORRIGE', 'IGNORE');

-- CreateEnum
CREATE TYPE "ExpenseCategorizationRuleSource" AS ENUM ('SYSTEM', 'USER');

-- CreateEnum
CREATE TYPE "JournalTransactionType" AS ENUM ('FACTURE', 'PAIEMENT', 'DEPOT_FIDEICOMMIS', 'RETRAIT_FIDEICOMMIS', 'DEBOURS', 'DEPENSE', 'AJUSTEMENT', 'CORRECTION');

-- CreateEnum
CREATE TYPE "JournalSourceModule" AS ENUM ('FACTURATION', 'PAIEMENTS', 'FIDEICOMMIS', 'DEPENSES', 'DEBOURS', 'IMPORT_BANCAIRE', 'AJUSTEMENT_MANUEL', 'CORRECTION_SYSTEME');

-- CreateEnum
CREATE TYPE "ImportHistoryStatus" AS ENUM ('success', 'partial', 'failed');

-- CreateEnum
CREATE TYPE "ImportHistorySource" AS ENUM ('safe_import', 'journal_depenses');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('rendez_vous_client', 'audience', 'reunion_interne', 'echeance', 'rappel', 'autre');

-- CreateEnum
CREATE TYPE "CalendarEventStatus" AS ENUM ('planifie', 'confirme', 'annule', 'termine');

-- CreateTable
CREATE TABLE "Cabinet" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "config" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cabinet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "defaultHourlyRate" DOUBLE PRECISION,
    "isBillable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'active',
    "role" "EmployeeRole" NOT NULL,
    "jobTitle" TEXT,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supervisorId" TEXT,
    "responsibilities" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPeriod" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "frequency" "PayrollFrequency" NOT NULL DEFAULT 'weekly',
    "status" "PayrollPeriodStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "hoursWorked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "grossPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PayslipStatus" NOT NULL DEFAULT 'draft',
    "paymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayslipAdjustment" (
    "id" TEXT NOT NULL,
    "payslipId" TEXT NOT NULL,
    "type" "PayslipAdjustmentType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayslipAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "typeClient" "TypeClient" NOT NULL DEFAULT 'personne_morale',
    "status" "ClientStatus" NOT NULL DEFAULT 'actif',
    "raisonSociale" TEXT NOT NULL,
    "prenom" TEXT,
    "nom" TEXT,
    "dateNaissance" TIMESTAMP(3),
    "numeroRegistreEntreprise" TEXT,
    "contact" TEXT,
    "email" TEXT,
    "emailSecondaire" TEXT,
    "telephone" TEXT,
    "telephoneSecondaire" TEXT,
    "adresse" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "preferredContactMethod" "PreferredContactMethod",
    "langue" TEXT,
    "nas" TEXT,
    "consentementCollecteAt" TIMESTAMP(3),
    "finalitesConsentement" TEXT,
    "dateVerificationIdentite" TIMESTAMP(3),
    "methodeVerificationIdentite" TEXT,
    "idType" "IdType",
    "idNumber" TEXT,
    "idExpiration" TIMESTAMP(3),
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationDate" TIMESTAMP(3),
    "retentionJusqua" TIMESTAMP(3),
    "notesConfidentielles" TEXT,
    "lawyerInChargeId" TEXT,
    "assignedLawyerId" TEXT,
    "assistantAssignedId" TEXT,
    "representationType" "RepresentationType",
    "retainerSigned" BOOLEAN NOT NULL DEFAULT false,
    "retainerDate" TIMESTAMP(3),
    "trustAccountBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustAccountId" TEXT,
    "allowTrustPayments" BOOLEAN NOT NULL DEFAULT false,
    "lastTrustTransactionDate" TIMESTAMP(3),
    "billingContactName" TEXT,
    "billingEmail" TEXT,
    "billingAddress" TEXT,
    "paymentTerms" TEXT,
    "preferredPaymentMethod" "PreferredPaymentMethod",
    "creditLimit" DOUBLE PRECISION,
    "clientCode" TEXT,
    "displayName" TEXT,
    "billingAddressLine1" TEXT,
    "billingAddressLine2" TEXT,
    "billingCity" TEXT,
    "billingProvince" TEXT,
    "billingPostalCode" TEXT,
    "billingCountry" TEXT,
    "languagePreference" TEXT,
    "paymentTermsDays" INTEGER,
    "defaultInterestRateAnnual" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conflictChecked" BOOLEAN NOT NULL DEFAULT false,
    "conflictCheckDate" TIMESTAMP(3),
    "conflictNotes" TEXT,
    "documentRefs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dossier" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "avocatResponsableId" TEXT,
    "assistantJuridiqueId" TEXT,
    "reference" TEXT,
    "numeroDossier" TEXT,
    "matterCode" TEXT,
    "intitule" TEXT NOT NULL,
    "statut" "DossierStatut" NOT NULL DEFAULT 'actif',
    "type" "DossierType",
    "descriptionConfidentielle" TEXT,
    "resumeDossier" TEXT,
    "notesStrategieJuridique" TEXT,
    "tribunalNom" TEXT,
    "districtJudiciaire" TEXT,
    "numeroDossierTribunal" TEXT,
    "nomJuge" TEXT,
    "modeFacturation" "ModeFacturationDossier",
    "tauxHoraire" DOUBLE PRECISION,
    "soldeFiducieDossier" DOUBLE PRECISION DEFAULT 0,
    "autoriserPaiementFiducie" BOOLEAN NOT NULL DEFAULT false,
    "dateOuverture" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateCloture" TIMESTAMP(3),
    "retentionJusqua" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierNote" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DossierNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierTache" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "priorite" "DossierTachePriorite" NOT NULL DEFAULT 'medium',
    "statut" "DossierTacheStatut" NOT NULL DEFAULT 'a_faire',
    "dateEcheance" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierTache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierEvenement" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "type" "DossierEvenementType" NOT NULL,
    "titre" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "lieu" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierEvenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierActe" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "phase" "LexTrackPhase" NOT NULL,
    "type" "LexTrackActeType" NOT NULL,
    "status" "LexTrackActeStatut" NOT NULL DEFAULT 'todo',
    "priority" "LexTrackPriorite" NOT NULL DEFAULT 'moyenne',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "tags" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierActe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "dossierId" TEXT,
    "clientId" TEXT,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dureeMinutes" INTEGER NOT NULL,
    "description" TEXT,
    "typeActivite" TEXT,
    "facturable" BOOLEAN NOT NULL DEFAULT true,
    "statut" "TimeEntryStatut" NOT NULL DEFAULT 'brouillon',
    "tauxHoraire" DOUBLE PRECISION NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "workDate" TIMESTAMP(3),
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "durationHours" DOUBLE PRECISION,
    "internalNote" TEXT,
    "hourlyRate" DOUBLE PRECISION,
    "feeAmount" DOUBLE PRECISION,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "billingStatus" "BillingStatus" DEFAULT 'NON_BILLED',
    "invoiceId" TEXT,
    "invoiceLineId" TEXT,
    "isWrittenOff" BOOLEAN NOT NULL DEFAULT false,
    "writeOffReason" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dossierId" TEXT,
    "numero" TEXT NOT NULL,
    "dateEmission" TIMESTAMP(3) NOT NULL,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "statut" "InvoiceStatut" NOT NULL DEFAULT 'brouillon',
    "invoiceStatus" "InvoiceStatusBilling" DEFAULT 'DRAFT',
    "montantTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantPaye" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotalTaxable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tps" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tvq" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deboursNonTaxableTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustApplied" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tauxInteret" DOUBLE PRECISION,
    "dateLimiteInterets" TIMESTAMP(3),
    "lastReminderDay" INTEGER,
    "lastInterestAppliedAt" TIMESTAMP(3),
    "validatedAt" TIMESTAMP(3),
    "validatedById" TEXT,
    "currency" TEXT DEFAULT 'CAD',
    "subtotalFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotalAdjustments" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotalInterest" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotalBeforeTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxGst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxQst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustAppliedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditAppliedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalInvoiceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPaidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interestAccrued" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentStatus" DEFAULT 'UNPAID',
    "issueMethod" "IssueMethod",
    "billingGroupKey" TEXT,
    "clientNote" TEXT,
    "internalNote" TEXT,
    "sentAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "timeEntryId" TEXT,
    "description" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "tauxUnitaire" DOUBLE PRECISION NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "lineType" "InvoiceLineType" DEFAULT 'fee',
    "sourceType" "InvoiceLineSourceType" DEFAULT 'manual',
    "sourceId" TEXT,
    "matterId" TEXT,
    "serviceDate" TIMESTAMP(3),
    "lineSubtotal" DOUBLE PRECISION,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lineTotal" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "validationComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "type" "InvoiceItemType" NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION NOT NULL,
    "userId" TEXT,
    "professionalDisplayName" TEXT,
    "timeEntryId" TEXT,
    "parentItemId" TEXT,
    "parentLineId" TEXT,
    "validationComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "clientId" TEXT,
    "invoiceId" TEXT,
    "montant" DOUBLE PRECISION NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL,
    "mode" TEXT,
    "method" "PaymentMethod" NOT NULL DEFAULT 'autre',
    "reference" TEXT,
    "paymentMethod" "PaymentMethodBilling" DEFAULT 'other',
    "referenceNumber" TEXT,
    "sourceAccountType" "SourceAccountType" DEFAULT 'operating',
    "allocationStatus" "AllocationStatus" NOT NULL DEFAULT 'UNALLOCATED',
    "note" TEXT,
    "receivedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "allocatedAmount" DOUBLE PRECISION NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceReminder" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "reminderDay" INTEGER,
    "type" "InvoiceReminderType",
    "reminderType" "ReminderType",
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "status" TEXT,
    "channel" "ReminderChannel",
    "amountFrais" DOUBLE PRECISION,
    "amountInterets" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustAccount" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "matterId" TEXT,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustTransaction" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "trustAccountId" TEXT,
    "clientId" TEXT NOT NULL,
    "dossierId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TrustTransactionType" NOT NULL,
    "transactionType" "TrustTransactionTypeBilling",
    "balanceAfter" DOUBLE PRECISION,
    "invoiceId" TEXT,
    "note" TEXT,
    "description" TEXT,
    "reference" TEXT,
    "modePaiement" "TrustModePaiement",
    "correctionOfId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditNote" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "creditNoteNumber" TEXT NOT NULL,
    "creditDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" "CreditNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotalCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qstCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "appliedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditNoteApplication" (
    "id" TEXT NOT NULL,
    "creditNoteId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "appliedAmount" DOUBLE PRECISION NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditNoteApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestCharge" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "calculationDate" TIMESTAMP(3) NOT NULL,
    "annualRate" DOUBLE PRECISION NOT NULL,
    "daysOverdue" INTEGER NOT NULL,
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "interestAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "invoiceLineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterestCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingRun" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "runType" "BillingRunType" NOT NULL,
    "clientId" TEXT NOT NULL,
    "matterGroupMode" "MatterGroupMode",
    "generatedInvoiceId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientIdentityVerification" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "methode" TEXT NOT NULL,
    "statut" "IdentityVerificationStatus" NOT NULL DEFAULT 'en_attente',
    "documentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientIdentityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "clientId" TEXT,
    "dossierId" TEXT,
    "documentType" TEXT,
    "nom" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "hash" TEXT,
    "uploadedById" TEXT NOT NULL,
    "retentionJusqua" TIMESTAMP(3),
    "templateCode" TEXT,
    "aiAssisted" BOOLEAN DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" TEXT,
    "oldValues" TEXT,
    "newValues" TEXT,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "matterId" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "vendorName" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "recoverable" BOOLEAN NOT NULL DEFAULT true,
    "billingStatus" "BillingStatus" NOT NULL DEFAULT 'NON_BILLED',
    "invoiceId" TEXT,
    "invoiceLineId" TEXT,
    "receiptUrl" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeboursType" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "description" TEXT,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "coutDefaut" DOUBLE PRECISION,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeboursType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeboursDossier" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "deboursTypeId" TEXT,
    "description" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "montant" DOUBLE PRECISION NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL,
    "payeParCabinet" BOOLEAN NOT NULL DEFAULT true,
    "refacturable" BOOLEAN NOT NULL DEFAULT true,
    "factureId" TEXT,
    "invoiceLineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeboursDossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "finalites" TEXT NOT NULL,
    "consentementAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "versionPolitique" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRetentionPolicy" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "retentionYears" INTEGER NOT NULL,
    "legalBasis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankImportSession" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedById" TEXT,
    "nbLignes" INTEGER NOT NULL DEFAULT 0,
    "nbDepensesDetectees" INTEGER NOT NULL DEFAULT 0,
    "nbAValider" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankImportSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankImportTransaction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "rawDescription" TEXT NOT NULL,
    "rawAmount" DOUBLE PRECISION NOT NULL,
    "rawType" TEXT,
    "rawBalance" DOUBLE PRECISION,
    "reference" TEXT,
    "normalizedSupplier" TEXT,
    "suggestedCategoryId" TEXT,
    "suggestedCategoryName" TEXT,
    "suggestedRefacturable" BOOLEAN,
    "suggestedDossierId" TEXT,
    "confidence" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'new',
    "cabinetExpenseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankImportTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CabinetExpense" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "transactionImportId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "descriptionBancaire" TEXT NOT NULL,
    "fournisseurNormalise" TEXT,
    "categoryId" TEXT,
    "categoryName" TEXT,
    "sousCategorie" TEXT,
    "montant" DOUBLE PRECISION NOT NULL,
    "montantHt" DOUBLE PRECISION,
    "tps" DOUBLE PRECISION,
    "tvq" DOUBLE PRECISION,
    "montantTtc" DOUBLE PRECISION,
    "typeTransaction" "ExpenseJournalTransactionType" NOT NULL DEFAULT 'DEPENSE',
    "dossierId" TEXT,
    "refacturable" BOOLEAN NOT NULL DEFAULT false,
    "statutValidation" "ExpenseJournalValidationStatus" NOT NULL DEFAULT 'NOUVEAU',
    "confidence" DOUBLE PRECISION,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CabinetExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategorizationRule" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "fournisseurNormalise" TEXT,
    "categoryName" TEXT NOT NULL,
    "categoryId" TEXT,
    "refacturable" BOOLEAN NOT NULL DEFAULT false,
    "dossierId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "source" "ExpenseCategorizationRuleSource" NOT NULL DEFAULT 'USER',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategorizationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_general" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "dateTransaction" TIMESTAMP(3) NOT NULL,
    "typeTransaction" "JournalTransactionType" NOT NULL,
    "reference" TEXT,
    "clientId" TEXT,
    "dossierId" TEXT,
    "description" TEXT NOT NULL,
    "categorie" TEXT,
    "montantEntree" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantSortie" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "solde" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sourceModule" "JournalSourceModule" NOT NULL,
    "sourceId" TEXT,
    "utilisateurId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_general_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportHistory" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "userId" TEXT,
    "source" "ImportHistorySource" NOT NULL DEFAULT 'safe_import',
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" "ImportHistoryStatus" NOT NULL DEFAULT 'success',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "CalendarEventType" NOT NULL DEFAULT 'rendez_vous_client',
    "status" "CalendarEventStatus" NOT NULL DEFAULT 'planifie',
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "clientId" TEXT,
    "dossierId" TEXT,
    "assigneeId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_cabinetId_idx" ON "Employee"("cabinetId");

-- CreateIndex
CREATE INDEX "Employee_cabinetId_status_idx" ON "Employee"("cabinetId", "status");

-- CreateIndex
CREATE INDEX "Employee_userId_idx" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_supervisorId_idx" ON "Employee"("supervisorId");

-- CreateIndex
CREATE INDEX "PayrollPeriod_cabinetId_idx" ON "PayrollPeriod"("cabinetId");

-- CreateIndex
CREATE INDEX "PayrollPeriod_cabinetId_periodStart_idx" ON "PayrollPeriod"("cabinetId", "periodStart");

-- CreateIndex
CREATE INDEX "Payslip_employeeId_idx" ON "Payslip"("employeeId");

-- CreateIndex
CREATE INDEX "Payslip_payrollPeriodId_idx" ON "Payslip"("payrollPeriodId");

-- CreateIndex
CREATE INDEX "PayslipAdjustment_payslipId_idx" ON "PayslipAdjustment"("payslipId");

-- CreateIndex
CREATE INDEX "Client_cabinetId_idx" ON "Client"("cabinetId");

-- CreateIndex
CREATE INDEX "Client_cabinetId_raisonSociale_idx" ON "Client"("cabinetId", "raisonSociale");

-- CreateIndex
CREATE INDEX "Client_cabinetId_status_idx" ON "Client"("cabinetId", "status");

-- CreateIndex
CREATE INDEX "Client_assignedLawyerId_idx" ON "Client"("assignedLawyerId");

-- CreateIndex
CREATE INDEX "Dossier_cabinetId_idx" ON "Dossier"("cabinetId");

-- CreateIndex
CREATE INDEX "Dossier_cabinetId_clientId_idx" ON "Dossier"("cabinetId", "clientId");

-- CreateIndex
CREATE INDEX "Dossier_cabinetId_statut_idx" ON "Dossier"("cabinetId", "statut");

-- CreateIndex
CREATE INDEX "Dossier_cabinetId_type_idx" ON "Dossier"("cabinetId", "type");

-- CreateIndex
CREATE INDEX "Dossier_avocatResponsableId_idx" ON "Dossier"("avocatResponsableId");

-- CreateIndex
CREATE INDEX "Dossier_assistantJuridiqueId_idx" ON "Dossier"("assistantJuridiqueId");

-- CreateIndex
CREATE UNIQUE INDEX "Dossier_cabinetId_numeroDossier_key" ON "Dossier"("cabinetId", "numeroDossier");

-- CreateIndex
CREATE INDEX "DossierNote_dossierId_idx" ON "DossierNote"("dossierId");

-- CreateIndex
CREATE INDEX "DossierNote_createdById_idx" ON "DossierNote"("createdById");

-- CreateIndex
CREATE INDEX "DossierTache_dossierId_idx" ON "DossierTache"("dossierId");

-- CreateIndex
CREATE INDEX "DossierTache_assigneeId_idx" ON "DossierTache"("assigneeId");

-- CreateIndex
CREATE INDEX "DossierEvenement_dossierId_idx" ON "DossierEvenement"("dossierId");

-- CreateIndex
CREATE INDEX "DossierEvenement_dossierId_date_idx" ON "DossierEvenement"("dossierId", "date");

-- CreateIndex
CREATE INDEX "DossierActe_dossierId_idx" ON "DossierActe"("dossierId");

-- CreateIndex
CREATE INDEX "DossierActe_assigneeId_idx" ON "DossierActe"("assigneeId");

-- CreateIndex
CREATE INDEX "DossierActe_dossierId_phase_idx" ON "DossierActe"("dossierId", "phase");

-- CreateIndex
CREATE INDEX "DossierActe_dossierId_assigneeId_idx" ON "DossierActe"("dossierId", "assigneeId");

-- CreateIndex
CREATE UNIQUE INDEX "TimeEntry_invoiceLineId_key" ON "TimeEntry"("invoiceLineId");

-- CreateIndex
CREATE INDEX "TimeEntry_cabinetId_idx" ON "TimeEntry"("cabinetId");

-- CreateIndex
CREATE INDEX "TimeEntry_cabinetId_dossierId_idx" ON "TimeEntry"("cabinetId", "dossierId");

-- CreateIndex
CREATE INDEX "TimeEntry_cabinetId_clientId_idx" ON "TimeEntry"("cabinetId", "clientId");

-- CreateIndex
CREATE INDEX "TimeEntry_cabinetId_date_idx" ON "TimeEntry"("cabinetId", "date");

-- CreateIndex
CREATE INDEX "TimeEntry_cabinetId_userId_idx" ON "TimeEntry"("cabinetId", "userId");

-- CreateIndex
CREATE INDEX "TimeEntry_cabinetId_statut_idx" ON "TimeEntry"("cabinetId", "statut");

-- CreateIndex
CREATE INDEX "TimeEntry_billingStatus_idx" ON "TimeEntry"("billingStatus");

-- CreateIndex
CREATE INDEX "TimeEntry_invoiceId_idx" ON "TimeEntry"("invoiceId");

-- CreateIndex
CREATE INDEX "Invoice_cabinetId_idx" ON "Invoice"("cabinetId");

-- CreateIndex
CREATE INDEX "Invoice_cabinetId_statut_idx" ON "Invoice"("cabinetId", "statut");

-- CreateIndex
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");

-- CreateIndex
CREATE INDEX "Invoice_dossierId_idx" ON "Invoice"("dossierId");

-- CreateIndex
CREATE INDEX "Invoice_validatedById_idx" ON "Invoice"("validatedById");

-- CreateIndex
CREATE INDEX "Invoice_invoiceStatus_idx" ON "Invoice"("invoiceStatus");

-- CreateIndex
CREATE INDEX "Invoice_paymentStatus_idx" ON "Invoice"("paymentStatus");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceLine_timeEntryId_idx" ON "InvoiceLine"("timeEntryId");

-- CreateIndex
CREATE INDEX "InvoiceLine_matterId_idx" ON "InvoiceLine"("matterId");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceItem_type_idx" ON "InvoiceItem"("type");

-- CreateIndex
CREATE INDEX "InvoiceItem_parentItemId_idx" ON "InvoiceItem"("parentItemId");

-- CreateIndex
CREATE INDEX "InvoiceItem_parentLineId_idx" ON "InvoiceItem"("parentLineId");

-- CreateIndex
CREATE INDEX "Payment_cabinetId_idx" ON "Payment"("cabinetId");

-- CreateIndex
CREATE INDEX "Payment_clientId_idx" ON "Payment"("clientId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_allocationStatus_idx" ON "Payment"("allocationStatus");

-- CreateIndex
CREATE INDEX "PaymentAllocation_paymentId_idx" ON "PaymentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_invoiceId_idx" ON "PaymentAllocation"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceReminder_invoiceId_idx" ON "InvoiceReminder"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceReminder_invoiceId_sentAt_idx" ON "InvoiceReminder"("invoiceId", "sentAt");

-- CreateIndex
CREATE INDEX "TrustAccount_cabinetId_idx" ON "TrustAccount"("cabinetId");

-- CreateIndex
CREATE INDEX "TrustAccount_clientId_idx" ON "TrustAccount"("clientId");

-- CreateIndex
CREATE INDEX "TrustAccount_matterId_idx" ON "TrustAccount"("matterId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustAccount_cabinetId_clientId_matterId_key" ON "TrustAccount"("cabinetId", "clientId", "matterId");

-- CreateIndex
CREATE INDEX "TrustTransaction_cabinetId_idx" ON "TrustTransaction"("cabinetId");

-- CreateIndex
CREATE INDEX "TrustTransaction_trustAccountId_idx" ON "TrustTransaction"("trustAccountId");

-- CreateIndex
CREATE INDEX "TrustTransaction_clientId_idx" ON "TrustTransaction"("clientId");

-- CreateIndex
CREATE INDEX "TrustTransaction_dossierId_idx" ON "TrustTransaction"("dossierId");

-- CreateIndex
CREATE INDEX "TrustTransaction_date_idx" ON "TrustTransaction"("date");

-- CreateIndex
CREATE INDEX "TrustTransaction_cabinetId_clientId_dossierId_date_idx" ON "TrustTransaction"("cabinetId", "clientId", "dossierId", "date");

-- CreateIndex
CREATE INDEX "CreditNote_cabinetId_idx" ON "CreditNote"("cabinetId");

-- CreateIndex
CREATE INDEX "CreditNote_clientId_idx" ON "CreditNote"("clientId");

-- CreateIndex
CREATE INDEX "CreditNote_invoiceId_idx" ON "CreditNote"("invoiceId");

-- CreateIndex
CREATE INDEX "CreditNote_status_idx" ON "CreditNote"("status");

-- CreateIndex
CREATE INDEX "CreditNoteApplication_creditNoteId_idx" ON "CreditNoteApplication"("creditNoteId");

-- CreateIndex
CREATE INDEX "CreditNoteApplication_invoiceId_idx" ON "CreditNoteApplication"("invoiceId");

-- CreateIndex
CREATE INDEX "InterestCharge_invoiceId_idx" ON "InterestCharge"("invoiceId");

-- CreateIndex
CREATE INDEX "InterestCharge_invoiceLineId_idx" ON "InterestCharge"("invoiceLineId");

-- CreateIndex
CREATE INDEX "BillingRun_cabinetId_idx" ON "BillingRun"("cabinetId");

-- CreateIndex
CREATE INDEX "BillingRun_clientId_idx" ON "BillingRun"("clientId");

-- CreateIndex
CREATE INDEX "ClientIdentityVerification_clientId_idx" ON "ClientIdentityVerification"("clientId");

-- CreateIndex
CREATE INDEX "Document_cabinetId_idx" ON "Document"("cabinetId");

-- CreateIndex
CREATE INDEX "Document_clientId_idx" ON "Document"("clientId");

-- CreateIndex
CREATE INDEX "Document_dossierId_idx" ON "Document"("dossierId");

-- CreateIndex
CREATE INDEX "Document_cabinetId_dossierId_idx" ON "Document"("cabinetId", "dossierId");

-- CreateIndex
CREATE INDEX "Document_templateCode_idx" ON "Document"("templateCode");

-- CreateIndex
CREATE INDEX "AuditLog_cabinetId_idx" ON "AuditLog"("cabinetId");

-- CreateIndex
CREATE INDEX "AuditLog_cabinetId_entityType_idx" ON "AuditLog"("cabinetId", "entityType");

-- CreateIndex
CREATE INDEX "AuditLog_cabinetId_createdAt_idx" ON "AuditLog"("cabinetId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Expense_cabinetId_idx" ON "Expense"("cabinetId");

-- CreateIndex
CREATE INDEX "Expense_clientId_idx" ON "Expense"("clientId");

-- CreateIndex
CREATE INDEX "Expense_matterId_idx" ON "Expense"("matterId");

-- CreateIndex
CREATE INDEX "Expense_billingStatus_idx" ON "Expense"("billingStatus");

-- CreateIndex
CREATE INDEX "Expense_invoiceId_idx" ON "Expense"("invoiceId");

-- CreateIndex
CREATE INDEX "DeboursType_cabinetId_idx" ON "DeboursType"("cabinetId");

-- CreateIndex
CREATE INDEX "DeboursType_cabinetId_categorie_idx" ON "DeboursType"("cabinetId", "categorie");

-- CreateIndex
CREATE UNIQUE INDEX "DeboursDossier_invoiceLineId_key" ON "DeboursDossier"("invoiceLineId");

-- CreateIndex
CREATE INDEX "DeboursDossier_cabinetId_idx" ON "DeboursDossier"("cabinetId");

-- CreateIndex
CREATE INDEX "DeboursDossier_dossierId_idx" ON "DeboursDossier"("dossierId");

-- CreateIndex
CREATE INDEX "DeboursDossier_clientId_idx" ON "DeboursDossier"("clientId");

-- CreateIndex
CREATE INDEX "DeboursDossier_factureId_idx" ON "DeboursDossier"("factureId");

-- CreateIndex
CREATE INDEX "DeboursDossier_cabinetId_date_idx" ON "DeboursDossier"("cabinetId", "date");

-- CreateIndex
CREATE INDEX "ConsentLog_clientId_idx" ON "ConsentLog"("clientId");

-- CreateIndex
CREATE INDEX "DocumentRetentionPolicy_cabinetId_idx" ON "DocumentRetentionPolicy"("cabinetId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRetentionPolicy_cabinetId_documentType_key" ON "DocumentRetentionPolicy"("cabinetId", "documentType");

-- CreateIndex
CREATE INDEX "ExpenseCategory_cabinetId_idx" ON "ExpenseCategory"("cabinetId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_cabinetId_name_key" ON "ExpenseCategory"("cabinetId", "name");

-- CreateIndex
CREATE INDEX "BankImportSession_cabinetId_idx" ON "BankImportSession"("cabinetId");

-- CreateIndex
CREATE INDEX "BankImportSession_cabinetId_importedAt_idx" ON "BankImportSession"("cabinetId", "importedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BankImportTransaction_cabinetExpenseId_key" ON "BankImportTransaction"("cabinetExpenseId");

-- CreateIndex
CREATE INDEX "BankImportTransaction_sessionId_idx" ON "BankImportTransaction"("sessionId");

-- CreateIndex
CREATE INDEX "BankImportTransaction_cabinetId_idx" ON "BankImportTransaction"("cabinetId");

-- CreateIndex
CREATE INDEX "BankImportTransaction_cabinetId_date_idx" ON "BankImportTransaction"("cabinetId", "date");

-- CreateIndex
CREATE INDEX "BankImportTransaction_status_idx" ON "BankImportTransaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CabinetExpense_transactionImportId_key" ON "CabinetExpense"("transactionImportId");

-- CreateIndex
CREATE INDEX "CabinetExpense_cabinetId_idx" ON "CabinetExpense"("cabinetId");

-- CreateIndex
CREATE INDEX "CabinetExpense_cabinetId_date_idx" ON "CabinetExpense"("cabinetId", "date");

-- CreateIndex
CREATE INDEX "CabinetExpense_categoryId_idx" ON "CabinetExpense"("categoryId");

-- CreateIndex
CREATE INDEX "CabinetExpense_dossierId_idx" ON "CabinetExpense"("dossierId");

-- CreateIndex
CREATE INDEX "CabinetExpense_statutValidation_idx" ON "CabinetExpense"("statutValidation");

-- CreateIndex
CREATE INDEX "CabinetExpense_typeTransaction_idx" ON "CabinetExpense"("typeTransaction");

-- CreateIndex
CREATE INDEX "ExpenseCategorizationRule_cabinetId_idx" ON "ExpenseCategorizationRule"("cabinetId");

-- CreateIndex
CREATE INDEX "ExpenseCategorizationRule_cabinetId_source_idx" ON "ExpenseCategorizationRule"("cabinetId", "source");

-- CreateIndex
CREATE INDEX "ExpenseCategorizationRule_isActive_idx" ON "ExpenseCategorizationRule"("isActive");

-- CreateIndex
CREATE INDEX "journal_general_cabinetId_idx" ON "journal_general"("cabinetId");

-- CreateIndex
CREATE INDEX "journal_general_cabinetId_dateTransaction_idx" ON "journal_general"("cabinetId", "dateTransaction");

-- CreateIndex
CREATE INDEX "journal_general_cabinetId_typeTransaction_idx" ON "journal_general"("cabinetId", "typeTransaction");

-- CreateIndex
CREATE INDEX "journal_general_clientId_idx" ON "journal_general"("clientId");

-- CreateIndex
CREATE INDEX "journal_general_dossierId_idx" ON "journal_general"("dossierId");

-- CreateIndex
CREATE INDEX "journal_general_sourceModule_idx" ON "journal_general"("sourceModule");

-- CreateIndex
CREATE INDEX "journal_general_cabinetId_clientId_dateTransaction_idx" ON "journal_general"("cabinetId", "clientId", "dateTransaction");

-- CreateIndex
CREATE INDEX "ImportHistory_cabinetId_idx" ON "ImportHistory"("cabinetId");

-- CreateIndex
CREATE INDEX "ImportHistory_cabinetId_createdAt_idx" ON "ImportHistory"("cabinetId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportHistory_cabinetId_status_idx" ON "ImportHistory"("cabinetId", "status");

-- CreateIndex
CREATE INDEX "ImportHistory_cabinetId_documentType_idx" ON "ImportHistory"("cabinetId", "documentType");

-- CreateIndex
CREATE INDEX "CalendarEvent_cabinetId_idx" ON "CalendarEvent"("cabinetId");

-- CreateIndex
CREATE INDEX "CalendarEvent_cabinetId_date_idx" ON "CalendarEvent"("cabinetId", "date");

-- CreateIndex
CREATE INDEX "CalendarEvent_cabinetId_assigneeId_idx" ON "CalendarEvent"("cabinetId", "assigneeId");

-- CreateIndex
CREATE INDEX "CalendarEvent_clientId_idx" ON "CalendarEvent"("clientId");

-- CreateIndex
CREATE INDEX "CalendarEvent_dossierId_idx" ON "CalendarEvent"("dossierId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollPeriod" ADD CONSTRAINT "PayrollPeriod_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipAdjustment" ADD CONSTRAINT "PayslipAdjustment_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_lawyerInChargeId_fkey" FOREIGN KEY ("lawyerInChargeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_assignedLawyerId_fkey" FOREIGN KEY ("assignedLawyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_assistantAssignedId_fkey" FOREIGN KEY ("assistantAssignedId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_avocatResponsableId_fkey" FOREIGN KEY ("avocatResponsableId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_assistantJuridiqueId_fkey" FOREIGN KEY ("assistantJuridiqueId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierNote" ADD CONSTRAINT "DossierNote_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierNote" ADD CONSTRAINT "DossierNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierTache" ADD CONSTRAINT "DossierTache_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierTache" ADD CONSTRAINT "DossierTache_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierEvenement" ADD CONSTRAINT "DossierEvenement_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierActe" ADD CONSTRAINT "DossierActe_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierActe" ADD CONSTRAINT "DossierActe_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_invoiceLineId_fkey" FOREIGN KEY ("invoiceLineId") REFERENCES "InvoiceLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_timeEntryId_fkey" FOREIGN KEY ("timeEntryId") REFERENCES "TimeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_timeEntryId_fkey" FOREIGN KEY ("timeEntryId") REFERENCES "TimeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "InvoiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_parentLineId_fkey" FOREIGN KEY ("parentLineId") REFERENCES "InvoiceLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceReminder" ADD CONSTRAINT "InvoiceReminder_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustAccount" ADD CONSTRAINT "TrustAccount_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustAccount" ADD CONSTRAINT "TrustAccount_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustAccount" ADD CONSTRAINT "TrustAccount_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustTransaction" ADD CONSTRAINT "TrustTransaction_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustTransaction" ADD CONSTRAINT "TrustTransaction_trustAccountId_fkey" FOREIGN KEY ("trustAccountId") REFERENCES "TrustAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustTransaction" ADD CONSTRAINT "TrustTransaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustTransaction" ADD CONSTRAINT "TrustTransaction_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustTransaction" ADD CONSTRAINT "TrustTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustTransaction" ADD CONSTRAINT "TrustTransaction_correctionOfId_fkey" FOREIGN KEY ("correctionOfId") REFERENCES "TrustTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNoteApplication" ADD CONSTRAINT "CreditNoteApplication_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "CreditNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNoteApplication" ADD CONSTRAINT "CreditNoteApplication_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestCharge" ADD CONSTRAINT "InterestCharge_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestCharge" ADD CONSTRAINT "InterestCharge_invoiceLineId_fkey" FOREIGN KEY ("invoiceLineId") REFERENCES "InvoiceLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingRun" ADD CONSTRAINT "BillingRun_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingRun" ADD CONSTRAINT "BillingRun_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientIdentityVerification" ADD CONSTRAINT "ClientIdentityVerification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientIdentityVerification" ADD CONSTRAINT "ClientIdentityVerification_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_invoiceLineId_fkey" FOREIGN KEY ("invoiceLineId") REFERENCES "InvoiceLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeboursType" ADD CONSTRAINT "DeboursType_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeboursDossier" ADD CONSTRAINT "DeboursDossier_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeboursDossier" ADD CONSTRAINT "DeboursDossier_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeboursDossier" ADD CONSTRAINT "DeboursDossier_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeboursDossier" ADD CONSTRAINT "DeboursDossier_deboursTypeId_fkey" FOREIGN KEY ("deboursTypeId") REFERENCES "DeboursType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeboursDossier" ADD CONSTRAINT "DeboursDossier_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeboursDossier" ADD CONSTRAINT "DeboursDossier_invoiceLineId_fkey" FOREIGN KEY ("invoiceLineId") REFERENCES "InvoiceLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentLog" ADD CONSTRAINT "ConsentLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentLog" ADD CONSTRAINT "ConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRetentionPolicy" ADD CONSTRAINT "DocumentRetentionPolicy_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankImportSession" ADD CONSTRAINT "BankImportSession_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankImportSession" ADD CONSTRAINT "BankImportSession_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankImportTransaction" ADD CONSTRAINT "BankImportTransaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BankImportSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankImportTransaction" ADD CONSTRAINT "BankImportTransaction_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankImportTransaction" ADD CONSTRAINT "BankImportTransaction_cabinetExpenseId_fkey" FOREIGN KEY ("cabinetExpenseId") REFERENCES "CabinetExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CabinetExpense" ADD CONSTRAINT "CabinetExpense_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CabinetExpense" ADD CONSTRAINT "CabinetExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CabinetExpense" ADD CONSTRAINT "CabinetExpense_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CabinetExpense" ADD CONSTRAINT "CabinetExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategorizationRule" ADD CONSTRAINT "ExpenseCategorizationRule_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_general" ADD CONSTRAINT "journal_general_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_general" ADD CONSTRAINT "journal_general_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_general" ADD CONSTRAINT "journal_general_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_general" ADD CONSTRAINT "journal_general_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportHistory" ADD CONSTRAINT "ImportHistory_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportHistory" ADD CONSTRAINT "ImportHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

