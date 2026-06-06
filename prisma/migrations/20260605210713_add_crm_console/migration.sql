-- CreateEnum
CREATE TYPE "SourceLead" AS ENUM ('LINKEDIN_DM_WARM', 'LINKEDIN_DM_COLD', 'LINKEDIN_POST', 'SEO_ORGANIC', 'SEO_LOCAL_BUSINESS', 'REFERRAL', 'AUDIT_GRATUIT', 'EMAIL', 'FACEBOOK_GROUP', 'RECRUITMENT_AGENCY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "StageLead" AS ENUM ('AWARENESS', 'ENGAGED', 'CONTACTED', 'CONVERSING', 'LEAD_MAGNET_SENT', 'AUDIT_PROPOSED', 'AUDIT_SCHEDULED', 'AUDIT_COMPLETED', 'CONSULTATION_PHASE2', 'READY_TO_SIGN', 'SIGNED', 'ACTIVATION_IN_PROGRESS', 'LIVE', 'AMBASSADOR');

-- CreateEnum
CREATE TYPE "StatutLead" AS ENUM ('NURTURE_ONLY', 'QUALIFIED_AUDIT', 'ACTIVE_CUSTOMER', 'CHURNED', 'PAUSED');

-- CreateEnum
CREATE TYPE "RoleCrm" AS ENUM ('AVOCAT_PROPRIETAIRE', 'AVOCAT_ASSOCIE', 'ADJOINT_JURIDIQUE', 'COMPTABLE_INTERNE', 'MANAGER_CABINET', 'PARTENAIRE_STRATEGIQUE');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('PRECHAUFFAGE', 'CONVERSION', 'MATURATION');

-- CreateEnum
CREATE TYPE "ModeleAdoption" AS ENUM ('TOP_DOWN', 'BOTTOM_UP', 'DUAL');

-- CreateEnum
CREATE TYPE "NiveauAdkar" AS ENUM ('NON_INITIE', 'SENSIBILISE', 'CONVAINCU', 'MAITRISE', 'AMBASSADEUR');

-- CreateEnum
CREATE TYPE "TypeActivity" AS ENUM ('LINKEDIN_LIKE', 'LINKEDIN_COMMENT', 'LINKEDIN_SHARE', 'LINKEDIN_DM', 'EMAIL_ENVOYE', 'EMAIL_RECU', 'EMAIL_OUVERT', 'EMAIL_CLIQUE', 'EMAIL_BOUNCE', 'CALL', 'MEETING', 'DEMO', 'NOTE', 'AUDIT_SOUMIS', 'BUNDLE_PROPOSE', 'CONTRAT_SIGNE', 'GO_LIVE', 'CHURN_SIGNAL');

-- CreateEnum
CREATE TYPE "PrioriteNurturing" AS ENUM ('OBSERVATION', 'ENGAGEMENT_LEGER', 'CONVERSATION_PROFONDE', 'AMBASSADEUR_POTENTIEL');

-- CreateEnum
CREATE TYPE "BundleId" AS ENUM ('ON_SOLO_REAL_ESTATE_IMMIGRATION_FLAT_FEE', 'QC_SOLO_FAMILY_FLAT_FEE', 'QC_SMALL_BUSINESS_HOURLY', 'QC_HYBRID_MULTI_PRACTICE_SMALL_FIRM', 'ON_IMMIGRATION_BOUTIQUE_STAGE_BILLING', 'QC_GENERALIST_FOUNDATION_HOURLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TypeTicket" AS ENUM ('BUG', 'DEMANDE_FEATURE', 'QUESTION', 'REMARQUE', 'URGENCE');

-- CreateEnum
CREATE TYPE "CrmProvince" AS ENUM ('QC', 'ON', 'NB', 'MB', 'BC', 'AB', 'AUTRE');

-- CreateEnum
CREATE TYPE "CrmLangue" AS ENUM ('FR', 'EN', 'BILINGUE');

-- CreateEnum
CREATE TYPE "TailleCabinet" AS ENUM ('SOLO', 'DEUX_CINQ', 'SIX_DIX', 'ONZE_VINGT', 'VINGT_UN_CINQUANTE', 'PLUS_CINQUANTE');

-- CreateEnum
CREATE TYPE "ModeFacturationCabinet" AS ENUM ('HORAIRE', 'FORFAIT', 'MIXTE');

-- CreateEnum
CREATE TYPE "VolumeFacturation" AS ENUM ('MOINS_100K', 'CENT_500K', 'CINQ_CENT_1M', 'PLUS_1M');

-- CreateEnum
CREATE TYPE "EmailStatut" AS ENUM ('NON_VERIFIE', 'VALIDE', 'INVALIDE', 'BOUNCE');

-- CreateEnum
CREATE TYPE "SourceEmail" AS ENUM ('APOLLO', 'HUNTER', 'SNOV', 'MANUEL', 'SITE_CABINET');

-- CreateEnum
CREATE TYPE "CrmDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL');

-- CreateEnum
CREATE TYPE "StatutEmail" AS ENUM ('ENVOYE', 'OUVERT', 'CLIQUE', 'REPONDU', 'BOUNCED', 'NON_OUVERT');

-- CreateEnum
CREATE TYPE "TypeTaskCrm" AS ENUM ('FOLLOW_UP_EMAIL', 'APPEL', 'LINKEDIN_DM', 'ENVOYER_RESSOURCE', 'RELANCER', 'MEETING', 'PREPARER_AUDIT', 'REVISION_BUNDLE', 'ACTIVATION_STEP');

-- CreateEnum
CREATE TYPE "TriggerTaskCrm" AS ENUM ('MANUAL', 'EMAIL_BOUNCE', 'STAGE_CHANGE', 'INACTIVITE', 'AUDIT_COMPLETE');

-- CreateEnum
CREATE TYPE "CrmPriorite" AS ENUM ('HAUTE', 'NORMALE', 'BASSE');

-- CreateEnum
CREATE TYPE "StatutTaskCrm" AS ENUM ('A_FAIRE', 'EN_COURS', 'TERMINEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "CanalCampaign" AS ENUM ('LINKEDIN_POST', 'LINKEDIN_DM', 'SEO', 'EMAIL', 'EVENT', 'PARTENARIAT');

-- CreateEnum
CREATE TYPE "TypeLeadMagnet" AS ENUM ('CHECKLIST_INSPECTION', 'PLAYBOOK_30J', 'GUIDE_FIDUCIE', 'TEMPLATE_FORFAIT', 'ETUDE_DE_CAS');

-- CreateEnum
CREATE TYPE "TypeContent" AS ENUM ('LINKEDIN_POST', 'BLOG_SEO', 'LEAD_MAGNET', 'PAGE_COMPARATIVE', 'NEWSLETTER', 'VIDEO', 'PODCAST');

-- CreateEnum
CREATE TYPE "TypeEngagement" AS ENUM ('LIKE', 'COMMENT', 'SHARE', 'DM_INITIE', 'PROFIL_VISITE');

-- CreateEnum
CREATE TYPE "RaisonPerdu" AS ENUM ('PRIX', 'CONCURRENT', 'PAS_DE_BUDGET', 'PAS_DE_FIT', 'NON_REPONDU', 'TROP_TOT', 'TIMING_MAUVAIS');

-- CreateEnum
CREATE TYPE "StatutConsultation" AS ENUM ('A_PLANIFIER', 'PLANIFIEE', 'REALISEE', 'A_REPLANIFIER', 'ANNULEE');

-- CreateEnum
CREATE TYPE "StatutTicket" AS ENUM ('NOUVEAU', 'EN_COURS', 'EN_ATTENTE_CLIENT', 'RESOLU', 'FERME', 'REOUVERT');

-- AlterTable

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL DEFAULT 'SAFE Inc.',
    "workMode" "WorkMode" NOT NULL DEFAULT 'PRECHAUFFAGE',
    "phaseDateDebut" TIMESTAMP(3) NOT NULL,
    "phaseDateFin" TIMESTAMP(3),
    "cibleTemoignageChiffre" BOOLEAN NOT NULL DEFAULT false,
    "cibleCaseStudyPublie" BOOLEAN NOT NULL DEFAULT false,
    "cibleAudienceLinkedIn" INTEGER DEFAULT 1000,
    "cibleConversationsQualifiees" INTEGER DEFAULT 20,
    "audienceActuelle" INTEGER NOT NULL DEFAULT 0,
    "conversationsActuelles" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "raisonSociale" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "province" "CrmProvince" NOT NULL,
    "ville" TEXT,
    "regionBarreau" TEXT,
    "langue" "CrmLangue" NOT NULL,
    "siteWeb" TEXT,
    "linkedinUrl" TEXT,
    "tailleCabinet" "TailleCabinet" NOT NULL,
    "domainesPratique" TEXT[],
    "modeFacturation" "ModeFacturationCabinet",
    "aTrustAccounting" BOOLEAN NOT NULL DEFAULT false,
    "logicielActuel" TEXT,
    "volumeFacturation" "VolumeFacturation",
    "nbAvocatsEstime" INTEGER,
    "nbAdjointsEstime" INTEGER,
    "sourceLead" "SourceLead" NOT NULL,
    "stageLead" "StageLead" NOT NULL DEFAULT 'AWARENESS',
    "statutLead" "StatutLead" NOT NULL DEFAULT 'NURTURE_ONLY',
    "modeleAdoption" "ModeleAdoption",
    "prioriteNurturing" "PrioriteNurturing" NOT NULL DEFAULT 'OBSERVATION',
    "score" INTEGER NOT NULL DEFAULT 0,
    "scoreFirmographique" INTEGER NOT NULL DEFAULT 0,
    "scoreEngagement" INTEGER NOT NULL DEFAULT 0,
    "scoreEnrichissement" INTEGER NOT NULL DEFAULT 0,
    "championInterneId" TEXT,
    "workspaceId" TEXT NOT NULL,
    "tags" TEXT[],
    "notesPrivees" TEXT,
    "convertedAt" TIMESTAMP(3),
    "cabinetId" TEXT,
    "raisonPerdu" "RaisonPerdu",
    "auditSubmissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dateDerniereActivite" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadContact" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "titre" TEXT,
    "email" TEXT,
    "emailSecondaire" TEXT,
    "emailStatut" "EmailStatut" NOT NULL DEFAULT 'NON_VERIFIE',
    "sourceEmail" "SourceEmail",
    "linkedinUrl" TEXT,
    "telephone" TEXT,
    "languePref" "CrmLangue" NOT NULL DEFAULT 'FR',
    "roleCrm" "RoleCrm" NOT NULL,
    "estDecideur" BOOLEAN NOT NULL DEFAULT false,
    "estChampionInterne" BOOLEAN NOT NULL DEFAULT false,
    "estApprouveOperationnel" BOOLEAN NOT NULL DEFAULT false,
    "doNotContact" BOOLEAN NOT NULL DEFAULT false,
    "awareness" "NiveauAdkar" NOT NULL DEFAULT 'NON_INITIE',
    "desire" "NiveauAdkar",
    "knowledge" INTEGER,
    "ability" INTEGER,
    "reinforcement" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "convertedAt" TIMESTAMP(3),
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "contactId" TEXT,
    "campaignId" TEXT,
    "type" "TypeActivity" NOT NULL,
    "direction" "CrmDirection" NOT NULL,
    "sujet" TEXT,
    "contenu" TEXT,
    "statutEmail" "StatutEmail",
    "urlSource" TEXT,
    "attachements" TEXT[],
    "dureeSecondes" INTEGER,
    "scoreImpact" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "contactId" TEXT,
    "type" "TypeTaskCrm" NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "priorite" "CrmPriorite" NOT NULL DEFAULT 'NORMALE',
    "statut" "StatutTaskCrm" NOT NULL DEFAULT 'A_FAIRE',
    "dateEcheance" TIMESTAMP(3),
    "dateClosed" TIMESTAMP(3),
    "trigger" "TriggerTaskCrm",
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "canal" "CanalCampaign" NOT NULL,
    "description" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "cibleLeads" INTEGER,
    "cibleConversions" INTEGER,
    "nbLeadsAttribues" INTEGER NOT NULL DEFAULT 0,
    "nbConversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadMagnet" (
    "id" TEXT NOT NULL,
    "type" "TypeLeadMagnet" NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "contenuUrl" TEXT,
    "langue" "CrmLangue" NOT NULL DEFAULT 'FR',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadMagnet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadMagnetConsumption" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "contactId" TEXT,
    "magnetId" TEXT NOT NULL,
    "dateTelechargement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateAcces" TIMESTAMP(3),
    "tempsDepenseSec" INTEGER,
    "pageScrollPercent" INTEGER,
    "declanche_dm" BOOLEAN NOT NULL DEFAULT false,
    "datePropositionAudit" TIMESTAMP(3),

    CONSTRAINT "LeadMagnetConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPiece" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" "TypeContent" NOT NULL,
    "titre" TEXT NOT NULL,
    "url" TEXT,
    "datePublication" TIMESTAMP(3),
    "vues" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "commentaires" INTEGER NOT NULL DEFAULT 0,
    "partages" INTEGER NOT NULL DEFAULT 0,
    "clicsSortie" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPiece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedInEngagement" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "leadId" TEXT,
    "contactId" TEXT,
    "type" "TypeEngagement" NOT NULL,
    "contenu" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utiliseEnDM" BOOLEAN NOT NULL DEFAULT false,
    "dateDM" TIMESTAMP(3),

    CONSTRAINT "LinkedInEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleRecommendation" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "bundleRecommande" "BundleId" NOT NULL,
    "confidence" INTEGER NOT NULL,
    "overridesPropose" TEXT,
    "customTriggers" TEXT,
    "consultationTopics" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationPhase2" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "dateConsultation" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "participants" TEXT[],
    "notes" TEXT,
    "blockingIntegrations" TEXT[],
    "exceptionsValidees" TEXT,
    "statut" "StatutConsultation" NOT NULL DEFAULT 'A_PLANIFIER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultationPhase2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationDecision" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "bundleFinal" "BundleId" NOT NULL,
    "overridesValides" TEXT,
    "customItems" TEXT,
    "activationPriority" "CrmPriorite" NOT NULL,
    "dateDecision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decisionPar" TEXT,

    CONSTRAINT "ConsultationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivationChecklist" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "envEtConfig" BOOLEAN NOT NULL DEFAULT false,
    "cabinetInterfaceConfig" TEXT,
    "seedsAppliques" BOOLEAN NOT NULL DEFAULT false,
    "utilisateursCreated" BOOLEAN NOT NULL DEFAULT false,
    "integrationsTestees" TEXT,
    "documentsTemplates" BOOLEAN NOT NULL DEFAULT false,
    "permissionsConfigured" BOOLEAN NOT NULL DEFAULT false,
    "parcoursUserTeste" BOOLEAN NOT NULL DEFAULT false,
    "risquesResiduels" TEXT,
    "remiseAccesFait" BOOLEAN NOT NULL DEFAULT false,
    "dateGoLive" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivationChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" "TypeTicket" NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priorite" "CrmPriorite" NOT NULL DEFAULT 'NORMALE',
    "statut" "StatutTicket" NOT NULL DEFAULT 'NOUVEAU',
    "contexteUrl" TEXT,
    "screenshotUrl" TEXT,
    "consoleLogs" TEXT,
    "assigneeId" TEXT,
    "dateResolution" TIMESTAMP(3),
    "noteResolution" TEXT,
    "satisfactionRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketReply" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "isFromSafeInc" BOOLEAN NOT NULL DEFAULT false,
    "contenu" TEXT NOT NULL,
    "attachements" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpersonationSession" (
    "id" TEXT NOT NULL,
    "superadminId" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "reason" TEXT,
    "actionsCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "ImpersonationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LeadCampaigns" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LeadCampaigns_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_slug_key" ON "Lead"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_cabinetId_key" ON "Lead"("cabinetId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_auditSubmissionId_key" ON "Lead"("auditSubmissionId");

-- CreateIndex
CREATE INDEX "Lead_stageLead_idx" ON "Lead"("stageLead");

-- CreateIndex
CREATE INDEX "Lead_sourceLead_idx" ON "Lead"("sourceLead");

-- CreateIndex
CREATE INDEX "Lead_score_idx" ON "Lead"("score");

-- CreateIndex
CREATE INDEX "Lead_workspaceId_idx" ON "Lead"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadContact_userId_key" ON "LeadContact"("userId");

-- CreateIndex
CREATE INDEX "LeadContact_leadId_idx" ON "LeadContact"("leadId");

-- CreateIndex
CREATE INDEX "LeadContact_email_idx" ON "LeadContact"("email");

-- CreateIndex
CREATE INDEX "Activity_leadId_date_idx" ON "Activity"("leadId", "date");

-- CreateIndex
CREATE INDEX "Activity_contactId_date_idx" ON "Activity"("contactId", "date");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Task_statut_dateEcheance_idx" ON "Task"("statut", "dateEcheance");

-- CreateIndex
CREATE INDEX "Task_leadId_idx" ON "Task"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "BundleRecommendation_leadId_key" ON "BundleRecommendation"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationPhase2_leadId_key" ON "ConsultationPhase2"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationDecision_leadId_key" ON "ConsultationDecision"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivationChecklist_leadId_key" ON "ActivationChecklist"("leadId");

-- CreateIndex
CREATE INDEX "SupportTicket_cabinetId_statut_idx" ON "SupportTicket"("cabinetId", "statut");

-- CreateIndex
CREATE INDEX "SupportTicket_statut_priorite_idx" ON "SupportTicket"("statut", "priorite");

-- CreateIndex
CREATE INDEX "ImpersonationSession_cabinetId_startedAt_idx" ON "ImpersonationSession"("cabinetId", "startedAt");

-- CreateIndex
CREATE INDEX "_LeadCampaigns_B_index" ON "_LeadCampaigns"("B");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_championInterneId_fkey" FOREIGN KEY ("championInterneId") REFERENCES "LeadContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_auditSubmissionId_fkey" FOREIGN KEY ("auditSubmissionId") REFERENCES "AuditSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadContact" ADD CONSTRAINT "LeadContact_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadContact" ADD CONSTRAINT "LeadContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "LeadContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "LeadContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMagnetConsumption" ADD CONSTRAINT "LeadMagnetConsumption_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMagnetConsumption" ADD CONSTRAINT "LeadMagnetConsumption_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "LeadContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMagnetConsumption" ADD CONSTRAINT "LeadMagnetConsumption_magnetId_fkey" FOREIGN KEY ("magnetId") REFERENCES "LeadMagnet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPiece" ADD CONSTRAINT "ContentPiece_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedInEngagement" ADD CONSTRAINT "LinkedInEngagement_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentPiece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedInEngagement" ADD CONSTRAINT "LinkedInEngagement_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedInEngagement" ADD CONSTRAINT "LinkedInEngagement_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "LeadContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleRecommendation" ADD CONSTRAINT "BundleRecommendation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationPhase2" ADD CONSTRAINT "ConsultationPhase2_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationDecision" ADD CONSTRAINT "ConsultationDecision_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationChecklist" ADD CONSTRAINT "ActivationChecklist_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReply" ADD CONSTRAINT "TicketReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReply" ADD CONSTRAINT "TicketReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationSession" ADD CONSTRAINT "ImpersonationSession_superadminId_fkey" FOREIGN KEY ("superadminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationSession" ADD CONSTRAINT "ImpersonationSession_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LeadCampaigns" ADD CONSTRAINT "_LeadCampaigns_A_fkey" FOREIGN KEY ("A") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LeadCampaigns" ADD CONSTRAINT "_LeadCampaigns_B_fkey" FOREIGN KEY ("B") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "DossierReadyForReviewSignal_cabinetId_avocatResponsableId_readA" RENAME TO "DossierReadyForReviewSignal_cabinetId_avocatResponsableId_r_idx";

