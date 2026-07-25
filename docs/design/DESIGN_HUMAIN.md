# Base de connaissances design — sources humaines

> **But de ce fichier.** Rassembler, hiérarchiser et sourcer des conseils de design
> d'interface (web + mobile) tirés de créateurs humains, pour produire des interfaces
> qui ressemblent à du travail humain de qualité, jamais à du « design généré par IA ».
>
> **Portable par conception.** Ce fichier est du markdown pur. Il est lu par n'importe
> quel assistant (Claude Code, Codex, autre) qui travaille dans ce repo. La connaissance
> vit ici, pas dans les poids d'un modèle. C'est la source de vérité design du projet.
>
> **Toujours applicable.** Dès qu'il est question de design, layout, UI, composant,
> page ou écran, consulter ce fichier AVANT de coder. Les méta-règles priment sur tout.

---

## Comment lire ce fichier

Chaque règle porte un identifiant, une catégorie, un niveau de confiance et sa ou ses sources.

**Niveaux de confiance :**
- 🟢 **Consensus** — plusieurs sources humaines crédibles convergent, ou principe design établi de longue date.
- 🟡 **Source unique crédible** — une seule bonne source, cohérent avec la pratique.
- 🟠 **Opinion / à valider** — avis isolé, contextuel, ou goût personnel du créateur.

**Priorité en cas de conflit :** méta-règles (§0) > règles 🟢 > règles 🟡 > règles 🟠.
Quand deux sources se contredisent, on garde les deux, on note le désaccord, et le
contexte tranche (voir §11 Conflits).

**Sources.** Chaque entrée renvoie à un fichier `sources/AAAA-MM-JJ_slug.md` où se trouve
l'extraction brute (transcription + notes) de la vidéo d'origine. Voir `sources/_INDEX.md`.

**Statut d'une entrée :**
- `SEED` — principe de départ posé à la création du système, à valider/enrichir par des sources vidéo humaines.
- `SOURCÉ` — adossé à au moins une source vidéo cataloguée.

---

## §0 — Méta-règles (priorité absolue)

Ces règles priment sur toutes les autres. Elles encodent l'objectif central : **ne pas produire de design « AI-centered ».**

| ID | Règle | Confiance | Statut |
|----|-------|-----------|--------|
| M1 | **Partir d'un contenu réel, pas d'un gabarit.** Concevoir autour du vrai contenu (vrais mots, vraies données, vrais cas limites), jamais autour d'un squelette « hero + 3 cartes + CTA ». | 🟢 | SEED |
| M2 | **Une intention par écran.** Chaque écran a UNE action principale évidente. Si tout est mis en avant, rien ne l'est. | 🟢 | SEED |
| M3 | **La hiérarchie prime sur la décoration.** Régler taille, poids, espacement et contraste AVANT d'ajouter ombres, dégradés, glassmorphism. | 🟢 | SEED |
| M4 | **Éviter les tells de l'IA (voir §10).** À chaque écran, passer la checklist anti-slop §10 avant de considérer le travail terminé. | 🟢 | SEED |
| M5 | **Cohérence avant nouveauté.** Réutiliser les tokens, composants et patterns existants du repo (`si-*`, `docs/skills-ux/`) plutôt qu'inventer un style par écran. | 🟢 | SEED |
| M6 | **Le vide est un outil, pas un manque.** Ne pas remplir l'espace par réflexe. L'espace négatif dirige l'attention. | 🟢 | SEED |

---

## §1 — Layout & structure

Grille, composition, densité, alignement.

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| L1 | **Laissez la donnée dicter la forme.** Choisir la forme selon le type de donnée plutôt que tout forcer dans un tableau standard. Ex. : pastilles pour statuts récurrents, timeline pour du chronologique. | 🟢 | SOURCÉ | Kole Jain |
| L2 | **Alignez les nombres à droite, jamais centrés.** On compare les nombres par leur dernier chiffre ; le centrage des données casse le balayage vertical. Texte à gauche, nombres à droite, entêtes alignés sur leur colonne. | 🟢 | SOURCÉ | Kole Jain + corroboré |

---

## §2 — Espacement & rythme

Marges, gouttières, échelle d'espacement, respiration.

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| E1 | **Tronquez les textes longs pour rendre de la respiration aux colonnes clés.** Un champ trop bavard vole l'espace des colonnes qui portent la décision. Tronquer avec ellipse + valeur complète au survol/clic. | 🟡 | SOURCÉ | Kole Jain |

---

## §3 — Typographie

Familles, échelle, graisses, interlignage, longueur de ligne.

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| T1 | **Hiérarchie de tableau discrète.** Entêtes de colonnes en graisse moyenne, données en régulier. La hiérarchie se lit sans gras criard ni changement de taille brutal. | 🟡 | SOURCÉ | Kole Jain |

---

## §4 — Couleur & contraste

Palette, rôles de couleur, accessibilité, mode sombre.

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| C1 | **Statuts via pastilles à fond coloré subtil ; grisez ce qui est inactif.** Vert = actif, gris = inactif, etc. L'œil scanne la couleur/forme plus vite que le texte. Griser les lignes désactivées réduit le bruit. Garder un contraste suffisant (voir A8). | 🟡 | SOURCÉ | Kole Jain |

---

## §5 — Hiérarchie visuelle & attention

Parcours de l'œil, focalisation, groupement, contraste de rôle.

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| H1 | **Divulgation progressive.** Ne montrer que l'essentiel par défaut, révéler les actions secondaires au moment utile. Réduit la charge visuelle (étude 2006 : 30-50 % plus rapide sur la tâche initiale). **Nuance obligatoire :** le déclencheur doit rester persistant et découvrable (icône « i », lien « Voir détails »), jamais le survol seul (voir MB1, conflit §11). | 🟢 | SOURCÉ | Kole Jain + corroboré |

---

## §6 — Composants & patterns d'interface

Boutons, formulaires, cartes, tableaux, navigation, états (vide, chargement, erreur).

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| P1 | **Remplacez un tableau trié par date par une timeline.** Une ligne de temps latérale (ou dans un tiroir rétractable) se suit mieux qu'un tableau chronologique. | 🟡 | SOURCÉ | Kole Jain |
| P2 | **Prévoyez une couche d'UI contextuelle discrète.** Indicateurs légers (ex. triangle ~8px signalant un commentaire caché) qui gardent l'écran propre tout en signalant la profondeur. | 🟡 | SOURCÉ | Kole Jain |

---

## §7 — Mobile & tactile

Cibles tactiles, zones du pouce, densité mobile, gestes, responsive.

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| MB1 | **Ne cachez jamais une action essentielle derrière le seul survol.** Sur tablette et mobile le hover n'existe pas. Toute action révélée au survol doit avoir un déclencheur tactile équivalent (bouton visible, menu « ... », appui long). Pertinent pour SAFE : les écrans peuvent être consultés sur tablette. | 🟢 | SOURCÉ | corroboré (tempère Kole Jain) |

---

## §8 — Motion & micro-interactions

Durées, courbes, feedback, transitions, retenue.

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| MO1 | *(en attente de première vidéo)* | | | |

---

## §9 — Contenu & voix dans l'interface (UX writing)

Libellés, microcopie, états d'erreur, ton. Se coordonne avec les règles de voix de marque SAFE
(voir mémoire `feedback_no_em_dash`, `feedback_linkedin_voice` et `docs/skills-ux/ux-writing.md`).

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| U1 | **Séquencez l'onboarding, ne le déversez pas.** Une info-bulle ciblée au bon moment vaut mieux qu'une modale d'accueil à 6 puces. L'information morcelée se retient mieux. | 🟢 | SOURCÉ | Kole Jain |

---

## §10 — Anti-patterns « AI-centered » (catalogue vivant)

> Cœur du système. Liste des signaux qui trahissent un design généré sans direction humaine.
> **Checklist obligatoire avant de livrer un écran (méta-règle M4).**
> Chaque entrée sera confirmée/enrichie par les vidéos. Les entrées SEED sont des tells
> largement reconnus, à valider par des sources humaines.

| ID | Tell à éviter | À faire à la place | Confiance | Statut |
|----|---------------|--------------------|-----------|--------|
| A1 | Dégradé violet/indigo « SaaS générique » en fond de hero. | Couleur de marque intentionnelle, aplats ou usage très parcimonieux du dégradé. | 🟢 | SEED |
| A2 | Tout centré (titres, texte, boutons) sur toute la page. | Alignement à gauche pour le texte de lecture, centrage réservé aux moments courts et délibérés. | 🟢 | SEED |
| A3 | Glassmorphism / flou partout, ombres portées uniformes et molles. | Élévation hiérarchisée : peu de niveaux d'ombre, chacun signifiant quelque chose. | 🟢 | SEED |
| A4 | Rayon de bordure identique sur tout (cartes, boutons, inputs, images). | Échelle de rayons cohérente mais différenciée selon le rôle. | 🟡 | SEED |
| A5 | Structure « hero + 3 cartes de features à icônes + CTA » reproduite telle quelle. | Structure dictée par le contenu réel et l'histoire à raconter. | 🟢 | SEED |
| A6 | Puces avec emoji, icônes décoratives sans fonction, ✨ et 🚀 partout. | Icônes seulement quand elles aident à repérer ou distinguer ; sinon rien. | 🟡 | SEED |
| A7 | Texte de remplissage vague (« Empower your workflow », « Seamless experience »). | Copie concrète, spécifique au vrai bénéfice, dans la voix SAFE (« vous », pas d'em-dash). | 🟢 | SEED |
| A8 | Contraste faible « gris sur gris » esthétique mais illisible. | Contraste suffisant (viser WCAG AA), hiérarchie par le poids et l'espace, pas que par le gris. | 🟢 | SEED |
| A9 | Espacement uniforme partout, aucune variation de densité, aucune respiration. | Rythme vertical intentionnel : rapprocher ce qui va ensemble, séparer les groupes. | 🟢 | SEED |
| A10 | Symétrie parfaite et grille rigide sans aucun point focal. | Créer une tension/asymétrie volontaire pour guider l'œil. | 🟠 | SEED |
| A11 | Syndrome du « tout visible » : toutes les actions (éditer, dupliquer, supprimer) affichées en permanence sur chaque ligne. | Divulgation progressive : révéler au survol/contexte, avec un déclencheur tactile équivalent (MB1). Ne laisse que l'essentiel par défaut. | 🟡 | SOURCÉ (Kole Jain) |
| A12 | Expliquer une fonctionnalité par un gros bloc de texte ou une modale à puces (« surmots »). | Info-bulle courte et ciblée sur une icône, au moment utile (U1). | 🟡 | SOURCÉ (Kole Jain) |

---

## §11 — Conflits entre sources

Quand deux créateurs se contredisent, on ne tranche pas arbitrairement : on documente ici le
désaccord et la règle de contexte qui permet de choisir.

| Sujet | Position A | Position B | Comment trancher |
|-------|-----------|-----------|------------------|
| Avatars vs noms en clair dans les tableaux | Kole Jain : préférer des avatars pour une reconnaissance visuelle plus rapide. | Contexte SAFE : les identités exactes (clients, juges, parties adverses) sont critiques ; un avatar coloré risque l'erreur de manipulation. | **Contexte cabinet juridique = noms en clair.** Avatar seulement en complément du nom, jamais à sa place. Règle générale non retenue pour SAFE. |
| Révélation par survol vs tactile | Kole Jain : révéler les actions au hover pour garder l'écran propre. | Corroboration : le hover n'existe pas sur tablette/mobile ; hover-seul = anti-pattern d'accessibilité. | **Garder la divulgation progressive (H1), rejeter le « hover seul ».** Toujours un déclencheur persistant/tactile (MB1). |

---

## Journal d'ingestion

| Date | Source ajoutée | Règles ajoutées / modifiées | Fichier source |
|------|----------------|-----------------------------|----------------|
| 2026-07-21 | Création du squelette + seeds anti-slop | M1-M6, A1-A10 (SEED) | — |
| 2026-07-21 | Kole Jain, « 3 dashboard UI flaws » (via Gemini) | L1, L2, E1, T1, C1, H1, P1, P2, MB1, U1, A11, A12 + 2 conflits (§11) | [sources/2026-07-21_kole-jain-dashboard-ui-flaws.md](sources/2026-07-21_kole-jain-dashboard-ui-flaws.md) |
