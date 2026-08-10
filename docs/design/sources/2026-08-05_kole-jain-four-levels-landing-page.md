# The 4 Levels of Landing Page UI/UX Design

- **Créateur / chaîne :** Kole Jain
- **URL :** https://www.youtube.com/watch?v=eMMiLeo_UGI&t=49s
- **Date d'ingestion :** 2026-08-05
- **Publication :** 2026-05-17
- **Durée / format :** 9 min 58 s, comparaison progressive de quatre niveaux d'une même landing page SaaS
- **Transcription obtenue :** oui. Sous-titres automatiques anglais consultés dans l'interface YouTube et relevés par segments horodatés d'environ 5 secondes. Le lien fourni commence à 0:49, dans l'analyse du niveau 1.
- **Recherche approfondie faite :** oui. Corroboration responsive avec web.dev ; les prix cités et les notes sur 10 restent des opinions commerciales du créateur.

---

## 1. Résumé en 3 lignes

La progression d'une landing page ne vient pas d'une accumulation d'effets, mais d'un passage du gabarit fonctionnel à une expérience dont contenu, preuves produit, mise en page et transitions semblent conçus ensemble. Le saut le plus important consiste à remplacer la copie vague et les captures littérales par une promesse orientée résultat et des vues produit soigneusement cadrées. Le niveau le plus élevé ajoute surtout de la retenue, de la continuité et des micro-détails, sans exiger d'illustrations 3D ni d'effets spectaculaires.

## 2. Principes extraits (bruts)

- **00:00 à 02:16 — Niveau 1.** Page fonctionnelle mais générique : alternance mécanique texte/image, captures et rayons visuellement incompatibles, hiérarchie faible, copie vague ou redondante, navigation plate, CTA insuffisamment priorisé, couleur appliquée sans logique et absence de mouvement utile. Note et tarif donnés par le créateur : 2/10 et environ 500 $, non généralisables.
- **02:16 à 04:49 — Niveau 2.** Identité plus cohérente : hero centré qui respire, capture réelle du dashboard mieux cadrée, palette nourrie par le produit, typographie resserrée, copie améliorée, hiérarchie explicite dans la navigation et CTA principal cohérent. Des animations d'entrée simples et une progression verticale apparaissent, mais les transitions entre sections restent abruptes. Évaluation subjective : 6/10 et environ 2 000 $.
- **04:49 à 07:21 — Niveau 3.** Passage de l'assemblage au métier : extraits du dashboard recadrés sur les preuves utiles, lignes verticales qui relient la composition, adaptation aux grands écrans, variation des structures selon le contenu, grille bento lorsque pertinente, sections plus compactes et copie plus courte. Badges, logos, preuve sociale et méga-menu renforcent la crédibilité. Interactions et hover subtils donnent de la profondeur. Évaluation subjective : 8/10 et 6 000 à 10 000 $.
- **07:21 à 09:58 — Niveau 4.** Le gain vient des détails : chaque vue est fabriquée pour son contexte, la mise en page se moule au contenu, la typographie s'équilibre, la copie passe de « ce que fait le produit » à « comment il vous aide », et la couleur revient par des visuels sélectionnés. Les transitions deviennent continues, avec flou localisé, déplacement fluide du contenu et CTA contextuel au survol. La page encourage le défilement. Le créateur insiste : aucune 3D extravagante n'est nécessaire. Évaluation subjective : 10/10 et plus de 10 000 $.

## 3. Vérification / corroboration

- **Responsive dicté par le contenu : consensus technique.** web.dev recommande de partir d'une faible largeur, d'ajouter les points de rupture lorsque le contenu l'exige et de limiter la largeur utile sur grand écran. Source : https://web.dev/articles/responsive-web-design-basics
- **Variation de forme selon l'écran : consensus technique.** web.dev précise qu'une interface large ne doit pas être une version simplement agrandie de la version étroite, et qu'une grille peut devenir un carrousel ou une autre forme selon le contexte. Source : https://web.dev/learn/design/ui-patterns/
- **Contenu réel avant gabarit : corroboré.** web.dev recommande de concevoir avec les vrais textes et images plutôt qu'avec du contenu fictif. Source : https://web.dev/articles/multi-device-content
- **Tarifs et scores : non promus.** Ils servent la narration de la vidéo et dépendent du marché, du périmètre et du créateur. Ils ne mesurent pas la qualité de SAFE.
- **Méga-menu, bento et flou : contextuels.** Ce sont des formes possibles, pas des ingrédients obligatoires. Leur présence ne constitue pas un niveau de qualité en soi.

## 4. Règles promues vers DESIGN_HUMAIN.md

| ID | Catégorie | Règle | Confiance |
|----|-----------|-------|-----------|
| L6 | Layout | Sur la vitrine, cadrer chaque preuve produit sur la capacité à démontrer ; éviter la capture intégrale illisible d'un dashboard. | 🟢 |
| H4 | Hiérarchie | Écrire la promesse depuis le résultat utilisateur avant d'expliquer la fonction. Chaque section répond d'abord à « ce que cela change pour vous ». | 🟢 |
| P9 | Composants | Une preuve produit est une démonstration contextualisée : vue recadrée, état réaliste, légende utile et interaction légère si elle clarifie. | 🟡 |
| MO4 | Motion | Sur la vitrine, relier les sections par des transitions de contenu continues ; le mouvement accompagne le récit sans devenir le sujet. | 🟡 |
| A17 | Anti-slop | Éviter l'alternance mécanique texte/image répétée sur toute la page ; faire varier la composition selon la preuve et le message. | 🟢 |
| A18 | Anti-slop | Éviter les captures produit jetées telles quelles dans un cadre générique ; recadrer et fabriquer la vue pour la promesse. | 🟢 |

La source renforce M1, M3, M6, L5, E3, T3, C3, H3, MB3, MO2, A4, A5, A7, A9 et A16.

## 5. Conflits détectés

- **Mouvement éditorial contre calme de l'instrument.** Les transitions continues et effets de flou du niveau 4 s'appliquent au site public. Dans l'application SAFE, MO2 et MO3 restent prioritaires : mouvement court et fonctionnel uniquement.
- **Survol révélateur contre accessibilité.** Un CTA apparaissant au survol peut enrichir une carte sur bureau, mais l'action doit rester accessible au clavier et disposer d'un équivalent tactile persistant.
- **Landing page élaborée contre performance.** Une vue produit fabriquée et animée ne doit pas devenir une vidéo ou une image lourde qui fait échouer LCP. M7 prime sur le raffinement.
