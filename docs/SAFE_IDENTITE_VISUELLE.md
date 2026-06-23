# SAFE — Identité visuelle et design (document de référence)

Date : 2026-06-22
Statut : **adopté**. Le CEO a fourni un design fini (`safe-interface`). C'est la référence visuelle officielle de SAFE.

> Le design retenu n'est pas une de mes explorations. C'est l'interface livrée par le CEO : « SAFE · Interface de travail », design system v3, variante froide (albâtre). Vert forêt profond, fond clair albâtre (pas de crème), serif Instrument pour les titres, Geist pour l'interface, chiffres en mono.

---

## 1. Où vit le design

Le projet de référence est dans le repo : `docs/propositions/safe-interface/`.

C'est un vrai projet Next.js 15 / React 19 / Tailwind, autonome et fonctionnel. Trois écrans livrés (tableau de bord, création de client, création de dossier) reliés par une coque commune (rail de navigation + zone de contenu). Pour le voir tourner : `npm install` puis `npm run dev` dans ce dossier.

Bonne nouvelle : c'est **le même socle technique que SAFE** (Next App Router, TypeScript, Tailwind) et **les mêmes polices** que vous avez déjà. Donc adoptable, pas à réinventer.

## 2. Le système en bref

**Couleurs** (dans `tailwind.config.ts`) :

| Rôle | Couleur | Code |
| --- | --- | --- |
| Ancrage (panneaux, boutons primaires) | Forêt | `#0B1F19` |
| Forêt clair (survol) | Forêt soft | `#16312A` |
| Fond de l'application | Albâtre froid | `#EFF2ED` |
| Cartes | Surface | `#FBFCFA` |
| Texte principal | Encre | `#1F2A24` |
| Texte secondaire | Muet | `#5A665F` |
| Confiance / conforme | Vérifié (vert) | `#2E7D5B` |
| À valider | Ambre | `#B07A1C` |
| Lignes | Encre 10 % / 6 % | `rgba(31,42,36,0.10)` |

C'est discipliné : un vert d'ancrage, un vert de confiance, un ambre pour les alertes, et des neutres. Pas de couleur parasite.

**Polices** : Instrument Serif (titres et voix), Geist (interface), Geist Mono (chiffres et montants). Déjà dans SAFE.

**Logo** : un carré arrondi forêt avec un « S » serif clair. C'est exactement le sceau qu'on cherchait, déjà dessiné.

**Formes** : coins arrondis (xl, 2xl), une ombre de carte douce, des « lueurs » d'angle vert discrètes sur les panneaux forêt.

## 3. Les partis pris d'interface

- **Rail de navigation à gauche** (vertical), pas la barre du haut actuelle. Entrées : Tableau de bord, Conformité, Fidéicommis, Facturation, Clients, Dossiers, Employés Virtuels, Rapports.
- **Tableau de bord orienté priorité** : une grande carte « priorité unique » en serif, puis « Ensuite », un bandeau de conformité, un encart fidéicommis sur fond forêt, des indicateurs, et un état des obligations qui référence le **Barreau et le Règlement B-1 r.5** avec un bouton « Générer l'attestation ».
- Le fidéicommis et la conformité sont mis en avant, exactement ce qu'on visait.

## 4. Comment l'adopter dans le vrai SAFE (chemin, léger côté technique)

Ce design est une maquette fonctionnelle branchée sur des données de démonstration. L'adopter veut dire porter son langage visuel dans l'app réelle (qui a les vraies données, l'auth, la logique). Comme c'est le même socle, le travail est cadré :

1. **Porter les tokens** : remplacer la palette actuelle (vert `#1F3A2E` + fond sable) par celle-ci (forêt `#0B1F19` + albâtre `#EFF2ED`), ajouter vérifié et ambre.
2. **Adopter la coque** : le rail de navigation et les composants de base (Button, Card, Badge, Pill, Logo, champs de formulaire).
3. **Re-habiller les écrans réels** un par un avec ces composants, en gardant les vraies données et la logique métier.

C'est une adoption de design system, pas un copier-coller. Réelle, mais bien bornée.

## 5. Points à trancher

- **Rail à gauche vs barre du haut** : ce design utilise un rail vertical. SAFE est récemment passé à une barre composée en haut (Pratique / Finances / Outils). Adopter ce design implique de revenir au rail. À confirmer.
- **Vert plus profond** : `#0B1F19` est plus sombre que votre `#1F3A2E` actuel. C'est volontaire (plus premium). On garde le nouveau.
- **« Employés Virtuels »** dans le rail : nouveau concept (agents IA présentés comme une rubrique). À clarifier : surface réelle ou à venir.

## 6. Ce que ce document remplace

Cette adoption remplace toutes les explorations d'identité de la session (directions A à D, bordeaux, sceau). On ne revient pas dessus. À ne pas confondre non plus avec `docs/propositions/safe-pro/` qui est une vision d'un produit différent (droit familial, parquée).

## 7. Lien avec la feuille de route

Ce design est le **socle visuel préalable** aux chantiers visuels du calendrier (`SAFE_PRODUCTION_EDITORIAL_CALENDAR.md`) :
- L'adoption du design system (tokens + coque + composants) devient l'étape qui précède les chantiers A (courriels), B (facture) et C (comptabilité).
- Ces chantiers appliquent ensuite ce langage aux surfaces concernées.

Rien n'est codé tant que vous n'avez pas donné le feu vert sur le calendrier et confirmé les points de la section 5.
