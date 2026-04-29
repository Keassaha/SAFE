# SAFE — Signal "dossier prêt pour revue avocat"

Date: 2026-04-29
Statut: V1 implémentée.
Portée: notification interne SAFE quand l'assistante a fini de préparer un dossier.

## 1. Objectif produit

Avant cette V1, l'état dérivé `pret_pour_revue` existait mais **personne ne l'apprenait** : l'assistante voyait le badge dans la file, l'avocat ne savait rien tant qu'il ne consultait pas le dossier. Le passage de relais était implicite.

La V1 matérialise ce passage de relais par un **signal stocké, déduplicqué, traçable**, visible côté avocat sans bruit.

> **Une notification dossier-prêt = un signal métier de premier ordre, pas une notification ad-hoc.** D'où un modèle dédié plutôt que la réutilisation de `NotificationLog` (orienté emails) ou `DossierReminder` (orienté échéances calendaires).

## 2. Quand un signal est émis

Un signal est émis **uniquement** lors de la **transition** :

```
état avant ≠ pret_pour_revue   →   état après = pret_pour_revue
```

Concrètement :
- L'assistante fait un changement (assigner à soi, valider mandat, vérifier identité…) ;
- Le helper `getDossierPreparationStatus(snapshot)` est ré-évalué après l'action ;
- Si l'état dérivé passe à `pret_pour_revue` alors qu'il ne l'était pas avant, le signal est créé.

**Ne déclenche PAS de signal** :
- Une action sur un dossier déjà `pret_pour_revue` (le dossier l'était avant et l'est toujours).
- Une action qui dégrade l'état (`pret_pour_revue → en_preparation`) — on ne notifie pas un retour en arrière.
- Une action sur un dossier `bloque`/`incomplet`/`en_attente_client`/`en_preparation` qui reste dans son état.
- Une création de dossier (jamais immédiatement prêt à la création).

## 3. Cible du signal

Le signal est destiné à **l'avocat responsable** du dossier (`Dossier.avocatResponsableId`).

Cas particuliers :
- **Pas d'avocat responsable défini** → le signal est tout de même créé avec `avocatResponsableId = null` et reste visible pour les `admin_cabinet`. L'admin peut alors assigner un avocat. **Aucune perte de signal**.
- **Avocat responsable inactif/supprimé** (relation `SetNull` côté Prisma) → le signal devient orphelin (`avocatResponsableId = null`) ; comportement identique au cas précédent.

Ne sont **pas** ciblés en V1 : assistante elle-même, comptabilité, autres avocats du cabinet.

## 4. Déduplication

**Règle V1** : un seul signal **non lu** par couple `(dossierId, avocatResponsableId)`.

- Si l'avocat n'a pas encore lu le précédent signal pour ce dossier, on **ne re-crée pas** un nouveau signal.
- Une fois le signal marqué comme lu (`readAt != null`), une nouvelle transition vers `pret_pour_revue` peut générer un nouveau signal.

**Implémentation** : index unique partiel Postgres sur `dedupeKey WHERE "readAt" IS NULL`. Filet structurel + check applicatif en amont. En cas de course concurrente, le P2002 est intercepté et transformé en no-op silent (cohérent avec la doctrine d'idempotence journal).

**`dedupeKey`** : `${dossierId}:${avocatResponsableId ?? "no_avocat"}`. Stable, pas de timestamp.

## 5. Mécanisme de marquage

L'avocat (ou un admin) peut marquer un signal comme lu via une server action `markReadyForReviewRead(signalId)` :
- vérification cabinet + autorisation (l'avocat destinataire ou un admin) ;
- écriture `readAt = now()` + `acknowledgedById = currentUser`.

**Pas de "supprimer"** : append-only. Un signal lu reste en base pour l'audit (qui a vu quoi, quand). Une nouvelle transition peut créer un nouveau signal.

## 6. Surface avocat

Composant `ReadyForReviewInbox` server-side affiché en tête du **tableau de bord** (visible pour `avocat` et `admin_cabinet`).

- Lit les signaux **non lus** (`readAt IS NULL`) du cabinet courant, filtrés par avocat connecté (ou tous pour admin).
- Pour chaque signal : intitulé du dossier, client, raison courte, lien direct vers la fiche, bouton **"Marquer comme vu"**.
- Si zéro signal → bloc absent (pas d'inbox vide bruyante).

Pas de **badge global** dans la sidebar en V1 — le bloc dashboard suffit. À envisager si l'usage le justifie.

## 7. Limites volontaires V1

- **Pas d'envoi email/push** (seul le canal in-app est implémenté). Le signal stocké est extensible : un futur job pourra envoyer un email à partir des signaux non lus depuis > 30 min, par exemple.
- **Pas de "transition inverse"** notifiée (dossier qui régresse de `pret_pour_revue` à `en_preparation`). C'est volontairement silent — la régression est un cas opérationnel normal.
- **Pas de re-déclenchement périodique** si le signal n'est pas lu. Il reste visible en haut du dashboard tant que pas marqué.
- **Pas de groupement multi-dossiers** ("3 dossiers prêts"). Chaque signal est traité individuellement.
- **Pas d'autorisation granulaire** côté lecture : le filtre est par `cabinetId + avocatResponsableId === currentUser` (ou admin). Un avocat ne voit pas les signaux d'un autre avocat.
- **Détection limitée** : la V1 branche **2 actions** (assignation à soi + édition dossier). Les autres flux qui pourraient indirectement faire passer à `pret_pour_revue` (validation d'une `DossierTache`, vérif identité client, etc.) ne déclenchent pas encore — à ajouter quand les besoins se confirment.

## 8. Garde-fous d'évolution

- Toute nouvelle action qui modifie la préparation d'un dossier doit appeler `detectAndEmitIfReady(dossierId, beforeState?)` après son `update` Prisma. Le helper est idempotent et cheap (1 query du snapshot + 1 insert si transition).
- Ne jamais émettre un signal **sans** avoir comparé l'état avant et après. Le helper de transition `shouldEmitReadyForReviewSignal(before, after)` est le seul point d'entrée autorisé pour cette décision.
- Toute évolution du modèle `DossierReadyForReviewSignal` doit conserver la contrainte d'unicité partielle sur `dedupeKey WHERE "readAt" IS NULL` — c'est elle qui garantit la dédup à la base.

## 9. Prochaine priorité

- **Étendre la détection** aux autres actions critiques (validation `DossierTache`, vérification identité, validation cartable/section) — chaque action ajoutée appelle simplement `detectAndEmitIfReady`.
- **Email digest quotidien** vers l'avocat pour les signaux non lus depuis > 24h. Job nightly + table `dedupe` pour ne pas re-spammer.
- **Badge sidebar** indiquant le nombre de signaux non lus si plusieurs s'accumulent.
- **Signal réciproque** quand l'avocat retourne le dossier à l'assistante (avec un commentaire) — symétrique à celui-ci.
