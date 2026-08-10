# Cahier des charges — CRM intelligent SAFE Inc.

> **Statut** : DRAFT v1, à valider par le CEO avant tout build.
> **Date** : 2026-07-30
> **Portée** : le CRM interne de SAFE Inc. (module `/console`), pas une feature produit
> destinée aux cabinets. Le CRM sert SAFE Inc. à vendre SAFE.
> **Documents liés** : [CRM_SPEC_v1.md](CRM_SPEC_v1.md), [AUDIT_SCHEMA_CANONIQUE](../audit/AUDIT_SCHEMA_CANONIQUE.md),
> [SAFE_BUNDLE_LIBRARY](../bundles/SAFE_BUNDLE_LIBRARY.md), [DESIGN_HUMAIN](../design/DESIGN_HUMAIN.md).
>
> **⚠️ Extension** : les sections 26 à 73 (comptabilité, facturation, couche cognitive) sont
> dans [CAHIER_DES_CHARGES_CRM_EXTENSION_COMPTA_TDAH.md](CAHIER_DES_CHARGES_CRM_EXTENSION_COMPTA_TDAH.md).
> **La roadmap de l'extension (section 72) remplace celle de la section 20 ci-dessous.**

---

## Comment lire ce document

Trois conventions, appliquées partout.

**Marquage des affirmations.** Chaque règle juridique porte sa source officielle. Ce qui
n'est pas sourcé est une recommandation d'architecture, pas une obligation. Les zones
d'incertitude sont marquées `⚠️ À VÉRIFIER` et ne doivent pas être traitées comme acquises.

**Delta, pas page blanche.** Le schéma Prisma compte déjà 96 modèles, dont 20 dans la zone
CRM. Le modèle de données de la section 6 est un **delta** sur l'existant. Chaque table
demandée dans la commande est classée : existe déjà, à étendre, à créer, ou à ne pas créer
avec la justification.

**Niveau d'autonomie explicite.** Toute capacité IA porte son niveau : N1 suggestion,
N2 préparation avec approbation, N3 exécution préautorisée. Aucune capacité n'est en N3
par défaut.

---

## 0. État des lieux au 2026-07-30

Ce qui suit est vérifié dans le code, pas déclaré.

### Déjà construit et fonctionnel

| Brique | Où | État |
|---|---|---|
| Modèles CRM | `prisma/schema.prisma` L3116-3636 | 20 modèles : Workspace, Lead, LeadContact, Activity, Task, Campaign, LeadMagnet, LeadMagnetConsumption, ContentPiece, LinkedInEngagement, BundleRecommendation, ConsultationPhase2, ConsultationDecision, ActivationChecklist, SupportTicket, SupportConversation, SupportMessage, SupportAttachment, TicketReply, ImpersonationSession |
| Pipeline 13 étapes | enum `StageLead` | AWARENESS → AMBASSADOR, drag-and-drop fonctionnel |
| Scoring 3 dimensions | `lib/services/crm/scoring.ts` | Firmographique 40 + engagement 40 + enrichissement 20. **Plafonné en pratique**, voir plus bas |
| Tour de contrôle | `lib/services/crm/prochaine-action.ts` | Prochaine action clé + file d'attente, 7 sources d'urgence, règle de silence sur report |
| Moteur de courriel | `lib/services/crm/courriel.ts`, `lib/crm/gabarits.ts` | 6 gabarits, aperçu obligatoire, refus durs, pied LCAP, désabonnement signé HMAC |
| Assistant de prospection | `lib/ai/proposer-actions-crm.ts` | Propose 1 à 3 tâches par cabinet, acceptation manuelle, incertitudes affichées |
| Support bidirectionnel | `app/(app)/console/support/` | Chat temps réel cabinet ↔ SAFE Inc. |
| Socle IA | `lib/ai/` | 4 capacités en production, `@anthropic-ai/sdk`, clé présente en local |
| Envoi de courriel | `lib/email.ts` | Resend branché |
| Journal d'audit | modèle `AuditLog` | Par cabinet, réutilisable pour SAFE Inc. |

### Trous confirmés

| Trou | Conséquence | Priorité |
|---|---|---|
| **Conversion Lead → Cabinet inexistante** | `Lead.cabinetId` est lu partout, écrit nulle part. Les étapes SIGNED → ACTIVATION → LIVE sont décoratives. La page `/console/clients` restera vide | P0 |
| **Gardes d'accès incohérentes** | Le layout exige `isInternal` + admin, les server actions préexistantes vérifient seulement `isSafeIncCabinet`. Un non-admin du cabinet SAFE peut les appeler directement | P0 |
| **Scoring engagement plafonné** | `LinkedInEngagement` et `LeadMagnetConsumption` sont comptés dans le score mais jamais écrits. 20 des 40 points sont inatteignables, les seuils d'affichage sont calibrés sur une échelle impossible | P1 |
| **`SAFE_INC_ADRESSE_POSTALE` non définie** | Le pied de message n'affiche pas d'adresse postale, les envois ne sont pas conformes LCAP | P0 avant premier envoi |
| **Aucun webhook Resend** | `EMAIL_OUVERT` et `EMAIL_BOUNCE` existent en enum, rien ne les écrit. Pas de mesure de taux d'ouverture, et c'est aussi ce qui débloque le score d'engagement | P1 |
| **Aucun traçage de consentement CRM** | `ConsentLog` existe mais est rattaché à `Client` (le client du cabinet), pas à `LeadContact`. Impossible de démontrer la base de consentement LCAP par contact | P0 avant volume |
| **`Campaign` : zéro usage** | Modèle mort | P2 |
| **Aucun test sur la Console** | Zone entière non couverte, alors que `permissions-p0-security.test.ts` existe ailleurs | P1 |
| **Console encore en mode préchauffage** | Compte à rebours J+X/90 et bandeaux PRECHAUFFAGE, alors que la phase est CONVERSION avec 10 places. Aucun compteur de places | P1 |

---

## 1. Résumé exécutif

**Ce qu'on construit.** Le CRM devient le poste de commande unique de la prospection de
SAFE Inc. Il trouve, qualifie, prépare, relance, mesure, et surtout il **dit quoi faire
maintenant**. Toute la conception est ordonnée par cette dernière fonction : un CRM qui
stocke sans décider est un tableur avec des couleurs.

**Le pari central.** L'intelligence utile ici n'est pas la génération de texte, c'est la
**transformation d'information en action**. Quand un avocat écrit « recontactez-moi en
septembre », la valeur n'est pas de résumer la phrase, c'est de créer le rappel daté, de
le rattacher au bon dossier, et de le faire remonter en septembre sans que personne n'ait
eu à y penser. Neuf capacités sur dix décrites dans ce document servent cette bascule.

**Ce qui rend le projet réaliste.** Le socle existe : 20 modèles CRM, un pipeline, un
moteur de scoring, un moteur de courriel conforme, une tour de contrôle, quatre capacités
IA en production. Il ne s'agit pas de bâtir un CRM, il s'agit de finir celui qui est là et
de lui greffer une couche d'intelligence. Le MVP décrit en phase 1 est presque entièrement
composé de trous à boucher, pas de nouvelles inventions.

**Ce qui rend le projet risqué.** Trois choses, dans l'ordre.

1. **Le trou de conversion.** Tant que Lead → Cabinet n'existe pas, la moitié droite du
   pipeline est du théâtre. C'est le premier chantier, avant toute IA.
2. **La conformité.** SAFE Inc. écrit à des avocats. La LCAP prévoit des sanctions
   administratives pécuniaires pouvant atteindre 1 000 000 $ pour une personne physique et
   10 000 000 $ pour une entreprise ([CRTC](https://crtc.gc.ca/fra/internet/anti/reg.htm)).
   La Loi 25 prévoit jusqu'à 25 000 000 $ ou 4 % du chiffre d'affaires mondial
   ([CAI](https://www.cai.gouv.qc.ca/protection-renseignements-personnels/sujets-et-domaines-dinteret/principaux-changements-loi-25)).
   Un CRM qui automatise l'envoi sans tracer le consentement transforme un risque théorique
   en risque réel, à l'échelle.
3. **La surautomatisation.** Un fondateur seul qui vend à des avocats n'a pas de problème
   de volume, il a un problème de pertinence. Automatiser les envois avant d'avoir un
   message qui marche revient à industrialiser un échec. La roadmap est construite pour
   que l'automatisation arrive **après** la mesure, jamais avant.

**Recommandation de séquencement, contre la commande.** La commande décrit un système
complet. Un fondateur seul en phase de conversion, avec 10 places à remplir, n'a pas besoin
d'un système complet, il a besoin de six choses. Elles sont listées en section 21 sous
« MVP réel ». Le reste du document reste le cahier des charges demandé, livré en entier.

---

## 2. Vision globale

### 2.1 La thèse

SAFE Inc. vend à des cabinets de 1 à 20 personnes, au Québec et en Ontario. Le cycle est
long, relationnel, à faible volume et à forte valeur unitaire. Ce profil dicte tout.

| Ce que le marché impose | Ce que le CRM doit faire | Ce qu'il ne doit surtout pas faire |
|---|---|---|
| Faible volume, forte valeur | Approfondir chaque dossier, préparer sérieusement | Traiter les cabinets comme une liste |
| Cycle long, plusieurs interlocuteurs | Mémoriser les engagements et les rôles | Oublier ce qui a été promis |
| Secteur prudent, réputation critique | Ton posé, jamais de pression | Séquence agressive, fausse urgence |
| Décision à deux (avocat + adjointe) | Suivre l'adoption par personne, pas par cabinet | Ne parler qu'au décideur |
| Fondateur seul, TDAH | Une seule prochaine action visible | Un tableau de bord de 40 chiffres |

### 2.2 Les quatre couches

```
┌─────────────────────────────────────────────────────────────┐
│  COUCHE 4 — DÉCISION      « Quoi faire maintenant »         │
│  Tour de contrôle · Prochaine meilleure action · Priorités  │
├─────────────────────────────────────────────────────────────┤
│  COUCHE 3 — INTELLIGENCE  « Que veut dire ce qui s'est passé»│
│  Agents · Extraction de tâches · Scoring · Résumés · Mémoire│
├─────────────────────────────────────────────────────────────┤
│  COUCHE 2 — ACTION        « Faire »                          │
│  Courriel · Séquences · Tâches · Documents · Rendez-vous    │
├─────────────────────────────────────────────────────────────┤
│  COUCHE 1 — MÉMOIRE       « Se souvenir »                    │
│  Organisations · Contacts · Activités · Consentements       │
└─────────────────────────────────────────────────────────────┘
```

Règle d'or de dépendance : **une couche ne peut pas être meilleure que celle du dessous**.
Une recommandation intelligente (couche 4) sur un historique incomplet (couche 1) est une
hallucination bien présentée. Toute la roadmap suit cet ordre.

### 2.3 Principes non négociables

1. **Rien ne part sans un humain.** Aucune communication externe en N3 en phase 1 et 2.
2. **Toute recommandation est explicable.** Le système dit toujours sur quelles données il
   s'appuie et à quel niveau de confiance. Un score sans justification est un bug.
3. **L'hypothèse n'est jamais présentée comme un fait.** Quatre niveaux de fiabilité sur
   chaque donnée enrichie, visibles à l'écran.
4. **Le silence est une réponse.** Un prospect qui ne répond pas voit la cadence ralentir,
   jamais accélérer.
5. **Un refus est final.** `doNotContact` est un mur, pas un filtre contournable.
6. **Le système ne remplit pas les vides.** Une donnée manquante reste manquante et devient
   une tâche de vérification, pas une supposition.

---

## 3. Parcours complet d'un prospect

Le parcours de référence, de l'inconnu au client intégré. Chaque étape indique le
déclencheur, ce que fait le système, et ce qui reste humain.

### Étape A — Le cabinet entre dans la base

**Déclencheurs possibles** : ajout manuel, import CSV, formulaire d'audit gratuit rempli,
courriel entrant, profil repéré sur le répertoire du Barreau, référence d'un client,
rencontre en événement.

**Système** : normalise le nom du cabinet, la ville, le téléphone. Cherche un doublon sur
trois clés (domaine du site web, nom normalisé + ville, courriel de contact). Calcule le
score firmographique. Crée une tâche « Rechercher ce cabinet » à J+0.

**Humain** : arbitre les doublons ambigus. Le système propose la fusion, il ne la fait pas.

### Étape B — Recherche et enrichissement

**Déclencheur** : la tâche de recherche est ouverte, ou l'utilisateur clique « Enrichir ».

**Système (agent de recherche, N2)** : lit le site web du cabinet, en extrait les domaines
de pratique, une estimation de taille, les membres visibles, les outils mentionnés. Produit
une fiche de préparation. **Chaque champ produit porte son niveau de fiabilité** :

| Niveau | Signification | Exemple | Traitement |
|---|---|---|---|
| `VERIFIE` | Source officielle ou confirmée | Année d'assermentation au répertoire du Barreau | Utilisable tel quel |
| `DECLARE` | Le prospect l'a dit | « nous sommes quatre » en appel | Utilisable, attribué |
| `DEDUIT` | Inféré d'un indice concret | 4 avocats listés sur la page Équipe | Affiché avec la source |
| `HYPOTHESE` | Plausible sans preuve | « utilise sûrement Excel » | Affiché en gris, jamais dans un message sortant |

**Humain** : valide ou corrige. Une hypothèse ne devient jamais `VERIFIE` toute seule.

### Étape C — Qualification

**Système** : recalcule les six scores (section 8) et produit la justification lisible.
Si le score de compatibilité passe sous un seuil, propose le classement en nurture plutôt
qu'en prospection active.

**Humain** : tranche. Le score oriente, il ne décide pas.

### Étape D — Préparation du premier contact

**Système (agent de prospection, N2)** : choisit le bon interlocuteur d'entrée selon le
modèle d'adoption (bottom-up par défaut : l'adjointe avant l'avocat), propose le canal, et
prépare le message à partir d'un gabarit avec les variables réelles.

**Vérification de conformité obligatoire avant affichage** (agent de conformité, N1 dur) :
base de consentement présente ? contact non désabonné ? adresse valide ? Si non, le
message n'est même pas proposé et le motif est affiché.

**Humain** : relit, corrige, envoie. Toujours.

### Étape E — La conversation

**Système** : journalise chaque échange en `Activity`. Après chaque interaction entrante,
l'agent administratif lit le contenu et propose les tâches qui en découlent (section 9).
Le résumé du dossier se met à jour.

**Humain** : accepte ou écarte les tâches proposées. C'est ici que le système apprend.

### Étape F — Audit gratuit

**Déclencheur** : le prospect accepte. Le lien vers le formulaire d'audit existant est
envoyé. `AuditSubmission` est déjà la porte d'entrée du pipeline delivery, on ne la
réinvente pas.

**Système** : à la soumission, rattache l'audit au lead, fait passer l'étape à
AUDIT_COMPLETED, calcule la recommandation de bundle, crée la tâche « Présenter les
résultats » à J+2 en priorité haute. C'est le moment le plus chaud du cycle, le système
ne le laisse pas refroidir.

### Étape G — Consultation de validation et proposition

**Système** : génère la fiche de préparation de rencontre (section 12 de la commande),
puis, après la rencontre, extrait décisions, objections et engagements du compte rendu.
Crée les tâches. Prépare le courriel de suivi.

**Humain** : tient la rencontre, dicte ou écrit le compte rendu, valide l'extraction.

### Étape H — Décision

**Gagné** : voir étape I.
**Perdu** : motif obligatoire (`RaisonPerdu` existe déjà en enum). Le motif alimente la
mémoire commerciale globale. Le contact bascule en séquence de maturation longue, jamais
en silence total.
**Reporté** : date de réactivation obligatoire. Un « pas maintenant » sans date est un
« non » déguisé qui pollue le pipeline.

### Étape I — Conversion en client

**C'est le trou actuel.** Le système doit, en une transaction :

1. créer le `Cabinet` avec ses paramètres de base ;
2. écrire `Lead.cabinetId` et `Lead.convertedAt` ;
3. faire passer `statutLead` à `ACTIVE_CUSTOMER` ;
4. créer le `User` administrateur du cabinet et envoyer l'invitation ;
5. instancier `ActivationChecklist` à partir du bundle recommandé ;
6. créer les tâches d'intégration avec responsables et échéances ;
7. clore les tâches de prospection encore ouvertes sur ce lead ;
8. conserver l'intégralité de l'historique, rattaché des deux côtés ;
9. écrire une entrée `AuditLog`.

**Règle dure** : aucune information ne se perd. L'historique de prospection reste lisible
depuis la fiche client, pour toujours.

### Étape J — Après l'intégration

Tâches de suivi à J+7, J+30, J+90. À J+90, si les indicateurs d'usage sont bons, tâche
« Demander une recommandation ». C'est la boucle qui alimente l'étape A par la source
`REFERRAL`, la plus rentable de toutes.

---

## 4. Architecture fonctionnelle

### 4.1 Vue d'ensemble

```
                         ┌──────────────────────┐
   Sources               │   INGESTION          │
   ─────────             │  Import CSV          │
   Formulaire audit ────▶│  Formulaires         │
   Répertoire Barreau ──▶│  Courriel entrant    │──┐
   LinkedIn (manuel) ───▶│  Saisie manuelle     │  │
   Références ──────────▶│  Dédoublonnage       │  │
                         └──────────────────────┘  │
                                                   ▼
   ┌───────────────────────────────────────────────────────────┐
   │                    NOYAU DE DONNÉES                        │
   │  Organization ── Contact ── Opportunity ── Activity        │
   │       │             │            │            │           │
   │       └─── Consent ─┴── Task ────┴── Document ┘           │
   └───────────────────────────────────────────────────────────┘
             │                    │                  │
             ▼                    ▼                  ▼
   ┌──────────────┐   ┌────────────────┐   ┌─────────────────┐
   │  AGENTS IA   │   │ AUTOMATISATIONS│   │   RESTITUTION   │
   │  Recherche   │   │  Déclencheurs  │   │ Tour de contrôle│
   │  Qualif.     │   │  Conditions    │   │ Pipeline        │
   │  Prospection │◀─▶│  Actions       │──▶│ Fiches          │
   │  Administratif│   │  Journal      │   │ Tableaux de bord│
   │  Réunion     │   │  Annulation    │   │ Rapports        │
   │  Suivi       │   └────────────────┘   └─────────────────┘
   │  Conformité  │            │
   └──────────────┘            ▼
          │            ┌────────────────┐
          └───────────▶│    MÉMOIRE     │
                       │ Prospect · Org │
                       │ Globale · User │
                       └────────────────┘
```

### 4.2 Le poste de garde de conformité

Une seule porte de sortie pour toute communication externe. Rien ne contourne ce point.

```
Demande d'envoi
      │
      ▼
┌───────────────────────────────────────────┐
│  GARDE DE CONFORMITÉ (bloquant, non IA)   │
│  1. doNotContact ?              → REFUS    │
│  2. Base de consentement ?      → REFUS    │
│  3. Adresse valide/non rejetée ?→ REFUS    │
│  4. Doublon d'envoi < 24 h ?    → REFUS    │
│  5. Fréquence dépassée ?        → REFUS    │
│  6. Pied LCAP complet ?         → REFUS    │
└───────────────────────────────────────────┘
      │ tout est vert
      ▼
   Aperçu humain obligatoire (N2)
      │
      ▼
   Envoi + Activity + CommunicationLog
```

Le garde est **déterministe**, jamais un appel modèle. On ne délègue pas une décision
légale à un modèle probabiliste. Il est déjà partiellement implémenté dans
`verifierDestinataire` (`lib/services/crm/courriel.ts`), à compléter avec les points 2, 4,
5 et 6.

---

## 5. Modules

Vingt modules. Pour chacun : objectif, fonctionnalités, données, relations, automatisations,
permissions, cas limites, risques.

### 5.1 Organisations

- **Objectif** : le cabinet comme entité, distincte des personnes qui y travaillent.
- **Fonctions** : fiche, hiérarchie (siège / bureaux), fusion de doublons, historique
  complet, rattachement au `Cabinet` client après conversion.
- **Données** : identité, localisation, taille, domaines, outils, maturité numérique,
  signaux commerciaux, niveau de fiabilité par champ.
- **Relations** : 1-N Contacts, 1-N Opportunités, 1-1 Cabinet (après conversion).
- **Automatisations** : normalisation à l'écriture, détection de doublon, tâche de
  recherche à la création.
- **Permissions** : lecture et écriture réservées aux internes SAFE Inc. admin.
- **Cas limites** : cabinet qui fusionne avec un autre, avocat qui quitte pour fonder son
  cabinet (nouvelle organisation, contact conservé avec historique), cabinet à plusieurs
  bureaux dans deux provinces (règles de conformité différentes selon le bureau).
- **Risques** : fusion destructive irréversible. Mitigation : fusion réversible pendant
  30 jours, journalisée.

### 5.2 Contacts

- **Objectif** : la personne. C'est elle qui répond, pas le cabinet.
- **Fonctions** : rôle CRM, ADKAR par personne, préférences de communication, consentement,
  historique personnel, rattachement à plusieurs organisations dans le temps.
- **Données** : identité, coordonnées, statut de l'adresse, langue, rôle, décideur,
  champion interne, `doNotContact`, base de consentement, ADKAR.
- **Cas limites** : deux personnes homonymes dans le même cabinet ; adjointe partagée entre
  deux cabinets ; contact qui change de cabinet (conserver l'historique, rattacher à la
  nouvelle organisation, **réévaluer le consentement**, il ne suit pas la personne
  automatiquement).
- **Risques** : écrire à quelqu'un qui s'est désabonné sous une autre adresse. Mitigation :
  désabonnement propagé par adresse normalisée, pas seulement par identifiant de contact.

### 5.3 Opportunités

- **Objectif** : séparer « ce cabinet nous intéresse » de « ce cabinet est en train
  d'acheter ». Un cabinet peut avoir plusieurs opportunités dans le temps (perdu en mars,
  reparti en septembre).
- **Pourquoi ce module n'existe pas encore** : aujourd'hui `Lead` porte à la fois
  l'organisation, l'opportunité et le pipeline. Ça tient tant qu'il n'y a qu'un cycle par
  cabinet. Ça casse au premier cabinet perdu puis regagné, parce que l'historique du
  premier cycle pollue le second.
- **Décision recommandée** : ne pas éclater `Lead` en phase 1. Ajouter `Opportunity` en
  phase 2, quand un premier cabinet aura été perdu puis relancé. Éclater trop tôt double la
  complexité de toutes les requêtes pour un cas qui ne s'est pas encore produit.

### 5.4 Pipeline · 5.5 Activités · 5.6 Tâches

Traités en détail sections 7, 9 et 10.

### 5.7 Communications

- **Objectif** : la trace de tout ce qui est sorti et entré, avec son résultat.
- **Fonctions** : courriel sortant, courriel entrant, LinkedIn journalisé à la main, appels,
  SMS (hors périmètre phase 1 à 3).
- **Données** : canal, direction, contenu, statut de remise, ouverture, clic, réponse,
  rejet, gabarit utilisé, séquence d'origine.
- **Pourquoi séparer de `Activity`** : `Activity` est le journal générique de tout ce qui
  se passe sur un lead, y compris les notes internes et les changements d'étape. Une
  communication a un cycle de vie propre (envoyée → remise → ouverte → répondue) et des
  obligations de conservation légale. Les mélanger rend la mesure du taux de réponse
  impossible et la preuve de conformité fragile.
- **Risques** : conservation de contenus potentiellement confidentiels si un avocat répond
  en citant un dossier. Mitigation : politique de rétention, chiffrement au repos, et
  interdiction d'utiliser ces contenus pour la mémoire globale (section 13).

### 5.8 Campagnes · 5.9 Séquences

Traités section 17 de la commande, détaillés plus bas.

### 5.10 Documents et propositions

- **Objectif** : lier chaque document commercial au bon dossier, avec son cycle de vie.
- **Cycle** : brouillon → en révision → approuvé → envoyé → ouvert → signé → expiré.
- **Réutilisation** : le repo a déjà `RichDocument` et `RichDocumentVersion`. À évaluer
  avant de créer une table de propositions.
- **Risques** : proposition envoyée puis modifiée sans nouvelle version, ce qui rend
  indéfendable ce qui a réellement été proposé. Mitigation : versionnage immuable après
  envoi.

### 5.11 Rendez-vous

- **Réutilisation** : `CalendarEvent` existe (par cabinet). À étendre plutôt qu'à recréer.
- **Fonctions attendues** : fiche de préparation avant, compte rendu après, extraction des
  engagements.

### 5.12 Notes · 5.13 Intelligence artificielle · 5.14 Automatisations

Sections 9, 12, 11.

### 5.15 Rapports · 5.16 Paramètres · 5.17 Permissions · 5.18 Journal d'audit

- **Permissions** : le CRM est interne. Deux rôles suffisent en phase 1 : `interne_admin`
  (tout) et `interne_lecture` (consultation, pas d'envoi). Ne pas construire un système de
  permissions granulaires pour un utilisateur unique. À revoir à la première embauche.
- **Journal d'audit** : `AuditLog` existe. À alimenter systématiquement pour : envoi de
  communication, désabonnement, fusion, conversion, suppression, exécution d'automatisation.

### 5.19 Consentements et préférences de communication

Module à part entière, pas une colonne. Voir sections 6 et 15.

### 5.20 Mémoire et apprentissage

Voir section 13.

---

## 6. Modèle de données

### 6.1 Méthode

Chaque table demandée dans la commande est classée. Le principe : **ne rien créer qui
existe**, et ne créer que ce qui porte un comportement réel.

| Table demandée | Verdict | Correspondance / justification |
|---|---|---|
| `users`, `teams`, `roles`, `permissions` | **Existe** | `User` + enum `UserRole` + `lib/auth/permissions.ts`. Pas de tables `roles`/`permissions` : sur-ingénierie pour un utilisateur unique |
| `organizations` | **Existe partiellement** | `Lead` porte l'organisation. À étendre, pas à éclater en phase 1 |
| `contacts` | **Existe** | `LeadContact`. À étendre |
| `leads` | **Existe** | `Lead` |
| `clients` | **Existe** | `Cabinet` (côté produit) |
| `opportunities` | **À créer, phase 2** | Voir 5.3 |
| `pipelines`, `pipeline_stages` | **Ne pas créer** | Le pipeline est un enum `StageLead`. Un pipeline configurable en base pour un seul pipeline est de la complexité gratuite. À reconsidérer si un second pipeline apparaît (partenaires, revendeurs) |
| `activities` | **Existe** | `Activity` |
| `tasks` | **Existe** | `Task`. À étendre fortement |
| `task_dependencies` | **À créer, phase 2** | Table de jointure |
| `notes` | **Ne pas créer** | `Activity` de type `NOTE` + `Lead.notesPrivees` couvrent le besoin |
| `emails`, `messages`, `calls`, `meetings` | **À créer (1 seule table)** | `Communication` unifiée avec un discriminant `canal`. Quatre tables pour un même cycle de vie multiplierait les requêtes sans bénéfice |
| `campaigns` | **Existe** | `Campaign`, à réveiller ou supprimer |
| `sequences`, `sequence_steps` | **À créer, phase 2** | |
| `documents` | **Existe** | `Document`, `RichDocument` |
| `proposals` | **À évaluer** | Peut-être `RichDocument` avec un type |
| `objections` | **À créer, phase 2** | Bibliothèque + occurrences |
| `recommendations`, `ai_insights` | **À créer (1 seule table)** | `AiSuggestion`, avec le retour d'usage. C'est le socle de l'apprentissage |
| `lead_scores` | **À créer** | Historique des scores. Les scores actuels sont écrasés à chaque calcul, donc impossible de voir une trajectoire |
| `reminders` | **Ne pas créer** | `Task.dateEcheance` suffit |
| `automations`, `automation_runs` | **À créer, phase 2** | |
| `audit_logs` | **Existe** | `AuditLog` |
| `consent_records` | **À créer, P0** | `ConsentLog` est rattaché à `Client`, pas à `LeadContact` |
| `communication_preferences` | **À créer** | Fusionnée dans `ContactConsent` |

### 6.2 Extensions sur les modèles existants

**`Lead`** (ajouts) :

| Colonne | Type | Défaut | Rôle |
|---|---|---|---|
| `siteWebAnalyseAt` | `DateTime?` | null | Date du dernier enrichissement |
| `resumeIa` | `String?` | null | Résumé maintenu par l'agent |
| `resumeIaAt` | `DateTime?` | null | Fraîcheur du résumé |
| `scoreCompatibilite` | `Int` | 0 | 0-100 |
| `scoreIntention` | `Int` | 0 | 0-100 |
| `scoreUrgence` | `Int` | 0 | 0-100 |
| `scoreValeur` | `Int` | 0 | 0-100 |
| `scoreRisque` | `Int` | 0 | 0-100, risque de perte |
| `scoreJustification` | `Json?` | null | Détail ligne par ligne, obligatoire |
| `valeurPotentielleMensuelle` | `Decimal?` | null | MRR estimé |
| `probabiliteConversion` | `Int?` | null | 0-100 |
| `dateProchaineAction` | `DateTime?` | null | Dénormalisé pour le tri |
| `maturiteNumerique` | enum `MaturiteNumerique` | `INCONNUE` | PAPIER / EXCEL / OUTIL_PARTIEL / OUTIL_INTEGRE |
| `refereParContactId` | `String?` | null | Qui a référé |
| `responsableId` | `String?` | null | Responsable interne |

**`LeadContact`** (ajouts) : `languePref` existe déjà ; ajouter `canalPrefere`,
`derniereReponseAt`, `nbMessagesSansReponse`, `fuseauHoraire`.

**`Task`** (ajouts) : `parentTaskId`, `resultatAttendu`, `preuveExecution`,
`tempsEstimeMinutes`, `tempsReelMinutes`, `categorie`, `automationRunId`,
`sourceExtraction` (d'où vient la tâche : manuelle, IA, automatisation).

**`Activity`** : ajouter `communicationId` pour rattacher au module Communications.

### 6.3 Nouvelles tables, phase 1

```prisma
/// Base de consentement d'un contact pour les communications commerciales.
/// Une ligne par établissement ou retrait de consentement. Jamais d'écrasement :
/// c'est la trace qui permet de démontrer la conformité LCAP en cas de plainte.
model ContactConsent {
  id        String      @id @default(cuid())
  contactId String
  contact   LeadContact @relation(fields: [contactId], references: [id], onDelete: Cascade)

  base        BaseConsentement   // EXPRES | TACITE_RELATION_AFFAIRES | TACITE_PUBLICATION | AUCUN
  canal       CanalCommunication // COURRIEL | LINKEDIN | TELEPHONE | SMS
  statut      StatutConsentement // ACTIF | RETIRE | EXPIRE

  /// Preuve : URL de la page où l'adresse était publiée, référence de la demande,
  /// horodatage du formulaire. Obligatoire pour toute base autre que AUCUN.
  preuve      String?
  preuveUrl   String?

  /// Le consentement tacite est borné dans le temps par la LCAP.
  obtenuAt    DateTime  @default(now())
  expireAt    DateTime?
  retireAt    DateTime?
  retireSource String?  // LIEN_DESABONNEMENT | DEMANDE_DIRECTE | MANUEL

  createdBy String?
  createdAt DateTime @default(now())

  @@index([contactId, canal, statut])
  @@index([expireAt])
}

/// Toute communication sortante ou entrante, tous canaux, avec son cycle de vie.
model Communication {
  id        String  @id @default(cuid())
  leadId    String
  lead      Lead    @relation(fields: [leadId], references: [id], onDelete: Cascade)
  contactId String?
  contact   LeadContact? @relation(fields: [contactId], references: [id])

  canal     CanalCommunication
  direction CrmDirection
  sujet     String?
  contenu   String

  gabaritId   String?   // identifiant du gabarit utilisé, pour mesurer sa performance
  sequenceId  String?
  sequenceEtape Int?

  /// Cycle de vie. Alimenté par les webhooks du fournisseur d'envoi.
  statut       StatutCommunication // PREPARE | ENVOYE | REMIS | OUVERT | CLIQUE | REPONDU | REJETE | PLAINTE
  providerId   String?  @unique     // identifiant Resend, pour l'idempotence
  envoyeAt     DateTime?
  remisAt      DateTime?
  ouvertAt     DateTime?
  repondusAt   DateTime?
  rejeteAt     DateTime?
  motifRejet   String?

  /// Preuve de conformité au moment de l'envoi. Figée, jamais recalculée :
  /// c'est l'état du consentement à l'instant T qu'il faut pouvoir montrer.
  consentBaseAuMoment String?

  approuvePar String?   // qui a cliqué envoyer. Jamais null pour un sortant.
  createdAt   DateTime  @default(now())

  @@index([leadId, createdAt])
  @@index([statut])
  @@index([gabaritId, statut])
}

/// Une proposition faite par un agent IA, et ce que l'humain en a fait.
/// C'est la table qui rend l'apprentissage possible : sans le refus, on
/// n'apprend que de ses succès, ce qui ne s'appelle pas apprendre.
model AiSuggestion {
  id      String @id @default(cuid())
  leadId  String?
  lead    Lead?  @relation(fields: [leadId], references: [id], onDelete: Cascade)

  agent       String   // RECHERCHE | QUALIFICATION | PROSPECTION | ADMINISTRATIF | REUNION | SUIVI | CONFORMITE
  type        String   // TACHE | MESSAGE | SCORE | RESUME | ENRICHISSEMENT
  contenu     Json     // la proposition elle-même
  motif       String   // pourquoi, en une phrase
  confiance   Int      // 0-100, auto-déclarée par l'agent
  donneesSources Json  // sur quoi elle s'appuie, pour l'explicabilité

  statut       StatutSuggestion // EN_ATTENTE | ACCEPTEE | MODIFIEE | REFUSEE | EXPIREE
  decideAt     DateTime?
  decidePar    String?
  raisonRefus  String?
  /// Si l'humain a modifié avant d'accepter, on garde les deux versions.
  contenuFinal Json?

  /// Résultat observé plus tard, pour boucler l'apprentissage.
  resultat     String?  // REPONSE_OBTENUE | SANS_SUITE | CONVERSION | PERTE
  resultatAt   DateTime?

  modele    String   // identifiant du modèle utilisé, pour comparer les versions
  createdAt DateTime @default(now())

  @@index([leadId, createdAt])
  @@index([agent, statut])
  @@index([type, resultat])
}

/// Historique des scores. Sans lui, impossible de voir une trajectoire ni de
/// savoir si une action a fait bouger l'aiguille.
model LeadScoreSnapshot {
  id     String @id @default(cuid())
  leadId String
  lead   Lead   @relation(fields: [leadId], references: [id], onDelete: Cascade)

  scoreGlobal        Int
  scoreFirmographique Int
  scoreEngagement    Int
  scoreEnrichissement Int
  scoreCompatibilite Int
  scoreIntention     Int
  scoreUrgence       Int
  scoreValeur        Int
  scoreRisque        Int
  justification      Json
  declencheur        String  // ACTIVITE | CONTACT | STAGE | ENRICHISSEMENT | RECALCUL_BATCH

  createdAt DateTime @default(now())

  @@index([leadId, createdAt])
}
```

### 6.4 Nouvelles tables, phase 2

`Opportunity`, `Sequence`, `SequenceEtape`, `SequenceInscription`, `Objection`,
`ObjectionOccurrence`, `Automation`, `AutomationRun`, `TaskDependency`.
Schémas détaillés en annexe A.

### 6.5 Règles de validation transverses

1. Un `Lead` ne peut pas passer à `SIGNED` sans au moins une `ConsultationDecision`.
2. Un `Lead` ne peut pas passer à `LIVE` sans `cabinetId` non nul.
3. Une `Communication` sortante ne peut pas être créée sans `approuvePar` en phase 1 et 2.
4. Une `Communication` sortante ne peut pas être créée si aucun `ContactConsent` actif
   n'existe pour le couple contact + canal.
5. `Task.dateEcheance` est obligatoire. Une tâche sans échéance est invisible, donc inutile.
6. Un score n'est jamais écrit sans sa `justification`.
7. Toute suppression de contact ou d'organisation est une archive, jamais un `DELETE`.

---

## 7. Pipeline

### 7.1 Réconciliation avec l'existant

La commande décrit 19 étapes. L'enum `StageLead` en compte 14 et il est utilisé dans le
code, la base et l'interface. Remplacer l'enum coûte une migration à risque sur toutes les
lignes existantes, pour un gain d'expressivité modéré.

**Recommandation** : garder les 14 étapes, ajouter **trois** étapes qui portent un
comportement réellement distinct, et rendre le reste par des champs plutôt que par des
étapes.

| Étape demandée | Traitement |
|---|---|
| Prospect identifié | `AWARENESS` |
| À rechercher | Champ, pas étape : tâche « Rechercher » ouverte |
| À contacter | `ENGAGED` |
| Premier contact envoyé | `CONTACTED` |
| En attente de réponse | Champ dérivé : dernière communication sortante sans réponse |
| Réponse reçue | `CONVERSING` |
| Qualification | `CONVERSING` + score |
| Rencontre planifiée / réalisée | `AUDIT_SCHEDULED` / `AUDIT_COMPLETED` |
| Besoins analysés | `AUDIT_COMPLETED` |
| Démonstration planifiée / réalisée | **`DEMO_PLANIFIEE`, `DEMO_REALISEE` à ajouter** |
| Proposition à préparer / envoyée | `CONSULTATION_PHASE2` |
| Négociation | **`NEGOCIATION` à ajouter** |
| Décision en attente | `READY_TO_SIGN` |
| Gagné | `SIGNED` puis `ACTIVATION_IN_PROGRESS` puis `LIVE` |
| Perdu | `statutLead = CHURNED` + `raisonPerdu` |
| À relancer plus tard | `statutLead = PAUSED` + `dateReactivation` |

Pourquoi « en attente de réponse » ne doit pas être une étape : c'est un état dérivable, et
une étape dérivable se désynchronise toujours de la réalité. Le jour où quelqu'un oublie de
la changer, le pipeline ment.

### 7.2 Contrat par étape

Chaque étape porte un contrat. Format à implémenter dans `lib/crm/pipeline-contrats.ts`,
en données et non en `if` éparpillés.

Exemple, l'étape la plus critique du cycle :

```
AUDIT_COMPLETED
  Critères d'entrée    : AuditSubmission liée, statut complété
  Tâches obligatoires  : « Présenter les résultats » (J+2, priorité haute)
                         « Calculer la recommandation de bundle » (J+1)
  Validations sortie   : BundleRecommendation existe ET une rencontre a eu lieu
  Délai recommandé     : 7 jours maximum dans cette étape
  Alerte               : à J+5 sans rencontre planifiée, escalade en priorité haute
  Gabarit associé      : SUITE_AUDIT
  Indicateur de risque : chaque jour passé ici après J+7 retire 5 points au score
                         d'intention. C'est l'étape où l'on perd le plus de dossiers.
```

Le contrat complet des 17 étapes est en annexe B.

### 7.3 Effets du changement d'étape

Un changement d'étape déclenche, dans l'ordre : validation des critères de sortie de
l'étape quittée (blocage si non remplis, avec message explicite), écriture d'une `Activity`,
création des tâches obligatoires de la nouvelle étape, recalcul des scores, snapshot de
score, réévaluation de la tour de contrôle, entrée `AuditLog`.

**Règle** : un changement d'étape ne déclenche jamais de communication externe
automatiquement. Il crée la tâche qui mène à la communication.

---

## 8. Qualification et scoring

### 8.1 Les six scores

Le score unique actuel (0-100) mélange des choses qui ne se comparent pas. Un cabinet
parfaitement compatible mais sans aucune intention n'est pas la même chose qu'un cabinet
pressé mais mal adapté. Six scores, chacun sur 100, chacun explicable.

| Score | Répond à | Entrées principales |
|---|---|---|
| **Compatibilité** | Est-ce que SAFE est fait pour eux ? | Taille, domaine, fidéicommis, province, outils actuels, maturité numérique, complexité administrative |
| **Intention** | Veulent-ils avancer ? | Réponses, délai de réponse, rencontres tenues, documents consultés, proposition ouverte, questions posées |
| **Urgence** | Est-ce maintenant ? | Problème exprimé, échéance mentionnée, inspection annoncée, départ d'une adjointe, fin de contrat d'un outil |
| **Valeur** | Combien ça pèse ? | Nombre d'utilisateurs, volume de facturation, bundle recommandé, potentiel de référence |
| **Risque** | Peut-on les perdre ? | Silence prolongé, objection non traitée, concurrent mentionné, décideur absent, engagement non tenu de notre côté |
| **Global** | Priorité relative | Pondération des cinq, paramétrable |

### 8.2 Explicabilité obligatoire

Chaque score produit une justification structurée. Format imposé :

```json
{
  "score": 72,
  "lignes": [
    { "critere": "Taille 2-5 avocats", "points": 20, "max": 20, "source": "declare" },
    { "critere": "Fidéicommis actif", "points": 15, "max": 15, "source": "verifie" },
    { "critere": "Droit familial", "points": 10, "max": 10, "source": "verifie" },
    { "critere": "Outil actuel inconnu", "points": 0, "max": 15, "source": "manquant",
      "action": "Créer une tâche de vérification" }
  ],
  "manquants": ["Volume de facturation", "Nombre d'adjointes"],
  "confiance": 65,
  "note": "Confiance limitée : 2 critères sur 8 reposent sur une hypothèse."
}
```

Trois règles. Un critère manquant vaut **zéro point, jamais une moyenne**. La confiance
globale baisse avec la proportion de données déduites ou manquantes. Un critère manquant
qui pèse lourd génère automatiquement une tâche de vérification.

### 8.3 Correctif immédiat du scoring existant

Le score d'engagement actuel plafonne à 20/40, parce qu'il compte `LinkedInEngagement` et
`LeadMagnetConsumption` que rien n'écrit. Deux options, à trancher :

- **A** : écrire ces tables (saisie manuelle des interactions LinkedIn, suivi des
  téléchargements de lead magnet). Coût moyen, fidèle à l'intention d'origine.
- **B** : recalibrer les paliers sur ce qui est réellement mesurable aujourd'hui (activités,
  réponses, rencontres). Coût faible, honnête immédiatement.

**Recommandation : B en phase 1, A en phase 2**, avec les webhooks Resend qui rendront la
mesure automatique plutôt que déclarative.

---

## 9. Système intelligent de tâches administratives

C'est le cœur de la demande. Le reste du document est du CRM, cette section est ce qui le
rend intelligent.

### 9.1 Le principe

Une phrase dans un courriel ou un compte rendu contient souvent un engagement implicite.
L'intelligence consiste à le rendre explicite, daté et attribué, sans que personne n'ait eu
à y penser.

### 9.2 Table de correspondance

Les cas de la commande, avec leur traitement exact.

| Signal détecté | Tâche créée | Échéance | Effets annexes | Niveau |
|---|---|---|---|---|
| « Je vais vous envoyer les documents vendredi » | Vérifier la réception des documents | Lundi suivant | Engagement enregistré côté prospect | N2 |
| « Recontactez-moi en septembre » | Reprendre contact | 1er jour ouvrable de septembre | `statutLead = PAUSED`, `dateReactivation` | N2 |
| « Ma partenaire doit approuver » | Suivre l'approbation de la partenaire | J+7 | Crée le contact manquant si nommé, `estDecideur = true`, `scoreRisque` +15 (décideur absent) | N2 |
| « Envoyez-moi une démonstration » | 1. Préparer la démonstration (J+2)<br>2. Envoyer l'invitation (J+1) | Dépendance : 2 après 1 | Étape → `DEMO_PLANIFIEE`, `scoreIntention` +20 | N2 |
| « Je suis disponible mardi après-midi » | Proposer des créneaux mardi PM | J+0 | Lit les disponibilités, propose 3 créneaux | N2 |
| « Nous utilisons Clio » | Aucune tâche | — | Met à jour `logicielActuel`, fiabilité `DECLARE`, recalcule compatibilité | **N3 autorisé** |
| « Le prix est trop élevé » | Traiter l'objection tarifaire | J+1 | `ObjectionOccurrence` créée, réponse suggérée, `scoreRisque` +20 | N2 |
| « Nous ne sommes pas prêts maintenant » | Réactivation | J+90 par défaut | `statutLead = PAUSED`, sortie de toute séquence active | N2 |
| « Je dois consulter mon équipe » | Relancer après consultation d'équipe | J+7 | `scoreRisque` +10 | N2 |
| « Envoyez-moi une proposition » | 1. Préparer la proposition (J+3)<br>2. Faire réviser (J+4)<br>3. Envoyer (J+5) | Chaînées | Étape → `CONSULTATION_PHASE2`, `scoreIntention` +25 | N2 |

Une seule ligne est en N3 : la mise à jour d'un fait déclaré par le prospect lui-même. Elle
est réversible, journalisée, et n'envoie rien à personne. Tout le reste passe par vous.

### 9.3 Sources d'extraction

Par ordre de fiabilité décroissante et de priorité d'implémentation.

1. **Notes et comptes rendus saisis dans le CRM** (phase 1). Vous écrivez, le système
   extrait. Zéro intégration, valeur immédiate.
2. **Courriels entrants** (phase 2). Nécessite la connexion d'une boîte. Voir section 17.
3. **Transcriptions d'appel** (phase 3). Nécessite un outil de transcription.

### 9.4 Contrat de l'extracteur

**Entrée** : le texte brut, l'identité du lead, la liste des contacts connus, les tâches
déjà ouvertes, l'étape courante.

**Sortie** : liste de tâches proposées, chacune avec titre à l'impératif, type, échéance
calculée en date absolue, responsable, motif citant **le passage exact** du texte,
confiance, dépendances éventuelles.

**Cinq règles dures** :

1. Citer le passage source. Une tâche sans citation est rejetée avant affichage.
2. Ne jamais proposer une tâche qui existe déjà (comparaison sémantique sur les tâches
   ouvertes du lead).
3. Ne jamais inventer une date. Si le texte dit « bientôt », la tâche est créée sans date
   et marquée « échéance à préciser », ce qui devient une micro-décision de deux secondes
   plutôt qu'une fausse précision.
4. Ne jamais proposer d'écrire à un contact désabonné.
5. Distinguer l'engagement **du prospect** (à vérifier) de l'engagement **de SAFE**
   (à exécuter). Les deux créent des tâches, mais pas les mêmes.

### 9.5 Fermeture automatique sur preuve

Une tâche peut se fermer seule si une preuve d'exécution existe et qu'elle est
déterministe, jamais sur une interprétation.

| Tâche | Preuve acceptée | Niveau |
|---|---|---|
| Envoyer le courriel de suivi | `Communication` sortante créée vers le bon contact après la création de la tâche | N3 |
| Vérifier la réception des documents | Document reçu et classé sur le lead | N3 |
| Confirmer la rencontre | `CalendarEvent` confirmé | N3 |
| Relancer | Communication sortante vers le contact | N3 |
| Préparer la proposition | Aucune preuve automatique possible | Jamais |

Toute fermeture automatique écrit une `Activity` et reste annulable.

### 9.6 Types de tâches

Les 23 types demandés se rangent en 6 catégories. L'enum `TypeTaskCrm` en compte 9, à
étendre à 23 (migration additive sans risque sur un enum Postgres).

| Catégorie | Types |
|---|---|
| Recherche | Rechercher un prospect, Vérifier les coordonnées, Collecter des renseignements |
| Communication | Préparer un message, Envoyer un message, Appeler, Relancer |
| Rencontre | Préparer, Confirmer, Compte rendu, Préparer une démonstration |
| Commercial | Préparer une proposition, Réviser, Approbation interne, Envoyer un document, Signature |
| Administratif | Vérifier un paiement, Mettre à jour le CRM, Classer un document |
| Conversion | Créer le dossier client, Convertir, Planifier l'intégration, Suivre après intégration |

---

## 10. Prochaines meilleures actions

### 10.1 Ce qui existe

Le moteur `lib/services/crm/prochaine-action.ts` est livré et fonctionne. Sept sources,
paliers d'urgence hiérarchisés, règle de silence sur report, une raison par lead. Il produit
déjà la vue « ce que je dois faire aujourd'hui » demandée au point 10 de la commande.

### 10.2 Ce qui manque

| Manque | Effet | Phase |
|---|---|---|
| Temps estimé par action | Impossible de composer une journée réaliste | 1 |
| Résultat attendu | On sait quoi faire, pas à quoi ressemble « fait » | 1 |
| Informations nécessaires | On ouvre la fiche pour chercher ce qu'il faut | 1 |
| Message suggéré directement dans la carte | Un clic de plus que nécessaire | 1 |
| Prise en compte de la charge du jour | Le moteur propose 8 actions un jour à 2 heures libres | 2 |
| Pondération par la valeur commerciale | Un gros dossier et un petit sont traités pareil | 2 |
| Apprentissage des refus | Les mêmes propositions écartées reviennent | 2 |

### 10.3 Formule de priorisation, phase 2

```
priorite = base_source
         + retard × poids_retard
         + (valeur_potentielle / valeur_mediane) × poids_valeur
         + probabilite_conversion × poids_conversion
         + risque_de_perte × poids_risque
         - (temps_estime / temps_disponible_restant) × poids_effort
```

Chaque poids est visible et modifiable dans les paramètres. Une formule cachée est une
formule à laquelle on cesse de faire confiance à la première surprise.

### 10.4 La vue « Ce que je dois faire aujourd'hui »

Une seule action en grand, la file en retrait. Ce parti pris est déjà implémenté et doit
être tenu : la valeur de cette vue vient de ce qu'elle **ne montre pas**.

Ajouts phase 1 sur la carte principale : temps estimé, résultat attendu en une ligne, les
2 ou 3 informations nécessaires (dernier échange, objection ouverte, engagement en cours),
et le message suggéré dépliable sur place.

---

## 11. Catalogue des automatisations

### 11.1 Format obligatoire

Toute automatisation est décrite par : déclencheur, conditions, actions, exceptions, délai,
responsable, niveau d'autorisation, journal, annulation, gestion d'erreur. Une automatisation
sans mécanisme d'annulation ne part pas en production.

### 11.2 Les automatisations, par phase

**Phase 1, toutes en N1 ou N2, aucune communication automatique.**

| # | Déclencheur | Conditions | Action | Niveau |
|---|---|---|---|---|
| A1 | Création d'un lead | Toujours | Créer « Rechercher ce cabinet », J+0 | N3 |
| A2 | Aucune activité depuis 7 j | Étape active, non pausé | Faire remonter en tour de contrôle | N3 |
| A3 | Audit soumis | Lead rattaché | Étape → AUDIT_COMPLETED, tâche « Présenter » J+2 haute | N3 |
| A4 | Lead sans prochaine action | Score ≥ 55 | Créer « Décider de la suite », J+1 | N3 |
| A5 | Tâche en retard de 3 j | Non close | Escalade en priorité haute | N3 |
| A6 | Changement d'étape | Critères de sortie remplis | Créer les tâches obligatoires de l'étape | N3 |
| A7 | Rencontre passée sans compte rendu | J+1 après l'événement | Créer « Rédiger le compte rendu » | N3 |
| A8 | Contact désabonné | Lien cliqué | `doNotContact`, sortie de séquence, Activity | N3 |

Toutes ces automatisations sont internes : elles créent des tâches ou changent des états,
elles n'écrivent à personne. C'est ce qui permet de les autoriser en N3 sans risque.

**Phase 2, préparation automatique, envoi manuel.**

| # | Déclencheur | Action | Niveau |
|---|---|---|---|
| A9 | Proposition ouverte sans réponse 48 h | Préparer une relance, la mettre en tour de contrôle | N2 |
| A10 | Rencontre terminée | Préparer le courriel de suivi à partir du compte rendu | N2 |
| A11 | 24 h avant une démonstration | Préparer le rappel | N2 |
| A12 | Signature | Lancer la séquence d'intégration | N2 |
| A13 | Inactivité 90 j | Préparer un message de réactivation | N2 |
| A14 | Intégration réussie à J+90 | Préparer la demande de recommandation | N2 |

**Phase 3, exécution autorisée, périmètre strictement borné.**

Seules trois actions sont candidates au N3 avec envoi externe, et seulement après
autorisation explicite par écrit, cabinet par cabinet ou séquence par séquence :

- rappel de rencontre confirmée 24 h avant, texte figé, à un contact ayant déjà répondu ;
- accusé de réception d'un courriel entrant hors heures ouvrables ;
- envoi d'une ressource explicitement demandée par le prospect dans le message précédent.

Tout le reste reste humain. **Recommandation ferme : ne pas activer le N3 externe avant
d'avoir mesuré au moins 50 envois manuels et connu son taux de réponse.** Automatiser un
message dont on ignore la performance revient à répéter une erreur plus vite.

---

## 12. Architecture des agents

### 12.1 Principe

Sept agents spécialisés plutôt qu'un agent généraliste. Trois raisons : un prompt court et
ciblé se comporte mieux qu'un prompt fourre-tout, chaque agent peut avoir son niveau
d'autonomie propre, et un agent qui dérape se remplace sans toucher aux autres.

Tous suivent le même contrat technique, déjà établi par `lib/ai/` : retour `null` en cas
d'échec ou de clé absente, sortie JSON validée et normalisée côté serveur, aucune confiance
accordée à la sortie du modèle.

### 12.2 Fiches des agents

**Agent de recherche** · phase 2
- *Rôle* : enrichir une organisation à partir de son site web public.
- *Entrées* : URL du site, nom du cabinet, ce qui est déjà connu.
- *Sorties* : domaines de pratique, taille estimée, membres visibles, outils repérés,
  signaux commerciaux, résumé, **niveau de fiabilité par champ**.
- *Outils* : récupération de page web, pas de navigation authentifiée.
- *Limites* : sources publiques uniquement. Aucun contournement de protection anti-robot.
  Aucune agrégation de données personnelles au delà des coordonnées professionnelles.
- *Validation humaine* : N2. Rien n'est écrit sans acceptation.
- *Risques* : inventer une taille de cabinet. Mitigation : tout champ non appuyé sur une
  citation du site est marqué `HYPOTHESE` et n'entre jamais dans un message sortant.

**Agent de qualification** · phase 2
- *Rôle* : calculer les six scores et les justifier.
- *Entrées* : état complet du lead, historique, référentiel des bundles.
- *Sorties* : six scores, justification ligne par ligne, confiance, données manquantes.
- *Limites* : ne modifie jamais une donnée source. Ne décide pas d'abandonner un lead.
- *Validation* : N1. Le score s'affiche, l'humain décide.
- *Risques* : score qui dérive silencieusement. Mitigation : `LeadScoreSnapshot` permet de
  voir la trajectoire et de détecter une dérive.

**Agent de prospection** · phase 1, livré partiellement
- *Rôle* : préparer les messages et proposer la cadence.
- *Entrées* : lead, contact, étape, historique, gabarits, ton de la relation.
- *Sorties* : message prêt à relire, canal recommandé, moment recommandé.
- *Limites* : n'envoie jamais. Ne s'adresse jamais à un contact désabonné. N'invente aucun
  fait sur le cabinet. Ton posé, jamais de pression.
- *Validation* : N2 strict.
- *Risques* : message générique qui abîme la réputation. Mitigation : refus de produire si
  moins de trois faits vérifiés sont disponibles sur le cabinet.

**Agent administratif** · phase 1, le plus important
- *Rôle* : transformer du texte en tâches datées.
- *Entrées* : note, compte rendu ou courriel, contacts connus, tâches ouvertes, étape.
- *Sorties* : tâches proposées avec citation du passage source, échéances absolues,
  dépendances, responsables.
- *Limites* : les cinq règles dures de la section 9.4.
- *Validation* : N2, sauf la mise à jour d'un fait déclaré par le prospect (N3).
- *Risques* : noyer sous les tâches. Mitigation : maximum 5 tâches par extraction, et une
  tâche déjà existante n'est jamais reproposée.

**Agent de réunion** · phase 2
- *Rôle* : préparer avant, extraire après.
- *Sorties avant* : profil, historique, besoins connus, questions à poser, objections
  probables, objectif, documents à préparer.
- *Sorties après* : résumé, décisions, objections, engagements des deux côtés, tâches.
- *Limites* : n'interprète pas un silence comme un accord. Ce qui n'a pas été dit n'existe pas.

**Agent de suivi** · phase 2
- *Rôle* : repérer ce qui a été oublié et recommander le bon moment.
- *Entrées* : ensemble des leads actifs, historique des cadences qui ont fonctionné.
- *Sorties* : liste de relances recommandées avec moment et canal.
- *Limites* : ne raccourcit jamais une cadence après un silence. La règle est d'espacer.

**Agent de conformité** · phase 1, bloquant
- *Rôle* : empêcher un envoi non conforme.
- *Particularité* : **ce n'est pas un agent IA**. C'est une fonction déterministe. Le nom
  d'agent est conservé pour la cohérence du modèle mental, mais aucune décision de
  conformité n'est confiée à un modèle probabiliste.
- *Sorties* : autorisé ou refusé, avec le motif exact.

---

## 13. Mémoire et apprentissage

### 13.1 Les quatre mémoires

| Mémoire | Contenu | Stockage | Cloisonnement |
|---|---|---|---|
| **Prospect** | Informations, préférences, historique, objections, promesses, documents | `Lead`, `LeadContact`, `Activity`, `Communication` | Par lead |
| **Organisation** | Structure, membres, outils, enjeux, opportunités passées | `Lead` étendu | Par organisation |
| **Commerciale globale** | Ce qui marche : messages, cadences, profils, causes de perte | Agrégats calculés, **jamais de contenu brut** | Anonymisée |
| **Utilisateur** | Style, méthodes, disponibilités, capacité quotidienne | Table `UserPreferences` (phase 2) | Par utilisateur |

### 13.2 La règle de cloisonnement

**Aucun contenu propre à un cabinet ne sert jamais à un autre cabinet.** La mémoire globale
ne contient que des agrégats statistiques : « le gabarit SUITE_AUDIT obtient 41 % de
réponses sur 17 envois », jamais « voici ce que le cabinet X a répondu ».

Cette règle est absolue et elle est aussi la condition pour pouvoir, plus tard, offrir ce
CRM à des clients sans créer une fuite entre eux.

### 13.3 Comment le système apprend

La boucle repose entièrement sur `AiSuggestion`. Trois signaux, du plus faible au plus fort.

1. **Le refus** : vous écartez une proposition. Signal faible mais nombreux. Une catégorie
   de proposition refusée plus de 70 % du temps sur 10 occurrences est désactivée
   automatiquement et signalée.
2. **La modification** : vous acceptez après avoir modifié. Signal fort. L'écart entre
   `contenu` et `contenuFinal` dit précisément ce qui manquait.
3. **Le résultat** : la proposition acceptée a-t-elle produit une réponse, une conversion,
   ou rien. Signal le plus fort, mais lent et bruité par tout le reste.

### 13.4 Ce que le système peut honnêtement apprendre à votre volume

Point de lucidité important. Avec 10 places visées et un cycle long, le nombre
d'observations sera faible pendant longtemps. Ce que ça implique :

| Apprentissage | Volume nécessaire | Réaliste avant ? |
|---|---|---|
| Quels gabarits obtiennent des réponses | ~30 envois par gabarit | 3 à 6 mois |
| Quels délais de relance fonctionnent | ~50 séquences | 6 à 12 mois |
| Quels profils convertissent | ~20 conversions | Au delà de la cohorte de 10 |
| Quelles objections reviennent | ~15 conversations | 1 à 2 mois |
| Ce que vous refusez systématiquement | ~30 propositions | Quelques semaines |

**Conclusion à retenir** : les deux derniers apprentissages sont accessibles rapidement et
utiles. Les trois premiers demandent de la patience. Un système qui prétendrait « apprendre
ce qui convertit » sur 5 observations produirait du bruit présenté comme du savoir. Le
CRM doit afficher le nombre d'observations derrière chaque apprentissage et refuser de
recommander sous un seuil.

### 13.5 Explicabilité

Toute recommandation affiche, sur demande et en un clic : pourquoi cette action, quelles
données l'ont déclenchée, le niveau de confiance, le nombre d'observations derrière, et
les alternatives écartées.

---

## 14. Sécurité et confidentialité

### 14.1 Contexte particulier

Le CRM de SAFE Inc. contient des données sur des avocats, pas sur leurs clients. C'est une
distinction majeure : la donnée sensible du secret professionnel n'y transite pas. En
revanche, un courriel de réponse d'un avocat **peut** contenir une information sur un
dossier, et le CRM doit être conçu comme si c'était certain.

### 14.2 Mesures, par priorité

| Mesure | État | Phase |
|---|---|---|
| Garde d'accès unifiée sur toutes les actions Console | **Partiellement fait**, écart P0 identifié | 1 |
| Journal d'audit sur envoi, désabonnement, fusion, conversion, suppression | `AuditLog` existe, à alimenter | 1 |
| Traçage du consentement par contact et par canal | À créer | 1 |
| Chiffrement au repos | Fourni par l'hébergeur | Fait |
| Suppression = archivage, jamais `DELETE` | Partiellement | 1 |
| Politique de rétention des communications | À définir | 2 |
| Export des données d'une personne sur demande | À créer | 2 |
| Authentification renforcée sur les comptes internes | À évaluer | 2 |
| Anti-doublon d'envoi (même contact, 24 h) | À créer | 1 |
| Plafond de fréquence par contact | À créer | 1 |

### 14.3 Rôles

Deux rôles suffisent tant qu'il n'y a qu'une personne. Construire une matrice de permissions
granulaires maintenant serait du travail jeté. La ligne à ne pas franchir : les server
actions doivent vérifier le rôle elles-mêmes, jamais se reposer sur l'écran qui les affiche.
C'est précisément l'écart P0 en cours.

---

## 15. Exigences canadiennes applicables à la prospection

> **Avertissement.** Cette section rassemble des sources officielles et les applique au cas
> de SAFE Inc. Elle ne constitue pas un avis juridique. Les points marqués `⚠️ À VÉRIFIER`
> n'ont pas pu être confirmés sur une source officielle et ne doivent pas être traités
> comme établis. Une validation par un conseiller juridique est recommandée avant tout
> envoi en volume.

### 15.1 Loi canadienne anti-pourriel (LCAP)

**Ce qu'elle couvre.** Tout message électronique commercial, soit tout message envoyé à une
adresse électronique dans le but d'encourager la participation à une activité commerciale.
Les courriels de gestion de compte, de transaction ou répondant à une demande ne sont pas
des messages électroniques commerciaux
([CRTC, FAQ](https://crtc.gc.ca/fra/com500/faq500.htm)).

**Les trois exigences cumulatives** : obtenir le consentement, fournir les renseignements
d'identification, inclure un mécanisme d'exclusion
([CPVP](https://www.priv.gc.ca/fr/sujets-lies-a-la-protection-de-la-vie-privee/lois-sur-la-protection-des-renseignements-personnels-au-canada/la-loi-sur-la-protection-des-renseignements-personnels-et-les-documents-electroniques-lprpde/r_o_p/loi-canadienne-anti-pourriel/)).

**Consentement tacite, les deux cas qui concernent SAFE** (formulations du CRTC) :

- *Relation d'affaires en cours* : « le consentement à recevoir des messages électroniques
  commerciaux est implicite » pendant **deux ans** suivant un achat ou une demande liée à
  une transaction commerciale.
- *Publication bien en vue* : consentement implicite lorsque trois conditions sont
  réunies, « (1) la personne à qui le message est envoyé a publié bien en vue son adresse
  électronique, (2) la publication ne comporte aucune mention précisant qu'elle ne veut
  recevoir aucun message électronique commercial non sollicité à cette adresse, (3) le
  message a un lien soit avec l'exercice des attributions de la personne, soit avec son
  entreprise commerciale ».

**Application directe à SAFE.** Un cabinet qui publie l'adresse de son bureau sur son site,
sans mention de refus, et à qui SAFE écrit au sujet de la gestion de son cabinet, entre
dans le second cas. **C'est la base de consentement principale du CRM et elle doit être
documentée contact par contact** : URL de la page, date de consultation, capture. Sans
cette preuve, la base de consentement est indémontrable.

**Mécanisme d'exclusion** : « Le lien de désabonnement doit demeurer valide au moins
60 jours après l'envoi » et « si une personne utilise le lien pour se désabonner, vous devez
traiter la demande dès que possible, et au plus tard 10 jours ouvrables ».

*Implémentation actuelle* : le lien est signé par HMAC sans expiration, donc valide
indéfiniment, ce qui satisfait le minimum de 60 jours. Le traitement est immédiat, donc
très en deçà des 10 jours ouvrables. **Conforme sur ces deux points.**

**Sanctions** : « Le montant maximal d'une SAP, par violation, pour un particulier est de
1 million de dollars. Pour une entreprise, ce montant est de 10 millions de dollars »
([CRTC, FAQ](https://crtc.gc.ca/fra/com500/faq500.htm)).

`⚠️ À VÉRIFIER` : la citation formelle de la loi (couramment donnée comme L.C. 2010, ch. 23)
n'a pas été confirmée sur la page du CRTC consultée. À confirmer sur
[laws-lois.justice.gc.ca](https://laws-lois.justice.gc.ca) avant toute citation dans un
document externe.

### 15.2 Protection des renseignements personnels : quelle loi s'applique où

**Distinction structurante pour SAFE**, parce que la cible est à cheval sur deux provinces.

| Province du prospect | Loi applicable au secteur privé |
|---|---|
| **Québec** | Loi provinciale sur la protection des renseignements personnels dans le secteur privé, modifiée par la Loi 25. Déclarée essentiellement similaire à la LPRPDE |
| **Ontario** | **LPRPDE**. L'Ontario n'a pas de loi générale sur le secteur privé ; seules ses règles sur les renseignements de santé sont déclarées essentiellement similaires |

Source : [CPVP, Lois provinciales qui peuvent s'appliquer au lieu de la LPRPDE](https://www.priv.gc.ca/fr/sujets-lies-a-la-protection-de-la-vie-privee/lois-sur-la-protection-des-renseignements-personnels-au-canada/la-loi-sur-la-protection-des-renseignements-personnels-et-les-documents-electroniques-lprpde/r_o_p/prov-lprpde/).

### 15.3 L'exclusion des coordonnées d'affaires

Point le plus important de toute cette section pour un CRM B2B.

Sous la LPRPDE, « les coordonnées d'affaires, comme le nom, le titre, l'adresse
professionnelle, le numéro de téléphone ou l'adresse courriel de l'employé, recueillis,
utilisés ou communiqués uniquement dans le but de contacter la personne pour les besoins de
son emploi ou de sa profession sont exclus de l'application de la LPRPDE »
([CPVP](https://www.priv.gc.ca/fr/sujets-lies-a-la-protection-de-la-vie-privee/lois-sur-la-protection-des-renseignements-personnels-au-canada/la-loi-sur-la-protection-des-renseignements-personnels-et-les-documents-electroniques-lprpde/r_o_p/prov-lprpde/)).

**Conséquence concrète, et ses limites.** Stocker le nom, le titre, le courriel de bureau et
le téléphone de Me Untel au cabinet X, pour lui parler de son cabinet, sort du champ de la
LPRPDE. Mais l'exclusion tombe dès qu'on sort de cet usage strict. Trois exemples qui font
basculer dans le champ de la loi :

- enregistrer des notes personnelles sans lien avec la fonction (« vient d'avoir un
  enfant », « semble en conflit avec son associé ») ;
- enrichir avec des données trouvées ailleurs que dans un contexte professionnel ;
- utiliser les coordonnées pour autre chose que le contact professionnel.

**Règle d'architecture qui en découle** : le champ `notesPrivees` est le point de bascule
le plus probable. Il doit porter un avertissement à la saisie, et la politique interne doit
être de n'y consigner que ce qui touche à l'activité professionnelle.

`⚠️ À VÉRIFIER` : la loi québécoise du secteur privé comporte-t-elle une exclusion
équivalente pour les coordonnées d'affaires ? Ce point n'a pas été confirmé et il est
déterminant, puisque la majorité des prospects sont québécois. À valider auprès de la
[Commission d'accès à l'information](https://www.cai.gouv.qc.ca) ou d'un conseiller.
**En attendant, traiter les contacts québécois selon le régime le plus strict.**

### 15.4 Loi 25 (Québec)

Adoptée en septembre 2021, entrée en vigueur par étapes en septembre 2022, 2023 et 2024.
Depuis septembre 2024, l'ensemble des obligations est en vigueur
([CAI](https://www.cai.gouv.qc.ca/protection-renseignements-personnels/sujets-et-domaines-dinteret/principaux-changements-loi-25)).

Obligations applicables à SAFE Inc. en tant qu'entreprise exerçant au Québec :

| Obligation | Impact sur le CRM |
|---|---|
| Désigner un responsable de la protection des renseignements personnels | Organisationnel. À nommer et à publier |
| Politique de gouvernance des renseignements personnels | Document à rédiger |
| Politique de confidentialité claire publiée sur le site | À vérifier sur safecabinet.ca |
| Évaluation des facteurs relatifs à la vie privée avant communication hors Québec | **Impact direct** : Resend et Anthropic hébergent hors Québec. Une EFVP est requise |
| Sanctions jusqu'à 25 M$ ou 4 % du chiffre d'affaires mondial | Motive la rigueur |

**Point d'attention immédiat** : l'assistant de prospection envoie le contenu des notes
privées et des échanges à un modèle hébergé hors Québec. Si ces données contiennent des
renseignements personnels au sens de la loi, une EFVP est requise avant la mise en
production. `⚠️ À VÉRIFIER` avec un conseiller.

### 15.5 Obligations professionnelles des cabinets

**Elles ne s'appliquent pas à la prospection de SAFE.** Le Barreau du Québec et le Barreau
de l'Ontario régissent la conduite des avocats, pas celle de leurs fournisseurs. SAFE Inc.
qui écrit à un avocat n'est pas soumise aux règles de sollicitation professionnelle.

**Elles s'appliquent en revanche au produit.** Dès que SAFE héberge des données de dossiers,
les obligations de confidentialité et de supervision de l'infogérance du cabinet se
répercutent contractuellement sur SAFE. C'est le sujet du dossier `09 - Droit`, pas celui de
ce cahier des charges.

`⚠️ À VÉRIFIER` : les deux barreaux publient des orientations sur l'utilisation de
l'infonuagique et des fournisseurs tiers. Ces orientations doivent être relues avant tout
argumentaire commercial qui affirmerait une conformité.

### 15.6 Liste de contrôle avant le premier envoi en volume

- [ ] `SAFE_INC_ADRESSE_POSTALE` renseignée avec une adresse réelle
- [ ] Base de consentement documentée pour chaque contact, avec preuve
- [ ] Politique de confidentialité publiée et à jour
- [ ] Responsable de la protection des renseignements personnels désigné
- [ ] EFVP réalisée pour les transferts hors Québec (envoi et modèle IA)
- [ ] Adresse d'expédition dédiée, distincte de l'adresse de facturation
- [ ] Anti-doublon et plafond de fréquence actifs
- [ ] Journal d'audit alimenté sur les envois
- [ ] Point de vérification avec un conseiller juridique sur les deux `⚠️` de 15.3 et 15.4

---

## 16. Écrans à développer

Statut : ✅ existe · 🔧 à étendre · 🆕 à créer.

| # | Écran | Route | Statut | Contenu | Phase |
|---|---|---|---|---|---|
| E1 | Tour de contrôle | `/console` | 🔧 | Prochaine action clé + file. Ajouter temps estimé, résultat attendu, message dépliable | 1 |
| E2 | Pipeline | `/console/pipeline` | 🔧 | Kanban. Ajouter alertes de délai par étape et indicateurs de risque | 1 |
| E3 | Liste des cabinets | `/console/leads` | 🔧 | Ajouter filtres, listes dynamiques enregistrables, tri par les six scores | 1 |
| E4 | Fiche cabinet | `/console/clients/[id]` | 🔧 | Déjà : contacts, timeline, courriel, assistant. Ajouter : scores détaillés avec justification, résumé IA, engagements en cours, objections ouvertes | 1 |
| E5 | Ajout de cabinet | `/console/leads/nouveau` | ✅ | | |
| E6 | Import CSV | `/console/import` | 🆕 | Téléversement, mappage de colonnes, aperçu, détection de doublons, rapport | 1 |
| E7 | Fusion de doublons | `/console/doublons` | 🆕 | Comparaison côte à côte, choix champ par champ, réversible 30 j | 1 |
| E8 | Fiche de préparation de rencontre | `/console/clients/[id]/preparation` | 🆕 | Générée à la demande, imprimable | 2 |
| E9 | Compte rendu de rencontre | `/console/clients/[id]/compte-rendu` | 🆕 | Saisie libre, extraction de tâches, validation | 1 |
| E10 | Bibliothèque d'objections | `/console/objections` | 🆕 | Liste, réponses, fréquence observée | 2 |
| E11 | Séquences | `/console/sequences` | 🆕 | Création, étapes, conditions d'arrêt, inscriptions en cours | 2 |
| E12 | Éditeur de gabarits | `/console/gabarits` | 🆕 | Aperçu, variables, performance mesurée par gabarit | 2 |
| E13 | Boîte de réception CRM | `/console/messages` | 🆕 | Communications entrantes rattachées aux leads | 2 |
| E14 | Tableau de bord commercial | `/console/rapports` | 🆕 | Les 20 indicateurs de la section 20 de la commande | 2 |
| E15 | Automatisations | `/console/automatisations` | 🆕 | Liste, activation, journal d'exécution, annulation | 2 |
| E16 | Consentements | `/console/consentements` | 🆕 | Vue par contact, preuves, expirations à venir | 1 |
| E17 | Conversion en client | `/console/clients/[id]/convertir` | 🆕 | **Le trou P0.** Formulaire de création du cabinet et de l'admin, aperçu de ce qui sera transféré | 1 |
| E18 | Journal d'audit | `/console/audit` | 🆕 | Filtrable, exportable | 2 |
| E19 | Paramètres CRM | `/console/parametres` | 🆕 | Poids de priorisation, cadences par défaut, plafonds de fréquence | 2 |
| E20 | Désabonnement public | `/desabonnement` | ✅ | | |

---

## 17. API et intégrations

| Intégration | Usage | État | Phase | Note |
|---|---|---|---|---|
| **Resend** | Envoi de courriel | ✅ branché | 1 | Adresse d'expédition dédiée à créer |
| **Resend webhooks** | Remise, ouverture, clic, rejet, plainte | 🆕 | 1 | Débloque la mesure et le score d'engagement. Route `/api/webhooks/resend`, vérification de signature obligatoire, idempotence par `providerId` |
| **Anthropic** | Tous les agents | ✅ branché | 1 | EFVP requise, voir 15.4 |
| **Courriel entrant** | Rattacher les réponses aux leads | 🆕 | 2 | Option A : adresse de réception dédiée avec transfert. Option B : IMAP. **Recommandation : A**, moins intrusif et sans accès à toute la boîte |
| **Calendrier** | Rendez-vous, disponibilités | 🆕 | 2 | `CalendarEvent` existe déjà côté produit, à réutiliser avant d'intégrer un service externe |
| **Répertoire du Barreau de l'Ontario** | Sourcing | Méthode documentée | 2 | Voir la note interne sur la méthode. Pilotable par URL, courriels obfusqués, `WebFetch` renvoie 403, passage par navigateur nécessaire. **Vérifier les conditions d'utilisation du site avant tout usage systématique** |
| **LinkedIn** | Messages, engagement | ❌ | Jamais automatisé | Pas d'API légale pour l'envoi de messages. **Recommandation : journalisation manuelle uniquement.** Les outils d'automatisation LinkedIn violent les conditions d'utilisation et exposent à la fermeture du compte |
| **Stripe** | Abonnement après conversion | ✅ branché | 1 | Déjà utilisé par la page clients |
| **Enrichissement tiers** (Apollo, Hunter) | Coordonnées | ❌ | À éviter | L'enum `SourceEmail` les mentionne déjà. Attention : une adresse obtenue d'un courtier de données ne constitue pas une base de consentement LCAP |

---

## 18. Notifications et alertes

| Alerte | Déclencheur | Canal | Urgence |
|---|---|---|---|
| Réponse d'un prospect | Communication entrante | Tour de contrôle + notification | Haute |
| Billet de support d'un client | Ticket créé | Tour de contrôle | Haute |
| Tâche en retard de 3 jours | Quotidien | Tour de contrôle | Moyenne |
| Lead chaud sans activité depuis 7 j | Quotidien | Tour de contrôle | Moyenne |
| Proposition ouverte sans réponse 48 h | Webhook | Tour de contrôle | Haute |
| Rejet de courriel | Webhook | Notification + marquage de l'adresse | Haute |
| Plainte pour pourriel | Webhook | **Alerte immédiate + gel de tous les envois** | Critique |
| Désabonnement | Lien cliqué | Journal, pas de notification | Basse |
| Consentement tacite proche de l'expiration | J-30 | Liste hebdomadaire | Moyenne |
| Échec d'une automatisation | Exécution | Notification | Moyenne |
| Fin d'essai d'un client à J-7 | Quotidien | Tour de contrôle | Haute |

**Règle anti-bruit** : une alerte qui ne change pas ce que vous faites dans l'heure ne
mérite pas d'être une notification. Elle va dans une liste consultée une fois par jour.

---

## 19. Cas limites et scénarios d'erreur

### 19.1 Données

| Cas | Comportement attendu |
|---|---|
| Deux cabinets au nom identique dans deux villes | Pas un doublon. La clé de dédoublonnage inclut la ville |
| Un cabinet change de nom | Conserver l'ancien nom en alias, ne pas créer de nouvelle organisation |
| Un avocat quitte pour fonder son cabinet | Nouvelle organisation, contact conservé avec son historique, **consentement à réévaluer** |
| Adresse courriel partagée (`info@`) | Marquer comme générique. Ne jamais y envoyer un message nominatif |
| Cabinet avec bureaux au Québec et en Ontario | Régime de conformité du bureau du contact, pas du siège |
| Import de 500 lignes dont 80 doublons | Import en attente de validation, rapport de doublons, rien n'est créé avant arbitrage |
| Contact sans nom de famille | Accepté. Les gabarits doivent dégrader proprement |

### 19.2 Envois

| Cas | Comportement attendu |
|---|---|
| Rejet définitif | `emailStatut = INVALIDE`, sortie de séquence, tâche de vérification de l'adresse |
| Rejet temporaire | Nouvelle tentative à J+1, puis J+3, puis abandon |
| Plainte pour pourriel | `doNotContact` immédiat, **gel de tous les envois** jusqu'à revue manuelle |
| Réponse automatique d'absence | Ne pas compter comme réponse. Reporter la relance à la date de retour si elle est lisible |
| Le prospect répond « arrêtez de m'écrire » sans cliquer le lien | Détection de l'intention, proposition de désabonnement manuel en priorité haute. **Ne jamais fermer automatiquement**, mais ne jamais laisser passer non plus |
| Envoi en double par double clic | Bloqué par la clé d'idempotence sur `providerId` et le contrôle des 24 h |
| Panne de Resend | Communication en `PREPARE`, file de reprise, jamais de perte silencieuse |

### 19.3 Intelligence artificielle

| Cas | Comportement attendu |
|---|---|
| Clé API absente | Retour `null`, l'écran fonctionne sans l'assistant. **Déjà implémenté** |
| JSON malformé | Rejet, aucune écriture, message d'erreur explicite |
| Le modèle invente un contact | Filtré : tout contact proposé est comparé aux contacts existants, un inconnu est signalé comme à créer et non comme existant |
| Le modèle propose d'écrire à un désabonné | Filtré en amont : les désabonnés ne sont pas dans le contexte envoyé au modèle |
| Le modèle propose 15 tâches | Tronqué à 5, déjà implémenté à 3 |
| Le modèle produit une date relative floue | Tâche créée sans date, marquée à préciser |
| Coût qui dérape | Plafond mensuel d'appels, compteur visible, arrêt gracieux |

### 19.4 Conversion

| Cas | Comportement attendu |
|---|---|
| Conversion interrompue en cours | Transaction unique. Tout ou rien |
| Le cabinet existe déjà (client revenu) | Rattacher au cabinet existant, ne pas dupliquer |
| Conversion à annuler | Réversible pendant 24 h, journalisée |

---

## 20. Roadmap

### Phase 1 — Boucler la boucle · 6 à 8 semaines à temps partiel

Objectif : qu'un cabinet puisse entrer dans le CRM et en ressortir client, sans trou, avec
une trace complète et conforme.

| Lot | Contenu | Dépend de |
|---|---|---|
| **L1. Sécurité** | Garde `requireConsoleAccess()` sur toutes les actions Console, tests P0 | — |
| **L2. Conversion** | Lead → Cabinet transactionnel, écran E17, `ActivationChecklist` | L1 |
| **L3. Conformité** | `ContactConsent`, adresse postale, anti-doublon, plafond de fréquence, audit des envois | L1 |
| **L4. Mesure** | Table `Communication`, webhooks Resend, recalibrage du score d'engagement | L3 |
| **L5. Extraction de tâches** | Agent administratif sur notes et comptes rendus, écran E9 | — |
| **L6. Tour de contrôle v2** | Temps estimé, résultat attendu, message dépliable, informations nécessaires | L5 |
| **L7. Entrée en masse** | Import CSV, dédoublonnage, fusion, écrans E6 et E7 | — |
| **L8. Bascule conversion** | Retrait du préchauffage, compteur des 10 places, tarifs à jour | — |

### Phase 2 — CRM intelligent · 8 à 12 semaines

| Lot | Contenu |
|---|---|
| L9. Six scores + justification + `LeadScoreSnapshot` |
| L10. Agent de recherche et enrichissement, niveaux de fiabilité |
| L11. Séquences multicanales avec arrêt automatique sur réponse |
| L12. Agent de réunion, fiches de préparation, extraction post-rencontre |
| L13. Bibliothèque d'objections |
| L14. Tableaux de bord et rapports |
| L15. Courriel entrant rattaché aux leads |
| L16. `AiSuggestion` et boucle de retour |
| L17. Automatisations A9 à A14 en N2 |

### Phase 3 — Supervisé et adaptatif · au delà

| Lot | Contenu |
|---|---|
| L18. Apprentissage sur `AiSuggestion` avec seuils d'observation |
| L19. Cadences adaptatives |
| L20. Prévisions de revenus |
| L21. Détection avancée du risque de perte |
| L22. N3 externe sur le périmètre borné de la section 11 |
| L23. `Opportunity` séparée de `Lead` |

---

## 21. Priorisation

### 21.1 MVP réel, contre la commande

La commande décrit un système complet. Voici l'avis que je dois donner plutôt que de le
garder pour moi.

Vous êtes seul, en phase de conversion, avec dix places à remplir et un cycle long. À ce
volume, **la moitié des fonctionnalités demandées coûteront plus cher à construire et à
maintenir qu'elles ne rapporteront**, parce qu'elles supposent un volume que vous n'aurez
pas avant plusieurs trimestres. Les séquences multicanales, les prévisions de revenus,
l'apprentissage sur les taux de conversion, les tableaux de bord à vingt indicateurs :
tout cela est juste, et prématuré.

**Les six choses qui changent votre semaine, dans l'ordre :**

1. **La conversion Lead → Cabinet.** Sans elle, vous ne pouvez pas encaisser proprement
   depuis le CRM. C'est le seul lot vraiment bloquant.
2. **Le traçage du consentement et l'adresse postale.** Sans eux, vous ne pouvez pas
   légalement écrire en volume. Coût faible, risque évité élevé.
3. **L'extraction de tâches depuis vos notes.** C'est la demande centrale, et c'est la
   seule capacité qui vous rend du temps dès la première utilisation.
4. **Les webhooks Resend.** Sans mesure, tout le reste est de l'opinion. Coût faible.
5. **L'import CSV et le dédoublonnage.** Sans lui, remplir la base est un travail manuel
   qui ne se fera pas.
6. **La garde de sécurité et les premiers tests.** Dette qui grossit à chaque écran ajouté.

**Ce que je ne construirais pas maintenant** : séquences, prévisions, apprentissage
statistique, `Opportunity`, pipeline configurable en base, matrice de permissions
granulaires, automatisations N3 externes, intégration LinkedIn.

### 21.2 Tableau de priorisation

| Fonctionnalité | Valeur | Coût | Risque si absent | Verdict |
|---|---|---|---|---|
| Conversion Lead → Cabinet | Très haute | Moyen | Bloquant | **MVP** |
| Consentement + adresse postale | Moyenne | Faible | Juridique élevé | **MVP** |
| Extraction de tâches | Très haute | Moyen | Demande centrale non servie | **MVP** |
| Webhooks Resend | Haute | Faible | Aucune mesure | **MVP** |
| Import CSV + doublons | Haute | Moyen | Base vide | **MVP** |
| Garde de sécurité + tests | Moyenne | Faible | Accès non autorisé | **MVP** |
| Tour de contrôle v2 | Moyenne | Faible | Confort | MVP si temps |
| Six scores | Moyenne | Moyen | Priorisation grossière | Phase 2 |
| Agent de recherche | Moyenne | Élevé | Saisie manuelle | Phase 2 |
| Séquences | Faible à ce volume | Élevé | Aucun | Phase 2 |
| Objections | Moyenne | Faible | Répétition | Phase 2 |
| Tableaux de bord | Faible à ce volume | Moyen | Aucun | Phase 2 |
| Apprentissage | Nulle avant volume | Élevé | Aucun | Phase 3 |
| N3 externe | Négative avant mesure | Moyen | Risque réputationnel | Phase 3 |

---

## 22. Critères d'acceptation

Format : une fonctionnalité est terminée quand tous ses critères passent. Un critère est
vérifiable par une personne en moins de deux minutes, ou par un test.

### L1. Garde de sécurité

- [ ] `requireConsoleAccess()` est appelée en première ligne de **toutes** les server
      actions sous `app/(app)/console/`
- [ ] Un utilisateur du cabinet SAFE avec le rôle `avocat` reçoit une erreur en appelant
      directement une action Console
- [ ] Un utilisateur `isInternal` rattaché à un autre cabinet reçoit la même erreur
- [ ] Un test couvre les deux cas ci-dessus
- [ ] Aucune action Console n'utilise plus `isSafeIncCabinet` seule

### L2. Conversion Lead → Cabinet

- [ ] Depuis un lead à l'étape `SIGNED`, un bouton « Convertir en client » est visible
- [ ] La conversion crée le `Cabinet`, le `User` administrateur, et envoie l'invitation
- [ ] `Lead.cabinetId`, `Lead.convertedAt` et `statutLead = ACTIVE_CUSTOMER` sont écrits
- [ ] L'`ActivationChecklist` est instanciée depuis le bundle recommandé
- [ ] Les tâches de prospection ouvertes sur ce lead passent à `ANNULEE` avec un motif
- [ ] Les tâches d'intégration sont créées avec échéances
- [ ] Une entrée `AuditLog` est écrite
- [ ] L'historique complet reste consultable depuis la fiche client
- [ ] Une interruption au milieu ne laisse **aucun** état partiel (transaction unique)
- [ ] Le cabinet apparaît dans `/console/clients` immédiatement après

### L3. Conformité

- [ ] Aucun envoi possible sans `ContactConsent` actif pour le couple contact + canal
- [ ] La base de consentement et sa preuve sont saisissables et visibles sur le contact
- [ ] Le pied de message affiche une adresse postale réelle
- [ ] Un second envoi au même contact dans les 24 h est refusé avec un message explicite
- [ ] Le plafond de fréquence par contact est configurable et appliqué
- [ ] Chaque envoi écrit une entrée `AuditLog` avec l'auteur et la base de consentement
- [ ] `Communication.consentBaseAuMoment` est figée à l'envoi et ne change jamais après

### L4. Mesure

- [ ] `/api/webhooks/resend` vérifie la signature et rejette une requête non signée
- [ ] Un même événement reçu deux fois ne crée qu'une seule mise à jour (idempotence)
- [ ] Les statuts remis, ouvert, cliqué, rejeté, plainte remontent sur la `Communication`
- [ ] Un rejet définitif marque l'adresse `INVALIDE` et sort le contact des séquences
- [ ] Une plainte déclenche `doNotContact` et le gel des envois
- [ ] Le taux de réponse par gabarit est calculable

### L5. Extraction de tâches

- [ ] Un champ de saisie libre existe sur la fiche cabinet
- [ ] Après saisie, les tâches proposées apparaissent avec **le passage source cité**
- [ ] Une tâche déjà ouverte sur ce lead n'est jamais reproposée
- [ ] Une échéance floue produit une tâche marquée « échéance à préciser », pas une date
      inventée
- [ ] Aucune tâche proposée ne vise un contact désabonné
- [ ] Accepter crée une vraie `Task` visible en tour de contrôle
- [ ] Écarter n'écrit rien
- [ ] Les 10 cas de la table 9.2 produisent le résultat décrit

### L7. Import CSV

- [ ] Téléversement, mappage de colonnes, aperçu avant création
- [ ] Les doublons sont détectés sur trois clés et présentés séparément
- [ ] Rien n'est créé avant validation explicite
- [ ] Un rapport indique créés, ignorés, en attente d'arbitrage
- [ ] Un import de 500 lignes ne dépasse pas 60 secondes

---

## 23. Workflows complets

### 23.1 Du répertoire du Barreau au premier rendez-vous

```
J+0   Import CSV de 40 cabinets d'Ottawa
      → Dédoublonnage : 6 doublons arbitrés, 34 créés
      → A1 crée 34 tâches « Rechercher ce cabinet »
      → Score firmographique calculé, 12 cabinets au dessus de 55

J+1   Tour de contrôle propose le mieux scoré
      → Agent de recherche (N2) lit le site, propose : 3 avocats,
        droit familial et immobilier, aucun outil visible, fiabilité DEDUIT
      → Vous validez, corrigez la taille à 4
      → Consentement : adresse publiée sur la page Contact, sans mention de refus
        → base TACITE_PUBLICATION, preuve = URL + capture

J+1   Agent de prospection prépare le gabarit PREMIER_CONTACT
      → Garde de conformité : vert
      → Vous relisez, coupez deux phrases, envoyez
      → Communication créée, statut ENVOYE

J+2   Webhook : OUVERT
      → scoreIntention +10

J+4   Aucune réponse
      → Tour de contrôle fait remonter « Relancer »
      → Vous reportez à J+8

J+8   Relance envoyée, gabarit RELANCE_DOUCE

J+9   Réponse : « Intéressant. Je dois en parler à mon adjointe,
       rappelez-moi la semaine prochaine. »
      → Agent administratif propose 2 tâches :
         1. Relancer après consultation de l'adjointe (J+16), motif cité
         2. Identifier l'adjointe et l'ajouter comme contact (J+10)
      → Vous acceptez les deux
      → scoreIntention +25, scoreRisque +10 (décideur secondaire absent)
      → Étape → CONVERSING

J+16  Appel. Audit gratuit accepté.
      → Étape → AUDIT_PROPOSED, lien envoyé
```

Ce qui compte dans cet exemple : à aucun moment vous n'avez eu à vous demander quoi faire
ensuite, et à aucun moment le système n'a écrit à quelqu'un sans que vous ayez relu.

### 23.2 De l'audit à la signature

```
J+0   Audit soumis
      → A3 : étape AUDIT_COMPLETED, tâche « Présenter les résultats » J+2 haute
      → BundleRecommendation calculée

J+2   Rencontre. Compte rendu saisi :
      « Marie trouve le prix élevé. Son associé doit approuver.
        Ils veulent voir la partie fidéicommis avant de décider.
        Décision attendue avant la fin du mois. »

      → Agent administratif extrait :
         1. Traiter l'objection tarifaire (J+3) — ObjectionOccurrence créée
         2. Suivre l'approbation de l'associé (J+7) — contact à créer
         3. Préparer une démonstration du fidéicommis (J+4)
         4. Relancer avant la fin du mois (J+20)
      → scoreRisque +20, scoreUrgence +15 (échéance nommée)

J+4   Démonstration. Étape → DEMO_REALISEE

J+7   Proposition envoyée avec le tarif fondateur
      → Étape → READY_TO_SIGN

J+9   Webhook : proposition ouverte, pas de réponse
      → A9 prépare une relance à 48 h, en tour de contrôle

J+11  Vous relisez, envoyez

J+14  Signature
      → Étape → SIGNED
      → Tour de contrôle : « Démarrer l'activation », priorité activation
      → Conversion Lead → Cabinet, tâches d'intégration créées
```

### 23.3 Le refus propre

```
Réponse : « Merci mais nous ne sommes pas intéressés. »

→ Agent administratif détecte un refus explicite
→ Propose : statutLead = CHURNED, raisonPerdu à saisir, sortie de toute séquence
→ Vous acceptez, motif « pas de besoin ressenti »
→ Aucune relance n'est plus jamais proposée sur ce lead
→ Le motif alimente la mémoire commerciale globale
→ Aucun message de remerciement automatique n'est envoyé

Règle : un non est final et remercié une fois, à la main si vous le souhaitez.
Le système n'insiste jamais, ne propose pas de « dernière tentative ».
```

---

## 24. Prompts internes des agents

Principes communs à tous : rôle explicite, règles dures avant les données, données
structurées, format de sortie imposé en JSON, obligation de citer, obligation de déclarer
l'incertitude, interdiction d'inventer. Le fichier `lib/ai/proposer-actions-crm.ts` est la
référence de style à suivre.

### 24.1 Agent administratif · le plus critique

```
Tu assistes le fondateur de SAFE Inc. Tu lis un texte issu d'un échange avec un
cabinet prospect et tu en extrais les tâches administratives qui en découlent.

RÈGLES DURES :
- Chaque tâche DOIT citer le passage exact du texte qui la justifie. Une tâche
  sans citation est une erreur.
- N'invente jamais de date. Si le texte dit « bientôt » ou « prochainement »,
  crée la tâche avec dateEcheance = null et echeanceAPreciser = true.
- Distingue un engagement DU PROSPECT (crée une tâche de vérification) d'un
  engagement DE SAFE (crée une tâche d'exécution).
- Ne propose jamais une tâche déjà présente dans TÂCHES OUVERTES.
- Ne propose jamais d'écrire à un contact marqué DÉSABONNÉ.
- Maximum 5 tâches. Zéro si le texte n'en contient aucune.
- Si une personne est nommée mais absente de CONTACTS CONNUS, signale-la comme
  contact à créer. Ne l'invente pas comme existante.
- Français, vouvoiement, pas de tiret long en milieu de phrase.

DATE DU JOUR : {date}
CABINET : {cabinet}
ÉTAPE : {etape}
CONTACTS CONNUS : {contacts}
TÂCHES OUVERTES : {taches}

TEXTE À ANALYSER :
"""
{texte}
"""

Réponds UNIQUEMENT en JSON :
{
  "taches": [
    { "type": "...", "titre": "...", "citation": "le passage exact",
      "dateEcheance": "AAAA-MM-JJ ou null", "echeanceAPreciser": false,
      "origine": "PROSPECT|SAFE", "priorite": "HAUTE|NORMALE|BASSE",
      "contactConcerne": "nom ou null", "confiance": 85 }
  ],
  "contactsACreer": [ { "nom": "...", "role": "...", "citation": "..." } ],
  "misesAJourFactuelles": [
    { "champ": "logicielActuel", "valeur": "Clio", "citation": "..." }
  ],
  "signaux": [
    { "type": "OBJECTION|ENGAGEMENT|ECHEANCE|REFUS|INTERET", "detail": "...",
      "citation": "..." }
  ],
  "incertitudes": ["..."]
}
```

### 24.2 Agent de recherche

```
Tu analyses le site web public d'un cabinet d'avocats pour préparer une prise
de contact.

RÈGLES DURES :
- Uniquement ce qui est écrit sur les pages fournies. Aucune connaissance externe.
- Chaque champ porte un niveau : VERIFIE (écrit noir sur blanc),
  DEDUIT (inféré d'un indice que tu cites), HYPOTHESE (plausible sans indice).
- Un champ sans indice reste null. Ne comble aucun trou.
- Aucune donnée personnelle hors coordonnées professionnelles.
- N'évalue pas la qualité du cabinet. Tu décris, tu ne juges pas.

CONTENU DES PAGES :
"""
{pages}
"""

Réponds UNIQUEMENT en JSON :
{
  "domainesPratique": [ { "valeur": "...", "fiabilite": "VERIFIE",
                          "indice": "citation" } ],
  "tailleEstimee": { "valeur": 4, "fiabilite": "DEDUIT",
                     "indice": "4 avocats listés sur la page Équipe" },
  "membres": [ { "nom": "...", "titre": "...", "fiabilite": "VERIFIE" } ],
  "outilsReperes": [ { "valeur": "...", "fiabilite": "...", "indice": "..." } ],
  "signaux": [ { "detail": "recrute une adjointe", "indice": "..." } ],
  "resume": "3 phrases factuelles",
  "champsIntrouvables": ["volume de facturation", "usage du fidéicommis"]
}
```

### 24.3 Agent de qualification

```
Tu calcules six scores de qualification et tu les justifies.

RÈGLES DURES :
- Un critère sans donnée vaut ZÉRO point. Jamais de moyenne, jamais d'estimation.
- Chaque ligne de justification cite sa source et son niveau de fiabilité.
- La confiance globale baisse quand la part de données DEDUIT ou HYPOTHESE monte.
- Tu ne recommandes pas d'abandonner un prospect. Tu notes, tu ne tranches pas.

{grille de critères et pondérations}
{données du cabinet}

Réponds UNIQUEMENT en JSON : { six scores, lignes de justification,
manquants, confiance, tachesDeVerificationSuggerees }
```

### 24.4 Agent de prospection

```
Tu prépares un message à un cabinet prospect.

RÈGLES DURES :
- N'affirme aucun fait sur le cabinet qui ne soit pas dans FAITS VÉRIFIÉS.
  Les hypothèses ne sortent jamais dans un message.
- Si moins de 3 faits vérifiés sont disponibles, refuse de produire et demande
  un enrichissement préalable.
- Ton posé. Jamais de pression, jamais de fausse urgence, jamais d'argument de
  peur. Le prospect a le droit de ne pas répondre.
- Le client est le héros, SAFE est le copilote. Pars d'un problème concret.
- Français, vouvoiement, pas de tiret long en milieu de phrase.
- Longueur maximale : 150 mots. Un avocat lit vite ou ne lit pas.
- Une seule demande par message, la plus petite possible.

{faits vérifiés} {historique} {objectif du message} {gabarit de départ}
```

### 24.5 Agent de réunion, préparation

```
Tu prépares une fiche de rencontre.

RÈGLES DURES :
- Uniquement ce qui est dans le dossier. Aucune supposition sur ce que le
  prospect va dire.
- Les questions proposées sont ouvertes et servent à comprendre, pas à vendre.
- Les objections listées sont celles déjà exprimées, plus celles observées chez
  des cabinets au profil comparable, clairement distinguées.
- Aucun conseil juridique.

{dossier complet} → { profil, historique, besoins connus, questions,
objections probables, objectif, résultat souhaité, documents, points de vigilance }
```

---

## 25. Risques

### 25.1 Techniques

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Le trou de conversion reste ouvert et la dette s'accumule | Élevée | Élevé | L2 en premier lot |
| Le modèle de données diverge entre le repo et la production | Moyenne | Élevé | Migrations additives uniquement, `migrate diff` avant chaque déploiement |
| Coût des appels modèle non maîtrisé | Moyenne | Moyen | Plafond mensuel, compteur, agents déclenchés à la demande et non en fond |
| Sorties du modèle non conformes au schéma | Élevée | Faible | Normalisation systématique côté serveur, déjà en place |
| Zone Console sans tests, régression silencieuse | Élevée | Moyen | Tests P0 au lot 1, puis un test par lot |
| Webhooks perdus | Moyenne | Moyen | Idempotence, file de reprise, réconciliation quotidienne |

### 25.2 Réglementaires

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Envoi sans base de consentement démontrable | **Élevée aujourd'hui** | Très élevé | L3 avant tout envoi en volume |
| Absence d'adresse postale dans le pied de message | **Certaine aujourd'hui** | Élevé | Variable d'environnement, une minute de travail |
| EFVP manquante pour les transferts hors Québec | Élevée | Moyen à élevé | À réaliser avant la mise en production de l'assistant |
| Notes personnelles faisant basculer hors de l'exclusion des coordonnées d'affaires | Moyenne | Moyen | Avertissement à la saisie, politique interne |
| Plainte pour pourriel | Faible à ce volume | Élevé | Gel automatique, ton posé, cadence espacée |
| Incertitude sur le régime québécois des coordonnées d'affaires | Certaine | Inconnu | Traiter au régime le plus strict en attendant validation |

### 25.3 Opérationnels

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| **Construire le CRM au lieu de vendre** | **Élevée** | **Très élevé** | Voir 25.4 |
| Surautomatisation avant d'avoir un message qui fonctionne | Moyenne | Élevé | Aucun N3 externe avant 50 envois mesurés |
| Confiance excessive dans les recommandations IA | Moyenne | Moyen | Nombre d'observations affiché, refus de recommander sous seuil |
| Fatigue de validation, on accepte tout sans lire | Élevée | Moyen | Maximum 3 propositions à la fois, citation obligatoire |
| Base de prospects qui reste vide | Élevée | Élevé | L7 import, et un objectif chiffré d'entrées par semaine |

### 25.4 Le risque principal

Le risque le plus élevé de ce projet n'est pas technique, il est d'attention.

Ce cahier des charges décrit plusieurs mois de développement. Pendant ce temps, personne ne
vend. Un CRM parfait avec zéro cabinet dedans vaut exactement zéro, et il est beaucoup plus
agréable à construire qu'un appel de prospection à passer.

**Garde-fou proposé, à accepter ou refuser explicitement** : aucun lot de la phase 2 ne
démarre avant que la cohorte de dix places soit remplie, ou qu'un blocage soit démontré par
des chiffres réels et non par une impression. La phase 1 se justifie parce qu'elle débloque
la vente. La phase 2 se justifie par du volume qui n'existe pas encore.

---

## Annexe A — Schémas Prisma des tables de phase 2

À rédiger au moment du lot correspondant, pour éviter de spécifier contre un contexte qui
aura changé. Les entités concernées : `Opportunity`, `Sequence`, `SequenceEtape`,
`SequenceInscription`, `Objection`, `ObjectionOccurrence`, `Automation`, `AutomationRun`,
`TaskDependency`, `UserPreferences`.

## Annexe B — Contrats des 17 étapes du pipeline

À produire sous forme de fichier de données `lib/crm/pipeline-contrats.ts` au lot L2, pas
sous forme de prose. Un contrat en prose se désynchronise du code, un contrat en données
est le code.

## Annexe C — Sources consultées

- CRTC, [Foire aux questions sur la LCAP](https://crtc.gc.ca/fra/com500/faq500.htm)
- CRTC, [La Loi, ses règlements et les lignes directrices](https://crtc.gc.ca/fra/internet/anti/reg.htm)
- Commissariat à la protection de la vie privée du Canada, [La LCAP](https://www.priv.gc.ca/fr/sujets-lies-a-la-protection-de-la-vie-privee/lois-sur-la-protection-des-renseignements-personnels-au-canada/la-loi-sur-la-protection-des-renseignements-personnels-et-les-documents-electroniques-lprpde/r_o_p/loi-canadienne-anti-pourriel/)
- Commissariat à la protection de la vie privée du Canada, [Lois provinciales qui peuvent s'appliquer au lieu de la LPRPDE](https://www.priv.gc.ca/fr/sujets-lies-a-la-protection-de-la-vie-privee/lois-sur-la-protection-des-renseignements-personnels-au-canada/la-loi-sur-la-protection-des-renseignements-personnels-et-les-documents-electroniques-lprpde/r_o_p/prov-lprpde/)
- Commission d'accès à l'information du Québec, [Principaux changements apportés par la Loi 25](https://www.cai.gouv.qc.ca/protection-renseignements-personnels/sujets-et-domaines-dinteret/principaux-changements-loi-25)

Consultées le 2026-07-30. Les règles juridiques évoluent : revalider avant tout usage
externe de ce document.





