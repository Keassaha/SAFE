# Spec — Correctif taxes : calcul par province (TVH/HST vs TPS/TVQ)

> **Statut :** Proposée — à valider avant build
> **Date :** 2026-05-29
> **Déclencheur :** Vérification comptable de la facturation mixte Derisier (Ontario)
> **Règle projet :** « Pas de build sans spec validée » (CLAUDE.md)
> **Cabinet pilote :** `derisier-law-on-2026` (Ontario, TVH 13 %)

---

## 1. Problème

Toute la chaîne de facturation calcule les taxes en **dur sur le régime du Québec**
(`TPS 5 % + TVQ 9,975 % = 14,975 %`), quelle que soit la province du cabinet.
Pour Derisier (Ontario, **TVH/HST 13 %**), chaque facture taxable serait :

- **surfacturée** d'environ 2 % (14,975 % au lieu de 13 %) ;
- **non conforme** : libellée « TPS/TVQ » au lieu de « TVH/HST » (exigence ARC + LSO).

Un module canonique correct existe déjà (`lib/billing/taxes.ts` :
`getCabinetTaxConfig` + `applyTaxes`, qui lit le format `{mode:"hst", taux:13}` de Derisier
et renvoie un montant `hst`) — **mais aucun chemin de facturation ne l'utilise.**

### 1.1 Faits vérifiés (code + données live)

| Étage | État | Détail |
|---|---|---|
| Config Derisier | ✅ | `modules.facturation.taxes = {mode:"hst",taux:13}`, n° TVH présent |
| `lib/billing/taxes.ts` | ✅ inutilisé | renvoie `{base,tps,tvq,hst,pst,rst,taxesTotal,total}` |
| Calcul facturation | ❌ | 8 fichiers codent TPS/TVQ en dur (voir §6) |
| Schéma `Invoice` | ⚠️ | colonnes `tps,tvq,taxGst,taxQst,taxTotal` — **pas de `hst`** |
| `invoice-presenter.ts` | ⚠️ | n'expose que `tps`/`tvq`, jamais `hst` |
| `InvoiceTemplateClean.tsx` | ✅ prêt | prop `hst` → libellé « TVH (13%) », prioritaire sur TPS/TVQ |
| Factures Derisier en base | ✅ **0** | correctif prospectif, **aucune migration de données** |

## 2. Objectifs

1. Calculer les taxes **selon la province/le régime du cabinet** via le module canonique
   `getCabinetTaxConfig` + `applyTaxes` — fin du codage en dur Québec.
2. **Persister** le bon montant et le transporter jusqu'au gabarit qui sait déjà
   afficher « TVH (13%) ».
3. Zéro régression pour les cabinets Québec (TPS/TVQ inchangé).

## 3. Hors périmètre

- Pas de refonte du gabarit `InvoiceTemplateClean` (déjà compatible TVH).
- Pas de nouveau moteur de facture ; on branche l'existant sur le module canonique.
- Pas de support des taxes incluses (`splitInclusiveTaxes`) au-delà de l'existant.
- Régimes PST/RST (BC/SK/MB) : **préparés** par le module mais non priorisés pour ce
  correctif (Derisier = HST). On évite seulement de les casser.

## 4. Décision centrale — stockage du montant TVH

`Invoice` n'a pas de colonne `hst`. Deux options :

### Option A — **Mapping sans migration** *(recommandée)*
- Stocker le **total des taxes** dans les champs existants : pour un régime mono-taxe
  (HST, ou TPS seule), écrire le montant dans `taxTotal` + `tps`/`taxGst`, et `tvq`/`taxQst = 0`.
- Le **presenter** lit `modules.facturation.taxes` via `getCabinetTaxConfig` :
  - mode `hst` → expose `hst = montant`, `tps = 0`, `tvq = 0` au gabarit ;
  - mode `tps_tvq` → expose `tps`/`tvq` comme aujourd'hui.
- **Avantage :** zéro migration sur la base partagée prod/dev ; le gabarit gère déjà `hst`.
- **Inconvénient :** le champ `tps` contient un montant TVH au niveau base (sémantique
  « total fédéral-équivalent ») — acceptable car l'affichage est piloté par le mode.

### Option B — **Ajouter colonnes `hst`/`pst`/`rst` à `Invoice`** (+ `InvoiceLine`)
- Plus propre sémantiquement ; nécessite une **migration Prisma** sur la base partagée.
- Risque maîtrisé (0 facture existante) mais touche le schéma → validation supplémentaire.

> **Recommandation : Option A.** Réversible, sans migration, exploite le support TVH
> déjà présent dans le gabarit. On pourra passer à B plus tard si d'autres régimes
> multi-taxes (PST) deviennent prioritaires.

## 5. Comportement proposé (Option A)

### 5.1 Source unique de calcul
- Charger une fois `getCabinetTaxConfig(modules)` par facture.
- Remplacer chaque `Math.round(x * TPS_RATE …)` / `TVQ_RATE` des services par
  `applyTaxes(base, taxable, config)`.
- Totaux facture : `subtotalTaxable`, `taxTotal = applyTaxes(...).taxesTotal`,
  `montantTotal = subtotalTaxable + taxTotal + nonTaxable`.
- Écriture des champs Invoice : mode `hst` → `tps = taxTotal, tvq = 0, taxGst = taxTotal,
  taxQst = 0, taxTotal` ; mode `tps_tvq` → `tps/tvq/taxGst/taxQst` comme aujourd'hui.

### 5.2 Affichage (presenter → gabarit)
- `invoice-presenter.ts` : déduire le mode via `getCabinetTaxConfig` et exposer
  `hst` quand mode `hst` (sinon `tps`/`tvq`). Le gabarit fait déjà le reste.

### 5.3 Aperçu live (`CreateInvoiceView.tsx`)
- Remplacer le calcul codé en dur (l.304-305) par `applyTaxes` avec la config du cabinet
  passée en prop (le `billingMode` est déjà passé ; ajouter la config taxes).

## 6. Fichiers touchés

| Fichier | Changement | Priorité |
|---|---|---|
| `lib/services/forfait-billing-service.ts` | `createInvoiceFromClientBillables` + autres → `applyTaxes` | **P0** (chemin Derisier) |
| `lib/services/billing/invoice-service.ts` | `recalculateInvoiceTotals` + `createDraftFromBillableItems` → `applyTaxes` | **P0** (recalcul canonique) |
| `lib/services/billing/invoice-presenter.ts` | exposer `hst` selon mode | **P0** |
| `app/(app)/facturation/nouvelle/CreateInvoiceView.tsx` | aperçu via `applyTaxes` | **P0** |
| `lib/services/billing/credit-note-service.ts` | notes de crédit → `applyTaxes` | P1 |
| `app/api/facturation/factures/[id]/route.ts` | recalcul édition → via service | P1 |
| `app/api/facturation/honoraires/route.ts` | chemin honoraires legacy | P1 |
| `app/(app)/facturation/honoraires/[clientId]/HonorairesDetailClientView.tsx` | aperçu honoraires | P1 |

Aucun changement de schéma Prisma (Option A). Aucune migration de données (0 facture).

## 7. Cas limites

- Cabinet sans config taxes → `getDefaultTaxConfig(billingProvince)` (déjà géré).
- Ligne `taxable = false` → 0 taxe (déjà géré par `applyTaxes`).
- Arrondis : `applyTaxes` arrondit à 2 décimales par taxe (cohérent avec l'existant).
- Province PST/RST → calcul correct par le module, affichage à valider (hors P0).

## 8. Critères d'acceptation

1. Facture Derisier (Ontario) taxable de base 1000 $ → **TVH 130 $**, total 1130 $,
   libellé « TVH (13%) » sur la facture. **Pas** de ligne TPS/TVQ.
2. Cabinet Québec → TPS 50 $ + TVQ 99,75 $ inchangé, libellés « TPS »/« TVQ ».
3. Aperçu `CreateInvoiceView` = montants persistés (même calcul).
4. `recalculateInvoiceTotals` produit les mêmes taxes que la création.
5. `tsc --noEmit` : 0 erreur.

## 9. Déploiement

- Build + validation sur **localhost** (worktree) d'abord.
- Mise en ligne = **redéploiement Vercel** après validation visuelle d'une facture test.
- Aucune migration (Option A).

## 10. Décisions à trancher

- **Stockage :** Option A (mapping, recommandée) vs Option B (colonnes + migration).
- **Portée du build :** P0 seulement (chemin Derisier + recalcul + aperçu) puis P1 ensuite,
  **ou** P0+P1 d'un coup.
