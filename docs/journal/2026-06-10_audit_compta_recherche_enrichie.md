# 2026-06-10 — Audit compta des 2 interfaces clients + recherche enrichie

## Contexte
Le CEO a fourni une recherche compta cabinets d'avocats (QC/ON) et demandé : (1) une version
enrichie pour gérer efficacement la compta dans SAFE, (2) corriger les anomalies apparentes dans
les interfaces des deux clients (Cayard QC, Dérisier ON).

## Buildé
- `docs/accounting/RECHERCHE_COMPTA_SAFE_QC_ON.md` — recherche enrichie, ancrée dans le code réel
  (mapping événement → helper/table SAFE), corrigée par fact-check sur sources primaires.
- `docs/accounting/AUDIT_ANOMALIES_INTERFACES_CAYARD_DERISIER.md` — 14 anomalies confirmées,
  priorisées, regroupées en 6 lots finissables avec définition de terminé.

## Méthode
Audit multi-agents (workflow) sur 5 dimensions : fidéicommis, KPIs/dashboards, taxes,
localisation province, moteur/data-model. Chaque anomalie vérifiée fichier:ligne + vérif
adversariale sceptique. Fact-check réglementaire web (19 faits, sources primaires).
**Incident** : panne API transitoire (FailedToOpenSocket/ConnectionRefused) en fin de 1er run
a tué les vérificateurs et les rédacteurs de docs. 2e run de récupération (sans schema, pour
contourner le mode d'échec « StructuredOutput non appelé ») a tout récupéré. Docs rédigés à la
main en main loop pour contrôle qualité. Leçon workflow : pour des findings, préférer une sortie
markdown sans schema, plus robuste qu'un schema strict quand l'API est instable.

## Observé / corrigé (corrections au document de référence du CEO)
- **T3** : seuil d'exemption des comptes particuliers = **250 000 $**, pas 50 000 $ (chiffre périmé).
- **QC sans délai de 25 jours** : le « 25 jours » est strictement ontarien (By-Law 9 art. 22(2)).
  Le QC = « mensuel, livres à jour », sans jour-compte. L'app garde déjà ça correctement.
- **Intérêts fidéicommis QC** → **Fonds d'études juridiques** (B-1, r. 10), jusqu'à 50 % vers
  l'aide juridique. Plus précis que « Fondation du Barreau ».
- ON : dépôt fidéicommis au plus tard le **jour ouvrable bancaire suivant** (art. 1(3)).
- Production électronique TPS/TVH obligatoire depuis 2024 (seuil 1,5 M$ supprimé).

## Anomalies notables confirmées dans le code
- **Commingling (critique)** : `journal-service.ts:47` cumule un seul `solde` sur TOUS les types,
  fidéicommis inclus. La carte « Solde global » affiche les 3000 $ de fidéicommis de Cayard comme
  solde du cabinet. + double-compte facture (TTC) et paiement.
- **Revenu = facturé TTC (critique)** : `totalRevenus` dérive du montant facturé taxe comprise.
- **PDF facture Cayard en TVH (critique)** : `tokens.ts:112` `provinceToTaxRegime(null) → "HST"` et
  les clients Cayard sont seedés sans `billingProvince`. Facture QC sort avec libellés ontariens.
- **Rapprochement 3 voies agrégé (majeur)** : `reconciliation-service.ts:28-34` ne contrôle que le
  `_sum` global, un dossier négatif est masqué. Garde-fou retrait applicatif et hors transaction.
- **Localisation Cayard (majeur)** : ReconciliationWorkflow, LSOReportGenerator, ComplianceDashboard
  + `/api/conformite` renvoient de l'anglais codé en dur. « LFO Interest » (poste ontarien) chez Cayard.
- **Écrans taxes Dérisier (majeur)** : Rapports→Taxes et « TPS/TVQ à remettre » figés en libellés QC,
  faux pour un cabinet HST.

## Décidé
- **Reco Option A** (rester journal + fidéicommis, ne pas passer en partie double). Le besoin réel
  n'est pas un grand livre PCGR (le CPA s'en charge), c'est d'arrêter d'afficher des agrégats qui
  mentent. Ne JAMAIS vendre « remplace le comptable » avec la structure actuelle.
- **Commencer par le Lot A** (sortir le fidéicommis des totaux + revenu en HT). 1ʳᵉ action :
  modifier `soldeGlobal` dans `journal-service.ts` pour exclure les types fidéicommis.
- **Aucun code touché** ce tour : diagnostic d'abord, le CEO choisit le lot.

## Graine de contenu (build-in-public, customer-centric)
Angle fort : « On a audité notre propre logiciel contre le règlement du Barreau, et on a trouvé que
notre tableau de bord affichait l'argent en fidéicommis dans le solde du cabinet. C'est exactement
la violation la plus sanctionnée. On l'a attrapée et corrigée. Voilà pourquoi un logiciel pensé pour
les avocats ne se configure pas comme un QuickBooks. » Le héros = l'avocate qui dort tranquille
parce que ses chiffres d'écran ne mélangent jamais son argent et celui du client.
→ à déposer dans content-bank quand la structure existera.

## Vérifié
- Province réelle des 2 clients confirmée dans les seeds : Cayard = QC (TPS/TVQ, Barreau),
  Dérisier = ON (HST, LSO). La branche « défaut ON » n'est donc PAS un bug pour Dérisier.
- 2 claims critiques (commingling, PDF TVH) spot-vérifiés directement dans le code avant de les
  écrire dans un doc permanent.

## Lot A — LIVRÉ (couche affichage, zéro changement aux écritures stockées)
- **DASH-01 commingling corrigé** : `journal-service.ts` calcule désormais `soldeGlobal` HORS
  fidéicommis (agrégat des types non fiduciaires) et expose `soldeFideicommis` distinct. Helper
  `round2` + constante `TRUST_TX_TYPES` ajoutés. Touche `getJournalEntries` ET `calculateJournalBalance`.
- **DASH-02 / ENG-2 (revenu)** : la carte « Revenus (ce mois) » devient « Facturé (ce mois) » et une
  4ᵉ carte « Fidéicommis (client) » remplace le compteur de transactions, sur l'écran comptabilité/journal.
- **DASH-04 (rapports)** : `lib/rapports/load.ts` calcule `totalInvoicedHT` ; KPI « Revenus facturés »,
  rapport annuel d'impôts et graphe mensuel passent au HT, libellés « (HT) ». Plus de double comptage
  de la taxe dans un rapport d'impôts.
- i18n : clés `kpiOperatingBalance` / `kpiBilledThisMonth` / `kpiTrustBalance` (FR+EN) ; `billedRevenue` /
  `billedRevenueTotal` relibellés « (HT) ». Parité 3166=3166.
- **Vérifié** : 64 tests journal verts · `npm run build` exit 0 (129/129 pages). Aucune migration,
  aucune écriture stockée modifiée → Dérisier (prod) non régressé.
- **Friction infra** : disque à 100 % (ENOSPC) a fait échouer 2 builds ; libéré ~1,8 Go (`.next` + cache npm).
  Le poste reste à ~99 % plein, à surveiller (risque de casser les prochains builds).

## Lot B — TAX-01 LIVRÉ (facture PDF Cayard en TPS/TVQ, Dérisier non touché)
- **Cause racine** : le gabarit PDF re-dérivait le régime de taxe via `provinceToTaxRegime(client.billingProvince)`
  (`tokens.ts:112` → null = « HST »), au lieu du mode de taxe du CABINET. Cayard (clients sans
  `billingProvince`) sortait donc « TVH 13 % » sur une facture québécoise.
- **Fix** : le presenter (`invoice-presenter.ts`) expose désormais `totals.taxRegime` dérivé du
  `taxConfig.mode` du cabinet (helper `resolveTaxRegime`). Le gabarit standard `InvoiceDocument.tsx`
  lit `totals.taxRegime` (plus `client.billingProvince`) et la ligne TVH lit `totals.hst` (corrige un
  2ᵉ bug latent : elle lisait `tps+tvq`). Littéraux `PresentedInvoice` mis à jour (CreateInvoiceView,
  InvoiceAppearanceForm).
- **Sécurité Dérisier** : Cayard = gabarit « standard » (InvoiceDocument) ; Dérisier = gabarit
  « derisier » (DerisierInvoiceDocument), **non modifié**. Branche au `InvoiceDocument.tsx:454`.
  Donc zéro risque sur la facture de production de Dérisier.
- **Vérifié** : 170 tests billing/invoice verts (dont le render Dérisier, 5 tests) · `npm run build` exit 0.
- **Reste du Lot B (reporté, non bloquant)** :
  - **TAX-02** : l'éditeur (`CreateInvoiceView:317`) dérive encore le régime de `client.billingProvince`
    (défaut QC), pas du mode cabinet. Latent : pour les clients QC de Cayard l'aperçu est correct ;
    diverge seulement si un client Cayard a une province de facturation hors-QC. Fix = passer le mode
    taxe du cabinet en prop (CabinetInfo n'a que `config`, pas `modules` → petite plomberie serveur).
  - **TAX-04** : `invoice-pdf.ts:26` force `language:"fr"` pour tous (acceptable pour Dérisier
    franco-ontarien, mais devrait venir de la config).

## Lot C groupe 1 — LIVRÉ (2 écrans fidéicommis localisés QC, Dérisier byte-identique)
- **Écrans** : `ReconciliationWorkflow.tsx` (rapprochement, 31 chaînes) + `LSOReportGenerator.tsx`
  (générateur de rapport, 30 chaînes). Cayard (QC) voit désormais le français ; Dérisier (ON) garde
  l'anglais exact.
- **Mécanisme** : ~60 champs ajoutés à `TrustRegulatorCopy` (`lib/trust/regulator.ts`), type + objet QC
  (FR) + objet ON (= chaîne anglaise d'origine au caractère près). Les composants lisent `copy.<champ>`
  via `getTrustRegulatorCopy(useCabinetProvince())`. « LFO Interest » (poste ontarien) → « Intérêts au
  fonds du Barreau » côté QC. Options Mensuel/Trimestriel/Annuel (les `value=` inchangés).
- **Sécurité Dérisier** : la branche ON de `getTrustRegulatorCopy` reproduit les chaînes d'origine
  (vérifié : minus typographique U+2212, `...`, `$0.00`, wrapping JSX). Règle moteur QC/ON inchangée.
- **Vérifié (indépendamment de l'agent)** : grep = zéro anglais résiduel dans les 2 composants ;
  branche ON porte bien l'anglais, branche QC le français ; `npm run build` exit 0 (« Compiled
  successfully in 25.9s »). Aucun fichier `messages/*.json` touché (parité i18n intacte par construction).
- **Reste du Lot C (groupe 2, reporté — DÉCISION REQUISE)** : `ComplianceDashboard.tsx` (L2),
  `app/api/conformite/route.ts` (L3, libellés anglais renvoyés par le serveur), `FintracChecklist.tsx`
  (L4). Subtilité : ces écrans sont pilotés par la LOCALE (`useTranslations`/cookie NEXT_LOCALE,
  défaut « fr »), pas par la province. Donc localiser via i18n fait suivre la langue à la locale du
  cabinet, pas à sa province. **Question ouverte : dans quelle locale tourne Dérisier (ON) ?** Si EN →
  i18n OK (Dérisier reste anglais). Si FR (défaut) → Dérisier basculerait en français (acceptable pour
  un franco-ontarien, mais à valider). À trancher avant d'attaquer le groupe 2.

## Refonte des indicateurs du journal (couche LECTURE) — LIVRÉ + revue adversariale
Spec CEO : ne plus mélanger factures / paiements / cash / dépenses / débours / fidéicommis dans les KPI.
- **Fonction pure** `lib/services/journal/kpi.ts` (`computeJournalKpis`) : classe par TYPE, ne lit JAMAIS
  le `solde` cumulé par ligne (robuste à l'antidatage). Constantes TRUST_TX_TYPES / OPERATIONAL_CASH_TYPES.
- **`soldeOperationnelEstime`** = cash réel seulement (PAIEMENT + AJUSTEMENT/CORRECTION − DEPENSE − DEBOURS),
  EXCLUT FACTURE (créance) ET fidéicommis. Fini le double comptage facture+paiement.
- **6 cartes** : Solde opérationnel estimé · Facturé (mois) · **Encaissé (mois)** (nouveau) · Dépenses (mois)
  · **Comptes à recevoir** (Σ Invoice.balanceDue) · Fidéicommis (client).
- **Colonne « Solde » par ligne SUPPRIMÉE** (trompeuse si antidatée ; KPI ne s'en sert plus).
- **Saisie manuelle restreinte** à AJUSTEMENT/CORRECTION (garde serveur `isManualEntryTypeAllowed` +
  select UI filtré + bandeau). Plus de FACTURE/PAIEMENT manuels.
- `calculateJournalBalance` ré-écrit (charge écritures + Σ balanceDue, délègue à la fn pure).
  getJournalEntries ne renvoie plus soldeGlobal. JournalKpiData refondu. i18n +3 clés (fr/en).
- **Append-only intact** : aucune écriture modifiée, billing-journal.ts inchangé, aucune migration.

### Revue adversariale (workflow 4 agents) → 1 BUG RÉEL corrigé
- **R1 (corrigé)** : `CORRECTION` ∈ OPERATIONAL_CASH_TYPES, MAIS `createTrustCorrection` (route API active
  `/api/fideicommis/correction`) émet une `CORRECTION` pour de l'argent CLIENT → fuite dans le solde
  opérationnel du cabinet. **Fix** : trust correction attribuée au sourceModule `FIDEICOMMIS` (au lieu de
  CORRECTION_SYSTEME) ; `computeJournalKpis` route `CORRECTION + FIDEICOMMIS` vers le solde fidéicommis,
  jamais l'opérationnel. Couvert par test de régression. (Corrections cash CORRECTION_SYSTEME et manuelles
  AJUSTEMENT_MANUEL restent opérationnelles — tests dédiés.)
- **Durcissements** : borne mois précédent ancrée au 1er (évite débordement setMonth si dateFrom custom) ;
  `isManualEntryTypeAllowed` extrait + testé (règle Barreau) ; +5 tests KPI (corrections trust/cash,
  dépenses mois précédent, convention sortie−entrée, arrondi 0,1+0,2).
- **Vérifié** : 91 tests journal verts (était 77) · `npm run build` exit 0 (« Compiled successfully 22.1s »).

### Risques résiduels — R2 + R4 CORRIGÉS (demande CEO « tous les correctifs nécessaires »)
- **R4 export — CORRIGÉ** : la colonne « Solde » (cumul par ligne, trompeuse si antidatée) retirée des deux
  exports `exportJournalCsv` ET `exportJournalExcelRows` (`export-journal.ts`). Cohérent avec la suppression UI.
  Plus aucune référence à `e.solde` dans l'export. `JournalEntryRow.solde` conservé (champ DB, inerte).
- **R2 balanceDue négatif — CORRIGÉ** : l'agrégat des comptes à recevoir (`journal-service.ts`) filtre
  désormais `balanceDue: { gt: 0 }` → un surpaiement (crédit client) ne réduit plus l'AR. Correctif localisé
  à la LECTURE (n'altère pas le `balanceDue` stocké, qui garde l'info de crédit pour les remboursements).
- **R3 échelle — VOLONTAIREMENT DIFFÉRÉ (pas un correctif de justesse)** : `calculateJournalBalance` charge
  les écritures en mémoire (nécessaire aux soldes point-dans-le-temps). Re-passer à des agrégats SQL
  réintroduirait un risque de dérive SQL↔fonction pure pour zéro bénéfice à 2 cabinets solo. Déclencheur de
  migration (`groupBy(typeTransaction, sourceModule)`) documenté dans le code (« NOTE D'ÉCHELLE »). À faire
  avant montée en charge, pas avant.
- **Vérifié (R2+R4)** : 91 tests journal verts · `npm run build` exit 0 (« Compiled successfully 27.9s »).

## À confirmer (CEO)
- Lot C groupe 2 (conformité/FINTRAC) : valider d'abord la locale réelle de Dérisier (EN ou FR ?).
- Autre lot (D : taxes Dérisier ON · E : rapprochement par dossier) ou pause ?
- Avant Lot E : vérifier que Dérisier prod n'a pas de soldes-clients négatifs légitimes.
- Espace disque du poste à libérer (99 % plein, a déjà fait échouer des builds).
