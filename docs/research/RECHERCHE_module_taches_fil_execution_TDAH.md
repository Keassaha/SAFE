# Module Tâches + Fil d'Exécution — Spécifications détaillées pour SAFE Inc.

## Vue d'ensemble

Le module proposé fusionne deux fonctions distinctes qui, dans la majorité des logiciels actuels, sont soit séparées, soit absentes : la **gestion des tâches** (qui organise ce qu'il faut faire) et le **journal d'exécution** (qui trace ce qui s'est passé). CaseFleet, l'un des rares outils juridiques à avoir correctement implémenté ce concept, décrit son fil d'activité comme assurant « une expérience collaborative transparente pour toute l'équipe, en montrant l'action survenue, qui l'a effectuée et quand ». Clio, lui, a choisi en 2025 une approche similaire : chaque tâche créée apparaît automatiquement dans le fil de la fiche de dossier, le calendrier de l'échéance, et le tableau de bord de l'étude. Le module SAFE doit aller plus loin en intégrant nativement un fil d'exécution immutable, une vue de reprise de contexte, et une vue de progression par assistant.[^1][^2]

***

## 1. Analyse des besoins réels

### 1.1 Le problème central : la perte de contexte

Le besoin exprimé — « retrouver le fil quand il est perdu » — est un problème cognitif documenté, pas seulement organisationnel. La mémoire de travail agit comme un bloc-notes mental temporaire : elle permet de maintenir l'information active pendant qu'on l'utilise. Pour les profils ADHD, cette mémoire de travail est chroniquement peu fiable, et les déficits cognitifs qui en découlent affectent directement la capacité à suivre des tâches multi-étapes, à reprendre une séquence interrompue, et à organiser les priorités. Les outils de productivité standards échouent précisément parce qu'ils supposent que l'utilisateur « peut simplement organiser ses tâches » — une hypothèse invalide pour les profils ADHD et pour tout travail collaboratif intensif avec des assistants.[^3][^4][^5]

La solution n'est pas une meilleure liste de tâches. C'est un système d'**externalisation de la mémoire de travail** : toutes les informations nécessaires pour reprendre le fil sont visibles sans effort cognitif de reconstruction. En pratique, cela signifie deux choses :[^4][^3]
- L'utilisateur ne doit **jamais avoir à se rappeler** — tout est écrit quelque part et visible en un clic.
- Le système doit produire automatiquement un **résumé de reprise** « Où j'en étais ? » plutôt que de forcer la lecture complète du journal.

### 1.2 Le problème de supervision des assistants

Le second besoin — « vérifier la progression du travail effectué par les assistants » — est un problème de traçabilité et d'imputabilité. Les logiciels d'audit trail professionnels (Hoowla, Disclosurely, DBOMS) documentent que les journaux d'activité doivent être immutables, horodatés, et attributifs : chaque action doit être liée à un utilisateur identifié, avec une date/heure exacte et un contexte (quel dossier, quelle tâche). Un système qui permet aux assistants de modifier ou supprimer leurs entrées d'activité perd toute valeur de supervision.[^6][^7][^8]

Pour les cabinets d'avocats, la valeur est double : **imputabilité interne** (qui a fait quoi, quand) et **conformité réglementaire** (piste d'audit pour le Barreau du Québec). Les études sur les systèmes juridiques montrent que les pistes d'audit réduisent les litiges sur l'intégrité transactionnelle de plus de 40%.[^9]

### 1.3 Ce que font les compétiteurs — et leurs lacunes

| Outil | Tâches par dossier | Fil d'activité | Vue par assistant | Reprise contexte | Conformité Barreau QC |
|---|---|---|---|---|---|
| **Clio** | ✅ Complet | ✅ Timeline dossier | ✅ Partiel | ❌ Absent | ❌ Absent |
| **MyCase** | ✅ Complet | ✅ Timeline event-driven | ✅ Partiel | ❌ Absent | ❌ Absent |
| **Centerbase** | ✅ Kanban + délégation | ✅ Messages internes | ✅ Oui | ❌ Absent | ❌ Absent |
| **Bill4Time** | ✅ Par dossier | ❌ Limité | ✅ Partiel | ❌ Absent | ❌ Absent |
| **CaseFleet** | ✅ Par dossier | ✅ Complet, filtrable | ✅ Admin | ❌ Absent | ❌ Absent |
| **SAFE (cible)** | ✅ Complet | ✅ Immutable | ✅ Vue dédiée | ✅ Bloc reprise | ✅ Intégré |

Les concurrents de SAFE n'offrent pas de **bloc de reprise de contexte** (résumé automatique du dernier état d'un dossier pour reprendre le fil) ni d'**alignement explicite avec les obligations du Barreau du Québec**. Clio offre une timeline dans le tableau de bord de chaque dossier (financials, work in progress, custom fields, timeline of events), mais celle-ci est passive — elle n'est pas conçue pour la reprise active de contexte.[^10]

***

## 2. Architecture du module

Le module se compose de **trois couches logiques** :

```
COUCHE 1 — TÂCHES VIVANTES
Organise ce qui reste à faire (par dossier, par personne, par échéance)

COUCHE 2 — JOURNAL D'EXÉCUTION
Enregistre tout ce qui s'est passé (automatiquement + manuellement)

COUCHE 3 — VUES DÉRIVÉES
Combine les deux couches pour produire : reprise contexte, vue assistant, rapport
```

Ces trois couches répondent à trois questions distinctes :
- Couche 1 → **Où va-t-on ?** (prochaine action, responsable, échéance)
- Couche 2 → **Qu'est-ce qui s'est passé ?** (historique, qui a fait quoi)
- Couche 3 → **Où en sommes-nous ?** (progression globale, alerte blocage)

***

## 3. Modèle de données détaillé

### 3.1 Table `tasks` (Tâches)

```sql
tasks (
  id               UUID PRIMARY KEY,
  matter_id        UUID REFERENCES matters(id),      -- dossier lié
  parent_task_id   UUID REFERENCES tasks(id),         -- pour sous-tâches
  title            VARCHAR(500) NOT NULL,
  description      TEXT,
  status           ENUM('en_attente', 'en_cours', 'bloquee', 'terminee', 'annulee'),
  priority         ENUM('urgente', 'haute', 'normale', 'basse'),
  assigned_to      UUID REFERENCES users(id),
  created_by       UUID REFERENCES users(id),
  due_date         TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  estimated_hours  DECIMAL(5,2),
  actual_hours     DECIMAL(5,2),                      -- auto-calculé depuis time_entries
  is_next_action   BOOLEAN DEFAULT FALSE,              -- "prochaine action" du dossier
  template_id      UUID REFERENCES task_templates(id), -- si généré depuis modèle
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
)
```

**Contraintes importantes :**
- Une seule tâche peut avoir `is_next_action = TRUE` par dossier (contrainte unique partielle)
- `parent_task_id` permet des sous-tâches sur 2 niveaux maximum (au-delà, la complexité nuit à l'utilisabilité)
- `status = 'bloquee'` déclenche une alerte dans la vue de supervision des assistants

### 3.2 Table `activity_log` (Journal d'exécution)

C'est la table centrale du module. Elle est **append-only** : aucune ligne ne peut être modifiée ou supprimée une fois insérée.[^7][^8][^6]

```sql
activity_log (
  id               UUID PRIMARY KEY,
  matter_id        UUID REFERENCES matters(id),       -- toujours lié à un dossier
  task_id          UUID REFERENCES tasks(id),          -- optionnel (action sur tâche)
  actor_id         UUID REFERENCES users(id),          -- qui a agi
  actor_type       ENUM('utilisateur', 'systeme', 'ia'), -- source de l'action
  event_type       ENUM(                               -- type d'événement
    'tache_creee',
    'tache_demarree',
    'tache_completee',
    'tache_reassignee',
    'tache_bloquee',
    'tache_annulee',
    'sous_tache_completee',
    'commentaire_ajoute',
    'document_ajoute',
    'temps_enregistre',
    'statut_modifie',
    'echeance_modifiee',
    'facture_preparee',
    'note_ajoutee',
    'client_contacte',
    'action_manuelle'
  ),
  description      TEXT NOT NULL,                     -- texte lisible de l'action
  metadata         JSONB,                             -- données additionnelles (ex. ancienne valeur)
  duration_minutes INTEGER,                           -- si action liée à du temps
  recorded_at      TIMESTAMPTZ DEFAULT NOW(),
  -- Intégrité immuable
  hash             VARCHAR(64)                        -- SHA-256 de la ligne précédente + contenu
)
```

**Pourquoi `actor_type` inclut 'ia' ?** Pour SAFE, qui intègre des agents IA (ex. Claude Code pour le SEO, ou agents futurs), chaque action effectuée par une IA doit être clairement identifiée comme telle dans le journal. C'est une exigence de transparence et de conformité qui va devenir standard.[^11][^12]

**Pourquoi un hash SHA-256 ?** Les pistes d'audit légalement défendables utilisent le chaînage cryptographique pour garantir qu'aucune entrée n'a été modifiée rétroactivement. Ce n'est pas obligatoire en MVP, mais c'est à prévoir dans l'architecture dès le départ.[^8][^7][^9]

### 3.3 Table `task_templates` (Modèles de tâches)

```sql
task_templates (
  id               UUID PRIMARY KEY,
  name             VARCHAR(200),                      -- ex. "Ouverture de dossier litige"
  practice_area    VARCHAR(100),                      -- ex. "droit civil", "droit de la famille"
  tasks            JSONB,                             -- liste de tâches avec ordre et dépendances
  created_by       UUID REFERENCES users(id),
  is_shared        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
)
```

Clio a introduit en été 2025 les automations pour nouveaux dossiers : attribution automatique de listes de tâches et génération de documents dès la création d'un dossier. SAFE devrait offrir la même logique. Un modèle de tâches pour « Ouverture litige » génère automatiquement 8 tâches prédéfinies avec délais relatifs, assignations par défaut, et premières sous-tâches.[^13]

### 3.4 Table `task_dependencies` (Dépendances)

```sql
task_dependencies (
  id               UUID PRIMARY KEY,
  task_id          UUID REFERENCES tasks(id),
  depends_on       UUID REFERENCES tasks(id),
  dependency_type  ENUM('bloque_par', 'doit_suivre', 'lie_a'),
  created_at       TIMESTAMPTZ DEFAULT NOW()
)
```

Le modèle de dépendances est issu des meilleures pratiques des systèmes de gestion de projet modernes. Pour SAFE, les dépendances les plus utiles sont simples : « cette tâche ne peut pas démarrer avant que celle-là soit terminée » (`bloque_par`). La visualisation en vue Kanban ou liste suffit — pas besoin d'un Gantt.[^14][^15]

### 3.5 Table `context_snapshots` (Snapshots de reprise)

```sql
context_snapshots (
  id               UUID PRIMARY KEY,
  matter_id        UUID REFERENCES matters(id),
  generated_at     TIMESTAMPTZ DEFAULT NOW(),
  generated_by     ENUM('systeme', 'utilisateur', 'ia'),
  last_activity    TEXT,                              -- dernière action importante (résumé)
  next_action      TEXT,                             -- prochaine action recommandée
  blocking_issues  JSONB,                            -- tâches bloquées, tâches en retard
  summary          TEXT,                             -- résumé narratif en 3-5 lignes
  active_tasks     INTEGER,
  overdue_tasks    INTEGER
)
```

Ce tableau est celui qui n'existe dans **aucun** des compétiteurs analysés. Il répond directement au besoin de reprise de contexte : l'utilisateur ouvre SAFE, clique sur un dossier, et voit un bloc « Où j'en étais ? » généré automatiquement (ou sur demande), sans avoir à lire tout le journal.

***

## 4. Modèle de vues (UI)

### 4.1 Vue 1 — Tableau de bord par dossier

Structure en trois colonnes verticales :

```
┌─────────────────────────────────────────────────────────┐
│ DOSSIER : Dumont c. Tremblay — Litige civil             │
├──────────────────┬──────────────────┬───────────────────┤
│ BLOC REPRISE     │ TÂCHES EN COURS  │ FIL D'ACTIVITÉ    │
│                  │                  │                   │
│ Résumé auto :    │ 🔴 En retard (2) │ Aujourd'hui       │
│ "Dernière action │ 🟡 Urgentes (1)  │ ────────          │
│  : Julie a       │ ⚪ En attente(4) │ 14h32 Julie       │
│  envoyé la mise  │                  │ ↳ Doc envoyé      │
│  en demeure le   │ PROCHAINE ACTION │                   │
│  28 mai. Client  │ ─────────────    │ 11h15 Système     │
│  n'a pas répondu │ Relancer Dumont  │ ↳ Rappel créé     │
│  dans le délai." │ → Julie          │                   │
│                  │ → Avant le 3 juin│ Hier              │
│ ⚠️ 1 tâche       │                  │ ────────          │
│  bloquée         │                  │ 16h45 Marc        │
│ ⏰ 2 en retard   │                  │ ↳ Note ajoutée    │
└──────────────────┴──────────────────┴───────────────────┘
```

**Règles d'affichage :**
- Le bloc reprise se régénère automatiquement à chaque ouverture si plus de 24h se sont écoulées depuis la dernière visite
- Le fil d'activité est en ordre chronologique inverse (plus récent en haut)
- Les entrées système (rappels, automations) sont visuellement distinctes des entrées humaines
- La prochaine action est toujours visible sans défilement

### 4.2 Vue 2 — Vue "Mes tâches" (par utilisateur)

Organisée en quatre sections :

| Section | Contenu | Tri par défaut |
|---|---|---|
| **Aujourd'hui** | Tâches dont l'échéance est aujourd'hui | Priorité décroissante |
| **Cette semaine** | Tâches dont l'échéance est dans les 7 jours | Priorité + dossier |
| **En retard** | Tâches dont l'échéance est dépassée | Ancienneté |
| **En attente** | Tâches assignées sans échéance proche | Dossier |

Design inspiré de Linear : ultra-rapide, keyboard-first, sans configuration. L'utilisateur devrait pouvoir marquer une tâche comme terminée en 1 clic et passer à la suivante.[^16][^17]

### 4.3 Vue 3 — Supervision des assistants

C'est la vue managériale. Elle répond à la question : « Qu'est-ce que mes assistants ont fait aujourd'hui / cette semaine ? »

```
┌─────────────────────────────────────────────────────────┐
│ TRAVAIL DE L'ÉQUIPE — Semaine du 26 mai au 1er juin     │
├──────────┬─────────┬─────────┬──────────┬───────────────┤
│ Assistant│Complétées│En cours │En retard │ Dernière      │
│          │         │         │          │ action        │
├──────────┼─────────┼─────────┼──────────┼───────────────┤
│ Julie    │   12    │    4    │    1     │ Aujourd'hui   │
│          │         │         │          │ 14h32         │
├──────────┼─────────┼─────────┼──────────┼───────────────┤
│ Marc     │    8    │    6    │    0     │ Hier 16h45    │
├──────────┼─────────┼─────────┼──────────┼───────────────┤
│ (Total   │   20    │   10    │    1     │               │
│ cabinet) │         │         │          │               │
└──────────┴─────────┴─────────┴──────────┴───────────────┘
```

Cliquer sur « Julie » ouvre le détail : liste de toutes ses actions cette semaine, tâches complétées (avec horodatage), tâches en retard (avec dossier lié), temps enregistré. Centerbase offre une logique similaire avec visibilité sur qui complète les tâches déléguées, mais sans la vue résumée chiffrée.[^18]

### 4.4 Vue 4 — Journal global (piste d'audit)

Accessible uniquement aux rôles « Administrateur » et « Avocat principal ». Affiche l'intégralité du journal d'activité de l'étude, filtrable par :
- Utilisateur
- Dossier
- Type d'événement
- Période
- Acteur (humain / système / IA)

Cette vue est immuable en lecture seule et exportable en CSV/PDF pour les besoins de conformité Barreau. Hoowla, logiciel juridique britannique, propose exactement ce modèle : journaux immutables couvrant à la fois les activités sur dossiers et les transactions financières, exportables pour les auditeurs.[^6][^8]

***

## 5. Logique métier détaillée

### 5.1 Déclencheurs automatiques du journal

Chaque action dans SAFE doit générer automatiquement une entrée dans `activity_log` :

| Événement SAFE | Entrée générée dans le journal |
|---|---|
| Tâche créée | « [Acteur] a créé la tâche "[Titre]" » |
| Tâche assignée à un autre | « [Acteur] a réassigné "[Titre]" à [Nouvel assigné] » |
| Statut → En cours | « [Acteur] a démarré la tâche "[Titre]" » |
| Statut → Terminée | « [Acteur] a complété la tâche "[Titre]" » |
| Statut → Bloquée | « [Acteur] a marqué "[Titre]" comme bloquée » |
| Commentaire ajouté | « [Acteur] a ajouté un commentaire sur "[Titre]" » |
| Document ajouté au dossier | « [Acteur] a ajouté le document "[Nom]" au dossier » |
| Temps enregistré | « [Acteur] a enregistré [X]h sur "[Titre]" » |
| Échéance modifiée | « [Acteur] a déplacé l'échéance de "[Titre]" du [Ancienne date] au [Nouvelle date] » |
| Facture préparée | « Système a généré la facture [#] pour [Client] » |
| Automatisation déclenchée | « IA a créé [X] tâches depuis le modèle "[Nom]" » |

### 5.2 Logique de la prochaine action

Une seule tâche par dossier peut être marquée `is_next_action = TRUE`. La logique de sélection automatique suit cet ordre de priorité :

1. Tâche en retard la plus ancienne (statut `en_cours` + `due_date` < aujourd'hui)
2. Sinon : tâche urgente la plus proche de son échéance
3. Sinon : tâche démarrée la plus ancienne (statut `en_cours`)
4. Sinon : prochaine tâche disponible (statut `en_attente`, pas de dépendance bloquante)

L'utilisateur peut toujours choisir manuellement la prochaine action — la sélection automatique est une suggestion, pas une obligation.

### 5.3 Génération du bloc de reprise de contexte

Le bloc « Où j'en étais ? » est généré en combinant :

```
1. Dernière action importante du journal (exclure les actions système mineures)
2. Tâche marquée is_next_action = TRUE
3. Nombre de tâches en retard
4. Nombre de tâches bloquées
5. Dernier responsable actif (dernier user_id ayant enregistré une action)
```

En MVP, ce résumé est généré en règles déterministes. En V2, une intégration avec un LLM (ex. Claude) peut produire un résumé narratif plus naturel en 2-3 phrases.

Exemple de résumé généré :

> « Dernière action (Julie, 28 mai) : mise en demeure envoyée par courriel. La prochaine action est de relancer M. Dumont si pas de réponse d'ici le 3 juin. 2 tâches en retard, 1 tâche bloquée (attend signature procuration). »

### 5.4 Templates de tâches par type de dossier

Inspirés des Clio Task Lists (listes de tâches réutilisables et cohérentes pour chaque type de dossier), les templates SAFE doivent inclure des modèles pré-construits pour les types de dossiers courants au Québec :[^19]

**Exemple : Ouverture de dossier — Litige civil**

| # | Tâche | Assigné par défaut | Délai relatif | Sous-tâches |
|---|---|---|---|---|
| 1 | Vérifier les conflits d'intérêts | Avocat | J+0 | — |
| 2 | Créer la fiche client | Adjoint | J+1 | Copie pièces ID, formulaire contact |
| 3 | Ouvrir compte en fiducie | Adjoint | J+2 | — |
| 4 | Préparer contrat de mandat | Avocat | J+3 | Lettre d'engagement, modalités forfait |
| 5 | Indexer pièces initiales | Adjoint | J+5 | — |
| 6 | Premier appel client | Avocat | J+7 | Grille d'entretien |

***

## 6. Règles de conformité et d'imputabilité

### 6.1 Immutabilité du journal

Aucune entrée du journal `activity_log` ne peut être modifiée ou supprimée par qui que ce soit, y compris les administrateurs. Cette règle est techniquement appliquée par :
- Absence de endpoint `PUT /activity_log/:id` et `DELETE /activity_log/:id` dans l'API
- Politique Row Level Security (RLS) en base de données : `NO UPDATE`, `NO DELETE` sur cette table[^7][^8]
- Optionnel (V2) : hashing SHA-256 cumulatif pour preuve d'intégrité[^8][^9]

### 6.2 Traçabilité des agents IA

Toute action effectuée par un assistant IA dans SAFE (génération de tâches, mise à jour de statut, création de rappels) doit être enregistrée avec `actor_type = 'ia'` et l'identifiant de l'agent. Cette transparence est une exigence émergente pour les outils juridiques utilisant l'IA — le Barreau du Québec n'a pas encore légiféré sur ce point en 2026, mais la tendance réglementaire est claire.[^12][^11]

### 6.3 Niveaux de permission sur le journal

| Rôle | Voir son journal | Voir journal collègues | Voir journal global | Exporter |
|---|---|---|---|---|
| Adjoint | ✅ | ❌ | ❌ | ❌ |
| Avocat | ✅ | ✅ (son dossier) | ❌ | ❌ |
| Avocat principal | ✅ | ✅ | ✅ | ✅ |
| Administrateur | ✅ | ✅ | ✅ | ✅ |

***

## 7. Intégrations avec les autres modules SAFE

Le module Tâches + Fil d'Exécution doit être connecté nativement à tous les autres modules SAFE :

| Module SAFE | Intégration |
|---|---|
| **Facturation** | Tâche complétée → proposition automatique d'entrée de temps → génération facture |
| **Compte en fiducie** | Opération fiduciaire → entrée automatique dans le journal du dossier |
| **Suivi du temps** | Timer lié à une tâche → durée enregistrée dans `tasks.actual_hours` et dans le journal |
| **Documents** | Document ajouté → entrée automatique dans le journal + possibilité de lier à une tâche |
| **Calendrier** | Échéance de tâche → événement calendrier + rappel automatique |
| **Conformité Barreau** | Journal + tâches = piste d'audit exportable pour vérification |

La valeur de cette intégration est exactement ce que CosmoLex décrit comme la promesse centrale d'un bon logiciel de gestion de cabinet : « tout ce qui est connecté au bon client au même endroit — documents, courriels, notes, tâches, entrées de temps et activité de facturation ».[^20]

***

## 8. Plan d'implémentation priorisé (MVP → V2 → V3)

### MVP (Priorité maximale — 6 à 8 semaines)

Ces 5 fonctionnalités constituent le cœur du module. Sans elles, le module ne résout pas le problème :

1. **Table `tasks`** avec statuts, assignation, priorité, échéance, sous-tâches (1 niveau)[^21][^22]
2. **Table `activity_log`** append-only avec déclencheurs automatiques sur les 10 événements principaux[^6][^7]
3. **Vue par dossier** : bloc reprise + tâches en cours + fil d'activité[^2][^10]
4. **Vue "Mes tâches"** : aujourd'hui / semaine / en retard / en attente[^22][^21]
5. **Vue supervision assistants** : tâches complétées, en cours, en retard + dernière action par membre[^18][^22]

### V2 (Impact élevé — 8 à 12 semaines après MVP)

6. **Templates de tâches** par type de dossier avec génération automatique à l'ouverture[^19][^13]
7. **Dépendances entre tâches** (bloque_par, doit_suivre)[^15][^14]
8. **Résumé de reprise généré par LLM** (intégration Claude API)[^5][^3]
9. **Export du journal** (CSV, PDF) pour conformité Barreau[^8][^6]
10. **Notifications intelligentes** : alerte tâche bloquée, retard, inactivité sur dossier > 7 jours

### V3 (Valeur différenciatrice — 3 à 6 mois après V2)

11. **Hashing SHA-256** sur le journal pour piste d'audit cryptographiquement vérifiable[^9][^7][^8]
12. **Scoring de productivité** par assistant (tâches/jour, respect des délais, taux blocage)
13. **Détection automatique des dossiers dormants** (aucune activité depuis X jours) avec alerte
14. **Rapport d'activité hebdomadaire** envoyé automatiquement à l'avocat principal
15. **Intégration IA agents** : identification des actions IA dans le journal (`actor_type = 'ia'`)[^11][^12]

***

## 9. Métriques de succès du module

Pour valider que le module résout les vrais problèmes, voici les indicateurs mesurables :

| Métrique | Définition | Cible à 90 jours |
|---|---|---|
| **Temps de reprise de contexte** | Durée entre l'ouverture d'un dossier et la première action utile | < 30 secondes |
| **Taux d'utilisation du fil** | % des utilisateurs consultant le fil d'activité au moins 3x/semaine | > 60% |
| **Tâches créées / dossier actif** | Nombre moyen de tâches ouvertes par dossier actif | > 3 |
| **Taux de complétion** | % des tâches créées qui sont marquées terminées (vs abandonnées) | > 70% |
| **Taux de retard** | % des tâches avec une date d'échéance dépassée non complétées | < 15% |
| **Usage vue supervision** | % des avocats consultants la vue équipe au moins 1x/semaine | > 50% |

***

## 10. Zones d'incertitude et points à valider

1. **Adoption des templates** : les avocats québécois sont-ils prêts à utiliser des modèles de tâches pré-construits, ou préfèrent-ils tout créer manuellement ? À valider par entretiens utilisateurs (5 cabinets cibles) avant le développement de la V2.

2. **Granularité du journal** : un journal trop verbeux (chaque micro-action) crée du bruit ; trop discret, il perd sa valeur de reprise. Le seuil optimal est à trouver par test utilisateur — commencer avec les 10 événements MVP et ajuster.

3. **Performance du journal en lecture** : une table `activity_log` qui grossit vite (centaines d'entrées/jour sur un cabinet actif) peut ralentir les vues. Prévoir des index sur `(matter_id, recorded_at DESC)` et une stratégie de pagination / archivage dès la conception.

4. **Résumé de reprise automatique sans IA** : la version déterministe (règles) peut sembler générique pour des cas complexes. L'intégration LLM améliore la qualité mais ajoute de la latence et un coût par appel. Ce compromis doit être évalué avec les utilisateurs avant de s'engager en V2.

5. **Conformité Barreau du Québec** : les règles exactes sur la conservation des pistes d'audit pour les cabinets québécois n'ont pas de spécification technique publiée à ce jour. Une consultation avec un représentant du Barreau est recommandée avant de commercialiser cette fonctionnalité comme « conforme Barreau ».

6. **Délégation à des agents IA externes** : si SAFE permet à Claude Code ou d'autres agents d'agir sur les dossiers (créer des tâches, mettre à jour des statuts), le framework de traçabilité `actor_type = 'ia'` doit être implémenté en MVP, pas en V3 — le risque réglementaire apparaît tôt.

---

## References

1. [Task Management](https://help.clio.com/hc/en-us/articles/9204917906971-Task-Management) - Tasks are an essential component of tracking matter-related activity and events. With basic task man...

2. [Activity Feed | CaseFleet](https://www.casefleet.com/features/activity-feed) - Casefleet's activity feed lets you review and filter a detailed account of changes made within the c...

3. [Working Memory and ADHD: Tools to Improve Focus](https://themindfuladult.ca/working-memory-adhd-strategies/) - Explore the link between working memory and ADHD. Discover strategies to improve focus and organizat...

4. [Improving Working Memory When Living with ADHD](https://adhdvancouver.ca/improving-working-memory-when-living-with-adhd/) - Break Tasks into Smaller Steps. 3. Use Visual Aids. 3. Implement External Memory Tools. 4. Practice ...

5. [ADHD Productivity Tools: What Actually Works (2026 Guide) - Recallify](https://recallify.ai/adhd-apps-productivity-tools/) - Most productivity tools assume consistent focus. ADHD brains work differently. We compare task captu...

6. [Hoowla Conveyancing Software | Audit Trails](https://www.hoowla.com/audit-trails/) - Track every action with Hoowla's audit trails. Time-stamped records give managers and compliance off...

7. [Audit Trail - Immutable Activity Logging | Disclosurely](https://disclosurely.com/el/docs/features/audit-trail)

8. [Creating Audit Trails That Preserve Legal Defensibility](https://aaronhall.com/creating-audit-trails-for-legal-defensibility/) - Attorney Aaron Hall represents business owners and their companies. Businesses hire Aaron to advise ...

9. [Key Steps for Building a Reliable Audit Trail in Regulatory Reporting ...](https://moldstud.com/articles/p-essential-steps-to-develop-a-robust-audit-trail-in-regulatory-reporting-software) - Learn how to build a reliable audit trail for regulatory reporting software: step-by-step guidance o...

10. [Matter's Dashboard](https://help.clio.com/hc/en-us/articles/16681289917595-Matter-s-Dashboard) - In Clio Manage, each matter has a dashboard that provides an overview of matter information, such as...

11. [SaaS Workflow Monitoring for AI Operations and Enterprise Process ...](https://sysgenpro.com/automation/saas-workflow-monitoring-for-ai-operations-and-enterprise-process-accountability) - Explore how SaaS workflow monitoring strengthens AI operations, ERP integration, API governance, and...

12. [Launched a hosted delegation log for AI agents tonight - Reddit](https://www.reddit.com/r/SaaS/comments/1sq202x/launched_a_hosted_delegation_log_for_ai_agents/) - If you are building with AI agents and need a cryptographic audit trail that holds up to a complianc...

13. [What's New at Clio: Summer 2025](https://www.youtube.com/watch?v=REXUvTbp2QE) - In this edition of What’s New at Clio, we’re unveiling powerful updates designed to help law firms w...

14. [Project & Task Management System — Data Modeling Question](https://datavidhya.com/data-modeling/project-task-management-system/) - ### Problem Design a database schema for a project management platform where teams organize work int...

15. [Projectmanager's Task...](https://www.projectmanager.com/software/task-management) - Task management software that lets you create task lists, plan your projects, & collaborate so you c...

16. [Linear – The system for product development](https://linear.app) - Purpose-built for planning and building products. Designed for the AI era. Issue tracking is deadlin...

17. [Asana](https://www.trytrackr.com/blog/linear-vs-notion-vs-asana) - A detailed comparison of Linear, Notion, and Asana across pricing, features, integrations, and team ...

18. [Legal Task Management Software - Centerbase](https://centerbase.com/features/task-management/) - Manage, assign & track tasks with our legal task delegation app. Get project visibility, reduce emai...

19. [Think you know Clio? Here are 3 powerful features you might not be ...](https://www.facebook.com/GoClio/videos/think-you-know-clio-here-are-3-powerful-features-you-might-not-be-using-yet-that/605984252450744/) - Think you know Clio? Here are 3 powerful features you might not be using yet that can help keep your...

20. [8 Key Features for Legal Practice Management Software - CosmoLex](https://www.cosmolex.ca/blog/features-for-legal-practice-management-software/) - Discover the 8 essential legal practice management features your firm needs to streamline billing, a...

21. [Stay on Track with Legal Task Management Software - Bill4Time](https://www.bill4time.com/task-management-software/) - Legal task management software helps law firms organize, assign, and track every task related to a c...

22. [Legal Task Management Software - CARET Legal](https://caretlegal.com/case-management/task-management/) - Our legal task management system lets you easily track the amount of time spent on each task and ass...

