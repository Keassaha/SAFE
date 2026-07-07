# Vidéo SAFE 360 — Brief d'animation pour Claude Design

Vidéo produit d'environ 2 minutes, axée sur le bénéfice pour l'avocat, sous une seule idée : « Une seule loi, celle du Barreau. »

---

## 1. Comment utiliser ce dossier

1. Ouvrez une nouvelle conversation Claude (mode Design).
2. Joignez ce fichier `SCRIPT_360.md` et toutes les images du dossier `captures/`.
3. Collez le prompt de la section 2.
4. Claude recréera chaque scène en HTML/SVG animé, fidèle aux captures, avec les animations décrites.

Note importante : Claude ne colle pas les images brutes et ne les anime pas telles quelles. Il s'en sert comme référence pour **recréer** chaque écran proprement en éléments HTML, sans l'habillage du navigateur, puis il anime. C'est ce qui donne un rendu net et sur la marque.

---

## 2. Prompt à coller dans Claude Design

> Tu es motion designer. À partir des captures jointes et des specs de ce document, produis **une scène animée par section** du script (section 5), en HTML/SVG animé.
>
> Règles :
> - Ne colle pas les captures. **Recrée** fidèlement chaque écran en éléments HTML propres, sans habillage de navigateur réel (pas d'onglets, pas de favoris, pas d'URL). Place l'écran dans un cadre épuré à trois points, sur fond albâtre.
> - Respecte le système visuel de la section 3 (palette, typo, curseur, badges, sous-titres) et reproduis le logo SAFE avec le tracé SVG exact de la section 4.
> - Applique les animations décrites pour chaque scène, avec les durées indiquées.
> - Une scène = un widget. Commence par la scène 1 et attends ma validation avant la suivante.

---

## 3. Système visuel (à respecter partout)

- **Format** : 16:9, pensé pour 1920 x 1080. Déclinaison possible 9:16 (logo centré, sous-titres plus gros).
- **Palette** (deux dominantes plus neutres) :
  - Forêt `#1F3A2E` (fonds de marque, cartons, boutons d'action)
  - Albâtre `#F5F3EC` (fond clair)
  - Blanc `#FFFFFF` (surfaces)
  - Crème logo `#F7F2E8` (logo sur fond foncé)
  - Vert succès : fond `#E7EFE9`, texte `#1F3A2E`
  - Ambre attention : fond `#FAEEDA`, texte `#854F0B`
  - Ligne `#E2DFD4`
- **Typographie** : serif (type Instrument Serif) pour le logo, les titres et l'accroche. Sans-serif (type Geist ou système) pour l'interface et les sous-titres.
- **Curseur scripté** : pointeur foncé `#1F3A2E` cerné de blanc, environ 22 px. Anneau de clic de 30 px, bordure `rgba(31,58,46,.55)`, qui pulse `scale 0.3 vers 1.6`, `opacity 0.6 vers 0` sur 500 ms. Déplacements lents, easing doux.
- **Badge succès** : fond `#E7EFE9`, texte forêt, coin 8 px, apparition en ressort (`scale 0.8 vers 1`).
- **Sous-titres** : toujours présents, bas de cadre, sans-serif, texte blanc sur léger voile forêt translucide. La vidéo se comprend sans le son.
- **Logo en filigrane** : petit, coin haut-droit des écrans, marque seule (deux fanions), forêt à 70 % d'opacité.
- **Transitions** : coupe franche, ou fondu de 200 à 250 ms. Jamais d'effet voyant.
- **Rythme** : mouvements fluides, pauses sur les moments-clés.

---

## 4. Le logo SAFE (tracé exact)

Deux fanions, un plein, un à 55 % d'opacité, plus le mot « Safe » en serif. À reproduire tel quel.

```svg
<svg width="58" height="58" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M 4.5,5.5 Q 3.5,3.5 5.5,4 L 12.5,4 Q 14.5,3.5 13.5,5.5 L 10,12.5 Q 9,14.5 8,12.5 Z" fill="ACCENT"/>
  <path d="M 19.5,18.5 Q 20.5,20.5 18.5,20 L 11.5,20 Q 9.5,20.5 10.5,18.5 L 14,11.5 Q 15,9.5 16,11.5 Z" fill="ACCENT" fill-opacity="0.55"/>
</svg>
```

- Sur fond foncé : `ACCENT = #F7F2E8`. Sur fond clair : `ACCENT = #1E3A2E`.
- Mot « Safe » en serif à côté du mark. En capitales « SAFE » possible pour une pub, à trancher.

---

## 5. Les scènes

### Scène 1 — Ouverture logo · 0:00 à 0:04
- **Capture de référence :** aucune (carton de marque).
- **Écran à recréer :** fond forêt plein cadre.
- **Animation :**
  - 0 à 800 ms : le logo apparaît, `scale 0.9 vers 1` en fondu. Le second fanion apparaît 150 ms après le premier.
  - 800 à 1400 ms : le mot « Safe » monte de 6 px en fondu.
  - 1400 à 2600 ms : l'accroche « Une seule loi, celle du Barreau. » monte en fondu sous le logo.
  - Tenue jusqu'à 4 s, puis fondu de sortie 250 ms.
- **Voix :** « Un cabinet d'avocats ne répond qu'à une seule autorité. Le Barreau. »

### Scène 2 — Dormez tranquille à l'inspection · 0:04 à 0:30
- **Captures de référence :** `captures/fideicommis.png`, puis `captures/dossier.jpg`.
- **Écran à recréer :** la page Fidéicommis (soldes par client, boutons dont « Réconciliation »), puis un dossier avec un encart « État de préparation » listant ce qui manque.
- **Animation :**
  - 0 à 1000 ms : la page fidéicommis entre en fondu, léger zoom sur les deux cartes de soldes.
  - 1000 à 2200 ms : le curseur part de (88 %, 20 %) vers le bouton « Réconciliation » (environ 27 %, 52 %).
  - 2200 à 2400 ms : clic, l'anneau pulse, le bouton s'enfonce (`scale 0.96`).
  - 2400 à 3000 ms : un badge vert « Conciliation certifiée, aucun écart » apparaît en ressort.
  - 3000 à 3300 ms : fondu vers le dossier.
  - 3300 à 5200 ms : l'encart « État de préparation » montre trois lignes « manquant » (identité, mandat, assistante) qui apparaissent une par une, chaque ligne avec une pastille ambre.
- **Sous-titre :** « Fidéicommis concilié en un clic. Ce qui manque, signalé. »
- **Voix :** « Votre fidéicommis se concilie en un clic. Un retrait qui creuserait un compte est refusé avant même d'exister. Et sur chaque dossier, SAFE nomme ce qu'il reste à régler pour être en règle. »

### Scène 3 — Faites-vous payer, en entier · 0:30 à 0:54
- **Captures de référence :** `captures/temps-facture.jpg`, puis `captures/facture.png`.
- **Écran à recréer :** la fenêtre « Nouvelle entrée de temps » (client, dossier, durée), puis la facture générée (numéro 2026-002, lignes de description, TOTAL).
- **Animation :**
  - 0 à 1200 ms : la fenêtre d'entrée de temps entre. Le curseur va vers le bouton « Ajouter » (environ 85 %, 42 %), clic.
  - 1200 à 1600 ms : fondu vers la facture.
  - 1600 à 2600 ms : la facture se compose ligne par ligne. Le TOTAL compte de 0 à 862,31 $ sur 600 ms, puis se fige en gras.
  - 2600 à 3400 ms : un grand libellé « 25 min vers 5 min » surgit par-dessus en ressort, tenu 800 ms, puis disparaît.
- **Sous-titre :** « Le temps devient une facture. De 25 à 5 minutes. »
- **Voix :** « Chaque minute notée devient une ligne de facture, sans la ressaisir. Chez le cabinet où je travaillais, la préparation d'une facture est passée de 25 à 5 minutes. »

### Scène 4 — Rien ne se perd · 0:54 à 1:10
- **Capture de référence :** `captures/creances.jpg`.
- **Écran à recréer :** la page « Aging des créances », total dû et colonnes par ancienneté (courant, 1 à 30, 31 à 60, 61 à 90, 90 et plus), une ligne client.
- **Animation :**
  - 0 à 1000 ms : la page entre. Les cinq cartes de tranches apparaissent une par une (stagger 100 ms).
  - 1000 à 1800 ms : la valeur « Total dû » compte de 0 à 247,50 $.
  - 1800 à 2600 ms : le curseur survole la ligne client, un surlignage doux apparaît, la colonne « en retard » clignote une fois en ambre.
- **Sous-titre :** « Ce qu'on vous doit, et depuis quand. »
- **Voix :** « Ce qu'on vous doit, et depuis quand, s'affiche sans que vous le cherchiez. Votre travail ne se perd plus entre le dossier et la banque. »

### Scène 5 — Gardez la main · 1:10 à 1:28
- **Capture de référence :** `captures/dashboard.png`.
- **Écran à recréer :** le tableau de bord, l'élément « Prêt pour revue » avec les boutons « Approuver » et « Renvoyer », et un badge de statut « 1 à valider ».
- **Animation :**
  - 0 à 1000 ms : le tableau de bord entre, léger zoom sur la carte « Prêt pour revue ».
  - 1000 à 2000 ms : le curseur va vers « Approuver » (bouton vert), clic, l'anneau pulse.
  - 2000 à 2700 ms : l'élément bascule. Un badge vert « Approuvé » apparaît en ressort, la carte s'estompe à 70 % d'opacité, et le badge de statut passe de « 1 à valider » (ambre) à « À jour » (vert).
- **Sous-titre :** « L'adjointe prépare. Vous approuvez. »
- **Voix :** « Votre adjointe prépare, vous tranchez d'un clic. SAFE ne prend la place de personne. Il veille à ce que rien ne passe sans votre accord. »

### Scène 6 — Vos données, ici et protégées · 1:28 à 1:46
- **Capture de référence :** `captures/comptabilite.png`.
- **Écran à recréer :** la page Comptabilité, les cartes séparées (facturé, encaissé, à recevoir, dépenses, fidéicommis séparé), et un bouton « Exporter ».
- **Animation :**
  - 0 à 1000 ms : les cartes entrent une par une (stagger 90 ms).
  - 1000 à 1800 ms : le curseur va vers « Exporter » (environ 85 %, 70 %), clic.
  - 1800 à 2500 ms : un badge vert « Prêt à transmettre à votre comptable » apparaît en ressort.
- **Sous-titre :** « Chaque flux séparé. Prêt pour le comptable. »
- **Voix :** « Côté chiffres, tout est séparé et clair. Prêt à transmettre à votre comptable en un clic. Vos données restent au Canada, chiffrées. »

### Scène 7 — Clôture logo et appel à l'action · 1:46 à 2:00
- **Capture de référence :** aucune (carton de marque).
- **Écran à recréer :** fond forêt, logo plein cadre, accroche, « safecabinet.ca », bouton « Réservez 15 minutes ».
- **Animation :**
  - 0 à 1200 ms : le logo apparaît comme à la scène 1, l'accroche monte.
  - 1200 à 1800 ms : le bouton « Réservez 15 minutes » apparaît en dernier (`scale 0.95 vers 1` en fondu).
  - Tenue 3 s.
- **Voix :** « SAFE. Une seule loi, celle du Barreau. Accordez-lui quinze minutes, et voyez ce que ça change chez vous. »

---

## 6. Ordre, durées, sous-titres

| Scène | Bénéfice | Durée | Capture |
|---|---|---|---|
| 1 | Ouverture logo | 0:00–0:04 | carton |
| 2 | Dormez tranquille à l'inspection | 0:04–0:30 | fideicommis, dossier |
| 3 | Faites-vous payer, en entier | 0:30–0:54 | temps-facture, facture |
| 4 | Rien ne se perd | 0:54–1:10 | creances |
| 5 | Gardez la main | 1:10–1:28 | dashboard |
| 6 | Vos données, ici et protégées | 1:28–1:46 | comptabilite |
| 7 | Clôture et appel à l'action | 1:46–2:00 | carton |

Règles de langage : voix « vous », pas de tirets longs en milieu de phrase, pas de jargon. Chaque scène est une promesse de bénéfice, jamais une liste de fonctions.

Note sur les captures : `dossier.jpg`, `temps-facture.jpg` et `creances.jpg` sont tirées d'un enregistrement d'écran et montrent encore l'habillage du navigateur. Elles servent de référence de contenu. Les captures `.png` (dashboard, fideicommis, facturation, facture, comptabilite) sont propres.
