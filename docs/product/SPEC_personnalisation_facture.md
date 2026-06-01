# SPEC — Personnalisation de la facture par cabinet

> Statut : **proposée, en attente de validation CEO**
> Date : 2026-05-31
> Portée : panneau de réglages permettant à un cabinet de personnaliser l'apparence de sa facture (couleur d'accent, logo, mentions N.B., signature).

---

## 1. Objectif

Donner à chaque cabinet un écran de réglages pour personnaliser sa facture **sans toucher au code**, tout en respectant les règles dures :

- **Max 2 couleurs** : UNE seule couleur d'accent configurable + neutres (noir/gris/blanc). Pas de 2ᵉ accent.
- **Jamais de n° de Barreau / LSO** sur la facture.
- DEV = PROD (même base Supabase) : changements **additifs** dans `Cabinet.config` (aucune migration Prisma).

Cabinet pilote : `derisier-law-on-2026`. La fonctionnalité reste générique (tout cabinet).

---

## 2. Ce que l'utilisateur peut régler

| Réglage | Stockage | Défaut |
|---|---|---|
| **Couleur d'accent** | `config.invoice.accentColor` (hex) | `#7A3B2E` (marron Derisier) |
| **Logo** | `Cabinet.logoUrl` (data-URI base64) | (aucun) |
| **Mentions N.B.** (FR/EN, multi-lignes) | `config.invoice.notice.{fr,en}` | (existant) |
| **Signature** (nom + titre FR/EN) | `config.invoice.signature` | (existant) |

> Le **modèle** de facture (`template: "derisier" | "standard"`) reste hors de ce panneau (réglage technique, défini au déploiement). On personnalise l'apparence, pas la structure.

---

## 3. Couleur d'accent — règles

La couleur d'accent sert de fond au **bandeau**, à l'**en-tête de tableau** et à l'**encadré TOTAL**, avec du **texte blanc** par-dessus. Elle doit donc être **assez foncée** pour rester lisible.

- **Présélections** (recommandé) : 6–8 couleurs sobres et foncées validées (marron, bleu marine, vert sapin, bordeaux, ardoise, prune…).
- **Hex personnalisé** : autorisé, mais **garde-fou de luminance** — si la couleur est trop claire (luminance relative > seuil, ~0,45), on refuse avec un message « couleur trop claire, le texte blanc ne serait pas lisible ».
- **Teintes dérivées calculées** (pas stockées) :
  - `accentSoft` = accent mélangé ~92 % blanc (fonds très légers, ex. N.B.).
  - `onBand` = accent mélangé ~85 % blanc (texte secondaire blanc cassé sur le bandeau).
- Une seule couleur stockée → **la règle « max 2 couleurs » est garantie par construction**.

---

## 4. Modèle de données

`lib/cabinet-config.ts` — ajout d'un champ :

```ts
export type CabinetInvoiceConfig = {
  template?: CabinetInvoiceTemplate;
  notice?: CabinetInvoiceNotice;
  signature?: CabinetInvoiceSignature;
  accentColor?: string; // hex « #RRGGBB » ; défaut #7A3B2E à la lecture
};
```

- `getCabinetInvoiceConfig` retourne aussi `accentColor: string` (défaut `#7A3B2E`, normalisé/validé).
- `mergeCabinetConfig` : `accentColor` suit le spread additif de `invoice` (déjà géré).

---

## 5. Propagation (présentateur → composant)

- **`invoice-presenter.ts`** : `extractInvoiceTemplate` retourne aussi `accentColor` ; `PresentedCabinet` gagne `invoiceAccentColor: string`.
- **`DerisierInvoiceDocument.tsx`** : refactor des styles statiques en **`createStyles(palette)`** où `palette = { accent, accentSoft, onBand, ...neutres }` est calculée à partir de `cabinet.invoiceAccentColor`. Toutes les occurrences de `ink.accent` (bandeau, tableHead, totalBox, tableBottom, métaLabels, nbLabel, signatureLine) deviennent dynamiques.
- **Nouveau** `lib/invoice-template/color.ts` : helpers purs `hexToRgb`, `mixWithWhite`, `relativeLuminance`, `isAccentDarkEnough`. Testés unitairement.

> Le gabarit `standard` (tokens.ts, vert SAFE) n'est **pas** rendu configurable dans ce lot (stretch goal noté §9).

---

## 6. UI — panneau de réglages

**Emplacement** : nouvelle page `app/(app)/parametres/facture/page.tsx` (carte « Apparence de la facture »), liée depuis `/parametres`. Réutilise le pattern de `parametres/cabinet`.

**Sections du formulaire :**
1. **Couleur d'accent** — grille de pastilles présélectionnées + champ hex + aperçu de la pastille.
2. **Logo** — `<input type="file">` → conversion client en data-URI (guard : PNG/JPG, < 200 Ko), aperçu, bouton « retirer ».
3. **Mentions N.B.** — 2 zones de texte (FR / EN), une ligne par paragraphe ; aide « 1ʳᵉ ligne mise en évidence ».
4. **Signature** — nom + titre FR + titre EN.
5. **Aperçu en direct** — `InvoicePreview` avec une facture-exemple, re-rendu à chaque changement (déjà supporté via blob).

**Permissions** : `canManageCabinetSettings(role)` (comme `updateCabinetIdentity`).

---

## 7. Server action

`app/(app)/parametres/facture/actions.ts` → `updateInvoiceAppearance(formData)` :

- `requireCabinetAndUser` + garde `canManageCabinetSettings`.
- Validation **zod** : `accentColor` (regex `#[0-9a-fA-F]{6}` + garde luminance), `notice` (≤ ~8 lignes/langue, longueur bornée), `signature`, `logoUrl` (data-URI image, taille bornée).
- `sanitizeInput` sur les textes.
- `mergeCabinetConfig(current.config, { invoice: { accentColor, notice, signature } })` + `logoUrl`.
- `createAuditLog` (entityType `Cabinet`, action `update`, fields).
- `revalidatePath('/parametres/facture')` + `/parametres`.

---

## 8. Tests

- `color.test.ts` : luminance / mixWithWhite / garde « assez foncé » (cas marron OK, jaune refusé).
- `cabinet-config` : merge additif de `accentColor` (n'écrase pas notice/signature/taxNumbers).
- `invoice-presenter` : `invoiceAccentColor` exposé + défaut.
- `derisier-render` : rendu avec accent personnalisé (ex. bleu marine) sans throw.
- (UI) au minimum un test de l'action `updateInvoiceAppearance` (validation rejette hex clair / accepte hex foncé).

---

## 9. Hors périmètre (ce lot)

- Personnalisation du gabarit `standard` (vert SAFE) — *stretch* : même mécanisme `createStyles`.
- Choix de police, marges, position du logo.
- Upload de signature manuscrite (image) — décidé : on garde nom + ligne.
- Multi-thèmes / mode sombre.

---

## 10. Découpage proposé

| Lot | Contenu | Dépend de |
|---|---|---|
| **A** | `color.ts` + helpers + tests | — |
| **B** | config (`accentColor`) + presenter + `createStyles` dynamique + test rendu | A |
| **C** | page `parametres/facture` + action + validation + aperçu live | B |
| **D** | i18n FR/EN + vérif `tsc` + suite tests + déploiement | C |

Estimation : ~1 session focalisée (A+B rapides, C le gros morceau UI).
```
