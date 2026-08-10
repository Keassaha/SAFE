# Every Web Design Concept Explained in Under 13 Minutes

- **Créateur / chaîne :** Sam Crawford | Web Design Expert
- **URL :** https://www.youtube.com/watch?v=PKYNTm2m8eA&t=221s
- **Date d'ingestion :** 2026-08-05
- **Durée / format :** vidéo, environ 13 minutes, glossaire accéléré de 20 concepts
- **Transcription obtenue :** non. Extraction fondée sur le plan minuté et la description détaillée publiés avec la vidéo. Le lien fourni commence à 3:41, au concept de hiérarchie visuelle.
- **Recherche approfondie faite :** oui. Corroboration avec les principes de design visuel de Nielsen Norman Group, WCAG 2.2 et les guides responsive de web.dev.

---

## 1. Résumé en 3 lignes

La source propose un vocabulaire commun pour relier conception, conversion, accessibilité et performance. À partir du passage transmis, la séquence hiérarchie visuelle, espace, typographie, responsive, mobile-first et grille forme un socle directement applicable à SAFE. L'intérêt n'est pas d'ajouter un style, mais de rendre chaque écran lisible dans le bon ordre sur toute largeur.

## 2. Principes extraits (bruts)

- **00:25 — UX et UI.** Distinguer l'expérience du traitement visuel évite de confondre beauté et facilité d'usage.
- **01:04 à 01:43 — Wireframe, mockup, prototype.** Séparer structure, apparence et comportement avant la production.
- **02:12 — Au-dessus de la ligne de flottaison.** La première vue doit porter l'information et l'action les plus importantes.
- **02:44 — Hero.** Le premier bloc oriente la lecture et la promesse.
- **03:28 — Appel à l'action.** L'action attendue doit être explicite.
- **03:59 — Hiérarchie visuelle.** Le design organise l'ordre dans lequel l'information est perçue.
- **04:21 — Espace blanc.** L'espace sépare, groupe et donne de l'importance ; ce n'est pas du contenu manquant.
- **05:00 — Hiérarchie typographique.** Les rôles typographiques rendent les niveaux d'information reconnaissables.
- **05:47 — Responsive.** L'interface doit adapter sa composition aux dimensions disponibles.
- **06:12 — Mobile-first.** Concevoir d'abord avec la contrainte étroite force la priorisation du contenu.
- **06:40 — Grille.** Un système d'alignement crée cohérence et rythme entre les écrans.
- **07:07 à 07:53 — Rebond et conversion.** L'efficacité doit être observée par des comportements, pas seulement jugée à l'œil.
- **08:29 — Vitesse.** La vitesse de chargement fait partie de l'expérience.
- **09:02 — Accessibilité.** L'interface doit rester utilisable par des capacités et modes d'interaction variés.
- **09:44 — Couleur et contraste.** La couleur porte une hiérarchie et doit conserver une lisibilité suffisante.
- **10:40 — Preuve sociale.** La crédibilité peut être soutenue par des preuves externes sur les surfaces commerciales.
- **11:20 — Landing page et page d'accueil.** Une page ciblée porte un objectif plus étroit qu'un accueil généraliste.

## 3. Vérification / corroboration

- **Hiérarchie visuelle : consensus.** Nielsen Norman Group documente la hiérarchie comme l'un des principes fondamentaux du design visuel. Source : https://media.nngroup.com/media/articles/attachments/Principles_Visual_Design-Letter.pdf
- **Responsive et mobile-first : consensus technique.** web.dev recommande de commencer avec une petite largeur, puis d'ajouter des points de rupture lorsque le contenu l'exige. Source : https://web.dev/articles/responsive-web-design-basics
- **Reflow : exigence normative.** WCAG 2.2 exige que le contenu non excepté reste accessible à une largeur équivalente à 320 pixels CSS sans perte de fonction ni défilement dans deux directions. Source : https://www.w3.org/WAI/WCAG21/Understanding/reflow
- **Vitesse : déjà corroborée.** Les seuils Core Web Vitals et la règle M7 couvrent le principe, sans nouvelle règle.
- **Conversion et rebond : métriques contextuelles.** Elles sont pertinentes pour le site public, mais ne mesurent pas seules la qualité d'un outil professionnel. Dans SAFE interne, temps de tâche, erreurs et abandon de parcours sont plus utiles.
- **Hero et preuve sociale : non promus dans l'application.** Ces concepts concernent principalement la vitrine et les pages d'acquisition.

## 4. Règles promues vers DESIGN_HUMAIN.md

| ID | Catégorie | Règle | Confiance |
|----|-----------|-------|-----------|
| H3 | Hiérarchie | Composer chaque écran selon un ordre explicite : contexte, information décisive, action principale, détails. Si deux éléments réclament simultanément la première lecture, la hiérarchie échoue. | 🟢 |
| E3 | Espacement | Utiliser l'espace pour encoder les groupes : faible à l'intérieur, nettement plus grand entre groupes. Ajouter de l'espace sans modifier les relations ne corrige pas la hiérarchie. | 🟢 |
| T3 | Typographie | Définir des rôles typographiques stables avant les styles locaux. Un changement de taille, graisse ou famille doit signaler un changement de rôle. | 🟢 |
| MB3 | Mobile | Le mobile-first est une priorisation, pas une réduction. Réordonner, replier ou transformer les composants sans supprimer l'information ou l'action essentielle. | 🟢 |
| L5 | Layout | Employer une grille commune comme infrastructure d'alignement entre écrans. Ne la briser que pour créer un point focal justifié, jamais par décoration. | 🟢 |

La source renforce également M2, M3, M6, M7, A8 et MB2 sans créer de doublons.

## 5. Conflits détectés

- **Première vue contre densité professionnelle.** Le principe « au-dessus de la ligne de flottaison » ne signifie pas tout montrer immédiatement. SAFE doit montrer la décision et le contexte prioritaires, puis conserver les détails accessibles par défilement ou divulgation progressive.
- **Conversion commerciale contre efficacité métier.** Sur le site public, conversion et rebond sont pertinents. Dans l'application, les indicateurs sont le temps de tâche, le taux d'erreur, la reprise après interruption et la complétion du parcours.
- **Mobile-first contre tableaux intrinsèquement bidimensionnels.** Les tableaux financiers peuvent justifier un défilement horizontal local. La page entière et les contrôles qui l'entourent doivent néanmoins reflow sans perte de fonction.
