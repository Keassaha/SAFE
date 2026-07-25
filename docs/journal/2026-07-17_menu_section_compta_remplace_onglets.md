# 2026-07-17 · Méga-menu retiré de la landing + menu de section dans la compta

## Contexte

Le CEO, en voyant le méga-menu « Produit » (Facturation / Comptabilité / Conformité)
sur la landing /fonctionnalites : « ce menu n'a aucune logique [ici], j'aimerais
l'utiliser dans une version adaptée dans l'interface de comptabilité, pas ici ».
Décisions (AskUserQuestion) : rôle = REMPLACER LES ONGLETS de la compta ; style =
FORÊT si-* (thème actuel de l'app).

## Changements (working tree, non commité)

**components/marketing/Navbar.tsx** : méga-menu « Produit » RETIRÉ. Barre marketing
revenue à des liens simples (Fonctionnalités / Tarification / Audit gratuit / À propos /
Contact) en thème clair verdâtre. Imports/états du dropdown supprimés.

**app/(app)/comptabilite/ComptabilitePageView.tsx** : la barre d'onglets fine
(Journal général / Dépenses / Paiements, underline) est REMPLACÉE par un menu de
section façon méga-menu, thème si- :
- Bouton déclencheur (icône + libellé du journal courant + chevron qui pivote).
- Panneau qui fond + glisse (framer-motion opacity + y, 220ms) — l'animation Combo.
- Colonne « Journaux » : Général / Dépenses / Paiements → pilotent la vue in-page
  (Link vers routes.comptabiliteTab(id), item actif surligné + point vert). Logique
  d'onglets inchangée (query ?tab=).
- Colonne « Raccourcis » : Facturation, Fidéicommis et comptes (masqué si isSafeInc),
  Créances → navigation vers les pages liées (routes réelles).
- Ferme au clic sur un item et au mouseleave du wrapper.

## Vérification

- tsc --noEmit : 0 erreur sur Hero.tsx, Navbar.tsx, ComptabilitePageView.tsx.
- /comptabilite → 307 vers /connexion (auth, normal) ; pas de 500, pas d'erreur compile.
- Landing 3010 : barre sans méga-menu confirmée (Fonctionnalités en lien simple).
- Rendu authentifié à voir par le CEO sur son navigateur (localhost:3010/comptabilite,
  session active) — l'agent n'a pas la session.

## Notes

- TABS conservé (sert encore à valider effectiveTab). tMicro import retiré (indicateur
  d'onglet animé supprimé).
- Le menu compta est en si- forêt (cohérent app), pas en clair verdâtre : décision CEO.
  Migration éventuelle de l'app vers le clair = chantier séparé.

## Statut

Fait + typecheck vert, non commité. À valider visuellement par le CEO (connecté) sur
/comptabilite.
