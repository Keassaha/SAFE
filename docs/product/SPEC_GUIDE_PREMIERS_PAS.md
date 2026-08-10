# Spec — Accueil et guide interactif des premiers pas

> Statut : **DRAFT**, en attente validation CEO.
> Date : 2026-08-08
> Remplace et absorbe : `SPEC_onboarding_persistant.md` (dont les lots 1 et 1b deviennent la couche 1 ci-dessous).

---

## 1. État actuel, vérifié dans le code

| Élément | État réel |
|---|---|
| `app/onboarding/page.tsx` | **11 lignes.** Un `redirect("/tableau-de-bord")`. Le formulaire en 5 étapes a été masqué le 2026-06-22 parce qu'il ne persistait rien. |
| `POST /api/onboarding` | Reçoit les données, calcule un plan, **envoie deux courriels, et n'écrit rien en base.** |
| `components/dashboard/GettingStarted.tsx` | **Existe et est bon.** 5 étapes, barre de progression animée, chaque ligne est un lien vers l'action, design `si-*` conforme. |
| Source de l'avancement | **Dérivé des données réelles** (`tableau-de-bord/page.tsx:487`) : config présente ? clients ≥ 1 ? dossiers ≥ 1 ? heures ≥ 1 ? factures ≥ 1 ? |
| Persistance de l'avancement | **Aucune.** Rien ne retient où l'utilisateur en était. |
| Bibliothèque de tour produit | **Aucune** (ni joyride, ni shepherd, ni driver.js). Terrain vierge. |
| `CabinetInterface` | Modèle complet et inexploité par l'onboarding : `disciplines`, `modules`, `ongletsActifs`, `widgets`, `modeFacturation`, `conformite`. |
| Couche assistante | `ACTIVE_ASSISTANT_LAYER.md` **V1 implémentée** : calcul de « manquant », « prochaine action », « prêt à facturer » par dossier. |

**Deux conclusions.**

La checklist n'est pas à refaire, elle est à faire grandir. Son avancement dérivé des données réelles est un choix juste : il ne peut pas mentir. On le garde.

Ce qui manque n'est pas une liste d'étapes. C'est **l'accompagnement pendant l'étape**.

---

## 2. Le principe : le premier mandat guidé

Le réflexe serait un tour produit : un projecteur sur un bouton, une bulle, « Suivant ». On ne fait pas ça.

Trois raisons, dans l'ordre d'importance :

1. **Un tour montre l'application. Il ne fait rien avancer.** L'utilisateur clique « Suivant » cinq fois, ferme, et n'a rien produit. L'objection réelle d'un avocat n'est pas « je ne comprends pas votre outil », c'est « je n'ai pas le temps d'apprendre un outil ».
2. **Un tour arrive toujours au mauvais moment.** Il se déclenche à la première connexion, c'est-à-dire précisément quand l'utilisateur n'a encore aucune question.
3. **Un tour vieillit mal.** Il s'accroche à des éléments du DOM et casse au premier changement d'écran.

À la place : **SAFE accompagne le cabinet à travers un vrai mandat, du début à la fin, avec ses vraies données.**

Configurer le cabinet, entrer un vrai client, ouvrir son vrai dossier, saisir de vraies heures, produire une vraie facture, l'envoyer, encaisser.

À la fin, le cabinet n'a pas *vu une démo*. Il a **facturé un client**. C'est la seule preuve qui compte, et c'est aussi celle qui se montre à l'avocat quand c'est l'adjointe qui a fait le parcours.

Les cinq étapes existent déjà dans `GettingStarted.tsx`. Elles deviennent la colonne vertébrale du guide.

---

## 3. Les trois couches

### Couche 1 — L'accueil qui configure

Ce que la spec précédente appelait le blocage B1.

- **6 à 8 questions, un seul écran qui défile.** Pas cinq étapes successives.
- **La province est la première question et elle pilote tout** : régime de taxe (`lib/onboarding/taxes.ts`), régulateur affiché, copie réglementaire, tableau de conformité.
- **Les disciplines cochées écrivent `CabinetInterface.disciplines`**, donc le menu se compose tout seul (le pont catalogue existe déjà).
- **Upsert idempotent.** Ne jamais écraser une config existante sans confirmation. Cabinet Dérisier sanctuarisé.
- Migrations additives uniquement.

*Terminé quand* : un cabinet neuf remplit l'accueil, recharge, et sa première facture porte les bonnes taxes sans qu'aucun script n'ait été écrit.

### Couche 2 — Le fil

La checklist quitte le tableau de bord et devient un compagnon qui suit l'utilisateur.

```
  ┌─ Écran en cours : Nouveau client ──────────────────┐
  │                                                     │
  │   [ le vrai formulaire, jamais masqué ]             │
  │                                                     │
  └─────────────────────────────────────────────────────┘

  ┌─ Premiers pas · 2 sur 5 ─────────────────────  [–] ─┐
  │ ●●○○○                                               │
  │ Votre premier client                                │
  │                                                     │
  │ Entrez un vrai client, pas un exemple. Le type      │
  │ (personne ou entreprise) décide des taxes et des    │
  │ vérifications d'identité exigées par le Barreau.    │
  │                                                     │
  │ Ensuite : ouvrir son dossier.        [Plus tard]    │
  └─────────────────────────────────────────────────────┘
```

Cinq propriétés, et chacune est une décision :

**Un rail, jamais une modale.** Il ne prend jamais le focus, ne bloque jamais un champ, se réduit d'un clic. Un cabinet en plein travail ne se fait pas interrompre par son logiciel.

**Il sait où vous êtes.** Sur le formulaire de nouveau client, il ne dit pas « allez créer un client ». Il dit quoi remplir ici et pourquoi. Le contenu suit la route, pas un compteur d'étapes.

**Il explique le pourquoi, pas le où.** « Le numéro de Barreau apparaîtra sur vos rapports d'inspection » plutôt que « cliquez ici pour saisir votre numéro ». Le *où* est visible à l'écran. Le *pourquoi* est ce qu'un cabinet ne peut pas deviner, et c'est ce qui fait qu'il remplit le champ correctement du premier coup.

**Il survit à l'interruption.** C'est la propriété la plus importante et la plus rare. On quitte au milieu d'un dossier, on revient le lendemain, le rail est exactement là où on l'a laissé et il le dit : « Vous étiez à l'ouverture du dossier Tremblay. » Un cabinet est interrompu vingt fois par jour ; un guide qui redémarre à zéro sera fermé au deuxième essai.

**Il se tait tout seul.** Les cinq étapes faites, il disparaît. Pas de croix à cliquer, pas de réglage à trouver.

*Terminé quand* : on quitte au milieu de l'étape 3, on revient le lendemain, et le rail reprend au bon endroit en le nommant.

### Couche 3 — Le guide qui reste

Une fois les premiers pas finis, le rail change de rôle et devient **« Comment je fais… ? »**, accessible en permanence.

L'architecture est la même que celle retenue pour l'archiviste documentaire, et pour la même raison : **Claude lit la question et l'état réel du cabinet, puis désigne l'écran. Il n'invente pas la réponse.**

Il retourne trois choses : une route, un préremplissage éventuel, et deux lignes d'explication. Jamais un texte libre sur le fonctionnement de SAFE, qui serait la porte ouverte à décrire une fonction qui n'existe pas.

Exemple : « comment je facture un forfait ? » ouvre la création de facture avec le mode forfait déjà sélectionné, et dit en deux lignes ce qui change par rapport à l'horaire.

À brancher sur la couche assistante déjà livrée (`ACTIVE_ASSISTANT_LAYER` V1), qui sait déjà calculer la prochaine action d'un dossier.

*Terminé quand* : dix questions posées en français ouvrent le bon écran, et aucune ne produit une phrase inventée.

---

## 4. Ce qui se persiste, et ce qui ne se persiste pas

**Ne pas toucher à l'avancement dérivé.** Le fait qu'une étape soit faite reste calculé depuis les données réelles. C'est ce qui garantit que la checklist ne peut pas mentir, et ça marche déjà.

**Persister seulement ce que le calcul ne peut pas savoir** : un modèle additif `GuideProgress` (`cabinetId`, `userId`, `etapeCourante`, `derniereRoute`, `reduitAt`, `termineAt`, `vuAt`). C'est la mémoire de la conversation, pas l'état du cabinet.

La distinction compte : si on stocke « étape 2 faite » et que le client est ensuite supprimé, la checklist ment. Si on le dérive, elle se corrige seule.

---

## 5. Lots

| Lot | Contenu | Durée |
|---|---|---|
| **G1** | L'accueil qui persiste : province → régime de taxe, disciplines → `CabinetInterface`, upsert idempotent. Compléter Paramètres → Cabinet (province et mode de taxe manquants). | 2 j |
| **G2** | Le rail : composant, `GuideProgress`, contenu piloté par la route, reprise après interruption, réduction et disparition. | 3 j |
| **G3** | Le contenu des cinq étapes : quoi faire ici, pourquoi ça compte pour un cabinet, ce que ça débloque. **C'est de l'écriture, pas du code.** Faisable en basse énergie. | 1,5 j |
| **G4** | « Comment je fais… ? » : barre persistante, traduction en route + préremplissage, branchement sur la couche assistante. | 2 j |

**Total : 8,5 jours.**

G1 seul a déjà de la valeur : il supprime le script de seed par cabinet. G1 + G2 + G3 forment le guide complet. G4 est une extension autonome.

---

## 6. Dépendance à nommer

L'étape 5 du guide est « créez votre première facture ». Elle mène aujourd'hui sur un écran dont l'audit du même jour dit qu'il présente la même facture sur trois vues concurrentes.

**Guider quelqu'un à travers un écran confus rend la confusion officielle.**

Deux sorties : livrer la consolidation de l'écran de facturation (lot R2 du chantier facturation) avant d'écrire la carte de l'étape 5, ou assumer que l'étape 5 pointe vers l'écran actuel et la réécrire ensuite. La première est plus propre, la seconde est plus rapide. C'est un arbitrage CEO.

---

## 7. Ce qu'on ne fait pas

- **Aucune bibliothèque de tour produit** (joyride, shepherd, driver.js). Elles imposent le motif projecteur + « Suivant » qu'on refuse, elles s'accrochent au DOM et cassent au premier changement d'écran, et elles ne savent rien de l'état réel du cabinet.
- **Aucune vidéo d'accueil.** Elle périme au premier changement d'interface, et personne ne regarde une vidéo pendant qu'il travaille.
- **Aucune donnée de démonstration à nettoyer ensuite.** Le guide utilise les vraies données du cabinet. Un cabinet qui doit supprimer un faux client après coup perd confiance dans ce qu'il vient de faire.
- **Aucune gamification** (badges, confettis, points). Le public est un cabinet d'avocats. La récompense, c'est la facture envoyée.

---

## 8. Critères d'acceptation

- Un cabinet neuf s'inscrit, remplit l'accueil, et **aucun script n'est écrit par le fondateur**.
- Sa première facture porte les taxes de sa province.
- Le rail suit l'utilisateur sur les cinq étapes, sans jamais bloquer un champ.
- Quitter au milieu et revenir le lendemain reprend au bon endroit, en le nommant.
- Les cinq étapes faites, le rail disparaît sans intervention.
- `tsc` propre, suite verte, parité i18n FR/EN.
