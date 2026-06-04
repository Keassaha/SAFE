# Dossier de build — Automatisation de l'encaissement et de la compta

> Document de référence pour le build. Ne pas builder sans valider d'abord les décisions de la section 11 (règle projet CLAUDE.md : pas de build sans spec validée).

- **Statut** : cadrage validé CEO, specs à rédiger
- **Créé le** : 2026-06-04
- **Objectif du build** : faire entrer chaque paiement client dans le journal sans saisie manuelle, en respectant la conformité Barreau, sans que SAFE ne touche jamais les fonds.
- **Mémoire liée** : `project_payment_automation_plan`, `project_accounting_state`, `project_barreau_conformite`

---

## 1. Principe directeur

Le « 100% automatisé sans aucun geste humain » n'existe pour personne (même un agrégateur bancaire exige de brancher la banque une fois). Objectif réel :

**Coopération du cabinet au setup uniquement, jamais par transaction.**

Cible réaliste de couverture :
- ~90% du volume : zéro saisie (bouton Payer + Interac auto-déposé)
- presque tout le reste : un clic (cas ambigus, chèque)
- comptant seulement : une courte saisie volontaire (exigée par l'AML de toute façon)

Aucun logiciel (QuickBooks, Clio, Sage) ne fait mieux, car mieux est impossible : le comptant ne laisse aucune trace numérique.

---

## 2. État actuel du moteur (ce qui existe déjà)

Ne PAS reconstruire ces briques, elles sont en place :

| Brique | Fichier | État |
|---|---|---|
| Journal général append-only | `lib/services/journal/journal-service.ts` | OK. `createJournalEntry()` calcule le solde courant, lock advisory par cabinet, transaction Prisma. |
| Modèle de données | `prisma/schema.prisma` → `model JournalGeneralEntry` (~l.1878) | OK. Index unique partiel sur `(cabinetId, sourceModule, sourceId)` pour l'idempotence. |
| Types de transaction | enum `JournalTransactionType` : `FACTURE, PAIEMENT, DEPOT_FIDEICOMMIS, RETRAIT_FIDEICOMMIS, DEBOURS, DEPENSE, AJUSTEMENT, CORRECTION` | OK |
| Sources | enum `JournalSourceModule` : `FACTURATION, PAIEMENTS, FIDEICOMMIS, DEPENSES, DEBOURS, IMPORT_BANCAIRE, AJUSTEMENT_MANUEL, CORRECTION_SYSTEME` | OK |
| Corrections append-only | `lib/services/journal/append-only-corrections.ts`, `createCorrectiveJournalEntry()` | OK. Jamais de mutation, toujours une nouvelle écriture. |
| Catégorisation dépenses | `lib/expense-journal/categorization-rules.ts` | OK. Règles + score de confiance. |
| Stripe (facturation SAFE) | `lib/stripe.ts` (singleton, `STRIPE_SECRET_KEY` global), `app/api/webhooks/stripe`, table `stripeWebhookEvent` | OK MAIS c'est le Stripe qui sert à ce que les cabinets paient SAFE. **PAS** réutilisable tel quel pour l'encaissement client (voir §5). |

**Point clé** : la destination (le journal) est construite. Les nouveaux canaux n'ont qu'à appeler `createJournalEntry()` avec `typeTransaction: "PAIEMENT"`. C'est le tuyau qu'il reste à poser, pas le réservoir.

---

## 3. Architecture cible

Ne jamais traiter Stripe / Square / PayPal / Interac comme 4 systèmes séparés. Définir **un événement de paiement canonique** et un adaptateur par canal.

```
Événement canonique interne :
{ cabinetId, montant, date, payeur, reference, processeur, externalId, factureId? }

Adaptateurs :
  Stripe   → webhook payment_intent.succeeded   → normalise → PAIEMENT
  Square   → webhook payment.created            → normalise → PAIEMENT
  PayPal   → webhook PAYMENT.CAPTURE.COMPLETED  → normalise → PAIEMENT
  Interac  → parsing email de notification      → normalise → PAIEMENT
  Relevé   → import CSV/PDF                      → réconciliation (garde-fou)
```

Tout converge vers `createJournalEntry()`. L'`externalId` du processeur sert de `sourceId` → idempotence gratuite via l'index unique existant.

---

## 4. Vue d'ensemble des canaux (priorité de build)

| Canal | Rapprochement | Niveau d'auto | Priorité build |
|---|---|---|---|
| Stripe Connect (bouton Payer sur facture) | Déterministe (métadonnée = n° facture) | 100%, zéro clic | **1** |
| PayPal / Square | Déterministe (même mécanique) | 100% | 3 (après Stripe validé) |
| Email Interac | Heuristique montant + nom + référence | 90-95%, un clic sur ambigu | **2** |
| Comptant / chèque | Saisie | Un clic manuel | 2 (petit) |
| Relevé bancaire mensuel | Réconciliation a posteriori | Garde-fou | 4 (plus tard) |

**Ordre** : Stripe d'abord (le plus payant, déterministe), valider le bout-en-bout, puis Interac sur la même plomberie, puis élargir.

---

## 5. Canal 1 — Stripe Connect (priorité 1)

### Le mécanisme
1. L'avocate branche **son propre** compte Stripe une fois (onboarding Connect + vérification d'identité/KYC, ~5 min, obligatoire par la loi).
2. SAFE stocke son **identifiant de compte** (`acct_xxx`), PAS sa clé secrète.
3. Au clic « Payer », SAFE crée un paiement **en mode direct charge sur `acct_xxx`**, métadonnée `factureId`.
4. Le client choisit son mode (Visa, Mastercard, Apple Pay, Google Pay) sur la page hébergée Stripe. Tous les modes atterrissent dans le compte de l'avocate.
5. L'argent va dans le solde Stripe de l'avocate puis en payout vers son compte bancaire. **SAFE ne touche jamais les fonds.**
6. Webhook `payment_intent.succeeded` → SAFE écrit le `PAIEMENT` au journal, rapproché via `factureId`.

### Pourquoi direct charge et pas destination charge
- **Direct charge** : le paiement est créé sur le compte du cabinet, l'argent est à lui dès la 1re seconde. ✅ Conforme.
- **Destination charge** : le paiement passe par le compte SAFE puis transfert. SAFE détient momentanément les fonds → SAFE devient transmetteur d'argent. ❌ À éviter absolument.

### À builder
- Page de facture hébergée par SAFE (la facture devient une page web, pas un PDF mort) portant le bouton Payer.
- Onboarding Connect par cabinet (écran d'activation des paiements).
- Stockage chiffré multi-tenant de l'`acct_xxx` (décision §11).
- Endpoint webhook Connect (distinct du webhook de facturation SAFE existant) + vérification de signature.
- Génération du paiement Stripe avec `metadata.factureId` + `stripeAccount: acct_xxx`.
- Normalisation → `createJournalEntry()`.
- Gestion des remboursements / litiges / chargebacks : écriture inverse au journal, sans casser l'append-only (passer par une écriture `CORRECTION` ou `PAIEMENT` négatif selon doctrine).

### Signal bonus (optionnel)
La page hébergée permet de capter « facture ouverte » (date/heure de consultation). Sert aux **relances commerciales**, PAS à la compta. Ne pas confondre : « vu » ne dit rien sur l'argent, seul « payé » écrit au journal.

---

## 6. Canal 2 — Email Interac (priorité 2)

### Le mécanisme
- Le client paie par dépôt automatique, la banque envoie au cabinet un courriel « Vous avez reçu X $ de NOM ».
- Le cabinet connecte sa boîte **une fois** (OAuth Gmail/Outlook OU règle de transfert vers une adresse dédiée type `paiements+cabinetX@safecabinet.ca` — décision §11).
- SAFE lit chaque notification, extrait expéditeur + montant + date → crée un `PAIEMENT` candidat.

### Rapprochement
1. Match automatique : montant exact + nom de client approchant. La plupart des factures ont des montants distincts → taux d'auto élevé.
2. Piloter la référence en amont : l'instruction de paiement de la facture dit « inscrivez F-2026-014 dans le message Interac ». Quand la référence est présente → match certain.
3. Cas ambigus (2 factures au même montant) → file d'exceptions, un clic de confirmation.

### À builder
- Connexion boîte courriel (OAuth ou adresse dédiée).
- Parseur par banque (gabarits Desjardins, RBC, BMO, TD, Banque Nationale, Scotia…). Risque principal : formats qui varient. Le relevé mensuel (§8) rattrape ce que le parseur rate.
- Logique de match montant/nom/référence + file d'exceptions.
- Normalisation → `createJournalEntry()`.

---

## 7. Canal 3 — Comptant / chèque (un clic)

- Aucun signal numérique possible. Un humain saisit.
- Bouton « paiement comptant / chèque reçu » sur la facture → écriture `PAIEMENT` directe.
- **Aligné avec la conformité** : le plafond espèces / AML (cf. `project_barreau_conformite`) exige qu'un humain regarde chaque entrée de comptant. La saisie manuelle n'est pas un défaut, c'est voulu.

---

## 8. Garde-fou — réconciliation du relevé mensuel (plus tard)

- Le cabinet exporte son relevé (PDF/CSV) une fois par mois.
- SAFE le lit et le réconcilie contre ce que les canaux ont déjà enregistré.
- Attrape ce que l'email Interac a raté + donne le tampon « vérifié au xx/xx » réclamé par l'audit UX (`docs/product/FACTURATION_COMPTABILITE_UX_AUDIT.md` §2.2).
- Coopération mensuelle, pas par transaction → acceptable.

---

## 9. Règles de conformité dures (non négociables)

1. **Fidéicommis jamais via processeur.** Un processeur prend une commission et retient les fonds. L'argent en fidéicommis doit arriver INTACT (250 $ envoyés = 250 $ reçus dans le compte trust). Donc le bouton Payer = revenus d'opération seulement. Les dépôts trust restent Interac direct / chèque / virement vers le compte en fidéicommis. Le moteur sépare déjà `PAIEMENT` de `DEPOT_FIDEICOMMIS` : la règle de routage technique découle de la règle légale.
2. **SAFE ne touche jamais les fonds.** Sinon = transmetteur d'argent (licences, obligations réglementaires). Toujours direct charge / compte du cabinet.
3. **SAFE ne touche jamais les données de carte.** Saisie sur la page hébergée du processeur (PCI porté par Stripe). Aucun numéro de carte sur les serveurs SAFE.
4. **Append-only.** Aucune écriture du journal n'est mutée. Remboursements et corrections = nouvelles écritures.

---

## 10. Pièges techniques à anticiper

1. **Décalage brut / net / versement (LE piège qui casse les intégrations naïves).** Le client paie 250 $, Stripe dépose ~242,75 $ deux jours plus tard, regroupé avec d'autres paiements. Le relevé bancaire ne montre jamais le 250 $, il montre un versement en bloc. Il faut DEUX couches de rapprochement :
   - Couche 1 : événement processeur ↔ facture (déterministe, montant **brut**).
   - Couche 2 : versement processeur ↔ dépôt bancaire en bloc, la commission étant bookée en `DEPENSE`.
   Sinon le solde affiché ment de ~2,9% en permanence.
2. **Idempotence.** Les webhooks arrivent parfois en double / dans le désordre / en retard. Utiliser `externalId` comme `sourceId` → l'index unique existant rejette les doublons (P2002 à attraper, comme `recordStripeEvent` le fait déjà pour la facturation SAFE).
3. **Multi-tenant.** Les credentials sont PAR cabinet, pas une clé globale. Ne jamais hardcoder. Si on build d'abord avec une clé globale « pour tester », on réécrit tout après.
4. **Formats d'email Interac variables** selon la banque. Prévoir plusieurs gabarits + le relevé mensuel en filet.

---

## 11. Décisions à figer AVANT de coder (contenu des 2 specs)

### Spec Stripe Connect
- [ ] Modèle Connect : Standard vs Express (impact onboarding + responsabilité).
- [ ] Où vivent les identifiants de chaque cabinet (`acct_xxx`) : table dédiée chiffrée ? Quel modèle Prisma ? (rien n'existe aujourd'hui, vérifié.)
- [ ] Flux d'onboarding : comment l'avocate branche son compte la 1re fois dans l'UI.
- [ ] Règle de routage opération vs fidéicommis (refus technique d'un dépôt trust via processeur).
- [ ] Politique frais : SAFE prend-il une application fee ou zéro ? (impact offre commerciale.)
- [ ] Modèles de paiement activés (carte, Apple/Google Pay) par cabinet.

### Spec Email Interac
- [ ] Connexion boîte : OAuth Gmail/Outlook vs adresse de transfert dédiée.
- [ ] Liste des banques à supporter en V1 + gabarits de parsing.
- [ ] Seuil d'auto-match et design de la file d'exceptions.
- [ ] Stockage / sécurité des accès à la boîte courriel du cabinet.

---

## 12. Séquencement de build

1. **Specs** (les 2 ci-dessus) → valider décisions §11.
2. **POC vertical Stripe** : facture hébergée → bouton Payer → paiement direct charge avec `factureId` → webhook → écriture journal rapprochée. Bout-en-bout sur un seul cabinet de test.
3. **Couche brut/net/versement** (§10.1) : booker la commission, réconcilier le payout.
4. **Comptant/chèque** : bouton un clic.
5. **Email Interac** sur la même plomberie de normalisation.
6. **PayPal / Square** via le même événement canonique.
7. **Relevé mensuel** (garde-fou).

---

## 13. Checklist fichiers (prévisionnel)

À créer :
- `lib/services/payments/` (couche canonique + adaptateurs)
- `app/api/webhooks/stripe-connect/route.ts` (distinct du webhook facturation existant)
- Modèle(s) Prisma : compte Connect par cabinet, mapping versement/commission.
- Page de facture hébergée + bouton Payer.
- Écran d'onboarding Connect.
- Parseur email Interac + connexion boîte.

À modifier / réutiliser :
- `lib/services/journal/journal-service.ts` → `createJournalEntry()` (destination, déjà prête).
- enums `JournalTransactionType` / `JournalSourceModule` si un nouveau source module est nécessaire (ex : distinguer `STRIPE` de `PAIEMENTS`).
- Doctrine append-only / idempotence : conserver telle quelle.

---

## 14. Hors scope (à noter, pas pour maintenant)

- Partie double / plan comptable / états PCGR (bilan, résultats). Le moteur reste mono-axe (cf. `project_accounting_state`). À déclencher seulement si un cabinet demande des états officiels (« remplacer le comptable »). Une dérivation `catégorie → compte` suffit pour un tableau de bord santé cabinet.
- Remises gouvernementales (TPS/TVQ) automatiques.
- Agrégateur bancaire payant (Flinks) : écarté pour l'instant, trop cher. L'email Interac + le relevé mensuel le remplacent côté encaissement.
</content>
