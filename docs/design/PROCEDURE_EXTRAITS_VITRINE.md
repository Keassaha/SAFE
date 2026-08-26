# Procédure — les extraits de produit de la vitrine

> Décision CEO du 2026-08-25. Toute illustration de produit affichée sur le site
> public part d'une **capture de l'interface réelle** du cabinet de Me Camille
> Roy, puis devient une **réplique conforme** aux critères de la landing.
> Opposable : un extrait qui n'a pas suivi les quatre étapes ne va pas en ligne.

---

## Pourquoi une réplique, et pas la capture elle-même

Une capture d'écran est morte. Elle ne se navigue pas, elle vieillit dès que la
peinture du produit change, et son fondu ne peut pas s'accorder au fond de la
section qui la porte. Trois des six fenêtres de l'accueil sont encore des PNG du
23 août : elles sont plus froides que la page qui les tient, et rien n'y est
cliquable.

Une réplique est du HTML. Elle se navigue, elle suit la palette, elle se fond.
Mais elle a un défaut symétrique : **on peut y écrire n'importe quel chiffre.**
C'est déjà arrivé, une chaîne de facturation de l'accueil reliait des heures à
une facture qui n'était pas la leur.

D'où la procédure : la capture est la **référence**, le relevé est la **preuve**,
la réplique est ce qu'on met en ligne, et le vérificateur est ce qui les
rapproche.

---

## Étape 1 — Capturer l'écran réel

```bash
SAFE_CAPTURE_CABINET="Cabinet Demo" \
SAFE_CAPTURE_EMAIL="camille.demo@safecabinet.ca" \
SAFE_CAPTURE_MOTDEPASSE="…" \
node scripts/capturer-ecran-reel.mjs comptes
```

Écrit dans `docs/design/references-app/` :

- `<écran>.png` — l'image de référence, en 2x,
- `releve.json` — ce que l'écran **dit** : titres, onglets, en-têtes de tableau,
  montants, premières lignes.

Le relevé est la pièce importante. Une réplique se construit à partir de lui,
jamais à partir de l'image : on ne recopie pas un chiffre lu à l'œil sur une
capture.

**Les identifiants viennent de l'environnement.** Ils ne sont écrits nulle part
dans le dépôt. L'ancien script `scripts/capture-app-shots.mjs` porte un mot de
passe en clair, présent dans l'historique git depuis le commit `15b17a3` : il ne
sert plus de modèle, et ce mot de passe est à changer.

Écrans connus : `tableau-de-bord`, `clients`, `dossiers`, `comptes`,
`facturation`, `comptabilite`, `temps`.

## Étape 2 — Choisir ce que l'extrait montre

Un extrait montre **un seul écran**, et de cet écran, la partie qui sert
l'argument de la section. Pas la page entière réduite : une capture rétrécie ne
prouve rien, elle décore.

La question à trancher avant d'écrire une ligne : *quelle phrase de la section
cette fenêtre rend-elle vérifiable ?* Si la réponse est « aucune », l'extrait ne
sert à rien et la section se passe d'image.

## Étape 3 — Répliquer, aux cinq critères

La réplique reprend les classes de l'accueil, elle n'en invente pas :

| Critère | Ce qu'on écrit | Pourquoi |
|---|---|---|
| **Le cadre** | `.fenetre-fondante` > `.fenetre-produit.contour-fondu` | On doit voir qu'il s'agit d'un logiciel, pas d'une image. |
| **L'ombre** | sur `.fenetre-fondante`, en `filter: drop-shadow` | Le masque de fondu **rogne** l'ombre portée sur l'élément masqué. Elle doit donc vivre sur le parent non masqué. |
| **Le fondu** | `mask-image: linear-gradient(...)` sur la fenêtre | Le bas de la fenêtre s'éteint au lieu d'être coupé net. |
| **Une seule page** | `.barre-app` figée, `aria-hidden="true"` | La barre situe l'écran sans inviter à cliquer ailleurs : l'extrait ne parle que de sa page. |
| **La navigation** | `.extrait-nav` + `data-fiche-onglet` / `data-fiche-vue` | Une seule délégation d'événement par extrait, état local. |
| **Le zoom** | `.safe-zoom-menu` sur ce qui se sélectionne | Règle CEO du 2026-08-11 : la surface se soulève, **zéro aplat gris de survol**. |

Deux détails qui reviennent, et qui se voient quand ils manquent :

- Les plaques de nombres portent un **contour d'encre** (`border-color: var(--si-ink)`),
  pas un filet gris.
- Un onglet actif **recouvre** le filet du conteneur (recouvrement d'un pixel),
  il ne se pose pas dessous.

Le bloc paraît au défilement par l'observateur existant (`.anime-bloc` dans les
cibles de `recit.tsx`). On n'ajoute pas une animation de plus.

## Étape 4 — Vérifier

```bash
node scripts/verifier-extrait-vitrine.mjs http://localhost:3040/
```

Il mesure les cinq critères sur la page rendue, et un sixième :

**6 · les chiffres.** Chaque montant de la réplique doit exister dans le relevé
de l'écran réel. Un montant absent du relevé est un montant inventé, et le
vérificateur sort en échec.

Ce test ne remplace pas le jugement : un chiffre juste peut être posé au mauvais
endroit. Il attrape la faute grossière, celle du nombre sorti de nulle part.

---

## Ce qui n'est pas conforme aujourd'hui

Relevé du 2026-08-25 sur `/` :

| Section | Fenêtres | Conforme |
|---|---|---|
| `probleme` | 1 | oui |
| `continuite` | 1 | oui |
| `verification` | 1 | oui |
| `figures` | 3 | **non** — trois PNG du 23 août : `dossiers.png`, `facture.png`, `comptes-fideicommis.png` |

Les trois PNG de `figures` sont à refaire par cette procédure. Ils sont
antérieurs à la repeinte, donc plus froids que la page, et rien n'y est
cliquable.

`/fonctionnalites` porte trois autres captures plates du même lot, hors
`.fenetre-produit` : elles relèvent de la même dette.

---

## Règles dures

1. **Aucun cabinet inventé.** Les extraits viennent de Camille Roy en base
   locale, jamais de données fabriquées. (Règle CEO du 2026-08-14.)
2. **Aucun identifiant dans le dépôt.** Ni dans un script, ni dans un
   commentaire, ni dans un exemple de commande.
3. **La capture d'abord.** Écrire une réplique sans avoir capturé l'écran, c'est
   dessiner de mémoire. C'est ainsi qu'on relie une facture au mauvais dossier.
4. **Un visuel avant le code.** La réplique se montre en image et se fait
   valider avant d'entrer dans le dépôt. (Règle CEO du 2026-08-24.)
