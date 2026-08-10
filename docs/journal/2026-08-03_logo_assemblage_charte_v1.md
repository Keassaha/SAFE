# 2026-08-03 — Nouveau logo « L'Assemblage », charte graphique v1.0

## Ce qui a été décidé

Le CEO a fourni une charte graphique complète (`safe-identite-visuelle.html`) et
demandé de remplacer le logo sur tout le site. La marque « Les Galets », servie
depuis le 2026-08-02, est écartée après une journée. Elle rejoint « La Voûte » dans
les pistes conservées pour mémoire.

**La marque servie est désormais « L'Assemblage »** : un carré unique partagé par un
joint orthogonal en gradins, deux pièces rigoureusement identiques tournées de 180°.
Le joint trace un S en creux, jamais dessiné.

## Ce qui a été bâti

**La source unique tient toujours.** Le chantier du 2026-08-02 a payé : changer de
marque a demandé de réécrire un seul fichier de formes, pas huit. Aucun écran, aucune
page, aucun composant produit n'a eu à être retouché.

- `components/brand/safe-mark.ts` — géométrie sur grille de dix modules (cotes en
  fractions du côté), dessin ultra petite taille distinct sous 20 px, palette de la
  charte, six tons d'encre.
- `components/branding/SafeLogo.tsx` — deux pièces au lieu d'une forme, bascule
  automatique vers le dessin ultra petite taille, wordmark passé du serif au
  grotesque.
- `app/icon.svg` — favicon sur le dessin ultra petite taille.
- `scripts/render-brand-assets.mjs` + `npm run brand:assets` — fabrique les PNG de la
  marque en **lisant** les chemins dans la source. C'est la réponse au vieux problème
  des images de logo qui divergent du code.
- `lib/seo.ts` — les données structurées pointaient sur une image de concept
  1376 × 768. Elles pointent maintenant sur un vrai logo carré.
- `public/experience-3d.html` — prototype non lié, mis à jour (extrusion 3D des deux
  pièces, échelle recalée puisque le dessin remplit maintenant son repère).
- Docs : `IDENTITE_SAFE.md` §4 réécrit, `SAFE_BRAND_CONTEXT.md` §4 réécrit, `CLAUDE.md`.

## Deux décisions techniques qui méritent d'être notées

**Le joint est évidé, pas peint.** La charte le montre en blanc cassé sur fond clair
et en vert forêt sur fond sombre, c'est-à-dire toujours de la couleur du fond. Plutôt
que de coder une troisième encre par ton, les deux pièces sont deux chemins distincts
et c'est le fond qui passe entre elles. Conséquence : la règle « le joint ne disparaît
jamais » tient toute seule sur n'importe quelle surface, y compris en `currentColor`
dans le rapport d'audit. Le prix : sur une surface texturée, il faut poser le symbole
sur un aplat.

**Le rapport mot / symbole a été pris sur l'entête de la charte, pas sur sa planche
de démonstration.** La charte compose le mot à 0,50 du côté du symbole sur la planche
à 52 px, mais à 0,59 dans la barre latérale à 22 px et 0,65 dans l'entête à 26 px. Le
produit n'emploie que 17 à 22 px de mark : à 0,50 le mot tombait sous onze pixels dans
toutes les navigations. Encodé à **0,62**.

## Écart assumé avec la charte

Le symbole est maintenant une masse pleine qui remplit son repère, là où « Les Galets »
n'en occupaient que 67 %. À taille de `size` égale, le logo pèse environ un quart plus
lourd. Aucun appelant n'a été retouché : les tailles en place (17 à 22 px) restent dans
la fourchette de la charte et le résultat a été vérifié à l'écran sur l'accueil, le
diagnostic gratuit, la connexion et `/marque`.

## Non fait

- Verrou empilé et wordmark seul : définis dans la charte, pas encore codés.
- `manifest.json` : toujours absent.
- Recherche aux registres de marques figuratives : nécessaire avant tout dépôt, la
  charte le dit elle-même.

## Vérifications

`tsc --noEmit` propre · `next lint` propre sur les fichiers touchés · 117 fichiers de
tests, 1363 tests verts · rendu contrôlé au navigateur sur `/`, `/audit-gratuit`,
`/connexion`, `/marque` et `/icon.svg`.

---

## Correctif du même jour — les verrous recopiés à la main

Le CEO signale que le favicon a changé mais pas l'entête de l'application. Diagnostic :
**six surfaces recopiaient le logo à la main** au lieu d'employer le composant
canonique. Elles échappaient donc au changement de marque, et certaines n'ont jamais
montré la marque du tout.

| Surface | Ce qu'elle affichait |
|---|---|
| `components/layout/Header.tsx` | `SafeMark` avec le ton « fond sombre » sur un fond clair (donc une seule pièce visible) + le mot recopié en serif |
| `components/onboarding/Header.tsx` | un « S » dans un carré vert |
| `components/onboarding/LanguageSelect.tsx` | un « S » gras dans une pastille |
| `app/atelier/_components/Rail.tsx` | un « S » dans un carré vert |
| `app/(app-v2)/v2/_components/SidebarV2.tsx` | un « S » dans un carré vert |
| `app/(app-v2)/v2/_components/TopbarV2.tsx` | le mot seul, recopié |

Toutes passent maintenant par `SafeLogo`.

**Ce qui poussait à la recopie.** L'entête et la topbar masquent le mot en petit
écran, ce que le composant canonique ne savait pas faire : la seule sortie était de
recomposer le verrou à côté. `SafeLogo` accepte désormais `wordClassName`, ce qui
retire le motif de la recopie plutôt que de se contenter de la corriger.

**Leçon.** « Source unique » ne tient que si le composant couvre les besoins réels des
appelants. Un manque d'API se paie en copies silencieuses, et une copie silencieuse ne
se voit que le jour où la marque change.
