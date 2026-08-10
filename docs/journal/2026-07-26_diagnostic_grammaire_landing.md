# 2026-07-26 — Le diagnostic reprend la grammaire de la page d'accueil

## Demande

Revoir `/audit-gratuit` pour qu'elle ressemble à la page d'accueil, en partant du
« One-Prompt Website Pack » (Fable 5 + Higgsfield) adapté à Opus 5, à ce dépôt et à la
direction artistique du site.

## Ce qui a été fait

**Prompt adapté** : `docs/design/PROMPT_DIAGNOSTIC_COMME_LA_LANDING.md`. Le pack d'origine
commande des clips vidéo IA ; ici le produit existe, donc on garde la grammaire de scroll et
on écarte la vidéo, le fond noir et l'accent néon. Le prompt liste la structure, le rythme,
les interdits et l'obligation de vérifier à l'écran avant de dire « terminé ».

**Page reconstruite** : `app/audit-gratuit/page.tsx` passe d'une scène unique à un vrai
parcours de landing.

| Palier | Contenu |
|---|---|
| En-tête | Liens du site public, connexion, un seul bouton plein qui descend au départ |
| Scène épinglée 360 vh | Titre qui s'efface, trois promesses qui arrivent une par une, galets du logo brassés au curseur |
| Bande de preuves | Gratuit · quinze minutes · rapport sous 24 h · confidentiel |
| Scène épinglée 320 vh | « Ce qu'on regarde » : feuille de rapport qui se remplit au défilement, chiffres qui montent, bande forêt de recommandation |
| Déroulement | Trois étapes sur filets pleine largeur |
| Questions | Trois objections réelles (données, tarif, chiffres inconnus) |
| Départ | Choix de la langue, seul moment centré, puis le questionnaire prend la main |
| Pied de page | Celui du site public |

Rail de tirets à droite (Diagnostic · Rapport · Déroulement · Commencer), jamais cliquable,
masqué sous 1024 px. Version empilée complète pour `prefers-reduced-motion`.

## Vérifications

- `tsc --noEmit` et `next lint` sans erreur.
- Rendu vérifié à l'écran : scène d'entrée, scène du rapport (chiffres qui montent), étapes,
  questions, départ, pied de page. Le clic sur « FR » passe bien la main au questionnaire.
- Correction faite en cours de route : le rail croisait la feuille de rapport à 1280 px,
  les scènes épinglées gardent maintenant une voie de 150 px à droite.

## Points ouverts

- Les trois chiffres de la feuille de rapport sont un exemple sur données fictives, annoncé
  deux fois. À remplacer par un cas réel dès qu'un cabinet accepte d'être cité.
- Le questionnaire lui-même (`AuditForm.tsx`) n'a pas bougé.
