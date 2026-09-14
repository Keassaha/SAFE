# 2026-09-14 — La ligne de groupe ne paraît plus quand elle ne groupe rien

Consigne du CEO, capture à l'appui : « cette ligne pour moi n'est pas nécessaire », sur
« Services Longueuil inc. · 1 dossier — 1 006,03 $ » en tête des honoraires à facturer.
Puis, sur la proposition montrée en image : « la ligne de groupe, on met à exécution. »

## Ce que la ligne portait

Quatre choses, vérifiées dans le code avant d'y toucher :

| Ce qu'elle affichait | Ce que ça valait à un seul dossier |
|---|---|
| Le total du client | Identique à celui de la ligne du dessous |
| « 1 dossier » | Ne groupe rien |
| **Le nom du client** | **Écrit nulle part ailleurs dans ce tableau** |
| « Une facture pour les N dossiers » | Déjà absent : réservé à deux dossiers et plus |

La retirer purement et simplement aurait donc fait disparaître le nom du client : la
ligne du dossier ne montre que le numéro, l'intitulé et l'avocat.

## Ce qui a été fait

**Un client, un dossier : plus de tête de groupe.** Son nom passe sur la ligne du
dossier, au-dessus de la référence, dans la grammaire des registres livrés cette
semaine — le nom en encre moyenne, le reste en gris.

**Deux dossiers ou plus : la tête reste.** Là elle additionne vraiment, et elle porte le
lien « Une seule facture pour les N dossiers », seul endroit du produit qui prépare une
facture groupée. Ses lignes filles ne répètent pas le nom du client, déjà écrit juste
au-dessus.

**L'en-tête de colonne devient « Client · dossier »**, puisqu'elle porte maintenant les
deux.

## Une route de contrôle, pour un écran qui n'en avait pas

`/ds-preview/honoraires` monte le **vrai composant** en semant ses données dans le cache
de requêtes plutôt qu'en les servant par l'API. C'était le seul moyen de le regarder sans
session, et les fixtures montrent les deux cas d'un coup : deux clients à un dossier, un
client à trois.

## Vérifications

- Typecheck vert, parité FR/EN parfaite.
- Capture du composant réel : `docs/journal/captures/2026-09-14_ligne_de_groupe_apres.png`.
  On y lit les deux comportements côte à côte.

## Ce que je n'ai pas pu vérifier

- L'écran avec les vraies données du cabinet.
- Le cas d'un client dont les dossiers seraient séparés par la pagination : la tête de
  groupe se calcule sur la tranche affichée, comme avant ce lot. Si un client à trois
  dossiers se trouvait à cheval sur deux pages, sa tête reparaîtrait en haut de la
  seconde — comportement inchangé, non corrigé ici.
