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
| M2 | **Une intention par écran.** Chaque écran a UNE action principale évidente. Si tout est mis en avant, rien ne l'est. | 🟢 | SOURCÉ |
| M3 | **La hiérarchie prime sur la décoration.** Régler taille, poids, espacement et contraste AVANT d'ajouter ombres, dégradés, glassmorphism. | 🟢 | SOURCÉ |
| M4 | **Éviter les tells de l'IA (voir §10).** À chaque écran, passer la checklist anti-slop §10 avant de considérer le travail terminé. | 🟢 | SEED |
| M5 | **Cohérence avant nouveauté.** Réutiliser les tokens, composants et patterns existants du repo (`si-*`, `docs/skills-ux/`) plutôt qu'inventer un style par écran. | 🟢 | SEED |
| M6 | **Le vide est un outil, pas un manque.** Ne pas remplir l'espace par réflexe. L'espace négatif dirige l'attention. | 🟢 | SOURCÉ |
| M7 | **La performance est une décision de design.** Refuser ou simplifier tout effet qui dégrade les budgets LCP, INP ou CLS. Une proposition qui ralentit le geste échoue aussi visuellement. | 🟢 | SOURCÉ |

---

## §1 — Layout & structure

Grille, composition, densité, alignement.

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| L1 | **Laissez la donnée dicter la forme.** Choisir la forme selon le type de donnée plutôt que tout forcer dans un tableau standard. Ex. : pastilles pour statuts récurrents, timeline pour du chronologique. | 🟢 | SOURCÉ | Kole Jain |
| L2 | **Alignez les nombres à droite, jamais centrés.** On compare les nombres par leur dernier chiffre ; le centrage des données casse le balayage vertical. Texte à gauche, nombres à droite, entêtes alignés sur leur colonne. | 🟢 | SOURCÉ | Kole Jain + corroboré |
| L3 | **Une colonne porteuse domine la largeur.** La colonne qui identifie la ligne (nom de dossier, de client, objet) prend de la moitié aux deux tiers de la largeur utile ; les métadonnées sont comprimées autour de 100-130 px. Ordre de grandeur mesuré sur un seul cas, pas une valeur cible. | 🟡 | SOURCÉ | shadcn/ui (mesuré) + Linear |
| L4 | **Les colonnes de contrôle n'ont pas de libellé.** Case à cocher et menu de ligne portent une entête vide, jamais « Actions » ni « Sélection ». | 🟡 | SOURCÉ | shadcn/ui (mesuré) |
| L5 | **Employez une grille commune comme infrastructure d'alignement entre écrans.** Elle crée la continuité du produit. Ne la briser que pour un point focal justifié, jamais comme décoration. | 🟢 | SOURCÉ | Sam Crawford + pratique responsive établie |
| L6 | **Sur la vitrine, cadrez chaque preuve produit sur la capacité qu'elle démontre.** Une capture intégrale de dashboard devient vite une texture illisible. Isoler l'état, le résultat ou le geste qui prouve la promesse, avec des données réalistes. | 🟢 | SOURCÉ | Kole Jain + contenu responsive établi |

---

## §2 — Espacement & rythme

Marges, gouttières, échelle d'espacement, respiration.

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| E1 | **Tronquez les textes longs pour rendre de la respiration aux colonnes clés.** Un champ trop bavard vole l'espace des colonnes qui portent la décision. Tronquer avec ellipse + valeur complète au survol/clic. Le titre ne passe jamais à la ligne dans une liste. | 🟢 | SOURCÉ | Kole Jain + Linear + shadcn/ui |
| E2 | **Ligne d'environ 48-50 px pour deux niveaux d'information**, entête plus basse (~40 px), padding de cellule 8 px. Valeurs mesurées sur un design system en desktop large : ordre de grandeur à adapter à la densité voulue, pas une consigne. | 🟡 | SOURCÉ | shadcn/ui (mesuré) |
| E3 | **Utilisez l'espace pour encoder les groupes.** Espace faible à l'intérieur d'un groupe, nettement plus grand entre groupes. Ajouter du vide sans modifier les relations ne corrige pas la hiérarchie. | 🟢 | SOURCÉ | Sam Crawford + principe de proximité |
| E4 | **Construisez l'échelle d'espacement sur un pas de 4 px.** Choisir ensuite chaque valeur selon la relation entre les éléments, pas pour répéter un écart uniforme. Le pas rend l'échelle divisible et cohérente ; E3 décide où elle se resserre ou s'ouvre. | 🟢 | SOURCÉ | Kole Jain + pratique établie |

---

## §3 — Typographie

Familles, échelle, graisses, interlignage, longueur de ligne.

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| T1 | **Hiérarchie de tableau discrète.** Entêtes de colonnes en graisse moyenne, données en régulier. La hiérarchie se lit sans gras criard ni changement de taille brutal. | 🟡 | SOURCÉ | Kole Jain |
| T2 | **Même taille de police pour l'entête et les données.** La hiérarchie se fait par la graisse seule (moyenne vs régulière), pas par un changement de taille. Mesuré : 14 px des deux côtés, 500 vs 400. Précise et confirme T1. | 🟢 | SOURCÉ | shadcn/ui (mesuré) + Kole Jain |
| T3 | **Définissez des rôles typographiques stables avant les styles locaux.** Un changement de taille, graisse ou famille doit signaler un changement de rôle, pas simplement embellir une zone. | 🟢 | SOURCÉ | Sam Crawford + principe de hiérarchie |

---

## §4 — Couleur & contraste

Palette, rôles de couleur, accessibilité, mode sombre.

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| C1 | **Statuts via pastilles à fond coloré subtil ; grisez ce qui est inactif.** Vert = actif, gris = inactif, etc. L'œil scanne la couleur/forme plus vite que le texte. Griser les lignes désactivées réduit le bruit. Garder un contraste suffisant (voir A8). **Contesté sur le remplissage, voir §11.** | 🟡 | SOURCÉ | Kole Jain |
| C2 | **Séparateurs de lignes en filet à très faible opacité** (~10 %), horizontaux seulement. Jamais un gris plein, jamais de bordure verticale : la grille complète transforme une liste lisible en formulaire de saisie. | 🟡 | SOURCÉ | shadcn/ui (mesuré) + Linear |
| C3 | **La couleur porte un rôle sémantique stable, jamais le sens à elle seule.** Succès, avertissement, erreur, information et sélection gardent la même logique dans tout SAFE, doublée par un libellé, une forme ou une icône. | 🟢 | SOURCÉ | Kole Jain + WCAG 1.4.1 |
| C4 | **Le mode sombre se recompose, il ne s'inverse pas.** Créer la profondeur avec des surfaces élevées légèrement plus claires que le fond, réduire le contraste des bordures et calmer la saturation des accents. Valider chaque contraste indépendamment. | 🟡 | SOURCÉ | Kole Jain |

---

## §5 — Hiérarchie visuelle & attention

Parcours de l'œil, focalisation, groupement, contraste de rôle.

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| H1 | **Divulgation progressive.** Ne montrer que l'essentiel par défaut, révéler les actions secondaires au moment utile. Réduit la charge visuelle (étude 2006 : 30-50 % plus rapide sur la tâche initiale). **Nuance obligatoire :** le déclencheur doit rester persistant et découvrable (icône « i », lien « Voir détails »), jamais le survol seul (voir MB1, conflit §11). | 🟢 | SOURCÉ | Kole Jain + corroboré |
| H2 | **Nommez le comportement ou le résultat attendu avant de choisir une forme.** Une décision visuelle sans résultat observable est une préférence, pas une stratégie. Pour SAFE : rattacher chaque changement à un geste plus rapide, une erreur évitée ou une information mieux comprise. | 🟡 | SOURCÉ | Sam Crawford |
| H3 | **Composez selon un ordre explicite : contexte, information décisive, action principale, détails.** Si deux éléments réclament simultanément la première lecture, la hiérarchie échoue. Vérifier cette séquence sur la première vue de chaque écran. | 🟢 | SOURCÉ | Sam Crawford + NN/g |
| H4 | **Écrivez la promesse depuis le résultat utilisateur avant d'expliquer la fonction.** Sur la vitrine, chaque section répond d'abord à « ce que cela change pour vous », puis montre la capacité qui produit ce résultat. Bannir les bénéfices vagues non démontrés. | 🟢 | SOURCÉ | Kole Jain + pratique UX writing |

---

## §6 — Composants & patterns d'interface

Boutons, formulaires, cartes, tableaux, navigation, états (vide, chargement, erreur).

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| P1 | **Remplacez un tableau trié par date par une timeline.** Une ligne de temps latérale (ou dans un tiroir rétractable) se suit mieux qu'un tableau chronologique. | 🟡 | SOURCÉ | Kole Jain |
| P2 | **Prévoyez une couche d'UI contextuelle discrète.** Indicateurs légers (ex. triangle ~8px signalant un commentaire caché) qui gardent l'écran propre tout en signalant la profondeur. | 🟡 | SOURCÉ | Kole Jain |
| P3 | **Deux lignes par item quand la provenance compte.** Ligne 1 : le titre en contraste plein. Ligne 2 : la source ou le responsable, atténué, précédé d'une icône 16 px. Métadonnées (identifiant, date) empilées et alignées à droite. | 🟡 | SOURCÉ | Linear |
| P4 | **Le menu de ligne est une colonne permanente**, et la ligne reste surlignée tant que le menu est ouvert (`has-aria-expanded`). L'utilisateur ne perd jamais de vue la ligne sur laquelle il agit. Applique MB1. | 🟢 | SOURCÉ | shadcn/ui (mesuré) |
| P5 | **Pas d'entête de colonne par défaut.** Elle ne se justifie que si elle sert au tri ou au filtre. Une liste mono-objet peut s'en passer entièrement (Linear Triage n'en a aucune). | 🟡 | SOURCÉ | Linear |
| P6 | **Un contrôle explique son usage par ses signifiants.** Libellé, forme, sélection, désactivation, survol et focus doivent rendre l'affordance et l'état compréhensibles sans mode d'emploi. Une icône ambiguë reçoit un libellé ou une info-bulle. | 🟢 | SOURCÉ | Kole Jain + Apple HIG |
| P7 | **Chaque composant interactif possède une matrice d'états explicite.** Prévoir défaut, survol, focus, pressé et désactivé, puis chargement, succès, avertissement et erreur lorsque le parcours les exige. Aucun bouton ne reste visuellement identique pendant une opération. | 🟢 | SOURCÉ | Kole Jain + WCAG 2.4.7 et 4.1.3 |
| P8 | **Alignez les icônes sur la hauteur de ligne et subordonnez les actions secondaires.** Une icône de bouton ne doit pas dominer son libellé ; le bouton fantôme convient à l'action secondaire, jamais à l'unique action critique. | 🟡 | SOURCÉ | Kole Jain |
| P9 | **Une preuve produit est une démonstration contextualisée, pas une décoration.** Vue recadrée, état réaliste, légende utile et interaction légère si elle clarifie. La preuve doit confirmer la promesse sans obliger à lire toute l'interface. | 🟡 | SOURCÉ | Kole Jain |
| P10 | **Employez le glassmorphisme comme un indice spatial, jamais comme une peau générale.** Le verre signale qu'une surface flotte sur un contenu qui doit rester perceptible : menu, popover, palette, tiroir ou décision focalisée. Le flux reste mat ; renforcer l'opacité quand la décision devient critique ; prévoir un repli opaque et mesurer le contraste sur le fond le plus défavorable. | 🟢 | SOURCÉ | Sam Crawford + MDN + web.dev + WCAG |

---

## §7 — Mobile & tactile

Cibles tactiles, zones du pouce, densité mobile, gestes, responsive.

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| MB1 | **Ne cachez jamais une action essentielle derrière le seul survol.** Sur tablette et mobile le hover n'existe pas. Toute action révélée au survol doit avoir un déclencheur tactile équivalent (bouton visible, menu « ... », appui long). Pertinent pour SAFE : les écrans peuvent être consultés sur tablette. | 🟢 | SOURCÉ | corroboré (tempère Kole Jain) |
| MB2 | **Concevez l'accessibilité avec le composant initial.** Focus visible et non masqué, cible tactile, nom accessible et reflow font partie de la définition du composant. Vérifier WCAG 2.2 avant livraison, pas dans une passe finale. | 🟢 | SOURCÉ | Sam Crawford + WCAG 2.2 |
| MB3 | **Le mobile-first est une priorisation, pas une réduction.** Réordonner, replier ou transformer les composants sans supprimer l'information ou l'action essentielle. La page doit reflow à 320 px ; un tableau réellement bidimensionnel peut défiler dans son propre conteneur. | 🟢 | SOURCÉ | Sam Crawford + web.dev + WCAG 1.4.10 |

---

## §8 — Motion & micro-interactions

Durées, courbes, feedback, transitions, retenue.

| ID | Règle | Confiance | Statut | Source |
|----|-------|-----------|--------|--------|
| MO1 | **Au survol d'une ligne, transition de couleur seule.** Aucun déplacement, aucune ombre qui apparaît, aucun agrandissement. Le survol signale la cible, il ne met pas la liste en mouvement. | 🟡 | SOURCÉ | shadcn/ui (mesuré) |
| MO2 | **Une micro-interaction ne sert qu'à guider, confirmer ou clarifier.** Si elle ne remplit aucun de ces trois rôles, la supprimer. Dans l'application SAFE, le mouvement est un retour d'état court, jamais un récit continu. | 🟢 | SOURCÉ | Sam Crawford + heuristiques NN/g |
| MO3 | **Toute action produit une réponse proportionnée, proche et accessible.** Afficher l'attente, le résultat ou l'erreur près de l'objet concerné ; réserver l'interruption aux risques importants. Une animation de confirmation complète le message, elle ne le remplace pas. | 🟢 | SOURCÉ | Kole Jain + Apple HIG + WCAG 4.1.3 |
| MO4 | **Sur la vitrine, reliez les sections par des transitions de contenu continues.** Le mouvement accompagne le récit, préserve la continuité spatiale et encourage le défilement ; il ne devient jamais le sujet. Respecter reduced-motion et les budgets M7. | 🟡 | SOURCÉ | Kole Jain |

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
| A3 | Glassmorphism / flou **partout**, ombres portées uniformes et molles. Le tell n'est pas le flou, c'est le flou sans hiérarchie. | Élévation hiérarchisée : peu de niveaux d'ombre, chacun signifiant quelque chose. Verre réservé aux surfaces qui se superposent réellement, avec contraste et repli opaque vérifiés (P10). Voir [SYSTEME_DE_PROFONDEUR_TROIS_PLANS](SYSTEME_DE_PROFONDEUR_TROIS_PLANS.md). | 🟢 | SOURCÉ, précisée 2026-08-05 |
| A4 | Rayon de bordure identique sur tout (cartes, boutons, inputs, images). | Échelle de rayons cohérente mais différenciée selon le rôle. | 🟡 | SEED |
| A5 | Structure « hero + 3 cartes de features à icônes + CTA » reproduite telle quelle. | Structure dictée par le contenu réel et l'histoire à raconter. | 🟢 | SEED |
| A6 | Puces avec emoji, icônes décoratives sans fonction, ✨ et 🚀 partout. | Icônes seulement quand elles aident à repérer ou distinguer ; sinon rien. | 🟡 | SEED |
| A7 | Texte de remplissage vague (« Empower your workflow », « Seamless experience »). | Copie concrète, spécifique au vrai bénéfice, dans la voix SAFE (« vous », pas d'em-dash). | 🟢 | SEED |
| A8 | Contraste faible « gris sur gris » esthétique mais illisible. | Contraste suffisant (viser WCAG AA), hiérarchie par le poids et l'espace, pas que par le gris. | 🟢 | SEED |
| A9 | Espacement uniforme partout, aucune variation de densité, aucune respiration. | Rythme vertical intentionnel : rapprocher ce qui va ensemble, séparer les groupes. | 🟢 | SEED |
| A10 | Symétrie parfaite et grille rigide sans aucun point focal. | Créer une tension/asymétrie volontaire pour guider l'œil. | 🟠 | SEED |
| A11 | Syndrome du « tout visible » : toutes les actions (éditer, dupliquer, supprimer) affichées en permanence sur chaque ligne. | Divulgation progressive : révéler au survol/contexte, avec un déclencheur tactile équivalent (MB1). Ne laisse que l'essentiel par défaut. | 🟡 | SOURCÉ (Kole Jain) |
| A12 | Expliquer une fonctionnalité par un gros bloc de texte ou une modale à puces (« surmots »). | Info-bulle courte et ciblée sur une icône, au moment utile (U1). | 🟡 | SOURCÉ (Kole Jain) |
| A13 | Horodatage absolu complet (`2026-07-30 14:32`) dans une liste d'activité récente. | Temps relatif court (`il y a 6 min`, `3 h`, `2 j`), date complète au survol ou en fiche. | 🟡 | SOURCÉ (Linear) |
| A14 | Grille complète : bordures verticales et horizontales pleines autour de chaque cellule. | Filets horizontaux seulement, à très faible opacité (C2). La grille pleine fait ressembler une liste à un tableur. | 🟡 | SOURCÉ (shadcn/ui, Linear) |
| A15 | Toutes les colonnes à largeur égale, y compris celles qui ne portent qu'un statut. | Une colonne porteuse large, des métadonnées comprimées (L3). L'égalité de largeur est un défaut de gabarit, pas une décision. | 🟡 | SOURCÉ (shadcn/ui mesuré) |
| A16 | Homogénéité synthétique : composition interchangeable, copie générique et effets sans rapport avec le métier. | Repartir du contenu réel et d'une décision propre à la tâche. L'IA accélère l'exploration, mais la direction et l'arbitrage restent humains. | 🟡 | SOURCÉ (Sam Crawford) |
| A17 | Alternance mécanique « texte à gauche / image à droite », puis l'inverse, répétée jusqu'au pied de page. | Faire varier la composition selon la preuve : vue produit, comparaison, résultat, processus ou objection. La variation vient du contenu, pas d'un effet de galerie. | 🟢 | SOURCÉ (Kole Jain) |
| A18 | Capture intégrale du produit déposée telle quelle dans un navigateur factice, illisible et sans rapport précis avec la promesse. | Recadrer un état réel et fabriquer la vue pour démontrer un bénéfice unique (L6, P9). | 🟢 | SOURCÉ (Kole Jain) |

---

## §11 — Conflits entre sources

Quand deux créateurs se contredisent, on ne tranche pas arbitrairement : on documente ici le
désaccord et la règle de contexte qui permet de choisir.

| Sujet | Position A | Position B | Comment trancher |
|-------|-----------|-----------|------------------|
| Avatars vs noms en clair dans les tableaux | Kole Jain : préférer des avatars pour une reconnaissance visuelle plus rapide. | Contexte SAFE : les identités exactes (clients, juges, parties adverses) sont critiques ; un avatar coloré risque l'erreur de manipulation. | **Contexte cabinet juridique = noms en clair.** Avatar seulement en complément du nom, jamais à sa place. Règle générale non retenue pour SAFE. |
| Révélation par survol vs tactile | Kole Jain : révéler les actions au hover pour garder l'écran propre. | Corroboration : le hover n'existe pas sur tablette/mobile ; hover-seul = anti-pattern d'accessibilité. shadcn/ui garde une colonne de menu permanente. | **Garder la divulgation progressive (H1), rejeter le « hover seul ».** Toujours un déclencheur persistant/tactile (MB1, P4). |
| Glassmorphisme : interdit vs système de profondeur | A3 et PS-006 (version d'origine) : le verre est un tell d'IA, interdiction totale du `backdrop-filter`. | Apple, Codex et Linear l'emploient tous les trois, mais toujours pour exprimer une relation spatiale, jamais comme décoration. Sans flou, une palette et une ligne de tableau vivent au même plan. | **Décision CEO 2026-07-30 : le verre est autorisé sur le seul plan flottant.** Surface structurelle = mate. Superposition = verre. Adjacence n'est pas superposition. Justification fonctionnelle obligatoire en commentaire (PS-006a). Détail : [SYSTEME_DE_PROFONDEUR_TROIS_PLANS](SYSTEME_DE_PROFONDEUR_TROIS_PLANS.md). |
| Pastille de statut : fond dilué vs contour | Kole Jain (C1) : fond coloré subtil, l'œil scanne la couleur avant le texte. | shadcn/ui (mesuré) : pilule à fond transparent + bordure, 12 px. Moins de bruit quand il y a beaucoup de lignes. | **Contexte SAFE : fond dilué réservé aux statuts qui appellent une action** (retard, fiducie négative, échéance). **Contour pour les statuts purement informatifs** (type de dossier, catégorie). Deux registres visuels distincts valent mieux qu'un seul appliqué partout. |
| Anti-grille vs précision opérationnelle | Sam Crawford : les compositions organiques et asymétriques combattent l'uniformité des sites générés. | SAFE : les tableaux juridiques, montants et rapprochements dépendent d'alignements répétables pour être vérifiés rapidement. | **Asymétrie sur la vitrine et les moments éditoriaux. Grille rigoureuse dans l'instrument.** Briser la grille seulement si cela renforce un point focal sans nuire à la comparaison. |
| Mouvement narratif vs calme de l'instrument | Sam Crawford : le mouvement peut porter le récit et l'attention. | SAFE L3 et MO1 : aucun mouvement décoratif ou déplacement au survol dans l'application. | **Récit animé réservé au site public ou à un onboarding ponctuel.** Dans l'application, mouvement court uniquement pour guider, confirmer ou clarifier (MO2). |
| Première vue vs densité professionnelle | Sam Crawford : la zone au-dessus de la ligne de flottaison et l'appel à l'action décident de la première compréhension. | SAFE : un outil juridique quotidien ne peut pas réduire chaque écran à un hero commercial ni masquer les données de travail. | **Montrer la décision, le contexte et l'action prioritaires dans la première vue, pas tout le contenu.** Les détails restent accessibles par défilement ou divulgation progressive. |
| Mobile-first vs tableaux bidimensionnels | Responsive et mobile-first demandent une composition utilisable sur faible largeur. | Les registres financiers et rapprochements exigent parfois de comparer plusieurs colonnes simultanément. | **Reflow de la page et des contrôles obligatoire.** Défilement horizontal permis uniquement dans le conteneur du tableau, avec colonnes d'identité et de décision conservées ou une vue alternative. |
| Couleur sémantique vs perception universelle | Kole Jain associe notamment bleu à la confiance, rouge au danger, jaune à l'avertissement et vert au succès. | Les associations varient selon le contexte et certaines personnes ne distinguent pas ces couleurs ; WCAG interdit la couleur comme seul vecteur. | **Conserver une grammaire chromatique stable dans SAFE, mais toujours doubler le sens par texte, forme ou icône** (C3). |
| Ombres sombres vs système de profondeur | Kole Jain crée surtout la profondeur sombre par des surfaces élevées plus claires et des bordures atténuées. | Le système SAFE à trois plans peut employer une ombre discrète pour une vraie superposition. | **La luminance des surfaces porte la hiérarchie principale.** Une ombre sombre reste un renfort réservé au plan flottant, jamais un substitut à la structure. |
| Survol narratif vs tactile | Kole Jain révèle certains CTA contextuels au survol sur une landing page avancée. | MB1 interdit qu'une action essentielle dépende du hover, absent sur tactile et insuffisant au clavier. | **Le survol peut enrichir, jamais détenir l'action.** Prévoir focus clavier, libellé accessible et équivalent tactile persistant. |
| Raffinement de vitrine vs performance | Le niveau 4 emploie vues fabriquées, flou localisé et transitions continues pour enrichir le récit. | M7 refuse tout effet qui dégrade LCP, INP ou CLS. | **Le budget de performance tranche.** Préférer CSS et médias responsifs, fournir reduced-motion et supprimer l'effet si la preuve devient plus lente que le message. |

---

## Journal d'ingestion

| Date | Source ajoutée | Règles ajoutées / modifiées | Fichier source |
|------|----------------|-----------------------------|----------------|
| 2026-07-21 | Création du squelette + seeds anti-slop | M1-M6, A1-A10 (SEED) | — |
| 2026-07-21 | Kole Jain, « 3 dashboard UI flaws » (via Gemini) | L1, L2, E1, T1, C1, H1, P1, P2, MB1, U1, A11, A12 + 2 conflits (§11) | [sources/2026-07-21_kole-jain-dashboard-ui-flaws.md](sources/2026-07-21_kole-jain-dashboard-ui-flaws.md) |
| 2026-07-30 | Listes denses réelles : Linear (Triage, page d'équipe) + shadcn/ui Tasks (mesuré en direct) | **Ajouts :** L3, L4, E2, T2, C2, P3, P4, P5, MO1, A13, A14, A15. **Modifs :** E1 passe 🟡→🟢, MO1 n'est plus vide, C1 marquée contestée. **+1 conflit** (§11, pastille fond vs contour) | [sources/2026-07-30_listes-denses-linear-shadcn.md](sources/2026-07-30_listes-denses-linear-shadcn.md) |
| 2026-08-05 | Sam Crawford, « 2026 Web Design Trends You Need to Know » | **Ajouts :** M7, H2, P10, MO2, MB2, A16. **Renforcée :** A3 devient SOURCÉ. **+3 conflits :** anti-grille, mouvement narratif et verre appliqués selon le contexte. | [sources/2026-08-05_sam-crawford-web-design-trends-2026.md](sources/2026-08-05_sam-crawford-web-design-trends-2026.md) |
| 2026-08-05 | Sam Crawford, « Every Web Design Concept Explained in Under 13 Minutes » | **Ajouts :** H3, E3, T3, MB3, L5. **Renforcées :** M2, M3, M6, M7, A8, MB2. **+2 conflits :** première vue et tableaux mobiles adaptés au contexte professionnel. | [sources/2026-08-05_sam-crawford-web-design-concepts.md](sources/2026-08-05_sam-crawford-web-design-concepts.md) |
| 2026-08-05 | Kole Jain, « Every UI/UX Concept Explained in Under 10 Minutes » | **Ajouts :** E4, C3, C4, P6, P7, P8, MO3. **Renforcées :** M3, E3, T3, H3, MO2, A3, A8. **+2 conflits :** couleur sémantique et profondeur sombre contextualisées pour SAFE. | [sources/2026-08-05_kole-jain-ui-ux-concepts.md](sources/2026-08-05_kole-jain-ui-ux-concepts.md) |
| 2026-08-05 | Kole Jain, « The 4 Levels of Landing Page UI/UX Design » | **Ajouts :** L6, H4, P9, MO4, A17, A18. **Renforcées :** M1, M3, M6, L5, E3, T3, C3, H3, MB3, MO2, A4, A5, A7, A9, A16. **+2 conflits :** survol narratif et raffinement de vitrine bornés par accessibilité et performance. | [sources/2026-08-05_kole-jain-four-levels-landing-page.md](sources/2026-08-05_kole-jain-four-levels-landing-page.md) |
