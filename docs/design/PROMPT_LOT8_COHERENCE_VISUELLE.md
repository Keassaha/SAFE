# Lot 8 — Cohérence visuelle et apaisement de l'interface

> Prompt d'exécution. Écrit à partir de six observations du CEO sur l'interface
> réelle, le 6 août 2026, captures à l'appui.
>
> **Règle de tout le lot :** aucune règle métier, aucun calcul comptable, aucune
> obligation réglementaire n'est modifiée. Seule change la manière dont
> l'information se présente.

---

## Contexte

SAFE est un outil de travail juridique, utilisé plusieurs fois par jour. Ce lot
corrige six défauts qui, ensemble, donnent à l'application un air plus agité et
moins fini qu'elle ne l'est réellement.

Référentiels opposables, à lire avant de coder :

- `docs/design/SAFE_PREMIUM_DESIGN_STANDARD.md`
- `docs/design/DESIGN_HUMAIN.md`, §0 et §10 en priorité
- `docs/design/SYSTEME_DE_PROFONDEUR_TROIS_PLANS.md`

---

## Point 1 — Les boutons empilent leur icône au-dessus de leur libellé

**Constat.** Sur `/facturation`, les boutons « Outils » et « Facturer »
affichent l'icône sur une ligne, le libellé sur la ligne suivante, le chevron
sur une troisième. Le bouton devient haut, étroit et illisible.

**Cause.** `components/ui/Button.tsx` enveloppe **tous** ses enfants dans un
`<span>` unique. La normalisation de Tailwind pose `svg { display: block }` :
à l'intérieur de ce `span`, chaque icône occupe donc sa propre ligne. Le
`gap-2` et le `items-center` du bouton ne s'appliquent plus, puisqu'il ne reste
qu'un seul enfant de flexbox.

**Correction attendue.**

- N'envelopper dans un `<span>` que le libellé de chargement.
- Hors chargement, rendre `children` directement, pour que l'icône et le
  libellé redeviennent deux enfants de flexbox alignés par `items-center`.
- Vérifier les 34 boutons du dépôt qui passent une icône suivie d'un libellé.

**Terminé quand.** Aucun bouton de l'application n'empile son icône, et un test
de rendu interdit le retour de l'enveloppe unique.

---

## Point 2 — Les chiffres ne se ressemblent pas d'une page à l'autre

**Constat.** Les montants, compteurs et pourcentages changent de graisse, de
taille, d'alignement et de police selon l'écran. Sur `/facturation`, la ligne
d'indicateurs mélange un grand nombre, un montant à droite et un libellé, sans
grille commune.

**Correction attendue.**

- Une seule primitive porte tout chiffre affiché comme donnée : montant,
  compteur, durée, pourcentage.
- Chiffres en mono tabulaire, pour que les colonnes s'alignent verticalement.
- Montants alignés à droite, libellés à gauche.
- Trois tailles seulement : valeur principale, valeur secondaire, mention.
- Zéro affiché en toutes lettres chiffrées, jamais un tiret.
- Valeur négative avec signe explicite.
- Format monétaire suivant la langue de la session, déjà en place.

**Terminé quand.** Les tuiles d'indicateurs de `/facturation`, `/temps`,
`/comptes/rapprochement` et `/conformite` partagent la même primitive et le même
rythme vertical.

---

## Point 3 — La bannière rouge dramatise en permanence

**Constat.** Une bannière rouge pleine largeur occupe le haut de chaque écran
dès qu'un rapprochement est en retard. Elle crie, elle ne se referme pas, et
elle relègue au second plan l'objectif de la page en cours.

**Décision.** Le produit ne doit pas vivre en état d'alerte permanent. Une
obligation réglementaire reste une obligation : elle ne disparaît pas, elle
cesse simplement d'occuper toute la largeur en rouge.

**Correction attendue.**

- Retirer la bannière pleine largeur du haut des écrans.
- Créer un **centre d'alertes** : un point d'entrée unique, discret, dans
  l'en-tête, qui porte le nombre d'obligations ouvertes.
- Ce centre liste toutes les alertes en un seul endroit, avec pour chacune son
  objet, sa gravité, sa date d'échéance et son action.
- Les alertes ne disparaissent pas tant que la cause subsiste. On ne les
  « ferme » pas, on les traite.
- La gravité se lit sur la pastille du centre, pas sur toute la page.
- La présentation reprend le calme de la page « Aujourd'hui » : une ligne par
  élément, un intitulé, une échéance, une action.

**Terminé quand.** Aucun écran ne porte plus de bandeau rouge permanent, et
l'obligation de rapprochement reste visible et atteignable en un geste depuis
l'en-tête.

---

## Point 4 — Deux pastilles flottantes se chevauchent

**Constat.** Sur la page « Aujourd'hui », le bouton « Mode focus » et le widget
« Aide » occupent le même coin inférieur droit et se recouvrent.

**Cause.** `components/today/FocusShell.tsx` se place en `bottom-6 right-6 z-50`,
`components/support/SupportWidget.tsx` en `bottom-5 right-5 z-40`.

**Correction attendue.**

- Les deux ne partagent plus le même point d'ancrage.
- Le widget d'aide garde le coin inférieur droit, il est global.
- Le mode focus, propre à une seule page, se décale au-dessus de lui, ou passe
  dans l'en-tête de la page.
- Sur petit écran, vérifier qu'aucune des deux ne masque une action.

**Terminé quand.** Les deux commandes sont visibles et cliquables ensemble, à
1440, 768 et 320 px.

---

## Point 5 — Étendre la matière vitrée, boutons compris

**Constat.** Le CEO souhaite davantage de matière vitrée, y compris sur les
boutons.

**Garde-fou.** Le système à trois plans reste opposable. Le verre exprime une
superposition réelle ; il n'est pas un habillage. Un bouton posé dans le flux
d'un formulaire n'est pas une surface flottante.

**Correction attendue.**

- Ajouter une variante de bouton `glass`, réservée aux boutons **posés sur une
  surface flottante ou sur une image** : barre collante, superposition,
  contrôles au-dessus d'un aperçu.
- Cette variante consomme les jetons du niveau `subtle`. Aucune valeur littérale.
- Elle porte le même contrat d'états que les autres variantes : repos, survol,
  focus, pressé, chargement, indisponible.
- Le repli opaque et le contraste s'appliquent comme aux autres surfaces vitrées.
- Le bouton d'action principale d'un écran de travail reste **plein et mat** :
  une décision ne se lit pas à travers une vitre.

**Terminé quand.** La variante existe, est présentée au spécimen `/ds-preview`,
et n'est employée que sur des surfaces réellement superposées.

---

## Point 6 — La page conformité paraît chargée

**Constat.** L'information y est dense au point de sembler compliquée.

**Correction attendue.**

- Une seule question en haut : le cabinet est-il en règle, oui ou non.
- Ensuite, ce qui demande une action, et rien d'autre.
- Le détail ne s'ouvre que si on le demande.
- Regrouper par obligation, jamais par source de données.
- Supprimer tout indicateur qui ne débouche sur aucune action.
- Aucune carte imbriquée, aucune grille de tuiles identiques.
- Les chiffres passent par la primitive du point 2.

**Terminé quand.** La première vue tient sans défilement à 1440 px et répond à
la question « qu'est-ce que je dois faire », pas « voici tout ce que je sais ».

---

## Contraintes communes

- Voix « vous », aucun tiret long en milieu de phrase, aucun emoji.
- Français et anglais tenus à parité.
- Aucune valeur de couleur, de rayon, d'ombre ou de flou en littéral.
- Focus visible, cibles tactiles de 44 px, mouvement réduit respecté.
- Aucun écran blanc, aucun état muet.

## Validation exigée

1. TypeScript sans erreur.
2. Tests du contrat design system et du pipeline d'import.
3. Parité des clés de traduction.
4. Audit design en baisse.
5. Build de production réussi.
6. Contrôle réel dans le navigateur à 1440, 768 et 320 px.
