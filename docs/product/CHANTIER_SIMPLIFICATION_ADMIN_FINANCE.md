# Chantier : simplifier les écrans administratifs et financiers

Date d'ouverture du cadre : 2026-09-12
Statut : **opposable pour ce chantier**. Se lit après `REGLE_DE_BUILD.md`, qui prime.
Demande CEO : « améliorer l'expérience utilisateur de SAFE côté administratif et
financier, rendre les pages moins complexes, simplifier les processus, uniformiser
le tout. Un travail bien organisé et auditable. »

> Ce document est le registre du chantier. Il dit ce qui est dans le périmètre, dans
> quel ordre on y va, ce qu'on mesure avant et après chaque écran, et ce que « terminé »
> veut dire. Un écran qui n'a pas sa ligne au §6 n'a pas été livré, quelle que soit
> l'impression visuelle.

---

## 1. Les règles du chantier

Aucune n'est nouvelle. Elles sont rassemblées ici pour qu'on ne les retrouve pas
après coup dans six documents.

| # | Règle | Source |
|---|---|---|
| R1 | **Un écran à la fois.** Le suivant ne s'ouvre pas avant que le précédent ait sa capture, son commit et son entrée de journal. | Demande CEO 2026-09-09, `CO-DIRECTION.md` règle 2 |
| R2 | **On ne refond pas l'architecture.** Les quatorze routes de facturation ne fusionnent pas, aucune table n'est renommée, aucune adresse ne change. Simplifier chaque écran, oui. Refondre, non, tant qu'aucun cabinet n'a franchi le jour 0. | `REGLE_DE_BUILD.md` §5 et §8 |
| R3 | **Chaque changement passe le test du §4 de la règle de build** : il supprime une saisie réelle, ou il rend visible quelque chose qui existe déjà. Un embellissement qui ne fait ni l'un ni l'autre attend. | `REGLE_DE_BUILD.md` §4 |
| R4 | **Proposition, image, oui, puis code.** Aucune ligne dans `app/`, `components/` ou `lib/` avant un PNG montré et un oui explicite du CEO. Les consignes se consignent, datées, au §6 avant d'être appliquées. | Décision CEO 2026-08-24 |
| R5 | **Une action pleine par écran, et une phrase qui nomme le geste.** Un écran où deux boutons sont pleins n'a pas d'action principale. | Demande CEO 2026-09-09, standard PS-020 |
| R6 | **Uniformiser par la grammaire commune, pas par une passe globale.** Registre (`components/ui/registre.tsx`), en-tête de page, zoom souple à la sélection, chiffres tabulaires, jetons de `lib/ds/palettes.ts`. On n'écrit jamais une variante locale de ce qui existe. | Décisions CEO 2026-08-11, référentiel §2 |
| R7 | **Le compteur d'écarts doit baisser** sur l'écran touché. S'il n'a pas bougé, le lot n'est pas fini. Aucun écart nouveau nulle part. | Référentiel §6, `scripts/design-audit.mjs` |
| R8 | **Compte rendu en quatre temps**, sans jargon : ce que vous avez demandé, ce que j'ai trouvé, ce que ça donne, ce que je n'ai pas pu vérifier. Les chiffres restent, les noms de code partent. | Forme validée CEO 2026-09-07 |
| R9 | **Un décrochage déclenche un appel, pas un chantier.** Si un écran est simplifié et que personne ne l'ouvre, on appelle Me Derisier avant d'en ouvrir un autre. | `REGLE_DE_BUILD.md` §5 |

---

## 2. Le périmètre, mesuré dans le code le 2026-09-12

**39 écrans** répartis en huit zones. Les chiffres viennent de deux mesures
reproductibles :

- **Lignes** : `wc -l` des fichiers du dossier de la route (page, vue, actions),
  sans les composants partagés. C'est un indice de complexité, pas une note.
- **Écarts** : `node scripts/design-audit.mjs --json`, clé `perRoute`. Compte les
  écarts au référentiel sur le code **réellement monté** par la route, composants
  compris. Total produit ce jour : **1 083 écarts sur 182 fichiers**.

Le périmètre porte **549 écarts, soit 51 % de la dette visuelle du produit**, sur
39 des 90 écrans.

**Porte** dit par où une personne du cabinet arrive sur l'écran : `menu` (barre du
haut, `Header.tsx`), `lien` (depuis un autre écran), `aucune` (route servie, plus
annoncée).

### Facturation (14 écrans, 121 écarts)

| Route | Porte | Lignes | Écarts | Note |
|---|---|---:|---:|---|
| `/facturation` | menu Finances | 377 | 20 | Registre des factures. **En cours** (§5) |
| `/facturation/nouvelle` | lien | 2 385 | 3 | Le plus gros écran du périmètre. Deux commits le 2026-09-12 |
| `/facturation/factures/[id]` | lien | 346 | 6 | Détail d'une facture |
| `/facturation/paiements` | lien | 588 | 29 | Encaissements, 20 contrôles interactifs |
| `/facturation/honoraires/[clientId]` | lien | 704 | 13 | Honoraires d'un client |
| `/facturation/honoraires` | aucune | 517 | 0 | Redirection ; sa vue est intégrée dans `/facturation` |
| `/facturation/suivi` | lien | 314 | 13 | Suivi des envois |
| `/facturation/frais` | lien | 181 | 6 | Frais et débours |
| `/facturation/creances-aging` | lien | 98 | 9 | Créances par ancienneté |
| `/facturation/temps-non-facture` | lien | 143 | 6 | Temps non facturé |
| `/facturation/rentabilite` | lien | 96 | 7 | Rapport, seule porte : la rangée de liens de `/facturation` |
| `/facturation/taxes` | lien | 114 | 4 | TPS/TVQ, seule porte : idem |
| `/facturation/notes-de-credit` | lien | 130 | 3 | Notes de crédit |
| `/facturation/verification` | lien | 85 | 2 | Vérification avant envoi |

### Comptabilité (3 écrans, 129 écarts)

| Route | Porte | Lignes | Écarts | Note |
|---|---|---:|---:|---|
| `/comptabilite` | menu Finances | 593 | 73 | Lot livré le 2026-09-09 (`bc30dc3`), **73 écarts restent** : le plus chargé du périmètre |
| `/journal/general` | lien (mode expert) | 1 402 | 21 | Journal général |
| `/journal/depenses` | lien (mode expert) | 910 | 35 | Journal des dépenses |

### Fidéicommis (3 écrans, 81 écarts)

| Route | Porte | Lignes | Écarts | Note |
|---|---|---:|---:|---|
| `/comptes` | menu Finances | 110 | 39 | 39 écarts sur 110 lignes : la **densité d'écarts la plus haute du produit** |
| `/comptes/rapports` | lien | 40 | 38 | Idem, 38 écarts sur 40 lignes |
| `/comptes/rapprochement` | lien | 112 | 4 | Rapprochement mensuel |

### Temps et paye (2 écrans, 59 écarts)

| Route | Porte | Lignes | Écarts | Note |
|---|---|---:|---:|---|
| `/temps` | menu Finances (« Temps » ou « Forfaits ») | 935 | 43 | Registre des entrées de temps. Touché le 2026-09-12 (`bcb8a11`, taux horaire) |
| `/mes-heures` | menu Cabinet (« Ma paye ») | 278 | 16 | Heures soumises et paye |

### Équipe (4 écrans, 44 écarts)

| Route | Porte | Lignes | Écarts | Note |
|---|---|---:|---:|---|
| `/employees` | menu Cabinet | 791 | 9 | Registre unifié depuis le 2026-08-11 |
| `/employees/[employee-id]` | lien | 181 | 23 | Fiche d'une personne. Touchée le 2026-09-12 (deux taux) |
| `/employees/nouveau` | lien | 60 | 6 | Création |
| `/employees/year-end` | lien | 53 | 6 | Fin d'année |

### Paramètres (11 écrans, 81 écarts)

| Route | Porte | Lignes | Écarts | Note |
|---|---|---:|---:|---|
| `/parametres` | menu (engrenage) | 539 | 13 | Carrefour vers 8 sous-écrans |
| `/parametres/facture` | lien | 765 | 19 | Apparence de la facture |
| `/parametres/cabinet` | lien | 401 | 6 | Profil du cabinet, taux horaire par défaut ajouté le 2026-09-12 |
| `/parametres/envoi-facture` | lien | 309 | 8 | Gabarit d'envoi |
| `/parametres/conformite` | lien | 312 | 5 | Réglages de conformité |
| `/parametres/paiements` | lien | 137 | 8 | Moyens de paiement |
| `/parametres/payeurs-tiers` | lien | 57 | 8 | Payeurs tiers |
| `/parametres/abonnement` | lien | 57 | 7 | Abonnement |
| `/parametres/audit` | lien | 71 | 3 | Journal d'audit |
| `/parametres/retention` | lien | 97 | 4 | Conservation |
| `/parametres/equipe` | aucune | 13 | 0 | Redirection morte vers `/employees` |

### Rapports et import (2 écrans, 34 écarts)

| Route | Porte | Lignes | Écarts | Note |
|---|---|---:|---:|---|
| `/rapports` | menu Outils | 107 | 17 | Rapports du cabinet |
| `/import` | menu Outils | 816 | 17 | Import de données |

**Hors périmètre, exprès** : `/inspection/*` (13 écrans, cartables réglementaires,
chantier séparé), `/conformite`, `/securite` (dont le sort dépend d'Aujourd'hui, voir
`VOCABULAIRE_SAFE.md` §7), la console SAFE Inc.

---

## 3. L'ordre, et comment il a été décidé

Cinq critères de 1 à 5, ceux de `CO-DIRECTION.md` §5, avec une lecture propre au
chantier :

| Critère | Ce qu'on regarde ici |
|---|---|
| Impact | L'écran tient-il un des trois registres d'ancrage (fidéicommis, délais, heures à facturer) ? |
| Urgence | Est-ce que Me Derisier ou un cabinet en démonstration l'ouvre la première semaine ? |
| Levier | Sa grammaire (registre, en-tête, action pleine) se recopie-t-elle sur d'autres écrans ? |
| Finissabilité | Taille et écarts : peut-on le fermer en un bloc de construction de 7 h ? |
| Alignement | Passe-t-il le §4 de la règle de build sans forcer ? |

La file qui en sort. **On ne prend que la ligne du haut.** Le reste est la file
d'attente, pas un plan.

| Rang | Écran | Pourquoi maintenant | Pourquoi pas plus haut |
|---|---|---|---|
| 1 | `/facturation` | Déjà ouvert, quatre consignes CEO du 2026-09-10 appliquées, non commité. On ferme. | |
| 2 | `/facturation/paiements` | L'argent qui entre. 29 écarts, 20 contrôles interactifs sur un seul écran : c'est là que le geste « encaisser » se perd. Sert le registre fidéicommis. | Attend la fermeture du rang 1 (R1) |
| 3 | `/comptes` et `/comptes/rapports` | Le registre d'ancrage numéro un. 77 écarts sur 150 lignes : petit, dense, finissable en un bloc. | Deux écrans, mais un seul objet |
| 4 | `/temps` | Le registre des heures oubliées. 43 écarts, 935 lignes. Vient d'être touché pour le taux : la dette se résorbe quand on touche l'écran pour une autre raison. | Gros, un bloc entier |
| 5 | `/comptabilite` | 73 écarts restent après le lot du 2026-09-09. À finir, pas à rouvrir. | Le lot fonctionnel est fait ; ce qui reste est visuel |
| 6 | `/journal/depenses` | Dans la demande initiale du CEO (« dépenses »). 35 écarts. Précède l'idée du journal des débours mise en file le 2026-09-10. | Mode expert, ouvert moins souvent |
| 7 | `/facturation/nouvelle` | 2 385 lignes, le plus gros écran. Deux lots livrés le 2026-09-12. Le simplifier vraiment, c'est réduire les étapes, pas le décor. | Demande une séance d'observation avant (R9) |
| 8 | `/employees/[employee-id]`, `/parametres/facture`, `/rapports`, `/import`, `/mes-heures` | Entre 16 et 23 écarts chacun. | Aucun ne tient un registre d'ancrage |
| 9 | Le reste des Paramètres, `/journal/general`, sous-écrans de facturation sous 10 écarts | | Dette faible, usage rare |

Deux redirections mortes (`/facturation/honoraires`, `/parametres/equipe`) ne comptent
pas : elles n'ont plus de lien et servent les anciens signets.

---

## 4. La fiche d'audit d'un écran

Chaque écran ouvert reçoit une fiche, remplie **dans cet ordre**, et copiée dans son
entrée de journal. Une fiche sans « mesures avant » n'est pas auditable.

```
## Écran : <route>                              Ouvert le : AAAA-MM-JJ

### Mesures avant
- Écarts (design-audit, perRoute) : N
- Lignes du dossier de route : N
- Contrôles interactifs (boutons, liens, champs) visibles sans défiler : N
- Actions pleines (boutons pleins) : N          → doit finir à 1
- Geste principal, en une phrase : « ... »
- Clics pour accomplir le geste principal depuis le menu : N
- Saisies faites à la main aujourd'hui sur cet écran : liste

### Consignes CEO, datées, mot pour mot
- AAAA-MM-JJ · « ... »

### Proposition
- Ce qui change (trois lignes maximum)
- Ce qui ne change pas, exprès
- Image : chemin du PNG montré        Validation : AAAA-MM-JJ « oui »

### Livraison
- Commit : <hash> <titre>
- Capture après : chemin du PNG
- Journal : docs/journal/AAAA-MM-JJ_<slug>.md

### Mesures après
- Écarts : N → N            (doit baisser, R7)
- Actions pleines : N → 1
- Clics pour le geste principal : N → N
- Saisies supprimées : liste
- Typecheck, tests, parité FR/EN : vert / vert / vert
```

Ce qui est vérifié à chaque livraison, sans exception :

```bash
npx tsc --noEmit
npx vitest run
npm run i18n:keys
node scripts/design-audit.mjs --json   # comparer perRoute avant / après
```

La capture se fait sur la route jetable `/ds-preview/<écran>` quand elle existe
(`/ds-preview/facturation` et `/ds-preview/temps` existent déjà), sur des données
limites, jamais sur la base de production.

---

## 5. Registre de suivi

Une ligne par écran ouvert. **C'est ce tableau qui dit où en est le chantier.**

| Écran | Ouvert | Consignes CEO | Image validée | Livré | Écarts avant → après | Journal |
|---|---|---|---|---|---|---|
| Navigation (vocabulaire, portes) | 2026-09-09 | « un mot par chose », « ferme les portes en trop » | sans objet (libellés) | `1f6ec94` | sans objet | `VOCABULAIRE_SAFE.md` §6-7 |
| `/comptabilite` | 2026-09-09 | « cesse de mélanger les livres et de faire deviner » | à retrouver | `bc30dc3` | ? → 73 | **manquant** |
| `/facturation/nouvelle` (document) | 2026-09-12 | tailles de police du gabarit (2026-09-10) | à retrouver | `e24316e`, `3210cde` | ? → 3 | **manquant** |
| `/temps`, `/employees/[id]`, `/parametres/cabinet` (taux horaire) | 2026-09-12 | taux qui partait à zéro | à retrouver | `bcb8a11` | ? → 43 / 23 / 6 | **manquant** |
| `/facturation` | 2026-09-10 | 4 consignes du 2026-09-10 : rangée de liens au lieu de cinq cartes ; « Honoraires à facturer » ouvre la page ; colonne « envoyée le » ; filtres masqués quand intégré | pas d'image (lot antérieur au cadre, exception unique) | `ab5d88f` 2026-09-12 | 20 → 20 (lot structurel, exception à R7 consignée) · 5 cartes → 1 ligne | `2026-09-12_facturation_registre_simplifie.md` + capture |

Les cases « manquant » sont une dette de traçabilité : quatre lots ont été livrés du
2026-09-09 au 2026-09-12 sans entrée de journal ni mesure avant. Ce n'est pas
rattrapable pour les mesures avant (le code a changé), ça l'est pour le journal.
**Règle à partir d'aujourd'hui : pas de commit d'écran sans sa ligne ici.**

---

## 6. État des chantiers ouverts au 2026-09-12, 18 h 50

**Lot A fermé** : commit `ab5d88f`, capture, journal, ligne au §5. Le texte ci-dessous
est l'état relevé à 18 h 45, gardé pour mémoire ; seul le lot B reste ouvert.

**Activité concurrente encore observée à 18 h 48**, après que le CEO a dit l'autre
session fermée : `lib/expense-journal/etat-depense.ts` et son test sont apparus,
`CreateInvoiceView.tsx` a reçu un commentaire de quatre lignes, `AppChrome.tsx` a
bougé. Quelqu'un écrit encore. Cette session s'en tient aux documents jusqu'à ce que
ce soit tranché.

### État relevé à 18 h 45

Vérifié sur le dépôt : typecheck vert, 61 tests des lots en cours verts.

**Attention, deux sessions Claude travaillent en même temps dans ce dépôt.** Un
commit est apparu à 18 h 41 (`bcb8a11`, taux horaire) pendant la rédaction de ce
document, et vingt fichiers de temps et d'équipe ont été modifiés dans le quart d'heure
précédent. Ce document n'a touché à aucun fichier de code pour cette raison. Tant que
les deux sessions sont ouvertes, une seule doit écrire dans `app/`, `components/` et
`lib/`.

Deux lots non commités, à commiter séparément parce qu'ils ne parlent pas du même
sujet :

**Lot A, écran `/facturation`** (rang 1 de la file) :
`app/(app)/facturation/page.tsx`, `app/(app)/facturation/honoraires/HonorairesAFacturerView.tsx`,
`components/facturation/FacturationTable.tsx`, `app/ds-preview/facturation/donnees.ts`.
Il manque la capture sur `/ds-preview/facturation` et l'entrée de journal.

**Lot B, demandes du site, lot 2** (chantier séparé, voir mémoire du 2026-09-04) :
`app/(app)/layout.tsx`, `components/layout/AppChrome.tsx`, `app/api/contact/route.ts`,
`prisma/schema.prisma`, `app/(app)/console/demandes/`, `lib/services/demandes/`,
`lib/crm/lead-from-demande.ts`, deux migrations du 2026-09-04, et leurs tests.
Le diff du schéma Prisma fait 658 lignes mais **72 seulement sont réelles** (enum
`SITE_WEB`, modèle `DemandeSite`) ; le reste est un réalignement d'espaces.

---

## 7. La prochaine action

Fermer le rang 1. Trois gestes, dans l'ordre, dans la session qui tient le code :

1. Rendre `/ds-preview/facturation` et enregistrer la capture.
2. Commiter le lot A seul, avec les quatre consignes du 2026-09-10 dans le message.
3. Écrire `docs/journal/2026-09-12_facturation_registre_simplifie.md` avec la fiche
   du §4 et remplir la ligne du §5.

Puis, et seulement puis : ouvrir `/facturation/paiements` par ses mesures avant et
une image, et attendre le oui.

---

## Journal du document

- 2026-09-12, 18 h 50 : `/facturation` fermé (`ab5d88f`), première ligne complète du registre.
  Exception à R7 consignée : écarts 20 → 20 sur un lot structurel. Activité concurrente
  encore vue à 18 h 48.
- 2026-09-12 : ouverture. Inventaire de 39 écrans mesuré, file établie, fiche d'audit
  définie, quatre lots livrés sans journal recensés.
