# 2026-07-08 — Reskin Console SAFE Inc. sur le design system safe-interface

## Demande CEO
L'interface créateur (Console SAFE Inc.) doit matcher l'interface cabinet :
même UI/UX, mêmes couleurs, même police, mêmes animations.

## Diagnostic
Toute l'app cabinet avait été refondue en design **safe-interface** (forêt/albâtre,
tokens `si-*`, titres serif, chiffres Geist Mono) lors du chantier de 2026-06-23,
mais la Console avait été **explicitement laissée de côté** (« console = SAFE Inc.
(séparé) »). Elle utilisait encore des couleurs Tailwind génériques (`zinc`,
`emerald`, `orange`, `blue`, `bg-white`) et du sans-serif. D'où le décalage.

## Fait
- **Tableau de bord** (`console/page.tsx`) réécrit à la main : surfaces `si-surface`,
  bordures `si-line`, titres `font-serif`, chiffres `font-mono tabular-nums`,
  positif `si-verified`, warning `si-amber-ink`, danger `#B84A3E`, badges de stage
  en famille forêt/ambre. Cartes via `ui/Card` (déjà si) sans override blanc.
- **9 autres pages Console** converties via script de remplacement littéral
  (`scratchpad/reskin_console_si.py`, mapping trié par longueur décroissante
  anti-collision `-500`/`-50`) : audits, catalogue, clients (liste + `[id]`),
  leads, pipeline, safe-lead, support (liste + `[id]`). **336 remplacements.**
- Mapping canonique (aligné sur `ComptaKpiCard`) : neutres zinc → `si-ink`/`si-muted`/
  `si-line`/`si-canvas`/`si-surface` ; emerald → `si-verified`/`si-forest` ; amber+orange
  → `si-amber` (fond) / `si-amber-ink` (texte) ; red → `#B84A3E` ; blue → famille `si-forest`.

## Vérif
- Grep : zéro palette générique restante, zéro `bg-white`, zéro artefact d'opacité.
- `tsc --noEmit` vert.
- Visuel (port 3010, connecté créateur) : tableau de bord, liste Clients (bannière
  forêt « Gestion clients » serif), Pipeline (bannière forêt + 4 colonnes) alignés
  sur l'habillage cabinet.

## Reste (nuance)
- **Micro-animations** : l'interface cabinet utilise framer-motion (stagger des cartes,
  compteur `AnimatedNumber`, `whileHover`). Les pages Console sont surtout server-side
  et statiques. La transition de page (`PageTransition`) est déjà partagée. Reste
  optionnel : stagger + count-up des KPIs Console.
- Bug connu non lié : `MobileSidebar` n'affiche pas le menu créateur (voir
  journal 2026-07-08_interface_createur_console_visible.md).
