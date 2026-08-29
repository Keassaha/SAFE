# Refonte de l'organisation du dossier

> **Statut** : décisions prises, chantier en cours.
>
> | Chantier | État |
> |---|---|
> | Disposition en cinq onglets, patron de la fiche client | ✅ codé, non vérifié à l'écran |
> | Cartable ouvert directement dans son onglet | ✅ codé, non vérifié à l'écran |
> | Fusion des blocs d'action | ✅ codé, non vérifié à l'écran |
> | Résumé d'ouverture en tête de la vue d'ensemble | ✅ codé, non vérifié à l'écran |
> | Intitulé obligatoire | ✅ codé |
> | Résumé IA en action d'en-tête | ✅ codé |
>
> **Les six chantiers sont codés.** Reste la vérification à l'écran, puis la
> section 2 de la vitrine, qui attend cette refonte pour être illustrée.
>
> ⚠ Les deux chantiers codés n'ont **pas** été vus à l'écran : l'écran dossier
> exige une session, et l'agent ne saisit pas de mot de passe. Vérification
> visuelle à faire par le CEO.
> **Ouvert le** : 2026-08-27
> **Demandé par** : CEO, après constat que l'illustration de la section 2 de la
> vitrine ne correspondait à rien de réel.
> **Portée** : l'écran `app/(app)/dossiers/[id]/page.tsx`, puis la section 2 de
> la page d'accueil qui doit le refléter.

---

## 0. Pourquoi ce document existe

Le 2026-08-27, la section 2 de la vitrine a été construite sur une illustration
**inventée** : trois colonnes « Parties, Étapes attendues, Échéances » qui
n'existent dans aucun écran du produit. Le CEO l'a constaté sur captures.

La règle qui en sort, et qui vaut pour toute la vitrine :

> L'illustration ne précède jamais l'écran. Si l'écran doit changer, il change
> d'abord, et la vitrine le recopie ensuite.

C'est la raison pour laquelle la section 2 est **suspendue** tant que cette
refonte n'est pas tranchée. La finir maintenant obligerait à la refaire.

---

## 1. Ce que l'écran est aujourd'hui

Relevé dans `app/(app)/dossiers/[id]/page.tsx` le 2026-08-27, plus six captures
fournies par le CEO. Neuf blocs, **tous empilés sur une seule colonne**, dans
cet ordre :

| # | Bloc | Ligne | Condition d'affichage |
|---|---|---|---|
| 1 | En-tête collé (retour, client, titre, pastilles, 3 boutons) | 268 | toujours |
| 2 | Personnes du dossier | 334 | s'il y a des parties |
| 3 | Où j'en étais ? | 378 | s'il y a un résumé |
| 4 | Résumé IA | 391 | **masqué sans `ANTHROPIC_API_KEY`** |
| 5 | État de préparation | 402 | s'il y a un statut |
| 6 | Navette, fil interne | 413 | toujours |
| 7 | Documents rédigés | 424 | toujours |
| 8 | Pièces attendues | 490 | conditionnel |
| 9 | Cartables | 535 | toujours |

Le cartable, qui **est** la structure du dossier, arrive en neuvième position.

---

## 2. Les six problèmes de lecture

Chacun est constaté sur les captures ou dans le code, pas supposé.

### P1 — La structure du dossier arrive en dernier

Le cartable est l'argument central du produit : un dossier de divorce n'ouvre
pas les mêmes sections qu'une vente immobilière. Il faut défiler huit blocs
pour l'atteindre. Sur la capture 6, il occupe enfin l'écran, mais on y est
arrivé après quatre défilements.

### P2 — Deux blocs donnent la même réponse

Sur la capture 2, « Où j'en étais ? » affiche :

> Prochaine action : Créer le mandat du dossier

Sur la capture 3, « État de préparation » affiche :

> Prochaine action : Créer le mandat du dossier →

La même phrase, deux fois, séparée par un bloc. Le lecteur ne sait pas lequel
fait autorité, et le second bouton dédouble le premier.

### P3 — « Pièces attendues » demande avant de servir

L'ordre à l'écran, captures 4 et 5 :

1. « 5 dates à saisir pour que les échéances se calculent »
2. cinq champs de date **vides**
3. puis seulement : « SAFE peut créer la liste réglementaire du divorce au
   Québec, avec les articles qui la commandent, puis vous l'ajustez » +
   bouton **Créer la liste**

Le bloc réclame donc cinq saisies avant de rendre quoi que ce soit, alors que
la fonction qui fait le travail est en dessous, hors du champ de vision.
L'ordre est à inverser.

### P4 — Le domaine de pratique ne se voit jamais

Neuf domaines sont codés dans `lib/dossiers/cartable-templates/index.ts` :
droit de la famille, protection de la jeunesse, litige civil, criminel,
immigration, immobilier, corporatif, droit du travail, autre. Chaque section y
porte sa **source réglementaire** (« Pièces Madame (P-) » cite *Règl. Cour Qc
art. 13*, « Mandat et engagement » cite *RCNEPA art. 15-16 · Code déonto. art.
3.08*).

Rien de tout cela n'apparaît à l'écran. Le domaine ne se devine qu'en lisant
les noms de sections du cartable, tout en bas.

### P5 — Un dossier neuf montre surtout du vide

Sur les captures 3, 4 et 5, trois blocs sur les six visibles disent qu'ils sont
vides : « Aucun message sur ce dossier », « Aucun document rédigé pour ce
dossier », « Aucune pièce attendue sur ce dossier ». Un dossier qui vient de
s'ouvrir se présente donc par ce qu'il n'a pas.

### P6 — Le titre ne nomme pas le dossier

Le h1 affiche « 2026-050 — Dossier ». Le mot « Dossier » est un remplissage :
le dossier n'a pas d'intitulé. Or le registre, lui, en affiche de vrais —
« Beaulieu — achat immeuble commercial », « Tremblay c. Commission — révision ».

---

## 3. L'organisation proposée

Principe : **trois zones**, du plus décisif au plus documentaire, et le domaine
de pratique visible dès l'en-tête.

### ⚠ La disposition retenue : celle de la fiche CLIENT

Demande CEO du 2026-08-27, après avoir vu les trois zones proposées ci-dessous :
« je voulais que la disposition soit la même, juste avec les détails d'un
dossier ».

La fiche client (`app/(app)/clients/[id]/page.tsx`) monte : un en-tête avec
retour, titre et rangée d'actions, puis **UNE grande carte à onglets**
(Vue d'ensemble · Dossiers (3) · Carte client (12)), chaque onglet portant son
compteur.

Le dossier reprend ce patron avec **cinq** onglets, dans l'ordre dicté :

| Onglet | Contenu |
|---|---|
| **Vue d'ensemble** | **Le résumé d'ouverture**, l'état du dossier, les personnes, le résumé IA |
| **Cartable (N)** | Les sections du domaine, **ouvertes directement** |
| **Pièces attendues (N)** | Ce qu'on attend du client, et les délais qui le commandent |
| **Communications** | La navette, fil interne adjointe ↔ avocate |
| **Documents (N)** | Ce qui sort de l'éditeur SAFE |

Trois précisions du CEO, 2026-08-27 :

1. **Le cartable s'ouvre directement.** Il a d'abord été posé en carte fermée
   qu'il fallait cliquer ; c'était un geste de plus pour atteindre ce que
   l'onglet annonce déjà. `DossierBriefcase` reçoit désormais une hauteur par
   `hauteurClassName`, sinon son `h-screen` d'origine déborde de la carte.
2. **Les pièces attendues sortent du cartable.** Ce qu'on ATTEND du client ne se
   lit pas au milieu de ce qu'on a déjà classé.
3. **La vue d'ensemble s'ouvre par un résumé du dossier.** La fiche n'affichait
   NULLE PART ce qu'est le dossier : ni son domaine de pratique, ni sa date
   d'ouverture, ni son tribunal. Il fallait ouvrir le formulaire d'édition pour
   le savoir. Le domaine de pratique ouvre ce résumé, ce qui résout **P4**.

Le cartable passe donc de la **neuvième** place à la **deuxième**, ce qui résout
enfin P1. Les trois zones décrites plus bas restent la logique sous-jacente,
mais elles se lisent désormais en onglets et non en empilement.

**Piège à ne pas recréer** : « Correspondance » est une SECTION du cartable,
la « Navette » est un onglet. Ce n'est pas un doublon — l'une classe les lettres
échangées avec l'extérieur, l'autre porte la conversation interne vivante — mais
les deux se ressemblent de loin et l'interface doit marquer la différence.

### Zone 1 — Ce que je dois savoir maintenant

Un en-tête qui répond à « quel dossier, pour qui, où en est-il » sans défiler.

- l'intitulé réel du dossier, pas « — Dossier »
- une pastille de **domaine de pratique**, qui manque aujourd'hui
- les personnes, réduites à une ligne, dépliable
- **un seul** bloc d'action, qui fusionne « Où j'en étais ? » et « État de
  préparation » (résout P2)

Le bloc fusionné porte : l'état (Incomplet / Prêt pour revue), la prochaine
action avec son bouton, et la liste des manquants avec leurs gravités.

### Zone 2 — La structure du dossier

Le cartable **remonte ici**, en deuxième position au lieu de neuvième (résout
P1). Il porte la preuve du domaine de pratique, avec la source réglementaire de
chaque section affichée (résout P4).

« Pièces attendues » vient s'y rattacher, et l'offre de génération passe
**avant** les champs à saisir (résout P3).

### Zone 3 — Le travail courant

Navette, documents rédigés, temps et débours. Ce sont des flux, pas de la
structure : ils vivent en dessous, et leurs états vides se réduisent à une
ligne discrète plutôt qu'à une carte pleine (atténue P5).

### Décisions du CEO, 2026-08-27

Les trois questions sont tranchées.

| Question | Décision |
|---|---|
| Cartable | **Un dossier qu'on ouvre**, en plein écran |
| Intitulé | **Obligatoire** |
| Résumé IA | **Action d'en-tête**, plus un bloc |

#### Le cartable : colonne latérale essayée, puis écartée

La première décision était « colonne latérale permanente ». Elle a été **retirée
le jour même** par le CEO : « il prête confusion ».

Le diagnostic est juste, et il valait la peine d'être fait en le voyant plutôt
qu'en le supposant. Deux colonnes de navigation cohabitaient sur le même écran,
le menu du produit en haut et le cartable à gauche, et rien ne disait laquelle
commandait quoi. Un cartable n'est pas un menu de site : c'est la structure d'UN
dossier, celui qui est ouvert.

**Le geste retenu : un dossier qu'on ouvre.**

- **Fermé**, il tient dans une carte de la fiche, à la place où il s'empilait
  avant. Il montre ses sections **et leurs sources réglementaires**, ce qui rend
  enfin visible l'argument du produit : la structure n'est pas arbitraire, elle
  découle du domaine de pratique.
- **Ouvert**, il prend tout l'écran, sections à gauche et document à droite,
  avec un retour explicite au dossier.

L'adresse ne change pas : ouvrir un cartable n'est pas changer de lieu, c'est
changer de focale sur le même dossier. Le CEO a écarté « une page à part
entière » pour cette raison.

#### Ce que « intitulé obligatoire » implique — ATTENTION

Le champ est **déjà obligatoire** dans `prisma/schema.prisma` : `intitule String`,
sans point d'interrogation. Le problème n'est donc pas l'obligation, c'est que
le code fabrique lui-même la valeur vide.

Deux endroits, dans `app/(app)/dossiers/actions.ts` :

    ligne  86 : const intitule = sanitizeInput(parsed.data.intitule?.trim() || "Dossier");
    ligne 280 : const intitule = parsed.data.intitule?.trim() || current?.intitule || "Dossier";

Et la validation contredit le schéma, dans `lib/validations/dossier.ts:33` :

    intitule: z.string().optional().nullable().transform(...)

Fait le 2026-08-27 :

1. ✅ `intitule` requis dans le schéma Zod, entre 3 et 200 caractères. Trois au
   minimum parce que « M. » ou « c. » ne sont pas des intitulés, et parce qu'un
   espace seul passait la validation précédente ;
2. ✅ les deux replis `|| "Dossier"` retirés. Celui de la modification perdait
   aussi son repli sur `current?.intitule` : un champ vidé par mégarde
   conservait silencieusement l'ancienne valeur au lieu d'alerter ;
3. ✅ `minLength` et `maxLength` posés sur le formulaire, pour que l'erreur
   arrive avant l'envoi et non après.

Aucune migration de base n'était nécessaire : la colonne était déjà `NOT NULL`.

#### Les dossiers déjà nommés « Dossier »

Comptés en base locale le 2026-08-27 : **1 sur 51**, le dossier `2026-050`
(client Nadeau, droit de la famille) — celui-là même qui apparaît dans les
captures du CEO. Aucun intitulé vide ou réduit à un tiret.

Le choix retenu est de **ne pas les renommer par migration**. Un script qui
fabriquerait « Nadeau — droit de la famille » inventerait une donnée, ce que la
règle interne du 2026-08-14 interdit. Le dossier se renomme en dix secondes par
« Modifier le dossier ».

⚠ **À vérifier en production avant de conclure.** Le compte ci-dessus vaut pour
la base locale. Si la production en porte beaucoup, il faudra un écran qui les
liste et demande de les nommer, plutôt qu'un renommage silencieux.

#### Le résumé IA en action d'en-tête — fait le 2026-08-27

Le bouton « Résumé IA » rejoint la rangée d'actions, à côté de « Voir le
client ». Son résultat s'ouvre dans une fenêtre (`components/ui/Modal`).

**Pourquoi une fenêtre et non un dépliage** : le résumé compte sept sections
dont des listes. Déplié sous l'en-tête, il repousserait la fiche vers le bas à
chaque génération, c'est-à-dire qu'il redeviendrait le bloc qu'on retire.

**Le garde-fou ne bouge pas.** Le bouton reste entièrement masqué sans
`ANTHROPIC_API_KEY`, clé absente de Vercel à ce jour, et le test reste dans la
page, seule à lire l'environnement côté serveur.

⚠ **Piège rencontré** : `DossierResumeIA` est AUSSI monté par
`app/(app-v2)/.../OverviewTab.tsx`. Retirer son titre l'aurait laissé anonyme
là-bas, la v2 l'enveloppant dans un conteneur neutre. Le titre est donc devenu
optionnel (`avecTitre`, vrai par défaut) et non supprimé.

---

## 4. Conséquence sur la section 2 de la vitrine

La section 2 s'appelle « Le dossier administratif ». Son titre validé est
« Chaque dossier s'ouvre avec la bonne structure. » et sa phrase de conclusion
« L'équipe voit ce qui a été fait, ce qui manque et ce qui doit suivre. »

La zone 1 et la zone 2 de la refonte prouvent **exactement** ces deux phrases :

- « la bonne structure » → le cartable et ses sources réglementaires, zone 2
- « ce qui a été fait, ce qui manque, ce qui doit suivre » → le bloc d'action
  fusionné et ses manquants gravés, zone 1

L'illustration de la vitrine devra donc montrer ces deux zones, et rien
d'autre. Pas de montants : le brief interdit de mettre la facturation au
premier plan dans ce mouvement.

**Aucune ligne de la vitrine ne doit être écrite avant que la refonte soit
appliquée à l'écran réel.**

---

## 5. Historique de la séance du 2026-08-27

À conserver : ce travail a traversé plusieurs changements de contexte.

### Section 1 de la vitrine, terminée

| Élément | Valeur retenue | Source |
|---|---|---|
| Exergue | 16 px, minuscules, gris | mesure de cursor.com/product |
| Titre | 36 px, graisse 400, noir `rgb(38,37,30)` | mesure de leur DOM |
| Sous-titre | 21 px, gris, **colonne de droite** | maquette validée du CEO |
| Alignement | lignes de base, écart 0 | demande CEO |
| Suivi | -0,030 em effectifs | plus serré que Cursor, demande CEO |
| Gras | **aucun**, logo compris | demande CEO |

### La fonte a changé le même jour

`scripts/forger-safe-grotesk.mjs` part désormais de `Geist-Variable.ttf` et
prélève à **wght 433**, et non des coupes statiques. Motif : le fût de
CursorGothic vaut 96,3 millièmes d'em, celui de Geist 400 en vaut 88,8 et
Geist 500 en vaut 111,3. Aucun cran ne convenait.

Ajout de `LARGEUR: 1,04` pour arrondir les panses au rapport de CursorGothic.

⚠ **Piège** : le resserrement de 9 unités par côté vit DANS le fichier de
fonte, soit 0,018 em. Tout `letter-spacing` de feuille s'y **ajoute**.

### Ce qui reste ouvert sur la vitrine

- Les **811 px** demandés par le CEO n'ont plus de cible depuis que le
  sous-titre est reparti en colonne de droite.
- La **barre de navigation** du site ne correspond pas à la maquette, qui
  demande « Outils SAFE » et « Ressources ».
- L'échelle typographique compte huit crans quand Cursor en tient six.
  ⚠ `--t-marque` (22 px) sert les **titres de section** et `--t-titre` (40 px)
  un sous-titre : les noms disent le contraire des rôles.
- **Rien n'est commité**, sur la branche `feat/encaissement-interac`, dont le
  nom ne dit plus ce qu'elle contient.
