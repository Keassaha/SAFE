# Matière pour le prochain post — la collecte de pièces

> Capturée le 2026-08-19, pendant le build du module de collecte (commit `a645eff`).
> Statut : matière brute validée par le CEO. À développer au format 4 sections
> (texte du post · premier commentaire CTA · récap des choix · prompt de vérification).

---

## Ce qui est là maintenant

**Envoyer le lien.** Un bloc sur la page du dossier : créer, copier, voir la date
d'expiration, couper l'accès. Si le navigateur refuse le presse-papiers, le lien reste
sélectionnable à l'écran plutôt que de vous laisser un bouton mort.

**Décider d'une pièce.** Accepter, ou demander un remplacement. Deux règles portées par
le serveur, pas seulement par l'écran :

- une pièce jamais reçue ne se décide pas, il n'y a rien à juger ;
- un remplacement exige un motif d'au moins dix caractères, sinon le client redépose la
  même chose et la boucle tourne sans avancer. Le motif s'affiche à côté de la pièce,
  chez lui.

Aucun contrôle automatique ne fait passer une pièce à « acceptée ». C'est vous qui
décidez, et la décision est signée. Même règle qu'au journal comptable : une suggestion
n'est pas une décision.

## Ce que ça change concrètement à votre procédure

Aujourd'hui, réclamer des pièces, c'est un courriel, puis un rappel, puis un deuxième,
puis chercher dans la boîte de réception ce qui est arrivé et ce qui manque. La liste
vit dans votre tête ou dans un fil de courriels.

Après : vous envoyez un lien une fois. Le client voit sa propre liste, dépose, et la
page du dossier vous dit qui manque quoi. Quand un document est illisible ou incomplet,
votre refus part avec la raison, donc le deuxième dépôt est le bon. Le relevé de compte
n'arrive plus quatre fois de suite parce que personne n'a dit ce qui clochait.

Le gain n'est pas le temps de manipulation, c'est le nombre d'allers-retours.

---

## Angles possibles pour le post

**Angle A, le plus fort : la phrase de refus.** Le détail qui porte tout le post, c'est
le motif obligatoire de dix caractères. Un refus sans raison fait redéposer la même
chose. C'est vrai dans un logiciel et c'est vrai entre deux humains. On mesure la
qualité d'un aller-retour à ce qu'il évite au suivant.

**Angle B : le client n'a pas de compte.** Pas de mot de passe à créer, pas
d'application à installer, pas de « veuillez vous inscrire pour déposer votre relevé ».
Un lien, une liste, un dépôt. Chaque étape ajoutée entre le client et le document est
une étape où il abandonne.

**Angle C : ce que le client ne voit pas.** Il voit sa liste à lui. Il ne voit ni les
pièces attendues de la partie adverse, ni les notes du dossier. Le cloisonnement n'est
pas une option de configuration, c'est la requête elle-même qui ne va pas les chercher.

**Angle D, plus risqué mais honnête : trois briques construites et rien d'utilisable.**
Le moteur, l'écran et la page client existaient depuis trois jours. Il manquait le
bouton qui engendre le lien et le geste qui décide d'une pièce. Tant que ces deux gestes
manquaient, la fonctionnalité comptait comme non faite. Transposable : la partie qu'on
remet à plus tard est souvent celle qui rend le reste utilisable.

## Garde-fous avant publication

- Voix « vous », zéro em-dash en milieu de phrase, ton posé (ne pas appuyer sur la peur
  du dossier incomplet, mener par le calme).
- Le héros est l'adjointe qui court après les pièces, pas le logiciel.
- Pas de vocabulaire technique : « lien », « liste », « dépôt ». Jamais « token »,
  « portail client », « workflow ».
- Ne pas laisser croire que c'est en service chez un cabinet : au 2026-08-19 la
  fonctionnalité n'est pas encore promue en production et n'a été vue par aucun client.
  Formuler au présent de construction (« on vient de terminer »), pas au présent
  d'usage.
