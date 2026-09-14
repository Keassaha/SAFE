# 2026-09-13 → 09-14 — La Nouvelle facture : deux sections au lieu de quatre, et des réglages qui se règlent

Rang 7 de la file du cadre `docs/product/CHANTIER_SIMPLIFICATION_ADMIN_FINANCE.md`, pris
avant le rang 6 (`/journal/depenses`), qui reste le chantier actif de l'autre session.
Ouverte le 2026-09-13, validée et livrée le 2026-09-14. La fiche est complète.

**Une réserve, à dire avant le reste.** Le cadre note pour cet écran : « demande une
séance d'observation avant (R9) ». Cette séance n'a pas eu lieu. Les frictions relevées
ci-dessous se lisent dans le code, pas dans la main de quelqu'un qui facture. La
proposition s'en tient donc à ce qui est vérifiable sans observer : des blocs affichés
vides, des champs qui ne se règlent pas, et une grammaire de tableau qui diverge du
reste du produit. Elle ne touche pas au parcours lui-même.

## Écran : `/facturation/nouvelle`                          Ouvert le : 2026-09-13

### Mesures avant
- Écarts (design-audit, perRoute) : **3**. C'est le plus bas du périmètre. Cet écran
  n'a pas de dette visuelle : le travail ici n'est pas le décor.
- Lignes : vue 2 073, page 348, chargement 31. **2 452 au total, le plus gros écran du
  périmètre.** La page exécute onze requêtes en parallèle pour le monter.
- **Quatre sections empilées, toujours affichées** : Pour qui, Honoraires
  professionnels, Débours et frais, Ajustements. Sur une facture d'honoraires
  ordinaire, **deux de ces quatre sections sont vides** : elles n'affichent que leur
  titre, leur filet noir, leur sous-total à 0,00 $ et leurs boutons d'ajout.
- **Quatre filets noirs** descendent la page, un sous chaque titre de section
  (`border-si-ink`). Le reste du produit emploie un filet fin.
- **Cinq boutons d'ajout** répartis sur trois sections : Ajouter une prestation,
  Reprendre le temps non facturé, Ajouter un débours, Ajouter des frais, Ajouter un
  rabais.
- **Deux boutons pour un même tableau.** Vérifié dans le code : `addDebours` et
  `addFrais` créent tous deux une ligne que `estDebours` range dans le même tableau.
  Ils ne diffèrent que par trois valeurs par défaut (description, type, taxable), et la
  colonne « Taxable » de ce tableau est déjà là pour les distinguer.
- **Le panneau des réglages porte sept champs, dont trois ne se règlent pas** : la
  devise (verrouillée à CAD, `cursor-not-allowed`), le numéro de document (`readOnly`,
  « attribué automatiquement à la création »), et le bloc « Mes coordonnées », qui
  n'est qu'un affichage. Quatre champs se règlent vraiment : langue, type de document,
  date d'émission, date d'échéance.
- Les trois tableaux portent leurs propres classes d'en-tête : **10 px**, quand les
  registres du produit (factures, paiements, fidéicommis, temps, journaux) sont à
  12 px depuis hier.
- Actions pleines : 1 (« Créer la facture »). Déjà conforme.
- Geste principal : « reprendre le travail déjà noté, vérifier les montants, créer la
  facture ».
- Ce qui va bien, et qui ne bouge pas : le total suit dans la barre collante, le client
  et le dossier sont rappelés en permanence, l'aperçu prend tout l'écran (demande CEO
  du 2026-09-10), « Reprendre le temps non facturé » dit combien d'heures attendent, et
  le panneau « Ce que le client verra » montre l'assiette taxable, ce qui permet de
  refaire le calcul de la taxe.

### Consignes CEO, datées, mot pour mot
- 2026-09-13 · « ouvre la Nouvelle facture » (rang 7 de la file).
- Pour mémoire, celles déjà acquises sur cet écran : l'aperçu en pleine page
  (2026-09-10), la langue qui ne se demande plus avant le client (2026-09-12), le
  document qui ne mélange plus le travail et les sommes avancées (2026-09-12).

### Proposition
- Ce qui change :
  1. **Les sections vides ne s'affichent plus.** « Débours et frais » et
     « Ajustements » n'apparaissent que lorsqu'elles portent une ligne. Leurs trois
     actions deviennent une ligne discrète à droite, sous le tableau des honoraires :
     « Ajouter un débours · des frais · un rabais ». Un clic ouvre la section entière,
     avec son titre, son sous-total et son tableau, exactement comme aujourd'hui.
  2. **Le panneau des réglages perd les trois champs qui ne se règlent pas.** La devise
     et le numéro restent lisibles sur la ligne repliée, où on les lit déjà ; les
     coordonnées du cabinet sont sur l'aperçu. Sept champs deviennent quatre.
  3. **Une seule grammaire de colonnes** pour les trois tableaux : en-têtes à 12 px,
     même suivi, mêmes cellules que les registres du produit.
  4. **Les filets noirs des titres de section deviennent des filets fins.** Le titre
     reste en petites capitales, le sous-total reste à droite.
- Ce qui ne change pas, exprès : le parcours (choisir le client, reprendre le temps,
  vérifier, créer), la barre collante et ses trois boutons, l'aperçu en pleine page, le
  panneau des totaux et son calcul de taxe, les lignes éditables et leurs colonnes, la
  reprise du temps non facturé, les modes forfait et mixte, les données, l'API.
- Images :
  - avant, reconstitué depuis le code : `docs/journal/captures/2026-09-13_nouvelle-facture_avant_maquette.png`
  - proposition : `docs/journal/captures/2026-09-13_nouvelle-facture_proposition.png`
- Validation : **2026-09-14, « Oui, on met à exécution la Nouvelle facture »**, images
  acceptées telles quelles.

### Ce que ça donne, en cibles
| | Avant | Cible |
|---|---:|---:|
| Sections affichées sur une facture d'honoraires ordinaire | 4, dont 2 vides | 2 |
| Filets noirs en travers de la page | 4 | 0 |
| Champs dans le panneau des réglages | 7, dont 3 non réglables | 4 |
| Boutons d'ajout visibles d'emblée | 5 | 2, plus une ligne de trois liens |
| Taille des en-têtes de colonne | 10 px | 12 px, comme les registres |
| Écarts | 3 | 3 (rien à y gagner, ce n'est pas le sujet) |

## Ce que je n'ai pas pu vérifier
- L'écran réel avec une session ouverte ; la maquette « avant » est reconstituée depuis
  le code.
- **La séance d'observation du §10 de la règle de build n'a pas eu lieu.** Tant qu'elle
  n'a pas eu lieu, personne ne sait si le parcours lui-même gêne, ni où. Cette
  proposition ne prétend pas y répondre.
- Les modes forfait et mixte : la même vue sert les trois modes, avec un catalogue de
  forfaits en plus. Les sections repliées se comportent de la même façon, mais je ne
  l'ai pas rendu.

---

## Livraison — 2026-09-14

- Commit : voir `git log -1 -- app/ds-preview/nouvelle-facture/page.tsx`.
- Capture après : `docs/journal/captures/2026-09-14_nouvelle-facture_apres.png`, l'écran
  RÉEL rendu sur `/ds-preview/nouvelle-facture`.

### Ce qui a été construit

1. **Les sections vides ne s'affichent plus.** « Débours et frais » et « Ajustements »
   ne se rendent que si elles portent une ligne. Leurs trois actions vivent sous le
   tableau des honoraires, à droite : « Ajouter un débours · des frais · un rabais ».
   Aucun état de plus n'a été nécessaire : l'ajout crée la ligne, donc la section
   réapparaît d'elle-même, entière, avec son titre, son sous-total et ses propres
   boutons. La ligne discrète n'offre alors plus que ce qui reste replié.
2. **Le panneau des réglages tient en quatre champs.** Vérifié dans le navigateur après
   coup, en dépliant le panneau : `Langue`, `Type de document`, `Date d'émission`,
   `Date d'échéance`. La devise verrouillée, le numéro attribué automatiquement et le
   bloc « Mes coordonnées » n'y sont plus.
3. **Les trois tableaux passent à 12 px**, le suivi des registres du produit.
4. **Les filets noirs sous les titres de section deviennent des filets fins.**

### Une route de contrôle, enfin

`/ds-preview/nouvelle-facture` monte le composant réel sur des données fictives. C'était
le seul écran du périmètre sans route de contrôle : il fallait une session et onze
requêtes serveur pour le regarder. Il se regarde maintenant comme les autres.

### Mesures après

| | Avant | Après |
|---|---:|---:|
| Sections affichées sur une facture d'honoraires ordinaire | 4, dont 2 vides | **2** |
| Filets noirs en travers de la page | 4 | **0** |
| Champs dans le panneau des réglages | 7, dont 3 non réglables | **4** |
| Boutons d'ajout visibles d'emblée | 5 | **1**, plus une ligne de trois liens |
| Taille des en-têtes de colonne | 10 px | **12 px** |
| Écarts au standard | 3 | 3 |

Typecheck vert, 2 159 tests verts, parité FR/EN parfaite.

### Ce que je n'ai pas pu vérifier

- L'écran avec une session et de vraies données : la route de contrôle rend le composant,
  pas les onze requêtes qui l'alimentent.
- Les modes **forfait** et **mixte**. La même vue les sert, avec un catalogue de forfaits
  en plus ; les sections repliées s'y comportent de la même façon puisque la règle ne
  regarde que les lignes présentes. Non rendu.
- L'aperçu en pleine page, inchangé mais non recapturé.
