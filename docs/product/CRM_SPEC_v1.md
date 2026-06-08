# Spécification CRM SAFE — v1

---
module: CRM
date_spec: 2026-05-27
auteur: CEO + Claude (synthèse)
statut: DRAFT (en attente validation CEO)
nb_modeles: 15
nb_enums: 10
nb_features: 18
nb_workflows: 6
nb_integrations: 4
nb_adrs: 5
phase_pipeline: SPÉCIFIER (Phase 2 du Delivery Syst)
---

> **Règle CLAUDE.md** : ne pas builder sans spec validée.
> Ce document est le contrat de données entre la phase Comprendre (analyse) et la phase Construire (code).
> Aucune ligne de code ne doit être écrite tant que ce document n'a pas été validé par le CEO.

---

## Table des matières

1. [Vision et positionnement](#1-vision-et-positionnement)
2. [Personas internes](#2-personas-internes)
3. [Architecture en 3 couches](#3-architecture-en-3-couches)
4. [Data model — 15 modèles Prisma](#4-data-model)
5. [Enums clés](#5-enums-cles)
6. [Workflows critiques](#6-workflows-critiques)
7. [Features détaillées](#7-features-detaillees)
8. [Intégrations tierces](#8-integrations-tierces)
9. [ADRs — Décisions architecturales](#9-adrs)
10. [Plan de build](#10-plan-de-build)
11. [Risques et garde-fous](#11-risques-et-garde-fous)
12. [Glossaire](#12-glossaire)

---

## 1. Vision et positionnement

### 1.1 Pourquoi un CRM intégré et non HubSpot

SAFE n'est pas un SaaS B2B générique. Son funnel a une forme spécifique imposée par :
- La nature réglementée du client final (cabinets d'avocats sous Barreau)
- Le pipeline Delivery Syst à 3 phases qui produit des artefacts structurés (audit → bundle → activation)
- La thèse "copilote du copilote" qui impose une adoption bottom-up via l'adjoint
- La phase préchauffage 90 jours sans conversion outbound

Un CRM standard (HubSpot, Pipedrive, Close) force à plier ce funnel dans des étapes génériques. Le CRM SAFE doit refléter le funnel réel et devenir lui-même un actif différenciant (case study : « voici comment on a tracké chaque interaction avec notre première cliente pendant 90 jours »).

### 1.2 Objectifs v1

Le CRM v1 doit permettre de :

1. **Tracer chaque interaction** avec la cliente actuelle pendant la phase préchauffage (matière première du case study J+90)
2. **Capturer les sources de leads** pour identifier les canaux qui fonctionnent (LinkedIn warm vs cold, SEO local, audit gratuit)
3. **Modéliser la relation avocat ↔ adjoint** au sein de chaque cabinet pour piloter l'adoption ADKAR
4. **Connecter le pipeline Delivery** (AuditSubmission → BundleRecommendation → ActivationChecklist) à un objet Lead unifié
5. **Empêcher les comportements anti-phase-préchauffage** (UI désactive le pitch outbound froid pendant la phase)
6. **Produire des métriques** pour build-in-public (engagement LinkedIn, conversations, leads qualifiés, time-to-audit)

### 1.3 Non-objectifs v1

- ✗ Email marketing automation (Mailchimp/Klaviyo-like) → v2
- ✗ Séquences cold outreach automatisées → contraire à la phase préchauffage
- ✗ Intégration CRM externe bidirectionnelle (HubSpot sync) → v3
- ✗ Multi-tenant pour distributeurs/partenaires → v2 (préparer le flag, pas l'implémenter)
- ✗ Mobile app dédiée → web responsive suffit
- ✗ Scoring IA via Claude API → bloqué par ANTHROPIC_API_KEY manquante, v2

---

## 2. Personas internes

Le CRM SAFE a 3 utilisateurs internes possibles. À ce stade : CEO uniquement.

### Persona A — CEO (vous)
- **Rôle** : prospection, conversation client, decision making
- **Besoins** :
  - Vue rapide « qui m'a écrit cette semaine, qui dois-je relancer »
  - Capture rapide post-conversation (note vocale ou texte)
  - Tableau de bord engagement LinkedIn par semaine
  - Vue d'une organisation cliente (timeline complète, état ADKAR par contact)
- **Anti-besoins** :
  - Pas de mode « vente agressive » qui pousse à pitcher
  - Pas de scoring trompeur qui flag des leads froids comme chauds en phase préchauffage

### Persona B — Futur sales / customer success (post J+90)
- Anticipé mais pas optimisé en v1
- Le modèle de permissions le prévoit (réutilise les rôles existants `admin_cabinet | avocat | assistante`)

### Persona C — Futur partenaire distributeur
- Hors scope v1, simplement préparer un flag `workspaceId` au cas où

---

## 3. Architecture en 3 couches

```
┌─────────────────────────────────────────────────────────────┐
│  COUCHE 1 — CRM PROSPECTION (nouveaux modèles)              │
│                                                             │
│  Lead, LeadContact, Activity, Task, Campaign,               │
│  LeadMagnet, LeadMagnetConsumption,                         │
│  LinkedInEngagement, ContentPiece                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ stage = AUDIT_PROPOSED
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  COUCHE 2 — CRM DELIVERY (lien pipeline 3 phases)           │
│                                                             │
│  AuditSubmission (existant) → BundleRecommendation          │
│  → ConsultationPhase2 → ConsultationDecision                │
│  → ActivationChecklist → AdkarTracking                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ stage = SIGNED, conversion
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  COUCHE 3 — SAFE PRODUIT (existant, intact)                 │
│                                                             │
│  Cabinet, User, Client, Dossier, Invoice, TimeEntry, etc.   │
│                                                             │
│  Le Lead converti devient un Cabinet                        │
│  Les LeadContacts deviennent des Users                      │
└─────────────────────────────────────────────────────────────┘

Singleton transverse : Workspace (workMode, phaseObjectifs)
```

### Principe directeur

- **Couche 1** est isolée du produit SAFE. Un prospect n'a pas d'accès à SAFE.
- **Couche 2** fait le pont via `AuditSubmission` (déjà dans le schéma SAFE).
- **Couche 3** est intacte. À la signature, le Lead est converti et un Cabinet réel est provisionné.

---

## 4. Data model

### 4.1 Lead

```prisma
model Lead {
  id                    String   @id @default(cuid())

  // Identification cabinet
  raisonSociale         String
  slug                  String   @unique
  province              Province
  ville                 String?
  regionBarreau         String?
  langue                Langue
  siteWeb               String?
  linkedinUrl           String?

  // Caractéristiques cabinet
  tailleCabinet         TailleCabinet
  domainesPratique      String[]  // multi-select : famille, immobilier, immigration, affaires, criminel, litige, travail
  modeFacturation       ModeFacturation?  // horaire | forfait | mixte
  aTrustAccounting      Boolean   @default(false)
  logicielActuel        String?
  volumeFacturation     VolumeFacturation?
  nbAvocatsEstime       Int?
  nbAdjointsEstime      Int?

  // Pipeline
  sourceLead            SourceLead
  stageLead             StageLead   @default(AWARENESS)
  statutLead            StatutLead  @default(NURTURE_ONLY)
  modeleAdoption        ModeleAdoption?
  prioriteNurturing     PrioriteNurturing  @default(OBSERVATION)

  // Scoring (3 dimensions)
  score                 Int       @default(0)
  scoreFirmographique   Int       @default(0)  // 0-40 pts
  scoreEngagement       Int       @default(0)  // 0-40 pts
  scoreEnrichissement   Int       @default(0)  // 0-20 pts

  // Relation avocat-adjoint
  championInterneId     String?
  championInterne       LeadContact? @relation("Champion", fields: [championInterneId], references: [id])

  // Workspace (mode préchauffage)
  workspaceId           String
  workspace             Workspace @relation(fields: [workspaceId], references: [id])

  // Tags et notes
  tags                  String[]
  notesPrivees          String?

  // Conversion vers produit SAFE
  convertedAt           DateTime?
  cabinetId             String?   @unique
  cabinet               Cabinet?  @relation(fields: [cabinetId], references: [id])
  raisonPerdu           RaisonPerdu?

  // Lien pipeline Delivery
  auditSubmissionId     String?   @unique
  auditSubmission       AuditSubmission? @relation(fields: [auditSubmissionId], references: [id])
  bundleRecommendation  BundleRecommendation?
  consultationPhase2    ConsultationPhase2?
  consultationDecision  ConsultationDecision?
  activationChecklist   ActivationChecklist?

  // Relations CRM
  contacts              LeadContact[]
  activities            Activity[]
  tasks                 Task[]
  leadMagnetConsumptions LeadMagnetConsumption[]
  linkedInEngagements   LinkedInEngagement[]

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  dateDerniereActivite  DateTime?

  @@index([stageLead])
  @@index([sourceLead])
  @@index([score])
}
```

### 4.2 LeadContact

```prisma
model LeadContact {
  id                    String   @id @default(cuid())
  leadId                String
  lead                  Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)

  // Identité
  prenom                String
  nom                   String
  titre                 String?
  email                 String?
  emailSecondaire       String?
  emailStatut           EmailStatut @default(NON_VERIFIE)
  sourceEmail           SourceEmail?
  linkedinUrl           String?
  telephone             String?
  languePref            Langue   @default(FR)

  // Rôle CRM
  roleCrm               RoleCrm
  estDecideur           Boolean  @default(false)
  estChampionInterne    Boolean  @default(false)
  estApprouveOperationnel Boolean @default(false)
  doNotContact          Boolean  @default(false)

  // ADKAR tracking (adoption bottom-up)
  awareness             NiveauAdkar @default(NON_INITIE)
  desire                NiveauAdkar?
  knowledge             Int?     // score 0-100
  ability               Int?     // score 0-100
  reinforcement         Boolean  @default(false)

  notes                 String?

  // Champion réciproque (un Lead pointe vers son champion)
  championOf            Lead[]   @relation("Champion")

  // Conversion vers User SAFE
  convertedAt           DateTime?
  userId                String?  @unique
  user                  User?    @relation(fields: [userId], references: [id])

  // Relations
  activities            Activity[]
  tasks                 Task[]
  leadMagnetConsumptions LeadMagnetConsumption[]
  linkedInEngagements   LinkedInEngagement[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([leadId])
  @@index([email])
}
```

### 4.3 Activity (timeline unifiée)

```prisma
model Activity {
  id                String   @id @default(cuid())

  // Polymorphic : lien optionnel à Lead ET/OU LeadContact
  leadId            String?
  lead              Lead?    @relation(fields: [leadId], references: [id], onDelete: Cascade)
  contactId         String?
  contact           LeadContact? @relation(fields: [contactId], references: [id])

  type              TypeActivity
  direction         Direction  // INBOUND | OUTBOUND | INTERNAL
  sujet             String?
  contenu           String?    // peut contenir le markdown brut du DM, email, note vocale transcrite

  // Métadonnées spécifiques selon type
  statutEmail       StatutEmail?      // ENVOYE | OUVERT | CLIQUE | REPONDU | BOUNCED
  urlSource         String?           // lien post LinkedIn, lien email, lien Calendar event
  attachements      String[]          // S3 keys ou URLs

  // Tracking comportemental
  dureeSecondes     Int?       // appel, meeting
  scoreImpact       Int?       // 1-10, impact perçu sur le funnel

  date              DateTime   @default(now())
  createdBy         String?    // userId qui a logué (= CEO pour v1)
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  @@index([leadId, date])
  @@index([contactId, date])
  @@index([type])
}
```

### 4.4 Task

```prisma
model Task {
  id            String   @id @default(cuid())
  leadId        String?
  lead          Lead?    @relation(fields: [leadId], references: [id], onDelete: Cascade)
  contactId     String?
  contact       LeadContact? @relation(fields: [contactId], references: [id])

  type          TypeTask
  titre         String
  description   String?
  priorite      Priorite @default(NORMALE)
  statut        StatutTask @default(A_FAIRE)
  dateEcheance  DateTime?
  dateClosed    DateTime?

  // Source automatique ou manuelle
  trigger       TriggerTask?  // EMAIL_BOUNCE | STAGE_CHANGE | INACTIVITE | MANUAL

  assigneeId    String?  // userId

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([statut, dateEcheance])
  @@index([leadId])
}
```

### 4.5 Campaign

```prisma
model Campaign {
  id            String   @id @default(cuid())
  nom           String
  canal         CanalCampaign  // LINKEDIN_POST | LINKEDIN_DM | SEO | EMAIL | EVENT
  description   String?
  dateDebut     DateTime
  dateFin       DateTime?
  budget        Float?
  cibleLeads    Int?
  cibleConversions Int?

  // Résultats agrégés (calculés)
  nbLeadsAttribues Int @default(0)
  nbConversions Int @default(0)

  activities    Activity[]
  leads         Lead[]    @relation("LeadCampaigns")

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 4.6 LeadMagnet + LeadMagnetConsumption

```prisma
model LeadMagnet {
  id            String   @id @default(cuid())
  type          TypeLeadMagnet  // CHECKLIST_INSPECTION | PLAYBOOK_30J | GUIDE_FIDUCIE | TEMPLATE_FORFAIT
  titre         String
  description   String?
  contenuUrl    String?  // URL du PDF/page
  langue        Langue   @default(FR)
  actif         Boolean  @default(true)

  consumptions  LeadMagnetConsumption[]
  createdAt     DateTime @default(now())
}

model LeadMagnetConsumption {
  id                  String   @id @default(cuid())
  leadId              String?
  lead                Lead?    @relation(fields: [leadId], references: [id])
  contactId           String?
  contact             LeadContact? @relation(fields: [contactId], references: [id])
  magnetId            String
  magnet              LeadMagnet @relation(fields: [magnetId], references: [id])

  dateTelechargement  DateTime @default(now())
  dateAcces           DateTime?
  tempsDepenseSec     Int?
  pageScrollPercent   Int?

  // Signal de conversion
  declanche_dm        Boolean  @default(false)
  dateProposition_audit DateTime?
}
```

### 4.7 LinkedInEngagement + ContentPiece

```prisma
model ContentPiece {
  id            String   @id @default(cuid())
  type          TypeContent  // LINKEDIN_POST | BLOG_SEO | LEAD_MAGNET | PAGE_COMPARATIVE | NEWSLETTER
  titre         String
  url           String?
  datePublication DateTime?
  // Métriques (mises à jour manuellement ou via API LinkedIn)
  vues          Int      @default(0)
  likes         Int      @default(0)
  commentaires  Int      @default(0)
  partages      Int      @default(0)
  clicsSortie   Int      @default(0)  // clics vers profil/site

  engagements   LinkedInEngagement[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model LinkedInEngagement {
  id            String   @id @default(cuid())
  contentId     String
  content       ContentPiece @relation(fields: [contentId], references: [id])
  leadId        String?
  lead          Lead?    @relation(fields: [leadId], references: [id])
  contactId     String?
  contact       LeadContact? @relation(fields: [contactId], references: [id])

  type          TypeEngagement  // LIKE | COMMENT | SHARE | DM_INITIE
  contenu       String?  // texte du commentaire si applicable
  date          DateTime @default(now())

  // Signal "DM hook"
  utiliseEnDM   Boolean  @default(false)
  dateDM        DateTime?
}
```

### 4.8 Couche 2 — Delivery

```prisma
model BundleRecommendation {
  id                    String   @id @default(cuid())
  leadId                String   @unique
  lead                  Lead     @relation(fields: [leadId], references: [id])

  bundleRecommande      BundleId
  confidence            Int      // 0-100, calculé via algorithme audit→bundle
  overridesPropose      Json?    // structure : { module: "fideicommis", config: {...} }
  customTriggers        Json?    // items hors bundle standard
  consultationTopics    String[] // sujets à valider en Phase 2

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model ConsultationPhase2 {
  id                    String   @id @default(cuid())
  leadId                String   @unique
  lead                  Lead     @relation(fields: [leadId], references: [id])

  dateConsultation      DateTime?
  durationMinutes       Int?
  participants          String[] // contactIds présents
  notes                 String?
  blockingIntegrations  String[] // ex: ["resend", "stripe", "docusign"]
  exceptionsValidees    Json?

  statut                StatutConsultation @default(A_PLANIFIER)
  createdAt             DateTime @default(now())
}

model ConsultationDecision {
  id                    String   @id @default(cuid())
  leadId                String   @unique
  lead                  Lead     @relation(fields: [leadId], references: [id])

  bundleFinal           BundleId
  overridesValides      Json?
  customItems           Json?
  activationPriority    Priorite
  dateDecision          DateTime @default(now())
  decisionPar           String?  // contactId qui a signé l'engagement
}

model ActivationChecklist {
  id                    String   @id @default(cuid())
  leadId                String   @unique
  lead                  Lead     @relation(fields: [leadId], references: [id])

  // 10 sections de l'ACTIVATION.template.md
  envEtConfig           Boolean  @default(false)
  cabinetInterfaceConfig Json?
  seedsAppliques        Boolean  @default(false)
  utilisateursCreated   Boolean  @default(false)
  integrationsTestees   Json?    // { resend: true, stripe: false, ... }
  documentsTemplates    Boolean  @default(false)
  permissionsConfigured Boolean  @default(false)
  parcoursUserTeste     Boolean  @default(false)
  risquesResiduels      String?
  remiseAccesFait       Boolean  @default(false)

  dateGoLive            DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### 4.9 Workspace (singleton transverse)

```prisma
model Workspace {
  id                    String   @id @default(cuid())
  nom                   String   @default("SAFE Inc.")

  // Mode global (règle dure phase préchauffage)
  workMode              WorkMode  @default(PRECHAUFFAGE)
  phaseDateDebut        DateTime
  phaseDateFin          DateTime?

  // Objectifs phase préchauffage
  cibleTemoignageChiffre Boolean  @default(false)
  cibleCaseStudyPublie  Boolean   @default(false)
  cibleAudienceLinkedIn Int?      @default(1000)
  cibleConversationsQualifiees Int? @default(20)

  // Métriques actuelles (calculées)
  audienceActuelle      Int       @default(0)
  conversationsActuelles Int      @default(0)

  leads                 Lead[]
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

---

## 5. Enums clés

```prisma
enum SourceLead {
  LINKEDIN_DM_WARM
  LINKEDIN_DM_COLD
  LINKEDIN_POST
  SEO_ORGANIC
  SEO_LOCAL_BUSINESS
  REFERRAL
  AUDIT_GRATUIT
  EMAIL
  FACEBOOK_GROUP
  RECRUITMENT_AGENCY
  OFFLINE
}

enum StageLead {
  AWARENESS              // a vu un post / une page SEO
  ENGAGED                // a liké / commenté
  CONTACTED              // 1er DM ou email envoyé
  CONVERSING             // 2-3 échanges
  LEAD_MAGNET_SENT       // checklist 8 points / playbook envoyé
  AUDIT_PROPOSED         // « intéressé par un audit gratuit ? »
  AUDIT_SCHEDULED        // date d'audit fixée
  AUDIT_COMPLETED        // AuditSubmission remplie, Phase 1 terminée
  CONSULTATION_PHASE2    // bundle proposé, validation en cours
  READY_TO_SIGN          // devis envoyé, attente signature
  SIGNED                 // contrat signé
  ACTIVATION_IN_PROGRESS // Phase 3 en cours
  LIVE                   // cabinet actif sur SAFE
  AMBASSADOR             // prescripteur actif
}

enum StatutLead {
  NURTURE_ONLY     // phase préchauffage, engagement seulement
  QUALIFIED_AUDIT  // prêt pour audit
  ACTIVE_CUSTOMER  // contrat signé
  CHURNED          // non-répondant 3 mois +
  PAUSED           // contexte externe, re-engager
}

enum RoleCrm {
  AVOCAT_PROPRIETAIRE
  AVOCAT_ASSOCIE
  ADJOINT_JURIDIQUE
  COMPTABLE_INTERNE
  MANAGER_CABINET
  PARTENAIRE_STRATEGIQUE
}

enum WorkMode {
  PRECHAUFFAGE
  CONVERSION
  MATURATION
}

enum ModeleAdoption {
  TOP_DOWN
  BOTTOM_UP
  DUAL
}

enum NiveauAdkar {
  NON_INITIE
  SENSIBILISE
  CONVAINCU
  MAITRISE
  AMBASSADEUR
}

enum TypeActivity {
  LINKEDIN_LIKE
  LINKEDIN_COMMENT
  LINKEDIN_SHARE
  LINKEDIN_DM
  EMAIL_ENVOYE
  EMAIL_RECU
  EMAIL_OUVERT
  EMAIL_CLIQUE
  EMAIL_BOUNCE
  CALL
  MEETING
  DEMO
  NOTE
  AUDIT_SOUMIS
  BUNDLE_PROPOSE
  CONTRAT_SIGNE
  GO_LIVE
  CHURN_SIGNAL
}

enum PrioriteNurturing {
  OBSERVATION
  ENGAGEMENT_LEGER
  CONVERSATION_PROFONDE
  AMBASSADEUR_POTENTIEL
}

enum BundleId {
  ON_SOLO_REAL_ESTATE_IMMIGRATION_FLAT_FEE
  QC_SOLO_FAMILY_FLAT_FEE
  QC_SMALL_BUSINESS_HOURLY
  QC_HYBRID_MULTI_PRACTICE_SMALL_FIRM
  ON_IMMIGRATION_BOUTIQUE_STAGE_BILLING
  QC_GENERALIST_FOUNDATION_HOURLY
  CUSTOM
}

// Enums secondaires (non listés en intro mais nécessaires)
enum Province { QC ON NB MB BC AB AUTRE }
enum Langue { FR EN BILINGUE }
enum TailleCabinet { SOLO DEUX_CINQ SIX_DIX ONZE_VINGT VINGT_UN_CINQUANTE PLUS_CINQUANTE }
enum ModeFacturation { HORAIRE FORFAIT MIXTE }
enum VolumeFacturation { MOINS_100K CENT_500K CINQ_CENT_1M PLUS_1M }
enum EmailStatut { NON_VERIFIE VALIDE INVALIDE BOUNCE }
enum SourceEmail { APOLLO HUNTER SNOV MANUEL SITE_CABINET }
enum Direction { INBOUND OUTBOUND INTERNAL }
enum StatutEmail { ENVOYE OUVERT CLIQUE REPONDU BOUNCED NON_OUVERT }
enum TypeTask { FOLLOW_UP_EMAIL APPEL LINKEDIN_DM ENVOYER_RESSOURCE RELANCER MEETING PREPARER_AUDIT REVISION_BUNDLE ACTIVATION_STEP }
enum TriggerTask { MANUAL EMAIL_BOUNCE STAGE_CHANGE INACTIVITE AUDIT_COMPLETE }
enum Priorite { HAUTE NORMALE BASSE }
enum StatutTask { A_FAIRE EN_COURS TERMINEE ANNULEE }
enum CanalCampaign { LINKEDIN_POST LINKEDIN_DM SEO EMAIL EVENT PARTENARIAT }
enum TypeLeadMagnet { CHECKLIST_INSPECTION PLAYBOOK_30J GUIDE_FIDUCIE TEMPLATE_FORFAIT ETUDE_DE_CAS }
enum TypeContent { LINKEDIN_POST BLOG_SEO LEAD_MAGNET PAGE_COMPARATIVE NEWSLETTER VIDEO PODCAST }
enum TypeEngagement { LIKE COMMENT SHARE DM_INITIE PROFIL_VISITE }
enum RaisonPerdu { PRIX CONCURRENT PAS_DE_BUDGET PAS_DE_FIT NON_REPONDU TROP_TOT TIMING_MAUVAIS }
enum StatutConsultation { A_PLANIFIER PLANIFIEE REALISEE A_REPLANIFIER ANNULEE }
```

---

## 6. Workflows critiques

### Workflow 1 — Capture lead depuis post LinkedIn

```
1. Post LinkedIn publié → ContentPiece créé
2. Quelqu'un like / commente → LinkedInEngagement créé
3. CEO consulte « DM hooks » (engagements récents non utilisés)
4. CEO clique « Créer lead » sur un engagement
   → Lead créé (stage AWARENESS, sourceLead LINKEDIN_POST)
   → LeadContact créé depuis le profil LinkedIn
   → Activity créée (LINKEDIN_LIKE/COMMENT)
5. CEO envoie un DM tiède
   → Activity LINKEDIN_DM (direction OUTBOUND)
   → Lead.stage = CONTACTED
6. Réponse reçue
   → Activity LINKEDIN_DM (direction INBOUND)
   → Lead.stage = CONVERSING
   → Score engagement +10
```

### Workflow 2 — Audit gratuit (lien AuditSubmission existant)

```
1. CEO propose audit dans la conversation
   → Lead.stage = AUDIT_PROPOSED
2. Lien envoyé vers formulaire audit (déjà dans SAFE)
3. Cabinet remplit AuditSubmission
4. Hook après création AuditSubmission :
   → Lead.auditSubmissionId rempli
   → Lead.stage = AUDIT_COMPLETED
   → Task créée auto : « Lancer Phase 1 d'analyse pour [raisonSociale] »
5. Phase 1 manuelle produit les 8 docs
6. Phase 2 produit BundleRecommendation
   → Lead.stage = CONSULTATION_PHASE2
   → Task créée auto : « Planifier consultation Phase 2 »
```

### Workflow 3 — Conversion Lead → Cabinet

```
1. ConsultationDecision finalisée (bundleFinal choisi)
   → Lead.stage = READY_TO_SIGN
2. Contrat signé
   → Lead.stage = SIGNED
   → ActivationChecklist créée (vide)
3. CEO clique « Convertir en Cabinet »
   → Cabinet créé avec data du Lead (raisonSociale, province, etc.)
   → Pour chaque LeadContact : User créé avec rôle adapté
   → Lead.cabinetId rempli, Lead.convertedAt = now()
   → Lead.statutLead = ACTIVE_CUSTOMER
4. Activation Phase 3 progresse (checklist)
5. ActivationChecklist.dateGoLive remplie
   → Lead.stage = LIVE
```

### Workflow 4 — Phase préchauffage : garde-fous UI

```
1. Workspace.workMode = PRECHAUFFAGE
2. UI bloque ou avertit :
   - Bouton « Séquence cold email » désactivé avec tooltip
     « Désactivé pendant la phase préchauffage (jusqu'au 2026-09-04) »
   - Banner sur dashboard : « Phase préchauffage J+X/90 »
   - Création d'un Lead avec sourceLead = LINKEDIN_DM_COLD → warning
3. KPI dashboard adapté :
   - Pas de « MRR pipeline » mis en avant
   - Mis en avant : conversations, engagement LinkedIn, leads en NURTURE_ONLY
4. À J+90 ou clic « Passer en mode CONVERSION » :
   - Banner disparait, KPIs changent
```

### Workflow 5 — Bottom-up adoption (relation avocat ↔ adjoint)

```
1. Premier contact identifié comme ADJOINT_JURIDIQUE
   → estChampionInterne = true (proposé par défaut)
   → Lead.modeleAdoption = BOTTOM_UP
   → Lead.championInterneId rempli
2. CEO ajoute le LeadContact AVOCAT_PROPRIETAIRE
   → estDecideur = true
3. ADKAR tracking par contact :
   - Adjoint : Awareness → Desire → Knowledge (suit formation lead magnet)
   - Avocat : Awareness seulement (champion lui parle)
4. UI Lead detail montre 2 colonnes :
   - « Champion interne » : état ADKAR de l'adjoint
   - « Décideur » : état ADKAR de l'avocat
5. Suggestion automatique :
   - « L'adjoint est en CONVAINCU. Suggérer de présenter à l'avocat. »
   → Task créée auto avec template message
```

### Workflow 6 — Scoring 3 dimensions

```
ScoreFirmographique (0-40) — calculé à chaque update Lead :
- province = QC : +10
- tailleCabinet IN [DEUX_CINQ, SIX_DIX, ONZE_VINGT] : +20
- tailleCabinet = SOLO : +10
- aTrustAccounting = true : +5
- domainesPratique inclut "famille" ou "immobilier" : +5

ScoreEngagement (0-40) — calculé à chaque Activity créée :
- Lead a ≥1 Activity INBOUND (any type) : +15
- Lead a ≥3 LinkedInEngagement : +10
- Lead a LeadMagnetConsumption : +10
- Lead a Activity type MEETING ou DEMO : +5

ScoreEnrichissement (0-20) — calculé à chaque update LeadContact :
- ≥1 LeadContact avec emailStatut = VALIDE : +10
- ≥1 LeadContact avec linkedinUrl : +5
- Lead.logicielActuel renseigné : +5

Total = Firmographique + Engagement + Enrichissement (max 100)

Badges UI :
- ≥70 : HOT (vert)
- 40-69 : WARM (jaune)
- <40 : COLD (gris)
```

---

## 7. Features détaillées

### Feature 1 — Pages CRM principales

| Route | Description | Composants clés |
|-------|-------------|----------------|
| `/crm` | Dashboard CRM (KPIs phase) | KpiCard, EngagementChart, HotLeadsList |
| `/crm/leads` | Liste leads filtrable | LeadTable, FilterBar |
| `/crm/leads/[id]` | Detail lead avec timeline | LeadHeader, ContactsList, ActivityTimeline, AdkarPanel |
| `/crm/contacts` | Liste tous LeadContacts | ContactTable |
| `/crm/pipeline` | Kanban 13 stages | KanbanBoard, StageColumn, LeadCard |
| `/crm/audit/[id]` | Vue AuditSubmission + BundleRecommendation | AuditView, BundleProposal |
| `/crm/bundles` | Catalogue 6 bundles + recommandations actives | BundleCatalog |
| `/crm/activation/[leadId]` | Checklist 10 sections | ActivationChecklist |
| `/crm/tasks` | Toutes tâches priorisées | TaskList |
| `/crm/activities` | Timeline globale | ActivityTimeline |
| `/crm/campaigns` | Campagnes + ROI | CampaignTable |
| `/crm/content` | Posts LinkedIn + engagements | ContentTable, EngagementsList |

### Feature 2 — Conversion Lead → Cabinet (server action)

```typescript
// lib/services/crm/conversion-service.ts
async function convertLeadToCabinet(leadId: string): Promise<Cabinet> {
  // 1. Lock le Lead (pas de modification pendant conversion)
  // 2. Créer Cabinet à partir du Lead
  // 3. Créer User pour chaque LeadContact converti
  // 4. Provisionner CabinetInterface depuis ConsultationDecision.bundleFinal
  // 5. Marquer Lead.convertedAt
  // 6. Logger Activity GO_LIVE
  // 7. Notifier CEO + cabinet
}
```

### Feature 3 — Scoring service

```typescript
// lib/services/crm/scoring-service.ts
async function computeScore(leadId: string): Promise<{
  firmographique: number;
  engagement: number;
  enrichissement: number;
  total: number;
}> {
  // Lecture Lead + LeadContacts + Activities + LeadMagnetConsumptions
  // Application des règles workflow 6
  // Update Lead.scoreX et Lead.score
}
```

Appelée dans hooks après :
- Création/update Lead
- Création/update LeadContact
- Création Activity
- Création LeadMagnetConsumption

### Feature 4 — Workspace mode UI

```typescript
// components/crm/PhaseBanner.tsx
// Affiche en haut du dashboard CRM :
// « Phase PRÉCHAUFFAGE J+X / 90. Objectifs : témoignage / case study / audience »
// Progress bars pour chaque objectif
```

### Feature 5 — Import LinkedIn engagements (manuel v1)

```typescript
// app/(app)/crm/content/[id]/import-engagements/page.tsx
// Form : coller liste de noms LinkedIn + type engagement
// Pour chaque ligne : crée LinkedInEngagement
// Suggère création de Lead si profil pas reconnu
```

(En v2 : API LinkedIn pour automatiser)

### Feature 6-18 — (détails dans spec étendue v1.1)

Liste des features restantes à détailler dans la phase de design :
- Feature 6 : Lead detail avec ADKAR panel
- Feature 7 : Activity quick-add modal (note vocale + transcription)
- Feature 8 : Task auto-triggers
- Feature 9 : Lead magnet tracking page
- Feature 10 : Campaign ROI calculation
- Feature 11 : Pipeline drag-and-drop
- Feature 12 : Lead conversion wizard
- Feature 13 : Bundle recommendation viewer
- Feature 14 : Consultation Phase 2 form
- Feature 15 : Activation checklist UI
- Feature 16 : Content piece editor + metrics
- Feature 17 : LinkedIn engagement import
- Feature 18 : Export CSV leads + activities

---

## 8. Intégrations tierces

| # | Service | Rôle | Priorité v1 |
|---|---------|------|-------------|
| 1 | **Supabase Auth** (existant) | Auth CEO | ✓ déjà en place |
| 2 | **Stripe** (existant) | Lien contrat signé → Lead.stage SIGNED | Phase 6 |
| 3 | **Gmail / Outlook** | Webhook activities email | Phase 6 |
| 4 | **LinkedIn** | Engagements + DMs | v2 (API privée, complexe) |
| 5 | **Resend** (existant) | Emails sortants depuis CRM | Phase 6 |

---

## 9. ADRs

### ADR-001 — Intégration module /crm dans le SaaS SAFE

**Statut** : Accepté
**Contexte** : Bâtir CRM standalone vs intégré
**Décision** : Module `/app/(app)/crm/` dans le projet SAFE existant
**Conséquences** :
- Réutilisation de NextAuth, Prisma, Supabase, shadcn, next-intl, i18n
- Une seule base de données (cohérence forte, pas de sync)
- Conversion Lead → Cabinet transactionnelle
- Inconvénient : couplage fort, déploiements liés

### ADR-002 — Multi-tenant futur, monotenant v1

**Statut** : Accepté
**Contexte** : Distributeurs / partenaires possibles à terme
**Décision** : `Workspace` model dès v1 (singleton), tous les Leads liés à `workspaceId`. Pas de UI multi-workspace v1.
**Conséquences** :
- Migration v2 vers multi-tenant peu coûteuse
- Pas de logique complexe à coder maintenant

### ADR-003 — Lead distinct de Cabinet (modèles séparés)

**Statut** : Accepté
**Contexte** : Tentation d'ajouter un flag `isPrespect` sur Cabinet
**Décision** : Modèles séparés `Lead` et `Cabinet`. Conversion explicite.
**Conséquences** :
- Audit trail clair (date conversion, état avant/après)
- Pas de pollution du modèle produit avec des champs CRM
- Inconvénient : duplication ponctuelle de champs (raisonSociale, province)

### ADR-004 — Stockage activities dans notre DB

**Statut** : Accepté
**Contexte** : Stocker emails/DMs dans la DB SAFE vs API externes
**Décision** : Tout dans notre DB. Pas d'appel API au runtime pour afficher la timeline.
**Conséquences** :
- Performance UI rapide
- Scoring possible offline
- Risque : volume si beaucoup de leads. Pagination obligatoire.

### ADR-005 — Garde-fou phase préchauffage

**Statut** : Accepté
**Contexte** : Risque que le CRM incite au pitch outbound froid pendant la phase 90j
**Décision** : `Workspace.workMode` désactive certains workflows UI. Banner permanent.
**Conséquences** :
- Discipline imposée par l'outil
- Inconvénient : si le CEO veut tester un outbound exception, il doit changer le mode (frein volontaire)

---

## 10. Plan de build

### Phase 0 — Spec validée (cette semaine)
- [x] Analyse codebase + KB + marketing
- [x] Spec v1 (ce document)
- [ ] Revue + validation CEO
- [ ] ADRs publiés dans docs/journal/decisions/

### Phase 1 — Schema + migration + seed (3-5 jours)
- Étendre `prisma/schema.prisma`
- Migration sur DB locale + Supabase staging
- Seed avec 10 leads + cliente actuelle convertie

### Phase 2 — Backend + scoring (1-2 semaines)
- Module `lib/services/crm/`
- Zod schemas
- Server actions
- Tests unitaires sur scoring

### Phase 3 — UI prospection (2 semaines)
- 4 pages principales
- Pipeline Kanban
- Composants dans `components/crm/`

### Phase 4 — UI delivery (2 semaines)
- AuditSubmission viewer
- Bundle recommendation
- ActivationChecklist

### Phase 5 — Dashboard + automatisations (1 semaine)
- KPIs phase préchauffage
- Triggers automatiques

### Phase 6 — Intégrations (incrémental)
- Email webhook
- Stripe link
- LinkedIn (v2)

**Effort total** : 8-10 semaines temps partiel

---

## 11. Risques et garde-fous

| Risque | Probabilité | Mitigation |
|--------|------------|-----------|
| Confusion `Client` (avocat) vs `Lead` (prospect SAFE) | Haute | Nommage strict, doc, code review |
| Dérive DB prod | Moyenne | Vérifier avant migration, staging d'abord |
| Scope creep | Haute | Spec figée, v2 explicite |
| Phase préchauffage contournée | Moyenne | UI désactive, banner permanent |
| Données sensibles cabinet en CRM | Moyenne | Pas de données dossier client, seulement métadonnées cabinet |
| Performance avec volume | Faible | Index + pagination |

---

## 12. Glossaire

| Terme | Définition |
|-------|------------|
| **Lead** | Cabinet prospect SAFE (≠ Cabinet client SAFE) |
| **LeadContact** | Personne dans un cabinet prospect |
| **Cabinet** | Cabinet d'avocats client de SAFE (modèle existant) |
| **Client** | Client final du cabinet (modèle existant, pas CRM) |
| **AuditSubmission** | Formulaire d'audit gratuit rempli (modèle existant) |
| **Bundle** | Configuration produit pré-paramétrée par profil cabinet |
| **ADKAR** | Modèle de gestion du changement (Awareness, Desire, Knowledge, Ability, Reinforcement) |
| **Champion interne** | Personne du cabinet qui pousse l'adoption (souvent l'adjoint) |
| **Phase préchauffage** | Période 2026-06-04 → 2026-09-04 sans conversion |
| **Build-in-public** | Stratégie de partage public du processus de construction |

---

**Statut spec v1.0** : SUPERSEDED par v1.1 (voir section ci-dessous)

---

# ÉVOLUTION v1.1 — Console SAFE Inc. (décision 2026-06-05)

Décision CEO : élargir le scope de « CRM » vers « Console de pilotage SAFE Inc. » qui couvre toute l'opération business.

## Reframe

La spec v1.0 ne couvrait que la prospection et le delivery. Le CEO veut une **tour de contrôle complète** avec 7 modules :

1. **Marketing** : prospection (déjà v1.0)
2. **Gestion clients actuels** : vue 360, MRR, rabais, alertes
3. **Support / Tickets** : communication client par billets (NOUVEAU)
4. **Impersonation** : accès direct interface client (NOUVEAU)
5. **Compta SAFE Inc.** : via dog food, SAFE Inc. est un cabinet de SAFE (ADR-006)
6. **Facturation SAFE Inc.** : via dog food
7. **Copilote Claude** : reporté v2 (ANTHROPIC_API_KEY bloquante)

## Nouvelle architecture

```
┌──────────────────────────────────────────────────────────────┐
│  /app/(app)/console/  — Console de pilotage SAFE Inc.        │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ Marketing   │ │ Clients     │ │ Support     │            │
│  │ (Leads)     │ │ (Cabinets)  │ │ (Tickets)   │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Impersonation : « Voir comme Cabinet X » → bridge SAFE  │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                          ↕
       ┌────────────────────────────────────────┐
       │  Cabinets dans le produit SAFE         │
       │                                        │
       │  - Cabinet "SAFE Inc." (dog food)      │
       │    → compta, factures, dépenses        │
       │  - Cabinet cliente actuelle            │
       │  - Futurs cabinets                     │
       └────────────────────────────────────────┘
```

## Modèles ajoutés (3 nouveaux, total 18)

```prisma
model SupportTicket {
  id              String   @id @default(cuid())
  cabinetId       String
  cabinet         Cabinet  @relation(fields: [cabinetId], references: [id])
  createdById     String
  createdBy       User     @relation("TicketCreator", fields: [createdById], references: [id])

  type            TypeTicket
  titre           String
  description     String
  priorite        Priorite  @default(NORMALE)
  statut          StatutTicket  @default(NOUVEAU)

  contexteUrl     String?
  screenshotUrl   String?
  consoleLogs     String?
  assigneeId      String?
  dateResolution  DateTime?
  noteResolution  String?
  satisfactionRating Int?

  replies         TicketReply[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model TicketReply {
  id              String   @id @default(cuid())
  ticketId        String
  ticket          SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId        String
  author          User     @relation(fields: [authorId], references: [id])
  isFromSafeInc   Boolean  @default(false)
  contenu         String
  attachements    String[]
  createdAt       DateTime @default(now())
}

model ImpersonationSession {
  id              String   @id @default(cuid())
  superadminId    String
  superadmin      User     @relation("Impersonator", fields: [superadminId], references: [id])
  cabinetId       String
  cabinet         Cabinet  @relation(fields: [cabinetId], references: [id])

  startedAt       DateTime @default(now())
  endedAt         DateTime?
  reason          String?
  actionsCount    Int      @default(0)
  ipAddress       String?
  userAgent       String?
}

enum TypeTicket { BUG DEMANDE_FEATURE QUESTION REMARQUE URGENCE }
enum StatutTicket { NOUVEAU EN_COURS EN_ATTENTE_CLIENT RESOLU FERME REOUVERT }
```

Voir détails complets dans ADR-006, ADR-007, ADR-008.

## Modules retirés du v1 (dog food)

Le module compta SAFE Inc. dédié et le module facturation SAFE Inc. dédié sont **retirés du scope** : on utilise le produit SAFE existant en provisionnant un Cabinet « SAFE Inc. » qui devient client de son propre produit (ADR-006).

## Plan révisé

| Phase | Contenu | Durée |
|-------|---------|-------|
| 1 | Schema + migration + seed (18 modèles, 11 enums) | 1 sem |
| 2 | Backend services + scoring + tickets service + impersonation auth | 2 sem |
| 3a | UI Console : Marketing (leads, pipeline) | 2 sem |
| 3b | UI Console : Clients (vue 360 cabinets) + Support (tickets) | 1.5 sem |
| 3c | Impersonation system + widget SupportTicket dans produit SAFE | 1 sem |
| 3d | Provisionner Cabinet SAFE Inc. (dog food), premier usage compta/facturation | 0.5 sem |
| 4 | UI Console : Delivery (Audit, Bundle, Activation) | 2 sem |
| 5 | Dashboard Console + automatisations | 1 sem |

**Total v1.1** : **10-12 semaines** (vs 8-10 v1.0). Livrable avant J+90 (2026-09-04).

## Ce qui passe v2 (post case study J+90)

- Marketing automation : séquences email, drip campaigns, A/B tests
- Copilote Claude : tour de contrôle AI (nécessite ANTHROPIC_API_KEY)
- Workflows financiers automatiques : blocage non-paiement, rabais codifiés
- Intégration LinkedIn API (engagements auto-synchronisés)
- Multi-tenant complet pour distributeurs

## ADRs ajoutés

- **ADR-006** : Dog food, SAFE Inc. devient un cabinet de SAFE
- **ADR-007** : Impersonation cross-cabinet
- **ADR-008** : Tickets via widget bidirectionnel

---

**Statut spec v1.1** : DRAFT, en attente validation CEO
**Prochaine étape** : confirmation périmètre → start Phase 1 (schema Prisma 18 modèles)
