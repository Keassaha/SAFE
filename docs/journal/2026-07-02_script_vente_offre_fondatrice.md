# 2026-07-02 — Script de vente retravaillé autour de l'offre fondatrice

## Contexte
Le CEO veut aligner le script de vente sur la nouvelle stratégie : 12 mois 100 % gratuits + prix mensuel (et annuel) réduit à vie, en échange d'un partenariat (le cabinet aide à développer le produit et la clientèle). L'offre elle-même était déjà décidée (journal 2026-06-29, `lib/tarification.ts`), mais le script d'appel (`docs/SAFE_DEMO_SCRIPT.md`) datait d'avant : clôture encore sur « audit gratuit ou démarrage pilote », aucune présentation d'offre, aucune objection.

## Buildé
Refonte complète de `docs/SAFE_DEMO_SCRIPT.md` : de « script de démo 20 min » à « script de vente appel fondateur 40-45 min », 6 phases :
1. **Ouverture partenariat** : histoire vraie du consultant pour un cabinet de famille comme accroche, annonce du cadre (« cinq cabinets, pas cinquante »).
2. **Découverte** : 4 questions pour capturer les mots exacts du cabinet (réutilisés en phase 4 et en build-in-public).
3. **Démo 20 min** : conservée telle quelle (elle était bonne), + transition qui recycle les mots de la découverte.
4. **Offre fondatrice** dans l'ordre décidé le 2026-06-29 : ancrage 149 $ → verrouillage 50 $/mois à vie → cadeau 12 mois gratuits (jamais le gratuit seul) → contrepartie partenariat nommée honnêtement (retours mensuels = développer le produit ; témoignage + bouche-à-oreille = développer la clientèle) → rachat 5 000 $ en option discrète.
5. **6 objections** avec trames (pourquoi gratuit, et si vous fermez, pas le temps, j'ai mon Excel, je veux y penser, pourquoi 5 places).
6. **Clôture** : récap une phrase + prochaine étape datée, jamais « réfléchissez-y » sans date.

## Décisions intégrées (existantes, pas nouvelles)
- Prix verrouillé à la signature, gratuit = cadeau fondateur, jamais séparés (anti ancrage-à-zéro).
- Rachat positionné par l'émotion, pas le calcul.
- Rareté toujours vraie (annoncer le chiffre réel de places restantes).
- Garde-fou préchauffage dans le script : phases 4-6 seulement après le 2026-09-04 ou sur décision CEO.

## À VALIDER PAR LE CEO
- **Prix fondateur annuel** : n'existe pas dans `lib/tarification.ts`. Proposition : **480 $/an (équivalent 40 $/mois, ~20 % de rabais comme les paliers réguliers)**. Tant que non validé, ne pas le citer en appel. Si validé : ajouter `abonnementVieAnnuel` dans `lib/tarification.ts` + vitrine.
- La demande de partenariat formalisée en 3 engagements (1 conversation/mois, témoignage avec chiffres, bouche-à-oreille) : à confirmer que c'est le bon niveau d'engagement demandé.

## Ajout même journée : script d'appel + courriel fondateur
Nouveau fichier `docs/marketing/ventes/SCRIPT_APPEL_ET_EMAIL_FONDATEUR.md`. Logique en chaîne : appel 60-90 s (objectif unique = adresse + permission, jamais de vente au téléphone) → courriel le jour même (porte l'offre, un seul lien = checklist Barreau, un seul CTA = répondre « ok ») → relance unique J+5/6 → appel fondateur 40-45 min (SAFE_DEMO_SCRIPT.md). 7 objections téléphone nuancées (v2 même journée, demande CEO : valider d'abord, porte de sortie honnête, on ne « gagne » pas l'objection, on gagne le droit d'envoyer le courriel) + message boîte vocale sans numéro de rappel. Ajouts v2 : « c'est Me X qui décide » (adjointe) et « pas le temps ». ⚠️ DÉCISION CEO (même journée, v3) : **pas de checklist aux avocats** (« ils sont supposés savoir ça mieux que moi »). Asset d'appui remplacé par une **vidéo Loom de 3 minutes** montrant le projet en action (facturation, fidéicommis, tableau de bord) : cohérent avec « le projet fonctionne déjà », preuve au lieu de leçon, et déjà identifié comme accroche le 2026-06-29 (email + Loom). La checklist 8 points reste réservée au canal DM adjointes (elles, ça les aide vraiment). Objection « pas intéressé » : désormais sortie propre sans cadeau de consolation. Nouveau bloquant avant tout envoi : enregistrer la vidéo 3 min sur le cabinet de démo. Note : l'appel comme canal d'ouverture assume la nouvelle stratégie offre fondatrice ; la doctrine 2026-06-11 (« appel jamais en ouverture ») évolue sur décision CEO de ce jour.

## Ajustement positionnement (même journée, décision CEO)
Reformulation de l'accroche dans les deux scripts : le CEO opère comme consultant **auprès de cabinets d'avocats en droit de la famille** (pluriel, pas « un cabinet ») et développe un **projet pilote** pour les aider à gérer **administration, comptabilité et facturation**. Le projet est développé et fonctionne ; il cherche plus d'utilisateurs pour continuer à le perfectionner. Garde-fou de wording ajouté : « projet pilote » toujours accompagné de « fonctionne déjà » (pilote = on le perfectionne ensemble, jamais = pas fini). Formulation finale du périmètre (décision CEO, même journée) : « la facturation de A à Z, la comptabilité ainsi que l'administration » (la facturation en premier, c'est l'argument le plus concret).

## Objections v3 : posture non-confrontationnelle (règle CEO)
Deuxième passe de nuance demandée par le CEO : l'avocat ne doit jamais avoir l'impression qu'on lui tient tête. Réécriture des 7 objections téléphone + adoucissement de l'objection Excel du script de démo. Supprimé : la « question franche » (mise à l'épreuve), le jab « c'est dans les cabinets où tout le monde court que la facturation traîne », la résistance sur info@ (on obéit, on offre juste d'ajouter un nom en objet), la dernière carte après un « pas intéressé » (sortie remerciée, point). Règle sauvegardée en mémoire permanente (feedback_vente_non_confrontation) : accord complet sans « mais », zéro contre-argument, un non est final. Raison de fond : un avocat est un professionnel de l'argumentation, toute joute le fait basculer en mode plaideur.

## Principe directeur cristallisé (CEO, fin de session)
« Dans tous les cas, le plus important est d'apporter la preuve visuelle que tout fonctionne correctement. » Gravé en tête de SCRIPT_APPEL_ET_EMAIL_FONDATEUR.md : le funnel est une escalade de preuve (appel annonce → courriel prouve avec la vidéo 3 min → appel fondateur démontre en live → fondateurs confirment avec chiffres/témoignages). Corollaire : le cabinet de démo devient l'asset de vente numéro un, à garder impeccable. Même doctrine que côté produit (« terminé » = à l'écran) : une seule philosophie, montrer.

## Ajout : structure email + plan vidéo 3 min
Nouveau fichier `docs/marketing/ventes/STRUCTURE_EMAIL_ET_PLAN_VIDEO.md`. Courriel décomposé en 8 blocs à rôle unique (objet, pont, qui je suis, offre 3 puces, échange, CTA « ok », signature, P.S. preuve vidéo) + règles transverses (10 lignes max, 1 lien, 1 CTA, zéro jargon). Plan de tournage Loom 3 min chronométré en 6 séquences (accroche 15 s → tableau de bord/administration → dossier jusqu'à la facture → navette assistante/avocat = moment clé → comptabilité → clôture sobre sur le CTA du courriel), avec checklist avant tournage (cabinet démo impeccable, 2 onglets, jamais la console interne) et règles (mot « simple » interdit, une action = une phrase, vocabulaire du cabinet). Réutilisations prévues : P.S. courriel, relances, version 90 s pour DM adjointes plus tard.

## Idées à propager (content-bank / posts)
- « Ce que je demande en échange d'un an gratuit » : nommer franchement la contrepartie rend le gratuit crédible (réciprocité vs piège).
- « Pourquoi seulement 5 places : à six, je mens à quelqu'un » (rareté honnête comme argument de vente).
- « Je préfère donner mon budget marketing à des cabinets qu'à Google » (l'année gratuite = budget d'acquisition).
