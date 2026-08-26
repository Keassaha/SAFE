# 2026-08-26 — Un montant, une écriture

Parti d'une question simple : pourquoi le registre de facturation et celui des
clients n'écrivent-ils pas les nombres pareil ? Réponse : ce n'était pas une
question de style, c'était un défaut.

## Le défaut

`formatCurrency`, `formatDate` et `formatCalendarDate`, appelés sans locale, se
rabattaient sur `document.documentElement.lang`. Sur le serveur, `document`
n'existe pas : **tout rendu serveur écrivait en français**, pour n'importe quel
cabinet. Côté composant client, le HTML arrivait en français puis l'hydratation
le réécrivait en anglais.

Sur l'écran de facturation, les tuiles de KPI passaient déjà leur locale et le
tableau juste en dessous non : `$1,234.56` en haut, `1 234,56 $` en bas.

## La piste abandonnée

Un magasin de locale par requête, via `cache()` de React, posé par le layout
racine. C'est le mécanisme que next-intl emploie pour lui-même. Mesuré sur une
route de contrôle, il rendait `null` :

```
{ "localeNextIntl": "en", "magasinAuRendu": null, "montant": "1 234,56 $" }
```

React rend `children` en parallèle du layout qui `await` : la page se rend avant
que le layout n'ait écrit. Supprimé plutôt que gardé parce qu'il marchait
souvent.

## Ce qui a été livré

Deux entrées symétriques :

- `lib/i18n/formatteurs.ts` — `useFormatteurs()`, composants client, adossé à
  `useLocale()`.
- `lib/i18n/formatteurs-serveur.ts` — `getFormatteurs()`, asynchrone, adossé à
  `getLocale()` de next-intl.

Chaque formateur garde la signature de sa fonction brute, dernier argument
compris : un fichier migre par son import, pas par ses appels.

**Lot 1** : 113 composants basculés (91 client, 22 serveur). `money()` des
écrans de conformité, appelé 67 fois, devient `useMoney()`.

**Lot 1b** : 25 écrans dont le formateur local codait `"fr-CA"` en dur. Cinq
copies locales de `formatCurrency`, mot pour mot identiques au formateur
canonique (vérifié numériquement), supprimées au passage.

## Preuve

Route de contrôle temporaire, HTML rendu par le serveur avant hydratation :

```
NEXT_LOCALE=fr    serveur : 1 234,56 $     client : 1 234,56 $
NEXT_LOCALE=en    serveur : $1,234.56      client : $1,234.56
```

Six tests dans `lib/i18n/__tests__/locale-formateurs.test.ts`. Typecheck propre,
build vert, 1927 tests passent.

## Le tri : « français voulu » contre « bug »

169 occurrences de `fr-CA`/`en-CA` au départ. Après retrait des ternaires déjà
corrects, il restait 118 littéraux en dur. Classement :

| Classe | Nombre | Décision |
| --- | --- | --- |
| Écran interne du cabinet | 45 | **Corrigé** |
| Console SAFE Inc. (`app/(app)/console/**`) | 15 | Gardé : outil interne mono-opérateur |
| Site vitrine, marketing, calculateurs, audit gratuit | 20 | Gardé : vitrine québécoise francophone |
| Prototype `/v2`, non relié à la navigation | 10 | Hors périmètre |
| Branche française d'un dictionnaire bilingue | 3 | Gardé : correct par construction |
| Écrans et documents non traduits | 14 | Gardé, à traiter comme un chantier d'i18n |
| Courriels et notes internes à SAFE Inc. | 11 | Gardé |

## Ce qui reste, et qui n'est pas un défaut de formatage

Quatorze littéraux subsistent. Aucun n'est une incohérence de format : ce sont
des écrans ou des documents **entièrement en français**, où angliciser la seule
date produirait un objet bâtard.

- `components/edition/EditionDashboard.tsx` — zéro `useTranslations`, copie
  française en dur.
- `components/fideicommis/MonthlyReportScreen.tsx` — « Aucun rapport produit »,
  « Certifié », « Mois » en dur.
- `components/fideicommis/TrustStatementPDF.tsx`, `lib/edition/pdf-builder.tsx`,
  `app/api/employees/year-end/pdf/route.ts` — gabarits non traduits.
- `components/clients/ClientDossierPDF.tsx` — cas le moins cher à reprendre : le
  composant accepte déjà des `labels`, mais son appelant
  (`app/api/clients/[id]/export-dossier/route.ts`) les code en français.
- `formatRelativeFr` (`DashboardViewSafe`) et `formatRelative`
  (`EditionDashboard`) — « il y a 3 min » : de la copie, pas du format.
- `app/(app)/inspection/registres/page.tsx` — le commentaire du code l'assume :
  même règle que le CSV et l'impression, une seule vérité affichée. Le fichier
  écrit aussi « oui » / « non ».

## À décider

Le courriel qui accompagne une facture (`lib/email.ts`,
`invoiceAccompanyingEmailHtml`) est entièrement en français : « Bonjour »,
« Veuillez trouver en pièce jointe ». Un cabinet anglophone envoie donc des
courriels de facturation français à ses clients. Ce n'est pas un défaut de
formatage, c'est un gabarit non traduit, mais c'est celui qui sort du cabinet.
