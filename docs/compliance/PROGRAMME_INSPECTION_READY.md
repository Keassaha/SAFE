# Programme « Inspection Ready » — spécification de mise en conformité totale

**Version** : 1.0 · **Date** : 2026-07-30
**Origine** : [AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md](AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md)
**Objet** : fermer **tous** les points non couverts identifiés à l'audit, et faire en sorte que SAFE tienne la promesse faite aux clients.
**Nature du document** : spécification exécutable. Chaque chantier est autoportant : schéma, service, validations, écrans, tests, définition de terminé.

---

## 0. La promesse, telle qu'elle est écrite

Trois engagements publics, cités mot pour mot depuis le code :

| Où | Texte | Ce que ça engage |
|---|---|---|
| `lib/tarification.ts:101` | « SAFE est actuellement déployé pour le Québec (Barreau du Québec, Règlement B-1, r.5) et l'Ontario (LSO By-Law 9). […] SAFE facilite le suivi de vos obligations, la responsabilité professionnelle reste la vôtre. » | **Déployé pour** B-1 r.5 et By-Law 9. Pas « inspiré de ». Le périmètre annoncé est le règlement entier. |
| `components/public-site/HomePage.tsx:429` | « L'écart apparaît avant l'inspection. SAFE compare **le relevé bancaire, le registre du fidéicommis et les soldes par dossier**. Lorsqu'un montant ne concorde pas, le système le signale et **empêche une certification prématurée**. » | Trois voies réellement comparées, et blocage. |
| `components/public-site/HomePage.tsx:529` | « SAFE garantit-il ma conformité ? Non. SAFE soutient **la tenue, la vérification et la traçabilité**. » | Trois verbes : tenir les registres, vérifier, tracer. |

**Ce que la promesse ne dit pas** — et c'est bien ainsi : SAFE ne garantit pas la conformité, ne se substitue pas au jugement de l'avocat, ne signe rien à sa place. Le programme ci-dessous ne change pas ce périmètre. Il fait en sorte que les trois verbes soient vrais.

### 0.1 Écarts promesse ↔ produit à fermer en priorité absolue

Ce sont des écarts entre ce que la page de vente affirme et ce que le code fait. Ils précèdent même les obligations réglementaires, parce qu'ils engagent la parole donnée.

| # | Promesse | Réalité du code | Chantier |
|---|---|---|---|
| **P-1** | « SAFE compare le relevé bancaire, le registre du fidéicommis **et les soldes par dossier** » | `soldeParDossier` est calculé, stocké, et **jamais comparé**. `ecart = soldeRapproche − soldeRegistre`. La troisième voie n'existe pas. | CH-00 |
| **P-2** | « empêche une certification prématurée » | La certification est bloquée sur l'écart bancaire et les soldes négatifs, mais passe sans relevé bancaire, sans liste de cartes-clients, sans pièces justificatives, sans motif d'écart. | CH-00 puis CH-03 |
| **P-3** | « déployé pour le Québec (B-1 r.5) » | 61 obligations québécoises identifiées, **48 % couvertes**. Les art. 43-46, 62-68 et 70-73 sont totalement absents. | CH-01 à CH-08 |
| **P-4** | « déployé pour l'Ontario (By-Law 9) » | 44 obligations, **42 % couvertes**. Form 9A, double contrôle et cautionnement : absents. | CH-07 |
| **P-5** | « la tenue » des registres | Aucun registre n'est **matérialisé** ni imprimable. Tout est dérivé à la volée. | CH-04 |
| **P-6** | « la traçabilité » | Bonne sur les actions, **nulle sur les pièces** : aucune pièce justificative n'est attachable à une opération fidéicommis. | CH-02 |

**Décision de doctrine** : tant que P-1 et P-2 ne sont pas fermés, la formulation de `HomePage.tsx:429` doit être considérée comme en avance sur le produit. Soit on livre CH-00 dans la semaine, soit on ajuste la copie. Je recommande de livrer : c'est trois jours.

---

## 1. Définition de « terminé » pour le programme

Le programme est terminé quand les cinq énoncés suivants sont vrais et démontrables :

1. **Un cabinet peut imprimer, signer et remettre** les 25 documents de la liste d'inspection (§16.2 de l'audit) depuis SAFE, sans ressaisie et sans fichier externe.
2. **Aucun chemin de code** ne permet une opération que B-1 r.5 ou By-Law 9 interdisent. Prouvé par une suite de tests dédiée (§8).
3. **Chaque garde-fou possède une porte de sortie documentée** : exception invoquée, motif obligatoire, trace d'audit. Aucun mur sans porte.
4. **Chaque obligation** des deux règlements est soit implémentée, soit explicitement déclarée hors périmètre produit avec sa justification, dans la matrice de traçabilité (§5).
5. **Le registre `lib/compliance/rules.ts` est allumé**, corrigé, sourcé sur le texte primaire, et pilote réellement les surfaces.

---

## 2. Principes de conception non négociables

Ces principes s'appliquent à chaque chantier. Une revue de code qui en viole un est rejetée.

| # | Principe | Raison |
|---|---|---|
| PR-1 | **Le registre append-only est la seule source de vérité des soldes.** Tout champ dénormalisé (`TrustAccount.currentBalance`, `Dossier.soldeFiducieDossier`, `Client.trustAccountBalance`) est un cache, jamais une autorité, et fait l'objet d'un contrôle de cohérence. | L'audit a montré que la 3ᵉ voie compare deux caches entre eux. |
| PR-2 | **Aucun garde-fou sans porte de sortie.** Toute interdiction doit exposer l'exception réglementaire correspondante, exiger un motif et le journaliser. | Le sur-blocage produit du contournement, donc de la non-conformité. |
| PR-3 | **Ce qui est attesté doit être vérifié.** Le texte de toute attestation signée est généré à partir de la liste des contrôles réellement exécutés. | Faire signer plus large que le contrôle expose l'avocate et SAFE. |
| PR-4 | **Toute donnée réglementaire porte sa source.** Un champ, un seuil, un délai codé en dur sans référence d'article est un bug. | Doctrine ADR-011, déjà en place, à généraliser. |
| PR-5 | **Le figeage prime le recalcul.** Un rapport certifié est un instantané immuable. Aucun recalcul ultérieur ne le réécrit. | Un inspecteur compare des documents datés, pas des vues dynamiques. |
| PR-6 | **Rien n'est automatique sur un acte de l'avocat.** Voir la liste des automatisations interdites (§2.1). | Art. 58 QC : le retrait est un acte personnel. |
| PR-7 | **Province-aware par défaut.** Toute règle porte sa juridiction. Aucune règle ontarienne servie au Québec, et inversement. | Déjà bien fait pour les 25 jours. À généraliser. |
| PR-8 | **Chaque écriture est attachable à une pièce.** Une opération sans pièce est signalée, jamais bloquée silencieusement. | Art. 32 QC / par. 18(10) ON. |
| PR-9 | **Bilingue FR/EN sur toute surface réglementaire.** Un cabinet ontarien lit en anglais, un cabinet québécois en français. | Déjà la doctrine de `regulator.ts`. |
| PR-10 | **Migrations additives uniquement.** Aucune colonne supprimée, aucune donnée détruite. Rétrocompatibilité assurée par valeurs par défaut. | Un registre légal ne perd jamais d'historique. |

### 2.1 Automatisations formellement interdites

À inscrire dans `AGENTS.md` et à faire respecter en revue :

- Retrait automatique du fidéicommis vers l'administration, même sur facture émise
- Certification automatique d'un rapprochement, même à écart nul
- Correction automatique d'un écart par écriture d'ajustement
- Purge automatique d'un registre en fin de rétention sans double validation humaine
- Génération d'un Form 9A sans signature préalable d'un titulaire
- Application automatique d'un solde fidéicommis à une facture au moment de son émission
- Création implicite d'un compte en fidéicommis par effet de bord d'un dépôt

---

## 3. Modèle de données cible

Toutes les migrations sont **additives**. Les modèles existants sont enrichis, jamais remplacés.

### 3.1 Nouveaux modèles — socle fidéicommis

```prisma
/// Compte bancaire en fidéicommis. Art. 36, 41(7), 50-51, 62-68 QC · s. 7(5), 18(8)ii ON.
/// C'est l'entité qui manquait : TrustAccount est un sous-compte client/dossier, pas une banque.
model TrustBankAccount {
  id                  String              @id @default(cuid())
  cabinetId           String
  type                TrustBankAccountType @default(GENERAL)
  /// Libellé légal du compte. VALIDÉ : doit contenir "en fidéicommis" ou "in trust" (art. 50, 63 QC).
  accountLabel        String
  institutionName     String
  institutionBranch   String?
  branchAddress       String?
  /// Chiffré au repos. Jamais affiché en entier dans l'UI (4 derniers chiffres).
  accountNumberEnc    String
  accountNumberLast4  String
  currency            String              @default("CAD")
  province            String
  /// Art. 50 QC : institution ayant conclu une entente au sens de B-1 r.10.
  barreauAgreementConfirmed Boolean        @default(false)
  /// Art. 51 / 64 QC : formulaire prescrit transmis au Barreau et à l'institution.
  regulatorNotifiedAt DateTime?
  regulatorFormDocumentId String?
  openedAt            DateTime
  closedAt            DateTime?
  closureReason       String?
  /// Comptes particuliers seulement (art. 62-68 QC).
  clientId            String?
  dossierId           String?
  initialDeposit      Float?
  /// Bénéficiaire des intérêts : FONDS_ETUDES_JURIDIQUES | LAW_FOUNDATION_ONTARIO | CLIENT
  interestBeneficiary TrustInterestBeneficiary @default(FONDS_ETUDES_JURIDIQUES)
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  cabinet             Cabinet             @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  client              Client?             @relation(fields: [clientId], references: [id], onDelete: Restrict)
  transactions        TrustTransaction[]
  cheques             TrustCheque[]
  monthlyReports      TrustMonthlyReport[]
  signatories         TrustSignatory[]

  @@index([cabinetId])
  @@index([cabinetId, type])
  @@unique([cabinetId, accountNumberLast4, institutionName, openedAt])
}

enum TrustBankAccountType { GENERAL PARTICULIER }
enum TrustInterestBeneficiary { FONDS_ETUDES_JURIDIQUES LAW_FOUNDATION_ONTARIO CLIENT }
```

```prisma
/// Registre des chèques en fidéicommis. Art. 38(2)h, 41(2), 57, 61 QC · s. 11, 18(2) ON.
model TrustCheque {
  id                 String            @id @default(cuid())
  cabinetId          String
  trustBankAccountId String
  /// Numérotation consécutive obligatoire (art. 61 QC). Unicité par compte.
  chequeNumber       Int
  issueDate          DateTime
  /// Art. 57 QC / s. 11(a) ON : jamais "cash", "caisse", "bearer", "porteur", jamais vide.
  payeeName          String
  amount             Float
  clientId           String?
  dossierId          String?
  trustTransactionId String?           @unique
  status             TrustChequeStatus @default(ISSUED)
  clearedAt          DateTime?
  voidedAt           DateTime?
  voidReason         String?
  /// Signataire. Art. 11(b) ON : non-titulaire seulement si cautionné.
  signedByUserId     String?
  createdAt          DateTime          @default(now())

  @@unique([trustBankAccountId, chequeNumber])
  @@index([cabinetId])
  @@index([cabinetId, status])
}

enum TrustChequeStatus { ISSUED CLEARED VOIDED STALE }
```

```prisma
/// Rapport comptable mensuel. Art. 40-41 QC · s. 18(8), 22(2) ON. LE livrable d'inspection.
model TrustMonthlyReport {
  id                    String   @id @default(cuid())
  cabinetId             String
  trustBankAccountId    String
  periode               String   // "YYYY-MM"
  status                String   @default("draft") // draft | complete | certified
  /// Art. 41(4)
  totalReceipts         Float    @default(0)
  totalDisbursements    Float    @default(0)
  /// Art. 41(5) : état comparatif journal ↔ relevé bancaire
  bankStatementBalance  Float
  journalBalance        Float
  ledgerSumBalance      Float    // 3e voie : Σ des cartes-clients
  outstandingChequesTotal Float  @default(0)
  depositsInTransitTotal  Float  @default(0)
  reconciledBalance     Float
  ecartBanque           Float    @default(0)  // reconciledBalance − journalBalance
  ecartCartesClients    Float    @default(0)  // ledgerSumBalance − journalBalance  ← P-1
  /// Art. 41(7) : copie du relevé bancaire. Obligatoire pour certifier.
  bankStatementDocumentId String?
  /// Instantané immuable figé à la certification (PR-5).
  snapshotJson          String?
  certifiedById         String?
  certifiedAt           DateTime?
  declarationText       String?
  /// Liste des contrôles réellement exécutés, sérialisée (PR-3).
  verifiedControlsJson  String?
  lockedAt              DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  outstandingCheques    TrustOutstandingChequeLine[]
  depositsInTransit     TrustDepositInTransitLine[]
  ledgerSnapshot        TrustClientLedgerSnapshot[]
  discrepancies         TrustDiscrepancyReason[]

  @@unique([trustBankAccountId, periode])
  @@index([cabinetId, periode])
}

/// Art. 41(2) QC : liste des chèques en circulation, ligne par ligne.
model TrustOutstandingChequeLine {
  id           String   @id @default(cuid())
  reportId     String
  chequeId     String?
  chequeNumber Int
  issueDate    DateTime
  amount       Float
  clientName   String
  dossierRef   String?
  payeeName    String
  @@index([reportId])
}

/// Art. 41(3) QC : liste des recettes en circulation, ligne par ligne.
model TrustDepositInTransitLine {
  id           String   @id @default(cuid())
  reportId     String
  receivedDate DateTime
  amount       Float
  clientName   String
  dossierRef   String?
  payerName    String?
  @@index([reportId])
}

/// Art. 41(1) QC / s. 18(8)i ON : liste des soldes de cartes-clients.
/// `lastEntryDate` est LE champ "date de la dernière inscription" aujourd'hui inexistant.
model TrustClientLedgerSnapshot {
  id            String   @id @default(cuid())
  reportId      String
  clientId      String
  clientName    String
  dossierId     String?
  dossierRef    String?
  balance       Float
  lastEntryDate DateTime?
  @@index([reportId])
}

/// s. 18(8) ON : "together with the reasons for any differences between the totals".
model TrustDiscrepancyReason {
  id          String    @id @default(cuid())
  reportId    String
  amount      Float
  explanation String
  raisedAt    DateTime  @default(now())
  resolvedAt  DateTime?
  resolvedById String?
  @@index([reportId])
}
```

```prisma
/// Art. 32 QC · s. 18(10)(11) ON : pièces justificatives attachées aux opérations.
model TrustTransactionDocument {
  id                 String                       @id @default(cuid())
  trustTransactionId String
  documentId         String
  role               TrustSupportingDocumentRole
  createdAt          DateTime                     @default(now())
  @@unique([trustTransactionId, documentId, role])
  @@index([trustTransactionId])
}

enum TrustSupportingDocumentRole {
  CHEQUE_RECU BORDEREAU_DEPOT CHEQUE_COMPENSE
  CONFIRMATION_VIREMENT RECU_ESPECES RELEVE_BANCAIRE AUTRE
}
```

### 3.2 Nouveaux modèles — espèces, biens, virements, signataires

```prisma
/// Art. 70-73 QC · s. 19(1) ON : reçu d'espèces, deux signatures, numéroté.
model CashReceipt {
  id                    String   @id @default(cuid())
  cabinetId             String
  receiptNumber         Int      // séquentiel par cabinet, sans trou
  date                  DateTime
  payerName             String
  amount                Float
  currency              String   @default("CAD")
  /// Art. 73 QC / s. 4(2) ON : taux de midi de la Banque du Canada.
  cadAmount             Float
  conversionRate        Float?
  conversionRateDate    DateTime?
  clientId              String
  dossierId             String
  purpose               String
  receivedByUserId      String
  /// Art. 70 : signé par l'avocat ET par le payeur.
  payerSignatureDocumentId    String?
  licenseeSignatureDocumentId String?
  /// s. 19(2) ON : efforts raisonnables si le payeur refuse de signer. Doit être documenté.
  payerSignatureWaivedReason  String?
  /// Exception invoquée si ≥ 7 500 $ (art. 69 QC / s. 6 ON).
  exemptionInvoked      CashExemption?
  exemptionJustification String?
  /// Art. 71 QC : déclaration au directeur de l'inspection dans les 30 jours.
  declarationDueAt      DateTime?
  declarationSentAt     DateTime?
  declarationDocumentId String?
  /// s. 6(e) ON : si l'exception "honoraires" est invoquée, tout remboursement doit être en espèces.
  refundMustBeCash      Boolean  @default(false)
  trustTransactionId    String?
  createdAt             DateTime @default(now())

  @@unique([cabinetId, receiptNumber])
  @@index([cabinetId, date])
  @@index([cabinetId, dossierId])
}

enum CashExemption {
  INSTITUTION_FINANCIERE ORGANISME_PUBLIC ORDONNANCE_TRIBUNAL
  AMENDE_OU_SANCTION AGENT_DE_LA_PAIX DEPOT_MISE_EN_LIBERTE
  AVANCE_HONORAIRES_OU_DEBOURS
}

/// Art. 72 QC : remboursement d'une somme ≥ 7 500 $ reçue en espèces, obligatoirement en espèces.
model CashRefund {
  id               String   @id @default(cuid())
  cabinetId        String
  cashReceiptId    String
  date             DateTime
  amount           Float
  recipientName    String
  clientId         String
  dossierId        String
  signatureDocumentId String?
  createdAt        DateTime @default(now())
  @@index([cabinetId])
}
```

```prisma
/// Art. 43-46 QC · s. 18(9) ON : autres biens en fidéicommis.
model TrustProperty {
  id                  String    @id @default(cuid())
  cabinetId           String
  clientId            String
  dossierId           String?
  description         String
  identificationNumber String?
  /// s. 18(9) ON exige la valeur ; B-1 r.5 ne l'exige pas. Obligatoire en ON.
  estimatedValue      Float?
  /// s. 18(9) ON : personne qui détenait le bien immédiatement avant.
  receivedFromName    String
  receivedAt          DateTime
  /// Art. 45 QC : lieu de garde, et tout changement doit être communiqué au client.
  storageLocation     String
  storageHistoryJson  String?
  /// Art. 44 QC : si le bien vient d'un tiers, informer le client sans délai.
  fromThirdParty      Boolean   @default(false)
  clientNotifiedAt    DateTime?
  /// Art. 46 QC : affectation.
  purpose             String
  releasedAt          DateTime?
  releasedToName      String?
  releaseSignatureDocumentId String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([cabinetId])
  @@index([cabinetId, releasedAt])
}
```

```prisma
/// s. 12 ON : réquisition de virement électronique, Formulaire 9A.
model ElectronicTrustTransferRequisition {
  id                    String   @id @default(cuid())
  cabinetId             String
  trustBankAccountId    String
  formType              String   @default("9A") // 9A | 9B | 9C
  /// Champs du Form 9A
  clientName            String
  dossierRef            String?
  amount                Float
  recipientName         String
  recipientInstitution  String
  recipientBranch       String
  recipientBranchAddress String
  recipientAccountNumberEnc String
  purpose               String
  /// s. 12(2)4 : signée AVANT toute saisie dans le système de virement.
  signedByUserId        String
  signedAt              DateTime
  /// s. 12(2)1 : deux personnes distinctes, sauf praticien seul (s. 12(3)).
  dataEnteredByUserId   String?
  dataEnteredAt         DateTime?
  authorizedByUserId    String?
  authorizedAt          DateTime?
  solePractitionerExemption Boolean @default(false)
  /// s. 12(2)2-3 : confirmation de l'institution, 6 éléments obligatoires.
  confirmationDocumentId String?
  confirmationReceivedAt DateTime?
  confirmationSourceAccount String?
  confirmationRecipientInstitution String?
  confirmationRecipientName String?
  confirmationRecipientAccount String?
  confirmationInstitutionTimestamp DateTime?
  confirmationSentTimestamp DateTime?
  /// s. 12(5) : imprimer, comparer, annoter, signer et dater, au plus tard J+1 bancaire.
  printedAt             DateTime?
  comparedAt            DateTime?
  annotatedClientId     String?
  annotatedDossierId    String?
  countersignedByUserId String?
  countersignedAt       DateTime?
  countersignDueAt      DateTime?
  trustTransactionId    String?  @unique
  createdAt             DateTime @default(now())

  @@index([cabinetId])
  @@index([cabinetId, countersignedAt])
}

/// s. 11(b), 12(2)4ii ON : pouvoir de signature et cautionnement.
model TrustSignatory {
  id                 String    @id @default(cuid())
  cabinetId          String
  userId             String
  trustBankAccountId String
  isLicensee         Boolean   @default(true)
  /// Cautionnement ≥ solde maximal en dépôt de l'exercice précédent (s. 11(b)).
  bondAmount         Float?
  bondExpiryDate     DateTime?
  bondDocumentId     String?
  authorizedFrom     DateTime
  authorizedTo       DateTime?
  createdAt          DateTime  @default(now())
  @@unique([userId, trustBankAccountId])
  @@index([cabinetId])
}
```

### 3.3 Nouveaux modèles — identité, registres spécialisés, rétention, inspection

```prisma
/// Art. 23(2) QC : détenteurs de 25 % et plus, et administrateurs.
model BeneficialOwner {
  id              String   @id @default(cuid())
  clientId        String
  nom             String
  adresse         String?
  occupation      String?
  role            BeneficialOwnerRole
  ownershipPercent Float?
  verifiedAt      DateTime?
  sourceDocumentId String?
  createdAt       DateTime @default(now())
  @@index([clientId])
}
enum BeneficialOwnerRole { ADMINISTRATEUR DETENTEUR_25_PLUS PERSONNE_AUTORISEE }

/// Art. 24 QC : attestation de répondant quand le client n'est pas rencontré.
model IdentityAttestation {
  id                String   @id @default(cuid())
  clientId          String
  attestorName      String
  attestorQuality   String   // juge, commissaire, professionnel...
  attestorAddress   String
  documentType      String
  documentReference String
  signedAt          DateTime
  attestationDocumentId String?
  createdAt         DateTime @default(now())
  @@index([clientId])
}

/// s. 19.1 ON : registre des frais de renvoi.
model ReferralFee {
  id            String   @id @default(cuid())
  cabinetId     String
  direction     String   // RECEIVED | PAID
  date          DateTime
  method        String
  amount        Float
  counterpartyLicensee String
  clientId      String?
  documentIdentifier String?
  agreementDocumentId String?
  createdAt     DateTime @default(now())
  @@index([cabinetId, date])
}

/// s. 20 ON : hypothèques détenues en fiducie.
model MortgageTrustLedger {
  id                String   @id @default(cuid())
  cabinetId         String
  side              String   // ASSET | LIABILITY
  mortgageRef       String
  investorClientId  String?
  principalOutstanding Float
  legalDescription  String
  municipalAddress  String?
  registrationDetails String
  createdAt         DateTime @default(now())
  @@index([cabinetId, side])
}

/// Rétention par type de registre, par province. Art. 31-32 QC · s. 23 ON.
model RecordRetentionRule {
  id           String   @id @default(cuid())
  recordType   String   // TRUST_JOURNAL, CLIENT_LEDGER, MONTHLY_REPORT, CASH_RECEIPT...
  province     String   // QC | ON | ALL
  minYears     Int
  anchor       String   // FILE_CLOSURE | FISCAL_YEAR_END
  legalBasis   String   // "B-1 r.5 art. 31" | "By-Law 9 s. 23(2)"
  @@unique([recordType, province])
}

/// Art. 29(3) QC : accès du syndic, des enquêteurs et des inspecteurs. Journalisé.
model InspectionAccessSession {
  id            String    @id @default(cuid())
  cabinetId     String
  grantedByUserId String
  inspectorName String
  inspectorBody String    // BARREAU_QC | LSO | SYNDIC
  purpose       String
  periodFrom    DateTime?
  periodTo      DateTime?
  startedAt     DateTime  @default(now())
  expiresAt     DateTime
  revokedAt     DateTime?
  accessLogJson String?
  @@index([cabinetId])
}
```

### 3.4 Champs à ajouter aux modèles existants

```prisma
// TrustTransaction — art. 38 QC · s. 18(1)(2) ON
trustBankAccountId String        // obligatoire après migration
payerName          String?       // art. 38(1)c — de qui la somme est reçue
payeeName          String?       // art. 38(2)c — bénéficiaire du débours
purposeCode        TrustPurposeCode?
purposeText        String?       // art. 38(1)f et (2)f — l'objet
chequeNumber       Int?          // art. 38(2)h
isCash             Boolean @default(false) // art. 38(1)g
receivedAt         DateTime?     // art. 50 QC "sans délai" / s. 7(1) ON "immediately"
depositedAt        DateTime?     // sans les deux dates, le délai est invérifiable
fundAllocation     String?       // art. 48 QC — affectation
fromThirdParty     Boolean @default(false) // art. 49 QC
clientNotifiedAt   DateTime?
withdrawalMotive   TrustWithdrawalMotive?  // art. 56 QC / s. 9(1) ON

enum TrustPurposeCode {
  AVANCE_HONORAIRES AVANCE_DEBOURS FONDS_CLOTURE CONSIGNATION
  REGLEMENT SUCCESSION AUTRE
}
enum TrustWithdrawalMotive {
  REMISE_CLIENT_OU_TIERS          // art. 56(1) QC / s. 9(1)1-2 ON
  HONORAIRES_DEBOURS_FACTURES     // art. 56(2) QC / s. 9(1)3 ON
  TRANSFERT_AUTRE_FIDEICOMMIS     // art. 56(3) QC / s. 9(1)4 ON
  DEPOT_PAR_INADVERTANCE          // s. 9(1)5 ON
}

// JournalGeneralEntry — art. 34 QC · s. 18(5)(6) ON
payerName          String?
payeeName          String?
purposeText        String?
isCash             Boolean @default(false)
documentIdentifier String?

// Cabinet
fiscalYearEnd            String?   // "MM-DD" — toutes les rétentions en dépendent
province                 String?   // explicite, plus dérivé
contingencyPlanDocumentId String?  // art. 78 QC / obligation LSO
successorLawyerName      String?
successorLawyerContact   String?
contingencyPlanReviewedAt DateTime?

// Client — art. 14 QC
occupation           String?
natureActivites      String?
actsForThirdParty    Boolean @default(false)
thirdPartyDetails    String?

// User — s. 2, 2.2, 2.3 ON
licenceNumber   String?
licenceStatus   LicenceStatus @default(ACTIVE)
suspendedFrom   DateTime?
bankruptSince   DateTime?
enum LicenceStatus { ACTIVE SUSPENDED BANKRUPT REVOKED RETIRED }
```

---

## 4. Chantiers

Treize chantiers, `CH-00` à `CH-12`. Chacun est livrable indépendamment après ses prérequis.

---

### CH-00 — Tenir la promesse et fermer les failles exploitables
**Durée : 3 à 5 jours · Prérequis : aucun · Priorité : absolue**

Ferme P-1, P-2, et les trois défauts de code exploitables aujourd'hui.

**Obligations couvertes** : QC-41 (art. 56), QC-42 (art. 57), QC-44 (art. 59, à durcir), ON-13 (s. 9(1)3), M-17 en entier.

**Travaux**

1. **Précondition de facture** — `lib/services/fideicommis/trust-transaction-service.ts`
   ```
   if (factureId) {
     const invoice = await db.invoice.findFirst({ where: { id: factureId, cabinetId, clientId },
       select: { invoiceStatus: true, statut: true, sentAt: true, balanceDue: true, dateEmission: true } });
     if (!invoice) throw ...
     if (!isInvoiceIssued(invoice)) throw new TrustWithdrawalError("FACTURE_NON_EMISE", art. 56(2) QC / s.9(1)3 ON);
     if (!invoice.sentAt) throw new TrustWithdrawalError("FACTURE_NON_ENVOYEE", ...);
     if (montant > invoice.balanceDue) throw new TrustWithdrawalError("MONTANT_SUPERIEUR_AU_SOLDE_DU", ...);
     if (invoice.dateEmission > dateTransaction) throw new TrustWithdrawalError("FACTURE_POSTERIEURE_AU_RETRAIT", ...);
   }
   ```
2. **Motif de retrait obligatoire** — `withdrawalMotive` requis. Sans facture, seuls `REMISE_CLIENT_OU_TIERS` et `TRANSFERT_AUTRE_FIDEICOMMIS` sont acceptés.
3. **Retrait en espèces bloqué** — retirer `ESPECES` de `RetraitForm.tsx`, et refuser côté service avec renvoi vers le flux art. 72 (CH-05).
4. **Verrou et garde sur dépôt et correction** — même `pg_advisory_xact_lock` que le retrait ; refus de toute correction rendant le solde du dossier négatif.
5. **Troisième voie réelle** — `ecartCartesClients = Σ(cartes-clients dérivées du registre) − soldeRegistre`. Certification bloquée si non nul. **C'est P-1.**
6. **Rapprochement certifié immuable** — `createReconciliation` ne doit plus faire un `upsert` qui remet `certifiedAt: null`. Refuser toute modification d'une période certifiée.
7. **Attestation alignée sur les contrôles** — `declarationText` généré depuis la liste des contrôles exécutés (PR-3). **C'est P-2.**
8. **`Cabinet.fiscalYearEnd`** — champ + écran de paramètres.

**Tests** — `lib/services/fideicommis/__tests__/withdrawal-guards.test.ts` : facture brouillon refusée ; facture non envoyée refusée ; montant supérieur au solde dû refusé ; motif absent refusé ; espèces refusé ; correction négative refusée ; certification refusée sur `ecartCartesClients ≠ 0` ; re-création d'un rapprochement certifié refusée.

**Terminé quand** : les 8 tests passent et la copie de `HomePage.tsx:429` est vraie mot pour mot.

#### État au 2026-07-30 — LIVRÉ ✅

| Travail | État | Où |
|---|---|---|
| Précondition de facture (émise + envoyée + montant + chronologie) | ✅ | `trust-transaction-service.ts` → `validateInvoiceForWithdrawal` |
| Motif de retrait obligatoire | ✅ | enum `TrustWithdrawalMotive`, service, zod, route, `RetraitForm` |
| Retrait en espèces bloqué | ✅ | service + retiré de l'UI + retiré du schéma zod |
| Verrou et garde sur dépôt et correction | ✅ | `lockAndReadBalance` partagé par les trois opérations |
| Troisième voie réelle (`ecartCartesClients`) | ✅ | `reconciliation-service.ts`, dérivée du registre append-only |
| Rapprochement certifié immuable | ✅ | `createReconciliation` refuse ; l'`upsert` ne décertifie plus |
| Attestation adossée aux contrôles | ✅ | `ExecutedControl[]` + `buildDeclarationText` + `verifiedControlsJson` |
| `Cabinet.fiscalYearEnd` | ✅ (colonne) | migration `20260730120000_ch00_trust_compliance_guards` — écran de paramètres à CH-11 |
| Registre `lib/compliance/rules.ts` corrigé | ⏳ reporté | voir §7, à faire avant l'allumage du registre (CH-12) |

**Tests** : 19 nouveaux tests dans `ch00-withdrawal-guards.test.ts`, 8 réécrits dans
`reconciliation-certify.test.ts`. Suite complète : 789 tests verts.

**Découverte faite en implémentant — à traiter avant CH-03.**
`issueInvoice` (`lib/services/billing/invoice-service.ts`) pose `sentAt: now` et
`statut: "envoyee"` **au moment de l'émission**, sans qu'aucun envoi réel n'ait eu
lieu. Le garde-fou `INVOICE_NOT_DELIVERED` vérifie donc une date qui n'atteste pas
la transmission au client. Il attrape les factures dont `sentAt` n'a jamais été
posé, ce qui reste utile, mais il ne prouve pas l'envoi au sens de l'art. 56(2) QC
ni de la s. 9(1)3 ON. La preuve réelle doit venir de `InvoiceSendLog`.
**Ce n'est pas une régression introduite par CH-00 : c'est un défaut préexistant que
le chantier a rendu visible.** Corrigé dans un chantier dédié (découplage
`issuedAt` / `sentAt`), à faire avant le rapport mensuel de CH-03 qui devra citer
la date d'envoi.

**Un écart connu subsiste dans la suite de tests** : `lib/dossiers/__tests__` échoue
sur un `import "server-only"` dont le paquet n'est pas installé. Défaut préexistant,
introduit par le commit `a300a7d` (co-clients), sans lien avec ce chantier.

---

### CH-01 — Compte bancaire en fidéicommis
**Durée : 8 à 10 jours · Prérequis : CH-00**

**Obligations** : QC-22 (art. 36), QC-36 (art. 50), QC-37 (art. 51), QC-47 à QC-53 (art. 62-68), ON-09 (s. 7(5)), ON-14 (s. 9(3) « dans ce compte »), ON-31 (s. 18(8)ii).

**Travaux**
- Modèle `TrustBankAccount` + `TrustBankAccountType` + `TrustInterestBeneficiary`
- Migration : création d'un compte `GENERAL` par cabinet, rattachement rétroactif de toutes les `TrustTransaction`, puis `trustBankAccountId` non nul
- Suppression de la création implicite par `getOrCreateTrustAccount` : ouvrir un compte devient un acte explicite (PR-6)
- Validations : libellé contenant « en fidéicommis » ou « in trust » ; province de la succursale ; `barreauAgreementConfirmed` obligatoire au Québec ; numéro de compte chiffré, affiché en 4 derniers chiffres
- Comptes particuliers : `type = PARTICULIER` avec `clientId`, `initialDeposit`, `interestBeneficiary = CLIENT`, formulaire art. 64 attaché, copie au client tracée
- Registre de l'art. 66 : `TrustParticularLedger` dérivé du registre append-only, avec transferts, revenus de placement, frais, solde après chaque inscription
- Alerte art. 67 : compte particulier dont le dossier est fermé et le solde non viré

**Écrans** — `/comptabilite/fideicommis/comptes` (liste, état de rapprochement, solde, alertes) · fiche compte · assistant d'ouverture en 4 étapes (institution → libellé → formulaire réglementaire → confirmation)

**Tests** — libellé non conforme refusé · retrait dépassant le solde du client **dans ce compte** refusé · compte particulier sans formulaire non activable · migration rétroactive idempotente

---

### CH-02 — Champs réglementaires et pièces justificatives
**Durée : 6 à 8 jours · Prérequis : CH-01**

**Obligations** : QC-19 (art. 32), QC-21 (art. 34), QC-24 (art. 38), QC-25 (art. 39), QC-35 (art. 49), QC-34 (art. 48), ON-25 (s. 18(1)), ON-26 (s. 18(2)), ON-29 (s. 18(5)(6)), ON-33 (s. 18(10)), M-13.

**Travaux**
- Champs §3.4 sur `TrustTransaction` et `JournalGeneralEntry`
- `TrustTransactionDocument` + rôles
- Matrice pièce obligatoire par mode : chèque → copie du chèque + bordereau · virement → confirmation · espèces → reçu signé · Interac → capture de la confirmation
- Indicateur « pièce manquante » sur chaque ligne, compteur en tête du rapport mensuel, **jamais bloquant** (PR-8)
- `receivedAt` / `depositedAt` : calcul du délai de dépôt, alerte si dépassement (« sans délai » QC, « immediately » ON)
- `fromThirdParty` + notification client art. 49

**Écrans** — formulaires de dépôt et de retrait enrichis (payeur, bénéficiaire, objet, n° de chèque, dates) · panneau « pièces » sur chaque transaction · tableau des pièces manquantes

---

### CH-03 — Rapport comptable mensuel
**Durée : 12 à 15 jours · Prérequis : CH-01, CH-02 · C'est le pivot du programme**

**Obligations** : QC-26 (art. 40), QC-27 (art. 41), ON-31 (s. 18(8)), ON-41 (s. 22(2)), M-18s.

**Travaux**
- `TrustMonthlyReport` + les 4 tables de lignes + `TrustDiscrepancyReason`
- Génération automatique des 7 blocs de l'art. 41, par compte bancaire
- Chèques en circulation dérivés de `TrustCheque` (statut `ISSUED`), plus jamais ressaisis
- Recettes en circulation saisies ou dérivées des dépôts non crédités
- Snapshot des cartes-clients **avec `lastEntryDate`**
- Téléversement obligatoire du relevé bancaire
- Motifs d'écart structurés, obligatoires si écart non nul
- Figeage `snapshotJson` à la certification (PR-5)
- Contrôles exécutés sérialisés dans `verifiedControlsJson`, et attestation générée à partir d'eux (PR-3)
- Ontario : compte à rebours J+25 · Québec : rappel sans seuil chiffré (conserver `computeReconciliationSeverity`)
- PDF paginé imprimable, en-tête cabinet, pagination « page n de N », signature

**Écrans** — liste des rapports par compte et par période · composition en 7 sections repliables · saisie des chèques en circulation · saisie des recettes en circulation · téléversement du relevé · aperçu imprimable · écran de certification avec accusé de lecture de la liste client

**Validations bloquantes** — Σ snapshot = solde registre · relevé attaché · écart nul ou motivé · aucun solde client négatif · `ecartCartesClients` nul · accusé de lecture posé

**Cas particuliers** — premier mois (solde d'ouverture à justifier) · compte ouvert ou fermé en cours de mois · mois sans transaction (rapport obligatoire) · chèque en circulation > 6 mois (signalé) · solde client inchangé > 12 mois (signalé)

**Protections anti-erreur** — écart jamais saisissable, toujours calculé · comparaison automatique avec le mois précédent et signalement des valeurs identiques · bouton de certification masqué tant que la liste client n'a pas été affichée

---

### CH-04 — Registres matérialisés et imprimables
**Durée : 6 à 8 jours · Prérequis : CH-02**

**Obligations** : QC-17 (art. 30), QC-21 (art. 34), QC-24 (art. 38), QC-25 (art. 39), QC-51 (art. 66), ON-27 (s. 18(3)), ON-30 (s. 18(7)), ON-39 (s. 21(2)), M-18r. Ferme **P-5**.

**Travaux** — moteur de rendu de registre commun (en-tête réglementaire, colonnes normalisées, totaux, pagination, mention de la période, empreinte SHA-256 en pied) appliqué à : journal de caisse fidéicommis · journal de caisse d'administration · registre des cartes-clients · registre des cartes-clients des comptes particuliers · registre des chèques · livre des honoraires · liste des dossiers actifs · liste des dossiers fermés sur 7 ans (art. 9 QC).

Sorties : PDF paginé, CSV, et affichage écran identiques au caractère près.

---

### CH-05 — Chaîne complète des espèces
**Durée : 8 à 10 jours · Prérequis : CH-02**

**Obligations** : QC-54 à QC-58 (art. 69-73), ON-02 à ON-05 (s. 4-6), ON-35 (s. 19(1)).

**Travaux**
- `CashReceipt` + `CashRefund` + `CashExemption`
- **Agrégation par dossier** : cumul espèces recalculé à chaque saisie ; blocage au franchissement de 7 500 $ **sauf** exception invoquée et justifiée (PR-2)
- Reçu à deux signatures, numéroté sans trou, PDF imprimable ; `payerSignatureWaivedReason` documenté si le payeur refuse (s. 19(2) ON)
- Déclaration art. 71 : tâche automatique à J+30 dès le franchissement, courrier généré au directeur de l'inspection professionnelle, copie du reçu jointe, blocage du tableau de conformité tant qu'elle n'est pas envoyée
- Art. 72 : flux de remboursement en espèces obligatoire quand `refundMustBeCash`, avec reçu signé du bénéficiaire
- Conversion FX : taux de midi de la Banque du Canada, date conservée sur le reçu, jour ouvrable précédent si férié
- Correction de `CASH_DEPOSIT_LIMIT` : le seuil reste 7 500 $, mais le contrôle devient contextuel (agrégat, exception, juridiction)

---

### CH-06 — Identité et connaissance du client
**Durée : 8 à 10 jours · Prérequis : aucun (parallélisable) · SOCLE LIVRÉ le 2026-07-30**

**Obligations** : QC-05 (art. 13-14), QC-09 à QC-14 (art. 20-27), M-18p.

> **⚠️ Correction de périmètre (2026-07-30).** By-Law 9 ne contient **aucune** règle
> d'identification du client : il ne traite que des opérations et registres financiers.
> Le régime ontarien est dans **By-Law 7.1, Partie III** (art. 20 à 24), lu
> intégralement le 2026-07-30. Les mentions de « s. 6 ON » pour les exemptions
> d'identité, ailleurs dans ce document et dans l'audit, confondaient ce régime avec
> les exceptions d'espèces de By-Law 9.

#### Divergences encodées (aplatir l'une d'elles crée un blocage illégitime ou un trou)

| Point | Québec (B-1 r.5) | Ontario (By-Law 7.1) |
|---|---|---|
| Personne physique | vérification **avant** réception (art. 26(1)) → blocage | « immediately **after** » (s. 23(5)) → délai, pas blocage |
| Organisation | **60 jours** (art. 26(2)) | **30 jours** (s. 23(6)) |
| Source des fonds | aucune obligation | exigée (s. 23(2)) |
| Occupation des administrateurs | exigée (art. 23(2)1) | nom seulement (s. 23(2.1)(a)) |
| Détenteurs 25 % + | inconditionnel (art. 23(2)2) | efforts raisonnables + repli (s. 23(2.1)(b), 23(2.2)) |
| Fiduciaires, structure | absent | exigés (s. 23(2.1)(b)) |
| Méthodes | standard ouvert + répondant (art. 22, 24) | liste limitative de 3 (s. 23(7)1) |
| Surveillance continue | absente | exigée (s. 23.1) |
| Conservation | 7 ans après fermeture (art. 18, 31) | **la plus longue** de la relation ou 6 ans (s. 23(14)) |

#### État — SOCLE LIVRÉ ✅

| Travail | État |
|---|---|
| Module pur des deux régimes (`lib/compliance/identity.ts`) | ✅ 30 tests |
| Garde-fou sur mouvement de fonds (`lib/services/identity/identity-gate.ts`) | ✅ 15 tests, branché sur dépôt et retrait |
| `BeneficialOwner`, `IdentityAttestation`, champs `Client` et `ClientIdentityVerification` | ✅ migration `20260730140000` |
| Écrans (fiche client enrichie, bénéficiaires effectifs, répondant, bandeau d'échéance) | ⏳ à faire |

**⚠️ Décision requise avant déploiement.** Pour un cabinet québécois, tout mouvement
fidéicommis pour une personne physique non vérifiée est désormais **refusé**
(art. 26(1)). C'est la règle, mais c'est une rupture pour un cabinet en production
dont les fiches n'ont pas de vérification consignée. Produire d'abord un rapport
« clients à régulariser », ou activer en connaissance de cause.

**Travaux**
- Champs `occupation`, `natureActivites`, `actsForThirdParty`, `thirdPartyDetails` sur `Client`
- `BeneficialOwner` (administrateurs et détenteurs ≥ 25 %) et `IdentityAttestation` (répondant art. 24)
- Déclenchement par mouvement de fonds : au premier dépôt, retrait ou virement sur un dossier, si aucune vérification valide et aucune exemption art. 21 invoquée → **blocage** pour une personne physique, **échéance à 60 jours** pour une personne morale, avec blocage à l'expiration
- Exemptions de l'art. 21 QC et de la s. 6 ON modélisées comme données, avec justification obligatoire
- Écran « Identification et vérification » sur la fiche client, avec état et échéance visibles

---

### CH-07 — Ontario : virements, signataires, registres spécialisés
**Durée : 10 à 12 jours · Prérequis : CH-01, CH-02 · Ferme P-4**

**Obligations** : ON-01 (s. 2, 2.2, 2.3), ON-15 (s. 10), ON-16 (s. 11), ON-17 à ON-21 (s. 12), ON-28 (s. 18(4)), ON-34 (s. 18(11)), ON-36 (s. 19.1), ON-37 (s. 20), ON-44 (s. 24), M-14.

**Travaux**
- `ElectronicTrustTransferRequisition` + génération PDF du **Form 9A** pré-rempli
- **Ordre chronologique vérifié** : aucun virement enregistrable sans réquisition signée **antérieure** à la saisie
- Double contrôle : `dataEnteredByUserId ≠ authorizedByUserId`, sauf `solePractitionerExemption` dérivée du nombre d'utilisateurs actifs et **journalisée comme motif**
- Contresignature J+1 bancaire : tâche automatique, alerte, blocage du tableau de conformité au-delà
- `TrustSignatory` : calcul du solde maximal en dépôt de l'exercice précédent, alerte si cautionnement insuffisant ou expiré
- **Journal des transferts entre cartes-clients** avec objet obligatoire : remplace l'interdiction absolue actuelle par un flux autorisé, motivé et journalisé (M-14, PR-2)
- `ReferralFee` (s. 19.1) et `MortgageTrustLedger` (s. 20) avec comparaison mensuelle
- `User.licenceStatus` : blocage des mouvements pour un titulaire failli ou suspendu, retrait obligatoire des comptes dans les 30 jours (s. 2.3)

---

### CH-08 — Autres biens en fidéicommis
**Durée : 4 à 5 jours · Prérequis : CH-01**

**Obligations** : QC-29 à QC-32 (art. 43-46), ON-32 (s. 18(9)).

**Travaux** — `TrustProperty` avec historique de lieu de garde · notification client si bien reçu d'un tiers (art. 44) et à tout changement de lieu (art. 45) · valeur obligatoire en Ontario · inclusion dans les rapports mensuel et annuel · alerte à la fermeture d'un dossier si un bien est encore détenu.

---

### CH-09 — Rapport comptable annuel
**Durée : 5 à 6 jours · Prérequis : CH-03**

**Obligations** : QC-28 (art. 42).

**Travaux** — les 7 blocs de l'art. 42 sur une période de 12 mois définie par la demande, dont la **liste des comptes généraux et particuliers fermés durant la période** · relevé du dernier mois joint · conserver le garde-fou existant (12 rapprochements certifiés) · délai de 30 jours suivi depuis la date de la demande, avec compte à rebours · PDF sur le gabarit du formulaire prescrit une fois obtenu (§9).

---

### CH-10 — Solde débiteur, intérêts et alertes actives
**Durée : 5 à 6 jours · Prérequis : CH-01**

**Obligations** : QC-45 (art. 60), ON-23 (s. 14), M-18j.

**Travaux**
- Détection du solde débiteur **au moment de l'écriture**, pas à la certification
- Alerte immédiate à l'avocat responsable et à l'administrateur
- Tableau des soldes débiteurs avec ancienneté
- Flux de renflouement typé `TRUST_SHORTFALL_REMEDIATION` avec source des fonds
- L'incident et sa résolution restent visibles dans le rapport mensuel même après correction
- `TrustInterestRemittance` : suivi du versement des intérêts au Fonds d'études juridiques ou à la Law Foundation of Ontario, avec preuve

---

### CH-11 — Rétention, purge et mode inspecteur
**Durée : 7 à 9 jours · Prérequis : CH-03, CH-04 · Ferme P-6**

**Obligations** : QC-16 (art. 29), QC-18 (art. 31), QC-19 (art. 32), QC-20 (art. 33), ON-42 (s. 23(1)), ON-43 (s. 23(2)), M-11, M-15.

**Travaux**
- `RecordRetentionRule` peuplée depuis le texte : QC 7 ans ancrés sur `FILE_CLOSURE` (art. 31) ou `FISCAL_YEAR_END` (art. 32) · ON 6 ans (s. 23(1)) et **10 ans** pour les par. 18(1)(2)(3)(8)(9)(10)(11) (s. 23(2))
- Blocage de purge, rapport « ce qui devient purgeable cette année », purge à double validation avec journal
- Rôle `INSPECTEUR` en lecture seule, à durée limitée, chaque consultation journalisée (`InspectionAccessSession`)
- **Trousse d'inspection en un clic** : journal fidéicommis, journal d'administration, cartes-clients, 12 rapports mensuels, rapport annuel, autres biens, chèques, espèces, dossiers actifs et fermés, relevés bancaires, index des pièces. Sortie PDF paginé + ZIP avec manifeste et empreintes SHA-256.
- Reconstitution de l'art. 33 : export intégral horodaté d'une période, avec journal de génération

---

### CH-12 — Registre de conformité vivant et cycle de vie du cabinet
**Durée : 6 à 8 jours · Prérequis : tous**

**Obligations** : QC-01 (art. 7), QC-03 (art. 9), QC-06 (art. 15), QC-08 (art. 19), QC-59 à QC-61 (art. 74-82), M-18l à M-18q.

**Travaux**
- **Correction et allumage de `lib/compliance/rules.ts`** : les 8 entrées erronées corrigées (§7), toutes les règles re-sourcées sur le texte primaire lu, `COMPLIANCE_RULES_ENABLED` par défaut **allumé**, branchement sur le tableau de conformité et sur chaque écran concerné
- Chaque règle porte : article exact, juridiction, niveau de confiance, date de vérification, et l'identifiant du contrôle logiciel qui l'implémente
- Délais de prescription typés (art. 7) avec alertes
- Liste des dossiers fermés sur 7 ans (art. 9)
- Registre des codes de dossiers (art. 15) si codification active
- Marquage « original du client » et interdiction de destruction sans autorisation (art. 19)
- Cessionnaire désigné, plan de contingence, avis au syndic et aux clients (art. 74-82 QC, obligation LSO)

---

## 5. Matrice de traçabilité — chaque point non couvert de l'audit a son chantier

Cette matrice est **le cœur du livrable**. Elle prouve qu'aucun point n'est laissé de côté. Statut cible pour tous : ✅.

### 5.1 Québec

| Réf. audit | Article | Statut actuel | Chantier | Statut cible |
|---|---|---|---|---|
| QC-01 | art. 7 | 🟡 | CH-12 | ✅ |
| QC-02 | art. 8 | 🟡 | CH-12 | ✅ |
| QC-03 | art. 9 | 🟡 | CH-04 + CH-12 | ✅ |
| QC-04 | art. 11 | ✅ | — | ✅ |
| QC-05 | art. 13-14 | 🟡 | CH-06 | ✅ |
| QC-06 | art. 15 | 🟡 | CH-12 | ✅ |
| QC-07 | art. 18 | ✅ | — | ✅ |
| QC-08 | art. 19 | ❌ | CH-12 | ✅ |
| QC-09 | art. 20 | 🟡 | CH-06 | ✅ |
| QC-10 | art. 21 | ❌ | CH-06 | ✅ |
| QC-11 | art. 22-23 | 🟡 | CH-06 | ✅ |
| QC-12 | art. 24-25 | ❌ | CH-06 | ✅ |
| QC-13 | art. 26 | ❌ | CH-06 | ✅ |
| QC-14 | art. 27 | ❌ | CH-06 | ✅ |
| QC-15 | art. 28 | 🟡 | CH-02 + CH-04 | ✅ |
| QC-16 | art. 29 | ❌ | CH-11 | ✅ |
| QC-17 | art. 30 | 🟡 | CH-04 | ✅ |
| QC-18 | art. 31 | 🟡 | CH-11 | ✅ |
| QC-19 | art. 32 | ❌ | CH-02 + CH-11 | ✅ |
| QC-20 | art. 33 | ❌ | CH-11 | ✅ |
| QC-21 | art. 34 | 🟡 | CH-02 + CH-04 | ✅ |
| QC-22 | art. 36 | ❌ | CH-01 | ✅ |
| QC-23 | art. 37 | ✅ | — | ✅ |
| QC-24 | art. 38 | 🟡 | CH-02 + CH-04 | ✅ |
| QC-25 | art. 39 | 🟡 | CH-02 + CH-04 | ✅ |
| QC-26 | art. 40 | 🟡 | CH-03 | ✅ |
| QC-27 | art. 41 | ❌ | **CH-03** | ✅ |
| QC-28 | art. 42 | ❌ | CH-09 | ✅ |
| QC-29 | art. 43 | ❌ | CH-08 | ✅ |
| QC-30 | art. 44 | ❌ | CH-08 | ✅ |
| QC-31 | art. 45 | ❌ | CH-08 | ✅ |
| QC-32 | art. 46 | ❌ | CH-08 | ✅ |
| QC-33 | art. 47 | 🟡 | CH-02 | ✅ |
| QC-34 | art. 48 | ❌ | CH-02 | ✅ |
| QC-35 | art. 49 | 🟡 | CH-02 | ✅ |
| QC-36 | art. 50 | ❌ | CH-01 | ✅ |
| QC-37 | art. 51 | ❌ | CH-01 | ✅ |
| QC-38 | art. 52 | ❌ | CH-02 | ✅ |
| QC-39 | art. 53 | ❌ | CH-02 | ✅ |
| QC-40 | art. 54-55 | ❌ | CH-02 | ✅ |
| QC-41 | art. 56 | ❌ | **CH-00** | ✅ |
| QC-42 | art. 57 | ❌ | **CH-00** | ✅ |
| QC-43 | art. 58 | ❌ | CH-01 | ✅ |
| QC-44 | art. 59 | ✅ | CH-01 (portée compte) | ✅ |
| QC-45 | art. 60 | 🟡 | CH-10 | ✅ |
| QC-46 | art. 61 | ❌ | CH-01 (`TrustCheque`) | ✅ |
| QC-47 | art. 62 | ❌ | CH-01 | ✅ |
| QC-48 | art. 63 | ❌ | CH-01 | ✅ |
| QC-49 | art. 64 | ❌ | CH-01 | ✅ |
| QC-50 | art. 65 | ❌ | CH-01 | ✅ |
| QC-51 | art. 66 | ❌ | CH-01 + CH-04 | ✅ |
| QC-52 | art. 67 | ❌ | CH-01 | ✅ |
| QC-53 | art. 68 | ❌ | CH-01 | ✅ |
| QC-54 | art. 69 | 🟡 | CH-05 | ✅ |
| QC-55 | art. 70 | ❌ | CH-05 | ✅ |
| QC-56 | art. 71 | ❌ | CH-05 | ✅ |
| QC-57 | art. 72 | ❌ | CH-05 | ✅ |
| QC-58 | art. 73 | ❌ | CH-05 | ✅ |
| QC-59 | art. 75-76 | ❌ | CH-12 | ✅ |
| QC-60 | art. 78 | ❌ | CH-12 | ✅ |
| QC-61 | art. 82 | 🟡 | CH-11 | ✅ |

### 5.2 Ontario

| Réf. audit | Article | Statut actuel | Chantier | Statut cible |
|---|---|---|---|---|
| ON-01 | s. 2, 2.2, 2.3 | ❌ | CH-07 | ✅ |
| ON-02 | s. 4(1) | ❌ | CH-05 | ✅ |
| ON-03 | s. 4(2) | ❌ | CH-05 | ✅ |
| ON-04 | s. 5 | ❌ | CH-05 | ✅ |
| ON-05 | s. 6 | ❌ | CH-05 | ✅ |
| ON-06 | s. 7(1) | ❌ | CH-02 | ✅ |
| ON-07 | s. 7(3) | ❌ | CH-02 | ✅ |
| ON-08 | s. 7(4) | ❌ | CH-02 | ✅ |
| ON-09 | s. 7(5) | ❌ | CH-01 | ✅ |
| ON-10 | s. 8(1) | ❌ | CH-02 | ✅ |
| ON-11 | s. 8(2) | ❌ | CH-02 | ✅ |
| ON-12 | s. 8(3) | ❌ | CH-02 | ✅ |
| ON-13 | s. 9(1) | ❌ | **CH-00** | ✅ |
| ON-14 | s. 9(3) | 🟡 | CH-01 | ✅ |
| ON-15 | s. 10 | ❌ | CH-07 | ✅ |
| ON-16 | s. 11 | ❌ | CH-01 + CH-07 | ✅ |
| ON-17 | s. 12(2)1 | ❌ | CH-07 | ✅ |
| ON-18 | s. 12(2)2-3 | ❌ | CH-07 | ✅ |
| ON-19 | s. 12(2)4, 12(7) | ❌ | **CH-07** | ✅ |
| ON-20 | s. 12(3) | ❌ | CH-07 | ✅ |
| ON-21 | s. 12(5) | ❌ | CH-07 | ✅ |
| ON-22 | s. 13 | ❌ | CH-07 (lot immobilier) | ✅ |
| ON-23 | s. 14 | 🟡 | CH-10 | ✅ |
| ON-24 | s. 15-17 | ❌ | CH-07 (lot immobilier) | ✅ |
| ON-25 | s. 18(1) | 🟡 | CH-02 | ✅ |
| ON-26 | s. 18(2) | ❌ | CH-02 | ✅ |
| ON-27 | s. 18(3) | 🟡 | CH-04 | ✅ |
| ON-28 | s. 18(4) | ❌ | CH-07 | ✅ |
| ON-29 | s. 18(5)(6) | 🟡 | CH-02 + CH-04 | ✅ |
| ON-30 | s. 18(7) | ✅ | — | ✅ |
| ON-31 | s. 18(8) | ❌ | **CH-03** | ✅ |
| ON-32 | s. 18(9) | ❌ | CH-08 | ✅ |
| ON-33 | s. 18(10) | ❌ | CH-02 | ✅ |
| ON-34 | s. 18(11) | ❌ | CH-07 | ✅ |
| ON-35 | s. 19(1) | ❌ | CH-05 | ✅ |
| ON-36 | s. 19.1 | ❌ | CH-07 | ✅ |
| ON-37 | s. 20 | ❌ | CH-07 (lot immobilier) | ✅ |
| ON-38 | s. 21(1) | ✅ | — | ✅ |
| ON-39 | s. 21(2) | 🟡 | CH-04 | ✅ |
| ON-40 | s. 22(1) | 🟡 | CH-02 | ✅ |
| ON-41 | s. 22(2) | ✅ | — | ✅ |
| ON-42 | s. 23(1) | 🟡 | CH-11 | ✅ |
| ON-43 | s. 23(2) | ❌ | CH-11 | ✅ |
| ON-44 | s. 24 | ❌ | CH-07 (lot immobilier) | ✅ |

### 5.3 Défauts de code (M-17)

| Défaut | Chantier |
|---|---|
| Troisième voie non comparée | CH-00 |
| Pas de verrou sur le dépôt | CH-00 |
| Pas de verrou ni de garde sur la correction | CH-00 |
| Solde courant du journal faux si antidatation | CH-04 |
| `getTrustBalance` avec `dossierId ?? null` ambigu | CH-01 |
| Agrégat de comptes en 3ᵉ voie basé sur un cache | CH-00 (PR-1) |
| `createReconciliation` décertifie silencieusement | CH-00 |
| Création implicite de compte par effet de bord | CH-01 |

**Couverture** : 61 obligations QC + 44 ON + 8 défauts = **113 points**, tous affectés à un chantier. Aucun point n'est laissé hors périmètre.

---

## 6. Séquencement

```
S1        CH-00 ████ (promesse + failles)
S2-S3     CH-01 ████████ (compte bancaire)          CH-06 ████████ (identité, //)
S4-S5     CH-02 ████████ (champs + pièces)
S6-S8     CH-03 ████████████ (rapport mensuel)       CH-05 ████████ (espèces, //)
S9-S10    CH-04 ████████ (registres imprimables)     CH-08 ████ (biens, //)
S11-S12   CH-07 ████████████ (Ontario)
S13       CH-09 █████ (rapport annuel)               CH-10 █████ (solde débiteur, //)
S14-S15   CH-11 ████████ (rétention + inspecteur)
S16-S17   CH-12 ████████ (registre vivant + cycle de vie)
```

**Jalons**

| Jalon | Semaine | Ce qui devient vrai |
|---|---|---|
| **J1 — Promesse tenue** | S1 | La copie de la page d'accueil est exacte. Aucune opération interdite n'est possible. |
| **J2 — Socle réglementaire** | S5 | Toutes les données exigées par les art. 38-39 QC et s. 18 ON existent en base. |
| **J3 — Inspection survivable** | S8 | Le rapport mensuel s'imprime et se signe. **C'est le jalon commercial.** |
| **J4 — Québec complet** | S10 | 61/61 obligations québécoises couvertes. |
| **J5 — Ontario complet** | S12 | 44/44 obligations ontariennes couvertes. |
| **J6 — Inspection Ready** | S17 | 25/25 documents produisibles. Score cible 95+/100. |

Le reliquat de 5 points sur 100 correspond aux éléments qui dépendent d'une validation externe (§9) et non du code.

---

## 7. Patch du registre de conformité

À appliquer dans `lib/compliance/rules.ts` au chantier CH-00, avec les sources maintenant vérifiées sur le texte primaire.

| Id | Action | Nouvelle rédaction / source |
|---|---|---|
| `TR-QC-09` | **Corriger** | « Dépôt **sans délai** après réception, dans une **succursale québécoise** d'une institution assurée **ayant conclu une entente avec le Barreau** (B-1, r. 10), compte identifié « en fidéicommis » ou « in trust ». » — Source : B-1 r.5 art. 50, texte officiel LegisQuébec, à jour au 2026-04-01. Confiance : CONFIRME. |
| `TR-ON-05` | **Corriger** | « Fonds reçus en fiducie déposés **immédiatement** (s. 7(1)). La présomption du « jour bancaire suivant » de la s. 1(3) ne vaut **que** pour les s. 9(1)(2)(3) et 14. » — Source : By-Law 9, texte officiel. Confiance : CONFIRME. |
| `CASH-01` | **Scinder en deux** | `CASH-QC-01` : « Art. 69 QC — interdiction de **recevoir en fidéicommis** 7 500 $ ou plus en espèces pour un même mandat, **sauf 6 exceptions** énumérées. » · `CASH-ON-01` : « s. 4(1) ON — interdiction de recevoir ou accepter, **en montant agrégé** pour un même dossier client, 7 500 $ CAD ou plus en espèces, **sauf 5 exceptions** (s. 6). » |
| `CASH-QC-02` | **Enrichir** | Ajouter : destinataire = **directeur de l'inspection professionnelle** ; pièces = **copie du reçu + déclaration signée** ; contenu = mention du fondement (honoraires gagnés / débours engagés / cas de l'art. 69). |
| `RET-QC-01/02` | **Préciser** | Deux ancrages distincts : art. 31 = 7 ans **à compter de la fermeture du dossier** ; art. 32 = 7 ans **après la fin de l'exercice financier**. |
| `TR-QC-11` | **Remplacer** | Supprimer « RAP ». Nouvelle règle `TR-QC-11` : « Rapport comptable annuel (art. 42) transmis au directeur de l'inspection professionnelle sur formulaire prescrit, **dans les 30 jours** d'une demande, couvrant 12 mois, contenant 7 blocs dont la liste des comptes fermés. » Confiance : CONFIRME. Question résiduelle : contenu exact du formulaire prescrit → reste `Q-BARREAU-02`. |
| `TR-QC-12` | **Fermer** | « B-1 r.5 **n'impose pas** de vérification annuelle par un CPA indépendant. L'obligation est le rapport comptable annuel de l'avocat (art. 42). » Confiance : CONFIRME sur la base du texte intégral lu. Reclasser `Q-BARREAU-03` comme résolue, avec réserve sur d'autres instruments. |
| `TR-QC-04` | **Élargir** | Étendre la note : art. 43 **à 46** non couverts (registre, information du client, lieu de garde, affectation). |

**Nouvelles règles à ajouter** — au minimum une par obligation de la matrice §5 non encore représentée, chacune portant son article, sa juridiction, sa confiance, et l'identifiant du contrôle logiciel qui l'implémente. Le registre passe d'environ 30 à environ 105 règles.

---

## 8. Plan de tests de conformité

Une suite dédiée, `lib/compliance/__tests__/inspection/`, distincte des tests unitaires. Elle joue le rôle d'inspecteur.

### 8.1 Tests d'interdiction — « aucun chemin ne permet »

Un test par interdiction réglementaire. Chacun tente l'opération interdite et exige qu'elle échoue avec le bon code d'erreur et la bonne référence d'article.

`retrait-sur-facture-brouillon` · `retrait-sur-facture-non-envoyee` · `retrait-superieur-au-solde-du-dossier` · `retrait-sans-motif` · `retrait-en-especes` · `cheque-au-porteur` · `cheque-a-cash` · `correction-rendant-solde-negatif` · `depot-especes-agrege-au-dela-du-seuil-sans-exception` · `virement-sans-form-9a-signe` · `virement-saisi-et-autorise-par-la-meme-personne` · `chequier-avec-trou-de-sequence` · `certification-sans-releve-bancaire` · `certification-avec-ecart-non-motive` · `certification-avec-solde-client-negatif` · `certification-avec-ecart-cartes-clients` · `ecriture-dans-periode-verrouillee` · `modification-de-rapprochement-certifie` · `purge-avant-fin-de-retention` · `mouvement-de-fonds-sans-verification-identite` · `mouvement-par-titulaire-suspendu` · `compte-sans-mention-en-fideicommis`

### 8.2 Tests de production — « le document sort »

Un test par document de la liste d'inspection (§16.2 de l'audit). Chacun génère le document sur un jeu de données de référence et compare à un instantané attendu, champ par champ, contre l'article.

Exemple pour l'art. 41 : les 7 blocs présents · chaque ligne de chèque porte n° + date d'émission + montant + client + dossier · chaque ligne de carte-client porte la **date de dernière inscription** · le relevé est joint · les totaux se recoupent · la pagination est correcte.

### 8.3 Tests de scénario — inspection simulée

Trois scénarios de bout en bout, joués sur un cabinet fictif complet :
1. **Cabinet québécois solo, un compte général**, 12 mois d'activité, une somme en espèces sous exception, un bien en fidéicommis, un solde débiteur corrigé. Attendu : les 25 documents produits, aucun blocage résiduel.
2. **Cabinet ontarien à trois titulaires, deux comptes en fiducie**, virements électroniques, frais de renvoi, un praticien suspendu en cours d'année.
3. **Cabinet mixte** avec un compte particulier en fidéicommis et un placement assimilé (art. 68).

### 8.4 Test de non-régression du registre

Vérifie que chaque règle de `COMPLIANCE_RULES` possède : un article non vide, une juridiction, une confiance différente de `INCERTAIN` si affichable, et **l'identifiant d'un contrôle logiciel existant**. Une règle orpheline fait échouer la suite.

---

## 9. Ce qui doit être obtenu hors code

À lancer **dès la semaine 1**, en parallèle du développement. Ce sont les seuls éléments qui empêchent d'atteindre 100.

| # | À obtenir | Auprès de | Bloque | Échéance |
|---|---|---|---|---|
| E-1 | **Formulaires prescrits par le Comité exécutif** : art. 41 (rapport mensuel), art. 42 (rapport annuel), art. 51 (ouverture compte général), art. 64 (compte particulier) | Barreau du Québec, direction de l'inspection professionnelle | Forme finale de CH-03, CH-09, CH-01 | S4 |
| E-2 | **Liste des institutions ayant une entente au sens de B-1 r. 10** | Barreau du Québec | Validation de CH-01 | S3 |
| E-3 | **Confirmation du gabarit Form 9A** généré par SAFE | LSO, service Spot Audit | CH-07 | S11 |
| E-4 | **Relecture du rapport mensuel généré** par un inspecteur retraité ou un CPA en comptabilité juridique | Externe, à budgéter | Mise en production de CH-03 | S9 |
| E-5 | **Code de déontologie (QC)** et **Rules of Professional Conduct (ON)** — conflits, honoraires, intérêts | Textes publics | Ferme les règles `INCERTAIN` du registre | S6 |
| E-6 | **B-1 r. 10** — mécanique de remise des intérêts | Texte public | CH-10 | S12 |
| E-7 | **Confirmation de l'obligation LSO de plan de contingence** et de son échéance déclarative | LSO | CH-12 | S15 |
| E-8 | **Guides d'inspection du Barreau** et **LSO Financial Management Guidelines** | Sites officiels | Bonnes pratiques d'application, au-delà du texte | S8 |

**Recommandation** : E-1 et E-2 sont à demander par écrit cette semaine. Une demande au directeur de l'inspection professionnelle prend des semaines à revenir, et CH-03 en dépend pour sa forme finale. Le développement peut avancer sur les **données** sans attendre la **mise en forme**.

---

## 10. Impact sur la copie publique

À traiter au jalon J3, pas avant.

| Fichier | Ligne | Action |
|---|---|---|
| `components/public-site/HomePage.tsx` | 429 | Aucune modification nécessaire **après CH-00**. Avant CH-00, la phrase est en avance sur le produit. |
| `lib/tarification.ts` | 101 | Après J4 et J5, la réponse peut passer de « facilite le suivi de vos obligations » à une formulation plus forte, adossée à la matrice §5. Conserver systématiquement la phrase « la responsabilité professionnelle reste la vôtre ». |
| Nouveau | — | Après J6, une page publique « Périmètre réglementaire couvert » listant les 113 points et leur état. C'est un actif commercial que personne n'a sur ce marché. |

**Règle de doctrine** : la copie ne devance jamais le code. Toute affirmation de conformité sur le site doit pointer vers une ligne de la matrice §5 marquée ✅ et couverte par un test de la suite §8.

---

## 11. Ce que ce programme change, en une phrase

SAFE passe d'un moteur comptable juste mais muet à un système qui **imprime la preuve de sa propre justesse**. Le moteur était le travail difficile, et il est fait. Ce qui reste est du travail méthodique, entièrement spécifié ci-dessus, sur dix-sept semaines, avec un jalon commercial exploitable dès la huitième.

---

*Spécification établie le 2026-07-30 à partir de l'audit du même jour. Sources primaires : RLRQ c. B-1, r. 5 (à jour au 1er avril 2026) et LSO By-Law 9 (version du 27 avril 2017), lus intégralement. Les incertitudes déclarées au §0.2 de l'audit et les éléments du §9 ci-dessus sont les seules dépendances externes du programme.*
