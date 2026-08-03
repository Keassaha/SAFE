# Réévaluation réglementaire — SAFE

**Date** : 2026-08-03
**Objet** : réévaluer SAFE contre [l'audit du 2026-07-30](AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md), après les treize chantiers du [Programme Inspection Ready](PROGRAMME_INSPECTION_READY.md) et le premier écran livré
**Méthode** : vérification dans le code, pas dans les notes des chantiers

---

## 0. Avertissement de fiabilité

**J'audite mon propre travail.** C'est la pire position pour être sévère : chaque constat
favorable est suspect, et les défauts que je n'ai pas visés sont ceux que je risque le
plus de ne pas voir.

Deux précautions ont été prises, et elles ne suffisent pas à annuler le biais :

1. Chaque affirmation de ce document est adossée à une vérification dans le code, avec le
   fichier et la ligne. Aucune ne repose sur les journaux de chantier.
2. La recherche a commencé par les **risques structurels du §18 de l'audit**, qu'aucun
   chantier ne visait explicitement — donc les plus susceptibles d'être encore ouverts.

Un tiers relisant ce document devrait commencer par le §4, « ce qui reste ouvert ».

---

## 1. Le verdict a changé de nature

L'audit du 2026-07-30 concluait :

> « le moteur est bon, les livrables n'existent pas »

La phrase juste aujourd'hui est :

> **« le moteur est complet, le cabinet n'y accède presque pas »**

Ce n'est pas la même chose, et c'est mesurable.

| Services de conformité | Ayant un écran |
|---|---|
| 12 | **1** |

| Service | Surface utilisateur |
|---|---|
| `monthly-report-service` | ✅ `/comptes/rapport-mensuel` (livré le 2026-08-03) |
| `register-service` | ❌ |
| `cash-service` | ❌ |
| `electronic-transfer-service` | ❌ |
| `trust-property-service` | ❌ |
| `annual-report-service` | ❌ |
| `trust-shortfall-service` | ❌ |
| `inspection-kit-service` | ❌ |
| `retention-service` | ❌ |
| `practice-lifecycle-service` | ❌ |
| `inspection-access-service` | ❌ |
| `trust-cheque-service` | ❌ |

La trousse d'inspection existe. Elle assemble registres, rapports mensuels et journal des
soldes débiteurs, chacun avec son empreinte SHA-256, et son manifeste ouvre sur ce qui
manque. **Personne ne peut cliquer dessus.**

---

## 2. Les 25 documents du §16.2, recomptés

L'audit comptait **2 « oui » sur 25**. En comptant ce qu'un avocat peut réellement
produire **sans développeur** :

| | 2026-07-30 | 2026-08-03 |
|---|---|---|
| Producible par le cabinet | 2 | **6** |
| Donnée en base, aucun écran | 0 | **16** |
| Réellement absent | 13 | **3** |

### 2.1 Les six producibles

| # | Document | Où |
|---|---|---|
| 5 | Les rapports comptables mensuels | `/comptes/rapport-mensuel` |
| 6 | Relevé bancaire du mois | rattachable depuis le même écran |
| 8 | Liste des chèques en circulation avec numéros | bloc art. 41(2) du même écran |
| 16 | Livre des honoraires, factures numérotées sans trou | `/facturation/factures` |
| 19 | Dossier de vérification d'identité du client | `/clients/[id]/verification-identite` |
| 23 | Piste d'audit des accès et modifications | `/parametres/audit` |

Le document 4 (registre des cartes-clients) est **partiellement** producible : les soldes
ligne par ligne avec date de dernière inscription apparaissent dans le rapport mensuel,
mais le registre autonome de l'art. 39 n'a pas d'écran.

### 2.2 Les trois réellement absents

| # | Document | Source | Pourquoi c'est assumé |
|---|---|---|---|
| 21 | Grand livre hypothécaire | art. 20 ON | Lot 6, cadré « selon les clients réels » |
| — | Fonds de clôture immobilière, Form 9B/9C | art. 13 ON | idem |
| — | Statut de licence et blocage | art. 2, 2.2, 2.3 ON | idem |

Aucun cabinet servi par SAFE ne fait d'immobilier ontarien. Construire ces registres
maintenant serait bâtir contre une hypothèse plutôt que contre un besoin.

### 2.3 Les seize sans écran

C'est le vrai sujet de cette réévaluation. Formulaires d'ouverture de compte, journal de
caisse fidéicommis imprimable, rapport annuel, chèques compensés et bordereaux,
confirmations de virement, Form 9A, reçus d'espèces, déclarations art. 71, registre des
autres biens, journal d'administration imprimable, liste des dossiers fermés sur 7 ans,
frais de renvoi, suivi des intérêts, copies papier des registres, preuve de conservation,
trousse d'inspection.

**Toutes ces données existent, sont testées, et sont hors de portée du cabinet.**

---

## 3. Ce qui est réellement réglé

Vérifié dans le code, avec la référence.

| Constat de l'audit | État | Preuve |
|---|---|---|
| Phase 1 — facture émise avant retrait | ✅ | `INVOICE_NOT_ISSUED`, `lib/services/fideicommis/errors.ts` |
| Phase 1 — espèces au retrait | ✅ | `CASH_WITHDRAWAL_PROHIBITED`, idem |
| Phase 1 — motif de retrait obligatoire | ✅ | `WITHDRAWAL_MOTIVE_REQUIRED`, idem |
| Phase 1 — troisième voie comparée | ✅ | `ecartCartesClients`, `reconciliation-service.ts` |
| Phase 1 — `fiscalYearEnd` | ✅ | `prisma/schema.prisma` |
| **A-1** — le compte bancaire n'existe pas | ✅ | `TrustBankAccount`, tout le fidéicommis y est porté |
| **A-2** — deux sources de vérité pour le solde | ✅ | `trust-transaction-service.ts:70` : « le registre est seule autorité, jamais `TrustAccount.currentBalance` qui n'est qu'un cache » |
| **A-4** — registre de conformité inerte | ✅ | `COMPLIANCE_RULES_ENABLED` allumé par défaut, 8 entrées corrigées et verrouillées par tests |
| §18.2 — le rapprochement effaçait une certification | ✅ | `reconciliation-service.ts:180` refuse toute modification d'une période certifiée |
| §18.2 — l'attestation plus large que le contrôle | ✅ | `buildDeclarationText(controls, …)` construit depuis les contrôles réellement exécutés |
| §18.2 — ouverture de compte par effet de bord | ✅ au niveau qui compte | L'acte réglementé (art. 50-51) est l'ouverture du **compte bancaire**, désormais explicite. `getOrCreateTrustAccount` ne crée plus qu'une carte-client, que l'art. 39 impose de toute façon. |

---

## 4. Ce qui reste ouvert

Trois points qu'aucun des treize chantiers n'a visés.

### 4.1 A-3 — deux systèmes de permissions parallèles

`UserRole` (4 valeurs) et `EmployeeRole` (matrice module/action) coexistent toujours dans
`lib/auth/rbac.ts`. Rien ne garantit leur cohérence : un durcissement appliqué à l'un peut
être contourné par l'autre.

L'audit le classait **risque majeur**. Il l'est encore.

Note connexe relevée pendant le CH-11 : le dépôt compte **plus de 330 endroits** qui
consultent le rôle. C'est ce chiffre qui a fait écarter l'idée d'un rôle « inspecteur » en
lecture seule au profit d'une session distincte. Le même chiffre mesure la difficulté
d'unifier les deux systèmes.

### 4.2 A-5 — solde du journal faux en cas d'antidatation

`lib/services/journal/journal-service.ts:62` trie toujours `lastEntry` par
`dateTransaction desc`. La colonne `solde` de `JournalGeneralEntry` est une donnée dérivée
persistée qui sera un jour affichée à un inspecteur.

Le défaut est **documenté dans le code et non corrigé**, exactement comme au 2026-07-30.

### 4.3 Le défaut le plus gênant — `sentAt` ne prouve pas l'envoi

`lib/services/billing/invoice-service.ts:507` pose `sentAt: now` **au moment de
l'émission**, sans qu'aucun envoi réel n'ait eu lieu.

Conséquence : le garde-fou `INVOICE_NOT_DELIVERED`, construit au CH-00, vérifie une date
qui n'atteste pas la transmission au client. Il attrape les factures dont `sentAt` n'a
jamais été posé — ce qui reste utile — mais il **ne prouve pas l'envoi** au sens de
l'art. 56(2) QC (« pour lesquels la facturation a été envoyée ») ni du par. 9(1)3 ON
(« for which a billing has been delivered »).

**Le contrôle réglementaire le plus important du système repose sur une donnée qui ne dit
pas ce qu'on croit.** Ce n'est pas une régression introduite par les chantiers : c'est un
défaut préexistant que le CH-00 a rendu visible, et qui n'a pas été traité depuis.

La preuve réelle doit venir de `InvoiceSendLog`.

### 4.4 A-6 — horodatage de confiance

Aucune chaîne d'empreintes par cabinet. Les certifications restent horodatées par
l'application.

À noter : cette suggestion venait de l'audit lui-même comme mesure « proportionnée », pas
d'un article. Aucun texte lu ne l'impose. Elle reste souhaitable, pas exigible.

---

## 5. Modèles annoncés au §12 et non construits

| Modèle | État | Lecture |
|---|---|---|
| `MortgageAssetLedger`, `MortgageLiabilityLedger` | absents | Lot 6, immobilier ontarien, assumé |
| `RecordRetentionRule` | **remplacé** | Les règles vivent dans `lib/compliance/retention.ts`, sourcées et testées, plutôt qu'en base. Meilleur choix : une durée en base peut être modifiée sans laisser de trace de qui l'a fait ni pourquoi. |
| `TrustParticularLedger` | **remplacé** | Le registre de l'art. 66 est dérivé du registre append-only (`PARTICULAR_ACCOUNT_LEDGERS` dans `registers.ts`) plutôt que dupliqué. Cohérent avec PR-1. |

Les deux substitutions sont des décisions, pas des oublis, et elles vont dans le sens de
la doctrine du programme.

---

## 6. Les scores, sur deux axes

Un seul chiffre serait malhonnête : les deux réalités ont divergé.

| | 2026-07-30 | 2026-08-03 |
|---|---|---|
| **Couverture réglementaire du moteur** | 45 | **99** |
| **Capacité réelle du cabinet à produire** | 45 | **≈ 40** |

Le second n'a presque pas bougé, et **c'est le seul qui compte le jour de l'inspection**.
Un inspecteur ne lit pas `lib/compliance/`. Il demande un document.

Le 99 mesure ce que le produit sait faire. Le 40 mesure ce que l'avocate peut faire seule.

### Préparation à une inspection réelle : toujours NON PRÊT

Mais pour une raison qui a changé.

- **Au 2026-07-30**, le constat tombait parce que **la donnée n'existait pas**. Treize à
  dix-huit semaines de travail.
- **Au 2026-08-03**, il tomberait parce que **la donnée est inaccessible**. Deux à trois
  semaines.

---

## 7. Ce qu'il faut faire, dans cet ordre

### 7.1 La trousse d'inspection

Un bouton, un ZIP. Elle rend producibles **seize** des documents d'un coup, parce que le
service d'assemblage existe déjà et qu'il porte le manifeste et les empreintes.

C'est le meilleur rapport effort/couverture de tout le projet, et de loin.

### 7.2 Les registres imprimables

Neuf registres définis, un moteur de rendu écrit, une empreinte déterministe. Il manque
une page et une route.

### 7.3 Corriger `issueInvoice`

Découpler `issuedAt` de `sentAt`, adosser la preuve d'envoi à `InvoiceSendLog`. Sans cela,
le garde-fou central du fidéicommis reste décoratif, et c'est le seul point de ce document
qui touche à la sécurité des fonds clients plutôt qu'à la production de documents.

---

## 8. Ce que je retiendrais

L'audit d'origine disait que SAFE avait construit le moteur avant les livrables, et que
c'était le bon ordre. Il l'était.

Le risque du moment est différent et il est réel : **un moteur complet donne l'illusion
d'être prêt.** La matrice affiche 99, tous les tests sont verts, et une avocate inspectée
demain ne pourrait toujours produire que six documents sur vingt-cinq.

Les treize chantiers ont acheté le droit de construire les écrans. Ils n'ont pas construit
la conformité du cabinet, et rien dans ce dépôt ne doit laisser croire le contraire.

---

*Réévaluation produite le 2026-08-03. Toutes les affirmations sont vérifiées dans le code
du dépôt à cette date. Biais déclaré au §0 : l'auteur de cette réévaluation est l'auteur
du travail évalué.*
