# SAFE — Modèle taxes et provinces

Date: 2026-04-29
Portée: configuration des taxes par cabinet, application sur factures, débours, imports.

## 1. Régimes ciblés (V2)

SAFE doit être crédible immédiatement pour deux régimes :

| Province | Régime | Taxes | Note |
|---|---|---|---|
| **Québec (QC)** | TPS + TVQ | TPS 5.0 % + TVQ 9.975 % | TVQ sur (montant + TPS) — base composite, **non** appliquée par défaut, à valider cas par cas. La pratique fiscale courante : TVQ sur le **montant seul** (méthode séparée), c'est ce que SAFE applique. |
| **Ontario (ON)** | HST | HST 13.0 % | Taxe unique fédérale-provinciale. |

Provinces additionnelles documentées (à venir) :
| Province | Taxe | Taux |
|---|---|---|
| Alberta (AB) | TPS | 5.0 % |
| Colombie-Britannique (BC) | TPS + PST | 5.0 % + 7.0 % |
| Manitoba (MB) | TPS + RST | 5.0 % + 7.0 % |
| Saskatchewan (SK) | TPS + PST | 5.0 % + 6.0 % |
| Nouveau-Brunswick (NB) / NS / NL / PE | HST | 15.0 % |

Ces provinces sont prévues dans le modèle mais ne sont pas la cible commerciale immédiate.

## 2. Configuration par cabinet

**Aucun nouveau modèle Prisma pour V2**. La configuration vit dans la table existante `CabinetInterface.modules.facturation.taxes` (JSON) qui contient déjà `mode` et `taux` ([lib/seeds/onboard-derisier.ts](../../lib/seeds/onboard-derisier.ts) :

```json
{
  "modules": {
    "facturation": {
      "taxes": { "mode": "hst", "taux": 13 }
    }
  }
}
```

Format canonique V2 (à respecter par tout nouveau seed et toute écriture) :

```ts
type CabinetTaxConfig = {
  province: "QC" | "ON" | "AB" | "BC" | "MB" | "NB" | "NS" | "NL" | "PE" | "SK" | "YT" | "NT" | "NU";
  mode: "tps_tvq" | "hst" | "tps_only" | "tps_pst" | "tps_rst" | "none";
  rates: {
    tps?: number;       // 5.0
    tvq?: number;       // 9.975
    hst?: number;       // 13.0 (ON), 15.0 (Atlantique)
    pst?: number;       // BC: 7.0
    rst?: number;       // MB: 7.0
  };
  // Numéros d'enregistrement
  registrations?: {
    tpsNumber?: string;
    tvqNumber?: string;
    hstNumber?: string;
  };
}
```

Helper de lecture dans `lib/billing/taxes.ts` :

```ts
function getCabinetTaxConfig(cabinetInterfaceModulesJson: unknown): CabinetTaxConfig
```

Avec fallback robuste : si la config est manquante ou malformée, on retombe sur QC par défaut (TPS + TVQ) en émettant un warning serveur.

## 3. Taxabilité par ligne et par débours

### 3.1 Taxabilité d'une `InvoiceLine`

`InvoiceLine.taxable` (booléen) reste la source de vérité par ligne. La doctrine :

| Type de ligne | Taxable par défaut | Justification |
|---|---|---|
| Honoraires (`fee` / `time_entry`) | **Oui** | Service taxable. |
| Forfait (`registre_tache`) | Hérite de `RegistreTache.taxable` (souvent `true`) | Service. |
| Débours taxable (`debours_dossier`, ex: photocopies, recherches) | Oui | Service refacturé avec marge. |
| Débours **non taxable** (`debours_dossier`, ex: frais gouvernementaux IRCC) | Non | Sans valeur ajoutée par le cabinet. Le `DeboursType` détermine la taxabilité. |
| Intérêts de retard (`interest`) | Non | Pas une fourniture taxable au Canada. |
| Crédit / rabais (`credit`, `adjustment`) | Mêmes règles que la ligne corrigée | Cohérence avec la base. |
| Application fidéicommis (`trust_application`) | Non | Pas une fourniture. |

### 3.2 Calcul

Pour une ligne taxable de montant `m` :

| Régime | TPS | TVQ | HST | Total taxes |
|---|---|---|---|---|
| QC (`tps_tvq`) | `m × 0.05` | `m × 0.09975` (séparée) | — | `m × 0.14975` |
| ON (`hst`) | — | — | `m × 0.13` | `m × 0.13` |
| AB (`tps_only`) | `m × 0.05` | — | — | `m × 0.05` |
| BC (`tps_pst`) | `m × 0.05` | — | — (PST séparée) | `m × 0.12` |
| Atlantique (`hst`) | — | — | `m × 0.15` | `m × 0.15` |
| `none` | 0 | 0 | 0 | 0 |

Pour une ligne non taxable : `0` quel que soit le régime.

### 3.3 Arrondi

Arrondi à la **deuxième décimale** par ligne (`Math.round(amount * 100) / 100`). Total facture = somme des lignes arrondies. Ne **jamais** arrondir le total après somme — c'est la source de mismatchs entre l'aperçu et la facture émise.

## 4. Impact sur la facture

Le cabinet ON émet une facture en CAD avec colonnes : Sous-total taxable, HST 13 %, Total. Le cabinet QC émet : Sous-total taxable, TPS 5 %, TVQ 9.975 %, Total.

Les colonnes affichées sont **dérivées** de `CabinetTaxConfig.mode`, pas saisies manuellement.

Les débours non taxables apparaissent **après** les taxes dans le PDF, dans une section "Frais (non taxables)".

## 5. Impact sur les rapports

KPIs comptabilité :
- **Revenus HT** = somme des sous-totaux taxables des factures émises (pré-taxes).
- **Taxes collectées** = somme des taxes par régime (TPS + TVQ ou HST).
- **Revenus avec débours** = revenus HT + débours non taxables refacturés.
- **À remettre** = Taxes collectées (à reporter au gouvernement).

Les rapports doivent **séparer** les régimes — un cabinet multi-province ne mélange jamais TPS/TVQ avec HST dans les colonnes.

## 6. Impact sur les imports

### 6.1 Import bancaire

Une dépense importée porte `montantHt` + `tps` + `tvq` (ou HST) en colonnes optionnelles (modèle `CabinetExpense` existant). Si non renseigné, le cabinet peut **calculer en arrière** depuis le total via le helper `splitInclusiveTaxes(total, config)`.

### 6.2 Import comptable historique (`migration_comptable`)

Les lignes contiennent déjà des montants TTC ou des splits. Le moteur `accounting-ledger` ne tente pas de recomposer les taxes — il prend le montant tel quel et l'écrit au journal.

## 7. Helpers cibles dans `lib/billing/taxes.ts`

```ts
// Lit la config depuis JSON CabinetInterface.modules
getCabinetTaxConfig(modulesJson: unknown): CabinetTaxConfig

// Calcule les taxes pour un montant et une ligne
applyTaxes(amount: number, taxable: boolean, config: CabinetTaxConfig): {
  base: number;
  tps: number;
  tvq: number;
  hst: number;
  pst: number;
  total: number;       // base + somme taxes
}

// Décomposition inverse (utile pour imports)
splitInclusiveTaxes(total: number, config: CabinetTaxConfig): {
  base: number;
  tps: number;
  tvq: number;
  hst: number;
  pst: number;
}

// Régime par défaut quand la config est absente
getDefaultTaxConfig(province: string | null): CabinetTaxConfig
```

Tous les helpers sont **purs** (aucun accès Prisma) et testables.

## 8. Garde-fous

- Ne jamais hardcoder `5%`, `9.975%`, `13%` dans un composant ou un service. Toujours passer par la config.
- Ne jamais appliquer une taxe à un débours non taxable, même si le total facture suggère le contraire.
- Toujours afficher le numéro d'enregistrement de taxe sur la facture émise.
- Toute évolution future (nouvelle province, changement de taux) passe par mise à jour de la config canonique + tests dans `lib/billing/__tests__/taxes.test.ts`.
