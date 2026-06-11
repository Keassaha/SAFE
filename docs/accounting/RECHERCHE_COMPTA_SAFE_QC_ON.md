# Recherche compta enrichie — SAFE (Québec + Ontario), ancrée dans le code réel

> **Avertissement.** Ce document est une analyse fonctionnelle pour la conception logicielle. Il ne constitue pas un avis juridique ou comptable. Chaque cabinet doit valider ses obligations auprès du Barreau du Québec, du Law Society of Ontario, d'un CPA et, le cas échéant, de Revenu Québec et de l'ARC.
>
> **Statut.** Version enrichie du document de référence interne, corrigée par un fact-check sur sources primaires (juin 2026) et croisée avec l'état réel du moteur comptable de SAFE (audit de code, même date). Les sections « Dans SAFE » indiquent ce qui est câblé, ce qui manque, et les anomalies confirmées (référencées `[CODE]`, voir `AUDIT_ANOMALIES_INTERFACES_CAYARD_DERISIER.md`).

---

## 0. Ce qui a changé par rapport au document de référence

Le fact-check a confirmé l'essentiel du document d'origine, mais a corrigé quatre points à intégrer impérativement, parce qu'ils sont déjà câblés (ou à câbler) dans SAFE.

| Sujet | Ce que disait le document d'origine | Correction vérifiée 2026 | Source |
|---|---|---|---|
| Délai de rapprochement QC | « Mensuel » (laissait penser à un délai comparable à l'Ontario) | Le Québec n'impose **aucun délai chiffré en jours**. L'obligation est de tenir les livres « à jour » et de produire un rapprochement mensuel. Le « 25 jours » est **propre à l'Ontario** (By-Law 9, art. 22(2)). | Barreau QC, FAQ comptabilité ; LSO By-Law 9 |
| Déclaration T3 (comptes particuliers) | Seuil de 50 000 $ | Seuil à jour : **250 000 $** (actifs en argent seulement) pour exempter un compte particulier. Le compte **général** (F2) est exempté de T3. Schedule 15 non exigée pour les exercices se terminant le ou après le 31 déc. 2025. | ARC, T3 Trust Guide ; avis Barreau |
| Intérêts du fidéicommis QC | « Crédités à la Fondation du Barreau » | Versés au **Fonds d'études juridiques du Barreau** (RLRQ c. B-1, r. 10). Depuis une modification à la Loi sur le Barreau, jusqu'à **50 %** des revenus tirés des sommes en fidéicommis peuvent financer l'aide juridique. | RLRQ c. B-1, r. 10 ; communiqué Barreau |
| Titre du règlement QC | Correct, mais à figer | « Règlement sur la comptabilité et les normes d'exercice professionnel des avocats », **RLRQ c. B-1, r. 5**. Remplace l'ancien « Règlement sur la comptabilité et les comptes en fidéicommis » (RRQ 1981, c. B-1, r. 3). | LégisQuébec / CanLII |

Deux précisions opérationnelles à exploiter dans le produit :

- **Ontario, délai de dépôt** : les espèces, chèques et bordereaux de carte de crédit sont réputés détenus en fidéicommis dès réception et doivent être déposés **au plus tard le jour ouvrable bancaire suivant** (By-Law 9, art. 1(3)). C'est un déclencheur d'alerte concret côté Derisier.
- **Production électronique obligatoire** : depuis les périodes commençant le ou après le 1ᵉʳ janvier 2024, l'ancien seuil de 1,5 M$ ne s'applique plus. **Tout inscrit TPS/TVH doit produire par voie électronique.** Le papier n'est plus permis pour un cabinet inscrit.

---

## 1. Résumé exécutif

Un cabinet d'avocats canadien tient simultanément deux comptabilités strictement séparées : une comptabilité **d'administration** (générale) et une comptabilité **en fidéicommis**. Il produit un rapprochement mensuel à trois voies du fidéicommis et applique des règles précises de perception et de remise des taxes.

Le risque principal d'un logiciel généraliste est de **mélanger dans un seul flux** les factures émises, les encaissements, le solde bancaire réel et les fonds en fidéicommis. Ce mélange produit des chiffres faux et expose l'avocat à des infractions graves, jusqu'à la suspension du permis.

**Où en est SAFE (vérifié dans le code).** Le socle est solide :

- chaque événement économique est **journalisé en append-only** avec idempotence (index unique partiel `(cabinetId, sourceModule, sourceId)`), lock par cabinet, et corrections par nouvelles écritures versionnées `#vN`. Aucun `UPDATE`/`DELETE` sur le journal ni sur `TrustTransaction`.
- le fidéicommis a son propre modèle (`TrustAccount` par client/dossier + `TrustTransaction`), son rapprochement et sa certification.
- la taxe est correctement **isolée au niveau de la facture** (`subtotalBeforeTax`, `taxGst`, `taxQst`, `taxTotal`), jamais fondue dans le sous-total.

Mais le moteur central est un **registre mono-axe** : `JournalGeneralEntry` tient un seul `solde` cumulé (`montantEntree`/`montantSortie`), sans partie double ni plan comptable. Trois conséquences réelles, toutes confirmées par l'audit :

1. le `solde` global additionne créances facturées, encaissements **et fidéicommis** dans un seul chiffre. La carte « Solde global » de l'écran comptabilité affiche donc de l'argent client comme s'il était au cabinet (`[DASH-01]` / `[ENG-1]`, commingling d'affichage, **critique**).
2. le KPI « Revenus » dérive du **montant facturé TTC** (taxe comprise, créance non encaissée), ce qui compte une facture impayée comme revenu et pollue le revenu par la taxe (`[DASH-02]` / `[ENG-2]`, **critique**).
3. faute d'axe distinct, la même valeur entre deux fois dans le cumul (à la facture, puis au paiement), donc le `soldeGlobal` double-compte le revenu (`[ENG-3]`).

Conclusion : SAFE est conforme là où le Barreau l'exige réellement (fidéicommis, traçabilité), mais **certains tableaux de bord présentent le `solde` mono-axe comme un chiffre financier**, ce qui crée les anomalies visibles dans les deux interfaces. La correction prioritaire n'est pas de réécrire le moteur, c'est de **cesser d'afficher des agrégats trompeurs** et de séparer le fidéicommis du reste à l'écran.

**Les quatre registres à garder distincts** (vrai dans la doctrine, partiellement vrai dans SAFE) :

1. Grand livre d'administration (revenus, dépenses, créances).
2. Journal de caisse d'administration (flux de trésorerie réels).
3. Registre fidéicommis (journal + carte-client par dossier).
4. Journal d'audit immuable (append-only).

---

## 2. Obligations comptables : Québec vs Ontario (corrigé)

| Dimension | Québec | Ontario |
|---|---|---|
| Texte de référence | Règlement sur la comptabilité et les normes d'exercice professionnel des avocats, **RLRQ c. B-1, r. 5** | **By-Law 9** — Financial Transactions and Records (LSO) |
| Régulateur | Barreau du Québec | Law Society of Ontario (LSO) |
| Compta d'administration | Oui — journal de caisse recettes-déboursés (art. 34) | Oui — books of original entry (s. 18, par. 5-6) |
| Compte fidéicommis requis si | Avances d'honoraires, débours reçus d'avance, sommes pour le compte du client | Argent reçu in trust avant services rendus, acomptes, fonds client (s. 7) |
| Type de compte | Compte **général F2** obligatoire + compte particulier F3 optionnel | Mixed trust account + specific trust account |
| Journaux fidéicommis | Journal caisse fidéicommis (art. 38) + registre cartes-clients (art. 39, 66) + rapports comptables mensuels (art. 40-41) + autres biens (art. 43) | Books of original entry (receipts + disbursements) + clients' trust ledger + transfers record + comparaison mensuelle + réconciliation détaillée (s. 18) |
| Rapprochement à 3 voies | Oui : journal ↔ carte-client ↔ relevé bancaire | Oui : relevé bancaire ↔ clients' trust ledger ↔ comparaison des totaux (s. 18, par. 8 : liste **client par client** exigée) |
| **Délai du rapprochement** | **Mensuel, sans délai chiffré confirmé** (livres « à jour »). Ne pas afficher « 25 jours » côté QC. | **Au plus tard 25 jours** après la fin du mois (art. 22(2)) |
| Conservation | **7 ans** après fermeture du dossier ; rapports comptables mensuels + copies de chèques fidéicommis : **7 ans après la fin de l'exercice** | **6 ans** (registres généraux, art. 23(1)) ; **10 ans** pour les registres liés au fidéicommis et comparaisons mensuelles (art. 23(2)(3)) |
| Délai de dépôt | (déposer sans délai indu) | **Au plus tard le jour ouvrable bancaire suivant** (art. 1(3)) |
| Déclaration d'ouverture | Formulaire d'ouverture **compte général F2** au Barreau + formation en ligne dans les 6 mois | Déclaration via LSO Connects |
| Limite espèces / mandat | **7 500 $** ; déclaration au Barreau dans les 30 jours (art. 71) | 7 500 $ (s. 4) |
| Intérêts du fidéicommis | **Fonds d'études juridiques du Barreau** (B-1, r. 10) ; jusqu'à 50 % vers l'aide juridique | **Law Foundation of Ontario** (s. 57, Law Society Act) |
| Rapport annuel | Rapport Annuel sur la Pratique (RAP) | Annual Report (LSO Connects) |
| Nouveautés 2026 | Rien de majeur signalé | **By-Law 8 — Enhanced Reporting**, échéance du 31 mars 2026 : déclaration d'un **plan de contingence client** (succession de pratique) |

### 2.1 Taxes de vente (2026)

| Juridiction | Taxe | Taux | Administration |
|---|---|---|---|
| Québec | TPS + TVQ | 5 % + 9,975 % (TVQ calculée hors TPS) | ARC (TPS) + Revenu Québec (TVQ) |
| Ontario | TVH (HST) | 13 % (5 % féd. + 8 % prov.) | ARC |
| Inscription obligatoire | — | dès **30 000 $** de fournitures taxables (trimestre ou 4 trimestres glissants) | — |
| Production | — | **électronique obligatoire** depuis 2024 | — |

**Débours et taxe (règle ARC P-209R, mandataire vs non-mandataire).**

- Débours engagé **à titre de mandataire** du client (droits gouvernementaux, frais de greffe, IRCC) : le remboursement **n'est pas taxable** (simple remboursement). Il passe « après » la taxe, intégralement.
- Débours engagé **autrement qu'à titre de mandataire** (l'avocat achète en son nom puis refacture) : le remboursement **est taxable** comme une fourniture.
- *Dans SAFE* : correctement modélisé. Les frais gouvernementaux sont seedés `taxable: false` + `isGovernment`, et les calculs ajoutent les lignes non taxables **après** les taxes. L'assiette taxable exclut bien les débours mandataires. Aucune anomalie sur ce point.

---

## 3. Définitions, et leur traduction dans SAFE

| Concept | Définition | Dans SAFE |
|---|---|---|
| Comptabilité de caisse | Revenus/dépenses reconnus quand le cash bouge | Le type `PAIEMENT` capte le cash réel (`totalEncaisse`). Fiable. |
| Comptabilité d'exercice | Revenus reconnus quand gagnés, dépenses quand engagées | Le type `FACTURE` capte le facturé. La TPS/TVQ devient percevable à l'émission (méthode d'exercice), ce qui est la convention par défaut correcte au Canada. |
| Compta opérationnelle simplifiée | Hybride : exercice pour le revenu, trésorerie suivie en parallèle | Approche de fait de SAFE. **Mais les deux flux partagent le même `solde`** au lieu d'être tenus distincts (`[ENG-1]`/`[ENG-3]`). |
| Journal d'audit (append-only) | Enregistrement immuable ; corrections par nouvelle écriture | **Implémenté correctement.** Append-only, idempotent, corrections `#vN`, aucun `UPDATE`/`DELETE`. |
| Grand livre | Agrégation par compte (revenus, AR, dépenses, fidéicommis…) | **Absent au sens PCGR.** Pas de plan comptable ni de comptes. Le `JournalGeneralEntry` est un registre de trésorerie mono-axe, pas un grand livre. |
| Registre fidéicommis | Journal + carte-client par dossier ; total = Σ cartes-clients | `TrustAccount` (par client/dossier) + `TrustTransaction`. Présent. **Mais la certification du rapprochement ne contrôle que l'agrégat**, pas chaque carte (`[T5]`/`[ENG-4]`). |
| Rapprochement bancaire | Solde livre vs relevé banque, écarts expliqués | Module mensuel présent côté fidéicommis. |
| Rapprochement à 3 voies | Journal ↔ ledger par client ↔ relevé bancaire, 3 totaux égaux | Présent, mais voir `[T5]`/`[ENG-4]` : la 3ᵉ voie est un `_sum` agrégé qui peut masquer un solde-client négatif. |

---

## 4. Tableau maître : événement → traitement → implémentation SAFE

Colonnes : effet sur le **Cash**, le **Revenu**, les **comptes à recevoir (AR)**, le **Fidéicommis**. La colonne « Dans SAFE » donne le helper/table réels et l'état (✅ câblé, ⚠️ câblé mais imparfait, ❌ manquant).

| # | Événement | Cash | Revenu | AR | Fidéic. | Dans SAFE (helper · table · état) |
|---|---|:--:|:--:|:--:|:--:|---|
| 1 | Facture émise (honoraires + taxes) | — | + | + | — | `writeJournalForIssuedInvoice` → `JournalGeneralEntry` type `FACTURE`. ⚠️ **écrit le TTC** en `montantEntree` (taxe comprise) et l'agrège comme « revenu » `[ENG-2]`. Devrait écrire le HT + une ligne taxe distincte. |
| 2 | Revenu gagné non facturé (WIP) | — | + | — | — | ❌ Pas de constatation WIP au journal (temps non facturé suivi ailleurs). |
| 3 | Paiement reçu (compte général) | + | — | − | — | `writeJournalForPayment` → type `PAIEMENT`, `montantEntree = montant`. ✅ capte le cash. |
| 4 | Allocation paiement → facture | — | — | − | — | Table `PaymentAllocation` + `recalculateInvoiceTotals`. ⚠️ **non journalisée** `[ENG-5]` : l'AR se dérive des tables sources (`Invoice.balanceDue`), pas du journal. |
| 5 | Dépôt fidéicommis reçu | — | — | — | + | `createTrustDeposit` → `TrustTransaction` **et** `JournalGeneralEntry` type `DEPOT_FIDEICOMMIS`. ⚠️ alimente le `solde` cumulé du cabinet `[DASH-01]`. |
| 6 | Transfert fidéicommis → général (honoraires gagnés) | + | — | − | − | Retrait fidéicommis + paiement. ✅ possible, sous réserve facture émise. |
| 7 | Dépense cabinet payée | − | — | — | — | `writeJournalForCabinetExpense` → type `DEPENSE`. ✅ |
| 8 | Débours payé par le cabinet (non refacturable) | − | — | — | — | `writeJournalForDeboursPaiement` (si `payeParCabinet`) → type `DEBOURS`. ✅ |
| 9 | Débours refacturable payé par le cabinet | − | — | — | — | Idem #8 ; refacturation gérée à la facture. ✅ |
| 10 | Débours refacturé au client (sur facture) | — | + | + | — | Ligne de facture `debours_non_taxable` / `taxable=false` ajoutée **après** taxe. ✅ correct (règle mandataire). |
| 11 | Taxes perçues sur facture | — | — | — | — | `taxGst`/`taxQst`/`taxTotal` au niveau `Invoice`. ✅ isolées **à la facture**, ❌ jamais portées en passif distinct au journal `[ENG-2]`. |
| 12 | Remise des taxes (TPS/TVQ/HST) | − | — | — | — | Écran « à remettre » estimatif (`tax-remittance`). ⚠️ libellé QC figé `[TAX-03]`. |
| 13 | Note de crédit émise | — | − | − | — | Module notes-de-crédit présent. |
| 14 | Remboursement au client (cash) | − | — | ± | — | Paiement sortant. |
| 15 | Remboursement fidéicommis au client | − | — | — | − | `createTrustWithdrawal` → type `RETRAIT_FIDEICOMMIS`. ✅ |
| 16 | Correction comptable (append-only) | * | * | * | * | `applyCabinetExpenseCorrection` / `applyDeboursDossierCorrection` → écritures `CORRECTION` versionnées `#vN`. ✅ solide. |
| 17 | Dépôt bancaire (regroupement de chèques) | + | — | — | — | Géré au niveau paiement. |
| 18 | Paiement partiel | + | — | − partiel | — | `PaymentAllocation` (`allocatedAmount`). ✅ |

**Champs taxe exacts (référence développeur).** `Invoice.subtotalBeforeTax`, `taxGst`, `taxQst`, `taxTotal`, `tps`, `tvq` ; `InvoiceLine.gstAmount`, `qstAmount`, `lineSubtotal`, `lineTotal`. Stockage « Option A » sans migration : en mode `hst`, **toute** la TVH est portée dans `taxGst` (colonne TPS) et `taxQst = 0`. Invariant maintenu : `taxGst + taxQst === taxTotal`. **Conséquence à connaître** : tout écran qui lit `taxGst`/`taxQst` bruts et les étiquette « TPS »/« TVQ » est faux pour un cabinet HST (`[DASH-03]`, `[TAX-03]`).

---

## 5. Journaux et registres obligatoires, mappés sur SAFE

**Québec (B-1, r. 5).**
- Journal de caisse recettes-déboursés d'administration (art. 34) → couvert par le journal général (types `PAIEMENT`/`DEPENSE`/`DEBOURS`), mono-axe.
- Journal de caisse fidéicommis (art. 38) → `TrustTransaction` + journal type `DEPOT/RETRAIT_FIDEICOMMIS`.
- Registre des cartes-clients (art. 39, 66) → `TrustAccount` par client/dossier.
- Registre des rapports comptables mensuels (art. 40-41) → module rapprochement + certification.
- Registre des autres biens en fidéicommis (art. 43) → ❌ non couvert (biens non monétaires).

**Ontario (s. 18 By-Law 9).** Books of original entry (trust + general, receipts + disbursements), clients' trust ledger, transfers record, fees book, et la **comparaison mensuelle client par client** (par. 8). La liste détaillée par client est exigée : un total global ne suffit pas. C'est exactement le point faible `[T5]`/`[ENG-4]`.

---

## 6. Rapports et KPIs

### 6.1 KPIs fiables (et leur vraie source dans SAFE)

| KPI | Définition | Source SAFE fiable |
|---|---|---|
| Revenus facturés (HT) | Σ sous-total hors taxes des factures émises | `Σ Invoice.subtotalBeforeTax` (à utiliser, pas `montantTotal`) |
| Encaissements | Σ paiements alloués | type `PAIEMENT` (`totalEncaisse`), ou `Σ PaymentAllocation.allocatedAmount` |
| AR total | Σ soldes impayés | `Σ Invoice.balanceDue` (tables sources, pas le journal) |
| Aging > 30/60/90 j | Créances segmentées par âge | `creances-aging` (présent) |
| Solde fidéicommis (par dossier) | Solde de chaque carte-client | `getTrustBalance` / `TrustAccount.currentBalance` (par compte, jamais agrégé pour la conformité) |
| Taxes facturées / à remettre | Σ `taxTotal` par période, par mode | à libeller selon le mode du cabinet (TPS/TVQ vs TVH) |
| Dépenses | Σ dépenses confirmées | type `DEPENSE` |
| Rapprochement 3 voies | Banque = Σ cartes-clients = registre, **par dossier** | module rapprochement (à durcir, `[T5]`) |
| Journal des corrections | Écritures `CORRECTION` | `JournalGeneralEntry` type `CORRECTION` |

### 6.2 KPIs à éviter ou renommer (anomalies confirmées dans SAFE)

| KPI problématique | Pourquoi | Dans SAFE |
|---|---|---|
| « Solde global » incluant le fidéicommis | Le fidéicommis n'appartient pas au cabinet | **`[DASH-01]` critique.** À exclure le fidéicommis du `solde`, ou afficher un solde fidéicommis distinct (comme le fait déjà `DashboardView`). |
| « Revenu » = facturé TTC | Compte la facture impayée comme revenu **et** inclut la taxe | **`[DASH-02]`/`[ENG-2]` critique.** Baser sur le HT, isoler la taxe, ou renommer « Facturé ». |
| « Solde » = somme de factures + encaissements | Double-compte le même revenu | **`[ENG-3]`.** Le `soldeGlobal` mono-axe n'est pas exploitable comme chiffre financier. |
| « Revenus facturés (total) » dans le rapport d'impôts | Laisse croire à un total HT alors qu'il inclut la taxe | **`[DASH-04]`.** Afficher « Revenus facturés (HT) » + ligne taxe. |
| « Taxes collectées » sur factures non payées | « Collectée » suggère « encaissée » | **`[DASH-05]` (mineur).** Libeller « Taxes facturées (méthode d'exercice) ». |

---

## 7. L'écart structurel mono-axe, et les deux options

**Le fait.** `JournalGeneralEntry` n'a ni débit/crédit, ni compte, ni plan comptable. Un seul `solde` cumulé absorbe créances, encaissements et fidéicommis. SAFE **ne peut donc pas produire un bilan ni un état des résultats PCGR**, et la règle « Σ débits = Σ crédits » n'est pas modélisée. Ce n'est pas un bug, c'est un choix de design.

**Pourquoi ce n'est pas (en soi) un problème de conformité.** Le Barreau n'exige pas d'états financiers PCGR dans SAFE. Il exige le fidéicommis et la traçabilité, qui sont là. Les états PCGR sont produits par le CPA externe à partir des exports.

**Le vrai problème est l'affichage**, pas le moteur : SAFE présente le `solde` mono-axe comme un chiffre financier. C'est ce qui crée `[DASH-01]`, `[DASH-02]`, `[ENG-1]`, `[ENG-3]`.

| | Option A — rester journal + fidéicommis | Option B — vrai grand livre partie double |
|---|---|---|
| Effort | Faible (semaines) | Lourd (chantier de migration) |
| Conformité Barreau | Déjà atteinte | Déjà atteinte (pas un gain) |
| Ce qu'on corrige | On **arrête d'afficher** les agrégats trompeurs ; on sépare le fidéicommis à l'écran ; on dérive l'AR/le revenu HT des tables sources | On produit bilan/résultat PCGR nativement |
| Risque | Faible, localisé | Élevé (réécriture du cœur comptable, données live de Derisier) |
| Message commercial | « journal conforme + export vers votre comptable » | « comptabilité complète » (aujourd'hui faux) |

**Recommandation pour un solo QC (Cayard) et un solo ON (Derisier).** Option A. Le besoin réel n'est pas un grand livre PCGR (le CPA s'en charge), c'est un journal fiable, un fidéicommis irréprochable, et des chiffres d'écran qui ne mentent pas. Concrètement : (1) sortir le fidéicommis de tout agrégat « cabinet » ; (2) afficher le revenu en HT et la taxe en passif distinct ; (3) durcir le rapprochement à 3 voies par dossier ; (4) finir la localisation par province. C'est exactement le plan de correction du document jumeau. Ne pas vendre « remplace le comptable » avec la structure actuelle.

---

## 8. Risques de conformité (QC + ON)

| Risque | Province | Conséquence | État SAFE |
|---|---|---|---|
| Affichage mélangeant fidéicommis et cash du cabinet | QC + ON | Apparence de commingling, signal d'inspection | **Présent à l'écran** `[DASH-01]` — à corriger en priorité |
| Solde-client fidéicommis négatif non bloqué | QC + ON | Empiètement (misappropriation) | Garde-fou **applicatif seulement**, hors transaction, contrôle agrégé `[ENG-4]`/`[T5]` |
| Taxe comptée dans le revenu | QC + ON | Revenu surévalué, risque de double comptage en déclaration | `[DASH-02]`/`[DASH-04]`/`[ENG-2]` |
| Mauvais régime de taxe affiché | QC (PDF Cayard) / ON (écrans Derisier) | Document client erroné | `[TAX-01]` (PDF QC en TVH), `[TAX-03]`/`[DASH-03]` (écrans ON en TPS/TVQ) |
| Journal d'audit non immuable | QC + ON | Non-conformité | **Maîtrisé** (append-only, `#vN`) |
| Conservation insuffisante | QC (7 ans) / ON (6-10 ans) | Sanction à l'inspection | Politique de rétention à rendre configurable par province |
| Plan de contingence absent | ON | Obligation déclarative depuis le 31 mars 2026 (By-Law 8) | Section à prévoir côté Derisier |
| T3 manquante (comptes particuliers) | fédéral | Infraction LIR | Alerte à prévoir, seuil **250 000 $** |

---

## 9. Sources officielles (fact-check juin 2026)

- Barreau du Québec — Comptabilité, fidéicommis et facturation : https://www.barreau.qc.ca/fr/membres-ordre/obligations-membres/comptabilite-fideicommis-facturation/
- Barreau du Québec — FAQ comptabilité et fidéicommis : https://www.barreau.qc.ca/fr/membres-ordre/obligations-membres/comptabilite-fideicommis-facturation/comptabilite-fideicommis-faq/
- Barreau du Québec — Déclaration obligatoire des sommes reçues en espèces (art. 71) : https://www.barreau.qc.ca/fr/nouvelle/avis-aux-membres/
- Règlement RLRQ c. B-1, r. 5 (LégisQuébec / CanLII) : https://www.canlii.org/fr/qc/legis/regl/rlrq-c-b-1-r-5/derniere/rlrq-c-b-1-r-5.html
- Règlement sur le Fonds d'études juridiques, RLRQ c. B-1, r. 10 : https://www.canlii.org/fr/qc/legis/regl/rlrq-c-b-1-r-10/derniere/rlrq-c-b-1-r-10.html
- Law Society of Ontario — By-Law 9 (art. 1(3), 18 par. 8, 22(2), 23) : https://lso.ca/about-lso/legislation-rules/by-laws/by-law-9
- Law Society of Ontario — By-Law 8 / Mandatory Succession Planning (2026) : https://lso.ca/about-lso/initiatives/mandatory-succession-planning
- ARC — T3 Trust Guide (seuil 250 000 $, Schedule 15) : https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4013/t3-trust-guide.html
- ARC — Enhanced reporting rules for trusts : https://www.canada.ca/en/revenue-agency/services/tax/trust-administrators/t3-return/enhanced-reporting-rules-trusts-bare-trusts-faq.html
- ARC — P-209R, Lawyers' disbursements (mandataire vs non-mandataire) : https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/p-209r/lawyers-disbursements.html
- ARC — Charge and collect the GST/HST (taux) : https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html
- ARC — Reporting requirements and deadlines (production électronique 2024) : https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/file-gst-hst-return/reporting-requirements-deadlines.html
- Revenu Québec — Tables des taux TPS/TVQ : https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/
- Revenu Québec — Inscription TPS/TVQ (seuil 30 000 $) : https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/inscription-aux-fichiers-de-la-tps-et-de-la-tvq/

### Zones encore à valider sur le texte officiel (marquées INCERTAIN)

- Titre exact et numéro courant du formulaire d'ouverture du compte général F2 au Québec (certitude : probable).
- Confirmation que le seuil T3 de 250 000 $ s'applique tel quel à l'exercice 2026 d'un compte particulier d'avocat (probable ; à confirmer avec le CPA du cabinet).
- Contenu exact exigé du plan de contingence By-Law 8 (probable).

---

*Document généré le 2026-06-10. À relire avec le CPA du cabinet avant toute décision de déclaration fiscale. Voir le plan de correction : `AUDIT_ANOMALIES_INTERFACES_CAYARD_DERISIER.md`.*
