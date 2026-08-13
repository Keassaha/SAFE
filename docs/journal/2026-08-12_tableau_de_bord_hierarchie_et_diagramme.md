# Tableau de bord : hiérarchie, montants, diagramme des flux

**2026-08-12** · déc. CEO

## Le constat

« Je ne suis pas satisfait de la présentation de mon dashboard, je trouve que
l'info n'est pas claire et bien hiérarchisée. Je veux que l'avocate ait un résumé
en chiffres des montants essentiels comme le fidéicommis, un résumé en diagramme
3D en plus de quelques chiffres de ces performances. »

Trois défauts mesurables, pas une affaire de goût :

1. **La carte de priorité occupait tout le premier écran.** Un titre sérif de
   35 px, deux montants et un bouton, pour afficher deux fois « 0,00 $ ». Le
   premier écran d'un cockpit doit porter des chiffres, pas une phrase.
2. **Le fidéicommis était la quatrième tuile sur quatre**, sous la ligne de
   flottaison, et rien ne le distinguait du chiffre d'affaires. C'est pourtant le
   seul de ces montants qui n'appartient pas au cabinet, le seul que le Barreau
   vient vérifier, et le seul dont un écart met le permis en jeu.
3. **Aucun diagramme.** Les douze mois de facturé et d'encaissé existaient dans
   `DashboardPayload.revenueChartData` depuis toujours et n'étaient dessinés
   nulle part. Les ratios de performance dormaient dans une petite carte de bas
   de page.

## L'ordre retenu

| | Avant | Après |
|---|---|---|
| 1 | Carte de priorité, plein écran | Bande d'action compacte, titre 24 px |
| 2 | Bande de conformité | inchangée |
| 3 | 4 tuiles égales, fidéicommis en 4ᵉ | **Fidéicommis sur 2 colonnes sur 5, chiffre 38 px**, puis créances / encaissements / facturation |
| 4 | — | **Diagramme des flux + « Vos performances »**, côte à côte |
| 5 | Navette | inchangée |
| 6 | Obligations · lecture financière · activité | inchangée |
| 7 | Pour commencer | inchangée |

Les deux montants que portait la carte de priorité rejoignent le bloc des
montants : c'est leur place. La bande d'action ne garde que ce qu'elle doit
dire — quoi faire, pourquoi, et le bouton pour le faire — plus les deux alertes
en cours, chacune cliquable.

Le bloc « Vos performances » sort cinq chiffres du placard : taux d'encaissement,
taux de facturation, heures travaillées, heures facturées, valeur non facturée.
Chacun porte une ligne qui dit ce qu'il veut dire. La valeur non facturée passe
en ambre : c'est du travail fait qui n'a pas encore été porté à une facture,
donc un geste en attente.

## Le diagramme

`components/dashboard/CashflowChart.tsx`.

**La forme.** Colonnes groupées, facturé contre encaissé, 6 ou 12 mois. La forme
« jauge » (le facturé en piste, l'encaissé en remplissage) était plus élégante et
a été écartée : elle ment dès qu'un mois encaisse une facture émise le mois
d'avant, ce qui est le cas courant d'un cabinet.

**Les couleurs.** Emphase, pas catégoriel : une teinte porteuse et un gris de
retrait. L'encaissé est ce qui est réellement rentré, il prend le vert de l'état
validé ; le facturé n'est qu'une créance, il reste gris. Le couple a été passé au
validateur du référentiel dataviz avant d'écrire une ligne de rendu :

```
#26654A (verified) / #888E94 (border-strong), surface #FFFFFF
  PASS  bande de clarté
  PASS  séparation daltonisme   ΔE 17,2 protan · 19,8 tritan
  PASS  vision normale          ΔE 20,2
  PASS  contraste sur la surface  les deux ≥ 3:1
  FAIL  plancher de chroma      volontaire : le gris DOIT lire gris
```

Les couleurs sont écrites en **jetons**, pas en hexadécimales : la palette est
pilotable et un diagramme figé dériverait d'elle à la première retouche, ce qui
est exactement le défaut relevé la veille sur l'atelier d'édition. Contrepartie
inscrite dans le fichier : la séparation mesurée vaut pour la palette « Ardoise »
en vigueur ; qui touche `verified` ou `border-strong` doit repasser le validateur.

**Le relief.** Le CEO a demandé un diagramme « 3D ». Une vraie perspective fausse
la lecture des hauteurs — c'est le seul point de la demande que je n'ai pas suivi
à la lettre, et je le signale plutôt que de le taire. Le relief est donc porté par
la matière et non par la géométrie : dégradé vertical obtenu par l'opacité du même
jeton, capuchon arrondi de 4 px ancré à la ligne de base, arête haute éclairée,
ombre au sol. Les colonnes se lisent comme des objets posés pendant que leur
hauteur reste mesurée sur un axe plat.

**Ce qui va avec.** Infobulle au survol (facturé, encaissé, reste, taux
d'encaissement du mois), légende permanente, repli « Voir les chiffres » en
tableau — le diagramme n'est jamais le seul porteur du chiffre, ce qui sert aussi
le daltonisme complet et l'impression. Et un état vide honnête : tant qu'aucune
facture n'a circulé, l'écran écrit « Aucune facture sur la période » au lieu de
dessiner une ligne plate qu'il faudrait interpréter.

## Vérification

Le cabinet de développement n'a aucune facture : le diagramme y affiche son état
vide et ne peut pas être jugé. Il a donc été rendu avec des données
représentatives sur une page de contrôle temporaire, photographié rempli, survolé
pour l'infobulle, puis la page a été supprimée — une route publique portant des
montants inventés n'a rien à faire dans le dépôt.

Audit de design revenu à sa valeur d'avant le chantier (363 hexadécimales) après
le passage aux jetons : zéro dette introduite. TypeScript propre, 22 tests verts,
console vierge.

## Reste à faire

Le tableau de bord n'a jamais été traduit : les libellés de cette vue sont en
français dans le composant, comme ceux qu'ils remplacent. À reprendre avec le
reste de la vue si l'anglais devient nécessaire.
