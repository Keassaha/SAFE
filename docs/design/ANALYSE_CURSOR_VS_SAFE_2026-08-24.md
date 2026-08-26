# Cursor vs SAFE : analyse comparee du site public

Date : 2026-08-24
Methode : mesures reelles prises dans un navigateur, viewport 1440x900 pour les deux.
`https://cursor.com` d'un cote, `http://localhost:3040/` (accueil SAFE, ExperienceCinema) de l'autre.
Aucun chiffre ci-dessous n'est estime : ils viennent tous du DOM rendu.

---

## 1. Le tableau des mesures

| Mesure | Cursor | SAFE | Lecture |
|---|---|---|---|
| Hauteur de page | 8 337 px (9,3 ecrans) | 11 042 px (12,3 ecrans) | SAFE demande 3 ecrans de defilement de plus |
| Mots | 1 966 | 1 192 | |
| Pixels par mot | **4,2** | **9,3** | La page SAFE est deux fois plus creuse |
| Noeuds DOM | 2 318 | 1 180 | Cursor met deux fois plus de matiere dans moins de hauteur |
| Images | 28 | 2 (dont 1 capture reelle) | |
| Hauteur du heros | 1 086 px (1,2 ecran) | 2 250 px (2,5 ecrans) | Le heros SAFE coute deux fois plus cher |
| Taille du h1 | 26 px | 92 px | Postures inverses |
| Tailles de police distinctes | 16 | **22** | |
| Rayons de bordure distincts | 3 utiles (4 / 8 / pilule) | **8** (12, 7, 999, 10, 8, 9, 2, 50%) | |
| Familles typo | 1 (CursorGothic) | 3 (Geist Sans, Instrument Serif, Geist Mono) | |
| Fond de page | `#F7F7F4` (creme chaud) | `#EBEDEF` (gris bleute, conserve par decision CEO) | |
| Encre | `#26251E` (noir chaud) | `#1A1A1A` (neutre) | |
| Texte en encre pleine / en gris | 398 / 111 (78 %) | 281 / 256 (**52 %**) | La moitie du texte SAFE est en gris |
| Citations nominatives | 5 | **0** | |
| Logos clients | 1 mur | **0** | |
| Badge de confiance | SOC 2 en pied | **0** | |
| Liens de pied de page | ~35, 5 colonnes | 9 | |
| CTA de barre haute | 3 etages | 1 | |

---

## 2. Ce que Cursor fait, plan par plan

### 2.1 La dramaturgie est dans le produit, pas dans la typo
Leur h1 fait **26 px**. Une phrase de douze mots, poids 400, aucune couleur.
Juste en dessous : une demo interactive du logiciel qui occupe le reste de l'ecran.
Le message est structurel : *le produit est plus interessant que la maniere dont on en parle*.

SAFE fait l'inverse : 92 px, serif, italique, un mot en vert, et des rectangles verts
flottants autour. Trois effets sur la meme vue, avant que le produit ait dit un mot.

### 2.2 Une section = un titre court + une phrase + une scene de produit
Leurs sections portent 6 mots de titre et 1 phrase. Toute la densite vit **dans** l'ecran
de logiciel montre. Ils rejouent le produit **6 fois** sur la page, sous six angles
differents (Desktop, CLI, Slack, Cloud Agents, automatisations, choix de modele).

SAFE tient deja ce contrat de section (le fichier `recit.tsx` le decrit mot pour mot),
mais ne montre le produit vivant **qu'une seule fois**, en haut, dans le heros.
Apres le heros, la page redevient du texte et une capture PNG.

### 2.3 Chaque section a une sortie vers plus de profondeur
Toutes finissent par « Decouvrir X → ». Le visiteur qui accroche sur un theme precis
a un chemin immediat. C'est un escalier, pas un couloir.

### 2.4 La preuve arrive tot et elle est nominative
Mur de logos, puis cinq citations avec nom, titre et employeur : Jensen Huang (NVIDIA),
Patrick Collison (Stripe), Andrej Karpathy, Diana Hu (Y Combinator).
Puis, en pied, « Certifie SOC 2 », un lien Securite, un lien Statut.

### 2.5 Trois portes d'entree, pas une
La barre haute propose « Se connecter », « contacter l'equipe commerciale », « Telecharger ».
Trois niveaux d'intention : je suis client, je suis un gros compte, je veux essayer maintenant.

### 2.6 La discipline des jetons
Un seul fond (`#F7F7F4`), une seule encre (`#26251E`), 4 px de rayon dans 159 cas sur 300.
La couleur d'accent (bleu, orange) n'existe que **dans** les captures de produit,
jamais dans la mise en page. La page ne se colore pas, le logiciel se colore.

### 2.7 Le pied de page fait le travail de credibilite
35 liens en 5 colonnes : produit, ressources, entreprise, legal, social, plus le statut
du service, la securite, l'usage des donnees, le selecteur de theme et de langue.
Un pied de page dense dit « il y a une entreprise derriere ».

---

## 3. Points d'amelioration pour SAFE, par ordre d'effet

### P1. Le heros coute 2,5 ecrans et depense sa cartouche
`.pinzone` = 2 250 px. Le visiteur voit le tableau de bord anime pendant deux ecrans et demi,
puis la premiere section repart a zero sur du texte.
**Action** : ramener la zone epinglee a environ 1,4 ecran (1 250 px), et deplacer le temps
gagne vers une deuxieme apparition du produit plus bas.
Fichier : `components/public-site/ExperienceCinema.tsx` (`.pinzone`), `HeroLiveApp.tsx`.

### P2. Zero preuve sociale sur toute la page
C'est l'ecart le plus grand du tableau. Aucune citation, aucun logo, aucun badge.
**Action** :
- une citation nominative de Me Derisier, avec accord ecrit, placee apres la 2e section ;
- une ligne de confiance en pied : « Donnees hebergees au Canada · Concu pour le Barreau
  du Quebec et le Barreau de l'Ontario ». Elle existe deja dans le heros, en 11 px, sous
  les boutons. Elle merite mieux que ca.
- Rappel de la regle interne : aucun client invente, aucun logo de cabinet non consenti.
  Faute de citation disponible, un badge de conformite vaut mieux que rien.

### P3. La page est deux fois plus creuse que celle de Cursor
9,3 px par mot contre 4,2. Deux voies, au choix :
- **couper** : les sections 6 (« Simple des le depart », 123 mots) et 7 (« Avant de nous
  parler », 155 mots) portent a elles seules 23 % des mots de la page pour zero image.
  La FAQ a deja sa page.
- **remplir** : remonter du produit dans les sections 0, 4 et 5, qui sont aujourd'hui
  purement textuelles.
Recommandation : remplir plutot que couper. Votre `HeroLiveApp` est votre meilleur atout
et il ne sert qu'une fois.

### P4. Le produit n'est montre qu'une fois
Cursor le rejoue 6 fois. SAFE : 1 fois animee + 1 PNG (`fiche-de-temps.png`).
Or `public/images/app/` contient 4 captures reelles inutilisees sur l'accueil
(comptabilite, facturation, facture, fideicommis).
**Action** : la section « Le fideicommis se verifie a trois sources » doit montrer
l'ecran de rapprochement, pas le decrire. Idem pour « Le temps consigne devient la facture ».

### P5. L'echelle typographique a fui hors de son contrat
`recit.tsx` promet « six roles et six valeurs ». La page en rend **22**.
Le pire : 11 px utilise 126 fois et 11,5 px utilise 125 fois. Deux tailles que personne
ne distingue, qui coexistent 251 fois.
**Action** : fusionner 11 / 11,5 / 11,8 / 12 / 12,4 / 12,5 en une seule valeur,
et 13 / 13,5 / 14 / 14,5 en une seule. On passe de 22 a 14 sans qu'aucune page ne change
visiblement. Le gain est la maintenabilite et l'impression de systeme.

### P6. Huit rayons de bordure
12, 7, 999, 10, 8, 9, 2, 50 %. Cursor en a trois.
Le 7 px et le 9 px sont sans doute des heritages. Un rayon qui change doit signaler un
changement de nature d'objet, jamais un ajustement.
**Action** : trois rayons (petit 8, grand 12, pilule 999) + le cercle pour les avatars.

### P7. La moitie du texte est en gris
281 noeuds en `#1A1A1A` contre 256 en `#65686B`. Chez Cursor, 78 % du texte est en encre
pleine. Quand la moitie d'une page est en gris, le gris ne hierarchise plus, il affadit.
**Action** : reserver `--si-muted` aux libelles, unites et mentions legales.
Toute prose destinee a etre lue passe en encre pleine.

### ~~P8. Le fond est froid~~ — TRANCHE LE 2026-08-24 : le gris reste
Proposition initiale : reechantillonner `--si-canvas` (`#EBEDEF`, gris bleute) vers un
albatre chaud, au motif que l'identite de marque parle d'albatre et qu'un fond chaud
fatigue moins sur douze ecrans de defilement.

**Decision CEO : le fond gris est conserve.** Point ferme, ne pas rouvrir.
La passe d'hygiene ne touche plus au fond : elle porte sur l'echelle typographique (P5),
les rayons (P6), la part d'encre pleine (P7) et le jeton `--si-forest` (P9).

### P9. Hygiene de jetons : `--si-forest` vaut `#1A1A1A`
Le jeton nomme « foret » resout vers un noir neutre. Le vert reel de la page vient de
`--si-verified` (`#26654A`) et de la couleur du `em` du titre (`#2E7D5B`), soit deux verts
proches mais distincts.
**Action** : soit renommer le jeton, soit lui rendre sa valeur verte. Un nom qui ment est
une dette qui se paye au prochain reskin.

### P10. Une seule porte d'entree, et elle est engageante
« Evaluer mon cabinet » apparait 4 fois. C'est un bon CTA chaud, mais c'est le seul.
Un visiteur froid n'a nulle part ou aller sauf « Connexion ».
**Action** : ajouter un chemin tiede a cote du CTA principal : « Voir l'application »
qui mene a `/demo`, deja construit.

### P11. Pas d'escalier de profondeur par section
Deux liens « Decouvrir → » sur toute la page, tous les deux dans la meme section.
**Action** : une sortie par section, vers `/fonctionnalites`, `/calculateurs`,
`/tarification`, `/faq`. Le code existe, il ne manque que le lien.

### P12. Le pied de page fait maigre
9 liens contre 35. Il manque au minimum : Journal ou Blog, Calculateurs, Securite et
donnees, Statut du service.

### P13. Les rectangles verts flottants du heros
Sur la capture, ils se lisent comme des debris disperses plutot que comme un assemblage.
Cursor n'a aucun element decoratif abstrait sur toute sa page.
**Action** : soit l'animation converge visiblement vers la marque et s'arrete (l'assemblage
se termine), soit on la retire. Une forme qui flotte sans destination est du bruit.

---

## 4. Ce qu'il ne faut PAS copier a Cursor

- **Leur h1 a 26 px.** Ils vendent a des ingenieurs qui reconnaissent le produit en une
  seconde. Une avocate ne reconnait pas SAFE. La promesse doit rester lisible et affirmee.
  Reduire un peu, pas s'aligner.
- **Leur densite de pied de page.** 35 liens supposent 35 destinations vivantes.
  Un pied de page qui promet des pages vides est pire qu'un pied de page court.
- **Le mur de logos.** Interdit tant qu'aucun cabinet n'a consenti par ecrit.
- **Le fond peint derriere les demos.** Joli chez eux, hors registre pour un cabinet.

---

## 5. Sequence proposee

1. P2 (preuve) et P10 (porte tiede) : quelques heures, effet direct sur la conversion.
2. P1 (heros) et P4 (produit rejoue) : la vraie refonte de rythme.
3. P5, P6, P7, P9 : passe d'hygiene de jetons, invisible et structurante.
4. P11, P12, P13 : finition. (P8 est clos : le fond gris reste.)
