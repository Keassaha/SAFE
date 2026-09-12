# 2026-09-12 — Le registre de facturation cesse d'avoir un second menu au milieu de la page

Premier écran fermé sous le cadre `docs/product/CHANTIER_SIMPLIFICATION_ADMIN_FINANCE.md`.
Le code venait de la session précédente (consignes CEO du 2026-09-10) ; cette session
l'a mesuré, capturé, commité seul et inscrit au registre.

## Écran : `/facturation`                              Ouvert le : 2026-09-10

### Mesures avant
- Écarts (design-audit, perRoute) : **20**, mesurés en remettant les quatre fichiers à
  leur version commitée (`git stash` du lot, audit, `stash pop`).
- Lignes du dossier de route : 362.
- Blocs entre les chiffres et le registre : **5 cartes** en grille, chacune un lien.
- Actions pleines : 1 (« Nouvelle facture »). Déjà conforme.
- Geste principal : « voir ce qui reste à facturer, puis créer la facture ».
- Clics depuis le menu jusqu'à la liste des honoraires à facturer : 1 (Finances >
  Facturation), puis défilement sous les cinq cartes.
- Saisies à la main sur cet écran : aucune ; c'est un écran de lecture et de départ.

### Consignes CEO, datées, mot pour mot
Données le 2026-09-10 dans la session précédente, relevées dans les commentaires du
code (le registre n'existait pas encore) :
- Les cinq cartes d'outils deviennent une rangée de liens : « ce sont des rapports
  qu'on consulte, pas des étapes du travail ».
- « Honoraires à facturer » ouvre la section de travail : « ce qui reste à facturer
  passe avant ce qui l'est déjà ».
- Une colonne « Envoyée le » dans le registre, entre l'émission et l'échéance.
- La carte « Filtres » de la vue des honoraires disparaît quand elle est intégrée
  dans la page.

### Proposition
- Ce qui change : cinq cartes remplacées par cinq liens sur une ligne ; la section
  des honoraires reçoit un titre et une phrase ; le registre gagne « Envoyée le »,
  avec « jamais envoyée » en ambre et en toutes lettres ; la vue intégrée perd sa
  carte de filtres et sa carte englobante ; le compte total s'affiche à côté du
  titre du registre.
- Ce qui ne change pas, exprès : les destinations des cinq liens (TPS/TVQ et
  Rentabilité n'ont aucune autre porte), l'action pleine, les colonnes existantes,
  l'écran autonome des honoraires.
- Image : pas de PNG avant le code pour ce lot, qui précède le cadre. Première et
  dernière exception : à partir du rang 2, l'image précède le code (R4).
- Validation : consignes CEO 2026-09-10.

### Livraison
- Commit : `ab5d88f` feat(facturation): le registre cesse d'avoir un second menu au
  milieu de la page
- Capture après : `docs/journal/captures/2026-09-12_facturation_registre.png`
  (route `/ds-preview/facturation`, données limites, 1440 × 900 à l'échelle 2).
  Le disque sombre en bas à gauche est l'indicateur du serveur de développement,
  pas le produit.
- Journal : ce fichier.

### Mesures après
- Écarts : **20 → 20**. Le lot est structurel, aucun jeton n'a été touché. Les 20
  restants vivent surtout dans la fenêtre de choix « Nouvelle facture » (10 : sept
  rayons pleins, deux mouvements continus, une couleur en dur) ; ils forment le
  premier point de la prochaine passe sur cet écran. **Exception à R7, consignée.**
- Blocs entre les chiffres et le registre : 5 cartes → 1 ligne de texte.
- Actions pleines : 1 → 1.
- Clics pour le geste principal : 1 → 1, sans défilement sous des cartes.
- Saisies supprimées : aucune (écran de lecture). Ce qui devient visible sans
  saisie : la date d'envoi, le compte total, et les factures jamais transmises.
- Typecheck vert, 2 114 tests verts (177 fichiers), parité FR/EN parfaite.

## Ce qui n'a pas pu être vérifié
- La page complète (chiffres, rangée de liens, section des honoraires) avec une
  session ouverte : la capture ne couvre que le registre. Le CEO la voit sur le
  port 3001.
