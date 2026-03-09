# Guidelines design SAFE

Règles du design system pour garder l’UI cohérente (inspiré shadcn/ui, Figma Make, base 14px).

## Général

- Privilégier **flexbox et grid** ; n’utiliser le positionnement absolu que si nécessaire.
- Refactorer au fil de l’eau pour garder le code lisible.
- Garder les fichiers courts ; déplacer helpers et sous-composants dans des fichiers dédiés.

## Design system

- **Taille de base** : 14px (`html { font-size: 14px; }` dans `globals.css`).
- **Dates** : format court type « 4 mars », « 10 juin » (voir `lib/formatDate.ts`).
- **Barre du bas** : maximum 4 éléments si une bottom toolbar est utilisée.
- **Chips** : les afficher par groupes de 3 ou plus quand c’est pertinent.
- **Choix binaires** : ne pas utiliser de dropdown pour 2 options ou moins (boutons, toggle, etc.).

## Boutons

| Variant     | Rôle | Style | Usage |
|------------|------|--------|--------|
| **Primary** | Action principale | Plein, couleur primaire | **Un seul** bouton primary par section ou bloc. |
| **Secondary** | Action alternative | Contour couleur primaire, fond transparent | À côté du primary pour les actions moins importantes. |
| **Tertiary** | Action secondaire | Texte seul, pas de bordure | Actions disponibles mais peu mises en avant. |
| **Danger** | Action destructive | Plein, couleur erreur | Suppression, actions irréversibles. |

Utiliser le composant `@/components/ui/Button` avec la prop `variant`.

## Tokens et composants

- Couleurs, rayons, ombres : variables CSS dans `app/globals.css` (`--safe-*`).
- Cartes : `safe-glass-panel`, `Card` / `CardHeader` / `CardContent`.
- Barre latérale / topbar : `safe-glass-sidebar`, `safe-glass-topbar`.

## Références

- Composants inspirés de [shadcn/ui](https://ui.shadcn.com/) (MIT).
- Style guide : `/style-guide` dans l’app.
