# Prompt Gemini — extraction design d'une vidéo YouTube

But : coller ce prompt dans Gemini (app ou Google AI Studio) avec un lien YouTube.
Gemini regarde la vidéo (image + son) et produit un markdown structuré. Vous me donnez
ce markdown, je l'ingère directement dans `DESIGN_HUMAIN.md` sans retouche.

Remplacez `[COLLER L'URL YOUTUBE ICI]` par le lien de la vidéo.

---

```
Tu es un designer produit / UX senior. Tu analyses une vidéo YouTube de design pour en
extraire de la connaissance design RÉUTILISABLE, HUMAINE et ACTIONNABLE, destinée à une
base de connaissances qui sert à améliorer un vrai site web (SaaS juridique).

VIDÉO À ANALYSER : [COLLER L'URL YOUTUBE ICI]

RÈGLES DE TRAVAIL :
- Regarde la vidéo EN ENTIER : la narration audio ET ce qui est montré à l'écran. Beaucoup
  des meilleurs détails de design sont MONTRÉS mais jamais dits. Capture-les en priorité.
- Sois concret, jamais vague. Donne des valeurs quand elles sont visibles ou déductibles :
  tailles en px, ratios d'espacement, graisses de police, noms/valeurs de couleurs, rayons.
- Distingue toujours trois natures : (a) principe de design établi, (b) technique ou opinion
  personnelle du créateur, (c) chose observée uniquement à l'écran, non verbalisée.
- Repère spécifiquement tout ce qui concerne « éviter un look généré par IA / générique ».
- Donne des horodatages (mm:ss) pour chaque point important.
- Décris les écrans clés avec assez de détail visuel qu'une AUTRE IA qui n'a PAS vu la vidéo
  puisse se les représenter mentalement.

LANGUE ET STYLE : réponds en français. Voix « vous ». Pas de tiret long (—) en milieu de
phrase. Aucun blabla marketing. Concret plutôt qu'abstrait.

PRODUIS UN SEUL DOCUMENT MARKDOWN, avec EXACTEMENT ces sections :

# [Titre exact de la vidéo] — [Nom de la chaîne]
- URL :
- Durée :
- Sujet en une ligne :

## 1. Résumé (3 lignes maximum)

## 2. Écrans clés (contexte visuel)
Pour chaque écran / refonte / exemple important montré :
- Horodatage :
- Ce que c'est :
- Avant → Après (si c'est une refonte) :
- Structure de mise en page (grille, colonnes, alignement) :
- Espacement et densité :
- Typographie (tailles, graisses, hiérarchie) :
- Couleurs (valeurs si visibles) :
- Pourquoi ça fonctionne (ou pourquoi la version « avant » ratait) :

## 3. Principes de design extraits
Un tableau. Une ligne par principe :
| Principe (à l'impératif) | Pourquoi | Comment l'appliquer (valeurs concrètes) | Horodatage | Catégorie | Nature |
La colonne Catégorie doit valoir exactement l'une de :
Layout · Espacement · Typographie · Couleur · Hiérarchie · Composants · Mobile · Motion · UX writing · Anti-IA
La colonne Nature doit valoir : Principe établi · Technique du créateur · Observé à l'écran

## 4. Signaux « design IA » à éviter
Tout ce que la vidéo dit ou montre sur ce qui trahit un design générique / généré par IA,
et ce qu'il faut faire à la place.

## 5. Captures à prendre
Liste d'horodatages (mm:ss) qui méritent une capture d'écran, avec en une ligne pourquoi
cette image est utile. Objectif : je pourrai prendre 3 à 6 captures et les envoyer à Claude
pour analyse visuelle directe.

## 6. Zones d'incertitude
Les affirmations qui relèvent du goût personnel, ou qui ne sont pas vérifiées, ou qui te
semblent discutables. Sois honnête sur ce qui est opinion plutôt que règle.
```

---

## Comment vous vous en servez

1. Copiez le bloc ci-dessus, remplacez l'URL, collez dans Gemini.
2. Gemini renvoie un markdown. Copiez-le tel quel et donnez-le-moi (collé, ou dans un fichier).
3. Optionnel mais utile : Gemini vous liste des horodatages de captures (section 5). Prenez
   ces captures et envoyez-les-moi aussi, je les analyse visuellement en direct.
4. J'ingère : création du fichier `sources/AAAA-MM-JJ_slug.md`, promotion des règles dans
   `DESIGN_HUMAIN.md` avec IDs, dédup et gestion des conflits.
