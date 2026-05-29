# Spec — Page « Temps » en mode mixte + choix Forfait/Horaire à l'ajout

> **Statut :** Proposée — à valider avant build
> **Date :** 2026-05-29
> **Demandeur :** Me Derisier (via configuration cabinet mixte)
> **Règle projet :** « Pas de build sans spec validée » (CLAUDE.md)
> **Cabinet pilote :** `derisier-law-on-2026` (mode `mixte`)

---

## 1. Contexte

Derisier facture désormais en **mode mixte** (`modules.facturation.principal = "mixte"`) :
certains dossiers au **forfait**, d'autres à l'**heure**. La config et le moteur de
facture supportent déjà ce mélange (toggle par ligne sur l'écran « Nouvelle facture »,
livré le 2026-05-28).

## 2. Problème

La page `/temps` (`app/(app)/temps/page.tsx`, lignes 17-19) bascule en **tout-ou-rien** :

```
principal === "forfait"  → <RegistreTachesPage>   (Registre des tâches + onglet « Grille tarifaire » + modal « Ajouter une tâche » forfait)
sinon (horaire OU mixte) → <TempsPageClient>      (saisie horaire + TimeEntryFormModal)
```

Conséquence en **mode mixte** : `isForfait` est faux → seule la **vue horaire** s'affiche.
Donc, pour un cabinet mixte :
- ❌ Le **catalogue des forfaits** (`ForfaitServiceTable`, onglet « Grille tarifaire ») est inaccessible via `/temps`.
- ❌ Le **registre des tâches forfait** et le modal **« Ajouter une tâche »** (forfait) sont inaccessibles.
- ✅ La saisie horaire (`TimeEntryFormModal`) reste accessible.

## 3. Objectifs

1. En mode mixte, exposer **les deux univers** sur `/temps` : saisie horaire **et** registre/grille forfait.
2. À l'**ajout d'une entrée**, présenter d'abord un **choix Forfait / Horaire**, puis router vers le bon formulaire avec les bons champs.
3. **Réutiliser** les deux modals existants — aucun nouveau moteur :
   - Forfait → `AjouterTacheModal` (POST `/api/registre-taches`).
   - Horaire → `TimeEntryFormModal` (POST `/api/temps`).

## 4. Hors périmètre (non-objectifs)

- Aucun changement pour les cabinets en **forfait pur** ou **horaire pur** (comportement identique à aujourd'hui).
- Pas de refonte des deux modals existants (on les réutilise tels quels).
- Pas de modification du schéma Prisma ni des routes API.
- Pas de fusion forfait+horaire dans une même *tâche* (le mélange se fait au niveau **facture**, déjà livré).

## 5. Comportement proposé

### 5.1 Routage de `/temps` (server component)

Lire `billingMode` via `getCabinetBillingMode` (au lieu du `JSON.parse` ad hoc actuel) :

| billingMode | Rendu |
|---|---|
| `forfait`  | `<RegistreTachesPage>` (inchangé) |
| `horaire`  | `<TempsPageClient>` (inchangé) |
| `mixed`    | **NOUVEAU** : `<TempsMixteView>` |

### 5.2 `<TempsMixteView>` (nouveau wrapper, mode mixte uniquement)

Vue à **trois onglets de premier niveau** :
- **Onglet « Vue d'ensemble »** *(défaut)* → tableau de bord combiné (voir 5.2.1).
- **Onglet « Horaire »** → contenu de `TempsPageClient`.
- **Onglet « Forfait »** → contenu de `RegistreTachesPage` (qui contient déjà ses sous-onglets « Registre » + « Grille tarifaire »).

> Implémentation : composer les deux composants existants dans un conteneur `Tabs`,
> sans dupliquer leur logique interne. Les données (dossiers, services) sont chargées
> côté serveur comme aujourd'hui et passées en props.

#### 5.2.1 Onglet « Vue d'ensemble »

But : voir d'un coup d'œil ce qui reste à facturer des deux côtés, et lancer un ajout.

Contenu :
1. **Cartes de synthèse** (3) :
   - *Temps non facturé* : nombre d'entrées + total $ (TimeEntry facturables non encore facturées).
   - *Forfaits à facturer* : nombre de tâches + total $ (RegistreTache `statut = complete`, `invoiceLineId = null`).
   - *Total à facturer* : somme des deux.
2. **Bouton principal « Ajouter une entrée »** → ouvre le chooser Forfait/Horaire (cf. 5.3).
3. **Activité récente combinée** : liste fusionnée des dernières entrées (horaire + forfait), triée par date desc, avec une pastille de type (Horaire / Forfait) et un lien vers l'onglet concerné. Limite ~10.

> Les agrégats réutilisent les requêtes existantes (mêmes `where` que `/api/temps`
> et `/api/registre-taches`). Pas de nouveau modèle Prisma.

### 5.3 Écran de choix à l'ajout (cœur de la demande)

Un **seul bouton « Ajouter »** visible en mode mixte. Au clic :

1. Ouvre un petit **dialogue de choix** : deux grandes options
   - **« Forfait »** — facturation à un montant fixe (pack du catalogue).
   - **« Horaire »** — facturation au temps passé (heures × taux 350 $/h par défaut).
2. Selon le choix :
   - Forfait → ferme le chooser, ouvre `AjouterTacheModal`.
   - Horaire → ferme le chooser, ouvre `TimeEntryFormModal`.
3. Après enregistrement, on revient sur l'onglet correspondant (Forfait ou Horaire) avec la liste rafraîchie.

> En **forfait pur** / **horaire pur**, **pas** de chooser : le bouton ouvre directement
> le modal unique correspondant (comportement actuel inchangé).

## 6. Fichiers touchés

| Fichier | Changement |
|---|---|
| `app/(app)/temps/page.tsx` | Brancher sur `billingMode === "mixed"` → `<TempsMixteView>` ; charger dossiers + forfait services pour les deux. |
| `app/(app)/temps/TempsMixteView.tsx` *(nouveau)* | Wrapper à onglets Horaire / Forfait + bouton Ajouter + chooser. |
| `components/temps/AjoutEntreeChooser.tsx` *(nouveau)* | Petit dialogue de choix Forfait/Horaire. |
| `RegistreTachesPage.tsx` / `TempsPageClient.tsx` | Option : permettre de masquer leur propre bouton « Ajouter » quand ils sont imbriqués dans `TempsMixteView` (prop `hideAddButton`), pour éviter deux boutons. |

Aucun changement : schéma Prisma, `/api/registre-taches`, `/api/temps`.

## 7. Cas limites

- Aucun dossier / aucun client → mêmes messages d'aide que les modals actuels.
- `forfaitServices` vide → l'option Forfait reste visible mais le catalogue est vide (saisie libre possible, comportement actuel du modal).
- Rôle assistante vs avocate → conserver les `show()` / permissions existants des deux vues.
- i18n FR/EN → nouvelles clés `temps.mixte.*` (titres d'onglets, libellés du chooser).

## 8. Critères d'acceptation

1. Cabinet **forfait pur** : `/temps` identique à avant (Registre + Grille, un seul bouton Ajouter → modal forfait).
2. Cabinet **horaire pur** : `/temps` identique à avant (saisie horaire, bouton Ajouter → modal horaire).
3. Cabinet **mixte** :
   - `/temps` ouvre par défaut sur **« Vue d'ensemble »** (cartes de synthèse + activité récente combinée).
   - Onglets **Vue d'ensemble**, **Horaire**, **Forfait** présents ; la Grille tarifaire est accessible sous Forfait.
   - Le bouton **Ajouter une entrée** ouvre le **choix Forfait/Horaire**.
   - Choisir Forfait ouvre `AjouterTacheModal` ; choisir Horaire ouvre `TimeEntryFormModal`.
   - Une entrée créée apparaît dans le bon onglet et met à jour les cartes de synthèse après rafraîchissement.
4. `tsc --noEmit` : 0 erreur. Aucune régression de typecheck.

## 9. Déploiement

- Développé et validé sur **localhost** (worktree) d'abord.
- Mise en ligne = **redéploiement Vercel** séparé, après validation visuelle.
- Aucune migration de données.

## 10. Décisions tranchées

- **Onglets :** « Vue d'ensemble » · « Horaire » · « Forfait ».
- **Onglet par défaut :** « Vue d'ensemble ».
- **Q ouverte restante :** aucune bloquante. (Le détail visuel des cartes de synthèse
  sera validé sur localhost.)
