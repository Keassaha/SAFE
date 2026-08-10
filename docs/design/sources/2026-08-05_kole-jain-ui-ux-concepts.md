# Every UI/UX Concept Explained in Under 10 Minutes

- **Créateur / chaîne :** Kole Jain
- **URL :** https://www.youtube.com/watch?v=EcbgbKtOELY&t=144s
- **Date d'ingestion :** 2026-08-05
- **Publication :** 2026-03-14
- **Durée / format :** 10 min 23 s, panorama accéléré de onze fondamentaux UI/UX
- **Transcription obtenue :** oui, transcription horodatée complète publiée par Sozai (1 784 mots, précision annoncée 95 %), recoupée avec le plan minuté officiel YouTube. Le lien fourni commence à 2:24, dans la partie « grilles, layouts et espacement ».
- **Recherche approfondie faite :** oui. Corroboration avec WCAG 2.2 et les Human Interface Guidelines d'Apple.

---

## 1. Résumé en 3 lignes

Une interface professionnelle doit expliquer son fonctionnement par sa forme : sélection, désactivation, clic, chargement et résultat restent perceptibles sans mode d'emploi. La cohérence vient d'une hiérarchie forte, d'un rythme d'espacement divisible, d'une palette sémantique et de composants dont tous les états sont conçus. Pour SAFE, l'apport principal est une matrice d'états et de feedback obligatoire, complétée par des règles précises pour le mode sombre, les icônes et les actions secondaires.

## 2. Principes extraits (bruts)

- **00:00 à 00:45 — Affordances et signifiants.** Conteneurs, sélection, désactivation, survol, état pressé, navigation active et info-bulles doivent faire comprendre ce qu'un élément permet de faire.
- **00:45 à 02:04 — Hiérarchie visuelle.** Taille, position, couleur et contraste organisent le balayage. L'information décisive remonte, grossit ou se distingue ; les métadonnées reculent.
- **02:04 à 03:16 — Grilles, layout et espace.** Les grilles sont des guides, surtout utiles aux contenus répétitifs et au responsive. L'espace blanc et le groupement priment sur l'alignement dogmatique. Une échelle de 4 px facilite la cohérence et la division des valeurs.
- **03:16 à 04:55 — Typographie.** Une seule famille sans serif suffit généralement. Les grands titres gagnent en tenue avec un interlignage de 110 à 120 % et un léger resserrement ; un tableau de bord conserve une plage de tailles plus compacte qu'une page marketing.
- **04:55 à 05:47 — Couleur.** Partir d'une couleur primaire et de sa rampe. Employer les couleurs sémantiques pour transmettre un sens, jamais comme décoration gratuite.
- **05:47 à 06:19 — Mode sombre.** Réduire le contraste des bordures, créer la profondeur avec des surfaces légèrement plus claires que le fond et calmer la saturation des accents.
- **06:19 à 06:53 — Ombres.** En mode clair, réduire l'opacité et augmenter le flou. Une carte demande moins d'élévation qu'un popover. Si l'ombre est le premier élément remarqué, elle est trop forte.
- **06:53 à 07:29 — Icônes et boutons.** Aligner la taille de l'icône sur la hauteur de ligne du libellé. Employer un bouton fantôme pour l'action secondaire et préserver une hiérarchie explicite entre CTA.
- **07:29 à 08:07 — Feedback et états.** Tout bouton possède au minimum les états défaut, survol, pressé et désactivé, plus chargement si nécessaire. Les champs exigent focus, erreur et, selon le cas, avertissement. Toute action reçoit une réponse visible.
- **08:07 à 08:36 — Micro-interactions.** Le mouvement peut confirmer une action, par exemple la copie d'une valeur, à condition de rendre le résultat plus clair.
- **08:36 à 10:04 — Overlays.** Pour du texte sur image, préférer un dégradé localisé, éventuellement accompagné d'un flou progressif, plutôt qu'un voile uniforme qui dégrade l'image entière.

## 3. Vérification / corroboration

- **États et feedback : consensus.** Apple indique que le feedback doit informer du statut, du succès ou de l'échec, et adapter son niveau d'interruption à l'importance. Source : https://developer.apple.com/design/human-interface-guidelines/feedback
- **Focus visible : exigence normative.** WCAG 2.2 impose un indicateur visible pour tout composant opérable au clavier. Source : https://www.w3.org/WAI/WCAG22/Understanding/focus-visible
- **Messages d'état : exigence normative.** Les changements de succès, progression, attente ou erreur doivent être déterminables par les technologies d'assistance sans déplacer inutilement le focus. Source : https://www.w3.org/WAI/WCAG22/Understanding/status-messages
- **Couleur sémantique : nuance obligatoire.** WCAG interdit que la couleur soit l'unique moyen de transmettre une information. Source : https://www.w3.org/WAI/WCAG22/Understanding/use-of-color
- **Valeurs numériques : heuristiques, pas normes.** La grille de 4 px, le plafond typographique de 24 px pour les dashboards et le ratio de padding des boutons sont des repères du créateur, à tester dans le système SAFE.

## 4. Règles promues vers DESIGN_HUMAIN.md

| ID | Catégorie | Règle | Confiance |
|----|-----------|-------|-----------|
| E4 | Espacement | Construire l'échelle d'espacement sur un pas de 4 px, puis choisir les valeurs selon la relation entre éléments plutôt que de répéter un écart uniforme. | 🟢 |
| C3 | Couleur | Employer la couleur selon un rôle sémantique stable et toujours doubler le sens par du texte, une forme ou une icône. | 🟢 |
| C4 | Mode sombre | Recomposer la profondeur : surfaces élevées légèrement plus claires, bordures moins contrastées, accents moins saturés ; ne pas simplement inverser la palette claire. | 🟡 |
| P6 | Composants | Un contrôle doit signifier son affordance et son état sans mode d'emploi, avec libellé, forme, sélection, désactivation, survol et focus cohérents. | 🟢 |
| P7 | États | Définir une matrice d'états par composant : défaut, survol, focus, pressé, désactivé, chargement, succès, avertissement et erreur selon pertinence. | 🟢 |
| P8 | Icônes et actions | Aligner les icônes sur la hauteur de ligne et réserver le bouton fantôme aux actions secondaires ; la primauté d'une action reste visible. | 🟡 |
| MO3 | Feedback | Toute action produit une réponse proportionnée, proche de son objet et accessible ; les micro-interactions confirment sans interrompre. | 🟢 |

La source renforce également M3, E3, T3, H3, MO2, A3 et A8 sans créer de doublons.

## 5. Conflits détectés

- **Couleurs universelles contre contexte juridique.** Les associations bleu/confiance, rouge/danger, jaune/avertissement et vert/succès sont utiles mais non universelles. SAFE conserve des libellés explicites et des icônes ; la couleur ne porte jamais seule le statut.
- **Ombres en mode sombre contre profondeur à trois plans.** La vidéo recommande surtout la luminance des surfaces en mode sombre. SAFE peut conserver une ombre très discrète sur une superposition, mais la séparation principale vient des plans et du contraste des surfaces.
- **Overlays éditoriaux contre outil opérationnel.** Le gradient sur image concerne les surfaces éditoriales ou la vitrine. Il ne justifie pas d'ajouter des images décoratives dans les écrans de gestion.
