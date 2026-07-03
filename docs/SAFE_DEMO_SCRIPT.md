# Script de vente SAFE — appel fondateur (40-45 minutes)

> Scénario d'appel de vente complet, aligné sur l'offre fondatrice (5 places).
> Fil conducteur : on ne vend pas un logiciel, on propose un partenariat. Le cabinet aide à bâtir SAFE (retours terrain, référence), SAFE lui donne un an gratuit et un prix réduit à vie.
> Ton : « vous ». Pas de jargon. Le client est le héros.
> ⚠️ Préchauffage : la partie « offre » (phases 4 à 6) ne s'utilise qu'après le 2026-09-04, ou sur décision explicite du CEO. Avant : phases 1 à 3 seulement, valeur d'abord, zéro pitch de prix.

---

## Avant l'appel (5 min, hors chrono)

- Ouvrir l'app sur le **cabinet de démo** (voir `prisma/seeds/`), connecté en **avocat**.
- Second onglet prêt, connecté en **assistant(e)**, pour le moment navette.
- Vérifier que le tableau de bord montre des chiffres réalistes (fidéicommis, à recevoir, encaissé).
- Savoir combien de places fondatrices restent (chiffre réel, jamais inventé). Si les 5 sont prises, ce script ne s'applique plus.
- Relire la fiche du cabinet : domaine, taille, qui est l'adjointe, d'où vient le contact.

---

## Phase 1 — Ouverture : le cadre partenariat (3 min)

Objectif : poser dès la première minute que ce n'est pas un appel de vente classique.

Trame :

> « Avant de commencer, je vous dis d'où je viens. J'opère comme consultant auprès de cabinets d'avocats en droit de la famille. C'est en les aidant à gérer la facturation de A à Z, la comptabilité ainsi que l'administration que j'ai développé SAFE, un projet pilote qui fonctionne déjà. Aujourd'hui je cherche cinq cabinets, pas cinquante, pour continuer à le perfectionner avec plus d'utilisateurs réels. En échange, ces cinq cabinets ne paient rien pendant un an et gardent un prix réduit à vie. Je vous montre d'abord ce que ça fait, et à la fin vous me direz si ça vous parle. Ça vous va ? »

Règles :
- L'histoire vraie (consultant auprès de cabinets en droit de la famille, projet pilote développé sur le terrain) est l'accroche, pas les fonctionnalités.
- « Projet pilote » se dit toujours avec « fonctionne déjà » dans la même respiration : pilote = on le perfectionne ensemble, jamais = pas fini.
- Annoncer le plan de l'appel : démo courte, puis l'offre, puis leurs questions.
- Ne PAS détailler les prix ici. Juste planter « un an gratuit + prix réduit à vie » comme raison d'écouter.

## Phase 2 — Découverte (5 min)

Objectif : faire parler le cabinet sur sa réalité avant de montrer quoi que ce soit. Capturer leurs mots exacts (ils resserviront en phase 4 et en contenu build-in-public).

Questions, dans l'ordre :
1. « Aujourd'hui, votre fidéicommis, vous le suivez comment ? » (Excel, comptable externe, mémoire)
2. « Entre le travail fait et la facture envoyée, il se passe combien de temps ? »
3. « Qu'est-ce qui vous inquiéterait le plus si le Barreau débarquait demain matin ? »
4. « Votre adjointe passe combien de temps à courir après l'information ? »

Règles :
- Écouter plus que parler. Reformuler (« si je comprends bien, ce qui vous use, c'est... »).
- Noter les chiffres qu'ils donnent (heures perdues, factures en retard). Ils deviennent l'ancrage de la phase 4.

## Phase 3 — Démo (20 min)

### 3.1 L'accueil qui dit quoi faire (3 min) — rôle avocat
- Ouvrir `/tableau-de-bord`.
- Pointer le **coup d'œil avocat** en haut : « ce qui vous attend » (prêt pour revue, questions, document prêt, facture prête) **avant** les chiffres.
- Message : « En 15 secondes, vous voyez ce qui demande une décision, puis seulement après, vos indicateurs. »
- Montrer la carte **fidéicommis** : solde + dernier rapprochement. « Le risque numéro un d'une inspection, surveillé en continu. »

### 3.2 Un dossier, du début à la facture (5 min) — rôle avocat
- Ouvrir un **client** puis un **dossier** actif.
- Montrer les onglets du dossier (mandat, pièces, correspondance, fidéicommis, fermeture).
- Aller dans **Temps** : montrer des heures saisies, prêtes à facturer.
- Aller dans **Facturation** : montrer le hub (honoraires à facturer, débours, aging, taxes, rentabilité) + le registre des factures.

### 3.3 Le moment clé : l'assistant prépare, l'avocat approuve (5 min) — DEUX rôles
> C'est le cœur de la démo. Basculez entre les deux onglets.

- **Onglet assistant(e)** (`/aujourd'hui`) : l'assistant termine un document → clique **« Marquer comme final »**. Ou marque un dossier **« prêt pour revue »**.
- **Onglet avocat** (`/tableau-de-bord`) : rafraîchir → le **coup d'œil** affiche maintenant « Document prêt » / « Prêt pour revue ». L'avocat clique **Approuver** (ou Renvoyer avec une raison).
- Message : « Rien ne se perd entre l'assistant et vous. Le travail terminé remonte tout seul à la bonne personne, sans courriel, sans relance. »
- Bonus : montrer qu'une **facture validée** apparaît comme « facture prête à émettre » dans le coup d'œil de l'avocat.

### 3.4 L'argent compréhensible (3 min) — rôle avocat ou compta
- Ouvrir `/comptabilité` : montrer l'**intro doctrinale** (« comptabilité opérationnelle + export vers votre comptable ») + le **hub d'actions** (Encaisser, Dépenses, Contrôle mensuel, Exporter).
- Aller dans **Paiements** : montrer la **bannière des paiements non alloués** et la section **soldes créditeurs (surpaiements)** avec « Demander le remboursement ». « SAFE voit l'argent qui dort et le trop-payé, sans jamais y toucher. »

### 3.5 Fermer proprement (2 min) — rôle avocat
- Ouvrir un dossier, onglet **Fermeture**.
- Montrer l'**alerte** sur ce qui reste à régler (facture impayée, débours, fidéicommis) avant de fermer.
- Message : « Un dossier ne se ferme pas en laissant de l'argent ou un risque derrière. Et chaque fermeture laisse une trace, avec une lettre de fermeture pour le client. »

### 3.6 Transition vers l'offre (1 min)
- Récap avec LEURS mots de la phase 2 : « Vous m'avez dit que [leur douleur exacte]. Vous venez de voir comment SAFE règle ça. »
- « Maintenant je vous explique ce que je propose aux cinq cabinets fondateurs, et ce que je demande en échange. »

## Phase 4 — L'offre fondatrice (7 min)

Ordre de présentation NON négociable (décision 2026-06-29) : le prix se verrouille MAINTENANT, le gratuit est le cadeau. Ne jamais présenter le gratuit seul, sinon ancrage à zéro et tire-kickers.

### 4.1 Le prix régulier d'abord (ancrage)
> « SAFE, au tarif régulier, c'est 149 $ par mois par avocat, adjointe incluse. C'est le prix que paieront les cabinets qui arriveront après vous. »

### 4.2 Le verrouillage à vie
> « Pour les cinq cabinets fondateurs, le prix est gelé à 50 $ par mois, à vie. Pas pour un an, pas “tarif de lancement”. Tant que vous restez, ce prix ne bouge jamais, peu importe ce que SAFE coûtera dans cinq ans. »

- Si le cabinet préfère l'annuel : équivalent annuel réduit du même geste (voir note tarification ci-dessous). Le geste est le même : prix fondateur gelé à vie, facturé une fois par année au lieu de douze.

### 4.3 Le cadeau fondateur : 12 mois gratuits
> « Et parce que vous embarquez pendant qu'on bâtit encore, la première année est à 0 $. Pas un rabais, pas un essai : douze mois complets, gratuits, qui commencent seulement quand vous utilisez vraiment le système. Votre prix à vie, lui, se verrouille à la signature. »

- Toujours dans cet ordre : prix gelé D'ABORD, cadeau ENSUITE, dans la même phrase de décision.

### 4.4 La contrepartie : le partenariat (dire ce qu'on demande, honnêtement)
> « En échange, je vous demande trois choses. Un : vos retours. Une vraie conversation par mois sur ce qui marche et ce qui manque, c'est vous qui orientez ce qu'on construit. Deux : quand les résultats seront là, accepter d'en témoigner, avec vos chiffres, pour les prochains cabinets. Trois : si SAFE vous fait gagner ce que je pense, en parler autour de vous. C'est tout. Vous n'êtes pas un client béta qui subit, vous êtes un cabinet fondateur qui décide. »

Règles :
- Les trois demandes sont légères et nommées franchement. C'est ce qui rend le gratuit crédible (réciprocité, pas de piège caché).
- « C'est vous qui orientez ce qu'on construit » : le cabinet développe le produit. « En parler autour de vous » : le cabinet développe la clientèle. Les deux moitiés du partenariat de la stratégie.

### 4.5 L'option de rachat (seulement si le profil s'y prête)
> « Il y a une dernière option, réservée aux cinq fondateurs : 5 000 $ une fois, et vous ne payez plus jamais d'abonnement. Certains détestent les abonnements, c'est pour eux. »

- Positionner par l'émotion (« plus jamais d'abonnement »), jamais par le calcul de rentabilité.
- Ne pas insister. C'est une porte, pas un argument.

## Phase 5 — Objections prévues

Posture (règle CEO 2026-07-02) : ne jamais donner l'impression de tenir tête. Accord complet d'abord, jamais de question piège ni de contre-argument. On informe, l'avocat décide.

| Objection | Réponse (trame) |
|---|---|
| « Pourquoi gratuit ? Qu'est-ce que ça cache ? » | « Rien. J'ai besoin de cinq cabinets de référence avec de vrais chiffres avant de vendre au prix plein. Votre année gratuite, c'est mon budget marketing. Je préfère le donner à des cabinets qu'à Google. » |
| « Et si vous fermez dans deux ans ? » | « Vos données sont à vous, exportables en tout temps (Excel, QuickBooks, format comptable). Et c'est exactement pour ne pas fermer que je bâtis avec cinq cabinets payants à vie plutôt qu'avec du capital de risque. » |
| « Je n'ai pas le temps d'implanter un système. » | « La mise en route, on la fait avec vous, c'est inclus. Votre adjointe et moi. Vous, vous approuvez. » |
| « J'ai déjà mon Excel / mon comptable. » | « Et ça vous a menés jusqu'ici, donc ça fonctionne. Votre comptable garde toute sa place : SAFE lui prépare le travail et lui exporte tout. La seule chose que je vous propose, c'est de comparer avec ce que vous m'avez dit tantôt sur [leur douleur], et vous jugerez vous-même si ça vaut le changement. » |
| « Je veux y penser. » | « Bien sûr. Deux choses seulement : il reste [X] places sur cinq, et le prix à vie se verrouille à la signature, pas à la réflexion. Je vous propose de se reparler [date précise], et d'ici là je vous envoie la checklist des 8 points qu'un inspecteur du Barreau regarde en premier. » |
| « Pourquoi seulement cinq places ? » | « Parce que je m'engage à une conversation par mois avec chacun et à une mise en route faite main. À six, je mens à quelqu'un. » |

## Phase 6 — Clôture (2 min)

- Récap en une phrase : « Un an gratuit, 50 $ par mois à vie ensuite, mise en route incluse, conformité Barreau incluse. En échange : vos retours et, quand ça marchera, votre témoignage. »
- Prochaine étape unique et datée : signature du cabinet fondateur, ou deuxième appel avec l'adjointe présente (souvent le vrai décideur d'usage, cf. positionnement copilote du copilote).
- Ne jamais terminer sur « je vous laisse y réfléchir » sans date.

---

## Notes

- Si une donnée manque pendant la démo, basculer sur un autre dossier du cabinet de démo plutôt que d'improviser.
- Ne jamais montrer la console SAFE Inc. ni l'impersonation (interne, hors périmètre client).
- Rareté toujours vraie : annoncer le nombre réel de places restantes. La rareté inventée se voit et détruit la confiance.
- Tarification (source : `lib/tarification.ts`) : régulier 149 $/mois (119 $/mois en annuel), fondateur 50 $/mois à vie, 12 mois gratuits, rachat 5 000 $. ⚠️ Le prix fondateur ANNUEL n'est pas encore défini dans `lib/tarification.ts`. Proposition à valider : 480 $/an (équivalent 40 $/mois, même rabais de ~20 % que les paliers réguliers). Ne pas le citer en appel tant que non validé.
