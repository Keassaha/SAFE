# 2026-06-23 — Correctif contraste WCAG AA : texte amber (DS safe-interface)

## Problème

Le token `si-amber` (#B07A1C) échoue au contraste WCAG AA (4.5:1 pour petit
texte) partout où il sert de **texte** sur fond clair :

- amber sur tint `bg-si-amber/[0.13]` composé sur si-surface (#F1EBDD) : 3.13:1 — ÉCHEC
- amber sur si-surface pur (#FBFCFA) : 3.61:1 — ÉCHEC
- amber sur si-canvas (#EFF2ED) : 3.29:1 — ÉCHEC

## Décision

Séparer le **texte** du **fond/pastille**. Nouveau token `si-amber-ink` réservé
au texte ; le #B07A1C reste pour le tint de fond et les pastilles (contraste non
requis pour un fond ou un élément décoratif).

Valeur retenue : **#835A10** (même teinte, ~5 % plus foncé que la reco initiale
#8A5E10). Raison : #8A5E10 passait sur surface (4.79 / 5.53) mais la vérif live
a révélé que le Badge « À valider » se compose en réalité sur **si-canvas**, pas
sur si-surface — pire cas non couvert par la reco, où #8A5E10 ne donnait que
**4.40:1 (ÉCHEC)**. #835A10 passe sur les 4 fonds documentés.

## Modifications

- `tailwind.config.ts` : ajout token `"si-amber-ink": "#835A10"`.
- `components/ds-safe/core.tsx` (Badge, tone="warn") : `text-si-amber` -> `text-si-amber-ink`.
- `components/ds-safe/sections.tsx:76` (PriorityCard, valeur métrique amber) : idem.
- `components/ds-safe/sections.tsx:169` (Obligations, tuile « ! ») : idem.

## Vérification (live, /ds-preview, ratios calculés sur les fonds réellement composés)

| Emplacement | Fond effectif | Ratio | AA |
|---|---|---|---|
| Métrique « il y a 34 j » | si-surface (251,252,250) | 5.94:1 | ✓ |
| Tuile obligation « ! » | tint/surface (241,235,221) | 5.15:1 | ✓ |
| Badge « À valider » | tint/canvas (231,226,210) | 4.73:1 | ✓ |

Périmètre exclu non touché (Button, EmptyState, StatusBadge, ClientCreateModal/
wizard, ClientSuccessBanner, page profil client). Les 2 usages `text-si-amber`
restants sont des **icônes** (`FolderX`, `Archive` dans ClientTable, `aria-hidden`)
relevant du contraste non-textuel (3:1), hors périmètre de ce correctif.
