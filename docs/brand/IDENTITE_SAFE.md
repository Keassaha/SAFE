# SAFE — Identité de marque

> **Rang.** Source de vérité pour la marque : ce que SAFE est, quel genre de logiciel
> c'est, à quoi il ressemble, et comment le logo se dessine et s'emploie.
>
> **Portée.** Site public, intérieur de l'application, documents envoyés au client,
> courriels, icône d'application, matériel de vente.
>
> **Rapport aux autres fichiers.** Pour le détail mesurable de l'interface, voir
> [SAFE_PREMIUM_DESIGN_STANDARD](../design/SAFE_PREMIUM_DESIGN_STANDARD.md) et
> [DESIGN_HUMAIN](../design/DESIGN_HUMAIN.md) (§0 prime toujours). Pour le pack à
> coller dans un assistant externe, voir [SAFE_BRAND_CONTEXT](SAFE_BRAND_CONTEXT.md).
>
> **Dernière mise à jour** : 2026-08-03 (marque « L'Assemblage », charte v1.0).

---

## 1. Ce qu'est SAFE

SAFE est un logiciel de gestion de cabinet d'avocats, conçu au Québec, pour les
cabinets du Québec et de l'Ontario.

En une phrase : **SAFE tient votre cabinet ensemble.** Les dossiers, le temps, la
facturation, le fidéicommis et les obligations professionnelles cessent d'être cinq
systèmes séparés et partagent enfin le même contexte.

En une phrase de plus : SAFE ne se contente pas de ranger, il **regarde**. Il compare
le relevé bancaire au registre du fidéicommis, il refuse un dépôt en espèces au-delà
du plafond applicable en citant la règle, il bloque la certification d'un
rapprochement tant qu'un écart subsiste, et il signale les factures oubliées.

### Le genre d'application que c'est

| | |
|---|---|
| **Catégorie** | Logiciel de gestion de cabinet (practice management) avec comptabilité juridique et fidéicommis intégrés. Pas un CRM, pas un logiciel comptable générique. |
| **Registre** | Un **instrument**, pas un tableau de bord. Registre éditorial et comptable : filets, chiffres tabulaires, texte posé. Ce n'est ni un outil de productivité ludique ni un portail d'entreprise. |
| **Forme** | Application web (Next.js App Router, TypeScript, Prisma, Supabase, hébergement Canada). Compagnon mobile envisagé en PWA, jamais en natif. |
| **Bilingue** | Français québécois par défaut, anglais complet. |
| **Modules** | Aujourd'hui, clients, dossiers, temps et fiches de temps, facturation, comptabilité, conformité, rapports, employés, capture, navette, paramètres, plus la console interne de SAFE Inc. |
| **Contraintes dures** | Barreau du Québec (B-1, r.5) et Law Society of Ontario (By-Law 9). Le fidéicommis ne transite jamais par un processeur de paiement. Aucun numéro de Barreau sur une facture. Maximum deux couleurs sur une facture. Données au Canada, Loi 25 et PIPEDA. |

### Qui l'utilise, et ce que la marque doit leur dire

Deux personnes, jamais une seule.

- **L'avocat·e** voit le risque, l'argent et les échéances. La marque doit lui dire :
  *rien ne vous échappe, et vous n'avez pas à surveiller.*
- **L'adjoint·e** prépare, classe, relance. La marque doit lui dire : *votre travail
  devient visible et vous ne portez plus seule la mémoire du cabinet.*

**Thèse maître : le copilote du copilote.** SAFE ne remplace pas l'assistant·e.
L'assistant·e est le copilote de l'avocat, SAFE est le copilote de l'assistant·e.
L'adoption se fait par le bas : l'adjoint·e convainc l'avocat.

### Ce que SAFE n'est pas

Ne jamais laisser la marque suggérer ces choses, en mots ou en images.

- SAFE ne garantit pas la conformité. Il soutient la tenue, la vérification et la
  traçabilité. La responsabilité professionnelle demeure celle du cabinet.
- SAFE ne remplace pas l'adjointe.
- SAFE n'est pas un « assistant IA ». Il contient des capacités d'intelligence
  artificielle, mais elles se montrent par du travail préparé et vérifiable, jamais
  par un badge ni une bulle de clavardage.

---

## 2. La voix

- Français québécois, **vouvoiement systématique**, tournures impersonnelles permises.
- **Jamais de tiret long en milieu de phrase.** Virgule, deux-points, ou deux phrases.
  Seule exception : les tirets décoratifs de type « — 01 ».
- Calme, direct, noble. Aucun point d'exclamation, aucune survente, aucune peur.
  On mène par l'état positif visé, pas par la menace.
- Aucun jargon : bannir « plateforme », « workflow », « solution », « leverage ».
- Verbes d'action en tête : « Valider », « Rapprocher », « Envoyer ».
- **La preuve avant la promesse.** On montre que ça fonctionne, on ne le décrit pas.
  Aucun faux avis, aucun faux logo client, aucun chiffre inventé.
- Le client est le héros. Chaque contenu part de son problème concret, jamais du
  produit.

---

## 3. Le style visuel

### 3.1 Les principes qui portent tout le reste

1. **La densité est une densité d'information, jamais une densité de formes.**
   Retirer un élément prime sur en ajouter un.
2. **Le chiffre est sacré.** Montants, soldes, heures et références en mono tabulaire,
   alignés à droite, jamais tronqués.
3. **Une intention par écran.** Une seule action principale, un seul bouton plein.
4. **Rien ne bouge sans raison.** Aucun mouvement décoratif, aucun mouvement continu.
5. **La couleur ne porte jamais seule une information.** Un statut a une forme et un
   mot en plus de sa teinte.
6. **Le vert est rare.** C'est sa rareté qui le rend crédible.

### 3.2 Les surfaces de couleur

SAFE a deux surfaces qui coexistent. Ne pas les mélanger dans un même écran.

**A. Site public et marque — clair verdâtre**

| Rôle | Valeur |
|---|---|
| Canevas | `#EFF2ED` |
| Surface | `#FBFCFA` |
| Encre | `#1F2A24` |
| Texte atténué | `#5A665F` · très atténué `#7C877F` |
| Vert d'action | `#12A150` |
| Vert « vérifié » | `#1F6A47` |
| Ambre d'attention | `#8A6A1E` |
| Filet | `rgba(31,42,36,0.08)` |
| Fond sombre | `#16231D` |

**B. Intérieur de l'application — éditorial chaleureux** (source `lib/ds/tokens.ts`)

Canevas ivoire `#F7F2E8`, cartes crème `#FCFAF4`, barre latérale sable `#E8DCC4`,
encre `#0B0B0C`, vert forêt `#1F3A2E`, or chaud `#F4A045` employé avec parcimonie.

**Le vert de la marque**, lui, ne change pas d'une surface à l'autre : forêt `#1F3A2E`.

### 3.3 La typographie

| Usage | Fonte |
|---|---|
| **Titre d'ouverture d'une page** (le hero, le seul `h1`) | **Geist Sans**, graisse 400, resserré à `-0.026em` |
| Titres de section et de chapitre, grands chiffres, numéros de section, mot-symbole | **Instrument Serif** (`--font-instrument-serif`) |
| Interface, corps, chiffres de KPI | **Geist Sans** (`--font-geist-sans`) |
| Chiffres tabulaires, références, numéros de facture, dates | **Geist Mono** (`--font-geist-mono`) |

Le serif jamais sous 20 px, une seule graisse, italique réservé à l'accent. Étiquettes
de section en petites capitales espacées.

**Le hero est en gothique depuis le 2026-08-25** (décision CEO, après examen de
cursor.com). Trois choses à savoir avant de vouloir le « corriger » :

- Le geste vient de Cursor, pas leur fonte. `CursorGothic` est une commande privée
  sans licence publique : elle ne se reprend pas. Ce qui se reprend est le réglage,
  un gothique en graisse **normale**, resserré. Ils ne grossissent pas le titre,
  ils le serrent.
- Le titre de chapitre **reste en serif**. C'est l'écart entre les deux fontes qui
  dit lequel ouvre la page et lequel ouvre un chapitre. Mettre les deux en gothique
  les rend indistincts.
- Le mot d'accent dans un hero **n'est pas en italique**. Geist Variable n'a pas de
  vrai italique : le navigateur penche le dessin au lieu de le redessiner. Seul le
  vert de la marque porte l'accent.

Écrit dans `.xc #hero-copy h1` (accueil) et `.recit.ouverture h1` (autres pages
publiques).

### 3.4 Formes, profondeur, mouvement

- Rayons : boutons et champs 6 px, cartes 12 px, cartes élevées 16 px. La direction
  éditoriale récente pousse vers des coins plus carrés, registre « imprimerie ».
- Les ombres ne font pas le travail, les **filets** le font. Une ombre douce teintée
  forêt est réservée aux produits encadrés.
- Mouvement : 120 à 260 ms, courbe `cubic-bezier(0.16, 1, 0.3, 1)`. Une coche qui se
  pose, un fondu au même endroit. Jamais de particule, jamais de pulsation permanente.
- Le verre (`backdrop-filter`) est autorisé sur le seul plan flottant, jamais comme
  décoration. Voir
  [SYSTEME_DE_PROFONDEUR_TROIS_PLANS](../design/SYSTEME_DE_PROFONDEUR_TROIS_PLANS.md).

### 3.5 Les tells à ne jamais produire

Dégradé violet ou bleu néon, orbes lumineuses, glassmorphisme partout, emojis en puces,
badge « Powered by AI », bulle de clavardage générique, tout centré, gris sur gris,
faux avis, faux logos clients, structure « héros + trois cartes à icônes + CTA ».

Pour des avocats, chacun de ces signaux coûte de la confiance. Catalogue complet et
tenu à jour : [DESIGN_HUMAIN §10](../design/DESIGN_HUMAIN.md).

---

## 4. Le logo

### 4.1 La marque : « L'Assemblage »

Un carré unique, partagé par un joint orthogonal en gradins. Charte graphique v1.0.

**Ce qu'elle raconte.** Les deux pièces obtenues sont rigoureusement identiques,
tournées de cent quatre-vingts degrés l'une par rapport à l'autre, et s'emboîtent
sans le moindre jeu. Deux masses distinctes, un seul volume : c'est la séparation
stricte du fidéicommis et des opérations, et c'est aussi l'assemblage de la
comptabilité, des dossiers, de la conformité et de l'automatisation en un seul
système. Le joint trace un S implicite. La lettre n'est jamais dessinée, elle est
laissée en creux : la marque se découvre au deuxième regard sans jamais s'imposer
au premier. Aucun symbole juridique convenu, ni marteau, ni balance.

**Ce que le symbole dit.** Architecture, un joint d'assemblage et pas un décor.
Ordre, toutes les cotes sont des fractions simples du module. Interconnexion, deux
pièces qui ne tiennent que l'une par l'autre. Conformité, une séparation nette,
visible, non négociable. Précision, aucune courbe libre, aucun angle arbitraire.
Discrétion, une masse pleine, silencieuse, sans effet.

**Les pistes écartées.** « Les Galets » (deux galets convergents, servie du
2026-08-02 au 2026-08-03) et « La Voûte » restent dans le code pour mémoire et
pour un aller-retour en une ligne (§4.6). Ne pas les employer.

### 4.2 La géométrie

Le symbole est tracé sur une grille de dix modules par dix. Toute cote se ramène à
une fraction du côté, ce qui garantit un redessin exact à n'importe quelle échelle
et une reproduction fidèle en gravure comme en broderie. Repère du code :
`viewBox 0 0 24 24`, donc **1 module = 2,4**.

| Cote | Fraction | Repère 24 |
|---|---|---|
| Côté | 1,00 | 24 |
| Première coupe verticale | 0,60 | 14,4 |
| Seconde coupe verticale | 0,40 | 9,6 |
| Gradin horizontal | 0,50 | 12 |
| Rayon des angles | 0,10 | 2,4 |
| Largeur du joint | 0,05 | 1,2 |
| Symétrie | rotation 180° | autour de (12, 12) |

Le gradin est placé exactement au centre : c'est la seule position qui rend les
deux pièces superposables par rotation, et c'est ce qui donne au symbole son
équilibre optique sans recourir à une symétrie miroir, toujours plus banale.

**Le joint est évidé, jamais peint.** Les deux pièces sont deux chemins distincts
et c'est le fond qui passe entre elles. C'est ce qui fait tenir la règle « le joint
ne disparaît jamais » sur un fond clair, sombre, vert de marque ou imprimé, sans
avoir à recolorer quoi que ce soit selon la surface.

**Dessin ultra petite taille.** Sous vingt pixels, le rayon et le joint de
référence se bouchent au rendu. Un dessin distinct prend le relais : rayon 0,07,
joint 0,09. `SafeMark` bascule tout seul au seuil `MARK_XS_THRESHOLD`. Cette
version ne s'emploie jamais au dessus de vingt pixels.

**Zone de protection.** Deux modules, soit un cinquième du côté, sur les quatre
côtés. Aucun élément, texte, filet ou bord de support, ne peut y pénétrer.

Le fichier `components/brand/safe-mark.ts` est la seule définition de ces formes.
**Ne jamais recopier un `path` de logo ailleurs dans le dépôt.**

### 4.3 Les encres

La marque est **bicolore** : la pièce haute-gauche porte l'encre principale, la
pièce basse-droite la seconde. Le joint n'a pas d'encre.

| Ton | Pièce A | Pièce B | Mot « SAFE » | Quand |
|---|---|---|---|---|
| `light` | `#1F3A2E` | `#2E7D5B` | `#161A18` | Fond clair. Défaut. |
| `dark` | `#FAFAF8` | `#2E7D5B` | `#EDF3EF` | Fond sombre. Dite « inversée couleur ». |
| `onBrand` | `#FAFAF8` | `#2E7D5B` | `#EDF3EF` | Fond vert de marque. |
| `mono-dark` | `#222222` | `#222222` | `#1C1C1C` | Impression, factures, rapports. |
| `mono-light` | `#FAFAF8` | `#FAFAF8` | `#FFFFFF` | Fond photographique ou vert plein. |
| `currentColor` | texte courant | texte courant | texte courant | Rapport d'audit, surfaces à deux couleurs. |

En monochrome, les deux pièces prennent la même encre et le symbole devient une
masse pleine fendue d'un S en creux. Sur une facture, la marque ne consomme
qu'une des deux couleurs autorisées : employer `mono-dark` ou `currentColor`.

Palette complète de la charte, exposée dans `SAFE_PALETTE` : vert forêt `#1F3A2E`,
vert émeraude `#2E7D5B`, blanc cassé `#FAFAF8`, beige chaud `#F5F2EB`, anthracite
`#222222`, gris chaud `#666666`.

### 4.4 Le verrou horizontal

Le mot **SAFE**, en capitales, en **grotesque** (Geist Sans), graisse 500,
interlettrage `0.2em`. Jamais en serif : le symbole est entièrement orthogonal, un
serif à côté jure.

Le mot ne s'aligne jamais sur la hauteur totale du symbole, sinon il paraît écrasé.
La charte le compose plus grand quand le verrou est petit : 0,50 du côté du mark sur
la planche de démonstration à 52 px, 0,59 dans la barre latérale à 22 px, 0,65 dans
l'entête à 26 px. Le produit n'emploie que la fourchette basse, 17 à 22 px de mark :
le code encode donc `corps du mot = côté du mark × 0,62`, écart `× 0,30` (trois
modules). C'est un rapport, pas une valeur figée.

Verrou **empilé** pour les formats étroits, wordmark **seul** pour les documents
juridiques : les deux existent dans la charte, aucun n'est encore codé.

**Taille minimale** : 16 px de mark à l'écran, 6 mm à l'impression.

### 4.5 La plaque

Un carré arrondi vert forêt, mark en inversée couleur à l'intérieur, occupant 60 %
du côté.

Le symbole étant déjà un carré plein, la plaque ne sert **que** là où il faut une
pastille verte détachée d'un fond clair, typiquement une **icône d'application**.
La favicon (`app/icon.svg`), les barres de navigation et les pieds de page prennent
le symbole nu.

### 4.6 Comment l'employer dans le code

```tsx
import { SafeLogo, SafeMark, SafeBullet } from "@/components/branding/SafeLogo";

<SafeLogo size={19} />                    // verrou complet, fond clair
<SafeLogo size={19} variant="dark" />     // fond sombre
<SafeLogo size={20} tone="mono-dark" />   // document imprimé
<SafeMark size={24} tone="dark" />        // mark seul
<SafeLogo size={32} plate markOnly />     // icône d'application
<SafeBullet size={11} />                  // puce de liste, prend la couleur du texte
```

- **Page de contrôle** : `/marque` montre la marque servie à toutes les tailles et sur
  tous les fonds, et garde les pistes écartées pour mémoire. Non indexée.
- **Bascule de forme** : `SAFE_MARK_DEFAULT` dans `components/brand/safe-mark.ts`
  change la marque partout, y compris les puces et le canevas flottant. Chaque forme
  déclare ses métriques dans `MARK_GEOMETRY` : ni le verrou ni les usages dérivés ne
  sont à retoucher.
- **Images de la marque** : `npm run brand:assets` régénère les PNG (données
  structurées JSON-LD, icône Apple) en **lisant** les chemins dans `safe-mark.ts`.
  Ne jamais fabriquer ces fichiers à la main ni par capture d'écran.
- **Masquer le mot en petit écran** : `wordClassName="hidden sm:block"` sur `SafeLogo`.
  C'est le besoin qui poussait les entêtes à recomposer le verrou à côté du composant.
  Ne jamais reposer un `<span>SAFE</span>` à la main à côté d'un `SafeMark`.
- `components/brand/Logo.tsx` ne fait plus que réexpédier vers le composant canonique.
  Ne rien y ajouter.

### 4.7 Les usages dérivés

La **pièce haute-gauche seule** est le plus petit fragment de marque encore
reconnaissable. Elle sert de pièce flottante dans les entêtes de page (`PaperDrift`).
Ce n'est pas un logo : elle ne remplace jamais la marque complète et ne porte jamais
le nom du produit. `SafeBullet` sert le symbole entier, réduit, dans la couleur du
texte courant.

### 4.8 Interdits

- Recopier un `path` du logo dans un autre fichier.
- Recomposer le verrou à la main : un `SafeMark` suivi d'un `<span>SAFE</span>`. C'est
  ce qui a fait rater le changement de marque à six surfaces le 2026-08-03.
- Dessiner une lettre « S » dans une pastille en guise de logo.
- Peindre le joint, le réduire, ou le laisser se refermer. **Le joint ne disparaît
  jamais** : c'est la règle qui tient tout le reste.
- Donner aux deux pièces des couleurs hors de la palette, ou inverser leur ordre.
- Changer les proportions du verrou, ou composer le mot dans une autre fonte.
- Réduire l'écart entre le symbole et le mot, ou faire passer le mot en premier.
- Écrire « Safe » en bas de casse. C'est **SAFE**.
- Poser le symbole sur un fond à contraste faible.
- Animer la marque en continu.
- Poser le mark sur une plaque ailleurs que sur une icône d'application.
- Incliner, déformer, contourner ou ombrer la marque.

### 4.9 Le compromis assumé

Le symbole est une **masse pleine** : il pèse plus lourd qu'un dessin au trait à
taille égale. Dans une barre de navigation, un mark de 20 px suffit là où l'ancienne
marque en demandait 24. C'est le prix de la tenue en gravure, en broderie et en
favicon, et il est accepté.

Le joint évidé laisse passer le fond. Sur une surface texturée ou photographique,
il faut donc poser le symbole sur un aplat, ou employer la plaque (§4.5).

---

## 5. Ce qui reste ouvert

- **Identité illustrée.** Une direction « gravure sur parchemin » existe en parallèle
  (illustration au trait, encre `#1F2A24`, accent émeraude unique, fond `#EDE6D4`).
  Elle est décrite dans [SAFE_BRAND_CONTEXT §8](SAFE_BRAND_CONTEXT.md) et n'est pas
  encore appliquée. L'Assemblage y est neutre : la marque est abstraite, elle ne
  concurrence aucune illustration.
- **Unification des deux surfaces de couleur** (§3.2). Chantier ouvert, non tranché.
- **Manifeste web.** La favicon (`app/icon.svg`) et l'icône Apple
  (`public/apple-touch-icon.png`) existent ; le `manifest.json` reste à écrire.
- **Verrou empilé et wordmark seul.** Définis dans la charte (§4.4), pas encore codés.
