# 2026-09-12 — Le Fidéicommis : un titre, une barre de chiffres, un seul registre, et des rapports qui parlent français

Rang 3 de la file du cadre `docs/product/CHANTIER_SIMPLIFICATION_ADMIN_FINANCE.md`.
Deux écrans, un seul objet : le registre du fidéicommis (`/comptes`) et ses rapports de
conformité (`/comptes/rapports`). Ouvert, validé en image et livré le même jour. La fiche est complète.

Le rapprochement mensuel (`/comptes/rapprochement`, 4 écarts) n'est pas dans ce lot.

## Écran 1 : `/comptes`, le registre                    Ouvert le : 2026-09-12

### Mesures avant
- Écarts (design-audit, perRoute) : **39**. Répartition : bandeau de rapprochement 11,
  quatre cartes de chiffres 7, tableau des opérations 6, panneau de surveillance 4, la
  page 3, fenêtre d'ajout 3, formulaire de retrait 1, et le reste dans des composants
  partagés. Presque tout est de la palette Tailwind générique (verts, ambres, bleus,
  rouges, gris) au lieu des jetons du produit.
- Lignes : page 80, tableau de bord 100, cartes de chiffres 115, tableau des
  opérations 145, panneau de surveillance 115, bandeau de rapprochement 113, générateur
  de relevé 150. Environ 820 lignes montées.
- **Huit blocs avant le tableau** : le lien de retour, l'en-tête, une carte-lien vers
  l'Inspection, le bandeau de rapprochement, le panneau de surveillance, quatre cartes de
  chiffres, trois boutons secondaires, une carte d'information. Le tableau arrive
  neuvième, et il partage sa largeur avec un formulaire de relevé à quatre champs.
- **Deux cartes vertes quand tout va bien.** Le rapprochement à jour et la surveillance
  sans alerte occupent chacun une carte pleine largeur, teintée, pour dire que rien ne
  cloche. Le calme prend plus de place que le registre.
- Colonnes du tableau : 9 (Date, Client, Dossier, Type, Description, Référence, Dépôt,
  Retrait, Solde). Les noms de clients sont tronqués, le tableau tient dans deux tiers de
  la page.
- Actions pleines : **2** (« Ajouter une transaction » dans l'en-tête, « Télécharger le
  relevé PDF » dans la colonne de droite). Une de trop.
- Contrôles hors tableau : 16 (retour, ajout, Inspection, trois boutons, lien Facturation,
  quatre filtres, quatre champs de relevé, un bouton).
- Le titre dit « Comptes en fidéicommis » quand le menu dit « Fidéicommis ». Le lien de
  retour mène à la Facturation alors que l'écran est une entrée du menu.
- Geste principal : « enregistrer un dépôt ou un retrait, et voir que le compte concorde ».
- Clics depuis le menu : Finances › Fidéicommis › Ajouter une transaction › onglet Dépôt
  ou Retrait, puis le formulaire.
- **Une saisie faite à la main qui ne devrait pas l'être** : la fiche client envoie ici
  avec `?clientId=` (« voir le compte en fidéicommis de ce client ») et l'écran
  **l'ignore**. Même défaut que le lien du Suivi vers les Paiements : on arrive sur le
  registre entier et on re-choisit le client dans le filtre. Vérifié : aucune lecture de
  ce paramètre.
- Le formulaire de relevé demande client et dossier alors que le registre a déjà ces
  deux filtres à côté : deux fois les mêmes listes déroulantes sur un écran.

### Consignes CEO, datées, mot pour mot
- 2026-09-12 · « ouvre le Fidéicommis » (rang 3 de la file).
- 2026-09-12 · « Oui, on met à exécution », sur les trois images, sans modification.

### Proposition
- Ce qui change :
  1. Le titre devient **« Fidéicommis »**, le mot du menu, avec sa phrase : « L'argent
     des clients, gardé à part, et le rapprochement de chaque mois. » Plus de lien de
     retour : c'est une entrée du menu.
  2. **Une seule action pleine**, « Ajouter une transaction ». « Relevé PDF » devient un
     bouton secondaire qui ouvre une petite fenêtre déjà remplie avec le client, le
     dossier et le mois du registre. Le formulaire de relevé quitte la page.
  3. Les deux cartes d'état et les quatre cartes de chiffres deviennent **une barre de
     chiffres**, la grammaire de la Facturation : solde total (avec le nombre de dossiers
     en appoint), dépôts du mois, retraits du mois, l'état du rapprochement, ce qu'il y
     a à surveiller. Quand tout va bien, ça se dit en une ligne calme. Quand quelque
     chose cloche, la ligne passe en ambre ou en rouge, en toutes lettres, et devient un
     lien vers le rapprochement ou vers les comptes concernés.
  4. La carte Inspection, les trois boutons et la carte d'information deviennent **une
     rangée de liens** : Rapprochement · Rapports de conformité · Inspection · Points à
     surveiller, suivie de la phrase sur l'imputation depuis la Facturation.
  5. Le tableau prend **toute la largeur et la grammaire du registre** : filtres dans la
     barre, sept colonnes au lieu de neuf (le dossier sous le client, la référence sous
     la description), Dépôt, Retrait et Solde gardés tels quels parce que c'est la forme
     du grand livre qu'un inspecteur lit. Pagination par 20, compte d'opérations.
  6. Le lien de la fiche client est honoré : arriver avec un client pré-sélectionne le
     filtre.
  7. Les écarts hors composants partagés sont corrigés au passage.
- Ce qui ne change pas, exprès : la fenêtre d'ajout avec ses onglets Dépôt et Retrait,
  les trois motifs de retrait du règlement, l'API, les données, le relevé PDF lui-même,
  l'écran de rapprochement.
- Images :
  - avant, reconstitué depuis le code : `docs/journal/captures/2026-09-12_fideicommis_avant_maquette.png`
  - proposition : `docs/journal/captures/2026-09-12_fideicommis_proposition.png`

## Écran 2 : `/comptes/rapports`, les rapports de conformité

### Mesures avant
- Écarts : **38**, dont 32 dans le générateur lui-même (31 couleurs de la palette
  générique). Lignes : page 41, générateur 456.
- **La période se tape à la main**, au format « 2026-04 », dans un champ texte. Une
  faute de frappe donne un rapport vide.
- **Les statuts s'affichent dans les mots du code** : « final », « draft », « certified »,
  « monthly ». Un badge porte « final » pour dire « signé ».
- La certification passe par la boîte grise du navigateur (`window.confirm`), pas par
  la fenêtre de SAFE.
- Quatre boîtes de couleur (gris, vert, ambre, bleu) pour quatre montants, puis une
  grille de douze cases vertes ou rouges pour le rapport annuel.
- Actions pleines : 1 (« Enregistrer le rapport », qui n'apparaît qu'après l'aperçu).
- Le tableau des rapports enregistrés est écrit en local, hors grammaire du registre.

### Proposition
- Un titre, « Rapports de conformité », et sa phrase : « Le rapport qu'un inspecteur
  demande, prêt à signer. » Retour vers Fidéicommis.
- La période se choisit dans une liste de mois ; le type à côté ; « Préparer l'aperçu »
  est l'action pleine tant qu'il n'y a pas d'aperçu, puis « Enregistrer le rapport ».
- L'aperçu devient une barre de chiffres (ouverture, dépôts, retraits, clôture, comptes,
  rapprochement à trois voies) et un journal dans la grammaire du registre.
- Les statuts se lisent en français : Signé, Brouillon, Certifié, À certifier, Mensuel,
  Trimestriel, Annuel.
- « Signer la déclaration » ouvre la fenêtre habituelle de SAFE avec la phrase de
  certification, au lieu de la boîte du navigateur.
- Image : `docs/journal/captures/2026-09-12_fideicommis_rapports_proposition.png`

## Ce que ça donne, en cibles
| | Avant | Cible |
|---|---:|---:|
| Écarts, registre | 39 | ≤ 8 (les partagés) |
| Écarts, rapports | 38 | ≤ 6 |
| Blocs avant le tableau du registre | 8 | 2 (l'en-tête et la barre de chiffres) |
| Actions pleines sur le registre | 2 | 1 |
| Colonnes du registre | 9 | 7 |
| Listes déroulantes client et dossier sur l'écran | 4 | 2 |
| Saisies supprimées | 0 | le client depuis la fiche client ; la période tapée à la main |
| Statuts affichés dans les mots du code | 4 | 0 |

## Ce que je n'ai pas pu vérifier
- Les écrans réels avec une session ouverte ; la maquette « avant » est reconstituée
  depuis le code.
- L'état réel du rapprochement et des alertes chez Me Derisier.

- Validation : **2026-09-12, « Oui, on met à exécution »**, images acceptées telles quelles.

### Livraison
- Commit : voir `git log -1 -- components/fideicommis/TrustSummaryBar.tsx` (code et
  documents en un commit, après l'écriture de cette section).
- Capture après : `docs/journal/captures/2026-09-12_fideicommis_apres.png`, composants
  réels rendus sur `/ds-preview/fideicommis` dans les deux états, tout va bien puis tout
  cloche (rapprochement en retard, deux soldes négatifs, un fonds dormant, un écart), et
  le registre sur ses cas limites (nom très long, opération sans dossier, correction,
  montant à sept chiffres, description qui se tronque).
- Ce qui a été construit :
  - `TrustSummaryBar` : la barre de chiffres, branchée sur les trois lectures qui
    existaient déjà (synthèse, état du rapprochement, alertes). Une partie
    présentationnelle pour le contrôle visuel. Quand quelque chose cloche, la ligne
    passe en ambre ou en rouge, en toutes lettres, et devient un lien ; la liste des
    comptes concernés s'affiche alors sous la barre, jamais quand tout va bien.
  - `TransactionsTable` réécrit dans la grammaire du registre : filtres dans la barre,
    sept colonnes, largeurs fixées pour qu'un intitulé long se tronque au lieu de
    pousser le tableau hors de l'écran, pagination par vingt, compte d'opérations.
  - `ReleveModal` : le relevé PDF en fenêtre, pré-remplie avec le client, le dossier et
    le mois du registre.
  - `FideicommisDashboard` réécrit : en-tête « Fidéicommis » avec sa phrase, une seule
    action pleine, rangée de liens, lecture de `?clientId=` (le filtre client se
    pré-sélectionne en arrivant de la fiche client).
  - `LSOReportGenerator` réécrit : période choisie dans une liste (vingt-quatre mois,
    ou cinq exercices pour l'annuel), barre de chiffres, journal et rapports enregistrés
    dans la grammaire du registre, statuts en français, signature de la déclaration
    dans la fenêtre de SAFE avec la phrase de certification.
  - Quatre composants morts retirés : `SoldeCards`, `ReconciliationAlert`,
    `TrustAlertsPanel`, `ReleveGenerator`. Vérifié : aucun autre écran ne les montait.
  - 35 libellés ajoutés dans les deux langues, 22 textes réglementaires ajoutés en
    français et en anglais, une route de contrôle visuel.
- Ce qui n'a pas été touché : l'API, les données, la fenêtre d'ajout et ses onglets, les
  trois motifs de retrait, le rapprochement, le relevé PDF lui-même, la certification
  côté serveur.

### Mesures après
| | Avant | Après |
|---|---:|---:|
| Écarts, registre `/comptes` | 39 | **4**, composants partagés |
| Écarts, rapports `/comptes/rapports` | 38 | **4**, composants partagés |
| Écarts du produit | 1 061 | 1 041 |
| Blocs avant le tableau du registre | 8 | 2 |
| Actions pleines sur le registre | 2 | 1 |
| Colonnes du registre | 9 | 7 |
| Listes déroulantes client et dossier sur l'écran | 4 | 2 |
| Cartes vertes quand tout va bien | 2 | 0 |
| Statuts affichés dans les mots du code | 4 | 0 |
| Saisies supprimées | 0 | le client depuis la fiche client ; la période tapée à la main ; client, dossier et mois du relevé |
| Lignes montées sur `/comptes` | ~820 | ~640 |

Typecheck vert, 2 151 tests verts (179 fichiers), parité FR/EN parfaite.

### Ce que je n'ai pas pu vérifier
- L'écran des rapports rendu : il n'a pas de route de contrôle visuel, ses données
  viennent de l'API. Il compile et suit la même grammaire ; à regarder sur le port 3001,
  en préparant un aperçu et en signant un rapport de test.
- Le parcours depuis la fiche client (« voir le compte en fidéicommis ») avec une
  session ouverte : le filtre client doit arriver pré-sélectionné.
- La barre à cinq mesures passe sur deux lignes en dessous de 1 300 px de large, ce que
  la capture montre. C'est un repli assumé, pas un défaut : rien ne se coupe.
