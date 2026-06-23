# SAFE · Interface de travail

Interface professionnelle pour SAFE (Système Automatisé de Facturation et d'Exploitation), construite en Next.js 15 (App Router), React 19, TypeScript et Tailwind. Trois écrans livrés et reliés par une coque commune : tableau de bord, création de client, création de dossier. Le tout repose sur un système de design en tokens, dans la variante froide (albâtre) du design v3.

## Démarrer

```bash
npm install
npm run dev
```

Puis ouvrez http://localhost:3000. La racine redirige vers le tableau de bord.

Routes disponibles :

- `/dashboard` : tableau de bord (priorité unique, conformité, fidéicommis, obligations)
- `/clients/nouveau` : création d'un client (conflits d'intérêts, identification Barreau)
- `/dossiers/nouveau` : création d'un dossier (domaine de droit, facturation, provision en fidéicommis)

Les autres entrées du rail (Conformité, Fidéicommis, Facturation, etc.) pointent vers des routes à créer dans le même langage visuel.

## Carte des fichiers

```
app/
  layout.tsx                 Polices et html lang fr
  page.tsx                   Redirection vers /dashboard
  globals.css                Base Tailwind et utilitaires (lueurs, caret)
  (app)/
    layout.tsx               Coque : rail + zone de contenu
    dashboard/page.tsx       Tableau de bord
    clients/nouveau/page.tsx Création client
    dossiers/nouveau/page.tsx Création dossier
components/
  shell/sidebar.tsx          Rail de navigation, état actif via la route
  shell/action-bar.tsx       Barre d'action fixe des formulaires
  shell/page-head.tsx        Fil d'Ariane, titre, numéro attribué
  ui/core.tsx                Button, Card, Badge, Pill, Logo
  ui/form.tsx                Field, Input, Select, Textarea, AmountInput, SegmentedControl
  dashboard/sections.tsx     Bandeau conformité, priorité, fidéicommis, KPI, obligations
lib/
  fonts.ts                   Geist Sans, Geist Mono, Instrument Serif
  data.ts                    Données de démonstration et types (point de raccordement Prisma)
  cn.ts                      Fusion de classes
tailwind.config.ts           Tokens du système de design
```

## Le système de design en un coup d'oeil

Tout est centralisé. Pour changer l'apparence, deux fichiers suffisent.

Couleurs : `tailwind.config.ts`

- `forest` (#0B1F19) : ancrage, panneaux profonds, boutons primaires
- `canvas` (#EFF2ED) : fond albâtre froid de l'application
- `surface` (#FBFCFA) : cartes
- `ink` (#1F2A24) : texte principal
- `muted` (#5A665F) : texte secondaire
- `verified` (#2E7D5B) : accent de confiance, états conformes
- `amber` (#B07A1C) : états à valider
- `line` et `line2` : filets

Polices : `lib/fonts.ts`

- `font-serif` : Instrument Serif, réservé aux titres et aux grands chiffres de mise en scène
- `font-sans` : Geist, corps et libellés
- `font-mono` : Geist Mono, montants, identifiants, dates

Deux règles héritées de v3 sont déjà respectées dans le code et doivent le rester :

1. Aucun tiret (cadratin, demi-cadratin, tiret en incise) dans les textes. Utiliser virgule, deux-points ou parenthèses.
2. Contraste inversé : sur fond forest, n'utiliser que des teintes claires pour le texte et les icônes.

## Brancher les vraies données

`lib/data.ts` est conçu comme une couture. Les écrans lisent leurs données via `getDashboardData()` et les constantes exportées. Pour passer en production, remplacez le contenu de ces fonctions par vos requêtes Prisma vers Supabase, en conservant la forme des objets (types déjà définis dans le même fichier).

Exemple de cheminement à conserver :

- le solde en fidéicommis et l'état des obligations proviennent d'une couche de calcul (style `compute.ts`) qui agrège les écritures par dossier
- l'état vert ou ambre du bandeau de conformité est dérivé, jamais saisi à la main
- à l'ouverture d'un dossier, la provision crée une écriture de dépôt en fidéicommis rattachée au dossier

Pour les formulaires, ajoutez vos Server Actions sur les boutons de la barre d'action (`Créer le client`, `Ouvrir le dossier`) et la validation côté serveur.

## Pourquoi c'est vendable

- Aucun écran vide : les données de démonstration peignent un cabinet crédible pendant un audit ou un appel de vente.
- La promesse de conformité est visible en permanence (bandeau, encart fidéicommis, obligations cochées).
- La priorité unique du jour parle à l'avocat débordé, pas au féru de logiciels.
- L'esthétique cabinet, et non startup, inspire le sérieux qu'un avocat associe à sa propre image.

---

## Instruction à coller dans Antigravity ou Claude Code

Copiez le bloc ci-dessous dans votre IDE IA pour adopter cette interface comme socle de travail et l'étendre sans casser la cohérence.

```
Tu travailles sur SAFE, une plateforme LegalTech pour avocats solos et petits
cabinets au Québec et en Ontario. Le dossier safe-interface contient le socle
visuel officiel de l'application : Next.js 15 App Router, React 19, TypeScript,
Tailwind. Adopte-le comme source de vérité pour toute nouvelle interface.

Règles non négociables :
1. N'utilise jamais de tiret (cadratin, demi-cadratin, tiret en incise) dans les
   textes de l'interface. Remplace par une virgule, deux-points ou parenthèses.
2. Respecte le contraste inversé : sur fond forest, uniquement des teintes
   claires pour le texte et les icônes.
3. Ne réintroduis aucune couleur hors des tokens de tailwind.config.ts. Si une
   nuance manque, ajoute-la d'abord comme token nommé.
4. Réutilise les primitives existantes (Card, Button, Badge, Field, Input,
   Select, Textarea, SegmentedControl, ActionBar, PageHead) avant d'en créer.
5. Titres et grands chiffres en font-serif (Instrument Serif). Montants,
   identifiants et dates en font-mono. Reste en font-sans pour le corps.
6. Toutes les données passent par lib/data.ts. Garde la forme des types quand tu
   remplaceras les fonctions de démonstration par des requêtes Prisma vers
   Supabase. L'état de conformité est toujours dérivé, jamais saisi.

Conventions de structure :
- Une nouvelle section de l'application est une route dans app/(app)/.
- Les écrans sont des Server Components qui lisent les données et composent des
  sections présentables. Garde l'interactivité (toggles, etc.) dans des
  composants client dédiés marqués "use client".
- Chaque écran de formulaire utilise PageHead en haut et ActionBar en bas.
- Le rail de gauche (components/shell/sidebar.tsx) gère l'état actif via la
  route. Ajoute-y toute nouvelle section.

Mission : construis les écrans manquants (Conformité, Fidéicommis, Facturation,
Dossiers en liste, fiche dossier, Employés Virtuels) dans ce même langage, puis
remplace la couche de démonstration par les vraies données. Commence par me
proposer le plan des écrans et leurs données avant de coder.
```
