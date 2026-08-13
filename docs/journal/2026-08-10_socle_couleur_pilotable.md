# 2026-08-10 — La couleur devient un interrupteur

Premier pas de la refonte. Décision du CEO : reprendre SAFE écran par écran vers un
design qui lui plaît davantage, en commençant par les couleurs, sur le serveur local
3001. La direction proposée est écrite dans
[REFONTE_DESIGN_SYSTEM_SAFE_2026.md](../design/REFONTE_DESIGN_SYSTEM_SAFE_2026.md),
mais elle attendait une décision. Impossible de décider sur un tableau de jetons : il
fallait pouvoir regarder.

## Ce que le relevé a montré

Comptage des classes de couleur dans `app/` et `components/` (590 fichiers TSX) :

| Vocabulaire | Occurrences | Où |
|---|---:|---|
| `si-*` | 4 807 | l'intérieur de l'application, presque en totalité |
| `neutral-*` | 405 | résidu |
| `emerald-*` | 271 | résidu |
| `forest-*` | 240 | site public (29 fichiers sur 39 dans `components/landing`) |
| tout le reste | ~670 | queue à migrer |

Conclusion : l'intérieur est déjà mono-vocabulaire. Le re-skin `si-*` était plus
avancé que le diagnostic ne le laissait croire. Un seul point de bascule suffit donc
pour re-teinter le produit entier.

## Ce qui a été construit

**`lib/ds/palettes.ts`** — source unique. Quatre palettes candidates, 18 jetons
chacune. Chaque palette émet deux formes par jeton : la valeur complète (`--si-ink`,
pour les 367 usages en classe arbitraire `text-[var(--si-ink)]`) et les canaux séparés
(`--si-ink-rgb`, pour que Tailwind compose les 825 modificateurs d'opacité déjà
écrits).

**`components/ds/PaletteStyles.tsx`** — émet `:root` et un bloc par
`[data-palette="…"]`. Hissé dans le `<head>` par React : pas de clignotement.

**`tailwind.config.ts`** — les jetons `si-*` ne portent plus de littéral, ils lisent
les variables. Les alias `canvas`, `surface`, `border`, `text-*` suivent la même
source au lieu de rester figés.

**`components/ds/PaletteSwitcher.tsx`** — sélecteur flottant, développement seulement.
Pose `data-palette` sur `<html>`, retient le choix. Il disparaîtra une fois la palette
figée.

## Deux points d'attention

**Les filets ne sont pas une couleur.** `--si-line` est une encre plus une opacité.
Écrit naïvement en canaux, `border-si-line` serait passé de 10 % à 100 % d'opacité sur
750 usages : des filets noirs partout. La fabrique `siLine()` distingue l'appel sans
modificateur (opacité de la palette) de l'appel avec (`/60` reste `/60`). Vérifié dans
la feuille servie.

**Aucune candidate sombre.** L'intérieur contient 497 `bg-white` / `text-white` en
dur. Une palette sombre s'afficherait cassée et ferait juger la direction sur un
artefact. Cohérent avec la Décision 3 du document de refonte.

## Les quatre candidates

| Palette | Intention |
|---|---|
| **Registre calme** | Albâtre verdâtre. L'état actuel, gardé comme repère. |
| **Papier** | Ivoire pâle, encre chaude. Le vert quitte le fond. |
| **Ardoise** | Neutres froids, surfaces blanches. Registre d'instrument. |
| **Encre** | Presque monochrome, contraste plus dur. La couleur devient rare. |

## Issue

**Ardoise retenue**, le jour même. Les trois autres candidates et le sélecteur
ont été retirés : `lib/ds/palettes.ts` ne porte plus qu'une palette.

L'accent a suivi séparément. Le vert forêt ne tenait pas sur un canevas froid,
l'action est passée au bleu ardoise. Voir
[2026-08-10_accent_action.md](2026-08-10_accent_action.md).
