# Audit des interfaces comptables — Cayard (QC) et Dérisier (ON)

> Plan de correction priorisé. Issu d'un audit de code multi-agents (juin 2026), chaque anomalie vérifiée sur fichier:ligne, avec auto-vérification sceptique pour écarter les faux positifs. Document jumeau de `RECHERCHE_COMPTA_SAFE_QC_ON.md`.

---

## 0. Garde-fou avant toute correction

- **Dérisier est en production** (province ON, TVH, LSO By-Law 9, anglais par défaut, possiblement franco-ontarien). **Aucune correction ne doit régresser Dérisier.** Le français côté Dérisier est légitime ; ce n'est jamais l'anomalie. L'anomalie côté Dérisier, c'est l'inverse : des écrans figés en **TPS/TVQ** (libellé québécois) servis à un cabinet ontarien.
- **Cayard est québécois** (FR, Barreau, TPS/TVQ). C'est là que vivent la plupart des anomalies de **localisation** (chaînes anglaises/LSO codées en dur) et le bug de **PDF en TVH**.
- Le moteur de calcul est sain. Les anomalies sont presque toutes des **erreurs d'affichage** (agrégats trompeurs, libellés figés, langue figée), pas des erreurs de calcul stockées. C'est une bonne nouvelle : les correctifs sont localisés et à faible risque.
- **Avant de corriger le rapprochement à 3 voies** (`[ENG-4]`/`[T5]`), vérifier que les données de prod de Dérisier n'ont pas déjà des soldes-clients négatifs « légitimes » qui bloqueraient une certification en cours.

---

## 1. Synthèse

**14 anomalies confirmées** (après dédoublonnage des recoupements moteur ↔ affichage).

| Sévérité | Cayard (QC) | Dérisier (ON) | Les deux / moteur | Total |
|---|:--:|:--:|:--:|:--:|
| **Critique** | 1 (PDF TVH) | — | 2 (commingling, revenu=facturé TTC) | **3** |
| **Majeur** | 3 (localisation) | 2 (écrans en TPS/TVQ) | 3 (rapprochement, éditeur taxe, revenus facturés) | **8** |
| **Mineur** | 1 | 1 | 1 | **3** |

**Verdict par client.**

- **Cayard (QC)** : l'app le traite correctement comme un cabinet québécois pour la réglementation fidéicommis (bannière, alertes, pages comptes/sécurité/conformité bien localisées). Deux trous : sa **facture PDF officielle sort avec des libellés de taxe ontariens** (critique, document client-facing), et plusieurs écrans profonds (rapprochement, générateur de rapport, conformité) sont **en anglais codé en dur**.
- **Dérisier (ON)** : intact sur le fidéicommis (branche LSO par défaut). Trou symétrique : les écrans **Rapports → Taxes** et **Facturation → TPS/TVQ à remettre** sont **figés en libellés québécois**, donc faux pour un cabinet HST.
- **Les deux / moteur** : le tableau de bord comptabilité affiche un « Solde global » qui **mélange le fidéicommis** et un « Revenu » qui vaut le **facturé TTC**. Ce sont les deux anomalies les plus graves au sens de la recherche (commingling + taxe-dans-revenu).

---

## 2. Tableau priorisé des anomalies confirmées

Effort : **S** ≤ ½ j · **M** ½–2 j · **L** > 2 j.

| id | Client | Sévérité | Catégorie | Fichier:ligne | Problème | Correctif | Effort |
|---|---|---|---|---|---|---|:--:|
| **DASH-01** | both | 🔴 critique | commingling | `lib/services/journal/journal-service.ts:47,197,314` ; affichage journal/comptabilité | Le « Solde global » cumule aussi `DEPOT/RETRAIT_FIDEICOMMIS` → argent client affiché comme solde du cabinet | Exclure les types fidéicommis du `solde` cabinet (solde séparé), ou retirer la carte et afficher le fidéicommis distinctement (comme `DashboardView`) | M |
| **ENG-2 / DASH-02** | both | 🔴 critique | taxe-dans-revenu + facture=encaissement | `journal-service.ts:309` ; `billing-journal.ts:67,89` | « Revenus » = montant facturé **TTC** (taxe comprise, facture impayée comptée comme revenu) | Écrire le HT (`subtotalBeforeTax`) au journal + taxe en axe distinct ; renommer la carte « Facturé » ou afficher l'encaissé | M |
| **TAX-01** | both (surtout cayard) | 🔴 critique | mauvaise province | `lib/invoice-template/tokens.ts:112` ; `invoice-pdf.ts:26` | `provinceToTaxRegime(null) → "HST"` et les clients Cayard ont `billingProvince=null` → **PDF facture QC affiche « TVH 13 % »** | Propager le `mode` taxe du cabinet dans `PresentedInvoice` et faire dériver le libellé PDF de ce mode (pas de `client.billingProvince`) ; à défaut, seeder `billingProvince` + changer le défaut | M |
| **T5 / ENG-4** | both | 🟠 majeur | rapprochement-3voies | `lib/services/fideicommis/reconciliation-service.ts:28-34` ; `trust-transaction-service.ts:223` | La 3ᵉ voie est un `_sum` agrégé : un dossier à −200 $ masqué par un autre à +200 $ passe la certification. Garde-fou retrait applicatif et hors transaction (TOCTOU) | Contrôler **chaque** `TrustAccount.currentBalance ≥ 0` avant certification ; déplacer la vérif de retrait dans le `$transaction` avec advisory lock par compte | M |
| **T1 + T3** | cayard | 🟠 majeur | localisation | `components/fideicommis/ReconciliationWorkflow.tsx:191-249,266-380` | Tout le formulaire + résultats + historique du rapprochement en **anglais dur** ; « LFO Interest » (poste ontarien) affiché à Cayard | Étendre `TrustRegulatorCopy` (libellés formulaire) + router par `copy.*` ; « LFO Interest » → `copy.foundationInterestLabel` (déjà = « Intérêts versés au fonds du Barreau ») | M |
| **L1** | cayard | 🟠 majeur | localisation | `components/fideicommis/LSOReportGenerator.tsx:151-405` | Générateur de rapport fidéicommis : options Monthly/Quarterly/Annual, en-têtes de table, soldes, tout en anglais dur | Router par `useTranslations("fideicommis")` ou champs `copy.*` ; options → Mensuel/Trimestriel/Annuel côté QC | M |
| **L2 + L3** | cayard | 🟠 majeur | localisation | `components/conformite/ComplianceDashboard.tsx:92-276` ; `app/api/conformite/route.ts:92-120` | Corps du tableau de conformité + libellés d'anomalies renvoyés en anglais dur par l'API | Côté API : renvoyer des `id` stables, pas des `label` anglais ; côté UI : traduire via i18n | M |
| **DASH-03 + TAX-03** | derisier | 🟠 majeur | mauvaise province | `components/rapports/RapportTaxesSection.tsx:23,33` ; `app/(app)/facturation/taxes/page.tsx:64,94-100` | Écrans Rapports→Taxes et Facturation→« TPS/TVQ à remettre » figés en libellés QC → faux pour Dérisier (HST tout sous « TPS », « TVQ » = 0) | Brancher sur le mode taxe du cabinet (`describeTaxConfig`/`toDisplayTaxes`) : 1 carte « TVH » en mode `hst`, 2 cartes TPS/TVQ en `tps_tvq` | M |
| **TAX-02** | both | 🟠 majeur | mauvaise province | `app/(app)/facturation/nouvelle/CreateInvoiceView.tsx:317` | L'aperçu de l'éditeur dérive le régime de `client.billingProvince` (défaut QC), pas de la config taxe du **cabinet** → aperçu peut diverger de la facture émise | Utiliser le mode taxe du cabinet comme régime principal ; province du client seulement pour le lieu de fourniture | S |
| **DASH-04** | both | 🟠 majeur | taxe-dans-revenu | `lib/rapports/load.ts:171,388` ; `RapportAnnuelImpotsSection.tsx:29` | « Revenus facturés (total) » dans le rapport d'impôts = **TTC**, au-dessus des lignes de taxe → risque de double comptage | Afficher « Revenus facturés (HT) » (`Σ subtotalBeforeTax`) ou marquer « (taxes comprises) » + ligne HT | S |
| **L4** | cayard | 🟡 mineur | localisation | `components/dossiers/FintracChecklist.tsx:51-129` | Checklist FINTRAC en anglais dur sur le formulaire dossier (FINTRAC = fédéral, donc juridiction OK, langue fausse) | Router par i18n (FR par défaut), pas de branche province | S |
| **TAX-04** | derisier | 🟡 mineur | langue | `lib/services/billing/invoice-pdf.ts:24` | PDF force `language:"fr"` pour tous, y compris Dérisier ON | Lire la langue depuis `Cabinet.config` ou la langue du client | S |
| **DASH-05** | both | 🟡 mineur | libellé | `lib/rapports/load.ts:361` | « Taxes collectées » calculées sur factures émises non payées (correct en exercice, mais « collectée » trompeur) | Libeller « Taxes facturées (méthode d'exercice) » | S |
| **TAX-05 / ENG-5** | engine | 🟡 mineur | dette | `lib/invoice-template/InvoiceDocument.tsx:70` ; `payment-allocation-service.ts:280` | Taux figés dans les libellés (« 13 % ») ; allocation paiement non journalisée | Dériver le libellé du taux réel (`describeTaxConfig`) ; dériver l'AR des tables sources | S |

---

## 3. Lots de correction (chacun finissable, avec définition de terminé)

### Lot A — Arrêter le commingling et la taxe-dans-revenu (cœur de la recherche)
*Anomalies : DASH-01, ENG-2/DASH-02, DASH-04. Effort : M (1-2 j).*
**Définition de terminé :** sur l'écran comptabilité et les rapports, (1) le fidéicommis n'apparaît plus dans aucun total « cabinet » et a sa propre carte ; (2) le KPI revenu affiche du **HT** (ou est renommé « Facturé ») et la taxe est une ligne distincte ; (3) `npm run build` vert + capture des deux écrans pour Cayard et Dérisier montrant des chiffres séparés.

### Lot B — Facture PDF de Cayard en TPS/TVQ (document client-facing)
*Anomalies : TAX-01, TAX-02, TAX-04. Effort : M.*
**Définition de terminé :** le PDF de facture d'un cabinet QC affiche « TPS 5 % / TVQ 9,975 % » et le bon numéro de taxe, piloté par le **mode du cabinet** (pas `client.billingProvince`) ; l'aperçu de l'éditeur correspond à la facture émise ; un PDF Cayard et un PDF Dérisier générés côte à côte le prouvent. (Rappel règle dure : jamais de n° de Barreau/LSO sur la facture.)

### Lot C — Localisation QC des écrans fidéicommis/conformité (Cayard)
*Anomalies : T1+T3, L1, L2+L3, L4. Effort : M-L.*
**Définition de terminé :** scan live des pages Cayard (rapprochement, rapports fidéicommis, conformité, formulaire dossier) = **zéro chaîne anglaise visible** ; « LFO Interest » remplacé par le libellé fonds du Barreau ; Dérisier inchangé (branche ON garde l'anglais mot pour mot). Parité i18n `fr.json`/`en.json` maintenue.

### Lot D — Écrans taxes province-aware pour Dérisier (ON)
*Anomalies : DASH-03+TAX-03. Effort : M.*
**Définition de terminé :** Rapports→Taxes et Facturation→« à remettre » affichent « TVH / HST » et masquent la ligne TVQ en mode `hst` ; Cayard continue d'afficher TPS/TVQ ; capture des deux.

### Lot E — Durcir le rapprochement à 3 voies par dossier
*Anomalies : T5/ENG-4. Effort : M.*
**Définition de terminé :** la certification est **bloquée** si un `TrustAccount` du cabinet a un solde < 0, avec message explicite ; la vérif de retrait est dans la transaction atomique ; test ajouté. **Pré-requis :** vérifier d'abord les données de prod Dérisier.

### Lot F — Nettoyage / dette
*Anomalies : TAX-05, ENG-5, code mort dashboard. Effort : S.*
**Définition de terminé :** libellés de taux dérivés de la config ; chips de suivi créés pour le code mort `components/dashboard/*` non importé.

---

## 4. Anomalies examinées et écartées (faux positifs)

Pour que vous sachiez ce qui a été regardé et jugé sain :

- **`DashboardView` (tableau de bord vivant)** : **propre.** Le fidéicommis y est une carte santé distincte, jamais sommée aux paiements/créances.
- **`FacturationMainKpis`** : propre (basé sur statuts de facture et taux d'encaissement, pas de fidéicommis ni de taxe dans le « revenu »).
- **`components/dashboard/DashboardKPICards`, `IndicatorsPanel`, etc.** : code mort (le barrel n'est importé nulle part). Non retenus comme anomalies, mais à nettoyer (Lot F).
- **Append-only / immuabilité du journal** : solide. Aucun `UPDATE`/`DELETE`, corrections `#vN`, idempotence par index unique partiel.
- **Taxe fondue dans le revenu au niveau facture** : faux. La taxe est bien isolée (`subtotalBeforeTax`/`taxGst`/`taxQst`/`taxTotal`). Le défaut est en aval (le journal reçoit le TTC), pas dans le modèle facture.
- **Débours mandataire/non-mandataire** : correctement traité (frais gouvernementaux `taxable:false`, ajoutés après taxe).
- **« Taxes à remettre » sur factures émises** : conforme (TPS/TVQ percevable à l'émission, méthode d'exercice). L'anomalie est le libellé (DASH-05), pas le calcul.
- **`InvoiceTemplate` / `InvoiceTemplateClean` (vues HTML)** : propres, gating `hst > 0` piloté par le mode du cabinet. Seul le chemin **PDF** (TAX-01) re-dérive mal via la province.
- **`ImmigrationMandatePDF`, pages marketing, audit/onboarding multi-province, écran console/audits** : « Barreau / LSO » y est volontaire ou neutre. Hors périmètre.

---

## 5. Par où commencer

**Recommandation : Lot A en premier.** C'est le plus fort impact (le commingling est la violation la plus sanctionnée et la plus visible sur le tableau de bord), il touche les **deux** clients, il est finissable en 1-2 jours, et il matérialise directement le sujet de votre recherche. Lot B (PDF Cayard) juste après, car c'est un document qui sort chez le client.

**Première action physique concrète (Lot A, étape 1) :**
> Dans `lib/services/journal/journal-service.ts`, modifier le calcul de `soldeGlobal` (lignes 192-197 et 314) pour exclure les types `DEPOT_FIDEICOMMIS` et `RETRAIT_FIDEICOMMIS`, et exposer un `soldeFideicommis` distinct dans `JournalKpiData`. Puis vérifier sur l'écran comptabilité de Cayard que les 3000 $ de fidéicommis n'apparaissent plus dans le « Solde global ».

**Ce qu'on ne touche pas maintenant :** le passage en partie double (Option B de la recherche). Inutile pour la conformité, lourd, risqué sur les données live de Dérisier.

---

*Audit du 2026-06-10. Les corrections de Cayard sont sans risque (cabinet de démo). Les corrections touchant Dérisier (Lots D, E, et tout ce qui est `both`) doivent être vérifiées contre ses données de production avant déploiement.*
