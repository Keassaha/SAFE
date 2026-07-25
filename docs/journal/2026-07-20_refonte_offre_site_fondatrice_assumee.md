# Refonte de l'offre du site — fondatrice assumée

Date : 2026-07-20

## Contexte

Revue de l'offre affichée sur la home (`app/page.tsx` → `landing/`). Diagnostic : la page empilait **quatre chiffres** (99$ régulier, 50$/mois fondateur, 149$ barré, 5000$ rachat) sans expliquer le lien entre eux, une fausse note « 4.9 ★★★★★ » au Hero, et une machine de conversion à froid qui contredisait la doctrine de préchauffage.

## Décisions CEO

1. **Posture = fondatrice assumée.** On veut réellement signer 5 cabinets fondateurs maintenant. La conversion reste, mais musclée par de la vraie preuve et simplifiée. (Assouplit la règle « pas de conversion » du préchauffage, pour le volet site uniquement ; le reste de la doctrine — sur-livrer la cliente actuelle, capturer chiffres/citations, runway par tenue de livres — tient toujours.)
2. **Rachat unique 5000$ supprimé**, remplacé par un **paiement annuel fondateur avantageux : 500$/an** (deux mois offerts vs mensuel). Motif : protéger le récurrent et l'histoire MRR pour Futurpreneur, garder les 5 sièges engagés mensuellement/annuellement plutôt qu'un one-shot.
3. **Note « 4.9 ★★★★★ » retirée** du Hero (aucun avis réel derrière ; risque crédibilité + publicité trompeuse envers des avocats). Remplacée par le repère honnête « Conçu au Québec ». Vraie mécanique de reviews in-app = à construire plus tard.

## Buildé

- `lib/tarification.ts` : `rachatUnique: 5000` retiré ; ajout `abonnementAnnuel: 500` + `prixRegulierAnnuelBarre: 1788` ; FAQ « offre revient ? » réécrite (mensuel/annuel au lieu de rachat).
- `components/landing/Hero.tsx` : bande de confiance = « Conçu au Québec · Conforme B-1 r.5 · Données au Canada » (plus de 4.9/étoiles).
- `components/landing/FoundingOffer.tsx` : carte B « Rachat unique 5 000 $ » → « Paiement annuel · 2 mois offerts, 500 $/an » (barré 1 788 $) ; carte A relabellée « Paiement mensuel ».
- `components/tarification/TarificationContent.tsx` : mêmes changements sur la page publique `/tarification` + liste des avantages fondateurs.
- `components/audit-report/pages/OffrePage.tsx` : page « Votre offre » du rapport d'audit alignée (annuel au lieu de rachat).

## Vérifié

- Aucune référence morte à `rachatUnique`/`rachat`/`5 000`/`4.9`/`★` dans le périmètre offre.
- Typecheck sans erreur sur les fichiers touchés.
- Rendu confirmé en preview (serveur dédié :3030) : Hero sans 4.9, deux cartes fondatrices (50$/mois barré 149$ · 500$/an barré 1788$).

## Reste à faire (idées à externaliser)

- Construire la vraie mécanique de reviews in-app (source du futur signal « communauté »).
- Remplacer le CTA « Nous contacter » de l'offre fondatrice par un geste unique aligné sur l'audit gratuit (l'offre se signe *après* l'audit, chiffre sur la table).
- Décider si les 12 mois gratuits restent (grosse concession) une fois la posture fondatrice assumée.
