# Registre canonique des obligations de conformité

> **Source unique de vérité réglementaire de SAFE.** Décision : ADR-011.
> Statut : **v0.2 validée** (2026-07-02). Validée contre la source fact-checkée primaire
> `docs/accounting/RECHERCHE_COMPTA_SAFE_QC_ON.md` et lecture directe du code.
> Toute règle affichée par le produit doit exister ici. Rien affiché si confiance = INCERTAIN
> ou source absente.

## Convention

- **Juridiction** : `QC` (Barreau du Québec), `ON` (Law Society of Ontario), `FED` (fédéral).
- **Confiance** : `CONFIRME` (source primaire fact-checkée) / `PARTIEL` (article cité, non
  vérifié sur texte primaire) / `INCERTAIN` (non sourcé, ne pilote aucun affichage).
- **Hiérarchie** : source primaire > `RECHERCHE_COMPTA_SAFE_QC_ON.md` (fact-check juin 2026,
  URLs officielles) > fiche KB citant un article > fiche KB générique. Les fiches KB d'avril
  sont « brouillon obsolète » et ne font PAS autorité. Contradictions tranchées au profit du
  fact-check.

## Résultat de la validation 2026-07-02 (ce qui a changé vs v0)

1. **Délai de rapprochement QC** : ce n'est PAS une inconnue. Le fact-check confirme que le
   Québec **n'impose aucun délai chiffré en jours** (obligation = livres « à jour » + mensuel).
   Le code (`lib/trust/regulator.ts`) le gère déjà correctement (aucun « 25 jours » affiché en
   QC). Question au Barreau **rétrogradée** de bloquante à simple confirmation.
2. **Faiblesse `[ENG-4]`/`[T5]` corrigée** : le doc de juin signalait que la certification ne
   contrôlait que l'agrégat. La lecture du code (`reconciliation-service.ts:135-152`) montre le
   garde-fou R-1 : aucun compte client négatif ne peut passer la certification. Résolu.
3. **Plafond espèces** : le code implémente la règle « No Cash » (interdit d'accepter ≥ 7500 $
   en espèces par mandat), pas une erreur. Mais son périmètre (exceptions, agrégation) et
   l'obligation de déclaration art. 71 restent à confirmer.
4. **Rétention et intérêts** : plusieurs entrées passent de PARTIEL à CONFIRME (fact-checkées).
   Rétention ON corrigée : 6 ans général / 10 ans fiducie (pas « 10 ans » global).
5. **Obligations manquantes ajoutées** : By-Law 8 (plan de contingence ON, échéance 31 mars
   2026 DÉJÀ PASSÉE), déclaration T3 fédérale (seuil 250 000 $), commingling d'affichage `[DASH-01]`.

---

## 1. Fidéicommis

| ID | Jur. | Obligation | Source | Confiance | Mapping code / état |
|----|------|-----------|--------|-----------|--------------|
| TR-QC-01 | QC | Texte de référence : RLRQ c. B-1, r. 5 | RECHERCHE §0,2 + URL CanLII | CONFIRME | `lib/trust/regulator.ts` |
| TR-QC-02 | QC | Séparation stricte fonds client / cabinet (non-commingling) au niveau **moteur** | RECHERCHE §2 | CONFIRME | `journal/kpi.ts:54` isTrustEntry |
| TR-QC-03 | QC | Compte général F2 obligatoire (+ F3 optionnel) ; ouverture au Barreau + formation 6 mois | RECHERCHE §2 (l.64,70) | CONFIRME (titre exact du formulaire F2 = INCERTAIN, RECHERCHE l.232) | à modéliser |
| TR-QC-04 | QC | Registres : journal caisse (art. 38), cartes-clients (art. 39,66), rapports mensuels (art. 40-41), autres biens (art. 43) | RECHERCHE §2 (l.65) | CONFIRME | `TrustTransaction`, `TrustReconciliation` ; **art. 43 (biens non monétaires) ❌ non couvert** |
| TR-QC-05 | QC | Rapprochement 3 voies : journal ↔ carte-client ↔ relevé bancaire | RECHERCHE §2 (l.66) | CONFIRME | `reconciliation-service.ts` |
| TR-QC-06 | QC | Fréquence = **mensuel**, **aucun délai chiffré en jours** (livres « à jour ») | RECHERCHE §0,2 (l.15,67) | **CONFIRME** | `regulator.ts` (QC : pas de « 25 j » affiché) ✅ |
| TR-QC-07 | QC | Solde d'une carte-client jamais négatif ; certification bloquée sinon | RECHERCHE §8 + code | CONFIRME | `reconciliation-service.ts:135-152` (R-1) ✅ |
| TR-QC-08 | QC | Intérêts fiducie → **Fonds d'études juridiques du Barreau** (B-1 r.10) ; jusqu'à 50 % aide juridique | RECHERCHE §0 (l.17,72) + URL | CONFIRME | libellé QC `regulator.ts:163,172` ✅ |
| TR-QC-09 | QC | Dépôt « sans délai indu » (pas de délai chiffré ; « jour ouvrable suivant » est ONTARIEN) | RECHERCHE §2 (l.69) | CONFIRME | — |
| TR-ON-01 | ON | Fondement fiducie = By-Law 9 (LSO) | RECHERCHE §2 + config Derisier | CONFIRME | `regulator.ts` (`bylaw9-lso`) |
| TR-ON-02 | ON | Rapprochement mensuel, **≤ 25 jours après fin du mois** (art. 22(2)) | RECHERCHE §2 (l.67) + URL LSO | CONFIRME | `reconciliation-service.ts:218-246` ; `regulator.ts` ON |
| TR-ON-03 | ON | Le « 25 jours » est propre à l'ON, jamais affiché en QC | journal 2026-06-09 + code | CONFIRME | `regulator.ts:8-12` ✅ |
| TR-ON-04 | ON | Intérêts comptes groupés → **Law Foundation of Ontario** (s. 57 Law Society Act) | RECHERCHE §2 (l.72) | CONFIRME | config Derisier `interets:"LFO"` |
| TR-ON-05 | ON | Dépôt au plus tard **le jour ouvrable bancaire suivant** (art. 1(3)) | RECHERCHE §0 (l.22) + URL | CONFIRME | déclencheur d'alerte à câbler |
| TR-QC-11 | QC | Rapport Annuel sur la Pratique (RAP) : **contenu et délai** | RECHERCHE §2 (l.73, nommé sans détail) | **INCERTAIN** → Q-BARREAU-02 | `lso-report-service.ts` (composant existe) |
| TR-QC-12 | QC | Vérification annuelle par CPA indépendant : **obligatoire ou non ?** | fiches KB (art. 19) ; **absent du fact-check** | **INCERTAIN** → Q-BARREAU-03 | — |
| TR-ON-06 | ON | **Plan de contingence obligatoire (LSO)** : praticien seul doit désigner un « administrateur », plan **écrit**, révision annuelle. En vigueur **1 jan. 2025** ; déclaration (rapport annuel) due **31 mars 2026 (PASSÉE)**. Vise tout avocat en pratique privée. (Le n° « By-Law 8 » de la source interne reste à confirmer) | LSO + OBA (recherche web, juil. 2026) ; RECHERCHE §0,8 | CONFIRME (obligation + dates) ; n° by-law à confirmer | ❌ non capté (onboarding/KB/SAFE) — **action Derisier** |

**Anomalie de statut (nouveau)** : le calcul overdue/critical (J+20/J+25) n'est PAS
province-aware (seule la formulation l'est). Un cabinet QC peut être marqué « critique » sur
le seuil ontarien 25 j qui n'existe pas en QC. À rendre province-aware. Réf. STATUS-PROV-01.

---

## 2. Plafond d'espèces

| ID | Jur. | Obligation | Source | Confiance | Mapping code |
|----|------|-----------|--------|-----------|--------------|
| CASH-01 | QC+ON | Règle « No Cash » : interdit d'accepter **≥ 7500 $ en espèces par mandat** (Fédération des ordres) | RECHERCHE §2 (l.71) ; code | CONFIRME (principe) ; **périmètre exact = INCERTAIN** → Q-FED-02 | `trust-transaction-service.ts:16,72` (blocage dépôt ESPECES ≥ 7500) |
| CASH-QC-02 | QC | + **Déclaration au Barreau sous 30 jours** (art. 71) | RECHERCHE §2 (l.71) + URL | CONFIRME | ❌ non implémenté |

**Note validation** : le code implémente correctement l'interdiction (pas une erreur), mais
uniquement sur le dépôt fiducie en espèces. À vérifier : exceptions et agrégation par mandat
de la règle No Cash (Q-FED-02), et ajouter la déclaration 30 j (CASH-QC-02). Formulation KB
« interdit en fidéicommis » écartée (imprécise).

---

## 3. Conservation / rétention

| ID | Jur. | Obligation | Source | Confiance | Mapping code |
|----|------|-----------|--------|-----------|--------------|
| RET-QC-01 | QC | Dossiers clients : **7 ans** après fermeture | RECHERCHE §2 (l.68) | CONFIRME | `Dossier.retentionJusqua` |
| RET-QC-02 | QC | Fidéicommis : rapports mensuels + copies chèques **7 ans après fin d'exercice** | RECHERCHE §2 (l.68) | CONFIRME | seeds rétention |
| RET-QC-03 | QC | Durées plus longues par domaine (immobilier, prescription…) | archivage-retention (KB) | PARTIEL | seeds |
| RET-ON-01 | ON | Registres généraux : **6 ans** (art. 23(1)) | RECHERCHE §2 (l.68) + URL | CONFIRME | seeds à corriger |
| RET-ON-02 | ON | Registres fidéicommis + comparaisons mensuelles : **10 ans** (art. 23(2)(3)) | RECHERCHE §2 (l.68) | CONFIRME | config Derisier |
| RET-FED-01 | FED | Documents FINTRAC : **7 ans** | archivage-retention (KB) | PARTIEL | — |

**Manque système** : aucun job de destruction ne s'exécute à `retentionJusqua` (Phase 2).
Contradiction « 10 ans général QC » (fiche KB) tranchée : c'est **7 ans** en QC.

---

## 4. Conflits d'intérêts

| ID | Jur. | Obligation | Source | Confiance | Mapping code |
|----|------|-----------|--------|-----------|--------------|
| CONF-QC-01 | QC | Vérification de conflit à l'ouverture (article du Code de déontologie) | fichier code-deontologie **absent** | **INCERTAIN** → Q-BARREAU-04 | `conflict-check-service.ts` (existe, opt-in, non bloquant) |
| CONF-ON-01 | ON | Idem, Rules of Professional Conduct r. 3.4 | référencé, non reproduit | **INCERTAIN** → Q-LSO-02 | idem |

---

## 5. Identification client (FINTRAC)

| ID | Jur. | Obligation | Source | Confiance | Mapping code |
|----|------|-----------|--------|-----------|--------------|
| FIN-01 | FED | Vérification d'identité + déclaration espèces 10 000 $+ | KB [VERIFIE] (contexte immobilier ON) | PARTIEL | `Dossier.fintracVerified` (flag booléen) |
| FIN-02 | FED | **Régime FINTRAC propre aux avocats** (distinct des courtiers ; CSC 2015) | absent du corpus | **INCERTAIN** → Q-FED-01 | — |

**Manque système** : flag booléen seulement, pas de vérif du contenu, seuil non codé,
déclaration jamais générée (Phase 2).

---

## 6. Vie privée

| ID | Jur. | Obligation | Source | Confiance | Mapping code |
|----|------|-----------|--------|-----------|--------------|
| PRIV-QC-01 | QC | Loi 25 : responsable, registre d'incidents, droit d'accès, consentement, destruction | archivage-retention (impact produit) | PARTIEL | `ConsentLog` |
| PRIV-QC-02 | QC | Articles précis Loi 25, seuil/délai de notification CAI | fichier loi-25 **absent** | **INCERTAIN** → Q-BARREAU-05 | — |
| PRIV-ON-01 | ON | PIPEDA : obligations concrètes | mention d'activation seulement | INCERTAIN | config Derisier |
| PRIV-SEC-01 | — | NAS employé stocké en clair (à chiffrer) | audit code | À CORRIGER | `schema.prisma` Employee.sinNumero |

---

## 7. Facturation et taxes

| ID | Jur. | Obligation | Source | Confiance | Mapping code |
|----|------|-----------|--------|-----------|--------------|
| FACT-01 | — | Numérotation séquentielle sans trou | doctrine + produit | CONFIRME (règle produit) | déployé 2026-06-05 |
| TAX-QC-01 | QC | TPS 5 % + TVQ 9,975 % (hors TPS) ; inscription dès 30 000 $ | RECHERCHE §2.1 + URL RQ | CONFIRME | modèle taxe facture |
| TAX-ON-01 | ON | TVH 13 % | RECHERCHE §2.1 | CONFIRME | config Derisier |
| TAX-FED-01 | FED | Production TPS/TVH **électronique obligatoire** depuis 2024 | RECHERCHE §0 (l.23) + URL | CONFIRME | export à prévoir |
| TAX-DISP-01 | ON | Écran HST ne doit pas afficher libellés « TPS/TVQ » bruts | RECHERCHE §4 (l.133), `[DASH-03]` | À CORRIGER | anomalie affichage |
| FACT-QC-01 | QC | Numéro TPS/TVQ obligatoire sur facture | — (aucune occurrence corpus) | **INCERTAIN** → Q-RQ-01 | à vérifier |
| FACT-CEO-01 | — | Jamais de n° de Barreau sur facture ; max 2 couleurs | règle CEO (NON réglementaire) | N/A | présentation |

---

## 8. Fédéral / autres

| ID | Jur. | Obligation | Source | Confiance | Mapping code |
|----|------|-----------|--------|-----------|--------------|
| T3-FED-01 | FED | Déclaration T3 pour comptes particuliers, exemption **seuil 250 000 $** (actifs en argent) ; compte général F2 exempté | RECHERCHE §0,8 + URL ARC | CONFIRME (application 2026 à confirmer avec CPA, RECHERCHE l.233) | alerte à prévoir |

---

## 9. Affichage (risque de conformité apparente)

| ID | Jur. | Obligation | Source | Confiance | Mapping code |
|----|------|-----------|--------|-----------|--------------|
| DASH-01 | QC+ON | Ne jamais présenter un « Solde global » incluant le fidéicommis (apparence de commingling, signal d'inspection) | RECHERCHE §1,6,8 `[DASH-01]` | CONFIRME | **à vérifier écran par écran / à corriger** (certains agrégats mono-axe incluent la fiducie) |

---

## Journal des versions

- **v0.2 — 2026-07-02** : validée contre `RECHERCHE_COMPTA_SAFE_QC_ON.md` + lecture code.
  Corrections : délai QC (aucun délai chiffré, confirmé), [ENG-4] résolu, rétention ON 6/10 ans,
  intérêts CONFIRME, plafond espèces = No Cash (périmètre à confirmer). Ajouts : By-Law 8 (ON,
  échéance passée), T3 fédéral, DASH-01 commingling d'affichage, STATUS-PROV-01, anomalies taxe.
- **v0 — 2026-07-02** : amorce depuis l'audit sourcé (remplacée).
