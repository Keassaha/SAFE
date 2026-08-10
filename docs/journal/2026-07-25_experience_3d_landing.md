# 2026-07-25 — Prototype « Expérience 3D » de la landing SAFE

## Ce qui a été construit

Une page autonome `public/experience-3d.html` (servie sur `/experience-3d.html`, aucune
dépendance npm ajoutée, Three.js chargé par CDN) : une version 3D animée et interactive
de la page d'accueil, avec le copywriting existant repris mot pour mot
(`components/public-site/HomePage.tsx`).

### Concept

Le logo « Les Galets » est extrudé en vrai 3D à partir des tracés Bézier officiels de
`components/branding/SafeLogo.tsx` (vert forêt #1F3A2E plein + galet clair). Les deux
galets sont les seuls acteurs du récit, chorégraphiés au scroll :

- **Hero** : logo assemblé (« SAFE tient votre cabinet ensemble »), saisissable à la
  souris (drag avec inertie), flottement doux.
- **Système** : les galets s'écartent, cinq petits galets satellites apparaissent
  (fidéicommis, dossiers, temps, facturation, conformité) reliés au cœur par des fils.
- **Vérifier** : un satellite dérive hors de l'orbite en ambre avec un anneau d'alerte,
  puis revient au vert à mesure qu'on lit (l'écart se corrige).
- **Encaisser** : les satellites se mettent en file et coulent vers le galet.
- **Collaborer** : les deux galets orbitent l'un autour de l'autre (l'équipe + l'avocat).
- **CTA final** : logo réassemblé au-dessus du titre.

Sections Tarification / Questions / CTA reprises telles quelles. Parallaxe pointeur,
`prefers-reduced-motion` respecté, fallback 2D sans WebGL, panneaux givrés pour la
lisibilité mobile.

### Design (base DESIGN_HUMAIN appliquée)

Palette de la landing (albâtre/forêt/vert SAFE), Instrument Serif + Geist, texte de
lecture aligné à gauche, centrage réservé au CTA final, prix alignés à droite, aucun
dégradé générique, aucune icône décorative. Checklist anti-slop §10 passée.

## Vérification

Serveur dev + captures Playwright sur les 7 arrêts de scroll (desktop 1440 et mobile
390) : rendu conforme, console propre. Deux correctifs après capture : logo qui
chevauchait le titre du CTA final, satellites qui passaient par la tranche.

Note outillage : le pane navigateur intégré produit des captures blanches après un
scroll programmatique profond (artefact du pane, pas de la page) ; Playwright headless
fait foi.

## Statut

Prototype interne, non lié depuis le site. Décisions ouvertes pour le CEO :
- En faire quelque chose ? (page `/labs`, teaser LinkedIn vidéo, ou simple exploration)
- Si oui : porter en route Next (`app/(public)`) plutôt que fichier statique, et servir
  Three.js en dépendance locale plutôt que CDN.

Idée de post propagée dans `docs/marketing/linkedin/CONTENT_BANK.md` (« On a fait
tourner notre logo en 3D. Pas pour faire joli. »).
