# Plan de Transformation SAFE — Cabinet Virtuel Tout-en-Un

**Date :** 2026-04-20
**Statut :** Plan stratégique approuvé pour exécution
**Horizon :** 12-15 mois

---

## 0. Thèse Stratégique

> SAFE n'est pas un logiciel de gestion de cabinet. C'est le **système d'exploitation d'un cabinet juridique moderne**.

Aujourd'hui, un cabinet de 2 à 25 avocats opère avec 8 à 12 outils déconnectés qui coûtent $70 000 à $130 000 CAD/an. Les avocats perdent 30 à 40% de leur temps facturable à cause de la fragmentation. SAFE résout ce problème en unifiant tous les flux du cabinet dans une seule plateforme francophone, conforme au Barreau du Québec, pour moins de $30 000 CAD/an.

**Les 4 piliers de SAFE transformé :**

| Pilier | Rôle |
|---|---|
| **Le Dossier** | Source unique de vérité pour chaque matière cliente |
| **L'Atelier** | Espace de travail (rédaction, appels, réunions) |
| **Le Comptable** | Moteur financier qui capture chaque moment facturable |
| **Le Conseiller IA** | Couche d'intelligence qui amplifie chaque action |

---

## 1. Modèle Mental — L'Architecture Unifiée

Toute l'expérience SAFE tourne autour d'un seul concept :

```
                    LE DOSSIER
                        │
   ┌────────┬───────────┼───────────┬────────┐
   │        │           │           │        │
Rédaction  Appels    Documents   Tâches   Facturation
   │        │           │           │        │
   └────────┴─── CHRONO AUTOMATIQUE ─────────┘
                        │
                  FICHE DE TEMPS
                        │
                    FACTURE
```

**Règles architecturales non-négociables :**

1. **Tout part du dossier** — aucune action orpheline (pas de document sans dossier, pas d'appel sans dossier, pas de temps sans dossier)
2. **Chrono omniprésent** — chaque action dans SAFE génère potentiellement une entrée de temps
3. **IA contextuelle** — l'IA connaît toujours le dossier courant, le client, les faits
4. **Validation humaine** sur toute classification ou facturation automatique
5. **Conformité par design** — règles du Barreau encodées dans les workflows, pas bolted-on

---

## 2. Les 7 Phases de Construction

### État actuel (Phase 0 — Fondations acquises)

SAFE possède déjà :
- Dashboard avec KPI
- CRM clients complet
- Time tracking de base
- Billing / facturation / fidéicommis basique
- Génération de documents (droit familial)
- Comptabilité (journaux, rapprochements)
- Module conformité + audit
- RBAC et contrôle d'accès

---

### PHASE 1 — L'Atelier de Rédaction
**Durée :** 3 mois · **Priorité :** CRITIQUE · **Valeur :** Différenciation majeure

**Objectif :** Transformer SAFE d'un logiciel en un espace de travail.

**Livrables :**

| # | Feature | Description |
|---|---|---|
| 1.1 | Bibliothèque documentaire | Arborescence de dossiers par matière (Correspondance, Procédures, Contrats, Preuves, Factures, Notes internes) |
| 1.2 | Éditeur riche intégré | Éditeur Tiptap dans le dossier, versioning, collaboration |
| 1.3 | Assistant IA de rédaction | Brouillon auto à partir du contexte du dossier + instructions avocat |
| 1.4 | Chrono automatique | Démarre à l'ouverture du document, pause sur inactivité, crée l'entrée de temps |
| 1.5 | Classification IA avec validation | IA suggère le dossier de classement → avocat valide |
| 1.6 | Versioning automatique | Chaque sauvegarde = nouvelle version, historique consultable |
| 1.7 | Export PDF avec en-tête cabinet | Mise en page professionnelle automatique |
| 1.8 | Envoi par email | Depuis le dossier → client → archivé automatiquement |

**Décisions techniques :**
- Éditeur : **Tiptap** (extensible, React-native, prosemirror-based)
- IA : **Claude API** (supérieur pour rédaction juridique longue)
- Stockage : **Supabase Storage** + Postgres metadata
- PDF : **React-PDF** (simple) + **Puppeteer** (complexe)
- Email : **Resend.com** ou **AWS SES**

**MVP Phase 1 (4-6 semaines) pour validation rapide :**
- Bibliothèque documentaire avec arborescence (sans classification IA)
- Éditeur intégré simple (sans IA de rédaction)
- Chrono manuel start/stop dans l'éditeur
- Export PDF basique

---

### PHASE 2 — Le Chrono Intelligent
**Durée :** 1.5 mois (peut chevaucher la fin de Phase 1)
**Priorité :** CRITIQUE · **Valeur :** Récupération de revenu direct

**Objectif :** Éliminer le "revenue leakage" — pré-remplir la fiche de temps de l'avocat.

**Livrables :**

| # | Feature | Description |
|---|---|---|
| 2.1 | Moteur de capture système-wide | Chrono sur tous les modules (document, appel, consultation dossier, recherche) |
| 2.2 | Fiche de temps auto-remplie | Vue quotidienne pré-remplie à 80%, prête à valider |
| 2.3 | Interface de validation fin de journée | Avocat confirme ou ajuste chaque entrée en 2 min |
| 2.4 | Ajout manuel rapide | Pour activités hors-SAFE (tribunal, réunion externe) |
| 2.5 | Règles de facturation par activité | Taux horaire par type d'activité, par avocat, par client |
| 2.6 | Dashboard Revenue Leakage | "Tu as capturé X% de ton temps cette semaine. Manqué estimé : $Y" |
| 2.7 | Rappels intelligents | Notification douce si aucun temps saisi dans les 2 dernières heures |

**Métrique de succès :** +15-25% de temps facturable capturé vs avant SAFE.

---

### PHASE 3 — Le Cahier de Pièces Automatique
**Durée :** 1.5 mois · **Priorité :** HAUTE · **Valeur :** Moat québécois spécifique

**Objectif :** Éliminer une corvée qui prend 4-8 heures par litige.

**Livrables :**

| # | Feature | Description |
|---|---|---|
| 3.1 | Sélecteur de pièces | Depuis la bibliothèque documentaire du dossier |
| 3.2 | Numérotation automatique | P-1, P-2... pour demandeur · D-1, D-2... pour défendeur · configurable |
| 3.3 | Réordonnancement drag-and-drop | Glisser-déposer pour modifier l'ordre |
| 3.4 | Table des matières auto-générée | Avec renvois aux numéros de pièces |
| 3.5 | PDF unifié avec page de garde | Prêt pour dépôt au greffe |
| 3.6 | Templates de procédures | Cour supérieure, Cour du Québec, Tribunal administratif |
| 3.7 | Export pour dépôt électronique | Format compatible avec le greffe numérique |

**Métrique de succès :** Temps de préparation d'un cahier divisé par 5.

---

### PHASE 4 — Le Portail Client
**Durée :** 2.5 mois (en parallèle de Phase 3)
**Priorité :** HAUTE · **Valeur :** Image "grand cabinet"

**Objectif :** Donner au petit cabinet la projection d'un grand cabinet auprès de ses clients.

**Livrables :**

| # | Feature | Description |
|---|---|---|
| 4.1 | Authentification client sécurisée | Magic link ou mot de passe + 2FA optionnel |
| 4.2 | Tableau de bord client | Statut du dossier, prochaines étapes, documents à fournir |
| 4.3 | Partage de documents | Avec accusé de réception horodaté et archivé |
| 4.4 | Messagerie bidirectionnelle | Chaque message archivé dans le dossier côté avocat |
| 4.5 | Upload client avec classification IA | Client envoie des pièces → IA classe → avocat valide |
| 4.6 | Paiement en ligne | Stripe pour factures et retainers |
| 4.7 | Prise de rendez-vous | Calendrier de l'avocat exposé au client |
| 4.8 | Intake formulaire | Nouveaux clients remplissent une fiche → création auto du dossier |

**Conformité :**
- Chiffrement TLS 1.3 + E2E pour messages
- Hébergement canadien obligatoire
- Journal d'audit complet

---

### PHASE 5 — Les Flux Guidés
**Durée :** 2 mois · **Priorité :** HAUTE · **Valeur :** Transforme features en système

**Objectif :** Passer de "ensemble de features" à "système d'exploitation opinioné".

**Livrables :**

| # | Feature | Description |
|---|---|---|
| 5.1 | Assistant ouverture de dossier | Guide étape par étape : identité client → vérification conflits → mandat → retainer → première tâche |
| 5.2 | Templates de tâches par pratique | Checklist auto par type (divorce, succession, litige commercial, corporatif) |
| 5.3 | Checklist de conformité automatique | Obligations Barreau par type de dossier (identification client, consentement, confidentialité) |
| 5.4 | Workflows personnalisables | Chaque cabinet peut adapter les flux à ses méthodes |
| 5.5 | Assistant fermeture de dossier | Checklist : facture finale, retour docs client, archivage, délai rétention |
| 5.6 | Notifications contextuelles | "Le délai de prescription approche", "Facturation à faire", etc. |

**Métrique de succès :** Temps d'ouverture d'un dossier divisé par 3.

---

### PHASE 6 — La Couche Communication
**Durée :** 3.5 mois · **Priorité :** MOYENNE · **Valeur :** Complète la boucle

**Objectif :** Tout ce que fait l'avocat avec un client passe par SAFE.

**Livrables :**

| # | Feature | Description |
|---|---|---|
| 6.1 | Numéro virtuel par avocat | Via Twilio, indicatif régional local |
| 6.2 | Appels browser-based (WebRTC) | Depuis le dossier client, micro/haut-parleur Mac |
| 6.3 | Détection client automatique | Numéro entrant → ouvre le dossier correspondant |
| 6.4 | Transcription temps réel | Whisper API, affichage pendant l'appel |
| 6.5 | Résumé IA post-appel | Points clés, actions à faire, décisions |
| 6.6 | SMS depuis le dossier | Messages texte bidirectionnels |
| 6.7 | Intégration Gmail / Outlook | Emails vers/depuis le client → archivés au dossier |
| 6.8 | Consentement enregistrement | Audio + accusé écrit conforme Barreau |
| 6.9 | Chrono automatique appel | Durée d'appel = entrée de temps validée |

**Décisions techniques :**
- VoIP : **Twilio Voice API**
- Transcription : **OpenAI Whisper API**
- Résumé : **Claude API**
- Email : **Nylas** ou **MS Graph API** + **Gmail API**

---

### PHASE 7 — L'Intelligence Active
**Durée :** Continu à partir du mois 10
**Priorité :** MOYENNE · **Valeur :** Transforme SAFE en conseiller proactif

**Objectif :** SAFE ne réagit plus à l'avocat — il anticipe.

**Livrables :**

| # | Feature | Description |
|---|---|---|
| 7.1 | Analyse rentabilité par dossier | Marge réelle vs estimée, heures budgétées vs réelles |
| 7.2 | Analyse par avocat / par type | Qui est rentable sur quoi, quels types de dossiers gagner |
| 7.3 | Détection de délais critiques | Alertes proactives sur prescriptions, échéances procédurales |
| 7.4 | Recommandations de facturation | "Ce dossier est sous-facturé vs standard du cabinet" |
| 7.5 | Prédiction de durée | Historique similaire → estimation réaliste pour nouveaux dossiers |
| 7.6 | Benchmarking anonymisé | Comparaison aux autres cabinets SAFE (tarifs, durées, rentabilité) |
| 7.7 | Alertes déontologiques | Détection de conflits potentiels, obligations à risque |
| 7.8 | Assistant stratégique cabinet | "Voici les 3 actions pour augmenter la marge de 15% ce mois" |

---

## 3. Stack Technique & Décisions d'Architecture

**Stack actuel (à conserver et étendre) :**
- Frontend : Next.js 14 App Router + TypeScript + Tailwind
- Backend : Prisma + Supabase (Postgres)
- i18n : FR/EN via next-intl
- Auth : Supabase Auth + RBAC custom

**Ajouts stratégiques par phase :**

| Couche | Technologie | Phase |
|---|---|---|
| Éditeur riche | Tiptap (prosemirror) | 1 |
| IA rédaction | Claude API (Sonnet 4.6) | 1 |
| Stockage documents | Supabase Storage + S3 miroir | 1 |
| Génération PDF | React-PDF + Puppeteer | 1, 3 |
| Email transactionnel | Resend.com | 1, 4 |
| Paiement | Stripe (plateforme canadienne) | 4 |
| Téléphonie | Twilio Voice + SMS | 6 |
| Transcription | OpenAI Whisper | 6 |
| Email sync | Nylas / Gmail API / MS Graph | 6 |
| Analytics | Posthog (self-hosted) | 7 |
| Search full-text | Postgres FTS + pgvector | 1, 7 |

**Décisions d'architecture :**

1. **Monolithe modulaire** plutôt que microservices — vélocité > scalabilité prématurée
2. **Data residency Canada** — obligation pour le marché québécois (Supabase AWS ca-central-1)
3. **IA multi-provider** — Claude principal, GPT-4 fallback, pas de dépendance unique
4. **Event-driven pour le chrono** — toutes les actions émettent des événements, le chrono écoute
5. **Validation humaine obligatoire** sur toute automatisation financière ou classement

---

## 4. Conformité & Sécurité (Non-négociable)

**Exigences Barreau du Québec :**
- Hébergement des données au Canada (idéalement Québec)
- Consentement explicite pour utilisation IA sur données clients
- Consentement enregistrement d'appels
- Confidentialité absolue secret professionnel
- Journal d'audit 7 ans
- Rétention comptable 10 ans (LPRPDE + Code civil)

**Mesures techniques :**
- SOC 2 Type II (objectif mois 18)
- Chiffrement at-rest AES-256
- Chiffrement in-transit TLS 1.3
- E2E pour messagerie client
- Backups quotidiens + géo-redondants
- MFA obligatoire pour avocats
- Sessions avec timeout configurable

---

## 5. Pricing Évolutif (Aligné avec les phases)

| Phase | Tier | Prix CAD/avocat/mois | Inclus |
|---|---|---|---|
| Actuel | **Essentiel** | $79 | Dashboard, CRM, billing basique, docs familial |
| Post-Phase 2 | **Professionnel** | $129 | + Atelier de rédaction + Chrono intelligent |
| Post-Phase 4 | **Premium** | $179 | + Cahier de pièces + Portail client + Flux guidés |
| Post-Phase 6 | **Cabinet IA** | $249 | + Téléphonie + Email intégré + Intelligence active |

**Forfait cabinet (20+ avocats) :**
- Essentiel : $1 500/mois (forfait)
- Professionnel : $2 500/mois
- Premium : $3 500/mois
- Cabinet IA : $4 500/mois

**Positionnement :** Même au tier le plus élevé ($4 500/mois = $54 000/an), SAFE reste 50-70% moins cher qu'un stack équivalent en 2026 ($100 000-130 000/an).

---

## 6. Métriques de Succès par Phase

| Phase | KPI principal | Cible |
|---|---|---|
| 1 | Temps moyen de rédaction (brouillon) | ÷ 3 vs Word |
| 2 | % temps facturable capturé | +15-25% vs avant SAFE |
| 3 | Temps préparation cahier de pièces | ÷ 5 |
| 4 | NPS clients du cabinet | > 50 |
| 5 | Temps ouverture nouveau dossier | ÷ 3 |
| 6 | % communications client archivées | 100% |
| 7 | Visibilité rentabilité en temps réel | Dashboard quotidien actif par 80% des associés |

**Métriques business globales (mois 12) :**
- 25 cabinets clients actifs
- 350 utilisateurs payants
- ARR : $500 000 CAD
- Churn < 5% annuel
- NPS > 40

---

## 7. Risques & Mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Hallucinations IA sur documents juridiques | Haute | Critique | Validation obligatoire + garde-fous + disclaimer systématique |
| Fuite de données client | Faible | Catastrophique | SOC 2, audits trimestriels, chiffrement E2E, DLP |
| Compétition de Clio Duo en français | Moyenne | Élevé | Avantage profondeur QC + all-in-one + speed-to-market |
| Résistance au changement chez avocats | Haute | Moyen | Focus sur "revenue leakage" (émotionnel + chiffré) |
| Dépendance à une API IA | Moyenne | Élevé | Multi-provider (Claude + GPT-4), abstraction layer |
| Feature creep / scope drift | Haute | Élevé | Discipline de phase stricte, no Phase N+1 avant Phase N livrée |
| Conformité Barreau QC mal interprétée | Moyenne | Critique | Audit juridique externe avant chaque release majeure |
| Burn rate trop élevé | Moyenne | Élevé | MVP strict Phase 1, monétisation dès tier Pro |

---

## 8. Calendrier Maître

```
Mois  1─2─3 │ PHASE 1 — Atelier de Rédaction (MVP mois 2, complet mois 3)
Mois  3─4   │ PHASE 2 — Chrono Intelligent (chevauche Phase 1)
Mois  5─6   │ PHASE 3 — Cahier de Pièces  ┐
Mois  5─7   │ PHASE 4 — Portail Client    ┘ (parallèles)
Mois  8─9   │ PHASE 5 — Flux Guidés
Mois 10─13  │ PHASE 6 — Couche Communication
Mois 10+    │ PHASE 7 — Intelligence Active (continu)
```

**Jalons de revenus :**
- Mois 3 : Tier Pro lançable → +$50 CAD/avocat/mois
- Mois 7 : Tier Premium lançable → +$50 CAD/avocat/mois
- Mois 13 : Tier Cabinet IA → +$70 CAD/avocat/mois

---

## 9. Prochaine Étape Immédiate (Cette Semaine)

1. **Valider ce plan** avec l'équipe et le board
2. **Écrire la spec détaillée de la Phase 1** en format Delivery Pipeline (~/Desktop/Delivery Syst/)
3. **Prototyper l'éditeur Tiptap intégré** dans un dossier client (2 jours)
4. **Valider l'architecture IA** avec un premier appel Claude API pour rédaction de lettre
5. **Setup du repo de test** pour isoler les développements Phase 1
6. **Recruter/allouer** : 1 dev full-stack senior + 1 designer produit + 1 QA pour Phase 1

**Décision critique à prendre :**
- Construire en interne vs sous-traiter partie de Phase 1
- Budget Phase 1 estimé : $35 000 - $55 000 CAD (3 mois, 2 personnes équivalent plein temps)

---

## 10. Philosophie d'Exécution

> **"Ship, measure, iterate. Pas de perfection avant le feedback."**

- Chaque phase livre une valeur autonome (pas de features en attente d'autres features)
- Feedback utilisateur toutes les 2 semaines (beta testeurs cabinets amis)
- MVP strict : si ça peut être coupé, c'est coupé
- Dette technique acceptable en Phase 1-3, nettoyée en Phase 4-5
- Pas de release majeure sans test de conformité Barreau

---

**Document évolutif — mis à jour à chaque fin de phase.**
