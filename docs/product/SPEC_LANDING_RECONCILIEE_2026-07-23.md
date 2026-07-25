# Spec de réconciliation de la landing SAFE

Date: 2026-07-23
Statut: spec actionnable, réconcilie la direction de design et le copy révisé
Portée: page d'accueil publique de SAFE (desktop et mobile)

## 0. Rôle de ce document

Ce document réconcilie deux sources en une seule spec prête à construire:

1. Direction design: `DIRECTION_LANDING_SAFE_INSPIREE_LINEAR_2026.md` (discipline de composition, 9 séquences, système visuel).
2. Copy révisé: `PROPOSITIONS_COPY_SITE_CABINET_REVISEES.md` (texte de publication).

Il ne remplace ni l'un ni l'autre. Il tranche les divergences et assigne chaque bloc de copy à la séquence de design correspondante.

## 1. Décisions tranchées

| Décision | Choix retenu | Statut |
|---|---|---|
| Positionnement du hero | Pointu: fidéicommis + inspection. Le système large (Tenir / Vérifier / Encaisser) sert de preuve plus bas. | Hypothèse (à confirmer CEO) |
| Action principale | Diagnostic gratuit (8 points). Présent partout, friction basse. | Confirmé CEO 2026-07-23 |
| Escalade | Rencontre de 20 minutes, réservée au CTA final. | Confirmé |
| Géographie | Cabinet réel en Ontario. Ne jamais présenter SAFE comme exploité au Québec. Conformité couvre QC (B-1, r.5) et ON (LSO). | Règle dure (copy) |
| Provenance | « Conçu à partir du quotidien d'un vrai cabinet. » Pas de nom de cabinet. | Règle dure (copy) |
| Structure | Une longue landing (9 séquences). Fonctionnalités, Tarification, FAQ deviennent des pages profondes liées. | Retenu |

Note de nommage à trancher: le produit a une route `app/audit-gratuit/`, le copy dit « diagnostic ». Choisir un seul terme public. Reco: label public « diagnostic », route technique inchangée.

## 2. Mener pointu, prouver large

Le hero et le haut de page parlent fidéicommis et inspection, la pointe la plus tranchante et la plus crédible. La démonstration en trois actes montre ensuite que SAFE est un système complet, pas seulement un outil de fidéicommis. On ne dilue pas la promesse d'entrée, on l'élargit une fois la crédibilité posée.

## 3. Assignation copy vers séquences design

### 01. Hero
- Titre (Instrument Serif): « Votre fidéicommis à jour. Votre prochaine inspection, sans mauvaise surprise. »
- Sous-titre (Geist Sans): « SAFE vous aide à tenir vos mouvements, vos rapprochements et vos dossiers au même endroit, avec des alertes lorsqu'un écart demande votre attention. »
- Action principale: « Faire le diagnostic »
- Lien secondaire discret: « Voir comment SAFE fonctionne »
- Scène produit réelle sous le texte: rapprochement à trois voies du fidéicommis, avec un écart signalé. Montants et statuts lisibles.

### 02. Repères de confiance
Une seule ligne sobre, aucune carte, aucun logo fictif, aucun compteur:
- Conçu au Québec
- Conçu à partir du quotidien d'un vrai cabinet
- Conforme aux exigences de tenue du fidéicommis (QC: B-1, r.5 · ON: LSO)
- Données au Canada (seulement si exact)
- Construit en public

### 03. Le coût du désordre
Texte du copy « Le problème »:
> Un compte en fidéicommis ne tolère pas l'à-peu-près. Quand les mouvements, les dossiers et les rapprochements sont répartis entre plusieurs fichiers, la rigueur repose entièrement sur la personne qui les tient. Il faut vérifier, recouper et recommencer. Et malgré tout ce travail, un doute peut rester.
>
> SAFE rassemble ce suivi et vous signale ce qui demande votre attention. Vous savez où en sont vos comptes, sans attendre la fin du mois pour le découvrir.

Partir du vécu, jamais d'une liste de fonctions. Pertes plus larges (heures non facturées, factures en retard, trésorerie immobilisée) mentionnées brièvement en second, pas en tête.

### 04. Le point de vue SAFE
Trois principes numérotés (design):
1. Préparer avant que l'urgence arrive.
2. Vérifier avant que l'erreur circule.
3. Faire entrer l'argent sans perdre le contrôle.

Développer le copilote du copilote: l'adjointe garde le jugement, SAFE prépare, classe et signale, l'avocat valide ce qui compte. Reprendre la formule du copy: « L'adjointe reste le copilote du cabinet. SAFE soutient son travail. »

### 05. Démonstration en trois actes
Une scène différente par acte. La scène du fidéicommis (Vérifier) est la plus détaillée, c'est la pointe.

- Acte 01 Tenir: dossiers, temps, documents, échéances, travail préparé.
  > Le cabinet sait ce qui doit être fait et ce qui est prêt.
- Acte 02 Vérifier (scène héroïne): fidéicommis, rapprochement à trois voies, registres, alertes, validation humaine, blocage de la certification tant qu'un écart subsiste.
  > Les écarts sont visibles avant de devenir des problèmes.
- Acte 03 Encaisser: temps à facturer, facture, paiement, relance, solde.
  > Le travail accompli devient plus facilement du revenu encaissé.

Le détail copy « Comment ça fonctionne » (inscrire une fois, rapprochement à trois voies, rapports prêts) alimente l'acte Vérifier.

### 06. La preuve de continuité
Option honnête sans identification (copy):
> SAFE est déjà utilisé dans le quotidien d'un cabinet indépendant en Ontario. C'est à partir de ce travail réel que nous vérifions et améliorons le produit.

Compléter par un extrait de changelog ou des dates de livraisons récentes. Aucune traction inventée. Témoignage réel seulement avec consentement.

### 07. Offre et prix
- Solo: 99 $/mois. Cabinet: 149 $/mois. Configuration incluse, aucun frais d'installation.
- Offre fondatrice distincte: cinq places, douze mois sans frais, puis 50 $/mois maintenu selon les conditions ou paiement unique de 5 000 $.
- L'action principale demeure le diagnostic, pas l'achat.

### 08. Objections et sécurité
Reprendre la FAQ du copy (section G):
- Sécurité des données financières et propriété des données.
- Hébergement au Canada.
- Conformité Barreau (SAFE soutient, ne garantit pas; responsabilité au cabinet).
- Place de l'adjointe.
- Jeune entreprise, pourquoi faire confiance.
- Engagement et délai de démarrage.

### 09. CTA final (escalade)
Action principale de la page reste le diagnostic. Ici seulement, on propose l'escalade:
> Voyons si SAFE convient à votre façon de travailler. En 20 minutes, nous regardons votre organisation actuelle et les points qui vous prennent le plus de temps. Vous décidez ensuite si la suite en vaut la peine.

Bouton: « Réserver une rencontre de 20 minutes ». Rappeler: aucun engagement, diagnostic concret, prochaines étapes claires.

## 4. Garde-fous hérités (non négociables)

- Vouvoiement, français québécois, ton calme. Aucun tiret long en milieu de phrase. Aucun jargon « plateforme », « workflow », « solution ».
- Une seule couleur vivante, le vert d'action, réservé aux actions et validations.
- Instrument Serif (titres) / Geist Sans (corps) / Geist Mono (montants, dates, références).
- Filets plutôt qu'ombres. Hiérarchie par l'échelle et l'espace avant toute décoration.
- Ne jamais garantir la conformité. Éviter les absolus (« toujours », « jamais », « sans erreur »).
- Aucun faux témoignage, faux logo, faux chiffre. Aucune donnée cliente visible.
- Passer la checklist anti-slop de `docs/design/DESIGN_HUMAIN.md` avant de dire « terminé ».

## 5. À confirmer avec le CEO avant build

1. Positionnement pointu confirmé, ou bascule sur large ?
2. Terme public: « diagnostic » ou « audit gratuit » ?
3. Les trois scènes produit les plus crédibles à montrer dans les actes.
4. Disponibilité d'un changelog public pour la séquence 06.
5. « Conçu au Québec » exact comme origine d'entreprise ?

## Sources

1. `DIRECTION_LANDING_SAFE_INSPIREE_LINEAR_2026.md`
2. `PROPOSITIONS_COPY_SITE_CABINET_REVISEES.md`
3. `docs/design/DESIGN_HUMAIN.md`
4. Tokens actifs: `app/globals.css`, `app/layout.tsx`, `tailwind.config.ts`.
