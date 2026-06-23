# 2026-06-23 — Re-skin LawyerGlance (coup d'œil avocat) — fin de l'incohérence dashboard

Suite au HIGH de la revue adversariale : sur le tableau de bord (écran le plus consulté), `LawyerGlance` (ancien design) cohabitait avec `DashboardViewSafe` (si-*) → deux verts, deux blancs de carte, deux familles de bordures.

## Buildé et vérifié en live (3010, aperçu isolé)
- `components/navette/LawyerGlance.tsx` réécrit sur les tokens `si-*`, aligné sur le dashboard :
  - Carte `bg-si-surface` + `border-si-line` (était `bg-white border-neutral-200`).
  - Titre « Navette » en **serif** `si-ink` (comme les CardTitle ds-safe), sous-titre + libellés en `si-muted`.
  - Fini les hex codés en dur : `ACCENT #1F3A2E` (vert moyen) et `TONE.brand/warn` remplacés. Bouton « Approuver » = `bg-si-forest` (#0B1F19), pastille compteur + liens « Ouvrir » en `si-forest`.
  - Pastilles d'icônes : prêt-pour-revue = forêt, question = amber (graphiques, seuil 3:1 OK).
  - **A11y** : libellés d'en-tête passés en `si-muted` (au lieu d'amber/forêt colorés) pour rester AA ; la teinte reste portée par la pastille, pas par du petit texte. N'a PAS réintroduit de texte amber sous AA.
  - Rouge destructif (`#8A3A2D`) conservé pour « Renvoyer » et le message d'erreur (hors palette si, sémantiquement correct).
- Logique 100% préservée (useTransition, run(), sendBackId/reason/error, actions approve/sendBack, liens, états disabled, clés i18n).
- Styles calculés confirmés : Approuver `rgb(11,31,25)`, carte `#FBFCFA`, bordure `si-line`. tsc exit 0, **648/648 tests verts**.

## État dashboard
- Top du tableau de bord désormais cohérent (LawyerGlance + DashboardViewSafe même langage forêt/albâtre). La revue n'avait flaggé que LawyerGlance comme coexistence ; le reste du dashboard si est propre.

## Reste / décisions ouvertes (inchangé)
- Décision CEO : assombrir légèrement amber (#B07A1C) et verified (#2E7D5B) pour repasser AA sur petits glyphes/textes (identité verrouillée → votre appel).
- Écrans suivants : dossier, comptabilité, facture, courriels ; page profil client `[id]` ; flux création client (modal/wizard) + `ClientSuccessBanner`.
- Supprimer `/tableau-de-bord/apercu` (non-live, défauts layout mineurs).
- Bascule finale des tokens globaux (`si-*` → globaux).

## Prochaine action
- Commiter le checkpoint (banner + liste clients + correctifs revue + LawyerGlance, tout vert), ou passer à l'écran dossier.
