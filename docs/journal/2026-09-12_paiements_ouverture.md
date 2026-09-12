# 2026-09-12 — Les Paiements : un titre, un seul registre, et le lien du Suivi enfin honoré

Rang 2 de la file du cadre `docs/product/CHANTIER_SIMPLIFICATION_ADMIN_FINANCE.md`.
Ouvert, validé en image et livré le même jour. La fiche est complète.

## Écran : `/facturation/paiements`                    Ouvert le : 2026-09-12

Le même composant est aussi l'onglet « Paiements » de `/comptabilite`. Ce qui est
simplifié ici l'est donc aux deux endroits.

### Mesures avant
- Écarts (design-audit, perRoute) : **29**. Répartition : la fenêtre « Importer une
  preuve » 14 (six couleurs en dur, six rayons pleins, deux mouvements continus),
  formulaire de paiement 3, fenêtre d'allocation 3, la vue elle-même 2 (deux roues
  qui tournent), fenêtre de motif 1, et 6 dans des composants partagés (Card 2,
  StatusBadge 2, Button 1, Modal 1) qui ne se corrigent pas dans ce lot.
- Lignes du dossier de route : 588 (la vue 580, la page 8). Fenêtres montées :
  formulaire 469, import de preuve 378, allocation 202.
- **Pas de titre.** L'écran s'ouvre sur « Retour à la vue d'ensemble », puis une
  barre avec « Payeurs tiers » à gauche et deux boutons à droite. Rien ne dit où on
  est ni ce qu'on y fait.
- Blocs empilés avant le tableau : lien de retour, barre d'actions, bandeau ambre
  « Paiements non alloués », carte « Soldes créditeurs ». Le tableau arrive quatrième.
- Colonnes du tableau : 8. Quatre d'entre elles disent la même chose : Montant,
  Alloué, Non alloué, et le badge Statut (Alloué / Part. alloué / Non alloué). Le mode
  de paiement (Interac, chèque, virement), saisi dans le formulaire, n'est **pas**
  affiché.
- Contrôles interactifs sur une page de 20 lignes : jusqu'à **5 icônes muettes par
  ligne** (trombone, reçu, crayon, chaîne, retour), soit jusqu'à 100 dans le tableau,
  plus 6 hors tableau. Environ 106.
- Actions pleines : 1 (« Nouveau paiement »). Déjà conforme.
- Le tableau n'emploie pas la grammaire du registre (`components/ui/registre.tsx`) :
  en-têtes et rangées écrits en local, contrairement aux factures, clients, dossiers.
- Geste principal : « enregistrer un paiement reçu, et dire quelle facture il règle ».
- Clics depuis le menu : Finances › Comptabilité › onglet Paiements › Nouveau
  paiement, puis un formulaire de 8 champs (client, date, montant, mode, référence,
  note, facture, montant alloué). Depuis `/facturation`, **aucune porte** vers cet
  écran : la seule entrée est le tableau de bord (« Encaissé ce mois ») ou le Suivi.
- **Une saisie faite à la main qui ne devrait pas l'être** : depuis le Suivi des
  factures, le lien « Ajouter un paiement » passe le numéro de la facture dans
  l'adresse (`?invoiceId=`), et l'écran **l'ignore**. L'adjointe arrive sur la page
  générale et retape le client et la facture qu'elle vient de quitter. Vérifié :
  aucune lecture de ce paramètre dans la vue ni dans le formulaire.

### Consignes CEO, datées, mot pour mot
- 2026-09-12 · « ouvre les Paiements » (rang 2 de la file).
- 2026-09-12 · « Oui, on met à exécution », sur les deux images, sans modification.

### Proposition
- Ce qui change :
  1. Un titre, « Paiements », et sa phrase : « L'argent reçu, et la facture qu'il
     règle. » Les deux boutons montent dans l'en-tête, « Payeurs tiers » devient un
     lien discret à côté.
  2. Le tableau passe premier et prend la grammaire du registre. Sept colonnes au
     lieu de huit, et surtout une seule pour ce qui reste à faire : « Reste à
     allouer », en ambre avec un lien « Allouer » quand il y a quelque chose, un
     tiret sinon. Les colonnes Alloué, Non alloué et le badge Statut disparaissent.
     Le mode de paiement apparaît. La facture se lit sous le nom du client.
  3. Le bandeau ambre devient un compteur-filtre dans la barre du registre
     (« 3 à allouer · 4 250,00 $ »), à côté du compte total.
  4. Les cinq icônes par ligne deviennent un menu « ⋯ » nommé (voir le reçu, voir
     la preuve, allouer, modifier, annuler), comme dans le registre de facturation.
     Le trombone reste visible : c'est une information, pas une action.
  5. Les soldes créditeurs passent sous le registre, en une ligne, avec leur bouton.
  6. Le lien du Suivi est honoré : arriver avec un numéro de facture ouvre le
     formulaire avec le client et la facture déjà remplis.
  7. Les 23 écarts hors composants partagés sont corrigés au passage (jetons,
     rayons, plus de roue qui tourne).
- Ce qui ne change pas, exprès : les deux boutons et leurs fenêtres, le formulaire
  de 8 champs, l'import de preuve par vision, l'annulation avec motif, la demande
  de remboursement, l'API, les données. Rien de ce qui est enregistré ne bouge.
- Images :
  - avant, reconstitué depuis le code : `docs/journal/captures/2026-09-12_paiements_avant_maquette.png`
  - proposition : `docs/journal/captures/2026-09-12_paiements_proposition.png`
- Validation : **2026-09-12, « Oui, on met à exécution »**, images acceptées telles quelles.

### Ce que ça donne, en cibles
| | Avant | Cible |
|---|---:|---:|
| Écarts | 29 | ≤ 6 (les partagés) |
| Colonnes | 8 | 7 |
| Contrôles sur une page de 20 lignes | ~106 | ~30 |
| Blocs avant le tableau | 4 | 1 (l'en-tête) |
| Saisies supprimées | 0 | 2 par paiement venu du Suivi (client, facture) |

### Ce que je n'ai pas pu vérifier
- L'écran réel avec une session ouverte ; la maquette « avant » est reconstituée
  fidèlement depuis le code, pas capturée.
- Le nombre réel de paiements non alloués chez Me Derisier.

### Livraison
- Commit : voir `git log -1 -- components/facturation/PaiementsTable.tsx` (le lot est
  commité seul, code et documents ensemble, après l'écriture de cette section).
- Capture après : `docs/journal/captures/2026-09-12_paiements_apres.png`, composant
  réel rendu sur `/ds-preview/paiements` (données limites : nom très long, paiement
  sans client ni facture, allocation partielle, encaissement annulé, montant à sept
  chiffres), 1440 × 1000 à l'échelle 2.
- Ce qui a été construit : un composant de registre `PaiementsTable` dans la grammaire
  commune ; la vue réécrite autour de lui (en-tête, barre de recherche, filtre,
  compteur-filtre ambre, pagination, soldes créditeurs en une ligne) ; le formulaire
  accepte une facture initiale et s'ouvre dessus quand on arrive du Suivi ; les quatre
  fenêtres perdent leurs couleurs en dur, leurs rayons pleins et leurs roues qui
  tournent ; 21 libellés ajoutés dans les deux langues ; une route de contrôle visuel.
- Ce qui n'a pas été touché : l'API, les données, la logique d'allocation,
  d'annulation avec motif, de remboursement, l'import de preuve par vision.

### Mesures après
| | Avant | Après |
|---|---:|---:|
| Écarts sur la route | 29 | **3**, tous dans des composants partagés (bouton, fenêtre, menu) |
| Écarts sur `/comptabilite`, qui embarque la même vue | 73 | **50** |
| Écarts du produit | 1 083 | 1 061 |
| Colonnes | 8 | 7 |
| Contrôles par ligne | jusqu'à 5 icônes muettes | 1 menu nommé, plus « Allouer » quand il y a quelque chose à allouer |
| Blocs avant le tableau | 4 | 1 (l'en-tête) |
| Saisies supprimées | 0 | 2 par paiement venu du Suivi (client, facture), plus le montant pré-rempli au solde |
| Actions pleines | 1 | 1 |

Typecheck vert, 2 130 tests verts (178 fichiers), parité FR/EN parfaite.

### Ce que je n'ai pas pu vérifier
- Le parcours complet depuis le Suivi avec une session ouverte (le lien avec
  `?invoiceId=` ouvre le formulaire pré-rempli). La logique est écrite et compile ; à
  vérifier par le CEO sur le port 3001 en cliquant « Ajouter un paiement » depuis le
  Suivi d'une facture impayée.
- L'onglet Paiements de la Comptabilité, qui reçoit le même composant sans l'en-tête.
