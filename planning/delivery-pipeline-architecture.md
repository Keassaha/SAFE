# Architecture du Pipeline de Delivery SAFE

> Version : 1.0 — 2026-04-11
> Statut : Proposition d'architecture — à valider avant implémentation

---

## Table des matières

1. [Contexte et objectif](#1-contexte-et-objectif)
2. [Cartographie de l'existant](#2-cartographie-de-lexistant)
3. [Diagnostic de l'analyse initiale](#3-diagnostic-de-lanalyse-initiale)
4. [Architecture cible : 3 phases](#4-architecture-cible--3-phases)
5. [Contrats de données entre phases](#5-contrats-de-données-entre-phases)
6. [Knowledge Base](#6-knowledge-base)
7. [Boucles de correction](#7-boucles-de-correction)
8. [Intégration avec le codebase SAFE](#8-intégration-avec-le-codebase-safe)
9. [Structure de fichiers](#9-structure-de-fichiers)
10. [Ordre de construction](#10-ordre-de-construction)

---

## 1. Contexte et objectif

### Le problème

Chaque nouveau cabinet d'avocats client nécessite :
- Comprendre son contexte juridique (province, domaine, taille)
- Identifier ses besoins opérationnels (facturation, fidéicommis, gestion de dossiers)
- Configurer SAFE pour ce cabinet (CabinetInterface, modules, rôles)
- Potentiellement développer des fonctionnalités manquantes

Ce processus est aujourd'hui **manuel et non reproductible**. L'objectif est de le **systématiser** via un pipeline assisté par IA, sans le rendre entièrement automatique.

### Ce que le pipeline N'EST PAS

- Ce n'est pas un système d'agents autonomes. C'est un processus en 3 phases guidé par des prompts structurés.
- Ce n'est pas un remplacement du développement. La Phase 3 est du dev normal.
- Ce n'est pas un pipeline linéaire. Des boucles de correction sont prévues entre chaque phase.

---

## 2. Cartographie de l'existant

### Ce qui existe déjà dans SAFE V2 et qui alimente le pipeline

| Composant existant | Où dans le code | Rôle dans le pipeline |
|---|---|---|
| **AuditChat** | `components/audit/AuditChat.tsx` | Questionnaire 7 piliers = entrée Phase 1 |
| **AuditSubmission** | Prisma model | Stocke les réponses, scores, rapport JSON |
| **CabinetInterface** | Prisma model | Config dynamique par tenant (onglets, modules, widgets, disciplines) |
| **RBAC** | `lib/auth/rbac.ts` | 7 rôles employés, matrice permissions par module |
| **Facturation** | `lib/services/billing/` | Invoice, paiements, intérêts, credit notes, allocation |
| **Fidéicommis** | `app/api/fideicommis/` | Dépôts, retraits, rapprochement, relevés |
| **Gestion dossiers** | `app/(app)/dossiers/` | Notes, tâches, actes, pièces, procédures, jugements |
| **LexTrack** | `app/(app)/gestion/lextrack/` | Workflow procédural (phases, task board) |
| **Document Generator** | `lib/documents/famille/` | 124 types, taxonomie, prompts XML, génération IA |
| **Import** | `app/(app)/import/` | Import SAFE, Excel, relevés bancaires |
| **Journal** | `app/(app)/journal/` | Append-only, catégorisation auto, import bancaire |

### Le questionnaire AuditChat — 7 piliers

Le composant AuditChat collecte déjà les données structurées nécessaires :

1. **Identification** — Province, type de pratique, taille de l'équipe
2. **Gestion des dossiers** — Méthode de suivi, checklists, rétention
3. **Délais & prescriptions** — Système de rappels, historique de délais manqués
4. **Accueil client** — Conflits d'intérêts, mandats, consentement Loi 25
5. **Facturation** — Mode (horaire/forfait/contingent), taux, taux de recouvrement
6. **Fidéicommis** — Gestion, fréquence de rapprochement, ségrégation
7. **Conformité** — Heures admin, confiance inspection Barreau, Loi 25

**Output existant** : `AuditSubmission.reponses` (JSON) + `scoreGlobal` (0-100) + `scores` (par pilier) + `rapport` (JSON) + `configSafe` (JSON → CabinetInterface)

### Agents existants (safe-project V1 — référence uniquement)

8 agents définis dans `Projects/safe-project/.claude/agents/` :
- `archi.md`, `back.md`, `front.md`, `ia-engineer.md`, `nova-ux.md`, `qa.md`, `researcher.md`, `story.md`

39 skills dans `Projects/safe-project/.claude/skills/`

**Note** : Ces agents sont définis pour le dev produit (V1 Supabase), pas pour le delivery client. Le pipeline de delivery utilise des **prompts de phase**, pas ces agents.

---

## 3. Diagnostic de l'analyse initiale

### 7 failles identifiées dans le design "8 agents séparés"

| # | Faille | Impact | Correction |
|---|--------|--------|------------|
| 1 | **8 agents = 8 contextes isolés** | Perte de nuance entre agents. Claude Code n'a pas d'agents persistants — chaque invocation repart de zéro. | 3 phases avec subagents parallèles dans une même session |
| 2 | **Pipeline résout le mauvais problème** | L'extraction est facile ; la connaissance domaine est le goulot. | Knowledge base pré-remplie AVANT le premier client |
| 3 | **Pas de Gap Analysis** | Risque de reconstruire ce qui existe ou ignorer ce qui est configurable | Phase 2 = gap analysis comme étape centrale |
| 4 | **Le Builder ne peut pas builder** | Impossible d'absorber 25 dossiers de composants + 20 routes + Prisma en un prompt | Phase 3 = dev normal feature par feature, pas un "agent builder" |
| 5 | **Pipeline linéaire pour un problème cyclique** | Pas de retour arrière prévu | Boucles de correction explicites entre chaque phase |
| 6 | **KB organisée par domaine juridique** | Quand on configure la facturation, il faut chercher dans 5 fichiers de domaines différents | KB organisée par module SAFE + variations par domaine |
| 7 | **Pas de chemin "hors scope"** | Besoin non supporté = pipeline bloqué | Backlog produit alimenté automatiquement |

### Ce que l'analyse initiale avait de bon

- Séparation recherche juridique / recherche opérationnelle (parallélisable)
- Validation humaine avant le build
- Templates de fichiers intermédiaires comme contrats de données
- Base de connaissances cumulative enrichie par chaque client
- Fichier de feedback par client

---

## 4. Architecture cible : 3 phases

```
╔═════════════════════════��════════════════════════════════════╗
║                    PHASE 1 — COMPRENDRE                     ║
║                    (une seule session)                       ║
║                                                              ║
║  ENTRÉE : AuditSubmission.reponses (JSON existant)           ║
║                                                              ║
║  ┌─────────────────┐                                         ║
║  │  EXTRACTION       │ → Normalise les réponses brutes       ║
║  │                   │   en CLIENT-PROFILE.md                ║
║  └────────┬──────────┘                                       ║
║           │                                                  ║
║           ▼                                                  ║
║  ┌─────────────────┐    ┌──────────────────┐                 ║
║  │ RECHERCHE         │    │ RECHERCHE          │  ← parallèle ║
║  │ JURIDIQUE         │    │ OPÉRATIONNELLE     │               ║
║  │                   │    │                    │               ║
║  │ Consulte KB       │    │ Consulte KB        │               ║
║  │ modules-safe/     │    │ roles/             │               ║
║  │ reglementation/   │    │ patterns-clients/  │               ║
║  └────────┬──────────┘    └────────┬───────────┘              ║
║           │                        │                         ║
║           └───────────┬────────────┘                         ║
║                       ▼                                      ║
║  ┌───────────────────────────────┐                           ║
║  │  SYNTHÈSE                      │                           ║
║  │  Fusionne juridique +          │                           ║
║  │  opérationnel → BESOINS.md     │                           ║
║  │  classés par module SAFE       │                           ║
║  └───────────────────────────────┘                           ║
║                                                              ║
║  OUTPUT : CLIENT-PROFILE.md + BESOINS.md                     ║
║                                                              ║
║  ┌────────────────────────────────────────────┐              ║
║  │  GATE HUMAINE : tu valides les besoins.    │              ║
║  │  Tu corriges, complètes, priorises.        │              ║
║  └────────────────────────────────────────────┘              ║
╚══════════════════════════════════════════════════════════════╝
                            │
                            ▼
╔══════════════════════════════════════════════════════════════╗
║                    PHASE 2 — SPÉCIFIER                      ║
║                    (une seule session)                       ║
║                                                              ║
║  ENTRÉE : BESOINS.md validés + codebase SAFE                 ║
║                                                              ║
║  ┌───────────────────────────────┐                           ║
║  │  GAP ANALYSIS                  │                           ║
║  │                                │                           ║
║  │  Pour chaque besoin, compare   │                           ║
║  │  avec les modules SAFE :       │                           ║
║  │                                │                           ║
║  │  ✓ Existe → configurer         │                           ║
║  │  ~ Partiel → adapter           │                           ║
║  │  ✗ Absent → développer         │                           ║
║  │  ⊘ Hors scope → backlog        │                           ║
║  └────────────┬──────────────────┘                           ║
║               ▼                                              ║
║  ┌───────────────────────────────┐                           ║
║  │  SPEC TECHNIQUE                │                           ║
║  │                                │                           ║
║  │  Par feature à développer :    │                           ║
║  │  - User story                  │                           ║
║  │  - Règles métier               │                           ║
║  │  - Modèle de données (Prisma)  │                           ║
║  │  - Composants à créer          │                           ║
║  │  - Composants à réutiliser     │                           ║
║  │  - Route(s) concernée(s)       │                           ║
║  └───────────────────────────────┘                           ║
║                                                              ║
║  OUTPUT : GAP-ANALYSIS.md + SPEC.md                          ║
║                                                              ║
║  ┌────────────────────────────────────────────┐              ║
║  │  GATE HUMAINE : tu valides la spec.        │              ║
║  │  Tu décides quoi builder maintenant        │              ║
║  │  vs quoi mettre au backlog.                │              ║
║  └────────────────────────────────────────────┘              ║
╚══════════════════════════════════════════════════════════════╝
                            │
                            ▼
╔══════════════════════════════════════════════════════════════╗
║                  PHASE 3 — CONSTRUIRE                       ║
║              (sessions normales de dev)                      ║
║                                                              ║
║  ENTRÉE : SPEC.md validée                                    ║
║                                                              ║
║  Pour chaque feature approuvée :                             ║
║  1. Session Claude Code normale                              ║
║  2. Donne la spec de la feature                              ║
║  3. Code, test, commit                                       ║
║  4. Vérification humaine                                     ║
║                                                              ║
║  C'est du développement classique.                           ║
║  Pas d'agent builder spécial.                                ║
║                                                              ║
║  OUTPUT : Code committé + DELIVERY-LOG.md                    ║
╚══════════════════════════════════════════════════════════════╝
                            │
                            ▼
╔══════════════════════════════════════════════════════════════╗
║                    POST-DELIVERY                            ║
║                                                              ║
║  ┌───────────────────────────────┐                           ║
║  │  REVIEW                        │                           ║
║  │  - Spec vs réalité             │                           ║
║  │  - Besoins non couverts        │                           ║
║  │  - Leçons apprises             │                           ║
║  └────────────┬──────────────────┘                           ║
║               ▼                                              ║
║  ┌───────────────────────────────┐                           ║
║  │  KNOWLEDGE UPDATE              │                           ║
║  │  - Enrichir la KB              │                           ║
║  │  - Nouveau pattern-client      │                           ║
║  │  - Nouvelles règles découvertes│                           ║
║  └───────────────────────────────┘                           ║
╚══════════════════════════════════════════════════════════════╝
```

### Pourquoi 3 phases et pas 8 agents

| Critère | 8 agents séparés | 3 phases |
|---------|-----------------|----------|
| Contexte partagé | Non — chaque agent repart de zéro | Oui — subagents dans une même session |
| Perte de nuance | ~60-70% entre agent 1 et 8 | Minimale — une phase = un contexte complet |
| Parallélisme | Séquentiel uniquement | Recherche juridique ∥ opérationnelle |
| Complexité d'orchestration | Agent 0 requis | Gates humaines simples |
| Flexibilité | Rigide — pipeline linéaire | Boucles de correction à chaque gate |

---

## 5. Contrats de données entre phases

Chaque phase produit des fichiers Markdown avec frontmatter YAML obligatoire. Ce frontmatter est le **contrat** : si un champ obligatoire manque, la phase suivante ne démarre pas.

### CLIENT-PROFILE.md (output Phase 1)

```yaml
---
client: [identifiant]
cabinet: [nom légal]
province: QC|ON|BC|AB|...
date_extraction: YYYY-MM-DD
source: audit_gratuit|audit_premium|onboarding
confiance: 0-100
champs_manquants: [liste] ou "aucun"
audit_submission_id: [uuid si existant]
---
```

Sections obligatoires :
- `## Identité du cabinet` — nom, ville, nb avocats, nb employés, année fondation
- `## Domaines de pratique` — liste ordonnée par volume avec % estimé
- `## Structure des rôles` — tableau Rôle / Personne / Responsabilités
- `## Outils actuels` — comptabilité, gestion dossiers, facturation, temps
- `## Douleurs exprimées` — citations directes du formulaire
- `## Besoins exprimés` — ce que le client dit vouloir
- `## Signaux implicites` — déductions avec score de confiance

### BESOINS.md (output Phase 1)

```yaml
---
client: [identifiant]
date_analyse: YYYY-MM-DD
total_besoins: [n]
priorite_haute: [n]
priorite_moyenne: [n]
priorite_basse: [n]
---
```

Sections obligatoires :
- `## Besoins par module SAFE` — groupés par module (facturation, fidéicommis, dossiers, etc.)
- Pour chaque besoin : description, priorité (haute/moyenne/basse), source (exprimé/implicite), module SAFE cible
- `## Contraintes réglementaires` — règles applicables selon province/domaine
- `## Besoins hors périmètre SAFE` — identifiés mais non traitables

### GAP-ANALYSIS.md (output Phase 2)

```yaml
---
client: [identifiant]
date_analyse: YYYY-MM-DD
total_besoins: [n]
deja_supportes: [n]
a_adapter: [n]
a_developper: [n]
hors_scope: [n]
---
```

Sections obligatoires :
- `## ✓ Déjà supporté` — besoin, module SAFE, action de configuration
- `## ~ Partiellement supporté` — besoin, module, ce qui existe, ce qui manque, effort
- `## ✗ À développer` — besoin, module cible, description technique, effort, priorité
- `## ⊘ Hors scope` — besoin, raison, alternative proposée, ajouté au backlog?

### SPEC.md (output Phase 2)

```yaml
---
client: [identifiant]
date_spec: YYYY-MM-DD
nb_features: [n]
nb_configurations: [n]
---
```

Pour chaque feature :
- User story
- Règles métier
- Impact Prisma (nouveau modèle? champ ajouté?)
- Route(s) Next.js concernée(s)
- Composants à créer (avec props attendues)
- Composants existants à réutiliser (avec chemin)
- Dépendances (features qui doivent exister avant)

### DELIVERY-LOG.md (output Phase 3)

```yaml
---
client: [identifiant]
date_debut: YYYY-MM-DD
date_fin: YYYY-MM-DD
nb_features_livrees: [n]
nb_configurations: [n]
nb_interventions_manuelles: [n]
---
```

- `## Features livrées` — feature, commit(s), route(s) affectée(s)
- `## Configurations appliquées` — module, paramètre, valeur
- `## Problèmes rencontrés` — description, résolution
- `## Besoins au backlog` — features reportées avec raison

---

## 6. Knowledge Base

### Principe : organisée par module SAFE, pas par domaine juridique

Un cabinet de droit familial et un cabinet de droit criminel utilisent tous les deux le module de facturation. La différence est dans les **règles** de facturation, pas le module. Organiser par module permet une recherche ciblée.

### Structure

```
/knowledge-base/
├── INDEX.md                            ← Carte de tout ce qui existe
│
├── /modules-safe/                      ← Par ce que SAFE fait
│   ├── facturation/
│   │   ├── regles-generales.md         ← Ce qui s'applique à tous
│   │   ├── variations-familial.md      ← Spécificités droit familial
│   │   ├── variations-criminel.md
│   │   └── variations-immigration.md
│   ├── fideicommis/
│   │   ├── regles-barreau-quebec.md    ← B-1, r.5 articles 2-16
│   │   ├── regles-lso-ontario.md
│   │   └── operations-types.md
│   ├── gestion-dossiers/
│   │   ├── types-par-domaine.md
│   │   └── workflows-classement.md
│   ├── temps/
│   │   ├── modeles-facturation.md      ← horaire, forfait, mixte, aide juridique
│   │   └── regles-par-domaine.md
│   └── conformite/
│       ├── barreau-quebec.md
│       ├── loi-25-vie-privee.md
│       └── guide-ia-barreau.md
│
├── /reglementation/                    ← Par province
│   ├── quebec/
│   │   ├── code-deontologie.md
│   │   ├── reglement-comptabilite.md   ← B-1, r.5
│   │   └── tarif-judiciaire.md
│   └── ontario/
│       ├── lso-rules.md
│       └── trust-accounting.md
│
├── /roles/                             ← Par rôle dans le cabinet
│   ├── avocat-solo.md
│   ├── bookkeeper-externe.md
│   ├── bookkeeper-interne.md
│   ├── assistant-juridique.md
│   └── adjoint-administratif.md
│
└── /patterns-clients/                  ← Apprentissages des déploiements
    ├── cabinet-solo-familial.md        ← Template le plus commun
    ├── cabinet-3avocats-mixte.md
    └── erreurs-frequentes.md
```

### Règle de recherche pour les prompts

Quand Phase 1 ou Phase 2 a besoin d'informations sur la facturation d'un cabinet de droit familial au Québec :

1. `modules-safe/facturation/regles-generales.md` — ce que SAFE fait
2. `modules-safe/facturation/variations-familial.md` — ce qui est spécifique au domaine
3. `reglementation/quebec/reglement-comptabilite.md` — les obligations légales
4. `patterns-clients/cabinet-solo-familial.md` — ce qui a marché avant

Quatre lectures ciblées au lieu d'un fichier monolithique `droit-familial.md`.

### Enrichissement post-delivery

Après chaque client livré, la review identifie :
- Nouvelles règles découvertes → ajoutées dans `modules-safe/` ou `reglementation/`
- Nouveau pattern client → ajouté dans `patterns-clients/`
- Erreurs fréquentes → ajoutées dans `patterns-clients/erreurs-frequentes.md`

---

## 7. Boucles de correction

Le pipeline n'est pas linéaire. Chaque gate humaine est un point de décision avec 3 options :

```
GATE HUMAINE
    │
    ├── ✓ Valider → passer à la phase suivante
    │
    ├── ↻ Corriger → relancer la phase avec les corrections
    │                  (pas besoin de tout recommencer)
    │
    └── ← Reculer → retour à la phase précédente
                      (ex: info manquante du client)
```

### Scénarios de correction courants

| Situation | Action |
|-----------|--------|
| Il manque une info client dans le profil | Retour Phase 1 : compléter via contact client |
| Un besoin contredit une règle du Barreau | Phase 2 le signale dans GAP-ANALYSIS sous "contrainte" |
| SAFE ne supporte pas un besoin | Phase 2 classe en "hors scope" → backlog produit |
| Le client change d'avis après la spec | Relancer Phase 2 avec les nouveaux besoins |
| Bug découvert pendant le build | Résolution en Phase 3, pas de retour de phase |
| Le client demande des modifications post-livraison | Nouveau cycle Phase 2 → Phase 3 pour les modifications |

### Fichier feedback.md par client

Capture les modifications demandées et décisions prises. Sert de mémoire pour les boucles de correction.

```yaml
---
client: [identifiant]
---

## YYYY-MM-DD — [Description du changement]
- **Demandé par** : client | interne
- **Impact** : Phase 1 | Phase 2 | Phase 3
- **Décision** : [ce qui a été décidé]
- **Raison** : [pourquoi]
```

---

## 8. Intégration avec le codebase SAFE

### Phase 1 → AuditSubmission existant

Phase 1 ne remplace pas AuditChat. Elle le **complète** :

1. Le client remplit l'audit via AuditChat (existant)
2. L'AuditSubmission est créée avec reponses JSON + scores (existant)
3. Le prompt Phase 1 lit l'AuditSubmission et produit CLIENT-PROFILE.md + BESOINS.md (nouveau)

L'avantage : on ne change rien à l'existant. Phase 1 est une couche d'analyse au-dessus.

### Phase 2 → Modules SAFE existants

Le gap analysis de Phase 2 doit connaître ce que SAFE sait faire. Voici la cartographie complète :

| Module SAFE | Routes | Modèles Prisma clés | Capacités |
|---|---|---|---|
| **Tableau de bord** | `/tableau-de-bord` | — | KPIs, factures en attente, échéances |
| **Clients** | `/clients`, `/clients/[id]` | Client, ClientIdentityVerification, ConsentLog | Registre, vérification identité, Loi 25 |
| **Dossiers** | `/dossiers`, `/dossiers/[id]` | Dossier, DossierNote, DossierTache, DossierPiece, DossierProcedure, DossierJudgment, DossierCorrespondence, DossierClosure | Gestion complète de dossiers juridiques |
| **LexTrack** | `/gestion/lextrack` | DossierActe | Workflow procédural (4 phases) |
| **Temps** | `/temps`, `/fiches-de-temps` | TimeEntry | Saisie, validation, statuts de facturation |
| **Facturation** | `/facturation/*` | Invoice, InvoiceLine, InvoiceItem, InvoiceReminder, InterestCharge, BillingRun | Factures, envoi email, lien public, rappels, intérêts |
| **Paiements** | `/facturation/paiements` | Payment, PaymentAllocation | Réception, allocation, rapprochement |
| **Notes de crédit** | `/facturation/notes-de-credit` | CreditNote | Création, application partielle/totale |
| **Honoraires** | `/facturation/honoraires` | (config dans Cabinet) | Taux horaires par avocat, par client |
| **Fidéicommis** | `/comptes` | TrustAccount, TrustTransaction, DossierTrustMovement | Dépôts, retraits, corrections, relevés, soldes |
| **Journal général** | `/journal/general` | JournalGeneralEntry | Append-only, 8 types de transactions |
| **Journal dépenses** | `/journal/depenses` | BankImportSession, BankImportTransaction, CabinetExpense, ExpenseCategory | Import bancaire, catégorisation auto |
| **Employés** | `/employees` | Employee, PayrollPeriod, Payslip | Gestion, paie, rôles RBAC |
| **Rapports** | `/rapports` | — | Dashboard de rapports |
| **Import** | `/import` | ImportHistory | Import SAFE, Excel, relevés bancaires |
| **Documents** | `/outils/generateur-documents` | Document | Génération IA famille (124 types) |
| **Calculateur** | `/outils/calculateur-familial` | — | Calculs droit familial |
| **Paramètres** | `/parametres/*` | CabinetInterface, DocumentRetentionPolicy | Config interface, rétention, envoi factures |
| **Audit log** | `/parametres/audit` | AuditLog | Trail de conformité |
| **Onboarding** | `/onboarding` | — | Workflow d'accueil post-inscription |

### Phase 2 → CabinetInterface

Le modèle `CabinetInterface` stocke déjà la configuration dynamique par cabinet :

```
ongletsActifs      — onglets visibles dans le menu
ongletsMasques     — onglets cachés
modules            — modules activés
widgets            — widgets du dashboard
disciplines        — domaines de pratique
checklistsParType  — checklists par type de dossier
modeFacturation    — mode de facturation par défaut
conformite         — paramètres de conformité
```

Le gap analysis de Phase 2 doit produire une **proposition de CabinetInterface** pour le client, en plus des features à développer.

### Phase 3 → Développement normal

Phase 3 n'a pas de prompt spécial. C'est une session Claude Code standard où on donne :
- La spec de la feature (depuis SPEC.md)
- Le contexte du codebase (patterns à suivre)

**Patterns à respecter** (dérivés du codebase existant) :
- Server actions avec `"use server"` + validation Zod + `requireCabinetAndUser()`
- `revalidatePath()` après chaque mutation
- Composants dans `components/[module]/`
- Routes dans `app/(app)/[module]/`
- Services dans `lib/services/[module]/`
- Types dans `types/` ou inline
- Multi-tenancy : toute requête scopée par `cabinetId`
- RBAC : vérification des permissions via `can()` avant chaque action
- Audit : log dans AuditLog pour les opérations sensibles

---

## 9. Structure de fichiers

```
/safe-delivery/
│
├── CLAUDE.md                           ← Contexte global du pipeline
│                                          Chargé automatiquement par Claude Code
│
├── /prompts/                           ← Prompts de phase (pas des "agents")
│   ├── phase-1-comprendre.md           ← Prompt unique Phase 1
│   ├── phase-2-specifier.md            ← Prompt unique Phase 2
│   └── post-delivery-review.md         ← Prompt de review
│
├── /templates/                         ← Contrats de données entre phases
│   ├── CLIENT-PROFILE.template.md
│   ├── BESOINS.template.md
│   ├── GAP-ANALYSIS.template.md
│   ├── SPEC.template.md
│   ├── DELIVERY-LOG.template.md
│   └── REVIEW.template.md
│
├── /clients/                           ← Un dossier par client
│   └── /[client-id]/
│       ├── 01-profil.md                ← Output Phase 1
│       ├── 02-besoins.md              ← Output Phase 1
│       ├── 03-gap-analysis.md         ← Output Phase 2
│       ├── 04-spec.md                 ← Output Phase 2
│       ├── 05-delivery-log.md         ← Output Phase 3
│       ├── 06-review.md              ← Post-delivery
│       └── feedback.md               ← Changements demandés
│
├── /knowledge-base/                    ← (structure détaillée section 6)
│   ├── INDEX.md
│   ├── /modules-safe/
│   ├── /reglementation/
│   ├── /roles/
│   └── /patterns-clients/
│
└── /backlog/                           ← Besoins que SAFE ne supporte pas encore
    ├── INDEX.md
    └── /feature-requests/
        └── YYYY-MM-[client]-[feature].md
```

---

## 10. Ordre de construction

### Étape 1 — Knowledge Base initiale (priorité absolue)

Pré-remplir avec ce qu'on sait déjà. Sans ça, Phase 1 et Phase 2 manquent de contexte domaine.

Contenu minimum pour le premier client (droit familial QC) :
- `modules-safe/facturation/regles-generales.md`
- `modules-safe/facturation/variations-familial.md`
- `modules-safe/fideicommis/regles-barreau-quebec.md`
- `reglementation/quebec/reglement-comptabilite.md`
- `roles/avocat-solo.md`
- `roles/bookkeeper-externe.md`

### Étape 2 — Templates (contrats de données)

Écrire les 6 templates avec frontmatter YAML + sections obligatoires. Ce sont les contrats qui garantissent la cohérence entre phases.

### Étape 3 — CLAUDE.md du pipeline

Contexte global chargé automatiquement. Décrit :
- Ce qu'est le pipeline
- Comment naviguer les fichiers
- Règles d'or (ne pas builder en Phase 1-2, toujours consulter la KB, etc.)

### Étape 4 — Prompt Phase 1

Le premier prompt. Le plus simple et le plus critique.
- Lit les réponses AuditSubmission
- Consulte la KB
- Produit CLIENT-PROFILE.md + BESOINS.md

### Étape 5 — Test avec un vrai client

Faire passer un client réel dans Phase 1. Corriger le prompt et les templates selon les résultats.

### Étape 6 — Prompt Phase 2

Seulement après que Phase 1 est prouvée.
- Lit BESOINS.md + cartographie des modules SAFE
- Produit GAP-ANALYSIS.md + SPEC.md

### Étape 7 — Itérer

Chaque client livré enrichit la KB et améliore les prompts.

---

## Annexe A — Comparaison ancien vs nouveau design

| Aspect | Design initial (8 agents) | Design corrigé (3 phases) |
|--------|--------------------------|--------------------------|
| Architecture | 8 agents séparés | 3 phases avec subagents parallèles |
| Orchestration | Agent 0 (automatique) | Gates humaines (toi) |
| Pipeline | Linéaire | Cyclique avec boucles de correction |
| KB | Par domaine juridique | Par module SAFE + variations |
| Build | Agent Builder auto-génère | Dev normal feature par feature |
| Gap analysis | Absent | Étape centrale de Phase 2 |
| Chemin "hors scope" | Absent | Backlog produit alimenté |
| Contrats de données | Implicites | Templates stricts avec frontmatter |
| Intégration codebase | Déconnectée | Cartographie modules SAFE dans Phase 2 |
| Knowledge base | Se construit par client | Pré-remplie, enrichie par client |
| Métriques | Absentes | DELIVERY-LOG + REVIEW par client |

## Annexe B — Modules SAFE avec routes et modèles

(Voir section 8 — tableau complet des modules)
