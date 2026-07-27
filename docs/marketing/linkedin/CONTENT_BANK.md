# Content bank LinkedIn — SAFE

> Idées de posts capturées en build-in-public (mode PRÉCHAUFFAGE). Chaque post suit le format 4 sections.

---

## Post — « 47 $ au lieu de 17 $ » (l'IA n'écrit jamais seule)

Statut : prêt. Capturé le 2026-07-06 pendant le build de l'import de reçu.

### 1. Texte du post

Cette semaine, notre logiciel a lu 47 $ sur un reçu qui en affichait 17 $.

On vous le raconte exprès.

Le reçu était une photo prise de travers, un peu floue. La lecture automatique s'est trompée sur le total. Sur beaucoup d'outils, ce 47 $ serait entré tel quel dans les livres, et personne ne l'aurait vu passer avant les impôts ou une inspection.

Chez nous, non.

La vraie peur d'une adjointe, ce n'est pas « est-ce que le logiciel sait lire un reçu ». C'est « est-ce qu'il va glisser un mauvais chiffre dans mes livres, un chiffre que je vais découvrir six mois trop tard ».

Alors la décision est simple : l'intelligence artificielle n'écrit jamais seule. Elle lit le reçu, elle pré-remplit la dépense, et elle vous montre tout côte à côte avec l'image. Vous confirmez d'un coup d'œil, vous corrigez au besoin. Le chiffre n'entre dans les livres que quand vous l'avez validé.

Ce jour-là, le 47 $ est redevenu 17 $ en deux secondes.

On préfère vous montrer nos ratés que vous vendre une perfection qui n'existe pas. Un outil qui lit à votre place vous fait gagner du temps. Un outil qui écrit à votre place sans vous demander vous fait perdre confiance.

### 2. Premier commentaire (CTA + lien)

On documente tout ce qu'on construit, les réussites comme les ratés, ici même. Abonnez-vous si ça vous parle.

Une question sincère pour les gens qui tiennent la compta d'un cabinet : aujourd'hui, vos reçus, vous les gérez comment. Photo, papier dans une boîte, ressaisie à la main. Dites-le en commentaire, ça nourrit ce qu'on construit.

### 3. Récap des choix

- Angle : preuve par le raté, pas promesse de perfection (cohérent « preuve visuelle avant tout »).
- Héros : l'adjointe. Le logiciel est le filet de sécurité, jamais celui qui décide (copilote du copilote).
- Voix « vous », zéro em-dash, zéro jargon (« lecture automatique » plutôt qu'« OCR »).
- Pas de pitch, pas d'appel à convertir (mode PRÉCHAUFFAGE). CTA = suivre + engager.

### 4. Prompt de vérification factuelle (Perplexity)

Colle ceci dans Perplexity avant publication :

> Vérifie ces affirmations, contexte Québec, cabinets d'avocats :
> 1. La lecture automatique (OCR / vision par IA) fait-elle couramment des erreurs de montant sur des reçus photographiés flous ou de travers ? Ordre de grandeur des taux d'erreur connus.
> 2. Les livres comptables et la comptabilité en fidéicommis d'un cabinet d'avocats au Québec sont-ils sujets à inspection par le Barreau du Québec ?
> 3. Une erreur de saisie de montant dans les livres peut-elle être détectée tardivement (déclaration de taxes, fin d'exercice, inspection) ?
> Donne des sources pour chaque point et signale toute affirmation trop forte ou inexacte.

---

## Idée capturée — « On a remplacé notre plus beau schéma par une fiche de dossier »

Statut : idée capturée le 2026-07-25 pendant la refonte des visuels de la landing. À développer au format 4 sections.

L'angle : sur notre page d'accueil, le visuel le plus travaillé était un beau diagramme abstrait, un cercle central, quatre bulles, des courbes. Tout le monde fait ça. On l'a supprimé et remplacé par une simple fiche de dossier : Succession Tremblay, 6,5 heures approuvées, une facture de 3 200 $, une avance en fiducie rapprochée, une échéance au 30 juin. Personne ne confie son fidéicommis à un diagramme. On le confie à un outil dont on voit qu'il tient un dossier comme on le tient soi-même. Leçon build-in-public : montrer le produit, pas le concept (cohérent « preuve visuelle avant tout »).

---

## Idée capturée — « La maquette disait 2 500 $. La réalité disait 0 $. »

Statut : idée capturée le 2026-07-25 pendant le portage du redesign en structure parallèle /v2. À développer au format 4 sections.

L'angle : on avait une maquette magnifique de la fiche de dossier. Solde en fidéicommis affiché : 2 500 $. Puis on l'a branchée sur les vraies données du même dossier : 0 $. Rien en fiducie, aucune facture, 2 minutes de temps saisi. La maquette flattait, la réalité informe. C'est exactement pour ça qu'on ne juge jamais un écran sur une maquette : on le rebranche sur le vrai dossier, et on regarde s'il aide encore. Leçon build-in-public : une interface se juge sur des données vraies, jamais sur des données de démonstration (cohérent « brancher avant de bâtir » et « preuve visuelle avant tout »).

---

## Idée capturée — « On a fait tourner notre logo en 3D. Pas pour faire joli. »

Statut : idée capturée le 2026-07-25 pendant la construction du prototype d'expérience 3D de la landing. À développer au format 4 sections.

L'angle : le logo SAFE, ce sont deux galets qui tiennent ensemble. On a construit une version 3D de la page d'accueil où ces deux galets racontent le produit : ils se séparent et cinq petits galets apparaissent (fidéicommis, dossiers, temps, facturation, conformité), un galet dérive en couleur d'alerte quand un montant ne concorde pas, puis tout se réassemble. Le texte de la page n'a pas changé d'un mot. Leçon build-in-public : l'animation n'est pas de la décoration, c'est le même argument raconté autrement (cohérent « preuve visuelle avant tout »). Réserve : prototype interne, à valider avant d'en faire un canal public.

---

## Idée capturée — « On a testé un prompt viral à 2 000 $. Voici ce qu'on a gardé. »

Statut : idée capturée le 2026-07-25 pendant le test du « One-Prompt Website Pack » (prompt SaaS adapté à SAFE). À développer au format 4 sections.

L'angle : un pack de prompts promet un site cinématique « en une phrase » grâce à des vidéos générées par IA. On l'a testé sur SAFE. Les outils vidéo n'étaient pas disponibles, et c'est finalement tant mieux : on a recréé l'effet (la page qui s'assemble pendant qu'on défile) en animation codée, avec notre palette, notre texte existant mot pour mot, et zéro métrique inventée. Ce qui vaut de l'or dans ces packs, ce n'est pas la magie promise, c'est la discipline du brief : quels plans, quelle histoire, quelle vérification avant de dire « terminé ». Leçon build-in-public : l'outil à la mode change, la structure du travail reste (cohérent « preuve visuelle avant tout »). Réserve : prototype interne, décision CEO en attente.

---

## Idée capturée — « 26,7 % contre 12,4 %. Deux chiffres du même tableau. »

Statut : idée capturée le 2026-07-26 pendant la recherche sur la clientèle franco-ontarienne. À développer au format 4 sections.

L'angle : le Barreau de l'Ontario publie un tableau qui dit que 26,7 % des avocats se déclarant francophones travaillent au gouvernement, contre 12,4 % des autres. Ce n'est pas une statistique d'emploi. C'est une carte de l'accès à la justice en français : les juristes bilingues sont absorbés par la capitale fédérale, et il en reste d'autant moins pour la personne de Hawkesbury qui cherche une avocate en droit de la famille. Le chiffre qui a l'air d'une réussite professionnelle est aussi, vu de l'autre côté, une pénurie. Client héros, non produit-centric, ton posé, aucun jugement porté sur ceux qui font le choix du gouvernement. Source primaire : Statistical Snapshot of Lawyers in Ontario, Lawyer Annual Report 2021.

---

## Idée capturée — « Elle reçoit en français, rédige en français, plaide en français. Puis elle ouvre ses livres en anglais. »

Statut : idée capturée le 2026-07-26 pendant la recherche sur la clientèle franco-ontarienne. À développer au format 4 sections.

L'angle : dans l'Est ontarien, une avocate peut faire toute sa journée en français. La cliente, la convention, la plaidoirie, la note au dossier. Puis vient le moment de tenir les livres et le compte en fiducie, et l'écran repasse en anglais. Ce n'est pas un drame, personne n'en parle. C'est juste une friction de plus, tous les jours, dans la partie du métier que personne n'aime déjà. Le coût invisible de travailler dans une langue que son logiciel ne parle pas. Réserve importante : ne pas publier avant d'avoir vérifié si les logiciels dominants offrent ou non le français, l'affirmation repose pour l'instant sur une source faible.
