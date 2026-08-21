# 2026-08-21 — La barre du haut cesse de s'écraser quand le chrono tourne, et la langue redevient trouvable

## Demande

Deux irritants signalés à l'écran, capture à l'appui :

1. « Lorsque je démarre le temps, la barre de menu en haut devient trop petite. »
   Sur la capture, les libellés du menu passent par-dessus le logo à gauche et
   par-dessus le champ de recherche à droite.
2. « Je ne retrouve pas l'option dans mon sidebar pour mettre mon site en anglais,
   ce que je n'apprécie pas beaucoup. »

## Ce qui n'allait pas

### La barre n'avait aucune discipline de débordement

La barre supérieure est une seule ligne, en trois blocs : la marque à gauche, la
navigation au centre, la recherche et le chrono à droite. Les deux extrémités sont
déclarées `shrink-0` : elles ne cèdent jamais un pixel. La navigation, elle, est
`flex-1` avec des libellés `whitespace-nowrap` : elle reçoit une piste qui rétrécit,
mais son contenu ne rétrécit pas avec elle. Il déborde. Et comme la navigation est
centrée, elle déborde des deux côtés à la fois, par-dessus ses voisins.

Le chrono en cours ajoutait à lui seul quatre boutons et deux compteurs à droite,
soit environ 170 px pris à la navigation. D'où le déclencheur observé : démarrer le
temps suffisait à faire chevaucher le menu.

### La langue avait été rangée là où l'on ne la cherche pas

Le sélecteur FR/EN existait toujours, mais il avait quitté la barre pour le menu du
compte (sous l'avatar). Sur ordinateur il n'y a pas d'autre navigation que cette
barre, et sur mobile le tiroir ne le proposait pas du tout. Un réglage qu'on change
une fois n'a pas besoin d'être permanent à l'écran, mais il doit avoir une adresse.

## Ce qui a été fait

**Le chrono en cours n'occupe plus la barre.** `components/temps/GlobalTimer.tsx`
affiche une pastille (l'horloge et le décompte, c'est-à-dire l'information) et
**un seul bouton, celui du geste du moment** : Pause quand ça tourne, Reprendre
quand c'est en pause, Enregistrer quand le temps attend d'être écrit. Décision
CEO : ce bouton reste dans la barre, à zéro clic. Les autres commandes
(Redémarrer, Arrêter, Annuler) vivent dans un panneau qui s'ouvre sur la
pastille, avec leur nom écrit plutôt qu'une icône à deviner ; l'heure facturable
et l'état y sont rappelés.

La barre passe d'environ 230 px à environ 130 px de chrono. Les 32 px qui
manquaient sont repris au champ de recherche (`xl:w-52` → `xl:w-44`), et 24 px
de plus au rembourrage des entrées de menu (`px-3.5` → `px-3`) : six libellés
valent mieux qu'un champ de recherche plus long.

**La navigation se replie sur mesure, jamais au jugé.**
`components/layout/Header.tsx` mesure : il repose les libellés, regarde si le
contenu tient encore dans la piste, et ne les retire que s'il déborde. L'icône porte
alors seule, le nom reste dans le `title` et l'`aria-label`, donc rien ne disparaît
pour un lecteur d'écran. La mesure est réversible et refaite à chaque changement de
largeur (`ResizeObserver`), au chargement des polices et au changement de langue. Le
repli s'écrit dans le DOM (`data-nav-compact`), pas dans un rendu React : une
navigation ne se re-rend pas parce qu'une fenêtre bouge.

**La langue reprend trois adresses**, au lieu d'une seule cachée :

| Où | Pourquoi |
|---|---|
| Menu du compte (inchangé) | là où l'on range ses préférences personnelles |
| Paramètres → « Affichage » | là où l'on va chercher un réglage |
| Tiroir mobile, au-dessus du profil | sur mobile, ce tiroir est toute la navigation |

La carte Paramètres dit aussi ce que le réglage fait vraiment : le choix suit le
navigateur, il ne change ni les documents, ni la langue des autres personnes du
cabinet.

## Deux serveurs de dev, un seul dossier de build

Découvert pendant le contrôle, et ça n'a rien à voir avec ce chantier : deux
serveurs de développement lancés en même temps sur ce dépôt (deux sessions de
travail, deux ports) écrivent dans le même `.next` et se détruisent
mutuellement leurs manifestes. L'application répond alors 500 partout alors
qu'aucun code n'est en cause. C'est ce qui a tué le serveur du 3001, puis celui
du 3020.

Règle : **un seul serveur de dev à la fois sur ce dépôt**. Changer de port n'y
change rien, le dossier de build est commun. Un `SAFE_DIST_DIR` a été essayé
puis retiré : Next réécrit alors `tsconfig.json` et `next-env.d.ts` pour
pointer vers le dossier isolé, ce qui salit le dépôt à chaque lancement.

## Vérifié à l'écran

Cabinet de démonstration local, 1470 px, chrono en marche.

| Contrôle | Résultat |
|---|---|
| Six libellés de menu, chrono en marche, bouton Pause compris | tous lisibles, 19,5 px de marge de chaque côté |
| Piste de navigation resserrée de 200 px | libellés retirés, icônes seules, 118,9 px de marge, aucun chevauchement |
| Place rendue | libellés revenus d'eux-mêmes |
| Bouton Pause dans la barre | met en pause, devient Reprendre, le décompte se fige |
| Chrono arrêté | le bouton devient Enregistrer, en plein |
| Pastille du chrono | panneau : « En cours · 0,1 h », Pause / Redémarrer / Arrêter |
| Panneau, chrono arrêté | « Arrêté, à enregistrer · 0,1 h », Enregistrer / Annuler |
| Paramètres → Affichage | carte présente, bascule FR/EN opérante |
| Menu du compte | ligne « Langue » présente, bascule opérante |
| Bascule EN | toute l'interface passe à l'anglais, y compris la barre |
| Aucune donnée créée | 218 entrées avant, 218 après |

Aussi : `tsc --noEmit` sans erreur, `next lint` sans avertissement,
`navigation-parity.test.ts` vert.

## Tiroir mobile, vérifié à son tour

Le navigateur piloté rend à largeur fixe et ne descend pas sous le seuil mobile.
Le tiroir a donc été ouvert depuis la page (clic sur le bouton de menu, qui
existe dans le DOM même masqué) et démasqué par une règle de style temporaire,
retirée ensuite. Le composant rendu est le vrai.

La ligne « Langue » y est, avec sa bascule FR/EN, entre la navigation et la
ligne « Profil · Mon compte ». Bascule vers EN depuis le tiroir : toute
l'interface passe à l'anglais, tiroir compris (« Language », « Today »,
« Practice »). Retour en FR depuis le tiroir : l'inverse.

## Fichiers

- `components/temps/GlobalTimer.tsx`
- `components/layout/Header.tsx`
- `components/layout/SidebarNav.tsx`
- `app/(app)/parametres/page.tsx`
- `app/globals.css`
- `messages/fr.json`, `messages/en.json`
