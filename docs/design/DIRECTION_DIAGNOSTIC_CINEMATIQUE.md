# Direction — Diagnostic cinématique

> Adaptation du « One-Prompt Website Pack » (Zubair Trabzada, éd. 2026) au parcours
> de diagnostic SAFE. Source : `~/Downloads/Fable5-Higgsfield-Website-Prompt-Pack.pdf`.
> À lire avec [DESIGN_HUMAIN.md](DESIGN_HUMAIN.md) (§10 anti-slop prime sur tout).

---

## 1. Ce qu'on retient du pack, et ce qu'on écarte

Le pack est bâti autour de clips vidéo générés par IA (Seedance sur Higgsfield) que le
scroll vient scruber. SAFE n'a pas besoin de ça : le produit existe, on a de vraies
captures et un canvas. **Ce qui se transpose, c'est la grammaire du scroll, pas la vidéo.**

| Dispositif du pack | Prompt source | Transposition au diagnostic |
|---|---|---|
| Hero épinglé scrubbé au scroll | 01 · 08 | Scène d'entrée épinglée : le titre cède la place aux trois promesses, puis au départ |
| « Fixed elegant progress indicator naming each space as you pass it » | 06 · penthouse | Rail de tirets à droite, un par section du questionnaire, la section en cours se nomme |
| HUD de coin qui grimpe avec la progression | 07 · hypercar | Compteur d'avancement en mono tabulaire, sous la question |
| Une ligne par palier de scroll, copy éparse | 09 · 10 | Une question par écran, jamais deux idées à lire en même temps |
| Une image héro référencée partout pour la cohérence | pro tips | Un seul système de jetons du site public sur intro → questionnaire → rapport |
| « Launch on localhost and verify before telling me it's done » | tous | Vérification obligatoire avant de dire terminé |
| Clips vidéo IA, chaînage start/end frame, crédits | 01–10 | **Écarté.** On a le vrai produit à montrer |
| Fonds noir + accent néon, type brutaliste | 04 · 07 · 09 | **Écarté.** La DA SAFE est albâtre et forêt, pas une agence |

## 2. Le prompt, réécrit pour le diagnostic

> Adapte le parcours de diagnostic SAFE (`/audit-gratuit`) en expérience cinématique
> pilotée au défilement, dans la direction artistique du site public : fond albâtre
> `#EFF2ED`, encre `#1F2A24`, vert `#12A150`, forêt `#1F3A2E`, filets à 8 %, serif
> Instrument pour les titres, mono pour les chiffres et les étiquettes.
>
> ENTRÉE — une seule zone épinglée de 420 vh. Au départ : surtitre mono
> « Diagnostic · gratuit · rapport sous 24 h », titre serif « Ce que votre cabinet
> laisse passer. » avec « laisse passer » en italique vert, une phrase de contexte,
> l'indicateur « Faites défiler » en bas. En descendant : le titre s'élève et
> s'efface, les trois promesses arrivent une par une, chacune précédée d'un filet
> qui se trace, jamais deux lisibles en même temps. Elles repartent, le choix de
> langue arrive. Les triangles du logo dérivent en fond et se laissent brasser au
> curseur.
>
> QUESTIONNAIRE — une question par écran. Rail de tirets fixé à droite : un tiret par
> section, celui de la section en cours s'allonge et se nomme, les sections franchies
> restent vertes. Sous la question, un compteur mono tabulaire : pourcentage, étape sur
> total, minutes restantes, et un filet vert d'un pixel qui avance. Fin de section :
> un aplat forêt plein écran, le numéro, un tiret qui se trace, le nom de la section.
>
> RAPPORT — trois indicateurs en mono, l'offre recommandée sur aplat forêt, deux
> actions. Aucun dégradé, aucune ombre portée multiple, aucun emoji.
>
> RYTHME — transitions de 550 à 850 ms, courbe `cubic-bezier(0.16, 1, 0.3, 1)`.
> Rien ne saute, rien ne rebondit. Version empilée sans animation pour
> `prefers-reduced-motion`.
>
> Lance sur localhost et vérifie chaque animation avant de me dire que c'est terminé.

## 3. Règles dures

- **Une question à l'écran.** Le surtitre annonce la section, le compteur donne la position. Rien d'autre.
- **Le vert d'accent ne sert qu'à une chose à la fois** : le CTA, ou le tiret en cours, jamais les deux dans le même regard. L'option retenue prend le forêt, pas l'accent.
- **Pas de dégradé, pas d'ombre empilée, pas de fond radial.** Un filet, une ombre douce sur les cartes, c'est tout.
- **Le rail ne se clique pas.** C'est un repère de lecture, pas une navigation.
- **Le tarif n'apparaît jamais avant le rapport.** Cohérent avec la page tarification.

## 4. Où c'est implémenté

| Élément | Fichier |
|---|---|
| Scène d'entrée, choix de langue, version sans animation | `app/audit-gratuit/page.tsx` |
| Rail de sections, compteur, cartes de question, fin de section, rapport | `components/audit-gratuit/AuditForm.tsx` |
| Jetons, rail CSS, options, champs, boutons | `app/globals.css` (bloc « DIAGNOSTIC ») |
| Triangles dérivants, indicateur de défilement, scrub | `components/public-site/shared.tsx` |

Le questionnaire lui-même (`lib/audit-gratuit/questions.ts`), la validation, la
recommandation et l'envoi API n'ont pas bougé : seule l'interface change.
