# SAFE — Couche assistante active

Date: 2026-04-29
Statut: V1 implémentée.
Portée: doctrine produit pour le rôle `assistante` (et par extension `admin_cabinet` qui peut suppléer).

Ce document définit ce que SAFE doit faire **pour** l'assistante juridique — pas seulement ce qu'il l'autorise à faire. La différence est concrète : SAFE doit lui dire **quoi préparer aujourd'hui**, pas seulement lui donner les permissions.

## 1. Pourquoi cette couche

Avant la V1, SAFE traitait l'assistante comme une utilisatrice avec des permissions étendues sur le cabinet : elle pouvait créer des dossiers, gérer des clients, manipuler la facturation. Mais elle ne disposait d'**aucune surface centrale** lui montrant :

- ce qui est incomplet aujourd'hui ;
- ce qui attend une action de sa part vs du client ;
- ce qui est prêt pour revue avocat ;
- ce qui est bloqué.

Conséquence dans un cabinet réel : les oublis se logent dans la mémoire de l'assistante. Pour un cabinet de 2 à 4 dossiers, ça tient. Pour 30+, c'est fragile.

La V1 corrige ce vide en fournissant **deux choses** :

1. Une **logique** qui calcule pour chaque dossier son état de préparation et la liste de ses manquants.
2. Une **page** qui agrège tout cela en une file de travail compréhensible.

## 2. Rôle de l'assistante dans SAFE

| Responsabilité | Qui | Note |
|---|---|---|
| Création dossier (formulaire) | Assistante | Avec validation des champs critiques |
| Vérification d'identité du client | Assistante | Avant le démarrage du fond |
| Composition du mandat (checklist) | Assistante | L'avocat valide le contenu |
| Préparation des documents et pièces | Assistante | Avec rappels |
| Suivi des échéances administratives | Assistante | Audiences, dépôts, biométries |
| Préparation des débours attendus | Assistante | À partir des templates par type |
| Suivi des tâches admin | Assistante | Liste personnelle + dossiers ouverts |
| Revue juridique du dossier | Avocat | L'assistante prépare ; l'avocat valide |
| Décision stratégique | Avocat | L'assistante exécute ; ne décide pas |
| Validation facture | Avocat / Admin | L'assistante prépare ; ne valide pas |
| Conformité disciplinaire | Avocat | L'assistante alimente la traçabilité |

L'assistante prépare ; l'avocat décide. SAFE matérialise cette frontière par les états `pret_pour_revue` et `pret_a_facturer`.

## 3. États canoniques d'un dossier (côté préparation)

| État | Signification | Qui doit agir |
|---|---|---|
| `bloque` | Un blocage métier strict empêche d'avancer (conflit non résolu, dossier sans client). | Avocat (conflit) ou Admin |
| `incomplet` | Manquants critiques côté assistante (assistant non assigné, mandat manquant, identité non vérifiée, mode de facturation non défini). | Assistante |
| `en_attente_client` | Le dossier attend un retour du client (signature, document, identité à fournir). | Client (relancé par assistante) |
| `en_preparation` | Préparation en cours, des manquants secondaires existent (sections cartable à compléter, débours attendus à enregistrer, échéances à organiser). | Assistante |
| `pret_pour_revue` | Tout ce qui peut être préparé l'a été. L'avocat doit relire/valider. | Avocat |
| `pret_a_facturer` | Le travail facturable est prêt à émettre (RegistreTache complète, débours saisis). Distinct de `pret_pour_revue` — peut coexister. | Avocat / Admin (validation) |

**Priorité d'évaluation** (le 1er match gagne) : `bloque` → `incomplet` → `en_attente_client` → `en_preparation` → `pret_pour_revue`. `pret_a_facturer` est un drapeau additif (peut être `true` même quand l'état principal est `pret_pour_revue`).

## 4. Notion de "manquant"

Un **manquant** est une condition métier identifiée et nommée qui empêche le dossier d'atteindre l'état suivant. Chaque manquant a :

- une `kind` (`assistant`, `mandate`, `identity`, `conflict`, `debours`, `billing_mode`, `checklist`, `event_deadline`)
- une `severity` (`blocking`, `critical`, `warning`, `info`)
- un `label` court lisible humain
- une `nextAction` actionnable (verbe + cible)

**Règles de classification des manquants** :

| Manquant | Severity | Conséquence sur l'état |
|---|---|---|
| Conflit non résolu | `blocking` | `bloque` |
| Assistant non assigné au dossier | `critical` | `incomplet` |
| Mandat absent | `critical` | `incomplet` |
| Identité client non vérifiée | `critical` | `incomplet` |
| Mode de facturation non défini | `critical` | `incomplet` |
| Item obligatoire de la checklist mandat non coché | `warning` | `en_preparation` |
| Débours requis (template `isRequired`) non saisi | `warning` | `en_preparation` |
| Section cartable obligatoire vide (mandat, formulaires) | `warning` | `en_preparation` |
| Événement à moins de 7 jours sans tâche associée | `warning` | `en_preparation` |
| Tâche admin en retard (assignée à l'assistante) | `info` | drapeau visuel |

L'**absence totale de manquants** + au moins un événement futur ou une checklist majoritairement complète → `pret_pour_revue`.

## 5. Notion de "prochaine action"

Pour chaque dossier, SAFE expose **une seule** prochaine action recommandée. Elle est le 1er manquant par sévérité. Exemple :

- Dossier sans assistant → `nextAction = "Assigner une assistante au dossier"`
- Mandat absent → `nextAction = "Créer le mandat du dossier"`
- Identité non vérifiée → `nextAction = "Vérifier l'identité du client"`
- Aucun manquant → `nextAction = null` (état `pret_pour_revue` ou `pret_a_facturer`)

C'est ce qui apparaît en gras sur la carte "Préparation" du dossier et dans la file assistante.

## 6. Notion de "attente client"

Un dossier est en `en_attente_client` quand la prochaine action attendue **n'est pas du ressort du cabinet**. V1 reconnaît trois cas :

- L'identité du client n'est pas vérifiée et aucune session de vérification n'a été initiée par l'assistante depuis 48h.
- Une checklist mandat contient un item obligatoire libellé "client" (heuristique sur `label`) coché à `false`.
- Un débours requis dépend d'une donnée client manquante (extension future — reportée).

V1 reste **conservatrice** : si on n'est pas sûr, on classe en `incomplet` (ce qui mobilise l'assistante) plutôt qu'en `en_attente_client` (ce qui la déresponsabilise).

## 7. Notion de "prêt pour revue avocat"

Un dossier est `pret_pour_revue` quand :
- aucun manquant `blocking` ou `critical` n'existe ;
- aucun manquant `warning` n'existe **OU** tous les warnings concernent des items non bloquants (tâches admin en retard sont `info`, pas `warning`) ;
- au moins un travail substantiel est en cours (mandat existe + identité vérifiée + au moins une section cartable non vide).

Concrètement : l'assistante a fait sa part. L'avocat doit relire.

## 8. Notion de "prêt à facturer"

Drapeau additif. Il s'allume quand :
- au moins un `RegistreTache` du dossier est en statut `complete` (donc complété mais non facturé) ;
- ou le mode de facturation est `horaire` et il y a des `TimeEntry` `READY_TO_BILL` non encore intégrées à une facture.

Ce flag est calculé séparément de l'état principal et peut coexister avec `pret_pour_revue`. Il sert l'admin/avocat, pas l'assistante.

## 9. La file assistante

Page `/gestion/assistante`. Six buckets :

| Bucket | Contenu | Tri |
|---|---|---|
| **Incomplets** | Dossiers `incomplet` | par nombre de manquants critiques desc |
| **Sans assistant** | Dossiers actifs sans `assistantJuridiqueId` | par date d'ouverture asc (les plus anciens) |
| **En attente client** | Dossiers `en_attente_client` | par date de dernier événement |
| **Prêts pour revue** | Dossiers `pret_pour_revue` | par date d'ouverture |
| **Mes tâches admin** | `DossierTache` `a_faire`/`en_cours` assignées à l'utilisateur courant | par date d'échéance asc |
| **Échéances à venir** | `DossierEvenement` dans les 14 jours | par date asc |

Chaque ligne expose : titre du dossier, client, prochaine action ou résumé court, lien vers la fiche.

## 10. Hors scope V1

- **Pas de notifications** (push/email) sur le passage d'état. À programmer en V2.
- **Pas de bridge `DossierTache` ↔ `DossierActe`** — les deux systèmes coexistent. La V1 traite uniquement `DossierTache` côté admin.
- **Pas de migration Prisma** (aucun nouveau champ, aucune nouvelle table).
- **Pas de workflow d'approbation** d'une transition d'état. L'état est toujours dérivé, jamais stocké.
- **Pas de checklist documentaire structurée** par type de dossier — la V1 s'appuie sur le mandat checklist + sections cartable existants.
- **Pas de vue "ma productivité"** — analytics out of scope.

## 11. Garde-fous d'évolution

- Le calcul de l'état est **dérivé**, jamais stocké. Toute évolution doit le rester (cohérent avec la doctrine append-only ailleurs).
- Le helper `getDossierMissingItems` ne doit jamais lever d'exception si une donnée optionnelle manque. Il dégrade gracieusement (ajoute un manquant, ne crashe pas).
- Toute nouvelle catégorie de manquant doit être ajoutée à l'union `MissingItemKind` + couverte par un test.
- La page `/gestion/assistante` ne doit pas dépendre d'une nouvelle table : elle compose les helpers existants.
