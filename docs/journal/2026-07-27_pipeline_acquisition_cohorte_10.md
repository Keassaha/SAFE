# 2026-07-27 · Pipeline d'acquisition systématisé, cohorte de 10

## Décision CEO

Nouvelle offre fondatrice, qui remplace celle en ligne :

- **10 places** (au lieu de 5)
- **12 mois à tarif réduit** : 50 $/mois solo, 75 $/mois cabinet avec adjointe
- Plus de « 12 mois gratuits », plus de « prix gelé à vie »
- Cadence de prospection engagée : **4 h par semaine, deux blocs**

Cette décision met fin de fait à la règle de préchauffage « pas de conversion avant le
2026-09-04 » posée le 2026-06-04. On passe en mode conversion, avec les munitions
partiellement prêtes seulement (vidéo 3 min pas encore tournée, pas de case study).

## Livré

- `docs/marketing/ventes/PIPELINE_ACQUISITION_COHORTE_10.md` : la machine complète, cinq
  étages (sourcer, toucher, prouver, démontrer, embarquer), scripts d'appel et de
  courriel réécrits pour la nouvelle offre, cadence de deux blocs, règles d'arrêt.
- `docs/marketing/ventes/SUIVI_COHORTE.md` : fichier de suivi, une ligne par cabinet,
  compteurs hebdomadaires, section verbatims.

## Le chiffre inconfortable

Le calcul du funnel, avec des hypothèses prudentes et non mesurées, donne **environ 0,58
signature par semaine** en appel à froid pur, soit **17 semaines pour 10 signatures**,
soit fin novembre 2026. Ce chiffre est écrit dans le document exprès, pour éviter
l'abandon en semaine 6 par fausse conclusion d'échec.

Les trois leviers qui compriment ce délai sont la référence de la cliente actuelle, la
porte d'entrée tenue de livres, et les relais associatifs. Objectif révisé proposé : 10
signatures d'ici le 2026-11-30, dont au moins 4 hors appel à froid.

## Friction identifiée

`lib/tarification.ts:111` affirme « strictement limitée à 5 cabinets » et le site vend
12 mois gratuits + 50 $ à vie. Un prospect qui compare le courriel et la landing voit
deux offres différentes. **Bloquant avant le premier appel.**

## Trois bloquants avant le premier appel, environ une journée de travail

1. Tourner la vidéo de 3 minutes (kit déjà écrit).
2. Constituer et scorer une liste de 50 cabinets.
3. Aligner landing et `lib/tarification.ts` sur 10 places / 50 $ / 75 $ / 12 mois.

## Correction de contexte

La mémoire projet citait `docs/marketing/ventes/PLAYBOOK_NEGOCIATION.md` comme existant.
Le fichier n'est pas dans le repo. Même chose pour `STRATEGIE_DM_OUTBOUND.md`, dont le
contenu vit apparemment dans `docs/marketing/linkedin/LINKEDIN_PLAYBOOK.md`.

## Suite dans la même session : offre fondatrice v2

Le CEO a demandé d'améliorer l'offre avant d'aligner le code. Écrit :
`docs/marketing/ventes/OFFRE_FONDATRICE_v2.md`.

Cinq défauts identifiés dans l'offre du matin : la falaise du 13e mois (50 $ qui devient
99 $ d'un coup, au moment exact où le témoignage prend de la valeur), un rabais présenté
comme une offre, une rareté affaiblie pendant que le prix montait, une contrepartie sans
forme, et aucune réponse aux deux vraies peurs de l'avocat (le temps de migration, et
« et si vous arrêtez »).

Principe de la v2 : ne pas baisser le prix davantage, monter ce qu'il y a dedans et
retirer le risque. Mise en route faite par le fondateur, reprise de l'historique,
formation de l'adjointe, sortie libre, remboursement 60 jours, export des données, liste
écrite de ce que SAFE ne fait pas remise avant signature. Tarif fondateur gelé après 12
mois à 79 $ / 119 $ au lieu de sauter à 99 $ / 149 $.

Décision de garde-fou : **le rattrapage comptable n'entre pas dans l'offre**, seulement un
diagnostic de deux heures. L'offrir gratuitement détruirait le prix du service de tenue
de livres qui finance la runway.

Calcul de capacité posé : ~25 h par cabinet fondateur la première année, donc 250 h pour
dix, soit ~5 h par semaine en plus des 4 h de prospection. **Neuf heures par semaine hors
développement produit.** D'où le remplissage par vagues de deux cabinets par mois, ce qui
devient aussi l'argument de rareté honnête.

Trois décisions laissées au CEO : le tarif après 12 mois, le caractère contractuel ou
moral des 30 minutes mensuelles, et l'acceptation des 9 h hebdomadaires.

## Application de la v2 au site

CEO a validé et demandé l'application. Décision 1 tranchée sur la recommandation :
tarif fondateur gelé à 79 $ / 119 $ après les 12 mois. Décisions 2 et 3 ne touchent pas
le site et restent ouvertes.

**Modifié :**

- `lib/tarification.ts` : `placesTotal` 5 → 10, `premiereAnneeCabinet` 100 → 75, ajout de
  `apresSolo: 79`, `apresCabinet: 119`, `annuelSolo: 550`, `annuelCabinet: 825`,
  `garantieJours: 60`, `miseEnRouteParMois: 2`. FAQ : la question « offre fondatrice »
  corrigée, et quatre questions ajoutées (pourquoi dix places, ce qui est fait par nous,
  changement d'avis, contrepartie).
- `components/public-site/PricingPage.tsx` : section fondateurs réécrite sur la v2, et
  branchée sur `TARIFICATION` au lieu de chiffres en dur. Compteur de places réel.
- `components/audit-report/pages/OffrePage.tsx` : page 06 du rapport envoyé aux
  prospects, alignée sur le gel du tarif.

**Vérifié dans le navigateur** : `/tarification` et `/audit/demo` affichent bien 10
places, 50 $ / 75 $, gel à 79 $ / 119 $, et « Une place sur 10 est déjà prise ».
`tsc --noEmit` passe. La capture d'écran est restée blanche parce que l'onglet de
prévisualisation était masqué, ce qui met en pause les animations framer-motion. Contenu
validé par lecture du DOM.

**Dette laissée en place, volontairement** : huit composants ne sont importés nulle part
et portent encore d'anciennes offres contradictoires, dont `components/marketing/FinalCTA.tsx`
et `components/onboarding/OnboardingChat.tsx` qui annoncent « 50 places fondatrices, tarif
verrouillé à vie ». Aucun impact visiteur aujourd'hui. Risque réel le jour où quelqu'un
réactive un de ces écrans. À supprimer ou à aligner dans une passe séparée.

## Décision 3 tranchée : ne pas vendre ses heures

Le CEO refuse les 9 h par semaine. Formulation exacte : « je veux pas mettre d'heures pour
me protéger ». C'est devenu une règle dure du projet, pas un arbitrage ponctuel.

Piège évité : retirer le done-for-you aurait ramené l'offre à un simple rabais, et le
done-for-you est précisément ce qui fait tomber l'effort perçu du côté du cabinet. La
sortie n'était donc pas de retirer la promesse, mais de changer la livraison.

`OFFRE_FONDATRICE_v2.md` §5 refaite. 25 h → ~8 h par cabinet :

| Poste | Avant | Après | Mécanisme |
|---|---|---|---|
| Mise en route | 4 h | 1,5 h | `lib/configuration/` génère le paquet, on valide |
| Reprise historique | 4 h | 1 h | Importateur bâti une fois, plafond annoncé |
| Formation adjointe | 3 h | 1 h | Vidéos courtes + une séance live de 45 min |
| Diagnostic des livres | 2 h | 0 h | Sorti du forfait, proposé à la demande |
| Appels de retour | 6 h | 2,5 h | Mensuel 3 mois, puis trimestriel |
| Support | 6 h | 2 h | Atelier collectif hebdomadaire au lieu de 10 fils |

Pic réel recalculé : ~14 h dans le mois le plus chargé, soit 3 h par semaine, 7 h avec la
prospection, et seulement pendant les cinq mois de remplissage.

Investissement une fois : ~25 h (importateur, bibliothèque vidéo, branchement du paquet de
configuration) pour en récupérer ~75. À faire avant le troisième cabinet, pas avant le
premier : le premier se fait à la main exprès, c'est lui qui dit quoi automatiser.

Plancher posé : sous ~6 h par cabinet, la promesse devient fausse. À ce moment le levier
n'est plus la livraison mais le nombre de places, six au lieu de dix.

Site réaligné dans la foulée (`PricingPage.tsx` et FAQ de `lib/tarification.ts`) : la
formation de l'adjointe n'annonce plus « deux séances », l'atelier hebdomadaire est ajouté,
et la contrepartie passe à mensuelle trois mois puis trimestrielle. Vérifié en navigateur,
tsc vert.

## État du CEO

_À remplir par le CEO : énergie, ce qui bloque, ce qui a été pensé pendant la session._
