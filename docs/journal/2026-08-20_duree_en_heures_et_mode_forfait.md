# 2026-08-20 — La durée se saisit en heures, et le mode forfait redevient atteignable

## Demande

Passer le champ de durée des minutes aux heures : 1,5 ou 1.5 pour une heure et demie.
Que le chronomètre soit lui aussi traduit en heures pendant qu'il tourne. Et pouvoir
mettre le mode forfait dans le système.

## Ce qui n'allait pas

Le cabinet facture en heures. Le taux est horaire, la ligne de facture porte des heures,
le rapport de rentabilité compte des heures. Un seul endroit demandait des minutes :
le champ de saisie, c'est-à-dire précisément celui où quelqu'un tape.

L'avocate faisait donc la conversion de tête à l'aller, et la refaisait en sens inverse
pour se relire. Deux occasions de se tromper à chaque entrée, sur le registre qui décide
de ce qui sera facturé.

## Ce qui a été fait

**Un seul module de traduction**, `lib/temps/duree.ts`. La base garde `dureeMinutes` en
entier : rien à migrer, rien à recalculer, aucune facture existante déplacée. Seule la
surface change d'unité.

Le champ lit ce que les gens tapent réellement, dans cet ordre :

| Ce qui est écrit | Ce qui est enregistré |
|---|---|
| `1,5` `1.5` `1` `,5` | heures décimales |
| `1h30` `1 h 30` `1h` `1:30` | heures et minutes dictées |
| `90m` `45 min` | sortie de secours pour qui pense encore en minutes |

Sous le champ, un écho permanent : « 1,5 » affiche « = 1 h 30 ». Sous le taux, la
conséquence : « 1,75 h à ce taux : 612,50 $ ». Rien ne s'enregistre sans que le montant
ait été montré avant.

**Le piège de la bascule d'unité a été fermé.** Quelqu'un qui a tapé `60` pendant des
mois pour dire une heure va le retaper. En heures, `60` vaut soixante heures et neuf
mille dollars. Le champ refuse au-delà de 24 h et dit quoi écrire à la place. C'est
la seule raison pour laquelle il y a un plafond.

**Le chronomètre annonce l'heure facturable pendant qu'il tourne**, dans la barre du
haut comme dans le bloc de saisie rapide : `00:47:12` et, à côté, `0,8 h`. C'est le
nombre arrondi comme il le sera à l'enregistrement, pas un autre : un chrono qui annonce
0,75 h et une fiche qui écrit 0,8 h font douter des deux.

Le registre, la grille de semaine et la fenêtre de fin de rédaction affichent désormais
la même unité que le champ. Le survol garde la lecture en heures et minutes.

**Un test verrouille l'aller-retour** : pour chacune des 1440 minutes d'une journée,
afficher puis relire rend la minute d'origine. Sans ça, rouvrir une fiche pour corriger
une virgule aurait déplacé la durée d'une minute à chaque passage.

## Le défaut trouvé en chemin

Le réglage du mode de facturation (horaire, forfait, mixte) existait déjà dans l'écran
des paramètres de facture. Il ne s'ouvrait pas.

`actions.ts` est un fichier `"use server"`, et il exportait la liste des trois modes en
constante. Next.js n'autorise que des fonctions asynchrones à sortir d'un tel fichier :
le module échouait au chargement, et l'écran entier des réglages de facture répondait
500. La compilation TypeScript ne le voit pas, les tests non plus. Seul le navigateur
le dit.

La liste vit maintenant dans `billing-modes.ts`, à côté. L'écran répond, les trois
modes se choisissent. Vérifié avant et après : 500, puis 200.

Un balayage a confirmé qu'aucun autre fichier `"use server"` du projet n'exporte autre
chose qu'une fonction.

## Le mode mixte est posé en production

Inventaire fait avant d'écrire : sept cabinets en production, dont Derisier et Kouame
déjà en mixte et Cayard en forfait. Le mode tourne donc déjà chez de vrais cabinets.

Le Cabinet Test (`cmr6cd7xy00000yti0hg5nd73`, ptiahou@gmail.com) était le seul des
nôtres encore en horaire, et par défaut : la clé n'avait jamais été écrite. Il est
passé en **mixte** le 2026-08-20, avec `scripts/definir-mode-facturation.mjs`, dont
le chemin d'écriture a d'abord été éprouvé en local (fusion vérifiée : taxes, taux par
défaut et fidéicommis intacts, seule `principal` bouge).

Aucun déploiement n'était nécessaire : la vue mixte est dans la release servie.

## Le second défaut, sur l'écran qu'on venait d'allumer

L'activité récente de la vue mixte formatait les dates sans `timeZone: "UTC"`. Or le
formulaire pose les jours à minuit UTC. Au Québec, minuit UTC se lit 20 h la veille :
la liste affichait **un jour de moins** que le registre juste à côté, sur le même écran.

Corrigé dans `TempsMixteView`. Le registre, lui, passait déjà par `formatCalendarDate`
et n'a jamais menti.

## Ce qui reste vrai

Le mode forfait, une fois choisi, donne ce qui était déjà construit : le registre de
tâches et sa grille de prix en forfait pur, et en mixte la bascule Forfait / Heures à
chaque ajout. Aucun de ces écrans n'a été touché aujourd'hui.

## Déployé

Commit `efef763` sur `feat/encaissement-interac`, poussé, puis déployé en production
avec `vercel --prod --archive=tgz` (39 430 fichiers, au-delà du plafond de 15 000 de
l'envoi non archivé).

Le déploiement de 12:25 porte les alias `safecabinet.ca` et `www.safecabinet.ca` : il
sert la production. Journal de build : « 55 migrations found », **« No pending
migrations to apply »**. Aucun schéma touché, ce qui était attendu puisque ce lot
n'apporte aucune migration. Les trois migrations d'abonnement, elles, avaient déjà été
appliquées par le déploiement de 12:07.

Vérifié en production, sans session, sur `/ds-preview/temps` : le registre affiche
« 2,5 h », et la fenêtre de saisie affiche « Durée (heures) » avec l'écho « = 2 h 30 ».
