# The 3 dashboard UI flaws that give away you've NEVER built one — Kole Jain

- **Créateur / chaîne :** Kole Jain
- **URL :** https://youtu.be/Ksx9C2-3yMo
- **Date d'ingestion :** 2026-07-21
- **Durée / format :** 06:59
- **Transcription obtenue :** oui (analyse Gemini fournie par l'utilisateur, image + son)
- **Recherche approfondie faite :** oui (corroboration web : divulgation progressive, alignement des nombres, hover vs tactile)

---

## 1. Résumé en 3 lignes

Un bon tableau de bord adapte sa structure visuelle à la nature des données au lieu de les
forcer dans un tableau standard. Il divulgue progressivement les fonctions secondaires,
révélées seulement quand elles sont utiles. Son efficacité tient à une couche d'UI discrète
(états au survol, info-bulles) qui garde l'écran propre.

## 2. Principes extraits (bruts, depuis l'analyse Gemini)

- Laissez la donnée dicter la forme, ne forcez pas tout dans un tableau standard (00:00:43).
- Pastilles (chips) à fond coloré subtil pour les statuts récurrents, vert = actif, gris = inactif.
- Grisez les lignes désactivées pour réduire le bruit visuel.
- Alignez les chiffres à droite pour comparaison rapide par valeur de position (00:00:43).
- Tronquez les textes longs pour rendre de la respiration aux colonnes importantes.
- Entêtes en graisse moyenne, données en régulier (hiérarchie discrète).
- Remplacez un tableau trié par date par une timeline / ligne de temps ou un tiroir (00:01:30).
- Divulgation progressive : actions secondaires (supprimer, éditer) révélées au survol (00:03:07).
- Onboarding séquencé : une info-bulle ciblée au bon moment plutôt qu'une modale à 6 puces (00:04:02).
- Couche d'UI « invisible » : indicateurs discrets (ex. petit triangle ~8px pour un commentaire caché) (00:05:21).
- Icônes cibles ~16x16px minimum.

## 3. Vérification / corroboration

- **Aligner les nombres à droite / ne pas centrer les données :** CONSENSUS. On compare les
  nombres par leur chiffre le moins significatif ; le centrage nuit au balayage.
  (Pencil & Paper, UX Design World, A List Apart.)
- **Divulgation progressive :** CONSENSUS établi (Nielsen, 1995 ; étude 2006 = 30-50 % de
  gain sur la tâche initiale). MAIS la bonne pratique exige un **déclencheur persistant et
  découvrable** (icône « i », lien « Voir détails »), pas le survol comme seul accès.
  → La reco « tout au hover » du créateur est un anti-pattern connu pour le tactile et
  l'accessibilité. On garde le principe, on rejette le « hover seul ». (UXPin, IxDF.)
- **Avatars au lieu de noms :** goût du créateur, contexte-dépendant. Voir §5 conflits.

## 4. Règles promues vers DESIGN_HUMAIN.md

| ID | Catégorie | Règle | Confiance |
|----|-----------|-------|-----------|
| L1 | Layout | Laissez la donnée dicter la forme (pas de tableau standard forcé) | 🟢 |
| L2 | Layout | Alignez les nombres à droite, jamais centrés | 🟢 |
| E1 | Espacement | Tronquez les textes longs pour rendre de la respiration aux colonnes clés | 🟡 |
| T1 | Typographie | Hiérarchie de tableau discrète : entêtes en graisse moyenne, données en régulier | 🟡 |
| C1 | Couleur | Statuts via pastilles à fond coloré subtil ; grisez les lignes désactivées | 🟡 |
| H1 | Hiérarchie | Divulgation progressive : révélez les actions secondaires au moment utile | 🟢 |
| P1 | Composants | Remplacez un tableau trié par date par une timeline / tiroir | 🟡 |
| P2 | Composants | Prévoyez une couche d'UI contextuelle discrète (indicateurs ~8px) | 🟡 |
| MB1 | Mobile | Ne cachez jamais une action essentielle derrière le seul survol (tactile) | 🟢 |
| U1 | UX writing | Séquencez l'onboarding : une info-bulle ciblée plutôt qu'une modale à 6 puces | 🟢 |
| A11 | Anti-IA | Évitez le « tout visible » (toutes les actions sur chaque ligne en permanence) | 🟡 |
| A12 | Anti-IA | N'expliquez pas une fonction par un gros bloc de texte ; info-bulle courte ciblée | 🟡 |

## 5. Conflits détectés

- **Avatars vs noms en clair.** Le créateur préfère des avatars pour une reconnaissance plus
  rapide. En cabinet juridique, les identités exactes (clients, juges, parties adverses) sont
  critiques : un avatar coloré risque l'erreur de manipulation. → §11.
- **Divulgation par survol vs tactile.** Le créateur s'appuie fortement sur le hover. Sur
  tablette/mobile le survol n'existe pas. → §11. Tempère H1 et fonde MB1.
