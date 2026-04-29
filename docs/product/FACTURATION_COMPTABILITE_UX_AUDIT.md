# SAFE — Audit UX facturation et comptabilité

Date: 2026-04-29
Portée: pages facturation, comptabilité, journal général, journal des dépenses, cohérence avec le reste du produit.

## 1. État des lieux

Le design system de SAFE est **bien architecturé** : tokens forest/sand/zinc cohérents ([app/globals.css](../../app/globals.css), [tailwind.config.ts](../../tailwind.config.ts)), motion uniforme via Framer Motion, hiérarchie typographique claire. La fondation est saine.

L'application de cette fondation est en revanche **fragmentée** entre les écrans facturation/comptabilité/journal. Trois systèmes visuels coexistent pour les KPIs, les paddings de tables divergent, certains badges contournent le `StatusBadge` partagé. Aucune de ces incohérences n'est bloquante, mais leur cumul ramène la perception "premium" à 3.5/5 alors que la fondation autorise 4.5+/5.

## 2. Diagnostics par page

### 2.1 Facturation ([app/(app)/facturation/page.tsx](../../app/(app)/facturation/page.tsx))

**Note : 4/5**

Forces :
- Structure CardHeader/Table solide.
- Filtres lisibles et inline.
- KPIs concis (5 cartes).

Frictions :
- **Couleurs KPI ad-hoc** : `text-status-success`, `text-blue-600`, `text-amber-600` mélangés sans logique sémantique. Une carte "envoyées" en bleu quand le reste du produit utilise `forest` pour le crédit.
- **Pas d'animation de valeur** (vs `AnimatedNumber` côté comptabilité).
- **PageHeader gradient** hardcodé en inline style (`linear-gradient(115deg, #0F2A22 0%, ...)`) — non réutilisable.
- **`feeAmount ?? montant`** silencieux ([page.tsx:128](../../app/(app)/facturation/page.tsx)) — voir doctrine §3.

Recommandations :
1. Utiliser un composant unique `KpiCard` (cf. §4) avec sémantique alignée.
2. Animer les valeurs KPI.
3. Extraire le gradient en CSS variable réutilisable (`--safe-gradient-hero`).

### 2.2 Comptabilité — vue principale ([app/(app)/comptabilite/ComptabilitePageView.tsx](../../app/(app)/comptabilite/ComptabilitePageView.tsx))

**Note : 3.5/5**

Forces :
- KPIs riches (trend, sémantique credit/debit).
- Onglets clairs (Journal général / Dépenses / Paiements).

Frictions :
- **6 cartes KPI** (vs 5 facturation, 4 clients) — densité non uniforme.
- **Padding / hover différents** entre tableau dépenses et tableau facturation.
- **KPI "soldeGlobal"** affiche un cumul potentiellement incorrect si le journal a été corrigé hors séquence (cf. audit §2.11).

Recommandations :
1. Standardiser à 4 cartes KPI primaires + drilldown vers 6 cartes secondaires si besoin.
2. Marquer visuellement le `soldeGlobal` comme "calculé" (badge "vérifié au xx/xx") avec un bouton "recalculer" qui force la somme depuis zéro.

### 2.3 Journal général ([app/(app)/journal/general/GeneralJournalPageView.tsx](../../app/(app)/journal/general/GeneralJournalPageView.tsx))

**Note : 3.5/5**

Forces :
- Append-only respecté visuellement (pas de bouton "modifier").
- Filtres complets (date, type, client, dossier, search).
- Export CSV.

Frictions :
- **Source unique non rappelée** : l'utilisateur ne sait pas que cette page est la source de vérité comptable. Un bandeau "Source de vérité — append-only — toute correction passe par une entrée CORRECTION" rendrait la doctrine visible.
- **Lien manquant vers la source** : chaque ligne porte un `sourceModule` mais pas de deep link vers l'objet d'origine (facture, paiement, transaction trust).

Recommandations :
1. Bandeau doctrine en tête de page.
2. Colonne `Source` cliquable qui mène à la facture / paiement / transaction d'origine.
3. Indicateur de cohérence : badge vert si `solde` recalculé == `solde` stocké de la dernière entrée.

### 2.4 Journal des dépenses ([app/(app)/journal/depenses/ExpenseJournalPageView.tsx](../../app/(app)/journal/depenses/ExpenseJournalPageView.tsx))

**Note : 3/5**

Forces :
- Workflow validation clair (nouveau → à valider → validé).
- Catégorisation suggérée avec score de confiance.

Frictions :
- **Confiance affichée via badges customs** (`bg-green-500/20`, etc.) au lieu de `StatusBadge` — incohérence visuelle.
- **Padding tbody `py-2`** (vs `py-3` facturation) — micro-friction.
- **Hover translucide** `bg-white/5` (vs opaque ailleurs).
- **Pas de lien vers le journal général** alors que ces dépenses **devraient** y figurer (cf. doctrine §4).

Recommandations :
1. Étendre `StatusBadge` avec variant `confidence: high|medium|low`.
2. Aligner padding et hover sur le pattern facturation.
3. Une fois la doctrine implémentée (écriture journal pour `CabinetExpense`), ajouter une colonne "Au journal général" avec badge ✓.

### 2.5 Page facturation/nouvelle ([app/(app)/facturation/nouvelle/CreateInvoiceView.tsx](../../app/(app)/facturation/nouvelle/CreateInvoiceView.tsx))

**Note : 3.5/5**

Frictions :
- Mode forfait vs horaire pas explicitement signalé en haut. L'opérateur découvre la nature de la facture au fil des lignes.
- Pas de "preview rentabilité" (combien on est en train de facturer pour combien de temps interne consommé).

Recommandations :
1. Bandeau "Mode : forfait" ou "Mode : horaire" en haut, pré-sélectionné depuis la pratique du dossier.
2. Carte "Synthèse" en sidebar : nombre d'items, sous-total, taxes, total — recalculée en live.

## 3. Recommandations transverses

### 3.1 Composant `KpiCard` unifié (priorité 1)

Créer `components/ui/KpiCard.tsx` avec :

```tsx
type KpiCardProps = {
  label: string;
  value: number | string;
  unit?: string;
  icon?: LucideIcon;
  semantic?: "neutral" | "credit" | "debit" | "warning" | "info";
  trend?: { direction: "up" | "down" | "flat"; pct?: number };
  animated?: boolean;
  href?: string;
};
```

Aligner :
- Padding `py-5 px-5`
- Valeur `text-2xl font-semibold tabular-nums`
- Label `text-xs font-medium uppercase text-secondary`
- Sémantique stricte : `credit = forest`, `debit = red`, `warning = amber`, `info = sand`, `neutral = zinc`.

Migrer `FacturationMainKpis`, `ComptaKpiCard`, `ClientSummaryCards` à terme.

### 3.2 PageHeader gradient en CSS variable

Définir `--safe-gradient-hero: linear-gradient(115deg, #0F2A22 0%, #1F3A2E 35%, ...)` dans `app/globals.css`. Remplacer l'inline style par `className="bg-[image:var(--safe-gradient-hero)]"`.

### 3.3 Tables : standard padding + hover

`thead` : `py-3 px-4`. `tbody` : `py-3 px-4`. Hover : `hover:bg-neutral-50/60` (opaque).

### 3.4 StatusBadge étendu

Ajouter variants : `confidence-high | confidence-medium | confidence-low` mappés sur la sémantique success / warning / danger.

### 3.5 Bandeau doctrine

En tête du Journal général uniquement : un bandeau sobre rappelant que c'est la source de vérité append-only. Discret mais présent.

## 4. Score consolidé

| Page | Avant V2 | Cible V2 |
|---|---|---|
| Facturation | 4/5 | 4.5/5 |
| Comptabilité | 3.5/5 | 4.5/5 |
| Journal général | 3.5/5 | 4.5/5 |
| Journal dépenses | 3/5 | 4/5 |
| Création facture | 3.5/5 | 4/5 |
| **Moyenne** | **3.5/5** | **4.3/5** |

## 5. Hors scope V2 (mais à noter)

- Refonte de la sidebar produit pour rapprocher visuellement Facturation et Comptabilité (sont aujourd'hui dans des sections séparées).
- Mode "rentabilité" sur la page Facturation (carte qui croise revenu facturé et temps interne consommé).
- Tableau de bord exécutif "santé du cabinet" (KPIs synthétiques cross-pages).

Ces sujets méritent leur propre mission UX dédiée.
