# Système de profondeur SAFE, trois plans

> **Rang.** Amendement au [SAFE_PREMIUM_DESIGN_STANDARD](SAFE_PREMIUM_DESIGN_STANDARD.md).
> Il remplace la règle PS-006 dans sa forme d'interdiction totale et ajoute les
> règles PS-006a à PS-006f. Le reste du référentiel s'applique sans changement.
>
> **Décision CEO du 30 juillet 2026.** Le glassmorphisme n'est plus interdit. Il
> devient un système de profondeur soumis à justification fonctionnelle.
>
> **Spécimen exécutable.** `/atelier` (route non indexée, hors production).
> Sources d'inspiration : Apple pour la matérialité, Codex pour le canvas
> continu, Linear pour la densité. Aucune des trois n'est copiée.

---

## §1 — Ce qui change, et pourquoi

L'ancienne règle PS-006 disait : « aucun dégradé, aucun flou, aucun verre
dépoli, 0 `backdrop-blur` ». Elle visait un vrai défaut, catalogué en A3 de
[DESIGN_HUMAIN](DESIGN_HUMAIN.md) : le verre appliqué partout, sur toutes les
cartes, comme un habillage. C'est un des tells les plus fiables du design
généré sans direction.

Mais l'interdiction totale coûtait deux choses :

1. **Elle supprimait le seul moyen honnête de dire « ceci flotte ».** Sans
   flou, une palette de commandes et une ligne de tableau appartiennent au même
   plan. On compense alors par des ombres de plus en plus fortes, ce qui produit
   exactement l'uniformité que la règle voulait éviter.
2. **Elle était déjà enfreinte sans l'assumer.** `app/(app-v2)/v2/v2.module.css`
   applique `backdrop-filter: blur(12px)` sur la topbar depuis sa création. Une
   règle que le code viole en silence ne protège rien.

La correction n'est donc pas « autoriser le verre », c'est **rattacher le verre
à une hiérarchie spatiale**.

---

## §2 — La règle centrale

> **Les surfaces structurelles restent mates. Le verre est réservé aux surfaces
> qui flottent, se superposent, ou réclament momentanément l'attention.**

Test à appliquer avant d'écrire un `backdrop-filter` :

| Question | Réponse | Conséquence |
|---|---|---|
| Cette surface recouvre-t-elle du contenu qui continue d'exister derrière elle ? | Non | **Mate.** Un filet suffit. |
| | Oui | Passer à la question suivante. |
| Ce contenu doit-il rester partiellement perceptible pour que la personne garde son contexte ? | Non | **Opaque et élevée.** Ombre, pas de flou. |
| | Oui | **Verre.** Choisir le niveau au §3. |

**Adjacence n'est pas superposition.** Une sidebar collée au canvas ne recouvre
rien : elle est mate. La même sidebar en tiroir mobile recouvre le travail :
elle prend du verre. C'est le même composant, deux plans différents.

---

## §3 — Les trois plans

### Plan 1, structure permanente

Fond général, rail de navigation, canvas, régions durables.

- Mat, ou verre subtil quand la surface est réellement collante au défilement.
- Aucune ombre. Filets `1px` à très faible opacité.
- La séparation vient de la lumière, de la couleur et de l'espace, pas d'un
  encadrement.
- Continuité visuelle entre les régions : le canvas ne doit pas ressembler à
  une feuille découpée à la règle.

### Plan 2, contenu et travail

Messages, listes, résultats, fichiers, statuts, composants de travail.

- Intégré directement au canvas. **Une carte se mérite.**
- Avant de créer un conteneur, essayer dans cet ordre : l'espace, l'alignement,
  la typographie, un changement de surface très léger, un état de survol, un
  filet discret.
- Une carte n'est justifiée que si l'objet est autonome : sélectionnable,
  déplaçable, porteur de sa propre action, ou appartenant à un autre plan.
- Aucune carte imbriquée.
- L'état sélectionné doit être plus visible que le conteneur.

### Plan 3, surfaces flottantes

Composeur, palette de commandes, menus, popovers, notifications, contrôles
contextuels, demandes d'approbation.

- Verre visible mais maîtrisé, flou d'arrière-plan, teinte de surface légère,
  bordure lumineuse interne, ombre diffuse.
- Lisibilité maintenue en toutes conditions. Aucun texte posé sur un fond
  insuffisamment atténué.

---

## §4 — Les trois niveaux de verre

**Migration faite le 6 août 2026.** Les valeurs vivent désormais dans
`lib/ds/tokens.ts` (`depth`), exposées en variables `--glass-1|2|3-*` par
`app/globals.css` et portées par trois classes, `.safe-glass-subtle`,
`.safe-glass-elevated` et `.safe-glass-focus`. `app/atelier/atelier.module.css`
reste le spécimen d'origine ; le spécimen adopté est `/ds-preview`.

**Piège de production.** Le transformeur CSS fusionne `backdrop-filter` et
`-webkit-backdrop-filter` et ne conserve que la **dernière** déclaration
écrite. Déclarer les deux à la main supprime donc la propriété standard du CSS
servi, et le verre devient inerte sans qu'aucun outil ne le signale. La feuille
source ne déclare que la propriété standard ; le contrat automatisé de
`components/ui/__tests__/design-system-contract.test.tsx` interdit la
redéclaration manuelle du préfixe.

| Niveau | Pour quoi | Opacité de surface | Flou | Ombre |
|---|---|---:|---:|---|
| **Subtle** | barre supérieure collante, sidebar sur fond atmosphérique, contrôles secondaires | 0,72 | 14px | aucune |
| **Elevated** | composeur, popovers, menus, palette de commandes | 0,84 | 24px | `0 18px 36px -20px` |
| **Focus** | approbation, commande importante, panneau qui réclame l'attention | 0,95 | 30px | `0 30px 64px -28px` |

**Le niveau Focus est plus opaque que les autres, pas moins.** Il porte des
montants et des décisions irréversibles : la lisibilité prime sur l'effet.

**Un seul Focus à la fois à l'écran.** Deux surfaces qui réclament l'attention
n'en réclament aucune.

---

## §5 — Le fond atmosphérique

Un `backdrop-filter` sur un aplat parfaitement uni ne produit aucune
information : il n'y a rien à flouter. Le fond général porte donc un dégradé
radial très léger, aux couleurs de la marque.

- Vert forêt en haut à gauche, ivoire chaud en bas à droite.
- Amplitude faible, jamais perceptible comme « un dégradé ».
- **Aucun violet, aucun indigo, aucun bleu générique** (A1 de DESIGN_HUMAIN).
- Sa seule fonction est de rendre le verre lisible comme matière.

---

## §6 — Règles auditables, remplacement de PS-006

| ID | Règle | Seuil mesurable | Vérification | Grav. |
|---|---|---|---|---|
| PS-006a | Tout `backdrop-filter` porte en commentaire la justification de superposition | 100 % | revue du code | M |
| PS-006b | Aucune surface du plan 1 ou 2 ne porte de `backdrop-filter` | 0 | grep sur les classes de flux | M |
| PS-006c | Trois niveaux de verre au maximum, pris dans les jetons | 3 | grep des valeurs de flou littérales | M |
| PS-006d | Un repli opaque existe pour `@supports not (backdrop-filter)` et pour `prefers-reduced-transparency` | présent et testé | test navigateur | B |
| PS-006e | Contraste du texte sur toute surface vitrée, mesuré sur le fond le plus défavorable | ≥ 4,5:1 | calcul sur capture | B |
| PS-006f | Au maximum quatre surfaces floutées simultanément à l'écran | ≤ 4 | comptage | M |

Les autres interdictions de PS-006 tiennent toujours : **aucun dégradé sur une
surface de contenu**, aucun dégradé décoratif, aucun flou appliqué à un élément
du flux.

L'élévation passe de deux à **trois** niveaux (§2.5 du référentiel), le
troisième étant strictement réservé au verre de Focus.

---

## §6 bis — Jamais de verre dans du verre

Un élément qui porte un `backdrop-filter` devient **racine d'arrière-plan** pour
toute sa descendance. Le `backdrop-filter` d'un enfant n'échantillonne alors plus
la page : il n'échantillonne que son parent, déjà composité. Le verre imbriqué ne
floute donc rien. Il ne reste qu'une couche translucide à travers laquelle le
contenu de la page apparaît net, et le texte posé dessus devient illisible.

Le défaut est silencieux : rien n'échoue, la classe s'applique, seul le flou
manque. Il s'est produit deux fois dans SAFE, sur le panneau du centre d'alertes
posé dans l'en-tête vitré, et sur le panneau d'envoi de facture posé dans son
propre voile.

Deux issues, selon la table de décision du §2 :

- **Le voile et le panneau sont frères**, jamais l'un dans l'autre. C'est le
  montage de `components/ui/Modal.tsx`.
- **La surface devient opaque et élevée** quand elle est nécessairement
  descendante d'une surface vitrée, ou quand le contenu derrière elle n'a pas
  besoin de rester perceptible. Classe `.safe-elevated-opaque` : ombre et filet
  du niveau elevated, sans flou.

| ID | Règle | Seuil mesurable | Vérification | Grav. |
|---|---|---|---|---|
| PS-006g | Aucune surface vitrée n'est descendante d'une autre surface vitrée | 0 | revue du montage, test de contrat | M |

---

## §7 — Ce que cet amendement n'autorise pas

Le catalogue anti-slop reste opposable. Restent interdits :

- le verre sur chaque carte, chaque message, chaque ligne, chaque étape;
- la sidebar entière en verre quand elle est adjacente au canvas;
- une grille de cartes identiques, vitrées ou non;
- des ombres uniformes sur tout;
- un rayon généreux appliqué partout;
- des animations sans fonction;
- plusieurs blocs concurrents dans la vue principale.

**A3 de DESIGN_HUMAIN n'est pas annulé, il est précisé.** Le tell n'a jamais
été le flou : c'est le flou sans hiérarchie.

---

## Journal

| Date | Modification |
|---|---|
| 2026-07-30 | Création. Amende PS-006, précise A3, ajoute PS-006a à PS-006f et le troisième niveau d'élévation. Spécimen exécutable en `/atelier`. |
| 2026-08-05 | Sam Crawford « Glassmorphism 2.0 » renforce le choix d'un verre subtil et tactile. Corroboration MDN, web.dev et WCAG : repli opaque, contraste sur le fond le plus défavorable et test de performance maintenus comme conditions obligatoires. |
| 2026-08-06 | Lot 5. Migration des trois niveaux vers `lib/ds/tokens.ts` et `app/globals.css`, replis opaques posés pour toute l'application, fond atmosphérique appliqué au canvas, onze surfaces flottantes rattachées à un niveau et justifiées, verre retiré des surfaces de contenu. Contraste mesuré : encre à 14,1:1 sur le canvas et 7,9:1 au pire. Limite consignée : le texte secondaire tombe sous 4,5:1 en subtle et elevated sur fond sombre, ces deux niveaux ne doivent pas surplomber une région sombre. |
